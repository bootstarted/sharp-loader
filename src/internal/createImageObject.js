// @flow
import createName from './createName';
import mime from 'mime';
import serialize, {Serializable} from './serialize';

import type {Meta} from 'sharp';
import type {GlobalOptions, ImageObject, ImageOptions} from '../types';

const createImageObject = (
  input: Buffer,
  image: ?Buffer,
  info: $Supertype<Meta>,
  options: ImageOptions,
  globalOptions: GlobalOptions,
  loader: *,
): ImageObject => {
  const n = createName(input, info, options, globalOptions, loader);
  const type = mime.getType(n);
  const result = {
    ...options,
    width: info.width,
    height: info.height,
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
