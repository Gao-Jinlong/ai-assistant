import { ConfigService } from '@nestjs/config';
import winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { omit } from 'es-toolkit';
import 'winston-daily-rotate-file';
export const createWinstonLogger = (configService: ConfigService) => {
  const logConfig = {
    level: configService.get<string>('logging.level') || 'debug',
    dir: configService.get<string>('logging.dir') || './logs',
    maxSize: configService.get<number>('logging.maxSize') || 20 * 2 ** 20,
    maxFiles: configService.get<number>('logging.maxFiles') || 7,
    enableConsole: configService.get<boolean>('logging.enableConsole') || true,
    enableFile: configService.get<boolean>('logging.enableFile') || true,
  };

  // 确保日志目录存在
  if (logConfig.enableFile && !fs.existsSync(logConfig.dir)) {
    fs.mkdirSync(logConfig.dir, { recursive: true });
  }

  // 自定义日志格式
  const customFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(
      ({ timestamp, level, message, traceId, module, action, ...meta }) => {
        const logObject = {
          timestamp,
          level: level.toUpperCase(),
          message,
          traceId,
          module,
          action,
          ...meta,
        };
        return JSON.stringify(logObject);
      },
    ),
  );

  // 控制台格式（开发环境更友好）
  const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.colorize(),
    winston.format.printf(
      ({ timestamp, level, message, traceId, module, action, ...meta }) => {
        let logLine = `${timestamp} [${level}]`;

        if (traceId) {
          logLine += ` [${traceId}]`;
        }

        if (module) {
          logLine += ` [${module}]`;
        }

        logLine += ` ${message}`;

        // 添加额外的元数据

        const metaKeys = Object.keys(
          omit(meta, [
            'timestamp',
            'level',
            'message',
            'traceId',
            'module',
            'action',
          ]),
        );

        if (metaKeys.length > 0) {
          const metaString = metaKeys
            .map((key) => `${key}=${JSON.stringify(meta[key])}`)
            .join(' ');
          logLine += ` ${metaString}`;
        }

        return logLine;
      },
    ),
  );

  const transports: winston.transport[] = [];

  // 控制台输出
  if (logConfig.enableConsole) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
      }),
    );
  }

  // 文件输出
  if (logConfig.enableFile) {
    // 所有日志
    transports.push(
      new winston.transports.File({
        filename: path.join(logConfig.dir, 'combined.log'),
        format: customFormat,
        maxsize: logConfig.maxSize,
        maxFiles: logConfig.maxFiles,
        tailable: true,
      }),
    );

    // 错误日志
    transports.push(
      new winston.transports.File({
        filename: path.join(logConfig.dir, 'error.log'),
        level: 'error',
        format: customFormat,
        maxsize: logConfig.maxSize,
        maxFiles: logConfig.maxFiles,
        tailable: true,
      }),
    );
  }

  return {
    level: logConfig.level,
    format: customFormat,
    transports,
    exceptionHandlers: logConfig.enableFile
      ? [
          new winston.transports.File({
            filename: path.join(logConfig.dir, 'exceptions.log'),
            format: customFormat,
          }),
        ]
      : [],
    rejectionHandlers: logConfig.enableFile
      ? [
          new winston.transports.File({
            filename: path.join(logConfig.dir, 'rejections.log'),
            format: customFormat,
          }),
        ]
      : [],
  };
};
