import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType,
  ForeignKey,
  BelongsTo,
  AllowNull,
} from 'sequelize-typescript';
import { Webhook } from './Webhook';

export type OAuthTokenType = 'ACCESS' | 'REFRESH';
export type OAuthExpirySource = 'RESPONSE' | 'MANUAL';
export type OAuthConfigAuthType = 'NONE' | 'BASIC' | 'BEARER';

@Table({ tableName: 'webhook_oauth_configs', timestamps: false })
export class WebhookOauthConfig extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Webhook)
  @Column(DataType.INTEGER)
  webhook_id!: number;

  @BelongsTo(() => Webhook)
  webhook!: Webhook;

  // One row per token type per webhook (ACCESS or REFRESH)
  @Column(DataType.ENUM('ACCESS', 'REFRESH'))
  token_type!: OAuthTokenType;

  // HTTP method used when calling the auth server
  @Column(DataType.ENUM('POST', 'GET', 'PUT', 'PATCH'))
  method!: 'POST' | 'GET' | 'PUT' | 'PATCH';

  // Auth type used when calling the auth server for this token
  // NONE = no auth, BASIC = username/password, BEARER = static token
  @Column(DataType.ENUM('NONE', 'BASIC', 'BEARER'))
  auth_type!: OAuthConfigAuthType;

  // Stores credentials based on auth_type:
  // BASIC → { username, password }
  // BEARER → { token }
  // NONE → null
  @AllowNull(true)
  @Column(DataType.JSON)
  auth_config!: Record<string, string> | null;

  // Custom headers sent to auth server e.g. { "Content-Type": "application/json" }
  @AllowNull(true)
  @Column(DataType.JSON)
  headers!: Record<string, string> | null;

  // Custom payload fields sent to auth server
  // e.g. [{ key: "client_id", value: "abc", type: "text" }]
  @AllowNull(true)
  @Column(DataType.JSON)
  payload!: Array<{ key: string; value: string; type: string }> | null;

  // JSON key to extract token from auth server response e.g. "access_token"
  @Column(DataType.STRING)
  token_key!: string;

  // Whether expiry comes from response field or is a fixed duration
  @Column(DataType.ENUM('RESPONSE', 'MANUAL'))
  expiry_source!: OAuthExpirySource;

  // expiry_source = RESPONSE: key in response holding the expiry value
  @AllowNull(true)
  @Column(DataType.STRING)
  expiry_key!: string | null;

  // expiry_source = RESPONSE: date format of the expiry value
  @AllowNull(true)
  @Column(DataType.STRING)
  date_format!: string | null;

  // expiry_source = RESPONSE: whether expiry is embedded inside the JWT
  @Column(DataType.BOOLEAN)
  jwt_bound!: boolean;

  // expiry_source = MANUAL: duration value e.g. 1, 30, 24
  @AllowNull(true)
  @Column(DataType.INTEGER)
  manual_duration!: number | null;

  // expiry_source = MANUAL: unit of duration
  @AllowNull(true)
  @Column(DataType.ENUM('SECOND', 'MINUTE', 'HOUR', 'DAY'))
  manual_unit!: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY' | null;
}