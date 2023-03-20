import rateLimit from 'axios-rate-limit';
import axios, { HttpStatusCode } from 'axios';
import type { AxiosCacheInstance } from 'axios-cache-interceptor';
import { setupCache } from 'axios-cache-interceptor';
import type { Chains } from '../../nm-common/nm.constants';
import { Networks } from '../../nm-common/nm.constants';
import { NodeProviderServiceBase } from '../nm-provider-base.service';
import { NodeUtils } from '../../nm-common/nm.util';
import { CacheConstants } from '../../../../constants/cache.constants';
import { CustomLogger } from '../../../logger/logger';
import type { NodeTypes } from '../../nm-common/nm.types';

export class NodeBlockchainScanProviderService extends NodeProviderServiceBase {
  private chain: Chains;

  private network: Networks;

  private logger: CustomLogger;

  private apiUrl: string;

  private cachedRateLimitedAxios: AxiosCacheInstance;

  constructor() {
    super();
    this.logger = new CustomLogger(NodeBlockchainScanProviderService.name);
  }

  init(chain: Chains, network: Networks = Networks.MAINNET) {
    this.chain = chain;
    this.network = network;
    this.apiUrl = NodeUtils.getBlockchainScanApiDetails(chain, network);
    this.cachedRateLimitedAxios = setupCache(
      rateLimit(axios.create(), {
        maxRequests: NodeUtils.BLOCKCHAIN_SCAN_PROVIDER_RATE_LIMITS.MAX_REQUESTS,
        perMilliseconds: NodeUtils.BLOCKCHAIN_SCAN_PROVIDER_RATE_LIMITS.PER_MS,
      }),
      {
        ttl: CacheConstants.CACHE_CONFIG.CHAIN_SCAN_DEFAULT.TTL,
      }
    );
  }

  // ? Since we don't have alternative for Blockchain scan, lets assume it works. This will save about 1-2s per blockchainScan call
  // TODO: Do proper check once we have an alternative
  async isActive(): Promise<boolean> {
    return true;
  }

  async getContractDetails(contractAddress: string) {
    try {
      const res = await this.cachedRateLimitedAxios.get(
        `${this.apiUrl}` +
          '?module=contract' +
          '&action=getsourcecode' +
          `&address=${contractAddress.toLowerCase()}` +
          `&apikey=${NodeUtils.BLOCKCHAIN_SCAN_API_KEY[this.chain]}`,
        {
          cache: {
            ttl: CacheConstants.CACHE_CONFIG.CHAIN_SCAN_CONTRACT_INFO.TTL,
          },
        }
      );

      if (res.status === HttpStatusCode.Ok && res.data.status === '1') {
        let implementationRes;
        const details = res.data.result[0] as NodeTypes.BlockChainScanContractDetails;

        if (
          details.Implementation &&
          details.Implementation.toLowerCase() !== contractAddress.toLowerCase()
        ) {
          implementationRes = await this.cachedRateLimitedAxios.get(
            `${this.apiUrl}` +
              '?module=contract' +
              '&action=getsourcecode' +
              `&address=${res.data.result[0].Implementation.toLowerCase()}` +
              `&apikey=${NodeUtils.BLOCKCHAIN_SCAN_API_KEY[this.chain]}`,
            {
              cache: {
                ttl: CacheConstants.CACHE_CONFIG.CHAIN_SCAN_CONTRACT_INFO.TTL,
              },
            }
          );
        }

        const implementationDetails = implementationRes?.data
          .result[0] as NodeTypes.BlockChainScanContractDetails;

        let abi = undefined;
        // If implementation is same as OG contract, get OG contract ABI. Else get implementation contract ABI
        if (
          (details.Implementation === '' ||
            details.Implementation.toLowerCase() === contractAddress.toLowerCase()) &&
          details.ABI !== 'Contract source code not verified'
        ) {
          abi = JSON.parse(details.ABI);
        } else if (
          implementationDetails &&
          implementationDetails.ABI !== 'Contract source code not verified'
        ) {
          abi = JSON.parse(implementationDetails.ABI);
        }

        return {
          name: details.ContractName,
          isVerified: details.ABI !== 'Contract source code not verified',
          abi: abi,
        };
      } else {
        return undefined;
      }
    } catch (error) {
      this.logger.error(error);
      return undefined;
    }
  }

  async getTokenDetails(contractAddress: string) {
    try {
      const res = await this.cachedRateLimitedAxios.get(
        `${this.apiUrl}` +
          '?module=token' +
          '&action=tokeninfo' +
          `&contractaddress=${contractAddress}` +
          `&apikey=${NodeUtils.BLOCKCHAIN_SCAN_API_KEY[this.chain]}`,
        {
          cache: {
            ttl: CacheConstants.CACHE_CONFIG.CHAIN_SCAN_TOKEN_INFO.TTL,
          },
        }
      );

      const tokenDetails = res.data.status === '1' ? res.data.result[0] : undefined;

      if (!tokenDetails) {
        return {
          address: contractAddress,
          symbol: '',
          name: '',
          decimals: 18,
          total_supply: '',
          block_number: 0,
          block_timestamp: '',
          block_hash: '',
          token_type: 'unknown',
        };
      }

      return {
        address: tokenDetails.contractAddress,
        symbol: tokenDetails.symbol,
        name: tokenDetails.tokenName,
        decimals: tokenDetails.divisor,
        total_supply: tokenDetails.totalSupply,
        block_number: 0,
        block_timestamp: '',
        block_hash: '',
        token_type: tokenDetails.tokenType,
      };
    } catch (error) {
      this.logger.error(error, 'Error while fetching token details from etherscan');
      return null;
    }
  }

  async getContractCreation(contractAddresses: string[]) {
    try {
      const response = await this.cachedRateLimitedAxios.get(
        `${this.apiUrl}` +
          '?module=contract' +
          '&action=getcontractcreation' +
          `&contractaddresses=${contractAddresses}` +
          `&apikey=${NodeUtils.BLOCKCHAIN_SCAN_API_KEY[this.chain]}`,
        {
          cache: {
            ttl: CacheConstants.CACHE_CONFIG.CHAIN_SCAN_TOKEN_INFO.TTL,
          },
        }
      );
      return response.data.result;
    } catch (error) {
      this.logger.error(error, 'Error while fetching contract creation details from etherscan');
      return [];
    }
  }
}
