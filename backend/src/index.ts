import { createApp } from "./app";
import { env } from "./config";
import { startNotificationScheduler } from "./services/notifications";

async function start() {
  const app = createApp();
  app.listen(env.PORT, () => {
    console.log(`Farmingo API listening on http://localhost:${env.PORT}`);
    startNotificationScheduler();
  });
}

start().catch((err) => {
  console.error("Failed to start Farmingo API", err);
  process.exit(1);
});
