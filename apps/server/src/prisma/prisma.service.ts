import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import {
  DynamicClientExtensionThis,
  InternalArgs,
} from '@prisma/client/runtime/library';
import { camelCase } from 'es-toolkit';
import { nanoid } from 'nanoid';

// 扩展后的 Prisma Client 类型
type ExtendedPrismaClient = DynamicClientExtensionThis<
  Prisma.TypeMap<
    InternalArgs & {
      result: {};
      model: {};
      query: {};
      client: {};
    },
    Prisma.PrismaClientOptions
  >,
  Prisma.TypeMapCb,
  {
    model: {};
    result: {};
    query: {};
    client: {};
  },
  Prisma.PrismaClientOptions
>;

// const omitFields = {
//   createdAt: true,
//   updatedAt: true,
//   deleted: true,
// };
@Injectable()
export class PrismaService implements OnModuleInit {
  private readonly client: ExtendedPrismaClient;

  constructor() {
    const prisma = new PrismaClient({
      // omit: {
      //   user: omitFields,
      //   conversation: omitFields,
      //   assessment: omitFields,
      //   assessmentResult:omitFields,
      //        assessmentType:omitFields,
      // },
    })
      .$extends({
        name: 'auto-uid',
        query: {
          $allModels: {
            create: async ({ model, args, query }) => {
              if (!args.data.uid) {
                args.data = {
                  ...args.data,
                  uid: generateUid(model),
                };
              }
              return query(args);
            },
            createMany: async ({ model, args, query }) => {
              const data = Array.isArray(args.data) ? args.data : [args.data];
              // @ts-expect-error 类型推理错误
              args.data = data.map((item) => ({
                ...item,
                uid: item.uid || generateUid(model),
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
            update: async ({ model, args, query }) => {
              args.where = { deleted: false, ...args.where };
              return query(args);
            },
            updateMany: async ({ model, args, query }) => {
              args.where = { deleted: false, ...args.where };
              return query(args);
            },
            updateManyAndReturn: async ({ model, args, query }) => {
              args.where = { deleted: false, ...args.where };
              return query(args);
            },
          },
        },
      });

    this.client = prisma;
  }

  async onModuleInit() {}

  // 暴露扩展后的 client
  get db() {
    return this.client;
  }
}

function generateUid(model: string) {
  return nanoid();
}

function toCamelCase<S extends string>(str: S): Uncapitalize<S> {
  return (str[0].toLowerCase() + str.slice(1)) as Uncapitalize<S>;
}
