import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  UNSPLASH_ACCESS_KEY: z.string(),
});

const envParse = envSchema.safeParse(process.env);

if (envParse.success === false) {
  console.error('🚨 Variavéis de ambiente inválidas!', envParse.error.format());
  process.exit(1);
}

export const env = envParse.data;
