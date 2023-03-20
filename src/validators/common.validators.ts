import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { CommonConstants } from '../constants/common.constants';
import type { CommonTypes } from '../types/common.types';
import { CommonUtils } from '../utils/common.utils';

export namespace CommonValidators {
  /**
   *  Validation for message data
   * @param message - GeneralMessageDTO
   */
  export const validateRequestMessageData = (message, primaryType) => {
    let validationStatus = true;
    const validationMessages = [];
    if (CommonUtils.isType(message, CommonConstants.ERC20PermitMessage)) {
      if (!ethers.utils.isAddress(message.owner)) {
        validationMessages.push('message.message.owner should be valid ethereum address');
        validationStatus = false;
      }
      if (!ethers.utils.isAddress(message.spender)) {
        validationMessages.push('message.message.spender should be valid ethereum address');
        validationStatus = false;
      }
      if (!(message.value && message.value.length !== 0)) {
        validationMessages.push('message.message.value should not be empty');
        validationStatus = false;
      }
      if (!(message.nonce && message.nonce.length !== 0)) {
        validationMessages.push('message.message.nonce should not be empty');
        validationStatus = false;
      }

      let isValidDeadline = true;
      if (!message.deadline) {
        isValidDeadline = false;
      } else {
        let deadline;
        if (message.deadline.length === 13) {
          deadline = new BigNumber(message.deadline).toNumber();
        } else if (message.deadline.length === 10) {
          deadline = new BigNumber(message.deadline).multipliedBy(1000).toNumber();
        }
        if (Number.isNaN(deadline) || deadline <= Date.now()) {
          isValidDeadline = false;
        }
      }
      if (!isValidDeadline) {
        validationMessages.push(
          'message.message.deadline should be a valid future unix epoch time'
        );
        validationStatus = false;
      }
    } else if (CommonUtils.isType(message, CommonConstants.ERC721PermitMessage)) {
      if (!ethers.utils.isAddress(message.owner)) {
        validationMessages.push('message.message.owner should be valid ethereum address');
        validationStatus = false;
      }
      if (!ethers.utils.isAddress(message.spender)) {
        validationMessages.push('message.message.spender should be valid ethereum address');
        validationStatus = false;
      }
      if (!(message.tokenId && message.tokenId.length !== 0)) {
        validationMessages.push('message.message.tokenId should not be empty');
        validationStatus = false;
      }
      if (!(message.nonce && message.nonce.length !== 0)) {
        validationMessages.push('message.message.nonce should not be empty');
        validationStatus = false;
      }
      let isValidDeadline = true;
      if (!message.deadline) {
        isValidDeadline = false;
      } else {
        let deadline;
        if (message.deadline.length === 13) {
          deadline = parseInt(message.deadline);
        } else if (message.deadline.length === 10) {
          deadline = parseInt(message.deadline) * 1000;
        }
        if (Number.isNaN(deadline) || deadline <= Date.now()) {
          isValidDeadline = false;
        }
      }
      if (!isValidDeadline) {
        validationMessages.push(
          'message.message.deadline should be a valid future unix epoch time'
        );
        validationStatus = false;
      }
    } else if (CommonUtils.isType(message, CommonConstants.DAIPermitMessage)) {
      if (!ethers.utils.isAddress(message.holder)) {
        validationMessages.push('message.message.holder should be valid ethereum address');
        validationStatus = false;
      }
      if (!ethers.utils.isAddress(message.spender)) {
        validationMessages.push('message.message.spender should be valid ethereum address');
        validationStatus = false;
      }
      if (typeof message.allowed !== 'boolean') {
        validationMessages.push('message.message.allowed should be a valid boolean value');
        validationStatus = false;
      }
      if (!(message.nonce && message.nonce.length !== 0)) {
        validationMessages.push('message.message.nonce should not be empty');
        validationStatus = false;
      }
      let isValidDeadline = true;
      if (!message.expiry) {
        isValidDeadline = false;
      } else {
        let deadline;
        if (message.expiry.length === 13) {
          deadline = parseInt(message.expiry);
        } else if (message.expiry.length === 10) {
          deadline = parseInt(message.expiry) * 1000;
        } else {
          isValidDeadline = false;
        }
        if (Number.isNaN(deadline) || deadline <= Date.now()) {
          isValidDeadline = false;
        }
      }
      if (!isValidDeadline) {
        validationStatus = false;
        validationMessages.push('message.message.expiry should be a valid future unix epoch time');
      }
    } else if (CommonUtils.isType(message, CommonConstants.SeaportOrderMessage)) {
      if (!ethers.utils.isAddress(message.offerer)) {
        validationMessages.push('message.message.offerer should be valid ethereum address');
        validationStatus = false;
      }
      if (message.offer.length === 0) {
        validationMessages.push('message.message.offer should not be empty');
        validationStatus = false;
      }
      if (message.consideration.length === 0) {
        validationMessages.push('message.message.consideration should not be empty');
        validationStatus = false;
      }
    } else if (CommonUtils.isType(message, CommonConstants.SeaportBulkOrderMessage)) {
      const treeDepth = CommonUtils.getNestedArrayDepth(message.tree);
      if (treeDepth < 1 || treeDepth > CommonConstants.OpenseaSeaportBulkOrderMaxTreeDepth) {
        validationStatus = false;
      } else {
        const flattenedTree: CommonTypes.SeaportMessageType[] = message.tree.flat(
          CommonConstants.OpenseaSeaportBulkOrderMaxTreeDepth
        );
        const validOrders = flattenedTree.filter(
          (item) =>
            item.offerer !== '0x0000000000000000000000000000000000000000' ||
            item.offer.length !== 0 ||
            item.consideration.length !== 0 ||
            item.startTime !== '0' ||
            item.endTime !== '0'
        );
        if (validOrders.length === 0) {
          validationStatus = false;
        } else {
          for (const order of validOrders) {
            if (!ethers.utils.isAddress(order.offerer)) {
              validationStatus = false;
              break;
            }
            if (order.offer.length === 0) {
              validationStatus = false;
              break;
            }
            if (order.consideration.length === 0) {
              validationStatus = false;
              break;
            }
          }
        }
      }
      if (!validationStatus) {
        validationMessages.push(
          'message.message should be a valid Opensea Seaport BulkOrder object'
        );
      }
    } else if (
      primaryType === CommonConstants.SafeguardMessagePrimaryType.PERMIT_SINGLE &&
      CommonUtils.isType(message, CommonConstants.PermitSingleMessage)
    ) {
      if (!ethers.utils.isAddress(message.details.token)) {
        validationMessages.push('message.message.details.token should be valid ethereum address');
        validationStatus = false;
      }
      if (!(message.details.nonce && message.details.nonce.length !== 0)) {
        validationMessages.push('message.message.details.nonce should not be empty');
        validationStatus = false;
      }
      if (!message.details.amount && message.details.amount.length !== 0) {
        validationMessages.push('message.message.details.amount should be a valid boolean value');
        validationStatus = false;
      }
      if (!ethers.utils.isAddress(message.spender)) {
        validationMessages.push('message.message.spender should be valid ethereum address');
        validationStatus = false;
      }

      let isValidExpiration = true;
      if (!message.details.expiration) {
        isValidExpiration = false;
      } else {
        let expiration;
        if (message.details.expiration.length === 13) {
          expiration = parseInt(message.details.expiration);
        } else if (message.details.expiration.length === 10) {
          expiration = parseInt(message.details.expiration) * 1000;
        }
        if (Number.isNaN(expiration) || expiration <= Date.now()) {
          isValidExpiration = false;
        }
      }
      if (!isValidExpiration) {
        validationMessages.push(
          'message.message.details.expiration should be a valid future unix epoch time'
        );
        validationStatus = false;
      }

      let isValidSigDeadline = true;
      if (!message.sigDeadline) {
        isValidSigDeadline = false;
      } else {
        let sigDeadline;
        if (message.sigDeadline.length === 13) {
          sigDeadline = parseInt(message.sigDeadline);
        } else if (message.sigDeadline.length === 10) {
          sigDeadline = parseInt(message.sigDeadline) * 1000;
        }
        if (Number.isNaN(sigDeadline) || sigDeadline <= Date.now()) {
          isValidSigDeadline = false;
        }
      }
      if (!isValidSigDeadline) {
        validationMessages.push(
          'message.message.sigDeadline should be a valid future unix epoch time'
        );
        validationStatus = false;
      }
    } else if (
      primaryType === CommonConstants.SafeguardMessagePrimaryType.PERMIT_TRANSFER_FROM &&
      CommonUtils.isType(message, CommonConstants.PermitTransferFromMessage)
    ) {
      if (!ethers.utils.isAddress(message.permitted.token)) {
        validationMessages.push('message.message.permitted.token should be valid ethereum address');
        validationStatus = false;
      }
      if (!(message.permitted.amount && message.permitted.amount.length !== 0)) {
        validationMessages.push('message.message.permitted.amount should not be empty');
        validationStatus = false;
      }
      if (!ethers.utils.isAddress(message.spender)) {
        validationMessages.push('message.message.spender should be valid ethereum address');
        validationStatus = false;
      }
      if (!(message.nonce && message.nonce.length !== 0)) {
        validationMessages.push('message.message.nonce should not be empty');
        validationStatus = false;
      }

      let isValidDeadline = true;

      if (!message.deadline) {
        isValidDeadline = false;
      } else {
        let deadline;
        if (message.deadline.length === 13) {
          deadline = parseInt(message.deadline);
        } else if (message.deadline.length === 10) {
          deadline = parseInt(message.deadline) * 1000;
        }
        if (Number.isNaN(deadline) || deadline <= Date.now()) {
          isValidDeadline = false;
        }
      }
      if (!isValidDeadline) {
        validationMessages.push(
          'message.message.deadline should be a valid future unix epoch time'
        );
        validationStatus = false;
      }
    } else if (
      primaryType === CommonConstants.SafeguardMessagePrimaryType.PERMIT_BATCH &&
      CommonUtils.isType(message, CommonConstants.PermitBatchMessage)
    ) {
      if (message.details.length === 0) {
        validationMessages.push('message.message.details should not be empty');
        validationStatus = false;
      }
      if (!ethers.utils.isAddress(message.spender)) {
        validationMessages.push('message.message.spender should be valid ethereum address');
        validationStatus = false;
      }

      let isValidSigDeadline = true;
      if (!message.sigDeadline) {
        isValidSigDeadline = false;
      } else {
        let sigDeadline;
        if (message.sigDeadline.length === 13) {
          sigDeadline = parseInt(message.sigDeadline);
        } else if (message.sigDeadline.length === 10) {
          sigDeadline = parseInt(message.sigDeadline) * 1000;
        }
        if (Number.isNaN(sigDeadline) || sigDeadline <= Date.now()) {
          isValidSigDeadline = false;
        }
      }
      if (!isValidSigDeadline) {
        validationMessages.push(
          'message.message.sigDeadline should be a valid future unix epoch time'
        );
        validationStatus = false;
      }
    } else if (
      primaryType === CommonConstants.SafeguardMessagePrimaryType.PERMIT_BATCH_TRANSFER_FROM &&
      CommonUtils.isType(message, CommonConstants.PermitBatchTransferFromMessage)
    ) {
      if (message.permitted.length === 0) {
        validationMessages.push('message.message.details should not be empty');
        validationStatus = false;
      }
      if (!ethers.utils.isAddress(message.spender)) {
        validationMessages.push('message.message.spender should be valid ethereum address');
        validationStatus = false;
      }
      if (!(message.nonce && message.nonce.length !== 0)) {
        validationMessages.push('message.message.nonce should not be empty');
        validationStatus = false;
      }

      let isValidDeadline = true;
      if (!message.deadline) {
        isValidDeadline = false;
      } else {
        let deadline;
        if (message.deadline.length === 13) {
          deadline = parseInt(message.deadline);
        } else if (message.deadline.length === 10) {
          deadline = parseInt(message.deadline) * 1000;
        }
        if (Number.isNaN(deadline) || deadline <= Date.now()) {
          isValidDeadline = false;
        }
      }
      if (!isValidDeadline) {
        validationMessages.push(
          'message.message.deadline should be a valid future unix epoch time'
        );
        validationStatus = false;
      }
    } else if (
      primaryType === CommonConstants.SafeguardMessagePrimaryType.PERMIT_WITNESS_TRANSFER_FROM &&
      CommonUtils.isType(message, CommonConstants.PermitWitnessTransferFromMessage)
    ) {
      if (!ethers.utils.isAddress(message.permitted.token)) {
        validationMessages.push('message.message.permitted.token should be valid ethereum address');
        validationStatus = false;
      }
      if (!(message.permitted.amount && message.permitted.amount.length !== 0)) {
        validationMessages.push('message.message.permitted.amount should not be empty');
        validationStatus = false;
      }
      if (!ethers.utils.isAddress(message.spender)) {
        validationMessages.push('message.message.spender should be valid ethereum address');
        validationStatus = false;
      }
      if (!(message.nonce && message.nonce.length !== 0)) {
        validationMessages.push('message.message.nonce should not be empty');
        validationStatus = false;
      }
      if (!message.witness || message.witness.length === 0) {
        validationMessages.push('message.message.witness should not be empty');
        validationStatus = false;
      }

      let isValidDeadline = true;
      if (!message.deadline) {
        isValidDeadline = false;
      } else {
        let deadline;
        if (message.deadline.length === 13) {
          deadline = parseInt(message.deadline);
        } else if (message.deadline.length === 10) {
          deadline = parseInt(message.deadline) * 1000;
        }
        if (Number.isNaN(deadline) || deadline <= Date.now()) {
          isValidDeadline = false;
        }
      }
      if (!isValidDeadline) {
        validationMessages.push(
          'message.message.deadline should be a valid future unix epoch time'
        );
        validationStatus = false;
      }
    } else if (
      primaryType ===
        CommonConstants.SafeguardMessagePrimaryType.PERMIT_BATCH_WITNESS_TRANSFER_FROM &&
      CommonUtils.isType(message, CommonConstants.PermitBatchWitnessTransferFromMessage)
    ) {
      if (message.permitted.length === 0) {
        validationMessages.push('message.message.details should not be empty');
        validationStatus = false;
      }
      if (!ethers.utils.isAddress(message.spender)) {
        validationMessages.push('message.message.spender should be valid ethereum address');
        validationStatus = false;
      }
      if (!(message.nonce && message.nonce.length !== 0)) {
        validationMessages.push('message.message.nonce should not be empty');
        validationStatus = false;
      }
      if (!message.witness || message.witness.length === 0) {
        validationMessages.push('message.message.witness should not be empty');
        validationStatus = false;
      }

      let isValidDeadline = true;
      if (!message.deadline) {
        isValidDeadline = false;
      } else {
        let deadline;
        if (message.deadline.length === 13) {
          deadline = parseInt(message.deadline);
        } else if (message.deadline.length === 10) {
          deadline = parseInt(message.deadline) * 1000;
        }
        if (Number.isNaN(deadline) || deadline <= Date.now()) {
          isValidDeadline = false;
        }
      }

      if (!isValidDeadline) {
        validationMessages.push(
          'message.message.deadline should be a valid future unix epoch time'
        );
        validationStatus = false;
      }
    } else {
      validationStatus = false;
      validationMessages.push(
        'message.message should be a valid EIP-712 compatible message of type SignTypedData V4 or Permit2'
      );
    }

    if (!validationStatus) {
      return {
        statusCode: 400,
        message: validationMessages,
        error: 'Bad Request',
      };
    }
  };
}
