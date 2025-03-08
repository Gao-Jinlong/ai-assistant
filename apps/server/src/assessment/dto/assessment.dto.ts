import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** 题目类型枚举 */
export const QuestionTypeEnum = z.enum([
  'MULTIPLE_CHOICE',
  'SINGLE_CHOICE',
  'TRUE_FALSE',
]);

/** 选项的基础结构 */
const baseOptionSchema = z.object({
  /** 选项ID */
  uid: z.string(),
  /** 选项内容 */
  content: z.string(),
  /** 选项贡献分数 */
  score: z.number().optional(),
});

const multipleChoiceOptionSchema = baseOptionSchema.extend({
  /** 选项贡献维度 */
  demotion: z.string().optional(),
});

/** 不同题型的具体结构 */
export const questionSchema = z.discriminatedUnion('type', [
  /** 单选题 */
  z.object({
    type: z.literal('SINGLE_CHOICE'),
    /** 题目内容 */
    question: z.string(),
    /** 选项列表 */
    options: z.array(baseOptionSchema),
    /** 考察维度 */
    demotion: z.string().optional(),
  }),

  /**
   * 多选题
   *
   * 例如：
   * 题目：哪些事情会给你带来成就感？
   * 选项：
   * - 完成一个项目
   * - 学习新技能
   * - 帮助他人
   * - 取得好成绩
   * - 实现目标
   */
  z.object({
    type: z.literal('MULTIPLE_CHOICE'),
    /** 题目内容 */
    question: z.string(),
    /** 选项列表 */
    options: z.array(multipleChoiceOptionSchema),
    /** 考察维度 */
    demotion: z.string().optional(),
  }),

  /**
   * 判断题
   *
   * 例如：
   * 题目：你是否认同“爱情是人类最美好的情感”？
   */
  z.object({
    type: z.literal('TRUE_FALSE'),
    /** 题目内容 */
    question: z.string(),
    /** 正确答案 */
    correctAnswer: z.boolean(),
    /** 题目解析 */
    explanation: z.string().optional(),
  }),
]);

/** 评估的完整结构 */
export const createAssessmentSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  timeLimit: z.number().optional(), // 单位：分钟
  typeUid: z.string(),
  userUid: z.string(),
  totalScore: z.number(),
  passingScore: z.number().optional(),
  questions: z.array(questionSchema),
});

export class CreateAssessmentDto extends createZodDto(createAssessmentSchema) {}
