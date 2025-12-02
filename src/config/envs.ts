import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
}

interface ValidationJoi {
  error: joi.ValidationError;
  value: EnvVars;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env) as ValidationJoi;

if (error) throw new Error(`Config validations error: ${error.message}`);

export const envs = {
  port: value.PORT,
  databaseUrl: value.DATABASE_URL,
};
