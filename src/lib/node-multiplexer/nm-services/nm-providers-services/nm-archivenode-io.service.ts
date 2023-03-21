import { CustomLogger } from '../../../logger/logger';
import type { Chains } from '../../nm-common/nm.constants';
import { Networks } from '../../nm-common/nm.constants';
import { NodeProviderServiceBase } from '../nm-provider-base.service';
import { NodeUtils } from '../../nm-common/nm.util';

export class NodeArchiveNodeIoProviderService extends NodeProviderServiceBase {
  private chain: Chains;

  private network: Networks;

  private logger: CustomLogger;

  constructor() {
    super();
    this.logger = new CustomLogger(NodeArchiveNodeIoProviderService.name);
  }

  init(chain: Chains, network: Networks = Networks.MAINNET) {
    this.chain = chain;
    this.network = network;
    this.httpProviderUrl = NodeUtils.getArchiveNodeIoNodeHttpUrl(chain, network);
    this.initProvider(this.httpProviderUrl);
  }

  async isActive(): Promise<boolean> {
    try {
      const result = await this.web3?.eth.net.isListening();
      return result;
    } catch (error) {
      this.logger.error(
        error,
        `archivenode.io provider is not active for chain ${this.chain} & network ${this.network}`
      );
      return false;
    }
  }
}
