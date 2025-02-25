# AI-ASSISTANT

## nestjs & nextjs & trpc 端到端类型安全项目搭建

### 1. 初始化项目

```powershell
mkdir ai-assistant
cd ai-assistant

mkdir apps

# git
git init
ni .gitignore

# pnpm
pnpm init
ni pnpm-workspace.yaml
```

pnpm-workspace.yaml 配置

```yaml
packages:
  # all apps in direct subdirs of apps/
  - 'apps/*'
```

### 2. nestjs

```bash
cd apps

nest new server --strict --skip-git --package-manager=pnpm
# --strict 严格模式
# --skip-git 不初始化 git
# --package-manager=pnpm 使用 pnpm

# 检查 server 是否正常运行
cd server
pnpm run start:dev
```

注意 nestjs 的默认端口与 nextjs 冲突都是 3000 可以修改为 4000

### 3. nextjs

回到 `apps/` 目录

```bash
pnpx create-next-app@latest
```

```bash
What is your project named? # web (change to whatever you want)
Would you like to use TypeScript with this project? # Yes
Would you like to use ESLint with this project? # Yes
Would you like to use Tailwind CSS with this project? Yes # Yes
Would you like to use `src/` directory with this project? # No
Use App Router (recommended)? # Yes
Would you like to customize the default import alias? # No
```

```bash
cd /web
pnpm dev
```

### 4. typescript + monorepo

tRPC server 运行在 nestjs 端，tRPC client 运行在 nextjs 端

tRPC 客户端将需要访问一个名为 Axpoutouter 的类型，该类型在 nestjs 应用程序内定义。

当前这是无法实现的，因为只能从应用所在的程序中导入类型声明

我们需要通过 typescript 配置来解决这个问题

转到项目根目录添加 `tsconfig.json` 文件

```bash
pnpm install --save-dev -w typescript
npx tsc --init
```

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@server/*": ["./apps/server/src/*"],
      "@web/*": ["./apps/web/*"]
    }
  }
}
```

更新 nestjs 的 tsconfig

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    // "emitDecoratorMetadata": true,
    // "experimentalDecorators": true,
    // "target": "ES2021",
    // "baseUrl": "./",
    // "incremental": true,
    // "skipLibCheck": true,
    // "strictNullChecks": true,
    // "noImplicitAny": true,
    // "strictBindCallApply": true,
    // "forceConsistentCasingInFileNames": true,
    // "noFallthroughCasesInSwitch": true,
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "outDir": "./dist",
  }
}
```

更新 nextjs 的 tsconfig

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    // "skipLibCheck": true,
    // "paths": {
    //   "@/*": [
    //     "./*"
    //   ]
    // },
    "target": "ES5",
    "lib": [
      "dom",
      "dom.iterable",
      "esnext"
    ],
    "allowJs": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

在根目录的 `package.json` 中添加 `scripts`

```json
{
  "scripts": {
    "dev": "pnpm run --parallel dev",
  },
}
```

更新 server 的 `package.json` 中的 `scripts`，以实现 `dev` 命令

```json
{
  "scripts": {
    "dev": "pnpm run start:dev",
  },
}
```

最后需要注意，在根目录使用 `pnpm add @nestjs/config --filter=server` 安装依赖时会遇到 `miss peer dependency error`

```json
apps/server
└─┬ ts-loader 9.4.3
  └── ✕ missing peer webpack@^5.0.0
Peer dependencies that should be installed:
  webpack@^5.0.0
```

这是由于在 monorepo 中，软件包管理器不会自动处理工作空间中各个应用程序的 `peer dependencies`，因此需要在 nestjs 中手动安装

### 5. tRPC server

安装依赖

```bash
pnpm add @trpc/server zod --filter=server
```

在 nestjs 中添加 tRPC 模块

```bash
mkdir apps/server/src/trpc
ni apps/server/src/trpc/trpc.module.ts
ni apps/server/src/trpc/trpc.service.ts   
ni apps/server/src/trpc/trpc.router.ts   
```

实现看具体代码

在 tRPC router 中定义接口会导致文件膨胀，可以通过 [Merging Routers](https://trpc.io/docs/server/merging-routers) 来拆分路由


tRPC 服务准备好后需要在 `main.ts` 中添加中间件

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TrpcRouter } from '@server/trpc/trpc.router';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const trpc = app.get(TrpcRouter);
  trpc.applyMiddleware(app);
  await app.listen(4000);
}
bootstrap();
```

### 6. tRPC client

安装 tRPC 客户端包

在根目录运行

```bash
pnpm add @trpc/client @trpc/server --filter=web
```

创建 tRPC 客户端

```bash
ni apps/web/app/trpc.ts
```

```typescript
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { AppRouter } from '@server/trpc/trpc.router'

export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:4000/trpc", // 您应该将其更新以使用 ENV 变量
    }),
  ],
});
```
