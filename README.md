<div align="center">

 <br>

 <img width="120" src="https://user-images.githubusercontent.com/106659572/224297820-3e825f7e-55a5-4814-a990-f624c93d8f67.png">

Arda - Risk Management for digital assets

[![first-timers-only Friendly](https://img.shields.io/badge/first--timers-friendly-blue.svg)](https://www.firsttimersonly.com/)
[![Pull Requests Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](https://makeapullrequest.com)
![Maintainer](https://img.shields.io/badge/maintainer-arda.finance-blue)

</div>

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Description](#description)
- [Vision](#vision)
- [Setup](#setup)
- [Contributing](#contributing)
- [Questions (FAQ)](#questions-faq)
- [Issues](#issues)
- [Code of Conduct](#code-of-conduct)
- [Credits](#credits)
- [License](#license)

## Description

Safeguard allows users to make informed decisions before signing a transaction. Users can understand the risks involved in a transaction such as phishing attacks, wallet drainers, rug pulls, malicious domains, and much more

## Vision

- Product - What more dimensions of the product we can look at?
- Tech - What part of the tech can we improve?
- Coverage - What more cases does the product should handle/cover (example: more chains)?

## Setup

To set up this project on your local machine, please follow the instructions in the [Setup Guide](./SETUP.md).

## Contributing

We welcome contributions from anyone interested in improving this project. Please review the [Contribution Guidelines](./CONTRIBUTING.md) before getting started.

## Questions (FAQ)

<b>How do we identify risks?</b>

- Based on the website the transaction is taking place, transaction payload (`to`, `data` params), and our dataset, we determine what category of the risk the transaction falls into

- Transactions are classified into the following types:

  - EOA_INTERACTION
  - CONTRACT_CREATION
  - CONTRACT_INTERACTION
  - ERC20_TRANSFER
  - ERC20_APPROVAL
  - ERC20_INTERACTION
  - ERC721_TRANSFER
  - ERC721_APPROVAL
  - ERC721_INTERACTION
  - ERC1155_TRANSFER
  - ERC1155_APPROVAL
  - ERC1155_INTERACTION
  - PERMIT2

- Risks are classified into 3 types: HIGH, MEDIUM and LOW

  - High

    - APPROVAL_ALL
    - LARGE_APPROVAL
    - LONG_APPROVAL
    - APPROVAL_TO_EOA
    - APPROVAL_TO_UNVERIFIED_CONTRACT
    - MALICIOUS_COUNTERPARTY
    - MALICIOUS_DOMAIN
    - INSECURE_DOMAIN
    - MALICIOUS_SEAPORT_SIGNATURE
    - TRANSFER_TO_BURN_ADDRESS
    - TRANSFER_TO_TOKEN_CONTRACT

  - Medium

    - NEW_CONTRACT
    - UNVERIFIED_CONTRACT
    - SEAPORT_TOKEN_SALE

  - Low (TODO)

    - TVL_PERCENT_CHANGE_24H
    - TOKEN_PRICE_DEPEGS

## Issues

To create a new issue, please go through the [Issue Guidelines](./ISSUES.md). This is also mandatory first step for contributing to the project (every pull request is preceded by an issue)

## Code of Conduct

Please review our [Code of Conduct](./CODE_OF_CONDUCT.md) before contributing to this project. In brief, be nice. No harassment, trolling, or spamming.

## Credits

- [Yathish](https://github.com/yathishram)
- [Surya](https://github.com/SuryaAyyagari)
- [Rishi](https://github.com/rishisundar)
- [Sriram](https://github.com/iamsrirams)
- [Heeth](https://github.com/heeth-arda)

### Dataset Credits

- [Forta](https://github.com/forta-network/labelled-datasets)

## License

This project is under [MIT](./LICENSE) license
