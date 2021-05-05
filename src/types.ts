import sharp from 'sharp';

export interface FormatOptions {
  [key: string]: string | number | boolean;
}

export type Format = string | ({format: string} & FormatOptions);

export interface ImageOptions {
  name?: string;
  format?: Format;
  width?: number;
  height?: number;
  scale?: number;
  mode?: 'cover' | 'contain';
  inline?: boolean;
  preset?: string;
  blur?: number;
}

export interface ImageObject {
  name: string;
  format: string;
  width?: number;
  height?: number;
  preset?: string;
  inline?: boolean;
  scale?: number;
  type?: string;
  url?: string;
}

type Entry<O, K extends keyof O> = [K, O[K]];
export type SharpMethods = {
  [fn in keyof Pick<sharp.Sharp, 'blur' | 'resize' | 'toFormat'>]: Parameters<
    sharp.Sharp[fn]
  >;
};
export type SharpPipeline = Entry<SharpMethods, keyof SharpMethods>[];

export interface OutputOptions extends ImageOptions {
  meta?: (input: any) => any;
}
