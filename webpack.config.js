module.exports = {
  target: "webworker",
  entry: "./index.js",
  mode: "development",
  devtool: "cheap-module-source-map",
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  modules: false,
                  loose: true,
                  useBuiltIns: "usage",
                  debug: true,
                  corejs: 3,
                  targets: {
                    browsers: "last 1 Chrome versions"
                  },
                  exclude: [/web\.dom/, /generator|runtime/]
                }
              ]
            ],
            plugins: [
              "@babel/plugin-proposal-nullish-coalescing-operator",
              "@babel/plugin-proposal-optional-chaining"
            ],
            cacheDirectory: true
          }
        }
      }
    ]
  }
};
