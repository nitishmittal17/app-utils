/**
 * sample config
 * {
 *      host: '127.0.0.1',
        port: 6379,
        retryInterval: 400
 * }
 *
 * retryInterval is optional
 */
const redis = require('redis');
const thunkify = require('thunkify');

let client;

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

	if (!client) {
		client = redis.createClient(config.port, config.host, {
			retry_strategy: function(options) {
				//Retry interval
				return config.retryInterval || 300;
			}}
		);
		client.on('reconnecting', log('reconnecting'));
		client.on('error'       , log('error'));
		client.on('end'         , log('end'));
	}

    return {
	    setItem: function(key, value) {
		    client.set(key, value);
	    },

	    setItemWithExpiry: function(key, value, expiryTime) {
		    client.setex(key, expiryTime, value);
	    },

	    getItem: thunkify(function(key, callback) {
		    client.get(key, function(err, res) {
			    try {
				    callback(err, JSON.parse(res));
			    } catch(e) {
				    callback(err, res);
			    }

		    });
	    }),

	    getItemWithCallback: function(key, callback) {
		    client.get(key, function(err, res) {
			    callback(err, res);
		    });
	    },

	    deleteItem: function(key) {
		    client.del(key, function(err, reply) {

		    });
	    },

	    deleteItemThunked: thunkify(function(key, callback) {
		    client.del(key, function(err, res) {
			    callback(err, res);
		    });
	    }),

	    addToSortedSet: function(setName, score, key) {
		    client.zadd(setName, score, key);
	    },

	    getFromSortedSet: thunkify(function(setName, numOfElements, callback) {
		    client.zrevrange(setName, 0, numOfElements - 1, 'withscores', function(err, res) {
			    callback(err, res);
		    })
	    })
    }
};
