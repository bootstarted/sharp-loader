
var path = require('path');

module.exports = {
  entry: './index.js',
  target: 'web',
  context: __dirname,
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
    chunkFilename: '[id].[chunkhash].js'
  },
  module: {
    loaders: [{
      test: /\.(gif|jpe?g|png|svg|tiff)(\?.*)?$/,
      loader: path.join(__dirname, '..'),
      query: {
        presets: {
          thumbnail: {
            name: '[name]@[density]x.[hash:8].[ext]',
            format: ['webp', 'png', {id: 'jpeg', quality: 60}],
            density: [1, 2, 3],
            quality: 60,
          },
          prefetch: {
            name: '[name]-preset.[hash:8].[ext]',
            format: {id: 'jpeg', quality: 30},
            mode: 'cover',
            blur: 100,
            inline: true,
            width: 50,
            height: 50,
          }
        }
      }
    }]
  }
};
