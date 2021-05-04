import loaderUtils from 'loader-utils';
import sharp, {OutputInfo} from 'sharp';
import {hashOptions} from './hashOptions';

const extensionMap = {
  jpeg: '.jpg',
} as const;

/**
 * Generate the appropriate extension for a `sharp` format.
 * @param  {String} type `sharp` type.
 * @returns {String} Extension.
 */
const extension = (type: string): string => {
  return extensionMap[type as keyof typeof extensionMap] ?? `.${type}`;
};

const createName = (
  image: Buffer,
  info: sharp.OutputInfo,
  params: any,
  context: string,
  loader: any,
): string => {
  const template = (typeof params.name === 'string'
    ? params.name
    : '[hash].[ext]'
  ).replace(/\[([^\]]+)\]/g, (str: string, name: string) => {
    if (/^(name|hash)$/.test(name)) {
      return str;
    }
    if (typeof params[name] !== 'undefined') {
      return params[name]?.toString();
    }
    if (typeof info[name as keyof OutputInfo] !== 'undefined') {
      return info[name as keyof OutputInfo]?.toString();
    }
    return str;
  });

  const resourcePath = loader.resourcePath
    .replace(/@([0-9]+)x\./, '.')
    .replace(/\.[^.]+$/, extension(info.format));

  const content = Buffer.concat([Buffer.from(hashOptions(params)), image]);
  return loaderUtils.interpolateName(
    {
      ...loader,
      resourcePath,
    },
    template,
    {
      content,
      context,
    },
  );
};

export default createName;
