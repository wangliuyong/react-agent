const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./MessageKlineChart-DyYLpGbf.js","./index-BQnnWLUu.js","./Pagination-IjXhoAki.js","./LeftOutlined-DLcljnsf.js","./api-D5SC6S-F.js","./useSkillsStore-Bec86d-P.js","./markdown-local-image-BwFTeukk.js","./LazyChatMarkdown-BGGvM4yz.js","./ArtifactFileActions--VhqergO.js","./FolderOpenOutlined-eU2RptIS.js","./index-BCCKOrpo.js","./ToolOutlined--gas-4iW.js","./CaretRightOutlined-B57Sb4cd.js","./PlayCircleOutlined-y8OhbKwX.js","./index-DdgcjpRF.js","./index-CTeoHogA.js","./MinusCircleOutlined-7FKBZe7B.js","./vendor-xyflow-SxuD-EZ_.css","./index-BTx-WhL6.css","./LazyChatMarkdown-CMyDqZUr.css","./ArtifactFileActions-BaEzdmR8.css","./MessageKlineChart-D6WKEt6h.css"])))=>i.map(i=>d[i]);
import { R as ReactExports, r as reactExports, j as jsxRuntimeExports } from "./vendor-xyflow-ByVkQ6-f.js";
import { q as queryBrowserStatus, p as postBrowserClose, a as postBrowserStart } from "./api-D5SC6S-F.js";
import { _ as _slicedToArray, c as classNames, a as _defineProperty, b as _objectWithoutProperties, K as KeyCode, d as _extends, e as _objectSpread2, C as CSSMotion, t as toArray, u as useMergedState, w as warningOnce, p as pickAttrs, f as _typeof, g as _toConsumableArray, h as ConfigContext, i as genStyleHooks, m as merge, j as unit, k as genCollapseMotion, r as resetComponent, l as genFocusStyle, n as resetIcon, o as useComponentConfig, q as useSize, s as cloneElement, v as initCollapseMotion, x as omit, y as genPresetColor, z as Keyframe, A as isPresetColor, I as Icon, B as querySessionType, D as appMessage, T as Typography, E as Button, F as __vitePreload, G as queryLocalImageDataUrl, S as Spin, H as queryLocalMediaUrl, J as queryAgentAssetTextPreview, L as queryLocalPathExists, M as queryToolArgsRecord, N as queryToolCallLabel, O as queryToolLabel, P as queryAgentPhase, Q as queryAgentBusyLabel, R as AppErrorNotice, U as staticMethods, V as postSaveChatUpload, W as RefIcon$6, X as RefIcon$8, Y as useSettingsStore, Z as queryGeneralChatModelConnection, $ as queryGeneralChatModelId, a0 as queryAgentStatusLabel, a1 as queryChatModelOptionsFromCatalog, a2 as queryModelCategory, a3 as queryModelOptionDisplayLabel, a4 as queryModelLabel, a5 as Tooltip, a6 as Space, a7 as postSelectImages, a8 as postSelectDirectory, a9 as Popover, aa as RefIcon$c, ab as Select, ac as RefIcon$d, ad as RefIcon$e, ae as queryResolveModelForProvider, af as Form, ag as Modal, ah as Input, ai as RefIcon$g, aj as useAppStore, ak as RefIcon$h, al as RefIcon$i, am as Card, an as RefIcon$k, ao as RefIcon$l, ap as RefIcon$m, aq as useSessionStore, ar as Segmented, as as shellStyles, at as RefIcon$o, au as queryNewChatShortcutLabel } from "./index-BQnnWLUu.js";
import { u as useSkillsStore, p as postSummarizeSkillFromSession, i as isValidSkillId, s as slugifySkillId, a as postProjectSkill, b as postSkillStates } from "./useSkillsStore-Bec86d-P.js";
import { q as queryNormalizeMarkdownImageSrc, a as queryFormatMarkdownImage } from "./markdown-local-image-BwFTeukk.js";
import { L as LazyChatMarkdown } from "./LazyChatMarkdown-BGGvM4yz.js";
import { I as Image, A as ArtifactFileActions, R as RefIcon$p } from "./ArtifactFileActions--VhqergO.js";
import { A as Alert } from "./index-BCCKOrpo.js";
import { R as RefIcon$3 } from "./LeftOutlined-DLcljnsf.js";
import { R as RefIcon$4, a as RefIcon$9, b as RefIcon$a, c as RefIcon$f, d as RefIcon$j } from "./ToolOutlined--gas-4iW.js";
import { R as RefIcon$5 } from "./FolderOpenOutlined-eU2RptIS.js";
import { R as RefIcon$7 } from "./CaretRightOutlined-B57Sb4cd.js";
import { R as RefIcon$b } from "./PlayCircleOutlined-y8OhbKwX.js";
import { D as Dropdown } from "./index-DdgcjpRF.js";
import { C as Checkbox } from "./index-CTeoHogA.js";
import { R as RefIcon$n } from "./MinusCircleOutlined-7FKBZe7B.js";
var PanelContent = /* @__PURE__ */ ReactExports.forwardRef(function(props, ref) {
  var prefixCls = props.prefixCls, forceRender = props.forceRender, className = props.className, style = props.style, children = props.children, isActive = props.isActive, role = props.role, customizeClassNames = props.classNames, styles2 = props.styles;
  var _React$useState = ReactExports.useState(isActive || forceRender), _React$useState2 = _slicedToArray(_React$useState, 2), rendered = _React$useState2[0], setRendered = _React$useState2[1];
  ReactExports.useEffect(function() {
    if (forceRender || isActive) {
      setRendered(true);
    }
  }, [forceRender, isActive]);
  if (!rendered) {
    return null;
  }
  return /* @__PURE__ */ ReactExports.createElement("div", {
    ref,
    className: classNames("".concat(prefixCls, "-content"), _defineProperty(_defineProperty({}, "".concat(prefixCls, "-content-active"), isActive), "".concat(prefixCls, "-content-inactive"), !isActive), className),
    style,
    role
  }, /* @__PURE__ */ ReactExports.createElement("div", {
    className: classNames("".concat(prefixCls, "-content-box"), customizeClassNames === null || customizeClassNames === void 0 ? void 0 : customizeClassNames.body),
    style: styles2 === null || styles2 === void 0 ? void 0 : styles2.body
  }, children));
});
PanelContent.displayName = "PanelContent";
var _excluded$1 = ["showArrow", "headerClass", "isActive", "onItemClick", "forceRender", "className", "classNames", "styles", "prefixCls", "collapsible", "accordion", "panelKey", "extra", "header", "expandIcon", "openMotion", "destroyInactivePanel", "children"];
var CollapsePanel$1 = /* @__PURE__ */ ReactExports.forwardRef(function(props, ref) {
  var _props$showArrow = props.showArrow, showArrow = _props$showArrow === void 0 ? true : _props$showArrow, headerClass = props.headerClass, isActive = props.isActive, onItemClick = props.onItemClick, forceRender = props.forceRender, className = props.className, _props$classNames = props.classNames, customizeClassNames = _props$classNames === void 0 ? {} : _props$classNames, _props$styles = props.styles, styles2 = _props$styles === void 0 ? {} : _props$styles, prefixCls = props.prefixCls, collapsible = props.collapsible, accordion = props.accordion, panelKey = props.panelKey, extra = props.extra, header2 = props.header, expandIcon = props.expandIcon, openMotion = props.openMotion, destroyInactivePanel = props.destroyInactivePanel, children = props.children, resetProps = _objectWithoutProperties(props, _excluded$1);
  var disabled = collapsible === "disabled";
  var ifExtraExist = extra !== null && extra !== void 0 && typeof extra !== "boolean";
  var collapsibleProps = _defineProperty(_defineProperty(_defineProperty({
    onClick: function onClick() {
      onItemClick === null || onItemClick === void 0 || onItemClick(panelKey);
    },
    onKeyDown: function onKeyDown(e) {
      if (e.key === "Enter" || e.keyCode === KeyCode.ENTER || e.which === KeyCode.ENTER) {
        onItemClick === null || onItemClick === void 0 || onItemClick(panelKey);
      }
    },
    role: accordion ? "tab" : "button"
  }, "aria-expanded", isActive), "aria-disabled", disabled), "tabIndex", disabled ? -1 : 0);
  var iconNodeInner = typeof expandIcon === "function" ? expandIcon(props) : /* @__PURE__ */ ReactExports.createElement("i", {
    className: "arrow"
  });
  var iconNode = iconNodeInner && /* @__PURE__ */ ReactExports.createElement("div", _extends({
    className: "".concat(prefixCls, "-expand-icon")
  }, ["header", "icon"].includes(collapsible) ? collapsibleProps : {}), iconNodeInner);
  var collapsePanelClassNames = classNames("".concat(prefixCls, "-item"), _defineProperty(_defineProperty({}, "".concat(prefixCls, "-item-active"), isActive), "".concat(prefixCls, "-item-disabled"), disabled), className);
  var headerClassName = classNames(headerClass, "".concat(prefixCls, "-header"), _defineProperty({}, "".concat(prefixCls, "-collapsible-").concat(collapsible), !!collapsible), customizeClassNames.header);
  var headerProps = _objectSpread2({
    className: headerClassName,
    style: styles2.header
  }, ["header", "icon"].includes(collapsible) ? {} : collapsibleProps);
  return /* @__PURE__ */ ReactExports.createElement("div", _extends({}, resetProps, {
    ref,
    className: collapsePanelClassNames
  }), /* @__PURE__ */ ReactExports.createElement("div", headerProps, showArrow && iconNode, /* @__PURE__ */ ReactExports.createElement("span", _extends({
    className: "".concat(prefixCls, "-header-text")
  }, collapsible === "header" ? collapsibleProps : {}), header2), ifExtraExist && /* @__PURE__ */ ReactExports.createElement("div", {
    className: "".concat(prefixCls, "-extra")
  }, extra)), /* @__PURE__ */ ReactExports.createElement(CSSMotion, _extends({
    visible: isActive,
    leavedClassName: "".concat(prefixCls, "-content-hidden")
  }, openMotion, {
    forceRender,
    removeOnLeave: destroyInactivePanel
  }), function(_ref, motionRef) {
    var motionClassName = _ref.className, motionStyle = _ref.style;
    return /* @__PURE__ */ ReactExports.createElement(PanelContent, {
      ref: motionRef,
      prefixCls,
      className: motionClassName,
      classNames: customizeClassNames,
      style: motionStyle,
      styles: styles2,
      isActive,
      forceRender,
      role: accordion ? "tabpanel" : void 0
    }, children);
  }));
});
var _excluded = ["children", "label", "key", "collapsible", "onItemClick", "destroyInactivePanel"];
var convertItemsToNodes = function convertItemsToNodes2(items, props) {
  var prefixCls = props.prefixCls, accordion = props.accordion, collapsible = props.collapsible, destroyInactivePanel = props.destroyInactivePanel, onItemClick = props.onItemClick, activeKey = props.activeKey, openMotion = props.openMotion, expandIcon = props.expandIcon;
  return items.map(function(item2, index2) {
    var children = item2.children, label2 = item2.label, rawKey = item2.key, rawCollapsible = item2.collapsible, rawOnItemClick = item2.onItemClick, rawDestroyInactivePanel = item2.destroyInactivePanel, restProps = _objectWithoutProperties(item2, _excluded);
    var key = String(rawKey !== null && rawKey !== void 0 ? rawKey : index2);
    var mergeCollapsible = rawCollapsible !== null && rawCollapsible !== void 0 ? rawCollapsible : collapsible;
    var mergeDestroyInactivePanel = rawDestroyInactivePanel !== null && rawDestroyInactivePanel !== void 0 ? rawDestroyInactivePanel : destroyInactivePanel;
    var handleItemClick = function handleItemClick2(value) {
      if (mergeCollapsible === "disabled") return;
      onItemClick(value);
      rawOnItemClick === null || rawOnItemClick === void 0 || rawOnItemClick(value);
    };
    var isActive = false;
    if (accordion) {
      isActive = activeKey[0] === key;
    } else {
      isActive = activeKey.indexOf(key) > -1;
    }
    return /* @__PURE__ */ ReactExports.createElement(CollapsePanel$1, _extends({}, restProps, {
      prefixCls,
      key,
      panelKey: key,
      isActive,
      accordion,
      openMotion,
      expandIcon,
      header: label2,
      collapsible: mergeCollapsible,
      onItemClick: handleItemClick,
      destroyInactivePanel: mergeDestroyInactivePanel
    }), children);
  });
};
var getNewChild = function getNewChild2(child, index2, props) {
  if (!child) return null;
  var prefixCls = props.prefixCls, accordion = props.accordion, collapsible = props.collapsible, destroyInactivePanel = props.destroyInactivePanel, onItemClick = props.onItemClick, activeKey = props.activeKey, openMotion = props.openMotion, expandIcon = props.expandIcon;
  var key = child.key || String(index2);
  var _child$props = child.props, header2 = _child$props.header, headerClass = _child$props.headerClass, childDestroyInactivePanel = _child$props.destroyInactivePanel, childCollapsible = _child$props.collapsible, childOnItemClick = _child$props.onItemClick;
  var isActive = false;
  if (accordion) {
    isActive = activeKey[0] === key;
  } else {
    isActive = activeKey.indexOf(key) > -1;
  }
  var mergeCollapsible = childCollapsible !== null && childCollapsible !== void 0 ? childCollapsible : collapsible;
  var handleItemClick = function handleItemClick2(value) {
    if (mergeCollapsible === "disabled") return;
    onItemClick(value);
    childOnItemClick === null || childOnItemClick === void 0 || childOnItemClick(value);
  };
  var childProps = {
    key,
    panelKey: key,
    header: header2,
    headerClass,
    isActive,
    prefixCls,
    destroyInactivePanel: childDestroyInactivePanel !== null && childDestroyInactivePanel !== void 0 ? childDestroyInactivePanel : destroyInactivePanel,
    openMotion,
    accordion,
    children: child.props.children,
    onItemClick: handleItemClick,
    expandIcon,
    collapsible: mergeCollapsible
  };
  if (typeof child.type === "string") {
    return child;
  }
  Object.keys(childProps).forEach(function(propName) {
    if (typeof childProps[propName] === "undefined") {
      delete childProps[propName];
    }
  });
  return /* @__PURE__ */ ReactExports.cloneElement(child, childProps);
};
function useItems(items, rawChildren, props) {
  if (Array.isArray(items)) {
    return convertItemsToNodes(items, props);
  }
  return toArray(rawChildren).map(function(child, index2) {
    return getNewChild(child, index2, props);
  });
}
function getActiveKeysArray(activeKey) {
  var currentActiveKey = activeKey;
  if (!Array.isArray(currentActiveKey)) {
    var activeKeyType = _typeof(currentActiveKey);
    currentActiveKey = activeKeyType === "number" || activeKeyType === "string" ? [currentActiveKey] : [];
  }
  return currentActiveKey.map(function(key) {
    return String(key);
  });
}
var Collapse$2 = /* @__PURE__ */ ReactExports.forwardRef(function(props, ref) {
  var _props$prefixCls = props.prefixCls, prefixCls = _props$prefixCls === void 0 ? "rc-collapse" : _props$prefixCls, _props$destroyInactiv = props.destroyInactivePanel, destroyInactivePanel = _props$destroyInactiv === void 0 ? false : _props$destroyInactiv, style = props.style, accordion = props.accordion, className = props.className, children = props.children, collapsible = props.collapsible, openMotion = props.openMotion, expandIcon = props.expandIcon, rawActiveKey = props.activeKey, defaultActiveKey = props.defaultActiveKey, _onChange = props.onChange, items = props.items;
  var collapseClassName = classNames(prefixCls, className);
  var _useMergedState = useMergedState([], {
    value: rawActiveKey,
    onChange: function onChange(v) {
      return _onChange === null || _onChange === void 0 ? void 0 : _onChange(v);
    },
    defaultValue: defaultActiveKey,
    postState: getActiveKeysArray
  }), _useMergedState2 = _slicedToArray(_useMergedState, 2), activeKey = _useMergedState2[0], setActiveKey = _useMergedState2[1];
  var onItemClick = function onItemClick2(key) {
    return setActiveKey(function() {
      if (accordion) {
        return activeKey[0] === key ? [] : [key];
      }
      var index2 = activeKey.indexOf(key);
      var isActive = index2 > -1;
      if (isActive) {
        return activeKey.filter(function(item2) {
          return item2 !== key;
        });
      }
      return [].concat(_toConsumableArray(activeKey), [key]);
    });
  };
  warningOnce(!children, "[rc-collapse] `children` will be removed in next major version. Please use `items` instead.");
  var mergedChildren = useItems(items, children, {
    prefixCls,
    accordion,
    openMotion,
    expandIcon,
    collapsible,
    destroyInactivePanel,
    onItemClick,
    activeKey
  });
  return /* @__PURE__ */ ReactExports.createElement("div", _extends({
    ref,
    className: collapseClassName,
    style,
    role: accordion ? "tablist" : void 0
  }, pickAttrs(props, {
    aria: true,
    data: true
  })), mergedChildren);
});
const Collapse$3 = Object.assign(Collapse$2, {
  /**
   * @deprecated use `items` instead, will be removed in `v4.0.0`
   */
  Panel: CollapsePanel$1
});
Collapse$3.Panel;
const CollapsePanel = /* @__PURE__ */ reactExports.forwardRef((props, ref) => {
  const {
    getPrefixCls
  } = reactExports.useContext(ConfigContext);
  const {
    prefixCls: customizePrefixCls,
    className,
    showArrow = true
  } = props;
  const prefixCls = getPrefixCls("collapse", customizePrefixCls);
  const collapsePanelClassName = classNames({
    [`${prefixCls}-no-arrow`]: !showArrow
  }, className);
  return /* @__PURE__ */ reactExports.createElement(Collapse$3.Panel, Object.assign({
    ref
  }, props, {
    prefixCls,
    className: collapsePanelClassName
  }));
});
const genBaseStyle = (token) => {
  const {
    componentCls,
    contentBg,
    padding,
    headerBg,
    headerPadding,
    collapseHeaderPaddingSM,
    collapseHeaderPaddingLG,
    collapsePanelBorderRadius,
    lineWidth,
    lineType,
    colorBorder,
    colorText,
    colorTextHeading,
    colorTextDisabled,
    fontSizeLG,
    lineHeight,
    lineHeightLG,
    marginSM,
    paddingSM,
    paddingLG,
    paddingXS,
    motionDurationSlow,
    fontSizeIcon,
    contentPadding,
    fontHeight,
    fontHeightLG
  } = token;
  const borderBase = `${unit(lineWidth)} ${lineType} ${colorBorder}`;
  return {
    [componentCls]: Object.assign(Object.assign({}, resetComponent(token)), {
      backgroundColor: headerBg,
      border: borderBase,
      borderRadius: collapsePanelBorderRadius,
      "&-rtl": {
        direction: "rtl"
      },
      [`& > ${componentCls}-item`]: {
        borderBottom: borderBase,
        "&:first-child": {
          [`
            &,
            & > ${componentCls}-header`]: {
            borderRadius: `${unit(collapsePanelBorderRadius)} ${unit(collapsePanelBorderRadius)} 0 0`
          }
        },
        "&:last-child": {
          [`
            &,
            & > ${componentCls}-header`]: {
            borderRadius: `0 0 ${unit(collapsePanelBorderRadius)} ${unit(collapsePanelBorderRadius)}`
          }
        },
        [`> ${componentCls}-header`]: Object.assign(Object.assign({
          position: "relative",
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "flex-start",
          padding: headerPadding,
          color: colorTextHeading,
          lineHeight,
          cursor: "pointer",
          transition: `all ${motionDurationSlow}, visibility 0s`
        }, genFocusStyle(token)), {
          [`> ${componentCls}-header-text`]: {
            flex: "auto"
          },
          // >>>>> Arrow
          [`${componentCls}-expand-icon`]: {
            height: fontHeight,
            display: "flex",
            alignItems: "center",
            paddingInlineEnd: marginSM
          },
          [`${componentCls}-arrow`]: Object.assign(Object.assign({}, resetIcon()), {
            fontSize: fontSizeIcon,
            // when `transform: rotate()` is applied to icon's root element
            transition: `transform ${motionDurationSlow}`,
            // when `transform: rotate()` is applied to icon's child element
            svg: {
              transition: `transform ${motionDurationSlow}`
            }
          }),
          // >>>>> Text
          [`${componentCls}-header-text`]: {
            marginInlineEnd: "auto"
          }
        }),
        [`${componentCls}-collapsible-header`]: {
          cursor: "default",
          [`${componentCls}-header-text`]: {
            flex: "none",
            cursor: "pointer"
          },
          [`${componentCls}-expand-icon`]: {
            cursor: "pointer"
          }
        },
        [`${componentCls}-collapsible-icon`]: {
          cursor: "unset",
          [`${componentCls}-expand-icon`]: {
            cursor: "pointer"
          }
        }
      },
      [`${componentCls}-content`]: {
        color: colorText,
        backgroundColor: contentBg,
        borderTop: borderBase,
        [`& > ${componentCls}-content-box`]: {
          padding: contentPadding
        },
        "&-hidden": {
          display: "none"
        }
      },
      "&-small": {
        [`> ${componentCls}-item`]: {
          [`> ${componentCls}-header`]: {
            padding: collapseHeaderPaddingSM,
            paddingInlineStart: paddingXS,
            [`> ${componentCls}-expand-icon`]: {
              // Arrow offset
              marginInlineStart: token.calc(paddingSM).sub(paddingXS).equal()
            }
          },
          [`> ${componentCls}-content > ${componentCls}-content-box`]: {
            padding: paddingSM
          }
        }
      },
      "&-large": {
        [`> ${componentCls}-item`]: {
          fontSize: fontSizeLG,
          lineHeight: lineHeightLG,
          [`> ${componentCls}-header`]: {
            padding: collapseHeaderPaddingLG,
            paddingInlineStart: padding,
            [`> ${componentCls}-expand-icon`]: {
              height: fontHeightLG,
              // Arrow offset
              marginInlineStart: token.calc(paddingLG).sub(padding).equal()
            }
          },
          [`> ${componentCls}-content > ${componentCls}-content-box`]: {
            padding: paddingLG
          }
        }
      },
      [`${componentCls}-item:last-child`]: {
        borderBottom: 0,
        [`> ${componentCls}-content`]: {
          borderRadius: `0 0 ${unit(collapsePanelBorderRadius)} ${unit(collapsePanelBorderRadius)}`
        }
      },
      [`& ${componentCls}-item-disabled > ${componentCls}-header`]: {
        [`
          &,
          & > .arrow
        `]: {
          color: colorTextDisabled,
          cursor: "not-allowed"
        }
      },
      // ========================== Icon Position ==========================
      [`&${componentCls}-icon-position-end`]: {
        [`& > ${componentCls}-item`]: {
          [`> ${componentCls}-header`]: {
            [`${componentCls}-expand-icon`]: {
              order: 1,
              paddingInlineEnd: 0,
              paddingInlineStart: marginSM
            }
          }
        }
      }
    })
  };
};
const genArrowStyle = (token) => {
  const {
    componentCls
  } = token;
  const fixedSelector = `> ${componentCls}-item > ${componentCls}-header ${componentCls}-arrow`;
  return {
    [`${componentCls}-rtl`]: {
      [fixedSelector]: {
        transform: `rotate(180deg)`
      }
    }
  };
};
const genBorderlessStyle = (token) => {
  const {
    componentCls,
    headerBg,
    borderlessContentPadding,
    borderlessContentBg,
    colorBorder
  } = token;
  return {
    [`${componentCls}-borderless`]: {
      backgroundColor: headerBg,
      border: 0,
      [`> ${componentCls}-item`]: {
        borderBottom: `1px solid ${colorBorder}`
      },
      [`
        > ${componentCls}-item:last-child,
        > ${componentCls}-item:last-child ${componentCls}-header
      `]: {
        borderRadius: 0
      },
      [`> ${componentCls}-item:last-child`]: {
        borderBottom: 0
      },
      [`> ${componentCls}-item > ${componentCls}-content`]: {
        backgroundColor: borderlessContentBg,
        borderTop: 0
      },
      [`> ${componentCls}-item > ${componentCls}-content > ${componentCls}-content-box`]: {
        padding: borderlessContentPadding
      }
    }
  };
};
const genGhostStyle = (token) => {
  const {
    componentCls,
    paddingSM
  } = token;
  return {
    [`${componentCls}-ghost`]: {
      backgroundColor: "transparent",
      border: 0,
      [`> ${componentCls}-item`]: {
        borderBottom: 0,
        [`> ${componentCls}-content`]: {
          backgroundColor: "transparent",
          border: 0,
          [`> ${componentCls}-content-box`]: {
            paddingBlock: paddingSM
          }
        }
      }
    }
  };
};
const prepareComponentToken$1 = (token) => ({
  headerPadding: `${token.paddingSM}px ${token.padding}px`,
  headerBg: token.colorFillAlter,
  contentPadding: `${token.padding}px 16px`,
  // Fixed Value
  contentBg: token.colorBgContainer,
  borderlessContentPadding: `${token.paddingXXS}px 16px ${token.padding}px`,
  borderlessContentBg: "transparent"
});
const useStyle$2 = genStyleHooks("Collapse", (token) => {
  const collapseToken = merge(token, {
    collapseHeaderPaddingSM: `${unit(token.paddingXS)} ${unit(token.paddingSM)}`,
    collapseHeaderPaddingLG: `${unit(token.padding)} ${unit(token.paddingLG)}`,
    collapsePanelBorderRadius: token.borderRadiusLG
  });
  return [genBaseStyle(collapseToken), genBorderlessStyle(collapseToken), genGhostStyle(collapseToken), genArrowStyle(collapseToken), genCollapseMotion(collapseToken)];
}, prepareComponentToken$1);
const Collapse = /* @__PURE__ */ reactExports.forwardRef((props, ref) => {
  const {
    getPrefixCls,
    direction,
    expandIcon: contextExpandIcon,
    className: contextClassName,
    style: contextStyle
  } = useComponentConfig("collapse");
  const {
    prefixCls: customizePrefixCls,
    className,
    rootClassName,
    style,
    bordered = true,
    ghost,
    size: customizeSize,
    expandIconPosition = "start",
    children,
    destroyInactivePanel,
    destroyOnHidden,
    expandIcon
  } = props;
  const mergedSize = useSize((ctx) => {
    var _a;
    return (_a = customizeSize !== null && customizeSize !== void 0 ? customizeSize : ctx) !== null && _a !== void 0 ? _a : "middle";
  });
  const prefixCls = getPrefixCls("collapse", customizePrefixCls);
  const rootPrefixCls = getPrefixCls();
  const [wrapCSSVar, hashId, cssVarCls] = useStyle$2(prefixCls);
  const mergedExpandIconPosition = reactExports.useMemo(() => {
    if (expandIconPosition === "left") {
      return "start";
    }
    return expandIconPosition === "right" ? "end" : expandIconPosition;
  }, [expandIconPosition]);
  const mergedExpandIcon = expandIcon !== null && expandIcon !== void 0 ? expandIcon : contextExpandIcon;
  const renderExpandIcon = reactExports.useCallback((panelProps = {}) => {
    const icon = typeof mergedExpandIcon === "function" ? mergedExpandIcon(panelProps) : /* @__PURE__ */ reactExports.createElement(RefIcon$3, {
      rotate: panelProps.isActive ? direction === "rtl" ? -90 : 90 : void 0,
      "aria-label": panelProps.isActive ? "expanded" : "collapsed"
    });
    return cloneElement(icon, () => {
      var _a;
      return {
        className: classNames((_a = icon.props) === null || _a === void 0 ? void 0 : _a.className, `${prefixCls}-arrow`)
      };
    });
  }, [mergedExpandIcon, prefixCls, direction]);
  const collapseClassName = classNames(`${prefixCls}-icon-position-${mergedExpandIconPosition}`, {
    [`${prefixCls}-borderless`]: !bordered,
    [`${prefixCls}-rtl`]: direction === "rtl",
    [`${prefixCls}-ghost`]: !!ghost,
    [`${prefixCls}-${mergedSize}`]: mergedSize !== "middle"
  }, contextClassName, className, rootClassName, hashId, cssVarCls);
  const openMotion = reactExports.useMemo(() => Object.assign(Object.assign({}, initCollapseMotion(rootPrefixCls)), {
    motionAppear: false,
    leavedClassName: `${prefixCls}-content-hidden`
  }), [rootPrefixCls, prefixCls]);
  const items = reactExports.useMemo(() => {
    if (!children) {
      return null;
    }
    return toArray(children).map((child, index2) => {
      var _a, _b;
      const childProps = child.props;
      if (childProps === null || childProps === void 0 ? void 0 : childProps.disabled) {
        const key = (_a = child.key) !== null && _a !== void 0 ? _a : String(index2);
        const mergedChildProps = Object.assign(Object.assign({}, omit(child.props, ["disabled"])), {
          key,
          collapsible: (_b = childProps.collapsible) !== null && _b !== void 0 ? _b : "disabled"
        });
        return cloneElement(child, mergedChildProps);
      }
      return child;
    });
  }, [children]);
  return wrapCSSVar(
    // @ts-ignore
    /* @__PURE__ */ reactExports.createElement(Collapse$3, Object.assign({
      ref,
      openMotion
    }, omit(props, ["rootClassName"]), {
      expandIcon: renderExpandIcon,
      prefixCls,
      className: collapseClassName,
      style: Object.assign(Object.assign({}, contextStyle), style),
      // TODO: In the future, destroyInactivePanel in rc-collapse needs to be upgrade to destroyOnHidden
      destroyInactivePanel: destroyOnHidden !== null && destroyOnHidden !== void 0 ? destroyOnHidden : destroyInactivePanel
    }), items)
  );
});
const Collapse$1 = Object.assign(Collapse, {
  Panel: CollapsePanel
});
const antStatusProcessing = new Keyframe("antStatusProcessing", {
  "0%": {
    transform: "scale(0.8)",
    opacity: 0.5
  },
  "100%": {
    transform: "scale(2.4)",
    opacity: 0
  }
});
const antZoomBadgeIn = new Keyframe("antZoomBadgeIn", {
  "0%": {
    transform: "scale(0) translate(50%, -50%)",
    opacity: 0
  },
  "100%": {
    transform: "scale(1) translate(50%, -50%)"
  }
});
const antZoomBadgeOut = new Keyframe("antZoomBadgeOut", {
  "0%": {
    transform: "scale(1) translate(50%, -50%)"
  },
  "100%": {
    transform: "scale(0) translate(50%, -50%)",
    opacity: 0
  }
});
const antNoWrapperZoomBadgeIn = new Keyframe("antNoWrapperZoomBadgeIn", {
  "0%": {
    transform: "scale(0)",
    opacity: 0
  },
  "100%": {
    transform: "scale(1)"
  }
});
const antNoWrapperZoomBadgeOut = new Keyframe("antNoWrapperZoomBadgeOut", {
  "0%": {
    transform: "scale(1)"
  },
  "100%": {
    transform: "scale(0)",
    opacity: 0
  }
});
const antBadgeLoadingCircle = new Keyframe("antBadgeLoadingCircle", {
  "0%": {
    transformOrigin: "50%"
  },
  "100%": {
    transform: "translate(50%, -50%) rotate(360deg)",
    transformOrigin: "50%"
  }
});
const genSharedBadgeStyle = (token) => {
  const {
    componentCls,
    iconCls,
    antCls,
    badgeShadowSize,
    textFontSize,
    textFontSizeSM,
    statusSize,
    dotSize,
    textFontWeight,
    indicatorHeight,
    indicatorHeightSM,
    marginXS,
    calc
  } = token;
  const numberPrefixCls = `${antCls}-scroll-number`;
  const colorPreset = genPresetColor(token, (colorKey, {
    darkColor
  }) => ({
    [`&${componentCls} ${componentCls}-color-${colorKey}`]: {
      background: darkColor,
      [`&:not(${componentCls}-count)`]: {
        color: darkColor
      },
      "a:hover &": {
        background: darkColor
      }
    }
  }));
  return {
    [componentCls]: Object.assign(Object.assign(Object.assign(Object.assign({}, resetComponent(token)), {
      position: "relative",
      display: "inline-block",
      width: "fit-content",
      lineHeight: 1,
      [`${componentCls}-count`]: {
        display: "inline-flex",
        justifyContent: "center",
        zIndex: token.indicatorZIndex,
        minWidth: indicatorHeight,
        height: indicatorHeight,
        color: token.badgeTextColor,
        fontWeight: textFontWeight,
        fontSize: textFontSize,
        lineHeight: unit(indicatorHeight),
        whiteSpace: "nowrap",
        textAlign: "center",
        background: token.badgeColor,
        borderRadius: calc(indicatorHeight).div(2).equal(),
        boxShadow: `0 0 0 ${unit(badgeShadowSize)} ${token.badgeShadowColor}`,
        transition: `background ${token.motionDurationMid}`,
        a: {
          color: token.badgeTextColor
        },
        "a:hover": {
          color: token.badgeTextColor
        },
        "a:hover &": {
          background: token.badgeColorHover
        }
      },
      [`${componentCls}-count-sm`]: {
        minWidth: indicatorHeightSM,
        height: indicatorHeightSM,
        fontSize: textFontSizeSM,
        lineHeight: unit(indicatorHeightSM),
        borderRadius: calc(indicatorHeightSM).div(2).equal()
      },
      [`${componentCls}-multiple-words`]: {
        padding: `0 ${unit(token.paddingXS)}`,
        bdi: {
          unicodeBidi: "plaintext"
        }
      },
      [`${componentCls}-dot`]: {
        zIndex: token.indicatorZIndex,
        width: dotSize,
        minWidth: dotSize,
        height: dotSize,
        background: token.badgeColor,
        borderRadius: "100%",
        boxShadow: `0 0 0 ${unit(badgeShadowSize)} ${token.badgeShadowColor}`
      },
      [`${componentCls}-count, ${componentCls}-dot, ${numberPrefixCls}-custom-component`]: {
        position: "absolute",
        top: 0,
        insetInlineEnd: 0,
        transform: "translate(50%, -50%)",
        transformOrigin: "100% 0%",
        [`&${iconCls}-spin`]: {
          animationName: antBadgeLoadingCircle,
          animationDuration: "1s",
          animationIterationCount: "infinite",
          animationTimingFunction: "linear"
        }
      },
      [`&${componentCls}-status`]: {
        lineHeight: "inherit",
        verticalAlign: "baseline",
        [`${componentCls}-status-dot`]: {
          position: "relative",
          top: -1,
          // Magic number, but seems better experience
          display: "inline-block",
          width: statusSize,
          height: statusSize,
          verticalAlign: "middle",
          borderRadius: "50%"
        },
        [`${componentCls}-status-success`]: {
          backgroundColor: token.colorSuccess
        },
        [`${componentCls}-status-processing`]: {
          overflow: "visible",
          color: token.colorInfo,
          backgroundColor: token.colorInfo,
          borderColor: "currentcolor",
          "&::after": {
            position: "absolute",
            top: 0,
            insetInlineStart: 0,
            width: "100%",
            height: "100%",
            borderWidth: badgeShadowSize,
            borderStyle: "solid",
            borderColor: "inherit",
            borderRadius: "50%",
            animationName: antStatusProcessing,
            animationDuration: token.badgeProcessingDuration,
            animationIterationCount: "infinite",
            animationTimingFunction: "ease-in-out",
            content: '""'
          }
        },
        [`${componentCls}-status-default`]: {
          backgroundColor: token.colorTextPlaceholder
        },
        [`${componentCls}-status-error`]: {
          backgroundColor: token.colorError
        },
        [`${componentCls}-status-warning`]: {
          backgroundColor: token.colorWarning
        },
        [`${componentCls}-status-text`]: {
          marginInlineStart: marginXS,
          color: token.colorText,
          fontSize: token.fontSize
        }
      }
    }), colorPreset), {
      [`${componentCls}-zoom-appear, ${componentCls}-zoom-enter`]: {
        animationName: antZoomBadgeIn,
        animationDuration: token.motionDurationSlow,
        animationTimingFunction: token.motionEaseOutBack,
        animationFillMode: "both"
      },
      [`${componentCls}-zoom-leave`]: {
        animationName: antZoomBadgeOut,
        animationDuration: token.motionDurationSlow,
        animationTimingFunction: token.motionEaseOutBack,
        animationFillMode: "both"
      },
      [`&${componentCls}-not-a-wrapper`]: {
        [`${componentCls}-zoom-appear, ${componentCls}-zoom-enter`]: {
          animationName: antNoWrapperZoomBadgeIn,
          animationDuration: token.motionDurationSlow,
          animationTimingFunction: token.motionEaseOutBack
        },
        [`${componentCls}-zoom-leave`]: {
          animationName: antNoWrapperZoomBadgeOut,
          animationDuration: token.motionDurationSlow,
          animationTimingFunction: token.motionEaseOutBack
        },
        [`&:not(${componentCls}-status)`]: {
          verticalAlign: "middle"
        },
        [`${numberPrefixCls}-custom-component, ${componentCls}-count`]: {
          transform: "none"
        },
        [`${numberPrefixCls}-custom-component, ${numberPrefixCls}`]: {
          position: "relative",
          top: "auto",
          display: "block",
          transformOrigin: "50% 50%"
        }
      },
      [numberPrefixCls]: {
        overflow: "hidden",
        transition: `all ${token.motionDurationMid} ${token.motionEaseOutBack}`,
        [`${numberPrefixCls}-only`]: {
          position: "relative",
          display: "inline-block",
          height: indicatorHeight,
          transition: `all ${token.motionDurationSlow} ${token.motionEaseOutBack}`,
          WebkitTransformStyle: "preserve-3d",
          WebkitBackfaceVisibility: "hidden",
          [`> p${numberPrefixCls}-only-unit`]: {
            height: indicatorHeight,
            margin: 0,
            WebkitTransformStyle: "preserve-3d",
            WebkitBackfaceVisibility: "hidden"
          }
        },
        [`${numberPrefixCls}-symbol`]: {
          verticalAlign: "top"
        }
      },
      // ====================== RTL =======================
      "&-rtl": {
        direction: "rtl",
        [`${componentCls}-count, ${componentCls}-dot, ${numberPrefixCls}-custom-component`]: {
          transform: "translate(-50%, -50%)"
        }
      }
    })
  };
};
const prepareToken = (token) => {
  const {
    fontHeight,
    lineWidth,
    marginXS,
    colorBorderBg
  } = token;
  const badgeFontHeight = fontHeight;
  const badgeShadowSize = lineWidth;
  const badgeTextColor = token.colorTextLightSolid;
  const badgeColor = token.colorError;
  const badgeColorHover = token.colorErrorHover;
  const badgeToken = merge(token, {
    badgeFontHeight,
    badgeShadowSize,
    badgeTextColor,
    badgeColor,
    badgeColorHover,
    badgeShadowColor: colorBorderBg,
    badgeProcessingDuration: "1.2s",
    badgeRibbonOffset: marginXS,
    // Follow token just by Design. Not related with token
    badgeRibbonCornerTransform: "scaleY(0.75)",
    badgeRibbonCornerFilter: `brightness(75%)`
  });
  return badgeToken;
};
const prepareComponentToken = (token) => {
  const {
    fontSize,
    lineHeight,
    fontSizeSM,
    lineWidth
  } = token;
  return {
    indicatorZIndex: "auto",
    indicatorHeight: Math.round(fontSize * lineHeight) - 2 * lineWidth,
    indicatorHeightSM: fontSize,
    dotSize: fontSizeSM / 2,
    textFontSize: fontSizeSM,
    textFontSizeSM: fontSizeSM,
    textFontWeight: "normal",
    statusSize: fontSizeSM / 2
  };
};
const useStyle$1 = genStyleHooks("Badge", (token) => {
  const badgeToken = prepareToken(token);
  return genSharedBadgeStyle(badgeToken);
}, prepareComponentToken);
const genRibbonStyle = (token) => {
  const {
    antCls,
    badgeFontHeight,
    marginXS,
    badgeRibbonOffset,
    calc
  } = token;
  const ribbonPrefixCls = `${antCls}-ribbon`;
  const ribbonWrapperPrefixCls = `${antCls}-ribbon-wrapper`;
  const statusRibbonPreset = genPresetColor(token, (colorKey, {
    darkColor
  }) => ({
    [`&${ribbonPrefixCls}-color-${colorKey}`]: {
      background: darkColor,
      color: darkColor
    }
  }));
  return {
    [ribbonWrapperPrefixCls]: {
      position: "relative"
    },
    [ribbonPrefixCls]: Object.assign(Object.assign(Object.assign(Object.assign({}, resetComponent(token)), {
      position: "absolute",
      top: marginXS,
      padding: `0 ${unit(token.paddingXS)}`,
      color: token.colorPrimary,
      lineHeight: unit(badgeFontHeight),
      whiteSpace: "nowrap",
      backgroundColor: token.colorPrimary,
      borderRadius: token.borderRadiusSM,
      [`${ribbonPrefixCls}-text`]: {
        color: token.badgeTextColor
      },
      [`${ribbonPrefixCls}-corner`]: {
        position: "absolute",
        top: "100%",
        width: badgeRibbonOffset,
        height: badgeRibbonOffset,
        color: "currentcolor",
        border: `${unit(calc(badgeRibbonOffset).div(2).equal())} solid`,
        transform: token.badgeRibbonCornerTransform,
        transformOrigin: "top",
        filter: token.badgeRibbonCornerFilter
      }
    }), statusRibbonPreset), {
      [`&${ribbonPrefixCls}-placement-end`]: {
        insetInlineEnd: calc(badgeRibbonOffset).mul(-1).equal(),
        borderEndEndRadius: 0,
        [`${ribbonPrefixCls}-corner`]: {
          insetInlineEnd: 0,
          borderInlineEndColor: "transparent",
          borderBlockEndColor: "transparent"
        }
      },
      [`&${ribbonPrefixCls}-placement-start`]: {
        insetInlineStart: calc(badgeRibbonOffset).mul(-1).equal(),
        borderEndStartRadius: 0,
        [`${ribbonPrefixCls}-corner`]: {
          insetInlineStart: 0,
          borderBlockEndColor: "transparent",
          borderInlineStartColor: "transparent"
        }
      },
      // ====================== RTL =======================
      "&-rtl": {
        direction: "rtl"
      }
    })
  };
};
const useStyle = genStyleHooks(["Badge", "Ribbon"], (token) => {
  const badgeToken = prepareToken(token);
  return genRibbonStyle(badgeToken);
}, prepareComponentToken);
const Ribbon = (props) => {
  const {
    className,
    prefixCls: customizePrefixCls,
    style,
    color,
    children,
    text: text2,
    placement = "end",
    rootClassName
  } = props;
  const {
    getPrefixCls,
    direction
  } = reactExports.useContext(ConfigContext);
  const prefixCls = getPrefixCls("ribbon", customizePrefixCls);
  const wrapperCls = `${prefixCls}-wrapper`;
  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls, wrapperCls);
  const colorInPreset = isPresetColor(color, false);
  const ribbonCls = classNames(prefixCls, `${prefixCls}-placement-${placement}`, {
    [`${prefixCls}-rtl`]: direction === "rtl",
    [`${prefixCls}-color-${color}`]: colorInPreset
  }, className);
  const colorStyle = {};
  const cornerColorStyle = {};
  if (color && !colorInPreset) {
    colorStyle.background = color;
    cornerColorStyle.color = color;
  }
  return wrapCSSVar(/* @__PURE__ */ reactExports.createElement("div", {
    className: classNames(wrapperCls, rootClassName, hashId, cssVarCls)
  }, children, /* @__PURE__ */ reactExports.createElement("div", {
    className: classNames(ribbonCls, hashId),
    style: Object.assign(Object.assign({}, colorStyle), style)
  }, /* @__PURE__ */ reactExports.createElement("span", {
    className: `${prefixCls}-text`
  }, text2), /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-corner`,
    style: cornerColorStyle
  }))));
};
const UnitNumber = (props) => {
  const {
    prefixCls,
    value,
    current,
    offset = 0
  } = props;
  let style;
  if (offset) {
    style = {
      position: "absolute",
      top: `${offset}00%`,
      left: 0
    };
  }
  return /* @__PURE__ */ reactExports.createElement("span", {
    style,
    className: classNames(`${prefixCls}-only-unit`, {
      current
    })
  }, value);
};
function getOffset(start, end, unit2) {
  let index2 = start;
  let offset = 0;
  while ((index2 + 10) % 10 !== end) {
    index2 += unit2;
    offset += unit2;
  }
  return offset;
}
const SingleNumber = (props) => {
  const {
    prefixCls,
    count: originCount,
    value: originValue
  } = props;
  const value = Number(originValue);
  const count2 = Math.abs(originCount);
  const [prevValue, setPrevValue] = reactExports.useState(value);
  const [prevCount, setPrevCount] = reactExports.useState(count2);
  const onTransitionEnd = () => {
    setPrevValue(value);
    setPrevCount(count2);
  };
  reactExports.useEffect(() => {
    const timer = setTimeout(onTransitionEnd, 1e3);
    return () => clearTimeout(timer);
  }, [value]);
  let unitNodes;
  let offsetStyle;
  if (prevValue === value || Number.isNaN(value) || Number.isNaN(prevValue)) {
    unitNodes = [/* @__PURE__ */ reactExports.createElement(UnitNumber, Object.assign({}, props, {
      key: value,
      current: true
    }))];
    offsetStyle = {
      transition: "none"
    };
  } else {
    unitNodes = [];
    const end = value + 10;
    const unitNumberList = [];
    for (let index2 = value; index2 <= end; index2 += 1) {
      unitNumberList.push(index2);
    }
    const unit2 = prevCount < count2 ? 1 : -1;
    const prevIndex = unitNumberList.findIndex((n) => n % 10 === prevValue);
    const cutUnitNumberList = unit2 < 0 ? unitNumberList.slice(0, prevIndex + 1) : unitNumberList.slice(prevIndex);
    unitNodes = cutUnitNumberList.map((n, index2) => {
      const singleUnit = n % 10;
      return /* @__PURE__ */ reactExports.createElement(UnitNumber, Object.assign({}, props, {
        key: n,
        value: singleUnit,
        offset: unit2 < 0 ? index2 - prevIndex : index2,
        current: index2 === prevIndex
      }));
    });
    offsetStyle = {
      transform: `translateY(${-getOffset(prevValue, value, unit2)}00%)`
    };
  }
  return /* @__PURE__ */ reactExports.createElement("span", {
    className: `${prefixCls}-only`,
    style: offsetStyle,
    onTransitionEnd
  }, unitNodes);
};
var __rest$1 = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const ScrollNumber = /* @__PURE__ */ reactExports.forwardRef((props, ref) => {
  const {
    prefixCls: customizePrefixCls,
    count: count2,
    className,
    motionClassName,
    style,
    title: title2,
    show,
    component: Component = "sup",
    children
  } = props, restProps = __rest$1(props, ["prefixCls", "count", "className", "motionClassName", "style", "title", "show", "component", "children"]);
  const {
    getPrefixCls
  } = reactExports.useContext(ConfigContext);
  const prefixCls = getPrefixCls("scroll-number", customizePrefixCls);
  const newProps = Object.assign(Object.assign({}, restProps), {
    "data-show": show,
    style,
    className: classNames(prefixCls, className, motionClassName),
    title: title2
  });
  let numberNodes = count2;
  if (count2 && Number(count2) % 1 === 0) {
    const numberList = String(count2).split("");
    numberNodes = /* @__PURE__ */ reactExports.createElement("bdi", null, numberList.map((num, i) => /* @__PURE__ */ reactExports.createElement(SingleNumber, {
      prefixCls,
      count: Number(count2),
      value: num,
      // eslint-disable-next-line react/no-array-index-key
      key: numberList.length - i
    })));
  }
  if (style === null || style === void 0 ? void 0 : style.borderColor) {
    newProps.style = Object.assign(Object.assign({}, style), {
      boxShadow: `0 0 0 1px ${style.borderColor} inset`
    });
  }
  if (children) {
    return cloneElement(children, (oriProps) => ({
      className: classNames(`${prefixCls}-custom-component`, oriProps === null || oriProps === void 0 ? void 0 : oriProps.className, motionClassName)
    }));
  }
  return /* @__PURE__ */ reactExports.createElement(Component, Object.assign({}, newProps, {
    ref
  }), numberNodes);
});
var __rest = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const InternalBadge = /* @__PURE__ */ reactExports.forwardRef((props, ref) => {
  var _a, _b, _c, _d, _e;
  const {
    prefixCls: customizePrefixCls,
    scrollNumberPrefixCls: customizeScrollNumberPrefixCls,
    children,
    status,
    text: text2,
    color,
    count: count2 = null,
    overflowCount = 99,
    dot: dot2 = false,
    size = "default",
    title: title2,
    offset,
    style,
    className,
    rootClassName,
    classNames: classNames$1,
    styles: styles2,
    showZero = false
  } = props, restProps = __rest(props, ["prefixCls", "scrollNumberPrefixCls", "children", "status", "text", "color", "count", "overflowCount", "dot", "size", "title", "offset", "style", "className", "rootClassName", "classNames", "styles", "showZero"]);
  const {
    getPrefixCls,
    direction,
    badge
  } = reactExports.useContext(ConfigContext);
  const prefixCls = getPrefixCls("badge", customizePrefixCls);
  const [wrapCSSVar, hashId, cssVarCls] = useStyle$1(prefixCls);
  const numberedDisplayCount = count2 > overflowCount ? `${overflowCount}+` : count2;
  const isZero = numberedDisplayCount === "0" || numberedDisplayCount === 0 || text2 === "0" || text2 === 0;
  const ignoreCount = count2 === null || isZero && !showZero;
  const hasStatus = (status !== null && status !== void 0 || color !== null && color !== void 0) && ignoreCount;
  const hasStatusValue = status !== null && status !== void 0 || !isZero;
  const showAsDot = dot2 && !isZero;
  const mergedCount = showAsDot ? "" : numberedDisplayCount;
  const isHidden = reactExports.useMemo(() => {
    const isEmpty = (mergedCount === null || mergedCount === void 0 || mergedCount === "") && (text2 === void 0 || text2 === null || text2 === "");
    return (isEmpty || isZero && !showZero) && !showAsDot;
  }, [mergedCount, isZero, showZero, showAsDot, text2]);
  const countRef = reactExports.useRef(count2);
  if (!isHidden) {
    countRef.current = count2;
  }
  const livingCount = countRef.current;
  const displayCountRef = reactExports.useRef(mergedCount);
  if (!isHidden) {
    displayCountRef.current = mergedCount;
  }
  const displayCount = displayCountRef.current;
  const isDotRef = reactExports.useRef(showAsDot);
  if (!isHidden) {
    isDotRef.current = showAsDot;
  }
  const mergedStyle = reactExports.useMemo(() => {
    if (!offset) {
      return Object.assign(Object.assign({}, badge === null || badge === void 0 ? void 0 : badge.style), style);
    }
    const offsetStyle = {
      marginTop: offset[1]
    };
    if (direction === "rtl") {
      offsetStyle.left = Number.parseInt(offset[0], 10);
    } else {
      offsetStyle.right = -Number.parseInt(offset[0], 10);
    }
    return Object.assign(Object.assign(Object.assign({}, offsetStyle), badge === null || badge === void 0 ? void 0 : badge.style), style);
  }, [direction, offset, style, badge === null || badge === void 0 ? void 0 : badge.style]);
  const titleNode = title2 !== null && title2 !== void 0 ? title2 : typeof livingCount === "string" || typeof livingCount === "number" ? livingCount : void 0;
  const showStatusTextNode = !isHidden && (text2 === 0 ? showZero : !!text2 && text2 !== true);
  const statusTextNode = !showStatusTextNode ? null : /* @__PURE__ */ reactExports.createElement("span", {
    className: `${prefixCls}-status-text`
  }, text2);
  const displayNode = !livingCount || typeof livingCount !== "object" ? void 0 : cloneElement(livingCount, (oriProps) => ({
    style: Object.assign(Object.assign({}, mergedStyle), oriProps.style)
  }));
  const isInternalColor = isPresetColor(color, false);
  const statusCls = classNames(classNames$1 === null || classNames$1 === void 0 ? void 0 : classNames$1.indicator, (_a = badge === null || badge === void 0 ? void 0 : badge.classNames) === null || _a === void 0 ? void 0 : _a.indicator, {
    [`${prefixCls}-status-dot`]: hasStatus,
    [`${prefixCls}-status-${status}`]: !!status,
    [`${prefixCls}-color-${color}`]: isInternalColor
  });
  const statusStyle = {};
  if (color && !isInternalColor) {
    statusStyle.color = color;
    statusStyle.background = color;
  }
  const badgeClassName = classNames(prefixCls, {
    [`${prefixCls}-status`]: hasStatus,
    [`${prefixCls}-not-a-wrapper`]: !children,
    [`${prefixCls}-rtl`]: direction === "rtl"
  }, className, rootClassName, badge === null || badge === void 0 ? void 0 : badge.className, (_b = badge === null || badge === void 0 ? void 0 : badge.classNames) === null || _b === void 0 ? void 0 : _b.root, classNames$1 === null || classNames$1 === void 0 ? void 0 : classNames$1.root, hashId, cssVarCls);
  if (!children && hasStatus && (text2 || hasStatusValue || !ignoreCount)) {
    const statusTextColor = mergedStyle.color;
    return wrapCSSVar(/* @__PURE__ */ reactExports.createElement("span", Object.assign({}, restProps, {
      className: badgeClassName,
      style: Object.assign(Object.assign(Object.assign({}, styles2 === null || styles2 === void 0 ? void 0 : styles2.root), (_c = badge === null || badge === void 0 ? void 0 : badge.styles) === null || _c === void 0 ? void 0 : _c.root), mergedStyle)
    }), /* @__PURE__ */ reactExports.createElement("span", {
      className: statusCls,
      style: Object.assign(Object.assign(Object.assign({}, styles2 === null || styles2 === void 0 ? void 0 : styles2.indicator), (_d = badge === null || badge === void 0 ? void 0 : badge.styles) === null || _d === void 0 ? void 0 : _d.indicator), statusStyle)
    }), showStatusTextNode && /* @__PURE__ */ reactExports.createElement("span", {
      style: {
        color: statusTextColor
      },
      className: `${prefixCls}-status-text`
    }, text2)));
  }
  return wrapCSSVar(/* @__PURE__ */ reactExports.createElement("span", Object.assign({
    ref
  }, restProps, {
    className: badgeClassName,
    style: Object.assign(Object.assign({}, (_e = badge === null || badge === void 0 ? void 0 : badge.styles) === null || _e === void 0 ? void 0 : _e.root), styles2 === null || styles2 === void 0 ? void 0 : styles2.root)
  }), children, /* @__PURE__ */ reactExports.createElement(CSSMotion, {
    visible: !isHidden,
    motionName: `${prefixCls}-zoom`,
    motionAppear: false,
    motionDeadline: 1e3
  }, ({
    className: motionClassName
  }) => {
    var _a2, _b2;
    const scrollNumberPrefixCls = getPrefixCls("scroll-number", customizeScrollNumberPrefixCls);
    const isDot = isDotRef.current;
    const scrollNumberCls = classNames(classNames$1 === null || classNames$1 === void 0 ? void 0 : classNames$1.indicator, (_a2 = badge === null || badge === void 0 ? void 0 : badge.classNames) === null || _a2 === void 0 ? void 0 : _a2.indicator, {
      [`${prefixCls}-dot`]: isDot,
      [`${prefixCls}-count`]: !isDot,
      [`${prefixCls}-count-sm`]: size === "small",
      [`${prefixCls}-multiple-words`]: !isDot && displayCount && displayCount.toString().length > 1,
      [`${prefixCls}-status-${status}`]: !!status,
      [`${prefixCls}-color-${color}`]: isInternalColor
    });
    let scrollNumberStyle = Object.assign(Object.assign(Object.assign({}, styles2 === null || styles2 === void 0 ? void 0 : styles2.indicator), (_b2 = badge === null || badge === void 0 ? void 0 : badge.styles) === null || _b2 === void 0 ? void 0 : _b2.indicator), mergedStyle);
    if (color && !isInternalColor) {
      scrollNumberStyle = scrollNumberStyle || {};
      scrollNumberStyle.background = color;
    }
    return /* @__PURE__ */ reactExports.createElement(ScrollNumber, {
      prefixCls: scrollNumberPrefixCls,
      show: !isHidden,
      motionClassName,
      className: scrollNumberCls,
      count: displayCount,
      title: titleNode,
      style: scrollNumberStyle,
      key: "scrollNumber"
    }, displayNode);
  }), statusTextNode));
});
const Badge = InternalBadge;
Badge.Ribbon = Ribbon;
var PaperClipOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M779.3 196.6c-94.2-94.2-247.6-94.2-341.7 0l-261 260.8c-1.7 1.7-2.6 4-2.6 6.4s.9 4.7 2.6 6.4l36.9 36.9a9 9 0 0012.7 0l261-260.8c32.4-32.4 75.5-50.2 121.3-50.2s88.9 17.8 121.2 50.2c32.4 32.4 50.2 75.5 50.2 121.2 0 45.8-17.8 88.8-50.2 121.2l-266 265.9-43.1 43.1c-40.3 40.3-105.8 40.3-146.1 0-19.5-19.5-30.2-45.4-30.2-73s10.7-53.5 30.2-73l263.9-263.8c6.7-6.6 15.5-10.3 24.9-10.3h.1c9.4 0 18.1 3.7 24.7 10.3 6.7 6.7 10.3 15.5 10.3 24.9 0 9.3-3.7 18.1-10.3 24.7L372.4 653c-1.7 1.7-2.6 4-2.6 6.4s.9 4.7 2.6 6.4l36.9 36.9a9 9 0 0012.7 0l215.6-215.6c19.9-19.9 30.8-46.3 30.8-74.4s-11-54.6-30.8-74.4c-41.1-41.1-107.9-41-149 0L463 364 224.8 602.1A172.22 172.22 0 00174 724.8c0 46.3 18.1 89.8 50.8 122.5 33.9 33.8 78.3 50.7 122.7 50.7 44.4 0 88.8-16.9 122.6-50.7l309.2-309C824.8 492.7 850 432 850 367.5c.1-64.6-25.1-125.3-70.7-170.9z" } }] }, "name": "paper-clip", "theme": "outlined" };
var PaperClipOutlined = function PaperClipOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: PaperClipOutlined$1
  }));
};
var RefIcon$2 = /* @__PURE__ */ reactExports.forwardRef(PaperClipOutlined);
var PauseCircleOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm-88-532h-48c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8zm224 0h-48c-4.4 0-8 3.6-8 8v304c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V360c0-4.4-3.6-8-8-8z" } }] }, "name": "pause-circle", "theme": "outlined" };
var PauseCircleOutlined = function PauseCircleOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: PauseCircleOutlined$1
  }));
};
var RefIcon$1 = /* @__PURE__ */ reactExports.forwardRef(PauseCircleOutlined);
var SyncOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M168 504.2c1-43.7 10-86.1 26.9-126 17.3-41 42.1-77.7 73.7-109.4S337 212.3 378 195c42.4-17.9 87.4-27 133.9-27s91.5 9.1 133.8 27A341.5 341.5 0 01755 268.8c9.9 9.9 19.2 20.4 27.8 31.4l-60.2 47a8 8 0 003 14.1l175.7 43c5 1.2 9.9-2.6 9.9-7.7l.8-180.9c0-6.7-7.7-10.5-12.9-6.3l-56.4 44.1C765.8 155.1 646.2 92 511.8 92 282.7 92 96.3 275.6 92 503.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8zm756 7.8h-60c-4.4 0-7.9 3.5-8 7.8-1 43.7-10 86.1-26.9 126-17.3 41-42.1 77.8-73.7 109.4A342.45 342.45 0 01512.1 856a342.24 342.24 0 01-243.2-100.8c-9.9-9.9-19.2-20.4-27.8-31.4l60.2-47a8 8 0 00-3-14.1l-175.7-43c-5-1.2-9.9 2.6-9.9 7.7l-.7 181c0 6.7 7.7 10.5 12.9 6.3l56.4-44.1C258.2 868.9 377.8 932 512.2 932c229.2 0 415.5-183.7 419.8-411.8a8 8 0 00-8-8.2z" } }] }, "name": "sync", "theme": "outlined" };
var SyncOutlined = function SyncOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: SyncOutlined$1
  }));
};
var RefIcon = /* @__PURE__ */ reactExports.forwardRef(SyncOutlined);
function queryIsTaskTerminalSuccess(status) {
  return status === "done" || status === "skipped";
}
function queryIsTaskWorkflowSucceeded(session, running, awaitUserReason) {
  if (!session || running || awaitUserReason) return false;
  const tasks = session.tasks ?? [];
  if (tasks.length === 0) return false;
  const sessionType = querySessionType(session);
  if (sessionType === "chat") return false;
  return tasks.every((task) => queryIsTaskTerminalSuccess(task.status));
}
const STICKY_BOTTOM_THRESHOLD_PX = 96;
function useElementStickToBottom(scrollRef, { enabled = true, deps = [] } = {}) {
  const stickToBottomRef = reactExports.useRef(true);
  const onScroll = reactExports.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceToBottom <= STICKY_BOTTOM_THRESHOLD_PX;
  }, [scrollRef]);
  reactExports.useEffect(() => {
    if (!enabled) return;
    if (!stickToBottomRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [enabled, scrollRef, ...deps]);
  return { onScroll };
}
function useBrowserControl() {
  const [browserRunning, setBrowserRunning] = reactExports.useState(false);
  const [loading2, setLoading] = reactExports.useState(false);
  const syncStatus = reactExports.useCallback(async () => {
    try {
      const status = await queryBrowserStatus();
      setBrowserRunning(status.running);
    } catch {
      setBrowserRunning(false);
    }
  }, []);
  reactExports.useEffect(() => {
    void syncStatus();
    const timer = window.setInterval(() => {
      void syncStatus();
    }, 2e3);
    return () => window.clearInterval(timer);
  }, [syncStatus]);
  const toggleBrowser = reactExports.useCallback(async () => {
    setLoading(true);
    try {
      const status = browserRunning ? await postBrowserClose() : await postBrowserStart();
      setBrowserRunning(status.running);
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "浏览器操作失败");
      await syncStatus();
    } finally {
      setLoading(false);
    }
  }, [browserRunning, syncStatus]);
  return { browserRunning, loading: loading2, toggleBrowser };
}
const QUICK_TASK_CARDS = [
  {
    title: "一句话生成视频",
    desc: "编剧→分镜→场景素材→剪辑成片，自动多 Agent 协作",
    prompt: "请根据这一句话创作短视频并自动成片：「一只橘猫在雨夜的便利店门口等主人」。先生成剧本与分镜，再生成场景素材，最后合成视频，告诉我成片路径。"
  },
  {
    title: "今日天气推送",
    desc: "查询本地天气并推送到已配置的通知渠道",
    prompt: "请用 query_weather 获取今日天气，再调用 notify_message 推送到我已配置的通知渠道（可多渠道）。"
  },
  {
    title: "打开小红书第二篇笔记",
    desc: "打开智能体浏览器，定位并查看第二篇可见笔记",
    prompt: "请直接打开智能体浏览器，打开小红书并点击第二篇可见笔记，提取标题作者点赞等信息。"
  },
  {
    title: "创建 Word 文档",
    desc: "根据主题自动生成结构化文档并保存到本地",
    prompt: "帮我创建一份关于今日 AI 热点的 Word 文档，包含摘要、要点分析和结论，保存到桌面。"
  },
  {
    title: "制作图片海报",
    desc: "根据文案主题生成适合社交平台的配图海报",
    prompt: "帮我制作一张关于今日热点的图片海报，风格简洁现代，适合小红书发布。"
  },
  {
    title: "设置定时任务",
    desc: "创建周期性执行的自动化任务计划",
    prompt: '请用 post_scheduled_task 帮我创建一个定时任务：每天早上 9 点（daily，timesOfDay ["09:00"]）用 custom_prompt 搜索 AI 热点并生成摘要。标题自拟，默认不要启用，等我确认后再启用。'
  },
  {
    title: "创建发布计划",
    desc: "编排多渠道子任务，供定时或手动发布引用",
    prompt: "请用 post_publish_plan 创建一个普通发布计划：标题「每日热点速递」，包含 1 个子任务，渠道 xhs，contentPrompt 说明根据今日科技热点撰写小红书笔记并配图。创建后把计划 id 告诉我。"
  },
  {
    title: "添加一条规则",
    desc: "写入 Agent 用户规则，下轮对话起生效",
    prompt: "请用 post_agent_rule 添加一条规则：名称「回复风格」，正文要求所有回答简洁、分点列出，优先给出可执行步骤。保存后提醒我下一轮对话起生效。"
  },
  {
    title: "发一条抖音图文",
    desc: "从来源网页抓取配图，生成标题正文并发布到抖音创作者中心",
    prompt: "帮我发一条抖音图文，内容关于今日热点。请先 fetch_hot_topics（source 优先 douyin）选题，再找相关新闻来源页，用 fetch_web_images 抓取配图，再调用 douyin_publish_note 发布；标题不超过20字。我本地上传图片仅作可选补充。"
  },
  {
    title: "发一条小红书",
    desc: "从来源网页抓取配图，生成标题正文并发布（本地上传可选）",
    prompt: "帮我发一条小红书，内容关于今日热点。请先 fetch_hot_topics（source 优先 weibo 或 baidu）选题，再找相关新闻来源页，用 fetch_web_images 抓取配图，再发布；标题不超过20字。我本地上传图片为可选补充。"
  },
  {
    title: "AI 热点速览",
    desc: "拉取今日科技/AI 热点，整理成可读摘要",
    prompt: "请用 fetch_hot_topics 获取今日 AI 与科技热点（source 依次尝试 weibo、baidu、douyin、tencent），整理成 5 条要点摘要（注明各条来源平台），用简洁中文回复。"
  },
  {
    title: "A股实时分析",
    desc: "查询个股行情与实时分析，给出简要判断",
    prompt: "请用 query_ashare_realtime_analysis 分析贵州茅台（600519）今日走势，结合 query_ashare_kline 补充近期 K 线要点，给出简洁结论。"
  },
  {
    title: "Remotion 短片成片",
    desc: "初始化 Remotion 项目并渲染可预览成片",
    prompt: "请用 Remotion 做一支 15 秒科技感标题短片（包含背景音）：初始化项目、打开 Studio 预览，再渲染成片并告诉我输出路径。"
  },
  {
    title: "网页资料调研",
    desc: "按主题检索网页资料并汇总关键结论",
    prompt: "请用 query_web_data 调研「大模型 Agent 工作流」最新进展，汇总 3–5 条要点与可信来源链接。"
  },
  {
    title: "多渠道消息通知",
    desc: "把一段摘要推送到已配置的全部通知渠道",
    prompt: "请把下面摘要推送到我已配置的通知渠道：「今日任务已完成，请查收成片与文档。」使用 notify_message。"
  },
  {
    title: "生成一张配图",
    desc: "按主题生成图片并保存到本地资产",
    prompt: "请用 generate_image 生成一张「清晨窗边绿植与咖啡杯」的竖版配图，风格清新自然，完成后告诉我保存路径。"
  },
  {
    title: "浏览器打开并摘录",
    desc: "打开指定网页，提取标题与正文要点",
    prompt: "请打开智能体浏览器访问 https://www.bing.com/news，截取当前可见新闻列表的前 3 条标题与摘要。"
  },
  {
    title: "用技能包处理任务",
    desc: "先查看可用技能，再按最合适的技能执行",
    prompt: "请先查看可用技能包，选择最合适的技能帮我「整理一份可复用的周报写作模板」，并保存为本地 Markdown。"
  },
  {
    title: "热搜改小红书笔记",
    desc: "拉取今日热点→抓配图→生成标题正文并发布",
    prompt: "请先用 fetch_hot_topics 获取今日热点（source 优先 weibo，失败再试 baidu/douyin/tencent），选一条适合小红书的话题；再找相关新闻页用 fetch_web_images 抓配图，最后调用 xhs_publish_note 发布，标题不超过20字。"
  },
  {
    title: "热搜改抖音图文",
    desc: "热点选题→网页配图→抖音创作者中心发布",
    prompt: "请先用 fetch_hot_topics 拿今日热点（source 优先 douyin，失败再试 weibo/baidu/tencent），选一条适合抖音的话题；用 fetch_web_images 从新闻来源页下载配图，再调用 douyin_publish_note 发布，标题不超过20字。"
  },
  {
    title: "写剧本并出分镜",
    desc: "一句话扩写剧本，并生成结构化分镜 JSON",
    prompt: "主题：「深夜加班的程序员在便利店遇见未来的自己」。请先扩写完整剧本并用 generate_script 落盘，再调用 generate_storyboard 生成 4–6 镜竖版分镜（含运镜与画幅）。"
  },
  {
    title: "分镜生成场景素材",
    desc: "按分镜表生成关键帧、动效视频与旁白音频",
    prompt: "请基于当前会话已有的 storyboard.json（若没有则先生成分镜），调用 generate_scene_assets 为每镜生成关键帧、视频片段与 TTS 旁白，并汇总各素材路径。"
  },
  {
    title: "素材合成视频成片",
    desc: "将已生成的场景素材剪辑合成为完整 mp4",
    prompt: "请检查当前会话是否已有场景视频/音频素材；若有则调用 compose_video 合成竖版成片，并告诉我最终 mp4 路径与时长。"
  },
  {
    title: "Remotion 字幕短片",
    desc: "初始化工程→编写动效字幕→预览并渲染 mp4",
    prompt: "请用 Remotion 做一支 10 秒竖版字幕短片：文案「今日 AI 热点速览」。流程：remotion_init_project → write_file 编写 Composition → remotion_studio 预览 → 我确认后 remotion_render 导出。"
  },
  {
    title: "多只 A 股 K 线",
    desc: "批量查询个股 K 线数据并对比要点",
    prompt: "请用 query_ashare_kline 查询贵州茅台（600519）、宁德时代（300750）、比亚迪（002594）近一月日 K 线，整理涨跌幅与量能变化要点。"
  },
  {
    title: "查询今日天气",
    desc: "获取指定城市实时天气与气温湿度",
    prompt: "请用 query_weather 查询上海今日天气，包含气温、湿度、风力与简要穿衣建议。"
  },
  {
    title: "网页批量抓配图",
    desc: "从来源页下载高清配图到本地 artifacts",
    prompt: "请用 fetch_web_images 从这篇科技新闻页抓取 3 张适合社交发布的配图：https://www.bing.com/news/search?q=AI+agent ，并列出本地绝对路径。"
  },
  {
    title: "总结附件并另存",
    desc: "读取本轮上传附件，提炼要点写入新文件",
    prompt: "请先 list_attachments 查看我上传的附件，用 read_file 读取内容后提炼 5 条要点，再用 write_file 保存为「附件摘要.md」。若没有附件请提示我上传。"
  },
  {
    title: "保存调研笔记",
    desc: "联网调研后写入本地 Markdown 备忘",
    prompt: "请用 query_web_data 调研「2026 年大模型 Agent 桌面助手」趋势，整理 5 条要点与来源链接，并用 write_file 保存为 artifacts/ai-agent-trends.md。"
  },
  {
    title: "网络搜索并摘录",
    desc: "优先 Bing 搜索关键词，失败自动改百度",
    prompt: "请用 web_search 搜索「Remotion React 视频教程」，整理前 5 条结果的标题、链接与摘要（工具内部优先 Bing，失败会改百度）。"
  },
  {
    title: "看图理解附件",
    desc: "识别用户上传图片内容并给出结构化说明",
    prompt: "请先 list_attachments 查看我是否上传了图片；若有则切换到 vision 能力识图，说明画面主体、文字内容与可改进建议。没有图片请提示我上传。"
  },
  {
    title: "深度推理排障",
    desc: "切换推理模型，分析复杂问题并给出根因",
    prompt: "请切换到 reasoning 能力：我的 Electron 应用在打包后白屏但 dev 正常，请按「现象→可能根因→验证步骤→修复建议」四段式给出排查方案。"
  },
  {
    title: "撰稿模型写文案",
    desc: "用对话模型生成多版小红书标题正文",
    prompt: "请保持 chat 能力，为主题「春季露营装备清单」写 3 版小红书文案（每版含标题≤20字+正文≤300字），风格分别偏实用、氛围感、种草。"
  },
  {
    title: "两种成片方案让我选",
    desc: "复杂任务先列方案，确认后再执行",
    prompt: "我想做一支 30 秒产品宣传片。请先调用 present_plan_choices 给我 2 个方案：A）AI 分镜管线自动成片；B）Remotion 字幕动效模板。说明各自优劣，等我选择后再继续。"
  },
  {
    title: "热点摘要并推送",
    desc: "抓取热点→整理摘要→多渠道通知",
    prompt: "请用 fetch_hot_topics 获取今日科技热点（source 依次 weibo、baidu、douyin、tencent），整理 5 条中文摘要，再调用 notify_message 推送到我已配置的全部通知渠道。"
  },
  {
    title: "热点生成社交配图",
    desc: "拉取热点选题，用文生图生成原创海报",
    prompt: "请先用 fetch_hot_topics（source 优先 weibo 或 douyin）选一条适合传播的热点，再调用 generate_image 生成一张竖版原创海报（非网图），风格简洁现代，并告诉我保存路径。"
  },
  {
    title: "小红书抖音同题双发",
    desc: "同一主题分别适配两平台并串行发布",
    prompt: "主题：今日 AI 行业要闻速览。请先 fetch_hot_topics（weibo/douyin/tencent）调研并撰写内容，分别生成适合小红书和抖音的标题正文；各平台用 fetch_web_images 抓配图后，先 xhs_publish_note 再 douyin_publish_note 发布。"
  },
  {
    title: "拆解任务进度清单",
    desc: "多步骤任务先列清单，逐步更新执行状态",
    prompt: "请帮我完成「调研今日天气→写 100 字出行建议→推送通知」：先用 update_task_list 列出 3 步任务清单，再逐步执行并在每步完成后更新状态。"
  },
  {
    title: "生成竖版产品海报",
    desc: "文生图生成 9:16 原创配图，适合短视频封面",
    prompt: "请用 generate_image 生成一张 9:16 竖版产品海报：主题「智能办公助手」，主色蓝白，留白充足，适合作为短视频封面，完成后告诉我路径。"
  },
  {
    title: "读取本地文件并改写",
    desc: "读取已有文本，按新要求润色后写回",
    prompt: "请用 read_file 读取我指定的本地 Markdown 文件（若我不知道路径请先问我），按「更口语、适合小红书」的要求改写，并用 write_file 另存为「润色版.md」。"
  },
  {
    title: "股市收盘播报稿",
    desc: "实时分析+K线要点，生成口播稿并可选推送",
    prompt: "请用 query_ashare_realtime_analysis 分析沪指与创业板指今日表现，写成 200 字以内的口播稿；若我配置了通知渠道，再用 notify_message 推送摘要。"
  }
];
const QUICK_TASK_PAGE_SIZE = 8;
function shuffleCards(cards) {
  const next = [...cards];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }
  return next;
}
function queryNextQuickTaskBatch(pool, current, pageSize) {
  if (pool.length <= pageSize) {
    return shuffleCards(pool).slice(0, pageSize);
  }
  const currentTitles = new Set(current.map((c) => c.title));
  const others = pool.filter((c) => !currentTitles.has(c.title));
  const shuffledOthers = shuffleCards(others);
  if (shuffledOthers.length >= pageSize) {
    return shuffledOthers.slice(0, pageSize);
  }
  const need = pageSize - shuffledOthers.length;
  const fillers = shuffleCards(current).slice(0, need);
  return [...shuffledOthers, ...fillers];
}
function useQuickTaskBatch(pool, pageSize) {
  const [cards, setCards] = reactExports.useState(() => pool.slice(0, pageSize));
  const [batchKey, setBatchKey] = reactExports.useState(0);
  const canRefresh = pool.length > pageSize;
  const refresh = () => {
    setCards((prev) => queryNextQuickTaskBatch(pool, prev, pageSize));
    setBatchKey((k) => k + 1);
  };
  return { cards, batchKey, refresh, canRefresh };
}
const wrap$6 = "_wrap_1ai7f_1";
const title$2 = "_title_1ai7f_20";
const sub = "_sub_1ai7f_30";
const grid = "_grid_1ai7f_41";
const refreshRow = "_refreshRow_1ai7f_49";
const refreshBtn = "_refreshBtn_1ai7f_55";
const refreshIcon = "_refreshIcon_1ai7f_69";
const card$1 = "_card_1ai7f_79";
const cardTitle = "_cardTitle_1ai7f_115";
const cardDesc = "_cardDesc_1ai7f_132";
const styles$h = {
  wrap: wrap$6,
  title: title$2,
  sub,
  grid,
  refreshRow,
  refreshBtn,
  refreshIcon,
  card: card$1,
  cardTitle,
  cardDesc
};
const { Title: Title$1, Paragraph } = Typography;
function WelcomeHero({ onPick }) {
  const { cards, batchKey, refresh, canRefresh } = useQuickTaskBatch(
    QUICK_TASK_CARDS,
    QUICK_TASK_PAGE_SIZE
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$h.wrap, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Title$1, { level: 2, className: styles$h.title, children: "今天要处理哪块业务？" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Paragraph, { className: styles$h.sub, children: "全能助手：热点与天气、多渠道发布、剧本成片与定时通知。一句话即可走完调研→创作→发布，或编剧→分镜→成片。" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$h.grid, children: cards.map((card2, index2) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        className: styles$h.card,
        style: { "--card-index": index2 },
        onClick: () => onPick(card2.prompt),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$h.cardTitle, children: card2.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$h.cardDesc, children: card2.desc })
        ]
      },
      card2.title
    )) }, batchKey),
    canRefresh ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$h.refreshRow, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        type: "text",
        size: "small",
        className: styles$h.refreshBtn,
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, { className: styles$h.refreshIcon }),
        onClick: refresh,
        "aria-label": "换一批快捷任务",
        children: "换一批"
      }
    ) }) : null
  ] });
}
const WORKFLOW_INTERNAL_USER_PREFIXES = ["【工作流步骤】", "【条件分支】"];
function queryIsUiHiddenChatMessage(message) {
  if (message.hidden) return true;
  if (message.role === "system") return true;
  if (message.role !== "user") return false;
  const text2 = message.content?.trim() ?? "";
  return WORKFLOW_INTERNAL_USER_PREFIXES.some((prefix) => text2.startsWith(prefix));
}
const SYNTHETIC_TOOL_CALL_PREFIX = /^调用工具\s*:/;
function queryIsSyntheticToolCallContent(content) {
  return SYNTHETIC_TOOL_CALL_PREFIX.test(content.trim());
}
function queryAgentTimeline(messages) {
  const items = [];
  let i = 0;
  while (i < messages.length) {
    const msg = messages[i];
    if (msg.role === "user") {
      items.push({ kind: "user", message: msg });
      i += 1;
      continue;
    }
    if (msg.role === "assistant") {
      const declaredIds = new Set(
        (msg.toolCalls ?? []).map((tc) => tc.id).filter(Boolean)
      );
      const tools = [];
      let j = i + 1;
      if (declaredIds.size > 0) {
        const byCallId = /* @__PURE__ */ new Map();
        while (j < messages.length) {
          const next = messages[j];
          if (next.role !== "tool") break;
          const callId = next.toolCallId;
          if (!callId || !declaredIds.has(callId)) break;
          if (!byCallId.has(callId)) {
            byCallId.set(callId, next);
          }
          j += 1;
          if (byCallId.size >= declaredIds.size) break;
        }
        for (const tc of msg.toolCalls ?? []) {
          const toolMsg = byCallId.get(tc.id);
          if (toolMsg) tools.push(toolMsg);
        }
      }
      items.push({ kind: "step", assistant: msg, tools });
      i = j;
      continue;
    }
    if (msg.role === "tool") {
      items.push({ kind: "orphanTool", message: msg });
      i += 1;
      continue;
    }
    i += 1;
  }
  return items;
}
function queryTimelineEndsWithToolGroup(items) {
  const last = items[items.length - 1];
  if (!last) return false;
  if (last.kind === "orphanTool") return true;
  if (last.kind === "step") return last.tools.length > 0;
  return false;
}
const WORKFLOW_CTX_PREFIX = "@@workflow_ctx@@";
function queryDecodeWorkflowCtxMessage(content) {
  if (!content.startsWith(WORKFLOW_CTX_PREFIX)) return content;
  try {
    const parsed = JSON.parse(content.slice(WORKFLOW_CTX_PREFIX.length));
    return parsed.message != null ? String(parsed.message) : content;
  } catch {
    return content;
  }
}
const IMAGE_EXT_PATTERN = "(?:jpg|jpeg|png|webp|gif|bmp|svg)";
const PATH_PREFIX$2 = "(?:^|[\\s\\n：:,，`])(?!\\/\\/)";
const UNIX_PATH_RE = new RegExp(
  `${PATH_PREFIX$2}((?:/[^\\n"'<>|\`]+?)\\.(?:${IMAGE_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  "gim"
);
const WIN_PATH_RE = new RegExp(
  `${PATH_PREFIX$2}((?:[A-Za-z]:\\\\[^\\n"'<>|\`]+?)\\.(?:${IMAGE_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  "gim"
);
const MD_IMAGE_RE = /!\[[^\]]*]\(([^)]+)\)/g;
const REMOTE_IMAGE_RE = new RegExp(
  `(https?://[^\\s\\n]+\\.(?:${IMAGE_EXT_PATTERN})(?:\\?[^\\s\\n]*)?)`,
  "gi"
);
function basename$2(path2) {
  const parts = path2.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || path2;
}
function isLocalPath$2(src) {
  if (!src || src.startsWith("//")) return false;
  return src.startsWith("/") || /^[A-Za-z]:[\\/]/.test(src);
}
function isRemoteImageUrl(src) {
  return /^https?:\/\//i.test(src) || src.startsWith("data:image/");
}
function queryHasMarkdownImage(text2, src) {
  const path2 = queryNormalizeMarkdownImageSrc(src);
  return text2.includes(`](${path2})`) || text2.includes(`](<${path2}>)`);
}
function addRef$2(refs, seen, src) {
  const trimmed = queryNormalizeMarkdownImageSrc(src);
  if (!trimmed || seen.has(trimmed)) return;
  if (!isLocalPath$2(trimmed) && !isRemoteImageUrl(trimmed)) return;
  seen.add(trimmed);
  refs.push({
    key: trimmed,
    kind: isLocalPath$2(trimmed) ? "local" : "remote",
    src: trimmed,
    label: basename$2(trimmed)
  });
}
function extractMessageImages(content, attachmentPaths) {
  const decoded = queryDecodeWorkflowCtxMessage(content);
  const refs = [];
  const seen = /* @__PURE__ */ new Set();
  for (const p of attachmentPaths ?? []) {
    addRef$2(refs, seen, p);
  }
  const attachMatch = decoded.match(/\n\[附件\]\n([\s\S]*)$/);
  if (attachMatch) {
    for (const line of attachMatch[1].split("\n")) {
      addRef$2(refs, seen, line.trim());
    }
  }
  let mdMatch;
  MD_IMAGE_RE.lastIndex = 0;
  while ((mdMatch = MD_IMAGE_RE.exec(decoded)) !== null) {
    addRef$2(refs, seen, mdMatch[1]);
  }
  let m;
  REMOTE_IMAGE_RE.lastIndex = 0;
  while ((m = REMOTE_IMAGE_RE.exec(decoded)) !== null) {
    addRef$2(refs, seen, m[1]);
  }
  UNIX_PATH_RE.lastIndex = 0;
  while ((m = UNIX_PATH_RE.exec(decoded)) !== null) {
    addRef$2(refs, seen, m[1]);
  }
  WIN_PATH_RE.lastIndex = 0;
  while ((m = WIN_PATH_RE.exec(decoded)) !== null) {
    addRef$2(refs, seen, m[1]);
  }
  return preferLocalImageRefs(refs);
}
function preferLocalImageRefs(refs) {
  const hasLocal = refs.some((r) => r.kind === "local");
  if (!hasLocal) return refs;
  return refs.filter((r) => r.kind === "local");
}
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function queryRemoveBarePathCopies(text2, src) {
  const escaped = escapeRegExp(src);
  return text2.replace(new RegExp(`\`${escaped}\``, "g"), "").replace(new RegExp(`(?<!\\]\\()(?<!\\]\\(<)${escaped}`, "g"), "");
}
function queryEmbedPathInTableRow(text2, ref) {
  const escaped = escapeRegExp(ref.src);
  const tableRowRe = new RegExp(
    `(\\|\\s*)([^|\\n]+?)(\\s*\\|\\s*)[\`']?${escaped}[\`']?([^|\\n]*)`,
    "g"
  );
  if (!tableRowRe.test(text2)) return null;
  tableRowRe.lastIndex = 0;
  return text2.replace(tableRowRe, (_match, pipeStart, previewCell, midPipe, rest) => {
    const label2 = String(previewCell).trim() || ref.label;
    const restNorm = String(rest).replace(/^\s*[←<-]+/, " ←").replace(/^\s+(?=←)/, " ");
    const pathCell = restNorm.trim() ? `\`${ref.label}\`${restNorm.startsWith(" ") ? restNorm : ` ${restNorm}`}` : `\`${ref.label}\``;
    return `${pipeStart}${queryFormatMarkdownImage(label2, ref.src)}${midPipe}${pathCell}`;
  });
}
function queryEmbedImagesInDisplayText(content, refs) {
  let text2 = content.replace(/\n?\[附件\]\n[\s\S]*$/, "").trim();
  for (const ref of refs) {
    if (ref.kind !== "local") continue;
    if (queryHasMarkdownImage(text2, ref.src)) {
      text2 = text2.replace(
        new RegExp(`!\\[([^\\]]*)]\\(${escapeRegExp(ref.src)}\\)`, "g"),
        (_m, alt) => queryFormatMarkdownImage(alt || ref.label, ref.src)
      );
      text2 = queryRemoveBarePathCopies(text2, ref.src);
      continue;
    }
    const tableEmbedded = queryEmbedPathInTableRow(text2, ref);
    if (tableEmbedded != null) {
      text2 = tableEmbedded;
      continue;
    }
    const escaped = escapeRegExp(ref.src);
    text2 = text2.replace(
      new RegExp(`[\\\`']?${escaped}[\\\`']?`, "g"),
      queryFormatMarkdownImage(ref.label, ref.src)
    );
  }
  text2 = queryFillFigureLabelPreview(text2, refs);
  text2 = text2.replace(/(?:本地|图片)?路径[：:]\s*(?=!\[)/g, "");
  text2 = text2.replace(/(?:本地|图片)?路径[：:]\s*$/gm, "");
  return text2.replace(/\n{3,}/g, "\n\n").trim();
}
function queryParseFigureLabelIndexes(label2) {
  const m = String(label2 ?? "").trim().match(/^图\s*(\d+)(?:\s*[-–—~～到至]\s*(\d+))?$/u);
  if (!m) return [];
  const start = Number(m[1]);
  const end = m[2] != null ? Number(m[2]) : start;
  if (!Number.isFinite(start) || start < 1) return [];
  if (!Number.isFinite(end) || end < start) return [start];
  const indexes = [];
  for (let i = start; i <= end; i++) indexes.push(i);
  return indexes;
}
function queryFillFigureLabelPreview(text2, refs) {
  const localRefs = refs.filter((r) => r.kind === "local");
  if (!localRefs.length) return text2;
  return text2.replace(
    /^(\|\s*)([^|\n]+?)(\s*\|\s*)([^|\n]*)(\s*\|?\s*)$/gm,
    (full, pipeStart, previewCell, midPipe, contentCell, tail) => {
      const label2 = String(previewCell).trim();
      if (label2.includes("![") || label2.includes("/")) return full;
      const indexes = queryParseFigureLabelIndexes(label2);
      if (!indexes.length) return full;
      const parts = [];
      for (const idx of indexes) {
        const ref = localRefs[idx - 1];
        if (!ref) continue;
        parts.push(queryFormatMarkdownImage(`图${idx}`, ref.src));
      }
      if (!parts.length) return full;
      return `${pipeStart}${parts.join(" ")}${midPipe}${contentCell}${tail}`;
    }
  );
}
function queryInlinedImageSrcs(displayText) {
  const srcs = /* @__PURE__ */ new Set();
  const re = /!\[[^\]]*]\(([^)]+)\)/g;
  let match;
  while ((match = re.exec(displayText)) !== null) {
    const src = queryNormalizeMarkdownImageSrc(match[1]);
    if (src) srcs.add(src);
  }
  return srcs;
}
const AUDIO_EXT_PATTERN = "(?:wav|mp3|m4a|aac|ogg)";
const VIDEO_EXT_PATTERN = "(?:mp4|mov|webm|mkv)";
const PATH_PREFIX$1 = "(?:^|[\\s\\n：:,，`])(?!\\/\\/)";
const UNIX_AUDIO_RE = new RegExp(
  `${PATH_PREFIX$1}((?:/[^\\n"'<>|\`]+?)\\.(?:${AUDIO_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  "gim"
);
const UNIX_VIDEO_RE = new RegExp(
  `${PATH_PREFIX$1}((?:/[^\\n"'<>|\`]+?)\\.(?:${VIDEO_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  "gim"
);
const WIN_AUDIO_RE = new RegExp(
  `${PATH_PREFIX$1}((?:[A-Za-z]:\\\\[^\\n"'<>|\`]+?)\\.(?:${AUDIO_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  "gim"
);
const WIN_VIDEO_RE = new RegExp(
  `${PATH_PREFIX$1}((?:[A-Za-z]:\\\\[^\\n"'<>|\`]+?)\\.(?:${VIDEO_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  "gim"
);
function basename$1(path2) {
  const parts = path2.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || path2;
}
function isLocalPath$1(src) {
  if (!src || src.startsWith("//")) return false;
  return src.startsWith("/") || /^[A-Za-z]:[\\/]/.test(src);
}
function addRef$1(refs, seen, src, kind) {
  const trimmed = src.trim().replace(/^["'`]+|["'`]+$/g, "").replace(/[，,;；]+$/g, "");
  if (!trimmed || seen.has(trimmed) || !isLocalPath$1(trimmed)) return;
  seen.add(trimmed);
  refs.push({
    key: trimmed,
    kind,
    src: trimmed,
    label: basename$1(trimmed)
  });
}
function scanPaths$1(content, refs, seen) {
  let m;
  UNIX_AUDIO_RE.lastIndex = 0;
  while ((m = UNIX_AUDIO_RE.exec(content)) !== null) {
    addRef$1(refs, seen, m[1], "audio");
  }
  WIN_AUDIO_RE.lastIndex = 0;
  while ((m = WIN_AUDIO_RE.exec(content)) !== null) {
    addRef$1(refs, seen, m[1], "audio");
  }
  UNIX_VIDEO_RE.lastIndex = 0;
  while ((m = UNIX_VIDEO_RE.exec(content)) !== null) {
    addRef$1(refs, seen, m[1], "video");
  }
  WIN_VIDEO_RE.lastIndex = 0;
  while ((m = WIN_VIDEO_RE.exec(content)) !== null) {
    addRef$1(refs, seen, m[1], "video");
  }
}
function extractMessageMedia(content) {
  const decoded = queryDecodeWorkflowCtxMessage(content);
  const refs = [];
  const seen = /* @__PURE__ */ new Set();
  const attachMatch = decoded.match(/\n\[附件\]\n([\s\S]*)$/);
  if (attachMatch) {
    for (const line of attachMatch[1].split("\n")) {
      const trimmed = line.trim();
      if (/\.(wav|mp3|m4a|aac|ogg)$/i.test(trimmed)) {
        addRef$1(refs, seen, trimmed, "audio");
      } else if (/\.(mp4|mov|webm|mkv)$/i.test(trimmed)) {
        addRef$1(refs, seen, trimmed, "video");
      }
    }
  }
  scanPaths$1(decoded, refs, seen);
  return {
    audio: refs.filter((r) => r.kind === "audio"),
    video: refs.filter((r) => r.kind === "video")
  };
}
function stripMediaPathsFromDisplayText(content, audio2, video2) {
  let text2 = queryDecodeWorkflowCtxMessage(content);
  text2 = text2.replace(/\n?\[附件\]\n[\s\S]*$/, "").trim();
  for (const ref of [...audio2, ...video2]) {
    text2 = text2.split(ref.src).join("").trim();
  }
  text2 = text2.replace(/(?<!图片)(?:本地|视频|音频|旁白|成片)?路径[：:]\s*/g, "").trim();
  return text2;
}
const SCAN_EXT = "html?|mp4|mov|mkv|webm|md|json|txt|css|less|scss|pdf|png|jpg|jpeg|webp|gif|bmp|svg|wav|mp3|m4a|aac|ogg|py|sh|yaml|yml|xml|csv";
const EXPLICIT_PATH_RE = /(?:已写入|已生成|已保存|写入路径|保存至|保存到|输出路径|文件路径|产物路径|剧本已保存|成片已生成)[：:]\s*((?:\/|[A-Za-z]:\\)[^"'`）)\]\n]+)/gi;
const SCAN_PATH_RE = new RegExp(
  `((?:\\/|[A-Za-z]:\\\\)[^"'\\\`）)\\]\\n]+?\\.(?:${SCAN_EXT}))`,
  "gi"
);
const REAL_PATH_ROOT_RE = /^\/(?:Users|tmp|var|home|opt|Library|Volumes)\/|^[A-Za-z]:\\/;
const VIRTUAL_PATH_RE = /^\/(?:node_modules|three|examples|jsm|build|dist|src|assets|static|public|cdn|unpkg|npm)(?:\/|$)/i;
function queryNormalizeArtifactPath(raw) {
  return raw.trim().replace(/[.,;:：。，；]+$/, "");
}
function queryIsPlausibleArtifactPath(filePath) {
  const p = queryNormalizeArtifactPath(filePath);
  if (!p) return false;
  if (!p.startsWith("/") && !/^[A-Za-z]:\\/.test(p)) return false;
  const normalized = p.replace(/\\/g, "/");
  const segments = normalized.split("/").filter(Boolean);
  if (segments.length < 2) return false;
  if (VIRTUAL_PATH_RE.test(normalized)) return false;
  return REAL_PATH_ROOT_RE.test(normalized);
}
function addArtifactPath(found, raw) {
  const p = queryNormalizeArtifactPath(raw);
  if (!p || found.includes(p)) return;
  if (!queryIsPlausibleArtifactPath(p)) return;
  found.push(p);
}
function queryArtifactPaths(content) {
  const found = [];
  let match;
  const explicit = new RegExp(EXPLICIT_PATH_RE.source, EXPLICIT_PATH_RE.flags);
  while ((match = explicit.exec(content)) !== null) {
    addArtifactPath(found, match[1]);
  }
  const scan = new RegExp(SCAN_PATH_RE.source, SCAN_PATH_RE.flags);
  while ((match = scan.exec(content)) !== null) {
    addArtifactPath(found, match[1]);
  }
  return found;
}
const HTML_EXT_PATTERN = "html?";
const PATH_PREFIX = "(?:^|[\\s\\n：:,，`])(?!\\/\\/)";
const UNIX_HTML_RE = new RegExp(
  `${PATH_PREFIX}((?:/[^\\n"'<>|\`]+?)\\.(?:${HTML_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  "gim"
);
const WIN_HTML_RE = new RegExp(
  `${PATH_PREFIX}((?:[A-Za-z]:\\\\[^\\n"'<>|\`]+?)\\.(?:${HTML_EXT_PATTERN})(?:\\?[^\\s\\n"'<>|\`]*)?)`,
  "gim"
);
function basename(path2) {
  const parts = path2.replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || path2;
}
function isLocalPath(src) {
  if (!src || src.startsWith("//")) return false;
  return src.startsWith("/") || /^[A-Za-z]:[\\/]/.test(src);
}
function isHtmlPath(src) {
  return /\.html?$/i.test(src);
}
function addRef(refs, seen, src) {
  const trimmed = src.trim().replace(/^["'`]+|["'`]+$/g, "").replace(/[，,;；]+$/g, "");
  if (!trimmed || seen.has(trimmed) || !isLocalPath(trimmed) || !isHtmlPath(trimmed)) return;
  if (!queryIsPlausibleArtifactPath(trimmed)) return;
  seen.add(trimmed);
  refs.push({
    key: trimmed,
    src: trimmed,
    label: basename(trimmed)
  });
}
function scanPaths(content, refs, seen) {
  let m;
  UNIX_HTML_RE.lastIndex = 0;
  while ((m = UNIX_HTML_RE.exec(content)) !== null) {
    addRef(refs, seen, m[1]);
  }
  WIN_HTML_RE.lastIndex = 0;
  while ((m = WIN_HTML_RE.exec(content)) !== null) {
    addRef(refs, seen, m[1]);
  }
}
function extractMessageHtml(content) {
  const decoded = queryDecodeWorkflowCtxMessage(content);
  const refs = [];
  const seen = /* @__PURE__ */ new Set();
  const attachMatch = decoded.match(/\n\[附件\]\n([\s\S]*)$/);
  if (attachMatch) {
    for (const line of attachMatch[1].split("\n")) {
      const trimmed = line.trim();
      if (isHtmlPath(trimmed)) {
        addRef(refs, seen, trimmed);
      }
    }
  }
  scanPaths(decoded, refs, seen);
  return refs;
}
function stripEmptyCodeFences(text2) {
  return text2.replace(/```[^\n]*\n(?:[\t \n\r]*)```/g, "").replace(/```[\t ]*```/g, "").replace(/\n{3,}/g, "\n\n").trim();
}
function stripOrphanedPathLabels(text2) {
  return text2.replace(/(?:文件位置|本地路径|保存路径|输出路径|产物路径)[：:][ \t]*/g, "").replace(/^[ \t]*(?:文件位置|本地路径|保存路径|输出路径|产物路径)[：:]*[ \t]*$/gim, "").replace(/^[ \t]*(?:文件位置|本地路径|保存路径|输出路径|产物路径)[ \t]*$/gim, "").replace(/\n{3,}/g, "\n\n").trim();
}
const STOCK_CHART_PREFIX = "@@stock_chart@@";
const STOCK_RANGE_LABELS = {
  today: "当天",
  week: "本周",
  month: "本月",
  custom: "自定义"
};
function queryExtractStockChartEnvelope(content) {
  const idx = content.indexOf(STOCK_CHART_PREFIX);
  if (idx < 0) return null;
  const jsonText = content.slice(idx + STOCK_CHART_PREFIX.length).trim();
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed.charts)) return null;
    return parsed;
  } catch {
    return null;
  }
}
function queryExtractStockCharts(content) {
  const envelope = queryExtractStockChartEnvelope(content);
  if (!envelope) return [];
  return envelope.charts.filter(
    (c) => c && typeof c.symbol === "string" && Array.isArray(c.bars) && c.bars.length > 0
  );
}
function stripStockChartBlock(content) {
  const idx = content.indexOf(STOCK_CHART_PREFIX);
  if (idx < 0) return content;
  return content.slice(0, idx).trimEnd();
}
function extractStockCharts(content) {
  const decoded = queryDecodeWorkflowCtxMessage(content);
  return queryExtractStockCharts(decoded);
}
const ASHARE_REALTIME_ANALYSIS_TOOL = "query_ashare_realtime_analysis";
function queryHoistedStockChartsFromTools(tools) {
  const bySymbol = /* @__PURE__ */ new Map();
  let liveRefresh = false;
  for (const tool of tools) {
    if (tool.toolName !== ASHARE_REALTIME_ANALYSIS_TOOL) continue;
    if (queryStockLiveRefresh(tool.content)) liveRefresh = true;
    for (const chart of extractStockCharts(tool.content)) {
      bySymbol.set(chart.symbol, chart);
    }
  }
  return { charts: [...bySymbol.values()], liveRefresh };
}
function queryStockLiveRefresh(content) {
  const decoded = queryDecodeWorkflowCtxMessage(content);
  const envelope = queryExtractStockChartEnvelope(decoded);
  return envelope?.liveRefresh === true;
}
function queryDisplayContentWithCharts(content, imagePaths = []) {
  const { audio: audio2, video: video2 } = extractMessageMedia(content);
  const htmlRefs = extractMessageHtml(content);
  let text2 = stripMediaPathsFromDisplayText(content, audio2, video2);
  for (const ref of htmlRefs) {
    text2 = text2.split(ref.src).join("").trim();
  }
  text2 = stripStockChartBlock(text2);
  text2 = queryEmbedImagesInDisplayText(text2, imagePaths);
  text2 = text2.replace(
    /(?:文件位置|本地|视频|音频|旁白|成片|HTML|网页|页面|本地路径|保存路径)?路径[：:]\s*(?!!\[)/g,
    ""
  ).trim();
  return stripEmptyCodeFences(stripOrphanedPathLabels(text2));
}
const skeleton = "_skeleton_z1pay_1";
const styles$g = {
  skeleton
};
const MessageKlineChart = reactExports.lazy(
  () => __vitePreload(() => import("./MessageKlineChart-DyYLpGbf.js"), true ? __vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]) : void 0, import.meta.url).then((m) => ({
    default: m.MessageKlineChart
  }))
);
function LazyMessageKlineChart(props) {
  if (!props.charts?.length && !props.liveRefresh) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$g.skeleton, "aria-hidden": true }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageKlineChart, { ...props }) });
}
const thumbWrap = "_thumbWrap_4bh7s_1";
const gallery$3 = "_gallery_4bh7s_9";
const thumbRoot = "_thumbRoot_4bh7s_16";
const thumb = "_thumb_4bh7s_1";
const thumbLabel$1 = "_thumbLabel_4bh7s_34";
const fileActions = "_fileActions_4bh7s_43";
const styles$f = {
  thumbWrap,
  gallery: gallery$3,
  thumbRoot,
  thumb,
  thumbLabel: thumbLabel$1,
  fileActions
};
function MessageImageGallery({ images }) {
  const [previewMap, setPreviewMap] = reactExports.useState({});
  const [loading2, setLoading] = reactExports.useState(false);
  const imageKeys = images.map((img) => img.key).join("\0");
  reactExports.useEffect(() => {
    if (!images.length) {
      setPreviewMap({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPreviewMap({});
    void (async () => {
      const next = {};
      await Promise.all(
        images.map(async (img) => {
          if (img.kind === "local") {
            const dataUrl = await queryLocalImageDataUrl(img.src);
            if (dataUrl) next[img.key] = dataUrl;
            return;
          }
          next[img.key] = img.src;
        })
      );
      if (!cancelled) {
        setPreviewMap(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [imageKeys]);
  const ready = images.filter((img) => previewMap[img.key]);
  if (!ready.length && !loading2) return null;
  const handleImageError = (key) => {
    setPreviewMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$f.gallery, children: loading2 && ready.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { size: "small" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Image.PreviewGroup, { children: ready.map((img) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$f.thumbWrap, title: img.label, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Image,
      {
        src: previewMap[img.key],
        alt: img.label,
        width: 200,
        height: 200,
        className: styles$f.thumb,
        rootClassName: styles$f.thumbRoot,
        onError: () => handleImageError(img.key)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$f.thumbLabel, children: img.label }),
    img.kind === "local" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArtifactFileActions, { filePath: img.src, className: styles$f.fileActions }) : null
  ] }, img.key)) }) });
}
const gallery$2 = "_gallery_zuudm_1";
const item$3 = "_item_zuudm_8";
const player$1 = "_player_zuudm_15";
const label$4 = "_label_zuudm_21";
const styles$e = {
  gallery: gallery$2,
  item: item$3,
  player: player$1,
  label: label$4
};
function MessageAudioPlayer({ items }) {
  const [urlMap, setUrlMap] = reactExports.useState({});
  const [loading2, setLoading] = reactExports.useState(false);
  const itemKeys = items.map((item2) => item2.key).join("\0");
  reactExports.useEffect(() => {
    if (!items.length) {
      setUrlMap({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setUrlMap({});
    void (async () => {
      const next = {};
      await Promise.all(
        items.map(async (item2) => {
          const url = await queryLocalMediaUrl(item2.src);
          if (url) next[item2.key] = url;
        })
      );
      if (!cancelled) {
        setUrlMap(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemKeys]);
  const ready = items.filter((item2) => urlMap[item2.key]);
  if (!ready.length && !loading2) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$e.gallery, children: [
    loading2 && ready.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { size: "small" }) : null,
    ready.map((item2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$e.item, title: item2.label, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { controls: true, preload: "metadata", className: styles$e.player, src: urlMap[item2.key] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$e.label, children: item2.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArtifactFileActions, { filePath: item2.src })
    ] }, item2.key))
  ] });
}
const gallery$1 = "_gallery_18584_1";
const item$2 = "_item_18584_8";
const player = "_player_18584_16";
const label$3 = "_label_18584_25";
const styles$d = {
  gallery: gallery$1,
  item: item$2,
  player,
  label: label$3
};
function MessageVideoPlayer({ items }) {
  const [urlMap, setUrlMap] = reactExports.useState({});
  const [loading2, setLoading] = reactExports.useState(false);
  const itemKeys = items.map((item2) => item2.key).join("\0");
  reactExports.useEffect(() => {
    if (!items.length) {
      setUrlMap({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setUrlMap({});
    void (async () => {
      const next = {};
      await Promise.all(
        items.map(async (item2) => {
          const url = await queryLocalMediaUrl(item2.src);
          if (url) next[item2.key] = url;
        })
      );
      if (!cancelled) {
        setUrlMap(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemKeys]);
  const ready = items.filter((item2) => urlMap[item2.key]);
  if (!ready.length && !loading2) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$d.gallery, children: [
    loading2 && ready.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { size: "small" }) : null,
    ready.map((item2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$d.item, title: item2.label, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "video",
        {
          controls: true,
          preload: "metadata",
          className: styles$d.player,
          src: urlMap[item2.key]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$d.label, children: item2.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArtifactFileActions, { filePath: item2.src })
    ] }, item2.key))
  ] });
}
const wrap$5 = "_wrap_1p3ru_1";
const topRow = "_topRow_1p3ru_9";
const path = "_path_1p3ru_23";
const styles$c = {
  wrap: wrap$5,
  topRow,
  path
};
function ArtifactPathMeta({
  filePath,
  showBrowserOpen = false,
  className
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: [styles$c.wrap, className].filter(Boolean).join(" "), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$c.topRow, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArtifactFileActions, { filePath, showBrowserOpen }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography.Text, { copyable: true, className: styles$c.path, title: filePath, children: filePath })
  ] });
}
const gallery = "_gallery_3wgog_1";
const item$1 = "_item_3wgog_8";
const header$3 = "_header_3wgog_18";
const meta = "_meta_3wgog_33";
const frame = "_frame_3wgog_38";
const framePlaceholder = "_framePlaceholder_3wgog_46";
const frameHint = "_frameHint_3wgog_55";
const styles$b = {
  gallery,
  item: item$1,
  header: header$3,
  meta,
  frame,
  framePlaceholder,
  frameHint
};
function MessageHtmlPreview({ items }) {
  const [urlMap, setUrlMap] = reactExports.useState({});
  const [loading2, setLoading] = reactExports.useState(false);
  const itemKeys = items.map((item2) => item2.key).join("\0");
  reactExports.useEffect(() => {
    if (!items.length) {
      setUrlMap({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setUrlMap({});
    void (async () => {
      const next = {};
      await Promise.all(
        items.map(async (item2) => {
          const url = await queryLocalMediaUrl(item2.src);
          if (url) next[item2.key] = url;
        })
      );
      if (!cancelled) {
        setUrlMap(next);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemKeys]);
  if (items.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$b.gallery, children: items.map((item2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$b.item, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$b.header, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArtifactPathMeta, { filePath: item2.src, showBrowserOpen: true, className: styles$b.meta }) }),
    urlMap[item2.key] ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "iframe",
      {
        className: styles$b.frame,
        title: item2.label,
        src: urlMap[item2.key],
        sandbox: "allow-scripts allow-same-origin allow-forms allow-popups"
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$b.framePlaceholder, children: loading2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { size: "small" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$b.frameHint, children: "无法加载预览" }) })
  ] }, item2.key)) });
}
const IMAGE_EXT$2 = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"]);
const VIDEO_EXT$2 = /* @__PURE__ */ new Set([".mp4", ".mov", ".webm", ".mkv"]);
const AUDIO_EXT$2 = /* @__PURE__ */ new Set([".wav", ".mp3", ".m4a", ".aac", ".ogg"]);
function queryAttachmentBasename(filePath) {
  const parts = filePath.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts[parts.length - 1] || filePath;
}
function queryAttachmentExt(filePath) {
  const name = queryAttachmentBasename(filePath);
  const dot2 = name.lastIndexOf(".");
  if (dot2 <= 0) return "";
  return name.slice(dot2).toLowerCase();
}
function queryAttachmentKind(filePath, hint2) {
  if (hint2 === "folder") return "folder";
  const ext = queryAttachmentExt(filePath);
  if (IMAGE_EXT$2.has(ext)) return "image";
  if (VIDEO_EXT$2.has(ext)) return "video";
  if (AUDIO_EXT$2.has(ext)) return "audio";
  return "folder";
}
const loading = "_loading_1g2a3_1";
const imageWrap = "_imageWrap_1g2a3_7";
const imageRoot = "_imageRoot_1g2a3_12";
const image = "_image_1g2a3_7";
const video = "_video_1g2a3_23";
const audio = "_audio_1g2a3_33";
const text = "_text_1g2a3_40";
const styles$a = {
  loading,
  imageWrap,
  imageRoot,
  image,
  video,
  audio,
  text
};
const IMAGE_EXT$1 = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"]);
const VIDEO_EXT$1 = /* @__PURE__ */ new Set([".mp4", ".mov", ".webm", ".mkv"]);
const AUDIO_EXT$1 = /* @__PURE__ */ new Set([".wav", ".mp3", ".m4a", ".aac", ".ogg"]);
const TEXT_EXT = /* @__PURE__ */ new Set([
  ".md",
  ".txt",
  ".json",
  ".csv",
  ".yaml",
  ".yml",
  ".xml",
  ".log",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".css",
  ".html",
  ".htm"
]);
function queryPreviewKind(filePath) {
  const ext = queryAttachmentExt(filePath);
  if (IMAGE_EXT$1.has(ext)) return "image";
  if (VIDEO_EXT$1.has(ext)) return "video";
  if (AUDIO_EXT$1.has(ext)) return "audio";
  if (TEXT_EXT.has(ext)) return "text";
  return "none";
}
function ArtifactInlinePreview({
  filePath
}) {
  const kind = queryPreviewKind(filePath);
  const [imageUrl, setImageUrl] = reactExports.useState(null);
  const [mediaUrl, setMediaUrl] = reactExports.useState(null);
  const [textContent, setTextContent] = reactExports.useState(null);
  const [loading2, setLoading] = reactExports.useState(kind !== "none");
  reactExports.useEffect(() => {
    if (kind === "none") {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setImageUrl(null);
    setMediaUrl(null);
    setTextContent(null);
    void (async () => {
      if (kind === "image") {
        const url = await queryLocalImageDataUrl(filePath);
        if (!cancelled) setImageUrl(url);
      } else if (kind === "video" || kind === "audio") {
        const url = await queryLocalMediaUrl(filePath);
        if (!cancelled) setMediaUrl(url);
      } else if (kind === "text") {
        const text2 = await queryAgentAssetTextPreview(filePath);
        if (!cancelled) setTextContent(text2);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [filePath, kind]);
  if (kind === "none") return null;
  if (loading2) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$a.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { size: "small" }) });
  }
  if (kind === "image" && imageUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$a.imageWrap, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Image,
      {
        src: imageUrl,
        alt: "产物预览",
        className: styles$a.image,
        rootClassName: styles$a.imageRoot,
        preview: { mask: "预览" }
      }
    ) });
  }
  if (kind === "video" && mediaUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("video", { controls: true, preload: "metadata", className: styles$a.video, src: mediaUrl });
  }
  if (kind === "audio" && mediaUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { controls: true, preload: "metadata", className: styles$a.audio, src: mediaUrl });
  }
  if (kind === "text" && textContent != null) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: styles$a.text, children: textContent });
  }
  return null;
}
const wrap$4 = "_wrap_1dgpf_1";
const title$1 = "_title_1dgpf_9";
const list$1 = "_list_1dgpf_14";
const item = "_item_1dgpf_21";
const styles$9 = {
  wrap: wrap$4,
  title: title$1,
  list: list$1,
  item
};
function ArtifactLinks({
  content,
  excludePaths = []
}) {
  const candidates = reactExports.useMemo(() => {
    const exclude = new Set(excludePaths);
    return queryArtifactPaths(content).filter((p) => !exclude.has(p));
  }, [content, excludePaths]);
  const [existingPaths, setExistingPaths] = reactExports.useState([]);
  const candidateKey = candidates.join("\0");
  reactExports.useEffect(() => {
    if (!candidates.length) {
      setExistingPaths([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const checks = await Promise.all(
        candidates.map(async (p) => await queryLocalPathExists(p) ? p : null)
      );
      if (!cancelled) {
        setExistingPaths(checks.filter((p) => Boolean(p)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [candidateKey]);
  if (existingPaths.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$9.wrap, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$9.title, children: "产物" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$9.list, children: existingPaths.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$9.item, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ArtifactInlinePreview, { filePath: p }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ArtifactPathMeta,
        {
          filePath: p,
          showBrowserOpen: /\.html?$/i.test(p)
        }
      )
    ] }, p)) })
  ] });
}
const cursor = "_cursor_o8rb3_1";
const doneAlert = "_doneAlert_o8rb3_17";
const styles$8 = {
  cursor,
  doneAlert
};
function MessageRichContent({
  content,
  attachmentPaths,
  previewContextPaths,
  streaming = false,
  markdownClassName,
  showDoneAlert = true,
  showStockCharts = true
}) {
  const images = extractMessageImages(content, attachmentPaths);
  const { audio: audio2, video: video2 } = extractMessageMedia(content);
  const htmlItems = extractMessageHtml(content);
  const stockCharts = showStockCharts ? extractStockCharts(content) : [];
  const stockLiveRefresh = showStockCharts ? queryStockLiveRefresh(content) : false;
  const contextRefs = [];
  const seen = new Set(images.map((i) => i.src));
  for (const p of previewContextPaths ?? []) {
    if (!p || seen.has(p)) continue;
    seen.add(p);
    contextRefs.push({
      key: p,
      kind: "local",
      src: p,
      label: p.replace(/\\/g, "/").split("/").pop() || p
    });
  }
  const embedRefs = contextRefs.length ? [...images, ...contextRefs] : images;
  const displayText = queryDisplayContentWithCharts(content, embedRefs);
  const inlinedSrcs = queryInlinedImageSrcs(displayText);
  const galleryImages = images.filter(
    (img) => img.kind === "local" || !inlinedSrcs.has(img.src)
  );
  const previewPaths = [
    ...images.filter((i) => i.kind === "local").map((i) => i.src),
    ...audio2.map((a) => a.src),
    ...video2.map((v) => v.src),
    ...htmlItems.map((h) => h.src)
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    displayText ? /* @__PURE__ */ jsxRuntimeExports.jsx(LazyChatMarkdown, { source: displayText, streaming, className: markdownClassName }) : streaming ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$8.cursor }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(LazyMessageKlineChart, { charts: stockCharts, liveRefresh: stockLiveRefresh }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MessageImageGallery, { images: galleryImages }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MessageAudioPlayer, { items: audio2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MessageVideoPlayer, { items: video2 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(MessageHtmlPreview, { items: htmlItems }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ArtifactLinks, { content, excludePaths: previewPaths }),
    showDoneAlert && /执行完毕/.test(content) ? /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { type: "success", showIcon: true, message: "执行完毕", className: styles$8.doneAlert }) : null
  ] });
}
function queryMediaCountLabel(content, attachmentPaths) {
  const images = extractMessageImages(content, attachmentPaths);
  const { audio: audio2, video: video2 } = extractMessageMedia(content);
  const htmlItems = extractMessageHtml(content);
  const stockCharts = extractStockCharts(content);
  const parts = [];
  if (stockCharts.length) parts.push(`${stockCharts.length} 只K线`);
  if (images.length) parts.push(`${images.length} 张图`);
  if (audio2.length) parts.push(`${audio2.length} 段音频`);
  if (video2.length) parts.push(`${video2.length} 个视频`);
  if (htmlItems.length) parts.push(`${htmlItems.length} 个网页`);
  return parts.length ? ` · ${parts.join(" · ")}` : "";
}
function queryToolResultHasLocalFiles(content, attachmentPaths) {
  if (extractMessageImages(content, attachmentPaths).some((img) => img.kind === "local")) {
    return true;
  }
  const { audio: audio2, video: video2 } = extractMessageMedia(content);
  if (audio2.length > 0 || video2.length > 0) return true;
  if (extractMessageHtml(content).length > 0) return true;
  return queryArtifactPaths(content).length > 0;
}
const wrap$3 = "_wrap_g1f25_1";
const dots = "_dots_g1f25_30";
const dot$1 = "_dot_g1f25_30";
const label$2 = "_label_g1f25_71";
const styles$7 = {
  wrap: wrap$3,
  dots,
  dot: dot$1,
  label: label$2
};
function TypingIndicator({
  label: label2 = "正在思考",
  compact = false
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$7.wrap, "data-compact": compact, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$7.dots, "aria-hidden": true, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$7.dot }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$7.dot }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$7.dot })
    ] }),
    label2 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$7.label, children: label2 }) : null
  ] });
}
const list = "_list_18l23_1";
const row = "_row_18l23_10";
const rowUser = "_rowUser_18l23_28";
const rowAssistant = "_rowAssistant_18l23_32";
const label$1 = "_label_18l23_37";
const userBubble = "_userBubble_18l23_52";
const assistantCard = "_assistantCard_18l23_62";
const errorCard = "_errorCard_18l23_72";
const assistantCardStreaming = "_assistantCardStreaming_18l23_79";
const rowThinking = "_rowThinking_18l23_124";
const thinkingCollapse = "_thinkingCollapse_18l23_129";
const thinkingCollapseLabel = "_thinkingCollapseLabel_18l23_153";
const thinkingMarkdown = "_thinkingMarkdown_18l23_157";
const pendingWrap = "_pendingWrap_18l23_163";
const toolRunning = "_toolRunning_18l23_167";
const toolIcon = "_toolIcon_18l23_181";
const toolBlock = "_toolBlock_18l23_197";
const toolCallGroup = "_toolCallGroup_18l23_231";
const toolCallGroupLabel = "_toolCallGroupLabel_18l23_235";
const toolCallGroupIcon = "_toolCallGroupIcon_18l23_241";
const toolCallGroupBody = "_toolCallGroupBody_18l23_246";
const toolCallGroupEmpty = "_toolCallGroupEmpty_18l23_252";
const toolCallItem = "_toolCallItem_18l23_257";
const toolMarkdown = "_toolMarkdown_18l23_280";
const userMarkdown = "_userMarkdown_18l23_292";
const styles$6 = {
  list,
  row,
  rowUser,
  rowAssistant,
  label: label$1,
  userBubble,
  assistantCard,
  errorCard,
  assistantCardStreaming,
  rowThinking,
  thinkingCollapse,
  thinkingCollapseLabel,
  thinkingMarkdown,
  pendingWrap,
  toolRunning,
  toolIcon,
  toolBlock,
  toolCallGroup,
  toolCallGroupLabel,
  toolCallGroupIcon,
  toolCallGroupBody,
  toolCallGroupEmpty,
  toolCallItem,
  toolMarkdown,
  userMarkdown
};
const GROUP_KEY = "group";
const TOOL_PANEL_KEY = "1";
function queryShouldExpandTool(tool) {
  const showChartsInTool = tool.content.includes("@@stock_chart@@") && tool.toolName !== ASHARE_REALTIME_ANALYSIS_TOOL;
  return showChartsInTool || queryToolResultHasLocalFiles(tool.content);
}
function ToolCallGroup({
  tools,
  declaredCount,
  toolCalls,
  skillNameById
}) {
  const count2 = declaredCount && declaredCount > 0 ? declaredCount : tools.length;
  const hasInlineStockChart = tools.some(
    (t) => t.content.includes("@@stock_chart@@") && t.toolName !== ASHARE_REALTIME_ANALYSIS_TOOL
  );
  const hasLocalFiles = tools.some((t) => queryToolResultHasLocalFiles(t.content));
  const expandGroup = hasInlineStockChart || hasLocalFiles;
  const [groupKeys, setGroupKeys] = reactExports.useState(expandGroup ? [GROUP_KEY] : []);
  const [toolKeysById, setToolKeysById] = reactExports.useState(() => {
    const init = {};
    for (const t of tools) {
      if (queryShouldExpandTool(t)) init[t.id] = [TOOL_PANEL_KEY];
    }
    return init;
  });
  reactExports.useEffect(() => {
    if (expandGroup) {
      setGroupKeys([GROUP_KEY]);
    }
  }, [expandGroup]);
  const toolExpandSig = tools.map((t) => `${t.id}:${queryShouldExpandTool(t) ? "1" : "0"}`).join("|");
  reactExports.useEffect(() => {
    setToolKeysById((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const t of tools) {
        if (!queryShouldExpandTool(t)) continue;
        const cur = next[t.id];
        if (!cur?.includes(TOOL_PANEL_KEY)) {
          next[t.id] = [TOOL_PANEL_KEY];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [toolExpandSig]);
  if (count2 <= 0) return null;
  const argsByCallId = new Map(
    (toolCalls ?? []).map((tc) => [tc.id, queryToolArgsRecord(tc.args)])
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Collapse$1,
    {
      size: "small",
      className: `${styles$6.toolBlock} ${styles$6.toolCallGroup}`,
      activeKey: groupKeys,
      onChange: (keys) => {
        setGroupKeys(Array.isArray(keys) ? keys.map(String) : keys ? [String(keys)] : []);
      },
      items: [
        {
          key: GROUP_KEY,
          label: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$6.toolCallGroupLabel, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, { className: styles$6.toolCallGroupIcon, "aria-hidden": true }),
            "已调用 ",
            count2,
            " 个工具"
          ] }),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$6.toolCallGroupBody, children: tools.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$6.toolCallGroupEmpty, children: "等待工具结果…" }) : tools.map((t) => {
            const mediaLabel = queryMediaCountLabel(t.content);
            const name = t.toolName ?? "tool";
            const args = t.toolCallId ? argsByCallId.get(t.toolCallId) : null;
            const label2 = queryToolCallLabel(name, args ?? null, {
              skillNameById,
              toolContent: t.content
            });
            return /* @__PURE__ */ jsxRuntimeExports.jsx(
              Collapse$1,
              {
                size: "small",
                className: styles$6.toolCallItem,
                activeKey: toolKeysById[t.id] ?? [],
                onChange: (keys) => {
                  const next = Array.isArray(keys) ? keys.map(String) : keys ? [String(keys)] : [];
                  setToolKeysById((prev) => ({ ...prev, [t.id]: next }));
                },
                items: [
                  {
                    key: TOOL_PANEL_KEY,
                    label: `${label2}${mediaLabel}`,
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      MessageRichContent,
                      {
                        content: t.content,
                        markdownClassName: styles$6.toolMarkdown,
                        showDoneAlert: false,
                        showStockCharts: t.toolName !== ASHARE_REALTIME_ANALYSIS_TOOL
                      }
                    )
                  }
                ]
              },
              t.id
            );
          }) })
        }
      ]
    }
  );
}
const THINKING_PANEL_KEY = "thinking";
function ThinkingBlock({
  content,
  streaming = false,
  inProgress = false,
  nextNodeStarted = false
}) {
  const hasBody = content.trim().length > 0;
  const headerLabel = inProgress && !hasBody ? "正在思考…" : inProgress ? "思考中…" : "已完成思考";
  const [activeKeys, setActiveKeys] = reactExports.useState(
    inProgress || !nextNodeStarted ? [THINKING_PANEL_KEY] : []
  );
  reactExports.useEffect(() => {
    if (inProgress) {
      setActiveKeys([THINKING_PANEL_KEY]);
      return;
    }
    if (nextNodeStarted) {
      setActiveKeys([]);
    }
  }, [inProgress, nextNodeStarted]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Collapse$1,
    {
      size: "small",
      className: styles$6.thinkingCollapse,
      activeKey: activeKeys,
      onChange: (keys) => {
        setActiveKeys(Array.isArray(keys) ? keys : keys ? [keys] : []);
      },
      items: [
        {
          key: THINKING_PANEL_KEY,
          label: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$6.thinkingCollapseLabel, children: headerLabel }),
          children: hasBody ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            LazyChatMarkdown,
            {
              source: content,
              streaming,
              className: styles$6.thinkingMarkdown
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(TypingIndicator, { label: "正在思考…" })
        }
      ]
    }
  );
}
const wrap$2 = "_wrap_bdob3_3";
const wrapCompact = "_wrapCompact_bdob3_17";
const header$2 = "_header_bdob3_36";
const label = "_label_bdob3_44";
const percent = "_percent_bdob3_51";
const track = "_track_bdob3_58";
const trackGrain = "_trackGrain_bdob3_66";
const fill = "_fill_bdob3_80";
const fillGlow = "_fillGlow_bdob3_93";
const sprockets = "_sprockets_bdob3_103";
const sprocket = "_sprocket_bdob3_103";
const detail = "_detail_bdob3_120";
const phaseTag = "_phaseTag_bdob3_131";
const detailText = "_detailText_bdob3_144";
const styles$5 = {
  wrap: wrap$2,
  wrapCompact,
  header: header$2,
  label,
  percent,
  track,
  trackGrain,
  fill,
  fillGlow,
  sprockets,
  sprocket,
  detail,
  phaseTag,
  detailText
};
const PHASE_LABELS = {
  browser: "准备浏览器",
  bundle: "打包工程",
  render: "渲染成片"
};
function ToolProgressBar({
  label: label2,
  progress,
  compact = false
}) {
  const phaseLabel = PHASE_LABELS[progress.phase] ?? progress.phase;
  const detail2 = progress.message?.trim() || phaseLabel;
  const clamped = Math.max(0, Math.min(100, Math.round(progress.percent)));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `${styles$5.wrap} ${compact ? styles$5.wrapCompact : ""}`,
      role: "progressbar",
      "aria-valuenow": clamped,
      "aria-valuemin": 0,
      "aria-valuemax": 100,
      "aria-label": `${label2} ${clamped}%`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$5.header, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$5.label, children: label2 }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$5.percent, children: [
            clamped,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$5.track, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.trackGrain, "aria-hidden": true }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.fill, style: { width: `${clamped}%` }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$5.fillGlow, "aria-hidden": true }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$5.sprockets, "aria-hidden": true, children: Array.from({ length: 12 }, (_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$5.sprocket }, i)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: styles$5.detail, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$5.phaseTag, children: phaseLabel }),
          detail2 !== phaseLabel ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$5.detailText, children: detail2 }) : null
        ] })
      ]
    }
  );
}
function queryShouldShowToolProgress(toolName, progress) {
  if (!toolName || !progress) return false;
  return toolName === "remotion_render";
}
function queryToolProgressTitle(toolName) {
  return queryToolLabel(toolName);
}
const IMAGE_PATH_ARG_KEYS = ["imagePaths", "paths", "images", "imagePath"];
function queryImagePathsFromToolArgs(args) {
  const record = queryToolArgsRecord(args);
  if (!record) return [];
  const found = [];
  for (const key of IMAGE_PATH_ARG_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.startsWith("/")) {
      found.push(value);
      continue;
    }
    if (Array.isArray(value)) {
      for (const item2 of value) {
        if (typeof item2 === "string" && item2.startsWith("/") && /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(item2)) {
          found.push(item2);
        }
      }
    }
  }
  return found;
}
function queryCollectSessionImagePaths(messages, opts) {
  const seen = /* @__PURE__ */ new Set();
  const paths = [];
  const add = (src) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    paths.push(src);
  };
  for (const msg of messages) {
    if (opts?.beforeMessageId && msg.id === opts.beforeMessageId) break;
    for (const ref of extractMessageImages(msg.content, msg.attachmentPaths)) {
      if (ref.kind === "local") add(ref.src);
    }
    for (const tc of msg.toolCalls ?? []) {
      for (const p of queryImagePathsFromToolArgs(tc.args)) add(p);
    }
  }
  return paths;
}
const { Text: Text$3 } = Typography;
function MessageList({
  messages,
  streamingText,
  thinkingText = "",
  thinkingInProgress = false,
  tasks,
  running = false,
  activeToolName = null,
  activeToolArgs = null,
  activeToolProgress = null,
  awaitUserReason = null,
  skillNameById
}) {
  const visible = messages.filter((m) => !queryIsUiHiddenChatMessage(m));
  const statusInput = {
    running,
    streamingText: thinkingInProgress ? "" : streamingText,
    activeToolName: thinkingInProgress ? null : activeToolName,
    activeToolArgs: thinkingInProgress ? null : activeToolArgs,
    skillNameById,
    awaitUserReason
  };
  const phase = queryAgentPhase(statusInput);
  const lastAssistant = [...visible].reverse().find((m) => m.role === "assistant");
  const trailingPlaceholderId = running && phase !== "idle" && lastAssistant?.role === "assistant" && !lastAssistant.content.trim() && !lastAssistant.toolCalls?.length ? lastAssistant.id : null;
  const displayMessages = trailingPlaceholderId ? visible.filter((m) => m.id !== trailingPlaceholderId) : visible;
  const timeline = queryAgentTimeline(displayMessages);
  const afterToolGroup = queryTimelineEndsWithToolGroup(timeline);
  const statusLabel = queryAgentBusyLabel({
    ...statusInput,
    afterToolGroup
  });
  const sessionImagePaths = queryCollectSessionImagePaths(displayMessages);
  const showPending = running && !streamingText && !thinkingInProgress && phase !== "idle" && (Boolean(trailingPlaceholderId) || phase === "thinking" && afterToolGroup || phase === "tool" && Boolean(activeToolName));
  const showThinking = thinkingText.trim().length > 0 || thinkingInProgress;
  const displayStreamingText = thinkingInProgress ? "" : streamingText;
  const showToolProgress = queryShouldShowToolProgress(activeToolName, activeToolProgress);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$6.list, children: [
    timeline.map((item2) => {
      if (item2.kind === "user") {
        const m2 = item2.message;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${styles$6.row} ${styles$6.rowUser}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$6.userBubble, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          MessageRichContent,
          {
            content: m2.content,
            attachmentPaths: m2.attachmentPaths,
            markdownClassName: styles$6.userMarkdown,
            showDoneAlert: false
          }
        ) }) }, m2.id);
      }
      if (item2.kind === "orphanTool") {
        const hoistedStock2 = queryHoistedStockChartsFromTools([item2.message]);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$6.row, children: [
          hoistedStock2.charts.length ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${styles$6.rowAssistant}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$6.label, children: "灵犀" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$6.assistantCard, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              LazyMessageKlineChart,
              {
                charts: hoistedStock2.charts,
                liveRefresh: hoistedStock2.liveRefresh
              }
            ) })
          ] }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            ToolCallGroup,
            {
              tools: [item2.message],
              declaredCount: 1,
              skillNameById
            }
          )
        ] }, item2.message.id);
      }
      const { assistant: m, tools } = item2;
      const declaredCount = m.toolCalls?.length ?? 0;
      const showToolGroup = declaredCount > 0 || tools.length > 0;
      const narrative = m.content.trim() && !queryIsSyntheticToolCallContent(m.content) ? m.content : "";
      const showNarrative = Boolean(narrative);
      const hoistedStock = queryHoistedStockChartsFromTools(tools);
      const showHoistedStock = hoistedStock.charts.length > 0;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
        m.thinkingContent?.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${styles$6.row} ${styles$6.rowThinking}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$6.label, children: "灵犀" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ThinkingBlock, { content: m.thinkingContent, nextNodeStarted: true })
        ] }) : null,
        showNarrative || showToolGroup || showHoistedStock ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${styles$6.row} ${styles$6.rowAssistant}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$6.label, children: "灵犀" }),
          showNarrative ? m.errorMeta ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$6.errorCard, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            AppErrorNotice,
            {
              title: m.errorMeta.title?.trim() || "执行失败",
              content: narrative,
              embedded: true
            }
          ) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$6.assistantCard, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            AssistantBody,
            {
              content: narrative,
              contextImagePaths: queryCollectSessionImagePaths(displayMessages, {
                beforeMessageId: m.id
              })
            }
          ) }) : null,
          showHoistedStock ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$6.assistantCard, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            LazyMessageKlineChart,
            {
              charts: hoistedStock.charts,
              liveRefresh: hoistedStock.liveRefresh
            }
          ) }) : null,
          showToolGroup ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            ToolCallGroup,
            {
              tools,
              declaredCount: declaredCount || tools.length,
              toolCalls: m.toolCalls,
              skillNameById
            }
          ) : null
        ] }) : null
      ] }, m.id);
    }),
    showThinking ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${styles$6.row} ${styles$6.rowThinking}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$6.label, children: "灵犀" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        ThinkingBlock,
        {
          content: thinkingText,
          streaming: running,
          inProgress: thinkingInProgress,
          nextNodeStarted: !thinkingInProgress && (Boolean(displayStreamingText) || Boolean(activeToolName) || showPending)
        }
      )
    ] }) : null,
    displayStreamingText ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${styles$6.row} ${styles$6.rowAssistant}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$6.label, children: "灵犀" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${styles$6.assistantCard} ${styles$6.assistantCardStreaming}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        AssistantBody,
        {
          content: displayStreamingText,
          streaming: true,
          contextImagePaths: sessionImagePaths
        }
      ) })
    ] }) : null,
    showPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `${styles$6.row} ${styles$6.rowAssistant}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$6.label, children: "灵犀" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$6.pendingWrap, children: phase === "tool" && activeToolName ? showToolProgress && activeToolProgress ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        ToolProgressBar,
        {
          label: queryToolProgressTitle(activeToolName),
          progress: activeToolProgress
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$6.toolRunning, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, { className: styles$6.toolIcon, spin: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: statusLabel })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TypingIndicator, { label: statusLabel ?? "正在思考…" }) })
    ] }) : null
  ] });
}
function AssistantBody({
  content,
  streaming = false,
  contextImagePaths
}) {
  if (!content && streaming) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(TypingIndicator, { label: "正在思考…" });
  }
  if (!content) return /* @__PURE__ */ jsxRuntimeExports.jsx(Text$3, { type: "secondary", children: "…" });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    MessageRichContent,
    {
      content,
      previewContextPaths: contextImagePaths,
      streaming
    }
  );
}
function toAttachment(path2, hint2) {
  return {
    path: path2,
    kind: queryAttachmentKind(path2, hint2),
    name: queryAttachmentBasename(path2)
  };
}
function useChatAttachments() {
  const [attachments, setAttachments] = reactExports.useState([]);
  const postAddPaths = reactExports.useCallback((nextPaths, hint2) => {
    if (!nextPaths.length) return;
    setAttachments((prev) => {
      const seen = new Set(prev.map((item2) => item2.path));
      const merged = [...prev];
      for (const path2 of nextPaths) {
        const trimmed = path2.trim();
        if (!trimmed || seen.has(trimmed)) continue;
        seen.add(trimmed);
        merged.push(toAttachment(trimmed, hint2));
      }
      return merged;
    });
  }, []);
  const postRemovePath = reactExports.useCallback((path2) => {
    setAttachments((prev) => prev.filter((item2) => item2.path !== path2));
  }, []);
  const postClearAttachments = reactExports.useCallback(() => {
    setAttachments([]);
  }, []);
  const paths = reactExports.useMemo(() => attachments.map((item2) => item2.path), [attachments]);
  return {
    attachments,
    paths,
    postAddPaths,
    postRemovePath,
    postClearAttachments
  };
}
const IMAGE_EXT = /* @__PURE__ */ new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"]);
const VIDEO_EXT = /* @__PURE__ */ new Set([".mp4", ".mov", ".webm", ".mkv"]);
const AUDIO_EXT = /* @__PURE__ */ new Set([".wav", ".mp3", ".m4a", ".aac", ".ogg"]);
const ALLOWED_EXT = /* @__PURE__ */ new Set([
  ...Array.from(IMAGE_EXT),
  ...Array.from(VIDEO_EXT),
  ...Array.from(AUDIO_EXT)
]);
const MIME_TO_EXT = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/bmp": ".bmp",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "video/x-matroska": ".mkv",
  "audio/wav": ".wav",
  "audio/x-wav": ".wav",
  "audio/mpeg": ".mp3",
  "audio/mp3": ".mp3",
  "audio/mp4": ".m4a",
  "audio/aac": ".aac",
  "audio/ogg": ".ogg"
};
function queryExtFromName(name) {
  const base = name.replace(/\\/g, "/").split("/").pop() || name;
  const dot2 = base.lastIndexOf(".");
  if (dot2 <= 0) return "";
  return base.slice(dot2).toLowerCase();
}
function queryIsAllowedChatMedia(name, mimeType = "") {
  const ext = queryExtFromName(name);
  if (ALLOWED_EXT.has(ext)) return true;
  const mime = mimeType.trim().toLowerCase();
  if (mime && MIME_TO_EXT[mime]) return true;
  if (mime.startsWith("image/")) return true;
  return false;
}
function queryGuessName(file, index2) {
  const raw = (file.name || "").trim();
  if (raw && raw !== "image.png") return raw;
  const mime = (file.type || "").toLowerCase();
  const ext = MIME_TO_EXT[mime] || (mime.startsWith("image/") ? ".png" : "");
  if (raw && ext && !queryExtFromName(raw)) return `${raw}${ext}`;
  if (raw) return raw;
  return `paste-${index2 + 1}${ext || ".bin"}`;
}
function queryClipboardAttachments(data) {
  if (!data) return { items: [], skipped: 0 };
  const seen = /* @__PURE__ */ new Set();
  const items = [];
  let skipped = 0;
  const pushLocal = (path2) => {
    const trimmed = path2.trim();
    if (!trimmed || seen.has(`p:${trimmed}`)) return;
    if (!queryIsAllowedChatMedia(trimmed)) {
      skipped += 1;
      return;
    }
    seen.add(`p:${trimmed}`);
    items.push({ kind: "localPath", path: trimmed });
  };
  const pushBlob = (file, index2) => {
    const name = queryGuessName(file, index2);
    const mimeType = (file.type || "").trim();
    if (!queryIsAllowedChatMedia(name, mimeType)) {
      skipped += 1;
      return;
    }
    const key = `b:${name}:${file.size}:${mimeType}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ kind: "blob", name, mimeType, file });
  };
  const files = Array.from(data.files ?? []);
  if (files.length) {
    files.forEach((file, index2) => {
      const localPath = typeof file.path === "string" ? file.path.trim() : "";
      if (localPath) {
        pushLocal(localPath);
        return;
      }
      pushBlob(file, index2);
    });
    return { items, skipped };
  }
  const itemList = data.items;
  if (itemList?.length) {
    for (let i = 0; i < itemList.length; i += 1) {
      const entry = itemList[i];
      if (!entry || entry.kind !== "file") continue;
      const file = entry.getAsFile();
      if (!file) continue;
      const localPath = typeof file.path === "string" ? file.path.trim() : "";
      if (localPath) {
        pushLocal(localPath);
      } else {
        pushBlob(file, i);
      }
    }
  }
  return { items, skipped };
}
function queryReadFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error("读取附件失败"));
    reader.readAsDataURL(file);
  });
}
async function postPersistBlob(item2) {
  try {
    const base64 = await queryReadFileAsBase64(item2.file);
    const result = await postSaveChatUpload({
      name: item2.name,
      mimeType: item2.mimeType,
      base64
    });
    if (!result.ok) {
      staticMethods.warning(result.error);
      return null;
    }
    return result.path;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    staticMethods.warning(`保存附件失败：${msg}`);
    return null;
  }
}
function useChatPasteDrop(options) {
  const { disabled, postAddPaths } = options;
  const postHandleDataTransfer = reactExports.useCallback(
    async (data) => {
      if (disabled) return;
      const { items, skipped } = queryClipboardAttachments(data);
      if (!items.length) {
        if (skipped > 0) {
          staticMethods.warning("仅支持图片 / 视频 / 音频附件");
        }
        return;
      }
      const localPaths = items.filter((item2) => item2.kind === "localPath").map((item2) => item2.path);
      const blobs = items.filter((item2) => item2.kind === "blob");
      const uploaded = [];
      for (const blob of blobs) {
        const path2 = await postPersistBlob(blob);
        if (path2) uploaded.push(path2);
      }
      const all = [...localPaths, ...uploaded];
      if (all.length) {
        postAddPaths(all);
        staticMethods.success(`已添加 ${all.length} 个附件`);
      } else if (skipped > 0 || blobs.length > 0) {
        staticMethods.warning("未能添加附件");
      }
    },
    [disabled, postAddPaths]
  );
  const onPaste = reactExports.useCallback(
    (e) => {
      if (disabled) return;
      const { items } = queryClipboardAttachments(e.clipboardData);
      if (!items.length) return;
      e.preventDefault();
      void postHandleDataTransfer(e.clipboardData);
    },
    [disabled, postHandleDataTransfer]
  );
  const onDrop = reactExports.useCallback(
    (e) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      void postHandleDataTransfer(e.dataTransfer);
    },
    [disabled, postHandleDataTransfer]
  );
  const onDragOver = reactExports.useCallback(
    (e) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
    },
    [disabled]
  );
  return { onPaste, onDrop, onDragOver };
}
const wrap$1 = "_wrap_1kut9_3";
const header$1 = "_header_1kut9_22";
const count = "_count_1kut9_29";
const folders = "_folders_1kut9_34";
const folderRow = "_folderRow_1kut9_40";
const folderIcon = "_folderIcon_1kut9_53";
const folderPath = "_folderPath_1kut9_59";
const mediaStrip = "_mediaStrip_1kut9_70";
const thumbCard = "_thumbCard_1kut9_79";
const thumbFrame = "_thumbFrame_1kut9_97";
const thumbImg = "_thumbImg_1kut9_115";
const thumbVideo = "_thumbVideo_1kut9_123";
const videoBadge = "_videoBadge_1kut9_131";
const thumbLabel = "_thumbLabel_1kut9_148";
const removeBtn = "_removeBtn_1kut9_160";
const placeholder = "_placeholder_1kut9_185";
const audios = "_audios_1kut9_190";
const audioRow = "_audioRow_1kut9_196";
const audioIcon = "_audioIcon_1kut9_207";
const audioMain = "_audioMain_1kut9_220";
const audioName = "_audioName_1kut9_228";
const audioPlayer = "_audioPlayer_1kut9_236";
const styles$4 = {
  wrap: wrap$1,
  header: header$1,
  count,
  folders,
  folderRow,
  folderIcon,
  folderPath,
  mediaStrip,
  thumbCard,
  thumbFrame,
  thumbImg,
  thumbVideo,
  videoBadge,
  thumbLabel,
  removeBtn,
  placeholder,
  audios,
  audioRow,
  audioIcon,
  audioMain,
  audioName,
  audioPlayer
};
const { Text: Text$2 } = Typography;
function AttachmentPreviewList({
  attachments,
  onRemove,
  onClear
}) {
  const [previewMap, setPreviewMap] = reactExports.useState({});
  const attachmentKeys = attachments.map((item2) => `${item2.kind}:${item2.path}`).join("\0");
  reactExports.useEffect(() => {
    if (!attachments.length) {
      setPreviewMap({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const next = {};
      await Promise.all(
        attachments.map(async (item2) => {
          if (item2.kind === "image") {
            const url = await queryLocalImageDataUrl(item2.path);
            if (url) next[item2.path] = url;
            return;
          }
          if (item2.kind === "video" || item2.kind === "audio") {
            const url = await queryLocalMediaUrl(item2.path);
            if (url) next[item2.path] = url;
          }
        })
      );
      if (!cancelled) setPreviewMap(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [attachmentKeys]);
  if (!attachments.length) return null;
  const folders2 = attachments.filter((item2) => item2.kind === "folder");
  const visuals = attachments.filter((item2) => item2.kind === "image" || item2.kind === "video");
  const audios2 = attachments.filter((item2) => item2.kind === "audio");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.wrap, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.header, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Text$2, { className: styles$4.count, children: [
        "已选 ",
        attachments.length,
        " 项附件"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "link", size: "small", onClick: onClear, children: "清除" })
    ] }),
    folders2.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.folders, children: folders2.map((item2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.folderRow, title: item2.path, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, { className: styles$4.folderIcon }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Text$2, { className: styles$4.folderPath, children: item2.path }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          type: "text",
          size: "small",
          className: styles$4.removeBtn,
          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$6, {}),
          "aria-label": `移除文件夹 ${item2.name}`,
          onClick: () => onRemove(item2.path)
        }
      )
    ] }, item2.path)) }) : null,
    visuals.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.mediaStrip, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Image.PreviewGroup, { children: visuals.map((item2, index2) => {
      const previewUrl = previewMap[item2.path];
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: styles$4.thumbCard,
          style: { animationDelay: `${index2 * 40}ms` },
          title: item2.path,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.thumbFrame, children: item2.kind === "image" && previewUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Image,
              {
                src: previewUrl,
                alt: item2.name,
                width: 72,
                height: 72,
                className: styles$4.thumbImg,
                preview: { src: previewUrl }
              }
            ) : item2.kind === "video" && previewUrl ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "video",
                {
                  className: styles$4.thumbVideo,
                  src: previewUrl,
                  muted: true,
                  preload: "metadata",
                  playsInline: true
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$4.videoBadge, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$7, {}) })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$4.placeholder, children: item2.kind === "video" ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$9, {}) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$4.thumbLabel, children: item2.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "text",
                size: "small",
                className: styles$4.removeBtn,
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$6, {}),
                "aria-label": `移除 ${item2.name}`,
                onClick: () => onRemove(item2.path)
              }
            )
          ]
        },
        item2.path
      );
    }) }) }) : null,
    audios2.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.audios, children: audios2.map((item2) => {
      const previewUrl = previewMap[item2.path];
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.audioRow, title: item2.path, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$4.audioIcon, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$a, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.audioMain, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Text$2, { className: styles$4.audioName, children: item2.name }),
          previewUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "audio",
            {
              className: styles$4.audioPlayer,
              controls: true,
              preload: "metadata",
              src: previewUrl
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(Text$2, { type: "secondary", style: { fontSize: 11 }, children: "加载预览中…" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "text",
            size: "small",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$6, {}),
            "aria-label": `移除音频 ${item2.name}`,
            onClick: () => onRemove(item2.path)
          }
        )
      ] }, item2.path);
    }) }) : null
  ] });
}
const wrap = "_wrap_1shjf_1";
const inner = "_inner_1shjf_16";
const awaitBar = "_awaitBar_1shjf_22";
const awaitMain = "_awaitMain_1shjf_38";
const choiceGroup = "_choiceGroup_1shjf_46";
const awaitText = "_awaitText_1shjf_52";
const statusBar = "_statusBar_1shjf_59";
const box = "_box_1shjf_82";
const textarea = "_textarea_1shjf_103";
const toolbar = "_toolbar_1shjf_131";
const dot = "_dot_1shjf_141";
const accessBtn = "_accessBtn_1shjf_155";
const accessChevron = "_accessChevron_1shjf_162";
const modelSelect = "_modelSelect_1shjf_168";
const modelChevron = "_modelChevron_1shjf_199";
const modelSelectPopup = "_modelSelectPopup_1shjf_206";
const sendBtn = "_sendBtn_1shjf_244";
const stopBtn = "_stopBtn_1shjf_279";
const skillPicker = "_skillPicker_1shjf_293";
const skillPickerHint = "_skillPickerHint_1shjf_300";
const styles$3 = {
  wrap,
  inner,
  awaitBar,
  awaitMain,
  choiceGroup,
  awaitText,
  statusBar,
  box,
  textarea,
  toolbar,
  dot,
  accessBtn,
  accessChevron,
  modelSelect,
  modelChevron,
  modelSelectPopup,
  sendBtn,
  stopBtn,
  skillPicker,
  skillPickerHint
};
const { Text: Text$1 } = Typography;
const MODEL_SELECT_LIST_HEIGHT = 280;
const ATTACHMENT_ONLY_PROMPT = "请根据附件内容回答（图片文字已由本机系统识别）";
function ChatInput({
  disabled,
  sendDisabledHint,
  running,
  streamingText = "",
  activeToolName = null,
  activeToolArgs = null,
  activeToolProgress = null,
  activeModelLabel = null,
  skillNameById,
  awaitUserReason,
  awaitUserChoices = null,
  tokenUsed = 0,
  selectedSkillIds = [],
  onSelectedSkillIdsChange,
  onSend,
  onAbort,
  onContinue
}) {
  const [text2, setText] = reactExports.useState("");
  const [modelSwitching, setModelSwitching] = reactExports.useState(false);
  const [skillPopoverOpen, setSkillPopoverOpen] = reactExports.useState(false);
  const {
    attachments,
    paths,
    postAddPaths,
    postRemovePath,
    postClearAttachments
  } = useChatAttachments();
  const settings = useSettingsStore((s) => s.settings);
  const postSettings = useSettingsStore((s) => s.postSettings);
  const skills = useSkillsStore((s) => s.skills);
  const hydrateSkills = useSkillsStore((s) => s.hydrate);
  const awaitingUser = Boolean(awaitUserReason);
  const inputDisabled = disabled || running && !awaitingUser;
  const { onPaste, onDrop, onDragOver } = useChatPasteDrop({
    disabled: inputDisabled,
    postAddPaths
  });
  const canSend = Boolean(text2.trim() || paths.length);
  reactExports.useEffect(() => {
    void hydrateSkills();
  }, [hydrateSkills]);
  const customSkills = reactExports.useMemo(() => skills.filter((s) => !s.isBuiltin), [skills]);
  const builtinSkills = reactExports.useMemo(() => skills.filter((s) => s.isBuiltin), [skills]);
  const generalChatConnection = reactExports.useMemo(
    () => queryGeneralChatModelConnection(settings),
    [settings]
  );
  const activeChatModelId = reactExports.useMemo(() => queryGeneralChatModelId(settings), [settings]);
  const providerMismatch = generalChatConnection.provider !== settings.provider && Boolean(generalChatConnection.apiKey.trim());
  const statusLabel = reactExports.useMemo(
    () => queryAgentStatusLabel({
      running: Boolean(running),
      streamingText,
      activeToolName,
      activeToolArgs,
      skillNameById,
      activeToolProgress,
      awaitUserReason: awaitUserReason ?? null,
      activeModelLabel
    }),
    [
      running,
      streamingText,
      activeToolName,
      activeToolArgs,
      skillNameById,
      activeToolProgress,
      awaitUserReason,
      activeModelLabel
    ]
  );
  const handleModelChange = async (model) => {
    const next = model.trim();
    if (!next || next === activeChatModelId) return;
    const resolved = queryResolveModelForProvider(
      settings.provider,
      next,
      settings.providerModelCatalog,
      settings.customProviders ?? []
    );
    setModelSwitching(true);
    try {
      await postSettings({ model: resolved });
      if (resolved !== next) {
        appMessage.warning(
          `「${next}」与当前供应商 API 不兼容，已切换为 ${queryModelLabel(resolved)}`
        );
      } else {
        appMessage.success(`已切换至 ${queryModelLabel(resolved)}`);
      }
    } finally {
      setModelSwitching(false);
    }
  };
  const modelSelectOptions = reactExports.useMemo(() => {
    const catalogOptions = queryChatModelOptionsFromCatalog(
      settings.provider,
      settings.providerModelCatalog
    );
    const options = catalogOptions.map((m) => ({
      value: m.value,
      label: queryModelOptionDisplayLabel(m),
      searchText: [m.label, m.value, m.category || queryModelCategory(m.value), m.description].filter(Boolean).join(" ")
    }));
    if (activeChatModelId && !options.some((item2) => item2.value === activeChatModelId) && !providerMismatch) {
      options.unshift({
        value: activeChatModelId,
        label: queryModelLabel(activeChatModelId),
        searchText: activeChatModelId
      });
    }
    return options;
  }, [
    settings.provider,
    settings.providerModelCatalog,
    activeChatModelId,
    providerMismatch
  ]);
  const handleContinue = (choiceId) => {
    const value = text2.trim();
    onContinue(value || void 0, choiceId);
    setText("");
    postClearAttachments();
  };
  const handleChoiceClick = (choiceId) => {
    handleContinue(choiceId);
  };
  const handleSend = () => {
    if (disabled) return;
    const value = text2.trim();
    if (awaitingUser) {
      handleContinue();
      return;
    }
    if (running) return;
    if (!value && !paths.length) return;
    onSend(value || ATTACHMENT_ONLY_PROMPT, paths);
    setText("");
    postClearAttachments();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.wrap, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.inner, children: [
    awaitUserReason ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.awaitBar, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.awaitMain, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { className: styles$3.awaitText, children: awaitUserReason }),
        awaitUserChoices?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.choiceGroup, children: awaitUserChoices.map((choice) => /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: choice.description, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", onClick: () => handleChoiceClick(choice.id), children: choice.label }) }, choice.id)) }) : null
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$b, {}), onClick: () => handleContinue(), children: "继续" })
    ] }) : null,
    running && !awaitUserReason && statusLabel ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.statusBar, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TypingIndicator, { label: statusLabel, compact: true }) }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AttachmentPreviewList,
      {
        attachments,
        onRemove: postRemovePath,
        onClear: postClearAttachments
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: styles$3.box,
        "data-running": running,
        onDrop,
        onDragOver,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              className: styles$3.textarea,
              placeholder: awaitingUser ? awaitUserChoices?.length ? "可点击上方方案，或输入如「选方案B」后发送" : "可输入补充说明，Enter 或点「继续」一并提交给 Agent" : running ? "Agent 正在处理，请稍候…" : disabled ? sendDisabledHint ?? "当前不可发送消息" : "描述任务，可粘贴/拖入图片或文件；Enter 发送，Shift+Enter 换行…",
              value: text2,
              rows: 2,
              disabled: inputDisabled,
              onChange: (e) => setText(e.target.value),
              onPaste,
              onKeyDown: (e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.toolbar, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { size: 4, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Dropdown,
                {
                  disabled: running,
                  menu: {
                    items: [
                      {
                        key: "media",
                        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$9, {}),
                        label: "上传媒体（图片 / 视频 / 音频）",
                        onClick: () => {
                          void (async () => {
                            const selected = await postSelectImages();
                            if (selected.length) postAddPaths(selected);
                          })();
                        }
                      },
                      {
                        key: "folder",
                        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
                        label: "选择文件夹",
                        onClick: () => {
                          void (async () => {
                            const dir = await postSelectDirectory();
                            if (dir) postAddPaths([dir], "folder");
                          })();
                        }
                      }
                    ]
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "text", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}), disabled: running })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Popover,
                {
                  trigger: "click",
                  open: skillPopoverOpen,
                  onOpenChange: setSkillPopoverOpen,
                  placement: "topLeft",
                  title: "学习技能",
                  content: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.skillPicker, children: [
                    builtinSkills.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Text$1, { type: "secondary", className: styles$3.skillPickerHint, children: [
                      "已全局注入 ",
                      builtinSkills.length,
                      " 个内置技能",
                      builtinSkills.length <= 4 ? `：${builtinSkills.map((s) => s.name).join("、")}` : ""
                    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { type: "secondary", className: styles$3.skillPickerHint, children: "当前无内置技能" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { type: "secondary", className: styles$3.skillPickerHint, children: "自定义技能可在技能市场开全局注入，或在此勾选后注入本会话" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Select,
                      {
                        mode: "multiple",
                        allowClear: true,
                        showSearch: true,
                        placeholder: customSkills.length ? "选择要注入的自定义技能" : "暂无自定义技能",
                        disabled: !onSelectedSkillIdsChange || customSkills.length === 0,
                        value: selectedSkillIds,
                        optionFilterProp: "label",
                        style: { width: 320 },
                        options: customSkills.map((s) => ({
                          value: s.id,
                          label: s.name,
                          title: s.description
                        })),
                        onChange: (ids) => onSelectedSkillIdsChange?.(ids)
                      }
                    )
                  ] }),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "学习技能：为本会话选用自定义技能", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Badge,
                    {
                      count: selectedSkillIds.length,
                      size: "small",
                      offset: [-2, 2],
                      overflowCount: 99,
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "text",
                          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$c, {}),
                          disabled: running || disabled
                        }
                      )
                    }
                  ) })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Dropdown,
                {
                  menu: {
                    items: [
                      {
                        key: "full",
                        label: settings.fullAccess ? "切换为需确认" : "切换为完全访问",
                        onClick: () => void postSettings({ fullAccess: !settings.fullAccess })
                      }
                    ]
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "text", size: "small", className: styles$3.accessBtn, disabled: running, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Tooltip,
                      {
                        title: settings.fullAccess ? "完全访问：跳过敏感确认与方案选择；自动发布/流程连续执行（确认节点、扫码、渲染除外）" : "需确认模式：敏感操作与多方案选择前会暂停确认",
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.dot, "data-on": settings.fullAccess })
                      }
                    ),
                    settings.fullAccess ? "完全访问" : "需确认",
                    /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$d, { className: styles$3.accessChevron })
                  ] })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Tooltip,
                {
                  title: running ? "任务运行中，请结束后再切换模型" : providerMismatch ? `当前选用供应商与默认对话连接不一致，实际调用 ${generalChatConnection.model}（${generalChatConnection.label}）。请在设置中保存「模型与 API」或调整多模型连接。` : modelSelectOptions.length === 0 ? "请先在设置 → 模型与 API → 管理模型 中登记模型" : "展示默认对话连接正在使用的模型；列表为当前供应商本机登记项",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Select,
                    {
                      showSearch: true,
                      size: "small",
                      className: styles$3.modelSelect,
                      classNames: { popup: { root: styles$3.modelSelectPopup } },
                      disabled: inputDisabled || running || providerMismatch,
                      loading: modelSwitching,
                      value: providerMismatch ? generalChatConnection.model : activeChatModelId,
                      options: modelSelectOptions,
                      listHeight: MODEL_SELECT_LIST_HEIGHT,
                      popupMatchSelectWidth: 320,
                      placeholder: modelSelectOptions.length === 0 ? "暂无登记模型" : "搜索模型",
                      optionFilterProp: "searchText",
                      filterOption: (input, option) => {
                        const hay = String(option?.searchText ?? option?.label ?? "").toLowerCase();
                        return hay.includes(input.trim().toLowerCase());
                      },
                      onChange: (v) => void handleModelChange(String(v)),
                      suffixIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$d, { className: styles$3.modelChevron })
                    }
                  )
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { size: 10, children: [
              running && !awaitingUser ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  danger: true,
                  shape: "circle",
                  className: styles$3.stopBtn,
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}),
                  onClick: onAbort
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                Tooltip,
                {
                  title: disabled ? sendDisabledHint ?? "当前不可发送消息" : awaitingUser ? !text2.trim() && !paths.length ? "可输入说明或直接继续" : "发送并继续" : !canSend ? "请输入消息或添加附件" : "发送",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: "primary",
                      shape: "circle",
                      className: styles$3.sendBtn,
                      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$e, {}),
                      disabled: !canSend || disabled || running && !awaitingUser,
                      onClick: handleSend
                    }
                  )
                }
              ),
              running && awaitingUser ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "中止当前流程", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  danger: true,
                  shape: "circle",
                  className: styles$3.stopBtn,
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}),
                  onClick: onAbort
                }
              ) }) : null
            ] })
          ] })
        ]
      }
    )
  ] }) });
}
function queryChecklistTaskStatus(status, execution) {
  if (status === "running" && !execution.running && execution.canResume) {
    return "paused";
  }
  return status;
}
const root = "_root_gk2j9_4";
const rootDragging = "_rootDragging_gk2j9_11";
const rootMorphToOrb = "_rootMorphToOrb_gk2j9_15";
const orb = "_orb_gk2j9_15";
const rootMorphToPanel = "_rootMorphToPanel_gk2j9_19";
const card = "_card_gk2j9_19";
const taskRow = "_taskRow_gk2j9_25";
const orbRing = "_orbRing_gk2j9_105";
const orbCore = "_orbCore_gk2j9_118";
const orbCount = "_orbCount_gk2j9_132";
const orbSpinner = "_orbSpinner_gk2j9_141";
const orbHint = "_orbHint_gk2j9_146";
const orbRunning = "_orbRunning_gk2j9_164";
const orbDone = "_orbDone_gk2j9_168";
const orbEdge_right = "_orbEdge_right_gk2j9_193";
const cardFirstAppear = "_cardFirstAppear_gk2j9_224";
const cardOpaque = "_cardOpaque_gk2j9_230";
const dragHandle = "_dragHandle_gk2j9_286";
const dragging = "_dragging_gk2j9_296";
const dragIcon = "_dragIcon_gk2j9_300";
const headerMain = "_headerMain_gk2j9_312";
const headerRow = "_headerRow_gk2j9_320";
const headerTitle = "_headerTitle_gk2j9_327";
const headerActions = "_headerActions_gk2j9_334";
const headerMeta = "_headerMeta_gk2j9_341";
const headerMetaDone = "_headerMetaDone_gk2j9_349";
const collapseBtn = "_collapseBtn_gk2j9_354";
const collapseIcon = "_collapseIcon_gk2j9_376";
const progressTrack = "_progressTrack_gk2j9_381";
const progressFill = "_progressFill_gk2j9_388";
const taskList = "_taskList_gk2j9_396";
const taskRowDone = "_taskRowDone_gk2j9_435";
const taskRowChild = "_taskRowChild_gk2j9_440";
const taskContent = "_taskContent_gk2j9_440";
const statusIcon = "_statusIcon_gk2j9_445";
const iconDone = "_iconDone_gk2j9_457";
const iconFailed = "_iconFailed_gk2j9_462";
const iconSkipped = "_iconSkipped_gk2j9_467";
const iconRunning = "_iconRunning_gk2j9_473";
const iconPaused = "_iconPaused_gk2j9_478";
const iconPending = "_iconPending_gk2j9_483";
const statusRunningRing = "_statusRunningRing_gk2j9_492";
const taskTitle = "_taskTitle_gk2j9_520";
const taskTitleDone = "_taskTitleDone_gk2j9_527";
const taskTitleRunning = "_taskTitleRunning_gk2j9_533";
const taskTitlePaused = "_taskTitlePaused_gk2j9_538";
const taskTitleFailed = "_taskTitleFailed_gk2j9_543";
const taskTitleSkipped = "_taskTitleSkipped_gk2j9_547";
const taskRowSkipped = "_taskRowSkipped_gk2j9_552";
const taskBadge = "_taskBadge_gk2j9_556";
const badgeRunning = "_badgeRunning_gk2j9_567";
const badgePaused = "_badgePaused_gk2j9_573";
const badgeFailed = "_badgeFailed_gk2j9_578";
const badgeSkipped = "_badgeSkipped_gk2j9_583";
const actionBar = "_actionBar_gk2j9_610";
const awaitReason = "_awaitReason_gk2j9_622";
const runningHint = "_runningHint_gk2j9_630";
const actionBtn = "_actionBtn_gk2j9_637";
const summarizeCard = "_summarizeCard_gk2j9_642";
const summarizeCardTitle = "_summarizeCardTitle_gk2j9_668";
const summarizeCardAction = "_summarizeCardAction_gk2j9_672";
const summarizeCardHead = "_summarizeCardHead_gk2j9_696";
const summarizeCardTitleRow = "_summarizeCardTitleRow_gk2j9_703";
const summarizeCardIcon = "_summarizeCardIcon_gk2j9_710";
const summarizeStepBadge = "_summarizeStepBadge_gk2j9_734";
const summarizeCardDesc = "_summarizeCardDesc_gk2j9_751";
const summarizeCardFooter = "_summarizeCardFooter_gk2j9_763";
const summarizeCardMeta = "_summarizeCardMeta_gk2j9_772";
const summarizeCardActionIcon = "_summarizeCardActionIcon_gk2j9_787";
const styles$2 = {
  root,
  rootDragging,
  rootMorphToOrb,
  orb,
  rootMorphToPanel,
  card,
  taskRow,
  orbRing,
  orbCore,
  orbCount,
  orbSpinner,
  orbHint,
  orbRunning,
  orbDone,
  orbEdge_right,
  cardFirstAppear,
  cardOpaque,
  dragHandle,
  dragging,
  dragIcon,
  headerMain,
  headerRow,
  headerTitle,
  headerActions,
  headerMeta,
  headerMetaDone,
  collapseBtn,
  collapseIcon,
  progressTrack,
  progressFill,
  taskList,
  taskRowDone,
  taskRowChild,
  taskContent,
  statusIcon,
  iconDone,
  iconFailed,
  iconSkipped,
  iconRunning,
  iconPaused,
  iconPending,
  statusRunningRing,
  taskTitle,
  taskTitleDone,
  taskTitleRunning,
  taskTitlePaused,
  taskTitleFailed,
  taskTitleSkipped,
  taskRowSkipped,
  taskBadge,
  badgeRunning,
  badgePaused,
  badgeFailed,
  badgeSkipped,
  actionBar,
  awaitReason,
  runningHint,
  actionBtn,
  summarizeCard,
  summarizeCardTitle,
  summarizeCardAction,
  summarizeCardHead,
  summarizeCardTitleRow,
  summarizeCardIcon,
  summarizeStepBadge,
  summarizeCardDesc,
  summarizeCardFooter,
  summarizeCardMeta,
  summarizeCardActionIcon
};
const hint = "_hint_al410_1";
const hintIcon = "_hintIcon_al410_14";
const form = "_form_al410_20";
const footer = "_footer_al410_24";
const styles$1 = {
  hint,
  hintIcon,
  form,
  footer
};
function SummarizeSkillModal({
  open,
  sessionId,
  successfulStepCount,
  onClose,
  onPublished
}) {
  const [form2] = Form.useForm();
  const [summarizing, setSummarizing] = reactExports.useState(false);
  const [publishing, setPublishing] = reactExports.useState(false);
  const [draftLoaded, setDraftLoaded] = reactExports.useState(false);
  const [enableAfterPublish, setEnableAfterPublish] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (!open || !sessionId) {
      setDraftLoaded(false);
      return;
    }
    let cancelled = false;
    setSummarizing(true);
    setDraftLoaded(false);
    void postSummarizeSkillFromSession(sessionId).then((draft) => {
      if (cancelled) return;
      form2.setFieldsValue(draft);
      setDraftLoaded(true);
    }).catch((err) => {
      if (cancelled) return;
      appMessage.error(err instanceof Error ? err.message : "总结失败");
      onClose();
    }).finally(() => {
      if (!cancelled) setSummarizing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, sessionId, form2, onClose]);
  const handlePublish = async () => {
    try {
      const values = await form2.validateFields();
      const normalizedId = slugifySkillId(values.id);
      if (!isValidSkillId(normalizedId)) {
        appMessage.error("技能 id 仅允许小写字母、数字和连字符");
        return;
      }
      setPublishing(true);
      const detail2 = await postProjectSkill({
        ...values,
        id: normalizedId,
        examplesContent: values.examplesContent?.trim() || void 0
      });
      if (enableAfterPublish) {
        await postSkillStates({ [detail2.id]: { enabled: true } });
      }
      appMessage.success(
        enableAfterPublish ? `技能「${detail2.name}」已发布并启用，可在技能市场查看` : `技能「${detail2.name}」已保存到技能市场`
      );
      onPublished?.(detail2.id);
      onClose();
    } catch (err) {
      if (err instanceof Error && err.message !== "validation") {
        appMessage.error(err.message);
      }
    } finally {
      setPublishing(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      title: "总结为技能并发布",
      open,
      onCancel: onClose,
      width: 720,
      destroyOnHidden: true,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.footer, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Checkbox,
          {
            checked: enableAfterPublish,
            onChange: (e) => setEnableAfterPublish(e.target.checked),
            disabled: summarizing || publishing,
            children: "发布后立即启用"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onClose, disabled: publishing, children: "取消" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "primary",
              loading: publishing,
              disabled: summarizing || !draftLoaded,
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$g, {}),
              onClick: () => void handlePublish(),
              children: "发布到技能市场"
            }
          )
        ] })
      ] }),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Spin, { spinning: summarizing, tip: "正在总结成功步骤经验…", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.hint, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$f, { className: styles$1.hintIcon }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "将从 ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: successfulStepCount }),
            " 个成功执行的步骤中提炼经验，失败与未执行的步骤已自动剔除。 发布后将保存到技能市场的「我的技能」。"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Form,
          {
            form: form2,
            layout: "vertical",
            disabled: summarizing || publishing,
            className: styles$1.form,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Form.Item,
                {
                  name: "id",
                  label: "技能 ID（目录名）",
                  rules: [
                    { required: true, message: "请输入技能 id" },
                    {
                      validator: (_, value) => isValidSkillId(value) ? Promise.resolve() : Promise.reject(new Error("格式无效"))
                    }
                  ],
                  extra: "仅小写字母、数字、连字符",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "my-workflow-skill" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Form.Item,
                {
                  name: "name",
                  label: "名称",
                  rules: [{ required: true, message: "请输入名称" }],
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      placeholder: "技能展示名称",
                      onChange: (e) => {
                        form2.setFieldValue("id", slugifySkillId(e.target.value));
                      }
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Form.Item,
                {
                  name: "description",
                  label: "描述",
                  rules: [{ required: true, message: "请输入描述" }],
                  extra: "Agent 用此描述判断何时启用该技能",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 2, placeholder: "描述技能用途与触发场景" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Form.Item,
                {
                  name: "content",
                  label: "正文（Markdown）",
                  rules: [{ required: true, message: "请输入正文" }],
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 12, placeholder: "# 技能标题\n\n## 标准任务清单..." })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "examplesContent", label: "示例（可选）", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 4, placeholder: "# 示例场景..." }) })
            ]
          }
        )
      ] })
    }
  );
}
function queryCanSummarizeTasksToSkill(tasks, running, awaitUserReason) {
  if (running || awaitUserReason) return false;
  if (tasks.length === 0) return false;
  const hasDone = tasks.some((t) => t.status === "done");
  if (!hasDone) return false;
  const hasIncomplete = tasks.some((t) => t.status === "running" || t.status === "pending");
  return !hasIncomplete;
}
function querySuccessfulTaskCount(tasks) {
  return tasks.filter((t) => t.status === "done").length;
}
const DEFAULT_TOP = 100;
const CLICK_MOVE_TOLERANCE = 6;
const ANCHOR_SELECTOR = "[data-task-checklist-anchor]";
const POSITION_STORAGE_KEY = "react-agent:task-checklist-position";
function readTaskChecklistUiStorage() {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
function postTaskChecklistUiStorage(patch) {
  localStorage.setItem(
    POSITION_STORAGE_KEY,
    JSON.stringify({ ...readTaskChecklistUiStorage(), ...patch })
  );
}
function loadSavedY(anchorTop) {
  const parsed = readTaskChecklistUiStorage();
  if (typeof parsed.y !== "number") return anchorTop + DEFAULT_TOP;
  if (parsed.space === "viewport") return parsed.y;
  return anchorTop + parsed.y;
}
function loadSavedContentExpanded() {
  const stored = readTaskChecklistUiStorage().contentExpanded;
  return typeof stored === "boolean" ? stored : true;
}
function postSavedY(y) {
  postTaskChecklistUiStorage({ y, space: "viewport" });
}
function queryAnchorEl(fromEl) {
  return fromEl.closest(ANCHOR_SELECTOR);
}
function clampFixedVerticalY(y, elementHeight, anchorEl) {
  const rect = anchorEl.getBoundingClientRect();
  const minY = rect.top;
  const maxY = rect.bottom - elementHeight;
  return Math.min(Math.max(minY, y), maxY);
}
function TaskStatusIcon({ status }) {
  if (status === "done") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$l, { className: styles$2.iconDone });
  }
  if (status === "failed") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$m, { className: styles$2.iconFailed });
  }
  if (status === "skipped") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$n, { className: styles$2.iconSkipped });
  }
  if (status === "running") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.statusRunningRing, "aria-hidden": true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$h, { className: styles$2.iconRunning, spin: true })
    ] });
  }
  if (status === "paused") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, { className: styles$2.iconPaused });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.iconPending, "aria-hidden": true });
}
function queryTaskTitleClass(status) {
  return [
    styles$2.taskTitle,
    status === "done" && styles$2.taskTitleDone,
    status === "running" && styles$2.taskTitleRunning,
    status === "paused" && styles$2.taskTitlePaused,
    status === "failed" && styles$2.taskTitleFailed,
    status === "skipped" && styles$2.taskTitleSkipped
  ].filter(Boolean).join(" ");
}
function queryTaskRowClass(status) {
  return [
    styles$2.taskRow,
    status === "done" && styles$2.taskRowDone,
    status === "skipped" && styles$2.taskRowSkipped
  ].filter(Boolean).join(" ");
}
const { Text } = Typography;
function TaskChecklist({
  tasks,
  visible,
  sessionId = null,
  running = false,
  awaitUserReason = null,
  canResume = false,
  onAbort,
  onContinue,
  onResume
}) {
  const rootRef = reactExports.useRef(null);
  const [summarizeOpen, setSummarizeOpen] = reactExports.useState(false);
  const [positionY, setPositionY] = reactExports.useState(DEFAULT_TOP);
  const [dragging2, setDragging] = reactExports.useState(false);
  const [contentExpanded, setContentExpanded] = reactExports.useState(loadSavedContentExpanded);
  const [morphPhase, setMorphPhase] = reactExports.useState("idle");
  const dragOffsetYRef = reactExports.useRef(0);
  const pointerStartYRef = reactExports.useRef(0);
  const movedDuringDragRef = reactExports.useRef(false);
  const hasShownPanelRef = reactExports.useRef(false);
  const positionInitializedRef = reactExports.useRef(false);
  const positionYRef = reactExports.useRef(DEFAULT_TOP);
  const handleCollapseToOrb = reactExports.useCallback(
    (event) => {
      event.stopPropagation();
      event.preventDefault();
      setMorphPhase("to-orb");
      setContentExpanded(false);
    },
    []
  );
  const handleExpandFromOrb = reactExports.useCallback(() => {
    setMorphPhase("to-panel");
    setContentExpanded(true);
  }, []);
  const progress = reactExports.useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const percent2 = total > 0 ? Math.round(done / total * 100) : 0;
    return { total, done, percent: percent2 };
  }, [tasks]);
  const hasRunningTask = running && tasks.some((t) => t.status === "running");
  const syncLayout = reactExports.useCallback(() => {
    const el = rootRef.current;
    const anchorEl = el ? queryAnchorEl(el) : null;
    if (!el || !anchorEl) return;
    const height = el.getBoundingClientRect().height;
    const anchorTop = anchorEl.getBoundingClientRect().top;
    setPositionY((prev) => {
      const baseY = positionInitializedRef.current ? prev : loadSavedY(anchorTop);
      if (!positionInitializedRef.current) {
        positionInitializedRef.current = true;
      }
      return clampFixedVerticalY(baseY, height, anchorEl);
    });
  }, []);
  reactExports.useEffect(() => {
    positionYRef.current = positionY;
  }, [positionY]);
  reactExports.useEffect(() => {
    postTaskChecklistUiStorage({ contentExpanded });
  }, [contentExpanded]);
  reactExports.useEffect(() => {
    window.addEventListener("resize", syncLayout);
    return () => window.removeEventListener("resize", syncLayout);
  }, [syncLayout]);
  reactExports.useLayoutEffect(() => {
    if (!visible) return;
    syncLayout();
    if (contentExpanded) {
      hasShownPanelRef.current = true;
    }
  }, [visible, contentExpanded, syncLayout]);
  reactExports.useEffect(() => {
    if (morphPhase === "idle") return;
    const timer = window.setTimeout(() => setMorphPhase("idle"), 420);
    return () => window.clearTimeout(timer);
  }, [morphPhase]);
  const handleDragStart = reactExports.useCallback((event) => {
    const el = rootRef.current;
    if (!el) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const elRect = el.getBoundingClientRect();
    dragOffsetYRef.current = event.clientY - elRect.top;
    pointerStartYRef.current = event.clientY;
    movedDuringDragRef.current = false;
    setDragging(true);
  }, []);
  const handleDragMove = reactExports.useCallback(
    (event) => {
      if (!dragging2) return;
      const el = rootRef.current;
      const anchorEl = el ? queryAnchorEl(el) : null;
      if (!el || !anchorEl) return;
      const dy = event.clientY - pointerStartYRef.current;
      if (Math.abs(dy) > CLICK_MOVE_TOLERANCE) {
        movedDuringDragRef.current = true;
      }
      const height = el.getBoundingClientRect().height;
      const nextY = clampFixedVerticalY(
        event.clientY - dragOffsetYRef.current,
        height,
        anchorEl
      );
      positionYRef.current = nextY;
      setPositionY(nextY);
    },
    [dragging2]
  );
  const handleDragEnd = reactExports.useCallback(
    (event) => {
      if (!dragging2) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      setDragging(false);
      if (movedDuringDragRef.current) {
        const el = rootRef.current;
        const anchorEl = el ? queryAnchorEl(el) : null;
        if (el && anchorEl) {
          const height = el.getBoundingClientRect().height;
          const savedY = clampFixedVerticalY(
            event.clientY - dragOffsetYRef.current,
            height,
            anchorEl
          );
          positionYRef.current = savedY;
          postSavedY(savedY);
        }
      }
      if (!contentExpanded && !movedDuringDragRef.current) {
        handleExpandFromOrb();
      }
    },
    [dragging2, contentExpanded, handleExpandFromOrb]
  );
  const showActionBar = Boolean(awaitUserReason) || running && Boolean(onAbort) || canResume && Boolean(onResume);
  const canSummarizeToSkill = queryCanSummarizeTasksToSkill(tasks, running, awaitUserReason);
  const successfulStepCount = querySuccessfulTaskCount(tasks);
  const setView = useAppStore((s) => s.setView);
  const summarizeModal = /* @__PURE__ */ jsxRuntimeExports.jsx(
    SummarizeSkillModal,
    {
      open: summarizeOpen,
      sessionId,
      successfulStepCount,
      onClose: () => setSummarizeOpen(false),
      onPublished: () => setView("skills")
    }
  );
  if (!visible || tasks.length === 0) return null;
  const rootClass = [
    styles$2.root,
    dragging2 ? styles$2.rootDragging : "",
    morphPhase === "to-orb" ? styles$2.rootMorphToOrb : "",
    morphPhase === "to-panel" ? styles$2.rootMorphToPanel : ""
  ].filter(Boolean).join(" ");
  if (!contentExpanded) {
    const ringStyle = {
      "--orb-progress": `${progress.percent}`
    };
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          ref: rootRef,
          className: rootClass,
          style: { top: positionY },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: [
                styles$2.orb,
                styles$2.orbEdge_right,
                hasRunningTask || running ? styles$2.orbRunning : "",
                progress.done === progress.total && progress.total > 0 ? styles$2.orbDone : ""
              ].filter(Boolean).join(" "),
              style: ringStyle,
              "aria-label": `展开任务清单 ${progress.done}/${progress.total}`,
              title: "点击展开任务清单",
              onPointerDown: handleDragStart,
              onPointerMove: handleDragMove,
              onPointerUp: handleDragEnd,
              onPointerCancel: handleDragEnd,
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  movedDuringDragRef.current = false;
                  handleExpandFromOrb();
                }
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.orbRing, "aria-hidden": true }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.orbCore, children: hasRunningTask || running ? /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$h, { className: styles$2.orbSpinner, spin: true }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.orbCount, children: [
                  progress.done,
                  "/",
                  progress.total
                ] }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.orbHint, "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$i, {}) })
              ]
            }
          )
        }
      ),
      summarizeModal
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: rootRef,
      className: rootClass,
      style: { top: positionY },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Card,
          {
            size: "small",
            title: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: `${styles$2.dragHandle} ${dragging2 ? styles$2.dragging : ""}`,
                onPointerDown: handleDragStart,
                onPointerMove: handleDragMove,
                onPointerUp: handleDragEnd,
                onPointerCancel: handleDragEnd,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$j, { className: styles$2.dragIcon, "aria-hidden": true }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.headerMain, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.headerRow, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.headerTitle, children: "任务清单" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.headerActions, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(
                          "span",
                          {
                            className: `${styles$2.headerMeta} ${progress.done === progress.total ? styles$2.headerMetaDone : ""}`,
                            children: [
                              progress.done,
                              "/",
                              progress.total
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          "button",
                          {
                            type: "button",
                            className: styles$2.collapseBtn,
                            "aria-label": "收起为圆球",
                            "aria-expanded": true,
                            onPointerDown: (e) => e.stopPropagation(),
                            onClick: handleCollapseToOrb,
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$k, { className: styles$2.collapseIcon })
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.progressTrack, "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "div",
                      {
                        className: styles$2.progressFill,
                        style: { width: `${progress.percent}%` }
                      }
                    ) })
                  ] })
                ]
              }
            ),
            className: [
              styles$2.card,
              dragging2 ? styles$2.cardOpaque : "",
              !hasShownPanelRef.current && morphPhase !== "to-panel" ? styles$2.cardFirstAppear : ""
            ].filter(Boolean).join(" "),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: styles$2.taskList, children: tasks.map((item2, index2) => {
                const displayStatus = queryChecklistTaskStatus(item2.status, {
                  running,
                  canResume
                });
                return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "li",
                  {
                    "data-status": displayStatus,
                    className: [
                      queryTaskRowClass(displayStatus),
                      item2.parentId ? styles$2.taskRowChild : ""
                    ].filter(Boolean).join(" "),
                    style: { "--task-index": index2 },
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.statusIcon, children: /* @__PURE__ */ jsxRuntimeExports.jsx(TaskStatusIcon, { status: displayStatus }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.taskContent, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: queryTaskTitleClass(displayStatus), children: item2.title }),
                        displayStatus === "running" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${styles$2.taskBadge} ${styles$2.badgeRunning}`, children: "执行中" }) : null,
                        displayStatus === "paused" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${styles$2.taskBadge} ${styles$2.badgePaused}`, children: "已暂停" }) : null,
                        displayStatus === "failed" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${styles$2.taskBadge} ${styles$2.badgeFailed}`, children: "失败" }) : null,
                        displayStatus === "skipped" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${styles$2.taskBadge} ${styles$2.badgeSkipped}`, children: "已跳过" }) : null
                      ] })
                    ]
                  },
                  item2.id
                );
              }) }),
              showActionBar ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: styles$2.actionBar,
                  onPointerDown: (e) => e.stopPropagation(),
                  children: awaitUserReason ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { className: styles$2.awaitReason, ellipsis: { tooltip: awaitUserReason }, children: awaitUserReason }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "primary",
                        size: "small",
                        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$b, {}),
                        className: styles$2.actionBtn,
                        onClick: onContinue,
                        children: "继续"
                      }
                    )
                  ] }) : canResume ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: styles$2.runningHint, children: "任务已中断，可继续执行" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        type: "primary",
                        size: "small",
                        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$b, {}),
                        className: styles$2.actionBtn,
                        onClick: onResume,
                        children: "继续"
                      }
                    )
                  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: styles$2.runningHint, children: hasRunningTask ? "任务执行中…" : "Agent 处理中…" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Button,
                      {
                        danger: true,
                        size: "small",
                        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}),
                        className: styles$2.actionBtn,
                        onClick: onAbort,
                        children: "中断"
                      }
                    )
                  ] })
                }
              ) : null,
              canSummarizeToSkill && sessionId ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  type: "button",
                  className: styles$2.summarizeCard,
                  "aria-label": `将 ${successfulStepCount} 个成功步骤总结为技能`,
                  onPointerDown: (e) => e.stopPropagation(),
                  onClick: () => setSummarizeOpen(true),
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.summarizeCardHead, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.summarizeCardTitleRow, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.summarizeCardIcon, "aria-hidden": true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$c, {}) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.summarizeCardTitle, children: "总结为技能" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.summarizeStepBadge, children: [
                          successfulStepCount,
                          " 步"
                        ] })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$2.summarizeCardDesc, children: "将成功步骤提炼为可复用 Agent 技能，发布到技能市场" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.summarizeCardFooter, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.summarizeCardMeta, children: "@本次任务" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.summarizeCardAction, children: [
                        "开始总结",
                        /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, { className: styles$2.summarizeCardActionIcon, "aria-hidden": true })
                      ] })
                    ] })
                  ]
                }
              ) : null
            ]
          }
        ),
        summarizeModal
      ]
    }
  );
}
const page = "_page_1h1qj_1";
const header = "_header_1h1qj_25";
const headerLeft = "_headerLeft_1h1qj_37";
const headerCenter = "_headerCenter_1h1qj_45";
const headerRight = "_headerRight_1h1qj_49";
const title = "_title_1h1qj_53";
const titleWrap = "_titleWrap_1h1qj_66";
const headerStatus = "_headerStatus_1h1qj_73";
const statusDot = "_statusDot_1h1qj_84";
const modeSwitch = "_modeSwitch_1h1qj_115";
const modeLabel = "_modeLabel_1h1qj_157";
const body = "_body_1h1qj_166";
const chatColumn = "_chatColumn_1h1qj_183";
const styles = {
  page,
  header,
  headerLeft,
  headerCenter,
  headerRight,
  title,
  titleWrap,
  headerStatus,
  statusDot,
  modeSwitch,
  modeLabel,
  body,
  chatColumn
};
const { Title } = Typography;
function ChatPage() {
  const session = useSessionStore((s) => s.getActiveSession());
  const running = useSessionStore((s) => s.running);
  const awaitUserReason = useSessionStore((s) => s.awaitUserReason);
  const awaitUserChoices = useSessionStore((s) => s.awaitUserChoices);
  const streamingText = useSessionStore((s) => s.streamingText);
  const thinkingText = useSessionStore((s) => s.thinkingText);
  const thinkingInProgress = useSessionStore((s) => s.thinkingInProgress);
  const activeToolName = useSessionStore((s) => s.activeToolName);
  const activeToolArgs = useSessionStore((s) => s.activeToolArgs);
  const activeToolProgress = useSessionStore((s) => s.activeToolProgress);
  const activeModelLabel = useSessionStore((s) => s.activeModelLabel);
  const skills = useSkillsStore((s) => s.skills);
  const hydrateSkills = useSkillsStore((s) => s.hydrate);
  const sendMessage = useSessionStore((s) => s.sendMessage);
  const abort = useSessionStore((s) => s.abort);
  const continueRun = useSessionStore((s) => s.continueRun);
  const resumeRun = useSessionStore((s) => s.resumeRun);
  const canResume = useSessionStore((s) => s.canResume);
  const postSelectedSkillIds = useSessionStore((s) => s.postSelectedSkillIds);
  const reconcileActiveExecutionState = useSessionStore((s) => s.reconcileActiveExecutionState);
  const createSession = useSessionStore((s) => s.createSession);
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const { browserRunning, loading: loading2, toggleBrowser } = useBrowserControl();
  const setView = useAppStore((s) => s.setView);
  const newChatShortcut = queryNewChatShortcutLabel();
  reactExports.useEffect(() => {
    if (skills.length === 0) void hydrateSkills();
  }, [skills.length, hydrateSkills]);
  const skillNameById = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const skill of skills) {
      map.set(skill.id, skill.name);
    }
    return map;
  }, [skills]);
  reactExports.useEffect(() => {
    if (!settingsLoaded) return;
    const missingFields = [
      !settings.apiKey.trim() ? "API Key" : null,
      !settings.baseUrl.trim() ? "Base URL" : null
    ].filter((field) => Boolean(field));
    if (missingFields.length === 0) return;
    appMessage.warning(`请先在设置中填写 ${missingFields.join("、")}`);
    setView("settings");
  }, [settings.apiKey, settings.baseUrl, settingsLoaded, setView]);
  const messages = session?.messages ?? [];
  const tasks = session?.tasks ?? [];
  const isEmpty = messages.length === 0 && !streamingText && !running;
  reactExports.useEffect(() => {
    reconcileActiveExecutionState();
  }, [
    session?.id,
    session?.updatedAt,
    running,
    session?.tasks,
    messages.length,
    reconcileActiveExecutionState
  ]);
  const bodyRef = reactExports.useRef(null);
  const { onScroll } = useElementStickToBottom(bodyRef, {
    enabled: !isEmpty,
    deps: [messages.length, streamingText, thinkingText, running, activeToolName, activeToolProgress, tasks]
  });
  const headerStatus2 = queryAgentStatusLabel({
    running,
    streamingText,
    activeToolName,
    activeToolArgs,
    skillNameById,
    activeToolProgress,
    awaitUserReason,
    activeModelLabel
  });
  const taskWorkflowSucceeded = queryIsTaskWorkflowSucceeded(session, running, awaitUserReason);
  const sendDisabledHint = taskWorkflowSucceeded ? "任务流程已执行完毕，如需新任务请新建会话" : void 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.page, "data-task-checklist-anchor": true, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: `${styles.header} app-drag`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.headerLeft, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.titleWrap, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Title, { level: 5, className: styles.title, children: session?.title ?? "新会话" }),
        !isEmpty && headerStatus2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles.headerStatus, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.statusDot }),
          headerStatus2
        ] }) : null
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `${styles.headerCenter} app-no-drag`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        Segmented,
        {
          className: styles.modeSwitch,
          options: [
            { label: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.modeLabel, children: "灵犀AI助手" }), value: "assistant" },
            { label: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.modeLabel, children: "业务系统" }), value: "business" }
          ],
          value: "assistant",
          onChange: (value) => {
            if (value === "business") setView("business");
          }
        }
      ) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { size: 4, className: `${styles.headerRight} app-no-drag`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: `新会话 ${newChatShortcut}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "text",
            className: shellStyles.headerIconBtn,
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$o, {}),
            onClick: () => void createSession()
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: browserRunning ? "关闭智能体浏览器" : "打开智能体浏览器", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "text",
            className: shellStyles.headerIconBtn,
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$p, {}),
            loading: loading2,
            "data-active": browserRunning,
            onClick: () => void toggleBrowser()
          }
        ) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      TaskChecklist,
      {
        tasks: session?.tasks ?? [],
        sessionId: session?.id ?? null,
        visible: Boolean(session?.tasks?.length),
        running,
        awaitUserReason,
        canResume,
        onAbort: () => void abort(),
        onContinue: () => void continueRun(),
        onResume: () => void resumeRun()
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: bodyRef, className: styles.body, "data-empty": isEmpty, onScroll, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.chatColumn, children: isEmpty ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      WelcomeHero,
      {
        onPick: (prompt) => {
          void sendMessage(prompt);
        }
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      MessageList,
      {
        messages,
        streamingText,
        thinkingText,
        thinkingInProgress,
        tasks: session?.tasks ?? [],
        running,
        activeToolName,
        activeToolArgs,
        activeToolProgress,
        awaitUserReason,
        skillNameById
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ChatInput,
      {
        disabled: taskWorkflowSucceeded,
        sendDisabledHint,
        running,
        streamingText,
        activeToolName,
        activeToolArgs,
        activeToolProgress,
        activeModelLabel,
        skillNameById,
        awaitUserReason,
        awaitUserChoices,
        tokenUsed: session?.tokenUsed ?? 0,
        selectedSkillIds: session?.selectedSkillIds ?? [],
        onSelectedSkillIdsChange: (ids) => void postSelectedSkillIds(ids),
        onSend: (text2, paths) => void sendMessage(text2, paths),
        onAbort: () => void abort(),
        onContinue: (userInput, choiceId) => void continueRun({ userInput, choiceId })
      }
    )
  ] });
}
const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ChatPage
}, Symbol.toStringTag, { value: "Module" }));
export {
  STOCK_RANGE_LABELS as S,
  index as i
};
