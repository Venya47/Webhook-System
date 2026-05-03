import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
} from 'sequelize-typescript';
import { User } from './User';
import { WebhookOauthConfig } from './WebhookOauthConfig';
import { WebhookToken } from './WebhookToken';

export type HttpMethod = 'GET' | 'POST';
export type AuthType = 'NONE' | 'BASIC' | 'BEARER' | 'OAUTH';

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

  @Column(DataType.ENUM('POST'))
  method!: HttpMethod;

  @Column(DataType.ENUM('NONE', 'BASIC', 'BEARER', 'OAUTH'))
  auth_type!: AuthType;

  @Column(DataType.JSON)
  auth_config!: Record<string, string> | null;

  @Column(DataType.JSON)
  headers!: Record<string, string> | null;

  @Column(DataType.JSON)
  payload_schema!: Record<string, unknown> | null;

  @HasMany(() => WebhookOauthConfig)
  oauth_configs!: WebhookOauthConfig[];

  @HasMany(() => WebhookToken)
  oauth_tokens!: WebhookToken[];

  @CreatedAt
  created_at!: Date;
}


// import {
//   Table,
//   Column,
//   Model,
//   PrimaryKey,
//   AutoIncrement,
//   DataType,
//   ForeignKey,
//   BelongsTo,
//   CreatedAt,
// } from 'sequelize-typescript';
// import { User } from './User';

// export type HttpMethod = 'GET' | 'POST';
// export type AuthType = 'NONE' | 'BASIC' | 'BEARER' | 'OAUTH';

// @Table({ tableName: 'webhooks', updatedAt: false })
// export class Webhook extends Model {
//   @PrimaryKey
//   @AutoIncrement
//   @Column(DataType.INTEGER)
//   webhook_id!: number;

//   @ForeignKey(() => User)
//   @Column(DataType.INTEGER)
//   user_id!: number;

//   @BelongsTo(() => User)
//   user!: User;

//   @Column(DataType.STRING)
//   name!: string;


//   @Column(DataType.ENUM('POST'))
//   method!: HttpMethod;

//   @Column(DataType.ENUM('NONE', 'BASIC', 'BEARER', 'OAUTH'))
//   auth_type!: AuthType;

//   @Column(DataType.JSON)
//   auth_config!: Record<string, string> | null;

//   @Column(DataType.JSON)
//   headers!: Record<string, string> | null;

//   @Column(DataType.JSON)
//   payload_schema!: Record<string, unknown> | null;

//   @CreatedAt
//   created_at!: Date;
// }