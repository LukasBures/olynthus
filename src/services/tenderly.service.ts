import axios from 'axios';
import { BigNumber } from 'bignumber.js';
import { ethers } from 'ethers';
import { CommonConstants } from '../constants/common.constants';
import { SimulationInterface } from '../interfaces/simulation.interface';
import { CustomLogger } from '../lib/logger/logger';
import type { Networks, Chains } from '../lib/node-multiplexer';
import type { CommonTypes } from '../types/common.types';

export class TenderlyService extends SimulationInterface {
  private logger: CustomLogger;

  private readonly tenderlyApiUrl = process.env.TENDERLY_API_URL;

  constructor() {
    super();
    this.logger = new CustomLogger(TenderlyService.name);
  }

  async simulateTransaction(
    transaction: CommonTypes.TransactionParams,
    txType: CommonConstants.SafeguardTxType,
    chain: Chains,
    network: Networks
  ) {
    try {
      if (process.env.SIMULATION_MODE === 'false') {
        return {
          status: CommonConstants.SafeguardSimulationStatusType.SUCCESS,
          failure_text: '',
          balances: [],
        };
      }

      const simulationResponse = await this.simulateTransactionOnTenderly(
        transaction,
        chain,
        network
      );

      if (simulationResponse.error) return simulationResponse.error;

      // decode the details from the simulation result (in parent class)
      return await this.decodeSimulationResult(
        simulationResponse,
        transaction,
        txType,
        chain,
        network
      );
    } catch (error) {
      return {
        status: CommonConstants.SafeguardSimulationStatusType.FAILURE,
        failure_text: 'unexpected error',
        balances: [],
      };
    }
  }

  async simulateTransactionOnTenderly(
    transaction: CommonTypes.TransactionParams,
    chain: Chains,
    network: Networks
  ) {
    try {
      // Default / Native token of the chain
      const chainId = CommonConstants.CHAIN_ID[chain][network];

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

      return simulationResponse;
    } catch (error) {
      //Check if error is due to tenderly api
      if (error.response) {
        if (error.response.data.error.slug === 'intent_execution_not_allowed') {
          // swallow rate limit errors and return SUCCESS (making the API best-effor basis)
          return {
            error: {
              status: CommonConstants.SafeguardSimulationStatusType.SUCCESS,
              failure_text: '',
              balances: [],
            },
          };
        }

        return {
          error: {
            status: CommonConstants.SafeguardSimulationStatusType.FAILURE,
            failure_text: error.response.data.error.message,
            balances: [],
          },
        };
      }
    }
  }
}
