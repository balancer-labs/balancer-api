import { wrapHandler } from '@/modules/sentry';
import { captureException } from '@sentry/serverless';
import { TokenRegisteredEvent, HALEventName, HALEvent } from '@/modules/hal';
import { formatResponse } from './utils';
import {
  INVALID_CHAIN_ID_ERROR,
  MISSING_CHAIN_ID_ERROR,
} from '@/constants/errors';
import { isValidNetworkId } from '@/modules/network';
import { allowlistPool } from '@/modules/allowlist';

/**
 * This webhook takes events from hal.xyz and performs actions with them
 *
 * The first action is to listen to new pool creation events on the Balancer Vault
 * and send the event details to a Github Webhook that creates a PR to allowlist the pool
 */

export const handler = wrapHandler(async (event: any = {}): Promise<any> => {
  const chainId = parseInt(event.pathParameters.chainId);
  if (!chainId) {
    return MISSING_CHAIN_ID_ERROR;
  }
  if (!isValidNetworkId(chainId)) {
    return INVALID_CHAIN_ID_ERROR;
  }

  if (!event.body) {
    return {
      statusCode: 400,
      body: 'invalid request, you are missing the parameter body',
    };
  }

  try {
    const halEvents: HALEvent[] =
      typeof event.body == 'object' ? event.body : JSON.parse(event.body);
    await Promise.all(
      halEvents.map(async (event: HALEvent) => {
        if (event.eventName === HALEventName.TokensRegistered) {
          const parameters = (event as TokenRegisteredEvent).eventParameters;
          const poolId = parameters.poolId;
          await allowlistPool(chainId, poolId);
          console.log(`Successfully allowlisted pool ${poolId}`);
        }
      })
    );
    return { statusCode: 200 };
  } catch (e) {
    console.log(`Received error processing HAL Webhook: ${e}`);
    captureException(e);
    return formatResponse(500, 'Unable to process webhook event');
  }
});
