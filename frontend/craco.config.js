module.exports = {
    webpack: {
      configure: (webpackConfig) => {
        // Ignore source map warnings for react-datepicker
        webpackConfig.ignoreWarnings = [
          {
            module: /node_modules\/react-datepicker/,
          },
        ];
        return webpackConfig;
      },
    },
  };