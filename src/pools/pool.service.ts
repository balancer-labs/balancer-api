import { Pool, PoolToken, TokenTreePool } from '../../src/types';
import {
  Pools,
  BalancerNetworkConfig,
  BalancerDataRepositories,
  AprBreakdown,
  PoolWithMethods,
} from '@balancer-labs/sdk';
import util from 'util';
import debug from 'debug';
import { isEqual } from 'lodash';
import { isValidApr } from '../utils';
import { WEEK_IN_MS } from '../constants';

const log = debug('balancer:pools');

export class PoolService {
  pools: Pools;

  constructor(
    public pool: Pool,
    networkConfig: BalancerNetworkConfig,
    repositories: BalancerDataRepositories
  ) {
    this.pools = new Pools(networkConfig, repositories);
  }

  /**
   * @summary Calculates and sets total liquidity of pool.
   */
  public async setTotalLiquidity(): Promise<string> {
    if (this.pool.poolType === 'Element') return '0';

    let poolLiquidity = '0';
    try {
      const calculatedLiquidity = await this.pools.liquidity(this.pool);
      poolLiquidity = calculatedLiquidity;
    } catch (e) {
      console.error(
        `Failed to calculate liquidity. Error is:  ${e}\n
        Pool is:  ${util.inspect(this.pool, false, null)}\n`
      );
      // If we already have a totalLiquidity value, return it,
      // otherwise continue and save out 0 totalLiquidity so it's not left null
      if (this.pool.totalLiquidity) {
        return this.pool.totalLiquidity;
      }
    }

    if (Number(poolLiquidity) == 0 && Number(this.pool.totalLiquidity) > 0) {
      console.error(
        `Failed to calculate liquidity. Calculator returned ${poolLiquidity}\n
        Pool is:  ${util.inspect(this.pool, false, null)}\n`
      );
    }

    if (
      this.pool.graphData?.totalLiquidity ||
      this.pool.totalLiquidity ||
      (poolLiquidity && poolLiquidity !== this.pool.totalLiquidity)
    ) {
      log(
        `Updating Liquidity for Pool: ${this.pool.id} on chain: ${this.pool.chainId}\n
        Graph Provided Liquidity: \t ${this.pool.graphData?.totalLiquidity}\n
        Current Liquidity: \t\t\t", ${this.pool.totalLiquidity}\n
        Re-calculated liquidity: \t", ${poolLiquidity}\n
        ---`
      );
    }

    if (poolLiquidity !== this.pool.totalLiquidity) {
      this.pool.lastUpdate = Date.now();
    }

    return (this.pool.totalLiquidity = poolLiquidity);
  }

  public async setApr(): Promise<AprBreakdown> {
    log('Calculating APR for pool: ', this.pool.id);

    let poolApr: AprBreakdown = {
      swapFees: 0,
      tokenAprs: {
        total: 0,
        breakdown: {},
      },
      stakingApr: {
        min: 0,
        max: 0,
      },
      rewardAprs: {
        total: 0,
        breakdown: {},
      },
      protocolApr: 0,
      min: 0,
      max: 0,
    };

    if (Number(this.pool.totalLiquidity) < 100) {
      log(
        `Pool only has ${this.pool.totalLiquidity} liquidity. Not processing`
      );
      return (this.pool.apr = poolApr); // Don't bother calculating APR for pools with super low liquidity
    }

    try {
      const apr = await this.pools.apr(this.pool);
      if (!isValidApr(apr)) {
        throw new Error('APR is invalid - contains NaN');
      }
      poolApr = apr;
    } catch (e) {
      console.error(
        `Failed to calculate APR. Error is:  ${e}\n
        Pool is:  ${util.inspect(this.pool, false, null)}\n`
      );
      // If we already have an APR, return it,
      // otherwise continue and save out the 0 APR to this pool so it's not left null
      if (this.pool.apr) {
        return this.pool.apr;
      }
    }

    if (!isEqual(poolApr, this.pool.apr)) {
      console.log(`Updated pool ${this.pool.id} to APR: `, poolApr);
      this.pool.lastUpdate = Date.now();
    }

    return (this.pool.apr = poolApr);
  }

  public async setVolumeSnapshot(): Promise<string> {
    let volumeSnapshot = '0';

    if (Number(this.pool.totalSwapVolume) < 100) {
      log(`Pool only has ${this.pool.totalSwapVolume} volume. Not processing`);
      return (this.pool.volumeSnapshot = volumeSnapshot); // Don't bother calculating Volume snapshots for pools with super low volume
    }

    try {
      const volume = await this.pools.volume(this.pool);
      volumeSnapshot = volume.toString();
    } catch (e) {
      console.error(
        `Failed to calculate Volume. Error is:  ${e}\n
        Pool is:  ${util.inspect(this.pool, false, null)}\n`
      );
      return volumeSnapshot;
    }

    if (volumeSnapshot !== this.pool.volumeSnapshot) {
      console.log(`Updated pool ${this.pool.id} to Volume:  `, volumeSnapshot);
      this.pool.lastUpdate = Date.now();
    }

    return (this.pool.volumeSnapshot = volumeSnapshot);
  }

  public setIsNew(): boolean {
    if (!this.pool.createTime) return false;

    const isNew = Date.now() - this.pool.createTime * 1000 < WEEK_IN_MS;

    return (this.pool.isNew = isNew);
  }

  private async expandToken(token: PoolToken): Promise<PoolToken> {
    if (token.address === this.pool.address) return token; // Don't expand BPT tokens of this pool

    const tokenPool: PoolWithMethods = await this.pools.findBy('address', token.address);
    if (!tokenPool) return token;

    const tokenTreePool: TokenTreePool = {
      id: tokenPool.id,
      address: tokenPool.address,
      poolType: tokenPool.poolType,
      totalShares: tokenPool.totalShares,
      mainIndex: tokenPool.mainIndex,
      tokens: await Promise.all(tokenPool.tokens.map((token: PoolToken) => {
        if (token.address === tokenPool.address) return token; // Don't expand BPT tokens of sub-pools
        return this.expandToken(token)
      })),
    }

    return {
      ...token,
      token: {
        pool: tokenTreePool
      }
    }

  }

  /**
   * Loops through all tokens of the pool and if they are another pool it grabs
   * that pools data and inserts it into this pool. So all pools will be stored
   * in the database with all their subpools. 
   */
  public async expandPool(): Promise<Pool> {
    const tokens: PoolToken[] = await Promise.all(this.pool.tokens.map((token) => {
      return this.expandToken(token); 
    }));

    if (JSON.stringify(tokens) !== JSON.stringify(this.pool.tokens)) {
      console.log(`Expanded subpool tokens for pool ${this.pool.id}`);
      this.pool.lastUpdate = Date.now();
    }

    this.pool.tokens = tokens;
    return this.pool;
  }
}
