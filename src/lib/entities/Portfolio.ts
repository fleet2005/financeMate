import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column()
  symbol!: string;

  @Column()
  companyName!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  averagePrice!: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  currentPrice?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalValue?: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalGainLoss?: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  gainLossPercentage?: number;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
