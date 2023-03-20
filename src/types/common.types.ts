import type { CommonConstants } from '../constants/common.constants';
import type { Chains, Networks } from '../lib/node-multiplexer';

export namespace CommonTypes {
  export type EthereumContracts = {
    address: string;
    bytecode: string;
    function_sighashes: string[];
    is_erc20: number;
    is_erc721: number;
    block_timestamp: string;
    block_number: number;
    block_hash: string;
  };

  export type EthereumTokens = {
    address: string;
    symbol: string | null;
    name: string | null;
    decimals: number | null;
    total_supply: number | null;
    price_usd: number | null;
    block_timestamp: string;
    block_number: number;
    block_hash: string;
    token_type?: string;
  };

  export type EthereumAddressMapping = {
    address: string;
    name: string | null;
    account_type: string | null;
    contract_type: string | null;
    entity: string[];
    tags: string[];
    source: string[];
  };

  export type TransactionParams = {
    from: string;
    to: string;
    value: number;
    data: string;
    gas?: string;
    gas_price?: string;
  };

  export type MetadataParams = {
    url: string;
  };

  export type GeneralMessageParams = {
    domain: {
      name: string;
      version?: string;
      chainId: string | number;
      verifyingContract: string;
    };
    primaryType: string;
    message;
  };

  export type HighRiskInputData = {
    toAddress: string;
    counterPartyType: CommonConstants.CounterpartyTypes;
    fromAddress?: string;
    transactionData?: string;
    value?: string;
    metadata?: {
      url: string;
    };
    maliciousCounterpartyTextPrefix: string;
    shouldCheckForApprovals: boolean;
    tokenDetails?: CommonTypes.EthereumTokens;
    shouldCheckForBurns: boolean;
    deadline?: string;
    chain: Chains;
    network: Networks;
  };

  export type MediumRiskInputData = {
    toAddress: string;
    counterPartyType: CommonConstants.CounterpartyTypes;
    chain: Chains;
    network: Networks;
    contractTextPrefix: string;
  };

  export type LowRiskInputData = {
    toAddress: string;
    counterPartyType: CommonConstants.CounterpartyTypes;
    chain: Chains;
    network: Networks;
    protocol?;
  };

  export type ERC20PermitMessageType = {
    owner: string;
    spender: string;
    value: string;
    nonce: string;
    deadline: string;
  };

  export type DAIPermitMessageType = {
    holder: string;
    spender: string;
    nonce: string;
    expiry: string;
    allowed: boolean;
  };

  export type ERC721PermitMessageType = {
    owner: string;
    spender: string;
    tokenId: string;
    deadline: string;
    nonce: string;
  };

  export type ApprovalInputData = {
    toAddress: string;
    fromAddress: string;
    transactionData?: string;
    value?: string;
    counterPartyType?: CommonConstants.CounterpartyTypes;
    tokenDetails: CommonTypes.EthereumTokens;
    deadline?: string;
    chain: Chains;
    network: Networks;
  };

  export type SeaportOfferItem = {
    itemType: CommonConstants.SeaportItemType;
    token: string;
    identifierOrCriteria: string;
    startAmount: string;
    endAmount: string;
  };

  export type SeaportConsiderationItem = {
    itemType: CommonConstants.SeaportItemType;
    token: string;
    identifierOrCriteria: string;
    startAmount: string;
    endAmount: string;
    recipient: string;
  };

  export type SeaportMessageType = {
    offerer: string;
    offer: SeaportOfferItem[];
    consideration: SeaportConsiderationItem[];
    startTime: string;
    endTime: string;
    orderType: string;
    zone: string;
    zoneHash: string;
    salt: string;
    conduitKey: string;
    totalOriginalConsiderationItems?: string;
    counter: string;
  };

  export type PoolMetrics = {
    name: string;
    address: string;
    tvl_usd?: number;
    available_liquidity_usd?: number;

    token_count?: number;

    token0_address?: string;
    token0_symbol?: string;
    token0_price_usd?: number;

    token1_address?: string;
    token1_symbol?: string;
    token1_price_usd?: number;

    token2_address?: string;
    token2_symbol?: string;
    token2_price_usd?: number;

    token3_address?: string;
    token3_symbol?: string;
    token3_price_usd?: number;

    token4_address?: string;
    token4_symbol?: string;
    token4_price_usd?: number;
  };

  export type FormattedPeggedTokenData = {
    address: string;
    token1Symbol: string;
    price: number;
    token2Symbol?: string;
  };

  export type CounterpartyNameMapping = {
    address: string;
    name: string | null;
    account_type: string | null;
    contract_type: string | null;
    entity: string[];
    tags: string[];
    source: string[];
    protocol: string | null;
  };

  export type SeaportInputData = {
    offerer: string;
    offer: SeaportOfferItem[];
    consideration: SeaportConsiderationItem[];
    chain: Chains;
    network: Networks;
  };

  //permit 2  allownace types
  export type PermitDetailsType = {
    token: string;
    amount: string;
    expiration: string;
    nonce: string;
  };

  export type PermitSingleMessageType = {
    details: PermitDetailsType;
    spender: string;
    sigDeadline: string;
  };

  export type PermitBatchMessageType = {
    details: PermitDetailsType[];
    spender: string;
    sigDeadline: string;
  };

  //Permit 2 signature transfer types

  export type TokenPermissionsType = {
    token: string;
    amount: string;
  };

  export type PermitTransferFromMessageType = {
    permitted: TokenPermissionsType;
    spender: string;
    nonce: string;
    deadline: string;
  };

  export type PermitBatchTransferFromMessageType = {
    permitted: TokenPermissionsType[];
    spender: string;
    nonce: string;
    deadline: string;
  };

  export type PermitWitnessTransferFromMessageType = {
    permitted: TokenPermissionsType;
    spender: string;
    nonce: string;
    deadline: string;
    witness: any;
  };

  export type PermitBatchWitnessTransferFromMessageType = {
    permitted: TokenPermissionsType[];
    spender: string;
    nonce: string;
    deadline: string;
    witness: any;
  };

  export type FormattedPermitBatchType = {
    token: string;
    amount: string;
    spender: string;
    deadline: string;
  };

  export type DatasetMaliciousCounterparty = {
    address: string;
    tags: string[];
    contract_creator: string | null;
    contract_creation_tx: string | null;
    contract_creator_tags: string[];
    sources: string[];
    labels: string[];
  };

  export type DatasetMaliciousDomains = {
    url: string;
    sources: string[];
    labels: string[];
    tags: string[];
  };

  export type DatasetAllowedDomains = {
    url: string;
    sld: string;
    sources: string[];
  };

  export type UserParams = {
    address?: string;
    ens?: string;
  };

  export type CoinPriceInfo = {
    decimals: number;
    price: number;
    symbol: string;
    timestamp?: number;
    confidence?: number;
  };

  export type DefiLlamaCoinPriceResponse = {
    coins: { [tokenID: string]: CoinPriceInfo };
  };

  export type SeaportBulkOrderMessageType = {
    tree: [];
  };
}
