import type { Chains } from '../../nm-common/nm.constants';
import { Networks } from '../../nm-common/nm.constants';
import { NodeProviderServiceBase } from '../nm-provider-base.service';
import { NodeUtils } from '../../nm-common/nm.util';
import { CustomLogger } from '../../../logger/logger';

export class NodeInfuraProviderService extends NodeProviderServiceBase {
  private chain: Chains;

  private network: Networks;

  private logger: CustomLogger;

  init(chain: Chains, network: Networks = Networks.MAINNET) {
    this.chain = chain;
    this.network = network;
    this.httpProviderUrl = NodeUtils.getInfuraNodeHttpUrl(chain, network);
    this.logger = new CustomLogger(NodeInfuraProviderService.name);
    this.initProvider(this.httpProviderUrl);
  }

  async isActive(): Promise<boolean> {
    try {
      const result = await this.web3?.eth.net.isListening();
      return result;
    } catch (error) {
      this.logger.error(
        error,
        `infura provider is not active for chain ${this.chain} & network ${this.network}`
      );
      return false;
    }
  }
}
