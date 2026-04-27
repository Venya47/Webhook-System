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
import { Webhook } from './Webhook';

export type ActivityStatus = 'SUCCESS' | 'FAILURE' | 'PENDING';

@Table({ tableName: 'webhook_activity', updatedAt: false })
export class WebhookActivity extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  measurement_id!: number;

  @Column(DataType.STRING)
  system_name!: string;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  user_id!: number;

  @ForeignKey(() => Webhook)
  @Column(DataType.INTEGER)
  webhook_id!: number;

  @BelongsTo(() => Webhook)
  webhook!: Webhook;

  @Column(DataType.ENUM('SUCCESS', 'FAILURE', 'PENDING'))
  status!: ActivityStatus;

  @CreatedAt
  time!: Date;
}