# sharp-loader

Use [sharp] to automatically generate image assets with [webpack].

## Usage

Setup presets in your loader:

```javascript
{
	module: {
		loaders: [{
			test: /\.(gif|jpe?g|png|tiff)(\?.*)?$/,
			loader: 'sharp-loader',
			query: {
				name: '[name].[hash:8].[ext]',
				presets: {
					// Preset 1
					thumbnail: {
						format: [ 'webp', 'png', 'jpeg' ],
						density: [ 1, 2, 3 ],
						size: 200,
						quality: 60
					},
					// Preset 2
					prefetch: {
						format: 'jpeg',
						mode: 'cover',
						blur: 100,
						quality: 30,
						inline: true,
						size: 50
					}
				}
			}
		}]
	}
};

```

Use those presets in your code:

```javascript
const images = require('./aQHsOG6.jpg?presets[]=thumbnail&presets[]=prefetch');
console.log(images.length); // 10
console.log(images[0].format) // webp
console.log(images[0].url) // url to image
```

[sharp]: https://github.com/lovell/sharp
[webpack]: https://github.com/webpack/webpack
