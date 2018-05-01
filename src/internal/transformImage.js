// @flow
import createSharpOptions from './createSharpOptions';

import type {Image} from 'sharp';
import type {SharpOptions, ImageOptions} from '../types';

/**
 * Perform a sequence of transformations on an image.
 * @param {Object} image Initial sharp object.
 * @param {Object} meta Some metadata.
 * @param {Object} imageOptions Transformations to apply.
 * @returns {Object} Resulting sharp object.
 */
const transformImage = (
  image: Image,
  meta: *,
  imageOptions: ImageOptions,
): Image => {
  const sharpOptions: SharpOptions = createSharpOptions(imageOptions, meta);
  return ['blur', 'resize', 'max', 'min', 'crop', 'toFormat'].reduce(function(
    image,
    key,
  ) {
    if (key in sharpOptions) {
      let value = sharpOptions[key];
      value = Array.isArray(value) ? value : [value];
      // TODO: FIXME: Anything better for flow?
      // $ExpectError
      return image[key](...value);
    }
    return image;
  },
  image.clone());
};

export default transformImage;
