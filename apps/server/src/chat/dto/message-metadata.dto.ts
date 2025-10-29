import { MessageMetadata, TokenUsage } from './sse-message.dto';

/**
 * 消息元数据构建器
 */
export class MessageMetadataBuilder {
  private metadata: Partial<MessageMetadata> = {};

  constructor() {
    this.metadata.timestamp = Date.now();
  }

  /**
   * 设置Token使用情况
   */
  setUsage(usage: TokenUsage): this {
    this.metadata.usage = usage;
    return this;
  }

  /**
   * 设置延迟
   */
  setLatency(latency: number): this {
    this.metadata.latency = latency;
    return this;
  }

  /**
   * 更新时间戳
   */
  updateTimestamp(): this {
    this.metadata.timestamp = Date.now();
    return this;
  }

  /**
   * 构建元数据对象
   */
  build(): MessageMetadata {
    return this.metadata as MessageMetadata;
  }

  /**
   * 克隆构建器
   */
  clone(): MessageMetadataBuilder {
    const builder = new MessageMetadataBuilder();
    builder.metadata = { ...this.metadata };
    return builder;
  }
}
