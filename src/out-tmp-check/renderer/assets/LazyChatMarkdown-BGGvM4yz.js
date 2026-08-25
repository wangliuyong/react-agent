const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index-DmIX3b1_.js","./index-BQnnWLUu.js","./FullscreenOutlined-C5WwOVDO.js","./markdown-local-image-BwFTeukk.js","./ArtifactFileActions--VhqergO.js","./LeftOutlined-DLcljnsf.js","./FolderOpenOutlined-eU2RptIS.js","./vendor-xyflow-SxuD-EZ_.css","./index-BTx-WhL6.css","./ArtifactFileActions-BaEzdmR8.css","./index-CgMH8oQ8.css"])))=>i.map(i=>d[i]);
import { F as __vitePreload } from "./index-BQnnWLUu.js";
import { j as jsxRuntimeExports, r as reactExports } from "./vendor-xyflow-ByVkQ6-f.js";
const cursor = "_cursor_11u7h_1";
const placeholder = "_placeholder_11u7h_11";
const styles = {
  cursor,
  placeholder
};
const ChatMarkdown = reactExports.lazy(
  () => __vitePreload(() => import("./index-DmIX3b1_.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10]) : void 0, import.meta.url).then((m) => ({ default: m.ChatMarkdown }))
);
function LazyChatMarkdown(props) {
  const fallback = props.streaming ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.cursor }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.placeholder });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChatMarkdown, { ...props }) });
}
export {
  LazyChatMarkdown as L
};
