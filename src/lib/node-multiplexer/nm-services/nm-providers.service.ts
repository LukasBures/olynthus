import { ethers } from 'ethers';
import Web3 from 'web3';
import { NodeUtils } from '..';
import { CustomLogger } from '../../logger/logger';
import type { Chains } from '../nm-common/nm.constants';
import { Networks, NodeConstants } from '../nm-common/nm.constants';
import type { NodeProviderServiceBase } from './nm-provider-base.service';
import { NodeAnkrProviderService } from './nm-providers-services/nm-ankr.service';
import { NodeArchiveNodeIoProviderService } from './nm-providers-services/nm-archivenode-io.service';
import { NodeProtectedArchiveNodeProviderService } from './nm-providers-services/nm-protected-archive-node.service';
import { NodeProtectedFullNodeProviderService } from './nm-providers-services/nm-protected-full-node.service';
import { NodeBlockchainScanProviderService } from './nm-providers-services/nm-blockchain-scan.service';
import { NodeInfuraProviderService } from './nm-providers-services/nm-infura.service';

export class NodeProviderService {
  private logger: CustomLogger;

  private protectedFullNodes: { [key: string]: NodeProtectedFullNodeProviderService } = {};

  private protectedArchiveNodes: { [key: string]: NodeProtectedArchiveNodeProviderService } = {};

  private infuraNodes: { [key: string]: NodeInfuraProviderService } = {};

  private ankrProviders: { [key: string]: NodeAnkrProviderService } = {};

  private blockchainScanProviders: { [key: string]: NodeBlockchainScanProviderService } = {};

  private archiveNodeIo: { [key: string]: NodeArchiveNodeIoProviderService } = {};

  constructor() {
    this.logger = new CustomLogger(NodeProviderService.name);
  }

  // Getting Web3, JsonRpc,  provider for active/healthy node.
  async getActiveProviderForChain({
    providerName,
    providerType,
    chain,
    network = Networks.MAINNET,
  }: {
    providerName: NodeConstants.ProviderNames;
    providerType: NodeConstants.SupportedProviderTypes;
    chain: Chains;
    network: Networks;
  }) {
    const chainNetwork = `${chain}_${network}`;

    switch (providerName) {
      case NodeConstants.ProviderNames.PROTECTED_FULL_NODE: {
        if (!NodeUtils.PROTECTED_FULL_NODE[chain]?.[network]) return null;

        if (!this.protectedFullNodes[chainNetwork]) {
          this.protectedFullNodes[chainNetwork] = new NodeProtectedFullNodeProviderService();
          this.protectedFullNodes[chainNetwork].init(chain, network);
          this.logger.debug(`Initialized Protected Full Node Provider for ${chain} ${network}`);
        }
        if (await this.protectedFullNodes[chainNetwork].isActive())
          return this.protectedFullNodes[chainNetwork].selectProvider(providerType);
        else return null;
      }

      case NodeConstants.ProviderNames.PROTECTED_ARCHIVE_NODE: {
        if (!NodeUtils.PROTECTED_ARCHIVE_NODE[chain]?.[network]) return null;

        if (!this.protectedArchiveNodes[chainNetwork]) {
          this.protectedArchiveNodes[chainNetwork] = new NodeProtectedArchiveNodeProviderService();
          this.protectedArchiveNodes[chainNetwork].init(chain, network);
          this.logger.debug(`Initialized Protected Archive Node Provider for ${chain} ${network}`);
        }
        if (await this.protectedArchiveNodes[chainNetwork].isActive())
          return this.protectedArchiveNodes[chainNetwork].selectProvider(providerType);
        else return null;
      }

      case NodeConstants.ProviderNames.INFURA_NODE: {
        if (!NodeUtils.INFURA_NODE[chain]?.[network]) return null;

        if (!this.infuraNodes[chainNetwork]) {
          this.infuraNodes[chainNetwork] = new NodeInfuraProviderService();
          this.infuraNodes[chainNetwork].init(chain, network);
          this.logger.debug(`Initialized Infura Provider for ${chain} ${network}`);
        }
        if (await this.infuraNodes[chainNetwork].isActive())
          return this.infuraNodes[chainNetwork].selectProvider(providerType);
        else return null;
      }

      case NodeConstants.ProviderNames.ANKR_NODE: {
        if (!NodeUtils.ANKR_NODE[chain]?.[network]) return null;

        if (!this.ankrProviders[chainNetwork]) {
          this.ankrProviders[chainNetwork] = new NodeAnkrProviderService();
          this.ankrProviders[chainNetwork].init(chain, network);
          this.logger.debug(`Initialized Ankr Provider for ${chain} ${network}`);
        }
        if (await this.ankrProviders[chainNetwork].isActive())
          return this.ankrProviders[chainNetwork].selectProvider(providerType);
        else return null;
      }

      case NodeConstants.ProviderNames.ARCHIVE_NODE_IO_NODE: {
        if (!NodeUtils.ARCHIVE_NODE_IO[chain]?.[network]) return null;

        if (!this.archiveNodeIo[chainNetwork]) {
          this.archiveNodeIo[chainNetwork] = new NodeArchiveNodeIoProviderService();
          this.archiveNodeIo[chainNetwork].init(chain, network);
          this.logger.debug(`Initialized Archive Node Io Provider for ${chain} ${network}`);
        }
        if (await this.archiveNodeIo[chainNetwork].isActive())
          return this.archiveNodeIo[chainNetwork].selectProvider(providerType);
        else return null;
      }

      case NodeConstants.ProviderNames.BLOCKCHAIN_SCAN: {
        if (!NodeUtils.BLOCKCHAIN_SCAN_API_URL[chain]?.[network]) return null;

        if (!this.blockchainScanProviders[chainNetwork]) {
          this.blockchainScanProviders[chainNetwork] = new NodeBlockchainScanProviderService();
          this.blockchainScanProviders[chainNetwork].init(chain, network);
          this.logger.debug(`Initialized Blockchain Scan Provider for ${chain} ${network}`);
        }
        if (await this.blockchainScanProviders[chainNetwork].isActive())
          return this.blockchainScanProviders[chainNetwork];
        else return null;
      }
    }
  }

  async getProviderForMethod({
    chain,
    methodName,
    providerType,
    network,
  }: {
    chain: Chains;
    methodName: NodeConstants.PriorityForMethodKeys;
    providerType: NodeConstants.SupportedProviderTypes;
    network?: Networks;
  }): Promise<
    Array<
      | ethers.providers.JsonRpcProvider
      | Web3
      | ethers.providers.WebSocketProvider
      | NodeBlockchainScanProviderService
      | NodeProviderServiceBase
    >
  > {
    const priorityArr = NodeConstants.ProviderPrioritiesForMethods[methodName];
    const activeProvider = [];
    if (priorityArr) {
      for (let i = 0; i < priorityArr.length; i++) {
        if (Array.isArray(priorityArr[i])) {
          for (let j = 0; j < priorityArr[i].length; j++) {
            const foundProvider = await this.getActiveProviderForChain({
              chain,
              providerName: priorityArr[i][j] as NodeConstants.ProviderNames,
              providerType,
              network,
            });
            if (foundProvider) activeProvider.push(foundProvider);
            else activeProvider.push(null);
          }
          return activeProvider;
        } else {
          const foundProvider = await this.getActiveProviderForChain({
            chain,
            providerName: priorityArr[i] as NodeConstants.ProviderNames,
            providerType,
            network,
          });
          if (foundProvider) return [foundProvider];
        }
      }
    }
  }

  async getJsonRpcProviderForMethod({
    chain,
    methodName,
    network,
  }: {
    chain: Chains;
    methodName: NodeConstants.PriorityForMethodKeys;
    network?: Networks;
  }): Promise<ethers.providers.JsonRpcProvider> {
    const provider = await this.getProviderForMethod({
      chain,
      methodName,
      providerType: NodeConstants.SupportedProviderTypes.JSON_RPC,
      network,
    });
    if (provider[0] && provider[0] instanceof ethers.providers.JsonRpcProvider) return provider[0];
    else return undefined;
  }

  async getWeb3ProviderForMethod({
    chain,
    methodName,
    network = Networks.MAINNET,
  }: {
    chain: Chains;
    methodName: NodeConstants.PriorityForMethodKeys;
    network: Networks;
  }): Promise<Web3> {
    const providers = await this.getProviderForMethod({
      chain,
      methodName,
      providerType: NodeConstants.SupportedProviderTypes.WEB3,
      network,
    });
    if (providers && providers[0] instanceof Web3) return providers[0];
    return undefined;
  }
}
