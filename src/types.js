// @flow

export type SharpMeta = {|
  width: number,
  height: number,
  format: string,
|};

export type ImageOptions = {|
  name?: string,
  format?: string,
  width?: number,
  height?: number,
  scale?: number,
  mode?: 'cover' | 'contain',
  inline?: boolean,
  preset?: string,
  blur?: number,
|};

export type ImageObject = {
  name: string,
  format: string,
  width: number,
  height: number,
  preset?: string,
  inline?: boolean,
  scale?: number,
};

export type SharpOptions = {
  max?: boolean,
  min?: boolean,
  toFormat?: string,
  blur?: number,
  resize?: [?number, ?number],
  crop?: *,
};

declare function ArrayLike<T>(T): Array<T> | T;

export type OutputOptions = $ObjMap<ImageOptions, ArrayLike<*>> & {
  meta?: (*) => *,
};

export type GlobalOptions = {
  emitFile: boolean | 'synthetic',
  context: *,
  cacheDir: ?string,
};
