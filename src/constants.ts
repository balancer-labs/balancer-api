import { Schema } from "types";

export const COINGECKO_BASEURL = 'https://api.coingecko.com/api/v3';
export const COINGECKO_MAX_TOKENS_PER_PAGE = 100;
export const COINGECKO_MAX_TPS = 10;

export const MAX_BATCH_WRITE_SIZE = 25;
export const MAX_DYNAMODB_PRECISION = 38;


export const POOLS_TABLE_SCHEMA = {
  TableName : "pools",
  KeySchema: [       
      { AttributeName: "id", KeyType: "HASH"},
      { AttributeName: "chainId", KeyType: "RANGE"},
  ],
  AttributeDefinitions: [       
      { AttributeName: "id", AttributeType: "S" },
      { AttributeName: "chainId", AttributeType: "N" },
  ],
  ProvisionedThroughput: {       
      ReadCapacityUnits: 10, 
      WriteCapacityUnits: 10
  }
}

export const TOKENS_TABLE_SCHEMA = {
  TableName : "tokens",
  KeySchema: [       
      { AttributeName: "address", KeyType: "HASH"},
      { AttributeName: "chainId", KeyType: "RANGE"},
  ],
  AttributeDefinitions: [       
      { AttributeName: "address", AttributeType: "S" },
      { AttributeName: "chainId", AttributeType: "N" },
  ],
  ProvisionedThroughput: {       
      ReadCapacityUnits: 10, 
      WriteCapacityUnits: 10
  }
}

/** 
 * Used for marshalling / unmarshalling into DynamoDB
 * 
 * Number: Saved as a number in DynamoDB and JS
 * BigNumber: Saved as a number in DynamoDB, but a String in JS
*/
export const POOL_SCHEMA: Schema = {
    swapEnabled: { type: 'Boolean' },
    swapFee: { type: 'BigDecimal' },

    totalWeight: { type: 'BigDecimal' },
    totalSwapVolume: { type: 'BigDecimal' },
    totalSwapFee: { type: 'BigDecimal' },
    totalLiquidity: { type: 'BigDecimal' },
    totalShares: { type: 'BigDecimal' },

    createTime: { type: 'Int' },
    swapsCount: { type: 'BigInt' },
    holdersCount: { type: 'BigInt' },

    // StablePool Only
    amp: { type: 'BigInt' },

    // ConvergentCurvePool (Element) Only
    expiryTime: { type: 'BigInt' },
    unitSeconds: { type: 'BigInt' },

    //InvestmentPool Only
    managementFee: { type: 'BigDecimal' },

    // LinearPool only
    mainIndex: { type: 'Int' },
    wrappedIndex: { type: 'Int' },
    lowerTarget: { type: 'BigDecimal' },
    upperTarget: { type: 'BigDecimal' },
}