export type StorageOptions = StorageLocalOptions | StorageS3Options;

export interface StorageLocalOptions {
  type: 'local';
  basePath?: string;
}

export interface StorageS3Options {
  type: 's3';
  bucket: string;
}

export interface FileInfo {
  path: string;
  size: number;
  lastModified: Date;
  metadata?: Record<string, string>;
}

export interface IStorageProvider {
  /**
   * 写入文件内容
   * @param path 文件路径
   * @param content 文件内容
   * @param metadata 元数据
   */
  write(
    path: string,
    content: string | Buffer,
    metadata?: Record<string, string>,
  ): Promise<void>;

  /**
   * 追加内容到文件
   * @param path 文件路径
   * @param content 要追加的内容
   */
  append(path: string, content: string | Buffer): Promise<void>;

  /**
   * 读取文件内容
   * @param path 文件路径
   */
  read(path: string): Promise<string>;

  /**
   * 删除文件
   * @param path 文件路径
   */
  delete(path: string): Promise<void>;

  /**
   * 获取文件信息
   * @param path 文件路径
   */
  stat(path: string): Promise<FileInfo>;

  /**
   * 检查文件是否存在
   * @param path 文件路径
   */
  exists(path: string): Promise<boolean>;
}
