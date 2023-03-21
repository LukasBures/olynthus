# Project Setup

## 1. Table of Contents

- [Project Setup](#project-setup)
  - [1. Table of Contents](#1-table-of-contents)
  - [2. Project](#2-project)
  - [3. Clickhouse](#3-clickhouse)
    - [3.1. Linux](#31-linux)
    - [3.2. Mac OS](#32-mac-os)
    - [3.3. Inserting sample dataset in Clickhouse](#33-inserting-sample-dataset-in-clickhouse)
  - [4. Running the app](#4-running-the-app)
  - [5. API Documentation](#5-api-documentation)
  - [6. VS Code Extensions](#6-vs-code-extensions)

## 2. Project

- Install Node Version

  [Install nvm](https://github.com/nvm-sh/nvm#installing-and-updating), if not yet installed

  ```bash
  $ nvm install 16 # recommended version to use
  ```

- Install yarn package manager

  ```bash
  $ npm i -g yarn
  ```

- Install npm dependencies

  ```bash
  $ yarn install
  ```

- Environment Variables

  Copy the `.env.example` file to `.env` and modify the permission

  ```bash
  $ cp .env.sample .env
  $ chmod 640 .env
  ```

- Please add your own API keys in the blank spaces in env accordingly

## 3. Clickhouse

### 3.1. Linux

- Download binary

  ```bash
  $ curl https://clickhouse.com/ | sh
  ```

- Install

  ```bash
  $ sudo ./clickhouse install
  ```

- Running

  ```bash
  $ sudo clickhouse start
  ```

### 3.2. Mac OS

- Download binary

  ```bash
  $ curl https://clickhouse.com/ | sh
  ```

- Running

  ```bash
  $ ./clickhouse server
  ```

- Setup Complete. Can access clickhouse from `localhost:8123/play`
  - Username: `default`
  - Password (none)

### 3.3. Inserting sample dataset in Clickhouse

- Create `dataset`, `ethereum_mainnet` databases

  ```sql
  CREATE DATABASE dataset;
  CREATE DATABASE ethereum_mainnet;
  CREATE DATABASE bsc_mainnet;
  CREATE DATABASE polygon_mainnet;

  ```

- Create tables

  ```sql
  CREATE TABLE ethereum_mainnet.malicious_counterparty(
      address String,
      tags Array(String),
      contract_creator String,
      labels Array(String)
  )
  ENGINE = MergeTree
  PRIMARY KEY address;

  CREATE TABLE bsc_mainnet.malicious_counterparty(
      address String,
      tags Array(String),
      contract_creator String,
      labels Array(String)
  )
  ENGINE = MergeTree
  PRIMARY KEY address;

  CREATE TABLE polygon_mainnet.malicious_counterparty(
      address String,
      tags Array(String),
      contract_creator String,
      labels Array(String)
  )
  ENGINE = MergeTree
  PRIMARY KEY address;

  CREATE TABLE dataset.malicious_domains(
      url String,
      labels Array(String),
      tags Array(String)
  )
  ENGINE = MergeTree
  PRIMARY KEY url;

  CREATE TABLE dataset.allowlist_domains(
      url String,
      sld String,
  )
  ENGINE = MergeTree
  PRIMARY KEY url;
  ```

- Add data in tables from csv at `/dataset`

  - From the same directory where you downloaded `clickhouse` binary file, run the following commands (by specifying the correct path for CSVs)

  ```bash
  $ ./clickhouse client -q "INSERT INTO ethereum_mainnet.malicious_counterparty FORMAT CSVWithNames" < ethereum_malicious_counterparty.csv

  # we have no data of malicious_counterparty for BSC & POLYGON, yet. will update it here once we have the dataset ready

  $ ./clickhouse client -q "INSERT INTO dataset.malicious_domains FORMAT CSVWithNames" < malicious_domains.csv

  $ ./clickhouse client -q "INSERT INTO dataset.allowlist_domains FORMAT CSVWithNames" < allowlist_domains.csv
  ```

## 4. Running the app

```bash
# development
$ yarn run start

# watch mode (auto restarts server if any file changes detected)
$ yarn run start:dev

# production mode
$ yarn run start:production

# exposing localhost server to the internet
$ yarn run ngrok
```

## 5. API Documentation

Swagger provides interactive api document at http://localhost:4004/api/v1/docs.

## 6. VS Code Extensions

- Install the recommended extensions for the workspace/project
- VS Code extensions (prettier, lint, markdown) are there to help keep a consistent code standard. It auto formats code on save and also will show warnings/errors to keep the code style consistent across the project
- VS Code Peacock extension (for repo color)

  - Each repo will have its separate color to make it easy to work with multiple repos (please do not change the color for this repo, as has a unique color among all the other repos at Arda)
      <div>
        <img width="300" alt="olynthus color" src="https://user-images.githubusercontent.com/106659572/224254077-07e5303c-2bb9-496b-9140-11e01e7be055.png">
      </div>
      <div>
        <img width="300" alt="arda internal repo eresos' color" src="https://user-images.githubusercontent.com/106659572/211609182-a40490d9-0ab4-4623-a741-ba7c487c4685.png">
      </div>

- VS Code Better comments - an extension which adds colors to comments on predefined prefixes like `*`, `!`, `?`, etc, so it's much easier to read
  <div>
    <img width="400" src="https://user-images.githubusercontent.com/106659572/211517949-d85f045d-08a4-4278-a52e-b4589e1d4d98.png">
  </div>
