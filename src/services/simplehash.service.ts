import axios from 'axios';
import type { AxiosCacheInstance } from 'axios-cache-interceptor';
import { setupCache } from 'axios-cache-interceptor';
import BigNumber from 'bignumber.js';
import { CacheConstants } from '../constants/cache.constants';
import { CommonConstants } from '../constants/common.constants';
import { CustomLogger } from '../lib/logger/logger';
import type { Chains } from '../lib/node-multiplexer';
import { NodeConstants, NodeUtils } from '../lib/node-multiplexer';
import rateLimit from 'axios-rate-limit';

export class SimpleHashService {
  private static cachedRateLimitedAxios: AxiosCacheInstance;

  private logger: CustomLogger;

  constructor() {
    this.logger = new CustomLogger(SimpleHashService.name);
    SimpleHashService.cachedRateLimitedAxios = setupCache(
      rateLimit(axios.create(), {
        maxRPS: parseInt(process.env.SIMPLEHASH_RATE_LIMIT) || 10,
      }),
      {
        ttl: CacheConstants.CACHE_CONFIG.SIMPLEHASH_DEFAULT_CACHE.TTL,
      }
    );
  }

  async getNFTDetails(contractAddress: string, tokenId: string, chain: Chains) {
    try {
      const nftDetails = await SimpleHashService.cachedRateLimitedAxios.get(
        `${process.env.SIMPLEHASH_API_URL}/${chain.toLowerCase()}/${contractAddress}/${tokenId}`,
        {
          headers: {
            'X-API-KEY': process.env.SIMPLEHASH_API_KEY,
          },
        }
      );

      const floorPriceForOpensea = nftDetails.data.collection.floor_prices.find(
        (marketplace) => marketplace.marketplace_id === CommonConstants.NFTMarketPlaces.OPENSEA
      );

      const [floorPrice, floorPriceToken] = !floorPriceForOpensea
        ? ['0', NodeConstants.NATIVE_CURRENCY[chain]]
        : [
            NodeUtils.formatUnits(
              floorPriceForOpensea.value.toString(),
              floorPriceForOpensea.payment_token.decimals
            ),
            floorPriceForOpensea.payment_token.symbol,
          ];

      return {
        contractAddress,
        tokenId,
        name: nftDetails.data.contract.symbol,
        url: nftDetails.data.previews.image_small_url,
        floorPrice: new BigNumber(floorPrice).toNumber(),
        floorPriceToken,
      };
    } catch (error) {
      this.logger.error(
        error,
        `Error in getting NFT details for ${contractAddress} and ${tokenId}`
      );
      return null;
    }
  }
}
