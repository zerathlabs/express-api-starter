import { initLogger, log } from "evlog";

initLogger({
  env: { service: "starter-server" },
});

export abstract class Logger {
  static info(message: string, context?: Record<string, unknown>): void {
    log.info({ message, ...context });
  }

  static warn(message: string, context?: Record<string, unknown>): void {
    log.warn({ message, ...context });
  }

  static error(
    message: string,
    error?: unknown,
    context?: Record<string, unknown>,
  ): void {
    if (error instanceof Error) {
      log.error({
        message,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack,
        ...context,
      });
    } else if (error) {
      log.error({ message, error, ...context });
    } else {
      log.error({ message, ...context });
    }
  }

  static debug(message: string, context?: Record<string, unknown>): void {
    log.debug({ message, ...context });
  }
}
