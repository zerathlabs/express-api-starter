import { app } from "./app.js";
import { runMigrations } from "./db/migrator.js";
import { env } from "./env.js";
import { Logger } from "./utils/logger/index.js";
import { getNetworkIpAddresses } from "./utils/network.js";

async function startServer() {
  if (env.NODE_ENV === "development") {
    try {
      Logger.info("[Dev Boot] Checking database migrations...");
      await runMigrations();
    } catch (err) {
      Logger.warn("[Dev Boot] Database auto-migration skipped or failed", {
        error: err,
      });
    }
  }

  app.listen(env.PORT, env.HOST, () => {
    Logger.info(
      `Server is running on http://${env.HOST === "0.0.0.0" ? "localhost" : env.HOST}:${env.PORT}`,
    );

    if (
      env.NODE_ENV === "development" &&
      (env.HOST === "0.0.0.0" || env.HOST === "::")
    ) {
      const networkIps = getNetworkIpAddresses();
      if (networkIps.length === 0) {
        Logger.info(`Network access:     http://127.0.0.1:${env.PORT}/`);
      } else {
        for (const net of networkIps) {
          Logger.info(
            `Network access (${net.name}): http://${net.address}:${env.PORT}/`,
          );
        }
      }
    }
  });
}

startServer();
