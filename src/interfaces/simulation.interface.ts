import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { CommonConstants } from '../constants/common.constants';
import type { Chains, Networks } from '../lib/node-multiplexer';
import { NodeMultiplexer, NodeUtils } from '../lib/node-multiplexer';
import type { CommonTypes } from '../types/common.types';

export abstract class SimulationInterface {
  protected nodeMultiplexer: NodeMultiplexer;

  constructor() {
    this.nodeMultiplexer = new NodeMultiplexer();
  }

  // Overridden in simulation implementation class
  abstract simulateTransaction(
    transaction: CommonTypes.TransactionParams,
    txType: CommonConstants.SafeguardTxType,
    chain: Chains,
    network: Networks
  );

  async decodeSimulationResult(
    simulationResult,
    transaction: CommonTypes.TransactionParams,
    txType: CommonConstants.SafeguardTxType,
    chain: Chains,
    network: Networks
  ) {
    try {
      if (!simulationResult.simulation.status) {
        return {
          status: CommonConstants.SafeguardSimulationStatusType.FAILURE,
          failure_text: simulationResult.transaction.error_message,
          balances: [],
        };
      }

      const nativeToken = CommonConstants.NativeTokens[chain];
      const simulationStatus = CommonConstants.SafeguardSimulationStatusType.SUCCESS;

      if (txType === CommonConstants.SafeguardTxType.ERC20_TRANSFER) {
        //ERC20 token difference
        let stateDifference = simulationResult.transaction.transaction_info.state_diff;

        stateDifference = this.getBalanceDifferenceForStates(stateDifference);

        //Native token difference
        const balanceDifference = simulationResult.transaction.transaction_info.balance_diff;

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
        const balanceDifference = simulationResult.transaction.transaction_info.balance_diff;

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
        const balanceDifference = simulationResult.transaction.transaction_info.balance_diff;

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
