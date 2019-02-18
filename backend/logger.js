/**
 * sample config
 * {
 *      loggingMode: 'error',
 *      logDirectory: __dirname + "/logs",
        sentryConfig: {
            sentryUrl: 'https://xxxxxxxxxxxx@sentry.io/yyyyyy'
        },
        env: 'prod',
        errMetaProperties: ['mysqlQuery']
 * }
 */

const winston = require('winston');
const Raven = require('raven');

const processStack = (stack) => {

	if (!stack || stack.split) {
		return stack;
	}

	let lines = stack.split('\n');
	let filterList = [
		'node_modules/koa-',
		'node_modules/resolve-path',
		'node_modules/co/',
		'node_modules/mysql/lib',
		'<anonymous>',
		'process._tick',
		'at next (native)',
		'at emitOne',
		'at Socket.',
		'at readableAddChunk',
		'at TCP.'
	];

	lines = lines.filter(line => {
		for (let x = 0; x < filterList.length; x++) {
			let compareString = filterList[x];
			if (line.indexOf(compareString) > -1) {
				return false;
			}
		}
		return true;
	});
	return lines.join('\n');
};

module.exports = (config) => {
    if (!winston.initialized) {
	    winston.level = config.loggingMode;

	    if (config.sentryConfig) {
		    Raven.config(config.sentryConfig.sentryUrl).install();
        }

	    winston.add(winston.transports.DailyRotateFile, {
		    name: 'error-file',
		    datePattern: '.yyyy-MM-dd',
		    handleExceptions: true,
		    humanReadableUnhandledException: true,
		    maxsize: 2000000,
		    filename: config.logDirectory + "/log",
		    level: 'error'
	    });

	    winston.remove(winston.transports.Console);

	    winston.initialized = true;
    }

    return {
	    logError: function (err, meta) {
	    	meta = meta || {};

	    	if (config.errMetaProperties) {
			    config.errMetaProperties.forEach(prop => {
				    if (err[prop]) {
					    let obj = {};
					    obj[prop] = err[prop];
					    Object.assign(meta, obj);
				    }
			    })
		    }

		    winston.error(processStack(err.stack), meta);
		    if (config.env === 'prod' && config.sentryConfig) {
			    Raven.captureException(err, (err, eventId) => {
				    //console.log('Reported error ' + eventId);
			    });
		    } else {
			    console.log(processStack(err.stack));
		    }
	    }
    }
};
