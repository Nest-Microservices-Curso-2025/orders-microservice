import 'dotenv/config';
import * as joi from 'joi';

interface EnvVars {
  PORT: number;
  DATABASE_URL: string;
  PRODUCTS_MICROSERVICE_HOST: string;
  PRODUCTS_MICROSERVICE_PORT: number;
}

interface ValidationJoi {
  error: joi.ValidationError;
  value: EnvVars;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    DATABASE_URL: joi.string().required(),
    PRODUCTS_MICROSERVICE_HOST: joi.string().required(),
    PRODUCTS_MICROSERVICE_PORT: joi.number().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env) as ValidationJoi;

if (error) throw new Error(`Config validations error: ${error.message}`);

export const envs = {
  port: value.PORT,
  databaseUrl: value.DATABASE_URL,
  productsMicroserviceHost: value.PRODUCTS_MICROSERVICE_HOST,
  productsMicroservicePort: value.PRODUCTS_MICROSERVICE_PORT,
};
