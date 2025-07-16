import { Controller, Get } from '@nestjs/common';
import { ResponseUtil, SkipResponseFormat } from './common';

@Controller()
export class AppController {
  constructor() {}

  /**
   * 测试统一响应格式化 - 自动包装
   */
  @Get('test/auto-format')
  testAutoFormat() {
    return {
      message: '这是一个测试数据',
      timestamp: new Date().toISOString(),
      user: {
        id: 1,
        name: '张三',
        email: 'zhangsan@example.com',
      },
    };
  }

  /**
   * 测试统一响应格式化 - 手动构建
   */
  @Get('test/manual-format')
  testManualFormat() {
    const data = {
      users: [
        { id: 1, name: '张三' },
        { id: 2, name: '李四' },
      ],
    };
    return ResponseUtil.list(data.users, '用户列表查询成功');
  }

  /**
   * 测试跳过响应格式化
   */
  @Get('test/skip-format')
  @SkipResponseFormat()
  testSkipFormat() {
    return {
      raw: true,
      message: '这个响应不会被包装',
      directResponse: 'yes',
    };
  }

  /**
   * 测试分页响应
   */
  @Get('test/pagination')
  testPagination() {
    const items = [
      { id: 1, name: '用户1' },
      { id: 2, name: '用户2' },
      { id: 3, name: '用户3' },
    ];
    return ResponseUtil.paginated(items, 100, 1, 10, '分页查询成功');
  }
}
