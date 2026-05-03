import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';
dotenv.config();
import { User } from '../models/User';
import { Webhook } from '../models/Webhook';
import { WebhookActivity } from '../models/WebhookActivity';
import { WebhookLog} from '../models/WebhookLog';
import { WebhookToken} from '../models/WebhookToken';
import { WebhookOauthConfig} from '../models/WebhookOauthConfig';


export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || '.....',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  models: [User, Webhook, WebhookActivity, WebhookLog, WebhookToken, WebhookOauthConfig],
  logging: false,
});
