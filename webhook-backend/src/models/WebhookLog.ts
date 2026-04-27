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
  AllowNull,
} from 'sequelize-typescript';
import { User } from './User';
import { Webhook } from './Webhook';

export type LogStatus = 'success' | 'failed';

@Table({ tableName: 'webhook_logs', updatedAt: false })
export class WebhookLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Webhook)
  @Column(DataType.INTEGER)
  webhook_id!: number;

  @BelongsTo(() => Webhook)
  webhook!: Webhook;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  user_id!: number;

  @BelongsTo(() => User)
  user!: User;

  // measurement_id from req.body — references the inbound measurement/event
  @Column(DataType.STRING)
  measurement_id!: string;

  // system_name from hook config — identifies the source system
  @Column(DataType.STRING)
  system_name!: string;

  @Column(DataType.ENUM('success', 'failed'))
  status!: LogStatus;

  // HTTP response code from the target — null if request never reached the server
  @AllowNull(true)
  @Column(DataType.INTEGER)
  response_code!: number | null;

  @CreatedAt
  created_at!: Date;
}