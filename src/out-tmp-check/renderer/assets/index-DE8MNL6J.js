import { r as reactExports, j as jsxRuntimeExports } from "./vendor-xyflow-C3K48oRM.js";
import { t as toArray$1, a4 as Select, h as ConfigContext, bw as useZIndex, x as omit, c as classNames, bA as genPurePanel, _ as _slicedToArray, bS as canUseDom, f as _typeof, e as _objectSpread2, b as _objectWithoutProperties, d as _extends, dl as presetPrimaryColors, $ as Tooltip, i as genStyleHooks, m as merge, r as resetComponent, j as unit, c0 as Keyframe, b5 as FastColor, ai as RefIcon, R as RefIcon$1, ah as RefIcon$2, dm as RefIcon$3, dn as postCreateSession, dp as postAgentChat, dq as querySession, B as Button, T as Typography, a8 as Modal, a0 as Space, ao as Drawer, a7 as Form, cp as TypedInputNumber, a9 as Input, ay as RefIcon$6, dr as RefIcon$7, aq as Tag, z as appMessage, ak as Segmented, S as Spin, ap as Empty, aD as RefIcon$8, E as queryLocalMediaUrl, aB as FeaturePageHeader, ad as RefIcon$a, am as RefIcon$b, O as RefIcon$c, al as shellStyles, av as RefIcon$d } from "./index-D2SMd1bE.js";
import { R as RefIcon$4 } from "./PlayCircleOutlined-QtbVtiGy.js";
import { R as RefIcon$5 } from "./ExportOutlined-BiYuV3Uy.js";
import { q as queryFormatAssetSize } from "./agent-assets-CjAU6vps.js";
import { R as RefIcon$9 } from "./FolderOpenOutlined-CpyBDLdr.js";
import { F as FeaturePageShell, a as FeatureScrollBody } from "./FeatureScrollBody-CxFpEk7V.js";
import { F as FeaturePageToolbar } from "./FeaturePageToolbar-CnaQ0apm.js";
const {
  Option: Option$1
} = Select;
function isSelectOptionOrSelectOptGroup(child) {
  return (child === null || child === void 0 ? void 0 : child.type) && (child.type.isSelectOption || child.type.isSelectOptGroup);
}
const AutoComplete$1 = (props, ref) => {
  var _a, _b;
  const {
    prefixCls: customizePrefixCls,
    className,
    popupClassName,
    dropdownClassName,
    children,
    dataSource,
    dropdownStyle,
    dropdownRender,
    popupRender,
    onDropdownVisibleChange,
    onOpenChange,
    styles: styles2,
    classNames: classNames$1
  } = props;
  const childNodes = toArray$1(children);
  const mergedPopupStyle = ((_a = styles2 === null || styles2 === void 0 ? void 0 : styles2.popup) === null || _a === void 0 ? void 0 : _a.root) || dropdownStyle;
  const mergedPopupClassName = ((_b = classNames$1 === null || classNames$1 === void 0 ? void 0 : classNames$1.popup) === null || _b === void 0 ? void 0 : _b.root) || popupClassName || dropdownClassName;
  const mergedPopupRender = popupRender || dropdownRender;
  const mergedOnOpenChange = onOpenChange || onDropdownVisibleChange;
  let customizeInput;
  if (childNodes.length === 1 && /* @__PURE__ */ reactExports.isValidElement(childNodes[0]) && !isSelectOptionOrSelectOptGroup(childNodes[0])) {
    [customizeInput] = childNodes;
  }
  const getInputElement = customizeInput ? () => customizeInput : void 0;
  let optionChildren;
  if (childNodes.length && isSelectOptionOrSelectOptGroup(childNodes[0])) {
    optionChildren = children;
  } else {
    optionChildren = dataSource ? dataSource.map((item2) => {
      if (/* @__PURE__ */ reactExports.isValidElement(item2)) {
        return item2;
      }
      switch (typeof item2) {
        case "string":
          return /* @__PURE__ */ reactExports.createElement(Option$1, {
            key: item2,
            value: item2
          }, item2);
        case "object": {
          const {
            value: optionValue
          } = item2;
          return /* @__PURE__ */ reactExports.createElement(Option$1, {
            key: optionValue,
            value: optionValue
          }, item2.text);
        }
        default:
          return void 0;
      }
    }) : [];
  }
  const {
    getPrefixCls
  } = reactExports.useContext(ConfigContext);
  const prefixCls = getPrefixCls("select", customizePrefixCls);
  const [zIndex] = useZIndex("SelectLike", mergedPopupStyle === null || mergedPopupStyle === void 0 ? void 0 : mergedPopupStyle.zIndex);
  return /* @__PURE__ */ reactExports.createElement(Select, Object.assign({
    ref,
    suffixIcon: null
  }, omit(props, ["dataSource", "dropdownClassName", "popupClassName"]), {
    prefixCls,
    classNames: {
      popup: {
        root: mergedPopupClassName
      },
      root: classNames$1 === null || classNames$1 === void 0 ? void 0 : classNames$1.root
    },
    styles: {
      popup: {
        root: Object.assign(Object.assign({}, mergedPopupStyle), {
          zIndex
        })
      },
      root: styles2 === null || styles2 === void 0 ? void 0 : styles2.root
    },
    className: classNames(`${prefixCls}-auto-complete`, className),
    mode: Select.SECRET_COMBOBOX_MODE_DO_NOT_USE,
    popupRender: mergedPopupRender,
    onOpenChange: mergedOnOpenChange,
    // Internal api
    getInputElement
  }), optionChildren);
};
const RefAutoComplete = /* @__PURE__ */ reactExports.forwardRef(AutoComplete$1);
const {
  Option
} = Select;
const PurePanel = genPurePanel(RefAutoComplete, "dropdownAlign", (props) => omit(props, ["visible"]));
const AutoComplete = RefAutoComplete;
AutoComplete.Option = Option;
AutoComplete._InternalPanelDoNotUseOrYouWillBeFired = PurePanel;
var defaultProps = {
  percent: 0,
  prefixCls: "rc-progress",
  strokeColor: "#2db7f5",
  strokeLinecap: "round",
  strokeWidth: 1,
  trailColor: "#D9D9D9",
  trailWidth: 1,
  gapPosition: "bottom"
};
var useTransitionDuration = function useTransitionDuration2() {
  var pathsRef = reactExports.useRef([]);
  var prevTimeStamp = reactExports.useRef(null);
  reactExports.useEffect(function() {
    var now = Date.now();
    var updated2 = false;
    pathsRef.current.forEach(function(path) {
      if (!path) {
        return;
      }
      updated2 = true;
      var pathStyle = path.style;
      pathStyle.transitionDuration = ".3s, .3s, .3s, .06s";
      if (prevTimeStamp.current && now - prevTimeStamp.current < 100) {
        pathStyle.transitionDuration = "0s, 0s";
      }
    });
    if (updated2) {
      prevTimeStamp.current = Date.now();
    }
  });
  return pathsRef.current;
};
var uuid = 0;
var isBrowserClient = canUseDom();
function getUUID() {
  var retId;
  if (isBrowserClient) {
    retId = uuid;
    uuid += 1;
  } else {
    retId = "TEST_OR_SSR";
  }
  return retId;
}
const useId = (function(id) {
  var _React$useState = reactExports.useState(), _React$useState2 = _slicedToArray(_React$useState, 2), innerId = _React$useState2[0], setInnerId = _React$useState2[1];
  reactExports.useEffect(function() {
    setInnerId("rc_progress_".concat(getUUID()));
  }, []);
  return id || innerId;
});
var Block = function Block2(_ref) {
  var bg = _ref.bg, children = _ref.children;
  return /* @__PURE__ */ reactExports.createElement("div", {
    style: {
      width: "100%",
      height: "100%",
      background: bg
    }
  }, children);
};
function getPtgColors(color, scale) {
  return Object.keys(color).map(function(key) {
    var parsedKey = parseFloat(key);
    var ptgKey = "".concat(Math.floor(parsedKey * scale), "%");
    return "".concat(color[key], " ").concat(ptgKey);
  });
}
var PtgCircle = /* @__PURE__ */ reactExports.forwardRef(function(props, ref) {
  var prefixCls = props.prefixCls, color = props.color, gradientId = props.gradientId, radius = props.radius, circleStyleForStack = props.style, ptg = props.ptg, strokeLinecap = props.strokeLinecap, strokeWidth = props.strokeWidth, size = props.size, gapDegree = props.gapDegree;
  var isGradient = color && _typeof(color) === "object";
  var stroke = isGradient ? "#FFF" : void 0;
  var halfSize = size / 2;
  var circleNode = /* @__PURE__ */ reactExports.createElement("circle", {
    className: "".concat(prefixCls, "-circle-path"),
    r: radius,
    cx: halfSize,
    cy: halfSize,
    stroke,
    strokeLinecap,
    strokeWidth,
    opacity: ptg === 0 ? 0 : 1,
    style: circleStyleForStack,
    ref
  });
  if (!isGradient) {
    return circleNode;
  }
  var maskId = "".concat(gradientId, "-conic");
  var fromDeg = gapDegree ? "".concat(180 + gapDegree / 2, "deg") : "0deg";
  var conicColors = getPtgColors(color, (360 - gapDegree) / 360);
  var linearColors = getPtgColors(color, 1);
  var conicColorBg = "conic-gradient(from ".concat(fromDeg, ", ").concat(conicColors.join(", "), ")");
  var linearColorBg = "linear-gradient(to ".concat(gapDegree ? "bottom" : "top", ", ").concat(linearColors.join(", "), ")");
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement("mask", {
    id: maskId
  }, circleNode), /* @__PURE__ */ reactExports.createElement("foreignObject", {
    x: 0,
    y: 0,
    width: size,
    height: size,
    mask: "url(#".concat(maskId, ")")
  }, /* @__PURE__ */ reactExports.createElement(Block, {
    bg: linearColorBg
  }, /* @__PURE__ */ reactExports.createElement(Block, {
    bg: conicColorBg
  }))));
});
var VIEW_BOX_SIZE = 100;
var getCircleStyle = function getCircleStyle2(perimeter, perimeterWithoutGap, offset, percent, rotateDeg, gapDegree, gapPosition, strokeColor, strokeLinecap, strokeWidth) {
  var stepSpace = arguments.length > 10 && arguments[10] !== void 0 ? arguments[10] : 0;
  var offsetDeg = offset / 100 * 360 * ((360 - gapDegree) / 360);
  var positionDeg = gapDegree === 0 ? 0 : {
    bottom: 0,
    top: 180,
    left: 90,
    right: -90
  }[gapPosition];
  var strokeDashoffset = (100 - percent) / 100 * perimeterWithoutGap;
  if (strokeLinecap === "round" && percent !== 100) {
    strokeDashoffset += strokeWidth / 2;
    if (strokeDashoffset >= perimeterWithoutGap) {
      strokeDashoffset = perimeterWithoutGap - 0.01;
    }
  }
  var halfSize = VIEW_BOX_SIZE / 2;
  return {
    stroke: typeof strokeColor === "string" ? strokeColor : void 0,
    strokeDasharray: "".concat(perimeterWithoutGap, "px ").concat(perimeter),
    strokeDashoffset: strokeDashoffset + stepSpace,
    transform: "rotate(".concat(rotateDeg + offsetDeg + positionDeg, "deg)"),
    transformOrigin: "".concat(halfSize, "px ").concat(halfSize, "px"),
    transition: "stroke-dashoffset .3s ease 0s, stroke-dasharray .3s ease 0s, stroke .3s, stroke-width .06s ease .3s, opacity .3s ease 0s",
    fillOpacity: 0
  };
};
var _excluded = ["id", "prefixCls", "steps", "strokeWidth", "trailWidth", "gapDegree", "gapPosition", "trailColor", "strokeLinecap", "style", "className", "strokeColor", "percent"];
function toArray(value) {
  var mergedValue = value !== null && value !== void 0 ? value : [];
  return Array.isArray(mergedValue) ? mergedValue : [mergedValue];
}
var Circle$1 = function Circle2(props) {
  var _defaultProps$props = _objectSpread2(_objectSpread2({}, defaultProps), props), id = _defaultProps$props.id, prefixCls = _defaultProps$props.prefixCls, steps = _defaultProps$props.steps, strokeWidth = _defaultProps$props.strokeWidth, trailWidth = _defaultProps$props.trailWidth, _defaultProps$props$g = _defaultProps$props.gapDegree, gapDegree = _defaultProps$props$g === void 0 ? 0 : _defaultProps$props$g, gapPosition = _defaultProps$props.gapPosition, trailColor = _defaultProps$props.trailColor, strokeLinecap = _defaultProps$props.strokeLinecap, style = _defaultProps$props.style, className = _defaultProps$props.className, strokeColor = _defaultProps$props.strokeColor, percent = _defaultProps$props.percent, restProps = _objectWithoutProperties(_defaultProps$props, _excluded);
  var halfSize = VIEW_BOX_SIZE / 2;
  var mergedId = useId(id);
  var gradientId = "".concat(mergedId, "-gradient");
  var radius = halfSize - strokeWidth / 2;
  var perimeter = Math.PI * 2 * radius;
  var rotateDeg = gapDegree > 0 ? 90 + gapDegree / 2 : -90;
  var perimeterWithoutGap = perimeter * ((360 - gapDegree) / 360);
  var _ref = _typeof(steps) === "object" ? steps : {
    count: steps,
    gap: 2
  }, stepCount = _ref.count, stepGap = _ref.gap;
  var percentList = toArray(percent);
  var strokeColorList = toArray(strokeColor);
  var gradient = strokeColorList.find(function(color) {
    return color && _typeof(color) === "object";
  });
  var isConicGradient = gradient && _typeof(gradient) === "object";
  var mergedStrokeLinecap = isConicGradient ? "butt" : strokeLinecap;
  var circleStyle = getCircleStyle(perimeter, perimeterWithoutGap, 0, 100, rotateDeg, gapDegree, gapPosition, trailColor, mergedStrokeLinecap, strokeWidth);
  var paths = useTransitionDuration();
  var getStokeList = function getStokeList2() {
    var stackPtg = 0;
    return percentList.map(function(ptg, index) {
      var color = strokeColorList[index] || strokeColorList[strokeColorList.length - 1];
      var circleStyleForStack = getCircleStyle(perimeter, perimeterWithoutGap, stackPtg, ptg, rotateDeg, gapDegree, gapPosition, color, mergedStrokeLinecap, strokeWidth);
      stackPtg += ptg;
      return /* @__PURE__ */ reactExports.createElement(PtgCircle, {
        key: index,
        color,
        ptg,
        radius,
        prefixCls,
        gradientId,
        style: circleStyleForStack,
        strokeLinecap: mergedStrokeLinecap,
        strokeWidth,
        gapDegree,
        ref: function ref(elem) {
          paths[index] = elem;
        },
        size: VIEW_BOX_SIZE
      });
    }).reverse();
  };
  var getStepStokeList = function getStepStokeList2() {
    var current = Math.round(stepCount * (percentList[0] / 100));
    var stepPtg = 100 / stepCount;
    var stackPtg = 0;
    return new Array(stepCount).fill(null).map(function(_, index) {
      var color = index <= current - 1 ? strokeColorList[0] : trailColor;
      var stroke = color && _typeof(color) === "object" ? "url(#".concat(gradientId, ")") : void 0;
      var circleStyleForStack = getCircleStyle(perimeter, perimeterWithoutGap, stackPtg, stepPtg, rotateDeg, gapDegree, gapPosition, color, "butt", strokeWidth, stepGap);
      stackPtg += (perimeterWithoutGap - circleStyleForStack.strokeDashoffset + stepGap) * 100 / perimeterWithoutGap;
      return /* @__PURE__ */ reactExports.createElement("circle", {
        key: index,
        className: "".concat(prefixCls, "-circle-path"),
        r: radius,
        cx: halfSize,
        cy: halfSize,
        stroke,
        strokeWidth,
        opacity: 1,
        style: circleStyleForStack,
        ref: function ref(elem) {
          paths[index] = elem;
        }
      });
    });
  };
  return /* @__PURE__ */ reactExports.createElement("svg", _extends({
    className: classNames("".concat(prefixCls, "-circle"), className),
    viewBox: "0 0 ".concat(VIEW_BOX_SIZE, " ").concat(VIEW_BOX_SIZE),
    style,
    id,
    role: "presentation"
  }, restProps), !stepCount && /* @__PURE__ */ reactExports.createElement("circle", {
    className: "".concat(prefixCls, "-circle-trail"),
    r: radius,
    cx: halfSize,
    cy: halfSize,
    stroke: trailColor,
    strokeLinecap: mergedStrokeLinecap,
    strokeWidth: trailWidth || strokeWidth,
    style: circleStyle
  }), stepCount ? getStepStokeList() : getStokeList());
};
function validProgress(progress2) {
  if (!progress2 || progress2 < 0) {
    return 0;
  }
  if (progress2 > 100) {
    return 100;
  }
  return progress2;
}
function getSuccessPercent({
  success,
  successPercent
}) {
  let percent = successPercent;
  if (success && "progress" in success) {
    percent = success.progress;
  }
  if (success && "percent" in success) {
    percent = success.percent;
  }
  return percent;
}
const getPercentage = ({
  percent,
  success,
  successPercent
}) => {
  const realSuccessPercent = validProgress(getSuccessPercent({
    success,
    successPercent
  }));
  return [realSuccessPercent, validProgress(validProgress(percent) - realSuccessPercent)];
};
const getStrokeColor = ({
  success = {},
  strokeColor
}) => {
  const {
    strokeColor: successColor
  } = success;
  return [successColor || presetPrimaryColors.green, strokeColor || null];
};
const getSize = (size, type, extra) => {
  var _a, _b, _c, _d;
  let width = -1;
  let height = -1;
  if (type === "step") {
    const steps = extra.steps;
    const strokeWidth = extra.strokeWidth;
    if (typeof size === "string" || typeof size === "undefined") {
      width = size === "small" ? 2 : 14;
      height = strokeWidth !== null && strokeWidth !== void 0 ? strokeWidth : 8;
    } else if (typeof size === "number") {
      [width, height] = [size, size];
    } else {
      [width = 14, height = 8] = Array.isArray(size) ? size : [size.width, size.height];
    }
    width *= steps;
  } else if (type === "line") {
    const strokeWidth = extra === null || extra === void 0 ? void 0 : extra.strokeWidth;
    if (typeof size === "string" || typeof size === "undefined") {
      height = strokeWidth || (size === "small" ? 6 : 8);
    } else if (typeof size === "number") {
      [width, height] = [size, size];
    } else {
      [width = -1, height = 8] = Array.isArray(size) ? size : [size.width, size.height];
    }
  } else if (type === "circle" || type === "dashboard") {
    if (typeof size === "string" || typeof size === "undefined") {
      [width, height] = size === "small" ? [60, 60] : [120, 120];
    } else if (typeof size === "number") {
      [width, height] = [size, size];
    } else if (Array.isArray(size)) {
      width = (_b = (_a = size[0]) !== null && _a !== void 0 ? _a : size[1]) !== null && _b !== void 0 ? _b : 120;
      height = (_d = (_c = size[0]) !== null && _c !== void 0 ? _c : size[1]) !== null && _d !== void 0 ? _d : 120;
    }
  }
  return [width, height];
};
const CIRCLE_MIN_STROKE_WIDTH = 3;
const getMinPercent = (width) => CIRCLE_MIN_STROKE_WIDTH / width * 100;
const Circle = (props) => {
  const {
    prefixCls,
    trailColor = null,
    strokeLinecap = "round",
    gapPosition,
    gapDegree,
    width: originWidth = 120,
    type,
    children,
    success,
    size = originWidth,
    steps
  } = props;
  const [width, height] = getSize(size, "circle");
  let {
    strokeWidth
  } = props;
  if (strokeWidth === void 0) {
    strokeWidth = Math.max(getMinPercent(width), 6);
  }
  const circleStyle = {
    width,
    height,
    fontSize: width * 0.15 + 6
  };
  const realGapDegree = reactExports.useMemo(() => {
    if (gapDegree || gapDegree === 0) {
      return gapDegree;
    }
    if (type === "dashboard") {
      return 75;
    }
    return void 0;
  }, [gapDegree, type]);
  const percentArray = getPercentage(props);
  const gapPos = gapPosition || type === "dashboard" && "bottom" || void 0;
  const isGradient = Object.prototype.toString.call(props.strokeColor) === "[object Object]";
  const strokeColor = getStrokeColor({
    success,
    strokeColor: props.strokeColor
  });
  const wrapperClassName = classNames(`${prefixCls}-inner`, {
    [`${prefixCls}-circle-gradient`]: isGradient
  });
  const circleContent = /* @__PURE__ */ reactExports.createElement(Circle$1, {
    steps,
    percent: steps ? percentArray[1] : percentArray,
    strokeWidth,
    trailWidth: strokeWidth,
    strokeColor: steps ? strokeColor[1] : strokeColor,
    strokeLinecap,
    trailColor,
    prefixCls,
    gapDegree: realGapDegree,
    gapPosition: gapPos
  });
  const smallCircle = width <= 20;
  const node = /* @__PURE__ */ reactExports.createElement("div", {
    className: wrapperClassName,
    style: circleStyle
  }, circleContent, !smallCircle && children);
  if (smallCircle) {
    return /* @__PURE__ */ reactExports.createElement(Tooltip, {
      title: children
    }, node);
  }
  return node;
};
const LineStrokeColorVar = "--progress-line-stroke-color";
const Percent = "--progress-percent";
const genAntProgressActive = (isRtl) => {
  const direction = isRtl ? "100%" : "-100%";
  return new Keyframe(`antProgress${isRtl ? "RTL" : "LTR"}Active`, {
    "0%": {
      transform: `translateX(${direction}) scaleX(0)`,
      opacity: 0.1
    },
    "20%": {
      transform: `translateX(${direction}) scaleX(0)`,
      opacity: 0.5
    },
    to: {
      transform: "translateX(0) scaleX(1)",
      opacity: 0
    }
  });
};
const genBaseStyle = (token) => {
  const {
    componentCls: progressCls,
    iconCls: iconPrefixCls
  } = token;
  return {
    [progressCls]: Object.assign(Object.assign({}, resetComponent(token)), {
      display: "inline-block",
      "&-rtl": {
        direction: "rtl"
      },
      "&-line": {
        position: "relative",
        width: "100%",
        fontSize: token.fontSize
      },
      [`${progressCls}-outer`]: {
        display: "inline-flex",
        alignItems: "center",
        width: "100%"
      },
      [`${progressCls}-inner`]: {
        position: "relative",
        display: "inline-block",
        width: "100%",
        flex: 1,
        overflow: "hidden",
        verticalAlign: "middle",
        backgroundColor: token.remainingColor,
        borderRadius: token.lineBorderRadius
      },
      [`${progressCls}-inner:not(${progressCls}-circle-gradient)`]: {
        [`${progressCls}-circle-path`]: {
          stroke: token.defaultColor
        }
      },
      [`${progressCls}-success-bg, ${progressCls}-bg`]: {
        position: "relative",
        background: token.defaultColor,
        borderRadius: token.lineBorderRadius,
        transition: `all ${token.motionDurationSlow} ${token.motionEaseInOutCirc}`
      },
      [`${progressCls}-layout-bottom`]: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        [`${progressCls}-text`]: {
          width: "max-content",
          marginInlineStart: 0,
          marginTop: token.marginXXS
        }
      },
      [`${progressCls}-bg`]: {
        overflow: "hidden",
        "&::after": {
          content: '""',
          background: {
            _multi_value_: true,
            value: ["inherit", `var(${LineStrokeColorVar})`]
          },
          height: "100%",
          width: `calc(1 / var(${Percent}) * 100%)`,
          display: "block"
        },
        [`&${progressCls}-bg-inner`]: {
          minWidth: "max-content",
          "&::after": {
            content: "none"
          },
          [`${progressCls}-text-inner`]: {
            color: token.colorWhite,
            [`&${progressCls}-text-bright`]: {
              color: "rgba(0, 0, 0, 0.45)"
            }
          }
        }
      },
      [`${progressCls}-success-bg`]: {
        position: "absolute",
        insetBlockStart: 0,
        insetInlineStart: 0,
        backgroundColor: token.colorSuccess
      },
      [`${progressCls}-text`]: {
        display: "inline-block",
        marginInlineStart: token.marginXS,
        color: token.colorText,
        lineHeight: 1,
        width: "2em",
        whiteSpace: "nowrap",
        textAlign: "start",
        verticalAlign: "middle",
        wordBreak: "normal",
        [iconPrefixCls]: {
          fontSize: token.fontSize
        },
        [`&${progressCls}-text-outer`]: {
          width: "max-content"
        },
        [`&${progressCls}-text-outer${progressCls}-text-start`]: {
          width: "max-content",
          marginInlineStart: 0,
          marginInlineEnd: token.marginXS
        }
      },
      [`${progressCls}-text-inner`]: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        marginInlineStart: 0,
        padding: `0 ${unit(token.paddingXXS)}`,
        [`&${progressCls}-text-start`]: {
          justifyContent: "start"
        },
        [`&${progressCls}-text-end`]: {
          justifyContent: "end"
        }
      },
      [`&${progressCls}-status-active`]: {
        [`${progressCls}-bg::before`]: {
          position: "absolute",
          inset: 0,
          backgroundColor: token.colorBgContainer,
          borderRadius: token.lineBorderRadius,
          opacity: 0,
          animationName: genAntProgressActive(),
          animationDuration: token.progressActiveMotionDuration,
          animationTimingFunction: token.motionEaseOutQuint,
          animationIterationCount: "infinite",
          content: '""'
        }
      },
      [`&${progressCls}-rtl${progressCls}-status-active`]: {
        [`${progressCls}-bg::before`]: {
          animationName: genAntProgressActive(true)
        }
      },
      [`&${progressCls}-status-exception`]: {
        [`${progressCls}-bg`]: {
          backgroundColor: token.colorError
        },
        [`${progressCls}-text`]: {
          color: token.colorError
        }
      },
      [`&${progressCls}-status-exception ${progressCls}-inner:not(${progressCls}-circle-gradient)`]: {
        [`${progressCls}-circle-path`]: {
          stroke: token.colorError
        }
      },
      [`&${progressCls}-status-success`]: {
        [`${progressCls}-bg`]: {
          backgroundColor: token.colorSuccess
        },
        [`${progressCls}-text`]: {
          color: token.colorSuccess
        }
      },
      [`&${progressCls}-status-success ${progressCls}-inner:not(${progressCls}-circle-gradient)`]: {
        [`${progressCls}-circle-path`]: {
          stroke: token.colorSuccess
        }
      }
    })
  };
};
const genCircleStyle = (token) => {
  const {
    componentCls: progressCls,
    iconCls: iconPrefixCls
  } = token;
  return {
    [progressCls]: {
      [`${progressCls}-circle-trail`]: {
        stroke: token.remainingColor
      },
      [`&${progressCls}-circle ${progressCls}-inner`]: {
        position: "relative",
        lineHeight: 1,
        backgroundColor: "transparent"
      },
      [`&${progressCls}-circle ${progressCls}-text`]: {
        position: "absolute",
        insetBlockStart: "50%",
        insetInlineStart: 0,
        width: "100%",
        margin: 0,
        padding: 0,
        color: token.circleTextColor,
        fontSize: token.circleTextFontSize,
        lineHeight: 1,
        whiteSpace: "normal",
        textAlign: "center",
        transform: "translateY(-50%)",
        [iconPrefixCls]: {
          fontSize: token.circleIconFontSize
        }
      },
      [`${progressCls}-circle&-status-exception`]: {
        [`${progressCls}-text`]: {
          color: token.colorError
        }
      },
      [`${progressCls}-circle&-status-success`]: {
        [`${progressCls}-text`]: {
          color: token.colorSuccess
        }
      }
    },
    [`${progressCls}-inline-circle`]: {
      lineHeight: 1,
      [`${progressCls}-inner`]: {
        verticalAlign: "bottom"
      }
    }
  };
};
const genStepStyle = (token) => {
  const {
    componentCls: progressCls
  } = token;
  return {
    [progressCls]: {
      [`${progressCls}-steps`]: {
        display: "inline-block",
        "&-outer": {
          display: "flex",
          flexDirection: "row",
          alignItems: "center"
        },
        "&-item": {
          flexShrink: 0,
          minWidth: token.progressStepMinWidth,
          marginInlineEnd: token.progressStepMarginInlineEnd,
          backgroundColor: token.remainingColor,
          transition: `all ${token.motionDurationSlow}`,
          "&-active": {
            backgroundColor: token.defaultColor
          }
        }
      }
    }
  };
};
const genSmallLine = (token) => {
  const {
    componentCls: progressCls,
    iconCls: iconPrefixCls
  } = token;
  return {
    [progressCls]: {
      [`${progressCls}-small&-line, ${progressCls}-small&-line ${progressCls}-text ${iconPrefixCls}`]: {
        fontSize: token.fontSizeSM
      }
    }
  };
};
const prepareComponentToken = (token) => ({
  circleTextColor: token.colorText,
  defaultColor: token.colorInfo,
  remainingColor: token.colorFillSecondary,
  lineBorderRadius: 100,
  // magic for capsule shape, should be a very large number
  circleTextFontSize: "1em",
  circleIconFontSize: `${token.fontSize / token.fontSizeSM}em`
});
const useStyle = genStyleHooks("Progress", (token) => {
  const progressStepMarginInlineEnd = token.calc(token.marginXXS).div(2).equal();
  const progressToken = merge(token, {
    progressStepMarginInlineEnd,
    progressStepMinWidth: progressStepMarginInlineEnd,
    progressActiveMotionDuration: "2.4s"
  });
  return [genBaseStyle(progressToken), genCircleStyle(progressToken), genStepStyle(progressToken), genSmallLine(progressToken)];
}, prepareComponentToken);
var __rest$1 = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const sortGradient = (gradients) => {
  let tempArr = [];
  Object.keys(gradients).forEach((key) => {
    const formattedKey = Number.parseFloat(key.replace(/%/g, ""));
    if (!Number.isNaN(formattedKey)) {
      tempArr.push({
        key: formattedKey,
        value: gradients[key]
      });
    }
  });
  tempArr = tempArr.sort((a, b) => a.key - b.key);
  return tempArr.map(({
    key,
    value
  }) => `${value} ${key}%`).join(", ");
};
const handleGradient = (strokeColor, directionConfig) => {
  const {
    from = presetPrimaryColors.blue,
    to = presetPrimaryColors.blue,
    direction = directionConfig === "rtl" ? "to left" : "to right"
  } = strokeColor, rest = __rest$1(strokeColor, ["from", "to", "direction"]);
  if (Object.keys(rest).length !== 0) {
    const sortedGradients = sortGradient(rest);
    const background2 = `linear-gradient(${direction}, ${sortedGradients})`;
    return {
      background: background2,
      [LineStrokeColorVar]: background2
    };
  }
  const background = `linear-gradient(${direction}, ${from}, ${to})`;
  return {
    background,
    [LineStrokeColorVar]: background
  };
};
const Line = (props) => {
  const {
    prefixCls,
    direction: directionConfig,
    percent,
    size,
    strokeWidth,
    strokeColor,
    strokeLinecap = "round",
    children,
    trailColor = null,
    percentPosition,
    success
  } = props;
  const {
    align: infoAlign,
    type: infoPosition
  } = percentPosition;
  const backgroundProps = strokeColor && typeof strokeColor !== "string" ? handleGradient(strokeColor, directionConfig) : {
    [LineStrokeColorVar]: strokeColor,
    background: strokeColor
  };
  const borderRadius = strokeLinecap === "square" || strokeLinecap === "butt" ? 0 : void 0;
  const mergedSize = size !== null && size !== void 0 ? size : [-1, strokeWidth || (size === "small" ? 6 : 8)];
  const [width, height] = getSize(mergedSize, "line", {
    strokeWidth
  });
  const trailStyle = {
    backgroundColor: trailColor || void 0,
    borderRadius
  };
  const percentStyle = Object.assign(Object.assign({
    width: `${validProgress(percent)}%`,
    height,
    borderRadius
  }, backgroundProps), {
    [Percent]: validProgress(percent) / 100
  });
  const successPercent = getSuccessPercent(props);
  const successPercentStyle = {
    width: `${validProgress(successPercent)}%`,
    height,
    borderRadius,
    backgroundColor: success === null || success === void 0 ? void 0 : success.strokeColor
  };
  const outerStyle = {
    width: width < 0 ? "100%" : width
  };
  const lineInner = /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-inner`,
    style: trailStyle
  }, /* @__PURE__ */ reactExports.createElement("div", {
    className: classNames(`${prefixCls}-bg`, `${prefixCls}-bg-${infoPosition}`),
    style: percentStyle
  }, infoPosition === "inner" && children), successPercent !== void 0 && /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-success-bg`,
    style: successPercentStyle
  }));
  const isOuterStart = infoPosition === "outer" && infoAlign === "start";
  const isOuterEnd = infoPosition === "outer" && infoAlign === "end";
  return infoPosition === "outer" && infoAlign === "center" ? /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-layout-bottom`
  }, lineInner, children) : /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-outer`,
    style: outerStyle
  }, isOuterStart && children, lineInner, isOuterEnd && children);
};
const Steps = (props) => {
  const {
    size,
    steps,
    rounding: customRounding = Math.round,
    percent = 0,
    strokeWidth = 8,
    strokeColor,
    trailColor = null,
    prefixCls,
    children
  } = props;
  const current = customRounding(steps * (percent / 100));
  const stepWidth = size === "small" ? 2 : 14;
  const mergedSize = size !== null && size !== void 0 ? size : [stepWidth, strokeWidth];
  const [width, height] = getSize(mergedSize, "step", {
    steps,
    strokeWidth
  });
  const unitWidth = width / steps;
  const styledSteps = Array.from({
    length: steps
  });
  for (let i = 0; i < steps; i++) {
    const color = Array.isArray(strokeColor) ? strokeColor[i] : strokeColor;
    styledSteps[i] = /* @__PURE__ */ reactExports.createElement("div", {
      key: i,
      className: classNames(`${prefixCls}-steps-item`, {
        [`${prefixCls}-steps-item-active`]: i <= current - 1
      }),
      style: {
        backgroundColor: i <= current - 1 ? color : trailColor,
        width: unitWidth,
        height
      }
    });
  }
  return /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-steps-outer`
  }, styledSteps, children);
};
var __rest = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const ProgressStatuses = ["normal", "exception", "active", "success"];
const Progress = /* @__PURE__ */ reactExports.forwardRef((props, ref) => {
  const {
    prefixCls: customizePrefixCls,
    className,
    rootClassName,
    steps,
    strokeColor,
    percent = 0,
    size = "default",
    showInfo = true,
    type = "line",
    status,
    format,
    style,
    percentPosition = {}
  } = props, restProps = __rest(props, ["prefixCls", "className", "rootClassName", "steps", "strokeColor", "percent", "size", "showInfo", "type", "status", "format", "style", "percentPosition"]);
  const {
    align: infoAlign = "end",
    type: infoPosition = "outer"
  } = percentPosition;
  const strokeColorNotArray = Array.isArray(strokeColor) ? strokeColor[0] : strokeColor;
  const strokeColorNotGradient = typeof strokeColor === "string" || Array.isArray(strokeColor) ? strokeColor : void 0;
  const strokeColorIsBright = reactExports.useMemo(() => {
    if (strokeColorNotArray) {
      const color = typeof strokeColorNotArray === "string" ? strokeColorNotArray : Object.values(strokeColorNotArray)[0];
      return new FastColor(color).isLight();
    }
    return false;
  }, [strokeColor]);
  const percentNumber = reactExports.useMemo(() => {
    var _a, _b;
    const successPercent = getSuccessPercent(props);
    return Number.parseInt(successPercent !== void 0 ? (_a = successPercent !== null && successPercent !== void 0 ? successPercent : 0) === null || _a === void 0 ? void 0 : _a.toString() : (_b = percent !== null && percent !== void 0 ? percent : 0) === null || _b === void 0 ? void 0 : _b.toString(), 10);
  }, [percent, props.success, props.successPercent]);
  const progressStatus = reactExports.useMemo(() => {
    if (!ProgressStatuses.includes(status) && percentNumber >= 100) {
      return "success";
    }
    return status || "normal";
  }, [status, percentNumber]);
  const {
    getPrefixCls,
    direction,
    progress: progressStyle
  } = reactExports.useContext(ConfigContext);
  const prefixCls = getPrefixCls("progress", customizePrefixCls);
  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls);
  const isLineType = type === "line";
  const isPureLineType = isLineType && !steps;
  const progressInfo = reactExports.useMemo(() => {
    if (!showInfo) {
      return null;
    }
    const successPercent = getSuccessPercent(props);
    let text;
    const textFormatter = format || ((number) => `${number}%`);
    const isBrightInnerColor = isLineType && strokeColorIsBright && infoPosition === "inner";
    if (infoPosition === "inner" || format || progressStatus !== "exception" && progressStatus !== "success") {
      text = textFormatter(validProgress(percent), validProgress(successPercent));
    } else if (progressStatus === "exception") {
      text = isLineType ? /* @__PURE__ */ reactExports.createElement(RefIcon, null) : /* @__PURE__ */ reactExports.createElement(RefIcon$1, null);
    } else if (progressStatus === "success") {
      text = isLineType ? /* @__PURE__ */ reactExports.createElement(RefIcon$2, null) : /* @__PURE__ */ reactExports.createElement(RefIcon$3, null);
    }
    return /* @__PURE__ */ reactExports.createElement("span", {
      className: classNames(`${prefixCls}-text`, {
        [`${prefixCls}-text-bright`]: isBrightInnerColor,
        [`${prefixCls}-text-${infoAlign}`]: isPureLineType,
        [`${prefixCls}-text-${infoPosition}`]: isPureLineType
      }),
      title: typeof text === "string" ? text : void 0
    }, text);
  }, [showInfo, percent, percentNumber, progressStatus, type, prefixCls, format]);
  let progress2;
  if (type === "line") {
    progress2 = steps ? /* @__PURE__ */ reactExports.createElement(Steps, Object.assign({}, props, {
      strokeColor: strokeColorNotGradient,
      prefixCls,
      steps: typeof steps === "object" ? steps.count : steps
    }), progressInfo) : /* @__PURE__ */ reactExports.createElement(Line, Object.assign({}, props, {
      strokeColor: strokeColorNotArray,
      prefixCls,
      direction,
      percentPosition: {
        align: infoAlign,
        type: infoPosition
      }
    }), progressInfo);
  } else if (type === "circle" || type === "dashboard") {
    progress2 = /* @__PURE__ */ reactExports.createElement(Circle, Object.assign({}, props, {
      strokeColor: strokeColorNotArray,
      prefixCls,
      progressStatus
    }), progressInfo);
  }
  const classString = classNames(prefixCls, `${prefixCls}-status-${progressStatus}`, {
    [`${prefixCls}-${type === "dashboard" && "circle" || type}`]: type !== "line",
    [`${prefixCls}-inline-circle`]: type === "circle" && getSize(size, "circle")[0] <= 20,
    [`${prefixCls}-line`]: isPureLineType,
    [`${prefixCls}-line-align-${infoAlign}`]: isPureLineType,
    [`${prefixCls}-line-position-${infoPosition}`]: isPureLineType,
    [`${prefixCls}-steps`]: steps,
    [`${prefixCls}-show-info`]: showInfo,
    [`${prefixCls}-${size}`]: typeof size === "string",
    [`${prefixCls}-rtl`]: direction === "rtl"
  }, progressStyle === null || progressStyle === void 0 ? void 0 : progressStyle.className, className, rootClassName, hashId, cssVarCls);
  return wrapCSSVar(/* @__PURE__ */ reactExports.createElement("div", Object.assign({
    ref,
    style: Object.assign(Object.assign({}, progressStyle === null || progressStyle === void 0 ? void 0 : progressStyle.style), style),
    className: classString,
    role: "progressbar",
    "aria-valuenow": percentNumber,
    "aria-valuemin": 0,
    "aria-valuemax": 100
  }, omit(restProps, ["trailColor", "strokeWidth", "width", "gapDegree", "gapPosition", "strokeLinecap", "success", "successPercent"])), progress2));
});
const REMOTION_VIDEO_CATEGORY_TABS = [
  { key: "all", label: "全部" },
  { key: "song", label: "歌曲" },
  { key: "news", label: "新闻" },
  { key: "product", label: "产品" },
  { key: "education", label: "教育" },
  { key: "other", label: "其他" }
];
const REMOTION_VIDEO_CATEGORY_LABEL = {
  song: "歌曲",
  news: "新闻",
  product: "产品",
  education: "教育",
  other: "其他"
};
const REMOTION_VIDEO_STATUS_META = {
  draft: { label: "草稿", tone: "default" },
  rendering: { label: "渲染中", tone: "processing" },
  ready: { label: "可导出", tone: "success" },
  failed: { label: "失败", tone: "error" }
};
async function queryRemotionExports() {
  return window.api.queryRemotionExports();
}
async function queryRemotionVideoTemplates() {
  const list2 = await window.api.queryRemotionVideoTemplates();
  return list2.map(queryRemotionTemplateToProject);
}
function queryRemotionTemplateToProject(template) {
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    category: template.category,
    status: template.status,
    accent: template.accent,
    durationSec: template.durationSec,
    compositionId: template.compositionId,
    updatedAt: template.updatedAt,
    previewKind: template.previewKind,
    hasTemplateCode: template.hasTemplateCode
  };
}
async function postApplyRemotionTemplateSkill(input) {
  return window.api.postApplyRemotionTemplateSkill(input);
}
async function postRenderRemotionStudioExport(input) {
  return window.api.postRenderRemotionStudioExport(input);
}
async function postRevealExportPath(filePath) {
  const primary = await window.api.postRevealPath(filePath);
  if (primary.ok) return primary;
  const parent = filePath.replace(/[/\\][^/\\]+$/, "");
  if (!parent || parent === filePath) return primary;
  return window.api.postRevealPath(parent);
}
function queryRemotionVideosByCategory(list2, category) {
  if (category === "all") return list2;
  return list2.filter((p) => p.category === category);
}
function queryRemotionVideoSearch(list2, query) {
  const q = query.trim().toLowerCase();
  if (!q) return list2;
  return list2.filter(
    (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.compositionId.toLowerCase().includes(q)
  );
}
function queryRemotionVideoSorted(list2, sort) {
  const next = [...list2];
  switch (sort) {
    case "title_asc":
      return next.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
    case "duration_asc":
      return next.sort((a, b) => a.durationSec - b.durationSec);
    default:
      return next.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
function formatRemotionDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
const HOT_TOPIC_SOURCE_OPTIONS = [
  { value: "all", label: "全部来源" },
  { value: "tophub", label: "今日热榜（聚合推荐）" },
  { value: "weibo", label: "微博热搜" },
  { value: "baidu", label: "百度热搜" },
  { value: "douyin", label: "抖音热点" },
  { value: "kuaishou", label: "快手热点" },
  { value: "tencent", label: "腾讯新闻" }
];
function queryHasHotTopicSource(source) {
  if (source == null) return false;
  return HOT_TOPIC_SOURCE_OPTIONS.some((opt) => opt.value === source);
}
const HOT_NEWS_VIDEO_FPS = 30;
const DEFAULT_HOT_NEWS_DURATION_SEC = 20;
const HOT_NEWS_DURATION_MIN_SEC = 8;
const HOT_NEWS_DURATION_MAX_SEC = 120;
function queryHotNewsDurationInFrames(durationSec, fps = HOT_NEWS_VIDEO_FPS) {
  const clamped = Math.min(
    HOT_NEWS_DURATION_MAX_SEC,
    Math.max(HOT_NEWS_DURATION_MIN_SEC, durationSec)
  );
  return Math.round(clamped * fps);
}
function queryHotNewsContentBudget(durationSec) {
  const duration2 = Math.min(
    HOT_NEWS_DURATION_MAX_SEC,
    Math.max(HOT_NEWS_DURATION_MIN_SEC, durationSec)
  );
  if (duration2 <= 12) {
    return {
      durationSec: duration2,
      minItems: 2,
      maxItems: 3,
      minTickerLines: 3,
      maxTickerLines: 4,
      summaryMaxChars: 80,
      headlineMaxChars: 28,
      detailMinChars: 40,
      detailMaxChars: 90,
      minSecondsPerItem: 3,
      maxSecondsPerItem: 5
    };
  }
  if (duration2 <= 20) {
    return {
      durationSec: duration2,
      minItems: 3,
      maxItems: 5,
      minTickerLines: 4,
      maxTickerLines: 6,
      summaryMaxChars: 100,
      headlineMaxChars: 36,
      detailMinChars: 60,
      detailMaxChars: 120,
      minSecondsPerItem: 3,
      maxSecondsPerItem: 6
    };
  }
  if (duration2 <= 35) {
    return {
      durationSec: duration2,
      minItems: 4,
      maxItems: 6,
      minTickerLines: 5,
      maxTickerLines: 8,
      summaryMaxChars: 120,
      headlineMaxChars: 40,
      detailMinChars: 70,
      detailMaxChars: 140,
      minSecondsPerItem: 4,
      maxSecondsPerItem: 8
    };
  }
  if (duration2 <= 60) {
    return {
      durationSec: duration2,
      minItems: 5,
      maxItems: 8,
      minTickerLines: 6,
      maxTickerLines: 10,
      summaryMaxChars: 140,
      headlineMaxChars: 42,
      detailMinChars: 80,
      detailMaxChars: 160,
      minSecondsPerItem: 4,
      maxSecondsPerItem: 10
    };
  }
  return {
    durationSec: duration2,
    minItems: 6,
    maxItems: 10,
    minTickerLines: 8,
    maxTickerLines: 14,
    summaryMaxChars: 160,
    headlineMaxChars: 48,
    detailMinChars: 90,
    detailMaxChars: 180,
    minSecondsPerItem: 5,
    maxSecondsPerItem: 12
  };
}
const REMOTION_VIDEO_ASPECT_RATIO_OPTIONS = [
  { value: "16:9", label: "横版 16:9" },
  { value: "9:16", label: "竖版 9:16" }
];
const HOT_NEWS_WIDE = {
  compositionId: "HotNews",
  label: "热点新闻 · 横版",
  durationInFrames: 600,
  fps: 30,
  width: 1920,
  height: 1080
};
const HOT_NEWS_VERTICAL = {
  compositionId: "HotNewsVertical",
  label: "热点新闻 · 竖版",
  durationInFrames: 450,
  fps: 30,
  width: 1080,
  height: 1920
};
function queryHotNewsPlayerConfigByAspect(ratio, durationSec = DEFAULT_HOT_NEWS_DURATION_SEC) {
  const base = ratio === "9:16" ? HOT_NEWS_VERTICAL : HOT_NEWS_WIDE;
  return {
    ...base,
    durationInFrames: queryHotNewsDurationInFrames(durationSec, base.fps)
  };
}
function queryAspectRatioFromCompositionId(compositionId2, previewKind) {
  if (previewKind === "hot-news-vertical") return "9:16";
  if (previewKind === "hot-news-wide") return "16:9";
  if (compositionId2 === "HotNewsVertical" || compositionId2 === "NewsFlashVertical") {
    return "9:16";
  }
  return "16:9";
}
function queryIsHotNewsTemplateSkill(skillId) {
  return skillId === "remotion-template-hot-news" || skillId === "remotion-template-news-ticker" || skillId === "remotion-template-news-flash";
}
function queryClampHotNewsItemSeconds(seconds) {
  if (!Number.isFinite(seconds)) return 3;
  return Math.min(15, Math.max(3, seconds));
}
function querySanitizeDataSourceLabel(raw) {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  if (/^(未知|暂无|无|n\/?a|null|undefined|-|—|－－)$/i.test(text)) return "";
  return text.slice(0, 48);
}
function queryNormalizeHotNewsProps(raw, budget, options) {
  const brandName = String(raw.brandName ?? "").trim();
  const dateLabel = String(raw.dateLabel ?? "").trim();
  const headline = String(raw.headline ?? "").trim();
  const summary = String(raw.summary ?? "").trim();
  const itemsRaw = raw.items;
  if (!brandName || !headline || !summary || !Array.isArray(itemsRaw)) return null;
  const items = itemsRaw.map((row) => queryNormalizeHotNewsItem(row, budget)).filter((x) => Boolean(x));
  if (items.length < 1) return null;
  const dataSource = querySanitizeDataSourceLabel(String(raw.dataSource ?? "")) || items.map((item2) => querySanitizeDataSourceLabel(item2.source ?? "")).find(Boolean) || querySanitizeDataSourceLabel(options?.fallbackDataSource ?? "");
  if (!dataSource) return null;
  const accentColor = raw.accentColor != null ? String(raw.accentColor).trim() : void 0;
  const hotTopicName = raw.hotTopicName != null ? String(raw.hotTopicName).trim().slice(0, 8) : void 0;
  const tickerRaw = raw.tickerLines;
  let tickerLines = Array.isArray(tickerRaw) ? tickerRaw.map((line) => String(line ?? "").trim()).filter(Boolean).slice(0, budget.maxTickerLines) : void 0;
  if (!tickerLines?.length) {
    tickerLines = items.map((item2) => item2.title).filter(Boolean).slice(0, budget.maxTickerLines);
  }
  const secondsRaw = Number(raw.secondsPerItem);
  const secondsPerItem = Number.isFinite(secondsRaw) ? queryClampHotNewsItemSeconds(
    Math.min(budget.maxSecondsPerItem, Math.max(budget.minSecondsPerItem, secondsRaw))
  ) : queryClampHotNewsItemSeconds(
    Math.min(
      budget.maxSecondsPerItem,
      Math.max(budget.minSecondsPerItem, budget.durationSec / Math.max(1, items.length))
    )
  );
  return {
    brandName,
    dateLabel: dateLabel || (/* @__PURE__ */ new Date()).toLocaleDateString("zh-CN"),
    headline: headline.slice(0, budget.headlineMaxChars),
    summary: summary.slice(0, budget.summaryMaxChars),
    dataSource,
    items: items.slice(0, budget.maxItems),
    secondsPerItem,
    ...hotTopicName ? { hotTopicName } : {},
    tickerLines,
    ...accentColor ? { accentColor } : {}
  };
}
function queryNormalizeHotNewsItem(row, budget) {
  if (!row || typeof row !== "object") return null;
  const rec = row;
  const tag = String(rec.tag ?? "").trim();
  const title2 = String(rec.title ?? "").trim();
  if (!tag || !title2) return null;
  let detail = String(rec.detail ?? "").trim();
  if (detail) {
    detail = detail.slice(0, budget.detailMaxChars);
  }
  const source = querySanitizeDataSourceLabel(String(rec.source ?? ""));
  const secondsNum = Number(rec.seconds);
  const seconds = Number.isFinite(secondsNum) ? queryClampHotNewsItemSeconds(
    Math.min(budget.maxSecondsPerItem, Math.max(budget.minSecondsPerItem, secondsNum))
  ) : void 0;
  return {
    tag,
    title: title2,
    ...detail ? { detail } : {},
    ...source ? { source } : {},
    ...seconds != null ? { seconds } : {}
  };
}
const HOT_NEWS_JSON_SCHEMA = `{
  "brandName": "string",
  "dateLabel": "string",
  "headline": "string（单条主标题，勿拼接多条）",
  "summary": "string（总导语，1-2句）",
  "dataSource": "string（必填，画面「数据来源」；优先写具体媒体/机构；也可用热榜名如 抖音热点、微博热搜）",
  "hotTopicName": "string (2-6字，中部红色角标，如 芯片)",
  "secondsPerItem": "number（每条默认展示秒数，由你根据用户要求与成片时长智能决定）",
  "tickerLines": ["string (底部 LIVE 滚动快讯，每条一句)"],
  "accentColor": "string (可选，如 #e63946)",
  "items": [{
    "tag": "string",
    "title": "string（热点标题）",
    "detail": "string（该条详细播报，2-4句，必须来自检索到的具体信息，禁止只重复 title）",
    "source": "string（可选，本条数据来源；缺省用全局 dataSource）",
    "seconds": "number（可选，本条单独展示秒数；缺省用 secondsPerItem）"
  }]
}`;
function queryJsonObjectFromText(text) {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}
function queryHotSourceDisplayLabel(source) {
  return HOT_TOPIC_SOURCE_OPTIONS.find((opt) => opt.value === source)?.label ?? "综合热点";
}
async function queryHotNewsPropsFromAgent(input) {
  const session = await postCreateSession("chat");
  const durationSec = input.durationSec ?? DEFAULT_HOT_NEWS_DURATION_SEC;
  const budget = queryHotNewsContentBudget(durationSec);
  const hotSourceLabel = queryHotSourceDisplayLabel(input.hotSource);
  const sourceHint = input.hotSource === "all" ? "信息来源：全部（必须先 fetch_hot_topics 多源综合，再筛选；禁止跳过拉热点）" : `信息来源：${input.hotSource}（必须调用 fetch_hot_topics，source=${input.hotSource}；禁止编造未检索内容）`;
  const prompt = [
    // 明确「只出 props JSON」：避免 Supervisor 因「视频/成片」误进 video→scriptwriter（缺热点工具会 Tool not found）
    "任务类型：热点调研 + Remotion 模版 props JSON（走 general；禁止 video 管线；禁止 generate_script / remotion_render）。",
    "你是 Remotion 热点新闻视频的内容导演兼文案编辑。最终只输出一个符合 schema 的 JSON，不要 Markdown 说明。",
    `模板 compositionId：${input.compositionId}`,
    "【硬性要求】新闻类视频必须有明确信息来源与画面可见的数据来源标注。",
    `请严格按下方来源拉取热点；JSON 必须填写 dataSource。若暂无具体媒体名，至少填「${hotSourceLabel}」。禁止空值或「未知/暂无」。`,
    "多条新闻来源不同时，用 items[].source 分条标注；全局 dataSource 写主来源或综合来源。",
    sourceHint,
    `视频分类：${input.newsCategory.trim() || "未指定"}`,
    `视频总时长：约 ${budget.durationSec} 秒（片头约占 10%，主段可轮播约 ${Math.max(6, budget.durationSec - 3)} 秒）。`,
    "",
    "【必须遵守的工作流程】",
    "1) 调用 fetch_hot_topics 获取今日热点标题列表（可按来源重试）。",
    `2) 结合「用户素材或要求」与视频时长，智能决定：展示条数（${budget.minItems}-${budget.maxItems}）、全局 secondsPerItem（${budget.minSecondsPerItem}-${budget.maxSecondsPerItem} 秒）。用户若明确说了「每条几秒 / 播几条 / 节奏快慢」，必须优先服从；否则按：详情越长秒数越大、总条数×秒数≈主段时长。`,
    "3) 对选中的每条标题，必须再查具体信息后再写 detail：",
    "   - 优先：browser_navigate 打开百度/必应/新闻站搜索该标题，或打开相关报道页，再用 browser_snapshot 阅读要点；",
    "   - 若已有明确文章 URL：用 query_web_data 拉取正文；",
    "   - 禁止仅把 title 改写一句当作 detail；detail 需包含事件背景、关键主体或进展等可核验信息。",
    `4) 每条 detail 控制在 ${budget.detailMinChars}-${budget.detailMaxChars} 字（2-4 句，适合大屏播报）。`,
    "5) 汇总输出 JSON（必须含 dataSource 字段）。",
    "",
    input.hotTopicName?.trim() ? `用户指定热点名称（hotTopicName）：${input.hotTopicName.trim()}，JSON 中必须使用该值。` : "请根据内容生成 hotTopicName（2-6 字）。",
    input.tickerLinesText?.trim() ? `用户已指定底部滚动快讯（tickerLines，必须使用以下内容，每行一条）：
${input.tickerLinesText.trim()}` : `用户未填写 LIVE 滚动快讯：你必须根据 items 自动生成 tickerLines（${budget.minTickerLines}-${budget.maxTickerLines} 条，每条 12-28 字）。`,
    "用户素材或要求：",
    input.userBrief.trim() || "（用户未填写，请根据当前热点智能选题并查详情）",
    "",
    "输出字段 schema：",
    HOT_NEWS_JSON_SCHEMA,
    "",
    `规则：headline 必须是单条主标题（不超过 ${budget.headlineMaxChars} 字），禁止用逗号/顿号拼接多条；`,
    `summary 不超过 ${budget.summaryMaxChars} 字；items 共 ${budget.minItems}-${budget.maxItems} 条且每条必须有 detail；`,
    `dataSource 必填（可用「${hotSourceLabel}」）；禁止占位符；tag 2-8 字；secondsPerItem 必填；可选为个别条目设 items[].seconds / items[].source。`,
    "模板会按 secondsPerItem（或条目 seconds）轮播：主标题展示 title+detail+数据来源，中部条带同步切换。",
    "只回复一个 JSON 对象。"
  ].join("\n");
  await postAgentChat(session.id, prompt);
  const deadline = Date.now() + 24e4;
  let last = null;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    last = await querySession(session.id);
    const assistant = [...last?.messages ?? []].reverse().find((m) => m.role === "assistant" && m.content.trim());
    if (assistant) {
      const parsed = queryJsonObjectFromText(assistant.content);
      const props = parsed ? queryNormalizeHotNewsProps(parsed, budget, {
        fallbackDataSource: hotSourceLabel
      }) : null;
      if (props) {
        return queryApplyUserTickerOverride(props, input.tickerLinesText);
      }
    }
    const stillRunning = (last?.tasks ?? []).some(
      (t) => t.status === "running" || t.status === "pending"
    );
    if (!stillRunning && assistant) break;
  }
  throw new Error("Agent 未能返回有效的热点新闻模板 JSON，请简化输入后重试");
}
function queryApplyUserTickerOverride(props, tickerLinesText) {
  const manual = tickerLinesText?.split("\n").map((line) => line.trim()).filter(Boolean);
  if (!manual?.length) return props;
  return { ...props, tickerLines: manual.slice(0, 12) };
}
function queryMergedHotNewsProps(base, overrides) {
  const name = overrides.hotTopicName?.trim();
  const lines = overrides.tickerLinesText?.split("\n").map((line) => line.trim()).filter(Boolean);
  return {
    ...base,
    ...name ? { hotTopicName: name.slice(0, 8) } : {},
    ...lines && lines.length > 0 ? { tickerLines: lines.slice(0, 12) } : {}
  };
}
const wrap = "_wrap_17fag_1";
const meta$1 = "_meta_17fag_8";
const metaLabel = "_metaLabel_17fag_16";
const metaSpec = "_metaSpec_17fag_22";
const stage = "_stage_17fag_28";
const stageModal = "_stageModal_17fag_42";
const studioPanel = "_studioPanel_17fag_46";
const studioStatus = "_studioStatus_17fag_60";
const studioUrl = "_studioUrl_17fag_69";
const styles$4 = {
  wrap,
  meta: meta$1,
  metaLabel,
  metaSpec,
  stage,
  stageModal,
  studioPanel,
  studioStatus,
  studioUrl
};
function RemotionTemplatePlayer({
  studioUrl: studioUrl2,
  statusText,
  compositionId: compositionId2,
  width,
  height,
  fps,
  durationInFrames,
  variant = "inline"
}) {
  const handleOpenStudio = () => {
    if (!studioUrl2) return;
    void window.api.postOpenExternal(studioUrl2);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.wrap, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.meta, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$4.metaLabel, children: compositionId2 ?? "Composition" }),
      width && height && fps && durationInFrames ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$4.metaSpec, children: [
        width,
        "×",
        height,
        " · ",
        fps,
        "fps · ",
        Math.round(durationInFrames / fps),
        "s"
      ] }) : null
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `${styles$4.stage}${variant === "modal" ? ` ${styles$4.stageModal}` : ""}`,
        style: width && height ? { aspectRatio: `${width} / ${height}` } : void 0,
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.studioPanel, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$4.studioStatus, children: statusText ?? (studioUrl2 ? "模版已拼装，请在 Remotion Studio 中预览" : "尚未拼装模版") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "primary",
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
              disabled: !studioUrl2,
              onClick: handleOpenStudio,
              children: "打开 Studio 预览"
            }
          ),
          studioUrl2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Typography.Text, { type: "secondary", copyable: true, className: styles$4.studioUrl, children: studioUrl2 }) : null
        ] })
      }
    )
  ] });
}
const modal = "_modal_3z0a9_1";
const footer = "_footer_3z0a9_10";
const footerHint = "_footerHint_3z0a9_18";
const styles$3 = {
  modal,
  footer,
  footerHint
};
function RemotionTemplatePreviewModal({
  open,
  title: title2 = "视频预览",
  config,
  studioUrl: studioUrl2,
  statusText,
  exporting = false,
  onExport,
  onClose
}) {
  const isVertical = config.height > config.width;
  const canExport = Boolean(studioUrl2 && onExport);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      title: title2,
      open,
      onCancel: onClose,
      footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.footer, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography.Text, { type: "secondary", className: styles$3.footerHint, children: studioUrl2 ? "确认 Studio 画面无误后，可直接导出当前工程" : "请先拼装并启动 Studio" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: onClose, children: "关闭" }),
          studioUrl2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
              onClick: () => void window.api.postOpenExternal(studioUrl2),
              children: "打开 Studio"
            }
          ) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "primary",
              danger: true,
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
              loading: exporting,
              disabled: !canExport,
              onClick: () => onExport?.(),
              children: exporting ? "正在导出…" : "导出视频"
            }
          )
        ] })
      ] }),
      centered: true,
      destroyOnHidden: true,
      width: isVertical ? "min(440px, 94vw)" : "min(960px, 94vw)",
      zIndex: 1300,
      className: styles$3.modal,
      styles: {
        body: { padding: "16px 20px 12px" }
      },
      children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        RemotionTemplatePlayer,
        {
          studioUrl: studioUrl2,
          statusText,
          compositionId: config.compositionId,
          width: config.width,
          height: config.height,
          fps: config.fps,
          durationInFrames: config.durationInFrames,
          variant: "modal"
        }
      )
    }
  );
}
const drawer$1 = "_drawer_1fygd_2";
const body$2 = "_body_1fygd_31";
const lead$1 = "_lead_1fygd_40";
const form = "_form_1fygd_48";
const formShortGrid = "_formShortGrid_1fygd_68";
const formFull = "_formFull_1fygd_80";
const promptArea = "_promptArea_1fygd_84";
const actions$1 = "_actions_1fygd_89";
const actionButtons = "_actionButtons_1fygd_96";
const studioLive = "_studioLive_1fygd_103";
const studioLiveDot = "_studioLiveDot_1fygd_121";
const studioIdle = "_studioIdle_1fygd_130";
const hint = "_hint_1fygd_147";
const jsonPreview = "_jsonPreview_1fygd_153";
const titleRow$1 = "_titleRow_1fygd_165";
const drawerTitle$1 = "_drawerTitle_1fygd_171";
const styles$2 = {
  drawer: drawer$1,
  body: body$2,
  lead: lead$1,
  form,
  formShortGrid,
  formFull,
  promptArea,
  actions: actions$1,
  actionButtons,
  studioLive,
  studioLiveDot,
  studioIdle,
  hint,
  jsonPreview,
  titleRow: titleRow$1,
  drawerTitle: drawerTitle$1
};
const { Text: Text$1 } = Typography;
function RemotionVideoTemplateDrawer({
  open,
  project,
  onClose
}) {
  const supportsPreview = Boolean(project?.hasTemplateCode);
  const requiresInfoSource = Boolean(
    project && (project.category === "news" || queryIsHotNewsTemplateSkill(project.id))
  );
  const [aspectRatio, setAspectRatio] = reactExports.useState("16:9");
  const [durationSec, setDurationSec] = reactExports.useState(DEFAULT_HOT_NEWS_DURATION_SEC);
  const playerConfig = reactExports.useMemo(
    () => queryHotNewsPlayerConfigByAspect(aspectRatio, durationSec),
    [aspectRatio, durationSec]
  );
  const [userBrief, setUserBrief] = reactExports.useState("");
  const [hotTopicName, setHotTopicName] = reactExports.useState("");
  const [tickerLinesText, setTickerLinesText] = reactExports.useState("");
  const [hotSource, setHotSource] = reactExports.useState(null);
  const [videoCategory, setVideoCategory] = reactExports.useState("新闻");
  const [previewProps, setPreviewProps] = reactExports.useState(null);
  const [previewModalOpen, setPreviewModalOpen] = reactExports.useState(false);
  const [studioSessionId, setStudioSessionId] = reactExports.useState(null);
  const [studioProjectDir, setStudioProjectDir] = reactExports.useState(null);
  const [studioUrl2, setStudioUrl] = reactExports.useState(null);
  const [studioStatus2, setStudioStatus] = reactExports.useState("");
  const [analyzing, setAnalyzing] = reactExports.useState(false);
  const [exporting, setExporting] = reactExports.useState(false);
  const [applying, setApplying] = reactExports.useState(false);
  const studioReady = Boolean(studioSessionId && studioUrl2);
  reactExports.useEffect(() => {
    if (!open) return;
    setUserBrief("");
    setHotTopicName("");
    setTickerLinesText("");
    setHotSource(null);
    setVideoCategory(
      project?.category ? REMOTION_VIDEO_CATEGORY_LABEL[project.category] : "新闻"
    );
    setAspectRatio(
      project ? queryAspectRatioFromCompositionId(project.compositionId, project.previewKind) : "16:9"
    );
    setDurationSec(DEFAULT_HOT_NEWS_DURATION_SEC);
    setPreviewProps(null);
    setPreviewModalOpen(false);
    setStudioSessionId(null);
    setStudioProjectDir(null);
    setStudioUrl(null);
    setStudioStatus("");
  }, [open, project?.id, project?.category]);
  const displayProps = reactExports.useMemo(() => {
    if (!previewProps) return null;
    return queryMergedHotNewsProps(previewProps, { hotTopicName, tickerLinesText });
  }, [previewProps, hotTopicName, tickerLinesText]);
  const queryEnsureInfoSource = () => {
    if (!requiresInfoSource) return true;
    if (queryHasHotTopicSource(hotSource)) return true;
    appMessage.warning("新闻类模版必须选择信息来源");
    return false;
  };
  const postRememberStudioContext = (input) => {
    setStudioSessionId(input.sessionId);
    setStudioProjectDir(input.projectDir ?? null);
    setStudioUrl(input.studioUrl ?? null);
    setStudioStatus(input.status);
  };
  const postApplyAndOpenStudio = async (props) => {
    if (!project) return;
    setApplying(true);
    setStudioStatus("正在拼装技能模版…");
    try {
      const session = await postCreateSession("chat");
      const result = await postApplyRemotionTemplateSkill({
        sessionId: session.id,
        skillId: project.id,
        compositionId: playerConfig.compositionId,
        props,
        width: playerConfig.width,
        height: playerConfig.height,
        fps: playerConfig.fps,
        durationInFrames: playerConfig.durationInFrames,
        openStudio: true
      });
      if (!result.ok) {
        throw new Error(result.message);
      }
      postRememberStudioContext({
        sessionId: session.id,
        projectDir: result.projectDir,
        studioUrl: result.studioUrl,
        status: result.message
      });
      setPreviewModalOpen(true);
      appMessage.success(result.studioUrl ? "已拼装并打开 Studio" : "模版已拼装");
    } finally {
      setApplying(false);
    }
  };
  const handlePreviewDefault = async () => {
    if (!project || !supportsPreview) return;
    setApplying(true);
    setStudioStatus("正在拼装模版默认画面…");
    try {
      const session = await postCreateSession("chat");
      const result = await postApplyRemotionTemplateSkill({
        sessionId: session.id,
        skillId: project.id,
        compositionId: playerConfig.compositionId,
        width: playerConfig.width,
        height: playerConfig.height,
        fps: playerConfig.fps,
        durationInFrames: playerConfig.durationInFrames,
        openStudio: true
      });
      if (!result.ok) throw new Error(result.message);
      postRememberStudioContext({
        sessionId: session.id,
        projectDir: result.projectDir,
        studioUrl: result.studioUrl,
        status: result.message
      });
      setPreviewModalOpen(true);
      appMessage.success("已用模版默认数据打开 Studio");
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "拼装预览失败");
    } finally {
      setApplying(false);
    }
  };
  const handleAnalyzeAndPreview = async () => {
    if (!project || !supportsPreview) return;
    if (!queryEnsureInfoSource()) return;
    if (!queryIsHotNewsTemplateSkill(project.id)) {
      appMessage.info("当前模版请先完善内容后再预览，或使用「预览模版」查看占位画面");
      await handlePreviewDefault();
      return;
    }
    if (!queryHasHotTopicSource(hotSource)) return;
    setAnalyzing(true);
    try {
      const props = await queryHotNewsPropsFromAgent({
        userBrief,
        hotSource,
        newsCategory: videoCategory.trim() || "新闻",
        compositionId: playerConfig.compositionId,
        hotTopicName,
        tickerLinesText,
        durationSec
      });
      const merged = queryMergedHotNewsProps(props, { hotTopicName, tickerLinesText });
      setPreviewProps(merged);
      if (!tickerLinesText.trim() && merged.tickerLines?.length) {
        setTickerLinesText(merged.tickerLines.join("\n"));
      }
      await postApplyAndOpenStudio(merged);
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "生成预览失败");
    } finally {
      setAnalyzing(false);
    }
  };
  const handleExport = async () => {
    if (!project || !supportsPreview) return;
    if (!studioSessionId || !studioUrl2) {
      appMessage.warning("请先「生成并预览」或「预览模版」启动 Studio，再导出当前画面");
      return;
    }
    setExporting(true);
    setStudioStatus("正在从 Studio 工程导出 mp4…");
    try {
      const result = await postRenderRemotionStudioExport({
        sessionId: studioSessionId,
        compositionId: playerConfig.compositionId,
        projectDir: studioProjectDir ?? void 0,
        outputFileName: `studio-${project.id}-${Date.now()}.mp4`,
        quality: "standard",
        title: project.title
      });
      if (!result.ok) {
        throw new Error(result.message);
      }
      setStudioSessionId(null);
      setStudioProjectDir(null);
      setStudioUrl(null);
      setStudioStatus(result.message);
      setPreviewModalOpen(false);
      appMessage.success("已从当前 Studio 导出，请在导出列表查看成片");
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "导出失败");
    } finally {
      setExporting(false);
    }
  };
  const categoryOptions = Object.values(REMOTION_VIDEO_CATEGORY_LABEL).map((label) => ({
    value: label
  }));
  const busy = analyzing || applying;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Drawer,
    {
      title: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.titleRow, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.drawerTitle, children: project?.title ?? "模板" }),
        project ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: "blue", children: REMOTION_VIDEO_CATEGORY_LABEL[project.category] }) : null
      ] }),
      placement: "right",
      width: "min(920px, 92vw)",
      open: open && Boolean(project && supportsPreview),
      onClose,
      destroyOnHidden: true,
      closable: true,
      closeIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}),
      className: styles$2.drawer,
      children: [
        project && supportsPreview ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.body, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: styles$2.lead, children: [
            project.description,
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            "模版源码来自技能 ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: project.id }),
            "，拼装后经 Remotion Studio 预览。"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Form, { layout: "vertical", className: styles$2.form, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.formShortGrid, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "视频比例", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Select,
                {
                  value: aspectRatio,
                  onChange: setAspectRatio,
                  options: REMOTION_VIDEO_ASPECT_RATIO_OPTIONS
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Form.Item,
                {
                  label: "视频时长（秒）",
                  extra: `${HOT_NEWS_DURATION_MIN_SEC}-${HOT_NEWS_DURATION_MAX_SEC} 秒`,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TypedInputNumber,
                    {
                      value: durationSec,
                      min: HOT_NEWS_DURATION_MIN_SEC,
                      max: HOT_NEWS_DURATION_MAX_SEC,
                      step: 1,
                      style: { width: "100%" },
                      onChange: (value) => {
                        if (value == null || Number.isNaN(value)) return;
                        setDurationSec(
                          Math.min(
                            HOT_NEWS_DURATION_MAX_SEC,
                            Math.max(HOT_NEWS_DURATION_MIN_SEC, Math.round(value))
                          )
                        );
                      }
                    }
                  )
                }
              ),
              requiresInfoSource ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                Form.Item,
                {
                  label: "信息来源",
                  required: true,
                  extra: "新闻类模版必选；生成并预览 / 导出前须指定来源",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Select,
                    {
                      value: hotSource ?? void 0,
                      onChange: setHotSource,
                      options: HOT_TOPIC_SOURCE_OPTIONS,
                      placeholder: "请选择信息来源",
                      allowClear: false
                    }
                  )
                }
              ) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Form.Item,
                {
                  label: "视频分类",
                  extra: "可从列表选择，也可直接输入自定义分类（如：财经快讯）",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    AutoComplete,
                    {
                      value: videoCategory,
                      onChange: setVideoCategory,
                      options: categoryOptions,
                      placeholder: "选择或输入分类，如：新闻、财经快讯",
                      allowClear: true,
                      filterOption: (input, option) => String(option?.value ?? "").toLowerCase().includes(input.trim().toLowerCase())
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "热点名称", extra: "画面中部红色角标", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: hotTopicName,
                  onChange: (e) => setHotTopicName(e.target.value),
                  placeholder: "如：芯片、财经",
                  maxLength: 8,
                  allowClear: true,
                  showCount: true
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                label: "内容要求 / 素材",
                extra: "可写节奏要求或粘贴素材；Agent 处理后与技能模版拼装再预览。",
                className: styles$2.formFull,
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Input.TextArea,
                  {
                    className: styles$2.promptArea,
                    value: userBrief,
                    onChange: (e) => setUserBrief(e.target.value),
                    placeholder: "例如：科技向，播 4 条，每条约 5 秒，需要详细播报",
                    autoSize: { minRows: 4, maxRows: 8 }
                  }
                )
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.actions, children: [
            studioReady ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.studioLive, "aria-live": "polite", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.studioLiveDot }),
              "Studio 已就绪 · 导出将渲染当前预览工程"
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.studioIdle, children: "先预览启动 Studio，再导出当前画面" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.actionButtons, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$6, {}),
                  loading: applying && !analyzing,
                  onClick: () => void handlePreviewDefault(),
                  children: "预览模版"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "primary",
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
                  loading: busy,
                  onClick: () => void handleAnalyzeAndPreview(),
                  children: analyzing ? "拉取热点并拼装…" : applying ? "拼装中…" : "生成并预览"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$7, {}),
                  disabled: !studioUrl2,
                  onClick: () => setPreviewModalOpen(true),
                  children: "打开预览"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Tooltip,
                {
                  title: studioReady ? "直接渲染已启动 Studio 的工程，所见即所得" : "请先启动 Studio 后再导出",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      type: studioReady ? "primary" : "default",
                      danger: studioReady,
                      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
                      loading: exporting,
                      disabled: !studioReady && !exporting,
                      onClick: () => void handleExport(),
                      children: exporting ? "正在导出…" : "导出视频"
                    }
                  )
                }
              )
            ] })
          ] }),
          displayProps ? /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: styles$2.jsonPreview, children: JSON.stringify(displayProps, null, 2) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { type: "secondary", className: styles$2.hint, children: "点击「生成并预览」：Agent 处理数据后拼装技能模版并打开 Studio；确认画面后点「导出视频」直渲该工程。" })
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          RemotionTemplatePreviewModal,
          {
            open: previewModalOpen,
            title: project ? `${project.title} · Studio` : "视频预览",
            config: playerConfig,
            studioUrl: studioUrl2,
            statusText: studioStatus2,
            exporting,
            onExport: () => void handleExport(),
            onClose: () => setPreviewModalOpen(false)
          }
        )
      ]
    }
  );
}
const REMOTION_EXPORT_STATUS_META = {
  exporting: { label: "导出中", tone: "processing" },
  success: { label: "导出成功", tone: "success" },
  failed: { label: "导出失败", tone: "error" }
};
const drawer = "_drawer_oz13l_3";
const titleRow = "_titleRow_oz13l_42";
const drawerTitle = "_drawerTitle_oz13l_49";
const body$1 = "_body_oz13l_55";
const lead = "_lead_oz13l_64";
const filter = "_filter_oz13l_71";
const loading = "_loading_oz13l_75";
const empty$1 = "_empty_oz13l_76";
const list = "_list_oz13l_85";
const item = "_item_oz13l_92";
const itemHead = "_itemHead_oz13l_138";
const itemTitleBlock = "_itemTitleBlock_oz13l_146";
const itemTitle = "_itemTitle_oz13l_146";
const composition = "_composition_oz13l_164";
const progress = "_progress_oz13l_169";
const error = "_error_oz13l_174";
const meta = "_meta_oz13l_181";
const actions = "_actions_oz13l_190";
const previewModal = "_previewModal_oz13l_198";
const previewLoading = "_previewLoading_oz13l_202";
const previewVideo = "_previewVideo_oz13l_211";
const styles$1 = {
  drawer,
  titleRow,
  drawerTitle,
  body: body$1,
  lead,
  filter,
  loading,
  empty: empty$1,
  list,
  item,
  itemHead,
  itemTitleBlock,
  itemTitle,
  composition,
  progress,
  error,
  meta,
  actions,
  previewModal,
  previewLoading,
  previewVideo
};
const { Text, Paragraph } = Typography;
const STATUS_FILTER_OPTIONS = [
  { label: "全部", value: "all" },
  { label: "导出中", value: "exporting" },
  { label: "导出成功", value: "success" },
  { label: "导出失败", value: "failed" }
];
function queryUpdatedLabel(ts) {
  return new Date(ts).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function ExportListItem({
  record,
  index,
  onView
}) {
  const [revealBusy, setRevealBusy] = reactExports.useState(false);
  const statusMeta = REMOTION_EXPORT_STATUS_META[record.status];
  const canView = record.status === "success";
  const handleReveal = async () => {
    setRevealBusy(true);
    try {
      const result = await postRevealExportPath(record.outputPath);
      if (!result.ok) {
        appMessage.warning(result.error);
      }
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "无法打开目录");
    } finally {
      setRevealBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "article",
    {
      className: styles$1.item,
      style: { "--item-index": index },
      "data-status": record.status,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.itemHead, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.itemTitleBlock, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles$1.itemTitle, children: record.title || record.fileName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: styles$1.composition, children: record.title ? `${record.fileName} · ${record.compositionId}` : record.compositionId })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: statusMeta.tone, bordered: false, children: statusMeta.label })
        ] }),
        record.status === "exporting" ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Progress,
          {
            percent: Math.max(0, Math.min(100, record.progressPercent ?? 0)),
            size: "small",
            status: "active",
            className: styles$1.progress
          }
        ) : null,
        record.status === "failed" && record.errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Paragraph,
          {
            type: "danger",
            ellipsis: { rows: 2, tooltip: record.errorMessage },
            className: styles$1.error,
            children: record.errorMessage
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.meta, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "更新 ",
            queryUpdatedLabel(record.updatedAt)
          ] }),
          record.size != null && record.size > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: queryFormatAssetSize(record.size) }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.actions, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              size: "small",
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$9, {}),
              loading: revealBusy,
              onClick: () => void handleReveal(),
              children: "打开目录"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              size: "small",
              type: "primary",
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
              disabled: !canView,
              onClick: () => onView(record),
              children: "查看视频"
            }
          )
        ] })
      ]
    }
  );
}
function ExportVideoPreviewModal({
  record,
  open,
  onClose
}) {
  const [mediaUrl, setMediaUrl] = reactExports.useState(null);
  const [loading2, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!open || !record) {
      setMediaUrl(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setMediaUrl(null);
    void (async () => {
      const url = await queryLocalMediaUrl(record.outputPath);
      if (!cancelled) {
        setMediaUrl(url);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, record?.id, record?.outputPath]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      title: record?.fileName ?? "查看视频",
      open: open && Boolean(record),
      onCancel: onClose,
      footer: null,
      width: "min(840px, 92vw)",
      destroyOnHidden: true,
      className: styles$1.previewModal,
      children: loading2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.previewLoading, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", children: "正在加载视频…" })
      ] }) : mediaUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("video", { controls: true, autoPlay: true, className: styles$1.previewVideo, src: mediaUrl }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "无法加载该视频，文件可能已移动或删除" })
    }
  );
}
function RemotionExportListDrawer({
  open,
  onClose
}) {
  const [records, setRecords] = reactExports.useState([]);
  const [loading2, setLoading] = reactExports.useState(false);
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [previewRecord, setPreviewRecord] = reactExports.useState(null);
  const loadList = reactExports.useCallback(async () => {
    try {
      const list2 = await queryRemotionExports();
      setRecords(list2);
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "加载导出列表失败");
    }
  }, []);
  reactExports.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await loadList();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loadList]);
  const hasExporting = records.some((item2) => item2.status === "exporting");
  reactExports.useEffect(() => {
    if (!open) return;
    const intervalMs = hasExporting ? 1e3 : 4e3;
    const timer = window.setInterval(() => {
      void loadList();
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [open, hasExporting, loadList]);
  reactExports.useEffect(() => {
    if (!open) return;
    return window.api.onAgentEvent((event) => {
      if (event.type !== "tool_progress") return;
      if (event.toolName !== "remotion_render") return;
      void loadList();
    });
  }, [open, loadList]);
  const filtered = reactExports.useMemo(() => {
    if (statusFilter === "all") return records;
    return records.filter((item2) => item2.status === statusFilter);
  }, [records, statusFilter]);
  const counts = reactExports.useMemo(() => {
    return {
      all: records.length,
      exporting: records.filter((r) => r.status === "exporting").length,
      success: records.filter((r) => r.status === "success").length,
      failed: records.filter((r) => r.status === "failed").length
    };
  }, [records]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Drawer,
      {
        title: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.titleRow, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.drawerTitle, children: "导出列表" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { color: "blue", bordered: false, children: [
            counts.all,
            " 条"
          ] })
        ] }),
        placement: "right",
        width: "min(480px, 94vw)",
        open,
        onClose,
        destroyOnHidden: true,
        closable: true,
        closeIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}),
        className: styles$1.drawer,
        extra: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "text",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}),
            loading: loading2,
            onClick: () => {
              setLoading(true);
              void loadList().finally(() => setLoading(false));
            },
            "aria-label": "刷新导出列表"
          }
        ),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.body, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$1.lead, children: "查看 Remotion 导出任务状态；成功后可打开所在目录或直接播放成片。" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Segmented,
            {
              value: statusFilter,
              onChange: (v) => setStatusFilter(v),
              options: STATUS_FILTER_OPTIONS.map((opt) => ({
                label: opt.value === "all" ? `${opt.label} ${counts.all}` : `${opt.label} ${counts[opt.value]}`,
                value: opt.value
              })),
              block: true,
              className: styles$1.filter
            }
          ),
          loading2 && records.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, {}) }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Empty,
            {
              image: Empty.PRESENTED_IMAGE_SIMPLE,
              description: statusFilter === "all" ? "暂无导出记录，可在模板抽屉中导出视频" : "该状态下暂无记录",
              className: styles$1.empty
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$1.list, role: "list", children: filtered.map((record, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            ExportListItem,
            {
              record,
              index,
              onView: setPreviewRecord
            },
            record.id
          )) })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ExportVideoPreviewModal,
      {
        record: previewRecord,
        open: Boolean(previewRecord),
        onClose: () => setPreviewRecord(null)
      }
    )
  ] });
}
const remotionVideoPage = "_remotionVideoPage_1ll4o_1";
const searchInput = "_searchInput_1ll4o_6";
const sortSelect = "_sortSelect_1ll4o_10";
const empty = "_empty_1ll4o_14";
const grid = "_grid_1ll4o_24";
const projectCard = "_projectCard_1ll4o_31";
const thumb = "_thumb_1ll4o_82";
const thumbGrid = "_thumbGrid_1ll4o_90";
const thumbScan = "_thumbScan_1ll4o_101";
const thumbMeta = "_thumbMeta_1ll4o_114";
const duration = "_duration_1ll4o_126";
const compositionId = "_compositionId_1ll4o_136";
const body = "_body_1ll4o_147";
const head = "_head_1ll4o_156";
const title = "_title_1ll4o_163";
const desc = "_desc_1ll4o_175";
const foot = "_foot_1ll4o_186";
const categoryTag = "_categoryTag_1ll4o_196";
const updated = "_updated_1ll4o_202";
const styles = {
  remotionVideoPage,
  searchInput,
  sortSelect,
  empty,
  grid,
  projectCard,
  thumb,
  thumbGrid,
  thumbScan,
  thumbMeta,
  duration,
  compositionId,
  body,
  head,
  title,
  desc,
  foot,
  categoryTag,
  updated
};
function RemotionVideoProjectCard({
  project,
  index,
  onOpen
}) {
  const statusMeta = REMOTION_VIDEO_STATUS_META[project.status];
  const updatedLabel = new Date(project.updatedAt).toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      className: styles.projectCard,
      style: {
        "--card-index": index,
        "--card-accent": project.accent
      },
      onClick: () => onOpen(project),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.thumb, "aria-hidden": true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.thumbGrid }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.thumbScan }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.thumbMeta, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.compositionId, children: project.compositionId }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.duration, children: formatRemotionDuration(project.durationSec) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.body, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.head, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles.title, children: project.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: statusMeta.tone, bordered: false, children: statusMeta.label })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles.desc, children: project.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.foot, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: styles.categoryTag, color: "blue", children: REMOTION_VIDEO_CATEGORY_LABEL[project.category] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles.updated, children: [
              "更新 ",
              updatedLabel
            ] })
          ] })
        ] })
      ]
    }
  );
}
function RemotionVideoPage() {
  const [category, setCategory] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const [sort, setSort] = reactExports.useState("updated_desc");
  const [projects, setProjects] = reactExports.useState([]);
  const [loading2, setLoading] = reactExports.useState(true);
  const [drawerProject, setDrawerProject] = reactExports.useState(null);
  const [exportListOpen, setExportListOpen] = reactExports.useState(false);
  const loadTemplates = reactExports.useCallback(async () => {
    try {
      const list2 = await queryRemotionVideoTemplates();
      setProjects(list2);
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "加载 Remotion 模版失败");
    }
  }, []);
  reactExports.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      await loadTemplates();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadTemplates]);
  const filtered = reactExports.useMemo(() => {
    const byCategory = queryRemotionVideosByCategory(projects, category);
    const bySearch = queryRemotionVideoSearch(byCategory, search);
    return queryRemotionVideoSorted(bySearch, sort);
  }, [projects, category, search, sort]);
  const handleOpenProject = (project) => {
    if (project.hasTemplateCode) {
      setDrawerProject(project);
      return;
    }
    appMessage.info(
      `「${project.title}」技能 ${project.id} 尚未包含 template/ 源码，请先在技能中补充 Composition`
    );
  };
  const handleCreate = () => {
    appMessage.info("新建 Remotion 合成即将接入；也可在技能市场安装 remotion-template-* 模版");
  };
  const handleRefresh = () => {
    setLoading(true);
    void loadTemplates().then(() => appMessage.success("模版列表已从内置技能刷新")).finally(() => setLoading(false));
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageShell, { className: styles.remotionVideoPage, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FeaturePageHeader,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$c, {}),
        title: "Remotion 视频生产",
        badge: projects.length,
        description: "模版来自技能市场内置 remotion-template-* 技能；按业务分类管理合成与导出",
        extra: /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$a, {}), onClick: () => setExportListOpen(true), children: "导出列表" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$b, {}), onClick: handleCreate, children: "新建合成" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}), loading: loading2, onClick: handleRefresh, children: "刷新" })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageToolbar, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Segmented,
        {
          value: category,
          onChange: (v) => setCategory(v),
          options: REMOTION_VIDEO_CATEGORY_TABS.map((tab) => ({
            label: tab.label,
            value: tab.key
          }))
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shellStyles.toolbarRight, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: shellStyles.resultCount, children: [
          filtered.length,
          " 项"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            allowClear: true,
            prefix: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$d, {}),
            placeholder: "搜索标题或 Composition…",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: styles.searchInput
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Select,
          {
            value: sort,
            onChange: setSort,
            className: styles.sortSelect,
            options: [
              { label: "最近更新", value: "updated_desc" },
              { label: "名称 A→Z", value: "title_asc" },
              { label: "时长最短", value: "duration_asc" }
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureScrollBody, { children: loading2 && projects.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.empty, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Typography.Text, { type: "secondary", children: "正在从内置技能加载模版…" })
    ] }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Empty,
      {
        image: Empty.PRESENTED_IMAGE_SIMPLE,
        description: "暂无模版技能。请确认 resources/skills 下存在 remotion-template-* 内置技能",
        className: styles.empty,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}), onClick: handleRefresh, children: "重新加载" })
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.grid, role: "list", children: filtered.map((project, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      RemotionVideoProjectCard,
      {
        project,
        index,
        onOpen: handleOpenProject
      },
      project.id
    )) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      RemotionVideoTemplateDrawer,
      {
        open: Boolean(drawerProject),
        project: drawerProject,
        onClose: () => setDrawerProject(null)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(RemotionExportListDrawer, { open: exportListOpen, onClose: () => setExportListOpen(false) })
  ] });
}
export {
  RemotionVideoPage
};
