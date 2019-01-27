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
	let lines = stack.split('\n');
	lines = lines.filter(line => {
		if (line.indexOf('node_modules/koa-') > -1 || line.indexOf('node_modules/co/') > -1) {
			return false;
		}

		if (line.indexOf('<anonymous>') > -1) {
			return false;
		}

		if (line.indexOf('process._tickCallback') > -1) {
			return false;
		}

		return true;
	});
	console.log(lines);
	return lines.join('\n');
}

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

	    winston.add(winston.transports.DailyRotateFile, {
		    name: 'info-file',
		    datePattern: '.yyyy-MM-dd',
		    handleExceptions: true,
		    humanReadableUnhandledException: true,
		    maxsize: 2000000,
		    filename: config.logDirectory + "/log",
		    level: 'info'
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
			    console.log(err, err.stack);
		    }
	    },

	    logInfo: function (message) {
		    winston.info(message);
	    }
    }
};
