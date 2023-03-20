import axios from 'axios';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { CommonConstants } from '../constants/common.constants';
import { CustomLogger } from '../lib/logger/logger';
import type { Networks, Chains } from '../lib/node-multiplexer';
import { NodeMultiplexer, NodeUtils } from '../lib/node-multiplexer';
import type { CommonTypes } from '../types/common.types';

export class SimulationService {
  private logger: CustomLogger;

  private readonly tenderlyApiUrl = process.env.TENDERLY_API_URL;

  private nodeMultiplexer: NodeMultiplexer;

  constructor() {
    this.logger = new CustomLogger(SimulationService.name);
    this.nodeMultiplexer = new NodeMultiplexer();
  }

  async simulateTransaction(
    transaction: CommonTypes.TransactionParams,
    txType: CommonConstants.SafeguardTxType,
    chain: Chains,
    network: Networks
  ) {
    try {
      // Default / Native token of the chain
      const nativeToken = CommonConstants.NativeTokens[chain];
      const chainId = CommonConstants.CHAIN_ID[chain][network];

      if (process.env.SIMULATION_MODE === 'false') {
        return {
          status: CommonConstants.SafeguardSimulationStatusType.SUCCESS,
          failure_text: '',
          balances: [],
        };
      }

      const headers = {
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': process.env.TENDERLY_ACCESS_KEY,
        },
      };

      //ToDo: Make network_id dynamic and get chain token value
      const simulationBody = {
        network_id: chainId,
        from: transaction.from,
        to: transaction.to,
        value: new BigNumber(
          ethers.utils.parseUnits(transaction.value.toString(), 'ether').toString()
        ).toNumber(),
        input: transaction.data === '' ? '0x' : transaction.data,
        gas: parseInt(transaction?.gas) || 21000,
        gas_price: transaction?.gas_price || '1000000000',
        save_if_fails: false,
        save: false,
        simulation_type: 'quick',
      };

      const response = await axios.post(this.tenderlyApiUrl, simulationBody, headers);
      const simulationResponse = response.data;

      if (!simulationResponse.simulation.status) {
        return {
          status: CommonConstants.SafeguardSimulationStatusType.FAILURE,
          failure_text: simulationResponse.transaction.error_message,
          balances: [],
        };
      }

      const simulationStatus = CommonConstants.SafeguardSimulationStatusType.SUCCESS;

      if (txType === CommonConstants.SafeguardTxType.ERC20_TRANSFER) {
        //ERC20 token difference
        let stateDifference = simulationResponse.transaction.transaction_info.state_diff;

        stateDifference = this.getBalanceDifferenceForStates(stateDifference);

        //Native token difference
        const balanceDifference = simulationResponse.transaction.transaction_info.balance_diff;

        const tokenInformation = await this.nodeMultiplexer.getTokenInformation(
          transaction.to,
          chain,
          network
        );
        const tokenDecimals = tokenInformation.decimals || 18;

        const balanceDifferenceDict = balanceDifference.find(
          (element) => element.address.toLowerCase() === transaction.from
        );

        return {
          status: simulationStatus,
          failure_text: '',
          balances: [
            {
              before: {
                value: ethers.utils.formatEther(balanceDifferenceDict.original),
                token: nativeToken,
              },
              after: {
                value: ethers.utils.formatEther(balanceDifferenceDict.dirty),
                token: nativeToken,
              },
            },
            {
              before: {
                value: NodeUtils.formatUnits(stateDifference.original, tokenDecimals).toString(),
                token: tokenInformation.symbol || '',
              },
              after: {
                value: NodeUtils.formatUnits(stateDifference.dirty, tokenDecimals).toString(),
                token: tokenInformation.symbol || '',
              },
            },
          ],
        };
      } else if (
        txType === CommonConstants.SafeguardTxType.ERC721_TRANSFER ||
        txType === CommonConstants.SafeguardTxType.ERC1155_TRANSFER
      ) {
        const balanceDifference = simulationResponse.transaction.transaction_info.balance_diff;

        const functionSighash = transaction.data.substring(0, 10);
        const transferDetails = await this.decodeErcTransfers(
          transaction,
          functionSighash,
          chain,
          network
        );
        const balanceDifferenceDict = balanceDifference.find(
          (element) => element.address.toLowerCase() === transaction.from
        );

        return {
          status: simulationStatus,
          failure_text: '',
          balances: [
            {
              before: {
                value: ethers.utils.formatEther(balanceDifferenceDict.original),
                token: nativeToken,
              },
              after: {
                value: ethers.utils.formatEther(balanceDifferenceDict.dirty),
                token: nativeToken,
              },
            },
            {
              before: {
                value: transferDetails.transfer_value.toString(),
                token: transferDetails.token.name,
              },
              after: {
                value: '0',
                token: transferDetails.token.name,
              },
            },
          ],
        };
      } else {
        const balanceDifference = simulationResponse.transaction.transaction_info.balance_diff;

        const balanceDifferenceDict = balanceDifference.find(
          (element) => element.address.toLowerCase() === transaction.from
        );

        return {
          status: simulationStatus,
          failure_text: '',
          balances: [
            {
              before: {
                value: ethers.utils.formatEther(balanceDifferenceDict.original).toString(),
                token: nativeToken,
              },
              after: {
                value: ethers.utils.formatEther(balanceDifferenceDict.dirty).toString(),
                token: nativeToken,
              },
            },
          ],
        };
      }
    } catch (error) {
      //Check if error is due to tenderly api
      if (error.response) {
        if (error.response.data.error.slug === 'intent_execution_not_allowed') {
          // swallow rate limit errors and return SUCCESS (making the API best-effor basis)
          return {
            status: CommonConstants.SafeguardSimulationStatusType.SUCCESS,
            failure_text: '',
            balances: [],
          };
        }

        return {
          status: CommonConstants.SafeguardSimulationStatusType.FAILURE,
          failure_text: error.response.data.error.message,
          balances: [],
        };
      }

      return {
        status: CommonConstants.SafeguardSimulationStatusType.FAILURE,
        failure_text: 'unexpected error',
        balances: [],
      };
    }
  }

  private async decodeErcTransfers(transaction, functionSighash, chain: Chains, network: Networks) {
    if (
      functionSighash === this.nodeMultiplexer.transferSighash ||
      functionSighash === this.nodeMultiplexer.safeTransferSigHash
    ) {
      const transferData = ethers.utils.defaultAbiCoder.decode(
        ['address', 'uint256'],
        ethers.utils.hexDataSlice(transaction.data, 4)
      );
      const transferValue = transferData[1]._hex;
      const tokenInformation = await this.nodeMultiplexer.getTokenInformation(
        transaction.to,
        chain,
        network
      );
      return {
        from: transaction.from,
        to: transferData[0],
        transfer_value:
          transferValue === true ? true : new BigNumber(transferValue.slice(2), 16).toNumber(),
        token: {
          address: transaction.to,
          name: tokenInformation.symbol || '',
        },
      };
    } else if (
      functionSighash === this.nodeMultiplexer.transferFromSigHash ||
      functionSighash === this.nodeMultiplexer.safeTransferFrom_1_SigHash
    ) {
      const transferData = ethers.utils.defaultAbiCoder.decode(
        ['address', 'address', 'uint256'],
        ethers.utils.hexDataSlice(transaction.data, 4)
      );
      const transferValue = transferData[2]._hex;
      const tokenInformation = await this.nodeMultiplexer.getTokenInformation(
        transaction.to,
        chain,
        network
      );

      return {
        from: transferData[0],
        to: transferData[1],
        transfer_value: transferValue === true ? true : new BigNumber(transferValue.slice(2), 16),
        token: {
          address: transaction.to,
          name: tokenInformation.symbol || '',
        },
      };
    } else if (functionSighash === this.nodeMultiplexer.safeTransferFrom_2_SigHash) {
      const transferData = ethers.utils.defaultAbiCoder.decode(
        ['address', 'address', 'uint256', 'uint256', 'bytes'],
        ethers.utils.hexDataSlice(transaction.data, 4)
      );
      const transferValue = transferData[2]._hex;
      return {
        from: transferData[0],
        to: transferData[1],
        transfer_value: transferValue === true ? true : new BigNumber(transferValue.slice(2), 16),
        token: {
          address: transaction.to,
          name: '',
        },
      };
    } else if (functionSighash === this.nodeMultiplexer.safeBatchTransferFromSigHash) {
      //ToDoNeed a bit of rework in terms of safe batch transfer decoding.
      const transferData = ethers.utils.defaultAbiCoder.decode(
        ['address', 'address', 'uint256[]', 'uint256[]', 'bytes'],
        ethers.utils.hexDataSlice(transaction.data, 4)
      );
      const transferValue = transferData[2]._hex;
      return {
        from: transferData[0],
        to: transferData[1],
        transfer_value: transferValue === true ? true : new BigNumber(transferValue.slice(2), 16),
        token: {
          address: transaction.to,
          name: '',
        },
      };
    } else {
      return {
        from: transaction.from,
        to: '',
        transfer_value: 0,
        token: {
          address: transaction.to,
          name: '',
        },
      };
    }
  }

  private getBalanceDifferenceForStates(stateDiff) {
    const result = stateDiff.reduce(
      (acc, diff) =>
        acc.concat(
          diff.raw.filter((rawData) => {
            const original = parseInt(rawData.original, 16);
            const dirty = parseInt(rawData.dirty, 16);
            if (original > dirty) {
              return { original: original, dirty: dirty };
            }
          })
        ),
      []
    );

    return {
      original: result[0].original,
      dirty: result[0].dirty,
    };
  }
}
