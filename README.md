# sharp-loader

Use [sharp] to automatically generate image assets with [webpack].

![build status](http://img.shields.io/travis/metalabdesign/sharp-loader/master.svg?style=flat)
![coverage](https://img.shields.io/codecov/c/github/metalabdesign/sharp-loader/master.svg?style=flat)
![license](http://img.shields.io/npm/l/sharp-loader.svg?style=flat)
![version](http://img.shields.io/npm/v/sharp-loader.svg?style=flat)
![downloads](http://img.shields.io/npm/dm/sharp-loader.svg?style=flat)

## Usage

IMPORTANT: You need to have vips installed for [sharp] to work. The sharp npm module may attempt to do this for you, it may not.

```sh
npm install --save sharp-loader sharp
```

NOTE: If your configuration generates a single image (that is no configuration properties are arrays) then the result will still be an array with a single image.

Setup presets in your loader:

```javascript
{
  module: {
    loaders: [
      {
        test: /\.(gif|jpe?g|png|svg|tiff)(\?.*)?$/,
        loader: 'sharp-loader',
        query: {
          name: '[name].[hash:8].[ext]',
          cacheDirectory: true,
          presets: {
            // Preset 1
            thumbnail: {
              format: ['webp', 'jpeg'],
              width: 200,
              quality: 60,
            },
            // Preset 2
            prefetch: {
              // Format-specific options can be specified like this:
              format: {id: 'jpeg', quality: 30},
              mode: 'cover',
              blur: 100,
              inline: true,
              size: 50,
            },
          },
        },
      },
    ];
  }
}
```

Use without presets generating a single image:

```javascript
const images = require('./aQHsOG6.jpg?{"outputs":[{"width": 500}]}');
console.log(images[0].format); // 'image/jpeg'
console.log(images[0].url); // url to image
```

Use single preset generating multiple images:

```javascript
const images = require('./aQHsOG6.jpg?{"outputs":["thumbnail"]}');
console.log(images[0].url); // url to first image
console.log(images[1].url); // url to second image
```

Use multiple presets generating multiple images:

```javascript
const images = require('./aQHsOG6.jpg?{"outputs":["thumbnail", "prefetch"]}');
console.log(images);
```

Modify the value in a preset:

```javascript
const images = require('./aQHsOG6.jpg?{"outputs":[{"preset": "thumbnail", "width": 600}]}');
console.log(images);
```

### Server-Side Rendering

You can disable emitting the image files with:

```js
{
  emitFile: false
}
```

### Complex Example

```js
{
  presets: {
    default: {
      name: (meta) => {
        // If a scaled image is given, include scale in output name
        if (meta.scale) {
          return '[name]@[scale]x.[hash:8].[ext]';
        }
        return '[name].[hash:8].[ext]';
      },
      format: (meta) => {
        // If the image is transparent, convert to webp and png,
        // otherwise just use jpg.
        if (meta.hasAlpha) {
          return ['webp', 'png'];
        }
        return ['webp', {format: 'jpeg', quality: 70}];
      },
      scale: (meta) => {
        // If the image has no intrinsic scaling just ignore it.
        if (!meta.scale) {
          return undefined;
        }
        // Downscale and provide 1x, 2x, 3x, 4x.
        return [1, 2, 3, 4].filter((x) => {
          return x <= meta.scale;
        });
      },
    },
    preview: {
      name: '[name]-preview.[hash:8].[ext]',
      format: (meta) => {
        if (meta.hasAlpha) {
          return 'png';
        }
        return {format: 'jpeg', quality: 40};
      },
      blur: 100,
      inline: true,
      scale: ({width, height}) => {
        // Make a really tiny image.
        return Math.min(50 / width, 50 / height);
      },
    },
  },
}
```

[sharp]: https://github.com/lovell/sharp
[webpack]: https://github.com/webpack/webpack
