// @flow
import loaderUtils from 'loader-utils';

import type {GlobalOptions} from '../types';

const splatOptions = (v: *): string => {
  switch (typeof v) {
    case 'object':
      if (!v) {
        return '!null!';
      }
      if (Array.isArray(v)) {
        return v.map(splatOptions).join('|');
      }
      return Object.keys(v)
        .sort()
        .map((k) => {
          return k + splatOptions(v[k]);
        })
        .join('|');
    case 'string':
    case 'boolean':
    case 'number':
    case 'function':
      return v.toString();
    default:
      return '';
  }
};

/**
 * Generate the appropriate extension for a `sharp` format.
 * @param  {String} type `sharp` type.
 * @returns {String} Extension.
 */
const extension = (type: string): string => {
  return {
    webp: '.webp',
    jpeg: '.jpg',
    png: '.png',
  }[type];
};

const createName = (
  image: Buffer,
  info: *,
  params: *,
  globalOptions: GlobalOptions,
  loader: *,
) => {
  const template = (typeof params.name === 'string'
    ? params.name
    : '[hash].[ext]'
  ).replace(/\[([^\]]+)\]/g, (str, name) => {
    if (/^(name|hash)$/.test(name)) {
      return str;
    }
    if (params[name]) {
      return params[name];
    }
    if (info[name]) {
      return info[name];
    }
    return str;
  });
  const resourcePath = loader.resourcePath
    .replace(/@([0-9]+)x\./, '.')
    .replace(/\.[^.]+$/, extension(info.format));
  const content = Buffer.concat([new Buffer(splatOptions(params)), image]);
  return loaderUtils.interpolateName(
    {
      resourcePath,
      options: loader.options,
    },
    template,
    {
      content,
      context: globalOptions.context,
    },
  );
};

export default createName;
