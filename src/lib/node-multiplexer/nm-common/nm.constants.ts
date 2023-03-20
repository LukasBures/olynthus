export const enum Chains {
  BITCOIN = 'BITCOIN',
  ETHEREUM = 'ETHEREUM',
  SOLANA = 'SOLANA',
  POLYGON = 'POLYGON',
  AVALANCHE = 'AVALANCHE',
  FANTOM = 'FANTOM',
  BSC = 'BSC',
}

export const enum Networks {
  MAINNET = 'MAINNET',
  TESTNET = 'TESTNET',
  KOVAN = 'KOVAN',
  GOERLI = 'GOERLI',
  MUMBAI = 'MUMBAI',
  ROPSTEN = 'ROPSTEN',
  RINKEBY = 'RINKEBY',
}

export namespace NodeConstants {
  export const enum Currencies {
    USD = 'USD',
    ETH = 'ETH',
    BTC = 'BTC',
    BNB = 'BNB',
    USDT = 'USDT',
    WBTC = 'WBTC',
    WETH = 'WETH',
    MATIC = 'MATIC',
    YFI = 'YFI',
    ZRX = 'ZRX',
    UNI = 'UNI',
    AAVE = 'AAVE',
    BAT = 'BAT',
    BUSD = 'BUSD',
    DAI = 'DAI',
    ENJ = 'ENJ',
    KNC = 'KNC',
    LINK = 'LINK',
    MANA = 'MANA',
    MKR = 'MKR',
    REN = 'REN',
    SNX = 'SNX',
    sUSD = 'sUSD',
    TUSD = 'TUSD',
    USDC = 'USDC',
    CRV = 'CRV',
    GUSD = 'GUSD',
    BAL = 'BAL',
    xSUSHI = 'xSUSHI',
    renFIL = 'renFIL',
    RAI = 'RAI',
    AMPL = 'AMPL',
    USDP = 'USDP',
    DPI = 'DPI',
    FRAX = 'FRAX',
    FEI = 'FEI',
    stETH = 'stETH',
    ENS = 'ENS',
    UST = 'UST',
    CVX = 'CVX',
    WBNB = 'WBNB',
    CAKE = 'CAKE',
    BTCB = 'BTCB',
    BUNNY = 'BUNNY',
    XVS = 'XVS',
    ALPACA = 'ALPACA',
    DOT = 'DOT',
    FINE = 'FINE',
    DOP = 'DOP',
    ADA = 'ADA',
    ALICE = 'ALICE',
    ALIX = 'ALIX',
    ALPHA = 'ALPHA',
    ALU = 'ALU',
    ATA = 'ATA',
    ATOM = 'ATOM',
    AXS = 'AXS',
    BABYDOGE = 'BABYDOGE',
    BEAR = 'BEAR',
    BEL = 'BEL',
    BELT = 'BELT',
    BIN = 'BIN',
    BMON = 'BMON',
    BNX = 'BNX',
    BP = 'BP',
    BSCPAD = 'BSCPAD',
    BTTOLD = 'BTTOLD',
    C98 = 'C98',
    CHESS = 'CHESS',
    CHR = 'CHR',
    CP = 'CP',
    DERC = 'DERC',
    DODO = 'DODO',
    DOGE = 'DOGE',
    DPET = 'DPET',
    DRACE = 'DRACE',
    DRS = 'DRS',
    DVI = 'DVI',
    ECC = 'ECC',
    EPS = 'EPS',
    FARA = 'FARA',
    FLOKI = 'FLOKI',
    FORM = 'FORM',
    FRONT = 'FRONT',
    GOLD = 'GOLD',
    HERO = 'HERO',
    HONEY = 'HONEY',
    HUNNY = 'HUNNY',
    INJ = 'INJ',
    IOTX = 'IOTX',
    KABY = 'KABY',
    KMON = 'KMON',
    LINA = 'LINA',
    MASK = 'MASK',
    MBOX = 'MBOX',
    MINIFOOTBALL = 'MINIFOOTBALL',
    MIST = 'MIST',
    MND = 'MND',
    MONI = 'MONI',
    NAFT = 'NAFT',
    NBL = 'NBL',
    NFTB = 'NFTB',
    NRV = 'NRV',
    ONE = 'ONE',
    PAID = 'PAID',
    PETG = 'PETG',
    PINK = 'PINK',
    PMON = 'PMON',
    POCO = 'POCO',
    POTS = 'POTS',
    PVU = 'PVU',
    PWT = 'PWT',
    QBT = 'QBT',
    RACA = 'RACA',
    RAMP = 'RAMP',
    REEF = 'REEF',
    RUSD = 'RUSD',
    SFP = 'SFP',
    SFUND = 'SFUND',
    SHI = 'SHI',
    SKILL = 'SKILL',
    SMON = 'SMON',
    SPS = 'SPS',
    SUSHI = 'SUSHI',
    SXP = 'SXP',
    TKO = 'TKO',
    TLM = 'TLM',
    TPT = 'TPT',
    TRONPAD = 'TRONPAD',
    TRX = 'TRX',
    TSC = 'TSC',
    TWT = 'TWT',
    UNCL = 'UNCL',
    UNCX = 'UNCX',
    VAI = 'VAI',
    WANA = 'WANA',
    WEYU = 'WEYU',
    WIN = 'WIN',
    XRP = 'XRP',
    XWG = 'XWG',
    YAY = 'YAY',
    ZIN = 'ZIN',
    WEI = 'WEI',
    GWEI = 'GWEI',
  }

  export const NATIVE_CURRENCY = {
    [Chains.ETHEREUM]: Currencies.ETH,
    [Chains.BSC]: Currencies.BNB,
    [Chains.POLYGON]: Currencies.MATIC,
  };

  export const enum TransactionTypes {
    CONTRACT_CREATION = 'CONTRACT_CREATION',
    CONTRACT_INTERACTION = 'CONTRACT_INTERACTION',
    TOKEN_TRANSFER = 'TOKEN_TRANSFER',
  }

  export const enum TokenTypes {
    BEP20 = 'BEP20',
    ERC20 = 'ERC20',
    ERC721 = 'ERC721',
    ERC1155 = 'ERC1155',
  }

  export const enum SupportedProviderTypes {
    API = 'api',
    WEB3 = 'web3',
    JSON_RPC = 'json_rpc',
    WEB_SOCKET = 'web_socket',
  }

  export const enum ProviderNames {
    ARDA_FULL_NODE = 'arda_full_node',
    ARDA_ARCHIVE_NODE = 'arda_archive_node',
    INFURA_NODE = 'infura_node',
    ALCHEMY_NODE = 'alchemy_node',
    ANKR_NODE = 'ankr_node',
    BLOCKCHAIN_SCAN = 'blockchain_scan',
    ARCHIVE_NODE_IO_NODE = 'archive_node_io_node',
  }

  export const enum PriorityForMethodKeys {
    FULL_NODE = 'full_node',
    ARCHIVE_NODE = 'archive_node',
    CONTRACT_DETAILS = 'contract_details',
    TOKEN_INFORMATION = 'token_information',
    CONTRACT_CREATION = 'contract_creation',
  }

  export const ProviderPrioritiesForMethods: {
    [methodName: string]: [
      ProviderNames | Array<ProviderNames>,
      (ProviderNames | Array<ProviderNames>)?,
      (ProviderNames | Array<ProviderNames>)?,
      (ProviderNames | Array<ProviderNames>)?,
      (ProviderNames | Array<ProviderNames>)?
    ];
  } = {
    [PriorityForMethodKeys.FULL_NODE]: [
      ProviderNames.ARDA_FULL_NODE,
      ProviderNames.ARDA_ARCHIVE_NODE,
      ProviderNames.ARCHIVE_NODE_IO_NODE,
      ProviderNames.ANKR_NODE,
      ProviderNames.INFURA_NODE,
    ],
    [PriorityForMethodKeys.ARCHIVE_NODE]: [
      ProviderNames.ARDA_ARCHIVE_NODE,
      ProviderNames.ARCHIVE_NODE_IO_NODE,
      ProviderNames.ANKR_NODE,
      ProviderNames.INFURA_NODE,
    ],
    // TODO: If we are adding a backup for blockchainScan, then we have to change "isActive()" code for blockchainScan
    // Why //? Since we don't have an alternative, "isActive()" in blockchainScan is set to true.
    // ? We assume blockchainScan works and hit the API to save ~2s of latency
    [PriorityForMethodKeys.TOKEN_INFORMATION]: [ProviderNames.BLOCKCHAIN_SCAN],
    [PriorityForMethodKeys.CONTRACT_DETAILS]: [ProviderNames.BLOCKCHAIN_SCAN],
    [PriorityForMethodKeys.CONTRACT_CREATION]: [ProviderNames.BLOCKCHAIN_SCAN],
  };

  export const enum EtherUnits {
    wei = 'wei',
    kwei = 'kwei',
    mwei = 'mwei',
    gwei = 'gwei',
    szabo = 'szabo',
    micro = 'micro',
    finney = 'finney',
    milli = 'milli',
    ether = 'ether',
    kether = 'kether',
    mether = 'mether',
    gether = 'gether',
    tether = 'tether',
  }

  export const BLOCK_GRAPH_URL = {
    [Chains.ETHEREUM]: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
    [Chains.BSC]: 'https://api.thegraph.com/subgraphs/name/pancakeswap/blocks',
  };

  export const ETHER_UNITS_DECIMALS = {
    [EtherUnits.wei]: 0,
    [EtherUnits.kwei]: 3,
    [EtherUnits.mwei]: 6,
    [EtherUnits.gwei]: 9,
    [EtherUnits.micro]: 12,
    [EtherUnits.szabo]: 12,
    [EtherUnits.milli]: 15,
    [EtherUnits.finney]: 15,
    [EtherUnits.ether]: 18,
    [EtherUnits.kether]: 21,
    [EtherUnits.mether]: 24,
    [EtherUnits.gether]: 27,
    [EtherUnits.tether]: 30,
  };

  export const INTERFACE_ABIS = {
    ERC_20: [
      {
        inputs: [],
        name: 'name',
        outputs: [
          {
            internalType: 'string',
            name: '',
            type: 'string',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'symbol',
        outputs: [
          {
            internalType: 'string',
            name: '',
            type: 'string',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'decimals',
        outputs: [
          {
            internalType: 'uint8',
            name: '',
            type: 'uint8',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [],
        name: 'totalSupply',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'account',
            type: 'address',
          },
        ],
        name: 'balanceOf',
        outputs: [
          {
            internalType: 'uint256',
            name: '',
            type: 'uint256',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'transfer',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'transferFrom',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          {
            internalType: 'address',
            name: 'spender',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'approve',
        outputs: [
          {
            internalType: 'bool',
            name: '',
            type: 'bool',
          },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'from',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'to',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'Transfer',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'spender',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'value',
            type: 'uint256',
          },
        ],
        name: 'Approval',
        type: 'event',
      },
    ],
  };
}
