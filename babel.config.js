module.exports = function (api, options) {
  api.cache(false);

  const presets = ["@babel/preset-typescript"];
  const plugins = ["./plugin/ts-internal"];

  return {
    presets,
    plugins
  };
};
