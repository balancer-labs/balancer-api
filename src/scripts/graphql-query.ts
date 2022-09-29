const axios = require('axios');
const util = require('util');

const {
  APPSYNC_URL,
  APPSYNC_KEY,
} = process.env;

if (!APPSYNC_URL || !APPSYNC_KEY) {
  console.error("You need to set the env variables APPSYNC_URL and APPSYNC_KEY before running this script");
  process.exit(1);
}

const simpleQuery = `query {
    pools (
      first: 10
      chainId: 1
    ) {
      pools {
        id
        address
        poolType
        tokens { 
          address 
          symbol 
          balance 
        } 
      }
      nextToken
    }
  }`

const complexQuery = `query { 
  pools (
    chainId: 1, 
    first: 10, 
    orderBy: "totalLiquidity", 
    orderDirection: "desc", 
    where: {
      tokensList: {
        contains: []
      }, 
      poolType: {
        not_in: ["Element", "AaveLinear", "Linear", "ERC4626Linear"]
      }, 
      totalShares: {
        gt: 0.01
      }, 
      id: {
        not_in: [""]
      }
    }) {
      pools { 
        id 
        address 
        poolType 
        swapFee 
        tokensList 
        totalLiquidity 
        totalSwapVolume 
        totalSwapFee 
        totalShares 
        volumeSnapshot
        owner 
        factory 
        amp 
        createTime 
        swapEnabled 
        tokens { 
          address 
          balance 
          weight 
          priceRate 
          symbol 
        } 
        apr {
          stakingApr {
            min
            max
          }
          swapFees
          tokenAprs {
            total
            breakdown
          }
          rewardAprs {
            total
            breakdown
          }
          protocolApr
          min
          max
        }
      } 
      nextToken
    }
  }`


  
async function runQuery(query) {
  try {
    const url = APPSYNC_URL;
    const payload = { query };
    const {
      data
    } = await axios.post(url, payload, {
      headers: {
        'x-api-key': APPSYNC_KEY
      }
    });

    if (data.errors) {
      throw new Error(`Encountered error running query: ${util.inspect(data.errors, false, null)}`);
    }

    const pools = data.data.pools;
    return pools;
  } catch (e) {
    console.log('error is: ', e);
  }
}

async function runTestQueries() {
  console.log("Fetching basic pools");
  const basicQueryPools = await runQuery(simpleQuery);
  console.log(util.inspect(basicQueryPools, false, null));
  console.log("Fetching detailed pools");
  const complexQueryPools = await runQuery(complexQuery);
  console.log(util.inspect(complexQueryPools, false, null));
}

runTestQueries();