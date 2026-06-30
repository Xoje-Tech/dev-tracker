import { env } from "@config/env.js";
import { createApp } from "@/app.js";
import { prisma } from "@/prisma.js";

const app = createApp();
const port = env.PORT;

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`[server] env: ${env.NODE_ENV}, db: ${env.DATABASE_URL}`);
});

const shutdown = async (signal: string): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log(`[server] received ${signal}, shutting down…`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
