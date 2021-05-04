import sharp from 'sharp';
import {Format, FormatOptions} from '../types';

export function parseFormat(
  rawFormat: Format | undefined,
): [keyof sharp.FormatEnum, FormatOptions] {
  if (rawFormat === undefined) {
    throw new TypeError('Unable to determine image format.');
  }
  if (typeof rawFormat === 'string') {
    return [rawFormat as keyof sharp.FormatEnum, {}];
  }

  const {
    id,
    // Support deprecated `id` property as alias for `format`
    format = id,
    ...options
  } = rawFormat;

  return [format as keyof sharp.FormatEnum, options];
}
