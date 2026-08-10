import { loadConfig } from "./config.js";
import { PostgresRepository } from "./database.js";
import { createModelProvider } from "./model-provider.js";
import { createApiServer } from "./server.js";

const config = loadConfig();
const repository = new PostgresRepository(config.databaseUrl);
await repository.migrate();
const server = createApiServer({ config, repository, modelProvider: createModelProvider(config) });

server.listen(config.port, config.host, () => {
  console.log(JSON.stringify({ level: "info", message: "OneShowHome API ready", host: config.host, port: config.port }));
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    server.close(() => repository.close().finally(() => process.exit(0)));
  });
}
