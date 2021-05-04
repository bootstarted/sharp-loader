import sharp from 'sharp';
import {ImageOptions} from '../types';
import {createSharpPipeline} from './createSharpPipeline';

/**
 * Perform a sequence of transformations on an image.
 * @param {Object} image Initial sharp object.
 * @param {Object} meta Some metadata.
 * @param {Object} imageOptions Transformations to apply.
 * @returns {Object} Resulting sharp object.
 */
const transformImage = (
  image: sharp.Sharp,
  meta: sharp.Metadata,
  imageOptions: ImageOptions,
): sharp.Sharp => {
  const pipeline = createSharpPipeline(imageOptions, meta);
  return pipeline.reduce((image, [key, args]) => {
    // TODO: FIXME: Make TypeScript happy.
    // @ts-expect-error
    return image[key](...args);
  }, image.clone());
};

export default transformImage;
