import sharp from 'sharp';
import loaderUtils from 'loader-utils';
import * as webpack from 'webpack';
import * as R from 'runtypes';

import createImageObject from './internal/createImageObject';
import transformImage from './internal/transformImage';
import {getImageMetadata} from './internal/getImageMetadata';
import {Cache} from './internal/Cache';

import {OutputOptions, ImageOptions, ImageObject} from './types';
import {createImageOptions} from './internal/createImageOptions';
import {toArray} from './internal/toArray';

const doTransform = async (
  image: sharp.Sharp,
  meta: sharp.Metadata,
  imageOptions: ImageOptions,
  loader: webpack.loader.LoaderContext,
  cache: Cache,
): Promise<{data: Buffer; info: sharp.OutputInfo}> => {
  const metaCacheKey = ['meta', loader.resourcePath, imageOptions];
  const bufferCacheKey = ['data', loader.resourcePath, imageOptions];
  const [cachedData, cachedInfo] = await Promise.all([
    cache.readBuffer(bufferCacheKey),
    cache.readJson(metaCacheKey),
  ]);
  if (cachedData !== undefined && cachedInfo !== undefined) {
    return {data: cachedData, info: cachedInfo as sharp.OutputInfo};
  }
  const result = await transformImage(image, meta, imageOptions).toBuffer({
    resolveWithObject: true,
  });
  await cache.writeBuffer(bufferCacheKey, result.data);
  await cache.writeJson(metaCacheKey, result.info);
  return result;
};

interface Result {
  asset: ImageObject;
  data: Buffer;
  info: sharp.OutputInfo;
}

const processImage = async (
  input: Buffer,
  image: sharp.Sharp,
  meta: sharp.Metadata,
  imageOptions: ImageOptions,
  context: string,
  loader: webpack.loader.LoaderContext,
  cache: Cache,
): Promise<Result> => {
  const {data, info} = await doTransform(
    image,
    meta,
    imageOptions,
    loader,
    cache,
  );
  const asset = createImageObject(input, info, imageOptions, context, loader);
  return {asset, data, info};
};

const getDataUrl = (result: Result): string => {
  if (!Buffer.isBuffer(result.data)) {
    throw new TypeError('Must provide `image` with `inline` on.');
  }
  if (typeof result.asset.type !== 'string') {
    throw new TypeError('Unable to determine image type.');
  }
  return JSON.stringify(
    `data:${result.asset.type};base64,${result.data.toString('base64')}`,
  );
};

const Preset = R.Partial({});

const GlobalQuery = R.Partial({
  cacheDirectory: R.Union(R.String, R.Boolean),
  context: R.String,
  defaultOutputs: R.Array(R.String),
  presets: R.Dictionary(Preset),
  emitFile: R.Boolean,
  name: R.String,
  meta: R.Function,
});

const LocalQuery = R.Partial({
  outputs: R.Array(R.Union(R.String, R.Partial({}))),
});

const runLoader = async function (
  loaderContext: webpack.loader.LoaderContext,
  input: Buffer,
): Promise<string> {
  const globalQuery = GlobalQuery.check(loaderUtils.getOptions(loaderContext));
  const localQuery = LocalQuery.check(
    typeof loaderContext.resourceQuery === 'string' &&
      loaderContext.resourceQuery.length > 0
      ? loaderUtils.parseQuery(loaderContext.resourceQuery)
      : {},
  );

  const image: sharp.Sharp = sharp(input);

  const context = globalQuery.context ?? loaderContext.rootContext;

  const cache = new Cache({cacheDir: globalQuery.cacheDirectory});

  const meta = await getImageMetadata(image, loaderContext.resourcePath, cache);
  const scaleMatch = /@([0-9]+)x/.exec(loaderContext.resourcePath);
  const nextMeta: {
    scale?: number;
  } & typeof meta = {...meta};
  if (scaleMatch !== null) {
    nextMeta.scale = parseInt(scaleMatch[1], 10);
    if (
      typeof nextMeta.width !== 'number' ||
      typeof nextMeta.height !== 'number'
    ) {
      throw new TypeError();
    }
    nextMeta.width /= nextMeta.scale;
    nextMeta.height /= nextMeta.scale;
  }
  const presetNames = Object.keys(globalQuery.presets ?? {});
  const defaultOutputs = toArray(globalQuery.defaultOutputs, presetNames);
  const outputs = toArray<string | OutputOptions>(
    localQuery.outputs,
    defaultOutputs,
  );

  const requirePreset = (name: string): null | any => {
    if (globalQuery.presets !== undefined && name in globalQuery.presets) {
      return {
        name: globalQuery.name,
        meta: globalQuery.meta,
        ...globalQuery.presets[name],
        preset: name,
      };
    }
    return null;
  };

  const optionsList: ImageOptions[] = outputs.reduce(
    (prev: ImageOptions[], output: string | OutputOptions): ImageOptions[] => {
      if (typeof output === 'string') {
        const preset = requirePreset(output);
        if (preset !== null) {
          return [...prev, ...createImageOptions(nextMeta, preset)];
        }
        return prev;
      } else if (typeof output === 'object') {
        const preset =
          typeof output.preset === 'string'
            ? requirePreset(output.preset)
            : null;
        return [
          ...prev,
          ...createImageOptions(nextMeta, {
            ...preset,
            ...output,
          }),
        ];
      }
      return prev;
    },
    [],
  );
  const results = await Promise.all(
    optionsList.map(
      async (imageOptions): Promise<Result> => {
        return await processImage(
          input,
          image,
          nextMeta,
          imageOptions,
          context,
          loaderContext,
          cache,
        );
      },
    ),
  );
  return [
    `var assets = ${JSON.stringify(results.map(({asset}) => asset))};`,
    ...optionsList.map((options, i) => {
      if (options.inline !== true && globalQuery.emitFile !== false) {
        loaderContext.emitFile(results[i].asset.name, results[i].data, null);
      }
      return (
        `assets[${i}].url = ` +
        (options.inline === true
          ? `${getDataUrl(results[i])};`
          : `__webpack_public_path__ + assets[${i}].name;`)
      );
    }),
    'module.exports = assets;',
  ].join('\n');
};

module.exports = function (this: webpack.loader.LoaderContext, input: Buffer) {
  // This means that, for a given query string, the loader will only be
  // run once. No point in barfing out the same image over and over.
  this.cacheable();
  const callback = this.async();
  if (typeof callback !== 'function') {
    throw new TypeError();
  }
  runLoader(this, input).then((code) => callback(null, code), callback);
};
// Force buffers since sharp doesn't want strings.
module.exports.raw = true;
