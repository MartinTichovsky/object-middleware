#!/usr/bin/env node

const { spawnSync } = require("child_process");
const path = require("path");
const args = process.argv.slice(2);

if (!args.length) {
  console.error("Missing argument for tsconfig");
}

const deepMerge = (target, source) => {
  const result = { ...target, ...source };
  for (let key in target) {
    if (
      key in source &&
      typeof target[key] === "object" &&
      typeof source[key] === "object" &&
      !(Array.isArray(target[key]) || Array.isArray(source[key]))
    ) {
      result[key] = deepMerge(target[key], source[key]);
    }
  }
  return result;
};

const loadAndMergeConfig = (fileName) => {
  const tsconfig = require(path.resolve(__dirname, fileName));
  return tsconfig.extends
    ? deepMerge(loadAndMergeConfig(tsconfig.extends), tsconfig)
    : tsconfig;
};

const checkRequiredProperties = (tsconfigPath, tsconfig) => {
  let errors = [];
  if (!tsconfig.include) {
    errors.push(
      `Missing input directory 'include' in config '${tsconfigPath}'`
    );
  }
  if (!tsconfig.compilerOptions.outDir) {
    errors.push(
      `Missing output directory 'compilerOptions.outDir' in config '${tsconfigPath}'`
    );
  }
  if (errors.length) {
    errors.forEach((error) => console.error(error));
  }
  return errors.length === 0;
};

const build = (tsconfigPath) => {
  const tsconfig = loadAndMergeConfig(tsconfigPath);
  if (checkRequiredProperties(tsconfigPath, tsconfig)) {
    spawnSync(
      "babel",
      [
        ...tsconfig.include,
        "--out-dir",
        tsconfig.compilerOptions.outDir,
        "--extensions",
        ".ts,.tsx",
        ...(tsconfig.exclude ? ["--ignore", tsconfig.exclude.join(",")] : []),
        ...(tsconfig.compilerOptions.target.toLowerCase() === "es5"
          ? ["--presets", "@babel/preset-env"]
          : [])
      ],
      { stdio: "inherit" }
    );
    spawnSync(
      "tsc",
      ["--declaration", "--emitDeclarationOnly", "--project", tsconfigPath],
      {
        stdio: "inherit"
      }
    );
  }
};

args.forEach((tsconfigPath) => build(tsconfigPath));
