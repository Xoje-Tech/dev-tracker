import { createApp } from "@/app.js";
import { prisma } from "@/prisma.js";
import { env } from "@config/env.js";

async function bootstrap(): Promise<void> {
  await prisma.$connect();
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`dev-tracker running on http://localhost:${env.PORT}`);
  });
}

bootstrap().catch((err: unknown) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
