// @flow

import type {Format, FormatOptions} from '../types';

function parseFormat(format: Format): [string, FormatOptions] {
  if (typeof format === 'string') {
    return [format, {}];
  }

  const {id, ...options} = format;
  return [(id: string), options];
}

export default parseFormat;
