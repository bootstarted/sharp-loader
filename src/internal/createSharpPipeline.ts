import sharp from 'sharp';

import type {ImageOptions, SharpPipeline} from '../types';

import {parseFormat} from './parseFormat';

/**
 * Take some configuration options and transform them into a format that
 * `transform` is capable of using.
 * @param {Object} options Generic configuration options.
 * @param {Object} meta Image metadata about original image from sharp.
 * @returns {Object} `transform` compatible options.
 */
export const createSharpPipeline = (
  options: ImageOptions,
  meta: sharp.Metadata,
): SharpPipeline => {
  const result: SharpPipeline = [];
  let resize: sharp.ResizeOptions | null = null;

  // Sizing
  if (typeof options.width === 'number' || typeof options.height === 'number') {
    resize = {
      width:
        typeof options.width === 'number'
          ? Math.round(options.width)
          : undefined,
      height:
        typeof options.height === 'number'
          ? Math.round(options.height)
          : undefined,
    };
  }

  // Multiplicative scale
  if (typeof options.scale === 'number') {
    if (typeof meta.width !== 'number' || typeof meta.height !== 'number') {
      throw new TypeError();
    }
    const scale = options.scale;
    const width =
      resize !== null && typeof resize.width === 'number'
        ? resize.width
        : meta.width;
    const height =
      resize !== null && typeof resize.height === 'number'
        ? resize.height
        : meta.height;
    resize = {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
    };
  }

  if (resize !== null) {
    // Mimic background-size
    switch (options.mode) {
      case 'cover':
        resize.fit = 'cover';
        break;
      case 'contain':
        resize.fit = 'contain';
        break;
      default:
        // FIXME: Implement this again.
        break;
    }
  }

  if (resize !== null) {
    result.push(['resize', [resize]]);
  }

  const {format: rawFormat = meta.format} = options;
  const [format, formatOptions] = parseFormat(rawFormat);
  result.push(['toFormat', [format, formatOptions]]);

  return result;
};
