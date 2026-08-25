import { r as reactExports } from "./vendor-xyflow-ByVkQ6-f.js";
import { i as genStyleHooks, r as resetComponent, j as unit, o as useComponentConfig, c as classNames, p as pickAttrs, C as CSSMotion, cZ as composeRef, da as replaceElement, db as RefIcon, ap as RefIcon$1, dc as RefIcon$2, ao as RefIcon$3, W as RefIcon$4, dd as _getPrototypeOf, de as _possibleConstructorReturn, df as _isNativeReflectConstruct, c4 as _inherits, b7 as _createClass, b8 as _classCallCheck } from "./index-BQnnWLUu.js";
const genAlertTypeStyle = (bgColor, borderColor, iconColor, token, alertCls) => ({
  background: bgColor,
  border: `${unit(token.lineWidth)} ${token.lineType} ${borderColor}`,
  [`${alertCls}-icon`]: {
    color: iconColor
  }
});
const genBaseStyle = (token) => {
  const {
    componentCls,
    motionDurationSlow: duration,
    marginXS,
    marginSM,
    fontSize,
    fontSizeLG,
    lineHeight,
    borderRadiusLG: borderRadius,
    motionEaseInOutCirc,
    withDescriptionIconSize,
    colorText,
    colorTextHeading,
    withDescriptionPadding,
    defaultPadding
  } = token;
  return {
    [componentCls]: Object.assign(Object.assign({}, resetComponent(token)), {
      position: "relative",
      display: "flex",
      alignItems: "center",
      padding: defaultPadding,
      wordWrap: "break-word",
      borderRadius,
      [`&${componentCls}-rtl`]: {
        direction: "rtl"
      },
      [`${componentCls}-content`]: {
        flex: 1,
        minWidth: 0
      },
      [`${componentCls}-icon`]: {
        marginInlineEnd: marginXS,
        lineHeight: 0
      },
      "&-description": {
        display: "none",
        fontSize,
        lineHeight
      },
      "&-message": {
        color: colorTextHeading
      },
      [`&${componentCls}-motion-leave`]: {
        overflow: "hidden",
        opacity: 1,
        transition: `max-height ${duration} ${motionEaseInOutCirc}, opacity ${duration} ${motionEaseInOutCirc},
        padding-top ${duration} ${motionEaseInOutCirc}, padding-bottom ${duration} ${motionEaseInOutCirc},
        margin-bottom ${duration} ${motionEaseInOutCirc}`
      },
      [`&${componentCls}-motion-leave-active`]: {
        maxHeight: 0,
        marginBottom: "0 !important",
        paddingTop: 0,
        paddingBottom: 0,
        opacity: 0
      }
    }),
    [`${componentCls}-with-description`]: {
      alignItems: "flex-start",
      padding: withDescriptionPadding,
      [`${componentCls}-icon`]: {
        marginInlineEnd: marginSM,
        fontSize: withDescriptionIconSize,
        lineHeight: 0
      },
      [`${componentCls}-message`]: {
        display: "block",
        marginBottom: marginXS,
        color: colorTextHeading,
        fontSize: fontSizeLG
      },
      [`${componentCls}-description`]: {
        display: "block",
        color: colorText
      }
    },
    [`${componentCls}-banner`]: {
      marginBottom: 0,
      border: "0 !important",
      borderRadius: 0
    }
  };
};
const genTypeStyle = (token) => {
  const {
    componentCls,
    colorSuccess,
    colorSuccessBorder,
    colorSuccessBg,
    colorWarning,
    colorWarningBorder,
    colorWarningBg,
    colorError,
    colorErrorBorder,
    colorErrorBg,
    colorInfo,
    colorInfoBorder,
    colorInfoBg
  } = token;
  return {
    [componentCls]: {
      "&-success": genAlertTypeStyle(colorSuccessBg, colorSuccessBorder, colorSuccess, token, componentCls),
      "&-info": genAlertTypeStyle(colorInfoBg, colorInfoBorder, colorInfo, token, componentCls),
      "&-warning": genAlertTypeStyle(colorWarningBg, colorWarningBorder, colorWarning, token, componentCls),
      "&-error": Object.assign(Object.assign({}, genAlertTypeStyle(colorErrorBg, colorErrorBorder, colorError, token, componentCls)), {
        [`${componentCls}-description > pre`]: {
          margin: 0,
          padding: 0
        }
      })
    }
  };
};
const genActionStyle = (token) => {
  const {
    componentCls,
    iconCls,
    motionDurationMid,
    marginXS,
    fontSizeIcon,
    colorIcon,
    colorIconHover
  } = token;
  return {
    [componentCls]: {
      "&-action": {
        marginInlineStart: marginXS
      },
      [`${componentCls}-close-icon`]: {
        marginInlineStart: marginXS,
        padding: 0,
        overflow: "hidden",
        fontSize: fontSizeIcon,
        lineHeight: unit(fontSizeIcon),
        backgroundColor: "transparent",
        border: "none",
        outline: "none",
        cursor: "pointer",
        [`${iconCls}-close`]: {
          color: colorIcon,
          transition: `color ${motionDurationMid}`,
          "&:hover": {
            color: colorIconHover
          }
        }
      },
      "&-close-text": {
        color: colorIcon,
        transition: `color ${motionDurationMid}`,
        "&:hover": {
          color: colorIconHover
        }
      }
    }
  };
};
const prepareComponentToken = (token) => {
  const paddingHorizontal = 12;
  return {
    withDescriptionIconSize: token.fontSizeHeading3,
    defaultPadding: `${token.paddingContentVerticalSM}px ${paddingHorizontal}px`,
    withDescriptionPadding: `${token.paddingMD}px ${token.paddingContentHorizontalLG}px`
  };
};
const useStyle = genStyleHooks("Alert", (token) => [genBaseStyle(token), genTypeStyle(token), genActionStyle(token)], prepareComponentToken);
var __rest = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const iconMapFilled = {
  success: RefIcon$3,
  info: RefIcon$2,
  error: RefIcon$1,
  warning: RefIcon
};
const IconNode = (props) => {
  const {
    icon,
    prefixCls,
    type
  } = props;
  const iconType = iconMapFilled[type] || null;
  if (icon) {
    return replaceElement(icon, /* @__PURE__ */ reactExports.createElement("span", {
      className: `${prefixCls}-icon`
    }, icon), () => ({
      className: classNames(`${prefixCls}-icon`, icon.props.className)
    }));
  }
  return /* @__PURE__ */ reactExports.createElement(iconType, {
    className: `${prefixCls}-icon`
  });
};
const CloseIconNode = (props) => {
  const {
    isClosable,
    prefixCls,
    closeIcon,
    handleClose,
    ariaProps
  } = props;
  const mergedCloseIcon = closeIcon === true || closeIcon === void 0 ? /* @__PURE__ */ reactExports.createElement(RefIcon$4, null) : closeIcon;
  return isClosable ? /* @__PURE__ */ reactExports.createElement("button", Object.assign({
    type: "button",
    onClick: handleClose,
    className: `${prefixCls}-close-icon`,
    tabIndex: 0
  }, ariaProps), mergedCloseIcon) : null;
};
const Alert$1 = /* @__PURE__ */ reactExports.forwardRef((props, ref) => {
  const {
    description,
    prefixCls: customizePrefixCls,
    message,
    banner,
    className,
    rootClassName,
    style,
    onMouseEnter,
    onMouseLeave,
    onClick,
    afterClose,
    showIcon,
    closable,
    closeText,
    closeIcon,
    action,
    id
  } = props, otherProps = __rest(props, ["description", "prefixCls", "message", "banner", "className", "rootClassName", "style", "onMouseEnter", "onMouseLeave", "onClick", "afterClose", "showIcon", "closable", "closeText", "closeIcon", "action", "id"]);
  const [closed, setClosed] = reactExports.useState(false);
  const internalRef = reactExports.useRef(null);
  reactExports.useImperativeHandle(ref, () => ({
    nativeElement: internalRef.current
  }));
  const {
    getPrefixCls,
    direction,
    closable: contextClosable,
    closeIcon: contextCloseIcon,
    className: contextClassName,
    style: contextStyle
  } = useComponentConfig("alert");
  const prefixCls = getPrefixCls("alert", customizePrefixCls);
  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls);
  const handleClose = (e) => {
    var _a;
    setClosed(true);
    (_a = props.onClose) === null || _a === void 0 ? void 0 : _a.call(props, e);
  };
  const type = reactExports.useMemo(() => {
    if (props.type !== void 0) {
      return props.type;
    }
    return banner ? "warning" : "info";
  }, [props.type, banner]);
  const isClosable = reactExports.useMemo(() => {
    if (typeof closable === "object" && closable.closeIcon) {
      return true;
    }
    if (closeText) {
      return true;
    }
    if (typeof closable === "boolean") {
      return closable;
    }
    if (closeIcon !== false && closeIcon !== null && closeIcon !== void 0) {
      return true;
    }
    return !!contextClosable;
  }, [closeText, closeIcon, closable, contextClosable]);
  const isShowIcon = banner && showIcon === void 0 ? true : showIcon;
  const alertCls = classNames(prefixCls, `${prefixCls}-${type}`, {
    [`${prefixCls}-with-description`]: !!description,
    [`${prefixCls}-no-icon`]: !isShowIcon,
    [`${prefixCls}-banner`]: !!banner,
    [`${prefixCls}-rtl`]: direction === "rtl"
  }, contextClassName, className, rootClassName, cssVarCls, hashId);
  const restProps = pickAttrs(otherProps, {
    aria: true,
    data: true
  });
  const mergedCloseIcon = reactExports.useMemo(() => {
    if (typeof closable === "object" && closable.closeIcon) {
      return closable.closeIcon;
    }
    if (closeText) {
      return closeText;
    }
    if (closeIcon !== void 0) {
      return closeIcon;
    }
    if (typeof contextClosable === "object" && contextClosable.closeIcon) {
      return contextClosable.closeIcon;
    }
    return contextCloseIcon;
  }, [closeIcon, closable, contextClosable, closeText, contextCloseIcon]);
  const mergedAriaProps = reactExports.useMemo(() => {
    const merged = closable !== null && closable !== void 0 ? closable : contextClosable;
    if (typeof merged === "object") {
      const {
        closeIcon: _
      } = merged, ariaProps = __rest(merged, ["closeIcon"]);
      return ariaProps;
    }
    return {};
  }, [closable, contextClosable]);
  return wrapCSSVar(/* @__PURE__ */ reactExports.createElement(CSSMotion, {
    visible: !closed,
    motionName: `${prefixCls}-motion`,
    motionAppear: false,
    motionEnter: false,
    onLeaveStart: (node) => ({
      maxHeight: node.offsetHeight
    }),
    onLeaveEnd: afterClose
  }, ({
    className: motionClassName,
    style: motionStyle
  }, setRef) => /* @__PURE__ */ reactExports.createElement("div", Object.assign({
    id,
    ref: composeRef(internalRef, setRef),
    "data-show": !closed,
    className: classNames(alertCls, motionClassName),
    style: Object.assign(Object.assign(Object.assign({}, contextStyle), style), motionStyle),
    onMouseEnter,
    onMouseLeave,
    onClick,
    role: "alert"
  }, restProps), isShowIcon ? /* @__PURE__ */ reactExports.createElement(IconNode, {
    description,
    icon: props.icon,
    prefixCls,
    type
  }) : null, /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-content`
  }, message ? /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-message`
  }, message) : null, description ? /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-description`
  }, description) : null), action ? /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-action`
  }, action) : null, /* @__PURE__ */ reactExports.createElement(CloseIconNode, {
    isClosable,
    prefixCls,
    closeIcon: mergedCloseIcon,
    handleClose,
    ariaProps: mergedAriaProps
  }))));
});
function _callSuper(t, o, e) {
  return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
}
let ErrorBoundary = /* @__PURE__ */ (function(_React$Component) {
  function ErrorBoundary2() {
    var _this;
    _classCallCheck(this, ErrorBoundary2);
    _this = _callSuper(this, ErrorBoundary2, arguments);
    _this.state = {
      error: void 0,
      info: {
        componentStack: ""
      }
    };
    return _this;
  }
  _inherits(ErrorBoundary2, _React$Component);
  return _createClass(ErrorBoundary2, [{
    key: "componentDidCatch",
    value: function componentDidCatch(error, info) {
      this.setState({
        error,
        info
      });
    }
  }, {
    key: "render",
    value: function render() {
      const {
        message,
        description,
        id,
        children
      } = this.props;
      const {
        error,
        info
      } = this.state;
      const componentStack = (info === null || info === void 0 ? void 0 : info.componentStack) || null;
      const errorMessage = typeof message === "undefined" ? (error || "").toString() : message;
      const errorDescription = typeof description === "undefined" ? componentStack : description;
      if (error) {
        return /* @__PURE__ */ reactExports.createElement(Alert$1, {
          id,
          type: "error",
          message: errorMessage,
          description: /* @__PURE__ */ reactExports.createElement("pre", {
            style: {
              fontSize: "0.9em",
              overflowX: "auto"
            }
          }, errorDescription)
        });
      }
      return children;
    }
  }]);
})(reactExports.Component);
const Alert = Alert$1;
Alert.ErrorBoundary = ErrorBoundary;
export {
  Alert as A
};
