import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Expense } from './entities/Expense';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Expense],
  synchronize: true, // Only for development
  logging: false,
});

export const initializeDatabase = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  return AppDataSource;
};
