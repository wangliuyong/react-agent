import { j as jsxRuntimeExports } from "./vendor-xyflow-C3K48oRM.js";
import { al as shellStyles } from "./index-D2SMd1bE.js";
function FeaturePageShell({
  children,
  atmosphere = true,
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: [shellStyles.page, className].filter(Boolean).join(" "),
      "data-atmosphere": atmosphere ? "true" : "false",
      children
    }
  );
}
function FeatureScrollBody({
  children,
  flush = false,
  locked = false,
  className
}) {
  const bodyClass = [
    shellStyles.body,
    flush ? shellStyles.bodyFlush : "",
    locked ? shellStyles.bodyLocked : "",
    className
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: bodyClass, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shellStyles.bodyInner, children }) });
}
export {
  FeaturePageShell as F,
  FeatureScrollBody as a
};
