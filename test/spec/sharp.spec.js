import _webpack from 'webpack';
import path from 'path';
import MemoryFileSystem from 'memory-fs';
import {expect} from 'chai';

const query = {
  name: '[name].[hash:8].[ext]',
  presets: {
    thumbnail: {
      format: ['webp', 'png', 'jpeg'],
      density: [1, 2, 3],
      width: 200,
      height: 200,
      quality: 60,
    },
    prefetch: {
      format: 'jpeg',
      mode: 'cover',
      blur: 100,
      quality: 30,
      inline: true,
      width: 50,
      height: 50,
    },
  },
};

const config = (query, entry = 'index.js', extra) => {
  return {
    entry: path.join(__dirname, '..', '..', 'example', entry),
    context: path.join(__dirname, '..', '..', 'example'),
    output: {
      path: path.join(__dirname, 'dist'),
      publicPath: '/foo',
      filename: 'bundle.js',
    },
    module: {
      loaders: [{
        test: /\.(gif|jpe?g|png|svg|tiff)(\?.*)?$/,
        loader: path.join(__dirname, '..', '..', 'src', 'sharp.js'),
        query,
      }],
    },
    ...extra,
  };
};

const webpack = (options, inst, extra) => {
  const configuration = config(options, inst, extra);
  const compiler = _webpack(configuration);
  compiler.outputFileSystem = new MemoryFileSystem();
  return new Promise((resolve) => {
    compiler.run((err, _stats) => {
      expect(err).to.be.null;
      const stats = _stats.toJson();
      const files = {};
      stats.assets.forEach((asset) => {
        files[asset.name] = compiler.outputFileSystem.readFileSync(
          path.join(configuration.output.path, asset.name)
        );
      });
      resolve({stats, files});
    });
  });
};

describe('sharp', () => {
  it('should do things', () => (
    webpack(query).then(({stats}) => {
      expect(stats).to.not.be.null;
      expect(stats).to.have.property('assets')
        .to.have.length(29);
    })
  ));
});
