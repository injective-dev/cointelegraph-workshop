import { IndexerGrpcOracleApi } from "@injectivelabs/sdk-ts/client/indexer";
import { getNetworkEndpoints, Network } from "@injectivelabs/networks";
import { ChainGrpcOracleApi } from "@injectivelabs/sdk-ts/client/chain";

const endpoints = getNetworkEndpoints(Network.Mainnet);
const indexerGrpcOracleApi = new IndexerGrpcOracleApi(endpoints.indexer);

async function main() {
const oracleList = await indexerGrpcOracleApi.fetchOracleList();
const oracleEntries = Array.isArray(oracleList)
	? oracleList
	: ((oracleList as { oracleList?: Array<{ oracleType?: string }> }).oracleList ??
			(oracleList as { oracles?: Array<{ oracleType?: string }> }).oracles ??
			[]);
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

//console.log(oracleList);
}

main();