import { Chains, Networks } from '../lib/node-multiplexer';
import type { CommonTypes } from '../types/common.types';

export namespace CommonConstants {
  export const DATABASE_NAMES = {
    DATASET: 'dataset',
    ETHEREUM_MAINNET: 'ethereum_mainnet',
    BSC_MAINNET: 'bsc_mainnet',
    POLYGON_MAINNET: 'polygon_mainnet',
  };

  export const DATABASE_TABLES = {
    // dataset
    MALICIOUS_COUNTERPARTY: 'malicious_counterparty',
    MALICIOUS_DOMAINS: 'malicious_domains',
    ALLOWLIST_DOMAINS: 'allowlist_domains',

    // ethereum_mainnet
    CONTRACTS: 'contracts',
  };

  export const DATABASE_COLUMNS = {
    IS_ERC20: 'is_erc20',
    IS_ERC721: 'is_erc721',
    BLOCK_TIMESTAMP: 'block_timestamp',
    ADDRESS: 'address',
    LABELS: 'labels',
    TAGS: 'tags',
    CONTRACT_CREATOR: 'contract_creator',
    CONTRACT_CREATOR_TAGS: 'contract_creator_tags',
    URL: 'url',
    SLD: 'sld',
    SYMBOL: 'symbol',
    DECIMALS: 'decimals',
    NAME: 'name',
    PROTOCOL: 'protocol',
  };

  export enum NativeTokens {
    ETHEREUM = 'ETH',
    BSC = 'BNB',
    POLYGON = 'MATIC',
  }

  export const CHAIN_ID = {
    [Chains.ETHEREUM]: {
      [Networks.MAINNET]: '1',
    },
    [Chains.BSC]: {
      [Networks.MAINNET]: '56',
    },
    [Chains.POLYGON]: {
      [Networks.MAINNET]: '137',
    },
  };

  export const enum TokenTypes {
    BEP20 = 'BEP20',
    ERC20 = 'ERC20',
    ERC721 = 'ERC721',
    ERC1155 = 'ERC1155',
  }

  export const enum SafeguardTxType {
    EOA_INTERACTION = 'EOA_INTERACTION',

    CONTRACT_CREATION = 'CONTRACT_CREATION',
    CONTRACT_INTERACTION = 'CONTRACT_INTERACTION',

    ERC20_TRANSFER = 'ERC20_TRANSFER',
    ERC20_APPROVAL = 'ERC20_APPROVAL',
    ERC20_INTERACTION = 'ERC20_INTERACTION',

    ERC721_TRANSFER = 'ERC721_TRANSFER',
    ERC721_APPROVAL = 'ERC721_APPROVAL',
    ERC721_INTERACTION = 'ERC721_INTERACTION',

    ERC1155_TRANSFER = 'ERC1155_TRANSFER',
    ERC1155_APPROVAL = 'ERC1155_APPROVAL',
    ERC1155_INTERACTION = 'ERC1155_INTERACTION',

    PERMIT2 = 'PERMIT2',
  }

  export const WEB3_STOP_WORDS = ['nft', 'crypto', 'web', 'nfts', 'drop', 'airdrop', 'airdrops'];

  export const SAFEGUARD = {
    APPROVAL_FALLBACK_THRESHOLD: '000000000000000000000000000000000000000000000000000f00000000f1f4',
    LARGE_APPROVAL_THRESHOLD_USD: 500,
    LARGE_APPROVAL_THRESHOLD_TOKEN_COUNT: 500,
    NEW_CONTRACT_THRESHOLD: 7889238000, //equivalent of 3 months in milliseconds
    MAX_APPROVAL: '7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
    LONG_APPROVAL_THRESHOLD_IN_DAYS: 30,
    TVL_THRESHOLD: -10,
    PEGGED_TOKEN_THRESHOLD: 0.99,
  };

  export const REGEX = {
    //Below regex is to remove www. as prefix to the domain unlike URI scheme, we will have to remove these on a case by case basis
    wwwRegex: /(^www.)/,
    //Following regex is to check transaction data during input validation
    hexadecimal: /^[0-9A-Fa-f]+$/,
    discordHyperlinkRegex:
      // eslint-disable-next-line max-len
      /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#/%=~_|$?!:,.]*\)|[A-Z0-9+&@#/%=~_|$])/i,
    basicDomainRegex: /(^\w+\.\w+$)/,
    urlSchemaRegex: /(^\w+:|^)\/\//,
  };

  export const BurnAddresses = [
    '0x0000000000000000000000000000000000000000',
    '0x000000000000000000000000000000000000dead',
  ];

  export const MAX_MATCHING_FUZZINESS = 0.25;
  export const MAX_FUZZY_MATCHES = 10;
  export const MAX_FUZZY_RESULTS = 3;
  export const ONE_DAY_IN_MS = 86400000;

  export const SeaportBulkOrderMessage: CommonTypes.SeaportBulkOrderMessageType = { tree: [] };

  export const OpenseaSeaportBulkOrderMaxTreeDepth = 24;

  export const NFTMarketPlaces = {
    OPENSEA: 'opensea',
  };

  export enum CounterpartyTypes {
    EOA = 'EOA',
    UNVERIFIED_CONTRACT = 'UNVERIFIED_CONTRACT',
    VERIFIED_CONTRACT = 'VERIFIED_CONTRACT',
  }

  export enum SeaportItemType {
    NATIVE_TOKEN = '0',
    ERC20 = '1',
    ERC721 = '2',
    ERC1155 = 's3',
  }

  export const enum SafeguardRiskProfilesSummary {
    ALLOW = 'ALLOW',
    WARN = 'WARN',
    BLOCK = 'BLOCK',
  }

  export const enum SafeguardRiskProfileType {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
  }

  export const enum SafeguardRiskType {
    // HIGH
    APPROVAL_ALL = 'APPROVAL_ALL',
    LARGE_APPROVAL = 'LARGE_APPROVAL',
    LONG_APPROVAL = 'LONG_APPROVAL',
    APPROVAL_TO_EOA = 'APPROVAL_TO_EOA',
    APPROVAL_TO_UNVERIFIED_CONTRACT = 'APPROVAL_TO_UNVERIFIED_CONTRACT',
    MALICIOUS_COUNTERPARTY = 'MALICIOUS_COUNTERPARTY',
    MALICIOUS_DOMAIN = 'MALICIOUS_DOMAIN',
    INSECURE_DOMAIN = 'INSECURE_DOMAIN',
    MALICIOUS_SEAPORT_SIGNATURE = 'MALICIOUS_SEAPORT_SIGNATURE',
    TRANSFER_TO_BURN_ADDRESS = 'TRANSFER_TO_BURN_ADDRESS',
    TRANSFER_TO_TOKEN_CONTRACT = 'TRANSFER_TO_TOKEN_CONTRACT',

    // MEDIUM
    NEW_CONTRACT = 'NEW_CONTRACT',
    UNVERIFIED_CONTRACT = 'UNVERIFIED_CONTRACT',
    SEAPORT_TOKEN_SALE = 'SEAPORT_TOKEN_SALE',

    // LOW
    TVL_PERCENT_CHANGE_24H = 'TVL_PERCENT_CHANGE_24H',
    TOKEN_PRICE_DEPEGS = 'TOKEN_PRICE_DEPEGS',
  }
  //#endregion

  export const enum SafeguardSimulationStatusType {
    SUCCESS = 'SUCCESS',
    FAILURE = 'FAILURE',
  }

  export const enum SafeguardMessagePrimaryType {
    PERMIT = 'Permit',
    ORDER_COMPONENTS = 'OrderComponents',
    BULK_ORDER = 'BulkOrder',
    //Permit 2 - SignatureTransfer
    PERMIT_TRANSFER_FROM = 'PermitTransferFrom',
    PERMIT_BATCH_TRANSFER_FROM = 'PermitBatchTransferFrom',
    PERMIT_WITNESS_TRANSFER_FROM = 'PermitWitnessTransferFrom',
    PERMIT_BATCH_WITNESS_TRANSFER_FROM = 'PermitBatchWitnessTransferFrom',
    //Permit 2 - Allowance Transfer
    PERMIT_SINGLE = 'PermitSingle',
    PERMIT_BATCH = 'PermitBatch',
  }

  export const ERC20PermitMessage: CommonTypes.ERC20PermitMessageType = {
    owner: 'string',
    spender: 'string',
    value: 'string',
    nonce: 'string',
    deadline: 'string',
  };

  export const DAIPermitMessage: CommonTypes.DAIPermitMessageType = {
    holder: 'string',
    spender: 'string',
    nonce: 'string',
    expiry: 'string',
    allowed: false,
  };

  export const ERC721PermitMessage: CommonTypes.ERC721PermitMessageType = {
    owner: 'string',
    spender: 'string',
    tokenId: 'string',
    deadline: 'string',
    nonce: 'string',
  };

  export const SeaportOrderMessage: CommonTypes.SeaportMessageType = {
    offerer: 'string',
    offer: [],
    consideration: [],
    startTime: 'string',
    endTime: 'string',
    orderType: 'string',
    zone: 'string',
    zoneHash: 'string',
    salt: 'string',
    conduitKey: 'string',
    totalOriginalConsiderationItems: 'string',
    counter: 'string',
  };

  export const PermitSingleMessage: CommonTypes.PermitSingleMessageType = {
    details: {
      token: 'string',
      amount: 'string',
      expiration: 'string',
      nonce: 'string',
    },
    spender: 'string',
    sigDeadline: 'string',
  };

  export const PermitBatchMessage: CommonTypes.PermitBatchMessageType = {
    details: [],
    spender: 'string',
    sigDeadline: 'string',
  };

  export const PermitTransferFromMessage: CommonTypes.PermitTransferFromMessageType = {
    permitted: {
      token: 'string',
      amount: 'string',
    },
    spender: 'string',
    nonce: 'string',
    deadline: 'string',
  };

  export const PermitBatchTransferFromMessage: CommonTypes.PermitBatchTransferFromMessageType = {
    permitted: [],
    spender: 'string',
    nonce: 'string',
    deadline: 'string',
  };

  export const PermitWitnessTransferFromMessage: CommonTypes.PermitWitnessTransferFromMessageType =
    {
      permitted: {
        token: 'string',
        amount: 'string',
      },
      spender: 'string',
      nonce: 'string',
      deadline: 'string',
      witness: 'any',
    };

  export const PermitBatchWitnessTransferFromMessage: CommonTypes.PermitBatchWitnessTransferFromMessageType =
    {
      permitted: [],
      spender: 'string',
      nonce: 'string',
      deadline: 'string',
      witness: 'any',
    };
  export const TOKENS = {
    [Chains.ETHEREUM]: {
      [Networks.MAINNET]: {
        ETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        WBTC: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
        WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      },
    },
    [Chains.BSC]: {
      [Networks.MAINNET]: {
        BNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
        CAKE: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82',
        BUSD: '0xe9e7cea3dedca5984780bafc599bd69add087d56',
      },
    },
  };
}
