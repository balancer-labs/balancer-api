import { Pool, Token } from '../types';
import { BalancerDataRepositories, PoolsStaticRepository, StaticTokenPriceProvider, Pool as SDKPool, Pools, StaticTokenProvider, BalancerNetworkConfig, BalancerSdkConfig, BalancerSDK } from '@balancer-labs/sdk';
import { tokensToTokenPrices } from '../tokens';
import { PoolService } from './pool.service';
import debug from 'debug';
import { getInfuraUrl } from '../utils';
import { chunk, flatten } from 'lodash';
import util from 'util';

const log = debug('balancer:pool-decorator');

export class PoolDecorator {
  constructor(
    public pools: Pool[],
    private chainId: number = 1
  ) {}

  public async decorate(tokens: Token[]): Promise<Pool[]> {
    log("------- START Decorating pools --------")
    
    const tokenPrices = tokensToTokenPrices(tokens);
  
    const poolProvider = new PoolsStaticRepository(this.pools as SDKPool[]);
    const tokenPriceProvider = new StaticTokenPriceProvider(tokenPrices);
    const tokenProvider = new StaticTokenProvider(tokens);

    console.log("Infura URL: ", getInfuraUrl(this.chainId));

    const balancerConfig: BalancerSdkConfig = {
      network: this.chainId,
      rpcUrl: getInfuraUrl(this.chainId),
    }
    const balancerSdk = new BalancerSDK(balancerConfig);
    const networkConfig = balancerSdk.networkConfig;
    const dataRepositories = balancerSdk.dataRepositories;

    const poolsRepositories: BalancerDataRepositories = {
      ...dataRepositories,
      ...{
        pools: poolProvider,
        tokenPrices: tokenPriceProvider,
        tokenMeta: tokenProvider,
      }
    }

    const promises = this.pools.map(async pool => {
      let poolService;
      try {
        poolService = new PoolService(pool, networkConfig, poolsRepositories);
      } catch (e) {
        console.log(`Failed to initialize pool service. Error is: ${e}. Pool is:  ${util.inspect(pool, false, null)}`);
        return;
      }

      await poolService.setTotalLiquidity();
      await poolService.setApr();

      return poolService.pool;
    });
  
    const pools = await Promise.all(promises);

    log("------- END decorating pools --------")

    return pools;
  }
}