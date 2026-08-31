import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  AXELOR_URL: z.string().url().default("http://2.25.108.44:8080"),
  AXELOR_USER: z.string().default("admin"),
  AXELOR_PASS: z.string().default("admin"),
  JWT_SECRET: z.string().default("super_secret_pyme_erp_jwt_key_2026"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
