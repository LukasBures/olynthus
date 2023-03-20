/* eslint-disable @typescript-eslint/no-var-requires */
const ngrok = require('ngrok');
const fs = require('fs');
const os = require('os');
require('dotenv').config();

function setEnvVariable(key, value) {
  const ENV_VARS = fs.readFileSync('./.env', 'utf8').split(os.EOL);
  const target = ENV_VARS.indexOf(
    ENV_VARS.find((line) => {
      return line.match(new RegExp(key));
    })
  );
  ENV_VARS.splice(target, 1, `${key}='${value}'`);
  fs.writeFileSync('./.env', ENV_VARS.join(os.EOL));
}

async function ngrokServer() {
  const url = await ngrok.connect({
    addr: Number(process.env.CONFIG_PORT),
    authtoken: process.env.NGROK_AUTH_TOKEN,
  });

  const apiUrl = url + '/api/v1/';
  setEnvVariable('NGROK_SERVER_URL', apiUrl);

  console.log('ngrok api server running at:', apiUrl);
}

ngrokServer();
