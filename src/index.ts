import { app } from "./app.js";
import { runMigrations } from "./db/migrator.js";
import { env } from "./env.js";

const PORT = 3000;

async function startServer() {
  if (env.NODE_ENV === "development") {
    try {
      console.log("[Dev Boot] Checking database migrations...");
      await runMigrations();
    } catch (err) {
      console.warn(
        "[Dev Boot] Database auto-migration skipped or failed:",
        err,
      );
    }
  }

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer();
