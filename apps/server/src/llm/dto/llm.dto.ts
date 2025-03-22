import { z } from 'zod';

export const questionTypeSchema = z.object({
  type: z.enum(['一般问题', '职业规划', '个人成长']).describe('用户提问的分类'),
});
