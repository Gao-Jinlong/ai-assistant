import { Injectable, OnModuleInit } from '@nestjs/common';
import { generateUid } from '@common/utils/uuid';

import { Prisma, PrismaClient } from 'generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly client: PrismaClient<
    never,
    Prisma.GlobalOmitConfig | undefined
  >;

  constructor(private readonly configService: ConfigService) {
    const connectionString = this.configService.get('DATABASE_URL');
    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString }),
    })
      .$extends({
        name: 'auto-uid',
        query: {
          $allModels: {
            create: async ({ args, query }) => {
              if (!args.data.uid) {
                args.data = {
                  ...args.data,
                  uid: generateUid(),
                };
              }
              return query(args);
            },
            createMany: async ({ args, query }) => {
              const data = Array.isArray(args.data) ? args.data : [args.data];
              // @ts-expect-error 类型推理错误
              args.data = data.map((item) => ({
                ...item,
                uid: item.uid || generateUid(),
              }));
              return query(args);
            },
          },
        },
      })
      .$extends({
        name: 'undeleted',
        query: {
          $allModels: {
            findFirst: async ({ args, query }) => {
              args.where = { deleted: false, ...args.where };
              return query(args);
            },
            findFirstOrThrow: async ({ args, query }) => {
              args.where = { deleted: false, ...args.where };
              return query(args);
            },
            findUniqueOrThrow: async ({ args, query }) => {
              args.where = { deleted: false, ...args.where };
              return query(args);
            },
            findMany: async ({ args, query }) => {
              args.where = { deleted: false, ...args.where };
              return query(args);
            },
            findUnique: async ({ args, query }) => {
              args.where = { deleted: false, ...args.where };
              return query(args);
            },
            update: async ({ args, query }) => {
              args.where = { deleted: false, ...args.where };
              return query(args);
            },
            updateMany: async ({ args, query }) => {
              args.where = { deleted: false, ...args.where };
              return query(args);
            },
            updateManyAndReturn: async ({ args, query }) => {
              args.where = { deleted: false, ...args.where };
              return query(args);
            },
          },
        },
      });

    this.client = prisma as unknown as any;
  }

  async onModuleInit() {}

  // 暴露扩展后的 client
  get db() {
    return this.client;
  }
}
