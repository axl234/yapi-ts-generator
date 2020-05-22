import { Spec } from "swagger-schema-official";
import { pathPreferences, IPathPreference } from "../preference";
import { uniq, groupBy, toPairs, difference } from "lodash";

import { generateApiFunctions } from "./ajax-code";
import { getCodeOfAllInterfaces, clearInterfacesList } from "./interface-collector";

/** 平台的 API 包含 public API 和 internal API, 在 swagger 当中通过 tag 来区分 */

export type FuncTagFilter = (tags: string[]) => boolean;

// 检查代码是否正常

export let checkPaths = (apiPaths: string[], definedPaths: string[]) => {
  definedPaths.forEach((p) => {
    if (p.includes("/:")) {
      console.warn("Suspicious path with colon in variables:", p);
    }
  });
  let deltaPaths = difference(apiPaths, definedPaths);
  if (deltaPaths.length > 0) {
    console.warn("[WARN] Paths in preference not used:", deltaPaths);
  }
  deltaPaths = difference(definedPaths, apiPaths);
  if (deltaPaths.length > 0) {
    console.warn("[WARN] New paths not configured:", deltaPaths);
  }
};

// 基于路径分离出 chunks

export interface IPathInfo {
  original: string;
  chunks: string[];
}

// 基于 chunks 创建属性结构

export let buildTree = (rules: IPathInfo[]): IPathNode[] => {
  rules.forEach((rule) => {
    if (rule.chunks.length === 0) {
      console.error("Invalid rule with chunk length 0:", rule);
    }
  });

  let groupedRules = groupBy(rules, (rule) => rule.chunks[0]);

  return toPairs(groupedRules).map(([chunk, children]) => {
    let loweredChildren = children.map((child) => {
      return { ...child, chunks: child.chunks.slice(1) };
    });

    let theRule = loweredChildren.find((x) => x.chunks.length === 0);
    let childRules = loweredChildren.filter((x) => x.chunks.length > 0);
    return {
      chunk,
      original: theRule?.original || null,
      children: childRules.length > 0 ? buildTree(childRules) : undefined,
    };
  });
};

interface IPathNode {
  chunk: string;
  original: string;
  children: IPathNode[];
}

// 开始生成代码

export let generateCodeOfChildren = (swaggerSpec: Spec, pathNodes: IPathNode[], tagFilter: FuncTagFilter) => {
  if (pathNodes == null || pathNodes.length === 0) {
    return "";
  }
  return pathNodes
    .map((node) => {
      let apiCode = "";
      let preference = pathPreferences[node.original];
      if (node.original != null) {
        apiCode = generateApiFunctions(node.original, swaggerSpec.paths[node.original], tagFilter);
      }

      return `
    ${node.chunk}: {
      ${apiCode}
      ${generateCodeOfChildren(swaggerSpec, node.children, tagFilter)}
    },
    `.trim();
    })
    .join("\n");
};

export let generateApiTreeCode = (swaggerSpec: Spec, name: string, pathNodes: IPathNode[], tagFilter: FuncTagFilter) => {
  clearInterfacesList();
  let body = generateCodeOfChildren(swaggerSpec, pathNodes, tagFilter);
  return `
  export let ${name} = {
    ${body}
  }

  ${getCodeOfAllInterfaces()}

  `.trim();
};