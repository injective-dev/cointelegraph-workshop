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
    // Fetch the list of derivative markets
    const markets = await indexerGrpcDerivativesApi.fetchMarkets();

    // Find the specific market by ticker
    const market = markets.find((market) => market.ticker === "INJ/USDT PERP");

    if (!market) {
        throw new Error("Market not found");
    }
    let mar = market as PerpetualMarket;

    // These values are a part of the market object
    // fetched from the indexer i.e `quoteDenom` and `quoteToken`
    const baseSymbol = mar.oracleBase;
    const quoteSymbol = mar.oracleQuote;
    const oracleType = mar.oracleType;
    console.log(`Fetching price for ${baseSymbol}/${quoteSymbol} using oracle type: ${oracleType}`);

    const oraclePrice = await indexerGrpcOracleApi.fetchOraclePriceNoThrow({
        baseSymbol,
        quoteSymbol,
        oracleType,
    });

    console.log(oraclePrice);
}

main();