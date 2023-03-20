import axios from 'axios';
import type { AxiosCacheInstance } from 'axios-cache-interceptor';
import rateLimit from 'axios-rate-limit';
import { setupCache } from 'axios-cache-interceptor';
import { CacheConstants } from '../constants/cache.constants';
import { CustomLogger } from '../lib/logger/logger';
import type { Chains } from '../lib/node-multiplexer';
import type { CommonTypes } from '../types/common.types';

export class DefillamaService {
  private static cachedRateLimitedAxios: AxiosCacheInstance;

  private static coinsEndpointCachedRateLimitedAxios: AxiosCacheInstance;

  private static yieldsEndpointCachedRateLimitedAxios: AxiosCacheInstance;

  private DEFILLAMA_YIELDS_API_URL = process.env.DEFILLAMA_YIELDS_API_URL;

  private DEFILLAMA_API_URL = process.env.DEFILLAMA_API_URL;

  private DEFILLAMA_COINS_API_URL = process.env.DEFILLAMA_COINS_API_URL;

  private logger: CustomLogger;

  constructor() {
    this.logger = new CustomLogger(DefillamaService.name);

    DefillamaService.cachedRateLimitedAxios = setupCache(
      rateLimit(axios.create(), {
        maxRequests: parseInt(process.env.DEFILLAMA_MAX_REQUESTS) || 500,
        perMilliseconds: parseInt(process.env.DEFILLAMA_MAX_REQUESTS_INTERVAL_MS) || 60000,
      }),
      {
        ttl: CacheConstants.CACHE_CONFIG.SIMPLEHASH_DEFAULT_CACHE.TTL,
      }
    );

    DefillamaService.coinsEndpointCachedRateLimitedAxios = setupCache(
      rateLimit(axios.create(), {
        maxRequests: parseInt(process.env.DEFILLAMA_MAX_REQUESTS) || 500,
        perMilliseconds: parseInt(process.env.DEFILLAMA_MAX_REQUESTS_INTERVAL_MS) || 60000,
      }),
      {
        ttl: CacheConstants.CACHE_CONFIG.SIMPLEHASH_DEFAULT_CACHE.TTL,
      }
    );

    DefillamaService.yieldsEndpointCachedRateLimitedAxios = setupCache(
      rateLimit(axios.create(), {
        maxRequests: parseInt(process.env.DEFILLAMA_MAX_REQUESTS) || 500,
        perMilliseconds: parseInt(process.env.DEFILLAMA_MAX_REQUESTS_INTERVAL_MS) || 60000,
      }),
      {
        ttl: CacheConstants.CACHE_CONFIG.SIMPLEHASH_DEFAULT_CACHE.TTL,
      }
    );
  }

  async getTokenPriceInfoFromDefillama(
    chain: Chains,
    tokenAddress: string
  ): Promise<CommonTypes.CoinPriceInfo> {
    try {
      const tokenID = `${chain.toLowerCase()}:${tokenAddress}`;
      const response = await DefillamaService.coinsEndpointCachedRateLimitedAxios.get(
        `${this.DEFILLAMA_COINS_API_URL}prices/current/${tokenID}`
      );

      if (response.status !== 200) {
        this.logger.error(
          `DefiLlama request failed with status code ${response.status}. ${response.statusText}`
        );
        return null;
      } else {
        const priceInfo = response.data as CommonTypes.DefiLlamaCoinPriceResponse;
        const tokenInformation = priceInfo.coins[tokenID];
        return tokenInformation;
      }
    } catch (err) {
      this.logger.error(
        err,
        `Error in getting token information for ${tokenAddress} from defillama`
      );
      return null;
    }
  }
}
