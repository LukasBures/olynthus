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
  - [What is Safeguard (code name Olynthus)?](#what-is-safeguard-code-name-olynthus)
  - [Why do we need Safeguard?](#why-do-we-need-safeguard)
  - [How does Safeguard solve the above problem?](#how-does-safeguard-solve-the-above-problem)
- [Vision](#vision)
- [Setup](#setup)
- [Contributing](#contributing)
- [Questions (FAQ)](#questions-faq)
- [Issues](#issues)
- [Code of Conduct](#code-of-conduct)
- [Credits](#credits)
  - [Team](#team)
  - [Dataset](#dataset)
- [License](#license)

## Description

### What is Safeguard (code name Olynthus)?

- Olynthus is the codebase name for the project, Safeguard.
- Safeguard is an open source project by Arda which can be used to provide transaction insights for your on chain activity in real time and help you safeguard against loosing out on the assets.

### Why do we need Safeguard?

- Let us assume a user wants to transfer 100 USD Coin to another address (X) via a web app / smart contract
  The web app / smart contract would generate a request which the user must confirm to proceed
- If the web app /smart contract is trustworthy (source code is publicly available and is audited), we can be rest assured that it will indeed transfer 100 USD Coin to address X
- But, if the web app / smart contract is malicious and the source code is not publicly available (like for most of the smart contracts available on the blockchain), it might show the request as transferring 100 USD Coin to X, but in reality, it might transfer all of our USD Coin to their own address (Y) and drain us of our tokens

### How does Safeguard solve the above problem?

- Safeguard will allow users to identify these types of risks by decoding the transaction request before confirming the transaction
- If any suspicious / risky movements are observed in the transaction request, Safeguard will inform the user before confirming the transaction, so the user can decide if they really want to proceed or not!
- Safeguard provides these analysis as **APIs** which wallets, and providers can integrate with. Here is a short demo from Arda's Metamask Snap (Wallet integrated with Safeguard APIs), which would warn the users about the risks involved:
  ![safeguard demo](https://user-images.githubusercontent.com/106659572/226905051-ea77c5ea-49bc-4fe0-bd51-939045835510.gif)

## Vision

- Product - What more dimensions of the product we can look at?
- Tech - What part of the tech can we improve?
- Coverage - What more cases does the product should handle/cover (example: more chains)?

## Setup

To set up this project on your local machine, please follow the instructions in the [Setup Guide](./SETUP.md).

## Contributing

We welcome contributions from anyone interested in improving this project. Please review the [Contribution Guidelines](./CONTRIBUTING.md) before getting started.

## Questions (FAQ)

**Q. How are risks identified?**

The following parameters are considered:

1. Web App / URL the transaction is taking place on,

   - We maintain a dataset of malicious domains, and check if the url matches with the same

2. `to` address of the transaction

   - We maintain a dataset of malicious counterparty, and check if the`to` address matches with the same
   - We also categorize the transaction type based on the type of `to`address (Wallet/Contract/ERC-Token)

3. `data` input params of the transaction

   - We decode to analyze what smart contract function is being called, and what arguments are passed to the function

4. Transaction simulation

   - This is the final step of analysis, since if we miss to identify any risk from the above 3 steps, this step would take care of it!
   - We run the transaction in a virtual environment, which give us the transaction event logs.
   - Using the event logs, we can identify what would happen if the transaction was approved, i.e the aftermath of the transaction taking place

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

### Team

- [Yathish](https://github.com/yathishram)
- [Surya](https://github.com/SuryaAyyagari)
- [Rishi](https://github.com/rishisundar)
- [Sriram](https://github.com/iamsrirams)
- [Heeth](https://github.com/heeth-arda)

### Dataset

- [Forta](https://github.com/forta-network/labelled-datasets)

## License

This project is under [MIT](./LICENSE) license
