import { SubgraphPoolBase, SwapInfo } from "@balancer-labs/sdk";
import { Pool } from "@/modules/pools";
import { BigNumber } from "ethers";

export enum PoolType {
  Weighted = 'Weighted'
}

let mockSwapInfo: SwapInfo = {
  swaps: [],
  tokenAddresses: [],
  swapAmount: BigNumber.from(0),
  swapAmountForSwaps: BigNumber.from(0),
  returnAmount: BigNumber.from(0),
  returnAmountFromSwaps: BigNumber.from(0),
  returnAmountConsideringFees: BigNumber.from(0),
  tokenIn: '0x0',
  tokenOut: '0x0',
  marketSp: '',
};

let mockSubgraphPools: Pool[] = [];
let mockSorPools: SubgraphPoolBase[] = [];
let mockEncodedBatchSwap = "";

let isJoinExitSwap = false;

export const mockSwapCostCalculator = {
  setNativeAssetPriceInToken: jest.fn().mockImplementation(),
};

export const BalancerSDK = jest.fn().mockImplementation(() => {
  return {
    sor: {
      fetchPools: jest.fn().mockImplementation(() => {
        return mockSorPools.length > 0;
      }),
      getSwaps: jest.fn().mockImplementation(() => {
        return mockSwapInfo;
      }),
      getPools: jest.fn().mockImplementation(() => {
        return mockSorPools;
      }),
      swapCostCalculator: mockSwapCostCalculator,
    },
    
  };
});

export const CoingeckoPriceRepository = jest.fn().mockImplementation(() => {
  return {
    find: jest.fn().mockImplementation(),
  };
});

export const PoolsSubgraphRepository = jest.fn().mockImplementation(() => {
  return {
    fetch: jest.fn().mockImplementation((options) => {
      if (options?.skip === 0) return mockSubgraphPools;
      return [];
    }),
  };
});

export const Swaps = {
  encodeBatchSwap: jest.fn().mockImplementation(() => {
    return mockEncodedBatchSwap;
  })
};

export const canUseJoinExit = jest.fn().mockImplementation(() => {
  return isJoinExitSwap;
});

export const someJoinExit = jest.fn().mockImplementation(() => {
  return isJoinExitSwap;
});

export const buildRelayerCalls = jest.fn().mockImplementation(() => {
  return {
    to: '0x2536dfeeCB7A0397CF98eDaDA8486254533b1aFA',
    data: '0x123456789abcdef'
  }
})



export enum SwapType {
  SwapExactIn = 0,
  SwapExactOut = 1,
}

export enum SwapTypes {
  SwapExactIn = 0,
  SwapExactOut = 1,
}

export function _setMockSwapInfo(swapInfo: SwapInfo) {
  mockSwapInfo = swapInfo;
}

export function _setSubgraphPools(pools: Pool[]) {
  mockSubgraphPools = pools;
}

export function _setSorPools(pools: SubgraphPoolBase[]) {
  mockSorPools = pools;
}

export function _setEncodedBatchSwap(encodedBatchSwap: string) {
  mockEncodedBatchSwap = encodedBatchSwap;
}

export function _setIsJoinExitSwap(isJoinExit: boolean) {
  isJoinExitSwap = isJoinExit;
}