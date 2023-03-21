import * as _ from 'lodash';
import type request from 'supertest';
import omitDeep from 'omit-deep-lodash';
import nock from 'nock';
import { ClickHouse } from 'clickhouse';
import { GetTransactionRiskProfilesTestConstants } from '../__tests__/constants/get-transactions-risk-profiles.test.constants';
export class IntegrationSpecHelper {
  private clickhouseInstance = new ClickHouse(this.getDefaultClickhouseConfig());

  /***************
   * ASSERTIONS
   ***************/

  assertErrStatus(
    expect: jest.Expect,
    res: request.Response,
    expectedStatus: number,
    expectedMessage: string[] = [],
    expectedError?: string
  ) {
    const { status, body } = res;
    expect(status).toBe(expectedStatus);
    let message = body.message;
    if (!Array.isArray(message)) {
      message = [message];
    }
    if (expectedMessage.length > 0) {
      expect(message).toStrictEqual(expectedMessage);
    }
    if (expectedError) {
      expect(body.error).toEqual(expectedError);
    }
  }

  assert200Body(
    expect: jest.Expect,
    res: request.Response,
    expectedBody: Record<string, unknown>[],
    sortBy = 'id',
    omit: string[] = []
  ) {
    const { status, body } = res;
    if (!(status >= 200 && status < 300)) {
      console.error(body);
    }

    let receivedBody = body;
    if (!Array.isArray(body)) {
      receivedBody = [body];
    }
    const sortedReceivedBody = _.sortBy(receivedBody, sortBy);
    expect(sortedReceivedBody.length).toEqual(expectedBody.length);
    expect(sortedReceivedBody.map((b) => omitDeep(b, omit))).toStrictEqual(
      _.sortBy(omitDeep(expectedBody, omit), sortBy)
    );
  }

  assert400Body(
    expect: jest.Expect,
    res: request.Response,
    expectedBody: Record<string, unknown>[],
    sortBy = 'id',
    omit: string[] = []
  ) {
    const { status, body } = res;
    if (!(status >= 400 && status < 500)) {
      console.error(body);
    }

    let receivedBody = body;
    if (!Array.isArray(body)) {
      receivedBody = [body];
    }
    const sortedReceivedBody = _.sortBy(receivedBody, sortBy);
    expect(sortedReceivedBody.length).toEqual(expectedBody.length);
    expect(sortedReceivedBody.map((b) => omitDeep(b, omit))).toStrictEqual(
      _.sortBy(omitDeep(expectedBody, omit), sortBy)
    );
  }

  /***************
   * ENTITY UTILS
   *************/

  setupProtectedFullNodeMock(
    protectedFullNodeMock: nock.Scope = null,
    times: number = 1
  ): nock.Scope {
    let mock: nock.Scope = protectedFullNodeMock;
    if (!mock) {
      mock = nock(process.env.NODE_PROTECTED_FULL_NODE_ETH_MAINNET, {
        reqheaders: {
          'Content-Type': 'application/json',
        },
      });
    }

    const idArr = new Array(10).fill(0);
    mock
      .post('/', (body) => {
        idArr[0] = body.id;
        return body.method === 'net_listening';
      })
      .times(times)
      .reply(200, () => ({
        jsonrpc: '2.0',
        result: true,
        id: idArr[0],
      }));
    mock
      .post('/', (body) => {
        idArr[1] = body.id;
        return body.method === 'eth_chainId';
      })
      .times(times)
      .reply(200, () => ({
        jsonrpc: '2.0',
        result: '0x1',
        id: idArr[1],
      }));
    mock
      .post('/', (body) => {
        idArr[2] = body.id;
        return body.method === 'net_version';
      })
      .times(times)
      .reply(200, () => ({
        jsonrpc: '2.0',
        result: '1',
        id: idArr[2],
      }));
    mock
      .post('/', (body) => {
        idArr[3] = body.id;
        return body.method === 'eth_blockNumber';
      })
      .times(times)
      .reply(200, () => ({
        jsonrpc: '2.0',
        result: '0xf3c329', // 15975209
        id: idArr[3],
      }));

    mock
      .post('/', (body) => {
        idArr[3] = body.id;
        return body.method === 'eth_getBlockByNumber';
      })
      .times(times)
      .reply(200, () => ({
        jsonrpc: '2.0',
        result: {
          jsonrpc: '2.0',
          id: 1,
          result: {
            baseFeePerGas: '0x2ea2649bf',
            difficulty: '0x0',
            extraData: '0x506f776572656420627920626c6f58726f757465',
            gasLimit: '0x1c9c380',
            gasUsed: '0x1c080d5',
            hash: '0xaa06baeb34a520ee7ce2bd231eb08218e15eff611c9369d8d68a47a14b5d2dce',
            logsBloom:
              '0x44b0253ec110185854d8510cf5901a3b12214c802db2207c66a170d16ecb07c2b45623b004cbb9b0326999c642a505bd47024a49bf14fc8416a3d2ad1524eb05085ed194b507adadea0b5749e61a34eb7461409cd6cc0b72a795cea9988cbaf8335048af37e790a22518916910908baf4b1e1da081190c906e1b84b30979a8b8124e8336c342d8d1bdd8094a98b6242082730c8553e0941972b0a370a191c0099e904d5f00bf6c3100770ed04961b528745ad7522d0388824263e502e4980368571bf13fca05b85a80bbfcb8720ef2dfa503964aa6ea0b93ac0a193b2883f469003be40f1260062194b333ee09a1ca89239f5628d969975c0031bc31b121d790',
            miner: '0xf2f5c73fa04406b1995e397b55c24ab1f3ea726c',
            mixHash: '0xec05ed7015c410467df40720d7df72763cdf6a58a2c9c86f9fbef7beb445952a',
            nonce: '0x0000000000000000',
            number: '0xf3c329',
            parentHash: '0xfc0dba8d5929338a80b5f549ab33e43fad92b4ee3ff99fbf51560b1dcef023c6',
            receiptsRoot: '0x3c42f4c100a4e6bb7d3d30942be7a02ca13c72858897abb6aecc4ec639643afa',
            sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
            size: '0x26662',
            stateRoot: '0xdd984593b340616f3dfb42d5870f9a226ea5f7763f30c6c092e8c925a418849b',
            timestamp: '0x63737b1f',
            totalDifficulty: '0xc70d815d562d3cfa955',
            transactions: [
              '0x2a558f2af51d0f72025886b264c072257fc29d1185a356c17763305854a8698b',
              '0x7493257336214b584a8d3324df2aa2922e4399ff14168adfaf99ea63182a2996',
              '0x5bce4151a7ee3024f66ad3b114722592471343b9f6085b86dc97897ed17cf436',
              '0x628c54f8db6fa471c64c58bf5c1f896271635d459ed7d45e328db86460f01503',
              '0xa8160664873dc3c078ec9b8cc1e7c6d0d18745859bcfa7715bd6c42a92aab6c3',
              '0xc02e76f8352949828b8f0be515941bf047f60e585ee325ec6b2e61e973f0273c',
              '0xec4ea08d9582b70403e4966d94a692f62d4bb3f5fda5cafddea3a947e3224f0b',
              '0x32a7b331c8dd68a1f434683e8591169652975425f98a1aaefc36ee44efd1ad63',
              '0xd276991687c913c9112f42c1b791abd2062fa11c14a9e25ea185109a16c0adb2',
              '0xdc877d0abbaacf07866214bf6dfc4f60c6a7c0577cc3ab7c408cc455b2a7666a',
              '0x8b2b8508ae79c0de38c23a4f0f4eb8649906412efce8ab1a0070e2ab397312e8',
              '0xb63d9c74f370edcfe70d3c96421097b2fafb485bcb248925095c07ab2d5be3e1',
              '0xc3e2b22cbed1a2396aaa95e5cf84b1012a4f441e8fa03966190be565144287a2',
              '0xa21da404f3b7f24bde8447a89678bb2a3c6600e6e4a9cbbd2955a7244f33a8fc',
              '0x250b446999a2d38cb7a88f8bb51cdd49f3806c8e1becd1810cd2361d2ecb84bc',
              '0x8af1caf21ccb9e8b991a12316dc19a1f49009c731308724e54ad29b473f0e13e',
              '0x4c8721e3664e9c8d98a26bff708d95411b62dc6d225fd3081a8d724b16e8b4df',
              '0x933e6097749777e1f847b633adde17aed5a185ed3135b96c1095ad77a2c9640b',
              '0xbfede413dfdce580999cbadeb1b8cead28f8998ef64b3de79da98104fd883f03',
              '0x63bd1f72e86483d8803e8da4ce8bf6cb53c2fd5206d70836db1e8e0cd091aca7',
              '0x4fb75de1d182d50d62bd82eb8605b00592da626944e30691e17a7c0e5bf572aa',
              '0x84cbc2c332bb191d99e8e0dab48ad51a16673f2c9a0e21493a61af287927be22',
              '0xb5ed048c9fe1578f7ae783d931d0e9d7fcedf77c456bd98cc0f9dbf1ed606362',
              '0x7504e6187a0218c1124c4efdf82fa3995fb85b7333964e192e09b350da714bdc',
              '0x93766c66d5dbf3d6b11c18306fc60e8ee332c42f82e167173a3a530f8f4bdbf4',
              '0x337d36076818dc0312a056e1d8c1beadb28b9edd25eaf7103b18fa39a0d08f61',
              '0x77fb5293eddb669170010905a71cc935c30e7bf102f7ac0a96ee7638331a22c3',
              '0xc1d641574fa471271e29b196ca5bfa2bacf82a06b6cb855e9b09446b1007f6df',
              '0xc6960e3d896b8a2e2c8aae8cf618a5caba570aed564fb187869a1cd640607209',
              '0x6c6bd2555fe79496ab06dec0c3e4d3f6cb1ca79c7a868f25f28ba2056d6a2140',
              '0xa89cebd6c9b9c4df93aa2fe2d07c10d7f0d2d5c23cac04cabf288f7df8581d20',
              '0x50c90ba103aca35b58adbb82d14f55b438a27cf0a2d4ab116c13a24b0fcdabab',
              '0x22e5f99a308caec8f02087ee452061f42ee48d5cf468ae1691a9e8f4c451d631',
              '0x2f34e81f168e2a317db3de3c2c1de0e97d67a3263649640c898a08e0580c6ee4',
              '0x9374e738c2d88405c768835d8856d6dc498f644305f3489196a8bcfb39d41c1a',
              '0xec741df9cf0c723210680586e6e83b4f41fcb28b7cdd2a6585e41e8f25e17b07',
              '0x62bc51cf07d6122d646bf4690a71282d18450ba40a71133b53afff3e3283ff1a',
              '0x3d62e347687ac7931f11aab33e2e0dd927432d1fc3b19b3da6cea8926e3bb3d3',
              '0x1111d58578fb0bb6e2fdf64b5489164157306414ecfbc25f0b4003574a7aa9b6',
              '0xc11046d1526c088a2f9d59d4af9c362919f66c2b3174c58d75eb1fc554ae3f1b',
              '0x4e0036438a30be99ea96a2b247da549a7a7e79e8c02dfec390760c2d37a76c56',
              '0xd97ab9a4118031786d8b28250ecc0e1478b00dad5d3a3310b7e6ae23758e4ba8',
              '0x32fa0886fbc201947e290f1cc1bf8a8e9fbf5d15e4fbcd3edd7f8df9eeca8395',
              '0xe84859deed324a49b307118f8c69de3f77c4783bf67b304becd6dac2e32ce750',
              '0x7d2dd74e155cb6c2e92260cfe82e25e5486db0744e36736f861bee1773077a5a',
              '0x05c2b734728f90df35cd205e7b6d24e81892f178c29ce108f6d670b1f4720109',
              '0x30e38805985bf6e375ad57d531d396091ed24ecdce93e2f010ae40b92fd88fe6',
              '0x41aae6628eac2ed2ae83fbb2ab2470624fd4d4aabff3d1341eb2d6130dab908b',
              '0x79594e719bde0469a426ba183235eac9a3ffd4884fa1a049281b5a4b0428a23e',
              '0x615aa8af28c3330768fda91ff662a21689bb03c1b97eb350588ae345a20def24',
              '0xeac7760bd9ce4ee49254e00b268a9a5e6443d80e30aae82041078b44ebf191b3',
              '0xba13b9fca2fad9ef9f7f786ad51fa389a21e691a9fab88ec239b8640d6a386ad',
              '0x54deb70652a9a0d81c1c3863022ffbfa271c48e0e428e7ba57a021c4aac32957',
              '0xbbad57b1bb45cff571e64a64d67f4f89bb1b53df2e389b31690c6d65774e0a58',
              '0xaf4055461b0eedc7dc950585223a4b8cb4a60fdc2255dfc9b370bbea58875390',
              '0x3131ba045d790aa989c565b0fbcbb4b3ed957d5f1e8037529322e23400af36b6',
              '0xaeb36d4ccf460784dd03ab5ca508b5042e5a5324d703b812121c117c7229e552',
              '0x4d05da18593dae0062aa0339dc3b04fa1a152888e635edbd2dc0668f7314b7cf',
              '0xd4f44a878bf44b0d522253b2eeb8073fd5a979175f2dd7a338085dfd4573a1ca',
              '0x5512a9495cf18d19bb91120b98a43ee16b3ee47d45d8059fc17e9ac379f83d47',
              '0xb61263b7e81d86fb34cc2c73a7ea92851224d631242cfe4fd4fc6a01fb84268f',
              '0xae1150d5e399015bdbe1d352f81d920adc7a6dbbd3846c63cba329277d812bd3',
              '0xbff156077407abcc0f23e01e8e7c91d2ce8720fca56f9da916a82709954b6444',
              '0x2febb423be23e006c584adad061f8204c2b6a72d710a860527027db02f729aff',
              '0x9e1158fbd8f6c41c4abdbb8a1e4e72a3d5e0bd230c1b5150a3d473db27531bfc',
              '0x3a069031338051c857a625b55c1e39e6c85a77065132f5ae063b119cf9dce33d',
              '0xfaa81015be085bde460fbddfd75cd9ea255f690101c24d0194bbb9cf0a03a1ba',
              '0xd2d3eace515c8bf6f33a365229b02178f73804bb2741228b0935de44a87009e6',
              '0x04a34a924e7965d41bd9812d125268ad8f5f12e6a447713b0ebf2c3087a0bcc3',
              '0xa29f4829c74128b44b29aca0842414cc715e71483732067eb9880e77c6aeb240',
              '0x2d89f18134f3c76bba83a84b52aad2375ed64fc6280ae22a847b16c6741fe540',
              '0x6d791e815de85a1256088fbcbeebff1a0ddd02dc1ad8c7a19baa44b15a92fca9',
              '0xa951ba8388ef3d556ed757dcdfe5440e0df87925dc498a12f14bc10eaecb18a7',
              '0x109e5f2e74abde3f8168749b2faa9eb6d91af2c78554581c7fa8cf9487011b95',
              '0xfe8bae06170e373f3ff66fdfbb4939fe8d47631d358aea0147b22993508ebdbe',
              '0x1d1a1a2f4887f2763c4af0bca82af6a393b39c37420ef472aec1bd7e01af6473',
              '0x3bfc82bb9da902f7dc9cda50bf3b47a8ceb1e550cb8be272e63b723c2437870b',
              '0x6b94bb15a9d2b4d6868a41f187ab2c6bc6d4f3d996739f85bbcf513ac719659d',
              '0xc1e38b577daf4b7e92b202fc6aee6ae305bc2998197803ba25bf0954fa456fbe',
              '0x8fe7ff0f0a36556ed6786aa49c194282a76691c6ea6b43e1933c2a73f7374ebc',
              '0x714d02d2b06cf51a9f76a777e9304ff34caed22951721cf0a6f2bff48a03d8f8',
              '0x8c192811f02b209909e13c869c964cf924e33568fd5f93a054e21b1aafc788bd',
              '0xc5d2ceada42b663857f2bef2d04e6b6f2715baee302a099adc544b613c3758cb',
              '0xd0566e6da9b1f5d78e4fd69249ddecc44555c68d78892b6a0784dd9bbfe65c4a',
              '0xa1a3d92b5a8924e6cc92a40dc6f9bbe96b42511e272e9e414af5be2eee4b779d',
              '0xfe5b8c43719750d0002c9801367b914014cd0f773236ce71ba59c6022d7d25ab',
              '0x4de620f4a1314d38994f5ad7a89dc4a97153787d6f87da6f642a075d02cec171',
              '0xedc8ee191537a8c826e619e1ddbee3d18353b8bd5c6ba54ea2fca386e02b2110',
              '0x5a6b27e2a41e7f9b1f6842c3b66c228400aab646c169ab9854e09ad7229fe9f0',
              '0xbfde53e7a2fbbfd72624b6ef47a7897e4b73d3e414531cdde4fba211c5272125',
              '0x2ea71242bb598122e041d32dd5c9f5f0e19ba4f530d6d1898e56910ae9082d45',
              '0x04ac99d7e7decddbea9f11942d8c6eea28d709cc21f9084b0391264904386f49',
              '0xe1ca65ef1a7e3924ee01ef834d718c842fbb53a4367204dba36f54b5312e5bf4',
              '0x9668f0d4af219f646540f5ca10e0624131aadd9ede63e04d93d557d6e2d7f9b0',
              '0xd45a8fe28506366bcbdbe84852d75587895dc1da9ee0a4cbf592fcb88ed9490b',
              '0x8483f2194691f1ed64154225ce4bb5710fe4da5e98e1753718b6e8bdf41946f9',
              '0x3f5788e7412fbfb2a534ed30d59c227cee6a4d002b42d7de25713943b79604f5',
              '0x10939ebc6a273504036d03125be3baad95c169bed9c25d2e4759f7421182dbee',
              '0xf6a63039b9d0215bd3c8d750b416bd9153e8ebb76b1c5d760d913b620e8a3655',
              '0x77b05cfecd8884c1021dce43bab05e42f90d838078fc17ab90c91bf90bc06f19',
              '0x571772f31c2cf4be2492bc9319b009e042e62397fff20c483c20d3da48018860',
              '0x63d180c9ed6e60aa9925396813d3d750b00680dc0c48974d6e85e726a90d9e01',
              '0x4b92e78c031a94d8761c89df6a2671e240cc1a2bbefb34ca2abd0d7b2e59b341',
              '0xdc3c8b69fc94578c9fb4fae2e90b652cfd6b38ee95f6de4b30e18e05e429b1f2',
              '0x3da6536bdaee80888a985a61e587a4ede817c90973fadccfc6f2987135d8aae8',
              '0x78914228e4a77aa71b165db55088006bf74deb35b357434b7554ace81fcbb572',
              '0x21fc14156fb27c7f19d7d361622e33ac061fa8ff4fd9f904f0991b4cbf3622da',
              '0x2d911a2ac2507838c756fb639bac704d75d340ed4d69622bd3a043649c1488b3',
            ],
            transactionsRoot: '0x9b786745a0305de4e1d805b1f51cdbf3f58915edaced9479d3751843087caeaf',
            uncles: [],
          },
        },
        id: idArr[3],
      }));

    return mock;
  }

  setupProtectedArchiveNodeMock(
    protectedArchiveNodeMock: nock.Scope = null,
    times: number = 1
  ): nock.Scope {
    let mock: nock.Scope = protectedArchiveNodeMock;
    if (!mock) {
      mock = nock(process.env.NODE_PROTECTED_ARCHIVE_NODE_ETH_MAINNET, {
        reqheaders: {
          'Content-Type': 'application/json',
        },
      });
    }

    const idArr = new Array(10).fill(0);
    mock
      .post('/', (body) => {
        idArr[0] = body.id;
        return body.method === 'net_listening';
      })
      .times(times)
      .reply(200, () => ({
        jsonrpc: '2.0',
        result: true,
        id: idArr[0],
      }));
    mock
      .post('/', (body) => {
        idArr[1] = body.id;
        return body.method === 'eth_chainId';
      })
      .times(times)
      .reply(200, () => ({
        jsonrpc: '2.0',
        result: '0x1',
        id: idArr[1],
      }));
    mock
      .post('/', (body) => {
        idArr[2] = body.id;
        return body.method === 'net_version';
      })
      .times(times)
      .reply(200, () => ({
        jsonrpc: '2.0',
        result: '1',
        id: idArr[2],
      }));
    mock
      .post('/', (body) => {
        idArr[3] = body.id;
        return body.method === 'eth_blockNumber';
      })
      .times(times)
      .reply(200, () => ({
        jsonrpc: '2.0',
        result: '0xf3c329', // 15975209
        id: idArr[3],
      }));

    mock
      .post('/', (body) => {
        idArr[3] = body.id;
        return body.method === 'eth_getBlockByNumber';
      })
      .times(times)
      .reply(200, () => ({
        jsonrpc: '2.0',
        result: {
          jsonrpc: '2.0',
          id: 1,
          result: {
            baseFeePerGas: '0x2ea2649bf',
            difficulty: '0x0',
            extraData: '0x506f776572656420627920626c6f58726f757465',
            gasLimit: '0x1c9c380',
            gasUsed: '0x1c080d5',
            hash: '0xaa06baeb34a520ee7ce2bd231eb08218e15eff611c9369d8d68a47a14b5d2dce',
            logsBloom:
              '0x44b0253ec110185854d8510cf5901a3b12214c802db2207c66a170d16ecb07c2b45623b004cbb9b0326999c642a505bd47024a49bf14fc8416a3d2ad1524eb05085ed194b507adadea0b5749e61a34eb7461409cd6cc0b72a795cea9988cbaf8335048af37e790a22518916910908baf4b1e1da081190c906e1b84b30979a8b8124e8336c342d8d1bdd8094a98b6242082730c8553e0941972b0a370a191c0099e904d5f00bf6c3100770ed04961b528745ad7522d0388824263e502e4980368571bf13fca05b85a80bbfcb8720ef2dfa503964aa6ea0b93ac0a193b2883f469003be40f1260062194b333ee09a1ca89239f5628d969975c0031bc31b121d790',
            miner: '0xf2f5c73fa04406b1995e397b55c24ab1f3ea726c',
            mixHash: '0xec05ed7015c410467df40720d7df72763cdf6a58a2c9c86f9fbef7beb445952a',
            nonce: '0x0000000000000000',
            number: '0xf3c329',
            parentHash: '0xfc0dba8d5929338a80b5f549ab33e43fad92b4ee3ff99fbf51560b1dcef023c6',
            receiptsRoot: '0x3c42f4c100a4e6bb7d3d30942be7a02ca13c72858897abb6aecc4ec639643afa',
            sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
            size: '0x26662',
            stateRoot: '0xdd984593b340616f3dfb42d5870f9a226ea5f7763f30c6c092e8c925a418849b',
            timestamp: '0x63737b1f',
            totalDifficulty: '0xc70d815d562d3cfa955',
            transactions: [
              '0x2a558f2af51d0f72025886b264c072257fc29d1185a356c17763305854a8698b',
              '0x7493257336214b584a8d3324df2aa2922e4399ff14168adfaf99ea63182a2996',
              '0x5bce4151a7ee3024f66ad3b114722592471343b9f6085b86dc97897ed17cf436',
              '0x628c54f8db6fa471c64c58bf5c1f896271635d459ed7d45e328db86460f01503',
              '0xa8160664873dc3c078ec9b8cc1e7c6d0d18745859bcfa7715bd6c42a92aab6c3',
              '0xc02e76f8352949828b8f0be515941bf047f60e585ee325ec6b2e61e973f0273c',
              '0xec4ea08d9582b70403e4966d94a692f62d4bb3f5fda5cafddea3a947e3224f0b',
              '0x32a7b331c8dd68a1f434683e8591169652975425f98a1aaefc36ee44efd1ad63',
              '0xd276991687c913c9112f42c1b791abd2062fa11c14a9e25ea185109a16c0adb2',
              '0xdc877d0abbaacf07866214bf6dfc4f60c6a7c0577cc3ab7c408cc455b2a7666a',
              '0x8b2b8508ae79c0de38c23a4f0f4eb8649906412efce8ab1a0070e2ab397312e8',
              '0xb63d9c74f370edcfe70d3c96421097b2fafb485bcb248925095c07ab2d5be3e1',
              '0xc3e2b22cbed1a2396aaa95e5cf84b1012a4f441e8fa03966190be565144287a2',
              '0xa21da404f3b7f24bde8447a89678bb2a3c6600e6e4a9cbbd2955a7244f33a8fc',
              '0x250b446999a2d38cb7a88f8bb51cdd49f3806c8e1becd1810cd2361d2ecb84bc',
              '0x8af1caf21ccb9e8b991a12316dc19a1f49009c731308724e54ad29b473f0e13e',
              '0x4c8721e3664e9c8d98a26bff708d95411b62dc6d225fd3081a8d724b16e8b4df',
              '0x933e6097749777e1f847b633adde17aed5a185ed3135b96c1095ad77a2c9640b',
              '0xbfede413dfdce580999cbadeb1b8cead28f8998ef64b3de79da98104fd883f03',
              '0x63bd1f72e86483d8803e8da4ce8bf6cb53c2fd5206d70836db1e8e0cd091aca7',
              '0x4fb75de1d182d50d62bd82eb8605b00592da626944e30691e17a7c0e5bf572aa',
              '0x84cbc2c332bb191d99e8e0dab48ad51a16673f2c9a0e21493a61af287927be22',
              '0xb5ed048c9fe1578f7ae783d931d0e9d7fcedf77c456bd98cc0f9dbf1ed606362',
              '0x7504e6187a0218c1124c4efdf82fa3995fb85b7333964e192e09b350da714bdc',
              '0x93766c66d5dbf3d6b11c18306fc60e8ee332c42f82e167173a3a530f8f4bdbf4',
              '0x337d36076818dc0312a056e1d8c1beadb28b9edd25eaf7103b18fa39a0d08f61',
              '0x77fb5293eddb669170010905a71cc935c30e7bf102f7ac0a96ee7638331a22c3',
              '0xc1d641574fa471271e29b196ca5bfa2bacf82a06b6cb855e9b09446b1007f6df',
              '0xc6960e3d896b8a2e2c8aae8cf618a5caba570aed564fb187869a1cd640607209',
              '0x6c6bd2555fe79496ab06dec0c3e4d3f6cb1ca79c7a868f25f28ba2056d6a2140',
              '0xa89cebd6c9b9c4df93aa2fe2d07c10d7f0d2d5c23cac04cabf288f7df8581d20',
              '0x50c90ba103aca35b58adbb82d14f55b438a27cf0a2d4ab116c13a24b0fcdabab',
              '0x22e5f99a308caec8f02087ee452061f42ee48d5cf468ae1691a9e8f4c451d631',
              '0x2f34e81f168e2a317db3de3c2c1de0e97d67a3263649640c898a08e0580c6ee4',
              '0x9374e738c2d88405c768835d8856d6dc498f644305f3489196a8bcfb39d41c1a',
              '0xec741df9cf0c723210680586e6e83b4f41fcb28b7cdd2a6585e41e8f25e17b07',
              '0x62bc51cf07d6122d646bf4690a71282d18450ba40a71133b53afff3e3283ff1a',
              '0x3d62e347687ac7931f11aab33e2e0dd927432d1fc3b19b3da6cea8926e3bb3d3',
              '0x1111d58578fb0bb6e2fdf64b5489164157306414ecfbc25f0b4003574a7aa9b6',
              '0xc11046d1526c088a2f9d59d4af9c362919f66c2b3174c58d75eb1fc554ae3f1b',
              '0x4e0036438a30be99ea96a2b247da549a7a7e79e8c02dfec390760c2d37a76c56',
              '0xd97ab9a4118031786d8b28250ecc0e1478b00dad5d3a3310b7e6ae23758e4ba8',
              '0x32fa0886fbc201947e290f1cc1bf8a8e9fbf5d15e4fbcd3edd7f8df9eeca8395',
              '0xe84859deed324a49b307118f8c69de3f77c4783bf67b304becd6dac2e32ce750',
              '0x7d2dd74e155cb6c2e92260cfe82e25e5486db0744e36736f861bee1773077a5a',
              '0x05c2b734728f90df35cd205e7b6d24e81892f178c29ce108f6d670b1f4720109',
              '0x30e38805985bf6e375ad57d531d396091ed24ecdce93e2f010ae40b92fd88fe6',
              '0x41aae6628eac2ed2ae83fbb2ab2470624fd4d4aabff3d1341eb2d6130dab908b',
              '0x79594e719bde0469a426ba183235eac9a3ffd4884fa1a049281b5a4b0428a23e',
              '0x615aa8af28c3330768fda91ff662a21689bb03c1b97eb350588ae345a20def24',
              '0xeac7760bd9ce4ee49254e00b268a9a5e6443d80e30aae82041078b44ebf191b3',
              '0xba13b9fca2fad9ef9f7f786ad51fa389a21e691a9fab88ec239b8640d6a386ad',
              '0x54deb70652a9a0d81c1c3863022ffbfa271c48e0e428e7ba57a021c4aac32957',
              '0xbbad57b1bb45cff571e64a64d67f4f89bb1b53df2e389b31690c6d65774e0a58',
              '0xaf4055461b0eedc7dc950585223a4b8cb4a60fdc2255dfc9b370bbea58875390',
              '0x3131ba045d790aa989c565b0fbcbb4b3ed957d5f1e8037529322e23400af36b6',
              '0xaeb36d4ccf460784dd03ab5ca508b5042e5a5324d703b812121c117c7229e552',
              '0x4d05da18593dae0062aa0339dc3b04fa1a152888e635edbd2dc0668f7314b7cf',
              '0xd4f44a878bf44b0d522253b2eeb8073fd5a979175f2dd7a338085dfd4573a1ca',
              '0x5512a9495cf18d19bb91120b98a43ee16b3ee47d45d8059fc17e9ac379f83d47',
              '0xb61263b7e81d86fb34cc2c73a7ea92851224d631242cfe4fd4fc6a01fb84268f',
              '0xae1150d5e399015bdbe1d352f81d920adc7a6dbbd3846c63cba329277d812bd3',
              '0xbff156077407abcc0f23e01e8e7c91d2ce8720fca56f9da916a82709954b6444',
              '0x2febb423be23e006c584adad061f8204c2b6a72d710a860527027db02f729aff',
              '0x9e1158fbd8f6c41c4abdbb8a1e4e72a3d5e0bd230c1b5150a3d473db27531bfc',
              '0x3a069031338051c857a625b55c1e39e6c85a77065132f5ae063b119cf9dce33d',
              '0xfaa81015be085bde460fbddfd75cd9ea255f690101c24d0194bbb9cf0a03a1ba',
              '0xd2d3eace515c8bf6f33a365229b02178f73804bb2741228b0935de44a87009e6',
              '0x04a34a924e7965d41bd9812d125268ad8f5f12e6a447713b0ebf2c3087a0bcc3',
              '0xa29f4829c74128b44b29aca0842414cc715e71483732067eb9880e77c6aeb240',
              '0x2d89f18134f3c76bba83a84b52aad2375ed64fc6280ae22a847b16c6741fe540',
              '0x6d791e815de85a1256088fbcbeebff1a0ddd02dc1ad8c7a19baa44b15a92fca9',
              '0xa951ba8388ef3d556ed757dcdfe5440e0df87925dc498a12f14bc10eaecb18a7',
              '0x109e5f2e74abde3f8168749b2faa9eb6d91af2c78554581c7fa8cf9487011b95',
              '0xfe8bae06170e373f3ff66fdfbb4939fe8d47631d358aea0147b22993508ebdbe',
              '0x1d1a1a2f4887f2763c4af0bca82af6a393b39c37420ef472aec1bd7e01af6473',
              '0x3bfc82bb9da902f7dc9cda50bf3b47a8ceb1e550cb8be272e63b723c2437870b',
              '0x6b94bb15a9d2b4d6868a41f187ab2c6bc6d4f3d996739f85bbcf513ac719659d',
              '0xc1e38b577daf4b7e92b202fc6aee6ae305bc2998197803ba25bf0954fa456fbe',
              '0x8fe7ff0f0a36556ed6786aa49c194282a76691c6ea6b43e1933c2a73f7374ebc',
              '0x714d02d2b06cf51a9f76a777e9304ff34caed22951721cf0a6f2bff48a03d8f8',
              '0x8c192811f02b209909e13c869c964cf924e33568fd5f93a054e21b1aafc788bd',
              '0xc5d2ceada42b663857f2bef2d04e6b6f2715baee302a099adc544b613c3758cb',
              '0xd0566e6da9b1f5d78e4fd69249ddecc44555c68d78892b6a0784dd9bbfe65c4a',
              '0xa1a3d92b5a8924e6cc92a40dc6f9bbe96b42511e272e9e414af5be2eee4b779d',
              '0xfe5b8c43719750d0002c9801367b914014cd0f773236ce71ba59c6022d7d25ab',
              '0x4de620f4a1314d38994f5ad7a89dc4a97153787d6f87da6f642a075d02cec171',
              '0xedc8ee191537a8c826e619e1ddbee3d18353b8bd5c6ba54ea2fca386e02b2110',
              '0x5a6b27e2a41e7f9b1f6842c3b66c228400aab646c169ab9854e09ad7229fe9f0',
              '0xbfde53e7a2fbbfd72624b6ef47a7897e4b73d3e414531cdde4fba211c5272125',
              '0x2ea71242bb598122e041d32dd5c9f5f0e19ba4f530d6d1898e56910ae9082d45',
              '0x04ac99d7e7decddbea9f11942d8c6eea28d709cc21f9084b0391264904386f49',
              '0xe1ca65ef1a7e3924ee01ef834d718c842fbb53a4367204dba36f54b5312e5bf4',
              '0x9668f0d4af219f646540f5ca10e0624131aadd9ede63e04d93d557d6e2d7f9b0',
              '0xd45a8fe28506366bcbdbe84852d75587895dc1da9ee0a4cbf592fcb88ed9490b',
              '0x8483f2194691f1ed64154225ce4bb5710fe4da5e98e1753718b6e8bdf41946f9',
              '0x3f5788e7412fbfb2a534ed30d59c227cee6a4d002b42d7de25713943b79604f5',
              '0x10939ebc6a273504036d03125be3baad95c169bed9c25d2e4759f7421182dbee',
              '0xf6a63039b9d0215bd3c8d750b416bd9153e8ebb76b1c5d760d913b620e8a3655',
              '0x77b05cfecd8884c1021dce43bab05e42f90d838078fc17ab90c91bf90bc06f19',
              '0x571772f31c2cf4be2492bc9319b009e042e62397fff20c483c20d3da48018860',
              '0x63d180c9ed6e60aa9925396813d3d750b00680dc0c48974d6e85e726a90d9e01',
              '0x4b92e78c031a94d8761c89df6a2671e240cc1a2bbefb34ca2abd0d7b2e59b341',
              '0xdc3c8b69fc94578c9fb4fae2e90b652cfd6b38ee95f6de4b30e18e05e429b1f2',
              '0x3da6536bdaee80888a985a61e587a4ede817c90973fadccfc6f2987135d8aae8',
              '0x78914228e4a77aa71b165db55088006bf74deb35b357434b7554ace81fcbb572',
              '0x21fc14156fb27c7f19d7d361622e33ac061fa8ff4fd9f904f0991b4cbf3622da',
              '0x2d911a2ac2507838c756fb639bac704d75d340ed4d69622bd3a043649c1488b3',
            ],
            transactionsRoot: '0x9b786745a0305de4e1d805b1f51cdbf3f58915edaced9479d3751843087caeaf',
            uncles: [],
          },
        },
        id: idArr[3],
      }));

    mock
      .post('/', (body) => {
        idArr[0] = body.id;
        return (
          body.method === 'eth_getTransactionReceipt' &&
          body.params[0] === '0x890a072349d780f8eabc5dadcb2a1d1bc4a7501381a1a6a81d28bbdbc2c58ed4'
        );
      })
      .times(1)
      .reply(200, {
        jsonrpc: '2.0',
        id: idArr[0],
        result:
          GetTransactionRiskProfilesTestConstants.ARCHIVE_NODE_RESPONSES[
            '0x890a072349d780f8eabc5dadcb2a1d1bc4a7501381a1a6a81d28bbdbc2c58ed4'
          ].eth_getTransactionReceipt,
      });

    mock
      .post('/', (body) => {
        idArr[1] = body.id;
        return body.method === 'eth_getBlockByNumber' && body.params[0] === '0xf23ab4';
      })
      .times(1)
      .reply(200, {
        jsonrpc: '2.0',
        id: idArr[1],
        result:
          GetTransactionRiskProfilesTestConstants.ARCHIVE_NODE_RESPONSES['0xf23ab4']
            .eth_getBlockByNumber,
      });

    return mock;
  }

  addHealthChecksToProtectedFullNodeMock(
    protectedFullNodeMock: nock.Scope,
    times: number = 1000
  ): void {
    this.setupProtectedFullNodeMock(protectedFullNodeMock, times);
  }

  addHealthChecksToProtectedArchiveNodeMock(
    protectedArchiveNodeMock: nock.Scope,
    times: number = 1000
  ): void {
    this.setupProtectedArchiveNodeMock(protectedArchiveNodeMock, times);
  }

  setupEtherscanNodeMock(): nock.Scope {
    const etherscanNodeMock: nock.Scope = nock('https://api.etherscan.io');

    etherscanNodeMock
      .get('/api')
      .query((queryObj) => queryObj.module === 'stats' && queryObj.action === 'ethsupply')
      .times(1000) // sufficiently high value to return for health check
      .reply(200, {
        data: {
          status: '1',
          message: 'OK',
          result: '116487067186500000000000000',
        },
      });
    return etherscanNodeMock;
  }

  setupSimpleHashNodeMock(): nock.Scope {
    const simpleHashNodeMock: nock.Scope = nock('https://api.simplehash.com/api/v0/nfts');

    simpleHashNodeMock.get('/ethereum/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/1726').reply(200, {
      nft_id: 'ethereum.0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d.1726',
      chain: 'ethereum',
      contract_address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      token_id: '1726',
      name: null,
      description: null,
      image_url:
        'https://cdn.simplehash.com/assets/6c5f6c40f8de4c54c8af25c5dd7b352dd7f8f6cf0acfa548494da24c9b194f44.png',
      video_url: null,
      audio_url: null,
      model_url: null,
      previews: {
        image_small_url:
          'https://lh3.googleusercontent.com/QFV2eaUui25YiTqOVpWXYzSSLmHvSG62KRB9Sy_j8-52z3vyEMK1GLol87CCXE57MkwMnKHKZWb__IFQD_c7QG2OJv8HLQfVY3M=s250',
        image_medium_url:
          'https://lh3.googleusercontent.com/QFV2eaUui25YiTqOVpWXYzSSLmHvSG62KRB9Sy_j8-52z3vyEMK1GLol87CCXE57MkwMnKHKZWb__IFQD_c7QG2OJv8HLQfVY3M',
        image_large_url:
          'https://lh3.googleusercontent.com/QFV2eaUui25YiTqOVpWXYzSSLmHvSG62KRB9Sy_j8-52z3vyEMK1GLol87CCXE57MkwMnKHKZWb__IFQD_c7QG2OJv8HLQfVY3M=s1000',
        image_opengraph_url:
          'https://lh3.googleusercontent.com/QFV2eaUui25YiTqOVpWXYzSSLmHvSG62KRB9Sy_j8-52z3vyEMK1GLol87CCXE57MkwMnKHKZWb__IFQD_c7QG2OJv8HLQfVY3M=k-w1200-s2400-rj',
        blurhash: 'UZM%l:jFyZWrtmozVrV@RpV@n}t7yDkCRPae',
      },
      background_color: null,
      external_url: null,
      created_date: '2021-05-01T06:23:00',
      status: 'minted',
      token_count: 1,
      owner_count: 1,
      owners: [
        {
          owner_address: '0xed2ab4948bA6A909a7751DEc4F34f303eB8c7236',
          quantity: 1,
          first_acquired_date: '2021-11-24T17:00:17',
          last_acquired_date: '2022-09-24T07:29:59',
        },
      ],
      last_sale: {
        from_address: '0xD387A6E4e84a6C86bd90C158C6028A58CC8Ac459',
        to_address: '0x72FAe93d08A060A7f0A8919708c0Db74Ca46cbB6',
        quantity: 1,
        timestamp: '2021-05-01T12:04:00',
        transaction: '0x2004727e40d602710e72a58e9dd08aa126db2d801e00040209c56ebce62e61c0',
        marketplace_id: 'opensea',
        marketplace_name: 'OpenSea',
        is_bundle_sale: false,
        payment_token: {
          payment_token_id: 'ethereum.native',
          name: 'Ether',
          symbol: 'ETH',
          address: null,
          decimals: 18,
        },
        unit_price: 4000000000000000000,
        total_price: 4000000000000000000,
      },
      contract: {
        type: 'ERC721',
        name: 'BoredApeYachtClub',
        symbol: 'BAYC',
      },
      collection: {
        collection_id: 'c2848c940e984d247dbdeadd1fcded87',
        name: 'Bored Ape Yacht Club',
        description:
          'The Bored Ape Yacht Club is a collection of 10,000 unique Bored Ape NFTs— unique digital collectibles living on the Ethereum blockchain. Your Bored Ape doubles as your Yacht Club membership card, and grants access to members-only benefits, the first of which is access to THE BATHROOM, a collaborative graffiti board. Future areas and perks can be unlocked by the community through roadmap activation. Visit www.BoredApeYachtClub.com for more details.',
        image_url:
          'https://lh3.googleusercontent.com/C_fjl1iM5iRwuk74N9DBrOmU-1-_lc_8x66BsWU8votTb3iwXiVJwmqJ2qd8BUI1DSDo_9KxcNcNJrdpnnxebLwpeJB7eiYSeI8',
        banner_image_url:
          'https://lh3.googleusercontent.com/rtq1n9yu0o2EPKilnOiBj7ytu2NNdxUiu8czjEj4R7WJid3OTXQAS9oEXCgVrdj3frEj296C-p2tlyBKMhWtussdImr_jsaFCV0=w2500',
        external_url: 'http://www.boredapeyachtclub.com/',
        twitter_username: 'BoredApeYC',
        discord_url: 'https://discord.gg/3P5K3dzgdB',
        marketplace_pages: [
          {
            marketplace_id: 'opensea',
            marketplace_name: 'OpenSea',
            marketplace_collection_id: 'boredapeyachtclub',
            nft_url:
              'https://opensea.io/assets/ethereum/0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d/1726',
            collection_url: 'https://opensea.io/collection/boredapeyachtclub',
            verified: true,
          },
        ],
        metaplex_mint: null,
        metaplex_first_verified_creator: null,
        floor_prices: [
          {
            marketplace_id: 'x2y2',
            marketplace_name: 'X2Y2',
            value: 65000000000000000000,
            payment_token: {
              payment_token_id: 'ethereum.native',
              name: 'Ether',
              symbol: 'ETH',
              address: null,
              decimals: 18,
            },
          },
          {
            marketplace_id: 'looksrare',
            marketplace_name: 'LooksRare',
            value: 70350000000000000000,
            payment_token: {
              payment_token_id: 'ethereum.native',
              name: 'Ether',
              symbol: 'ETH',
              address: null,
              decimals: 18,
            },
          },
          {
            marketplace_id: 'opensea',
            marketplace_name: 'OpenSea',
            value: 72971000000000000000,
            payment_token: {
              payment_token_id: 'ethereum.native',
              name: 'Ether',
              symbol: 'ETH',
              address: null,
              decimals: 18,
            },
          },
        ],
        distinct_owner_count: 6040,
        distinct_nft_count: 9998,
        total_quantity: 9998,
        top_contracts: ['ethereum.0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d'],
      },
      rarity: {
        rank: 4232,
        score: 1.008,
        unique_attributes: 0,
      },
      extra_metadata: {
        attributes: [
          {
            trait_type: 'Clothes',
            value: 'Service',
          },
          {
            trait_type: 'Fur',
            value: 'Solid Gold',
          },
          {
            trait_type: 'Mouth',
            value: 'Bored Unshaven',
          },
          {
            trait_type: 'Background',
            value: 'Gray',
          },
          {
            trait_type: 'Eyes',
            value: 'Closed',
          },
        ],
        image_original_url: 'ipfs://QmYqXQb3xFNWDkNno34GNL435yMbjt4B8b89LvBA75A9VP',
        animation_original_url: null,
        metadata_original_url: 'ipfs://QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq/1726',
      },
    });

    return simpleHashNodeMock;
  }

  setupDefillamaMock(): nock.Scope {
    const defillamaBaseURL = process.env.DEFILLAMA_COINS_API_URL || 'https://coins.llama.fi/';
    const defillamaMock: nock.Scope = nock(defillamaBaseURL);
    return defillamaMock;
  }

  /***********************
   * HELPER UTILS
   ***********************/

  async createClickhouseDatabases() {
    const createDatasetDatabase = 'CREATE DATABASE IF NOT EXISTS dataset';
    const createEthereumDatabase = 'CREATE DATABASE IF NOT EXISTS ethereum_mainnet';

    const createDatasetDatabasePromise = this.clickhouseInstance
      .query(createDatasetDatabase)
      .toPromise();

    const createEthereumDatabasePromise = this.clickhouseInstance
      .query(createEthereumDatabase)
      .toPromise();

    //We need to create the databases first if they do not exist
    await Promise.all([createDatasetDatabasePromise, createEthereumDatabasePromise]);
  }

  async createClickhouseTables() {
    const createMaliciousDomainsTable =
      'CREATE TABLE IF NOT EXISTS dataset.malicious_domains(`url` String,`sources` Array(String),`labels` Array(String),`tags` Array(String)) ENGINE = MergeTree PRIMARY KEY url ORDER BY url SETTINGS index_granularity = 8192';
    const createAllowlistDomainsTable =
      'CREATE TABLE IF NOT EXISTS dataset.allowlist_domains(`url` String, `sld` String, `sources` Array(String)) ENGINE = MergeTree PRIMARY KEY url;';
    const createMaliciousCounterpartyTable =
      'CREATE TABLE IF NOT EXISTS ethereum_mainnet.malicious_counterparty(`address` String,`tags` Array(String),`contract_creator` Nullable(String),`contract_creation_tx` Nullable(String),`contract_creator_tag` Nullable(String),`sources` Nullable(String),`labels` Array(String),) ENGINE = MergeTree PRIMARY KEY(address)';

    const createMaliciousDomainTablePromise = this.clickhouseInstance
      .query(createMaliciousDomainsTable)
      .toPromise();

    const createAllowlistTablePromise = this.clickhouseInstance
      .query(createAllowlistDomainsTable)
      .toPromise();

    const createMaliciousCounterpartyTablePromise = this.clickhouseInstance
      .query(createMaliciousCounterpartyTable)
      .toPromise();

    await Promise.all([
      createMaliciousDomainTablePromise,
      createAllowlistTablePromise,
      createMaliciousCounterpartyTablePromise,
    ]);
  }

  async insertIntoClickhouseTables() {
    const maliciousDomainsEntry =
      "INSERT INTO dataset.malicious_domains VALUES('0pensea.io', ['phantom'], ['nft-minter'], ['phish-hack']), ('01broker.com', ['amf'], ['aml'], ['phish-hack']);";

    const allowListDomainsEntry =
      "INSERT INTO dataset.allowlist_domains (*) VALUES ('opensea.io', 'opensea', ['Opensea']), ('bayc.com', 'bayc', ['Opensea']);";

    const maliciousCounterpartyEntry = `
      INSERT INTO ethereum_mainnet.malicious_counterparty 
        VALUES ('0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89', [], '0x969837498944ae1dc0dcac2d0c65634c88729b2d', '0x892503709f0b2de693de71bd6eea8b9c67952bb8d1bb8b9ba9307db92ff46c6f', [], ['https://github.com/abdulsamijay/Defi-Hack-Analysis-POC'], []),
               ('0x07b1105157c99f4ee9e6033abd7d9f8251873094', ['Fake_Phishing3802'], '', '', [], ['https://github.com/abdulsamijay/Defi-Hack-Analysis-POC'], [] )`;

    const maliciousCounterpartyInsertPromise = this.clickhouseInstance
      .query(maliciousCounterpartyEntry)
      .toPromise();

    const maliciousDomainInsertPromise = this.clickhouseInstance
      .query(maliciousDomainsEntry)
      .toPromise();

    const allowlistDomainInsertPromise = this.clickhouseInstance
      .query(allowListDomainsEntry)
      .toPromise();

    await Promise.all([
      maliciousDomainInsertPromise,
      allowlistDomainInsertPromise,
      maliciousCounterpartyInsertPromise,
    ]);
  }

  async dropClickhouseDatabases() {
    const dropDataset = 'DROP DATABASE dataset';
    const dropEthereum = 'DROP DATABASE ethereum_mainnet';

    const dropDatasetPromise = this.clickhouseInstance.query(dropDataset).toPromise();
    const dropEthereumPromise = this.clickhouseInstance.query(dropEthereum).toPromise();

    await Promise.all([dropDatasetPromise, dropEthereumPromise]);
  }

  private getDefaultClickhouseConfig() {
    return {
      url: process.env.CLICKHOUSE_URL,
      port: process.env.CLICKHOUSE_PORT,
      debug: false,
      basicAuth: {
        username: process.env.CLICKHOUSE_USERNAME,
        password: process.env.CLICKHOUSE_PASSWORD,
      },
      isUseGzip: false,
      trimQuery: false,
      usePost: false,
      format: 'json', // "json" || "csv" || "tsv"
      raw: false,
      config: {
        session_timeout: 60,
        output_format_json_quote_64bit_integers: 0,
        enable_http_compression: 0,
      },
    };
  }
}
