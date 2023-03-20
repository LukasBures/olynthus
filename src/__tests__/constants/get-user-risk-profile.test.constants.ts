export namespace GetUserRiskProfilesTestConstants {
  export const API_ROUTE_NAME = '/api/v1/chains/ETHEREUM/users/risk-profiles';

  export const ETHERSCAN_RESPONSES = {
    '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89': {
      getsourcecode: {
        status: '1',
        message: 'OK',
        result: [
          {
            SourceCode: '',
            ABI: 'Contract source code not verified',
            ContractName: '',
            CompilerVersion: '',
            OptimizationUsed: '',
            Runs: '',
            ConstructorArguments: '',
            EVMVersion: 'Default',
            Library: '',
            LicenseType: 'Unknown',
            Proxy: '0',
            Implementation: '',
            SwarmSource: '',
          },
        ],
      },
      tokeninfo: { status: '0', message: 'NOTOK', result: '' },
    },
  };

  export const FULL_NODE_RESPONSES = {
    '0xc0ee9db1a9e07ca63e4ff0d5fb6f86bf68d47b89': {
      eth_getCode:
        '0x606060405236156100b95760e060020a600035046313af4035811461019e57806326f5a8c9146101c1578063371fa854146101ca5780634162169f146101d35780634c8fe526146101e55780635970c915146101f757806361bc221a14610209578063625e847d146102125780636637b882146102325780637f9f519f146102555780638da5cb5b14610278578063a9059cbb1461028a578063c4463c80146102b0578063c9d27afe146102df578063e66f53b714610305575b6103176002547f0e708203000000000000000000000000000000000000000000000000000000006060908152600091600160a060020a031690630e7082039060649060209060048187876161da5a03f1156100025750506040515133600160a060020a039081169116149050610329576040805133600160a060020a03166020820152818152600f818301527f636f6e73747563746f72206661696c0000000000000000000000000000000000606082015290517fa6af7265d7ede5fbf0ee375956b52b362800d4f92e268809bef5fdf2a57924b89181900360800190a15060015b90565b61031760043560008054600160a060020a03908116339091161461049257610002565b61047560055481565b61047560045481565b61047f600254600160a060020a031681565b61047f600654600160a060020a031681565b61047f600754600160a060020a031681565b61047560035481565b61031760008054600160a060020a0390811633909116146104ef57610002565b61031760043560008054600160a060020a03908116339091161461057a57610002565b61031760043560008054600160a060020a0390811633909116146105d757610002565b61047f600054600160a060020a031681565b61031760043560243560008054600160a060020a03908116339091161461060f57610002565b61031760043560243560443560643560843560008054600160a060020a0390811633909116146106a657610002565b61031760043560243560008054600160a060020a0390811633909116146107bb57610002565b61047f600154600160a060020a031681565b60408051918252519081900360200190f35b60055460035460001990910190111561040257604080516002546006547f70a0823100000000000000000000000000000000000000000000000000000000835230600160a060020a03908116600485015293519184169363a9059cbb9391169184916370a0823191602480830192602092919082900301818a876161da5a03f11561000257505060408051805160e060020a63a9059cbb028252600482019490945260248101939093525160448084019360209350829003018187876161da5a03f11561000257505060016003819055915061019b9050565b6040805160038054600190810190915560025460048054925460e260020a632099877102855290840192909252600160a060020a03918216602484015292519216916382661dc491604480820192602092909190829003018187876161da5a03f11561000257506001925061019b915050565b6060908152602090f35b600160a060020a03166060908152602090f35b600160a060020a03821660609081527f3edd90e7770f06fafde38004653b33870066c33bfc923ff6102acd601f85dfbc90602090a181600060006101000a815481600160a060020a0302191690830217905550600190505b919050565b6001600355600754600160a060020a03908116908290301631606082818181858883f15050604080516002546001546004805460e260020a632099877102855290840152600160a060020a0390811660248401529251921694506382661dc493506044808201935060209291829003018187876161da5a03f11561000257506001925061019b915050565b6002805473ffffffffffffffffffffffffffffffffffffffff1916831790819055600160a060020a031660609081527fce6a5015a40a2ec38ce912a63bca374d85386207c6927d284292449f1431082290602090a15060016104ea565b600582905560608281527fbab6859bc098da798dbdc4860f0fee7467d703dadd975799e8c258b46a37d3de90602090a15060016104ea565b60025460e060020a63a9059cbb026060908152600160a060020a0385811660645260848590529091169063a9059cbb9060a49060209060448187876161da5a03f11561000257505060408051600160a060020a03861681526020810185905281517f69ca02dd4edd7bf0a4abb9ed3b7af3f14778db5d61921c7dc7cd545266326de293509081900390910190a15060015b92915050565b6006805473ffffffffffffffffffffffffffffffffffffffff1990811686179091556001600381905580548216871790556004879055600584905560078054909116831790819055600160a060020a03908116908290301631606082818181858883f15050604080516002546004805460015460e260020a632099877102855291840152600160a060020a0390811660248401529251921694506382661dc493506044808201935060209291829003018187876161da5a03f11561000257505060408051600454600654908252600160a060020a0316602082015281517fa1ab731770d71027cd294cc0af5c8f5ec3c2ff5dbe6b75d68963d17192f8377b93509081900390910190a150600195945050505050565b6002547fc9d27afe0000000000000000000000000000000000000000000000000000000060609081526064859052831515608452600160a060020a039091169063c9d27afe9060a49060209060448187876161da5a03f11561000257505060408051858152841515602082015281517f8bfa1f40665434b48e7becc865cc0586ce3d6d2388521c05d4db87536ac8279993509081900390910190a15060016106a056',
    },
  };
}
