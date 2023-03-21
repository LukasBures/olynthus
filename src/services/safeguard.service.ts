import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import _ from 'lodash';
import { CommonConstants } from '../constants/common.constants';
import { CustomLogger } from '../lib/logger/logger';
import type { Networks, Chains } from '../lib/node-multiplexer';
import { NodeConstants, NodeUtils, NodeMultiplexer } from '../lib/node-multiplexer';
import type { CommonTypes } from '../types/common.types';
import { CommonUtils } from '../utils/common.utils';
import { ClickhouseService } from './clickhouse.service';
import { DefillamaService } from './defillama.service';
import { SimpleHashService } from './simplehash.service';
import { TenderlyService } from './tenderly.service';

export class SafeguardService {
  private logger: CustomLogger;

  private simulationService: TenderlyService;

  private simpleHashService: SimpleHashService;

  private defillamaService: DefillamaService;

  private nodeMultiplexer: NodeMultiplexer;

  private databaseService: ClickhouseService;

  constructor() {
    this.nodeMultiplexer = new NodeMultiplexer();
    this.simulationService = new TenderlyService();
    this.databaseService = new ClickhouseService();
    this.simpleHashService = new SimpleHashService();
    this.defillamaService = new DefillamaService();

    this.logger = new CustomLogger(SafeguardService.name);

    BigNumber.config({ EXPONENTIAL_AT: 1e9 }); // don't display numbers in exponential notation
  }

  /**
   * Checks the risk profile of a transaction based on the following parameters:
   * @param chain - Chains
   * @param transaction - Transaction
   * @param metadata - Metadata
   * @returns - Promise<CommonTypes.TransactionRiskProfile>
   */
  async checkTransactionRiskProfiles(
    chain: Chains,
    network: Networks,
    transaction: CommonTypes.TransactionParams,
    metadata: CommonTypes.MetadataParams
  ) {
    if (transaction.to === '') {
      return {
        chain: chain,
        network: network,
        counterparty_details: {
          name: '',
        },
        tx_type: CommonConstants.SafeguardTxType.CONTRACT_CREATION,
        risk_profiles: {
          summary: {
            result: CommonConstants.SafeguardRiskProfilesSummary.ALLOW,
          },
        },
        simulation: {
          status: 'SUCCESS',
          failure_text: '',
          balances: [],
        },
      };
    }

    const counterPartyTypePromise = this.nodeMultiplexer.getCounterPartyTypeDetails(
      transaction.to,
      chain,
      network
    );
    const counterpartyDetailsPromise = this.nodeMultiplexer.getDetailedContractInfo(
      transaction.to,
      chain,
      network
    );
    const [counterPartyType, counterpartyDetails] = await Promise.all([
      counterPartyTypePromise,
      counterpartyDetailsPromise,
    ]);

    transaction.from = transaction.from.toLowerCase();
    transaction.to = transaction.to.toLowerCase();

    const txType = await this.getTransactionType(
      counterPartyType !== CommonConstants.CounterpartyTypes.EOA,
      transaction,
      network,
      chain
    );

    const highRiskProfilePromise = this.getHighRiskProfileDetails({
      toAddress: transaction.to,
      fromAddress: transaction.from,
      counterPartyType: counterPartyType,
      transactionData: transaction.data,
      metadata: {
        url: metadata?.url ? metadata.url : '',
      },
      maliciousCounterpartyTextPrefix: 'The contract',
      shouldCheckForApprovals: true,
      shouldCheckForBurns:
        txType === CommonConstants.SafeguardTxType.ERC20_TRANSFER ||
        txType === CommonConstants.SafeguardTxType.ERC721_TRANSFER ||
        txType === CommonConstants.SafeguardTxType.ERC1155_TRANSFER ||
        txType === CommonConstants.SafeguardTxType.EOA_INTERACTION,
      chain,
      network,
    });

    const mediumRiskProfilePromise = this.getMediumRiskProfileDetails({
      toAddress: transaction.to,
      counterPartyType: counterPartyType,
      chain,
      network,
      contractTextPrefix: 'The contract',
    });

    const lowRiskProfilePromise = this.getLowRiskProfileDetails({
      toAddress: transaction.to,
      counterPartyType: counterPartyType,
      chain,
      network,
      protocol: undefined,
    });

    const simulationPromise = this.simulationService.simulateTransaction(
      transaction,
      txType,
      chain,
      network
    );

    const [highRiskProfile, mediumRiskProfile, lowRiskProfile, simulation] = await Promise.all([
      highRiskProfilePromise,
      mediumRiskProfilePromise,
      lowRiskProfilePromise,
      simulationPromise,
    ]);

    this.logger.debug(
      `The transaction type given transaction is ${txType}`,
      JSON.stringify(transaction, null, 2)
    );

    const data = [];
    if (
      highRiskProfile.highRiskProfileCount > 0 &&
      highRiskProfile.highRiskProfileDetails.length !== 0
    ) {
      data.push(...highRiskProfile.highRiskProfileDetails);
    }
    if (
      mediumRiskProfile.mediumRiskProfileCount > 0 &&
      mediumRiskProfile.mediumRiskProfileDetails.length !== 0
    ) {
      data.push(...mediumRiskProfile.mediumRiskProfileDetails);
    }
    if (
      lowRiskProfile.lowRiskProfileCount > 0 &&
      lowRiskProfile.lowRiskProfileDetails.length !== 0
    ) {
      data.push(...lowRiskProfile.lowRiskProfileDetails);
    }
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const risk_profiles = {
      summary: {
        result:
          highRiskProfile.highRiskProfileCount > 0 || mediumRiskProfile.mediumRiskProfileCount > 0
            ? CommonConstants.SafeguardRiskProfilesSummary.BLOCK
            : lowRiskProfile.lowRiskProfileCount > 0
            ? CommonConstants.SafeguardRiskProfilesSummary.WARN
            : CommonConstants.SafeguardRiskProfilesSummary.ALLOW,
        counts: [
          {
            risk_profile_type: CommonConstants.SafeguardRiskProfileType.LOW,
            count: lowRiskProfile.lowRiskProfileCount,
          },
          {
            risk_profile_type: CommonConstants.SafeguardRiskProfileType.MEDIUM,
            count: mediumRiskProfile.mediumRiskProfileCount,
          },
          {
            risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
            count: highRiskProfile.highRiskProfileCount,
          },
        ],
      },
      data: data,
    };

    return {
      chain: chain,
      network: network,
      counterparty_details: {
        name: counterpartyDetails ? counterpartyDetails.name : '',
      },
      tx_type: txType,
      risk_profiles: risk_profiles,
      simulation: simulation,
    };
  }

  /**
   * Checks the risk profiles for a message
   * @param chain - The chain for which the risk profiles are to be checked
   * @param message - CommonTypes.GeneralMessageParams
   * @param metadata - MetadataDTO
   * @returns - Risk Profiles for a message
   */

  async checkMessageRiskProfiles(
    chain: Chains,
    network: Networks,
    message: CommonTypes.GeneralMessageParams,
    metadata: CommonTypes.MetadataParams
  ) {
    message.domain.verifyingContract = message.domain.verifyingContract.toLowerCase();
    if (
      message.primaryType === CommonConstants.SafeguardMessagePrimaryType.PERMIT &&
      (CommonUtils.isType(message.message, CommonConstants.DAIPermitMessage) ||
        CommonUtils.isType(message.message, CommonConstants.ERC20PermitMessage) ||
        CommonUtils.isType(message.message, CommonConstants.ERC721PermitMessage))
    ) {
      message.message.spender = message.message.spender.toLowerCase();
      let fromAddress;
      let approvalValue;

      let messageType;
      let deadline;

      //Check if DAI Permit then set fromAddress and approvalValue

      if (CommonUtils.isType(message.message, CommonConstants.DAIPermitMessage)) {
        fromAddress = message.message.holder;
        approvalValue = message.message.allowed
          ? new BigNumber(CommonConstants.SAFEGUARD.MAX_APPROVAL, 16).toString()
          : '0';
        deadline = CommonUtils.convertToMilliSeconds(message.message.expiry);
        messageType = CommonConstants.SafeguardTxType.ERC20_APPROVAL;
      } else if (CommonUtils.isType(message.message, CommonConstants.ERC721PermitMessage)) {
        fromAddress = message.message.owner;
        approvalValue = '0';
        deadline = CommonUtils.convertToMilliSeconds(message.message.deadline);
        messageType = CommonConstants.SafeguardTxType.ERC721_APPROVAL;
      } else if (CommonUtils.isType(message.message, CommonConstants.ERC20PermitMessage)) {
        fromAddress = message.message.owner;
        approvalValue = message.message.value;
        deadline = CommonUtils.convertToMilliSeconds(message.message.deadline);
        messageType = CommonConstants.SafeguardTxType.ERC20_APPROVAL;
      }

      const verifyingContractCounterPartyTypePromise =
        this.nodeMultiplexer.getCounterPartyTypeDetails(
          message.domain.verifyingContract,
          chain,
          network
        );

      const spenderCounterPartyTypePromise = this.nodeMultiplexer.getCounterPartyTypeDetails(
        message.message.spender,
        chain,
        network
      );

      const [verifyingContractCounterPartyType, spenderCounterPartyType] = await Promise.all([
        verifyingContractCounterPartyTypePromise,
        spenderCounterPartyTypePromise,
      ]);

      const verifyingContractHighRiskProfilePromise = this.getHighRiskProfileDetails({
        toAddress: message.domain.verifyingContract,
        counterPartyType: verifyingContractCounterPartyType,
        metadata: {
          url: metadata?.url ? metadata.url : '',
        },
        maliciousCounterpartyTextPrefix: 'The verifying contract',
        shouldCheckForApprovals: false, // need not check approvals since verifying contract is not the `to`
        shouldCheckForBurns: false,
        chain,
        network,
      });

      const verifyingContractMediumRiskProfilePromise = this.getMediumRiskProfileDetails({
        toAddress: message.domain.verifyingContract,
        counterPartyType: verifyingContractCounterPartyType,
        chain,
        network,
        contractTextPrefix: 'The verifying contract',
      });

      let tokenDetails;
      if (verifyingContractCounterPartyType !== CommonConstants.CounterpartyTypes.EOA) {
        tokenDetails = await this.nodeMultiplexer.getTokenInformation(
          message.domain.verifyingContract,
          chain,
          network
        );
      }
      if (tokenDetails) {
        const tokenPriceInfo = await CommonUtils.getTokenInformationFromDefillama(
          chain,
          network,
          message.domain.verifyingContract
        );
        if (tokenPriceInfo) {
          tokenDetails.price_usd = tokenPriceInfo.price;
          tokenDetails.decimals = tokenPriceInfo.decimals;
        }
      }

      const spenderHighRiskProfilePromise = this.getHighRiskProfileDetails({
        toAddress: message.message.spender,
        counterPartyType: spenderCounterPartyType,
        fromAddress: fromAddress,
        value: approvalValue,
        maliciousCounterpartyTextPrefix: 'The spender',
        shouldCheckForApprovals: true,
        tokenDetails: tokenDetails,
        shouldCheckForBurns: false,
        deadline,
        chain,
        network,
        // skipping the metadata here to avoid duplicate details
      });

      const spenderMediumRiskProfilePromise = this.getMediumRiskProfileDetails({
        toAddress: message.message.spender,
        counterPartyType: spenderCounterPartyType,
        chain,
        network,
        contractTextPrefix: 'The spender',
      });

      const [
        spenderHighRiskProfile,
        spenderMediumRiskProfile,
        contractHighRiskProfile,
        contractMediumRiskProfile,
      ] = await Promise.all([
        spenderHighRiskProfilePromise,
        spenderMediumRiskProfilePromise,
        verifyingContractHighRiskProfilePromise,
        verifyingContractMediumRiskProfilePromise,
      ]);

      if (verifyingContractCounterPartyType === CommonConstants.CounterpartyTypes.EOA) {
        contractHighRiskProfile.highRiskProfileCount += 1;
        contractHighRiskProfile.highRiskProfileDetails.push({
          risk_type: CommonConstants.SafeguardRiskType.MALICIOUS_COUNTERPARTY,
          risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
          text: `The verifying contract ${message.domain.verifyingContract} is a private address`,
          details: {
            malicious_counterparty: {
              address: message.domain.verifyingContract,
              type: 'EOA',
            },
          },
        });
      }

      if (spenderHighRiskProfile.highRiskProfileDetails.length > 0) {
        const largeApprovalRisk = spenderHighRiskProfile.highRiskProfileDetails.find(
          (risk) => risk.risk_type === CommonConstants.SafeguardRiskType.LARGE_APPROVAL
        );
        if (largeApprovalRisk) {
          largeApprovalRisk.details.approvals.push({
            spender: message.message.spender,
            approval_value: approvalValue,
            from: fromAddress,
            token: {
              address: message.domain.verifyingContract,
              name: tokenDetails?.symbol || '',
            },
          });
        }
      }

      contractHighRiskProfile.highRiskProfileCount += spenderHighRiskProfile.highRiskProfileCount;
      contractHighRiskProfile.highRiskProfileDetails.push(
        ...spenderHighRiskProfile.highRiskProfileDetails
      );

      contractMediumRiskProfile.mediumRiskProfileCount +=
        spenderMediumRiskProfile.mediumRiskProfileCount;
      contractMediumRiskProfile.mediumRiskProfileDetails.push(
        ...spenderMediumRiskProfile.mediumRiskProfileDetails
      );

      const data = [
        ...(contractHighRiskProfile.highRiskProfileCount > 0
          ? contractHighRiskProfile.highRiskProfileDetails
          : []),
        ...(contractMediumRiskProfile.mediumRiskProfileCount > 0
          ? contractMediumRiskProfile.mediumRiskProfileDetails
          : []),
      ].filter((item) => item.length !== 0);

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const risk_profiles = {
        summary: {
          result:
            contractHighRiskProfile.highRiskProfileCount > 0 ||
            contractMediumRiskProfile.mediumRiskProfileCount > 0
              ? CommonConstants.SafeguardRiskProfilesSummary.BLOCK
              : CommonConstants.SafeguardRiskProfilesSummary.ALLOW,
          counts: [
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.LOW,
              count: 0,
            },
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.MEDIUM,
              count: contractMediumRiskProfile.mediumRiskProfileCount,
            },
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
              count: contractHighRiskProfile.highRiskProfileCount,
            },
          ],
        },
        data: data,
      };

      return {
        chain: chain,
        network: network,
        message_type: messageType,
        risk_profiles: risk_profiles,
      };
    } else if (
      message.primaryType === CommonConstants.SafeguardMessagePrimaryType.ORDER_COMPONENTS &&
      CommonUtils.isType(message.message, CommonConstants.SeaportOrderMessage)
    ) {
      const verifyingContractCounterPartyType =
        await this.nodeMultiplexer.getCounterPartyTypeDetails(
          message.domain.verifyingContract,
          chain,
          network
        );

      const messageType =
        message.message.offer[0].itemType === CommonConstants.SeaportItemType.ERC721
          ? CommonConstants.SafeguardTxType.ERC721_TRANSFER
          : CommonConstants.SafeguardTxType.ERC1155_TRANSFER;

      const verifyingContractHighRiskProfilePromise = this.getHighRiskProfileDetails({
        toAddress: message.domain.verifyingContract,
        counterPartyType: verifyingContractCounterPartyType,
        metadata: {
          url: metadata?.url ? metadata.url : '',
        },
        maliciousCounterpartyTextPrefix: 'The verifying contract',
        shouldCheckForApprovals: false, // need not check approvals since verifying contract is not the `to`
        shouldCheckForBurns: false,
        chain,
        network,
      });

      const verifyingContractMediumRiskProfilePromise = this.getMediumRiskProfileDetails({
        toAddress: message.domain.verifyingContract,
        counterPartyType: verifyingContractCounterPartyType,
        chain,
        network,
        contractTextPrefix: 'The verifying contract',
      });

      const seaportMessageDetailsPromise = this.getSeaportMessageRiskProfileDetails({
        offerer: message.message.offerer,
        offer: message.message.offer,
        consideration: message.message.consideration,
        chain,
        network,
      });

      const [contractHighRiskProfile, contractMediumRiskProfile, seaportMessageDetails] =
        await Promise.all([
          verifyingContractHighRiskProfilePromise,
          verifyingContractMediumRiskProfilePromise,
          seaportMessageDetailsPromise,
        ]);

      if (seaportMessageDetails.length > 0) {
        seaportMessageDetails.forEach((risk) => {
          if (risk.risk_profile_type === CommonConstants.SafeguardRiskProfileType.HIGH) {
            contractHighRiskProfile.highRiskProfileCount += 1;
            contractHighRiskProfile.highRiskProfileDetails.push(risk);
          } else if (risk.risk_profile_type === CommonConstants.SafeguardRiskProfileType.MEDIUM) {
            contractMediumRiskProfile.mediumRiskProfileCount += 1;
            contractMediumRiskProfile.mediumRiskProfileDetails.push(risk);
          }
        });
      }

      const data = [
        ...(contractHighRiskProfile.highRiskProfileCount > 0
          ? contractHighRiskProfile.highRiskProfileDetails
          : []),
        ...(contractMediumRiskProfile.mediumRiskProfileCount > 0
          ? contractMediumRiskProfile.mediumRiskProfileDetails
          : []),
      ].filter((item) => item.length !== 0);

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const risk_profiles = {
        summary: {
          result:
            contractHighRiskProfile.highRiskProfileCount > 0 ||
            contractMediumRiskProfile.mediumRiskProfileCount > 0
              ? CommonConstants.SafeguardRiskProfilesSummary.BLOCK
              : CommonConstants.SafeguardRiskProfilesSummary.ALLOW,
          counts: [
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.LOW,
              count: 0,
            },
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.MEDIUM,
              count: contractMediumRiskProfile.mediumRiskProfileCount,
            },
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
              count: contractHighRiskProfile.highRiskProfileCount,
            },
          ],
        },
        data: data,
      };

      return {
        chain: chain,
        network: network,
        message_type: messageType,
        risk_profiles: risk_profiles,
      };
    } else if (message.primaryType === CommonConstants.SafeguardMessagePrimaryType.BULK_ORDER) {
      const allOrders: CommonTypes.SeaportMessageType[] = message.message.tree.flat(
        CommonConstants.OpenseaSeaportBulkOrderMaxTreeDepth
      );
      const validOrders = allOrders.filter(
        (item) =>
          item.offerer !== '0x0000000000000000000000000000000000000000' ||
          item.offer.length !== 0 ||
          item.consideration.length !== 0 ||
          item.startTime !== '0' ||
          item.endTime !== '0'
      );
      this.logger.debug(`Found ${validOrders.length} listing for bulk opensea seaport bulk order`);
      const verifyingContractCounterPartyType =
        await this.nodeMultiplexer.getCounterPartyTypeDetails(
          message.domain.verifyingContract,
          chain,
          network
        );
      const verifyingContractHighRiskProfilePromise = this.getHighRiskProfileDetails({
        toAddress: message.domain.verifyingContract,
        counterPartyType: verifyingContractCounterPartyType,
        metadata: {
          url: metadata?.url ? metadata.url : '',
        },
        maliciousCounterpartyTextPrefix: 'The verifying contract',
        shouldCheckForApprovals: false, // need not check approvals since verifying contract is not the `to`
        shouldCheckForBurns: false,
        chain,
        network,
      });

      const verifyingContractMediumRiskProfilePromise = this.getMediumRiskProfileDetails({
        toAddress: message.domain.verifyingContract,
        counterPartyType: verifyingContractCounterPartyType,
        chain,
        network,
        contractTextPrefix: 'The verifying contract',
      });
      const seaportOffers: CommonTypes.SeaportOfferItem[] = [];
      const seaportConsiderations: CommonTypes.SeaportConsiderationItem[] = [];
      for (const orderMessage of validOrders) {
        seaportOffers.push(...orderMessage.offer);
        seaportConsiderations.push(...orderMessage.consideration);
      }

      const seaportMessageDetailsPromise = this.getSeaportMessageRiskProfileDetails({
        offerer: validOrders[0].offerer, //When the offerer creates a bulk listing, the offerer is the same for all the orders
        offer: seaportOffers,
        consideration: seaportConsiderations,
        chain,
        network,
      });

      const [contractHighRiskProfile, contractMediumRiskProfile, seaportMessageDetails] =
        await Promise.all([
          verifyingContractHighRiskProfilePromise,
          verifyingContractMediumRiskProfilePromise,
          seaportMessageDetailsPromise,
        ]);

      seaportMessageDetails.flat(2).forEach((riskInfo) => {
        if (riskInfo.risk_profile_type === CommonConstants.SafeguardRiskProfileType.HIGH) {
          contractHighRiskProfile.highRiskProfileCount += 1;
          contractHighRiskProfile.highRiskProfileDetails.push(riskInfo);
        } else if (riskInfo.risk_profile_type === CommonConstants.SafeguardRiskProfileType.MEDIUM) {
          contractMediumRiskProfile.mediumRiskProfileCount += 1;
          contractMediumRiskProfile.mediumRiskProfileDetails.push(riskInfo);
        }
      });

      const data = [
        ...(contractHighRiskProfile.highRiskProfileCount > 0
          ? contractHighRiskProfile.highRiskProfileDetails
          : []),
        ...(contractMediumRiskProfile.mediumRiskProfileCount > 0
          ? contractMediumRiskProfile.mediumRiskProfileDetails
          : []),
      ].filter((item) => item.length !== 0);

      const riskProfiles = {
        summary: {
          result:
            contractHighRiskProfile.highRiskProfileCount > 0 ||
            contractMediumRiskProfile.mediumRiskProfileCount > 0
              ? CommonConstants.SafeguardRiskProfilesSummary.BLOCK
              : CommonConstants.SafeguardRiskProfilesSummary.ALLOW,
          counts: [
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.LOW,
              count: 0,
            },
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.MEDIUM,
              count: contractMediumRiskProfile.mediumRiskProfileCount,
            },
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
              count: contractHighRiskProfile.highRiskProfileCount,
            },
          ],
        },
        data: data,
      };

      return {
        chain: chain,
        network: network,
        risk_profiles: riskProfiles,
      };
    } else if (
      (message.primaryType === CommonConstants.SafeguardMessagePrimaryType.PERMIT_SINGLE &&
        CommonUtils.isType(message.message, CommonConstants.PermitSingleMessage)) ||
      (message.primaryType === CommonConstants.SafeguardMessagePrimaryType.PERMIT_TRANSFER_FROM &&
        CommonUtils.isType(message.message, CommonConstants.PermitTransferFromMessage)) ||
      (message.primaryType ===
        CommonConstants.SafeguardMessagePrimaryType.PERMIT_WITNESS_TRANSFER_FROM &&
        CommonUtils.isType(message.message, CommonConstants.PermitWitnessTransferFromMessage))
    ) {
      const messageType = CommonConstants.SafeguardTxType.PERMIT2;

      let approvalValue;
      let tokenAddress;
      let deadline;
      if (CommonUtils.isType(message.message, CommonConstants.PermitSingleMessage)) {
        approvalValue = message.message.details.amount;
        tokenAddress = message.message.details.token;
        deadline = CommonUtils.convertToMilliSeconds(message.message.details.expiration);
      } else if (CommonUtils.isType(message.message, CommonConstants.PermitTransferFromMessage)) {
        approvalValue = message.message.permitted.amount;
        tokenAddress = message.message.permitted.token;
        deadline = CommonUtils.convertToMilliSeconds(message.message.deadline);
      }

      const verifyingContractCounterPartyTypePromise =
        this.nodeMultiplexer.getCounterPartyTypeDetails(
          message.domain.verifyingContract,
          chain,
          network
        );

      const spenderCounterPartyTypePromise = this.nodeMultiplexer.getCounterPartyTypeDetails(
        message.message.spender,
        chain,
        network
      );

      const permittedTokenCounterPartyTypePromise = this.nodeMultiplexer.getCounterPartyTypeDetails(
        tokenAddress,
        chain,
        network
      );

      const [
        verifyingContractCounterPartyType,
        spenderCounterPartyType,
        permittedTokenCounterPartyType,
      ] = await Promise.all([
        verifyingContractCounterPartyTypePromise,
        spenderCounterPartyTypePromise,
        permittedTokenCounterPartyTypePromise,
      ]);

      const verifyingContractHighRiskProfilePromise = this.getHighRiskProfileDetails({
        toAddress: message.domain.verifyingContract,
        counterPartyType: verifyingContractCounterPartyType,
        metadata: {
          url: metadata?.url ? metadata.url : '',
        },
        maliciousCounterpartyTextPrefix: 'The verifying contract',
        shouldCheckForApprovals: false, // need not check approvals since verifying contract is not the `to`
        shouldCheckForBurns: false,
        chain,
        network,
      });

      const verifyingContractMediumRiskProfilePromise = this.getMediumRiskProfileDetails({
        toAddress: message.domain.verifyingContract,
        counterPartyType: verifyingContractCounterPartyType,
        chain,
        network,
        contractTextPrefix: 'The verifying contract',
      });

      let tokenDetails;
      if (permittedTokenCounterPartyType !== CommonConstants.CounterpartyTypes.EOA) {
        tokenDetails = await this.nodeMultiplexer.getTokenInformation(tokenAddress, chain, network);
      }
      if (tokenDetails) {
        const tokenPriceInfo = await CommonUtils.getTokenInformationFromDefillama(
          chain,
          network,
          tokenAddress
        );
        if (tokenPriceInfo) {
          tokenDetails.price_usd = tokenPriceInfo.price;
          tokenDetails.decimals = tokenPriceInfo.decimals;
        }
      }

      const spenderHighRiskProfilePromise = this.getHighRiskProfileDetails({
        toAddress: message.message.spender,
        counterPartyType: spenderCounterPartyType,
        fromAddress: '',
        value: approvalValue,
        maliciousCounterpartyTextPrefix: 'The spender',
        shouldCheckForApprovals: true,
        tokenDetails: tokenDetails,
        shouldCheckForBurns: false,
        chain,
        network,
        deadline,
      });

      const spenderMediumRiskProfilePromise = this.getMediumRiskProfileDetails({
        toAddress: message.message.spender,
        counterPartyType: spenderCounterPartyType,
        chain,
        network,
        contractTextPrefix: 'The spender',
      });

      const [
        spenderHighRiskProfile,
        spenderMediumRiskProfile,
        contractHighRiskProfile,
        contractMediumRiskProfile,
      ] = await Promise.all([
        spenderHighRiskProfilePromise,
        spenderMediumRiskProfilePromise,
        verifyingContractHighRiskProfilePromise,
        verifyingContractMediumRiskProfilePromise,
      ]);

      if (verifyingContractCounterPartyType === CommonConstants.CounterpartyTypes.EOA) {
        contractHighRiskProfile.highRiskProfileCount += 1;
        contractHighRiskProfile.highRiskProfileDetails.push({
          risk_type: CommonConstants.SafeguardRiskType.MALICIOUS_COUNTERPARTY,
          risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
          text: `The verifying contract ${message.domain.verifyingContract} is a private address`,
          details: {
            malicious_counterparty: {
              address: message.domain.verifyingContract,
              type: 'EOA',
            },
          },
        });
      }

      if (spenderHighRiskProfile.highRiskProfileDetails.length > 0) {
        const largeApprovalRisk = spenderHighRiskProfile.highRiskProfileDetails.find(
          (risk) => risk.risk_type === CommonConstants.SafeguardRiskType.LARGE_APPROVAL
        );
        if (largeApprovalRisk) {
          largeApprovalRisk.details.approvals.push({
            spender: message.message.spender,
            approval_value: approvalValue,
            from: '',
            token: {
              address: tokenAddress,
              name: tokenDetails?.symbol || '',
            },
          });
        }
      }

      contractHighRiskProfile.highRiskProfileCount += spenderHighRiskProfile.highRiskProfileCount;
      contractHighRiskProfile.highRiskProfileDetails.push(
        ...spenderHighRiskProfile.highRiskProfileDetails
      );

      contractMediumRiskProfile.mediumRiskProfileCount +=
        spenderMediumRiskProfile.mediumRiskProfileCount;
      contractMediumRiskProfile.mediumRiskProfileDetails.push(
        ...spenderMediumRiskProfile.mediumRiskProfileDetails
      );

      const data = [
        ...(contractHighRiskProfile.highRiskProfileCount > 0
          ? contractHighRiskProfile.highRiskProfileDetails
          : []),
        ...(contractMediumRiskProfile.mediumRiskProfileCount > 0
          ? contractMediumRiskProfile.mediumRiskProfileDetails
          : []),
      ].filter((item) => item.length !== 0);

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const risk_profiles = {
        summary: {
          result:
            contractHighRiskProfile.highRiskProfileCount > 0 ||
            contractMediumRiskProfile.mediumRiskProfileCount > 0
              ? CommonConstants.SafeguardRiskProfilesSummary.BLOCK
              : CommonConstants.SafeguardRiskProfilesSummary.ALLOW,
          counts: [
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.LOW,
              count: 0,
            },
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.MEDIUM,
              count: contractMediumRiskProfile.mediumRiskProfileCount,
            },
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
              count: contractHighRiskProfile.highRiskProfileCount,
            },
          ],
        },
        data: data,
      };

      return {
        chain: chain,
        network: network,
        message_type: messageType,
        risk_profiles: risk_profiles,
      };
    } else if (
      (message.primaryType === CommonConstants.SafeguardMessagePrimaryType.PERMIT_BATCH &&
        CommonUtils.isType(message.message, CommonConstants.PermitBatchMessage)) ||
      (message.primaryType ===
        CommonConstants.SafeguardMessagePrimaryType.PERMIT_BATCH_TRANSFER_FROM &&
        CommonUtils.isType(message.message, CommonConstants.PermitBatchTransferFromMessage)) ||
      (message.primaryType ===
        CommonConstants.SafeguardMessagePrimaryType.PERMIT_BATCH_WITNESS_TRANSFER_FROM &&
        CommonUtils.isType(message.message, CommonConstants.PermitBatchWitnessTransferFromMessage))
    ) {
      let permitBatchData: CommonTypes.FormattedPermitBatchType[] = [];
      const messageType = CommonConstants.SafeguardTxType.PERMIT2;

      if (CommonUtils.isType(message.message, CommonConstants.PermitBatchMessage)) {
        permitBatchData = CommonUtils.formatPermitBatchData(message.message);
      } else if (
        CommonUtils.isType(message.message, CommonConstants.PermitBatchTransferFromMessage)
      ) {
        permitBatchData = CommonUtils.formatPermitBatchData(message.message);
      } else if (
        CommonUtils.isType(message.message, CommonConstants.PermitBatchWitnessTransferFromMessage)
      ) {
        permitBatchData = CommonUtils.formatPermitBatchData(message.message);
      }

      const verifyingContractCounterPartyTypePromise =
        this.nodeMultiplexer.getCounterPartyTypeDetails(
          message.domain.verifyingContract,
          chain,
          network
        );

      const spenderCounterPartyTypePromise = this.nodeMultiplexer.getCounterPartyTypeDetails(
        message.message.spender,
        chain,
        network
      );

      const [verifyingContractCounterPartyType, spenderCounterPartyType] = await Promise.all([
        verifyingContractCounterPartyTypePromise,
        spenderCounterPartyTypePromise,
      ]);

      const verifyingContractHighRiskProfilePromise = this.getHighRiskProfileDetails({
        toAddress: message.domain.verifyingContract,
        counterPartyType: verifyingContractCounterPartyType,
        metadata: {
          url: metadata?.url ? metadata.url : '',
        },
        maliciousCounterpartyTextPrefix: 'The verifying contract',
        shouldCheckForApprovals: false, // need not check approvals since verifying contract is not the `to`
        shouldCheckForBurns: false,
        chain,
        network,
      });

      const verifyingContractMediumRiskProfilePromise = this.getMediumRiskProfileDetails({
        toAddress: message.domain.verifyingContract,
        counterPartyType: verifyingContractCounterPartyType,
        chain,
        network,
        contractTextPrefix: 'The verifying contract',
      });

      const spenderHighRiskProfilePromise = this.getHighRiskProfileDetails({
        toAddress: message.message.spender,
        counterPartyType: spenderCounterPartyType,
        fromAddress: '',
        maliciousCounterpartyTextPrefix: 'The spender',
        shouldCheckForApprovals: false,
        shouldCheckForBurns: false,
        chain,
        network,
      });

      const spenderMediumRiskProfilePromise = this.getMediumRiskProfileDetails({
        toAddress: message.message.spender,
        counterPartyType: spenderCounterPartyType,
        chain,
        network,
        contractTextPrefix: 'The spender',
      });

      const permitBatchApprovalCheckPromise = this.checkApprovalsForBatchPermits(
        permitBatchData,
        chain,
        network,
        spenderCounterPartyType
      );

      const [
        spenderHighRiskProfile,
        spenderMediumRiskProfile,
        contractHighRiskProfile,
        contractMediumRiskProfile,
        permitBatchApprovalCheck,
      ] = await Promise.all([
        spenderHighRiskProfilePromise,
        spenderMediumRiskProfilePromise,
        verifyingContractHighRiskProfilePromise,
        verifyingContractMediumRiskProfilePromise,
        permitBatchApprovalCheckPromise,
      ]);

      contractHighRiskProfile.highRiskProfileCount += spenderHighRiskProfile.highRiskProfileCount;
      contractHighRiskProfile.highRiskProfileDetails.push(
        ...spenderHighRiskProfile.highRiskProfileDetails
      );

      contractMediumRiskProfile.mediumRiskProfileCount +=
        spenderMediumRiskProfile.mediumRiskProfileCount;
      contractMediumRiskProfile.mediumRiskProfileDetails.push(
        ...spenderMediumRiskProfile.mediumRiskProfileDetails
      );

      contractHighRiskProfile.highRiskProfileCount += permitBatchApprovalCheck.length;
      contractHighRiskProfile.highRiskProfileDetails.push(...permitBatchApprovalCheck);

      const data = [
        ...(contractHighRiskProfile.highRiskProfileCount > 0
          ? contractHighRiskProfile.highRiskProfileDetails
          : []),
        ...(contractMediumRiskProfile.mediumRiskProfileCount > 0
          ? contractMediumRiskProfile.mediumRiskProfileDetails
          : []),
      ].filter((item) => item.length !== 0);

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const risk_profiles = {
        summary: {
          result:
            contractHighRiskProfile.highRiskProfileCount > 0 ||
            contractMediumRiskProfile.mediumRiskProfileCount > 0
              ? CommonConstants.SafeguardRiskProfilesSummary.BLOCK
              : CommonConstants.SafeguardRiskProfilesSummary.ALLOW,
          counts: [
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.LOW,
              count: 0,
            },
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.MEDIUM,
              count: contractMediumRiskProfile.mediumRiskProfileCount,
            },
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
              count: contractHighRiskProfile.highRiskProfileCount,
            },
          ],
        },
        data: data,
      };

      return {
        chain: chain,
        network: network,
        message_type: messageType,
        risk_profiles: risk_profiles,
      };
    } else {
      return {
        chain: chain,
        network: network,
        message_type: message.primaryType,
        risk_profiles: {
          summary: {
            result: CommonConstants.SafeguardRiskProfilesSummary.ALLOW,
          },
        },
      };
    }
  }

  /**
   * Get risk profile details for the user
   * @param chain - chain id
   * @param user - CommonTypes.UserParams
   * @returns - Risk profile details for the user
   */

  async checkUserRiskProfile(chain: Chains, network: Networks, user: CommonTypes.UserParams) {
    let userAddress;
    try {
      userAddress = user.address
        ? user.address
        : await this.nodeMultiplexer.resolveENSName(user.ens, chain, network);
    } catch (error) {
      if (error.reason === 'invalid ENS name')
        throw new Error(['user.ens should be valid a ENS name'].toString());
    }

    if (userAddress) {
      const userTypeDetails = await this.nodeMultiplexer.getCounterPartyTypeDetails(
        userAddress,
        chain,
        network
      );

      const userHighRiskProfilePromise = this.getHighRiskProfileDetails({
        toAddress: userAddress,
        counterPartyType: userTypeDetails,
        maliciousCounterpartyTextPrefix: 'The user',
        shouldCheckForApprovals: false,
        shouldCheckForBurns: false,
        chain,
        network,
      });

      const userMediumRiskProfilePromise = this.getMediumRiskProfileDetails({
        toAddress: userAddress,
        counterPartyType: userTypeDetails,
        chain,
        network,
        contractTextPrefix: 'The user',
      });

      const userLowRiskProfilePromise = this.getLowRiskProfileDetails({
        toAddress: userAddress,
        counterPartyType: userTypeDetails,
        chain,
        network,
      });

      const [userHighRiskProfile, userMediumRiskProfile, userLowRiskProfile] = await Promise.all([
        userHighRiskProfilePromise,
        userMediumRiskProfilePromise,
        userLowRiskProfilePromise,
      ]);

      const data = [
        ...(userHighRiskProfile.highRiskProfileCount > 0
          ? userHighRiskProfile.highRiskProfileDetails
          : []),
        ...(userMediumRiskProfile.mediumRiskProfileCount > 0
          ? userMediumRiskProfile.mediumRiskProfileDetails
          : []),
        ...(userLowRiskProfile.lowRiskProfileCount > 0
          ? userLowRiskProfile.lowRiskProfileDetails
          : []),
      ].filter((item) => item.length !== 0);

      const riskProfiles = {
        summary: {
          result:
            userHighRiskProfile.highRiskProfileCount > 0 ||
            userMediumRiskProfile.mediumRiskProfileCount > 0
              ? CommonConstants.SafeguardRiskProfilesSummary.BLOCK
              : CommonConstants.SafeguardRiskProfilesSummary.ALLOW,
          counts: [
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.LOW,
              count: userLowRiskProfile.lowRiskProfileCount,
            },
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.MEDIUM,
              count: userMediumRiskProfile.mediumRiskProfileCount,
            },
            {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
              count: userHighRiskProfile.highRiskProfileCount,
            },
          ],
        },
        data: data,
      };

      return {
        chain: chain,
        network: network,
        user: {
          address: userAddress,
          ens: user.ens ? user.ens : null,
          type: userTypeDetails,
        },
        risk_profiles: riskProfiles,
      };
    } else {
      return {
        chain: chain,
        network: network,
        user: {
          address: userAddress,
          ens: user.ens ? user.ens : null,
        },
        risk_profiles: {
          summary: {
            result: CommonConstants.SafeguardRiskProfilesSummary.ALLOW,
          },
        },
      };
    }
  }

  /**
   * Get Transaction Type
   * @param isContract - boolean
   * @param transaction - TransactionParams
   * @param network - Networks
   * @param chain - Chains
   * @returns - Promise<CommonConstants.SafeguardTxType>
   */
  private async getTransactionType(isContract, transaction, network, chain) {
    if (isContract) {
      this.logger.debug(`The address ${transaction.to} is a smart contract`);

      const isERCToken = await this.isContractERCToken(transaction.to, network, chain);

      if (isERCToken.status) {
        this.logger.debug(`The address ${transaction.to} is an ERC token`);
        //First 10 digits of transaction input (data) will have the function signature hash - we can compare this hash to ERC function hashes
        const functionName = this.nodeMultiplexer.checkIfApprovalOrTransferFunction(
          transaction.data
        );
        if (isERCToken.value === CommonConstants.TokenTypes.ERC20) {
          if (functionName === 'APPROVE') {
            return CommonConstants.SafeguardTxType.ERC20_APPROVAL;
          } else if (functionName === 'TRANSFER') {
            return CommonConstants.SafeguardTxType.ERC20_TRANSFER;
          } else {
            return CommonConstants.SafeguardTxType.ERC20_INTERACTION;
          }
        } else if (isERCToken.value === CommonConstants.TokenTypes.ERC721) {
          if (functionName === 'APPROVE') {
            return CommonConstants.SafeguardTxType.ERC721_APPROVAL;
          } else if (functionName === 'TRANSFER') {
            return CommonConstants.SafeguardTxType.ERC721_TRANSFER;
          } else {
            return CommonConstants.SafeguardTxType.ERC721_INTERACTION;
          }
        } else if (isERCToken.value === CommonConstants.TokenTypes.ERC1155) {
          if (functionName === 'APPROVE') {
            return CommonConstants.SafeguardTxType.ERC1155_APPROVAL;
          } else if (functionName === 'TRANSFER') {
            return CommonConstants.SafeguardTxType.ERC1155_TRANSFER;
          } else {
            return CommonConstants.SafeguardTxType.ERC1155_INTERACTION;
          }
        }
      } else {
        return CommonConstants.SafeguardTxType.CONTRACT_INTERACTION;
      }
    } else {
      return CommonConstants.SafeguardTxType.EOA_INTERACTION;
    }
  }

  /**
   * Checks if the contract is an ERC Token
   * @param address - contract address
   * @param network - network
   * @param chain - chain
   * @returns - Promise<{status: boolean, value: CommonConstants.TokenTypes}>
   */
  private async isContractERCToken(address: string, network: Networks, chain: Chains) {
    this.logger.debug(`Checking if the contract ${address} is an ERC Token`);

    let status = false;
    let value = null;

    const tokenDetails = await this.nodeMultiplexer.getTokenInformation(address, chain, network);
    this.logger.debug(`Found contract details for address ${address}`);

    if (tokenDetails) {
      if (
        tokenDetails.token_type === CommonConstants.TokenTypes.ERC20 ||
        tokenDetails.token_type === CommonConstants.TokenTypes.BEP20
      ) {
        status = true;
        value = CommonConstants.TokenTypes.ERC20;
      } else if (tokenDetails.token_type === CommonConstants.TokenTypes.ERC721) {
        status = true;
        value = CommonConstants.TokenTypes.ERC721;
      } else if (tokenDetails.token_type === CommonConstants.TokenTypes.ERC1155) {
        status = true;
        value = CommonConstants.TokenTypes.ERC1155;
      }
    }

    return {
      status: status,
      value: value,
    };
  }

  /**
   * Get high risk profile details
   * @param data - TransactionDTO or CommonTypes.GeneralMessageParams
   * @param isContract - boolean
   * @param metadata - MetadataDTO
   * @returns - Promise<{highRiskProfileCount: number, highRiskProfileDetails: any[]}>
   */
  private async getHighRiskProfileDetails(data: CommonTypes.HighRiskInputData) {
    let highRiskProfileCount = 0;
    const highRiskProfileDetails = [];
    const approvalsCheckPromise = data.shouldCheckForApprovals
      ? this.approvalsCheck({
          toAddress: data.toAddress,
          fromAddress: data.fromAddress,
          transactionData: data.transactionData ? data.transactionData : undefined,
          value: data.value ? data.value : undefined,
          counterPartyType: data.counterPartyType,
          tokenDetails: data.tokenDetails,
          deadline: data.deadline,
          chain: data.chain,
          network: data.network,
        })
      : Promise.resolve(null);
    const ercBurnsCheckPromise = data.shouldCheckForBurns
      ? this.checkERCBurnRisks(
          data.toAddress,
          data.counterPartyType !== CommonConstants.CounterpartyTypes.EOA,
          data.chain,
          data.network
        )
      : Promise.resolve(null);
    const maliciousContractCheckPromise = this.isMaliciousCounterparty({
      address: data.toAddress,
      isContract: data.counterPartyType !== CommonConstants.CounterpartyTypes.EOA,
      maliciousCounterpartyTextPrefix: data.maliciousCounterpartyTextPrefix,
      chain: data.chain,
      network: data.network,
    });
    const maliciousDomainCheckPromise =
      data.metadata && data.metadata.url ? this.isMaliciousDomain(data.metadata.url) : null;
    const insecureDomainCheckPromise =
      data.metadata && data.metadata.url ? this.isInsecureDomain(data.metadata.url) : null;

    const [
      ercBurnsChecks,
      approvalsChecks,
      maliciousContractCheck,
      insecureDomainCheck,
      maliciousDomainCheck,
    ] = await Promise.all([
      ercBurnsCheckPromise,
      approvalsCheckPromise,
      maliciousContractCheckPromise,
      insecureDomainCheckPromise,
      maliciousDomainCheckPromise,
    ]);

    if (ercBurnsChecks) {
      ercBurnsChecks.forEach((risk) => {
        highRiskProfileDetails.push(risk);
        highRiskProfileCount++;
      });
    }

    if (approvalsChecks) {
      approvalsChecks.forEach((risk) => {
        highRiskProfileDetails.push(risk);
        highRiskProfileCount++;
      });
    }
    if (maliciousContractCheck) {
      highRiskProfileDetails.push(maliciousContractCheck);
      highRiskProfileCount++;
    }
    if (insecureDomainCheck) {
      highRiskProfileDetails.push(insecureDomainCheck);
      highRiskProfileCount++;
    }
    if (maliciousDomainCheck) {
      highRiskProfileDetails.push(maliciousDomainCheck);
      highRiskProfileCount++;
    }

    return {
      highRiskProfileDetails: highRiskProfileDetails,
      highRiskProfileCount: highRiskProfileCount,
    };
  }

  /**
   *  Get medium risk profile details
   * @param address - string
   * @param isContract - boolean
   * @param chain - Chains
   * @param network - Networks
   * @returns - Promise<{mediumRiskProfileDetails: any[]; mediumRiskProfileCount: number}>
   */

  private async getMediumRiskProfileDetails(data: CommonTypes.MediumRiskInputData) {
    let mediumRiskProfileCount = 0;
    const mediumRiskProfileDetails = [];

    if (data.counterPartyType !== CommonConstants.CounterpartyTypes.EOA) {
      const newContractCheckPromise = this.isNewContract(
        data.toAddress,
        data.contractTextPrefix,
        data.chain,
        data.network
      );
      const contractVerificationDetailsPromise = this.getContractVerificationDetails(
        data.toAddress,
        data.counterPartyType,
        data.contractTextPrefix
      );

      const [newContractCheck, contractVerificationDetails] = await Promise.all([
        newContractCheckPromise,
        contractVerificationDetailsPromise,
      ]);
      if (newContractCheck) {
        mediumRiskProfileDetails.push(newContractCheck);
        mediumRiskProfileCount++;
      }

      if (contractVerificationDetails) {
        mediumRiskProfileDetails.push(contractVerificationDetails);
        mediumRiskProfileCount++;
      }
    }

    return {
      mediumRiskProfileDetails: mediumRiskProfileDetails,
      mediumRiskProfileCount: mediumRiskProfileCount,
    };
  }

  /**
   * For now, we are ignoring low risk profiles
   * Get low risk profile details
   * @returns - {lowRiskProfileDetails: any[]; lowRiskProfileCount: number}
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  private async getLowRiskProfileDetails(_data: CommonTypes.LowRiskInputData) {
    const lowRiskProfileCount = 0;
    const lowRiskProfileDetails = [];

    return {
      lowRiskProfileDetails: lowRiskProfileDetails,
      lowRiskProfileCount: lowRiskProfileCount,
    };
  }

  /** ERC-20 Burn related Checks
   * @param toAddress - Address to which the tokens is being transferred
   * @returns An array of ERC burns related risks
   */
  private async checkERCBurnRisks(
    toAddress: string,
    isRecipientContract: boolean,
    chain: Chains,
    network: Networks
  ) {
    const ercBurnRisks = [];
    if (isRecipientContract) {
      const tokenDetails = await this.nodeMultiplexer.getTokenInformation(
        toAddress,
        chain,
        network
      );
      if (tokenDetails) {
        //Transferring tokens to ERC-20 Token Contract
        const tokenName = tokenDetails.name;
        const tokenSymbol = tokenDetails.symbol;
        ercBurnRisks.push({
          risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
          risk_type: CommonConstants.SafeguardRiskType.TRANSFER_TO_TOKEN_CONTRACT,
          text: `This transaction transfers token(s) to the ${tokenName ? tokenName : ''}${
            tokenSymbol ? (tokenName ? ` (${tokenSymbol}) ` : `${tokenSymbol} `) : ''
          }ERC-20 Token Contract ${toAddress}`,
        });
      }
    } else {
      //The recipient is not a contract. Checking for Burn addresses.
      if (CommonConstants.BurnAddresses.includes(toAddress)) {
        ercBurnRisks.push({
          risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
          risk_type: CommonConstants.SafeguardRiskType.TRANSFER_TO_BURN_ADDRESS,
          text: 'This transaction transfers token(s) to the Burn Address ' + toAddress,
        });
      }
    }
    return ercBurnRisks;
  }

  /**
   * Checks for approvals to unverified contracts, approvals to EOAs and infinite approval.
   * TODO Add support for multi-call approvals
   * @param data - ApprovalInputData
   * @returns - An array of approval related risks
   */
  private async approvalsCheck(data: CommonTypes.ApprovalInputData) {
    const approvalRisks = [];
    const functionSighash = data.transactionData
      ? data.transactionData.substring(0, 10)
      : undefined;

    const isNormalApproval =
      functionSighash === this.nodeMultiplexer.approveSigHash ||
      functionSighash === this.nodeMultiplexer.safeApproveSigHash ||
      functionSighash === this.nodeMultiplexer.increaseAllowanceSighHash;

    const isApprovalForAll = functionSighash === this.nodeMultiplexer.setApprovalForAllSigHash;

    if (!(isNormalApproval || isApprovalForAll || data.value)) {
      return false;
    } else {
      if (data.counterPartyType !== CommonConstants.CounterpartyTypes.VERIFIED_CONTRACT) {
        const isContract =
          data.counterPartyType === CommonConstants.CounterpartyTypes.UNVERIFIED_CONTRACT;
        const riskType = isContract
          ? CommonConstants.SafeguardRiskType.APPROVAL_TO_UNVERIFIED_CONTRACT
          : CommonConstants.SafeguardRiskType.APPROVAL_TO_EOA;
        const textCounterPartySuffix = isContract ? 'unverified contract ' : 'private address ';
        approvalRisks.push({
          risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
          risk_type: riskType,
          text: 'This transaction asks for approval to ' + textCounterPartySuffix + data.toAddress,
        });
      }
      const relativeApprovalDays = data.deadline
        ? CommonUtils.getRelativeNumberOfDays(parseInt(data.deadline))
        : 0;
      if (relativeApprovalDays >= CommonConstants.SAFEGUARD.LONG_APPROVAL_THRESHOLD_IN_DAYS) {
        approvalRisks.push({
          risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
          risk_type: CommonConstants.SafeguardRiskType.LONG_APPROVAL,
          text: `This transaction asks for a long duration approval (${relativeApprovalDays} days)`,
        });
      }
    }

    if (isNormalApproval) {
      const approvals = [];
      let tokenAmount = new BigNumber(
        data.transactionData.substr(data.transactionData.length - 64),
        16
      );
      const approvalDetails = await this.decodeErcApprovals(
        data.transactionData,
        data.fromAddress,
        data.toAddress,
        functionSighash,
        data.chain,
        data.network
      );
      approvals.push(approvalDetails);
      const spender = approvalDetails.spender;
      if (spender) {
        const spenderCounterPartyType =
          // If data.toAddress === spender address AND data.counterPartyType exists, then use it
          // As of now, this method is being called from highRiskProfileDetails only
          // And data.counterPartyType is derived from data.toAddress, hence if spender === data.toAddress, then re-use
          spender.toLowerCase() === data.toAddress.toLowerCase() && data.counterPartyType
            ? data.counterPartyType
            : await this.nodeMultiplexer.getCounterPartyTypeDetails(
                spender,
                data.chain,
                data.network
              );

        if (spenderCounterPartyType !== CommonConstants.CounterpartyTypes.VERIFIED_CONTRACT) {
          const isContract =
            spenderCounterPartyType === CommonConstants.CounterpartyTypes.UNVERIFIED_CONTRACT;
          const riskType = isContract
            ? CommonConstants.SafeguardRiskType.APPROVAL_TO_UNVERIFIED_CONTRACT
            : CommonConstants.SafeguardRiskType.APPROVAL_TO_EOA;
          const textCounterPartySuffix = isContract
            ? 'unverified spender contract '
            : 'private spender address ';
          approvalRisks.push({
            risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
            risk_type: riskType,
            text: 'This transaction asks for approval to ' + textCounterPartySuffix + spender,
          });
          const spenderTextPrefix =
            spenderCounterPartyType === CommonConstants.CounterpartyTypes.EOA
              ? 'The private spender address '
              : 'The spender contract ';
          const maliciousSpenderDetails = await this.isMaliciousCounterparty({
            address: spender,
            isContract: data.counterPartyType !== CommonConstants.CounterpartyTypes.EOA,
            maliciousCounterpartyTextPrefix: spenderTextPrefix,
            chain: data.chain,
            network: data.network,
          });
          if (maliciousSpenderDetails) {
            approvalRisks.push(maliciousSpenderDetails);
          }
        }
      }
      let tokenName = approvalDetails.token.name;
      //adding a space after the token name and removing token name if empty for better UX
      tokenName = tokenName === '' ? '' : tokenName + ' ';

      const tokenDecimals = data.tokenDetails?.decimals;
      const tokenPriceUSD = data.tokenDetails?.price_usd;
      if (tokenDecimals && tokenDecimals > 0)
        tokenAmount = tokenAmount.div(Math.pow(10, tokenDecimals));
      let approvalAmountUSD;
      if (tokenDecimals && tokenPriceUSD) {
        approvalAmountUSD = tokenAmount.toNumber() * tokenPriceUSD;
      }
      const isLargeApproval = approvalAmountUSD
        ? approvalAmountUSD > CommonConstants.SAFEGUARD.LARGE_APPROVAL_THRESHOLD_USD
        : tokenDecimals
        ? tokenAmount.gt(CommonConstants.SAFEGUARD.LARGE_APPROVAL_THRESHOLD_TOKEN_COUNT)
        : tokenAmount.gt(new BigNumber(CommonConstants.SAFEGUARD.APPROVAL_FALLBACK_THRESHOLD, 16));
      if (isLargeApproval) {
        approvalRisks.push({
          risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
          risk_type: CommonConstants.SafeguardRiskType.LARGE_APPROVAL,
          text:
            'This transaction asks for a large approval of ' +
            tokenAmount.toNumber() +
            ' ' +
            tokenName +
            'tokens',
          details: {
            approvals: approvals,
          },
        });
      }
    } else if (isApprovalForAll) {
      const approvals = [];
      approvals.push(
        await this.decodeErcApprovals(
          data.transactionData,
          data.fromAddress,
          data.toAddress,
          functionSighash,
          data.chain,
          data.network
        )
      );
      approvalRisks.push({
        risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
        risk_type: CommonConstants.SafeguardRiskType.APPROVAL_ALL,
        text: 'This transaction asks for all approvals for ' + data.toAddress + ' token',
        details: {
          approvals: approvals,
        },
      });
    } else if (data.value) {
      let value = new BigNumber(data.value);
      const tokenDecimals = data.tokenDetails?.decimals;
      const tokenPriceUSD = data.tokenDetails?.price_usd;
      if (tokenDecimals && tokenDecimals > 0) value = value.div(Math.pow(10, tokenDecimals));
      let approvalAmountUSD;
      if (tokenDecimals && tokenPriceUSD) {
        approvalAmountUSD = value.toNumber() * tokenPriceUSD;
      }
      const isLargeApproval = approvalAmountUSD
        ? approvalAmountUSD > CommonConstants.SAFEGUARD.LARGE_APPROVAL_THRESHOLD_USD
        : tokenDecimals
        ? value.gt(CommonConstants.SAFEGUARD.LARGE_APPROVAL_THRESHOLD_TOKEN_COUNT)
        : value.gt(new BigNumber(CommonConstants.SAFEGUARD.APPROVAL_FALLBACK_THRESHOLD, 16));
      if (isLargeApproval) {
        approvalRisks.push({
          risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
          risk_type: CommonConstants.SafeguardRiskType.LARGE_APPROVAL,
          text: 'This transaction asks for a large approval of ' + value.toNumber() + ' tokens',
          details: {
            approvals: [],
          },
        });
      }
    }
    return approvalRisks;
  }

  /**
   * Checks if the address is a malicious counterparty
   * @param address - address to check
   * @param isContract - boolean
   * @returns - boolean
   */
  private async isMaliciousCounterparty({
    address,
    isContract,
    maliciousCounterpartyTextPrefix,
    chain,
    network,
  }: {
    address: string;
    isContract: boolean;
    maliciousCounterpartyTextPrefix: string;
    chain: Chains;
    network: Networks;
  }) {
    //check for transaction.to in malicious_counterparty table
    const maliciousCounterpartyDetails = await this.databaseService.getMaliciousCounterpartyDetails(
      address,
      chain,
      network
    );

    this.logger.debug(
      `Found ${maliciousCounterpartyDetails.length} entries for contract ${address}`
    );

    if (maliciousCounterpartyDetails.length === 0) {
      return false;
    }

    let labels = [];
    let tags = [];
    maliciousCounterpartyDetails.forEach((dict: CommonTypes.DatasetMaliciousCounterparty) => {
      labels = _.concat(labels, dict.labels);

      if (dict.address === address) {
        tags = _.concat(tags, dict.tags);
      } else if (dict.contract_creator === address && dict.contract_creator != null) {
        tags = _.concat(tags, dict.contract_creator_tags);
      }
    });
    const textPrefix = isContract ? `${maliciousCounterpartyTextPrefix}` : 'The EOA';
    return {
      risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
      risk_type: CommonConstants.SafeguardRiskType.MALICIOUS_COUNTERPARTY,
      text: `${textPrefix} ${address} is an identified malicious counterparty`,
      details: {
        labels: _.uniq(labels).filter((l) => l),
        malicious_counterparty: {
          address: address,
          type: isContract ? 'CONTRACT' : 'EOA',
        },
        tags: _.uniq(tags).filter((t) => t),
      },
    };
  }

  /**
   * Checks if the domain is insecure
   * @param url Valid url
   * @returns risk_profile for the URL (if insecure URL)
   */
  private async isInsecureDomain(url: string) {
    const validatedURL = new URL(url);
    if (validatedURL.protocol === 'http:') {
      this.logger.debug(`${url} is an insecure URL`);
      return {
        risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
        risk_type: CommonConstants.SafeguardRiskType.INSECURE_DOMAIN,
        text: 'The url ' + url + ' is an insecure URL',
      };
    }
    return false;
  }

  /**
   *  Checks if the contract is verified
   * @param address - Contract address
   * @param counterparty - Counterparty type
   * @param contractTextPrefix - Text prefix for the contract
   * @returns - Risk profile if contract is not verified
   */
  private async getContractVerificationDetails(
    address: string,
    counterparty: CommonConstants.CounterpartyTypes,
    contractTextPrefix: string
  ) {
    if (counterparty === CommonConstants.CounterpartyTypes.VERIFIED_CONTRACT) {
      return false;
    } else {
      return {
        risk_profile_type: CommonConstants.SafeguardRiskProfileType.MEDIUM,
        risk_type: CommonConstants.SafeguardRiskType.UNVERIFIED_CONTRACT,
        text: `${contractTextPrefix} ${address} is not verified`,
      };
    }
  }

  /**
   *  Checks if the contract is new
   * @param address - Contract address
   * @returns - Risk profile if contract is new
   */
  private async isNewContract(
    address: string,
    contractTextPrefix: string,
    chain: Chains,
    network: Networks
  ) {
    const contractDetails = await this.nodeMultiplexer.getDetailedContractInfo(
      address,
      chain,
      network
    );
    if (contractDetails) {
      const creationDate = new Date(contractDetails.blockTimestamp * 1000);
      const currentDate = new Date();
      if (
        currentDate.getTime() - creationDate.getTime() <=
        CommonConstants.SAFEGUARD.NEW_CONTRACT_THRESHOLD
      ) {
        return {
          risk_profile_type: CommonConstants.SafeguardRiskProfileType.MEDIUM,
          risk_type: CommonConstants.SafeguardRiskType.NEW_CONTRACT,
          text: `${contractTextPrefix} ${address} was created recently. Proceed with caution`,
          details: {
            contract: address,
            contract_created_at: creationDate,
          },
        };
      }
    }
    return false;
  }

  /**
   *  Decodes approval transaction
   * @param transactionData - Transactions data for approval transaction
   * @param from - valid from address
   * @param to - valid to address
   * @param functionSighash - Function signature hash
   * @returns - Decoded ERC20 approval transaction
   */
  private async decodeErcApprovals(
    transactionData: string,
    from: string,
    to: string,
    functionSighash: string,
    chain: Chains,
    network: Networks
  ) {
    //The transaction data will have 138 characters in case of approval (10 digits function sighash and 128 digits for two arguments)
    //If the length of data is not 138, the defaultAbiCoder.decode will throw an error and we will return the client a 500
    //Thus, the following handling is needed.
    if (transactionData.length !== 138) {
      return {
        spender: '',
        approval_value: '',
        from: from,
        token: {
          address: to,
          name: '',
        },
      };
    }
    if (
      functionSighash === this.nodeMultiplexer.approveSigHash ||
      functionSighash === this.nodeMultiplexer.safeApproveSigHash ||
      functionSighash === this.nodeMultiplexer.increaseAllowanceSighHash
    ) {
      //Hashing the function signatures every time instead of storing them as constants and passing them as arguments to improve readability of the code
      //And make it easier in the future to add more function checks.
      const approveData = ethers.utils.defaultAbiCoder.decode(
        ['address', 'uint256'],
        ethers.utils.hexDataSlice(transactionData, 4)
      );
      const approveValue = approveData[1]._hex;
      const tokenInformation = await this.nodeMultiplexer.getTokenInformation(to, chain, network);
      return {
        spender: approveData[0],
        approval_value: approveValue === true ? true : new BigNumber(approveValue.slice(2), 16),
        from: from,
        token: {
          address: to,
          name: tokenInformation?.symbol || '',
        },
      };
    } else if (functionSighash === this.nodeMultiplexer.setApprovalForAllSigHash) {
      const approveData = ethers.utils.defaultAbiCoder.decode(
        ['address', 'bool'],
        ethers.utils.hexDataSlice(transactionData, 4)
      );
      const tokenInformation = await this.nodeMultiplexer.getTokenInformation(to, chain, network);
      return {
        spender: approveData[0],
        approval_value: approveData[1],
        from: from,
        token: {
          address: to,
          name: tokenInformation.symbol || '',
        },
      };
    }
  }

  /**
   * Decodes ERC transfer transaction
   * @param transaction - Transaction data
   * @param functionSighash - Function signature hash
   * @param chain - Chain in which to check
   * @param network - Network in which to check
   * @returns - Decoded ERC20 transfer transaction
   */

  private decodeErcTransfers(transactionData, functionSighash) {
    if (
      functionSighash === this.nodeMultiplexer.transferSighash ||
      functionSighash === this.nodeMultiplexer.safeTransferSigHash
    ) {
      const transferData = ethers.utils.defaultAbiCoder.decode(
        ['address', 'uint256'],
        ethers.utils.hexDataSlice(transactionData, 4)
      );
      const transferValue = transferData[1]._hex;

      return {
        from: '',
        to: transferData[0],
        transfer_value:
          transferValue === true ? true : new BigNumber(transferValue.slice(2), 16).toNumber(),
      };
    } else if (
      functionSighash === this.nodeMultiplexer.transferFromSigHash ||
      functionSighash === this.nodeMultiplexer.safeTransferFrom_1_SigHash
    ) {
      const transferData = ethers.utils.defaultAbiCoder.decode(
        ['address', 'address', 'uint256'],
        ethers.utils.hexDataSlice(transactionData, 4)
      );
      const transferValue = transferData[2]._hex;

      return {
        from: transferData[0],
        to: transferData[1],
        transfer_value:
          transferValue === true ? true : new BigNumber(transferValue.slice(2), 16).toNumber(),
      };
    } else if (functionSighash === this.nodeMultiplexer.safeTransferFrom_2_SigHash) {
      const transferData = ethers.utils.defaultAbiCoder.decode(
        ['address', 'address', 'uint256', 'uint256', 'bytes'],
        ethers.utils.hexDataSlice(transactionData, 4)
      );
      const transferValue = transferData[2]._hex;
      return {
        from: transferData[0],
        to: transferData[1],
        transfer_value:
          transferValue === true ? true : new BigNumber(transferValue.slice(2), 16).toNumber(),
      };
    } else if (functionSighash === this.nodeMultiplexer.safeTransferFrom_3_SigHash) {
      const transferData = ethers.utils.defaultAbiCoder.decode(
        ['address', 'address', 'uint256', 'bytes'],
        ethers.utils.hexDataSlice(transactionData, 4)
      );
      const transferValue = transferData[2]._hex;
      return {
        from: transferData[0],
        to: transferData[1],
        transfer_value:
          transferValue === true ? true : new BigNumber(transferValue.slice(2), 16).toNumber(),
      };
    } else if (functionSighash === this.nodeMultiplexer.safeBatchTransferFromSigHash) {
      //ToDoNeed a bit of rework in terms of safe batch transfer decoding.
      const transferData = ethers.utils.defaultAbiCoder.decode(
        ['address', 'address', 'uint256[]', 'uint256[]', 'bytes'],
        ethers.utils.hexDataSlice(transactionData, 4)
      );
      const transferValue = transferData[2]._hex;
      return {
        from: transferData[0],
        to: transferData[1],
        transfer_value:
          transferValue === true ? true : new BigNumber(transferValue.slice(2), 16).toNumber(),
      };
    } else {
      return {
        from: '',
        to: '',
        transfer_value: 0,
      };
    }
  }

  /**
   *  Seaport message risk profile details
   * @param data - Seaport input data
   * @returns  - Seaport message risk profile details
   */
  private async getSeaportMessageRiskProfileDetails(data: CommonTypes.SeaportInputData) {
    let value = '';
    const riskData = [];
    let considerationAssetValue = 0;
    let considerationAssetToken = '';
    const nativeToken = NodeConstants.NATIVE_CURRENCY[data.chain];

    const allAssets = await Promise.all(
      data.offer.map((asset) =>
        this.simpleHashService.getNFTDetails(
          asset.token.toLowerCase(),
          asset.identifierOrCriteria,
          data.chain
        )
      )
    );
    const existingAssets = allAssets.filter((s) => s);

    const assets = existingAssets.map((assetDetails) => ({
      address: assetDetails.contractAddress,
      token_id: assetDetails.tokenId,
      name: assetDetails.name,
      image_url: assetDetails.url,
    }));

    const totalAssetFloorPrice = _.sumBy(existingAssets, (a) => a.floorPrice);

    const recipientDetails = data.consideration.find(
      (considerationItem) =>
        considerationItem.recipient.toLowerCase() === data.offerer.toLowerCase()
    );

    if (recipientDetails) {
      switch (recipientDetails.itemType) {
        case CommonConstants.SeaportItemType.NATIVE_TOKEN: {
          value = `${ethers.utils.formatEther(recipientDetails.startAmount)} ${nativeToken}`;
          considerationAssetValue = new BigNumber(
            ethers.utils.formatEther(recipientDetails.startAmount)
          ).toNumber();
          considerationAssetToken = nativeToken;
          break;
        }
        case CommonConstants.SeaportItemType.ERC20: {
          const tokenDetails = await this.nodeMultiplexer.getTokenInformation(
            recipientDetails.token.toLowerCase(),
            data.chain,
            data.network
          );
          value = `${NodeUtils.formatUnits(
            recipientDetails.startAmount,
            tokenDetails.decimals ? tokenDetails.decimals : 18
          )} ${tokenDetails.symbol}`;
          considerationAssetValue = NodeUtils.formatUnits(
            recipientDetails.startAmount,
            tokenDetails.decimals ? tokenDetails.decimals : 18
          );
          considerationAssetToken = tokenDetails.symbol;
          break;
        }
        case CommonConstants.SeaportItemType.ERC721: {
          const assetDetails = await this.simpleHashService.getNFTDetails(
            recipientDetails.token,
            recipientDetails.identifierOrCriteria,
            data.chain
          );
          value = `${recipientDetails.startAmount} ${assetDetails.name} (ID: ${recipientDetails.identifierOrCriteria}))`;
          considerationAssetValue = assetDetails.floorPrice;
          considerationAssetToken = assetDetails.floorPriceToken;
          break;
        }
        case CommonConstants.SeaportItemType.ERC1155: {
          const assetDetails = await this.simpleHashService.getNFTDetails(
            recipientDetails.token,
            recipientDetails.identifierOrCriteria,
            data.chain
          );
          value = `${recipientDetails.startAmount} ${assetDetails.name} (ID: ${recipientDetails.identifierOrCriteria}))`;
          considerationAssetValue = assetDetails.floorPrice;
          considerationAssetToken = assetDetails.floorPriceToken;
          break;
        }
      }
      let totalAssetFloorPriceInUSD = 0,
        considerationAssetValueInUSD = 0;

      if (recipientDetails.itemType === CommonConstants.SeaportItemType.ERC20) {
        const nativeCurrencyPriceInfoPromise = this.defillamaService.getTokenPriceInfoFromDefillama(
          data.chain,
          CommonConstants.TOKENS.ETHEREUM.MAINNET[nativeToken].toLowerCase()
        );

        const considerationTokenPriceInfoPromise =
          this.defillamaService.getTokenPriceInfoFromDefillama(
            data.chain,
            recipientDetails.itemType === CommonConstants.SeaportItemType.ERC20
              ? recipientDetails.token.toLowerCase()
              : CommonConstants.TOKENS.ETHEREUM.MAINNET[nativeToken].toLowerCase()
          );

        const [nativeTokenPriceInfo, considerationTokenPriceInfo] = await Promise.all([
          nativeCurrencyPriceInfoPromise,
          considerationTokenPriceInfoPromise,
        ]);
        totalAssetFloorPriceInUSD = totalAssetFloorPrice * (nativeTokenPriceInfo?.price || 0);
        considerationAssetValueInUSD =
          considerationAssetValue * (considerationTokenPriceInfo?.price || 0);
      } else {
        const nativeTokenPriceInfo = await this.defillamaService.getTokenPriceInfoFromDefillama(
          data.chain,
          CommonConstants.TOKENS.ETHEREUM.MAINNET[nativeToken].toLowerCase()
        );
        totalAssetFloorPriceInUSD = totalAssetFloorPrice * (nativeTokenPriceInfo?.price || 0);
        considerationAssetValueInUSD = considerationAssetValue * (nativeTokenPriceInfo?.price || 0);
      }

      if (totalAssetFloorPriceInUSD > considerationAssetValueInUSD) {
        riskData.push({
          risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
          risk_type: CommonConstants.SafeguardRiskType.MALICIOUS_SEAPORT_SIGNATURE,
          text: `You are selling NFTs with total floor price ${totalAssetFloorPrice} ${nativeToken}, in exchange for ${considerationAssetValue} ${considerationAssetToken}`,
        });
      }
    } else {
      value = '0';
      riskData.push({
        risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
        risk_type: CommonConstants.SafeguardRiskType.MALICIOUS_SEAPORT_SIGNATURE,
        text: 'You are exchanging NFTs in return for nothing',
      });
    }

    if (assets.length > 0) {
      riskData.push({
        risk_profile_type: CommonConstants.SafeguardRiskProfileType.MEDIUM,
        risk_type: CommonConstants.SafeguardRiskType.SEAPORT_TOKEN_SALE,
        text: `The following NFTs are being offered for sale on Seaport: ${assets
          .map((asset) => `${asset.address} - ${asset.token_id}`)
          .join(', ')} for ${value}`,
        details: {
          assets: assets,
          from: data.offerer,
          value: value,
        },
      });
    }

    return riskData;
  }

  private async checkApprovalsForBatchPermits(
    permitBatch: CommonTypes.FormattedPermitBatchType[],
    chain: Chains,
    network: Networks,
    spenderCounterPartyType: CommonConstants.CounterpartyTypes
  ) {
    try {
      const approvals = [];
      for (const permit of permitBatch) {
        let tokenDetails;
        // eslint-disable-next-line prefer-const
        tokenDetails = await this.nodeMultiplexer.getTokenInformation(permit.token, chain, network);
        if (tokenDetails) {
          const tokenPriceInfo = await CommonUtils.getTokenInformationFromDefillama(
            chain,
            network,
            permit.token
          );
          if (tokenPriceInfo) {
            tokenDetails.price_usd = tokenPriceInfo.price;
            tokenDetails.decimals = tokenPriceInfo.decimals;
          }
        }
        const tokenApproval = await this.approvalsCheck({
          toAddress: permit.spender,
          fromAddress: '',
          transactionData: undefined,
          value: permit.amount,
          counterPartyType: spenderCounterPartyType,
          tokenDetails: tokenDetails,
          deadline: CommonUtils.convertToMilliSeconds(permit.deadline),
          chain,
          network,
        });
        if (tokenApproval && tokenApproval.length > 0) {
          const largeApprovalRisk = tokenApproval.find(
            (approval) => approval.risk_type === CommonConstants.SafeguardRiskType.LARGE_APPROVAL
          );
          if (largeApprovalRisk) {
            largeApprovalRisk.details.approvals.push({
              spender: permit.spender,
              approval_value: permit.amount,
              from: '',
              token: {
                address: permit.token,
                symbol: tokenDetails?.symbol || '',
              },
            });
          }
        }
        approvals.push(tokenApproval);
      }
      return _.flatten(approvals);
    } catch (err) {
      return [];
    }
  }

  async isMaliciousDomain(url: string) {
    const validatedURL = new URL(url);
    const domains = CommonUtils.truncateAndExpandDomain(validatedURL.hostname);

    const allowlistedDomainDetails = await this.databaseService.getAllowedDomainDetails(
      _.uniq(domains),
      [CommonConstants.DATABASE_COLUMNS.URL]
    );

    this.logger.debug(
      `Found ${allowlistedDomainDetails.length} entries for input domain ${validatedURL.hostname} and regex domains ${domains} in allowlist domains`
    );

    //Performing direct 1:1 matching based on combination using our malicious domains list
    let maliciousDomainDetailsPromise: Promise<CommonTypes.DatasetMaliciousDomains[]>;
    if (allowlistedDomainDetails.length === 0) {
      maliciousDomainDetailsPromise = this.databaseService.getMaliciousDomainDetails(
        _.uniq(domains),
        [
          CommonConstants.DATABASE_COLUMNS.URL,
          CommonConstants.DATABASE_COLUMNS.LABELS,
          CommonConstants.DATABASE_COLUMNS.TAGS,
        ]
      );

      /**
       * Searching for similar domains for the given url against allowlist_domains by using prefix/suffix matching and edit distance based fuzzy matching.
       * * Note: url column in required for final response and sld is required to do edit distance filtering and sorting
       */
      const fuzzyMatchesPromise = this.databaseService.getFuzzyMaliciousDomainDetails(
        validatedURL.hostname,
        [CommonConstants.DATABASE_COLUMNS.URL, CommonConstants.DATABASE_COLUMNS.SLD]
      );

      return Promise.all([maliciousDomainDetailsPromise, fuzzyMatchesPromise]).then(
        ([maliciousDomainDetails, fuzzyMatches]) => {
          this.logger.debug(
            `Found ${maliciousDomainDetails.length} entries for input domain ${validatedURL.hostname} and regex domains ${domains} in malicious domains`
          );

          if (maliciousDomainDetails.length !== 0) {
            const labels = _.flatMap(maliciousDomainDetails, (d) => d.labels);
            const tags = _.flatMap(maliciousDomainDetails, (d) => d.tags);
            const maliciousMatch = _.uniq(_.flatMap(maliciousDomainDetails, (d) => d.url));

            return {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
              risk_type: CommonConstants.SafeguardRiskType.MALICIOUS_DOMAIN,
              text: `The url ${url} matches with identified malicious domain ${maliciousMatch[0]}`,
              details: {
                labels: _.uniq(labels),
                malicious_domain: maliciousMatch[0],
                tags: _.uniq(tags),
              },
            };
          }

          this.logger.debug(
            `Found ${fuzzyMatches.length} fuzzy matches for input domain ${validatedURL.hostname}`
          );

          if (fuzzyMatches.length !== 0) {
            const fuzzyMatchedURLs = _.uniq(_.flatMap(fuzzyMatches, (d) => d.url)).reduce(
              (text, value, i, array) => text + (i < array.length - 1 ? ', ' : ' and ') + value
            );

            this.logger.debug(`Fuzzy Matched URLs: ${fuzzyMatchedURLs}`);
            return {
              risk_profile_type: CommonConstants.SafeguardRiskProfileType.HIGH,
              risk_type: CommonConstants.SafeguardRiskType.MALICIOUS_DOMAIN,
              text: `The url ${url} is identified as a malicious domain as it resembles verified domain(s) ${fuzzyMatchedURLs}`,
              details: {
                tags: ['phish-hack'],
                malicious_domain: url,
              },
            };
          }
        }
      );
    }
    return false;
  }
}
