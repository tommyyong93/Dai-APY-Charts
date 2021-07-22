const db = require('./lib/db');
const redis = require('redis');
const client = db.client;
const redisClient = redis.createClient(6379, "redis");

async function getRates(request, response) {
  try {
    await redisClient.get('readThroughCache', (err, res) => {
      if (err) {
        console.log(err);
      }
      if (res) {
        response.status(200).send(res);
      } else {
        client.query('SELECT * FROM dai_rates', async (error, results) => {
          if (error) {
            throw error
          }
          response.status(200).json(results.rows)
          redisClient.setex('readThroughCache', 600, JSON.stringify(results.rows));
        })
      }
    })
  } catch (err) {
    console.log(err)
  }
}

async function createRate(request, response) {
  const {
    blockNumber,
    timeStamp,
    compApy,
    aaveApy
  } = request.body

  await client.query('INSERT INTO dai_rates (block_number,timestamp, compound_rate,aave_rate) VALUES($1,$2,$3,$4) ON CONFLICT (block_number) DO NOTHING', [blockNumber, timeStamp, compApy, aaveApy], (error, results) => {
    if (error) {
      throw error
    }
    response.status(201).send('Row added with block number: ' + blockNumber);
  })
}

module.exports = {
  getRates,
  createRate
}