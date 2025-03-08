import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function setupDatabase() {
  const env = process.env.NODE_ENV || 'development';
  console.log(`Setting up database for ${env} environment...`);

  try {
    // 根据环境加载对应的 .env 文件
    require('dotenv').config({
      path: `.env.${env}`,
    });

    const prisma = new PrismaClient();

    // 运行数据库迁移
    await execAsync('npx prisma migrate deploy');

    // 可以添加一些初始数据
    if (env === 'development') {
      // 添加测试数据
      await prisma.assessmentType.create({
        data: {
          uid: '',
          name: '性格测试',
          description: '用于测试性格特征的评估',
        },
      });
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
