import { app } from "./app.js";
import { runMigrations } from "./db/migrator.js";
import { env } from "./env.js";
import { Logger } from "./utils/logger/index.js";

const PORT = 3000;

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

  app.listen(PORT, () => {
    Logger.info(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
