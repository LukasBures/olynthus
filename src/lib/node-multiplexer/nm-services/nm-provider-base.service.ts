import { ethers } from 'ethers';
import Web3 from 'web3';
import { NodeConstants } from '../nm-common/nm.constants';
export abstract class NodeProviderServiceBase {
  protected httpProviderUrl: string;

  protected webSocketProviderUrl: string;

  public web3: Web3;

  public jsonRpcProvider: ethers.providers.JsonRpcProvider;

  abstract isActive(): Promise<boolean>;

  // can be overridden in subclasses
  initProvider(httpUrl: string) {
    // Initializing Providers.
    this.web3 = new Web3(httpUrl);
    this.jsonRpcProvider = new ethers.providers.JsonRpcProvider(httpUrl);
  }

  // Common Methods
  getHttpProviderUrl(): string {
    return this.httpProviderUrl;
  }

  getWebSocketProviderUrl(): string {
    return this.webSocketProviderUrl;
  }

  getWeb3Provider(): Web3 {
    return this.web3;
  }

  getJsonRpcProvider(): ethers.providers.JsonRpcProvider {
    return this.jsonRpcProvider;
  }

  selectProvider(
    providerType: NodeConstants.SupportedProviderTypes
  ): Web3 | ethers.providers.JsonRpcProvider | ethers.providers.WebSocketProvider {
    if (providerType === NodeConstants.SupportedProviderTypes.WEB3) {
      return this.web3;
    } else if (providerType === NodeConstants.SupportedProviderTypes.JSON_RPC) {
      return this.jsonRpcProvider;
    }
  }
}
