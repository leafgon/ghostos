// pur ESM Node.js build configuration
import path from 'path';
import { fileURLToPath } from 'url';
import nodeExternals from 'webpack-node-externals';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  target: 'node', // Node.js build
  mode: 'production', // Production mode for optimizations
  devtool: 'source-map', // Generate source maps for debugging
  entry: './src/index.core.js', // Node-only entry point
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'index.core.js',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.js', '.ts'],
    alias: {
      '@ghostos/core': path.resolve(__dirname, 'src/index.core.js'), // Alias for core module
      'graphology-components': false,     // false makes require(...) return {}
      'quickjs-emscripten':   false,
    }
  },
  externals: [nodeExternals()], // Exclude node_modules
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: [
          /node_modules/,
          /leafui/, // skip browser/React components
          /\.d\.ts$/, // skip .d.ts files
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-typescript',
            ],
          },
        },
      },
    ],
  },
};
