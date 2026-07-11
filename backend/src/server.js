import { createApp } from "./app.js";
import { databaseFailureMessage, loadConfig } from "./config.js";
import { ShopKartStore } from "./database.js";
import { migrateDatabase } from "./migrate.js";

export async function startServer(overrides = {}) {
  const config = { ...loadConfig(), ...overrides };
  await migrateDatabase({ databaseUrl: config.databaseUrl });
  const store = ShopKartStore.create(config.databaseUrl);
  await store.ping();
  const app = createApp({
    store,
    tokenSecret: config.tokenSecret,
    apiDelayMs: config.apiDelayMs
  });

  const server = await new Promise((resolve) => {
    const listening = app.listen(config.port, () => resolve(listening));
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : config.port;
  console.log(`ShopKart is ready at http://localhost:${port}`);

  return {
    app,
    store,
    server,
    port,
    async close() {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      await store.close();
    }
  };
}

if (process.env.NODE_ENV !== "test") {
  let startupConfig;
  try {
    startupConfig = loadConfig();
  } catch (error) {
    console.error(`ShopKart configuration failed: ${error.message}`);
    process.exitCode = 1;
  }
  if (startupConfig) startServer(startupConfig).then((runtime) => {
    const stop = async () => {
      await runtime.close();
      process.exit(0);
    };
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
  }).catch((error) => {
    console.error(`ShopKart failed to start: ${databaseFailureMessage(error, startupConfig.databaseUrl)}`);
    process.exitCode = 1;
  });
}
