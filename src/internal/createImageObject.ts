import mime from 'mime';

import sharp from 'sharp';
import {ImageObject, ImageOptions} from '../types';

import createName from './createName';

const createImageObject = (
  input: Buffer,
  meta: sharp.OutputInfo,
  options: ImageOptions,
  context: string,
  loader: any,
): ImageObject => {
  const n = createName(input, meta, options, context, loader);
  const type = mime.getType(n);
  const result: ImageObject = {
    format: meta.format,
    width: meta.width,
    height: meta.height,
    type: type ?? undefined,
    name: n,
  };
  if (typeof options.scale === 'number') {
    (result.width as number) /= options.scale;
    (result.height as number) /= options.scale;
  }
  return result;
};

export default createImageObject;
