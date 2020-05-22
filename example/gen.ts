import { Spec } from "swagger-schema-official";
import { pathPreferences, IPathPreference } from "../src/preference";
let swaggerSpec: Spec = require("./swagger-api.json");

import * as fs from "fs";
import * as path from "path";
import * as prettier from "prettier";
import { getPathChunks, grabPathname } from "../src/generator/util/string";
import { generateApiTreeCode, buildTree, checkPaths } from "../src/generator/main";

/** 平台的 API 包含 public API 和 internal API, 在 swagger 当中通过 tag 来区分 */
export let byPublicApi = (tags: string[]) => {
  if (tags == null || tags.length === 0) {
    return false;
  }
  let ns = tags[0].split(".")[0];
  return ns === "api";
};

export type FuncTagFilter = (tags: string[]) => boolean;

export let byInternalApi = (tags: string[]) => {
  if (tags == null || tags.length === 0) {
    return false;
  }
  let ns = tags[0].split(".")[0];
  return ns === "main";
};

// 检查代码是否正常

checkPaths(Object.keys(pathPreferences), Object.keys(swaggerSpec.paths));

// 基于路径分离出 chunks

let definedPaths = Object.keys(swaggerSpec.paths).slice().sort();

interface IPathInfo {
  original: string;
  chunks: string[];
}

let activePaths: IPathInfo[] = definedPaths
  .filter((urlPath) => {
    let ignored = pathPreferences[urlPath]?.ignored;
    return ignored == null || ignored === false;
  })
  .map((urlPath) => {
    return {
      original: urlPath,
      chunks: getPathChunks(urlPath),
    };
  });

interface IPathNode {
  chunk: string;
  original: string;
  children: IPathNode[];
}

let apiTree: IPathNode[] = buildTree(
  activePaths.filter((pathNode) => {
    let pathObject = swaggerSpec.paths[pathNode.original];
    return byPublicApi(pathObject.get?.tags) || byPublicApi(pathObject.post?.tags) || byPublicApi(pathObject.put?.tags) || byPublicApi(pathObject.delete?.tags);
  })
);
let internalApiTree: IPathNode[] = buildTree(
  activePaths.filter((pathNode) => {
    let pathObject = swaggerSpec.paths[pathNode.original];
    return (
      byInternalApi(pathObject.get?.tags) ||
      byInternalApi(pathObject.post?.tags) ||
      byInternalApi(pathObject.put?.tags) ||
      byInternalApi(pathObject.delete?.tags)
    );
  })
);

// 开始生成代码

let generatedCode = generateApiTreeCode(swaggerSpec, "genSeedApiTree", apiTree, byPublicApi);

// Format with Prettier
let prettierConfigs = JSON.parse(fs.readFileSync(path.join(process.env.PWD, ".prettierrc"), "utf8"));
prettierConfigs.parser = "typescript";

try {
  generatedCode = prettier.format(generatedCode, prettierConfigs);
} catch (error) {
  console.log(error);
  console.log("格式化没有成功, 使用原始代码");
}

let lineSeparator = `\n/** Generated by generator */\n`;
let publicFile = "example/generated-api-tree.ts";

// Read write file

let writeFile = (fileName: string, code: string) => {
  let previousCode = fs.readFileSync(fileName, "utf8");
  let staticPart = previousCode.split(lineSeparator)[0];
  fs.writeFileSync(fileName, `${staticPart}${lineSeparator}\n${code}`);
  console.log(`Wrote code to ${fileName}`);
};

writeFile(publicFile, generatedCode);
