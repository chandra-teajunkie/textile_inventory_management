const webpack = require('webpack');

module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: /node_modules\/react-datepicker/,
      },
    ],
  },
  ignoreWarnings: [/Failed to parse source map/],
};