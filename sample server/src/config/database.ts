import { Sequelize } from 'sequelize-typescript';
import { Measurement } from '../models/Measurement';

export const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'server_db',
  username: 'root',
  password: 'root123',
  models: [Measurement],
  logging: false,
});