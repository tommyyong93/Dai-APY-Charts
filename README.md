# DAI interest rates

## Interest rates calculated from on-chain data from Compound and Aave

<hr>

To get started running it:

1. Run `yarn install` to install dependencies
2. Install docker if you don't have it already, and start the containers with `docker compose up -d`
3. In terminal #1, run `npm run build:watch` to generate webpack bundle
4. In terminal #2, run `make serve` to start the express server, which is available at `localhost:3001`.

<hr>

Additionally, contains a smart contract (DaiRate.sol) which implements a single function `getRates()` that returns the current interest
rate for the 2 protocols, can be found in the contracts folder from the root directory.

<hr>

On-chain queries are stored on a PostgreSQL database further utilizing Redis as a read-through cache.
