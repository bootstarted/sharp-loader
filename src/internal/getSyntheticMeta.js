// @flow
import createSharpOptions from './createSharpOptions';

import type {Meta} from 'sharp';
import type {ImageOptions} from '../types';

const getSyntheticMeta = (
  imageOptions: ImageOptions,
  meta: Meta,
): $Supertype<Meta> => {
  const sharp = createSharpOptions(imageOptions, meta);
  const apsectRatio = meta.width / meta.height;
  let width = meta.width;
  let height = meta.height;
  const format =
    typeof sharp.toFormat === 'string' ? sharp.toFormat : meta.format;
  if (sharp.resize) {
    if (
      typeof sharp.resize[0] === 'number' &&
      typeof sharp.resize[1] !== 'number'
    ) {
      width = sharp.resize[0];
      height = sharp.resize[0] / apsectRatio;
    } else if (
      typeof sharp.resize[1] === 'number' &&
      typeof sharp.resize[0] !== 'number'
    ) {
      height = sharp.resize[1];
      width = sharp.resize[1] * apsectRatio;
    } else {
      width = sharp.resize[0];
      height = sharp.resize[1];
    }
  }
  return {
    width,
    height,
    format,
  };
};

export default getSyntheticMeta;
