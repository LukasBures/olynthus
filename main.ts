import dotenv from 'dotenv';
import type { Express, Request, Response } from 'express';
import express from 'express';
import { CustomLogger } from './src/lib/logger/logger';
import type { Chains } from './src/lib/node-multiplexer';
import { Networks } from './src/lib/node-multiplexer';
import { SafeguardService } from './src/services/safeguard.service';
import { MessageProfilingRequestDTO } from './src/dto/risk-profiles/messages-profiles.dto';
import { CommonUtils } from './src/utils/common.utils';
import { TransactionProfilingRequestDTO } from './src/dto/risk-profiles/transaction-profiles.dto';
import { UserProfilingRequestDTO } from './src/dto/risk-profiles/users-profiles.dto';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { CommonValidators } from './src/validators/common.validators';

dotenv.config();

console.clear();

const app: Express = express();
const PORT = process.env.CONFIG_PORT || 4000;

const logger = new CustomLogger('Main');
const router = express.Router();

const safeguardService = new SafeguardService();

router.get('/', (req, res) => res.send('hello, world'));

router.post('/chains/:chain/transactions/risk-profiles', async (req: Request, res: Response) => {
  const errors = await CommonUtils.validateRequest(
    req.params.chain,
    req.body,
    TransactionProfilingRequestDTO
  );
  if (errors) return res.status(400).send(errors);

  const result = await safeguardService.checkTransactionRiskProfiles(
    req.params.chain as Chains,
    Networks.MAINNET,
    req.body.transaction,
    req.body.metadata
  );
  return res.status(200).send(result);
});

router.post('/chains/:chain/messages/risk-profiles', async (req: Request, res: Response) => {
  const errors = await CommonUtils.validateRequest(
    req.params.chain,
    req.body,
    MessageProfilingRequestDTO
  );
  if (errors) return res.status(400).send(errors);

  const message = req.body.message;
  const messageDataErrors = CommonValidators.validateRequestMessageData(
    message.message,
    message.primaryType
  );
  if (messageDataErrors) return res.status(400).send(messageDataErrors);

  const result = await safeguardService.checkMessageRiskProfiles(
    req.params.chain as Chains,
    Networks.MAINNET,
    req.body.message,
    req.body.metadata
  );
  return res.status(200).send(result);
});

router.post('/chains/:chain/users/risk-profiles', async (req: Request, res: Response) => {
  const errors = await CommonUtils.validateRequest(
    req.params.chain,
    req.body,
    UserProfilingRequestDTO
  );
  if (errors) return res.status(400).send(errors);

  const result = await safeguardService.checkUserRiskProfile(
    req.params.chain as Chains,
    Networks.MAINNET,
    req.body.user
  );
  return res.status(200).send(result);
});

const swaggerDocument = YAML.load('./docs/swagger.yaml');
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(express.json());
app.use('/api/v1/', router);

if (process.env.CONFIG_ENV !== 'test')
  app.listen(PORT, () => {
    logger.log(`[olynthus]: server is running at ${process.env.CONFIG_API_BASE_URL}`);
  });

export { app };
