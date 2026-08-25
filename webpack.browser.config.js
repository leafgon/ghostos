// pur ESM Node.js build configuration
import path from "path";
import { fileURLToPath } from "url";
import webpack from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import TerserPlugin from "terser-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = true; //process.env.NODE_ENV === 'production';

export default {
  target: "web", // browser build
  mode: isProd ? "production" : "development",
  devtool: isProd ? "source-map" : "eval-cheap-module-source-map",

  entry: {
    index: path.resolve(__dirname, "src/index.browser.js"), // Web-only entry point
  },

  output: {
    path: path.resolve(__dirname, "lib"),
    filename: "[name].esm.js", // [name] expands to  index.esm.js
    chunkFilename: "[name].[contenthash].esm.js", // for dynamically loaded chunks
    clean: true, // clean the output directory before emit
    //publicPath: './',
    publicPath: "auto",
    library: {
      type: "module", // This is required for ESM output
    },
    environment: {
      module: true, // This is required for ESM output
      dynamicImport: true,
    },
    globalObject: "globalThis", // global compatible both in browsers and node
    wasmLoading: false,
  },
  experiments: {
    outputModule: true,
  },
  // IMPORTANT: for libraries, disable chunking and splitting to create a single bundle file
  optimization: {
    runtimeChunk: false, // disable runtime chunk
    splitChunks: false, // disable chunking
    minimize: isProd,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: false,
          },
          mangle: true,
          output: {
            comments: false, // remove comments
          },
        },
      }),
    ],
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    alias: {
      "@ghostos/core": path.resolve(__dirname, "src/index.core.js"), // Alias for core module
    },
    fallback: {
      // false makes require(...) return {}
      assert: false,
      path: false,
      process: false,
    },
    // Ensure proper module resolution
    //mainFields: ['module', 'main'],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: [/node_modules/],
        include: [path.resolve(__dirname, "src")],
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: "defaults",
                  modules: false, // Keep ES modules for tree shaking
                  shippedProposals: true, // Enable all shipped proposals
                  bugfixes: true, // Enable bug fixes
                },
              ],
              [
                "@babel/preset-typescript",
                {
                  allowDeclareFields: true,
                  onlyRemoveTypeImports: true, // Keep type imports for tree shaking
                },
              ],
              ["@babel/preset-react", { runtime: "automatic" }],
            ],
            plugins: [
              ["@babel/plugin-transform-class-properties", { loose: true }],
              ["@babel/plugin-transform-private-methods", { loose: true }],
              ["@babel/plugin-transform-private-property-in-object", { loose: true }],
            ],
          },
        },
      },
      // For *.css
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      // For *.scss (optional, remove if not using SCSS)
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
      {
        test: /\.(png|jpe?g|gif|svg|webp|wasm|mp3|ogg|wav)$/i,
        type: "asset",
        //parser: { dataUrlCondition: { maxSize: 8 * 1024 } }, // 8 KB inline threshold
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "[name].css", // [name] expands to index.css
      chunkFilename: "[name].[contenthash].css", // for dynamically loaded chunks
    }),
    // Define environment variables for the bundle
    //new webpack.DefinePlugin({
    //  'process.env.NODE_ENV': JSON.stringify('production'),
    //  // Add other environment variables your app needs
    //}),
    new webpack.DefinePlugin({
      "process.env.LEAFGON_ENDPOINT_SUBS": JSON.stringify("https://www.leafgon.com/sgraphql"),
      "process.env.LEAFGON_ENDPOINT_QM": JSON.stringify("https://www.leafgon.com/qmgraphql"),
      "process.env.LEAFGON_WEBSOCKET_SUBS": JSON.stringify("wss://www.leafgon.com/sgraphql"),
      "process.env.LEAFGON_WHOAMI": JSON.stringify(
        "https://www.leafgon.com/auth/public/sessions/whoami",
      ),
      "process.env.LEAFGON_KRATOS_LOGIN_URI": JSON.stringify(
        "https://www.leafgon.com/auth/public/self-service/login/browser",
      ),
      "process.env.LEAFGON_KRATOS_LOGIN_PATH": JSON.stringify(
        "/auth/public/self-service/login/browser",
      ),
      "process.env.LEAFGON_WHOAMI_URI": JSON.stringify(
        "https://www.leafgon.com/auth/public/sessions/whoami",
      ),
      "process.env.LEAFGON_WHOAMI_API_URI": JSON.stringify("https://www.leafgon.com/api/whoami"),
      "process.env.LEAFGON_PERMCHECK_API_URI": JSON.stringify(
        "https://www.leafgon.com/api/permissions/check",
      ),
      "process.env.LEAFGON_URL": JSON.stringify("https://www.leafgon.com"),
      "process.env.LEAFGON_PROD_URL": JSON.stringify("https://www.leafgon.com"),
      "process.env.LEAFGON_ENV_TYPE": JSON.stringify("production"),
      "process.env.NODE_ENV": JSON.stringify("production"),
      // Replace any other process.env variables your code uses
    }),
  ],

  externals: {
    // Don't bundle React if it's a peer dependency
    react: "react",
    "react-dom": "react-dom",
  },

  devServer: {
    static: { directory: path.resolve(__dirname, "public") },
    historyApiFallback: true,
    hot: true,
    port: 3000,
    open: true,
  },
};
