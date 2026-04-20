const keys = require('./keys');
const redis = require('redis');

const redisClient = redis.createClient({
    url: `redis://${keys.redisHost}:${keys.redisPort}`
});

const sub = redisClient.duplicate();

(async () => {
    await redisClient.connect();
    await sub.connect();
})();

// Recursive function. Very slow, not ideal, but good in order to simulate for us why we want a separate worker process in our final setup
function fib(index) {
    if (index < 2) return 1;
    return fib(index - 1) + fib(index - 2);
}

(async () => {
    // Everytime someone inserts a new value into redis, do stuff

    await sub.subscribe('insert', async (message) => {
        await redisClient.hSet('values', message, fib(parseInt(message))); // Insert into a hashset called 'values', the key will be the message (an index provided by a user), and we insert the fib result
    });
})();
