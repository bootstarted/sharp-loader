
var _ = require('lodash');
var sharp = require('sharp');
var loaderUtils = require('loader-utils');
var multiplex = require('option-multiplexer');
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
	}, image.clone());
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
 * Some presets may want to alter their behavior based on image metadata; this
 * function invokes any preset value which is a function and assigns the result
 * to a new generated preset.
 * @param {Object} preset Preset.
 * @param {Object} metadata Image metadata.
 * @returns {Object} New preset.
 */
function localize(metadata, preset) {
	var props = [ 'format' ];
	var initial = _.assign({ }, _.pick(metadata, props), preset);
	return _.mapValues(initial, function(value) {
		return _.isFunction(value) ? value(metadata) : value;
	});
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
		result.quality = options.quality;
	}

	// Sizing
	if (options.size) {
		var size = options.size;
		size = Array.isArray(size) ? size : [ size, size ];
		result.resize = size;
	} else if (options.width || options.height) {
		result.resize = [ options.width, options.height ];
	}

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
		result.blur = options.blur;
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

	return localQuery.presets.map(function(id) {
		var preset = globalQuery.presets[id];
		if (!preset) {
			throw new Error('No such preset: ' + id);
		}
		preset.preset = id;
		return preset;
	});
}



function emit(context) {
	var publicPath = context.options.output.publicPath || '/';
	var query = loaderUtils.parseQuery(context.query);

	function name(image, info, options) {
		var template = options.name;
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
		if (options.inline) {
			return {
				name: n,
				data: [
					'data:image/',
					info.format,
					';base64,',
					image.toString('base64')
				].join('')
			}
		} else {
			context.emitFile(n, image);
			return {
				path: publicPath + n
			};
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
					resolve(_.assign({
						preset: options.preset
					}, data(buffer, info, options), info))
				}
			})
		});
	}
}

module.exports = function(input) {
	this.cacheable();

	var localQuery = loaderUtils.parseQuery(this.resourceQuery);
	var globalQuery = loaderUtils.parseQuery(this.query);

	var single = false;
	var name = globalQuery.name || '[name].[hash:8].[ext]';
	var presets = localQuery.presets ?
		getPresets(localQuery, globalQuery) : [ localQuery ];

	var image = sharp(input);
	var meta = image.metadata();
	var callback = this.async();

	var assets = Promise.map(presets, Promise.resolve)
		.map(function(preset) {
			return meta.then(function(meta) {
				return localize(meta, preset);
			});
		})
		.reduce(function(presets, preset) {
			return presets.concat(multiplex(preset));
		}, [])
		.map(function(options) {
			return Promise.props({
				options: options,
				image: transform(image, normalize(options))
			});
		})
		.map(emit(this));

	Promise.all(assets).then(function(assets) {
		return 'module.exports = ' + JSON.stringify(assets) + ';';
	}).nodeify(callback);
};

// Force buffers.
module.exports.raw = true;
