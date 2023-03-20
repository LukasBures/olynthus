import winston from 'winston';

export class CustomLogger {
  private colorizer = winston.format.colorize();

  private logger: winston.Logger;

  /**
   * @param logLabel the name of the class where this logger has been initialized
   * @example logger = new CustomLogger(NodeOnChainService.name)
   */
  constructor(logLabel: string) {
    this.logger = winston.createLogger({
      level: 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.label({ label: logLabel }),
        winston.format.simple(),
        winston.format.timestamp({ format: 'DD/MM/YYYY hh:mm:ss.sss' }),
        winston.format.printf((msg) =>
          this.colorizer.colorize(
            msg.level,
            `${msg.timestamp} - ${msg.level === 'info' ? 'LOG' : msg.level.toUpperCase()}: [${
              msg.label
            }] ${msg.message}`
          )
        )
      ),
      transports: [new winston.transports.Console()],
    });
  }

  /**
   * @param message the main message to be highlighted in green color
   * @param context the additional context for the log (this won't be colorful)
   */
  log(message: string, context: string = undefined) {
    this.logger.info(message);
    if (context) console.log(context);
  }

  /**
   * @param message the main message to be highlighted in purple color
   * @param context the additional context for the log (this won't be colorful)
   * @example this.logger.debug('this is a test debug message')
   */
  debug(message: string, context: string = undefined) {
    if (process.env.MIN_LOG_LEVEL === 'debug') {
      this.logger.debug(message);
      if (context) console.debug(context);
    }
  }

  /**
   * @param error the main error object (message + stack)
   * @param message the error message (in red color)
   * @example this.logger.error(error, message?)
   */
  error(error, message: string = undefined) {
    if (typeof error === 'string') {
      this.logger.error(error);
    } else {
      // this is an error object
      this.logger.error(message ? message : error.message);
      console.error(error.stack);
    }
  }

  /**
   * @param message the main message to be highlighted in yellow color
   * @param context the additional context for the log (this won't be colorful)
   * @example this.logger.warn('oops, you did XYZ', error.stack)
   */
  warn(message: string, context: string = undefined) {
    this.logger.warn(message);
    if (context) console.warn(context);
  }
}
