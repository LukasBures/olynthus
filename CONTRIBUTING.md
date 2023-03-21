# Contributing Guidelines

## 1. Table of Contents

- [Contributing Guidelines](#contributing-guidelines)
  - [1. Table of Contents](#1-table-of-contents)
  - [2. Welcome](#2-welcome)
  - [3. New Contributor Guide](#3-new-contributor-guide)
  - [4. Commits](#4-commits)
  - [5. Code Organization](#5-code-organization)
  - [6. Node Multiplexer](#6-node-multiplexer)
  - [7. Interfaces](#7-interfaces)

## 2. Welcome

Thank you for investing your time in contributing to our project! There are many ways to contribute, including writing code, filing issues on GitHub, helping to reproduce, or fix bugs that people have filed, adding to our documentation, or helping in any other way.

## 3. New Contributor Guide

To get an overview of the project, read the [README](README.md).

To get started with contributing to this project, follow these steps:

**Step 1:**

- Please go through **unassigned open issues** to pick a task you'd like to contribute to
- To filter unassigned open issues, you can search with labels as `Status: TODO` and `Resolution: Confirmed` (and ignoring the label `Core Team`)
- Leave a comment on the issue which you'd like to work on. Once a team member assigns the issue to you, you can proceed with it.

OR

- If you have a new issue to create, please go through [Issues Guidelines](./ISSUES.md) regarding the changes you wish to have, first.

**Step 2:**

- Once the issue has been assigned to you, you can start making the required changes, and create a [Pull Request](https://github.com/Arda-finance/olynthus/pulls) (with reference to the issue) for it to be merged

**Steps for creating a Pull Request:**

1. Fork the repository to your own GitHub account.
2. Clone the repository to your local machine.
3. Setup the project following [Setup Guide](./SETUP.md).
4. Create a new branch for your changes
5. Make your changes and commit them with descriptive commit messages.
6. Push your changes to your fork.
7. Submit a pull request back to the original repository

**Note:**

- Make sure to keep the Pull Request title **Semantic** (refer commits section below)
- While merging PR, always **Squash and Merge** (so multiple commits are pushed as a single commit in the branch)

## 4. Commits

- Every commit must be verified using GPG keys. Reference: [here](https://medium.com/big0one/how-to-create-a-verified-commit-in-github-using-gpg-key-signature-16acee004e0f)

- We are following [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (based on Angular convention)

- In brief, add either of these prefixes before a commit message,

> - build: Changes that affect the build system orexternal > dependencies (example scopes: gulp, broccoli,npm)
> - ci: Changes to our CI configuration files and scripts> (example scopes: Travis, Circle, BrowserStack, SauceLabs)
> - docs: Documentation only changes
> - feat: A new feature
> - fix: A bug fix
> - perf: A code change that improves performance
> - refactor: A code change that neither fixes a bug nor >adds a feature
> - style: Changes that do not affect the meaning of the >code (white-space, formatting, missing semi-colons, etc)
> - test: Adding missing tests or correcting existing tests
> - revert: Reverting a previous commit

- Examples:
  - `fix: return tokenPrice as number instead of BigNumber from Defillama`
  - `feat: add tokenType param in NodeMultiplexer getTokenDetails`

## 5. Code Organization

We follow `convention over configuration`, which is a glorified way of saying "Some of the code organisation is counter-intuitive and is not optimal. But it will follow similar patterns of organisation, so as long as someone can create these mental models in their minds, the organisation becomes very clear and repeatable".

- Each file is named with a prefix according to its directory. Example: `node-multiplexer/nm-services/nm-providers.service.ts`.

  - Note the extra prefix `nm-` (here `nm` is short form for Node Multiplexer), this is intentional and can help in searching for code in IDE or github later
  - Think about how confusing it will be if there are multiple `services` directories inside multiple directories

- All error messages returned from the APIs should be lower-case

- Any interaction with the blockchain must be done from `lib/node-multiplexer`

  - This makes node multiplexer as a black-box, which can be extended upon by adding other nodes.
  - Prefer Alchemy instead of Ankr? You only need to make the change within the node-multiplexer, and the rest of the code remains the same
  - More on Node Multiplexer's design is given in [5.2 Node Multiplexer](#52-node-multiplexer)

  ```
  const nodeMultiplexer = new NodeMultiplexer();
  ```

- We are using our own Custom Logger (from `/lib/logger`), to log events (built on top of Winston to replicate NestJS like logging functionality)

- Different types of files to have the filetype as a suffix in name. For example, `common.constants.ts`, `cache.constants.ts`, `common.utils.ts`, `node.utils.ts`, and so on

- Wrap constants/utils/types under a namespace/module

  - When calling a util function `getTimestamp24hAgo()`, we will call it as `CommonUtils.getTimestamp24hAgo()`.
  - This helps in code readability, as while looking at the code, we know the function is imported from `CommonUtils`, instead of looking for it
  - `Chains` and `Networks` are exception to this to keep the code style same as in our other internal repositories

## 6. Node Multiplexer

- Diagrammatic Representation
  <div>
    <img width="500" src="https://user-images.githubusercontent.com/106659572/216564908-ef728a12-24f6-46ff-ae4e-b8d3e2a9e389.png">
  </div>

Q) Why make code complicated by using node-multiplexer?

**Case 1:**

- Lets say that we no longer want to use alchemy completely as we found out a better alternative for it.

- The steps to update the code would be:

  - Create a new provider inside node multiplexer
  - Add the provider in the priority array and update it in ProviderService
  - Delete alchemy provider

- In this way, node-multiplexer becomes a black-box, and we don't need to make any changes outside of node multiplexer

**Case 2:**

- We need a backup of Alchemy for `getTransactionsByAddress()`, as we find that Alchemy down every few days for few hours. Here node multiplexer would be helpful.

- The steps would be:

  - Add a new provider (backup of alchemy)
  - Add the provider in the priority array and update it in ProviderService

- That's it. Now whenever we call `getTransactionsByAddress()` to node multiplexer. It will call Alchemy first. If alchemy is down, it would call the next provider in the priority.

## 7. Interfaces

- We have 2 interfaces (abstract classes):

  - Database: The current implementation is using Clickhouse
  - Simulation: The current implementation is using Tenderly

- If a user wants to use some other implementation of database/simulation, they can easily do it by creating a new class for it and extend the database/simulation interface
- This will also be helpful as we expand on the project and want to use multiple implementations of the interface at the same time (due to different implementation suiting better for different requirement)
