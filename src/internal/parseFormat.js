// @flow

import type {Format, FormatOptions} from '../types';

function parseFormat(rawFormat: Format): [string, FormatOptions] {
  if (typeof rawFormat === 'string') {
    return [rawFormat, {}];
  }

  const {
    id,
    // Support deprecated `id` property as alias for `format`
    format = (id: any), // flowlint-line unclear-type: off
    ...options
  } = rawFormat;

  return [format, options];
}

export default parseFormat;
