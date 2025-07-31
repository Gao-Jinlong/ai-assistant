import { Test } from '@nestjs/testing';
import { AgentService } from './agent.service';
import { ModelManagerService } from '../model-manager/model-manager.service';
import { ConfigService } from '@nestjs/config';

async function testAgent() {
  // 创建测试模块
  const moduleRef = await Test.createTestingModule({
    providers: [
      AgentService,
      ModelManagerService,
      {
        provide: ConfigService,
        useValue: {
          get: (key: string) => {
            switch (key) {
              case 'TONGYI_API_KEY':
                return process.env.TONGYI_API_KEY;
              case 'TONGYI_BASE_URL':
                return (
                  process.env.TONGYI_BASE_URL ||
                  'https://dashscope.aliyuncs.com/compatible-mode/v1'
                );
              default:
                return undefined;
            }
          },
        },
      },
    ],
  }).compile();

  const agentService = moduleRef.get<AgentService>(AgentService);

  console.log('🤖 开始测试 Agent 服务...\n');

  try {
    // 测试基础对话
    console.log('📝 测试基础对话功能...');
    const result1 = await agentService.run('你好，请介绍一下自己');
    console.log('👤 用户:', '你好，请介绍一下自己');
    console.log('🤖 助手:', result1.response);
    console.log('📊 消息数量:', result1.messages.length);
    console.log('');

    // 测试多轮对话
    console.log('📝 测试多轮对话功能...');
    const result2 = await agentService.run(
      '我刚才问了什么问题？',
      result1.messages,
    );
    console.log('👤 用户:', '我刚才问了什么问题？');
    console.log('🤖 助手:', result2.response);
    console.log('📊 消息数量:', result2.messages.length);
    console.log('');

    // 测试图模式对话
    console.log('📝 测试 LangGraph 模式对话...');
    const result3 = await agentService.chatWithGraph(
      '请帮我写一个简单的 Python 函数',
    );
    console.log('👤 用户:', '请帮我写一个简单的 Python 函数');
    console.log('🤖 助手:', result3.response);
    console.log('📊 元数据:', result3.metadata);
    console.log('');

    // 测试流式对话
    console.log('📝 测试流式对话功能...');
    console.log('👤 用户:', '请用一句话总结人工智能');
    console.log('🤖 助手: (流式响应)');
    const stream = await agentService.chatStream('请用一句话总结人工智能');

    let streamResponse = '';
    for await (const chunk of stream) {
      const content = chunk.toString();
      streamResponse += content;
      process.stdout.write(content);
    }
    console.log('\n');
    console.log('📊 流式响应完成，长度:', streamResponse.length);

    console.log('\n✅ 所有测试完成！Agent 服务运行正常。');
  } catch (error) {
    console.error('❌ 测试失败:', error);
  } finally {
    await moduleRef.close();
  }
}

// 运行测试
if (require.main === module) {
  testAgent().catch(console.error);
}

export { testAgent };
