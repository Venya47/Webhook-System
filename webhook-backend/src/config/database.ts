import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Webhook } from '../models/Webhook';
import { WebhookActivity } from '../models/WebhookActivity';

dotenv.config();

export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'webhook_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  models: [User, Webhook, WebhookActivity],
  logging: false,
});
