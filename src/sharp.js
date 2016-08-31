import _ from 'lodash';
import sharp from 'sharp';
import loaderUtils from 'loader-utils';
import multiplex from 'option-multiplexer';
import mime from 'mime';

/**
 * Perform a sequence of transformations on an image.
 * @param {Object} image Initial sharp object.
 * @param {Object} options Transformations to apply.
 * @returns {Object} Resulting sharp object.
 */
const transform = (image, options = {}) => {
  return [
    'blur',
    'quality',
    'compressionLevel',
    'resize',
    'max',
    'min',
    'crop',
    'toFormat',
  ].reduce(function(image, key) {
    if (key in options) {
      let value = options[key];
      value = Array.isArray(value) ? value : [value];
      return image[key].apply(image, value);
    }
    return image;
  }, image.clone());
};

/**
 * Generate the appropriate extension for a `sharp` format.
 * @param  {String} type `sharp` type.
 * @returns {String} Extension.
 */
const extension = (type) => {
  return {
    webp: '.webp',
    jpeg: '.jpg',
    png: '.png',
  }[type];
};

/**
 * Take some configuration options and transform them into a format that
 * `transform` is capable of using.
 * @param {Object} options Generic configuration options.
 * @returns {Object} `transform` compatible options.
 */
const normalize = (options) => {
  const result = { };
  if (options.format) {
    result.toFormat = options.format;
  }
  if (options.quality) {
    result.quality = Number(options.quality);
  }

  // Sizing
  if (options.width || options.height) {
    result.resize = [options.width, options.height];
  }

  if (result.resize) {
    result.resize = result.resize.map(function(value) {
      return value ? Number(value) : null;
    });
  }

  // Multiplicative density
  if (options.density) {
    const density = Number(options.density);
    result.resize[0] *= density;
    result.resize[1] *= density;
  }

  // Mimic background-size
  switch (options.mode) {
  case 'cover':
    result.min = true;
    break;
  case 'contain':
    result.max = true;
    break;
  default:
    result.crop = sharp.gravity.center;
    break;
  }

  if (options.blur) {
    result.blur = Number(options.blur);
  }

  result.inline = !!options.inline;
  return result;
};

const emit = (context) => {
  const publicPath = context.options.output.publicPath || '/';
  const query = loaderUtils.parseQuery(context.query);
  const template = query.name;

  const name = (image, info) => {
    return loaderUtils.interpolateName({
      resourcePath: context.resourcePath
        .replace(/\.[^.]+$/, extension(info.format)),
    }, template, {
      context: query.context || context.options.context,
      content: image,
    });
  };

  const data = (image, info, options, preset) => {
    const n = name(image, info, options, preset);
    const format = mime.lookup(n);
    const extra = {format: format};
    if (preset) {
      extra.preset = preset;
    }
    if (options.inline) {
      return _.assign({
        name: n,
        url: [
          'data:',
          format,
          ';base64,',
          image.toString('base64'),
        ].join(''),
      }, options, info, extra);
    }
    context.emitFile(n, image);
    return _.assign({
      url: publicPath + n,
    }, options, info, extra);
  };

  return (result) => {
    const image = result.image;
    const options = result.options;
    const preset = result.preset;

    // We have to use the callback form in order to get access to the info
    // object unfortunately.
    return new Promise(function(resolve, reject) {
      image.toBuffer(function(err, buffer, info) {
        if (err) {
          reject(err);
        } else {
          resolve(data(buffer, info, options, preset));
        }
      });
    });
  };
};

const handle = (image, preset, name, presets, emit) => {
  const wahoo = (options) => {
    return emit({
      preset: name,
      options,
      image: transform(image, normalize(options)),
    });
  };
  if (name && !presets[name]) {
    return [Promise.reject(`No such preset: ${preset}`)];
  }
  const values = multiplex(_.assign({ }, presets[name] || {}, preset));
  return _.map(values, wahoo);
};

const lolol = (image, extra, presets, globals, emit) => {
  if (_.isArray(presets)) {
    return Promise.all(_.flatMap(presets, (name) => {
      return handle(image, extra, name, globals, emit);
    }));
  } else if (_.isObject(presets)) {
    return Promise.all(_.flatMap(_.toPairs(presets), ([name, preset]) => {
      return handle(image, _.assign({}, preset, extra), name, globals, emit);
    }));
  } else if (_.isString(presets)) {
    return Promise.all(handle(image, extra, presets, globals, emit));
  }
  throw new TypeError();
};

const shouldEmit = (a, b) => {
  const thing = {...a, ...b};
  return typeof thing.emit === 'undefined' || thing.emit;
};

/* eslint import/no-commonjs: 0 */
/* global module */
module.exports = function(input) {
  // This means that, for a given query string, the loader will only be
  // run once. No point in barfing out the same image over and over.
  this.cacheable();

  const localQuery = loaderUtils.parseQuery(this.resourceQuery);
  const globalQuery = loaderUtils.parseQuery(this.query);
  const extra = _.omit(localQuery, ['preset', 'presets', 'emit']);
  let assets;
  const image = sharp(input);
  const callback = this.async();
  const e = shouldEmit(globalQuery, localQuery) ?
    emit(this) : () => Promise.resolve();

  // We have three possible choices:
  // - set of presets in `presets`
  // - single preset in `preset`
  // - single value
  if (localQuery.presets) {
    assets = lolol(image, extra, localQuery.presets, globalQuery.presets, e);
  } else if (localQuery.preset) {
    assets = lolol(image, extra, localQuery.preset, globalQuery.presets, e);
  } else {
    assets = Promise.all(
      handle(image, localQuery, null, globalQuery.presets, e)
    );
  }

  assets.then(function(assets) {
    return `module.exports = ${JSON.stringify(assets)};`;
  }).then((result) => callback(null, result), callback);
};

// Force buffers since sharp doesn't want strings.
module.exports.raw = true;
