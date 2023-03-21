import { ethers } from 'ethers';
import Web3 from 'web3';
import { NodeUtils } from '../..';
import { CustomLogger } from '../../../logger/logger';
import type { Chains } from '../../nm-common/nm.constants';
import { Networks } from '../../nm-common/nm.constants';
import { NodeProviderServiceBase } from '../nm-provider-base.service';

export class NodeProtectedArchiveNodeProviderService extends NodeProviderServiceBase {
  private chain: Chains;

  private network: Networks;

  private logger: CustomLogger;

  init(chain: Chains, network: Networks = Networks.MAINNET) {
    this.chain = chain;
    this.network = network;
    this.httpProviderUrl = NodeUtils.getProtectedArchiveNodeHttpUrl(chain, network);
    this.initProvider();

    this.logger = new CustomLogger(NodeProtectedArchiveNodeProviderService.name);
  }

  initProvider(): void {
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(process.env.NODE_PROTECTED_ARCHIVE_NODE_ETH_MAINNET, {
        headers: [
          {
            name: 'Authorization',
            value: `Basic ${Buffer.from(
              `${process.env.NODE_PROTECTED_ARCHIVE_NODE_ETH_MAINNET_USERNAME}:${process.env.NODE_PROTECTED_ARCHIVE_NODE_ETH_MAINNET_PASSWORD}`
            ).toString('base64')}`,
          },
        ],
      })
    );

    this.jsonRpcProvider = new ethers.providers.JsonRpcProvider({
      url: process.env.NODE_PROTECTED_ARCHIVE_NODE_ETH_MAINNET,
      user: process.env.NODE_PROTECTED_ARCHIVE_NODE_ETH_MAINNET_USERNAME,
      password: process.env.NODE_PROTECTED_ARCHIVE_NODE_ETH_MAINNET_PASSWORD,
    });
  }

  async isActive(): Promise<boolean> {
    try {
      const result = await this.web3?.eth.net.isListening();
      return result;
    } catch (error) {
      this.logger.error(
        error,
        `protected archive node provider is not active for chain ${this.chain} & network ${this.network}`
      );
      return false;
    }
  }
}
