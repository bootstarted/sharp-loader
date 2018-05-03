// @flow
import cacache from 'cacache';

import type {Image, Meta} from 'sharp';
import type {GlobalOptions} from '../types';

const getImageMetadata = (
  image: Image,
  resourcePath: string,
  {cacheDir}: GlobalOptions,
): Promise<Meta> => {
  const cacheMetadataKey = `meta${resourcePath}`;
  const cachedMetadata =
    typeof cacheDir === 'string'
      ? cacache
          .get(cacheDir, cacheMetadataKey)
          .then(({data}) => JSON.parse(data.toString('utf8')))
          .catch(() => Promise.resolve(null))
      : Promise.resolve(null);

  return cachedMetadata.then((data) => {
    if (data) {
      return data;
    }
    return image.metadata().then((meta) => {
      if (typeof cacheDir === 'string') {
        return cacache
          .put(cacheDir, cacheMetadataKey, JSON.stringify(meta))
          .then(() => {
            return meta;
          });
      }
      return meta;
    });
  });
};

export default getImageMetadata;
