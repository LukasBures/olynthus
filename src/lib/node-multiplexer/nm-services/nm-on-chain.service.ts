import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';
import Web3 from 'web3';
import { CustomLogger } from '../../logger/logger';
import type { Networks, Chains } from '../nm-common/nm.constants';
import { NodeConstants } from '../nm-common/nm.constants';
import { NodeBlockchainScanProviderService } from './nm-providers-services/nm-blockchain-scan.service';
import { NodeProviderService } from './nm-providers.service';
import { CommonConstants } from '../../../constants/common.constants';
import type { Contract } from 'web3-eth-contract';
import { keccak256, toUtf8Bytes } from 'ethers/lib/utils';

export class NodeOnChainService {
  private providerService: NodeProviderService;

  private logger: CustomLogger;

  public approveSigHash: string;

  public safeApproveSigHash: string;

  public increaseAllowanceSighHash: string;

  public setApprovalForAllSigHash: string;

  public transferSighash: string;

  public safeTransferSigHash: string;

  public transferFromSigHash: string;

  public safeTransferFrom_1_SigHash: string;

  public safeTransferFrom_2_SigHash: string;

  public safeTransferFrom_3_SigHash: string;

  public safeBatchTransferFromSigHash: string;

  private approvalSigHashes: string[];

  private transferSigHashes: string[];

  constructor() {
    this.providerService = new NodeProviderService();
    this.logger = new CustomLogger(NodeOnChainService.name);

    this.approveSigHash = keccak256(toUtf8Bytes('approve(address,uint256)')).substring(0, 10);
    this.safeApproveSigHash = keccak256(toUtf8Bytes('safeApprove(address,uint256)')).substring(
      0,
      10
    );
    this.increaseAllowanceSighHash = keccak256(
      toUtf8Bytes('increaseAllowance(address,uint256)')
    ).substring(0, 10);
    this.setApprovalForAllSigHash = keccak256(
      toUtf8Bytes('setApprovalForAll(address,bool)')
    ).substring(0, 10);
    this.transferSighash = keccak256(toUtf8Bytes('transfer(address,uint256)')).substring(0, 10);
    this.safeTransferSigHash = keccak256(toUtf8Bytes('safeTransfer(address,uint256)')).substring(
      0,
      10
    );
    this.transferFromSigHash = keccak256(
      toUtf8Bytes('transferFrom(address,address,uint256)')
    ).substring(0, 10);
    this.safeTransferFrom_1_SigHash = keccak256(
      toUtf8Bytes('safeTransferFrom(address,address,uint256)')
    ).substring(0, 10);
    this.safeTransferFrom_2_SigHash = keccak256(
      toUtf8Bytes('safeTransferFrom(address,address,uint256,uint256,bytes)')
    ).substring(0, 10);
    this.safeTransferFrom_3_SigHash = keccak256(
      toUtf8Bytes('safeTransferFrom(address,address,uint256,bytes)')
    ).substring(0, 10);
    this.safeBatchTransferFromSigHash = keccak256(
      toUtf8Bytes('safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)')
    ).substring(0, 10);

    this.approvalSigHashes = [
      this.approveSigHash,
      this.safeApproveSigHash,
      this.setApprovalForAllSigHash,
      this.increaseAllowanceSighHash,
    ];

    this.transferSigHashes = [
      this.transferSighash,
      this.safeTransferSigHash,
      this.transferFromSigHash,
      this.safeTransferFrom_1_SigHash,
      this.safeTransferFrom_2_SigHash,
      this.safeTransferFrom_3_SigHash,
      this.safeBatchTransferFromSigHash,
    ];
  }

  async isAddressAContract(address: string, chain: Chains, network: Networks) {
    if (!address) return false;
    try {
      const [jsonRpcProvider] = await this.providerService.getProviderForMethod({
        chain,
        methodName: NodeConstants.PriorityForMethodKeys.FULL_NODE,
        providerType: NodeConstants.SupportedProviderTypes.JSON_RPC,
        network,
      });
      if (jsonRpcProvider instanceof ethers.providers.JsonRpcProvider) {
        const code = await jsonRpcProvider.getCode(address);
        if (code === '0x') return false;
        else return true;
      }
    } catch (error) {
      this.logger.error(error);
      return false;
    }
  }

  async getContractFromWeb3({
    abi,
    address,
    chain,
    network,
    archive = true,
  }: {
    abi: [];
    address: string;
    chain: Chains;
    network: Networks;
    archive?: boolean;
  }): Promise<Contract> {
    const [web3Provider] = await this.providerService.getProviderForMethod({
      chain,
      methodName: archive
        ? NodeConstants.PriorityForMethodKeys.ARCHIVE_NODE
        : NodeConstants.PriorityForMethodKeys.FULL_NODE,
      providerType: NodeConstants.SupportedProviderTypes.WEB3,
      network,
    });
    if (web3Provider instanceof Web3) {
      return new web3Provider.eth.Contract(abi, address);
    }
  }

  getAbiParamValue(param) {
    if (typeof param === 'object' && param.type === 'BigNumber')
      return new BigNumber(Object.values(param)[1] as string).toNumber();
    else return param.toString();
  }

  async getCounterPartyTypeDetails(address: string, chain: Chains, network: Networks) {
    const isContract = await this.isAddressAContract(address, chain, network);

    const counterpartyType = isContract
      ? CommonConstants.CounterpartyTypes.UNVERIFIED_CONTRACT
      : CommonConstants.CounterpartyTypes.EOA;
    if (counterpartyType === CommonConstants.CounterpartyTypes.EOA) return counterpartyType;
    const isVerifiedContract = (await this.getContractDetails(address, chain, network))?.isVerified;
    //If we get undefined in return value, we cannot be sure if the contract is not verified or if one of our async function calls just failed
    //hence if we get undefined as return, we will not flag the contract as unverified.
    if (isVerifiedContract !== undefined && !isVerifiedContract) {
      return CommonConstants.CounterpartyTypes.UNVERIFIED_CONTRACT;
    }
    return CommonConstants.CounterpartyTypes.VERIFIED_CONTRACT;
  }

  async getContractDetails(contractAddress: string, chain: Chains, network: Networks) {
    try {
      const availableProviders = await this.providerService.getProviderForMethod({
        chain,
        methodName: NodeConstants.PriorityForMethodKeys.CONTRACT_DETAILS,
        providerType: NodeConstants.SupportedProviderTypes.API,
        network,
      });

      const chainScanProvider = availableProviders
        ? (availableProviders.find(
            (provider) => provider instanceof NodeBlockchainScanProviderService
          ) as NodeBlockchainScanProviderService)
        : null;

      if (chainScanProvider) {
        return await chainScanProvider.getContractDetails(contractAddress);
      } else {
        this.logger.error(
          `No Active ChainScan provider found to get contract verification details on ${chain} ${network}`
        );
        return undefined;
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  async resolveENSName(ensName: string, chain: Chains, network: Networks) {
    try {
      const provider = await this.providerService.getJsonRpcProviderForMethod({
        chain,
        methodName: NodeConstants.PriorityForMethodKeys.FULL_NODE,
        network,
      });
      if (provider instanceof ethers.providers.JsonRpcProvider) {
        return await provider.resolveName(ensName);
      }
      return null;
    } catch (err) {
      this.logger.error(err, `Error in resolving ENS name ${ensName}`);
      throw err; // ! Note: Rethrowing the error to check if the name is an invalid name in Service method and send response accordingly.
    }
  }

  checkIfApprovalOrTransferFunction(input: string): string | undefined {
    //we are hashing the function signature to find the function_sighash instead of hardcoding the function_sighashes to improve the readability of the code
    //ToDo - safeERC functions which accept the contract interface of tokens are not added in these checks since their behavior is yet to be understood.
    const functionSignature = input.substring(0, 10);
    if (this.approvalSigHashes.includes(functionSignature)) {
      return 'APPROVE';
    } else if (this.transferSigHashes.includes(functionSignature)) {
      return 'TRANSFER';
    }
    return undefined;
  }

  async getContractCreationDetails(address: string, chain: Chains, network: Networks) {
    try {
      const providers = await this.providerService.getProviderForMethod({
        chain,
        methodName: NodeConstants.PriorityForMethodKeys.TOKEN_INFORMATION,
        providerType: NodeConstants.SupportedProviderTypes.API,
        network,
      });
      if (providers) {
        const chainScanProvider = providers.find(
          (provider) => provider instanceof NodeBlockchainScanProviderService
        ) as NodeBlockchainScanProviderService;
        const result = await chainScanProvider.getContractCreation([address]);

        const contractDetails = result.find(
          (details) => details.contractAddress.toLowerCase() === address.toLowerCase()
        );

        if (!contractDetails) return;

        const jsonRpcProvider = await this.getJsonRpcProvider(chain, network, true);
        const transaction = await jsonRpcProvider.getTransactionReceipt(contractDetails.txHash);
        const blockDetails = await jsonRpcProvider.getBlock(transaction.blockNumber);

        return {
          address: address,
          creationTime: blockDetails.timestamp,
          creationBlock: transaction.blockNumber,
          creationTxnHash: contractDetails.txHash,
          creator: contractDetails.contractCreator,
        };
      } else {
        this.logger.error(
          `No active provider found when trying to get Token Information for ${chain} ${network}`
        );
      }
    } catch (error) {
      this.logger.error(error);
      return undefined;
    }
  }

  async getDetailedContractInfo(address: string, chain: Chains, network: Networks) {
    try {
      const contractDetails = await Promise.all([
        this.getContractCreationDetails(address, chain, network),
        this.getTokenInformation(address, chain, network),
        this.getContractDetails(address, chain, network),
      ]);

      let contractName;
      if (CommonConstants.BurnAddresses.includes(address)) {
        contractName = 'Burn Address';
      } else {
        contractName = contractDetails[1]?.name ? contractDetails[1].name : contractDetails[2].name;
      }

      return {
        name: contractName,
        address: address,
        blockNumber: contractDetails[0]?.creationBlock,
        blockTimestamp: contractDetails[0]?.creationTime,
        txnHash: contractDetails[0]?.creationTxnHash,
        tokenType: contractDetails[1]?.token_type,
        isVerified: contractDetails[2]?.isVerified,
      };
    } catch (error) {
      this.logger.error(error);
    }
  }

  async getTokenInformation(address, chain: Chains, network: Networks) {
    try {
      const providers = await this.providerService.getProviderForMethod({
        chain,
        methodName: NodeConstants.PriorityForMethodKeys.TOKEN_INFORMATION,
        providerType: NodeConstants.SupportedProviderTypes.API,
        network,
      });
      if (providers) {
        const chainScanProvider = providers.find(
          (provider) => provider instanceof NodeBlockchainScanProviderService
        ) as NodeBlockchainScanProviderService;
        const tokenDetails = await chainScanProvider.getTokenDetails(address);

        let tokenType = tokenDetails.token_type;
        const erc20orErc721Tokens = [
          CommonConstants.TokenTypes.BEP20,
          CommonConstants.TokenTypes.ERC20,
          CommonConstants.TokenTypes.ERC721,
        ];

        // If tokenType is not of ERC 20 / 721, then check for ERC 1155
        if (!erc20orErc721Tokens.includes(tokenDetails.token_type)) {
          const contractAbi = (await this.getContractDetails(address, chain, network))?.abi;
          if (contractAbi) {
            let hasSupportInterfaceFunction = false;
            contractAbi.forEach((method: any) => {
              if (method.name === 'supportsInterface') hasSupportInterfaceFunction = true;
            });
            if (hasSupportInterfaceFunction) {
              const contract = await this.getContractFromWeb3({
                abi: contractAbi,
                address,
                chain,
                network,
              });
              const isErc1155 = await contract.methods.supportsInterface('0xd9b67a26').call();
              if (isErc1155) tokenType = CommonConstants.TokenTypes.ERC1155;
            }
          }
        }

        // Finally return the details
        return { ...tokenDetails, token_type: tokenType };
      } else {
        this.logger.error(
          `No active provider found when trying to get Token Information for ${chain} ${network}`
        );
      }
    } catch (error) {
      this.logger.error(error);
      return undefined;
    }
  }

  async getJsonRpcProvider(chain: Chains, network: Networks, archive = false) {
    let provider: ethers.providers.JsonRpcProvider;
    try {
      const jsonRpcProvider = await this.providerService.getJsonRpcProviderForMethod({
        chain,
        methodName: archive
          ? NodeConstants.PriorityForMethodKeys.ARCHIVE_NODE
          : NodeConstants.PriorityForMethodKeys.FULL_NODE,
        network,
      });
      if (jsonRpcProvider && jsonRpcProvider instanceof ethers.providers.JsonRpcProvider) {
        provider = jsonRpcProvider;
      } else {
        this.logger.error('error while initializing ethers.js provider');
      }
    } catch (error) {
      this.logger.error('error while initializing ethers.js provider', error.stack);
    }
    return provider;
  }

  async getWeb3Provider(chain: Chains, network: Networks) {
    let provider: Web3;
    try {
      const web3Provider = await this.providerService.getWeb3ProviderForMethod({
        chain,
        methodName: NodeConstants.PriorityForMethodKeys.FULL_NODE,
        network,
      });
      if (web3Provider && web3Provider instanceof Web3) {
        provider = web3Provider;
      } else {
        this.logger.error('error while initializing web3 https provider for aave');
      }
    } catch (error) {
      this.logger.error('error while initializing web3 https provider for aave', error.stack);
    }
    return provider;
  }
}
