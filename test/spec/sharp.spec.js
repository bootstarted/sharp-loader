import vm from 'vm';
import _webpack from 'webpack';
import path from 'path';
import MemoryFileSystem from 'memory-fs';

const config = (query, entry = 'index.js', extra) => {
  return {
    entry: path.join(__dirname, '..', '..', 'example', entry),
    context: path.join(__dirname, '..', '..', 'example'),
    mode: 'development',
    output: {
      path: path.join(__dirname, 'dist'),
      publicPath: '/foo',
      filename: 'bundle.js',
      libraryTarget: 'commonjs2',
    },
    module: {
      rules: [
        {
          test: /\.(gif|jpe?g|png|svg|tiff)(\?.*)?$/,
          use: {
            loader: path.join(__dirname, '..', '..', 'src', 'sharp.ts'),
            query,
          },
        },
      ],
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
      expect(err).toBe(null);
      if (_stats.hasErrors()) {
        // eslint-disable-next-line
        console.log(_stats.toString());
        throw new Error('webpack error occured');
      }
      const stats = _stats.toJson();
      const files = {};
      let code = '';
      stats.assets.forEach((asset) => {
        files[asset.name] = compiler.outputFileSystem.readFileSync(
          path.join(configuration.output.path, asset.name),
        );
        if (asset.name === 'bundle.js') {
          code = files[asset.name].toString('utf8');
        }
      });
      const sandbox = vm.createContext({});
      sandbox.global = {};
      sandbox.module = {exports: {}};
      vm.runInContext(code, sandbox);

      resolve({stats, files, exports: sandbox.module.exports});
    });
  });
};

jest.setTimeout(25000);

describe('sharp', () => {
  it('should do things', () => {
    const query = {
      defaultOutputs: ['thumbnail', 'prefetch'],
      cache: false,
      presets: {
        thumbnail: {
          name: '[name]@[scale]x.[hash:8].[ext]',
          meta: (m) => {
            return {...m, scale: 3};
          },
          format: ['webp', 'png', {id: 'jpeg', quality: 60}],
          scale: [1, 2, 3],
        },
        prefetch: {
          name: '[name].[hash:8].[ext]',
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
    return webpack(query).then(({stats}) => {
      expect(stats).not.toBe(null);
      expect(stats.assets.length).toBe(29);
    });
  });
  it('should isomorphic 1', () => {
    const query = {
      emitFile: false,
      cache: false,
      presets: {
        thumbnail: {
          format: ['webp'],
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
    return Promise.all([
      webpack(query, 'simple.js'),
      webpack({emitFile: false, ...query}, 'simple.js'),
    ]).then(([{exports: withEmit}, {exports: withoutEmit}]) => {
      const aList = withEmit.a.map(({name}) => name).sort();
      const bList = withoutEmit.a.map(({name}) => name).sort();
      expect(aList).toEqual(bList);
    });
  });
  it('should do the cache', () => {
    const query = {
      defaultOutputs: ['thumbnail'],
      cacheDirectory: true,
      presets: {
        thumbnail: {
          format: ['webp'],
        },
      },
    };
    return webpack(query, 'simple.js').then(({stats}) => {
      expect(stats).not.toBe(null);
      return webpack(query, 'simple.js').then(({stats}) => {
        expect(stats).not.toBe(null);
        // TODO make this better.
      });
    });
  });
});
