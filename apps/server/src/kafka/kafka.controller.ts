import { Controller, Get, Post } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { KafkaEventType } from './kafka.constants';

@Controller('kafka')
export class KafkaController {
  constructor(private readonly kafkaService: KafkaService) {}

  @Get('health')
  async health() {
    const isHealthy = await this.kafkaService.isConnected();
    return {
      status: isHealthy ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      details: {
        producer: isHealthy ? 'connected' : 'disconnected',
        consumers: await this.kafkaService.getConsumerStatus(),
      },
    };
  }

  @Get('topics')
  async getTopics() {
    const topics = await this.kafkaService.getTopics();
    return {
      topics,
      count: topics.length,
    };
  }

  @Post('test')
  async testConnection() {
    try {
      const result = await this.kafkaService.produceToTopic(
        'test.topic',
        {
          eventType: KafkaEventType.MESSAGE_CREATED,
          timestamp: Date.now(),
          data: { message: 'Kafka connection test' },
        },
        'test-key',
      );
      return {
        success: true,
        message: 'Test message sent successfully',
        result,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send test message',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
