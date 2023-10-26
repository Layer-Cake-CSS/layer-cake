const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { LayerCakePlugin } = require("@layer-cake/webpack-plugin");

module.exports = {
  entry: path.join(__dirname, "./src/index.tsx"),
  mode: "development",
  resolve: {
    extensions: [".js", ".json", ".ts", ".tsx"],
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: "babel-loader",
            options: {
              babelrc: false,
              sourceType: "unambiguous",
              presets: [
                "@babel/preset-typescript",
                ["@babel/preset-react", { runtime: "automatic" }],
                [
                  "@babel/preset-env",
                  { targets: { node: 14 }, modules: false },
                ],
              ],
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "./index.html"),
    }),
    new MiniCssExtractPlugin(),
    new LayerCakePlugin(),
  ],
  stats: "minimal",
};