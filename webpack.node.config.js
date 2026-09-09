// pur ESM Node.js build configuration
import path from "path";
import { fileURLToPath } from "url";
import nodeExternals from "webpack-node-externals";
import TerserPlugin from "terser-webpack-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mode = process.env.NODE_ENV === "development" ? "development" : "production";
const isProd = mode === "production";
const keepConsole = process.env.KEEP_CONSOLE === "true";

export default {
  target: "node", // Node.js build
  mode,
  devtool: isProd ? "hidden-source-map" : "eval-cheap-module-source-map",
  entry: "./src/index.core.js", // Node-only entry point
  output: {
    path: path.resolve(__dirname, "lib"),
    filename: "index.core.js",
    libraryTarget: "commonjs2",
  },
  resolve: {
    extensions: [".js", ".ts"],
    alias: {
      "@ghostos/core": path.resolve(__dirname, "src/index.core.js"), // Alias for core module
      "graphology-components": false, // false makes require(...) return {}
      "quickjs-emscripten": false,
    },
  },
  // Resolve externals from package.json rather than local node_modules lookup.
  // This keeps node bundling behavior consistent in git worktrees where
  // dependencies may be hoisted in an ancestor directory.
  externals: [
    nodeExternals({
      modulesFromFile: true,
    }),
  ],
  optimization: {
    minimize: isProd,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          compress: {
            drop_console: isProd && !keepConsole,
            drop_debugger: isProd,
            passes: 2,
          },
          mangle: true,
          output: {
            comments: false,
          },
        },
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)$/,
        exclude: [
          /node_modules/,
          /\.d\.ts$/, // skip .d.ts files
        ],
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-typescript"],
          },
        },
      },
    ],
  },
};
