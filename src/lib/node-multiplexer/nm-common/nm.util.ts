import BigNumber from 'bignumber.js';
import dotenv from 'dotenv';
import { Chains, Networks, NodeConstants } from './nm.constants';
dotenv.config();

export namespace NodeUtils {
  export const ARDA_FULL_NODE = {
    ETHEREUM: {
      MAINNET: process.env.NODE_ARDA_FULL_NODE_ETH_MAINNET,
    },
  };

  export const ARDA_ARCHIVE_NODE = {
    ETHEREUM: {
      MAINNET: process.env.NODE_ARDA_ARCHIVE_NODE_ETH_MAINNET,
    },
  };

  export const ARCHIVE_NODE_IO = {
    ETHEREUM: {
      MAINNET: `${process.env.NODE_ARCHIVE_NODE_IO_ETH_MAINNET}/${process.env.NODE_ARCHIVE_NODE_IO_ETH_API_KEY}`,
    },
  };

  export const INFURA_NODE = {
    ETHEREUM: {
      MAINNET: `${process.env.NODE_INFURA_ETH_MAINNET_PREFIX}/${process.env.NODE_INFURA_ETH_API_KEY}`,
      GOERLI: `${process.env.NODE_INFURA_ETH_GOERLI_PREFIX}/${process.env.NODE_INFURA_ETH_API_KEY}`,
    },
  };

  export const ANKR_NODE = {
    ETHEREUM: {
      MAINNET: `${process.env.NODE_ANKR_ETH_MAINNET}`,
      GOERLI: `${process.env.NODE_ANKR_ETH_GOERLI}`,
    },
    BSC: {
      MAINNET: `${process.env.NODE_ANKR_BSC_MAINNET}`,
      TESTNET: `${process.env.NODE_ANKR_BSC_TESTNET}`,
    },
    POLYGON: {
      MAINNET: `${process.env.NODE_ANKR_POLYGON_MAINNET}`,
      TESTNET: `${process.env.NODE_ANKR_POLYGON_TESTNET}`,
    },
  };

  export const BLOCKCHAIN_SCAN_API_URL = {
    ETHEREUM: {
      MAINNET: process.env.SCAN_ETHERSCAN_MAINNET,
      GOERLI: process.env.SCAN_ETHERSCAN_GOERLI,
    },
    BSC: {
      MAINNET: process.env.SCAN_BSCSCAN_MAINNET,
      TESTNET: process.env.SCAN_BSCSCAN_TESTNET,
    },
    POLYGON: {
      MAINNET: process.env.SCAN_POLYGON_MAINNET,
      TESTNET: process.env.SCAN_POLYGON_TESTNET,
    },
  };

  export const BLOCKCHAIN_SCAN_API_KEY = {
    ETHEREUM: process.env.SCAN_ETHERSCAN_API_KEY,
    BSC: process.env.SCAN_BSCSCAN_API_KEY,
    POLYGON: process.env.SCAN_POLYGON_API_KEY,
  };

  export const ETHERSCAN_API = {
    MAINNET: process.env.SCAN_ETHERSCAN_MAINNET,
    GOERLI: process.env.SCAN_ETHERSCAN_GOERLI,
  };

  export const BSCSCAN_API = {
    MAINNET: process.env.SCAN_BSCSCAN_MAINNET,
    TESTNET: process.env.SCAN_BSCSCAN_TESTNET,
  };

  export const POLYGONSCAN_API = {
    MAINNET: process.env.SCAN_POLYGONSCAN_MAINNET,
    MUMBAI: process.env.SCAN_POLYGONSCAN_MUMBAI,
  };

  export const BLOCKCHAIN_SCAN_PROVIDER_RATE_LIMITS = {
    MAX_REQUESTS: 5,
    PER_MS: 1000,
  };

  export function getArdaFullNodeHttpUrl(chain: Chains, network: Networks) {
    if (chain === Chains.ETHEREUM && network === Networks.MAINNET) {
      return NodeUtils.ARDA_FULL_NODE.ETHEREUM.MAINNET;
    }
  }

  export function getArdaArchiveNodeHttpUrl(chain: Chains, network: Networks) {
    if (chain === Chains.ETHEREUM && network === Networks.MAINNET) {
      return NodeUtils.ARDA_ARCHIVE_NODE.ETHEREUM.MAINNET;
    }
  }

  export function getInfuraNodeHttpUrl(chain: Chains, network: Networks) {
    if (chain === Chains.ETHEREUM) {
      return NodeUtils.INFURA_NODE.ETHEREUM[network];
    }
  }

  export function getArchiveNodeIoNodeHttpUrl(chain: Chains, network: Networks) {
    if (chain === Chains.ETHEREUM) {
      return NodeUtils.ARCHIVE_NODE_IO.ETHEREUM[network];
    }
  }

  export function getAnkrNodeHttpUrl(chain: Chains, network: Networks) {
    if (chain === Chains.ETHEREUM) {
      return NodeUtils.ANKR_NODE.ETHEREUM[network];
    } else if (chain === Chains.BSC) {
      return NodeUtils.ANKR_NODE.BSC[network];
    }
  }

  export function getChainNativeCurrency(chain: Chains): NodeConstants.Currencies {
    if (chain === Chains.ETHEREUM) return NodeConstants.Currencies.ETH;
    else if (chain === Chains.BSC) return NodeConstants.Currencies.BNB;
    else if (chain === Chains.POLYGON) return NodeConstants.Currencies.MATIC;
  }

  export function getBlockchainScanApiDetails(chain: Chains, network: Networks): string {
    if (chain === Chains.ETHEREUM) {
      return NodeUtils.ETHERSCAN_API[network] || '';
    } else if (chain === Chains.BSC) {
      return NodeUtils.BSCSCAN_API[network] || '';
    } else if (chain === Chains.POLYGON) {
      return NodeUtils.POLYGONSCAN_API[network] || '';
    } else return '';
  }

  export function formatUnits(
    value: number | string,
    units: number | NodeConstants.EtherUnits,
    roundDecimals: number = 6
  ) {
    const decimals = isNaN(parseInt(units as string))
      ? NodeConstants.ETHER_UNITS_DECIMALS[units as string]
      : parseInt(units as string);

    return new BigNumber(value.toString())
      .div(10 ** decimals)
      .decimalPlaces(roundDecimals)
      .toNumber();
  }
}
