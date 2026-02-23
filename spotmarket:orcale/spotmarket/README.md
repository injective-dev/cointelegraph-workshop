# Day 6: Spot Markets & Trading with SDK

This is part of the N days of Injective series!

## Pre-requisites
 
- Completed day 5 (SDK basics) in this series
- Node.js and npm installed
- Testnet wallet with INJ tokens and USDT tokens

## Starter repo (demo)

Welcome back to day 6 of the 7 days of Injective series!
We will be interacting with Injective's spot markets using the TypeScript SDK today!

Let's get started!
Open the terminal and navigate to the `day06` directory within this repo.
This will be our workspace for exploring spot market trading.

```shell
cd day06/spotmarket/
```

Also, we'll need to install the dependencies.

```shell
npm install
```

We will need to set up a `.env` file here too.
Create one with your private key and Injective address.

```shell
cp .env.sample .env
```

Open the `.env` file and fill in the following values:
- `PRIVATE`: Your wallet's private key (without 0x prefix)
- `INJECTIVE_ADDRESS`: Your Injective address (starts with `inj`)

You can get these from your wallet (e.g., Keplr or Metamask).

> **Note**  
> Do not commit `.env`, or push to remote

## Fetch market data

Before we can trade, we need to understand the markets available on Injective.
The Indexer API provides access to spot market data including tickers, denoms, and precision parameters.
These parameters are crucial for placing orders correctly.

### Understanding market parameters (demo)

Let's fetch market data to understand the structure.
Run the fetch script:

```bash
npx tsx src/fetch.ts
```

The output displays detailed information about available markets:
Because USDT has 6 decimals, so notional is 1 USDT
```bash
Min notional of INJ/USDT market: 1000000
[
  {
    "marketId": "0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe",
    "ticker": "INJ/USDT",
    "baseDenom": "inj",
    "quoteDenom": "peggy0x87aB3B4C8661e07D6372361211B96ed4Dc36B1B5",
    "baseSymbol": "INJ",
    "quoteSymbol": "USDT",
    "baseDecimals": 18,
    "quoteDecimals": 6,
    "minPriceTickSize": "1e-15",
    "minQuantityTickSize": "1000000000000000",
    "status": "active",
    "priceTensMultiplier": "-3",
    "quantityTensMultiplier": "-3"
  },
  {
    "marketId": "0x7a57e705bb4e09c88aecfc295569481dbf2fe1d5efe364651fbe72385938e9b0",
    "ticker": "APE/USDT",
    "baseDenom": "peggy0x44C21afAaF20c270EBbF5914Cfc3b5022173FEB7",
    "quoteDenom": "peggy0x87aB3B4C8661e07D6372361211B96ed4Dc36B1B5",
    "baseSymbol": "APE",
    "quoteSymbol": "USDT",
    "baseDecimals": 18,
    "quoteDecimals": 6,
    "minPriceTickSize": "1e-15",
    "minQuantityTickSize": "10000000000000000",
    "status": "active",
    "priceTensMultiplier": "-3",
    "quantityTensMultiplier": "-2"
  },
  {
    "marketId": "0xabed4a28baf4617bd4e04e4d71157c45ff6f95f181dee557aae59b4d1009aa97",
    "ticker": "INJ/APE",
    "baseDenom": "inj",
    "quoteDenom": "peggy0x44C21afAaF20c270EBbF5914Cfc3b5022173FEB7",
    "baseSymbol": "INJ",
    "quoteSymbol": "APE",
    "baseDecimals": 18,
    "quoteDecimals": 18,
    "minPriceTickSize": "1e-15",
    "minQuantityTickSize": "1000000000000000000",
    "status": "active",
    "priceTensMultiplier": "-15",
    "quantityTensMultiplier": "0"
  },
  {
    "marketId": "0xa97182f11f1aa5339c7f4c3fe3cc1c69b39079f11b864c86d912956c5c2db75c",
    "ticker": "WETH/USDT",
    "baseDenom": "factory/inj17vytdwqczqz72j65saukplrktd4gyfme5agf6c/weth",
    "quoteDenom": "peggy0x87aB3B4C8661e07D6372361211B96ed4Dc36B1B5",
    "baseSymbol": "WETH",
    "quoteSymbol": "USDT",
    "baseDecimals": 8,
    "quoteDecimals": 6,
    "minPriceTickSize": "1e-13",
    "minQuantityTickSize": "1000000000000000",
    "status": "active",
    "priceTensMultiplier": "-11",
    "quantityTensMultiplier": "7"
  },
  {
    "marketId": "0x1c315bd2cfcc769a8d8eca49ce7b1bc5fb0353bfcb9fa82895fe0c1c2a62306e",
    "ticker": "WBTC/USDT",
    "baseDenom": "factory/inj17vytdwqczqz72j65saukplrktd4gyfme5agf6c/wbtc",
    "quoteDenom": "peggy0x87aB3B4C8661e07D6372361211B96ed4Dc36B1B5",
    "baseSymbol": "WBTC",
    "quoteSymbol": "USDT",
    "baseDecimals": 8,
    "quoteDecimals": 6,
    "minPriceTickSize": "0.00001",
    "minQuantityTickSize": "100000",
    "status": "active",
    "priceTensMultiplier": "-3",
    "quantityTensMultiplier": "-3"
  }
]
```

Each market contains several critical parameters:
- `marketId`: Unique identifier for the trading pair
- `ticker`: Human-readable market name (e.g., "INJ/USDT")
- `baseDecimals` and `quoteDecimals`: Token precision
- `minPriceTickSize` and `minQuantityTickSize`: Minimum order increments
- `priceTensMultiplier` and `quantityTensMultiplier`: Precision adjustments for chain formatting. These multipliers are essential for converting human-readable prices to chain-compatible formats.

To query the minimum order notional for a market, you can use the SDK to fetch market details:

```typescript
const market = await indexerSpotApi.fetchMarket('0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe')
console.log('Min notional:', market.minNotional)
```

The notional value is calculated as `price × quantity` and must meet the minimum requirement (typically 1 USDT).

## Spot limit orders

Injective's orderbook supports limit orders, allowing traders to specify exact prices.
Unlike market orders, limit orders give us full control over execution price.
The SDK provides utilities to format prices and quantities correctly for the chain.

### Price and quantity conversion

The SDK includes conversion functions to handle decimal precision:
- `spotPriceToChainPriceToFixed`: Converts human price to chain format
- `spotQuantityToChainQuantityToFixed`: Converts quantity to chain format
- `spotPriceFromChainPriceToFixed`: Converts chain price back to human-readable format

These functions account for token decimals and tens multipliers automatically.

### Create limit order message (demo)

Let's look at how to construct a limit order.
Open `src/limitorder.ts` to see the `makeMsgCreateSpotLimitOrder` function.
It takes a price, quantity, order type (1 for buy, 2 for sell), and market parameters.

```typescript
export const makeMsgCreateSpotLimitOrder = (
  price: string,
  quantity: string,
  orderType: number,
  injectiveAddress: string,
  market: Market
) => {
  const subaccountId = getDefaultSubaccountId(injectiveAddress)

  return MsgCreateSpotLimitOrder.fromJSON({
    subaccountId,
    injectiveAddress,
    orderType,
    price: spotPriceToChainPriceToFixed({
      value: price,
      tensMultiplier: market.priceTensMultiplier,
      baseDecimals: market.baseDecimals,
      quoteDecimals: market.quoteDecimals,
    }),
    quantity: spotQuantityToChainQuantityToFixed({
      value: quantity,
      baseDecimals: market.baseDecimals,
    }),
    marketId: market.marketId,
    feeRecipient: injectiveAddress,
  })
}
```

The function handles all the necessary conversions internally.
We just need to provide human-readable values.

## Place limit sell order (demo)

Time for a demo.
Let's place a sell order on the INJ/USDT market.
The script in `src/placeorder.ts` demonstrates a complete workflow.

First, ensure your `.env` file is configured with your private key and address.
Then run the script:

```bash
npx tsx src/placeorder.ts
```

The transaction response will look like this:
```bash
Transaction result: {
  height: 111205416,
  txhash: 'E19913D4ABFB982D8349DB8F706359D2B77449951A13C15608D9F75D56982E6A',
  codespace: '',
  code: 0,
  data: '1283010A3B2F696E6A6563746976652E65786368616E67652E763162657461312E4D736743726561746553706F744C696D69744F72646572526573706F6E736512440A42307832303135336362366435613337326232346338396462666165663636636162383436653033393765303965313839353839663738656333653764306435653064',
  rawLog: '',
  logs: [],
  info: '',
  gasWanted: 200000,
  gasUsed: 138175,
  timestamp: '2026-01-30T07:15:47Z',
  events: [
    Object <[Object: null prototype] {}> {
      type: 'coin_spent',
      attributes: [Array]
    },
    Object <[Object: null prototype] {}> {
      type: 'coin_received',
      attributes: [Array]
    },
    Object <[Object: null prototype] {}> {
      type: 'transfer',
      attributes: [Array]
    },
    Object <[Object: null prototype] {}> {
      type: 'message',
      attributes: [Array]
    },
    Object <[Object: null prototype] {}> {
      type: 'tx',
      attributes: [Array]
    },
    Object <[Object: null prototype] {}> {
      type: 'tx',
      attributes: [Array]
    },
    Object <[Object: null prototype] {}> {
      type: 'tx',
      attributes: [Array]
    },
    Object <[Object: null prototype] {}> {
      type: 'message',
      attributes: [Array]
    },
    Object <[Object: null prototype] {}> {
      type: 'coin_spent',
      attributes: [Array]
    },
    Object <[Object: null prototype] {}> {
      type: 'coin_received',
      attributes: [Array]
    },
    Object <[Object: null prototype] {}> {
      type: 'transfer',
      attributes: [Array]
    },
    Object <[Object: null prototype] {}> {
      type: 'message',
      attributes: [Array]
    }
  ],
  tx: Object <[Object: null prototype] {}> {
    typeUrl: '/cosmos.tx.v1beta1.Tx',
    value: Uint8Array(543) [
       10, 219,   2,  10, 211,   2,  10,  51,  47, 105, 110, 106,
      101,  99, 116, 105, 118, 101,  46, 101, 120,  99, 104,  97,
      110, 103, 101,  46, 118,  49,  98, 101, 116,  97,  49,  46,
       77, 115, 103,  67, 114, 101,  97, 116, 101,  83, 112, 111,
      116,  76, 105, 109, 105, 116,  79, 114, 100, 101, 114,  18,
      155,   2,  10,  42, 105, 110, 106,  49,  51,  50, 112, 113,
      103, 106,  57, 100, 112, 103, 121, 100, 106, 104, 118, 115,
       56,  56, 112, 120,  97, 115,  55, 122,  99,  48,  52, 107,
      104,  54, 112,  55,
      ... 443 more items
    ]
  },
  txHash: 'E19913D4ABFB982D8349DB8F706359D2B77449951A13C15608D9F75D56982E6A'
}

```

A successful transaction returns a `txHash` that can be viewed on the block explorer.
The `code: 0` indicates success, while any other code indicates an error.
You can track your transaction at [https://testnet.explorer.injective.network](https://testnet.explorer.injective.network).

Open the transaction in the explorer and examine the details.
Key fields to look for:
- **Status**: Shows if the transaction was successful
- **Transaction Hash**: Unique identifier for this transaction
- **Block Height**: Which block included this transaction
- **Gas Used**: How much gas was consumed
- **Messages**: The actual order creation message with price, quantity, and order type

### Query order status

After placing an order, you can query its status to see if it's been matched or is still on the orderbook.

First, update `src/status.ts` with your Injective address:

```typescript
const injectiveAddress = 'YOUR_INJ_ADDRESS_HERE'; // Replace with your address
```

Then run the script:

```shell
npx tsx src/status.ts
```

The script will display:
- **Active orders**: All open orders on the orderbook for your subaccount, showing:
  - `orderHash`: Unique identifier for the order
  - `price`: Order price
  - `quantity`: Total order quantity
  - `unfilledQuantity`: Amount remaining to be filled
  - `state`: Order status (e.g., "booked", "partial_filled", "filled", "canceled")

- **Recent trades**: Your executed trades for this market, showing:
  - `price`: Execution price
  - `quantity`: Trade size
  - `fee`: Trading fee paid
  - `executedAt`: Timestamp of execution

Example output:

```bash
Active orders: [
  {
    orderHash: '0x...',
    price: '25.5',
    quantity: '0.1',
    unfilledQuantity: '0.1',
    state: 'booked'
  }
]
Recent trades: [
  {
    price: '25.4',
    quantity: '0.05',
    fee: '0.001',
    executedAt: 1738567890123
  }
]
```

### Understanding order notional

Injective enforces a minimum order notional (price × quantity) requirement.
For most markets, this is 1 USDT equivalent.
If your order is too small, you'll see an error:

```bash
order notional (0.794400000000000000) is less than the minimum notional for the market (1.000000000000000000): invalid notional
```

To fix this, either increase your quantity or adjust your price so that `price × quantity ≥ 1`.

### Why orders may not fill immediately

If you don't see immediate asset changes in the explorer, it's because your order is sitting on the orderbook.
Limit orders only execute when someone takes the other side at your specified price.
If you price a sell order too high (above market), it won't fill until the market rises to your price.
Similarly, a buy order priced too low won't fill until the market drops to that level.

## Place limit buy order (demo)

Now let's place a buy order instead.
The only change needed is the `orderType` parameter in `makeMsgCreateSpotLimitOrder`.

Edit `src/placeorder.ts` and change the order type from `1` (buy) to `2` (sell):

```typescript
const placeOrderMsg = makeMsgCreateSpotLimitOrder(
    (bestAsk * multiplier).toString(),  // price of the asset
    "0.1",    // how much to buy/sell
    2,    // orderType (1 for Buy, 2 for Sell)
    INJECTIVE_ADDRESS,
    {
        marketId: '0x0611780ba69656949525013d947713300f56c37b6175e02f26bffa495c3208fe', // Example marketId
        baseDecimals: 18,
        quoteDecimals: 6,
        priceTensMultiplier: -3, 
        quantityTensMultiplier:-3, 
    },
);
```

Run the script again to place your sell order:

```bash
npx tsx src/placeorder.ts
```

The transaction response will be similar to the buy order.

Open the transaction in the [explorer](https://testnet.explorer.injective.network) to verify your order was placed successfully.
You should see the sell order with `orderType: 2` in the transaction details.

Query the order status to check if it's been matched:

```shell
# Use the query commands from the previous section
# Look for your order in the active orders list
```

## Get market price (demo)

To make informed trading decisions, we need current market prices.
The `getMarketPrice` function in `src/limitorder.ts` fetches the orderbook and calculates:
- Best bid (highest buy price)
- Best ask (lowest sell price)  
- Mid price (average of bid and ask)
- Spread (difference between ask and bid)

```typescript
export const getMarketPrice = async (marketId: string) => {
  try {
    const orderbook = await indexerSpotApi.fetchOrderbookV2(marketId)
    
    const bestBid = orderbook.buys[0]?.price
    const bestAsk = orderbook.sells[0]?.price
    
    let midPrice = '0'
    if (bestBid && bestAsk) {
      midPrice = ((parseFloat(bestBid) + parseFloat(bestAsk)) / 2).toString()
    } else if (bestBid) {
      midPrice = bestBid
    } else if (bestAsk) {
      midPrice = bestAsk
    }

    return {
      bestBid: bestBid || '0',
      bestAsk: bestAsk || '0',
      midPrice,
      spread: bestBid && bestAsk ? (parseFloat(bestAsk) - parseFloat(bestBid)).toString() : '0'
    }
  } catch (error) {
    console.error('Error fetching market price:', error)
    throw error
  }
}
```

This function is useful for:
- Determining competitive order prices
- Calculating slippage
- Market analysis and monitoring

## Convert chain price to price (demo)

When fetching data from the chain, prices come in chain format.
We need to convert them back to human-readable format.
The `convertChainPriceToPrice` function handles this:

```typescript
export const convertChainPriceToPrice = (
  chainPrice: string,
  tensMultiplier: number,
  baseDecimals: number,
  quoteDecimals: number,
) => {
  return spotPriceFromChainPriceToFixed({
    value: chainPrice,
    tensMultiplier,
    baseDecimals,
    quoteDecimals,
  })
}
```

This is the inverse of `spotPriceToChainPriceToFixed`.
Use it when processing orderbook data, trade history, or any chain-returned price values.

## Oracle Module

Injective's Oracle Module provides on-chain price feeds that power derivatives markets, liquidations, and funding rate calculations.
Oracles supply external price data to the chain, enabling perpetual and futures markets to reference accurate asset prices without relying on a single centralized source.

The module supports multiple oracle types (e.g., Band, Pyth, Chainlink) and exposes both chain-level and indexer-level APIs for querying oracle data.
Understanding how oracles work is essential for building applications that interact with derivatives markets or need reliable price references.

The oracle scripts are located in the `orc_src/` directory.

### Fetch oracle list and module parameters (demo)

The script `orc_src/fetchorc.ts` queries the Injective mainnet to retrieve the full list of registered oracles and the oracle module parameters.

It performs two key operations:
1. **Fetch the oracle list** via the Indexer gRPC Oracle API (`IndexerGrpcOracleApi`), then extracts all distinct oracle types (e.g., Band, Pyth, Chainlink) from the response.
2. **Fetch module parameters** via the Chain gRPC Oracle API (`ChainGrpcOracleApi`), which returns the on-chain configuration for the oracle module.

```typescript
import { IndexerGrpcOracleApi } from "@injectivelabs/sdk-ts/client/indexer";
import { getNetworkEndpoints, Network } from "@injectivelabs/networks";
import { ChainGrpcOracleApi } from "@injectivelabs/sdk-ts/client/chain";

const endpoints = getNetworkEndpoints(Network.Mainnet);
const indexerGrpcOracleApi = new IndexerGrpcOracleApi(endpoints.indexer);

async function main() {
  const oracleList = await indexerGrpcOracleApi.fetchOracleList();

  // Extract distinct oracle types from the list
  const oracleTypes = [
    ...new Set(
      oracleEntries
        .map((oracle) => oracle.oracleType)
        .filter((oracleType): oracleType is string => Boolean(oracleType))
    ),
  ];

  const chainGrpcOracleApi = new ChainGrpcOracleApi(endpoints.grpc);
  const moduleParams = await chainGrpcOracleApi.fetchModuleParams();

  console.log(moduleParams);
  console.log("Distinct oracle types:", oracleTypes);
}

main();
```

Run the script:

```bash
npx tsx orc_src/fetchorc.ts
```

Key concepts:
- `IndexerGrpcOracleApi`: Queries the indexer for aggregated oracle data, including the full list of registered oracle providers and their types.
- `ChainGrpcOracleApi`: Queries the chain directly for oracle module parameters, which define how oracles are configured at the protocol level.
- **Distinct oracle types**: The script deduplicates oracle types to show which oracle providers are active on the network (e.g., `"band"`, `"pyth"`, `"chainlink"`).

### Fetch oracle price feed for a derivative market (demo)

The script `orc_src/fetchpricefeed.ts` demonstrates how to look up the oracle price feed for a specific derivative market.
It connects the derivatives market metadata to the corresponding oracle, then fetches the live price.

The workflow:
1. **Fetch derivative markets** via `IndexerGrpcDerivativesApi` and find the `INJ/USDT PERP` market.
2. **Extract oracle configuration** from the market object: `oracleBase`, `oracleQuote`, and `oracleType`. These fields define which oracle feed the market uses for mark price and funding calculations.
3. **Query the oracle price** via `IndexerGrpcOracleApi.fetchOraclePriceNoThrow`, which returns the current price without throwing if the feed is unavailable.

```typescript
import { getNetworkEndpoints, Network } from "@injectivelabs/networks";
import {
  IndexerGrpcOracleApi,
  IndexerGrpcDerivativesApi,
  PerpetualMarket,
} from "@injectivelabs/sdk-ts/client/indexer";

const endpoints = getNetworkEndpoints(Network.Mainnet);
const indexerGrpcDerivativesApi = new IndexerGrpcDerivativesApi(endpoints.indexer);
const indexerGrpcOracleApi = new IndexerGrpcOracleApi(endpoints.indexer);

async function main() {
  const markets = await indexerGrpcDerivativesApi.fetchMarkets();
  const market = markets.find((m) => m.ticker === "INJ/USDT PERP") as PerpetualMarket;

  const baseSymbol = market.oracleBase;
  const quoteSymbol = market.oracleQuote;
  const oracleType = market.oracleType;

  console.log(`Fetching price for ${baseSymbol}/${quoteSymbol} using oracle type: ${oracleType}`);

  const oraclePrice = await indexerGrpcOracleApi.fetchOraclePriceNoThrow({
    baseSymbol,
    quoteSymbol,
    oracleType,
  });

  console.log(oraclePrice);
}

main();
```

Run the script:

```bash
npx tsx orc_src/fetchpricefeed.ts
```

Key concepts:
- `oracleBase` and `oracleQuote`: The base and quote symbols the oracle uses (e.g., `"INJ"` and `"USDT"`). These are stored in the derivative market object and define which price pair the oracle references.
- `oracleType`: The type of oracle provider (e.g., `"bandibc"`, `"pyth"`). Different markets may use different oracle backends.
- `fetchOraclePriceNoThrow`: A safe query method that returns the oracle price or `undefined` instead of throwing an error if the feed is not available. This is useful for graceful error handling in production applications.
- **Market-oracle relationship**: Every derivative market on Injective is linked to a specific oracle feed. The market object contains all the information needed to look up the correct price feed.

## Complete!

Congratulations on completing this.
You now know how to:
- Fetch spot market data
- Understand market parameters and precision
- Place limit buy and sell orders
- Get current market prices
- Convert between chain and human-readable formats
- Query oracle lists and module parameters
- Fetch oracle price feeds for derivative markets

Next up is day 7,
where we'll explore about running your local injective node by docker
