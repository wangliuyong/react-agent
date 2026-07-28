import { R as ReactExports, r as reactExports, j as jsxRuntimeExports } from "./vendor-xyflow-C3K48oRM.js";
import { S as STOCK_RANGE_LABELS } from "./index-D2OQ2koo.js";
import { h as ConfigContext, c as classNames, s as cloneElement, ds as Col, i as genStyleHooks, m as merge, j as unit, r as resetComponent, o as useComponentConfig, q as useSize, c4 as mergeProps, g as _toConsumableArray, c7 as useBreakpoint, dt as responsiveArray, du as Row, c9 as DefaultRenderEmpty, S as Spin, dv as queryAshareKlineRefresh, z as appMessage, cg as Tabs, aq as Tag, B as Button, ae as Card } from "./index-D2SMd1bE.js";
import { P as Pagination } from "./Pagination-CMcAavWd.js";
import { i as init, u as use, a as install, b as install$1, c as install$2, d as install$3, e as install$4, f as install$5, g as install$6, h as install$7, j as install$8 } from "./vendor-echarts-CR9Xz9lf.js";
import "./api-D5SC6S-F.js";
import "./useSkillsStore-Dhf-1X-q.js";
import "./LazyChatMarkdown-P37oNEmY.js";
import "./ArtifactFileActions-DRA9KDLl.js";
import "./index-BMGYYAHO.js";
import "./FolderOpenOutlined-CpyBDLdr.js";
import "./CaretRightOutlined-KUV334lH.js";
import "./PlayCircleOutlined-QtbVtiGy.js";
import "./index-BDNh-rpT.js";
import "./MinusCircleOutlined-Dc3hdHfn.js";
const ListContext = /* @__PURE__ */ ReactExports.createContext({});
ListContext.Consumer;
var __rest$1 = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const Meta = (_a) => {
  var {
    prefixCls: customizePrefixCls,
    className,
    avatar,
    title,
    description
  } = _a, others = __rest$1(_a, ["prefixCls", "className", "avatar", "title", "description"]);
  const {
    getPrefixCls
  } = reactExports.useContext(ConfigContext);
  const prefixCls = getPrefixCls("list", customizePrefixCls);
  const classString = classNames(`${prefixCls}-item-meta`, className);
  const content = /* @__PURE__ */ ReactExports.createElement("div", {
    className: `${prefixCls}-item-meta-content`
  }, title && /* @__PURE__ */ ReactExports.createElement("h4", {
    className: `${prefixCls}-item-meta-title`
  }, title), description && /* @__PURE__ */ ReactExports.createElement("div", {
    className: `${prefixCls}-item-meta-description`
  }, description));
  return /* @__PURE__ */ ReactExports.createElement("div", Object.assign({}, others, {
    className: classString
  }), avatar && /* @__PURE__ */ ReactExports.createElement("div", {
    className: `${prefixCls}-item-meta-avatar`
  }, avatar), (title || description) && content);
};
const InternalItem = /* @__PURE__ */ ReactExports.forwardRef((props, ref) => {
  const {
    prefixCls: customizePrefixCls,
    children,
    actions,
    extra,
    styles: styles2,
    className,
    classNames: customizeClassNames,
    colStyle
  } = props, others = __rest$1(props, ["prefixCls", "children", "actions", "extra", "styles", "className", "classNames", "colStyle"]);
  const {
    grid,
    itemLayout
  } = reactExports.useContext(ListContext);
  const {
    getPrefixCls,
    list
  } = reactExports.useContext(ConfigContext);
  const moduleClass = (moduleName) => {
    var _a, _b;
    return classNames((_b = (_a = list === null || list === void 0 ? void 0 : list.item) === null || _a === void 0 ? void 0 : _a.classNames) === null || _b === void 0 ? void 0 : _b[moduleName], customizeClassNames === null || customizeClassNames === void 0 ? void 0 : customizeClassNames[moduleName]);
  };
  const moduleStyle = (moduleName) => {
    var _a, _b;
    return Object.assign(Object.assign({}, (_b = (_a = list === null || list === void 0 ? void 0 : list.item) === null || _a === void 0 ? void 0 : _a.styles) === null || _b === void 0 ? void 0 : _b[moduleName]), styles2 === null || styles2 === void 0 ? void 0 : styles2[moduleName]);
  };
  const isItemContainsTextNodeAndNotSingular = () => {
    let result = false;
    reactExports.Children.forEach(children, (element) => {
      if (typeof element === "string") {
        result = true;
      }
    });
    return result && reactExports.Children.count(children) > 1;
  };
  const isFlexMode = () => {
    if (itemLayout === "vertical") {
      return !!extra;
    }
    return !isItemContainsTextNodeAndNotSingular();
  };
  const prefixCls = getPrefixCls("list", customizePrefixCls);
  const actionsContent = actions && actions.length > 0 && /* @__PURE__ */ ReactExports.createElement("ul", {
    className: classNames(`${prefixCls}-item-action`, moduleClass("actions")),
    key: "actions",
    style: moduleStyle("actions")
  }, actions.map((action, i) => (
    // eslint-disable-next-line react/no-array-index-key
    /* @__PURE__ */ ReactExports.createElement("li", {
      key: `${prefixCls}-item-action-${i}`
    }, action, i !== actions.length - 1 && /* @__PURE__ */ ReactExports.createElement("em", {
      className: `${prefixCls}-item-action-split`
    }))
  )));
  const Element = grid ? "div" : "li";
  const itemChildren = /* @__PURE__ */ ReactExports.createElement(Element, Object.assign({}, others, !grid ? {
    ref
  } : {}, {
    className: classNames(`${prefixCls}-item`, {
      [`${prefixCls}-item-no-flex`]: !isFlexMode()
    }, className)
  }), itemLayout === "vertical" && extra ? [/* @__PURE__ */ ReactExports.createElement("div", {
    className: `${prefixCls}-item-main`,
    key: "content"
  }, children, actionsContent), /* @__PURE__ */ ReactExports.createElement("div", {
    className: classNames(`${prefixCls}-item-extra`, moduleClass("extra")),
    key: "extra",
    style: moduleStyle("extra")
  }, extra)] : [children, actionsContent, cloneElement(extra, {
    key: "extra"
  })]);
  return grid ? /* @__PURE__ */ ReactExports.createElement(Col, {
    ref,
    flex: 1,
    style: colStyle
  }, itemChildren) : itemChildren;
});
const Item = InternalItem;
Item.Meta = Meta;
const genBorderedStyle = (token) => {
  const {
    listBorderedCls,
    componentCls,
    paddingLG,
    margin,
    itemPaddingSM,
    itemPaddingLG,
    marginLG,
    borderRadiusLG
  } = token;
  const innerCornerBorderRadius = unit(token.calc(borderRadiusLG).sub(token.lineWidth).equal());
  return {
    [listBorderedCls]: {
      border: `${unit(token.lineWidth)} ${token.lineType} ${token.colorBorder}`,
      borderRadius: borderRadiusLG,
      [`${componentCls}-header`]: {
        borderRadius: `${innerCornerBorderRadius} ${innerCornerBorderRadius} 0 0`
      },
      [`${componentCls}-footer`]: {
        borderRadius: `0 0 ${innerCornerBorderRadius} ${innerCornerBorderRadius}`
      },
      [`${componentCls}-header,${componentCls}-footer,${componentCls}-item`]: {
        paddingInline: paddingLG
      },
      [`${componentCls}-pagination`]: {
        margin: `${unit(margin)} ${unit(marginLG)}`
      }
    },
    [`${listBorderedCls}${componentCls}-sm`]: {
      [`${componentCls}-item,${componentCls}-header,${componentCls}-footer`]: {
        padding: itemPaddingSM
      }
    },
    [`${listBorderedCls}${componentCls}-lg`]: {
      [`${componentCls}-item,${componentCls}-header,${componentCls}-footer`]: {
        padding: itemPaddingLG
      }
    }
  };
};
const genResponsiveStyle = (token) => {
  const {
    componentCls,
    screenSM,
    screenMD,
    marginLG,
    marginSM,
    margin
  } = token;
  return {
    [`@media screen and (max-width:${screenMD}px)`]: {
      [componentCls]: {
        [`${componentCls}-item`]: {
          [`${componentCls}-item-action`]: {
            marginInlineStart: marginLG
          }
        }
      },
      [`${componentCls}-vertical`]: {
        [`${componentCls}-item`]: {
          [`${componentCls}-item-extra`]: {
            marginInlineStart: marginLG
          }
        }
      }
    },
    [`@media screen and (max-width: ${screenSM}px)`]: {
      [componentCls]: {
        [`${componentCls}-item`]: {
          flexWrap: "wrap",
          [`${componentCls}-action`]: {
            marginInlineStart: marginSM
          }
        }
      },
      [`${componentCls}-vertical`]: {
        [`${componentCls}-item`]: {
          flexWrap: "wrap-reverse",
          [`${componentCls}-item-main`]: {
            minWidth: token.contentWidth
          },
          [`${componentCls}-item-extra`]: {
            margin: `auto auto ${unit(margin)}`
          }
        }
      }
    }
  };
};
const genBaseStyle = (token) => {
  const {
    componentCls,
    antCls,
    controlHeight,
    minHeight,
    paddingSM,
    marginLG,
    padding,
    itemPadding,
    colorPrimary,
    itemPaddingSM,
    itemPaddingLG,
    paddingXS,
    margin,
    colorText,
    colorTextDescription,
    motionDurationSlow,
    lineWidth,
    headerBg,
    footerBg,
    emptyTextPadding,
    metaMarginBottom,
    avatarMarginRight,
    titleMarginBottom,
    descriptionFontSize
  } = token;
  return {
    [componentCls]: Object.assign(Object.assign({}, resetComponent(token)), {
      position: "relative",
      // fix https://github.com/ant-design/ant-design/issues/46177
      ["--rc-virtual-list-scrollbar-bg"]: token.colorSplit,
      "*": {
        outline: "none"
      },
      [`${componentCls}-header`]: {
        background: headerBg
      },
      [`${componentCls}-footer`]: {
        background: footerBg
      },
      [`${componentCls}-header, ${componentCls}-footer`]: {
        paddingBlock: paddingSM
      },
      [`${componentCls}-pagination`]: {
        marginBlockStart: marginLG,
        // https://github.com/ant-design/ant-design/issues/20037
        [`${antCls}-pagination-options`]: {
          textAlign: "start"
        }
      },
      [`${componentCls}-spin`]: {
        minHeight,
        textAlign: "center"
      },
      [`${componentCls}-items`]: {
        margin: 0,
        padding: 0,
        listStyle: "none"
      },
      [`${componentCls}-item`]: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: itemPadding,
        color: colorText,
        [`${componentCls}-item-meta`]: {
          display: "flex",
          flex: 1,
          alignItems: "flex-start",
          maxWidth: "100%",
          [`${componentCls}-item-meta-avatar`]: {
            marginInlineEnd: avatarMarginRight
          },
          [`${componentCls}-item-meta-content`]: {
            flex: "1 0",
            width: 0,
            color: colorText
          },
          [`${componentCls}-item-meta-title`]: {
            margin: `0 0 ${unit(token.marginXXS)} 0`,
            color: colorText,
            fontSize: token.fontSize,
            lineHeight: token.lineHeight,
            "> a": {
              color: colorText,
              transition: `all ${motionDurationSlow}`,
              "&:hover": {
                color: colorPrimary
              }
            }
          },
          [`${componentCls}-item-meta-description`]: {
            color: colorTextDescription,
            fontSize: descriptionFontSize,
            lineHeight: token.lineHeight
          }
        },
        [`${componentCls}-item-action`]: {
          flex: "0 0 auto",
          marginInlineStart: token.marginXXL,
          padding: 0,
          fontSize: 0,
          listStyle: "none",
          "& > li": {
            position: "relative",
            display: "inline-block",
            padding: `0 ${unit(paddingXS)}`,
            color: colorTextDescription,
            fontSize: token.fontSize,
            lineHeight: token.lineHeight,
            textAlign: "center",
            "&:first-child": {
              paddingInlineStart: 0
            }
          },
          [`${componentCls}-item-action-split`]: {
            position: "absolute",
            insetBlockStart: "50%",
            insetInlineEnd: 0,
            width: lineWidth,
            height: token.calc(token.fontHeight).sub(token.calc(token.marginXXS).mul(2)).equal(),
            transform: "translateY(-50%)",
            backgroundColor: token.colorSplit
          }
        }
      },
      [`${componentCls}-empty`]: {
        padding: `${unit(padding)} 0`,
        color: colorTextDescription,
        fontSize: token.fontSizeSM,
        textAlign: "center"
      },
      [`${componentCls}-empty-text`]: {
        padding: emptyTextPadding,
        color: token.colorTextDisabled,
        fontSize: token.fontSize,
        textAlign: "center"
      },
      // ============================ without flex ============================
      [`${componentCls}-item-no-flex`]: {
        display: "block"
      }
    }),
    [`${componentCls}-grid ${antCls}-col > ${componentCls}-item`]: {
      display: "block",
      maxWidth: "100%",
      marginBlockEnd: margin,
      paddingBlock: 0,
      borderBlockEnd: "none"
    },
    [`${componentCls}-vertical ${componentCls}-item`]: {
      alignItems: "initial",
      [`${componentCls}-item-main`]: {
        display: "block",
        flex: 1
      },
      [`${componentCls}-item-extra`]: {
        marginInlineStart: marginLG
      },
      [`${componentCls}-item-meta`]: {
        marginBlockEnd: metaMarginBottom,
        [`${componentCls}-item-meta-title`]: {
          marginBlockStart: 0,
          marginBlockEnd: titleMarginBottom,
          color: colorText,
          fontSize: token.fontSizeLG,
          lineHeight: token.lineHeightLG
        }
      },
      [`${componentCls}-item-action`]: {
        marginBlockStart: padding,
        marginInlineStart: "auto",
        "> li": {
          padding: `0 ${unit(padding)}`,
          "&:first-child": {
            paddingInlineStart: 0
          }
        }
      }
    },
    [`${componentCls}-split ${componentCls}-item`]: {
      borderBlockEnd: `${unit(token.lineWidth)} ${token.lineType} ${token.colorSplit}`,
      "&:last-child": {
        borderBlockEnd: "none"
      }
    },
    [`${componentCls}-split ${componentCls}-header`]: {
      borderBlockEnd: `${unit(token.lineWidth)} ${token.lineType} ${token.colorSplit}`
    },
    [`${componentCls}-split${componentCls}-empty ${componentCls}-footer`]: {
      borderTop: `${unit(token.lineWidth)} ${token.lineType} ${token.colorSplit}`
    },
    [`${componentCls}-loading ${componentCls}-spin-nested-loading`]: {
      minHeight: controlHeight
    },
    [`${componentCls}-split${componentCls}-something-after-last-item ${antCls}-spin-container > ${componentCls}-items > ${componentCls}-item:last-child`]: {
      borderBlockEnd: `${unit(token.lineWidth)} ${token.lineType} ${token.colorSplit}`
    },
    [`${componentCls}-lg ${componentCls}-item`]: {
      padding: itemPaddingLG
    },
    [`${componentCls}-sm ${componentCls}-item`]: {
      padding: itemPaddingSM
    },
    // Horizontal
    [`${componentCls}:not(${componentCls}-vertical)`]: {
      [`${componentCls}-item-no-flex`]: {
        [`${componentCls}-item-action`]: {
          float: "right"
        }
      }
    }
  };
};
const prepareComponentToken = (token) => ({
  contentWidth: 220,
  itemPadding: `${unit(token.paddingContentVertical)} 0`,
  itemPaddingSM: `${unit(token.paddingContentVerticalSM)} ${unit(token.paddingContentHorizontal)}`,
  itemPaddingLG: `${unit(token.paddingContentVerticalLG)} ${unit(token.paddingContentHorizontalLG)}`,
  headerBg: "transparent",
  footerBg: "transparent",
  emptyTextPadding: token.padding,
  metaMarginBottom: token.padding,
  avatarMarginRight: token.padding,
  titleMarginBottom: token.paddingSM,
  descriptionFontSize: token.fontSize
});
const useStyle = genStyleHooks("List", (token) => {
  const listToken = merge(token, {
    listBorderedCls: `${token.componentCls}-bordered`,
    minHeight: token.controlHeightLG
  });
  return [genBaseStyle(listToken), genBorderedStyle(listToken), genResponsiveStyle(listToken)];
}, prepareComponentToken);
var __rest = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
function InternalList(props, ref) {
  const {
    pagination = false,
    prefixCls: customizePrefixCls,
    bordered = false,
    split = true,
    className,
    rootClassName,
    style,
    children,
    itemLayout,
    loadMore,
    grid,
    dataSource = [],
    size: customizeSize,
    header,
    footer,
    loading = false,
    rowKey,
    renderItem,
    locale
  } = props, rest = __rest(props, ["pagination", "prefixCls", "bordered", "split", "className", "rootClassName", "style", "children", "itemLayout", "loadMore", "grid", "dataSource", "size", "header", "footer", "loading", "rowKey", "renderItem", "locale"]);
  const paginationObj = pagination && typeof pagination === "object" ? pagination : {};
  const [paginationCurrent, setPaginationCurrent] = reactExports.useState(paginationObj.defaultCurrent || 1);
  const [paginationSize, setPaginationSize] = reactExports.useState(paginationObj.defaultPageSize || 10);
  const {
    getPrefixCls,
    direction,
    className: contextClassName,
    style: contextStyle
  } = useComponentConfig("list");
  const {
    renderEmpty
  } = reactExports.useContext(ConfigContext);
  const defaultPaginationProps = {
    current: 1,
    total: 0,
    position: "bottom"
  };
  const triggerPaginationEvent = (eventName) => (page, pageSize) => {
    var _a;
    setPaginationCurrent(page);
    setPaginationSize(pageSize);
    if (pagination) {
      (_a = pagination === null || pagination === void 0 ? void 0 : pagination[eventName]) === null || _a === void 0 ? void 0 : _a.call(pagination, page, pageSize);
    }
  };
  const onPaginationChange = triggerPaginationEvent("onChange");
  const onPaginationShowSizeChange = triggerPaginationEvent("onShowSizeChange");
  const renderInternalItem = (item, index) => {
    if (!renderItem) {
      return null;
    }
    let key;
    if (typeof rowKey === "function") {
      key = rowKey(item);
    } else if (rowKey) {
      key = item[rowKey];
    } else {
      key = item.key;
    }
    if (!key) {
      key = `list-item-${index}`;
    }
    return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, {
      key
    }, renderItem(item, index));
  };
  const isSomethingAfterLastItem = !!(loadMore || pagination || footer);
  const prefixCls = getPrefixCls("list", customizePrefixCls);
  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls);
  let loadingProp = loading;
  if (typeof loadingProp === "boolean") {
    loadingProp = {
      spinning: loadingProp
    };
  }
  const isLoading = !!(loadingProp === null || loadingProp === void 0 ? void 0 : loadingProp.spinning);
  const mergedSize = useSize(customizeSize);
  let sizeCls = "";
  switch (mergedSize) {
    case "large":
      sizeCls = "lg";
      break;
    case "small":
      sizeCls = "sm";
      break;
  }
  const classString = classNames(prefixCls, {
    [`${prefixCls}-vertical`]: itemLayout === "vertical",
    [`${prefixCls}-${sizeCls}`]: sizeCls,
    [`${prefixCls}-split`]: split,
    [`${prefixCls}-bordered`]: bordered,
    [`${prefixCls}-loading`]: isLoading,
    [`${prefixCls}-grid`]: !!grid,
    [`${prefixCls}-something-after-last-item`]: isSomethingAfterLastItem,
    [`${prefixCls}-rtl`]: direction === "rtl"
  }, contextClassName, className, rootClassName, hashId, cssVarCls);
  const paginationProps = mergeProps(defaultPaginationProps, {
    total: dataSource.length,
    current: paginationCurrent,
    pageSize: paginationSize
  }, pagination || {});
  const largestPage = Math.ceil(paginationProps.total / paginationProps.pageSize);
  paginationProps.current = Math.min(paginationProps.current, largestPage);
  const paginationContent = pagination && /* @__PURE__ */ reactExports.createElement("div", {
    className: classNames(`${prefixCls}-pagination`)
  }, /* @__PURE__ */ reactExports.createElement(Pagination, Object.assign({
    align: "end"
  }, paginationProps, {
    onChange: onPaginationChange,
    onShowSizeChange: onPaginationShowSizeChange
  })));
  let splitDataSource = _toConsumableArray(dataSource);
  if (pagination) {
    if (dataSource.length > (paginationProps.current - 1) * paginationProps.pageSize) {
      splitDataSource = _toConsumableArray(dataSource).splice((paginationProps.current - 1) * paginationProps.pageSize, paginationProps.pageSize);
    }
  }
  const needResponsive = Object.keys(grid || {}).some((key) => ["xs", "sm", "md", "lg", "xl", "xxl"].includes(key));
  const screens = useBreakpoint(needResponsive);
  const currentBreakpoint = reactExports.useMemo(() => {
    for (let i = 0; i < responsiveArray.length; i += 1) {
      const breakpoint = responsiveArray[i];
      if (screens[breakpoint]) {
        return breakpoint;
      }
    }
    return void 0;
  }, [screens]);
  const colStyle = reactExports.useMemo(() => {
    if (!grid) {
      return void 0;
    }
    const columnCount = currentBreakpoint && grid[currentBreakpoint] ? grid[currentBreakpoint] : grid.column;
    if (columnCount) {
      return {
        width: `${100 / columnCount}%`,
        maxWidth: `${100 / columnCount}%`
      };
    }
  }, [JSON.stringify(grid), currentBreakpoint]);
  let childrenContent = isLoading && /* @__PURE__ */ reactExports.createElement("div", {
    style: {
      minHeight: 53
    }
  });
  if (splitDataSource.length > 0) {
    const items = splitDataSource.map(renderInternalItem);
    childrenContent = grid ? /* @__PURE__ */ reactExports.createElement(Row, {
      gutter: grid.gutter
    }, reactExports.Children.map(items, (child) => /* @__PURE__ */ reactExports.createElement("div", {
      key: child === null || child === void 0 ? void 0 : child.key,
      style: colStyle
    }, child))) : /* @__PURE__ */ reactExports.createElement("ul", {
      className: `${prefixCls}-items`
    }, items);
  } else if (!children && !isLoading) {
    childrenContent = /* @__PURE__ */ reactExports.createElement("div", {
      className: `${prefixCls}-empty-text`
    }, (locale === null || locale === void 0 ? void 0 : locale.emptyText) || (renderEmpty === null || renderEmpty === void 0 ? void 0 : renderEmpty("List")) || /* @__PURE__ */ reactExports.createElement(DefaultRenderEmpty, {
      componentName: "List"
    }));
  }
  const paginationPosition = paginationProps.position;
  const contextValue = reactExports.useMemo(() => ({
    grid,
    itemLayout
  }), [JSON.stringify(grid), itemLayout]);
  return wrapCSSVar(/* @__PURE__ */ reactExports.createElement(ListContext.Provider, {
    value: contextValue
  }, /* @__PURE__ */ reactExports.createElement("div", Object.assign({
    ref,
    style: Object.assign(Object.assign({}, contextStyle), style),
    className: classString
  }, rest), (paginationPosition === "top" || paginationPosition === "both") && paginationContent, header && /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-header`
  }, header), /* @__PURE__ */ reactExports.createElement(Spin, Object.assign({}, loadingProp), childrenContent, children), footer && /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-footer`
  }, footer), loadMore || (paginationPosition === "bottom" || paginationPosition === "both") && paginationContent)));
}
const ListWithForwardRef = /* @__PURE__ */ reactExports.forwardRef(InternalList);
const List = ListWithForwardRef;
List.Item = Item;
function querySma(values, period) {
  const out = [];
  for (let i = 0; i < values.length; i++) {
    if (i + 1 < period) {
      out.push(NaN);
      continue;
    }
    const slice = values.slice(i + 1 - period, i + 1);
    out.push(slice.reduce((a, b) => a + b, 0) / period);
  }
  return out;
}
function queryEma(values, period) {
  const out = [];
  const k = 2 / (period + 1);
  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      out.push(values[0]);
      continue;
    }
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}
function queryRsi(closes, period = 14) {
  const out = new Array(closes.length).fill(NaN);
  if (closes.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}
function queryMacd(closes) {
  const ema12 = queryEma(closes, 12);
  const ema26 = queryEma(closes, 26);
  const dif = ema12.map((v, i) => v - ema26[i]);
  const dea = queryEma(dif, 9);
  const hist = dif.map((v, i) => v - dea[i]);
  return { dif, dea, hist };
}
function queryLastValid(values) {
  for (let i = values.length - 1; i >= 0; i--) {
    if (Number.isFinite(values[i])) return values[i];
  }
  return void 0;
}
function queryDetectCross(fast, slow, index) {
  if (index < 1) return null;
  const prevFast = fast[index - 1];
  const prevSlow = slow[index - 1];
  const curFast = fast[index];
  const curSlow = slow[index];
  if (![prevFast, prevSlow, curFast, curSlow].every(Number.isFinite)) return null;
  if (prevFast <= prevSlow && curFast > curSlow) return "golden";
  if (prevFast >= prevSlow && curFast < curSlow) return "death";
  return null;
}
function queryExtractTradeSignals(bars, ma5, ma20, rsi, macdHist) {
  const signals = [];
  const start = Math.max(20, bars.length - 30);
  for (let i = start; i < bars.length; i++) {
    const bar = bars[i];
    const cross = queryDetectCross(ma5, ma20, i);
    if (cross === "golden") {
      signals.push({
        type: "buy",
        date: bar.date,
        price: bar.close,
        reason: "MA5 上穿 MA20（金叉）"
      });
    } else if (cross === "death") {
      signals.push({
        type: "sell",
        date: bar.date,
        price: bar.close,
        reason: "MA5 下穿 MA20（死叉）"
      });
    }
    const rsiVal = rsi[i];
    const prevRsi = rsi[i - 1];
    if (Number.isFinite(rsiVal) && Number.isFinite(prevRsi)) {
      if (prevRsi < 30 && rsiVal >= 30) {
        signals.push({
          type: "buy",
          date: bar.date,
          price: bar.close,
          reason: "RSI 脱离超卖区（<30）"
        });
      } else if (prevRsi > 70 && rsiVal <= 70) {
        signals.push({
          type: "sell",
          date: bar.date,
          price: bar.close,
          reason: "RSI 脱离超买区（>70）"
        });
      }
    }
    const hist = macdHist[i];
    const prevHist = macdHist[i - 1];
    if (Number.isFinite(hist) && Number.isFinite(prevHist)) {
      if (prevHist <= 0 && hist > 0) {
        signals.push({
          type: "buy",
          date: bar.date,
          price: bar.close,
          reason: "MACD 柱由负转正"
        });
      } else if (prevHist >= 0 && hist < 0) {
        signals.push({
          type: "sell",
          date: bar.date,
          price: bar.close,
          reason: "MACD 柱由正转负"
        });
      }
    }
  }
  const seen = /* @__PURE__ */ new Set();
  return signals.reverse().filter((s) => {
    const key = `${s.type}:${s.date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).reverse().slice(-8);
}
function queryPredictPrice(bars, indicators, trend) {
  const last = bars[bars.length - 1];
  let score = 0;
  if (indicators.ma5 != null && indicators.ma20 != null) {
    score += indicators.ma5 > indicators.ma20 ? 1.5 : -1.5;
  }
  if (indicators.rsi14 != null) {
    if (indicators.rsi14 < 35) score += 1;
    else if (indicators.rsi14 > 65) score -= 1;
    else if (indicators.rsi14 > 50) score += 0.3;
    else score -= 0.3;
  }
  if (indicators.macdHist != null) {
    score += indicators.macdHist > 0 ? 0.8 : -0.8;
  }
  const recent = bars.slice(-5);
  const momentum = recent.length >= 2 ? (recent[recent.length - 1].close - recent[0].open) / recent[0].open : 0;
  score += momentum > 0.02 ? 0.5 : momentum < -0.02 ? -0.5 : 0;
  if (trend === "bullish") score += 0.5;
  if (trend === "bearish") score -= 0.5;
  let direction = "sideways";
  if (score >= 1.2) direction = "up";
  else if (score <= -1.2) direction = "down";
  const confidence = Math.min(85, Math.max(35, Math.round(50 + Math.abs(score) * 12)));
  const changePctEstimate = direction === "up" ? 1.5 + confidence * 0.03 : direction === "down" ? -(1.5 + confidence * 0.03) : 0;
  const targetPrice = direction === "up" ? last.close * (1 + changePctEstimate / 100) : direction === "down" ? last.close * (1 + changePctEstimate / 100) : last.close;
  const lows = bars.slice(-20).map((b) => b.low);
  const stopLoss = direction === "up" ? Math.min(...lows) : Math.max(...bars.slice(-20).map((b) => b.high));
  return {
    direction,
    confidence,
    horizon: "短期 3～5 个交易日",
    targetPrice: Number(targetPrice.toFixed(2)),
    stopLoss: Number(stopLoss.toFixed(2)),
    changePctEstimate: Number(changePctEstimate.toFixed(2))
  };
}
function queryOverallSignal(tradeSignals, trend, prediction2) {
  const last = tradeSignals[tradeSignals.length - 1];
  if (last?.type === "buy" && trend !== "bearish") return "buy";
  if (last?.type === "sell" && trend !== "bullish") return "sell";
  if (prediction2.direction === "up" && prediction2.confidence >= 55) return "buy";
  if (prediction2.direction === "down" && prediction2.confidence >= 55) return "sell";
  return "hold";
}
function queryBuildSummary(chart2, trend, indicators, prediction2, overallSignal, tradeSignals) {
  const trendLabel = { bullish: "偏多", bearish: "偏空", neutral: "震荡" }[trend];
  const signalLabel = { buy: "买入", sell: "卖出", hold: "观望" }[overallSignal];
  const dirLabel = { up: "看涨", down: "看跌", sideways: "横盘" }[prediction2.direction];
  const lastSignal = tradeSignals[tradeSignals.length - 1];
  const lines = [
    `【${chart2.name}（${chart2.symbol}）】`,
    `- 趋势：${trendLabel}；综合信号：**${signalLabel}**`,
    `- 预测：${dirLabel}（置信度 ${prediction2.confidence}%），${prediction2.horizon}`,
    prediction2.targetPrice != null ? `- 参考目标价 ${prediction2.targetPrice}，止损参考 ${prediction2.stopLoss}` : "",
    indicators.ma5 != null && indicators.ma20 != null ? `- 均线：MA5=${indicators.ma5.toFixed(2)}，MA20=${indicators.ma20.toFixed(2)}` : "",
    indicators.rsi14 != null ? `- RSI14=${indicators.rsi14.toFixed(1)}` : "",
    lastSignal ? `- 最近信号：${lastSignal.type === "buy" ? "买入" : "卖出"} @ ${lastSignal.price}（${lastSignal.reason}）` : ""
  ];
  return lines.filter(Boolean).join("\n");
}
function queryAnalyzeStockChart(chart2) {
  const bars = chart2.bars;
  const closes = bars.map((b) => b.close);
  const ma5 = querySma(closes, 5);
  const ma10 = querySma(closes, 10);
  const ma20 = querySma(closes, 20);
  const rsi = queryRsi(closes, 14);
  const { dif, dea, hist } = queryMacd(closes);
  const indicators = {
    ma5: queryLastValid(ma5),
    ma10: queryLastValid(ma10),
    ma20: queryLastValid(ma20),
    rsi14: queryLastValid(rsi),
    macdDif: queryLastValid(dif),
    macdDea: queryLastValid(dea),
    macdHist: queryLastValid(hist)
  };
  let trend = "neutral";
  if (indicators.ma5 != null && indicators.ma10 != null && indicators.ma20 != null && indicators.ma5 > indicators.ma10 && indicators.ma10 > indicators.ma20) {
    trend = "bullish";
  } else if (indicators.ma5 != null && indicators.ma10 != null && indicators.ma20 != null && indicators.ma5 < indicators.ma10 && indicators.ma10 < indicators.ma20) {
    trend = "bearish";
  }
  const tradeSignals = queryExtractTradeSignals(bars, ma5, ma20, rsi, hist);
  const prediction2 = queryPredictPrice(bars, indicators, trend);
  const overallSignal = queryOverallSignal(tradeSignals, trend, prediction2);
  return {
    symbol: chart2.symbol,
    name: chart2.name,
    trend,
    overallSignal,
    prediction: prediction2,
    indicators,
    tradeSignals,
    summary: queryBuildSummary(
      chart2,
      trend,
      indicators,
      prediction2,
      overallSignal,
      tradeSignals
    )
  };
}
const wrap = "_wrap_kjfli_1";
const toolbar = "_toolbar_kjfli_5";
const tabs = "_tabs_kjfli_14";
const liveTag = "_liveTag_kjfli_19";
const listItem = "_listItem_kjfli_23";
const liveActions = "_liveActions_kjfli_27";
const chartMeta = "_chartMeta_kjfli_35";
const chartMetaTitle = "_chartMetaTitle_kjfli_45";
const chartMetaQuoteUp = "_chartMetaQuoteUp_kjfli_50";
const chartMetaQuoteDown = "_chartMetaQuoteDown_kjfli_54";
const chart = "_chart_kjfli_35";
const analysis = "_analysis_kjfli_67";
const signalRow = "_signalRow_kjfli_71";
const prediction = "_prediction_kjfli_78";
const disclaimer = "_disclaimer_kjfli_84";
const styles = {
  wrap,
  toolbar,
  tabs,
  liveTag,
  listItem,
  liveActions,
  chartMeta,
  chartMetaTitle,
  chartMetaQuoteUp,
  chartMetaQuoteDown,
  chart,
  analysis,
  signalRow,
  prediction,
  disclaimer
};
use([
  install,
  install$1,
  install$2,
  install$3,
  install$4,
  install$5,
  install$6,
  install$7,
  install$8
]);
function queryBarsForRange(chart2, range) {
  if (chart2.rangeBars?.[range]?.length) return chart2.rangeBars[range];
  if (chart2.range === range && chart2.bars.length > 0) return chart2.bars;
  return [];
}
function queryAvailableRanges(chart2) {
  const ranges = [];
  const candidates = ["today", "week", "month"];
  for (const r of candidates) {
    if (queryBarsForRange(chart2, r).length > 0) ranges.push(r);
  }
  if (queryBarsForRange(chart2, "custom").length > 0) ranges.push("custom");
  return ranges.length ? ranges : [chart2.range ?? "today"];
}
function queryDefaultRange(chart2) {
  const ranges = queryAvailableRanges(chart2);
  if (ranges.includes("today")) return "today";
  if (ranges.includes(chart2.range)) return chart2.range;
  return ranges[0] ?? "today";
}
function queryPatchBarsWithQuote(bars, quote) {
  if (!quote || bars.length === 0) return bars;
  const next = bars.slice();
  const last = { ...next[next.length - 1] };
  last.close = quote.price;
  last.high = Math.max(last.high, quote.price, quote.high || last.high);
  last.low = Math.min(last.low, quote.price, quote.low || last.low);
  next[next.length - 1] = last;
  return next;
}
function querySignalTag(signal) {
  if (signal === "buy") return { color: "success", label: "买入" };
  if (signal === "sell") return { color: "error", label: "卖出" };
  return { color: "default", label: "观望" };
}
function queryTrendTag(trend) {
  if (trend === "bullish") return { color: "red", label: "偏多" };
  if (trend === "bearish") return { color: "green", label: "偏空" };
  return { color: "blue", label: "震荡" };
}
function queryFormatClock(ts) {
  if (!ts) return "";
  try {
    return new Date(ts).toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  } catch {
    return "";
  }
}
function MessageKlineChart({
  charts
}) {
  const [activeSymbol, setActiveSymbol] = reactExports.useState(charts[0]?.symbol ?? "");
  const [activeRange, setActiveRange] = reactExports.useState(
    () => charts[0] ? queryDefaultRange(charts[0]) : "today"
  );
  const [chartData, setChartData] = reactExports.useState(charts);
  const [refreshing, setRefreshing] = reactExports.useState(false);
  const [lastRefreshAt, setLastRefreshAt] = reactExports.useState(null);
  const chartRef = reactExports.useRef(null);
  const instanceRef = reactExports.useRef(null);
  const chartContextRef = reactExports.useRef({ activeSymbol: "", chartData: [] });
  const activeChart = chartData.find((c) => c.symbol === activeSymbol) ?? chartData[0];
  chartContextRef.current = { activeChart, activeSymbol, chartData };
  const availableRanges = activeChart ? queryAvailableRanges(activeChart) : [];
  const rawBars = activeChart ? queryBarsForRange(activeChart, activeRange) : [];
  const displayBars = activeRange === "today" ? queryPatchBarsWithQuote(rawBars, activeChart?.quote) : rawBars;
  const analysis2 = reactExports.useMemo(() => {
    if (!activeChart || displayBars.length === 0) return activeChart?.analysis;
    try {
      return queryAnalyzeStockChart({
        ...activeChart,
        range: activeRange,
        bars: displayBars
      });
    } catch {
      return activeChart.analysis;
    }
  }, [activeChart, activeRange, displayBars]);
  reactExports.useEffect(() => {
    setChartData(charts);
    if (charts[0]) {
      setActiveSymbol(charts[0].symbol);
      setActiveRange(queryDefaultRange(charts[0]));
    }
  }, [charts]);
  reactExports.useEffect(() => {
    if (!chartData.length) return;
    if (!chartData.some((c) => c.symbol === activeSymbol)) {
      setActiveSymbol(chartData[0].symbol);
      setActiveRange(queryDefaultRange(chartData[0]));
    }
  }, [chartData, activeSymbol]);
  const postRefresh = reactExports.useCallback(
    async (range, silent = false) => {
      const { activeChart: chart2 } = chartContextRef.current;
      if (!chart2) return false;
      if (!silent) setRefreshing(true);
      try {
        const req = {
          symbol: chart2.symbol,
          name: chart2.name,
          range,
          ...range === "custom" ? {
            startDate: chart2.startDate != null ? String(chart2.startDate) : void 0,
            endDate: chart2.endDate != null ? String(chart2.endDate) : void 0
          } : {}
        };
        const updated = await queryAshareKlineRefresh(req);
        if (!updated) return false;
        setLastRefreshAt(Date.now());
        setChartData(
          (prev) => prev.map((c) => c.symbol === updated.symbol ? updated : c)
        );
        return true;
      } catch {
        return false;
      } finally {
        if (!silent) setRefreshing(false);
      }
    },
    []
  );
  const handleManualRefresh = reactExports.useCallback(async () => {
    const ok = await postRefresh(activeRange, false);
    if (ok) {
      appMessage.success("已重新拉取实时分析");
    } else {
      appMessage.warning("刷新失败，请稍后重试");
    }
  }, [activeRange, postRefresh]);
  reactExports.useEffect(() => {
    const el = chartRef.current;
    if (!el || !activeChart || displayBars.length === 0) return;
    if (!instanceRef.current) {
      instanceRef.current = init(el);
    }
    const chart2 = instanceRef.current;
    const dates = displayBars.map((b) => b.date);
    const ohlc = displayBars.map((b) => [b.open, b.close, b.low, b.high]);
    const volumes = displayBars.map((b) => b.volume);
    const closes = displayBars.map((b) => b.close);
    const ma5 = closes.map((_, i) => {
      if (i < 4) return null;
      return closes.slice(i - 4, i + 1).reduce((a, b) => a + b, 0) / 5;
    });
    const ma20 = closes.map((_, i) => {
      if (i < 19) return null;
      return closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20;
    });
    const buyPoints = (analysis2?.tradeSignals ?? []).filter((s) => s.type === "buy").map((s) => {
      if (!dates.includes(s.date)) return null;
      return { name: "买", coord: [s.date, s.price], value: s.price };
    }).filter(Boolean);
    const sellPoints = (analysis2?.tradeSignals ?? []).filter((s) => s.type === "sell").map((s) => {
      if (!dates.includes(s.date)) return null;
      return { name: "卖", coord: [s.date, s.price], value: s.price };
    }).filter(Boolean);
    chart2.setOption(
      {
        animation: false,
        legend: { data: ["K线", "5日均线", "20日均线", "成交量"], top: 4 },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "cross" },
          // candlestick 默认展示 open/close/lowest/highest，映射为 A 股常用中文
          formatter: (params) => {
            const items = Array.isArray(params) ? params : [params];
            if (!items.length) return "";
            const axisValue = String(
              items[0].axisValueLabel ?? items[0].axisValue ?? ""
            );
            const lines = [axisValue];
            for (const raw of items) {
              const item = raw;
              const marker = item.marker ?? "";
              const name = item.seriesName ?? "";
              const value = item.value ?? item.data;
              if (name === "K线" && Array.isArray(value) && value.length >= 4) {
                const [open, close, lowest, highest] = value;
                lines.push(`${marker}${name}`);
                lines.push(`开盘：${Number(open).toFixed(2)}`);
                lines.push(`收盘：${Number(close).toFixed(2)}`);
                lines.push(`最低：${Number(lowest).toFixed(2)}`);
                lines.push(`最高：${Number(highest).toFixed(2)}`);
                continue;
              }
              if (typeof value === "number" && Number.isFinite(value)) {
                const text = name === "成交量" ? value.toLocaleString("zh-CN") : value.toFixed(2);
                lines.push(`${marker}${name}：${text}`);
              }
            }
            return lines.join("<br/>");
          }
        },
        // 主图与成交量分栏；底部预留标签 + dataZoom 滑条，避免 xlabel 压住成交量
        grid: [
          { left: 52, right: 16, top: 32, height: "52%" },
          { left: 52, right: 16, top: "66%", bottom: 52 }
        ],
        xAxis: [
          {
            type: "category",
            data: dates,
            boundaryGap: true,
            axisLine: {
              onZero: false,
              lineStyle: {
                color: "#1890ff",
                // 自定义轴线颜色，支持十六进制/rgb/rgba
                width: 1,
                type: "dashed"
              }
            },
            // 标签只画在下方成交量轴，避免夹在两图之间挡住成交量
            axisLabel: { show: false },
            axisTick: { show: false }
          },
          {
            type: "category",
            gridIndex: 1,
            data: dates,
            boundaryGap: true,
            axisLine: {
              onZero: false,
              lineStyle: {
                color: "#1890ff",
                // 自定义轴线颜色，支持十六进制/rgb/rgba
                width: 1,
                type: "dashed"
              }
            },
            axisLabel: {
              color: "#8c8c8c",
              fontSize: 11,
              hideOverlap: true,
              // 当天分时日期很长，只展示 HH:mm，减少拥挤与旋转需求
              formatter: (value) => {
                if (activeRange === "today" && value.includes(" ")) {
                  const time = value.split(" ")[1] ?? value;
                  return time.slice(0, 5);
                }
                return value;
              }
            }
          }
        ],
        yAxis: [
          { scale: true, splitArea: { show: true } },
          { scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { show: false } }
        ],
        dataZoom: [
          {
            type: "inside",
            xAxisIndex: [0, 1],
            // 当天分时默认看全天，其它周期看后半段
            start: activeRange === "today" ? 0 : 55,
            end: 100
          },
          {
            show: true,
            xAxisIndex: [0, 1],
            type: "slider",
            bottom: 4,
            height: 18,
            start: activeRange === "today" ? 0 : 55,
            end: 100
          }
        ],
        series: [
          {
            name: "K线",
            type: "candlestick",
            data: ohlc,
            markPoint: {
              data: [
                ...buyPoints.map((p) => ({
                  ...p,
                  symbol: "pin",
                  symbolSize: 40,
                  itemStyle: { color: "#ef5350" }
                })),
                ...sellPoints.map((p) => ({
                  ...p,
                  symbol: "pin",
                  symbolSize: 40,
                  itemStyle: { color: "#26a69a" }
                }))
              ]
            },
            itemStyle: {
              color: "#ef5350",
              color0: "#26a69a",
              borderColor: "#ef5350",
              borderColor0: "#26a69a"
            }
          },
          {
            name: "5日均线",
            type: "line",
            data: ma5,
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1, color: "#f6c022" }
          },
          {
            name: "20日均线",
            type: "line",
            data: ma20,
            smooth: true,
            showSymbol: false,
            lineStyle: { width: 1, color: "#7b6cff" }
          },
          {
            name: "成交量",
            type: "bar",
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: volumes,
            itemStyle: { color: "rgba(84, 112, 198, 0.45)" }
          }
        ]
      },
      true
    );
    const onResize = () => chart2.resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeChart, displayBars, activeRange, analysis2]);
  reactExports.useEffect(() => {
    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);
  if (!chartData.length) return null;
  const stockTabItems = chartData.map((c) => ({
    key: c.symbol,
    label: `${c.name} ${c.symbol}`
  }));
  const rangeTabItems = availableRanges.map((r) => ({
    key: r,
    label: STOCK_RANGE_LABELS[r]
  }));
  const signalTag = querySignalTag(analysis2?.overallSignal);
  const trendTag = queryTrendTag(analysis2?.trend);
  const prediction2 = analysis2?.prediction;
  const clock = queryFormatClock(lastRefreshAt ?? activeChart?.quote?.updatedAt);
  const quote = activeChart?.quote;
  const rangeLabel = STOCK_RANGE_LABELS[activeRange];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.wrap, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.toolbar, children: [
      chartData.length > 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        Tabs,
        {
          className: styles.tabs,
          size: "small",
          activeKey: activeSymbol,
          items: stockTabItems,
          onChange: (key) => {
            setActiveSymbol(key);
            const next = chartData.find((c) => c.symbol === key);
            if (next) setActiveRange(queryDefaultRange(next));
          }
        }
      ) : null,
      rangeTabItems.length > 1 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        Tabs,
        {
          size: "small",
          type: "card",
          activeKey: activeRange,
          items: rangeTabItems,
          onChange: (key) => setActiveRange(key)
        }
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.liveActions, children: [
        lastRefreshAt ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { color: "processing", className: styles.liveTag, children: [
          refreshing ? "刷新中…" : "已更新",
          clock ? ` · ${clock}` : ""
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            size: "small",
            type: "link",
            loading: refreshing,
            onClick: () => void handleManualRefresh(),
            children: "刷新"
          }
        )
      ] })
    ] }),
    activeChart ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.chartMeta, "aria-label": "K线标题与现价", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles.chartMetaTitle, children: [
        activeChart.name,
        "（",
        activeChart.symbol,
        "）",
        rangeLabel
      ] }),
      quote != null ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "span",
        {
          className: quote.changePct >= 0 ? styles.chartMetaQuoteUp : styles.chartMetaQuoteDown,
          children: [
            "现价 ",
            quote.price.toFixed(2),
            "（",
            quote.changePct >= 0 ? "+" : "",
            quote.changePct.toFixed(2),
            "%）"
          ]
        }
      ) : null
    ] }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: chartRef, className: styles.chart, role: "img", "aria-label": "A股实时K线图" }),
    analysis2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { size: "small", className: styles.analysis, title: "综合分析", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.signalRow, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { color: signalTag.color, children: [
          "综合信号：",
          signalTag.label
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { color: trendTag.color, children: [
          "趋势：",
          trendTag.label
        ] }),
        prediction2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Tag,
          {
            color: prediction2.direction === "up" ? "red" : prediction2.direction === "down" ? "green" : "default",
            children: [
              "预测：",
              prediction2.direction === "up" ? "看涨" : prediction2.direction === "down" ? "看跌" : "横盘",
              "（",
              prediction2.confidence,
              "%）"
            ]
          }
        ) : null
      ] }),
      prediction2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.prediction, children: [
        prediction2.horizon,
        prediction2.targetPrice != null ? ` · 参考目标价 ${prediction2.targetPrice} · 止损 ${prediction2.stopLoss}` : "",
        prediction2.changePctEstimate != null ? ` · 预估幅度 ${prediction2.changePctEstimate >= 0 ? "+" : ""}${prediction2.changePctEstimate}%` : ""
      ] }) : null,
      analysis2.tradeSignals.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        List,
        {
          size: "small",
          dataSource: analysis2.tradeSignals.slice(-4),
          renderItem: (item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(List.Item, { className: styles.listItem, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: item.type === "buy" ? "red" : "green", children: item.type === "buy" ? "买入" : "卖出" }),
            item.date,
            " @ ",
            item.price.toFixed(2),
            " — ",
            item.reason
          ] })
        }
      ) : null,
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.disclaimer, children: "以上分析基于技术指标规则引擎生成，仅供流程演示，不构成投资建议。" })
    ] }) : null
  ] });
}
export {
  MessageKlineChart
};
