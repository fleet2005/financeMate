import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ExpenseCategory } from './Expense';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: ExpenseCategory,
  })
  category: ExpenseCategory;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'date' })
  month: Date; // First day of the month (YYYY-MM-01)

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
