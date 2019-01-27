/**
 * sample config
 * {
 *      loggingMode: 'error',
 *      logDirectory: __dirname + "/logs",
        sentryConfig: {
            sentryUrl: 'https://xxxxxxxxxxxx@sentry.io/yyyyyy'
        },
        env: 'prod'
 * }
 */

const winston = require('winston');
const Raven = require('raven');

module.exports = (config) => {
    if (!winston.initialized) {
        console.log('Adding loggers', config);
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
	    logError: function (err) {
		    winston.error(err, err.stack);
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
