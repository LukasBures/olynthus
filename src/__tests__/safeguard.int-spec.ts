import nock from 'nock';
import request from 'supertest';
import { app } from '../../main';
import { CommonConstants } from '../constants/common.constants';
import { GetMessageRiskProfilesTestConstants } from './constants/get-message-risk-profiles.test.constants';
import { GetTransactionRiskProfilesTestConstants } from './constants/get-transactions-risk-profiles.test.constants';
import { GetUserRiskProfilesTestConstants } from './constants/get-user-risk-profile.test.constants';
import { IntegrationSpecHelper } from '../utils/int-spec.helper.utils';

describe('Safeguard API', () => {
  let intSpecHelper: IntegrationSpecHelper;
  let server;

  const MESSAGE_RISK_INVALID_DOMAIN_DATA_MISSING_PERMIT_AND_MESSAGE_DATA_REQUEST = {
    message: {
      domain: {
        name: '',
        version: '',
        verifyingContract: '10xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
      },
    },
  };
  const MESSAGE_RISK_INVALID_MESSAGE_MESSAGE_DATA_REQUEST = {
    message: {
      domain: {
        name: 'DAI',
        version: '2',
        verifyingContract: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
        chainId: '1',
      },
      primaryType: 'Permit',
      message: {
        holder: '10xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        spender: '10x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        allowed: 'true',
        nonce: '',
        expiry: '528721659',
      },
    },
  };

  const MESSAGE_RISK_MALICIOUS_COUNTERPARTY_API_REQUEST = {
    message: {
      domain: {
        name: 'USD Coin',
        version: '2',
        verifyingContract: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
        chainId: '1',
      },
      primaryType: 'Permit',
      message: {
        owner: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        spender: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        value: '120',
        nonce: '7',
        deadline: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 10).toString(),
      },
    },
    metadata: {
      url: '',
    },
  };

  const MESSAGE_LARGE_APPROVAL_API_REQUEST = {
    message: {
      domain: {
        name: 'USD Coin',
        version: '2',
        verifyingContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainId: '1',
      },
      primaryType: 'Permit',
      message: {
        owner: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        spender: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        value: '1010000000',
        nonce: '7',
        deadline: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 10).toString(),
      },
    },
    metadata: {
      url: '',
    },
  };

  const MESSAGE_LONG_APPROVAL_API_REQUEST = {
    message: {
      domain: {
        name: 'USD Coin',
        version: '2',
        verifyingContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        chainId: '1',
      },
      primaryType: 'Permit',
      message: {
        owner: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        spender: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        value: '1200',
        nonce: '7',
        deadline: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 31.25).toString(),
      },
    },
    metadata: {
      url: '',
    },
  };

  const MESSAGE_DAI_LARGE_APPROVAL_MALICIOUS_EOA_AS_VERIFYING_CONTRACT_API_REQUEST = {
    message: {
      domain: {
        name: 'DAI',
        version: '2',
        verifyingContract: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
        chainId: '1',
      },
      primaryType: 'Permit',
      message: {
        holder: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        spender: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
        allowed: true,
        nonce: '7',
        expiry: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 11).toString(),
      },
    },
    metadata: {
      url: '',
    },
  };

  const MESSAGE_MALICIOUS_COUNTERPARTY_ERC721_API_REQUEST = {
    message: {
      domain: {
        name: 'USD Coin',
        version: '2',
        verifyingContract: '0x484f744e6AEF1152CFfd03177962b23dE488c58D',
        chainId: '1',
      },
      primaryType: 'Permit',
      message: {
        owner: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
        spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
        tokenId: '123000000000',
        nonce: '7',
        deadline: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 11).toString(),
      },
    },
    metadata: {
      url: '',
    },
  };

  const MESSAGE_SEAPORT_ORDERS_API_REQUEST = {
    message: {
      primaryType: 'OrderComponents',
      domain: {
        name: 'Seaport',
        version: '1.1',
        chainId: '1',
        verifyingContract: '0x00000000006c3852cbef3e08e8df289169ede581',
      },
      message: {
        offerer: '0xed2ab4948bA6A909a7751DEc4F34f303eB8c7236',
        offer: [
          {
            itemType: '2',
            token: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
            identifierOrCriteria: '1726',
            startAmount: '1',
            endAmount: '1',
          },
        ],
        consideration: [
          {
            itemType: '0',
            token: '0x0000000000000000000000000000000000000000',
            identifierOrCriteria: '0',
            startAmount: '194050000000000000000',
            endAmount: '194050000000000000000',
            recipient: '0xed2ab4948bA6A909a7751DEc4F34f303eB8c7236',
          },
          {
            itemType: '0',
            token: '0x0000000000000000000000000000000000000000',
            identifierOrCriteria: '0',
            startAmount: '2475000000000000000',
            endAmount: '2475000000000000000',
            recipient: '0x0000a26b00c1F0DF003000390027140000fAa719',
          },
          {
            itemType: '0',
            token: '0x0000000000000000000000000000000000000000',
            identifierOrCriteria: '0',
            startAmount: '2475000000000000000',
            endAmount: '2475000000000000000',
            recipient: '0xA858DDc0445d8131daC4d1DE01f834ffcbA52Ef1',
          },
        ],
        startTime: '1664436437',
        endTime: '1667028437',
        orderType: '2',
        zone: '0x004C00500000aD104D7DBd00e3ae0A5C00560C00',
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        salt: '24446860302761739304752683030156737591518664810215442929818054330004503495628',
        conduitKey: '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000',
        counter: '53',
      },
    },
    metadata: {
      url: 'https://0pensea.io',
    },
  };

  const MESSAGE_SEAPORT_ORDERS_ENS_API_REQUEST = {
    message: {
      primaryType: 'OrderComponents',
      domain: {
        name: 'Seaport',
        version: '1.1',
        chainId: '1',
        verifyingContract: '0x00000000006c3852cbef3e08e8df289169ede581',
      },
      message: {
        offerer: '0xed2ab4948bA6A909a7751DEc4F34f303eB8c7236',
        offer: [
          {
            itemType: '2',
            token: '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85',
            identifierOrCriteria: '44362024987804491020286',
            startAmount: '1',
            endAmount: '1',
          },
        ],
        consideration: [
          {
            itemType: '0',
            token: '0x0000000000000000000000000000000000000000',
            identifierOrCriteria: '0',
            startAmount: '4050000000000000000',
            endAmount: '4050000000000000000',
            recipient: '0xed2ab4948bA6A909a7751DEc4F34f303eB8c7236',
          },
          {
            itemType: '0',
            token: '0x0000000000000000000000000000000000000000',
            identifierOrCriteria: '0',
            startAmount: '2475000000000000000',
            endAmount: '2475000000000000000',
            recipient: '0x0000a26b00c1F0DF003000390027140000fAa719',
          },
          {
            itemType: '0',
            token: '0x0000000000000000000000000000000000000000',
            identifierOrCriteria: '0',
            startAmount: '2475000000000000000',
            endAmount: '2475000000000000000',
            recipient: '0xA858DDc0445d8131daC4d1DE01f834ffcbA52Ef1',
          },
        ],
        startTime: '1664436437',
        endTime: '1667028437',
        orderType: '2',
        zone: '0x004C00500000aD104D7DBd00e3ae0A5C00560C00',
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        salt: '24446860302761739304752683030156737591518664810215442929818054330004503495628',
        conduitKey: '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000',
        counter: '53',
      },
    },
    metadata: {
      url: 'https://opensea.io',
    },
  };

  const MESSAGE_SEAPORT_ORDERS_MALICIOUS_SIGNATURE_API_REQUEST = {
    message: {
      primaryType: 'OrderComponents',
      domain: {
        name: 'Seaport',
        version: '1.1',
        chainId: '1',
        verifyingContract: '0x00000000006c3852cbef3e08e8df289169ede581',
      },
      message: {
        offerer: '0xed2ab4948bA6A909a7751DEc4F34f303eB8c7236',
        offer: [
          {
            itemType: '2',
            token: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
            identifierOrCriteria: '1726',
            startAmount: '1',
            endAmount: '1',
          },
          {
            itemType: '2',
            token: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
            identifierOrCriteria: '4726',
            startAmount: '1',
            endAmount: '1',
          },
        ],
        consideration: [
          {
            itemType: '0',
            token: '0x0000000000000000000000000000000000000000',
            identifierOrCriteria: '0',
            startAmount: '4050000000000000000',
            endAmount: '4050000000000000000',
            recipient: '0xed2ab4948bA6A909a7751DEc4F34f303eB8c7236',
          },
          {
            itemType: '0',
            token: '0x0000000000000000000000000000000000000000',
            identifierOrCriteria: '0',
            startAmount: '2475000000000000000',
            endAmount: '2475000000000000000',
            recipient: '0x0000a26b00c1F0DF003000390027140000fAa719',
          },
          {
            itemType: '0',
            token: '0x0000000000000000000000000000000000000000',
            identifierOrCriteria: '0',
            startAmount: '2475000000000000000',
            endAmount: '2475000000000000000',
            recipient: '0xA858DDc0445d8131daC4d1DE01f834ffcbA52Ef1',
          },
        ],
        startTime: '1664436437',
        endTime: '1667028437',
        orderType: '2',
        zone: '0x004C00500000aD104D7DBd00e3ae0A5C00560C00',
        zoneHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        salt: '24446860302761739304752683030156737591518664810215442929818054330004503495628',
        conduitKey: '0x0000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000',
        counter: '53',
      },
    },
    metadata: {
      url: 'https://opensea.io',
    },
  };

  const MESSAGE_PERMIT_SINGLE_MALICIOUS_COUNTERPARTY_API_REQUEST = {
    message: {
      domain: {
        name: 'Permit2',
        verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
        chainId: '1',
        version: '0',
      },
      primaryType: 'PermitSingle',
      message: {
        details: {
          token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          amount: '1461501637330902918203684832716283019655932542975',
          expiration: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 11).toString(),
          nonce: '0',
        },
        spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
        sigDeadline: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 11).toString(),
      },
    },
    metadata: {
      url: 'https://app.uniswap.org/#/swap',
    },
  };

  const MESSAGE_PERMIT_BATCH_MALICIOUS_COUNTERPARTY_API_REQUEST = {
    message: {
      domain: {
        name: 'Permit2',
        verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
        chainId: '1',
        version: '0',
      },
      primaryType: 'PermitBatch',
      message: {
        details: [
          {
            token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '1461501637330902918203684832716283019655932542975',
            expiration: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 31.25).toString(),
            nonce: '0',
          },
          {
            token: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            amount: '1461501637330902918203684832716283019655932542975',
            expiration: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 31.25).toString(),
            nonce: '0',
          },
        ],
        spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
        sigDeadline: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 31.25).toString(),
      },
    },
    metadata: {
      url: 'https://app.uniswap.org/#/swap',
    },
  };

  const MESSAGE_PERMIT_TRANSFER_FROM_MALICIOUS_COUNTERPARTY_API_REQUEST = {
    message: {
      domain: {
        name: 'Permit2',
        verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
        chainId: '1',
        version: '0',
      },
      primaryType: 'PermitTransferFrom',
      message: {
        permitted: {
          token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          amount: '1461501637330902918203684832716283019655932542975',
        },
        spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
        nonce: '0',
        deadline: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 11).toString(),
      },
    },
    metadata: {
      url: 'https://app.uniswap.org/#/swap',
    },
  };

  const MESSAGE_PERMIT_BATCH_TRANSFER_FROM_MALICIOUS_COUNTERPARTY_API_REQUEST = {
    message: {
      domain: {
        name: 'Permit2',
        verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
        chainId: '1',
        version: '0',
      },
      primaryType: 'PermitBatchTransferFrom',
      message: {
        permitted: [
          {
            token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '1461501637330902918203684832716283019655932542975',
          },
          {
            token: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            amount: '1461501637330902918203684832716283019655932542975',
          },
        ],
        spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
        nonce: '0',
        deadline: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 11).toString(),
      },
    },
    metadata: {
      url: 'https://app.uniswap.org/#/swap',
    },
  };

  const MESSAGE_PERMIT_WITNESS_TRANSFER_FROM_MALICIOUS_COUNTERPARTY_API_REQUEST = {
    message: {
      domain: {
        name: 'Permit2',
        verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
        chainId: '1',
        version: '0',
      },
      primaryType: 'PermitWitnessTransferFrom',
      message: {
        permitted: {
          token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          amount: '1461501637330902918203684832716283019655932542975',
        },
        spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
        nonce: '0',
        deadline: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 11).toString(),
        witness: {
          user: '0x07b1105157c99f4ee9e6033abd7d9f8251873094',
        },
      },
    },
    metadata: {
      url: 'https://app.uniswap.org/#/swap',
    },
  };

  const MESSAGE_PERMIT_BATCH_WITNESS_TRANSFER_FROM_MALICIOUS_COUNTERPARTY_API_REQUEST = {
    message: {
      domain: {
        name: 'Permit2',
        verifyingContract: '0x000000000022d473030f116ddee9f6b43ac78ba3',
        chainId: '1',
        version: '0',
      },
      primaryType: 'PermitBatchWitnessTransferFrom',
      message: {
        permitted: [
          {
            token: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            amount: '1461501637330902918203684832716283019655932542975',
          },
          {
            token: '0xdac17f958d2ee523a2206206994597c13d831ec7',
            amount: '1461501637330902918203684832716283019655932542975',
          },
        ],
        spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
        nonce: '0',
        deadline: (Date.now() + CommonConstants.ONE_DAY_IN_MS * 11).toString(),
        witness: {
          user: '0x07b1105157c99f4ee9e6033abd7d9f8251873094',
        },
      },
    },
    metadata: {
      url: 'https://app.uniswap.org/#/swap',
    },
  };

  const USER_MALICIOUS_COUNTERPARTY_API_REQUEST = {
    user: {
      address: '0x07b1105157c99f4ee9e6033abd7d9f8251873094',
    },
  };

  const USER_ENS_API_REQUEST = {
    user: {
      ens: 'yathish.eth',
    },
  };

  beforeAll(async () => {
    server = app.listen(
      process.env.CONFIG_PORT,
      () => `server running on port ${process.env.CONFIG_PORT}`
    );
    intSpecHelper = new IntegrationSpecHelper();

    await intSpecHelper.createClickhouseDatabases();
    await intSpecHelper.createClickhouseTables();
    await intSpecHelper.insertIntoClickhouseTables();
  });

  afterAll(async () => {
    server.close();
    await intSpecHelper.dropClickhouseDatabases();
  });

  let etherScanMock;
  let ardaFullNodeMock;
  let ardaArchiveNodeMock;
  let TRANSACTION_RISK_API_REQUEST;
  let simpleHashNodeMock;
  let defillamaMock;

  beforeEach(() => {
    etherScanMock = intSpecHelper.setupEtherscanNodeMock();
    ardaFullNodeMock = intSpecHelper.setupArdaFullNodeMock();
    ardaArchiveNodeMock = intSpecHelper.setupArdaArchiveNodeMock();
    simpleHashNodeMock = intSpecHelper.setupSimpleHashNodeMock();
    defillamaMock = intSpecHelper.setupDefillamaMock();

    intSpecHelper.addHealthChecksToArdaFullNodeMock(ardaFullNodeMock);
    intSpecHelper.addHealthChecksToArdaArchiveNodeMock(ardaArchiveNodeMock);

    TRANSACTION_RISK_API_REQUEST = {
      transaction: {
        from: '',
        to: '',
        value: 0,
        data: '',
        gas: '21000',
        gas_price: '1000000000',
      },
      metadata: {
        url: '',
      },
    };
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Input Validation', () => {
    it('should return 400 for wrong transaction.from', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = 'random';

      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc5bF33C8F9d75BBB3a570058216604c0fAb1Af57';

      TRANSACTION_RISK_API_REQUEST.transaction.data = '';
      TRANSACTION_RISK_API_REQUEST.metadata.url = '';
      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert400Body(expect, response, [
        {
          statusCode: 400,
          message: ['transaction.from should be valid ethereum address'],
          error: 'Bad Request',
        },
      ]);
    });

    it('should return 400 for wrong transaction.data', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc5bF33C8F9d75BBB3a570058216604c0fAb1Af57';
      TRANSACTION_RISK_API_REQUEST.transaction.data = '0x*******????---';
      TRANSACTION_RISK_API_REQUEST.metadata.url = '';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert400Body(expect, response, [
        {
          statusCode: 400,
          message: ['transaction.data should be a valid transaction data'],
          error: 'Bad Request',
        },
      ]);
    });

    it('should return 400 for invalid metadata.url', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc5bF33C8F9d75BBB3a570058216604c0fAb1Af57';
      TRANSACTION_RISK_API_REQUEST.metadata.url = 'opensea.io';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert400Body(expect, response, [
        {
          statusCode: 400,
          message: ['metadata.url should be a valid URL'],
          error: 'Bad Request',
        },
      ]);
    });

    /**
     * ! Note: In current validation flow for message request data, Custom message object nested validation will be done only after DTO validation succeeds.
     * ! Hence even if invalid message object is present in the request, the error will be thrown only when DTO specific input errors are rectified.
     * ! Therefore, adding two separate test cases to validate each cases.
     */

    it('should return 400 for Message Risk Profiling request containing wrong message.domain and missing message.permit & message.message data', async () => {
      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_RISK_INVALID_DOMAIN_DATA_MISSING_PERMIT_AND_MESSAGE_DATA_REQUEST);
      intSpecHelper.assert400Body(expect, response, [
        {
          statusCode: 400,
          message: [
            'message.domain.name should not be empty',
            'message.domain.chainId should not be empty',
            'message.domain.verifyingContract should be valid ethereum address',
            'message.primaryType must be a string',
            'message.primaryType should not be empty',
            'message.message must be an object',
            'message.message should not be empty',
          ],
          error: 'Bad Request',
        },
      ]);
    });

    it('should return 400 for Message Risk Profiling request containing wrong message.message data', async () => {
      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_RISK_INVALID_MESSAGE_MESSAGE_DATA_REQUEST);
      intSpecHelper.assert400Body(expect, response, [
        {
          statusCode: 400,
          message: [
            'message.message.holder should be valid ethereum address',
            'message.message.spender should be valid ethereum address',
            'message.message.allowed should be a valid boolean value',
            'message.message.nonce should not be empty',
            'message.message.expiry should be a valid future unix epoch time',
          ],
          error: 'Bad Request',
        },
      ]);
    });
  });

  describe('Transaction Risk Profiles', () => {
    it('should return EOA_INTERACTION with ALLOW', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc5bF33C8F9d75BBB3a570058216604c0fAb1Af57';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: { name: '' },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'ALLOW',
              counts: [
                { risk_profile_type: 'LOW', count: 0 },
                { risk_profile_type: 'MEDIUM', count: 0 },
                { risk_profile_type: 'HIGH', count: 0 },
              ],
            },
            data: [],
          },
          simulation: { status: 'SUCCESS', failure_text: '', balances: [] },
        },
      ]);
    });

    it('should return CONTRACT_INTERACTION with MALICIOUS_COUNTERPARTY', async () => {
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].tokeninfo
        );
      const idArr = new Array(10).fill(0);
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetTransactionRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
            ].eth_getCode,
        });

      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: { name: '' },
          tx_type: 'CONTRACT_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                { risk_profile_type: 'LOW', count: 0 },
                { risk_profile_type: 'MEDIUM', count: 1 },
                { risk_profile_type: 'HIGH', count: 1 },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_COUNTERPARTY',
                text: 'The contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is an identified malicious counterparty',
                details: {
                  labels: [],
                  malicious_counterparty: {
                    address: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                    type: 'CONTRACT',
                  },
                  tags: [],
                },
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'UNVERIFIED_CONTRACT',
                text: 'The contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is not verified',
              },
            ],
          },
          simulation: { status: 'SUCCESS', failure_text: '', balances: [] },
        },
      ]);
    });

    it('should return ERC20_APPROVAL with LARGE_APPROVAL, APPROVAL_TO_UNVERIFIED_CONTRACT, UNVERIFIED_CONTRACT and APPROVAL_TO_EOA (spender)', async () => {
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xb2dd0dc22c7d103928650abd260935ef9ef40cfc'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xb2dd0dc22c7d103928650abd260935ef9ef40cfc'
          ].tokeninfo
        );

      const idArr = new Array(10).fill(0);
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xb2dd0dc22c7d103928650abd260935ef9ef40cfc'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetTransactionRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xb2dd0dc22c7d103928650abd260935ef9ef40cfc'
            ].eth_getCode,
        });

      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xb2dd0dc22c7d103928650abd260935ef9ef40cfc';
      TRANSACTION_RISK_API_REQUEST.transaction.data =
        '0x095ea7b3000000000000000000000000000000000532b45f47779fce440748893b257865f000000000000000000000000000000000000000000000000000000000000001';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: '',
          },
          tx_type: 'CONTRACT_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 3,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_UNVERIFIED_CONTRACT',
                text: 'This transaction asks for approval to unverified contract 0xb2dd0dc22c7d103928650abd260935ef9ef40cfc',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_EOA',
                text: 'This transaction asks for approval to private spender address 0x000000000532B45f47779FCe440748893b257865',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LARGE_APPROVAL',
                text: 'This transaction asks for a large approval of 1.0855508365998393e+77 tokens',
                details: {
                  approvals: [
                    {
                      spender: '0x000000000532B45f47779FCe440748893b257865',
                      approval_value:
                        '108555083659983933209597798445644913612440610624038028786991485007418559037441',
                      from: '0xb5bd917bc25f412d029cb2ab791bff6cd78fd1ac',
                      token: {
                        address: '0xb2dd0dc22c7d103928650abd260935ef9ef40cfc',
                        name: '',
                      },
                    },
                  ],
                },
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'UNVERIFIED_CONTRACT',
                text: 'The contract 0xb2dd0dc22c7d103928650abd260935ef9ef40cfc is not verified',
              },
            ],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [],
          },
        },
      ]);
    });

    it('should return ERC20_APPROVAL with LARGE_APPROVAL and APPROVAL_TO_EOA (spender) for increaseAllowance function', async () => {
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0x4b92d19c11435614cd49af1b589001b7c08cd4d5'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0x4b92d19c11435614cd49af1b589001b7c08cd4d5'
          ].tokeninfo
        );
      const idArr = new Array(10).fill(0);
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0x4b92d19c11435614cd49af1b589001b7c08cd4d5'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetTransactionRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0x4b92d19c11435614cd49af1b589001b7c08cd4d5'
            ].eth_getCode,
        });

      TRANSACTION_RISK_API_REQUEST.transaction.from = '0x53461e4fddcc1385f1256ae24ce3505be664f249';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0x4b92d19c11435614cd49af1b589001b7c08cd4d5';
      TRANSACTION_RISK_API_REQUEST.transaction.data =
        '0x395093510000000000000000000000001fcdb04d0c5364fbd92c73ca8af9baa72c269107ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: 'Badger WBTC yVault',
          },
          tx_type: 'ERC20_APPROVAL',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 2,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_EOA',
                text: 'This transaction asks for approval to private spender address 0x1FCdb04d0C5364FBd92C73cA8AF9BAA72c269107',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LARGE_APPROVAL',
                text: 'This transaction asks for a large approval of 1.157920892373162e+77 byvWBTC tokens',
                details: {
                  approvals: [
                    {
                      spender: '0x1FCdb04d0C5364FBd92C73cA8AF9BAA72c269107',
                      approval_value:
                        '115792089237316195423570985008687907853269984665640564039457584007913129639935',
                      from: '0x53461e4fddcc1385f1256ae24ce3505be664f249',
                      token: {
                        address: '0x4b92d19c11435614cd49af1b589001b7c08cd4d5',
                        name: 'byvWBTC',
                      },
                    },
                  ],
                },
              },
            ],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [],
          },
        },
      ]);
    });

    it('should return ERC721_TRANSFER with UNVERIFIED_CONTRACT and TRANSFER_TO_TOKEN_CONTRACT', async () => {
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0x839c6ca36f51fc2dbf466e027b8a57f840dc9c57'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0x839c6ca36f51fc2dbf466e027b8a57f840dc9c57'
          ].tokeninfo
        );
      const idArr = new Array(10).fill(0);
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0x839c6ca36f51fc2dbf466e027b8a57f840dc9c57'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetTransactionRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0x839c6ca36f51fc2dbf466e027b8a57f840dc9c57'
            ].eth_getCode,
        });

      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0x839c6ca36f51fc2dbf466e027b8a57f840dc9c57';
      TRANSACTION_RISK_API_REQUEST.transaction.data =
        '0xa9059cbb000000000000000000000000b5bd917bc25f412d029cb2ab791bff6cd78fd1ac0000000000000000000000000000000000000000000000000000000000000032';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: 'Project Fox',
          },
          tx_type: 'ERC721_TRANSFER',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 1,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'TRANSFER_TO_TOKEN_CONTRACT',
                text: 'This transaction transfers token(s) to the Project Fox (FOX) ERC-20 Token Contract 0x839c6ca36f51fc2dbf466e027b8a57f840dc9c57',
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'UNVERIFIED_CONTRACT',
                text: 'The contract 0x839c6ca36f51fc2dbf466e027b8a57f840dc9c57 is not verified',
              },
            ],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [],
          },
        },
      ]);
    });

    it('should return EOA_INTERACTION with MALICIOUS_DOMAIN', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc5bF33C8F9d75BBB3a570058216604c0fAb1Af57';
      TRANSACTION_RISK_API_REQUEST.metadata.url = 'https://0pensea.io';
      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: '',
          },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 1,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_DOMAIN',
                text: 'The url https://0pensea.io matches with identified malicious domain 0pensea.io',
                details: {
                  labels: ['nft-minter'],
                  malicious_domain: '0pensea.io',
                  tags: ['phish-hack'],
                },
              },
            ],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [],
          },
        },
      ]);
    });

    it('should return CONTRACT_INTERACTION with NEW_CONTRACT', async () => {
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xffaef3f8a37014b932334d283f90a2408eba0328'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xffaef3f8a37014b932334d283f90a2408eba0328'
          ].tokeninfo
        );

      etherScanMock
        .get('/api')
        .query(
          (queryObj) => queryObj.module === 'contract' && queryObj.action === 'getcontractcreation'
        )
        .times(2)
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xffaef3f8a37014b932334d283f90a2408eba0328'
          ].contractCreation
        );

      const idArr = new Array(10).fill(0);
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xffaef3f8a37014b932334d283f90a2408eba0328'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetTransactionRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xffaef3f8a37014b932334d283f90a2408eba0328'
            ].eth_getCode,
        });

      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xffaef3f8a37014b932334d283f90a2408eba0328';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(
        expect,
        response,
        [
          {
            chain: 'ETHEREUM',
            network: 'MAINNET',
            counterparty_details: {
              name: '',
            },
            tx_type: 'CONTRACT_INTERACTION',
            risk_profiles: {
              summary: {
                result: 'BLOCK',
                counts: [
                  {
                    risk_profile_type: 'LOW',
                    count: 0,
                  },
                  {
                    risk_profile_type: 'MEDIUM',
                    count: 2,
                  },
                  {
                    risk_profile_type: 'HIGH',
                    count: 0,
                  },
                ],
              },
              data: [
                {
                  risk_profile_type: 'MEDIUM',
                  risk_type: 'NEW_CONTRACT',
                  text: 'The contract 0xffaef3f8a37014b932334d283f90a2408eba0328 was created recently. Proceed with caution',
                  details: {
                    contract: '0xffaef3f8a37014b932334d283f90a2408eba0328',
                    contract_created_at: new Date(Date.now() - 1000 * 3600 * 24 * 10).toISOString(), // 10 days ago so test runs for new contracts
                  },
                },
                {
                  risk_profile_type: 'MEDIUM',
                  risk_type: 'UNVERIFIED_CONTRACT',
                  text: 'The contract 0xffaef3f8a37014b932334d283f90a2408eba0328 is not verified',
                },
              ],
            },
            simulation: {
              status: 'SUCCESS',
              failure_text: '',
              balances: [],
            },
          },
        ],
        'id',
        ['contract_created_at']
      );
    });

    it('should not return EOA_INTERACTION with RISK_TYPE as INSECURE_DOMAIN when the URL has https as the URL scheme', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc5bF33C8F9d75BBB3a570058216604c0fAb1Af57';
      TRANSACTION_RISK_API_REQUEST.metadata.url = 'https://opensea.io';
      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: '',
          },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'ALLOW',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 0,
                },
              ],
            },
            data: [],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [],
          },
        },
      ]);
    });

    it('should return EOA_INTERACTION with RISK_TYPE as INSECURE_DOMAIN when the url has http as the URL scheme', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xc5bF33C8F9d75BBB3a570058216604c0fAb1Af57';
      TRANSACTION_RISK_API_REQUEST.metadata.url = 'http://opensea.io';
      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: '',
          },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 1,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'INSECURE_DOMAIN',
                text: 'The url http://opensea.io is an insecure URL',
              },
            ],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [],
          },
        },
      ]);
    });

    it('should return EOA_INTERACTION with ALLOW when the URL matches with an allowlisted domain', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc5bF33C8F9d75BBB3a570058216604c0fAb1Af57';
      TRANSACTION_RISK_API_REQUEST.metadata.url = 'https://opensea.io';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: { name: '' },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'ALLOW',
              counts: [
                { risk_profile_type: 'LOW', count: 0 },
                { risk_profile_type: 'MEDIUM', count: 0 },
                { risk_profile_type: 'HIGH', count: 0 },
              ],
            },
            data: [],
          },
          simulation: { status: 'SUCCESS', failure_text: '', balances: [] },
        },
      ]);
    });

    it('should return EOA_INTERACTION with BLOCK when the URL fuzzy matches (different prefix) with an allowlisted domain', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc5bF33C8F9d75BBB3a570058216604c0fAb1Af57';
      TRANSACTION_RISK_API_REQUEST.metadata.url = 'https://web-bayc.com';
      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: { name: '' },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                { risk_profile_type: 'LOW', count: 0 },
                { risk_profile_type: 'MEDIUM', count: 0 },
                { risk_profile_type: 'HIGH', count: 1 },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_DOMAIN',
                text: 'The url https://web-bayc.com is identified as a malicious domain as it resembles verified domain(s) bayc.com',
                details: { tags: ['phish-hack'], malicious_domain: 'https://web-bayc.com' },
              },
            ],
          },
          simulation: { status: 'SUCCESS', failure_text: '', balances: [] },
        },
      ]);
    });

    it('should return EOA_INTERACTION with BLOCK when the URL fuzzy matches (different TLD) with an allowlisted domain', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc5bF33C8F9d75BBB3a570058216604c0fAb1Af57';
      TRANSACTION_RISK_API_REQUEST.metadata.url = 'https://opensea.com';
      TRANSACTION_RISK_API_REQUEST.transaction.data = '';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: { name: '' },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                { risk_profile_type: 'LOW', count: 0 },
                { risk_profile_type: 'MEDIUM', count: 0 },
                { risk_profile_type: 'HIGH', count: 1 },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_DOMAIN',
                text: 'The url https://opensea.com is identified as a malicious domain as it resembles verified domain(s) opensea.io',
                details: { tags: ['phish-hack'], malicious_domain: 'https://opensea.com' },
              },
            ],
          },
          simulation: { status: 'SUCCESS', failure_text: '', balances: [] },
        },
      ]);
    });

    it('should return EOA_INTERACTION with BLOCK when the URL fuzzy matches (different subdomain) with an allowlisted domain', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc5bF33C8F9d75BBB3a570058216604c0fAb1Af57';

      TRANSACTION_RISK_API_REQUEST.metadata.url = 'https://nft.opensea.com';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: { name: '' },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                { risk_profile_type: 'LOW', count: 0 },
                { risk_profile_type: 'MEDIUM', count: 0 },
                { risk_profile_type: 'HIGH', count: 1 },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_DOMAIN',
                text: 'The url https://nft.opensea.com is identified as a malicious domain as it resembles verified domain(s) opensea.io',
                details: { tags: ['phish-hack'], malicious_domain: 'https://nft.opensea.com' },
              },
            ],
          },
          simulation: { status: 'SUCCESS', failure_text: '', balances: [] },
        },
      ]);
    });

    it('should return BLOCK with TRANSFER_TO_BURN_ADDRESS when to address is a Burn Address', async () => {
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0x000000000000000000000000000000000000dead'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0x000000000000000000000000000000000000dead'
          ].tokeninfo
        );

      const idArr = new Array(10).fill(0);
      intSpecHelper.addHealthChecksToArdaFullNodeMock(ardaFullNodeMock, 1);
      intSpecHelper.addHealthChecksToArdaFullNodeMock(ardaFullNodeMock, 1);
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0x000000000000000000000000000000000000dead'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetTransactionRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0x000000000000000000000000000000000000dead'
            ].eth_getCode,
        });

      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0x000000000000000000000000000000000000dead';
      TRANSACTION_RISK_API_REQUEST.transaction.data =
        '0xa9059cbb000000000000000000000000000000000000000000000000000000000000dead0000000000000000000000000000000000000000000000000000000002e96bbc';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: 'Burn Address',
          },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 1,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'TRANSFER_TO_BURN_ADDRESS',
                text: 'This transaction transfers token(s) to the Burn Address 0x000000000000000000000000000000000000dead',
              },
            ],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [],
          },
        },
      ]);
    });

    it('should return BLOCK with TRANSFER_TO_TOKEN_CONTRACT when the to address is Token Contract in Tokens Table', async () => {
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetTransactionRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].tokeninfo
        );

      const idArr = new Array(10).fill(0);
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetTransactionRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ].eth_getCode,
        });

      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      TRANSACTION_RISK_API_REQUEST.transaction.data =
        '0xa9059cbb00000000000000000000000087adf4d3e1eb630d41405c6ea5c0021c5b6614ff0000000000000000000000000000000000000000000000000000000002e96bbc';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);

      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: 'USD Coin',
          },
          tx_type: 'ERC20_TRANSFER',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 1,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'TRANSFER_TO_TOKEN_CONTRACT',
                text: 'This transaction transfers token(s) to the USD Coin (USDC) ERC-20 Token Contract 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
              },
            ],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [],
          },
        },
      ]);
    });

    it('should return 200 status when Full node is down', async () => {
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(400);

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(400);

      const idArr = new Array(10).fill(0);
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          );
        })
        .times(1)
        .reply(400);

      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xb5BD917bc25F412D029cB2Ab791bff6cD78FD1AC';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: 'USD Coin',
          },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'ALLOW',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 0,
                },
              ],
            },
            data: [],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [],
          },
        },
      ]);
    });
  });

  describe('Simulation', () => {
    //Native token transfer
    it('should return simulation as SUCCESS with balance for an EOA_INTERACTION', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0x741aa7cfb2c7bf2a1e7d4da2e3df6a56ca4131f3';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc5bF33C8F9d75BBB3a570058216604c0fAb1Af57';
      TRANSACTION_RISK_API_REQUEST.transaction.value = 1;
      TRANSACTION_RISK_API_REQUEST.transaction.gas = '51051';
      TRANSACTION_RISK_API_REQUEST.transaction.gas_price = '37400000000';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      response.body.simulation = GetTransactionRiskProfilesTestConstants.EOA_INTERACTION_MOCK;
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: { name: '' },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'ALLOW',
              counts: [
                { risk_profile_type: 'LOW', count: 0 },
                { risk_profile_type: 'MEDIUM', count: 0 },
                { risk_profile_type: 'HIGH', count: 0 },
              ],
            },
            data: [],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [
              {
                before: {
                  value: '184.315712093117247736',
                  token: 'ETH',
                },
                after: {
                  value: '183.314926693117247736',
                  token: 'ETH',
                },
              },
            ],
          },
        },
      ]);
    });

    //ERC20 token transfer
    it('should return simulation as SUCCESS with balance for an ERC20_TRANSFER', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      TRANSACTION_RISK_API_REQUEST.transaction.data =
        '0xa9059cbb000000000000000000000000d7d0a956b4e32355cde234bcdb3b6ef18ed651ef00000000000000000000000000000000000000000000000000000000007bcc7e';
      TRANSACTION_RISK_API_REQUEST.transaction.value = 0;
      TRANSACTION_RISK_API_REQUEST.transaction.gas = '99226';
      TRANSACTION_RISK_API_REQUEST.transaction.gas_price = '15211533050';
      TRANSACTION_RISK_API_REQUEST.metadata.url = '';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      response.body.simulation = GetTransactionRiskProfilesTestConstants.ERC20_TRANSFER_MOCK;
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: 'USD Coin',
          },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'ALLOW',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 0,
                },
              ],
            },
            data: [],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [
              {
                before: {
                  value: '34.039260923474019579',
                  token: 'ETH',
                },
                after: {
                  value: '34.038262849156009929',
                  token: 'ETH',
                },
              },
              {
                before: {
                  value: '231481.998602',
                  token: 'USDC',
                },
                after: {
                  value: '231473.885324',
                  token: 'USDC',
                },
              },
            ],
          },
        },
      ]);
    });
    //ERC721 token transfer
    it('should return simulation as SUCCESS with balance for an ERC721_TRANSFER', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0x5cb97b63a08C8d39bEB02C06f1e6b2681bdFf45C';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85';
      TRANSACTION_RISK_API_REQUEST.transaction.data =
        '0x42842e0e0000000000000000000000005cb97b63a08c8d39beb02c06f1e6b2681bdff45c0000000000000000000000008afdb350650e659c3d8cb892afbb989b785a172de16f487e1cfa95936a9246a2e657e31cac43193a01ac4eed38964b1812144e38';
      TRANSACTION_RISK_API_REQUEST.transaction.gas = '194255';
      TRANSACTION_RISK_API_REQUEST.transaction.gas_price = '8395943294';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      response.body.simulation = GetTransactionRiskProfilesTestConstants.ERC721_TRANSFER_MOCK;

      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: '',
          },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'ALLOW',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 0,
                },
              ],
            },
            data: [],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [
              {
                before: {
                  value: '1.22123535300771735',
                  token: 'ETH',
                },
                after: {
                  value: '1.220825102030542628',
                  token: 'ETH',
                },
              },
              {
                before: {
                  value:
                    '101967011281167415586822840679716656545853762169628799094421308749132189683256',
                  token: 'ENS',
                },
                after: {
                  value: '0',
                  token: 'ENS',
                },
              },
            ],
          },
        },
      ]);
    });

    //ERC1155 token transfer
    it('should return simulation as FAILURE with balance for an ERC1155_TRANSFER', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0x3b9Ef0e6191959A5236301A23C47753c89Bd877c';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xc36cf0cfcb5d905b8b513860db0cfe63f6cf9f5c';
      TRANSACTION_RISK_API_REQUEST.transaction.data =
        '0xf242432a0000000000000000000000003b9ef0e6191959a5236301a23c47753c89bd877c0000000000000000000000005baae34fce550894bf6f5fc295c0736c28cf25460000000000000000000000000000018500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000';
      TRANSACTION_RISK_API_REQUEST.transaction.gas = '194255';
      TRANSACTION_RISK_API_REQUEST.transaction.gas_price = '8395943294';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      response.body.simulation = GetTransactionRiskProfilesTestConstants.ERC1155_TRANSFER_MOCK;

      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: '',
          },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'ALLOW',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 0,
                },
              ],
            },
            data: [],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [
              {
                before: {
                  value: '0.309938730348290881',
                  token: 'ETH',
                },
                after: {
                  value: '0.309507766579009861',
                  token: 'ETH',
                },
              },
              {
                before: {
                  value: '132369840732245062287252722290957834256384',
                  token: '',
                },
                after: {
                  value: '0',
                  token: '',
                },
              },
            ],
          },
        },
      ]);
    });
  });

  describe('Counterparty Details', () => {
    it('should return USDC as counterparty_details.name', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0x3b9Ef0e6191959A5236301A23C47753c89Bd877c';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: 'USD Coin',
          },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'ALLOW',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 0,
                },
              ],
            },
            data: [],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [],
          },
        },
      ]);
    });

    it('should return empty string as counterparty_details.name', async () => {
      TRANSACTION_RISK_API_REQUEST.transaction.from = '0x3b9Ef0e6191959A5236301A23C47753c89Bd877c';
      TRANSACTION_RISK_API_REQUEST.transaction.to = '0x0000000000085d4780b73119b644ae5ecd22b376';

      const response = await request(app)
        .post(GetTransactionRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(TRANSACTION_RISK_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          counterparty_details: {
            name: '',
          },
          tx_type: 'EOA_INTERACTION',
          risk_profiles: {
            summary: {
              result: 'ALLOW',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 0,
                },
              ],
            },
            data: [],
          },
          simulation: {
            status: 'SUCCESS',
            failure_text: '',
            balances: [],
          },
        },
      ]);
    });
  });

  describe('Message Risk Profiles', () => {
    it('should return Blocked with MALICIOUS_COUNTERPARTY, APPROVAL_TO_UNVERIFIED_CONTRACT and UNVERIFIED_CONTRACT for ERC20Permit when the counterparty is an malicious unverified contract', async () => {
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].tokeninfo
        );
      const idArr = new Array(10).fill(0);
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
            ].eth_getCode,
        });

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ].eth_getCode,
        });

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_RISK_MALICIOUS_COUNTERPARTY_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'ERC20_APPROVAL',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 1,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_COUNTERPARTY',
                text: 'The verifying contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is an identified malicious counterparty',
                details: {
                  labels: [],
                  malicious_counterparty: {
                    address: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                    type: 'CONTRACT',
                  },
                  tags: [],
                },
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'UNVERIFIED_CONTRACT',
                text: 'The verifying contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is not verified',
              },
            ],
          },
        },
      ]);
    });

    it('should return Blocked with LARGE_APPROVAL for ERC20Permit spender', async () => {
      const idArr = new Array(10).fill(0);

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ].eth_getCode,
        });

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_LARGE_APPROVAL_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'ERC20_APPROVAL',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 1,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LARGE_APPROVAL',
                text: 'This transaction asks for a large approval of 1010 tokens',
                details: {
                  approvals: [
                    {
                      spender: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                      approval_value: '1010000000',
                      from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
                      token: {
                        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        name: 'USDC',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ]);
    });

    it('should return Blocked with LARGE_APPROVAL and MALICIOUS_COUNTERPARTY for DAIPermit verifyingContract', async () => {
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].tokeninfo
        );
      const idArr = new Array(10).fill(0);
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
            ].eth_getCode,
        });

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_DAI_LARGE_APPROVAL_MALICIOUS_EOA_AS_VERIFYING_CONTRACT_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'ERC20_APPROVAL',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 3,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_COUNTERPARTY',
                text: 'The verifying contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is an identified malicious counterparty',
                details: {
                  labels: [],
                  malicious_counterparty: {
                    address: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                    type: 'CONTRACT',
                  },
                  tags: [],
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_EOA',
                text: 'This transaction asks for approval to private address 0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LARGE_APPROVAL',
                text: 'This transaction asks for a large approval of 5.78960446186581e+58 tokens',
                details: {
                  approvals: [
                    {
                      spender: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
                      approval_value:
                        '57896044618658097711785492504343953926634992332820282019728792003956564819967',
                      from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
                      token: {
                        address: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                        name: '',
                      },
                    },
                  ],
                },
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'UNVERIFIED_CONTRACT',
                text: 'The verifying contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is not verified',
              },
            ],
          },
        },
      ]);
    });

    it('should return Blocked with MALICIOUS_COUNTERPARTY for ERC721Permit spender and Verifying contract as EOA', async () => {
      const idArr = new Array(10).fill(0);
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
            ].eth_getCode,
        });

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_MALICIOUS_COUNTERPARTY_ERC721_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'ERC721_APPROVAL',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 3,
                },
              ],
            },
            data: [
              {
                risk_type: 'MALICIOUS_COUNTERPARTY',
                risk_profile_type: 'HIGH',
                text: 'The verifying contract 0x484f744e6aef1152cffd03177962b23de488c58d is a private address',
                details: {
                  malicious_counterparty: {
                    address: '0x484f744e6aef1152cffd03177962b23de488c58d',
                    type: 'EOA',
                  },
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_UNVERIFIED_CONTRACT',
                text: 'This transaction asks for approval to unverified contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_COUNTERPARTY',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is an identified malicious counterparty',
                details: {
                  labels: [],
                  malicious_counterparty: {
                    address: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                    type: 'CONTRACT',
                  },
                  tags: [],
                },
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'UNVERIFIED_CONTRACT',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is not verified',
              },
            ],
          },
        },
      ]);
    });

    it('should return Blocked with LONG_APPROVAL for ERC20Permit spender', async () => {
      const idArr = new Array(10).fill(0);

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ].eth_getCode,
        });

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_LONG_APPROVAL_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'ERC20_APPROVAL',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 1,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LONG_APPROVAL',
                text: 'This transaction asks for a long duration approval (31 days)',
              },
            ],
          },
        },
      ]);
    });

    it('should return Blocked with MALICIOUS_DOMAIN, MALICIOUS_SEAPORT_SIGNATURE and SEAPORT_TOKEN_SALE', async () => {
      const idArr = new Array(10).fill(0);
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0x00000000006c3852cbef3e08e8df289169ede581'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0x00000000006c3852cbef3e08e8df289169ede581'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0x00000000006c3852cbef3e08e8df289169ede581'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0x00000000006c3852cbef3e08e8df289169ede581'
            ].eth_getCode,
        });

      simpleHashNodeMock
        .get('/ethereum/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/1726')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.SIMPLEHASH_RESPONSE[
            '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'
          ]
        );

      defillamaMock
        .get('/prices/current/ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.DEFILLAMA_RESPONSES[
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
          ]
        );

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_SEAPORT_ORDERS_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'ERC721_TRANSFER',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 1,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_DOMAIN',
                text: 'The url https://0pensea.io matches with identified malicious domain 0pensea.io',
                details: {
                  labels: ['nft-minter'],
                  malicious_domain: '0pensea.io',
                  tags: ['phish-hack'],
                },
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'SEAPORT_TOKEN_SALE',
                text: 'The following NFTs are being offered for sale on Seaport: 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d - 1726 for 194.05 ETH',
                details: {
                  assets: [
                    {
                      address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
                      token_id: '1726',
                      name: 'BAYC',
                      image_url:
                        'https://lh3.googleusercontent.com/QFV2eaUui25YiTqOVpWXYzSSLmHvSG62KRB9Sy_j8-52z3vyEMK1GLol87CCXE57MkwMnKHKZWb__IFQD_c7QG2OJv8HLQfVY3M=s250',
                    },
                  ],
                  from: '0xed2ab4948bA6A909a7751DEc4F34f303eB8c7236',
                  value: '194.05 ETH',
                },
              },
            ],
          },
        },
      ]);
    });

    it('should return Blocked with MALICIOUS_SEAPORT_SIGNATURE and SEAPORT_TOKEN_SALE', async () => {
      const idArr = new Array(10).fill(0);
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0x00000000006c3852cbef3e08e8df289169ede581'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0x00000000006c3852cbef3e08e8df289169ede581'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0x00000000006c3852cbef3e08e8df289169ede581'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0x00000000006c3852cbef3e08e8df289169ede581'
            ].eth_getCode,
        });

      simpleHashNodeMock
        .get('/ethereum/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/1726')
        .reply(200, GetMessageRiskProfilesTestConstants.SIMPLEHASH_RESPONSE['1726']);

      simpleHashNodeMock
        .get('/ethereum/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/4726')
        .reply(200, GetMessageRiskProfilesTestConstants.SIMPLEHASH_RESPONSE['4726']);

      defillamaMock
        .get('/prices/current/ethereum:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.DEFILLAMA_RESPONSES[
            '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
          ]
        );

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_SEAPORT_ORDERS_MALICIOUS_SIGNATURE_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'ERC721_TRANSFER',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 1,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_SEAPORT_SIGNATURE',
                text: 'You are selling NFTs with total floor price 145.2868 ETH, in exchange for 4.05 ETH',
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'SEAPORT_TOKEN_SALE',
                text: 'The following NFTs are being offered for sale on Seaport: 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d - 1726, 0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d - 4726 for 4.05 ETH',
                details: {
                  assets: [
                    {
                      address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
                      token_id: '1726',
                      name: 'BAYC',
                      image_url:
                        'https://lh3.googleusercontent.com/QFV2eaUui25YiTqOVpWXYzSSLmHvSG62KRB9Sy_j8-52z3vyEMK1GLol87CCXE57MkwMnKHKZWb__IFQD_c7QG2OJv8HLQfVY3M=s250',
                    },
                    {
                      address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
                      token_id: '4726',
                      name: 'BAYC',
                      image_url:
                        'https://lh3.googleusercontent.com/HGyiVzURuGR-IN7Boy7PjBu7sY-80ChrZOk7hcG87QOsEFfVKsud8n4pABjid0kzpTKnhyWt6gL8qWMDafg49Er4PhKTJT0N5Q=s250',
                    },
                  ],
                  from: '0xed2ab4948bA6A909a7751DEc4F34f303eB8c7236',
                  value: '4.05 ETH',
                },
              },
            ],
          },
        },
      ]);
    });

    it('should return 200 when simple hash throwns an error', async () => {
      const idArr = new Array(10).fill(0);
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0x00000000006c3852cbef3e08e8df289169ede581'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0x00000000006c3852cbef3e08e8df289169ede581'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0x00000000006c3852cbef3e08e8df289169ede581'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0x00000000006c3852cbef3e08e8df289169ede581'
            ].eth_getCode,
        });

      simpleHashNodeMock
        .get('/ethereum/0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85/44362024987804491020286')
        .reply(400);

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_SEAPORT_ORDERS_ENS_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'ERC721_TRANSFER',
          risk_profiles: {
            summary: {
              result: 'ALLOW',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 0,
                },
              ],
            },
            data: [],
          },
        },
      ]);
    });

    it('should return Blocked with LARGE_APPROVAL and MALICIOUS_COUNTERPARTY for Permit2 PermitSingle for ', async () => {
      const idArr = new Array(10).fill(0);

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ].eth_getCode,
        });

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].tokeninfo
        );

      ardaArchiveNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
            ].eth_getCode,
        });

      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
            ].eth_getCode,
        });

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_PERMIT_SINGLE_MALICIOUS_COUNTERPARTY_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'PERMIT2',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 4,
                },
              ],
            },
            data: [
              {
                risk_type: 'MALICIOUS_COUNTERPARTY',
                risk_profile_type: 'HIGH',
                text: 'The verifying contract 0x000000000022d473030f116ddee9f6b43ac78ba3 is a private address',
                details: {
                  malicious_counterparty: {
                    address: '0x000000000022d473030f116ddee9f6b43ac78ba3',
                    type: 'EOA',
                  },
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_UNVERIFIED_CONTRACT',
                text: 'This transaction asks for approval to unverified contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LARGE_APPROVAL',
                text: 'This transaction asks for a large approval of 1.461501637330903e+42 tokens',
                details: {
                  approvals: [
                    {
                      spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                      approval_value: '1461501637330902918203684832716283019655932542975',
                      from: '',
                      token: {
                        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        name: 'USDC',
                      },
                    },
                  ],
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_COUNTERPARTY',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is an identified malicious counterparty',
                details: {
                  labels: [],
                  malicious_counterparty: {
                    address: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                    type: 'CONTRACT',
                  },
                  tags: [],
                },
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'UNVERIFIED_CONTRACT',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is not verified',
              },
            ],
          },
        },
      ]);
    });

    it('should return Blocked with LARGE_APPROVAL, LONG_APPROVAL and MALICIOUS_COUNTERPARTY for Permit2 PermitBatch ', async () => {
      const idArr = new Array(10).fill(0);

      etherScanMock
        .get('/api')
        .query(
          (queryObj) =>
            queryObj.module === 'token' &&
            queryObj.action === 'tokeninfo' &&
            queryObj.contractaddress.toLowerCase() ===
              '0xdac17f958d2ee523a2206206994597c13d831ec7'.toLowerCase()
        )
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xdac17f958d2ee523a2206206994597c13d831ec7'
          ].tokeninfo
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ].eth_getCode,
        });

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf'
          ].getsourcecode
        );

      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xdac17f958d2ee523a2206206994597c13d831ec7'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xdac17f958d2ee523a2206206994597c13d831ec7'
            ].eth_getCode,
        });

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].tokeninfo
        );

      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
            ].eth_getCode,
        });

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_PERMIT_BATCH_MALICIOUS_COUNTERPARTY_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'PERMIT2',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 7,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_COUNTERPARTY',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is an identified malicious counterparty',
                details: {
                  labels: [],
                  malicious_counterparty: {
                    address: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                    type: 'CONTRACT',
                  },
                  tags: [],
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_UNVERIFIED_CONTRACT',
                text: 'This transaction asks for approval to unverified contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LONG_APPROVAL',
                text: 'This transaction asks for a long duration approval (31 days)',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LARGE_APPROVAL',
                text: 'This transaction asks for a large approval of 1.461501637330903e+42 tokens',
                details: {
                  approvals: [
                    {
                      spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                      approval_value: '1461501637330902918203684832716283019655932542975',
                      from: '',
                      token: {
                        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        symbol: 'USDC',
                      },
                    },
                  ],
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_UNVERIFIED_CONTRACT',
                text: 'This transaction asks for approval to unverified contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LONG_APPROVAL',
                text: 'This transaction asks for a long duration approval (31 days)',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LARGE_APPROVAL',
                text: 'This transaction asks for a large approval of 1.461501637330903e+42 tokens',
                details: {
                  approvals: [
                    {
                      spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                      approval_value: '1461501637330902918203684832716283019655932542975',
                      from: '',
                      token: {
                        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                        symbol: 'USDT',
                      },
                    },
                  ],
                },
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'UNVERIFIED_CONTRACT',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is not verified',
              },
            ],
          },
        },
      ]);
    });

    it('should return Blocked with LARGE_APPROVAL and MALICIOUS_COUNTERPARTY for Permit2 PermitTransferFrom ', async () => {
      const idArr = new Array(10).fill(0);

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ].eth_getCode,
        });

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].tokeninfo
        );

      ardaArchiveNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
            ].eth_getCode,
        });

      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
            ].eth_getCode,
        });

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_PERMIT_TRANSFER_FROM_MALICIOUS_COUNTERPARTY_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'PERMIT2',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 4,
                },
              ],
            },
            data: [
              {
                risk_type: 'MALICIOUS_COUNTERPARTY',
                risk_profile_type: 'HIGH',
                text: 'The verifying contract 0x000000000022d473030f116ddee9f6b43ac78ba3 is a private address',
                details: {
                  malicious_counterparty: {
                    address: '0x000000000022d473030f116ddee9f6b43ac78ba3',
                    type: 'EOA',
                  },
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_UNVERIFIED_CONTRACT',
                text: 'This transaction asks for approval to unverified contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LARGE_APPROVAL',
                text: 'This transaction asks for a large approval of 1.461501637330903e+42 tokens',
                details: {
                  approvals: [
                    {
                      spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                      approval_value: '1461501637330902918203684832716283019655932542975',
                      from: '',
                      token: {
                        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        name: 'USDC',
                      },
                    },
                  ],
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_COUNTERPARTY',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is an identified malicious counterparty',
                details: {
                  labels: [],
                  malicious_counterparty: {
                    address: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                    type: 'CONTRACT',
                  },
                  tags: [],
                },
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'UNVERIFIED_CONTRACT',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is not verified',
              },
            ],
          },
        },
      ]);
    });

    it('should return Blocked with LARGE_APPROVAL and MALICIOUS_COUNTERPARTY for Permit2 PermitBatchTransferFrom ', async () => {
      const idArr = new Array(10).fill(0);

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ].eth_getCode,
        });

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xdac17f958d2ee523a2206206994597c13d831ec7'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xdac17f958d2ee523a2206206994597c13d831ec7'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xdac17f958d2ee523a2206206994597c13d831ec7'
            ].eth_getCode,
        });

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].tokeninfo
        );

      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
            ].eth_getCode,
        });

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_PERMIT_BATCH_TRANSFER_FROM_MALICIOUS_COUNTERPARTY_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'PERMIT2',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 5,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_COUNTERPARTY',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is an identified malicious counterparty',
                details: {
                  labels: [],
                  malicious_counterparty: {
                    address: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                    type: 'CONTRACT',
                  },
                  tags: [],
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_UNVERIFIED_CONTRACT',
                text: 'This transaction asks for approval to unverified contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LARGE_APPROVAL',
                text: 'This transaction asks for a large approval of 1.461501637330903e+42 tokens',
                details: {
                  approvals: [
                    {
                      spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                      approval_value: '1461501637330902918203684832716283019655932542975',
                      from: '',
                      token: {
                        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        symbol: 'USDC',
                      },
                    },
                  ],
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_UNVERIFIED_CONTRACT',
                text: 'This transaction asks for approval to unverified contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LARGE_APPROVAL',
                text: 'This transaction asks for a large approval of 1.461501637330903e+42 tokens',
                details: {
                  approvals: [
                    {
                      spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                      approval_value: '1461501637330902918203684832716283019655932542975',
                      from: '',
                      token: {
                        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                        symbol: 'USDT',
                      },
                    },
                  ],
                },
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'UNVERIFIED_CONTRACT',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is not verified',
              },
            ],
          },
        },
      ]);
    });

    it('should return Blocked with LARGE_APPROVAL and MALICIOUS_COUNTERPARTY for Permit2 PermitWitnessTransferFrom ', async () => {
      const idArr = new Array(10).fill(0);

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ].eth_getCode,
        });

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].tokeninfo
        );

      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
            ].eth_getCode,
        });

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_PERMIT_WITNESS_TRANSFER_FROM_MALICIOUS_COUNTERPARTY_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'PERMIT2',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 2,
                },
              ],
            },
            data: [
              {
                risk_type: 'MALICIOUS_COUNTERPARTY',
                risk_profile_type: 'HIGH',
                text: 'The verifying contract 0x000000000022d473030f116ddee9f6b43ac78ba3 is a private address',
                details: {
                  malicious_counterparty: {
                    address: '0x000000000022d473030f116ddee9f6b43ac78ba3',
                    type: 'EOA',
                  },
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_COUNTERPARTY',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is an identified malicious counterparty',
                details: {
                  labels: [],
                  malicious_counterparty: {
                    address: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                    type: 'CONTRACT',
                  },
                  tags: [],
                },
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'UNVERIFIED_CONTRACT',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is not verified',
              },
            ],
          },
        },
      ]);
    });

    it('should return Blocked with LARGE_APPROVAL and MALICIOUS_COUNTERPARTY for Permit2 PermitBatchWitnessTransferFrom ', async () => {
      const idArr = new Array(10).fill(0);

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
            ].eth_getCode,
        });

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xa2327a938febf5fec13bacfb16ae10ecbc4cbdcf'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xdac17f958d2ee523a2206206994597c13d831ec7'
          ].getsourcecode
        );

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .times(2)
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xdac17f958d2ee523a2206206994597c13d831ec7'
          ].tokeninfo
        );
      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xdac17f958d2ee523a2206206994597c13d831ec7'
          );
        })
        .times(2)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xdac17f958d2ee523a2206206994597c13d831ec7'
            ].eth_getCode,
        });

      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'contract' && queryObj.action === 'getsourcecode')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].getsourcecode
        );
      etherScanMock
        .get('/api')
        .query((queryObj) => queryObj.module === 'token' && queryObj.action === 'tokeninfo')
        .reply(
          200,
          GetMessageRiskProfilesTestConstants.ETHERSCAN_RESPONSES[
            '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          ].tokeninfo
        );

      ardaFullNodeMock
        .post('/', (body) => {
          idArr[0] = body.id;
          return (
            body.method === 'eth_getCode' &&
            body.params[0] === '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
          );
        })
        .times(1)
        .reply(200, {
          jsonrpc: '2.0',
          id: idArr[0],
          result:
            GetMessageRiskProfilesTestConstants.FULL_NODE_RESPONSES[
              '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89'
            ].eth_getCode,
        });

      const response = await request(app)
        .post(GetMessageRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(MESSAGE_PERMIT_BATCH_WITNESS_TRANSFER_FROM_MALICIOUS_COUNTERPARTY_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          message_type: 'PERMIT2',
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 1,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 5,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_COUNTERPARTY',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is an identified malicious counterparty',
                details: {
                  labels: [],
                  malicious_counterparty: {
                    address: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                    type: 'CONTRACT',
                  },
                  tags: [],
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_UNVERIFIED_CONTRACT',
                text: 'This transaction asks for approval to unverified contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LARGE_APPROVAL',
                text: 'This transaction asks for a large approval of 1.461501637330903e+42 tokens',
                details: {
                  approvals: [
                    {
                      spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                      approval_value: '1461501637330902918203684832716283019655932542975',
                      from: '',
                      token: {
                        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                        symbol: 'USDC',
                      },
                    },
                  ],
                },
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'APPROVAL_TO_UNVERIFIED_CONTRACT',
                text: 'This transaction asks for approval to unverified contract 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
              },
              {
                risk_profile_type: 'HIGH',
                risk_type: 'LARGE_APPROVAL',
                text: 'This transaction asks for a large approval of 1.461501637330903e+42 tokens',
                details: {
                  approvals: [
                    {
                      spender: '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89',
                      approval_value: '1461501637330902918203684832716283019655932542975',
                      from: '',
                      token: {
                        address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
                        symbol: 'USDT',
                      },
                    },
                  ],
                },
              },
              {
                risk_profile_type: 'MEDIUM',
                risk_type: 'UNVERIFIED_CONTRACT',
                text: 'The spender 0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89 is not verified',
              },
            ],
          },
        },
      ]);
    });
  });

  describe('User Risk Profiles', () => {
    it('should return Blocked with MALICIOUS_COUNTERPARTY', async () => {
      const response = await request(app)
        .post(GetUserRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(USER_MALICIOUS_COUNTERPARTY_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          user: {
            address: '0x07b1105157c99f4ee9e6033abd7d9f8251873094',
            ens: null,
            type: 'EOA',
          },
          risk_profiles: {
            summary: {
              result: 'BLOCK',
              counts: [
                {
                  risk_profile_type: 'LOW',
                  count: 0,
                },
                {
                  risk_profile_type: 'MEDIUM',
                  count: 0,
                },
                {
                  risk_profile_type: 'HIGH',
                  count: 1,
                },
              ],
            },
            data: [
              {
                risk_profile_type: 'HIGH',
                risk_type: 'MALICIOUS_COUNTERPARTY',
                text: 'The EOA 0x07b1105157c99f4ee9e6033abd7d9f8251873094 is an identified malicious counterparty',
                details: {
                  labels: [],
                  malicious_counterparty: {
                    address: '0x07b1105157c99f4ee9e6033abd7d9f8251873094',
                    type: 'EOA',
                  },
                  tags: ['Fake_Phishing3802'],
                },
              },
            ],
          },
        },
      ]);
    });

    it('should return Allowed as response for a wrong ENS', async () => {
      const response = await request(app)
        .post(GetUserRiskProfilesTestConstants.API_ROUTE_NAME)
        .send(USER_ENS_API_REQUEST);
      intSpecHelper.assert200Body(expect, response, [
        {
          chain: 'ETHEREUM',
          network: 'MAINNET',
          user: {
            address: null,
            ens: 'yathish.eth',
          },
          risk_profiles: {
            summary: {
              result: 'ALLOW',
            },
          },
        },
      ]);
    });
  });
});
