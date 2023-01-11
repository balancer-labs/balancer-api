import { CfnWebACL, CfnWebACLProps } from 'aws-cdk-lib/aws-wafv2';

function createRule(name: string, searchString: string, limit: number): CfnWebACL.RuleProperty {
  const rule = {
    name,
    priority: 0,
    statement: {
      rateBasedStatement: {
        limit,
        aggregateKeyType: 'IP',
        scopeDownStatement: {
          byteMatchStatement: {
            searchString,
            fieldToMatch: {
              uriPath: {},
            },
            textTransformations: [
              {
                priority: 0,
                type: 'NONE',
              },
            ],
            positionalConstraint: 'CONTAINS',
          },
        },
      },
    },
    action: {
      block: {
        customResponse: {
          responseCode: 429,
        },
      },
    },
    visibilityConfig: {
      sampledRequestsEnabled: true,
      cloudWatchMetricsEnabled: true,
      metricName: name,
    },
  };
  return rule;
}

function formatRules(
  rules: CfnWebACL.RuleProperty[]
): CfnWebACL.RuleProperty[] {
  return rules.map((rule, idx) => {
    return {
      ...rule,
      priority: idx,
    };
  });
}

export const rateLimitSettings: CfnWebACLProps = {
  name: 'RateLimits',
  description: 'Rate Limiting for API Gateway',
  defaultAction: {
    allow: {},
  },
  scope: 'REGIONAL',
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudWatchMetricsEnabled: true,
    metricName: 'RateLimits',
  },
  rules: formatRules([
    createRule('BlockSpamForWalletCheck', '/check-wallet', 100),
    createRule('BlockSpamForTenderly', '/tenderly', 1000),
    createRule('BlockSpamForPools', '/pools', 200),
    createRule('BlockSpamForTokens', '/tokens', 100),
    createRule('BlockSpamForSor', '/sor', 100),
    createRule('BlockSpamForGnosis', '/gnosis', 200),
    createRule('BlockSpamForGraphQL', '/graphql', 100),
  ]),
};
