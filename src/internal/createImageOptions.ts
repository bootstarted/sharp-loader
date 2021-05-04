import sharp from 'sharp';

import {OutputOptions, ImageOptions} from '../types';
import {cartesianProduct} from './cartesianProduct';

const allowedImageProperties = [
  'name',
  'scale',
  'blur',
  'width',
  'height',
  'mode',
  'format',
  'inline',
] as const;

function multiplex<T extends Record<string, any>>(
  options: {[V in keyof T]: V[]},
): T[] {
  const keys: (keyof T)[] = Object.keys(options);
  const values = keys.map((key) => {
    const value = options[key];
    return value;
  });
  const product = cartesianProduct<{[V in keyof T]: V[]}[keyof T][number]>(
    values,
  );
  return product.map((entries) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const result: T = {} as T;
    keys.forEach((key, i) => {
      const value = entries[i] as T[keyof T];
      result[key] = value;
    });
    return result;
  });
}

const normalizeProperty = (key: string, value: any): any => {
  switch (key) {
    case 'scale':
    case 'blur':
    case 'width':
    case 'height':
      return parseFloat(value);
    default:
      return value;
  }
};

export const normalizeOutputOptions = (
  options: OutputOptions,
  ...args: any[]
): OutputOptions => {
  const normalize = (key: string, val: unknown): any => {
    if (typeof val === 'function') {
      return normalize(key, val(...args));
    } else if (Array.isArray(val)) {
      if (val.length === 0) {
        return undefined;
      }
      return val.reduce((out, v) => {
        if (typeof v !== 'undefined') {
          return [...out, normalizeProperty(key, v)];
        }
        return out;
      }, []);
    } else if (typeof val !== 'undefined') {
      return [normalizeProperty(key, val)];
    }
    return undefined;
  };
  const keys = Object.keys(options) as (keyof OutputOptions)[];
  const result: OutputOptions = {};
  keys.forEach((key) => {
    const out = normalize(key, options[key]);
    if (typeof out !== 'undefined') {
      result[key] = out;
    }
  });
  return result;
};

export const createImageOptions = (
  meta: sharp.Metadata,
  outputOptions: OutputOptions,
): Array<ImageOptions> => {
  let newMeta = meta;
  if (typeof outputOptions.meta === 'function') {
    newMeta = outputOptions.meta(meta);
  }
  const base = normalizeOutputOptions(outputOptions, newMeta);
  const config: Record<string, any> = {};
  allowedImageProperties.forEach((key) => {
    if (typeof base[key] !== 'undefined') {
      config[key] = base[key];
    }
  });
  const out = multiplex(config);
  out.forEach((item) => {
    // NOTE: Can copy any non-multiplexed values here.
    if (typeof outputOptions.preset === 'string') {
      item.preset = outputOptions.preset;
    }
  });
  return out;
};
