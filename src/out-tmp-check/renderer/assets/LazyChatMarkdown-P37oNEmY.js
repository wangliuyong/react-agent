const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./index-Chp4dXkW.js","./index-D2SMd1bE.js","./FullscreenOutlined-CcMTXdYK.js","./vendor-xyflow-SxuD-EZ_.css","./index-Z1iqQGn_.css","./index-6W8eOyF6.css"])))=>i.map(i=>d[i]);
import { A as __vitePreload } from "./index-D2SMd1bE.js";
import { j as jsxRuntimeExports, r as reactExports } from "./vendor-xyflow-C3K48oRM.js";
const cursor = "_cursor_11u7h_1";
const placeholder = "_placeholder_11u7h_11";
const styles = {
  cursor,
  placeholder
};
const ChatMarkdown = reactExports.lazy(
  () => __vitePreload(() => import("./index-Chp4dXkW.js"), true ? __vite__mapDeps([0,1,2,3,4,5]) : void 0, import.meta.url).then((m) => ({ default: m.ChatMarkdown }))
);
function LazyChatMarkdown(props) {
  const fallback = props.streaming ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.cursor }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.placeholder });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChatMarkdown, { ...props }) });
}
export {
  LazyChatMarkdown as L
};
