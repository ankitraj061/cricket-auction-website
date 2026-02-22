import { createClient, type RedisClientType } from "redis";
import dotenv from "dotenv";

dotenv.config();

const USE_TLS = process.env.REDIS_TLS === "true";

const socketOptions = USE_TLS
  ? {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      tls: true as const,
      connectTimeout: 15000,
      reconnectStrategy: (retries: number) => {
        if (retries > 3) return false;
        return Math.min(retries * 500, 2000);
      }
    }
  : {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
      connectTimeout: 15000,
      reconnectStrategy: (retries: number) => {
        if (retries > 3) return false;
        return Math.min(retries * 500, 2000);
      }
    };

const client: RedisClientType = createClient({
  username: "default",
  password: process.env.REDIS_PASSWORD ?? undefined,
  socket: socketOptions
});

client.on("error", (err) => console.error("❌ Redis Error:", err.message));
client.on("ready", () => console.log("✅ Redis Connected"));

export const connectRedis = async (): Promise<void> => {
  try {
    await client.connect();
  } catch (err: any) {
    console.error("❌ Redis connect failed:", err.message);
  }
};

export const redisClient = client;
