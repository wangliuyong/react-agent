"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const fs = require("fs");
const path = require("path");
const index = require("../index.js");
require("electron");
require("@langchain/core/messages");
require("@langchain/langgraph");
require("child_process");
require("util");
require("crypto");
require("@langchain/openai");
require("node:async_hooks");
require("@langchain/core/callbacks/base");
require("@langchain/core/tools");
require("playwright");
require("stream/promises");
require("stream");
require("module");
require("langchain");
require("url");
function queryRemotionTemplateSkillDir(skillId) {
  const id = String(skillId ?? "").trim();
  if (!id) return null;
  const candidates = [
    path.join(index.querySkillsDir(), id),
    path.join(index.queryBundledResourcesRoot(), "skills", id)
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, "SKILL.md"))) return dir;
  }
  return null;
}
function queryLoadManifest(templateRoot) {
  const path$1 = path.join(templateRoot, "manifest.json");
  if (!fs.existsSync(path$1)) {
    throw new Error(`模版缺少 manifest.json：${path$1}`);
  }
  const raw = JSON.parse(fs.readFileSync(path$1, "utf-8"));
  if (!Array.isArray(raw.compositions) || raw.compositions.length === 0) {
    throw new Error("manifest.json 未声明 compositions");
  }
  return raw;
}
function postCopyTemplateIntoProject(templateRoot, projectSrc) {
  fs.mkdirSync(projectSrc, { recursive: true });
  const entries = fs.readdirSync(templateRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "manifest.json") continue;
    const from = path.join(templateRoot, entry.name);
    const to = path.join(projectSrc, entry.name);
    fs.cpSync(from, to, { recursive: true });
  }
}
function queryBuildRootSourceFromManifest(manifest, focus) {
  const focusComp = manifest.compositions.find((c) => c.id === focus.compositionId) ?? manifest.compositions[0];
  if (!focusComp) {
    throw new Error("manifest 未声明任何 Composition");
  }
  const importLines = [
    `import type { ComponentType } from 'react'`,
    `import { Composition } from 'remotion'`,
    `import { ${focusComp.componentExport} } from '${focusComp.componentPath}'`
  ];
  if (focusComp.defaultPropsPath && focusComp.defaultPropsExport) {
    importLines.push(
      `import { ${focusComp.defaultPropsExport} } from '${focusComp.defaultPropsPath}'`
    );
  }
  const castName = `${focusComp.componentExport}ForComposition`;
  const defaultProps = focusComp.defaultPropsExport != null ? `
        defaultProps={${focusComp.defaultPropsExport} as unknown as Record<string, unknown>}` : "";
  return `${importLines.join("\n")}

const ${castName} = ${focusComp.componentExport} as unknown as ComponentType<Record<string, unknown>>

/**
 * Remotion 根入口：仅当前焦点 Composition（由 remotion_apply_template_skill 生成）。
 */
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="${focusComp.id}"
        component={${castName}}
        durationInFrames={${focus.durationInFrames}}
        fps={${focus.fps}}
        width={${focus.width}}
        height={${focus.height}}${defaultProps}
      />
    </>
  )
}
`;
}
function postWriteHotNewsDefaultProps(filePath, props) {
  const propsJson = JSON.stringify(props, null, 2);
  const content = `import type { HotNewsProps } from './types'

/** 由 remotion_apply_template_skill 写入的热点 props（横竖版共用同一文案） */
export const HOT_NEWS_WIDE_DEFAULT_PROPS: HotNewsProps = ${propsJson}

export const HOT_NEWS_VERTICAL_DEFAULT_PROPS: HotNewsProps = ${propsJson}
`;
  fs.mkdirSync(path.join(filePath, ".."), { recursive: true });
  fs.writeFileSync(filePath, content, "utf-8");
}
async function postApplyRemotionTemplateSkill(input) {
  const skillId = String(input.skillId ?? "").trim();
  const sessionId = String(input.sessionId ?? "").trim();
  if (!skillId || !sessionId) {
    return { ok: false, message: "skillId 与 sessionId 不能为空" };
  }
  const skillDir = queryRemotionTemplateSkillDir(skillId);
  if (!skillDir) {
    return { ok: false, message: `找不到技能：${skillId}` };
  }
  const templateRoot = path.join(skillDir, "template");
  if (!fs.existsSync(path.join(templateRoot, "manifest.json"))) {
    return { ok: false, message: `技能未包含可拼装模版：${skillId}/template/manifest.json` };
  }
  let manifest;
  try {
    manifest = queryLoadManifest(templateRoot);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : String(err) };
  }
  const requestedId = String(input.compositionId ?? "").trim();
  const focusComp = manifest.compositions.find((c) => c.id === requestedId) ?? manifest.compositions[0];
  const compositionId = focusComp.id;
  const width = input.width ?? focusComp.width;
  const height = input.height ?? focusComp.height;
  const fps = input.fps ?? focusComp.fps;
  const durationInFrames = input.durationInFrames ?? focusComp.durationInFrames;
  const init = index.postInitRemotionProject(sessionId, {
    compositionId,
    width,
    height,
    fps,
    durationInFrames
  });
  const projectDir = init.projectDir;
  const projectSrc = path.join(projectDir, "src");
  try {
    postCopyTemplateIntoProject(templateRoot, projectSrc);
    if (input.props && manifest.propsFile) {
      const propsPath = path.join(projectSrc, manifest.propsFile);
      if (manifest.propsKind === "hot-news") {
        postWriteHotNewsDefaultProps(propsPath, input.props);
      } else {
        fs.writeFileSync(
          propsPath,
          `export default ${JSON.stringify(input.props, null, 2)}
`,
          "utf-8"
        );
      }
    }
    const rootSource = queryBuildRootSourceFromManifest(manifest, {
      compositionId,
      width,
      height,
      fps,
      durationInFrames
    });
    fs.writeFileSync(path.join(projectSrc, "Root.tsx"), rootSource, "utf-8");
  } catch (err) {
    return {
      ok: false,
      message: `拼装模版失败：${err instanceof Error ? err.message : String(err)}`
    };
  }
  const openStudio = input.openStudio !== false;
  let studioUrl;
  if (openStudio) {
    const studio = await index.postStartRemotionStudio({
      sessionId,
      projectDir,
      openBrowser: true
    });
    if (studio.ok && studio.url) {
      studioUrl = studio.url;
    }
  }
  return {
    ok: true,
    message: studioUrl ? `已拼装技能「${skillId}」并打开 Studio：${studioUrl}` : `已拼装技能「${skillId}」到 ${projectDir}`,
    projectDir,
    compositionId,
    studioUrl,
    skillId
  };
}
exports.queryRemotionProjectDir = index.queryRemotionProjectDir;
exports.postApplyRemotionTemplateSkill = postApplyRemotionTemplateSkill;
exports.queryBuildRootSourceFromManifest = queryBuildRootSourceFromManifest;
exports.queryRemotionTemplateSkillDir = queryRemotionTemplateSkillDir;
