import { Injectable } from '@nestjs/common';
import {
  IStorageProvider,
  StorageOptions,
  FileInfo,
  StorageLocalOptions,
} from '../interfaces/storage.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly basePath: string;

  constructor(options: StorageLocalOptions) {
    this.basePath = options.basePath || './data/storage';
  }

  private getFullPath(filePath: string): string {
    return path.join(this.basePath, filePath);
  }

  async write(
    writePath: string,
    content: string | Buffer,
    metadata?: Record<string, string>,
  ): Promise<void> {
    const fullPath = this.getFullPath(writePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    await fs.writeFile(fullPath, content);

    if (metadata) {
      const metaPath = `${fullPath}.meta`;
      await fs.writeFile(metaPath, JSON.stringify(metadata));
    }
  }

  async append(path: string, content: string | Buffer): Promise<void> {
    const fullPath = this.getFullPath(path);
    await fs.appendFile(fullPath, content);
  }

  async read(path: string): Promise<string> {
    const fullPath = this.getFullPath(path);
    return fs.readFile(fullPath, 'utf-8');
  }

  async delete(path: string): Promise<void> {
    const fullPath = this.getFullPath(path);
    await fs.unlink(fullPath);

    try {
      await fs.unlink(`${fullPath}.meta`);
    } catch (error) {
      if (
        error instanceof Error &&
        (error as NodeJS.ErrnoException).code !== 'ENOENT'
      ) {
        throw error;
      }
    }
  }

  async stat(path: string): Promise<FileInfo> {
    const fullPath = this.getFullPath(path);
    const stats = await fs.stat(fullPath);

    let metadata: Record<string, string> | undefined;
    try {
      const metaContent = await fs.readFile(`${fullPath}.meta`, 'utf-8');
      metadata = JSON.parse(metaContent);
    } catch (error) {
      if (
        error instanceof Error &&
        (error as NodeJS.ErrnoException).code !== 'ENOENT'
      ) {
        throw error;
      }
    }

    return {
      path,
      size: stats.size,
      lastModified: stats.mtime,
      metadata,
    };
  }

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(this.getFullPath(path));
      return true;
    } catch {
      return false;
    }
  }
}
