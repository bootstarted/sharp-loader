// @flow
import sharp from 'sharp';

import type {ImageOptions, SharpOptions} from '../types';

import parseFormat from './parseFormat';

/**
 * Take some configuration options and transform them into a format that
 * `transform` is capable of using.
 * @param {Object} options Generic configuration options.
 * @param {Object} meta Image metadata about original image from sharp.
 * @returns {Object} `transform` compatible options.
 */
const createSharpOptions = (options: ImageOptions, meta: *): SharpOptions => {
  const result = {};

  const {format: rawFormat = meta.format} = options;

  const [format, formatOptions] = parseFormat(rawFormat);
  result.toFormat = [sharp.format[format], formatOptions];

  // Sizing
  if (typeof options.width === 'number' || typeof options.height === 'number') {
    result.resize = [
      typeof options.width === 'number' ? Math.round(options.width) : null,
      typeof options.height === 'number' ? Math.round(options.height) : null,
    ];
  }

  // Multiplicative scale
  if (typeof options.scale === 'number') {
    const scale = options.scale;
    const width =
      result.resize && typeof result.resize[0] === 'number'
        ? result.resize[0]
        : meta.width;
    const height =
      result.resize && typeof result.resize[1] === 'number'
        ? result.resize[1]
        : meta.height;
    result.resize = [Math.round(width * scale), Math.round(height * scale)];
  }

  // Mimic background-size
  switch (options.mode) {
    case 'cover':
      result.min = true;
      break;
    case 'contain':
      result.max = true;
      break;
    default:
      result.crop = sharp.gravity.center;
      break;
  }

  result.inline = !!options.inline;
  return result;
};

export default createSharpOptions;
