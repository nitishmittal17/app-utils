/**
 * sample config
 * {
 *      connectionLimit: 100,
        host     : '127.0.0.1',
        user     : 'xxxx',
        password : 'xxxx',
        database : 'xxxx'
 * }
 */

const mysql = require('mysql');
const thunkify = require('thunkify');

let pool;

module.exports = (config) => {
    if (!pool) {
	    pool  = mysql.createPool({
		    connectionLimit : config.connectionLimit,
		    host            : config.host,
		    user            : config.user,
		    password        : config.password,
			database        : config.database,
			multipleStatements: true
	    });
    }

	const executeQuery = function(query, callback) {
		pool.getConnection(function(err, connection) {
			if (err) {
				if(typeof callback === 'function') {
					callback(err, connection);
				} else {
					console.log(err);
				}
			} else {
				// Use the connection
				connection.query(query, function(err, rows, fields) {
					connection.release();
					if(err) {
						err.mysqlQuery = query;
					}

					if(typeof callback === 'function') {
						callback(err, rows);
					}
					// Don't use the connection here, it has been returned to the pool.
				});
			}
			
		});
	};

	_processBatch = function(statements) {
		return new Promise(function(resolve, reject) {
			let queryString = statements.join(";");
            executeQuery(queryString, function(err, res) {
                if (!err) {
                    resolve();
                } else {
                    reject();
                }
            })
        });
	}

	const executeMultipleStatements = function(statements, batchSize, callback) {
		var statementBatch = [];
		var promises = [];
		for (var i = 0; i < statements.length; i++) {
			if (statementBatch.length < batchSize) {
				statementBatch.push(statements[i]);
			} else {
				promises.push(_processBatch(statementBatch));
				statementBatch = [];
				statementBatch.push(statements[i])
			}
		}

		if (statementBatch.length > 0) {
			promises.push(_processBatch(statementBatch));
		}

		Promise.all(promises).then(function() {
			if(typeof callback === 'function') {
				callback(null, '');
			}
		})
	}

    return {
	    executeQuery: thunkify(executeQuery),
		executePlainQuery: executeQuery,
		executeMultipleStatements: thunkify(executeMultipleStatements),
		executeMultipleStatementsAsync: executeMultipleStatements
    }
};
