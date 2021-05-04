import findCacheDir from 'find-cache-dir';
import * as fs from 'fs';
import * as path from 'path';
import {hashOptions} from './hashOptions';

export class Cache {
  cacheDir: string | undefined;

  constructor({cacheDir}: {cacheDir?: string | boolean | null}) {
    this.cacheDir =
      cacheDir === true || cacheDir === undefined
        ? findCacheDir({name: 'sharp-loader'})
        : cacheDir === false || cacheDir === null
        ? undefined
        : cacheDir;
  }

  getKey(key: unknown): string {
    return hashOptions(key);
  }

  getPath(key: unknown): string {
    if (typeof this.cacheDir !== 'string') {
      throw new Error();
    }
    return path.join(this.cacheDir, this.getKey(key));
  }

  async read(key: unknown): Promise<any> {
    if (this.cacheDir === undefined) {
      return await Promise.reject(new Error());
    }
    return await new Promise((resolve, reject) => {
      fs.readFile(this.getPath(key), (err, data) => {
        err !== null && typeof err !== 'undefined'
          ? reject(err)
          : resolve(data);
      });
    });
  }

  async readBuffer(key: unknown): Promise<Buffer | undefined> {
    try {
      return await this.read(key);
    } catch (err) {
      return undefined;
    }
  }

  async readJson(key: unknown): Promise<Record<string, any> | undefined> {
    try {
      const data = await this.read(key);
      return JSON.parse(data.toString('utf8'));
    } catch (err) {
      return undefined;
    }
  }

  async write(key: unknown, value: any): Promise<void> {
    if (this.cacheDir === undefined) {
      return;
    }
    return await new Promise((resolve, reject) => {
      fs.writeFile(this.getPath(key), value, (err) => {
        err !== null && typeof err !== 'undefined' ? reject(err) : resolve();
      });
    });
  }

  async writeBuffer(key: unknown, value: Buffer): Promise<void> {
    try {
      return await this.write(key, value);
    } catch (err) {
      return undefined;
    }
  }

  async writeJson(key: unknown, value: {}): Promise<void> {
    try {
      return await this.write(key, JSON.stringify(value));
    } catch (err) {
      return undefined;
    }
  }
}
