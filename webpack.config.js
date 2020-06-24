const path = require('path');
const nodeExternals = require('webpack-node-externals');
var glob = require('glob');

const entries = {};
glob.sync('./api/**/*.ts').map((path) => {
  path = path.replace('.ts', '');
  const key = path.replace('./api/', '');
  entries[key] = path;
});

module.exports = {
  context: __dirname,
  entry: entries,
  devtool: 'source-map',
  resolve: {
    extensions: ['.json', '.ts'],
    symlinks: false,
    cacheWithContext: false,
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
    sourceMapFilename: '[name].js.map',
  },
  target: 'node',
  externals: [nodeExternals()],
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      {
        test: /\.(tsx?)$/,
        loader: 'ts-loader',
        exclude: [
          [
            path.resolve(__dirname, 'node_modules'),
            path.resolve(__dirname, '.serverless'),
            path.resolve(__dirname, '.webpack'),
          ],
        ],
        options: {
          transpileOnly: true,
          experimentalWatchApi: true,
        },
      },
    ],
  },
};
