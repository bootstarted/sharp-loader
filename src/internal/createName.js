// @flow
import loaderUtils from 'loader-utils';

import type {GlobalOptions} from '../types';
import hashOptions from './hashOptions';

/**
 * Generate the appropriate extension for a `sharp` format.
 * @param  {String} type `sharp` type.
 * @returns {String} Extension.
 */
const extension = (type: string): string => {
  return (
    {
      jpeg: '.jpg',
    }[type] || `.${type}`
  );
};

const createName = (
  image: Buffer,
  info: *,
  format: string,
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
    .replace(/\.[^.]+$/, extension(format));

  const content = Buffer.concat([new Buffer(hashOptions(params)), image]);
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
