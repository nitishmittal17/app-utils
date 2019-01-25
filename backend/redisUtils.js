const redis = require('redis');
const thunkify = require('thunkify');

module.exports = (config, logger) => {

	const logError = (err) => {
		if (logger && logger.logError) {
			logger.logError(err);
		}
	};

	const log = (type) => {
		return () => {
			logError(arguments);
		}
    };

	console.log('Configuring client');
	const client = redis.createClient(config.port, config.host, {
		retry_strategy: function(options) {
			//Retry interval
			return config.retryInterval || 300;
		}}
	);
	client.on('reconnecting', log('reconnecting'));
	client.on('error'       , log('error'));
	client.on('end'         , log('end'));

    return {
	    setItem: function(key, value) {
		    client.set(key, value);
	    },

	    setItemWithExpiry: function(key, value, expiryTime) {
		    client.setex(key, expiryTime, value);
	    },

	    getItem: thunkify(function(key, callback) {
		    client.get(key, function(err, res) {
			    if(err) {
				    logError(err);
			    }

			    try {
				    callback(err, JSON.parse(res));
			    } catch(e) {
				    callback(err, res);
			    }

		    });
	    }),

	    getItemWithCallback: function(key, callback) {
		    client.get(key, function(err, res) {
			    if(err) {
				    logError(err);
			    }
			    callback(err, res);
		    });
	    },

	    deleteItem: function(key) {
		    client.del(key, function(err, reply) {
			    if(err) {
				    logError(err);
			    }
		    });
	    },

	    deleteItemThunked: thunkify(function(key, callback) {
		    client.del(key, function(err, res) {
			    if(err) {
				    logError(err);
			    }

			    callback(err, res);
		    });
	    }),

	    addToSortedSet: function(setName, score, key) {
		    client.zadd(setName, score, key);
	    },

	    getFromSortedSet: thunkify(function(setName, numOfElements, callback) {
		    client.zrevrange(setName, 0, numOfElements - 1, 'withscores', function(err, res) {
			    if(err) {
				    logError(err);
			    }

			    callback(err, res);
		    })
	    })
    }
};
