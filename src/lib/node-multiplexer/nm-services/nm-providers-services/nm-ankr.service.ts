import { CustomLogger } from '../../../logger/logger';
import type { Chains } from '../../nm-common/nm.constants';
import { Networks } from '../../nm-common/nm.constants';
import { NodeProviderServiceBase } from '../nm-provider-base.service';
import { NodeUtils } from '../../nm-common/nm.util';

export class NodeAnkrProviderService extends NodeProviderServiceBase {
  private chain: Chains;

  private network: Networks;

  private logger: CustomLogger;

  init(chain: Chains, network: Networks = Networks.MAINNET) {
    this.chain = chain;
    this.network = network;
    this.httpProviderUrl = NodeUtils.getAnkrNodeHttpUrl(chain, network);
    this.logger = new CustomLogger(NodeAnkrProviderService.name);
    this.initProvider(this.httpProviderUrl);
  }

  // doesn't exist for free plan
  getWebSocketProviderUrl(): string {
    return undefined;
  }

  async isActive(): Promise<boolean> {
    try {
      const result = await this.web3?.eth.net.isListening();
      return result;
    } catch (error) {
      this.logger.error(
        error,
        `ankr provider is not active for chain ${this.chain} & network ${this.network}`
      );
      return false;
    }
  }
}
