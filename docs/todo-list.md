# TODO list

- [ ] logger 日志系统
- [ ] nest-cls 上下文管理，用于日志跟踪
- [ ] @TrpcRouter 装饰器，用于自动注册路由

- [ ] 运行状态机 管理任务进度 协调多 Agent 协作
  - pending 等待，等待新的指令输入
  - running 运行中，根据指令调用 Agent 执行任务
  - completed 完成，所有 Agent 完成任务
  - failed 失败，有 Agent 执行失败

- [ ] 多 Agent 协作系统
  - [ ] 任务管理器 Agent
    - 需求分析与拆解
    - 任务分配与调度
    - 进度跟踪与状态管理
  - [ ] 专家 Agent 池
    - 产品专家
    - 技术专家
    - 测试专家
    - 文档专家
  - [ ] 结果汇总与交付 Agent
