export namespace CacheConstants {
  export enum CacheKeys {
    CHAIN_SCAN_DEFAULT = 'CHAIN_SCAN_DEFAULT',
    CHAIN_SCAN_ABI = 'CHAIN_SCAN_ABI',
    CHAIN_SCAN_CONTRACT_INFO = 'CHAIN_SCAN_CONTRACT_INFO',
    CHAIN_SCAN_TOKEN_INFO = 'CHAIN_SCAN_TOKEN_INFO',
    CHAIN_SCAN_CONTRACT_CREATION = 'CHAIN_SCAN_CONTRACT_CREATION',
    DEFILLAMA_DEFAULT_CACHE = 'DEFILLAMA_DEFAULT_CACHE',
    SIMPLEHASH_DEFAULT_CACHE = 'SIMPLEHASH_DEFAULT_CACHE',
  }

  export const CACHE_CONFIG = {
    [CacheKeys.CHAIN_SCAN_DEFAULT]: {
      TTL: 15 * 60 * 1000, //caches for 15 minutes
    },
    [CacheKeys.CHAIN_SCAN_ABI]: {
      TTL: 6 * 3600 * 1000, //caches for 6 hours
    },
    [CacheKeys.CHAIN_SCAN_CONTRACT_INFO]: {
      TTL: 6 * 3600 * 1000, //caches for 6 hours
    },
    [CacheKeys.CHAIN_SCAN_TOKEN_INFO]: {
      TTL: 3600 * 1000, //caches for 1 hour
    },
    [CacheKeys.CHAIN_SCAN_CONTRACT_CREATION]: {
      TTL: 6 * 3600 * 1000, //caches for 6 hour
    },
    [CacheKeys.DEFILLAMA_DEFAULT_CACHE]: {
      TTL: 15 * 60 * 1000, //caches for 15 minutes
    },
    [CacheKeys.SIMPLEHASH_DEFAULT_CACHE]: {
      TTL: 3600 * 1000, //caches for 1 hour
    },
  };
}
