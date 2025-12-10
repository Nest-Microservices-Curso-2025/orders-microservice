import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  NATS_SERVERS: string[];
}

interface ValidationJoi {
  error: joi.ValidationError;
  value: EnvVars;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    NATS_SERVERS: joi.array().items(joi.string()).required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  NATS_SERVERS: process.env.NATS_SERVERS?.split(','),
}) as ValidationJoi;

if (error) throw new Error(`Config validations error: ${error.message}`);

export const envs = {
  port: value.PORT,
  databaseUrl: value.DATABASE_URL,
  natsServers: value.NATS_SERVERS,
};
