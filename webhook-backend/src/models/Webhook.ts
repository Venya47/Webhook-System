import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from './User';

export type HttpMethod = 'GET' | 'POST';
export type AuthType = 'NONE' | 'BASIC' | 'BEARER';

@Table({ tableName: 'webhooks', updatedAt: false })
export class Webhook extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  webhook_id!: number;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  user_id!: number;

  @BelongsTo(() => User)
  user!: User;

  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  target_url!: string;

  @Column(DataType.ENUM('GET', 'POST'))
  method!: HttpMethod;

  @Column(DataType.ENUM('NONE', 'BASIC', 'BEARER'))
  auth_type!: AuthType;

  @Column(DataType.JSON)
  auth_config!: Record<string, string> | null;

  @Column(DataType.JSON)
  headers!: Record<string, string> | null;

  @Column(DataType.JSON)
  payload_schema!: Record<string, unknown> | null;

  @CreatedAt
  created_at!: Date;
}