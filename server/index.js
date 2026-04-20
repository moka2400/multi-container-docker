const keys = require('./keys');

// Express App Setup

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

// A new express application. Responds to any coming and going HTTP request to the react application
const app = express();

// Wire up Cors, CROSS-ORIGIN-RESOURCE-SHARING. Making requests from one domain, where the app is running, to a different domain, e.g. the host the api is running on
app.use(cors());

// Parse request body into json
app.use(bodyParser.json());

// Postgres Client Setup. Remember, the Express server should communicate to both Redis and the Postgres server

const { Pool } = require('pg');

const pgClient = new Pool({
    user: keys.pgUser,
    host: keys.pgHost,
    database: keys.pgDatabase,
    password: keys.pgPassword,
    port: keys.pgPort,
    ssl:
        process.env.NODE_ENV !== 'production'
            ? false
            : { rejectUnauthorized: false },
});

pgClient.on("connect", (client) => {
    client
        .query("CREATE TABLE IF NOT EXISTS values (number INT)")
        .catch((err) => console.error(err));
});

pgClient.on('error', () => console.log('Lost PG connection'));

// Redis Client Setup

const redis = require('redis');
const redisClient = redis.createClient({
    url: `redis://${keys.redisHost}:${keys.redisPort}`
});

const redisPublisher = redisClient.duplicate();

(async () => {
    await redisClient.connect();
    await redisPublisher.connect();
})();

// Express route handlers (API)

app.get('/', (req, res) => {
    res.send('Hello');
})

app.get('/values/all', async (req, res) => {
    try {
        const values = await pgClient.query('SELECT * from values');
        res.send(values.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching values');
    }
});

app.get('/values/current', async (req, res) => {
    const values = await redisClient.hGetAll('values');
    res.send(values); // Look at a hash value inside Redis and get all the information from it. We know that we have hashed the 'values' in there
})

app.post('/values', async (req, res) => {
    const index = req.body.index;

    if (parseInt(index) > 40) {
        return res.status(422).send('Index too high');
    }

    await redisClient.hSet('values', index, 'Nothing yet!'); // To indicate we have not yet calculated a particular value for this index. In the worker, we listen on new indices through the published 'insert' just below, asking to poll new indices - when we see this index, we will correctly calculate the value and insert it.
    await redisPublisher.publish('insert', index);
    await pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

    res.send({ working: true }); // Ok, we are doing some work to calculate a fib value for your index, telling this to the requester
})

app.listen(5000, err => {
    console.log('Listening')
})