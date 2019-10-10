// @flow
import mime from 'mime';

import type {Meta} from 'sharp';
import type {GlobalOptions, ImageObject, ImageOptions} from '../types';

import createName from './createName';
import parseFormat from './parseFormat';
import serialize, {Serializable} from './serialize';

const createImageObject = (
  input: Buffer,
  image: ?Buffer,
  meta: $Supertype<Meta>,
  options: ImageOptions,
  globalOptions: GlobalOptions,
  loader: *,
): ImageObject => {
  const {format: rawFormat = meta.format, ...rest} = options;
  const [format, formatOptions] = parseFormat(rawFormat);

  const n = createName(input, meta, format, options, globalOptions, loader);
  const type = mime.getType(n);
  const result = {
    ...rest,
    format,
    formatOptions,
    width: meta.width,
    height: meta.height,
    type,
    name: n,
    url: null,
  };
  if (options.inline === true) {
    if (image) {
      result.url = ['data:', type, ';base64,', image.toString('base64')].join(
        '',
      );
    } else {
      throw new TypeError('Must provide `image` with `inline` on.');
    }
  } else {
    result.url = new Serializable(() => {
      return `__webpack_public_path__ + ${serialize(n)}`;
    });
  }
  if (typeof options.scale === 'number') {
    result.width /= options.scale;
    result.height /= options.scale;
  }
  return result;
};

export default createImageObject;
