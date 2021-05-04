import {Cache} from './Cache';

import sharp from 'sharp';

export const getImageMetadata = async (
  image: sharp.Sharp,
  resourcePath: string,
  cache: Cache,
): Promise<sharp.Metadata> => {
  const cacheMetadataKey = ['meta', resourcePath];
  const cachedMetadata = await cache.readJson(cacheMetadataKey);
  if (cachedMetadata !== undefined) {
    return cachedMetadata as sharp.Metadata;
  }
  const meta = await image.metadata();
  await cache.writeJson(cacheMetadataKey, meta);
  return meta;
};
