import { ethers } from 'ethers';
import Web3 from 'web3';
import { CustomLogger } from '../../../logger/logger';
import type { Chains } from '../../nm-common/nm.constants';
import { Networks } from '../../nm-common/nm.constants';
import { NodeProviderServiceBase } from '../nm-provider-base.service';
import { NodeUtils } from '../../nm-common/nm.util';

export class NodeProtectedFullNodeProviderService extends NodeProviderServiceBase {
  private chain: Chains;

  private network: Networks;

  private logger: CustomLogger;

  init(chain: Chains, network: Networks = Networks.MAINNET) {
    this.chain = chain;
    this.network = network;
    this.httpProviderUrl = NodeUtils.getProtectedFullNodeHttpUrl(chain, network);
    this.initProvider();

    this.logger = new CustomLogger(NodeProtectedFullNodeProviderService.name);
  }

  initProvider(): void {
    this.web3 = new Web3(
      new Web3.providers.HttpProvider(process.env.NODE_PROTECTED_FULL_NODE_ETH_MAINNET, {
        headers: [
          {
            name: 'Authorization',
            value: `Basic ${Buffer.from(
              `${process.env.NODE_PROTECTED_FULL_NODE_ETH_MAINNET_USERNAME}:${process.env.NODE_PROTECTED_FULL_NODE_ETH_MAINNET_PASSWORD}`
            ).toString('base64')}`,
          },
        ],
      })
    );

    this.jsonRpcProvider = new ethers.providers.JsonRpcProvider({
      url: process.env.NODE_PROTECTED_FULL_NODE_ETH_MAINNET,
      user: process.env.NODE_PROTECTED_FULL_NODE_ETH_MAINNET_USERNAME,
      password: process.env.NODE_PROTECTED_FULL_NODE_ETH_MAINNET_PASSWORD,
    });
  }

  async isActive(): Promise<boolean> {
    try {
      const result = await this.web3?.eth.net.isListening();
      return result;
    } catch (error) {
      this.logger.error(
        error,
        `protected full node provider is not active for chain ${this.chain} & network ${this.network}`
      );
      return false;
    }
  }
}
