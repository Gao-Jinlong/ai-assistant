declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TONGYI_API_KEY: string;
      // 添加其他环境变量的类型声明
    }
  }
}

export {};
