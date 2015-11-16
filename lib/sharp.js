
var _ = require('lodash');
var sharp = require('sharp');
var loaderUtils = require('loader-utils');
var multiplex = require('option-multiplexer');
var mime = require('mime');
var Promise = require('bluebird');

/**
 * Perform a sequence of transformations on an image.
 * @param {Object} image Initial sharp object.
 * @param {Object} options Transformations to apply.
 * @returns {Object} Resulting sharp object.
 */
function transform(image, options) {
  options = options || { };
  return [
    'blur',
    'quality',
    'compressionLevel',
    'resize',
    'max',
    'min',
    'crop',
    'toFormat'
  ].reduce(function(image, key) {
    if (key in options) {
      var value = options[key];
      value = Array.isArray(value) ? value : [value];
      return image[key].apply(image, value);
    } else {
      return image;
    }
  }, image.clone().flatten());
}

/**
 * Generate the appropriate extension for a `sharp` format.
 * @param  {String} type `sharp` type.
 * @returns {String} Extension.
 */
function extension(type) {
  return {
    'webp': '.webp',
    'jpeg': '.jpg',
    'png': '.png'
  }[type];
}

/**
 * Take some configuration options and transform them into a format that
 * `transform` is capable of using.
 * @param {Object} options Generic configuration options.
 * @returns {Object} `transform` compatible options.
 */
function normalize(options) {
  var result = { };
  if (options.format) {
    result.toFormat = options.format;
  }
  if (options.quality) {
    result.quality = Number(options.quality);
  }

  // Sizing
  if (options.size) {
    var size = options.size;
    size = Array.isArray(size) ? size : [ size, size ];
    result.resize = size;
  } else if (options.width || options.height) {
    result.resize = [ options.width, options.height ];
  }

  if (result.resize) {
    result.resize = result.resize.map(function(value) {
      return Number(value);
    });
  }

  // Multiplicative density
  if (options.density) {
    var density = Number(options.density);
    result.resize[0] *= density;
    result.resize[1] *= density;
  }

  // Mimic background-size
  switch(options.mode) {
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
}

function getPresets(localQuery, globalQuery) {
  if (!globalQuery.presets) {
    throw new Error('No presets defined.');
  } else if (!localQuery.presets) {
    throw new Error('No presets selected.');
  }
  return _.pick(globalQuery.presets, localQuery.presets);
}



function emit(context) {
  var publicPath = context.options.output.publicPath || '/';
  var query = loaderUtils.parseQuery(context.query);
  var template = query.name;

  function name(image, info, options) {

    return loaderUtils.interpolateName({
      resourcePath: context.resourcePath
        .replace(/\.[^.]+$/, extension(info.format))
    }, template, {
      context: query.context || context.options.context,
      content: image
    });
  }

  function data(image, info, options) {
    var n = name(image, info, options);
    var format = mime.lookup(n);
    if (options.inline) {
      return _.assign({
        name: n,
        url: [
          'data:',
          format,
          ';base64,',
          image.toString('base64')
        ].join('')
      }, info, { format: format });
    } else {
      context.emitFile(n, image);
      return _.assign({
        url: publicPath + n
      }, info, { format: format });
    }
  }

  return function(result) {
    var image = result.image, options = result.options;

    // We have to use the callback form in order to get access to the info
    // object unfortunately.
    return new Promise(function(resolve, reject) {
      image.toBuffer(function(err, buffer, info) {
        if (err) {
          reject(err);
        } else {
          resolve(data(buffer, info, options));
        }
      })
    });
  }
}

function handle(image, preset, name, presets, emit) {
  function wahoo(options) {
    return Promise.props({
      options: options,
      image: transform(image, normalize(options))
    }).then(emit);
  }
  var values = multiplex(_.assign({ }, presets[name], preset));
  if (values.length > 1) {
    return Promise.map(values, wahoo);
  } else if (values.length === 1) {
    return wahoo(values[0]);
  }
  throw new TypeError();
}



function lolol(image, presets, globals, emit) {
  if (_.isArray(presets)) {
    return Promise.props(_.object(presets, presets.map(function (name) {
      return handle(image, null, name, globals, emit);
    })));
  } else if (_.isObject(presets)) {
    return Promise.props(_.mapValues(presets, function(preset, name) {
      return handle(image, preset, name, globals, emit);
    }))
  } else if (isString(presets)) {
    return handle(image, null, presets, globals, emit);
  }
  throw new TypeError();
}

module.exports = function(input) {
  // This means that, for a given query string, the loader will only be
  // run once. No point in barfing out the same image over and over.
  this.cacheable();

  var localQuery = loaderUtils.parseQuery(this.resourceQuery);
  var globalQuery = loaderUtils.parseQuery(this.query);
  var assets;
  var image = sharp(input);
  var meta = image.metadata();
  var callback = this.async();
  var e = emit(this);

  // We have three possible choices:
  // - set of presets in `presets`
  // - single preset in `preset`
  // - single value
  if (localQuery.presets) {
    assets = lolol(image, localQuery.presets, globalQuery.presets, e);
  } else if (localQuery.preset) {
    assets = lolol(image, localQuery.preset, globalQuery.presets, e);
  } else {
    assets = handle(image, localQuery, null, globalQuery.presets, e);
  }

  assets.then(function(assets) {
    return 'module.exports = ' + JSON.stringify(assets) + ';';
  }).nodeify(callback);
};

// Force buffers since sharp doesn't want strings.
module.exports.raw = true;
