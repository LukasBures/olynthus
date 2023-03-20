import { CommonConstants } from '../constants/common.constants';
import { CustomLogger } from '../lib/logger/logger';
import { ClickHouse } from 'clickhouse';
import { DatabaseInterface } from '../interfaces/database.interface';

export class ClickhouseService extends DatabaseInterface {
  private dbInstances: { [key: string]: ClickHouse } = {};

  private logger: CustomLogger;

  constructor() {
    super();
    this.logger = new CustomLogger(ClickhouseService.name);

    // Initialize instances for all the databases
    Object.values(CommonConstants.DATABASE_NAMES).forEach((databaseName) => {
      this.dbInstances[databaseName] = new ClickHouse(this.getDefaultConfig(databaseName));
    });
  }

  private getDefaultConfig(database: string) {
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
        database,
      },
    };
  }

  public override async runQuery({ query, database }: { query: string; database: string }) {
    // if the database's instance does not exist, then return
    if (!this.dbInstances[database]) return;

    try {
      // return the query from the corresponding database instance
      return await this.dbInstances[database].query(query).toPromise();
    } catch (error) {
      this.logger.error(error, 'Error occurred when executing Select Query');
      return [];
    }
  }
}
