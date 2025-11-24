/**
 * Thread 状态枚举
 * 映射到数据库中的 status 整型字段
 */
export enum ThreadStatus {
  /** 已完成/已结束 */
  COMPLETED = 0,

  /** 正在进行中 */
  IN_PROGRESS = 1,
}
