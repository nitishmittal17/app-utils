/**
 * sample config
 * {
 *      connectionLimit: 100,
        host     : '127.0.0.1',
        user     : 'xxxx',
        password : 'xxxx',
        database : 'xxxx'
 * }
 *
 * retryInterval is optional
 */

const mysql = require('mysql');
const thunkify = require('thunkify');

let pool;

module.exports = (config, logger) => {
    if (!pool) {
        console.log('Creating pool');
	    pool  = mysql.createPool({
		    connectionLimit : config.databaseConnection.connectionLimit,
		    host            : config.databaseConnection.host,
		    user            : config.databaseConnection.user,
		    password        : config.databaseConnection.password,
		    database        : config.databaseConnection.database
	    });
    }

	const executeQuery = function(query, callback) {
		pool.getConnection(function(err, connection) {
			// Use the connection
			connection.query(query, function(err, rows, fields) {
				connection.release();
				if(err && logger) {
					err.mysqlQuery = query;
					logger.logError(err);
				}

				if(typeof callback === 'function') {
					callback(err, rows);
				}
				// Don't use the connection here, it has been returned to the pool.
			});
		});
	};

    return {
	    executeQuery: thunkify(executeQuery),
	    executePlainQuery: executeQuery
    }
};
