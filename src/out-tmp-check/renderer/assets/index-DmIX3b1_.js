import { r as reactExports, j as jsxRuntimeExports } from "./vendor-xyflow-ByVkQ6-f.js";
import { an as RefIcon, a5 as Tooltip, ay as RefIcon$1, ag as Modal, E as Button, D as appMessage, G as queryLocalImageDataUrl, S as Spin } from "./index-BQnnWLUu.js";
import { R as RefIcon$2 } from "./FullscreenOutlined-C5WwOVDO.js";
import { q as queryNormalizeMarkdownImageSrc } from "./markdown-local-image-BwFTeukk.js";
import { A as ArtifactFileActions, I as Image } from "./ArtifactFileActions--VhqergO.js";
import { M as Markdown, r as remarkGfm } from "./vendor-markdown-8_WtQ5Gw.js";
import "./LeftOutlined-DLcljnsf.js";
import "./FolderOpenOutlined-eU2RptIS.js";
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function wrap(className, text) {
  return `<span class="${className}">${escapeHtml(text)}</span>`;
}
const SLOT_RE = /\x00HL(\d+)\x00/g;
function createSlotStash() {
  const slots = [];
  return {
    stash(html) {
      const index = slots.length;
      slots.push(html);
      return `\0HL${index}\0`;
    },
    read(index) {
      return slots[index] ?? "";
    }
  };
}
function applyRules(chunk, rules) {
  let result = escapeHtml(chunk);
  for (const { pattern, className } of rules) {
    const re = new RegExp(pattern.source, pattern.flags);
    result = result.replace(re, (match) => wrap(className, match));
  }
  return result;
}
function processWithRules(source, rules, stash) {
  const re = new RegExp(SLOT_RE.source, "g");
  let output = "";
  let lastIndex = 0;
  let match;
  while ((match = re.exec(source)) !== null) {
    output += applyRules(source.slice(lastIndex, match.index), rules);
    output += stash.read(Number(match[1]));
    lastIndex = match.index + match[0].length;
  }
  output += applyRules(source.slice(lastIndex), rules);
  return output;
}
function highlightGeneric(source) {
  const stash = createSlotStash();
  let text = source;
  text = text.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, (m) => stash.stash(wrap("hl-comment", m)));
  text = text.replace(
    /('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/g,
    (m) => stash.stash(wrap("hl-string", m))
  );
  return processWithRules(text, [{ pattern: /\b(-?\d+(?:\.\d+)?)\b/g, className: "hl-number" }], stash);
}
function highlightJson(source) {
  const stash = createSlotStash();
  let text = source;
  text = text.replace(/"([^"\\]|\\.)*"(?=\s*:)/g, (m) => stash.stash(wrap("hl-key", m)));
  text = text.replace(/"([^"\\]|\\.)*"/g, (m) => stash.stash(wrap("hl-string", m)));
  return processWithRules(
    text,
    [
      { pattern: /\b(true|false|null)\b/g, className: "hl-keyword" },
      { pattern: /\b(-?\d+(?:\.\d+)?)\b/g, className: "hl-number" }
    ],
    stash
  );
}
function highlightJsLike(source) {
  const stash = createSlotStash();
  let text = source;
  text = text.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, (m) => stash.stash(wrap("hl-comment", m)));
  text = text.replace(
    /('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)/g,
    (m) => stash.stash(wrap("hl-string", m))
  );
  return processWithRules(
    text,
    [
      {
        pattern: /\b(const|let|var|function|return|if|else|for|while|switch|case|break|continue|import|export|from|default|class|extends|new|typeof|instanceof|async|await|try|catch|finally|throw|interface|type|enum)\b/g,
        className: "hl-keyword"
      },
      { pattern: /([A-Za-z_$][\w$]*)(?=\s*:)/g, className: "hl-key" },
      { pattern: /\b(-?\d+(?:\.\d+)?)\b/g, className: "hl-number" }
    ],
    stash
  );
}
function queryHighlightCode(code, language) {
  const lang2 = language.trim().toLowerCase();
  if (lang2 === "json") return highlightJson(code);
  if (lang2 === "javascript" || lang2 === "js" || lang2 === "typescript" || lang2 === "ts" || lang2 === "tsx" || lang2 === "jsx") {
    return highlightJsLike(code);
  }
  return highlightGeneric(code);
}
const root = "_root_l5pqr_2";
const header = "_header_l5pqr_22";
const langToggle = "_langToggle_l5pqr_33";
const chevron = "_chevron_l5pqr_60";
const lang = "_lang_l5pqr_33";
const actions = "_actions_l5pqr_78";
const iconBtn = "_iconBtn_l5pqr_85";
const body = "_body_l5pqr_108";
const modalBody = "_modalBody_l5pqr_109";
const fullscreenModal = "_fullscreenModal_l5pqr_160";
const modalToolbar = "_modalToolbar_l5pqr_183";
const modalMeta = "_modalMeta_l5pqr_192";
const styles$2 = {
  root,
  header,
  langToggle,
  chevron,
  lang,
  actions,
  iconBtn,
  body,
  modalBody,
  fullscreenModal,
  modalToolbar,
  modalMeta
};
const COLLAPSE_LINE_THRESHOLD = 6;
const DEFAULT_COLLAPSED_LINE_THRESHOLD = 12;
const MAX_EXPANDED_HEIGHT = 420;
function queryParsePreChildren(children) {
  const codeChild = reactExports.Children.toArray(children).find(
    (child) => reactExports.isValidElement(child) && child.type === "code"
  );
  if (!codeChild) {
    return { language: "", code: queryNormalizeCodeText(children) };
  }
  const className = codeChild.props.className ?? "";
  const language = /language-([\w-]+)/.exec(className)?.[1] ?? "";
  return {
    language,
    code: queryNormalizeCodeText(codeChild.props.children)
  };
}
function queryNormalizeCodeText(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") {
    return String(node).replace(/\n$/, "");
  }
  if (Array.isArray(node)) {
    return node.map(queryNormalizeCodeText).join("").replace(/\n$/, "");
  }
  if (reactExports.isValidElement(node)) {
    return queryNormalizeCodeText(node.props.children);
  }
  return String(node).replace(/\n$/, "");
}
function queryCountLines(code) {
  if (!code) return 0;
  return code.split("\n").length;
}
function postCopyCode(text) {
  void navigator.clipboard.writeText(text).then(
    () => appMessage.success("已复制"),
    () => appMessage.error("复制失败")
  );
}
function CodeBody({ code, language, className, style }) {
  const highlighted = reactExports.useMemo(
    () => queryHighlightCode(code, language),
    [code, language]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className, style, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
    "code",
    {
      className: language ? `language-${language}` : void 0,
      dangerouslySetInnerHTML: { __html: highlighted }
    }
  ) });
}
function ChatCodeBlock({
  children,
  streaming = false
}) {
  const { language, code } = reactExports.useMemo(() => queryParsePreChildren(children), [children]);
  const lineCount = queryCountLines(code);
  const collapsible = lineCount > COLLAPSE_LINE_THRESHOLD;
  const defaultCollapsed = collapsible && lineCount > DEFAULT_COLLAPSED_LINE_THRESHOLD;
  const [collapsed, setCollapsed] = reactExports.useState(defaultCollapsed);
  const [fullscreenOpen, setFullscreenOpen] = reactExports.useState(false);
  if (!code.trim()) {
    return null;
  }
  const isCollapsed = streaming ? false : collapsible && collapsed;
  const langLabel = (language || "code").toLowerCase();
  const handleToggleCollapse = () => {
    if (!collapsible || streaming) return;
    setCollapsed((prev) => !prev);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.root, "data-collapsed": isCollapsed || void 0, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.header, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: styles$2.langToggle,
            onClick: handleToggleCollapse,
            disabled: !collapsible || streaming,
            "aria-expanded": !isCollapsed,
            children: [
              collapsible && !streaming ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                RefIcon,
                {
                  className: styles$2.chevron,
                  "data-collapsed": isCollapsed || void 0,
                  "aria-hidden": true
                }
              ) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.lang, children: langLabel })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.actions, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "复制代码", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: styles$2.iconBtn,
              "aria-label": "复制代码",
              onClick: () => postCopyCode(code),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {})
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "全屏查看", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: styles$2.iconBtn,
              "aria-label": "全屏查看",
              onClick: () => setFullscreenOpen(true),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {})
            }
          ) })
        ] })
      ] }),
      !isCollapsed ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        CodeBody,
        {
          code,
          language,
          className: styles$2.body,
          style: { maxHeight: MAX_EXPANDED_HEIGHT }
        }
      ) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Modal,
      {
        title: langLabel,
        open: fullscreenOpen,
        onCancel: () => setFullscreenOpen(false),
        footer: null,
        width: "min(920px, 92vw)",
        className: styles$2.fullscreenModal,
        destroyOnHidden: true,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.modalToolbar, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.modalMeta, children: [
              lineCount,
              " 行"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "text",
                size: "small",
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}),
                onClick: () => postCopyCode(code),
                children: "复制"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CodeBody, { code, language, className: styles$2.modalBody })
        ]
      }
    )
  ] });
}
const inlineWrap = "_inlineWrap_173yx_3";
const fallbackWrap = "_fallbackWrap_173yx_4";
const thumbRoot = "_thumbRoot_173yx_12";
const thumb = "_thumb_173yx_12";
const placeholder = "_placeholder_173yx_38";
const fallback = "_fallback_173yx_4";
const fileActions = "_fileActions_173yx_67";
const styles$1 = {
  inlineWrap,
  fallbackWrap,
  thumbRoot,
  thumb,
  placeholder,
  fallback,
  fileActions
};
function queryIsLocalImagePath(src) {
  return src.startsWith("/") || /^[A-Za-z]:[\\/]/.test(src);
}
function MessageInlineImage({
  src,
  alt = ""
}) {
  const normalizedSrc = queryNormalizeMarkdownImageSrc(src);
  const [previewUrl, setPreviewUrl] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  const [failed, setFailed] = reactExports.useState(false);
  const isLocal = queryIsLocalImagePath(normalizedSrc);
  reactExports.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    setPreviewUrl(null);
    void (async () => {
      if (isLocal) {
        const dataUrl = await queryLocalImageDataUrl(normalizedSrc);
        if (cancelled) return;
        if (dataUrl) {
          setPreviewUrl(dataUrl);
        } else {
          setFailed(true);
        }
        setLoading(false);
        return;
      }
      if (!cancelled) {
        setPreviewUrl(normalizedSrc);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [normalizedSrc, isLocal]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.placeholder, "aria-busy": "true", "aria-label": "图片加载中", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { size: "small" }) });
  }
  if (failed || !previewUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$1.fallbackWrap, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.fallback, title: normalizedSrc, children: alt || "无法预览" }),
      isLocal ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArtifactFileActions, { filePath: normalizedSrc, iconOnly: true, className: styles$1.fileActions }) : null
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$1.inlineWrap, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Image,
      {
        src: previewUrl,
        alt: alt || "图片预览",
        className: styles$1.thumb,
        rootClassName: styles$1.thumbRoot,
        preview: { mask: "预览" },
        onError: () => setFailed(true)
      }
    ),
    isLocal ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArtifactFileActions, { filePath: normalizedSrc, iconOnly: true, className: styles$1.fileActions }) : null
  ] });
}
const prose = "_prose_1u8gu_1";
const link = "_link_1u8gu_70";
const inlineCode = "_inlineCode_1u8gu_82";
const tableWrap = "_tableWrap_1u8gu_91";
const table = "_table_1u8gu_91";
const cursor = "_cursor_1u8gu_131";
const styles = {
  prose,
  link,
  inlineCode,
  tableWrap,
  table,
  cursor
};
function openExternalLink(href) {
  if (!/^https?:\/\//i.test(href)) return;
  void window.api.postOpenExternal(href);
}
function createMarkdownComponents(streaming) {
  return {
    a: ({ href, children }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "a",
      {
        href,
        className: styles.link,
        onClick: (event) => {
          if (href && /^https?:\/\//i.test(href)) {
            event.preventDefault();
            openExternalLink(href);
          }
        },
        children
      }
    ),
    pre: ({ children }) => /* @__PURE__ */ jsxRuntimeExports.jsx(ChatCodeBlock, { streaming, children }),
    code: ({ className, children, ...props }) => {
      const isBlock = Boolean(className?.includes("language-"));
      if (isBlock) {
        return /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className, ...props, children });
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles.inlineCode, ...props, children });
    },
    table: ({ children }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.tableWrap, children: /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: styles.table, children }) }),
    // 本地绝对路径由 MessageInlineImage 经 IPC 转 data URL 并支持点击放大
    img: ({ src, alt }) => src ? /* @__PURE__ */ jsxRuntimeExports.jsx(MessageInlineImage, { src, alt: alt ?? "" }) : null
  };
}
function ChatMarkdown({
  source,
  streaming = false,
  className
}) {
  const markdownComponents = reactExports.useMemo(
    () => createMarkdownComponents(streaming),
    [streaming]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: [styles.prose, className].filter(Boolean).join(" "), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Markdown, { remarkPlugins: [remarkGfm], components: markdownComponents, children: source }),
    streaming ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.cursor }) : null
  ] });
}
export {
  ChatMarkdown
};
