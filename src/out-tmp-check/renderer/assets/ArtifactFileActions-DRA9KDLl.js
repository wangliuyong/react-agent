import { r as reactExports, a as ReactDOM, R as ReactExports, j as jsxRuntimeExports } from "./vendor-xyflow-C3K48oRM.js";
import { i as genStyleHooks, r as resetComponent, j as unit, o as useComponentConfig, c as classNames, p as pickAttrs, C as CSSMotion, cx as composeRef, cy as replaceElement, cz as RefIcon$b, ai as RefIcon$c, cA as RefIcon$d, ah as RefIcon$e, R as RefIcon$f, cB as _getPrototypeOf, cC as _possibleConstructorReturn, cD as _isNativeReflectConstruct, bZ as _inherits, b0 as _createClass, b1 as _classCallCheck, a as _defineProperty, cE as Portal, e as _objectSpread2, K as KeyCode, _ as _slicedToArray, bN as isEqual, aX as wrapperRaf, b as _objectWithoutProperties, d as _extends, cF as DialogWrap, g as _toConsumableArray, f as _typeof, u as useMergedState, I as Icon, m as merge, b5 as FastColor, cG as genModalMaskStyle, cH as initFadeMotion, cI as initZoomMotion, bi as textEllipsis, h as ConfigContext, br as useCSSVarCls, bw as useZIndex, cJ as getTransitionName, bu as useLocale, ay as RefIcon$i, $ as Tooltip, B as Button, z as appMessage } from "./index-D2SMd1bE.js";
import { R as RefIcon$g, a as RefIcon$h } from "./index-BMGYYAHO.js";
import { R as RefIcon$j } from "./FolderOpenOutlined-CpyBDLdr.js";
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
const prepareComponentToken$1 = (token) => {
  const paddingHorizontal = 12;
  return {
    withDescriptionIconSize: token.fontSizeHeading3,
    defaultPadding: `${token.paddingContentVerticalSM}px ${paddingHorizontal}px`,
    withDescriptionPadding: `${token.paddingMD}px ${token.paddingContentHorizontalLG}px`
  };
};
const useStyle$1 = genStyleHooks("Alert", (token) => [genBaseStyle(token), genTypeStyle(token), genActionStyle(token)], prepareComponentToken$1);
var __rest$2 = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const iconMapFilled = {
  success: RefIcon$e,
  info: RefIcon$d,
  error: RefIcon$c,
  warning: RefIcon$b
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
  const mergedCloseIcon = closeIcon === true || closeIcon === void 0 ? /* @__PURE__ */ reactExports.createElement(RefIcon$f, null) : closeIcon;
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
  } = props, otherProps = __rest$2(props, ["description", "prefixCls", "message", "banner", "className", "rootClassName", "style", "onMouseEnter", "onMouseLeave", "onClick", "afterClose", "showIcon", "closable", "closeText", "closeIcon", "action", "id"]);
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
  const [wrapCSSVar, hashId, cssVarCls] = useStyle$1(prefixCls);
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
      } = merged, ariaProps = __rest$2(merged, ["closeIcon"]);
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
function getClientSize() {
  var width = document.documentElement.clientWidth;
  var height = window.innerHeight || document.documentElement.clientHeight;
  return {
    width,
    height
  };
}
function getOffset(node) {
  var box = node.getBoundingClientRect();
  var docElem = document.documentElement;
  return {
    left: box.left + (window.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || document.body.clientLeft || 0),
    top: box.top + (window.pageYOffset || docElem.scrollTop) - (docElem.clientTop || document.body.clientTop || 0)
  };
}
function addEventListenerWrap(target, eventType, cb, option) {
  var callback = ReactDOM.unstable_batchedUpdates ? function run(e) {
    ReactDOM.unstable_batchedUpdates(cb, e);
  } : cb;
  if (target !== null && target !== void 0 && target.addEventListener) {
    target.addEventListener(eventType, callback, option);
  }
  return {
    remove: function remove() {
      if (target !== null && target !== void 0 && target.removeEventListener) {
        target.removeEventListener(eventType, callback, option);
      }
    }
  };
}
var PreviewGroupContext = /* @__PURE__ */ reactExports.createContext(null);
var Operations = function Operations2(props) {
  var visible = props.visible, maskTransitionName = props.maskTransitionName, getContainer = props.getContainer, prefixCls = props.prefixCls, rootClassName = props.rootClassName, icons2 = props.icons, countRender = props.countRender, showSwitch = props.showSwitch, showProgress = props.showProgress, current = props.current, transform = props.transform, count = props.count, scale = props.scale, minScale = props.minScale, maxScale = props.maxScale, closeIcon = props.closeIcon, onActive = props.onActive, onClose = props.onClose, onZoomIn = props.onZoomIn, onZoomOut = props.onZoomOut, onRotateRight = props.onRotateRight, onRotateLeft = props.onRotateLeft, onFlipX = props.onFlipX, onFlipY = props.onFlipY, onReset = props.onReset, toolbarRender = props.toolbarRender, zIndex = props.zIndex, image = props.image;
  var groupContext = reactExports.useContext(PreviewGroupContext);
  var rotateLeft = icons2.rotateLeft, rotateRight = icons2.rotateRight, zoomIn = icons2.zoomIn, zoomOut = icons2.zoomOut, close = icons2.close, left = icons2.left, right = icons2.right, flipX = icons2.flipX, flipY = icons2.flipY;
  var toolClassName = "".concat(prefixCls, "-operations-operation");
  reactExports.useEffect(function() {
    var onKeyDown = function onKeyDown2(e) {
      if (e.keyCode === KeyCode.ESC) {
        onClose();
      }
    };
    if (visible) {
      window.addEventListener("keydown", onKeyDown);
    }
    return function() {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [visible]);
  var handleActive = function handleActive2(e, offset) {
    e.preventDefault();
    e.stopPropagation();
    onActive(offset);
  };
  var renderOperation = reactExports.useCallback(function(_ref) {
    var type = _ref.type, disabled = _ref.disabled, onClick = _ref.onClick, icon = _ref.icon;
    return /* @__PURE__ */ reactExports.createElement("div", {
      key: type,
      className: classNames(toolClassName, "".concat(prefixCls, "-operations-operation-").concat(type), _defineProperty({}, "".concat(prefixCls, "-operations-operation-disabled"), !!disabled)),
      onClick
    }, icon);
  }, [toolClassName, prefixCls]);
  var switchPrevNode = showSwitch ? renderOperation({
    icon: left,
    onClick: function onClick(e) {
      return handleActive(e, -1);
    },
    type: "prev",
    disabled: current === 0
  }) : void 0;
  var switchNextNode = showSwitch ? renderOperation({
    icon: right,
    onClick: function onClick(e) {
      return handleActive(e, 1);
    },
    type: "next",
    disabled: current === count - 1
  }) : void 0;
  var flipYNode = renderOperation({
    icon: flipY,
    onClick: onFlipY,
    type: "flipY"
  });
  var flipXNode = renderOperation({
    icon: flipX,
    onClick: onFlipX,
    type: "flipX"
  });
  var rotateLeftNode = renderOperation({
    icon: rotateLeft,
    onClick: onRotateLeft,
    type: "rotateLeft"
  });
  var rotateRightNode = renderOperation({
    icon: rotateRight,
    onClick: onRotateRight,
    type: "rotateRight"
  });
  var zoomOutNode = renderOperation({
    icon: zoomOut,
    onClick: onZoomOut,
    type: "zoomOut",
    disabled: scale <= minScale
  });
  var zoomInNode = renderOperation({
    icon: zoomIn,
    onClick: onZoomIn,
    type: "zoomIn",
    disabled: scale === maxScale
  });
  var toolbarNode = /* @__PURE__ */ reactExports.createElement("div", {
    className: "".concat(prefixCls, "-operations")
  }, flipYNode, flipXNode, rotateLeftNode, rotateRightNode, zoomOutNode, zoomInNode);
  return /* @__PURE__ */ reactExports.createElement(CSSMotion, {
    visible,
    motionName: maskTransitionName
  }, function(_ref2) {
    var className = _ref2.className, style = _ref2.style;
    return /* @__PURE__ */ reactExports.createElement(Portal, {
      open: true,
      getContainer: getContainer !== null && getContainer !== void 0 ? getContainer : document.body
    }, /* @__PURE__ */ reactExports.createElement("div", {
      className: classNames("".concat(prefixCls, "-operations-wrapper"), className, rootClassName),
      style: _objectSpread2(_objectSpread2({}, style), {}, {
        zIndex
      })
    }, closeIcon === null ? null : /* @__PURE__ */ reactExports.createElement("button", {
      className: "".concat(prefixCls, "-close"),
      onClick: onClose
    }, closeIcon || close), showSwitch && /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement("div", {
      className: classNames("".concat(prefixCls, "-switch-left"), _defineProperty({}, "".concat(prefixCls, "-switch-left-disabled"), current === 0)),
      onClick: function onClick(e) {
        return handleActive(e, -1);
      }
    }, left), /* @__PURE__ */ reactExports.createElement("div", {
      className: classNames("".concat(prefixCls, "-switch-right"), _defineProperty({}, "".concat(prefixCls, "-switch-right-disabled"), current === count - 1)),
      onClick: function onClick(e) {
        return handleActive(e, 1);
      }
    }, right)), /* @__PURE__ */ reactExports.createElement("div", {
      className: "".concat(prefixCls, "-footer")
    }, showProgress && /* @__PURE__ */ reactExports.createElement("div", {
      className: "".concat(prefixCls, "-progress")
    }, countRender ? countRender(current + 1, count) : /* @__PURE__ */ reactExports.createElement("bdi", null, "".concat(current + 1, " / ").concat(count))), toolbarRender ? toolbarRender(toolbarNode, _objectSpread2(_objectSpread2({
      icons: {
        prevIcon: switchPrevNode,
        nextIcon: switchNextNode,
        flipYIcon: flipYNode,
        flipXIcon: flipXNode,
        rotateLeftIcon: rotateLeftNode,
        rotateRightIcon: rotateRightNode,
        zoomOutIcon: zoomOutNode,
        zoomInIcon: zoomInNode
      },
      actions: {
        onActive,
        onFlipY,
        onFlipX,
        onRotateLeft,
        onRotateRight,
        onZoomOut,
        onZoomIn,
        onReset,
        onClose
      },
      transform
    }, groupContext ? {
      current,
      total: count
    } : {}), {}, {
      image
    })) : toolbarNode)));
  });
};
var initialTransform = {
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1,
  flipX: false,
  flipY: false
};
function useImageTransform(imgRef, minScale, maxScale, onTransform) {
  var frame = reactExports.useRef(null);
  var queue = reactExports.useRef([]);
  var _useState = reactExports.useState(initialTransform), _useState2 = _slicedToArray(_useState, 2), transform = _useState2[0], setTransform = _useState2[1];
  var resetTransform = function resetTransform2(action) {
    setTransform(initialTransform);
    if (!isEqual(initialTransform, transform)) {
      onTransform === null || onTransform === void 0 || onTransform({
        transform: initialTransform,
        action
      });
    }
  };
  var updateTransform = function updateTransform2(newTransform, action) {
    if (frame.current === null) {
      queue.current = [];
      frame.current = wrapperRaf(function() {
        setTransform(function(preState) {
          var memoState = preState;
          queue.current.forEach(function(queueState) {
            memoState = _objectSpread2(_objectSpread2({}, memoState), queueState);
          });
          frame.current = null;
          onTransform === null || onTransform === void 0 || onTransform({
            transform: memoState,
            action
          });
          return memoState;
        });
      });
    }
    queue.current.push(_objectSpread2(_objectSpread2({}, transform), newTransform));
  };
  var dispatchZoomChange = function dispatchZoomChange2(ratio, action, centerX, centerY, isTouch) {
    var _imgRef$current = imgRef.current, width = _imgRef$current.width, height = _imgRef$current.height, offsetWidth = _imgRef$current.offsetWidth, offsetHeight = _imgRef$current.offsetHeight, offsetLeft = _imgRef$current.offsetLeft, offsetTop = _imgRef$current.offsetTop;
    var newRatio = ratio;
    var newScale = transform.scale * ratio;
    if (newScale > maxScale) {
      newScale = maxScale;
      newRatio = maxScale / transform.scale;
    } else if (newScale < minScale) {
      newScale = isTouch ? newScale : minScale;
      newRatio = newScale / transform.scale;
    }
    var mergedCenterX = centerX !== null && centerX !== void 0 ? centerX : innerWidth / 2;
    var mergedCenterY = centerY !== null && centerY !== void 0 ? centerY : innerHeight / 2;
    var diffRatio = newRatio - 1;
    var diffImgX = diffRatio * width * 0.5;
    var diffImgY = diffRatio * height * 0.5;
    var diffOffsetLeft = diffRatio * (mergedCenterX - transform.x - offsetLeft);
    var diffOffsetTop = diffRatio * (mergedCenterY - transform.y - offsetTop);
    var newX = transform.x - (diffOffsetLeft - diffImgX);
    var newY = transform.y - (diffOffsetTop - diffImgY);
    if (ratio < 1 && newScale === 1) {
      var mergedWidth = offsetWidth * newScale;
      var mergedHeight = offsetHeight * newScale;
      var _getClientSize = getClientSize(), clientWidth = _getClientSize.width, clientHeight = _getClientSize.height;
      if (mergedWidth <= clientWidth && mergedHeight <= clientHeight) {
        newX = 0;
        newY = 0;
      }
    }
    updateTransform({
      x: newX,
      y: newY,
      scale: newScale
    }, action);
  };
  return {
    transform,
    resetTransform,
    updateTransform,
    dispatchZoomChange
  };
}
function fixPoint(key, start, width, clientWidth) {
  var startAddWidth = start + width;
  var offsetStart = (width - clientWidth) / 2;
  if (width > clientWidth) {
    if (start > 0) {
      return _defineProperty({}, key, offsetStart);
    }
    if (start < 0 && startAddWidth < clientWidth) {
      return _defineProperty({}, key, -offsetStart);
    }
  } else if (start < 0 || startAddWidth > clientWidth) {
    return _defineProperty({}, key, start < 0 ? offsetStart : -offsetStart);
  }
  return {};
}
function getFixScaleEleTransPosition(width, height, left, top) {
  var _getClientSize = getClientSize(), clientWidth = _getClientSize.width, clientHeight = _getClientSize.height;
  var fixPos = null;
  if (width <= clientWidth && height <= clientHeight) {
    fixPos = {
      x: 0,
      y: 0
    };
  } else if (width > clientWidth || height > clientHeight) {
    fixPos = _objectSpread2(_objectSpread2({}, fixPoint("x", left, width, clientWidth)), fixPoint("y", top, height, clientHeight));
  }
  return fixPos;
}
var BASE_SCALE_RATIO = 1;
var WHEEL_MAX_SCALE_RATIO = 1;
function useMouseEvent(imgRef, movable, visible, scaleStep, transform, updateTransform, dispatchZoomChange) {
  var rotate = transform.rotate, scale = transform.scale, x = transform.x, y = transform.y;
  var _useState = reactExports.useState(false), _useState2 = _slicedToArray(_useState, 2), isMoving = _useState2[0], setMoving = _useState2[1];
  var startPositionInfo = reactExports.useRef({
    diffX: 0,
    diffY: 0,
    transformX: 0,
    transformY: 0
  });
  var onMouseDown = function onMouseDown2(event) {
    if (!movable || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    startPositionInfo.current = {
      diffX: event.pageX - x,
      diffY: event.pageY - y,
      transformX: x,
      transformY: y
    };
    setMoving(true);
  };
  var onMouseMove = function onMouseMove2(event) {
    if (visible && isMoving) {
      updateTransform({
        x: event.pageX - startPositionInfo.current.diffX,
        y: event.pageY - startPositionInfo.current.diffY
      }, "move");
    }
  };
  var onMouseUp = function onMouseUp2() {
    if (visible && isMoving) {
      setMoving(false);
      var _startPositionInfo$cu = startPositionInfo.current, transformX = _startPositionInfo$cu.transformX, transformY = _startPositionInfo$cu.transformY;
      var hasChangedPosition = x !== transformX && y !== transformY;
      if (!hasChangedPosition) return;
      var width = imgRef.current.offsetWidth * scale;
      var height = imgRef.current.offsetHeight * scale;
      var _imgRef$current$getBo = imgRef.current.getBoundingClientRect(), left = _imgRef$current$getBo.left, top = _imgRef$current$getBo.top;
      var isRotate = rotate % 180 !== 0;
      var fixState = getFixScaleEleTransPosition(isRotate ? height : width, isRotate ? width : height, left, top);
      if (fixState) {
        updateTransform(_objectSpread2({}, fixState), "dragRebound");
      }
    }
  };
  var onWheel = function onWheel2(event) {
    if (!visible || event.deltaY == 0) return;
    var scaleRatio = Math.abs(event.deltaY / 100);
    var mergedScaleRatio = Math.min(scaleRatio, WHEEL_MAX_SCALE_RATIO);
    var ratio = BASE_SCALE_RATIO + mergedScaleRatio * scaleStep;
    if (event.deltaY > 0) {
      ratio = BASE_SCALE_RATIO / ratio;
    }
    dispatchZoomChange(ratio, "wheel", event.clientX, event.clientY);
  };
  reactExports.useEffect(function() {
    var onTopMouseUpListener;
    var onTopMouseMoveListener;
    var onMouseUpListener;
    var onMouseMoveListener;
    if (movable) {
      onMouseUpListener = addEventListenerWrap(window, "mouseup", onMouseUp, false);
      onMouseMoveListener = addEventListenerWrap(window, "mousemove", onMouseMove, false);
      try {
        if (window.top !== window.self) {
          onTopMouseUpListener = addEventListenerWrap(window.top, "mouseup", onMouseUp, false);
          onTopMouseMoveListener = addEventListenerWrap(window.top, "mousemove", onMouseMove, false);
        }
      } catch (error) {
      }
    }
    return function() {
      var _onMouseUpListener, _onMouseMoveListener, _onTopMouseUpListener, _onTopMouseMoveListen;
      (_onMouseUpListener = onMouseUpListener) === null || _onMouseUpListener === void 0 || _onMouseUpListener.remove();
      (_onMouseMoveListener = onMouseMoveListener) === null || _onMouseMoveListener === void 0 || _onMouseMoveListener.remove();
      (_onTopMouseUpListener = onTopMouseUpListener) === null || _onTopMouseUpListener === void 0 || _onTopMouseUpListener.remove();
      (_onTopMouseMoveListen = onTopMouseMoveListener) === null || _onTopMouseMoveListen === void 0 || _onTopMouseMoveListen.remove();
    };
  }, [visible, isMoving, x, y, rotate, movable]);
  return {
    isMoving,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onWheel
  };
}
function isImageValid(src) {
  return new Promise(function(resolve) {
    if (!src) {
      resolve(false);
      return;
    }
    var img = document.createElement("img");
    img.onerror = function() {
      return resolve(false);
    };
    img.onload = function() {
      return resolve(true);
    };
    img.src = src;
  });
}
function useStatus(_ref) {
  var src = _ref.src, isCustomPlaceholder = _ref.isCustomPlaceholder, fallback = _ref.fallback;
  var _useState = reactExports.useState(isCustomPlaceholder ? "loading" : "normal"), _useState2 = _slicedToArray(_useState, 2), status = _useState2[0], setStatus = _useState2[1];
  var isLoaded = reactExports.useRef(false);
  var isError = status === "error";
  reactExports.useEffect(function() {
    var isCurrentSrc = true;
    isImageValid(src).then(function(isValid) {
      if (!isValid && isCurrentSrc) {
        setStatus("error");
      }
    });
    return function() {
      isCurrentSrc = false;
    };
  }, [src]);
  reactExports.useEffect(function() {
    if (isCustomPlaceholder && !isLoaded.current) {
      setStatus("loading");
    } else if (isError) {
      setStatus("normal");
    }
  }, [src]);
  var onLoad = function onLoad2() {
    setStatus("normal");
  };
  var getImgRef = function getImgRef2(img) {
    isLoaded.current = false;
    if (status === "loading" && img !== null && img !== void 0 && img.complete && (img.naturalWidth || img.naturalHeight)) {
      isLoaded.current = true;
      onLoad();
    }
  };
  var srcAndOnload = isError && fallback ? {
    src: fallback
  } : {
    onLoad,
    src
  };
  return [getImgRef, srcAndOnload, status];
}
function getDistance(a, b) {
  var x = a.x - b.x;
  var y = a.y - b.y;
  return Math.hypot(x, y);
}
function getCenter(oldPoint1, oldPoint2, newPoint1, newPoint2) {
  var distance1 = getDistance(oldPoint1, newPoint1);
  var distance2 = getDistance(oldPoint2, newPoint2);
  if (distance1 === 0 && distance2 === 0) {
    return [oldPoint1.x, oldPoint1.y];
  }
  var ratio = distance1 / (distance1 + distance2);
  var x = oldPoint1.x + ratio * (oldPoint2.x - oldPoint1.x);
  var y = oldPoint1.y + ratio * (oldPoint2.y - oldPoint1.y);
  return [x, y];
}
function useTouchEvent(imgRef, movable, visible, minScale, transform, updateTransform, dispatchZoomChange) {
  var rotate = transform.rotate, scale = transform.scale, x = transform.x, y = transform.y;
  var _useState = reactExports.useState(false), _useState2 = _slicedToArray(_useState, 2), isTouching = _useState2[0], setIsTouching = _useState2[1];
  var touchPointInfo = reactExports.useRef({
    point1: {
      x: 0,
      y: 0
    },
    point2: {
      x: 0,
      y: 0
    },
    eventType: "none"
  });
  var updateTouchPointInfo = function updateTouchPointInfo2(values) {
    touchPointInfo.current = _objectSpread2(_objectSpread2({}, touchPointInfo.current), values);
  };
  var onTouchStart = function onTouchStart2(event) {
    if (!movable) return;
    event.stopPropagation();
    setIsTouching(true);
    var _event$touches = event.touches, touches = _event$touches === void 0 ? [] : _event$touches;
    if (touches.length > 1) {
      updateTouchPointInfo({
        point1: {
          x: touches[0].clientX,
          y: touches[0].clientY
        },
        point2: {
          x: touches[1].clientX,
          y: touches[1].clientY
        },
        eventType: "touchZoom"
      });
    } else {
      updateTouchPointInfo({
        point1: {
          x: touches[0].clientX - x,
          y: touches[0].clientY - y
        },
        eventType: "move"
      });
    }
  };
  var onTouchMove = function onTouchMove2(event) {
    var _event$touches2 = event.touches, touches = _event$touches2 === void 0 ? [] : _event$touches2;
    var _touchPointInfo$curre = touchPointInfo.current, point1 = _touchPointInfo$curre.point1, point2 = _touchPointInfo$curre.point2, eventType = _touchPointInfo$curre.eventType;
    if (touches.length > 1 && eventType === "touchZoom") {
      var newPoint1 = {
        x: touches[0].clientX,
        y: touches[0].clientY
      };
      var newPoint2 = {
        x: touches[1].clientX,
        y: touches[1].clientY
      };
      var _getCenter = getCenter(point1, point2, newPoint1, newPoint2), _getCenter2 = _slicedToArray(_getCenter, 2), centerX = _getCenter2[0], centerY = _getCenter2[1];
      var ratio = getDistance(newPoint1, newPoint2) / getDistance(point1, point2);
      dispatchZoomChange(ratio, "touchZoom", centerX, centerY, true);
      updateTouchPointInfo({
        point1: newPoint1,
        point2: newPoint2,
        eventType: "touchZoom"
      });
    } else if (eventType === "move") {
      updateTransform({
        x: touches[0].clientX - point1.x,
        y: touches[0].clientY - point1.y
      }, "move");
      updateTouchPointInfo({
        eventType: "move"
      });
    }
  };
  var onTouchEnd = function onTouchEnd2() {
    if (!visible) return;
    if (isTouching) {
      setIsTouching(false);
    }
    updateTouchPointInfo({
      eventType: "none"
    });
    if (minScale > scale) {
      return updateTransform({
        x: 0,
        y: 0,
        scale: minScale
      }, "touchZoom");
    }
    var width = imgRef.current.offsetWidth * scale;
    var height = imgRef.current.offsetHeight * scale;
    var _imgRef$current$getBo = imgRef.current.getBoundingClientRect(), left = _imgRef$current$getBo.left, top = _imgRef$current$getBo.top;
    var isRotate = rotate % 180 !== 0;
    var fixState = getFixScaleEleTransPosition(isRotate ? height : width, isRotate ? width : height, left, top);
    if (fixState) {
      updateTransform(_objectSpread2({}, fixState), "dragRebound");
    }
  };
  reactExports.useEffect(function() {
    var onTouchMoveListener;
    if (visible && movable) {
      onTouchMoveListener = addEventListenerWrap(window, "touchmove", function(e) {
        return e.preventDefault();
      }, {
        passive: false
      });
    }
    return function() {
      var _onTouchMoveListener;
      (_onTouchMoveListener = onTouchMoveListener) === null || _onTouchMoveListener === void 0 || _onTouchMoveListener.remove();
    };
  }, [visible, movable]);
  return {
    isTouching,
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
}
var _excluded$2 = ["fallback", "src", "imgRef"], _excluded2$2 = ["prefixCls", "src", "alt", "imageInfo", "fallback", "movable", "onClose", "visible", "icons", "rootClassName", "closeIcon", "getContainer", "current", "count", "countRender", "scaleStep", "minScale", "maxScale", "transitionName", "maskTransitionName", "imageRender", "imgCommonProps", "toolbarRender", "onTransform", "onChange"];
var PreviewImage = function PreviewImage2(_ref) {
  var fallback = _ref.fallback, src = _ref.src, imgRef = _ref.imgRef, props = _objectWithoutProperties(_ref, _excluded$2);
  var _useStatus = useStatus({
    src,
    fallback
  }), _useStatus2 = _slicedToArray(_useStatus, 2), getImgRef = _useStatus2[0], srcAndOnload = _useStatus2[1];
  return /* @__PURE__ */ ReactExports.createElement("img", _extends({
    ref: function ref(_ref2) {
      imgRef.current = _ref2;
      getImgRef(_ref2);
    }
  }, props, srcAndOnload));
};
var Preview = function Preview2(props) {
  var prefixCls = props.prefixCls, src = props.src, alt = props.alt, imageInfo = props.imageInfo, fallback = props.fallback, _props$movable = props.movable, movable = _props$movable === void 0 ? true : _props$movable, onClose = props.onClose, visible = props.visible, _props$icons = props.icons, icons2 = _props$icons === void 0 ? {} : _props$icons, rootClassName = props.rootClassName, closeIcon = props.closeIcon, getContainer = props.getContainer, _props$current = props.current, current = _props$current === void 0 ? 0 : _props$current, _props$count = props.count, count = _props$count === void 0 ? 1 : _props$count, countRender = props.countRender, _props$scaleStep = props.scaleStep, scaleStep = _props$scaleStep === void 0 ? 0.5 : _props$scaleStep, _props$minScale = props.minScale, minScale = _props$minScale === void 0 ? 1 : _props$minScale, _props$maxScale = props.maxScale, maxScale = _props$maxScale === void 0 ? 50 : _props$maxScale, _props$transitionName = props.transitionName, transitionName = _props$transitionName === void 0 ? "zoom" : _props$transitionName, _props$maskTransition = props.maskTransitionName, maskTransitionName = _props$maskTransition === void 0 ? "fade" : _props$maskTransition, imageRender = props.imageRender, imgCommonProps = props.imgCommonProps, toolbarRender = props.toolbarRender, onTransform = props.onTransform, onChange = props.onChange, restProps = _objectWithoutProperties(props, _excluded2$2);
  var imgRef = reactExports.useRef();
  var groupContext = reactExports.useContext(PreviewGroupContext);
  var showLeftOrRightSwitches = groupContext && count > 1;
  var showOperationsProgress = groupContext && count >= 1;
  var _useState = reactExports.useState(true), _useState2 = _slicedToArray(_useState, 2), enableTransition = _useState2[0], setEnableTransition = _useState2[1];
  var _useImageTransform = useImageTransform(imgRef, minScale, maxScale, onTransform), transform = _useImageTransform.transform, resetTransform = _useImageTransform.resetTransform, updateTransform = _useImageTransform.updateTransform, dispatchZoomChange = _useImageTransform.dispatchZoomChange;
  var _useMouseEvent = useMouseEvent(imgRef, movable, visible, scaleStep, transform, updateTransform, dispatchZoomChange), isMoving = _useMouseEvent.isMoving, onMouseDown = _useMouseEvent.onMouseDown, onWheel = _useMouseEvent.onWheel;
  var _useTouchEvent = useTouchEvent(imgRef, movable, visible, minScale, transform, updateTransform, dispatchZoomChange), isTouching = _useTouchEvent.isTouching, onTouchStart = _useTouchEvent.onTouchStart, onTouchMove = _useTouchEvent.onTouchMove, onTouchEnd = _useTouchEvent.onTouchEnd;
  var rotate = transform.rotate, scale = transform.scale;
  var wrapClassName = classNames(_defineProperty({}, "".concat(prefixCls, "-moving"), isMoving));
  reactExports.useEffect(function() {
    if (!enableTransition) {
      setEnableTransition(true);
    }
  }, [enableTransition]);
  var onAfterClose = function onAfterClose2() {
    resetTransform("close");
  };
  var onZoomIn = function onZoomIn2() {
    dispatchZoomChange(BASE_SCALE_RATIO + scaleStep, "zoomIn");
  };
  var onZoomOut = function onZoomOut2() {
    dispatchZoomChange(BASE_SCALE_RATIO / (BASE_SCALE_RATIO + scaleStep), "zoomOut");
  };
  var onRotateRight = function onRotateRight2() {
    updateTransform({
      rotate: rotate + 90
    }, "rotateRight");
  };
  var onRotateLeft = function onRotateLeft2() {
    updateTransform({
      rotate: rotate - 90
    }, "rotateLeft");
  };
  var onFlipX = function onFlipX2() {
    updateTransform({
      flipX: !transform.flipX
    }, "flipX");
  };
  var onFlipY = function onFlipY2() {
    updateTransform({
      flipY: !transform.flipY
    }, "flipY");
  };
  var onReset = function onReset2() {
    resetTransform("reset");
  };
  var onActive = function onActive2(offset) {
    var position = current + offset;
    if (!Number.isInteger(position) || position < 0 || position > count - 1) {
      return;
    }
    setEnableTransition(false);
    resetTransform(offset < 0 ? "prev" : "next");
    onChange === null || onChange === void 0 || onChange(position, current);
  };
  var onKeyDown = function onKeyDown2(event) {
    if (!visible || !showLeftOrRightSwitches) return;
    if (event.keyCode === KeyCode.LEFT) {
      onActive(-1);
    } else if (event.keyCode === KeyCode.RIGHT) {
      onActive(1);
    }
  };
  var onDoubleClick = function onDoubleClick2(event) {
    if (visible) {
      if (scale !== 1) {
        updateTransform({
          x: 0,
          y: 0,
          scale: 1
        }, "doubleClick");
      } else {
        dispatchZoomChange(BASE_SCALE_RATIO + scaleStep, "doubleClick", event.clientX, event.clientY);
      }
    }
  };
  reactExports.useEffect(function() {
    var onKeyDownListener = addEventListenerWrap(window, "keydown", onKeyDown, false);
    return function() {
      onKeyDownListener.remove();
    };
  }, [visible, showLeftOrRightSwitches, current]);
  var imgNode = /* @__PURE__ */ ReactExports.createElement(PreviewImage, _extends({}, imgCommonProps, {
    width: props.width,
    height: props.height,
    imgRef,
    className: "".concat(prefixCls, "-img"),
    alt,
    style: {
      transform: "translate3d(".concat(transform.x, "px, ").concat(transform.y, "px, 0) scale3d(").concat(transform.flipX ? "-" : "").concat(scale, ", ").concat(transform.flipY ? "-" : "").concat(scale, ", 1) rotate(").concat(rotate, "deg)"),
      transitionDuration: (!enableTransition || isTouching) && "0s"
    },
    fallback,
    src,
    onWheel,
    onMouseDown,
    onDoubleClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: onTouchEnd
  }));
  var image = _objectSpread2({
    url: src,
    alt
  }, imageInfo);
  return /* @__PURE__ */ ReactExports.createElement(ReactExports.Fragment, null, /* @__PURE__ */ ReactExports.createElement(DialogWrap, _extends({
    transitionName,
    maskTransitionName,
    closable: false,
    keyboard: true,
    prefixCls,
    onClose,
    visible,
    classNames: {
      wrapper: wrapClassName
    },
    rootClassName,
    getContainer
  }, restProps, {
    afterClose: onAfterClose
  }), /* @__PURE__ */ ReactExports.createElement("div", {
    className: "".concat(prefixCls, "-img-wrapper")
  }, imageRender ? imageRender(imgNode, _objectSpread2({
    transform,
    image
  }, groupContext ? {
    current
  } : {})) : imgNode)), /* @__PURE__ */ ReactExports.createElement(Operations, {
    visible,
    transform,
    maskTransitionName,
    closeIcon,
    getContainer,
    prefixCls,
    rootClassName,
    icons: icons2,
    countRender,
    showSwitch: showLeftOrRightSwitches,
    showProgress: showOperationsProgress,
    current,
    count,
    scale,
    minScale,
    maxScale,
    toolbarRender,
    onActive,
    onZoomIn,
    onZoomOut,
    onRotateRight,
    onRotateLeft,
    onFlipX,
    onFlipY,
    onClose,
    onReset,
    zIndex: restProps.zIndex !== void 0 ? restProps.zIndex + 1 : void 0,
    image
  }));
};
var COMMON_PROPS = ["crossOrigin", "decoding", "draggable", "loading", "referrerPolicy", "sizes", "srcSet", "useMap", "alt"];
function usePreviewItems(items) {
  var _React$useState = reactExports.useState({}), _React$useState2 = _slicedToArray(_React$useState, 2), images = _React$useState2[0], setImages = _React$useState2[1];
  var registerImage = reactExports.useCallback(function(id, data) {
    setImages(function(imgs) {
      return _objectSpread2(_objectSpread2({}, imgs), {}, _defineProperty({}, id, data));
    });
    return function() {
      setImages(function(imgs) {
        var cloneImgs = _objectSpread2({}, imgs);
        delete cloneImgs[id];
        return cloneImgs;
      });
    };
  }, []);
  var mergedItems = reactExports.useMemo(function() {
    if (items) {
      return items.map(function(item) {
        if (typeof item === "string") {
          return {
            data: {
              src: item
            }
          };
        }
        var data = {};
        Object.keys(item).forEach(function(key) {
          if (["src"].concat(_toConsumableArray(COMMON_PROPS)).includes(key)) {
            data[key] = item[key];
          }
        });
        return {
          data
        };
      });
    }
    return Object.keys(images).reduce(function(total, id) {
      var _images$id = images[id], canPreview = _images$id.canPreview, data = _images$id.data;
      if (canPreview) {
        total.push({
          data,
          id
        });
      }
      return total;
    }, []);
  }, [items, images]);
  return [mergedItems, registerImage, !!items];
}
var _excluded$1 = ["visible", "onVisibleChange", "getContainer", "current", "movable", "minScale", "maxScale", "countRender", "closeIcon", "onChange", "onTransform", "toolbarRender", "imageRender"], _excluded2$1 = ["src"];
var Group = function Group2(_ref) {
  var _mergedItems$current;
  var _ref$previewPrefixCls = _ref.previewPrefixCls, previewPrefixCls = _ref$previewPrefixCls === void 0 ? "rc-image-preview" : _ref$previewPrefixCls, children = _ref.children, _ref$icons = _ref.icons, icons2 = _ref$icons === void 0 ? {} : _ref$icons, items = _ref.items, preview = _ref.preview, fallback = _ref.fallback;
  var _ref2 = _typeof(preview) === "object" ? preview : {}, previewVisible = _ref2.visible, onVisibleChange = _ref2.onVisibleChange, getContainer = _ref2.getContainer, currentIndex = _ref2.current, movable = _ref2.movable, minScale = _ref2.minScale, maxScale = _ref2.maxScale, countRender = _ref2.countRender, closeIcon = _ref2.closeIcon, onChange = _ref2.onChange, onTransform = _ref2.onTransform, toolbarRender = _ref2.toolbarRender, imageRender = _ref2.imageRender, dialogProps = _objectWithoutProperties(_ref2, _excluded$1);
  var _usePreviewItems = usePreviewItems(items), _usePreviewItems2 = _slicedToArray(_usePreviewItems, 3), mergedItems = _usePreviewItems2[0], register = _usePreviewItems2[1], fromItems = _usePreviewItems2[2];
  var _useMergedState = useMergedState(0, {
    value: currentIndex
  }), _useMergedState2 = _slicedToArray(_useMergedState, 2), current = _useMergedState2[0], setCurrent = _useMergedState2[1];
  var _useState = reactExports.useState(false), _useState2 = _slicedToArray(_useState, 2), keepOpenIndex = _useState2[0], setKeepOpenIndex = _useState2[1];
  var _ref3 = ((_mergedItems$current = mergedItems[current]) === null || _mergedItems$current === void 0 ? void 0 : _mergedItems$current.data) || {}, src = _ref3.src, imgCommonProps = _objectWithoutProperties(_ref3, _excluded2$1);
  var _useMergedState3 = useMergedState(!!previewVisible, {
    value: previewVisible,
    onChange: function onChange2(val, prevVal) {
      onVisibleChange === null || onVisibleChange === void 0 || onVisibleChange(val, prevVal, current);
    }
  }), _useMergedState4 = _slicedToArray(_useMergedState3, 2), isShowPreview = _useMergedState4[0], setShowPreview = _useMergedState4[1];
  var _useState3 = reactExports.useState(null), _useState4 = _slicedToArray(_useState3, 2), mousePosition = _useState4[0], setMousePosition = _useState4[1];
  var onPreviewFromImage = reactExports.useCallback(function(id, imageSrc, mouseX, mouseY) {
    var index = fromItems ? mergedItems.findIndex(function(item) {
      return item.data.src === imageSrc;
    }) : mergedItems.findIndex(function(item) {
      return item.id === id;
    });
    setCurrent(index < 0 ? 0 : index);
    setShowPreview(true);
    setMousePosition({
      x: mouseX,
      y: mouseY
    });
    setKeepOpenIndex(true);
  }, [mergedItems, fromItems]);
  reactExports.useEffect(function() {
    if (isShowPreview) {
      if (!keepOpenIndex) {
        setCurrent(0);
      }
    } else {
      setKeepOpenIndex(false);
    }
  }, [isShowPreview]);
  var onInternalChange = function onInternalChange2(next, prev) {
    setCurrent(next);
    onChange === null || onChange === void 0 || onChange(next, prev);
  };
  var onPreviewClose = function onPreviewClose2() {
    setShowPreview(false);
    setMousePosition(null);
  };
  var previewGroupContext = reactExports.useMemo(function() {
    return {
      register,
      onPreview: onPreviewFromImage
    };
  }, [register, onPreviewFromImage]);
  return /* @__PURE__ */ reactExports.createElement(PreviewGroupContext.Provider, {
    value: previewGroupContext
  }, children, /* @__PURE__ */ reactExports.createElement(Preview, _extends({
    "aria-hidden": !isShowPreview,
    movable,
    visible: isShowPreview,
    prefixCls: previewPrefixCls,
    closeIcon,
    onClose: onPreviewClose,
    mousePosition,
    imgCommonProps,
    src,
    fallback,
    icons: icons2,
    minScale,
    maxScale,
    getContainer,
    current,
    count: mergedItems.length,
    countRender,
    onTransform,
    toolbarRender,
    imageRender,
    onChange: onInternalChange
  }, dialogProps)));
};
var uid = 0;
function useRegisterImage(canPreview, data) {
  var _React$useState = reactExports.useState(function() {
    uid += 1;
    return String(uid);
  }), _React$useState2 = _slicedToArray(_React$useState, 1), id = _React$useState2[0];
  var groupContext = reactExports.useContext(PreviewGroupContext);
  var registerData = {
    data,
    canPreview
  };
  reactExports.useEffect(function() {
    if (groupContext) {
      return groupContext.register(id, registerData);
    }
  }, []);
  reactExports.useEffect(function() {
    if (groupContext) {
      groupContext.register(id, registerData);
    }
  }, [canPreview, data]);
  return id;
}
var _excluded = ["src", "alt", "onPreviewClose", "prefixCls", "previewPrefixCls", "placeholder", "fallback", "width", "height", "style", "preview", "className", "onClick", "onError", "wrapperClassName", "wrapperStyle", "rootClassName"], _excluded2 = ["src", "visible", "onVisibleChange", "getContainer", "mask", "maskClassName", "movable", "icons", "scaleStep", "minScale", "maxScale", "imageRender", "toolbarRender"];
var ImageInternal = function ImageInternal2(props) {
  var imgSrc = props.src, alt = props.alt, onInitialPreviewClose = props.onPreviewClose, _props$prefixCls = props.prefixCls, prefixCls = _props$prefixCls === void 0 ? "rc-image" : _props$prefixCls, _props$previewPrefixC = props.previewPrefixCls, previewPrefixCls = _props$previewPrefixC === void 0 ? "".concat(prefixCls, "-preview") : _props$previewPrefixC, placeholder = props.placeholder, fallback = props.fallback, width = props.width, height = props.height, style = props.style, _props$preview = props.preview, preview = _props$preview === void 0 ? true : _props$preview, className = props.className, onClick = props.onClick, onError = props.onError, wrapperClassName = props.wrapperClassName, wrapperStyle = props.wrapperStyle, rootClassName = props.rootClassName, otherProps = _objectWithoutProperties(props, _excluded);
  var isCustomPlaceholder = placeholder && placeholder !== true;
  var _ref = _typeof(preview) === "object" ? preview : {}, previewSrc = _ref.src, _ref$visible = _ref.visible, previewVisible = _ref$visible === void 0 ? void 0 : _ref$visible, _ref$onVisibleChange = _ref.onVisibleChange, onPreviewVisibleChange = _ref$onVisibleChange === void 0 ? onInitialPreviewClose : _ref$onVisibleChange, _ref$getContainer = _ref.getContainer, getPreviewContainer = _ref$getContainer === void 0 ? void 0 : _ref$getContainer, previewMask = _ref.mask, maskClassName = _ref.maskClassName, movable = _ref.movable, icons2 = _ref.icons, scaleStep = _ref.scaleStep, minScale = _ref.minScale, maxScale = _ref.maxScale, imageRender = _ref.imageRender, toolbarRender = _ref.toolbarRender, dialogProps = _objectWithoutProperties(_ref, _excluded2);
  var src = previewSrc !== null && previewSrc !== void 0 ? previewSrc : imgSrc;
  var _useMergedState = useMergedState(!!previewVisible, {
    value: previewVisible,
    onChange: onPreviewVisibleChange
  }), _useMergedState2 = _slicedToArray(_useMergedState, 2), isShowPreview = _useMergedState2[0], setShowPreview = _useMergedState2[1];
  var _useStatus = useStatus({
    src: imgSrc,
    isCustomPlaceholder,
    fallback
  }), _useStatus2 = _slicedToArray(_useStatus, 3), getImgRef = _useStatus2[0], srcAndOnload = _useStatus2[1], status = _useStatus2[2];
  var _useState = reactExports.useState(null), _useState2 = _slicedToArray(_useState, 2), mousePosition = _useState2[0], setMousePosition = _useState2[1];
  var groupContext = reactExports.useContext(PreviewGroupContext);
  var canPreview = !!preview;
  var onPreviewClose = function onPreviewClose2() {
    setShowPreview(false);
    setMousePosition(null);
  };
  var wrapperClass = classNames(prefixCls, wrapperClassName, rootClassName, _defineProperty({}, "".concat(prefixCls, "-error"), status === "error"));
  var imgCommonProps = reactExports.useMemo(function() {
    var obj = {};
    COMMON_PROPS.forEach(function(prop) {
      if (props[prop] !== void 0) {
        obj[prop] = props[prop];
      }
    });
    return obj;
  }, COMMON_PROPS.map(function(prop) {
    return props[prop];
  }));
  var registerData = reactExports.useMemo(function() {
    return _objectSpread2(_objectSpread2({}, imgCommonProps), {}, {
      src
    });
  }, [src, imgCommonProps]);
  var imageId = useRegisterImage(canPreview, registerData);
  var onPreview = function onPreview2(e) {
    var _getOffset = getOffset(e.target), left = _getOffset.left, top = _getOffset.top;
    if (groupContext) {
      groupContext.onPreview(imageId, src, left, top);
    } else {
      setMousePosition({
        x: left,
        y: top
      });
      setShowPreview(true);
    }
    onClick === null || onClick === void 0 || onClick(e);
  };
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement("div", _extends({}, otherProps, {
    className: wrapperClass,
    onClick: canPreview ? onPreview : onClick,
    style: _objectSpread2({
      width,
      height
    }, wrapperStyle)
  }), /* @__PURE__ */ reactExports.createElement("img", _extends({}, imgCommonProps, {
    className: classNames("".concat(prefixCls, "-img"), _defineProperty({}, "".concat(prefixCls, "-img-placeholder"), placeholder === true), className),
    style: _objectSpread2({
      height
    }, style),
    ref: getImgRef
  }, srcAndOnload, {
    width,
    height,
    onError
  })), status === "loading" && /* @__PURE__ */ reactExports.createElement("div", {
    "aria-hidden": "true",
    className: "".concat(prefixCls, "-placeholder")
  }, placeholder), previewMask && canPreview && /* @__PURE__ */ reactExports.createElement("div", {
    className: classNames("".concat(prefixCls, "-mask"), maskClassName),
    style: {
      display: (style === null || style === void 0 ? void 0 : style.display) === "none" ? "none" : void 0
    }
  }, previewMask)), !groupContext && canPreview && /* @__PURE__ */ reactExports.createElement(Preview, _extends({
    "aria-hidden": !isShowPreview,
    visible: isShowPreview,
    prefixCls: previewPrefixCls,
    onClose: onPreviewClose,
    mousePosition,
    src,
    alt,
    imageInfo: {
      width,
      height
    },
    fallback,
    getContainer: getPreviewContainer,
    icons: icons2,
    movable,
    scaleStep,
    minScale,
    maxScale,
    rootClassName,
    imageRender,
    imgCommonProps,
    toolbarRender
  }, dialogProps)));
};
ImageInternal.PreviewGroup = Group;
var RotateLeftOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M672 418H144c-17.7 0-32 14.3-32 32v414c0 17.7 14.3 32 32 32h528c17.7 0 32-14.3 32-32V450c0-17.7-14.3-32-32-32zm-44 402H188V494h440v326z" } }, { "tag": "path", "attrs": { "d": "M819.3 328.5c-78.8-100.7-196-153.6-314.6-154.2l-.2-64c0-6.5-7.6-10.1-12.6-6.1l-128 101c-4 3.1-3.9 9.1 0 12.3L492 318.6c5.1 4 12.7.4 12.6-6.1v-63.9c12.9.1 25.9.9 38.8 2.5 42.1 5.2 82.1 18.2 119 38.7 38.1 21.2 71.2 49.7 98.4 84.3 27.1 34.7 46.7 73.7 58.1 115.8a325.95 325.95 0 016.5 140.9h74.9c14.8-103.6-11.3-213-81-302.3z" } }] }, "name": "rotate-left", "theme": "outlined" };
var RotateLeftOutlined = function RotateLeftOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: RotateLeftOutlined$1
  }));
};
var RefIcon$a = /* @__PURE__ */ reactExports.forwardRef(RotateLeftOutlined);
var RotateRightOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M480.5 251.2c13-1.6 25.9-2.4 38.8-2.5v63.9c0 6.5 7.5 10.1 12.6 6.1L660 217.6c4-3.2 4-9.2 0-12.3l-128-101c-5.1-4-12.6-.4-12.6 6.1l-.2 64c-118.6.5-235.8 53.4-314.6 154.2A399.75 399.75 0 00123.5 631h74.9c-.9-5.3-1.7-10.7-2.4-16.1-5.1-42.1-2.1-84.1 8.9-124.8 11.4-42.2 31-81.1 58.1-115.8 27.2-34.7 60.3-63.2 98.4-84.3 37-20.6 76.9-33.6 119.1-38.8z" } }, { "tag": "path", "attrs": { "d": "M880 418H352c-17.7 0-32 14.3-32 32v414c0 17.7 14.3 32 32 32h528c17.7 0 32-14.3 32-32V450c0-17.7-14.3-32-32-32zm-44 402H396V494h440v326z" } }] }, "name": "rotate-right", "theme": "outlined" };
var RotateRightOutlined = function RotateRightOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: RotateRightOutlined$1
  }));
};
var RefIcon$9 = /* @__PURE__ */ reactExports.forwardRef(RotateRightOutlined);
var SwapOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M847.9 592H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h605.2L612.9 851c-4.1 5.2-.4 13 6.3 13h72.5c4.9 0 9.5-2.2 12.6-6.1l168.8-214.1c16.5-21 1.6-51.8-25.2-51.8zM872 356H266.8l144.3-183c4.1-5.2.4-13-6.3-13h-72.5c-4.9 0-9.5 2.2-12.6 6.1L150.9 380.2c-16.5 21-1.6 51.8 25.1 51.8h696c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" } }] }, "name": "swap", "theme": "outlined" };
var SwapOutlined = function SwapOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: SwapOutlined$1
  }));
};
var RefIcon$8 = /* @__PURE__ */ reactExports.forwardRef(SwapOutlined);
var ZoomInOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M637 443H519V309c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v134H325c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h118v134c0 4.4 3.6 8 8 8h60c4.4 0 8-3.6 8-8V519h118c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8zm284 424L775 721c122.1-148.9 113.6-369.5-26-509-148-148.1-388.4-148.1-537 0-148.1 148.6-148.1 389 0 537 139.5 139.6 360.1 148.1 509 26l146 146c3.2 2.8 8.3 2.8 11 0l43-43c2.8-2.7 2.8-7.8 0-11zM696 696c-118.8 118.7-311.2 118.7-430 0-118.7-118.8-118.7-311.2 0-430 118.8-118.7 311.2-118.7 430 0 118.7 118.8 118.7 311.2 0 430z" } }] }, "name": "zoom-in", "theme": "outlined" };
var ZoomInOutlined = function ZoomInOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: ZoomInOutlined$1
  }));
};
var RefIcon$7 = /* @__PURE__ */ reactExports.forwardRef(ZoomInOutlined);
var ZoomOutOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M637 443H325c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h312c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8zm284 424L775 721c122.1-148.9 113.6-369.5-26-509-148-148.1-388.4-148.1-537 0-148.1 148.6-148.1 389 0 537 139.5 139.6 360.1 148.1 509 26l146 146c3.2 2.8 8.3 2.8 11 0l43-43c2.8-2.7 2.8-7.8 0-11zM696 696c-118.8 118.7-311.2 118.7-430 0-118.7-118.8-118.7-311.2 0-430 118.8-118.7 311.2-118.7 430 0 118.7 118.8 118.7 311.2 0 430z" } }] }, "name": "zoom-out", "theme": "outlined" };
var ZoomOutOutlined = function ZoomOutOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: ZoomOutOutlined$1
  }));
};
var RefIcon$6 = /* @__PURE__ */ reactExports.forwardRef(ZoomOutOutlined);
const genBoxStyle = (position) => ({
  position: position || "absolute",
  inset: 0
});
const genImageMaskStyle = (token) => {
  const {
    iconCls,
    motionDurationSlow,
    paddingXXS,
    marginXXS,
    prefixCls,
    colorTextLightSolid
  } = token;
  return {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colorTextLightSolid,
    background: new FastColor("#000").setA(0.5).toRgbString(),
    cursor: "pointer",
    opacity: 0,
    transition: `opacity ${motionDurationSlow}`,
    [`.${prefixCls}-mask-info`]: Object.assign(Object.assign({}, textEllipsis), {
      padding: `0 ${unit(paddingXXS)}`,
      [iconCls]: {
        marginInlineEnd: marginXXS,
        svg: {
          verticalAlign: "baseline"
        }
      }
    })
  };
};
const genPreviewOperationsStyle = (token) => {
  const {
    previewCls,
    modalMaskBg,
    paddingSM,
    marginXL,
    margin,
    paddingLG,
    previewOperationColorDisabled,
    previewOperationHoverColor,
    motionDurationSlow,
    iconCls,
    colorTextLightSolid
  } = token;
  const operationBg = new FastColor(modalMaskBg).setA(0.1);
  const operationBgHover = operationBg.clone().setA(0.2);
  return {
    [`${previewCls}-footer`]: {
      position: "fixed",
      bottom: marginXL,
      left: {
        _skip_check_: true,
        value: "50%"
      },
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      color: token.previewOperationColor,
      transform: "translateX(-50%)"
    },
    [`${previewCls}-progress`]: {
      marginBottom: margin
    },
    [`${previewCls}-close`]: {
      position: "fixed",
      top: marginXL,
      right: {
        _skip_check_: true,
        value: marginXL
      },
      display: "flex",
      color: colorTextLightSolid,
      backgroundColor: operationBg.toRgbString(),
      borderRadius: "50%",
      padding: paddingSM,
      outline: 0,
      border: 0,
      cursor: "pointer",
      transition: `all ${motionDurationSlow}`,
      "&:hover": {
        backgroundColor: operationBgHover.toRgbString()
      },
      [`& > ${iconCls}`]: {
        fontSize: token.previewOperationSize
      }
    },
    [`${previewCls}-operations`]: {
      display: "flex",
      alignItems: "center",
      padding: `0 ${unit(paddingLG)}`,
      backgroundColor: operationBg.toRgbString(),
      borderRadius: 100,
      "&-operation": {
        marginInlineStart: paddingSM,
        padding: paddingSM,
        cursor: "pointer",
        transition: `all ${motionDurationSlow}`,
        userSelect: "none",
        [`&:not(${previewCls}-operations-operation-disabled):hover > ${iconCls}`]: {
          color: previewOperationHoverColor
        },
        "&-disabled": {
          color: previewOperationColorDisabled,
          cursor: "not-allowed"
        },
        "&:first-of-type": {
          marginInlineStart: 0
        },
        [`& > ${iconCls}`]: {
          fontSize: token.previewOperationSize
        }
      }
    }
  };
};
const genPreviewSwitchStyle = (token) => {
  const {
    modalMaskBg,
    iconCls,
    previewOperationColorDisabled,
    previewCls,
    zIndexPopup,
    motionDurationSlow
  } = token;
  const operationBg = new FastColor(modalMaskBg).setA(0.1);
  const operationBgHover = operationBg.clone().setA(0.2);
  return {
    [`${previewCls}-switch-left, ${previewCls}-switch-right`]: {
      position: "fixed",
      insetBlockStart: "50%",
      zIndex: token.calc(zIndexPopup).add(1).equal(),
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: token.imagePreviewSwitchSize,
      height: token.imagePreviewSwitchSize,
      marginTop: token.calc(token.imagePreviewSwitchSize).mul(-1).div(2).equal(),
      color: token.previewOperationColor,
      background: operationBg.toRgbString(),
      borderRadius: "50%",
      transform: `translateY(-50%)`,
      cursor: "pointer",
      transition: `all ${motionDurationSlow}`,
      userSelect: "none",
      "&:hover": {
        background: operationBgHover.toRgbString()
      },
      "&-disabled": {
        "&, &:hover": {
          color: previewOperationColorDisabled,
          background: "transparent",
          cursor: "not-allowed",
          [`> ${iconCls}`]: {
            cursor: "not-allowed"
          }
        }
      },
      [`> ${iconCls}`]: {
        fontSize: token.previewOperationSize
      }
    },
    [`${previewCls}-switch-left`]: {
      insetInlineStart: token.marginSM
    },
    [`${previewCls}-switch-right`]: {
      insetInlineEnd: token.marginSM
    }
  };
};
const genImagePreviewStyle = (token) => {
  const {
    motionEaseOut,
    previewCls,
    motionDurationSlow,
    componentCls
  } = token;
  return [
    {
      [`${componentCls}-preview-root`]: {
        [previewCls]: {
          height: "100%",
          textAlign: "center",
          pointerEvents: "none"
        },
        [`${previewCls}-body`]: Object.assign(Object.assign({}, genBoxStyle()), {
          overflow: "hidden"
        }),
        [`${previewCls}-img`]: {
          maxWidth: "100%",
          maxHeight: "70%",
          verticalAlign: "middle",
          transform: "scale3d(1, 1, 1)",
          cursor: "grab",
          transition: `transform ${motionDurationSlow} ${motionEaseOut} 0s`,
          userSelect: "none",
          "&-wrapper": Object.assign(Object.assign({}, genBoxStyle()), {
            transition: `transform ${motionDurationSlow} ${motionEaseOut} 0s`,
            // https://github.com/ant-design/ant-design/issues/39913
            // TailwindCSS will reset img default style.
            // Let's set back.
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            "& > *": {
              pointerEvents: "auto"
            },
            "&::before": {
              display: "inline-block",
              width: 1,
              height: "50%",
              marginInlineEnd: -1,
              content: '""'
            }
          })
        },
        [`${previewCls}-moving`]: {
          [`${previewCls}-preview-img`]: {
            cursor: "grabbing",
            "&-wrapper": {
              transitionDuration: "0s"
            }
          }
        }
      }
    },
    // Override
    {
      [`${componentCls}-preview-root`]: {
        [`${previewCls}-wrap`]: {
          zIndex: token.zIndexPopup
        }
      }
    },
    // Preview operations & switch
    {
      [`${componentCls}-preview-operations-wrapper`]: {
        position: "fixed",
        zIndex: token.calc(token.zIndexPopup).add(1).equal()
      },
      "&": [genPreviewOperationsStyle(token), genPreviewSwitchStyle(token)]
    }
  ];
};
const genImageStyle = (token) => {
  const {
    componentCls
  } = token;
  return {
    // ============================== image ==============================
    [componentCls]: {
      position: "relative",
      display: "inline-block",
      [`${componentCls}-img`]: {
        width: "100%",
        height: "auto",
        verticalAlign: "middle"
      },
      [`${componentCls}-img-placeholder`]: {
        backgroundColor: token.colorBgContainerDisabled,
        backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTQuNSAyLjVoLTEzQS41LjUgMCAwIDAgMSAzdjEwYS41LjUgMCAwIDAgLjUuNWgxM2EuNS41IDAgMCAwIC41LS41VjNhLjUuNSAwIDAgMC0uNS0uNXpNNS4yODEgNC43NWExIDEgMCAwIDEgMCAyIDEgMSAwIDAgMSAwLTJ6bTguMDMgNi44M2EuMTI3LjEyNyAwIDAgMS0uMDgxLjAzSDIuNzY5YS4xMjUuMTI1IDAgMCAxLS4wOTYtLjIwN2wyLjY2MS0zLjE1NmEuMTI2LjEyNiAwIDAgMSAuMTc3LS4wMTZsLjAxNi4wMTZMNy4wOCAxMC4wOWwyLjQ3LTIuOTNhLjEyNi4xMjYgMCAwIDEgLjE3Ny0uMDE2bC4wMTUuMDE2IDMuNTg4IDQuMjQ0YS4xMjcuMTI3IDAgMCAxLS4wMi4xNzV6IiBmaWxsPSIjOEM4QzhDIiBmaWxsLXJ1bGU9Im5vbnplcm8iLz48L3N2Zz4=')",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
        backgroundSize: "30%"
      },
      [`${componentCls}-mask`]: Object.assign({}, genImageMaskStyle(token)),
      [`${componentCls}-mask:hover`]: {
        opacity: 1
      },
      [`${componentCls}-placeholder`]: Object.assign({}, genBoxStyle())
    }
  };
};
const genPreviewMotion = (token) => {
  const {
    previewCls
  } = token;
  return {
    [`${previewCls}-root`]: initZoomMotion(token, "zoom"),
    "&": initFadeMotion(token, true)
  };
};
const prepareComponentToken = (token) => ({
  zIndexPopup: token.zIndexPopupBase + 80,
  previewOperationColor: new FastColor(token.colorTextLightSolid).setA(0.65).toRgbString(),
  previewOperationHoverColor: new FastColor(token.colorTextLightSolid).setA(0.85).toRgbString(),
  previewOperationColorDisabled: new FastColor(token.colorTextLightSolid).setA(0.25).toRgbString(),
  previewOperationSize: token.fontSizeIcon * 1.5
  // FIXME: fontSizeIconLG
});
const useStyle = genStyleHooks("Image", (token) => {
  const previewCls = `${token.componentCls}-preview`;
  const imageToken = merge(token, {
    previewCls,
    modalMaskBg: new FastColor("#000").setA(0.45).toRgbString(),
    // FIXME: Shared Token
    imagePreviewSwitchSize: token.controlHeightLG
  });
  return [genImageStyle(imageToken), genImagePreviewStyle(imageToken), genModalMaskStyle(merge(imageToken, {
    componentCls: previewCls
  })), genPreviewMotion(imageToken)];
}, prepareComponentToken);
var __rest$1 = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const icons = {
  rotateLeft: /* @__PURE__ */ reactExports.createElement(RefIcon$a, null),
  rotateRight: /* @__PURE__ */ reactExports.createElement(RefIcon$9, null),
  zoomIn: /* @__PURE__ */ reactExports.createElement(RefIcon$7, null),
  zoomOut: /* @__PURE__ */ reactExports.createElement(RefIcon$6, null),
  close: /* @__PURE__ */ reactExports.createElement(RefIcon$f, null),
  left: /* @__PURE__ */ reactExports.createElement(RefIcon$h, null),
  right: /* @__PURE__ */ reactExports.createElement(RefIcon$g, null),
  flipX: /* @__PURE__ */ reactExports.createElement(RefIcon$8, null),
  flipY: /* @__PURE__ */ reactExports.createElement(RefIcon$8, {
    rotate: 90
  })
};
const InternalPreviewGroup = (_a) => {
  var {
    previewPrefixCls: customizePrefixCls,
    preview
  } = _a, otherProps = __rest$1(_a, ["previewPrefixCls", "preview"]);
  const {
    getPrefixCls,
    direction
  } = reactExports.useContext(ConfigContext);
  const prefixCls = getPrefixCls("image", customizePrefixCls);
  const previewPrefixCls = `${prefixCls}-preview`;
  const rootPrefixCls = getPrefixCls();
  const rootCls = useCSSVarCls(prefixCls);
  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls, rootCls);
  const [zIndex] = useZIndex("ImagePreview", typeof preview === "object" ? preview.zIndex : void 0);
  const memoizedIcons = reactExports.useMemo(() => Object.assign(Object.assign({}, icons), {
    left: direction === "rtl" ? /* @__PURE__ */ reactExports.createElement(RefIcon$g, null) : /* @__PURE__ */ reactExports.createElement(RefIcon$h, null),
    right: direction === "rtl" ? /* @__PURE__ */ reactExports.createElement(RefIcon$h, null) : /* @__PURE__ */ reactExports.createElement(RefIcon$g, null)
  }), [direction]);
  const mergedPreview = reactExports.useMemo(() => {
    var _a2;
    if (preview === false) {
      return preview;
    }
    const _preview = typeof preview === "object" ? preview : {};
    const mergedRootClassName = classNames(hashId, cssVarCls, rootCls, (_a2 = _preview.rootClassName) !== null && _a2 !== void 0 ? _a2 : "");
    return Object.assign(Object.assign({}, _preview), {
      transitionName: getTransitionName(rootPrefixCls, "zoom", _preview.transitionName),
      maskTransitionName: getTransitionName(rootPrefixCls, "fade", _preview.maskTransitionName),
      rootClassName: mergedRootClassName,
      zIndex
    });
  }, [preview, rootPrefixCls, zIndex, hashId, cssVarCls, rootCls]);
  return wrapCSSVar(/* @__PURE__ */ reactExports.createElement(ImageInternal.PreviewGroup, Object.assign({
    preview: mergedPreview,
    previewPrefixCls,
    icons: memoizedIcons
  }, otherProps)));
};
var __rest = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const Image = (props) => {
  const {
    prefixCls: customizePrefixCls,
    preview,
    className,
    rootClassName,
    style,
    fallback
  } = props, otherProps = __rest(props, ["prefixCls", "preview", "className", "rootClassName", "style", "fallback"]);
  const {
    getPrefixCls,
    getPopupContainer: getContextPopupContainer,
    className: contextClassName,
    style: contextStyle,
    preview: contextPreview,
    fallback: contextFallback
  } = useComponentConfig("image");
  const [imageLocale] = useLocale("Image");
  const prefixCls = getPrefixCls("image", customizePrefixCls);
  const rootPrefixCls = getPrefixCls();
  const rootCls = useCSSVarCls(prefixCls);
  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls, rootCls);
  const mergedRootClassName = classNames(rootClassName, hashId, cssVarCls, rootCls);
  const mergedClassName = classNames(className, hashId, contextClassName);
  const [zIndex] = useZIndex("ImagePreview", typeof preview === "object" ? preview.zIndex : void 0);
  const mergedPreview = reactExports.useMemo(() => {
    if (preview === false) {
      return preview;
    }
    const _preview = typeof preview === "object" ? preview : {};
    const {
      getContainer,
      closeIcon,
      rootClassName: rootClassName2,
      destroyOnClose,
      destroyOnHidden
    } = _preview, restPreviewProps = __rest(_preview, ["getContainer", "closeIcon", "rootClassName", "destroyOnClose", "destroyOnHidden"]);
    return Object.assign(Object.assign({
      mask: /* @__PURE__ */ reactExports.createElement("div", {
        className: `${prefixCls}-mask-info`
      }, /* @__PURE__ */ reactExports.createElement(RefIcon$i, null), imageLocale === null || imageLocale === void 0 ? void 0 : imageLocale.preview),
      icons
    }, restPreviewProps), {
      // TODO: In the future, destroyOnClose in rc-image needs to be upgrade to destroyOnHidden
      destroyOnClose: destroyOnHidden !== null && destroyOnHidden !== void 0 ? destroyOnHidden : destroyOnClose,
      rootClassName: classNames(mergedRootClassName, rootClassName2),
      getContainer: getContainer !== null && getContainer !== void 0 ? getContainer : getContextPopupContainer,
      transitionName: getTransitionName(rootPrefixCls, "zoom", _preview.transitionName),
      maskTransitionName: getTransitionName(rootPrefixCls, "fade", _preview.maskTransitionName),
      zIndex,
      closeIcon: closeIcon !== null && closeIcon !== void 0 ? closeIcon : contextPreview === null || contextPreview === void 0 ? void 0 : contextPreview.closeIcon
    });
  }, [preview, imageLocale, contextPreview === null || contextPreview === void 0 ? void 0 : contextPreview.closeIcon]);
  const mergedStyle = Object.assign(Object.assign({}, contextStyle), style);
  const mergedFallback = fallback !== null && fallback !== void 0 ? fallback : contextFallback;
  return wrapCSSVar(/* @__PURE__ */ reactExports.createElement(ImageInternal, Object.assign({
    prefixCls,
    preview: mergedPreview,
    rootClassName: mergedRootClassName,
    className: mergedClassName,
    style: mergedStyle,
    fallback: mergedFallback
  }, otherProps)));
};
Image.PreviewGroup = InternalPreviewGroup;
var HolderOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M300 276.5a56 56 0 1056-97 56 56 0 00-56 97zm0 284a56 56 0 1056-97 56 56 0 00-56 97zM640 228a56 56 0 10112 0 56 56 0 00-112 0zm0 284a56 56 0 10112 0 56 56 0 00-112 0zM300 844.5a56 56 0 1056-97 56 56 0 00-56 97zM640 796a56 56 0 10112 0 56 56 0 00-112 0z" } }] }, "name": "holder", "theme": "outlined" };
var HolderOutlined = function HolderOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: HolderOutlined$1
  }));
};
var RefIcon$5 = /* @__PURE__ */ reactExports.forwardRef(HolderOutlined);
var BulbOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M632 888H392c-4.4 0-8 3.6-8 8v32c0 17.7 14.3 32 32 32h192c17.7 0 32-14.3 32-32v-32c0-4.4-3.6-8-8-8zM512 64c-181.1 0-328 146.9-328 328 0 121.4 66 227.4 164 284.1V792c0 17.7 14.3 32 32 32h264c17.7 0 32-14.3 32-32V676.1c98-56.7 164-162.7 164-284.1 0-181.1-146.9-328-328-328zm127.9 549.8L604 634.6V752H420V634.6l-35.9-20.8C305.4 568.3 256 484.5 256 392c0-141.4 114.6-256 256-256s256 114.6 256 256c0 92.5-49.4 176.3-128.1 221.8z" } }] }, "name": "bulb", "theme": "outlined" };
var BulbOutlined = function BulbOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: BulbOutlined$1
  }));
};
var RefIcon$4 = /* @__PURE__ */ reactExports.forwardRef(BulbOutlined);
var GlobalOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M854.4 800.9c.2-.3.5-.6.7-.9C920.6 722.1 960 621.7 960 512s-39.4-210.1-104.8-288c-.2-.3-.5-.5-.7-.8-1.1-1.3-2.1-2.5-3.2-3.7-.4-.5-.8-.9-1.2-1.4l-4.1-4.7-.1-.1c-1.5-1.7-3.1-3.4-4.6-5.1l-.1-.1c-3.2-3.4-6.4-6.8-9.7-10.1l-.1-.1-4.8-4.8-.3-.3c-1.5-1.5-3-2.9-4.5-4.3-.5-.5-1-1-1.6-1.5-1-1-2-1.9-3-2.8-.3-.3-.7-.6-1-1C736.4 109.2 629.5 64 512 64s-224.4 45.2-304.3 119.2c-.3.3-.7.6-1 1-1 .9-2 1.9-3 2.9-.5.5-1 1-1.6 1.5-1.5 1.4-3 2.9-4.5 4.3l-.3.3-4.8 4.8-.1.1c-3.3 3.3-6.5 6.7-9.7 10.1l-.1.1c-1.6 1.7-3.1 3.4-4.6 5.1l-.1.1c-1.4 1.5-2.8 3.1-4.1 4.7-.4.5-.8.9-1.2 1.4-1.1 1.2-2.1 2.5-3.2 3.7-.2.3-.5.5-.7.8C103.4 301.9 64 402.3 64 512s39.4 210.1 104.8 288c.2.3.5.6.7.9l3.1 3.7c.4.5.8.9 1.2 1.4l4.1 4.7c0 .1.1.1.1.2 1.5 1.7 3 3.4 4.6 5l.1.1c3.2 3.4 6.4 6.8 9.6 10.1l.1.1c1.6 1.6 3.1 3.2 4.7 4.7l.3.3c3.3 3.3 6.7 6.5 10.1 9.6 80.1 74 187 119.2 304.5 119.2s224.4-45.2 304.3-119.2a300 300 0 0010-9.6l.3-.3c1.6-1.6 3.2-3.1 4.7-4.7l.1-.1c3.3-3.3 6.5-6.7 9.6-10.1l.1-.1c1.5-1.7 3.1-3.3 4.6-5 0-.1.1-.1.1-.2 1.4-1.5 2.8-3.1 4.1-4.7.4-.5.8-.9 1.2-1.4a99 99 0 003.3-3.7zm4.1-142.6c-13.8 32.6-32 62.8-54.2 90.2a444.07 444.07 0 00-81.5-55.9c11.6-46.9 18.8-98.4 20.7-152.6H887c-3 40.9-12.6 80.6-28.5 118.3zM887 484H743.5c-1.9-54.2-9.1-105.7-20.7-152.6 29.3-15.6 56.6-34.4 81.5-55.9A373.86 373.86 0 01887 484zM658.3 165.5c39.7 16.8 75.8 40 107.6 69.2a394.72 394.72 0 01-59.4 41.8c-15.7-45-35.8-84.1-59.2-115.4 3.7 1.4 7.4 2.9 11 4.4zm-90.6 700.6c-9.2 7.2-18.4 12.7-27.7 16.4V697a389.1 389.1 0 01115.7 26.2c-8.3 24.6-17.9 47.3-29 67.8-17.4 32.4-37.8 58.3-59 75.1zm59-633.1c11 20.6 20.7 43.3 29 67.8A389.1 389.1 0 01540 327V141.6c9.2 3.7 18.5 9.1 27.7 16.4 21.2 16.7 41.6 42.6 59 75zM540 640.9V540h147.5c-1.6 44.2-7.1 87.1-16.3 127.8l-.3 1.2A445.02 445.02 0 00540 640.9zm0-156.9V383.1c45.8-2.8 89.8-12.5 130.9-28.1l.3 1.2c9.2 40.7 14.7 83.5 16.3 127.8H540zm-56 56v100.9c-45.8 2.8-89.8 12.5-130.9 28.1l-.3-1.2c-9.2-40.7-14.7-83.5-16.3-127.8H484zm-147.5-56c1.6-44.2 7.1-87.1 16.3-127.8l.3-1.2c41.1 15.6 85 25.3 130.9 28.1V484H336.5zM484 697v185.4c-9.2-3.7-18.5-9.1-27.7-16.4-21.2-16.7-41.7-42.7-59.1-75.1-11-20.6-20.7-43.3-29-67.8 37.2-14.6 75.9-23.3 115.8-26.1zm0-370a389.1 389.1 0 01-115.7-26.2c8.3-24.6 17.9-47.3 29-67.8 17.4-32.4 37.8-58.4 59.1-75.1 9.2-7.2 18.4-12.7 27.7-16.4V327zM365.7 165.5c3.7-1.5 7.3-3 11-4.4-23.4 31.3-43.5 70.4-59.2 115.4-21-12-40.9-26-59.4-41.8 31.8-29.2 67.9-52.4 107.6-69.2zM165.5 365.7c13.8-32.6 32-62.8 54.2-90.2 24.9 21.5 52.2 40.3 81.5 55.9-11.6 46.9-18.8 98.4-20.7 152.6H137c3-40.9 12.6-80.6 28.5-118.3zM137 540h143.5c1.9 54.2 9.1 105.7 20.7 152.6a444.07 444.07 0 00-81.5 55.9A373.86 373.86 0 01137 540zm228.7 318.5c-39.7-16.8-75.8-40-107.6-69.2 18.5-15.8 38.4-29.7 59.4-41.8 15.7 45 35.8 84.1 59.2 115.4-3.7-1.4-7.4-2.9-11-4.4zm292.6 0c-3.7 1.5-7.3 3-11 4.4 23.4-31.3 43.5-70.4 59.2-115.4 21 12 40.9 26 59.4 41.8a373.81 373.81 0 01-107.6 69.2z" } }] }, "name": "global", "theme": "outlined" };
var GlobalOutlined = function GlobalOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: GlobalOutlined$1
  }));
};
var RefIcon$3 = /* @__PURE__ */ reactExports.forwardRef(GlobalOutlined);
var PictureOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M928 160H96c-17.7 0-32 14.3-32 32v640c0 17.7 14.3 32 32 32h832c17.7 0 32-14.3 32-32V192c0-17.7-14.3-32-32-32zm-40 632H136v-39.9l138.5-164.3 150.1 178L658.1 489 888 761.6V792zm0-129.8L664.2 396.8c-3.2-3.8-9-3.8-12.2 0L424.6 666.4l-144-170.7c-3.2-3.8-9-3.8-12.2 0L136 652.7V232h752v430.2zM304 456a88 88 0 100-176 88 88 0 000 176zm0-116c15.5 0 28 12.5 28 28s-12.5 28-28 28-28-12.5-28-28 12.5-28 28-28z" } }] }, "name": "picture", "theme": "outlined" };
var PictureOutlined = function PictureOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: PictureOutlined$1
  }));
};
var RefIcon$2 = /* @__PURE__ */ reactExports.forwardRef(PictureOutlined);
var SoundOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M625.9 115c-5.9 0-11.9 1.6-17.4 5.3L254 352H90c-8.8 0-16 7.2-16 16v288c0 8.8 7.2 16 16 16h164l354.5 231.7c5.5 3.6 11.6 5.3 17.4 5.3 16.7 0 32.1-13.3 32.1-32.1V147.1c0-18.8-15.4-32.1-32.1-32.1zM586 803L293.4 611.7l-18-11.7H146V424h129.4l17.9-11.7L586 221v582zm348-327H806c-8.8 0-16 7.2-16 16v40c0 8.8 7.2 16 16 16h128c8.8 0 16-7.2 16-16v-40c0-8.8-7.2-16-16-16zm-41.9 261.8l-110.3-63.7a15.9 15.9 0 00-21.7 5.9l-19.9 34.5c-4.4 7.6-1.8 17.4 5.8 21.8L856.3 800a15.9 15.9 0 0021.7-5.9l19.9-34.5c4.4-7.6 1.7-17.4-5.8-21.8zM760 344a15.9 15.9 0 0021.7 5.9L892 286.2c7.6-4.4 10.2-14.2 5.8-21.8L878 230a15.9 15.9 0 00-21.7-5.9L746 287.8a15.99 15.99 0 00-5.8 21.8L760 344z" } }] }, "name": "sound", "theme": "outlined" };
var SoundOutlined = function SoundOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: SoundOutlined$1
  }));
};
var RefIcon$1 = /* @__PURE__ */ reactExports.forwardRef(SoundOutlined);
var ToolOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M876.6 239.5c-.5-.9-1.2-1.8-2-2.5-5-5-13.1-5-18.1 0L684.2 409.3l-67.9-67.9L788.7 169c.8-.8 1.4-1.6 2-2.5 3.6-6.1 1.6-13.9-4.5-17.5-98.2-58-226.8-44.7-311.3 39.7-67 67-89.2 162-66.5 247.4l-293 293c-3 3-2.8 7.9.3 11l169.7 169.7c3.1 3.1 8.1 3.3 11 .3l292.9-292.9c85.5 22.8 180.5.7 247.6-66.4 84.4-84.5 97.7-213.1 39.7-311.3zM786 499.8c-58.1 58.1-145.3 69.3-214.6 33.6l-8.8 8.8-.1-.1-274 274.1-79.2-79.2 230.1-230.1s0 .1.1.1l52.8-52.8c-35.7-69.3-24.5-156.5 33.6-214.6a184.2 184.2 0 01144-53.5L537 318.9a32.05 32.05 0 000 45.3l124.5 124.5a32.05 32.05 0 0045.3 0l132.8-132.8c3.7 51.8-14.4 104.8-53.6 143.9z" } }] }, "name": "tool", "theme": "outlined" };
var ToolOutlined = function ToolOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: ToolOutlined$1
  }));
};
var RefIcon = /* @__PURE__ */ reactExports.forwardRef(ToolOutlined);
const wrap = "_wrap_ngrj0_1";
const btn = "_btn_ngrj0_8";
const wrapIconOnly = "_wrapIconOnly_ngrj0_14";
const iconBtn = "_iconBtn_ngrj0_18";
const styles = {
  wrap,
  btn,
  wrapIconOnly,
  iconBtn
};
function ArtifactFileActions({
  filePath,
  showBrowserOpen = false,
  iconOnly = false,
  className
}) {
  const [busy, setBusy] = reactExports.useState(null);
  const handleReveal = async () => {
    setBusy("reveal");
    try {
      const result = await window.api.postRevealPath(filePath);
      if (!result.ok) {
        appMessage.warning(result.error);
      }
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "无法打开文件位置");
    } finally {
      setBusy(null);
    }
  };
  const handleOpenInBrowser = async () => {
    setBusy("browser");
    try {
      const result = await window.api.postOpenLocalFile(filePath);
      if (!result.ok) {
        appMessage.warning(result.error);
      }
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "无法在浏览器中打开");
    } finally {
      setBusy(null);
    }
  };
  const revealButton = /* @__PURE__ */ jsxRuntimeExports.jsx(
    Button,
    {
      size: "small",
      type: iconOnly ? "text" : "link",
      className: iconOnly ? styles.iconBtn : styles.btn,
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$j, {}),
      loading: busy === "reveal",
      onClick: () => void handleReveal(),
      "aria-label": "打开文件位置",
      children: iconOnly ? null : "打开文件位置"
    }
  );
  const browserButton = /* @__PURE__ */ jsxRuntimeExports.jsx(
    Button,
    {
      size: "small",
      type: iconOnly ? "text" : "link",
      className: iconOnly ? styles.iconBtn : styles.btn,
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, {}),
      loading: busy === "browser",
      onClick: () => void handleOpenInBrowser(),
      "aria-label": "在浏览器中打开",
      children: iconOnly ? null : "在浏览器中打开"
    }
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: [styles.wrap, iconOnly ? styles.wrapIconOnly : "", className].filter(Boolean).join(" "),
      children: [
        showBrowserOpen ? iconOnly ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "在浏览器中打开", children: browserButton }) : browserButton : null,
        iconOnly ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "打开文件位置", children: revealButton }) : revealButton
      ]
    }
  );
}
export {
  ArtifactFileActions as A,
  Image as I,
  RefIcon as R,
  Alert as a,
  RefIcon$2 as b,
  RefIcon$1 as c,
  RefIcon$4 as d,
  RefIcon$5 as e,
  RefIcon$3 as f,
  addEventListenerWrap as g
};
