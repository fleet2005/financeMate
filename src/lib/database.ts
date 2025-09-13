import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Expense } from './entities/Expense';
import { Budget } from './entities/Budget';
import { Portfolio } from './entities/Portfolio';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Expense, Budget, Portfolio],
  synchronize: true, // Only for development
  logging: false,
});

export const initializeDatabase = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};
