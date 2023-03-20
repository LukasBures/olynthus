import axios from 'axios';
import { BigNumber } from 'bignumber.js';
import { plainToInstance } from 'class-transformer';
import type { ValidationError } from 'class-validator';
import { validate } from 'class-validator';
import _ from 'lodash';
import { CommonConstants } from '../constants/common.constants';
import { CustomLogger } from '../lib/logger/logger';
import { Networks, Chains } from '../lib/node-multiplexer';
import type { CommonTypes } from '../types/common.types';

export namespace CommonUtils {
  const logger = new CustomLogger('CommonUtils');

  /**
   * @param sld sld. Eg: bayc-nfts
   * @returns array of combinations of SLD by excluding any Web3 stop words in them. Eg: [bayc]
   */
  export function generateFuzzySLDPatterns(sld) {
    const splitSLDParts = sld
      .split(/[-_]/)
      .filter((sldPart) => !CommonConstants.WEB3_STOP_WORDS.includes(sldPart.toLowerCase()));
    return _.uniq([sld, ...splitSLDParts]);
  }

  export function isType<T>(obj: any, type: T): obj is T {
    const objKeys = Object.keys(obj);
    const typeKeys = Object.keys(type);
    return objKeys.every((key) => typeKeys.includes(key));
  }

  export function convertToMilliSeconds(timeStamp: string) {
    if (timeStamp.length === 10) {
      return (parseInt(timeStamp) * 1000).toString();
    } else if (timeStamp.length === 13) {
      return timeStamp;
    }
  }

  /**
   * @returns valueChange - change in value (valueNew - valueOld)
   * @returns percentChange - % change of value ((valueNew - valueOld) / valueOld) * 100
   */
  export function getValueChange(
    valueNew: number,
    valueOld: number
  ): { valueChange: number; percentChange: number } {
    const valueChange = new BigNumber(valueNew).minus(valueOld);
    const percentChange = new BigNumber(valueNew)
      .minus(valueOld)
      .div(new BigNumber(valueOld).abs())
      .times(100);

    if (percentChange.isNaN() || !percentChange.isFinite()) {
      return { valueChange: valueChange.toNumber(), percentChange: 0 };
    } else {
      return {
        valueChange: valueChange.toNumber(),
        percentChange: _.round(percentChange.toNumber(), 6),
      };
    }
  }

  export function formatPermitBatchData(permitMessageData) {
    let convertedData: CommonTypes.FormattedPermitBatchType[] = [];

    if (isType(permitMessageData, CommonConstants.PermitBatchMessage)) {
      const details = _.get(permitMessageData, 'details', []);

      convertedData = details.map((detail) => ({
        token: detail.token,
        amount: detail.amount,
        deadline: detail.expiration,
        spender: permitMessageData.spender,
      }));
    } else if (
      isType(permitMessageData, CommonConstants.PermitBatchTransferFromMessage) ||
      isType(permitMessageData, CommonConstants.PermitBatchWitnessTransferFromMessage)
    ) {
      const details = _.get(permitMessageData, 'permitted', []);

      convertedData = details.map((detail) => ({
        token: detail.token,
        amount: detail.amount,
        deadline: permitMessageData.deadline,
        spender: permitMessageData.spender,
      }));
    }

    return convertedData;
  }

  export function computeEditDistance(inputString1: string, inputString2: string) {
    inputString1 = inputString1.toLowerCase();
    inputString2 = inputString2.toLowerCase();
    const m: number[][] = [],
      l1 = inputString1.length,
      l2 = inputString2.length;
    for (let i = 0; i <= l1; i++) m[i] = [i];
    for (let j = 0; j <= l2; j++) m[0][j] = j;
    for (let i = 1; i <= l1; i++)
      for (let j = 1; j <= l2; j++) {
        if (inputString1.charAt(i - 1) == inputString2.charAt(j - 1)) {
          m[i][j] = m[i - 1][j - 1];
        } else {
          const min = Math.min(m[i - 1][j], m[i][j - 1], m[i - 1][j - 1]);
          m[i][j] = min + 1;
        }
      }
    return m[inputString1.length][inputString2.length];
  }

  /**
   * Given a valid unix epoch time, return the no of days between now and @param unixEpochTime
   * @param unixEpochTime Valid Unix epoch time
   * @returns number denoting # of days between @param unixEpochTime and now. Positive if the date is future and negative if in past.
   */
  export function getRelativeNumberOfDays(unixEpochTime: number): number {
    const now = Date.now();
    const date = new Date(unixEpochTime);
    const daysBetween = (date.getTime() - now) / CommonConstants.ONE_DAY_IN_MS;
    return Math.floor(daysBetween);
  }

  export function truncateAndExpandDomain(domain) {
    const domains = [domain];
    if (CommonConstants.REGEX.urlSchemaRegex.test(domain)) {
      const truncatedDomain = domain
        .replace(CommonConstants.REGEX.urlSchemaRegex, '')
        .replace(/\/$/, '');
      domains.push(truncatedDomain);

      if (CommonConstants.REGEX.wwwRegex.test(truncatedDomain)) {
        domains.push(truncatedDomain.replace(CommonConstants.REGEX.wwwRegex, ''));
      } else {
        domains.push('www.' + truncatedDomain);
      }
    } else if (CommonConstants.REGEX.wwwRegex.test(domain)) {
      domains.push(domain.replace(CommonConstants.REGEX.wwwRegex, ''));
    } else {
      domains.push('www.' + domain);
    }

    return domains;
  }

  export function getErrorDetails(error: ValidationError, property: string) {
    let errorsResult = [];
    for (const child of error.children) {
      if (_.isEqual(child.children, []))
        errorsResult = [
          ...errorsResult,
          ...Object.values(child.constraints).map((ele) => `${property}.${ele}`),
        ];
      const errorResult = getErrorDetails(child, `${property}.${child.property}`);
      errorsResult = [...errorsResult, ...errorResult];
    }
    return errorsResult;
  }

  export async function validateRequest(chain, body, bodyDto) {
    const supportedChains = [Chains.ETHEREUM, Chains.BSC, Chains.POLYGON];
    if (!supportedChains.includes(chain)) {
      return {
        statusCode: 400,
        message: [
          `invalid chain ${chain}`,
          `chain must be one of the following values: ${supportedChains.join(', ')}`,
        ],
        error: 'Bad Request',
      };
    }

    const bodyValidationDto = plainToInstance(bodyDto, body as typeof bodyDto);
    const errors = await validate(bodyValidationDto);

    let errorDetails = [];
    errors.forEach((error) => {
      errorDetails = [...errorDetails, ...CommonUtils.getErrorDetails(error, `${error.property}`)];
    });

    if (errors.length) return { statusCode: 400, message: errorDetails, error: 'Bad Request' };
    else return undefined;
  }

  export async function getTokenInformationFromDefillama(
    chain: Chains,
    network: Networks,
    tokenAddress: string,
    value?: number
  ): Promise<CommonTypes.CoinPriceInfo> {
    if (network !== Networks.MAINNET) return;

    try {
      const tokenID = `${chain.toLowerCase()}:${tokenAddress}`;
      const response = await axios.get(`${process.env.DEFILLAMA_API_URL}prices/current/${tokenID}`);

      if (response.status !== 200) {
        logger.error(
          `DefiLlama request failed with status code ${response.status}. ${response.statusText}`
        );
        return null;
      } else {
        const priceInfo = response.data as CommonTypes.DefiLlamaCoinPriceResponse;
        const tokenInformation = priceInfo.coins[tokenID];
        return {
          ...tokenInformation,
          price: value ? value * tokenInformation.price : tokenInformation.price,
        };
      }
    } catch (error) {
      logger.error(
        `Error in getting token information for ${tokenAddress} from defillama`,
        error.stack
      );
      return;
    }
  }

  /**
   * Given a array of nested arrays, computes and returns the maximum depth of the nested array
   * @param array Array of nested arrays
   * @returns number denoting the maximum depth of the nested array
   */
  export function getNestedArrayDepth(array: unknown[]): number {
    return Array.isArray(array) ? 1 + Math.max(0, ...array.map(getNestedArrayDepth)) : 0;
  }
}
