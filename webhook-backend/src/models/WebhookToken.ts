import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  DataType,
  ForeignKey,
  BelongsTo,
  UpdatedAt,
} from 'sequelize-typescript';
import { Webhook } from './Webhook';

export type OAuthTokenType = 'ACCESS' | 'REFRESH';

@Table({ tableName: 'webhook_oauth_tokens', createdAt: false })
export class WebhookToken extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Webhook)
  @Column(DataType.INTEGER)
  webhook_id!: number;

  @BelongsTo(() => Webhook)
  webhook!: Webhook;

  @Column(DataType.ENUM('ACCESS', 'REFRESH'))
  token_type!: OAuthTokenType;

  // The actual token string
  @Column(DataType.TEXT)
  token!: string;

  // When this token expires — null if expiry info unavailable
  @Column(DataType.DATE)
  expires_at!: Date | null;

  // Auto-updated on every token refresh
  @UpdatedAt
  updated_at!: Date;
}