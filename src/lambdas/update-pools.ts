import { getChangedPools, getTokenAddressesFromPools } from '../utils';
import { getPools, updatePools, updateTokens } from '../data-providers/dynamodb';
import {
  fetchPoolsFromChain,
  fetchTokens,
  removeKnownTokens,
  sanitizePools,
} from '../data-providers/onchain';

const { CHAIN_ID } = process.env;

export const handler = async (): Promise<any> => {
  const log = console.log;

  const chainId = parseInt(CHAIN_ID || '1');

  try {
    log(`Fetching pools from network ${chainId}`);
    const poolsFromChain = await fetchPoolsFromChain(chainId);
    log(`Sanitizing ${poolsFromChain.length} pools`);
    const pools = sanitizePools(poolsFromChain);
    const currentPools = await getPools(chainId);
    const changedPools = getChangedPools(pools, currentPools);
    log(`Saving ${changedPools.length} pools for chain ${chainId} to database`);
    await updatePools(changedPools);
    log(`Saved pools. Fetching Tokens for pools`);
    const tokenAddresses = getTokenAddressesFromPools(changedPools);
    log(
      `Found ${tokenAddresses.length} tokens in pools on chain ${chainId}. Filtering by known tokens`
    );
    const filteredTokenAddresses = await removeKnownTokens(
      chainId,
      tokenAddresses
    );
    log(
      `Fetching ${filteredTokenAddresses.length} tokens for chain ${chainId}`
    );
    const tokens = await fetchTokens(chainId, filteredTokenAddresses);
    const tokenUpdateResult = await updateTokens(tokens);
    log(`Token update result: ${tokenUpdateResult}`);
    log(`Saved ${filteredTokenAddresses.length} Tokens`);
    return { statusCode: 201, body: '' };
  } catch (dbError) {
    log(`Received db error: ${dbError}`);
    return { statusCode: 500, body: JSON.stringify(dbError) };
  }
};
