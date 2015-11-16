# sharp-loader

Use [sharp] to automatically generate image assets with [webpack].

## Usage

```sh
npm install --save sharp-loader sharp
```



Setup presets in your loader:

```javascript
{
	module: {
		loaders: [{
			test: /\.(gif|jpe?g|png|svg|tiff)(\?.*)?$/,
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

Use without presets generating a single image:

```javascript
const images = require('./aQHsOG6.jpg?width=500');
console.log(images.format); // 'image/jpeg'
console.log(images.url) // url to image
```


Use single preset generating multiple images:

```javascript
const images = require('./aQHsOG6.jpg?preset=thumbnail');
console.log(images.length); // 1
console.log(images[0].url) // url to image
```

Use multiple presets generating multiple images:

```javascript
const images = require('./aQHsOG6.jpg?presets[]=thumbnail&presets[]=prefetch');
console.log(Object.keys(images).length); // 2
console.log(images.prefetch.format) // image/jpeg
console.log(images.thumbnail.length) // 2
```

Altering preset behavior:

```javascript
const images = require('./aQHsOG6.jpg?{"presets": { "thumbnail": { "size": 400 } }}');
console.log(Object.keys(images).length); // 1
console.log(images.prefetch.format) // image/jpeg
console.log(images.thumbnail.length) // 2
```


[sharp]: https://github.com/lovell/sharp
[webpack]: https://github.com/webpack/webpack
