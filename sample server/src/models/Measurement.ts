import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'measurements' })
export class Measurement extends Model {

  @Column(DataType.STRING)
  webhookId!: string;

  @Column(DataType.STRING)
  measurement_id!: string;

  @Column(DataType.STRING)
  system_name!: string;

  @Column(DataType.FLOAT)
  height!: number;

  @Column(DataType.FLOAT)
  length!: number;

  @Column(DataType.FLOAT)
  width!: number;
}