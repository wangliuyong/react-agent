import { r as reactExports, c as reactDomExports, R as ReactExports, j as jsxRuntimeExports } from "./vendor-xyflow-ByVkQ6-f.js";
import { b2 as wrapperRaf, bT as useForceUpdate, f as _typeof, e as _objectSpread2, w as warningOnce, x as omit, g as _toConsumableArray, t as toArray$1, b as _objectWithoutProperties, I as Icon, d as _extends, b1 as useEvent, _ as _slicedToArray, b4 as useLayoutEffect, bU as isEqual, bV as supportRef, bW as useMemo, bX as get, c as classNames, a as _defineProperty, b6 as RefResizeObserver, b5 as isVisible, bY as fillRef, bZ as canUseDom, b_ as getDOM, b$ as getScrollBarSize, c0 as getTargetScrollBarSize, c1 as isStyleSupport, p as pickAttrs, c2 as List, c3 as devUseWarning, u as useMergedState, ac as RefIcon$i, C as CSSMotion, c4 as _inherits, c5 as _createSuper, b8 as _classCallCheck, c6 as _assertThisInitialized, K as KeyCode, b7 as _createClass, i as genStyleHooks, k as genCollapseMotion, m as merge, r as resetComponent, z as Keyframe, j as unit, c7 as genFocusOutline, ak as RefIcon$j, s as cloneElement, h as ConfigContext, bz as DisabledContext, v as initCollapseMotion, c8 as useToken, c9 as Input, aC as RefIcon$m, E as Button, ca as mergeProps, aw as Empty, a5 as Tooltip, bp as textEllipsis, cb as operationUnit, cc as clearFix, bc as FastColor, cd as useBreakpoint, ce as localeValues, q as useSize, by as useCSSVarCls, cf as DefaultRenderEmpty, S as Spin, cg as ConfigProvider, af as Form, ag as Modal, ah as Input$1, ch as queryNewCustomProviderId, ci as queryProviderOption, cj as queryResolvedModelOptionsForProvider, a3 as queryModelOptionDisplayLabel, ck as RefIcon$o, ab as Select, aK as RefIcon$q, cl as queryModelOptions, av as Drawer, cm as Tabs, T as Typography, W as RefIcon$r, a_ as Switch, a2 as queryModelCategory, cn as queryModelSupportsThinking, ax as Tag, co as PROVIDER_MODEL_CATEGORY_PRESETS, D as appMessage, cp as queryNewProviderModelRecordId, a6 as Space, cq as queryAllProviderOptions, cr as queryProviderCredentialsFromSettings, cs as queryAlignConnectionsToActiveProvider, Y as useSettingsStore, Z as queryGeneralChatModelConnection, ct as queryProviderModelCatalogForProvider, aT as cardStyles, at as RefIcon$s, cu as queryIsCustomModelProvider, am as Card, aU as RefIcon$t, aB as RefIcon$u, aa as RefIcon$v, cv as TypedInputNumber, cw as queryRemoveCustomProvider, cx as DEFAULT_ROLE_PROMPT_OVERRIDES, cy as queryIsChatPipelineRole, O as queryToolLabel, cz as querySyncConnectionsProviderCredentials, cA as DEFAULT_CONNECTION, ar as Segmented, cB as VirtualGrid, aF as RefIcon$y, cC as VirtualList, aA as Popconfirm, X as RefIcon$A, G as queryLocalImageDataUrl, H as queryLocalMediaUrl, aI as FeaturePageHeader, cD as RefIcon$C, as as shellStyles, cE as ChannelsPanel } from "./index-BQnnWLUu.js";
import { a as addEventListenerWrap, R as RefIcon$p, A as ArtifactFileActions, I as Image } from "./ArtifactFileActions--VhqergO.js";
import { C as Checkbox, g as getStyle } from "./index-CTeoHogA.js";
import { D as Dropdown, M as Menu, O as OverrideProvider } from "./index-DdgcjpRF.js";
import { R as Radio } from "./index-Bz8ZzPRP.js";
import { P as Pagination } from "./Pagination-IjXhoAki.js";
import { R as RefIcon$l } from "./FolderOpenOutlined-eU2RptIS.js";
import { d as RefIcon$k, R as RefIcon$w, c as RefIcon$x, b as RefIcon$z, a as RefIcon$B } from "./ToolOutlined--gas-4iW.js";
import { R as RefIcon$n } from "./CaretDownOutlined-CqBxlPI3.js";
import { u as useSkillsStore } from "./useSkillsStore-Bec86d-P.js";
import { A as Alert } from "./index-BCCKOrpo.js";
import { S as SkillMarkdown } from "./SkillMarkdown-B9mv4weK.js";
import { q as queryFormatAssetSize, A as AGENT_ASSET_KIND_LABELS, a as AGENT_ASSET_ZONE_LABELS } from "./agent-assets-CjAU6vps.js";
import { F as FeaturePageShell, a as FeatureScrollBody } from "./FeatureScrollBody-BTNfhjBJ.js";
import { F as FeaturePageToolbar } from "./FeaturePageToolbar-DU3L1YVp.js";
import { R as RefIcon$D } from "./MinusCircleOutlined-7FKBZe7B.js";
import { R as RefIcon$E } from "./RocketOutlined-BDmQoSbW.js";
import "./LeftOutlined-DLcljnsf.js";
import "./LazyChatMarkdown-BGGvM4yz.js";
function isWindow(obj) {
  return obj !== null && obj !== void 0 && obj === obj.window;
}
const getScroll = (target) => {
  var _a, _b;
  if (typeof window === "undefined") {
    return 0;
  }
  let result = 0;
  if (isWindow(target)) {
    result = target.pageYOffset;
  } else if (target instanceof Document) {
    result = target.documentElement.scrollTop;
  } else if (target instanceof HTMLElement) {
    result = target.scrollTop;
  } else if (target) {
    result = target["scrollTop"];
  }
  if (target && !isWindow(target) && typeof result !== "number") {
    result = (_b = ((_a = target.ownerDocument) !== null && _a !== void 0 ? _a : target).documentElement) === null || _b === void 0 ? void 0 : _b.scrollTop;
  }
  return result;
};
function easeInOutCubic(t, b, c, d) {
  const cc = c - b;
  t /= d / 2;
  if (t < 1) {
    return cc / 2 * t * t * t + b;
  }
  return cc / 2 * ((t -= 2) * t * t + 2) + b;
}
function scrollTo(y, options = {}) {
  const {
    getContainer = () => window,
    callback,
    duration = 450
  } = options;
  const container = getContainer();
  const scrollTop = getScroll(container);
  const startTime = Date.now();
  const frameFunc = () => {
    const timestamp = Date.now();
    const time = timestamp - startTime;
    const nextScrollTop = easeInOutCubic(time > duration ? duration : time, scrollTop, y, duration);
    if (isWindow(container)) {
      container.scrollTo(window.pageXOffset, nextScrollTop);
    } else if (container instanceof Document || container.constructor.name === "HTMLDocument") {
      container.documentElement.scrollTop = nextScrollTop;
    } else {
      container.scrollTop = nextScrollTop;
    }
    if (time < duration) {
      wrapperRaf(frameFunc);
    } else if (typeof callback === "function") {
      callback();
    }
  };
  wrapperRaf(frameFunc);
}
const useMultipleSelect = (getKey2) => {
  const [prevSelectedIndex, setPrevSelectedIndex] = reactExports.useState(null);
  const multipleSelect = reactExports.useCallback((currentSelectedIndex, data, selectedKeys) => {
    const configPrevSelectedIndex = prevSelectedIndex !== null && prevSelectedIndex !== void 0 ? prevSelectedIndex : currentSelectedIndex;
    const startIndex = Math.min(configPrevSelectedIndex || 0, currentSelectedIndex);
    const endIndex = Math.max(configPrevSelectedIndex || 0, currentSelectedIndex);
    const rangeKeys = data.slice(startIndex, endIndex + 1).map(getKey2);
    const shouldSelected = rangeKeys.some((rangeKey) => !selectedKeys.has(rangeKey));
    const changedKeys = [];
    rangeKeys.forEach((item) => {
      if (shouldSelected) {
        if (!selectedKeys.has(item)) {
          changedKeys.push(item);
        }
        selectedKeys.add(item);
      } else {
        selectedKeys.delete(item);
        changedKeys.push(item);
      }
    });
    setPrevSelectedIndex(shouldSelected ? endIndex : null);
    return changedKeys;
  }, [prevSelectedIndex]);
  return [multipleSelect, setPrevSelectedIndex];
};
function fillProxy(element, handler) {
  element._antProxy = element._antProxy || {};
  Object.keys(handler).forEach((key) => {
    if (!(key in element._antProxy)) {
      const ori = element[key];
      element._antProxy[key] = ori;
      element[key] = handler[key];
    }
  });
  return element;
}
const useProxyImperativeHandle = (ref, init) => {
  return reactExports.useImperativeHandle(ref, () => {
    const refObj = init();
    const {
      nativeElement
    } = refObj;
    if (typeof Proxy !== "undefined") {
      return new Proxy(nativeElement, {
        get(obj, prop) {
          if (refObj[prop]) {
            return refObj[prop];
          }
          return Reflect.get(obj, prop);
        }
      });
    }
    return fillProxy(nativeElement, refObj);
  });
};
const useSyncState = (initialValue) => {
  const ref = reactExports.useRef(initialValue);
  const [, forceUpdate] = useForceUpdate();
  return [() => ref.current, (newValue) => {
    ref.current = newValue;
    forceUpdate();
  }];
};
function getEntity(keyEntities, key) {
  return keyEntities[key];
}
var _excluded$9 = ["children"];
function getPosition(level, index) {
  return "".concat(level, "-").concat(index);
}
function isTreeNode(node) {
  return node && node.type && node.type.isTreeNode;
}
function getKey(key, pos) {
  if (key !== null && key !== void 0) {
    return key;
  }
  return pos;
}
function fillFieldNames(fieldNames) {
  var _ref = fieldNames || {}, title2 = _ref.title, _title = _ref._title, key = _ref.key, children = _ref.children;
  var mergedTitle = title2 || "title";
  return {
    title: mergedTitle,
    _title: _title || [mergedTitle],
    key: key || "key",
    children: children || "children"
  };
}
function convertTreeToData(rootNodes) {
  function dig(node) {
    var treeNodes = toArray$1(node);
    return treeNodes.map(function(treeNode) {
      if (!isTreeNode(treeNode)) {
        warningOnce(!treeNode, "Tree/TreeNode can only accept TreeNode as children.");
        return null;
      }
      var key = treeNode.key;
      var _treeNode$props = treeNode.props, children = _treeNode$props.children, rest = _objectWithoutProperties(_treeNode$props, _excluded$9);
      var dataNode = _objectSpread2({
        key
      }, rest);
      var parsedChildren = dig(children);
      if (parsedChildren.length) {
        dataNode.children = parsedChildren;
      }
      return dataNode;
    }).filter(function(dataNode) {
      return dataNode;
    });
  }
  return dig(rootNodes);
}
function flattenTreeData(treeNodeList, expandedKeys, fieldNames) {
  var _fillFieldNames = fillFieldNames(fieldNames), fieldTitles = _fillFieldNames._title, fieldKey = _fillFieldNames.key, fieldChildren = _fillFieldNames.children;
  var expandedKeySet = new Set(expandedKeys === true ? [] : expandedKeys);
  var flattenList = [];
  function dig(list) {
    var parent = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : null;
    return list.map(function(treeNode, index) {
      var pos = getPosition(parent ? parent.pos : "0", index);
      var mergedKey = getKey(treeNode[fieldKey], pos);
      var mergedTitle;
      for (var i = 0; i < fieldTitles.length; i += 1) {
        var fieldTitle = fieldTitles[i];
        if (treeNode[fieldTitle] !== void 0) {
          mergedTitle = treeNode[fieldTitle];
          break;
        }
      }
      var flattenNode = Object.assign(omit(treeNode, [].concat(_toConsumableArray(fieldTitles), [fieldKey, fieldChildren])), {
        title: mergedTitle,
        key: mergedKey,
        parent,
        pos,
        children: null,
        data: treeNode,
        isStart: [].concat(_toConsumableArray(parent ? parent.isStart : []), [index === 0]),
        isEnd: [].concat(_toConsumableArray(parent ? parent.isEnd : []), [index === list.length - 1])
      });
      flattenList.push(flattenNode);
      if (expandedKeys === true || expandedKeySet.has(mergedKey)) {
        flattenNode.children = dig(treeNode[fieldChildren] || [], flattenNode);
      } else {
        flattenNode.children = [];
      }
      return flattenNode;
    });
  }
  dig(treeNodeList);
  return flattenList;
}
function traverseDataNodes(dataNodes, callback, config) {
  var mergedConfig = {};
  if (_typeof(config) === "object") {
    mergedConfig = config;
  } else {
    mergedConfig = {
      externalGetKey: config
    };
  }
  mergedConfig = mergedConfig || {};
  var _mergedConfig = mergedConfig, childrenPropName = _mergedConfig.childrenPropName, externalGetKey = _mergedConfig.externalGetKey, fieldNames = _mergedConfig.fieldNames;
  var _fillFieldNames2 = fillFieldNames(fieldNames), fieldKey = _fillFieldNames2.key, fieldChildren = _fillFieldNames2.children;
  var mergeChildrenPropName = childrenPropName || fieldChildren;
  var syntheticGetKey;
  if (externalGetKey) {
    if (typeof externalGetKey === "string") {
      syntheticGetKey = function syntheticGetKey2(node) {
        return node[externalGetKey];
      };
    } else if (typeof externalGetKey === "function") {
      syntheticGetKey = function syntheticGetKey2(node) {
        return externalGetKey(node);
      };
    }
  } else {
    syntheticGetKey = function syntheticGetKey2(node, pos) {
      return getKey(node[fieldKey], pos);
    };
  }
  function processNode(node, index, parent, pathNodes) {
    var children = node ? node[mergeChildrenPropName] : dataNodes;
    var pos = node ? getPosition(parent.pos, index) : "0";
    var connectNodes = node ? [].concat(_toConsumableArray(pathNodes), [node]) : [];
    if (node) {
      var key = syntheticGetKey(node, pos);
      var _data = {
        node,
        index,
        pos,
        key,
        parentPos: parent.node ? parent.pos : null,
        level: parent.level + 1,
        nodes: connectNodes
      };
      callback(_data);
    }
    if (children) {
      children.forEach(function(subNode, subIndex) {
        processNode(subNode, subIndex, {
          node,
          pos,
          level: parent ? parent.level + 1 : -1
        }, connectNodes);
      });
    }
  }
  processNode(null);
}
function convertDataToEntities(dataNodes) {
  var _ref2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}, initWrapper = _ref2.initWrapper, processEntity = _ref2.processEntity, onProcessFinished = _ref2.onProcessFinished, externalGetKey = _ref2.externalGetKey, childrenPropName = _ref2.childrenPropName, fieldNames = _ref2.fieldNames;
  var legacyExternalGetKey = arguments.length > 2 ? arguments[2] : void 0;
  var mergedExternalGetKey = externalGetKey || legacyExternalGetKey;
  var posEntities = {};
  var keyEntities = {};
  var wrapper = {
    posEntities,
    keyEntities
  };
  if (initWrapper) {
    wrapper = initWrapper(wrapper) || wrapper;
  }
  traverseDataNodes(dataNodes, function(item) {
    var node = item.node, index = item.index, pos = item.pos, key = item.key, parentPos = item.parentPos, level = item.level, nodes = item.nodes;
    var entity = {
      node,
      nodes,
      index,
      key,
      pos,
      level
    };
    var mergedKey = getKey(key, pos);
    posEntities[pos] = entity;
    keyEntities[mergedKey] = entity;
    entity.parent = posEntities[parentPos];
    if (entity.parent) {
      entity.parent.children = entity.parent.children || [];
      entity.parent.children.push(entity);
    }
    if (processEntity) {
      processEntity(entity, wrapper);
    }
  }, {
    externalGetKey: mergedExternalGetKey,
    childrenPropName,
    fieldNames
  });
  if (onProcessFinished) {
    onProcessFinished(wrapper);
  }
  return wrapper;
}
function getTreeNodeProps(key, _ref3) {
  var expandedKeys = _ref3.expandedKeys, selectedKeys = _ref3.selectedKeys, loadedKeys = _ref3.loadedKeys, loadingKeys = _ref3.loadingKeys, checkedKeys = _ref3.checkedKeys, halfCheckedKeys = _ref3.halfCheckedKeys, dragOverNodeKey = _ref3.dragOverNodeKey, dropPosition = _ref3.dropPosition, keyEntities = _ref3.keyEntities;
  var entity = getEntity(keyEntities, key);
  var treeNodeProps = {
    eventKey: key,
    expanded: expandedKeys.indexOf(key) !== -1,
    selected: selectedKeys.indexOf(key) !== -1,
    loaded: loadedKeys.indexOf(key) !== -1,
    loading: loadingKeys.indexOf(key) !== -1,
    checked: checkedKeys.indexOf(key) !== -1,
    halfChecked: halfCheckedKeys.indexOf(key) !== -1,
    pos: String(entity ? entity.pos : ""),
    // [Legacy] Drag props
    // Since the interaction of drag is changed, the semantic of the props are
    // not accuracy, I think it should be finally removed
    dragOver: dragOverNodeKey === key && dropPosition === 0,
    dragOverGapTop: dragOverNodeKey === key && dropPosition === -1,
    dragOverGapBottom: dragOverNodeKey === key && dropPosition === 1
  };
  return treeNodeProps;
}
function convertNodePropsToEventData(props) {
  var data = props.data, expanded = props.expanded, selected = props.selected, checked = props.checked, loaded = props.loaded, loading = props.loading, halfChecked = props.halfChecked, dragOver = props.dragOver, dragOverGapTop = props.dragOverGapTop, dragOverGapBottom = props.dragOverGapBottom, pos = props.pos, active = props.active, eventKey = props.eventKey;
  var eventData = _objectSpread2(_objectSpread2({}, data), {}, {
    expanded,
    selected,
    checked,
    loaded,
    loading,
    halfChecked,
    dragOver,
    dragOverGapTop,
    dragOverGapBottom,
    pos,
    active,
    key: eventKey
  });
  if (!("props" in eventData)) {
    Object.defineProperty(eventData, "props", {
      get: function get2() {
        warningOnce(false, "Second param return from event is node data instead of TreeNode instance. Please read value directly instead of reading from `props`.");
        return props;
      }
    });
  }
  return eventData;
}
function removeFromCheckedKeys(halfCheckedKeys, checkedKeys) {
  var filteredKeys = /* @__PURE__ */ new Set();
  halfCheckedKeys.forEach(function(key) {
    if (!checkedKeys.has(key)) {
      filteredKeys.add(key);
    }
  });
  return filteredKeys;
}
function isCheckDisabled(node) {
  var _ref = node || {}, disabled = _ref.disabled, disableCheckbox = _ref.disableCheckbox, checkable = _ref.checkable;
  return !!(disabled || disableCheckbox) || checkable === false;
}
function fillConductCheck(keys, levelEntities, maxLevel, syntheticGetCheckDisabled) {
  var checkedKeys = new Set(keys);
  var halfCheckedKeys = /* @__PURE__ */ new Set();
  for (var level = 0; level <= maxLevel; level += 1) {
    var entities = levelEntities.get(level) || /* @__PURE__ */ new Set();
    entities.forEach(function(entity) {
      var key = entity.key, node = entity.node, _entity$children = entity.children, children = _entity$children === void 0 ? [] : _entity$children;
      if (checkedKeys.has(key) && !syntheticGetCheckDisabled(node)) {
        children.filter(function(childEntity) {
          return !syntheticGetCheckDisabled(childEntity.node);
        }).forEach(function(childEntity) {
          checkedKeys.add(childEntity.key);
        });
      }
    });
  }
  var visitedKeys = /* @__PURE__ */ new Set();
  for (var _level = maxLevel; _level >= 0; _level -= 1) {
    var _entities = levelEntities.get(_level) || /* @__PURE__ */ new Set();
    _entities.forEach(function(entity) {
      var parent = entity.parent, node = entity.node;
      if (syntheticGetCheckDisabled(node) || !entity.parent || visitedKeys.has(entity.parent.key)) {
        return;
      }
      if (syntheticGetCheckDisabled(entity.parent.node)) {
        visitedKeys.add(parent.key);
        return;
      }
      var allChecked = true;
      var partialChecked = false;
      (parent.children || []).filter(function(childEntity) {
        return !syntheticGetCheckDisabled(childEntity.node);
      }).forEach(function(_ref2) {
        var key = _ref2.key;
        var checked = checkedKeys.has(key);
        if (allChecked && !checked) {
          allChecked = false;
        }
        if (!partialChecked && (checked || halfCheckedKeys.has(key))) {
          partialChecked = true;
        }
      });
      if (allChecked) {
        checkedKeys.add(parent.key);
      }
      if (partialChecked) {
        halfCheckedKeys.add(parent.key);
      }
      visitedKeys.add(parent.key);
    });
  }
  return {
    checkedKeys: Array.from(checkedKeys),
    halfCheckedKeys: Array.from(removeFromCheckedKeys(halfCheckedKeys, checkedKeys))
  };
}
function cleanConductCheck(keys, halfKeys, levelEntities, maxLevel, syntheticGetCheckDisabled) {
  var checkedKeys = new Set(keys);
  var halfCheckedKeys = new Set(halfKeys);
  for (var level = 0; level <= maxLevel; level += 1) {
    var entities = levelEntities.get(level) || /* @__PURE__ */ new Set();
    entities.forEach(function(entity) {
      var key = entity.key, node = entity.node, _entity$children2 = entity.children, children = _entity$children2 === void 0 ? [] : _entity$children2;
      if (!checkedKeys.has(key) && !halfCheckedKeys.has(key) && !syntheticGetCheckDisabled(node)) {
        children.filter(function(childEntity) {
          return !syntheticGetCheckDisabled(childEntity.node);
        }).forEach(function(childEntity) {
          checkedKeys.delete(childEntity.key);
        });
      }
    });
  }
  halfCheckedKeys = /* @__PURE__ */ new Set();
  var visitedKeys = /* @__PURE__ */ new Set();
  for (var _level2 = maxLevel; _level2 >= 0; _level2 -= 1) {
    var _entities2 = levelEntities.get(_level2) || /* @__PURE__ */ new Set();
    _entities2.forEach(function(entity) {
      var parent = entity.parent, node = entity.node;
      if (syntheticGetCheckDisabled(node) || !entity.parent || visitedKeys.has(entity.parent.key)) {
        return;
      }
      if (syntheticGetCheckDisabled(entity.parent.node)) {
        visitedKeys.add(parent.key);
        return;
      }
      var allChecked = true;
      var partialChecked = false;
      (parent.children || []).filter(function(childEntity) {
        return !syntheticGetCheckDisabled(childEntity.node);
      }).forEach(function(_ref3) {
        var key = _ref3.key;
        var checked = checkedKeys.has(key);
        if (allChecked && !checked) {
          allChecked = false;
        }
        if (!partialChecked && (checked || halfCheckedKeys.has(key))) {
          partialChecked = true;
        }
      });
      if (!allChecked) {
        checkedKeys.delete(parent.key);
      }
      if (partialChecked) {
        halfCheckedKeys.add(parent.key);
      }
      visitedKeys.add(parent.key);
    });
  }
  return {
    checkedKeys: Array.from(checkedKeys),
    halfCheckedKeys: Array.from(removeFromCheckedKeys(halfCheckedKeys, checkedKeys))
  };
}
function conductCheck(keyList, checked, keyEntities, getCheckDisabled) {
  var warningMissKeys = [];
  var syntheticGetCheckDisabled;
  if (getCheckDisabled) {
    syntheticGetCheckDisabled = getCheckDisabled;
  } else {
    syntheticGetCheckDisabled = isCheckDisabled;
  }
  var keys = new Set(keyList.filter(function(key) {
    var hasEntity = !!getEntity(keyEntities, key);
    if (!hasEntity) {
      warningMissKeys.push(key);
    }
    return hasEntity;
  }));
  var levelEntities = /* @__PURE__ */ new Map();
  var maxLevel = 0;
  Object.keys(keyEntities).forEach(function(key) {
    var entity = keyEntities[key];
    var level = entity.level;
    var levelSet = levelEntities.get(level);
    if (!levelSet) {
      levelSet = /* @__PURE__ */ new Set();
      levelEntities.set(level, levelSet);
    }
    levelSet.add(entity);
    maxLevel = Math.max(maxLevel, level);
  });
  warningOnce(!warningMissKeys.length, "Tree missing follow keys: ".concat(warningMissKeys.slice(0, 100).map(function(key) {
    return "'".concat(key, "'");
  }).join(", ")));
  var result;
  if (checked === true) {
    result = fillConductCheck(keys, levelEntities, maxLevel, syntheticGetCheckDisabled);
  } else {
    result = cleanConductCheck(keys, checked.halfCheckedKeys, levelEntities, maxLevel, syntheticGetCheckDisabled);
  }
  return result;
}
var FileTextOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494zM504 618H320c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8zM312 490v48c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H320c-4.4 0-8 3.6-8 8z" } }] }, "name": "file-text", "theme": "outlined" };
var FileTextOutlined = function FileTextOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: FileTextOutlined$1
  }));
};
var RefIcon$h = /* @__PURE__ */ reactExports.forwardRef(FileTextOutlined);
var EXPAND_COLUMN = {};
var INTERNAL_HOOKS = "rc-table-internal-hook";
function createContext(defaultValue) {
  var Context = /* @__PURE__ */ reactExports.createContext(void 0);
  var Provider = function Provider2(_ref) {
    var value = _ref.value, children = _ref.children;
    var valueRef = reactExports.useRef(value);
    valueRef.current = value;
    var _React$useState = reactExports.useState(function() {
      return {
        getValue: function getValue() {
          return valueRef.current;
        },
        listeners: /* @__PURE__ */ new Set()
      };
    }), _React$useState2 = _slicedToArray(_React$useState, 1), context = _React$useState2[0];
    useLayoutEffect(function() {
      reactDomExports.unstable_batchedUpdates(function() {
        context.listeners.forEach(function(listener) {
          listener(value);
        });
      });
    }, [value]);
    return /* @__PURE__ */ reactExports.createElement(Context.Provider, {
      value: context
    }, children);
  };
  return {
    Context,
    Provider,
    defaultValue
  };
}
function useContext(holder, selector) {
  var eventSelector = useEvent(typeof selector === "function" ? selector : function(ctx) {
    if (selector === void 0) {
      return ctx;
    }
    if (!Array.isArray(selector)) {
      return ctx[selector];
    }
    var obj = {};
    selector.forEach(function(key) {
      obj[key] = ctx[key];
    });
    return obj;
  });
  var context = reactExports.useContext(holder === null || holder === void 0 ? void 0 : holder.Context);
  var _ref2 = context || {}, listeners = _ref2.listeners, getValue = _ref2.getValue;
  var valueRef = reactExports.useRef();
  valueRef.current = eventSelector(context ? getValue() : holder === null || holder === void 0 ? void 0 : holder.defaultValue);
  var _React$useState3 = reactExports.useState({}), _React$useState4 = _slicedToArray(_React$useState3, 2), forceUpdate = _React$useState4[1];
  useLayoutEffect(function() {
    if (!context) {
      return;
    }
    function trigger(nextValue) {
      var nextSelectorValue = eventSelector(nextValue);
      if (!isEqual(valueRef.current, nextSelectorValue, true)) {
        forceUpdate({});
      }
    }
    listeners.add(trigger);
    return function() {
      listeners.delete(trigger);
    };
  }, [context]);
  return valueRef.current;
}
function createImmutable() {
  var ImmutableContext = /* @__PURE__ */ reactExports.createContext(null);
  function useImmutableMark2() {
    return reactExports.useContext(ImmutableContext);
  }
  function makeImmutable2(Component, shouldTriggerRender) {
    var refAble = supportRef(Component);
    var ImmutableComponent = function ImmutableComponent2(props, ref) {
      var refProps = refAble ? {
        ref
      } : {};
      var renderTimesRef = reactExports.useRef(0);
      var prevProps = reactExports.useRef(props);
      var mark = useImmutableMark2();
      if (mark !== null) {
        return /* @__PURE__ */ reactExports.createElement(Component, _extends({}, props, refProps));
      }
      if (
        // Always trigger re-render if not provide `notTriggerRender`
        !shouldTriggerRender || shouldTriggerRender(prevProps.current, props)
      ) {
        renderTimesRef.current += 1;
      }
      prevProps.current = props;
      return /* @__PURE__ */ reactExports.createElement(ImmutableContext.Provider, {
        value: renderTimesRef.current
      }, /* @__PURE__ */ reactExports.createElement(Component, _extends({}, props, refProps)));
    };
    return refAble ? /* @__PURE__ */ reactExports.forwardRef(ImmutableComponent) : ImmutableComponent;
  }
  function responseImmutable2(Component, propsAreEqual) {
    var refAble = supportRef(Component);
    var ImmutableComponent = function ImmutableComponent2(props, ref) {
      var refProps = refAble ? {
        ref
      } : {};
      useImmutableMark2();
      return /* @__PURE__ */ reactExports.createElement(Component, _extends({}, props, refProps));
    };
    return refAble ? /* @__PURE__ */ reactExports.memo(/* @__PURE__ */ reactExports.forwardRef(ImmutableComponent), propsAreEqual) : /* @__PURE__ */ reactExports.memo(ImmutableComponent, propsAreEqual);
  }
  return {
    makeImmutable: makeImmutable2,
    responseImmutable: responseImmutable2,
    useImmutableMark: useImmutableMark2
  };
}
var _createImmutable = createImmutable(), makeImmutable = _createImmutable.makeImmutable, responseImmutable = _createImmutable.responseImmutable, useImmutableMark = _createImmutable.useImmutableMark;
var TableContext = createContext();
var PerfContext = /* @__PURE__ */ reactExports.createContext({
  renderWithProps: false
});
var INTERNAL_KEY_PREFIX = "RC_TABLE_KEY";
function toArray(arr) {
  if (arr === void 0 || arr === null) {
    return [];
  }
  return Array.isArray(arr) ? arr : [arr];
}
function getColumnsKey(columns) {
  var columnKeys = [];
  var keys = {};
  columns.forEach(function(column) {
    var _ref = column || {}, key = _ref.key, dataIndex = _ref.dataIndex;
    var mergedKey = key || toArray(dataIndex).join("-") || INTERNAL_KEY_PREFIX;
    while (keys[mergedKey]) {
      mergedKey = "".concat(mergedKey, "_next");
    }
    keys[mergedKey] = true;
    columnKeys.push(mergedKey);
  });
  return columnKeys;
}
function validateValue(val) {
  return val !== null && val !== void 0;
}
function validNumberValue(value) {
  return typeof value === "number" && !Number.isNaN(value);
}
function isRenderCell(data) {
  return data && _typeof(data) === "object" && !Array.isArray(data) && !/* @__PURE__ */ reactExports.isValidElement(data);
}
function useCellRender(record, dataIndex, renderIndex, children, render, shouldCellUpdate) {
  var perfRecord = reactExports.useContext(PerfContext);
  var mark = useImmutableMark();
  var retData = useMemo(function() {
    if (validateValue(children)) {
      return [children];
    }
    var path = dataIndex === null || dataIndex === void 0 || dataIndex === "" ? [] : Array.isArray(dataIndex) ? dataIndex : [dataIndex];
    var value = get(record, path);
    var returnChildNode = value;
    var returnCellProps = void 0;
    if (render) {
      var renderData = render(value, record, renderIndex);
      if (isRenderCell(renderData)) {
        returnChildNode = renderData.children;
        returnCellProps = renderData.props;
        perfRecord.renderWithProps = true;
      } else {
        returnChildNode = renderData;
      }
    }
    return [returnChildNode, returnCellProps];
  }, [
    // Force update deps
    mark,
    // Normal deps
    record,
    children,
    dataIndex,
    render,
    renderIndex
  ], function(prev, next) {
    if (shouldCellUpdate) {
      var _prev = _slicedToArray(prev, 2), prevRecord = _prev[1];
      var _next = _slicedToArray(next, 2), nextRecord = _next[1];
      return shouldCellUpdate(nextRecord, prevRecord);
    }
    if (perfRecord.renderWithProps) {
      return true;
    }
    return !isEqual(prev, next, true);
  });
  return retData;
}
function inHoverRange(cellStartRow, cellRowSpan, startRow, endRow) {
  var cellEndRow = cellStartRow + cellRowSpan - 1;
  return cellStartRow <= endRow && cellEndRow >= startRow;
}
function useHoverState(rowIndex, rowSpan) {
  return useContext(TableContext, function(ctx) {
    var hovering = inHoverRange(rowIndex, rowSpan || 1, ctx.hoverStartRow, ctx.hoverEndRow);
    return [hovering, ctx.onHover];
  });
}
var getTitleFromCellRenderChildren = function getTitleFromCellRenderChildren2(_ref) {
  var ellipsis = _ref.ellipsis, rowType = _ref.rowType, children = _ref.children;
  var title2;
  var ellipsisConfig = ellipsis === true ? {
    showTitle: true
  } : ellipsis;
  if (ellipsisConfig && (ellipsisConfig.showTitle || rowType === "header")) {
    if (typeof children === "string" || typeof children === "number") {
      title2 = children.toString();
    } else if (/* @__PURE__ */ reactExports.isValidElement(children) && typeof children.props.children === "string") {
      title2 = children.props.children;
    }
  }
  return title2;
};
function Cell(props) {
  var _ref2, _ref3, _legacyCellProps$colS, _ref4, _ref5, _legacyCellProps$rowS, _additionalProps$titl, _classNames;
  var Component = props.component, children = props.children, ellipsis = props.ellipsis, scope = props.scope, prefixCls = props.prefixCls, className = props.className, align = props.align, record = props.record, render = props.render, dataIndex = props.dataIndex, renderIndex = props.renderIndex, shouldCellUpdate = props.shouldCellUpdate, index = props.index, rowType = props.rowType, colSpan = props.colSpan, rowSpan = props.rowSpan, fixLeft = props.fixLeft, fixRight = props.fixRight, firstFixLeft = props.firstFixLeft, lastFixLeft = props.lastFixLeft, firstFixRight = props.firstFixRight, lastFixRight = props.lastFixRight, appendNode = props.appendNode, _props$additionalProp = props.additionalProps, additionalProps = _props$additionalProp === void 0 ? {} : _props$additionalProp, isSticky = props.isSticky;
  var cellPrefixCls = "".concat(prefixCls, "-cell");
  var _useContext = useContext(TableContext, ["supportSticky", "allColumnsFixedLeft", "rowHoverable"]), supportSticky = _useContext.supportSticky, allColumnsFixedLeft = _useContext.allColumnsFixedLeft, rowHoverable = _useContext.rowHoverable;
  var _useCellRender = useCellRender(record, dataIndex, renderIndex, children, render, shouldCellUpdate), _useCellRender2 = _slicedToArray(_useCellRender, 2), childNode = _useCellRender2[0], legacyCellProps = _useCellRender2[1];
  var fixedStyle = {};
  var isFixLeft = typeof fixLeft === "number" && supportSticky;
  var isFixRight = typeof fixRight === "number" && supportSticky;
  if (isFixLeft) {
    fixedStyle.position = "sticky";
    fixedStyle.left = fixLeft;
  }
  if (isFixRight) {
    fixedStyle.position = "sticky";
    fixedStyle.right = fixRight;
  }
  var mergedColSpan = (_ref2 = (_ref3 = (_legacyCellProps$colS = legacyCellProps === null || legacyCellProps === void 0 ? void 0 : legacyCellProps.colSpan) !== null && _legacyCellProps$colS !== void 0 ? _legacyCellProps$colS : additionalProps.colSpan) !== null && _ref3 !== void 0 ? _ref3 : colSpan) !== null && _ref2 !== void 0 ? _ref2 : 1;
  var mergedRowSpan = (_ref4 = (_ref5 = (_legacyCellProps$rowS = legacyCellProps === null || legacyCellProps === void 0 ? void 0 : legacyCellProps.rowSpan) !== null && _legacyCellProps$rowS !== void 0 ? _legacyCellProps$rowS : additionalProps.rowSpan) !== null && _ref5 !== void 0 ? _ref5 : rowSpan) !== null && _ref4 !== void 0 ? _ref4 : 1;
  var _useHoverState = useHoverState(index, mergedRowSpan), _useHoverState2 = _slicedToArray(_useHoverState, 2), hovering = _useHoverState2[0], onHover = _useHoverState2[1];
  var onMouseEnter = useEvent(function(event) {
    var _additionalProps$onMo;
    if (record) {
      onHover(index, index + mergedRowSpan - 1);
    }
    additionalProps === null || additionalProps === void 0 || (_additionalProps$onMo = additionalProps.onMouseEnter) === null || _additionalProps$onMo === void 0 || _additionalProps$onMo.call(additionalProps, event);
  });
  var onMouseLeave = useEvent(function(event) {
    var _additionalProps$onMo2;
    if (record) {
      onHover(-1, -1);
    }
    additionalProps === null || additionalProps === void 0 || (_additionalProps$onMo2 = additionalProps.onMouseLeave) === null || _additionalProps$onMo2 === void 0 || _additionalProps$onMo2.call(additionalProps, event);
  });
  if (mergedColSpan === 0 || mergedRowSpan === 0) {
    return null;
  }
  var title2 = (_additionalProps$titl = additionalProps.title) !== null && _additionalProps$titl !== void 0 ? _additionalProps$titl : getTitleFromCellRenderChildren({
    rowType,
    ellipsis,
    children: childNode
  });
  var mergedClassName = classNames(cellPrefixCls, className, (_classNames = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_classNames, "".concat(cellPrefixCls, "-fix-left"), isFixLeft && supportSticky), "".concat(cellPrefixCls, "-fix-left-first"), firstFixLeft && supportSticky), "".concat(cellPrefixCls, "-fix-left-last"), lastFixLeft && supportSticky), "".concat(cellPrefixCls, "-fix-left-all"), lastFixLeft && allColumnsFixedLeft && supportSticky), "".concat(cellPrefixCls, "-fix-right"), isFixRight && supportSticky), "".concat(cellPrefixCls, "-fix-right-first"), firstFixRight && supportSticky), "".concat(cellPrefixCls, "-fix-right-last"), lastFixRight && supportSticky), "".concat(cellPrefixCls, "-ellipsis"), ellipsis), "".concat(cellPrefixCls, "-with-append"), appendNode), "".concat(cellPrefixCls, "-fix-sticky"), (isFixLeft || isFixRight) && isSticky && supportSticky), _defineProperty(_classNames, "".concat(cellPrefixCls, "-row-hover"), !legacyCellProps && hovering)), additionalProps.className, legacyCellProps === null || legacyCellProps === void 0 ? void 0 : legacyCellProps.className);
  var alignStyle = {};
  if (align) {
    alignStyle.textAlign = align;
  }
  var mergedStyle = _objectSpread2(_objectSpread2(_objectSpread2(_objectSpread2({}, legacyCellProps === null || legacyCellProps === void 0 ? void 0 : legacyCellProps.style), fixedStyle), alignStyle), additionalProps.style);
  var mergedChildNode = childNode;
  if (_typeof(mergedChildNode) === "object" && !Array.isArray(mergedChildNode) && !/* @__PURE__ */ reactExports.isValidElement(mergedChildNode)) {
    mergedChildNode = null;
  }
  if (ellipsis && (lastFixLeft || firstFixRight)) {
    mergedChildNode = /* @__PURE__ */ reactExports.createElement("span", {
      className: "".concat(cellPrefixCls, "-content")
    }, mergedChildNode);
  }
  return /* @__PURE__ */ reactExports.createElement(Component, _extends({}, legacyCellProps, additionalProps, {
    className: mergedClassName,
    style: mergedStyle,
    title: title2,
    scope,
    onMouseEnter: rowHoverable ? onMouseEnter : void 0,
    onMouseLeave: rowHoverable ? onMouseLeave : void 0,
    colSpan: mergedColSpan !== 1 ? mergedColSpan : null,
    rowSpan: mergedRowSpan !== 1 ? mergedRowSpan : null
  }), appendNode, mergedChildNode);
}
const Cell$1 = /* @__PURE__ */ reactExports.memo(Cell);
function getCellFixedInfo(colStart, colEnd, columns, stickyOffsets, direction) {
  var startColumn = columns[colStart] || {};
  var endColumn = columns[colEnd] || {};
  var fixLeft;
  var fixRight;
  if (startColumn.fixed === "left") {
    fixLeft = stickyOffsets.left[direction === "rtl" ? colEnd : colStart];
  } else if (endColumn.fixed === "right") {
    fixRight = stickyOffsets.right[direction === "rtl" ? colStart : colEnd];
  }
  var lastFixLeft = false;
  var firstFixRight = false;
  var lastFixRight = false;
  var firstFixLeft = false;
  var nextColumn = columns[colEnd + 1];
  var prevColumn = columns[colStart - 1];
  var canLastFix = nextColumn && !nextColumn.fixed || prevColumn && !prevColumn.fixed || columns.every(function(col) {
    return col.fixed === "left";
  });
  if (direction === "rtl") {
    if (fixLeft !== void 0) {
      var prevFixLeft = prevColumn && prevColumn.fixed === "left";
      firstFixLeft = !prevFixLeft && canLastFix;
    } else if (fixRight !== void 0) {
      var nextFixRight = nextColumn && nextColumn.fixed === "right";
      lastFixRight = !nextFixRight && canLastFix;
    }
  } else if (fixLeft !== void 0) {
    var nextFixLeft = nextColumn && nextColumn.fixed === "left";
    lastFixLeft = !nextFixLeft && canLastFix;
  } else if (fixRight !== void 0) {
    var prevFixRight = prevColumn && prevColumn.fixed === "right";
    firstFixRight = !prevFixRight && canLastFix;
  }
  return {
    fixLeft,
    fixRight,
    lastFixLeft,
    firstFixRight,
    lastFixRight,
    firstFixLeft,
    isSticky: stickyOffsets.isSticky
  };
}
var SummaryContext = /* @__PURE__ */ reactExports.createContext({});
function SummaryCell(_ref) {
  var className = _ref.className, index = _ref.index, children = _ref.children, _ref$colSpan = _ref.colSpan, colSpan = _ref$colSpan === void 0 ? 1 : _ref$colSpan, rowSpan = _ref.rowSpan, align = _ref.align;
  var _useContext = useContext(TableContext, ["prefixCls", "direction"]), prefixCls = _useContext.prefixCls, direction = _useContext.direction;
  var _React$useContext = reactExports.useContext(SummaryContext), scrollColumnIndex = _React$useContext.scrollColumnIndex, stickyOffsets = _React$useContext.stickyOffsets, flattenColumns = _React$useContext.flattenColumns;
  var lastIndex = index + colSpan - 1;
  var mergedColSpan = lastIndex + 1 === scrollColumnIndex ? colSpan + 1 : colSpan;
  var fixedInfo = getCellFixedInfo(index, index + mergedColSpan - 1, flattenColumns, stickyOffsets, direction);
  return /* @__PURE__ */ reactExports.createElement(Cell$1, _extends({
    className,
    index,
    component: "td",
    prefixCls,
    record: null,
    dataIndex: null,
    align,
    colSpan: mergedColSpan,
    rowSpan,
    render: function render() {
      return children;
    }
  }, fixedInfo));
}
var _excluded$8 = ["children"];
function FooterRow(_ref) {
  var children = _ref.children, props = _objectWithoutProperties(_ref, _excluded$8);
  return /* @__PURE__ */ reactExports.createElement("tr", props, children);
}
function Summary(_ref) {
  var children = _ref.children;
  return children;
}
Summary.Row = FooterRow;
Summary.Cell = SummaryCell;
function Footer(props) {
  var children = props.children, stickyOffsets = props.stickyOffsets, flattenColumns = props.flattenColumns;
  var prefixCls = useContext(TableContext, "prefixCls");
  var lastColumnIndex = flattenColumns.length - 1;
  var scrollColumn = flattenColumns[lastColumnIndex];
  var summaryContext = reactExports.useMemo(function() {
    return {
      stickyOffsets,
      flattenColumns,
      scrollColumnIndex: scrollColumn !== null && scrollColumn !== void 0 && scrollColumn.scrollbar ? lastColumnIndex : null
    };
  }, [scrollColumn, flattenColumns, lastColumnIndex, stickyOffsets]);
  return /* @__PURE__ */ reactExports.createElement(SummaryContext.Provider, {
    value: summaryContext
  }, /* @__PURE__ */ reactExports.createElement("tfoot", {
    className: "".concat(prefixCls, "-summary")
  }, children));
}
const Footer$1 = responseImmutable(Footer);
var FooterComponents = Summary;
function Column$1(_) {
  return null;
}
function ColumnGroup$1(_) {
  return null;
}
function fillRecords(list, record, indent, childrenColumnName, expandedKeys, getRowKey, index) {
  var key = getRowKey(record, index);
  list.push({
    record,
    indent,
    index,
    rowKey: key
  });
  var expanded = expandedKeys === null || expandedKeys === void 0 ? void 0 : expandedKeys.has(key);
  if (record && Array.isArray(record[childrenColumnName]) && expanded) {
    for (var i = 0; i < record[childrenColumnName].length; i += 1) {
      fillRecords(list, record[childrenColumnName][i], indent + 1, childrenColumnName, expandedKeys, getRowKey, i);
    }
  }
}
function useFlattenRecords(data, childrenColumnName, expandedKeys, getRowKey) {
  var arr = reactExports.useMemo(function() {
    if (expandedKeys !== null && expandedKeys !== void 0 && expandedKeys.size) {
      var list = [];
      for (var i = 0; i < (data === null || data === void 0 ? void 0 : data.length); i += 1) {
        var record = data[i];
        fillRecords(list, record, 0, childrenColumnName, expandedKeys, getRowKey, i);
      }
      return list;
    }
    return data === null || data === void 0 ? void 0 : data.map(function(item, index) {
      return {
        record: item,
        indent: 0,
        index,
        rowKey: getRowKey(item, index)
      };
    });
  }, [data, childrenColumnName, expandedKeys, getRowKey]);
  return arr;
}
function useRowInfo(record, rowKey, recordIndex, indent) {
  var context = useContext(TableContext, ["prefixCls", "fixedInfoList", "flattenColumns", "expandableType", "expandRowByClick", "onTriggerExpand", "rowClassName", "expandedRowClassName", "indentSize", "expandIcon", "expandedRowRender", "expandIconColumnIndex", "expandedKeys", "childrenColumnName", "rowExpandable", "onRow"]);
  var flattenColumns = context.flattenColumns, expandableType = context.expandableType, expandedKeys = context.expandedKeys, childrenColumnName = context.childrenColumnName, onTriggerExpand = context.onTriggerExpand, rowExpandable = context.rowExpandable, onRow = context.onRow, expandRowByClick = context.expandRowByClick, rowClassName = context.rowClassName;
  var nestExpandable = expandableType === "nest";
  var rowSupportExpand = expandableType === "row" && (!rowExpandable || rowExpandable(record));
  var mergedExpandable = rowSupportExpand || nestExpandable;
  var expanded = expandedKeys && expandedKeys.has(rowKey);
  var hasNestChildren = childrenColumnName && record && record[childrenColumnName];
  var onInternalTriggerExpand = useEvent(onTriggerExpand);
  var rowProps = onRow === null || onRow === void 0 ? void 0 : onRow(record, recordIndex);
  var onRowClick = rowProps === null || rowProps === void 0 ? void 0 : rowProps.onClick;
  var onClick = function onClick2(event) {
    if (expandRowByClick && mergedExpandable) {
      onTriggerExpand(record, event);
    }
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }
    onRowClick === null || onRowClick === void 0 || onRowClick.apply(void 0, [event].concat(args));
  };
  var computeRowClassName;
  if (typeof rowClassName === "string") {
    computeRowClassName = rowClassName;
  } else if (typeof rowClassName === "function") {
    computeRowClassName = rowClassName(record, recordIndex, indent);
  }
  var columnsKey = getColumnsKey(flattenColumns);
  return _objectSpread2(_objectSpread2({}, context), {}, {
    columnsKey,
    nestExpandable,
    expanded,
    hasNestChildren,
    record,
    onTriggerExpand: onInternalTriggerExpand,
    rowSupportExpand,
    expandable: mergedExpandable,
    rowProps: _objectSpread2(_objectSpread2({}, rowProps), {}, {
      className: classNames(computeRowClassName, rowProps === null || rowProps === void 0 ? void 0 : rowProps.className),
      onClick
    })
  });
}
function ExpandedRow(props) {
  var prefixCls = props.prefixCls, children = props.children, Component = props.component, cellComponent = props.cellComponent, className = props.className, expanded = props.expanded, colSpan = props.colSpan, isEmpty = props.isEmpty, _props$stickyOffset = props.stickyOffset, stickyOffset = _props$stickyOffset === void 0 ? 0 : _props$stickyOffset;
  var _useContext = useContext(TableContext, ["scrollbarSize", "fixHeader", "fixColumn", "componentWidth", "horizonScroll"]), scrollbarSize = _useContext.scrollbarSize, fixHeader = _useContext.fixHeader, fixColumn = _useContext.fixColumn, componentWidth = _useContext.componentWidth, horizonScroll = _useContext.horizonScroll;
  var contentNode = children;
  if (isEmpty ? horizonScroll && componentWidth : fixColumn) {
    contentNode = /* @__PURE__ */ reactExports.createElement("div", {
      style: {
        width: componentWidth - stickyOffset - (fixHeader && !isEmpty ? scrollbarSize : 0),
        position: "sticky",
        left: stickyOffset,
        overflow: "hidden"
      },
      className: "".concat(prefixCls, "-expanded-row-fixed")
    }, contentNode);
  }
  return /* @__PURE__ */ reactExports.createElement(Component, {
    className,
    style: {
      display: expanded ? null : "none"
    }
  }, /* @__PURE__ */ reactExports.createElement(Cell$1, {
    component: cellComponent,
    prefixCls,
    colSpan
  }, contentNode));
}
function renderExpandIcon$1(_ref) {
  var prefixCls = _ref.prefixCls, record = _ref.record, onExpand = _ref.onExpand, expanded = _ref.expanded, expandable = _ref.expandable;
  var expandClassName = "".concat(prefixCls, "-row-expand-icon");
  if (!expandable) {
    return /* @__PURE__ */ reactExports.createElement("span", {
      className: classNames(expandClassName, "".concat(prefixCls, "-row-spaced"))
    });
  }
  var onClick = function onClick2(event) {
    onExpand(record, event);
    event.stopPropagation();
  };
  return /* @__PURE__ */ reactExports.createElement("span", {
    className: classNames(expandClassName, _defineProperty(_defineProperty({}, "".concat(prefixCls, "-row-expanded"), expanded), "".concat(prefixCls, "-row-collapsed"), !expanded)),
    onClick
  });
}
function findAllChildrenKeys(data, getRowKey, childrenColumnName) {
  var keys = [];
  function dig(list) {
    (list || []).forEach(function(item, index) {
      keys.push(getRowKey(item, index));
      dig(item[childrenColumnName]);
    });
  }
  dig(data);
  return keys;
}
function computedExpandedClassName(cls, record, index, indent) {
  if (typeof cls === "string") {
    return cls;
  }
  if (typeof cls === "function") {
    return cls(record, index, indent);
  }
  return "";
}
function getCellProps(rowInfo, column, colIndex, indent, index) {
  var _column$onCell;
  var rowKeys = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : [];
  var expandedRowOffset = arguments.length > 6 && arguments[6] !== void 0 ? arguments[6] : 0;
  var record = rowInfo.record, prefixCls = rowInfo.prefixCls, columnsKey = rowInfo.columnsKey, fixedInfoList = rowInfo.fixedInfoList, expandIconColumnIndex = rowInfo.expandIconColumnIndex, nestExpandable = rowInfo.nestExpandable, indentSize = rowInfo.indentSize, expandIcon = rowInfo.expandIcon, expanded = rowInfo.expanded, hasNestChildren = rowInfo.hasNestChildren, onTriggerExpand = rowInfo.onTriggerExpand, expandable = rowInfo.expandable, expandedKeys = rowInfo.expandedKeys;
  var key = columnsKey[colIndex];
  var fixedInfo = fixedInfoList[colIndex];
  var appendCellNode;
  if (colIndex === (expandIconColumnIndex || 0) && nestExpandable) {
    appendCellNode = /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement("span", {
      style: {
        paddingLeft: "".concat(indentSize * indent, "px")
      },
      className: "".concat(prefixCls, "-row-indent indent-level-").concat(indent)
    }), expandIcon({
      prefixCls,
      expanded,
      expandable: hasNestChildren,
      record,
      onExpand: onTriggerExpand
    }));
  }
  var additionalCellProps = ((_column$onCell = column.onCell) === null || _column$onCell === void 0 ? void 0 : _column$onCell.call(column, record, index)) || {};
  if (expandedRowOffset) {
    var _additionalCellProps$ = additionalCellProps.rowSpan, rowSpan = _additionalCellProps$ === void 0 ? 1 : _additionalCellProps$;
    if (expandable && rowSpan && colIndex < expandedRowOffset) {
      var currentRowSpan = rowSpan;
      for (var i = index; i < index + rowSpan; i += 1) {
        var rowKey = rowKeys[i];
        if (expandedKeys.has(rowKey)) {
          currentRowSpan += 1;
        }
      }
      additionalCellProps.rowSpan = currentRowSpan;
    }
  }
  return {
    key,
    fixedInfo,
    appendCellNode,
    additionalCellProps
  };
}
function BodyRow(props) {
  var className = props.className, style = props.style, record = props.record, index = props.index, renderIndex = props.renderIndex, rowKey = props.rowKey, rowKeys = props.rowKeys, _props$indent = props.indent, indent = _props$indent === void 0 ? 0 : _props$indent, RowComponent = props.rowComponent, cellComponent = props.cellComponent, scopeCellComponent = props.scopeCellComponent, expandedRowInfo = props.expandedRowInfo;
  var rowInfo = useRowInfo(record, rowKey, index, indent);
  var prefixCls = rowInfo.prefixCls, flattenColumns = rowInfo.flattenColumns, expandedRowClassName = rowInfo.expandedRowClassName, expandedRowRender = rowInfo.expandedRowRender, rowProps = rowInfo.rowProps, expanded = rowInfo.expanded, rowSupportExpand = rowInfo.rowSupportExpand;
  var expandedRef = reactExports.useRef(false);
  expandedRef.current || (expandedRef.current = expanded);
  var expandedClsName = computedExpandedClassName(expandedRowClassName, record, index, indent);
  var baseRowNode = /* @__PURE__ */ reactExports.createElement(RowComponent, _extends({}, rowProps, {
    "data-row-key": rowKey,
    className: classNames(className, "".concat(prefixCls, "-row"), "".concat(prefixCls, "-row-level-").concat(indent), rowProps === null || rowProps === void 0 ? void 0 : rowProps.className, _defineProperty({}, expandedClsName, indent >= 1)),
    style: _objectSpread2(_objectSpread2({}, style), rowProps === null || rowProps === void 0 ? void 0 : rowProps.style)
  }), flattenColumns.map(function(column, colIndex) {
    var render = column.render, dataIndex = column.dataIndex, columnClassName = column.className;
    var _getCellProps = getCellProps(rowInfo, column, colIndex, indent, index, rowKeys, expandedRowInfo === null || expandedRowInfo === void 0 ? void 0 : expandedRowInfo.offset), key = _getCellProps.key, fixedInfo = _getCellProps.fixedInfo, appendCellNode = _getCellProps.appendCellNode, additionalCellProps = _getCellProps.additionalCellProps;
    return /* @__PURE__ */ reactExports.createElement(Cell$1, _extends({
      className: columnClassName,
      ellipsis: column.ellipsis,
      align: column.align,
      scope: column.rowScope,
      component: column.rowScope ? scopeCellComponent : cellComponent,
      prefixCls,
      key,
      record,
      index,
      renderIndex,
      dataIndex,
      render,
      shouldCellUpdate: column.shouldCellUpdate
    }, fixedInfo, {
      appendNode: appendCellNode,
      additionalProps: additionalCellProps
    }));
  }));
  var expandRowNode;
  if (rowSupportExpand && (expandedRef.current || expanded)) {
    var expandContent = expandedRowRender(record, index, indent + 1, expanded);
    expandRowNode = /* @__PURE__ */ reactExports.createElement(ExpandedRow, {
      expanded,
      className: classNames("".concat(prefixCls, "-expanded-row"), "".concat(prefixCls, "-expanded-row-level-").concat(indent + 1), expandedClsName),
      prefixCls,
      component: RowComponent,
      cellComponent,
      colSpan: expandedRowInfo ? expandedRowInfo.colSpan : flattenColumns.length,
      stickyOffset: expandedRowInfo === null || expandedRowInfo === void 0 ? void 0 : expandedRowInfo.sticky,
      isEmpty: false
    }, expandContent);
  }
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, baseRowNode, expandRowNode);
}
const BodyRow$1 = responseImmutable(BodyRow);
function MeasureCell(_ref) {
  var columnKey = _ref.columnKey, onColumnResize = _ref.onColumnResize, prefixCls = _ref.prefixCls, title2 = _ref.title;
  var cellRef = reactExports.useRef();
  useLayoutEffect(function() {
    if (cellRef.current) {
      onColumnResize(columnKey, cellRef.current.offsetWidth);
    }
  }, []);
  return /* @__PURE__ */ reactExports.createElement(RefResizeObserver, {
    data: columnKey
  }, /* @__PURE__ */ reactExports.createElement("th", {
    ref: cellRef,
    className: "".concat(prefixCls, "-measure-cell")
  }, /* @__PURE__ */ reactExports.createElement("div", {
    className: "".concat(prefixCls, "-measure-cell-content")
  }, title2 || " ")));
}
function MeasureRow(_ref) {
  var prefixCls = _ref.prefixCls, columnsKey = _ref.columnsKey, onColumnResize = _ref.onColumnResize, columns = _ref.columns;
  var ref = reactExports.useRef(null);
  var _useContext = useContext(TableContext, ["measureRowRender"]), measureRowRender = _useContext.measureRowRender;
  var measureRow = /* @__PURE__ */ reactExports.createElement("tr", {
    "aria-hidden": "true",
    className: "".concat(prefixCls, "-measure-row"),
    ref,
    tabIndex: -1
  }, /* @__PURE__ */ reactExports.createElement(RefResizeObserver.Collection, {
    onBatchResize: function onBatchResize(infoList) {
      if (isVisible(ref.current)) {
        infoList.forEach(function(_ref2) {
          var columnKey = _ref2.data, size = _ref2.size;
          onColumnResize(columnKey, size.offsetWidth);
        });
      }
    }
  }, columnsKey.map(function(columnKey) {
    var column = columns.find(function(col) {
      return col.key === columnKey;
    });
    var rawTitle = column === null || column === void 0 ? void 0 : column.title;
    var titleForMeasure = /* @__PURE__ */ reactExports.isValidElement(rawTitle) ? /* @__PURE__ */ reactExports.cloneElement(rawTitle, {
      ref: null
    }) : rawTitle;
    return /* @__PURE__ */ reactExports.createElement(MeasureCell, {
      prefixCls,
      key: columnKey,
      columnKey,
      onColumnResize,
      title: titleForMeasure
    });
  })));
  return measureRowRender ? measureRowRender(measureRow) : measureRow;
}
function Body(props) {
  var data = props.data, measureColumnWidth = props.measureColumnWidth;
  var _useContext = useContext(TableContext, ["prefixCls", "getComponent", "onColumnResize", "flattenColumns", "getRowKey", "expandedKeys", "childrenColumnName", "emptyNode", "expandedRowOffset", "fixedInfoList", "colWidths"]), prefixCls = _useContext.prefixCls, getComponent = _useContext.getComponent, onColumnResize = _useContext.onColumnResize, flattenColumns = _useContext.flattenColumns, getRowKey = _useContext.getRowKey, expandedKeys = _useContext.expandedKeys, childrenColumnName = _useContext.childrenColumnName, emptyNode = _useContext.emptyNode, _useContext$expandedR = _useContext.expandedRowOffset, expandedRowOffset = _useContext$expandedR === void 0 ? 0 : _useContext$expandedR, colWidths = _useContext.colWidths;
  var flattenData2 = useFlattenRecords(data, childrenColumnName, expandedKeys, getRowKey);
  var rowKeys = reactExports.useMemo(function() {
    return flattenData2.map(function(item) {
      return item.rowKey;
    });
  }, [flattenData2]);
  var perfRef = reactExports.useRef({
    renderWithProps: false
  });
  var expandedRowInfo = reactExports.useMemo(function() {
    var expandedColSpan = flattenColumns.length - expandedRowOffset;
    var expandedStickyStart = 0;
    for (var i = 0; i < expandedRowOffset; i += 1) {
      expandedStickyStart += colWidths[i] || 0;
    }
    return {
      offset: expandedRowOffset,
      colSpan: expandedColSpan,
      sticky: expandedStickyStart
    };
  }, [flattenColumns.length, expandedRowOffset, colWidths]);
  var WrapperComponent = getComponent(["body", "wrapper"], "tbody");
  var trComponent = getComponent(["body", "row"], "tr");
  var tdComponent = getComponent(["body", "cell"], "td");
  var thComponent = getComponent(["body", "cell"], "th");
  var rows;
  if (data.length) {
    rows = flattenData2.map(function(item, idx) {
      var record = item.record, indent = item.indent, renderIndex = item.index, rowKey = item.rowKey;
      return /* @__PURE__ */ reactExports.createElement(BodyRow$1, {
        key: rowKey,
        rowKey,
        rowKeys,
        record,
        index: idx,
        renderIndex,
        rowComponent: trComponent,
        cellComponent: tdComponent,
        scopeCellComponent: thComponent,
        indent,
        expandedRowInfo
      });
    });
  } else {
    rows = /* @__PURE__ */ reactExports.createElement(ExpandedRow, {
      expanded: true,
      className: "".concat(prefixCls, "-placeholder"),
      prefixCls,
      component: trComponent,
      cellComponent: tdComponent,
      colSpan: flattenColumns.length,
      isEmpty: true
    }, emptyNode);
  }
  var columnsKey = getColumnsKey(flattenColumns);
  return /* @__PURE__ */ reactExports.createElement(PerfContext.Provider, {
    value: perfRef.current
  }, /* @__PURE__ */ reactExports.createElement(WrapperComponent, {
    className: "".concat(prefixCls, "-tbody")
  }, measureColumnWidth && /* @__PURE__ */ reactExports.createElement(MeasureRow, {
    prefixCls,
    columnsKey,
    onColumnResize,
    columns: flattenColumns
  }), rows));
}
const Body$1 = responseImmutable(Body);
var _excluded$7 = ["expandable"];
var INTERNAL_COL_DEFINE = "RC_TABLE_INTERNAL_COL_DEFINE";
function getExpandableProps(props) {
  var expandable = props.expandable, legacyExpandableConfig = _objectWithoutProperties(props, _excluded$7);
  var config;
  if ("expandable" in props) {
    config = _objectSpread2(_objectSpread2({}, legacyExpandableConfig), expandable);
  } else {
    config = legacyExpandableConfig;
  }
  if (config.showExpandColumn === false) {
    config.expandIconColumnIndex = -1;
  }
  return config;
}
var _excluded$6 = ["columnType"];
function ColGroup(_ref) {
  var colWidths = _ref.colWidths, columns = _ref.columns, columCount = _ref.columCount;
  var _useContext = useContext(TableContext, ["tableLayout"]), tableLayout = _useContext.tableLayout;
  var cols = [];
  var len = columCount || columns.length;
  var mustInsert = false;
  for (var i = len - 1; i >= 0; i -= 1) {
    var width = colWidths[i];
    var column = columns && columns[i];
    var additionalProps = void 0;
    var minWidth = void 0;
    if (column) {
      additionalProps = column[INTERNAL_COL_DEFINE];
      if (tableLayout === "auto") {
        minWidth = column.minWidth;
      }
    }
    if (width || minWidth || additionalProps || mustInsert) {
      var _ref2 = additionalProps || {};
      _ref2.columnType;
      var restAdditionalProps = _objectWithoutProperties(_ref2, _excluded$6);
      cols.unshift(/* @__PURE__ */ reactExports.createElement("col", _extends({
        key: i,
        style: {
          width,
          minWidth
        }
      }, restAdditionalProps)));
      mustInsert = true;
    }
  }
  return cols.length > 0 ? /* @__PURE__ */ reactExports.createElement("colgroup", null, cols) : null;
}
var _excluded$5 = ["className", "noData", "columns", "flattenColumns", "colWidths", "colGroup", "columCount", "stickyOffsets", "direction", "fixHeader", "stickyTopOffset", "stickyBottomOffset", "stickyClassName", "scrollX", "tableLayout", "onScroll", "children"];
function useColumnWidth(colWidths, columCount) {
  return reactExports.useMemo(function() {
    var cloneColumns = [];
    for (var i = 0; i < columCount; i += 1) {
      var val = colWidths[i];
      if (val !== void 0) {
        cloneColumns[i] = val;
      } else {
        return null;
      }
    }
    return cloneColumns;
  }, [colWidths.join("_"), columCount]);
}
var FixedHolder = /* @__PURE__ */ reactExports.forwardRef(function(props, ref) {
  var className = props.className, noData = props.noData, columns = props.columns, flattenColumns = props.flattenColumns, colWidths = props.colWidths, colGroup = props.colGroup, columCount = props.columCount, stickyOffsets = props.stickyOffsets, direction = props.direction, fixHeader = props.fixHeader, stickyTopOffset = props.stickyTopOffset, stickyBottomOffset = props.stickyBottomOffset, stickyClassName = props.stickyClassName, scrollX = props.scrollX, _props$tableLayout = props.tableLayout, tableLayout = _props$tableLayout === void 0 ? "fixed" : _props$tableLayout, onScroll = props.onScroll, children = props.children, restProps = _objectWithoutProperties(props, _excluded$5);
  var _useContext = useContext(TableContext, ["prefixCls", "scrollbarSize", "isSticky", "getComponent"]), prefixCls = _useContext.prefixCls, scrollbarSize = _useContext.scrollbarSize, isSticky = _useContext.isSticky, getComponent = _useContext.getComponent;
  var TableComponent = getComponent(["header", "table"], "table");
  var combinationScrollBarSize = isSticky && !fixHeader ? 0 : scrollbarSize;
  var scrollRef = reactExports.useRef(null);
  var setScrollRef = reactExports.useCallback(function(element) {
    fillRef(ref, element);
    fillRef(scrollRef, element);
  }, []);
  reactExports.useEffect(function() {
    function onWheel(e) {
      var _ref = e, currentTarget = _ref.currentTarget, deltaX = _ref.deltaX;
      if (deltaX) {
        onScroll({
          currentTarget,
          scrollLeft: currentTarget.scrollLeft + deltaX
        });
        e.preventDefault();
      }
    }
    var scrollEle = scrollRef.current;
    scrollEle === null || scrollEle === void 0 || scrollEle.addEventListener("wheel", onWheel, {
      passive: false
    });
    return function() {
      scrollEle === null || scrollEle === void 0 || scrollEle.removeEventListener("wheel", onWheel);
    };
  }, []);
  var lastColumn = flattenColumns[flattenColumns.length - 1];
  var ScrollBarColumn = {
    fixed: lastColumn ? lastColumn.fixed : null,
    scrollbar: true,
    onHeaderCell: function onHeaderCell() {
      return {
        className: "".concat(prefixCls, "-cell-scrollbar")
      };
    }
  };
  var columnsWithScrollbar = reactExports.useMemo(function() {
    return combinationScrollBarSize ? [].concat(_toConsumableArray(columns), [ScrollBarColumn]) : columns;
  }, [combinationScrollBarSize, columns]);
  var flattenColumnsWithScrollbar = reactExports.useMemo(function() {
    return combinationScrollBarSize ? [].concat(_toConsumableArray(flattenColumns), [ScrollBarColumn]) : flattenColumns;
  }, [combinationScrollBarSize, flattenColumns]);
  var headerStickyOffsets = reactExports.useMemo(function() {
    var right = stickyOffsets.right, left = stickyOffsets.left;
    return _objectSpread2(_objectSpread2({}, stickyOffsets), {}, {
      left: direction === "rtl" ? [].concat(_toConsumableArray(left.map(function(width) {
        return width + combinationScrollBarSize;
      })), [0]) : left,
      right: direction === "rtl" ? right : [].concat(_toConsumableArray(right.map(function(width) {
        return width + combinationScrollBarSize;
      })), [0]),
      isSticky
    });
  }, [combinationScrollBarSize, stickyOffsets, isSticky]);
  var mergedColumnWidth = useColumnWidth(colWidths, columCount);
  var isColGroupEmpty = reactExports.useMemo(function() {
    var noWidth = !mergedColumnWidth || !mergedColumnWidth.length || mergedColumnWidth.every(function(w) {
      return !w;
    });
    return noData || noWidth;
  }, [noData, mergedColumnWidth]);
  return /* @__PURE__ */ reactExports.createElement("div", {
    style: _objectSpread2({
      overflow: "hidden"
    }, isSticky ? {
      top: stickyTopOffset,
      bottom: stickyBottomOffset
    } : {}),
    ref: setScrollRef,
    className: classNames(className, _defineProperty({}, stickyClassName, !!stickyClassName))
  }, /* @__PURE__ */ reactExports.createElement(TableComponent, {
    style: {
      tableLayout,
      minWidth: "100%",
      // https://github.com/ant-design/ant-design/issues/54894
      width: scrollX
    }
  }, isColGroupEmpty ? colGroup : /* @__PURE__ */ reactExports.createElement(ColGroup, {
    colWidths: [].concat(_toConsumableArray(mergedColumnWidth), [combinationScrollBarSize]),
    columCount: columCount + 1,
    columns: flattenColumnsWithScrollbar
  }), children(_objectSpread2(_objectSpread2({}, restProps), {}, {
    stickyOffsets: headerStickyOffsets,
    columns: columnsWithScrollbar,
    flattenColumns: flattenColumnsWithScrollbar
  }))));
});
const FixedHolder$1 = /* @__PURE__ */ reactExports.memo(FixedHolder);
var HeaderRow = function HeaderRow2(props) {
  var cells = props.cells, stickyOffsets = props.stickyOffsets, flattenColumns = props.flattenColumns, RowComponent = props.rowComponent, CellComponent = props.cellComponent, onHeaderRow = props.onHeaderRow, index = props.index;
  var _useContext = useContext(TableContext, ["prefixCls", "direction"]), prefixCls = _useContext.prefixCls, direction = _useContext.direction;
  var rowProps;
  if (onHeaderRow) {
    rowProps = onHeaderRow(cells.map(function(cell) {
      return cell.column;
    }), index);
  }
  var columnsKey = getColumnsKey(cells.map(function(cell) {
    return cell.column;
  }));
  return /* @__PURE__ */ reactExports.createElement(RowComponent, rowProps, cells.map(function(cell, cellIndex) {
    var column = cell.column;
    var fixedInfo = getCellFixedInfo(cell.colStart, cell.colEnd, flattenColumns, stickyOffsets, direction);
    var additionalProps;
    if (column && column.onHeaderCell) {
      additionalProps = cell.column.onHeaderCell(column);
    }
    return /* @__PURE__ */ reactExports.createElement(Cell$1, _extends({}, cell, {
      scope: column.title ? cell.colSpan > 1 ? "colgroup" : "col" : null,
      ellipsis: column.ellipsis,
      align: column.align,
      component: CellComponent,
      prefixCls,
      key: columnsKey[cellIndex]
    }, fixedInfo, {
      additionalProps,
      rowType: "header"
    }));
  }));
};
function parseHeaderRows(rootColumns) {
  var rows = [];
  function fillRowCells(columns, colIndex) {
    var rowIndex2 = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 0;
    rows[rowIndex2] = rows[rowIndex2] || [];
    var currentColIndex = colIndex;
    var colSpans = columns.filter(Boolean).map(function(column) {
      var cell = {
        key: column.key,
        className: column.className || "",
        children: column.title,
        column,
        colStart: currentColIndex
      };
      var colSpan = 1;
      var subColumns = column.children;
      if (subColumns && subColumns.length > 0) {
        colSpan = fillRowCells(subColumns, currentColIndex, rowIndex2 + 1).reduce(function(total, count) {
          return total + count;
        }, 0);
        cell.hasSubColumns = true;
      }
      if ("colSpan" in column) {
        colSpan = column.colSpan;
      }
      if ("rowSpan" in column) {
        cell.rowSpan = column.rowSpan;
      }
      cell.colSpan = colSpan;
      cell.colEnd = cell.colStart + colSpan - 1;
      rows[rowIndex2].push(cell);
      currentColIndex += colSpan;
      return colSpan;
    });
    return colSpans;
  }
  fillRowCells(rootColumns, 0);
  var rowCount = rows.length;
  var _loop = function _loop2(rowIndex2) {
    rows[rowIndex2].forEach(function(cell) {
      if (!("rowSpan" in cell) && !cell.hasSubColumns) {
        cell.rowSpan = rowCount - rowIndex2;
      }
    });
  };
  for (var rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    _loop(rowIndex);
  }
  return rows;
}
var Header = function Header2(props) {
  var stickyOffsets = props.stickyOffsets, columns = props.columns, flattenColumns = props.flattenColumns, onHeaderRow = props.onHeaderRow;
  var _useContext = useContext(TableContext, ["prefixCls", "getComponent"]), prefixCls = _useContext.prefixCls, getComponent = _useContext.getComponent;
  var rows = reactExports.useMemo(function() {
    return parseHeaderRows(columns);
  }, [columns]);
  var WrapperComponent = getComponent(["header", "wrapper"], "thead");
  var trComponent = getComponent(["header", "row"], "tr");
  var thComponent = getComponent(["header", "cell"], "th");
  return /* @__PURE__ */ reactExports.createElement(WrapperComponent, {
    className: "".concat(prefixCls, "-thead")
  }, rows.map(function(row2, rowIndex) {
    var rowNode = /* @__PURE__ */ reactExports.createElement(HeaderRow, {
      key: rowIndex,
      flattenColumns,
      cells: row2,
      stickyOffsets,
      rowComponent: trComponent,
      cellComponent: thComponent,
      onHeaderRow,
      index: rowIndex
    });
    return rowNode;
  }));
};
const Header$1 = responseImmutable(Header);
function parseColWidth(totalWidth) {
  var width = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
  if (typeof width === "number") {
    return width;
  }
  if (width.endsWith("%")) {
    return totalWidth * parseFloat(width) / 100;
  }
  return null;
}
function useWidthColumns(flattenColumns, scrollWidth, clientWidth) {
  return reactExports.useMemo(function() {
    if (scrollWidth && scrollWidth > 0) {
      var totalWidth = 0;
      var missWidthCount = 0;
      flattenColumns.forEach(function(col) {
        var colWidth = parseColWidth(scrollWidth, col.width);
        if (colWidth) {
          totalWidth += colWidth;
        } else {
          missWidthCount += 1;
        }
      });
      var maxFitWidth = Math.max(scrollWidth, clientWidth);
      var restWidth = Math.max(maxFitWidth - totalWidth, missWidthCount);
      var restCount = missWidthCount;
      var avgWidth = restWidth / missWidthCount;
      var realTotal = 0;
      var filledColumns = flattenColumns.map(function(col) {
        var clone = _objectSpread2({}, col);
        var colWidth = parseColWidth(scrollWidth, clone.width);
        if (colWidth) {
          clone.width = colWidth;
        } else {
          var colAvgWidth = Math.floor(avgWidth);
          clone.width = restCount === 1 ? restWidth : colAvgWidth;
          restWidth -= colAvgWidth;
          restCount -= 1;
        }
        realTotal += clone.width;
        return clone;
      });
      if (realTotal < maxFitWidth) {
        var scale = maxFitWidth / realTotal;
        restWidth = maxFitWidth;
        filledColumns.forEach(function(col, index) {
          var colWidth = Math.floor(col.width * scale);
          col.width = index === filledColumns.length - 1 ? restWidth : colWidth;
          restWidth -= colWidth;
        });
      }
      return [filledColumns, Math.max(realTotal, maxFitWidth)];
    }
    return [flattenColumns, scrollWidth];
  }, [flattenColumns, scrollWidth, clientWidth]);
}
var _excluded$4 = ["children"], _excluded2 = ["fixed"];
function convertChildrenToColumns(children) {
  return toArray$1(children).filter(function(node) {
    return /* @__PURE__ */ reactExports.isValidElement(node);
  }).map(function(_ref) {
    var key = _ref.key, props = _ref.props;
    var nodeChildren = props.children, restProps = _objectWithoutProperties(props, _excluded$4);
    var column = _objectSpread2({
      key
    }, restProps);
    if (nodeChildren) {
      column.children = convertChildrenToColumns(nodeChildren);
    }
    return column;
  });
}
function filterHiddenColumns(columns) {
  return columns.filter(function(column) {
    return column && _typeof(column) === "object" && !column.hidden;
  }).map(function(column) {
    var subColumns = column.children;
    if (subColumns && subColumns.length > 0) {
      return _objectSpread2(_objectSpread2({}, column), {}, {
        children: filterHiddenColumns(subColumns)
      });
    }
    return column;
  });
}
function flatColumns(columns) {
  var parentKey = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "key";
  return columns.filter(function(column) {
    return column && _typeof(column) === "object";
  }).reduce(function(list, column, index) {
    var fixed = column.fixed;
    var parsedFixed = fixed === true ? "left" : fixed;
    var mergedKey = "".concat(parentKey, "-").concat(index);
    var subColumns = column.children;
    if (subColumns && subColumns.length > 0) {
      return [].concat(_toConsumableArray(list), _toConsumableArray(flatColumns(subColumns, mergedKey).map(function(subColum) {
        var _subColum$fixed;
        return _objectSpread2(_objectSpread2({}, subColum), {}, {
          fixed: (_subColum$fixed = subColum.fixed) !== null && _subColum$fixed !== void 0 ? _subColum$fixed : parsedFixed
        });
      })));
    }
    return [].concat(_toConsumableArray(list), [_objectSpread2(_objectSpread2({
      key: mergedKey
    }, column), {}, {
      fixed: parsedFixed
    })]);
  }, []);
}
function revertForRtl(columns) {
  return columns.map(function(column) {
    var fixed = column.fixed, restProps = _objectWithoutProperties(column, _excluded2);
    var parsedFixed = fixed;
    if (fixed === "left") {
      parsedFixed = "right";
    } else if (fixed === "right") {
      parsedFixed = "left";
    }
    return _objectSpread2({
      fixed: parsedFixed
    }, restProps);
  });
}
function useColumns(_ref2, transformColumns) {
  var prefixCls = _ref2.prefixCls, columns = _ref2.columns, children = _ref2.children, expandable = _ref2.expandable, expandedKeys = _ref2.expandedKeys, columnTitle = _ref2.columnTitle, getRowKey = _ref2.getRowKey, onTriggerExpand = _ref2.onTriggerExpand, expandIcon = _ref2.expandIcon, rowExpandable = _ref2.rowExpandable, expandIconColumnIndex = _ref2.expandIconColumnIndex, _ref2$expandedRowOffs = _ref2.expandedRowOffset, expandedRowOffset = _ref2$expandedRowOffs === void 0 ? 0 : _ref2$expandedRowOffs, direction = _ref2.direction, expandRowByClick = _ref2.expandRowByClick, columnWidth = _ref2.columnWidth, fixed = _ref2.fixed, scrollWidth = _ref2.scrollWidth, clientWidth = _ref2.clientWidth;
  var baseColumns = reactExports.useMemo(function() {
    var newColumns = columns || convertChildrenToColumns(children) || [];
    return filterHiddenColumns(newColumns.slice());
  }, [columns, children]);
  var withExpandColumns = reactExports.useMemo(function() {
    if (expandable) {
      var cloneColumns = baseColumns.slice();
      if (!cloneColumns.includes(EXPAND_COLUMN)) {
        var expandColIndex = expandIconColumnIndex || 0;
        var insertIndex = expandColIndex === 0 && fixed === "right" ? baseColumns.length : expandColIndex;
        if (insertIndex >= 0) {
          cloneColumns.splice(insertIndex, 0, EXPAND_COLUMN);
        }
      }
      var expandColumnIndex = cloneColumns.indexOf(EXPAND_COLUMN);
      cloneColumns = cloneColumns.filter(function(column, index) {
        return column !== EXPAND_COLUMN || index === expandColumnIndex;
      });
      var prevColumn = baseColumns[expandColumnIndex];
      var fixedColumn;
      if (fixed) {
        fixedColumn = fixed;
      } else {
        fixedColumn = prevColumn ? prevColumn.fixed : null;
      }
      var expandColumn = _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, INTERNAL_COL_DEFINE, {
        className: "".concat(prefixCls, "-expand-icon-col"),
        columnType: "EXPAND_COLUMN"
      }), "title", columnTitle), "fixed", fixedColumn), "className", "".concat(prefixCls, "-row-expand-icon-cell")), "width", columnWidth), "render", function render(_, record, index) {
        var rowKey = getRowKey(record, index);
        var expanded = expandedKeys.has(rowKey);
        var recordExpandable = rowExpandable ? rowExpandable(record) : true;
        var icon = expandIcon({
          prefixCls,
          expanded,
          expandable: recordExpandable,
          record,
          onExpand: onTriggerExpand
        });
        if (expandRowByClick) {
          return /* @__PURE__ */ reactExports.createElement("span", {
            onClick: function onClick(e) {
              return e.stopPropagation();
            }
          }, icon);
        }
        return icon;
      });
      return cloneColumns.map(function(col, index) {
        var column = col === EXPAND_COLUMN ? expandColumn : col;
        if (index < expandedRowOffset) {
          return _objectSpread2(_objectSpread2({}, column), {}, {
            fixed: column.fixed || "left"
          });
        }
        return column;
      });
    }
    return baseColumns.filter(function(col) {
      return col !== EXPAND_COLUMN;
    });
  }, [expandable, baseColumns, getRowKey, expandedKeys, expandIcon, direction, expandedRowOffset]);
  var mergedColumns = reactExports.useMemo(function() {
    var finalColumns = withExpandColumns;
    if (transformColumns) {
      finalColumns = transformColumns(finalColumns);
    }
    if (!finalColumns.length) {
      finalColumns = [{
        render: function render() {
          return null;
        }
      }];
    }
    return finalColumns;
  }, [transformColumns, withExpandColumns, direction]);
  var flattenColumns = reactExports.useMemo(function() {
    if (direction === "rtl") {
      return revertForRtl(flatColumns(mergedColumns));
    }
    return flatColumns(mergedColumns);
  }, [mergedColumns, direction, scrollWidth]);
  var hasGapFixed = reactExports.useMemo(function() {
    var lastLeftIndex = -1;
    for (var i = flattenColumns.length - 1; i >= 0; i -= 1) {
      var colFixed = flattenColumns[i].fixed;
      if (colFixed === "left" || colFixed === true) {
        lastLeftIndex = i;
        break;
      }
    }
    if (lastLeftIndex >= 0) {
      for (var _i = 0; _i <= lastLeftIndex; _i += 1) {
        var _colFixed = flattenColumns[_i].fixed;
        if (_colFixed !== "left" && _colFixed !== true) {
          return true;
        }
      }
    }
    var firstRightIndex = flattenColumns.findIndex(function(_ref3) {
      var colFixed2 = _ref3.fixed;
      return colFixed2 === "right";
    });
    if (firstRightIndex >= 0) {
      for (var _i2 = firstRightIndex; _i2 < flattenColumns.length; _i2 += 1) {
        var _colFixed2 = flattenColumns[_i2].fixed;
        if (_colFixed2 !== "right") {
          return true;
        }
      }
    }
    return false;
  }, [flattenColumns]);
  var _useWidthColumns = useWidthColumns(flattenColumns, scrollWidth, clientWidth), _useWidthColumns2 = _slicedToArray(_useWidthColumns, 2), filledColumns = _useWidthColumns2[0], realScrollWidth = _useWidthColumns2[1];
  return [mergedColumns, filledColumns, realScrollWidth, hasGapFixed];
}
function useExpand(props, mergedData, getRowKey) {
  var expandableConfig = getExpandableProps(props);
  var expandIcon = expandableConfig.expandIcon, expandedRowKeys = expandableConfig.expandedRowKeys, defaultExpandedRowKeys = expandableConfig.defaultExpandedRowKeys, defaultExpandAllRows = expandableConfig.defaultExpandAllRows, expandedRowRender = expandableConfig.expandedRowRender, onExpand = expandableConfig.onExpand, onExpandedRowsChange = expandableConfig.onExpandedRowsChange, childrenColumnName = expandableConfig.childrenColumnName;
  var mergedExpandIcon = expandIcon || renderExpandIcon$1;
  var mergedChildrenColumnName = childrenColumnName || "children";
  var expandableType = reactExports.useMemo(function() {
    if (expandedRowRender) {
      return "row";
    }
    if (props.expandable && props.internalHooks === INTERNAL_HOOKS && props.expandable.__PARENT_RENDER_ICON__ || mergedData.some(function(record) {
      return record && _typeof(record) === "object" && record[mergedChildrenColumnName];
    })) {
      return "nest";
    }
    return false;
  }, [!!expandedRowRender, mergedData]);
  var _React$useState = reactExports.useState(function() {
    if (defaultExpandedRowKeys) {
      return defaultExpandedRowKeys;
    }
    if (defaultExpandAllRows) {
      return findAllChildrenKeys(mergedData, getRowKey, mergedChildrenColumnName);
    }
    return [];
  }), _React$useState2 = _slicedToArray(_React$useState, 2), innerExpandedKeys = _React$useState2[0], setInnerExpandedKeys = _React$useState2[1];
  var mergedExpandedKeys = reactExports.useMemo(function() {
    return new Set(expandedRowKeys || innerExpandedKeys || []);
  }, [expandedRowKeys, innerExpandedKeys]);
  var onTriggerExpand = reactExports.useCallback(function(record) {
    var key = getRowKey(record, mergedData.indexOf(record));
    var newExpandedKeys;
    var hasKey = mergedExpandedKeys.has(key);
    if (hasKey) {
      mergedExpandedKeys.delete(key);
      newExpandedKeys = _toConsumableArray(mergedExpandedKeys);
    } else {
      newExpandedKeys = [].concat(_toConsumableArray(mergedExpandedKeys), [key]);
    }
    setInnerExpandedKeys(newExpandedKeys);
    if (onExpand) {
      onExpand(!hasKey, record);
    }
    if (onExpandedRowsChange) {
      onExpandedRowsChange(newExpandedKeys);
    }
  }, [getRowKey, mergedExpandedKeys, mergedData, onExpand, onExpandedRowsChange]);
  return [expandableConfig, expandableType, mergedExpandedKeys, mergedExpandIcon, mergedChildrenColumnName, onTriggerExpand];
}
function useFixedInfo(flattenColumns, stickyOffsets, direction) {
  var fixedInfoList = flattenColumns.map(function(_, colIndex) {
    return getCellFixedInfo(colIndex, colIndex, flattenColumns, stickyOffsets, direction);
  });
  return useMemo(function() {
    return fixedInfoList;
  }, [fixedInfoList], function(prev, next) {
    return !isEqual(prev, next);
  });
}
function useLayoutState(defaultState) {
  var stateRef = reactExports.useRef(defaultState);
  var _useState = reactExports.useState({}), _useState2 = _slicedToArray(_useState, 2), forceUpdate = _useState2[1];
  var lastPromiseRef = reactExports.useRef(null);
  var updateBatchRef = reactExports.useRef([]);
  function setFrameState(updater) {
    updateBatchRef.current.push(updater);
    var promise = Promise.resolve();
    lastPromiseRef.current = promise;
    promise.then(function() {
      if (lastPromiseRef.current === promise) {
        var prevBatch = updateBatchRef.current;
        var prevState = stateRef.current;
        updateBatchRef.current = [];
        prevBatch.forEach(function(batchUpdater) {
          stateRef.current = batchUpdater(stateRef.current);
        });
        lastPromiseRef.current = null;
        if (prevState !== stateRef.current) {
          forceUpdate({});
        }
      }
    });
  }
  reactExports.useEffect(function() {
    return function() {
      lastPromiseRef.current = null;
    };
  }, []);
  return [stateRef.current, setFrameState];
}
function useTimeoutLock(defaultState) {
  var frameRef = reactExports.useRef(null);
  var timeoutRef = reactExports.useRef();
  function cleanUp() {
    window.clearTimeout(timeoutRef.current);
  }
  function setState(newState) {
    frameRef.current = newState;
    cleanUp();
    timeoutRef.current = window.setTimeout(function() {
      frameRef.current = null;
      timeoutRef.current = void 0;
    }, 100);
  }
  function getState() {
    return frameRef.current;
  }
  reactExports.useEffect(function() {
    return cleanUp;
  }, []);
  return [setState, getState];
}
function useHover() {
  var _React$useState = reactExports.useState(-1), _React$useState2 = _slicedToArray(_React$useState, 2), startRow = _React$useState2[0], setStartRow = _React$useState2[1];
  var _React$useState3 = reactExports.useState(-1), _React$useState4 = _slicedToArray(_React$useState3, 2), endRow = _React$useState4[0], setEndRow = _React$useState4[1];
  var onHover = reactExports.useCallback(function(start, end) {
    setStartRow(start);
    setEndRow(end);
  }, []);
  return [startRow, endRow, onHover];
}
var defaultContainer = canUseDom() ? window : null;
function useSticky(sticky, prefixCls) {
  var _ref = _typeof(sticky) === "object" ? sticky : {}, _ref$offsetHeader = _ref.offsetHeader, offsetHeader = _ref$offsetHeader === void 0 ? 0 : _ref$offsetHeader, _ref$offsetSummary = _ref.offsetSummary, offsetSummary = _ref$offsetSummary === void 0 ? 0 : _ref$offsetSummary, _ref$offsetScroll = _ref.offsetScroll, offsetScroll = _ref$offsetScroll === void 0 ? 0 : _ref$offsetScroll, _ref$getContainer = _ref.getContainer, getContainer = _ref$getContainer === void 0 ? function() {
    return defaultContainer;
  } : _ref$getContainer;
  var container = getContainer() || defaultContainer;
  var isSticky = !!sticky;
  return reactExports.useMemo(function() {
    return {
      isSticky,
      stickyClassName: isSticky ? "".concat(prefixCls, "-sticky-holder") : "",
      offsetHeader,
      offsetSummary,
      offsetScroll,
      container
    };
  }, [isSticky, offsetScroll, offsetHeader, offsetSummary, prefixCls, container]);
}
function useStickyOffsets(colWidths, flattenColumns, direction) {
  var stickyOffsets = reactExports.useMemo(function() {
    var columnCount = flattenColumns.length;
    var getOffsets = function getOffsets2(startIndex, endIndex, offset2) {
      var offsets = [];
      var total = 0;
      for (var i = startIndex; i !== endIndex; i += offset2) {
        offsets.push(total);
        if (flattenColumns[i].fixed) {
          total += colWidths[i] || 0;
        }
      }
      return offsets;
    };
    var startOffsets = getOffsets(0, columnCount, 1);
    var endOffsets = getOffsets(columnCount - 1, -1, -1).reverse();
    return direction === "rtl" ? {
      left: endOffsets,
      right: startOffsets
    } : {
      left: startOffsets,
      right: endOffsets
    };
  }, [colWidths, flattenColumns, direction]);
  return stickyOffsets;
}
function Panel(_ref) {
  var className = _ref.className, children = _ref.children;
  return /* @__PURE__ */ reactExports.createElement("div", {
    className
  }, children);
}
function getOffset(node) {
  var element = getDOM(node);
  var box = element.getBoundingClientRect();
  var docElem = document.documentElement;
  return {
    left: box.left + (window.pageXOffset || docElem.scrollLeft) - (docElem.clientLeft || document.body.clientLeft || 0),
    top: box.top + (window.pageYOffset || docElem.scrollTop) - (docElem.clientTop || document.body.clientTop || 0)
  };
}
var StickyScrollBar = function StickyScrollBar2(_ref, ref) {
  var _scrollBodyRef$curren, _scrollBodyRef$curren2;
  var scrollBodyRef = _ref.scrollBodyRef, onScroll = _ref.onScroll, offsetScroll = _ref.offsetScroll, container = _ref.container, direction = _ref.direction;
  var prefixCls = useContext(TableContext, "prefixCls");
  var bodyScrollWidth = ((_scrollBodyRef$curren = scrollBodyRef.current) === null || _scrollBodyRef$curren === void 0 ? void 0 : _scrollBodyRef$curren.scrollWidth) || 0;
  var bodyWidth = ((_scrollBodyRef$curren2 = scrollBodyRef.current) === null || _scrollBodyRef$curren2 === void 0 ? void 0 : _scrollBodyRef$curren2.clientWidth) || 0;
  var scrollBarWidth = bodyScrollWidth && bodyWidth * (bodyWidth / bodyScrollWidth);
  var scrollBarRef = reactExports.useRef();
  var _useLayoutState = useLayoutState({
    scrollLeft: 0,
    isHiddenScrollBar: true
  }), _useLayoutState2 = _slicedToArray(_useLayoutState, 2), scrollState = _useLayoutState2[0], setScrollState = _useLayoutState2[1];
  var refState = reactExports.useRef({
    delta: 0,
    x: 0
  });
  var _React$useState = reactExports.useState(false), _React$useState2 = _slicedToArray(_React$useState, 2), isActive = _React$useState2[0], setActive = _React$useState2[1];
  var rafRef = reactExports.useRef(null);
  reactExports.useEffect(function() {
    return function() {
      wrapperRaf.cancel(rafRef.current);
    };
  }, []);
  var onMouseUp = function onMouseUp2() {
    setActive(false);
  };
  var onMouseDown = function onMouseDown2(event) {
    event.persist();
    refState.current.delta = event.pageX - scrollState.scrollLeft;
    refState.current.x = 0;
    setActive(true);
    event.preventDefault();
  };
  var onMouseMove = function onMouseMove2(event) {
    var _window;
    var _ref2 = event || ((_window = window) === null || _window === void 0 ? void 0 : _window.event), buttons = _ref2.buttons;
    if (!isActive || buttons === 0) {
      if (isActive) {
        setActive(false);
      }
      return;
    }
    var left = refState.current.x + event.pageX - refState.current.x - refState.current.delta;
    var isRTL = direction === "rtl";
    left = Math.max(isRTL ? scrollBarWidth - bodyWidth : 0, Math.min(isRTL ? 0 : bodyWidth - scrollBarWidth, left));
    var shouldScroll = !isRTL || Math.abs(left) + Math.abs(scrollBarWidth) < bodyWidth;
    if (shouldScroll) {
      onScroll({
        scrollLeft: left / bodyWidth * (bodyScrollWidth + 2)
      });
      refState.current.x = event.pageX;
    }
  };
  var checkScrollBarVisible = function checkScrollBarVisible2() {
    wrapperRaf.cancel(rafRef.current);
    rafRef.current = wrapperRaf(function() {
      if (!scrollBodyRef.current) {
        return;
      }
      var tableOffsetTop = getOffset(scrollBodyRef.current).top;
      var tableBottomOffset = tableOffsetTop + scrollBodyRef.current.offsetHeight;
      var currentClientOffset = container === window ? document.documentElement.scrollTop + window.innerHeight : getOffset(container).top + container.clientHeight;
      setScrollState(function(state) {
        return _objectSpread2(_objectSpread2({}, state), {}, {
          isHiddenScrollBar: tableBottomOffset - getScrollBarSize() <= currentClientOffset || tableOffsetTop >= currentClientOffset - offsetScroll
        });
      });
    });
  };
  var setScrollLeft = function setScrollLeft2(left) {
    setScrollState(function(state) {
      return _objectSpread2(_objectSpread2({}, state), {}, {
        scrollLeft: bodyScrollWidth ? left / bodyScrollWidth * bodyWidth : 0
      });
    });
  };
  reactExports.useImperativeHandle(ref, function() {
    return {
      setScrollLeft,
      checkScrollBarVisible
    };
  });
  reactExports.useEffect(function() {
    var onMouseUpListener = addEventListenerWrap(document.body, "mouseup", onMouseUp, false);
    var onMouseMoveListener = addEventListenerWrap(document.body, "mousemove", onMouseMove, false);
    checkScrollBarVisible();
    return function() {
      onMouseUpListener.remove();
      onMouseMoveListener.remove();
    };
  }, [scrollBarWidth, isActive]);
  reactExports.useEffect(function() {
    if (!scrollBodyRef.current) return;
    var scrollParents = [];
    var parent = getDOM(scrollBodyRef.current);
    while (parent) {
      scrollParents.push(parent);
      parent = parent.parentElement;
    }
    scrollParents.forEach(function(p) {
      return p.addEventListener("scroll", checkScrollBarVisible, false);
    });
    window.addEventListener("resize", checkScrollBarVisible, false);
    window.addEventListener("scroll", checkScrollBarVisible, false);
    container.addEventListener("scroll", checkScrollBarVisible, false);
    return function() {
      scrollParents.forEach(function(p) {
        return p.removeEventListener("scroll", checkScrollBarVisible);
      });
      window.removeEventListener("resize", checkScrollBarVisible);
      window.removeEventListener("scroll", checkScrollBarVisible);
      container.removeEventListener("scroll", checkScrollBarVisible);
    };
  }, [container]);
  reactExports.useEffect(function() {
    if (!scrollState.isHiddenScrollBar) {
      setScrollState(function(state) {
        var bodyNode = scrollBodyRef.current;
        if (!bodyNode) {
          return state;
        }
        return _objectSpread2(_objectSpread2({}, state), {}, {
          scrollLeft: bodyNode.scrollLeft / bodyNode.scrollWidth * bodyNode.clientWidth
        });
      });
    }
  }, [scrollState.isHiddenScrollBar]);
  if (bodyScrollWidth <= bodyWidth || !scrollBarWidth || scrollState.isHiddenScrollBar) {
    return null;
  }
  return /* @__PURE__ */ reactExports.createElement("div", {
    style: {
      height: getScrollBarSize(),
      width: bodyWidth,
      bottom: offsetScroll
    },
    className: "".concat(prefixCls, "-sticky-scroll")
  }, /* @__PURE__ */ reactExports.createElement("div", {
    onMouseDown,
    ref: scrollBarRef,
    className: classNames("".concat(prefixCls, "-sticky-scroll-bar"), _defineProperty({}, "".concat(prefixCls, "-sticky-scroll-bar-active"), isActive)),
    style: {
      width: "".concat(scrollBarWidth, "px"),
      transform: "translate3d(".concat(scrollState.scrollLeft, "px, 0, 0)")
    }
  }));
};
const StickyScrollBar$1 = /* @__PURE__ */ reactExports.forwardRef(StickyScrollBar);
var DEFAULT_PREFIX = "rc-table";
var EMPTY_DATA = [];
var EMPTY_SCROLL_TARGET = {};
function defaultEmpty() {
  return "No Data";
}
function Table$1(tableProps, ref) {
  var props = _objectSpread2({
    rowKey: "key",
    prefixCls: DEFAULT_PREFIX,
    emptyText: defaultEmpty
  }, tableProps);
  var prefixCls = props.prefixCls, className = props.className, rowClassName = props.rowClassName, style = props.style, data = props.data, rowKey = props.rowKey, scroll = props.scroll, tableLayout = props.tableLayout, direction = props.direction, title2 = props.title, footer2 = props.footer, summary = props.summary, caption = props.caption, id = props.id, showHeader = props.showHeader, components = props.components, emptyText = props.emptyText, onRow = props.onRow, onHeaderRow = props.onHeaderRow, measureRowRender = props.measureRowRender, onScroll = props.onScroll, internalHooks = props.internalHooks, transformColumns = props.transformColumns, internalRefs = props.internalRefs, tailor = props.tailor, getContainerWidth = props.getContainerWidth, sticky = props.sticky, _props$rowHoverable = props.rowHoverable, rowHoverable = _props$rowHoverable === void 0 ? true : _props$rowHoverable;
  var mergedData = data || EMPTY_DATA;
  var hasData = !!mergedData.length;
  var useInternalHooks = internalHooks === INTERNAL_HOOKS;
  var getComponent = reactExports.useCallback(function(path, defaultComponent) {
    return get(components, path) || defaultComponent;
  }, [components]);
  var getRowKey = reactExports.useMemo(function() {
    if (typeof rowKey === "function") {
      return rowKey;
    }
    return function(record) {
      var key = record && record[rowKey];
      return key;
    };
  }, [rowKey]);
  var customizeScrollBody = getComponent(["body"]);
  var _useHover = useHover(), _useHover2 = _slicedToArray(_useHover, 3), startRow = _useHover2[0], endRow = _useHover2[1], onHover = _useHover2[2];
  var _useExpand = useExpand(props, mergedData, getRowKey), _useExpand2 = _slicedToArray(_useExpand, 6), expandableConfig = _useExpand2[0], expandableType = _useExpand2[1], mergedExpandedKeys = _useExpand2[2], mergedExpandIcon = _useExpand2[3], mergedChildrenColumnName = _useExpand2[4], onTriggerExpand = _useExpand2[5];
  var scrollX = scroll === null || scroll === void 0 ? void 0 : scroll.x;
  var _React$useState = reactExports.useState(0), _React$useState2 = _slicedToArray(_React$useState, 2), componentWidth = _React$useState2[0], setComponentWidth = _React$useState2[1];
  var _useColumns = useColumns(_objectSpread2(_objectSpread2(_objectSpread2({}, props), expandableConfig), {}, {
    expandable: !!expandableConfig.expandedRowRender,
    columnTitle: expandableConfig.columnTitle,
    expandedKeys: mergedExpandedKeys,
    getRowKey,
    // https://github.com/ant-design/ant-design/issues/23894
    onTriggerExpand,
    expandIcon: mergedExpandIcon,
    expandIconColumnIndex: expandableConfig.expandIconColumnIndex,
    direction,
    scrollWidth: useInternalHooks && tailor && typeof scrollX === "number" ? scrollX : null,
    clientWidth: componentWidth
  }), useInternalHooks ? transformColumns : null), _useColumns2 = _slicedToArray(_useColumns, 4), columns = _useColumns2[0], flattenColumns = _useColumns2[1], flattenScrollX = _useColumns2[2], hasGapFixed = _useColumns2[3];
  var mergedScrollX = flattenScrollX !== null && flattenScrollX !== void 0 ? flattenScrollX : scrollX;
  var columnContext = reactExports.useMemo(function() {
    return {
      columns,
      flattenColumns
    };
  }, [columns, flattenColumns]);
  var fullTableRef = reactExports.useRef();
  var scrollHeaderRef = reactExports.useRef();
  var scrollBodyRef = reactExports.useRef();
  var scrollBodyContainerRef = reactExports.useRef();
  reactExports.useImperativeHandle(ref, function() {
    return {
      nativeElement: fullTableRef.current,
      scrollTo: function scrollTo2(config) {
        var _scrollBodyRef$curren3;
        if (scrollBodyRef.current instanceof HTMLElement) {
          var index = config.index, top = config.top, key = config.key;
          if (validNumberValue(top)) {
            var _scrollBodyRef$curren;
            (_scrollBodyRef$curren = scrollBodyRef.current) === null || _scrollBodyRef$curren === void 0 || _scrollBodyRef$curren.scrollTo({
              top
            });
          } else {
            var _scrollBodyRef$curren2;
            var mergedKey = key !== null && key !== void 0 ? key : getRowKey(mergedData[index]);
            (_scrollBodyRef$curren2 = scrollBodyRef.current.querySelector('[data-row-key="'.concat(mergedKey, '"]'))) === null || _scrollBodyRef$curren2 === void 0 || _scrollBodyRef$curren2.scrollIntoView();
          }
        } else if ((_scrollBodyRef$curren3 = scrollBodyRef.current) !== null && _scrollBodyRef$curren3 !== void 0 && _scrollBodyRef$curren3.scrollTo) {
          scrollBodyRef.current.scrollTo(config);
        }
      }
    };
  });
  var scrollSummaryRef = reactExports.useRef();
  var _React$useState3 = reactExports.useState(false), _React$useState4 = _slicedToArray(_React$useState3, 2), pingedLeft = _React$useState4[0], setPingedLeft = _React$useState4[1];
  var _React$useState5 = reactExports.useState(false), _React$useState6 = _slicedToArray(_React$useState5, 2), pingedRight = _React$useState6[0], setPingedRight = _React$useState6[1];
  var _React$useState7 = reactExports.useState(/* @__PURE__ */ new Map()), _React$useState8 = _slicedToArray(_React$useState7, 2), colsWidths = _React$useState8[0], updateColsWidths = _React$useState8[1];
  var colsKeys = getColumnsKey(flattenColumns);
  var pureColWidths = colsKeys.map(function(columnKey) {
    return colsWidths.get(columnKey);
  });
  var colWidths = reactExports.useMemo(function() {
    return pureColWidths;
  }, [pureColWidths.join("_")]);
  var stickyOffsets = useStickyOffsets(colWidths, flattenColumns, direction);
  var fixHeader = scroll && validateValue(scroll.y);
  var horizonScroll = scroll && validateValue(mergedScrollX) || Boolean(expandableConfig.fixed);
  var fixColumn = horizonScroll && flattenColumns.some(function(_ref) {
    var fixed = _ref.fixed;
    return fixed;
  });
  var stickyRef = reactExports.useRef();
  var _useSticky = useSticky(sticky, prefixCls), isSticky = _useSticky.isSticky, offsetHeader = _useSticky.offsetHeader, offsetSummary = _useSticky.offsetSummary, offsetScroll = _useSticky.offsetScroll, stickyClassName = _useSticky.stickyClassName, container = _useSticky.container;
  var summaryNode = reactExports.useMemo(function() {
    return summary === null || summary === void 0 ? void 0 : summary(mergedData);
  }, [summary, mergedData]);
  var fixFooter = (fixHeader || isSticky) && /* @__PURE__ */ reactExports.isValidElement(summaryNode) && summaryNode.type === Summary && summaryNode.props.fixed;
  var scrollXStyle;
  var scrollYStyle;
  var scrollTableStyle;
  if (fixHeader) {
    scrollYStyle = {
      overflowY: hasData ? "scroll" : "auto",
      maxHeight: scroll.y
    };
  }
  if (horizonScroll) {
    scrollXStyle = {
      overflowX: "auto"
    };
    if (!fixHeader) {
      scrollYStyle = {
        overflowY: "hidden"
      };
    }
    scrollTableStyle = {
      width: mergedScrollX === true ? "auto" : mergedScrollX,
      minWidth: "100%"
    };
  }
  var onColumnResize = reactExports.useCallback(function(columnKey, width) {
    updateColsWidths(function(widths) {
      if (widths.get(columnKey) !== width) {
        var newWidths = new Map(widths);
        newWidths.set(columnKey, width);
        return newWidths;
      }
      return widths;
    });
  }, []);
  var _useTimeoutLock = useTimeoutLock(), _useTimeoutLock2 = _slicedToArray(_useTimeoutLock, 2), setScrollTarget = _useTimeoutLock2[0], getScrollTarget = _useTimeoutLock2[1];
  function forceScroll(scrollLeft, target) {
    if (!target) {
      return;
    }
    if (typeof target === "function") {
      target(scrollLeft);
    } else if (target.scrollLeft !== scrollLeft) {
      target.scrollLeft = scrollLeft;
      if (target.scrollLeft !== scrollLeft) {
        setTimeout(function() {
          target.scrollLeft = scrollLeft;
        }, 0);
      }
    }
  }
  var onInternalScroll = useEvent(function(_ref2) {
    var currentTarget = _ref2.currentTarget, scrollLeft = _ref2.scrollLeft;
    var isRTL = direction === "rtl";
    var mergedScrollLeft = typeof scrollLeft === "number" ? scrollLeft : currentTarget.scrollLeft;
    var compareTarget = currentTarget || EMPTY_SCROLL_TARGET;
    if (!getScrollTarget() || getScrollTarget() === compareTarget) {
      var _stickyRef$current;
      setScrollTarget(compareTarget);
      forceScroll(mergedScrollLeft, scrollHeaderRef.current);
      forceScroll(mergedScrollLeft, scrollBodyRef.current);
      forceScroll(mergedScrollLeft, scrollSummaryRef.current);
      forceScroll(mergedScrollLeft, (_stickyRef$current = stickyRef.current) === null || _stickyRef$current === void 0 ? void 0 : _stickyRef$current.setScrollLeft);
    }
    var measureTarget = currentTarget || scrollHeaderRef.current;
    if (measureTarget) {
      var scrollWidth = (
        // Should use mergedScrollX in virtual table(useInternalHooks && tailor === true)
        useInternalHooks && tailor && typeof mergedScrollX === "number" ? mergedScrollX : measureTarget.scrollWidth
      );
      var clientWidth = measureTarget.clientWidth;
      if (scrollWidth === clientWidth) {
        setPingedLeft(false);
        setPingedRight(false);
        return;
      }
      if (isRTL) {
        setPingedLeft(-mergedScrollLeft < scrollWidth - clientWidth);
        setPingedRight(-mergedScrollLeft > 0);
      } else {
        setPingedLeft(mergedScrollLeft > 0);
        setPingedRight(mergedScrollLeft < scrollWidth - clientWidth);
      }
    }
  });
  var onBodyScroll = useEvent(function(e) {
    onInternalScroll(e);
    onScroll === null || onScroll === void 0 || onScroll(e);
  });
  var triggerOnScroll = function triggerOnScroll2() {
    if (horizonScroll && scrollBodyRef.current) {
      var _scrollBodyRef$curren4;
      onInternalScroll({
        currentTarget: getDOM(scrollBodyRef.current),
        scrollLeft: (_scrollBodyRef$curren4 = scrollBodyRef.current) === null || _scrollBodyRef$curren4 === void 0 ? void 0 : _scrollBodyRef$curren4.scrollLeft
      });
    } else {
      setPingedLeft(false);
      setPingedRight(false);
    }
  };
  var onFullTableResize = function onFullTableResize2(_ref3) {
    var _stickyRef$current2;
    var width = _ref3.width;
    (_stickyRef$current2 = stickyRef.current) === null || _stickyRef$current2 === void 0 || _stickyRef$current2.checkScrollBarVisible();
    var mergedWidth = fullTableRef.current ? fullTableRef.current.offsetWidth : width;
    if (useInternalHooks && getContainerWidth && fullTableRef.current) {
      mergedWidth = getContainerWidth(fullTableRef.current, mergedWidth) || mergedWidth;
    }
    if (mergedWidth !== componentWidth) {
      triggerOnScroll();
      setComponentWidth(mergedWidth);
    }
  };
  var mounted = reactExports.useRef(false);
  reactExports.useEffect(function() {
    if (mounted.current) {
      triggerOnScroll();
    }
  }, [horizonScroll, data, columns.length]);
  reactExports.useEffect(function() {
    mounted.current = true;
  }, []);
  var _React$useState9 = reactExports.useState(0), _React$useState10 = _slicedToArray(_React$useState9, 2), scrollbarSize = _React$useState10[0], setScrollbarSize = _React$useState10[1];
  var _React$useState11 = reactExports.useState(true), _React$useState12 = _slicedToArray(_React$useState11, 2), supportSticky = _React$useState12[0], setSupportSticky = _React$useState12[1];
  useLayoutEffect(function() {
    if (!tailor || !useInternalHooks) {
      if (scrollBodyRef.current instanceof Element) {
        setScrollbarSize(getTargetScrollBarSize(scrollBodyRef.current).width);
      } else {
        setScrollbarSize(getTargetScrollBarSize(scrollBodyContainerRef.current).width);
      }
    }
    setSupportSticky(isStyleSupport("position", "sticky"));
  }, []);
  reactExports.useEffect(function() {
    if (useInternalHooks && internalRefs) {
      internalRefs.body.current = scrollBodyRef.current;
    }
  });
  var renderFixedHeaderTable = reactExports.useCallback(function(fixedHolderPassProps) {
    return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(Header$1, fixedHolderPassProps), fixFooter === "top" && /* @__PURE__ */ reactExports.createElement(Footer$1, fixedHolderPassProps, summaryNode));
  }, [fixFooter, summaryNode]);
  var renderFixedFooterTable = reactExports.useCallback(function(fixedHolderPassProps) {
    return /* @__PURE__ */ reactExports.createElement(Footer$1, fixedHolderPassProps, summaryNode);
  }, [summaryNode]);
  var TableComponent = getComponent(["table"], "table");
  var mergedTableLayout = reactExports.useMemo(function() {
    if (tableLayout) {
      return tableLayout;
    }
    if (fixColumn) {
      return mergedScrollX === "max-content" ? "auto" : "fixed";
    }
    if (fixHeader || isSticky || flattenColumns.some(function(_ref4) {
      var ellipsis = _ref4.ellipsis;
      return ellipsis;
    })) {
      return "fixed";
    }
    return "auto";
  }, [fixHeader, fixColumn, flattenColumns, tableLayout, isSticky]);
  var groupTableNode;
  var headerProps = {
    colWidths,
    columCount: flattenColumns.length,
    stickyOffsets,
    onHeaderRow,
    fixHeader,
    scroll
  };
  var emptyNode = reactExports.useMemo(function() {
    if (hasData) {
      return null;
    }
    if (typeof emptyText === "function") {
      return emptyText();
    }
    return emptyText;
  }, [hasData, emptyText]);
  var bodyTable = /* @__PURE__ */ reactExports.createElement(Body$1, {
    data: mergedData,
    measureColumnWidth: fixHeader || horizonScroll || isSticky
  });
  var bodyColGroup = /* @__PURE__ */ reactExports.createElement(ColGroup, {
    colWidths: flattenColumns.map(function(_ref5) {
      var width = _ref5.width;
      return width;
    }),
    columns: flattenColumns
  });
  var captionElement = caption !== null && caption !== void 0 ? /* @__PURE__ */ reactExports.createElement("caption", {
    className: "".concat(prefixCls, "-caption")
  }, caption) : void 0;
  var dataProps = pickAttrs(props, {
    data: true
  });
  var ariaProps = pickAttrs(props, {
    aria: true
  });
  if (fixHeader || isSticky) {
    var bodyContent;
    if (typeof customizeScrollBody === "function") {
      bodyContent = customizeScrollBody(mergedData, {
        scrollbarSize,
        ref: scrollBodyRef,
        onScroll: onInternalScroll
      });
      headerProps.colWidths = flattenColumns.map(function(_ref6, index) {
        var width = _ref6.width;
        var colWidth = index === flattenColumns.length - 1 ? width - scrollbarSize : width;
        if (typeof colWidth === "number" && !Number.isNaN(colWidth)) {
          return colWidth;
        }
        return 0;
      });
    } else {
      bodyContent = /* @__PURE__ */ reactExports.createElement("div", {
        style: _objectSpread2(_objectSpread2({}, scrollXStyle), scrollYStyle),
        onScroll: onBodyScroll,
        ref: scrollBodyRef,
        className: classNames("".concat(prefixCls, "-body"))
      }, /* @__PURE__ */ reactExports.createElement(TableComponent, _extends({
        style: _objectSpread2(_objectSpread2({}, scrollTableStyle), {}, {
          tableLayout: mergedTableLayout
        })
      }, ariaProps), captionElement, bodyColGroup, bodyTable, !fixFooter && summaryNode && /* @__PURE__ */ reactExports.createElement(Footer$1, {
        stickyOffsets,
        flattenColumns
      }, summaryNode)));
    }
    var fixedHolderProps = _objectSpread2(_objectSpread2(_objectSpread2({
      noData: !mergedData.length
    }, headerProps), columnContext), {}, {
      direction,
      stickyClassName,
      scrollX: mergedScrollX,
      tableLayout: mergedTableLayout,
      onScroll: onInternalScroll
    });
    groupTableNode = /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, showHeader !== false && /* @__PURE__ */ reactExports.createElement(FixedHolder$1, _extends({}, fixedHolderProps, {
      stickyTopOffset: offsetHeader,
      className: "".concat(prefixCls, "-header"),
      ref: scrollHeaderRef,
      colGroup: bodyColGroup
    }), renderFixedHeaderTable), bodyContent, fixFooter && fixFooter !== "top" && /* @__PURE__ */ reactExports.createElement(FixedHolder$1, _extends({}, fixedHolderProps, {
      stickyBottomOffset: offsetSummary,
      className: "".concat(prefixCls, "-summary"),
      ref: scrollSummaryRef,
      colGroup: bodyColGroup
    }), renderFixedFooterTable), isSticky && scrollBodyRef.current && scrollBodyRef.current instanceof Element && /* @__PURE__ */ reactExports.createElement(StickyScrollBar$1, {
      ref: stickyRef,
      offsetScroll,
      scrollBodyRef,
      onScroll: onInternalScroll,
      container,
      direction
    }));
  } else {
    groupTableNode = /* @__PURE__ */ reactExports.createElement("div", {
      style: _objectSpread2(_objectSpread2({}, scrollXStyle), scrollYStyle),
      className: classNames("".concat(prefixCls, "-content")),
      onScroll: onInternalScroll,
      ref: scrollBodyRef
    }, /* @__PURE__ */ reactExports.createElement(TableComponent, _extends({
      style: _objectSpread2(_objectSpread2({}, scrollTableStyle), {}, {
        tableLayout: mergedTableLayout
      })
    }, ariaProps), captionElement, bodyColGroup, showHeader !== false && /* @__PURE__ */ reactExports.createElement(Header$1, _extends({}, headerProps, columnContext)), bodyTable, summaryNode && /* @__PURE__ */ reactExports.createElement(Footer$1, {
      stickyOffsets,
      flattenColumns
    }, summaryNode)));
  }
  var fullTable = /* @__PURE__ */ reactExports.createElement("div", _extends({
    className: classNames(prefixCls, className, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, "".concat(prefixCls, "-rtl"), direction === "rtl"), "".concat(prefixCls, "-ping-left"), pingedLeft), "".concat(prefixCls, "-ping-right"), pingedRight), "".concat(prefixCls, "-layout-fixed"), tableLayout === "fixed"), "".concat(prefixCls, "-fixed-header"), fixHeader), "".concat(prefixCls, "-fixed-column"), fixColumn), "".concat(prefixCls, "-fixed-column-gapped"), fixColumn && hasGapFixed), "".concat(prefixCls, "-scroll-horizontal"), horizonScroll), "".concat(prefixCls, "-has-fix-left"), flattenColumns[0] && flattenColumns[0].fixed), "".concat(prefixCls, "-has-fix-right"), flattenColumns[flattenColumns.length - 1] && flattenColumns[flattenColumns.length - 1].fixed === "right")),
    style,
    id,
    ref: fullTableRef
  }, dataProps), title2 && /* @__PURE__ */ reactExports.createElement(Panel, {
    className: "".concat(prefixCls, "-title")
  }, title2(mergedData)), /* @__PURE__ */ reactExports.createElement("div", {
    ref: scrollBodyContainerRef,
    className: "".concat(prefixCls, "-container")
  }, groupTableNode), footer2 && /* @__PURE__ */ reactExports.createElement(Panel, {
    className: "".concat(prefixCls, "-footer")
  }, footer2(mergedData)));
  if (horizonScroll) {
    fullTable = /* @__PURE__ */ reactExports.createElement(RefResizeObserver, {
      onResize: onFullTableResize
    }, fullTable);
  }
  var fixedInfoList = useFixedInfo(flattenColumns, stickyOffsets, direction);
  var TableContextValue = reactExports.useMemo(function() {
    return {
      // Scroll
      scrollX: mergedScrollX,
      // Table
      prefixCls,
      getComponent,
      scrollbarSize,
      direction,
      fixedInfoList,
      isSticky,
      supportSticky,
      componentWidth,
      fixHeader,
      fixColumn,
      horizonScroll,
      // Body
      tableLayout: mergedTableLayout,
      rowClassName,
      expandedRowClassName: expandableConfig.expandedRowClassName,
      expandIcon: mergedExpandIcon,
      expandableType,
      expandRowByClick: expandableConfig.expandRowByClick,
      expandedRowRender: expandableConfig.expandedRowRender,
      expandedRowOffset: expandableConfig.expandedRowOffset,
      onTriggerExpand,
      expandIconColumnIndex: expandableConfig.expandIconColumnIndex,
      indentSize: expandableConfig.indentSize,
      allColumnsFixedLeft: flattenColumns.every(function(col) {
        return col.fixed === "left";
      }),
      emptyNode,
      // Column
      columns,
      flattenColumns,
      onColumnResize,
      colWidths,
      // Row
      hoverStartRow: startRow,
      hoverEndRow: endRow,
      onHover,
      rowExpandable: expandableConfig.rowExpandable,
      onRow,
      getRowKey,
      expandedKeys: mergedExpandedKeys,
      childrenColumnName: mergedChildrenColumnName,
      rowHoverable,
      // Measure Row
      measureRowRender
    };
  }, [
    // Scroll
    mergedScrollX,
    // Table
    prefixCls,
    getComponent,
    scrollbarSize,
    direction,
    fixedInfoList,
    isSticky,
    supportSticky,
    componentWidth,
    fixHeader,
    fixColumn,
    horizonScroll,
    // Body
    mergedTableLayout,
    rowClassName,
    expandableConfig.expandedRowClassName,
    mergedExpandIcon,
    expandableType,
    expandableConfig.expandRowByClick,
    expandableConfig.expandedRowRender,
    expandableConfig.expandedRowOffset,
    onTriggerExpand,
    expandableConfig.expandIconColumnIndex,
    expandableConfig.indentSize,
    emptyNode,
    // Column
    columns,
    flattenColumns,
    onColumnResize,
    colWidths,
    // Row
    startRow,
    endRow,
    onHover,
    expandableConfig.rowExpandable,
    onRow,
    getRowKey,
    mergedExpandedKeys,
    mergedChildrenColumnName,
    rowHoverable,
    measureRowRender
  ]);
  return /* @__PURE__ */ reactExports.createElement(TableContext.Provider, {
    value: TableContextValue
  }, fullTable);
}
var RefTable = /* @__PURE__ */ reactExports.forwardRef(Table$1);
function genTable(shouldTriggerRender) {
  return makeImmutable(RefTable, shouldTriggerRender);
}
var ImmutableTable = genTable();
ImmutableTable.EXPAND_COLUMN = EXPAND_COLUMN;
ImmutableTable.INTERNAL_HOOKS = INTERNAL_HOOKS;
ImmutableTable.Column = Column$1;
ImmutableTable.ColumnGroup = ColumnGroup$1;
ImmutableTable.Summary = FooterComponents;
var StaticContext = createContext(null);
var GridContext = createContext(null);
function getColumnWidth(colIndex, colSpan, columnsOffset) {
  var mergedColSpan = colSpan || 1;
  return columnsOffset[colIndex + mergedColSpan] - (columnsOffset[colIndex] || 0);
}
function VirtualCell(props) {
  var rowInfo = props.rowInfo, column = props.column, colIndex = props.colIndex, indent = props.indent, index = props.index, component = props.component, renderIndex = props.renderIndex, record = props.record, style = props.style, className = props.className, inverse = props.inverse, getHeight = props.getHeight;
  var render = column.render, dataIndex = column.dataIndex, columnClassName = column.className, colWidth = column.width;
  var _useContext = useContext(GridContext, ["columnsOffset"]), columnsOffset = _useContext.columnsOffset;
  var _getCellProps = getCellProps(rowInfo, column, colIndex, indent, index), key = _getCellProps.key, fixedInfo = _getCellProps.fixedInfo, appendCellNode = _getCellProps.appendCellNode, additionalCellProps = _getCellProps.additionalCellProps;
  var cellStyle = additionalCellProps.style, _additionalCellProps$ = additionalCellProps.colSpan, colSpan = _additionalCellProps$ === void 0 ? 1 : _additionalCellProps$, _additionalCellProps$2 = additionalCellProps.rowSpan, rowSpan = _additionalCellProps$2 === void 0 ? 1 : _additionalCellProps$2;
  var startColIndex = colIndex - 1;
  var concatColWidth = getColumnWidth(startColIndex, colSpan, columnsOffset);
  var marginOffset = colSpan > 1 ? colWidth - concatColWidth : 0;
  var mergedStyle = _objectSpread2(_objectSpread2(_objectSpread2({}, cellStyle), style), {}, {
    flex: "0 0 ".concat(concatColWidth, "px"),
    width: "".concat(concatColWidth, "px"),
    marginRight: marginOffset,
    pointerEvents: "auto"
  });
  var needHide = reactExports.useMemo(function() {
    if (inverse) {
      return rowSpan <= 1;
    } else {
      return colSpan === 0 || rowSpan === 0 || rowSpan > 1;
    }
  }, [rowSpan, colSpan, inverse]);
  if (needHide) {
    mergedStyle.visibility = "hidden";
  } else if (inverse) {
    mergedStyle.height = getHeight === null || getHeight === void 0 ? void 0 : getHeight(rowSpan);
  }
  var mergedRender = needHide ? function() {
    return null;
  } : render;
  var cellSpan = {};
  if (rowSpan === 0 || colSpan === 0) {
    cellSpan.rowSpan = 1;
    cellSpan.colSpan = 1;
  }
  return /* @__PURE__ */ reactExports.createElement(Cell$1, _extends({
    className: classNames(columnClassName, className),
    ellipsis: column.ellipsis,
    align: column.align,
    scope: column.rowScope,
    component,
    prefixCls: rowInfo.prefixCls,
    key,
    record,
    index,
    renderIndex,
    dataIndex,
    render: mergedRender,
    shouldCellUpdate: column.shouldCellUpdate
  }, fixedInfo, {
    appendNode: appendCellNode,
    additionalProps: _objectSpread2(_objectSpread2({}, additionalCellProps), {}, {
      style: mergedStyle
    }, cellSpan)
  }));
}
var _excluded$3 = ["data", "index", "className", "rowKey", "style", "extra", "getHeight"];
var BodyLine = /* @__PURE__ */ reactExports.forwardRef(function(props, ref) {
  var data = props.data, index = props.index, className = props.className, rowKey = props.rowKey, style = props.style, extra = props.extra, getHeight = props.getHeight, restProps = _objectWithoutProperties(props, _excluded$3);
  var record = data.record, indent = data.indent, renderIndex = data.index;
  var _useContext = useContext(TableContext, ["prefixCls", "flattenColumns", "fixColumn", "componentWidth", "scrollX"]), scrollX = _useContext.scrollX, flattenColumns = _useContext.flattenColumns, prefixCls = _useContext.prefixCls, fixColumn = _useContext.fixColumn, componentWidth = _useContext.componentWidth;
  var _useContext2 = useContext(StaticContext, ["getComponent"]), getComponent = _useContext2.getComponent;
  var rowInfo = useRowInfo(record, rowKey, index, indent);
  var RowComponent = getComponent(["body", "row"], "div");
  var cellComponent = getComponent(["body", "cell"], "div");
  var rowSupportExpand = rowInfo.rowSupportExpand, expanded = rowInfo.expanded, rowProps = rowInfo.rowProps, expandedRowRender = rowInfo.expandedRowRender, expandedRowClassName = rowInfo.expandedRowClassName;
  var expandRowNode;
  if (rowSupportExpand && expanded) {
    var expandContent = expandedRowRender(record, index, indent + 1, expanded);
    var expandedClsName = computedExpandedClassName(expandedRowClassName, record, index, indent);
    var additionalProps = {};
    if (fixColumn) {
      additionalProps = {
        style: _defineProperty({}, "--virtual-width", "".concat(componentWidth, "px"))
      };
    }
    var rowCellCls = "".concat(prefixCls, "-expanded-row-cell");
    expandRowNode = /* @__PURE__ */ reactExports.createElement(RowComponent, {
      className: classNames("".concat(prefixCls, "-expanded-row"), "".concat(prefixCls, "-expanded-row-level-").concat(indent + 1), expandedClsName)
    }, /* @__PURE__ */ reactExports.createElement(Cell$1, {
      component: cellComponent,
      prefixCls,
      className: classNames(rowCellCls, _defineProperty({}, "".concat(rowCellCls, "-fixed"), fixColumn)),
      additionalProps
    }, expandContent));
  }
  var rowStyle = _objectSpread2(_objectSpread2({}, style), {}, {
    width: scrollX
  });
  if (extra) {
    rowStyle.position = "absolute";
    rowStyle.pointerEvents = "none";
  }
  var rowNode = /* @__PURE__ */ reactExports.createElement(RowComponent, _extends({}, rowProps, restProps, {
    "data-row-key": rowKey,
    ref: rowSupportExpand ? null : ref,
    className: classNames(className, "".concat(prefixCls, "-row"), rowProps === null || rowProps === void 0 ? void 0 : rowProps.className, _defineProperty({}, "".concat(prefixCls, "-row-extra"), extra)),
    style: _objectSpread2(_objectSpread2({}, rowStyle), rowProps === null || rowProps === void 0 ? void 0 : rowProps.style)
  }), flattenColumns.map(function(column, colIndex) {
    return /* @__PURE__ */ reactExports.createElement(VirtualCell, {
      key: colIndex,
      component: cellComponent,
      rowInfo,
      column,
      colIndex,
      indent,
      index,
      renderIndex,
      record,
      inverse: extra,
      getHeight
    });
  }));
  if (rowSupportExpand) {
    return /* @__PURE__ */ reactExports.createElement("div", {
      ref
    }, rowNode, expandRowNode);
  }
  return rowNode;
});
var ResponseBodyLine = responseImmutable(BodyLine);
var Grid = /* @__PURE__ */ reactExports.forwardRef(function(props, ref) {
  var data = props.data, onScroll = props.onScroll;
  var _useContext = useContext(TableContext, ["flattenColumns", "onColumnResize", "getRowKey", "prefixCls", "expandedKeys", "childrenColumnName", "scrollX", "direction"]), flattenColumns = _useContext.flattenColumns, onColumnResize = _useContext.onColumnResize, getRowKey = _useContext.getRowKey, expandedKeys = _useContext.expandedKeys, prefixCls = _useContext.prefixCls, childrenColumnName = _useContext.childrenColumnName, scrollX = _useContext.scrollX, direction = _useContext.direction;
  var _useContext2 = useContext(StaticContext), sticky = _useContext2.sticky, scrollY = _useContext2.scrollY, listItemHeight = _useContext2.listItemHeight, getComponent = _useContext2.getComponent, onTablePropScroll = _useContext2.onScroll;
  var listRef = reactExports.useRef();
  var flattenData2 = useFlattenRecords(data, childrenColumnName, expandedKeys, getRowKey);
  var columnsWidth = reactExports.useMemo(function() {
    var total = 0;
    return flattenColumns.map(function(_ref) {
      var width = _ref.width, minWidth = _ref.minWidth, key = _ref.key;
      var finalWidth = Math.max(width || 0, minWidth || 0);
      total += finalWidth;
      return [key, finalWidth, total];
    });
  }, [flattenColumns]);
  var columnsOffset = reactExports.useMemo(function() {
    return columnsWidth.map(function(colWidth) {
      return colWidth[2];
    });
  }, [columnsWidth]);
  reactExports.useEffect(function() {
    columnsWidth.forEach(function(_ref2) {
      var _ref3 = _slicedToArray(_ref2, 2), key = _ref3[0], width = _ref3[1];
      onColumnResize(key, width);
    });
  }, [columnsWidth]);
  reactExports.useImperativeHandle(ref, function() {
    var _listRef$current2;
    var obj = {
      scrollTo: function scrollTo2(config) {
        var _listRef$current;
        (_listRef$current = listRef.current) === null || _listRef$current === void 0 || _listRef$current.scrollTo(config);
      },
      nativeElement: (_listRef$current2 = listRef.current) === null || _listRef$current2 === void 0 ? void 0 : _listRef$current2.nativeElement
    };
    Object.defineProperty(obj, "scrollLeft", {
      get: function get2() {
        var _listRef$current3;
        return ((_listRef$current3 = listRef.current) === null || _listRef$current3 === void 0 ? void 0 : _listRef$current3.getScrollInfo().x) || 0;
      },
      set: function set(value) {
        var _listRef$current4;
        (_listRef$current4 = listRef.current) === null || _listRef$current4 === void 0 || _listRef$current4.scrollTo({
          left: value
        });
      }
    });
    Object.defineProperty(obj, "scrollTop", {
      get: function get2() {
        var _listRef$current5;
        return ((_listRef$current5 = listRef.current) === null || _listRef$current5 === void 0 ? void 0 : _listRef$current5.getScrollInfo().y) || 0;
      },
      set: function set(value) {
        var _listRef$current6;
        (_listRef$current6 = listRef.current) === null || _listRef$current6 === void 0 || _listRef$current6.scrollTo({
          top: value
        });
      }
    });
    return obj;
  });
  var getRowSpan = function getRowSpan2(column, index) {
    var _flattenData$index;
    var record = (_flattenData$index = flattenData2[index]) === null || _flattenData$index === void 0 ? void 0 : _flattenData$index.record;
    var onCell = column.onCell;
    if (onCell) {
      var _cellProps$rowSpan;
      var cellProps = onCell(record, index);
      return (_cellProps$rowSpan = cellProps === null || cellProps === void 0 ? void 0 : cellProps.rowSpan) !== null && _cellProps$rowSpan !== void 0 ? _cellProps$rowSpan : 1;
    }
    return 1;
  };
  var extraRender = function extraRender2(info) {
    var start = info.start, end = info.end, getSize = info.getSize, offsetY = info.offsetY;
    if (end < 0) {
      return null;
    }
    var firstRowSpanColumns = flattenColumns.filter(
      // rowSpan is 0
      function(column) {
        return getRowSpan(column, start) === 0;
      }
    );
    var startIndex = start;
    var _loop = function _loop4(i2) {
      firstRowSpanColumns = firstRowSpanColumns.filter(function(column) {
        return getRowSpan(column, i2) === 0;
      });
      if (!firstRowSpanColumns.length) {
        startIndex = i2;
        return 1;
      }
    };
    for (var i = start; i >= 0; i -= 1) {
      if (_loop(i)) break;
    }
    var lastRowSpanColumns = flattenColumns.filter(
      // rowSpan is not 1
      function(column) {
        return getRowSpan(column, end) !== 1;
      }
    );
    var endIndex = end;
    var _loop2 = function _loop22(_i3) {
      lastRowSpanColumns = lastRowSpanColumns.filter(function(column) {
        return getRowSpan(column, _i3) !== 1;
      });
      if (!lastRowSpanColumns.length) {
        endIndex = Math.max(_i3 - 1, end);
        return 1;
      }
    };
    for (var _i = end; _i < flattenData2.length; _i += 1) {
      if (_loop2(_i)) break;
    }
    var spanLines = [];
    var _loop3 = function _loop32(_i22) {
      var item = flattenData2[_i22];
      if (!item) {
        return 1;
      }
      if (flattenColumns.some(function(column) {
        return getRowSpan(column, _i22) > 1;
      })) {
        spanLines.push(_i22);
      }
    };
    for (var _i2 = startIndex; _i2 <= endIndex; _i2 += 1) {
      if (_loop3(_i2)) continue;
    }
    var nodes = spanLines.map(function(index) {
      var item = flattenData2[index];
      var rowKey = getRowKey(item.record, index);
      var getHeight = function getHeight2(rowSpan) {
        var endItemIndex = index + rowSpan - 1;
        var endItemKey = getRowKey(flattenData2[endItemIndex].record, endItemIndex);
        var sizeInfo2 = getSize(rowKey, endItemKey);
        return sizeInfo2.bottom - sizeInfo2.top;
      };
      var sizeInfo = getSize(rowKey);
      return /* @__PURE__ */ reactExports.createElement(ResponseBodyLine, {
        key: index,
        data: item,
        rowKey,
        index,
        style: {
          top: -offsetY + sizeInfo.top
        },
        extra: true,
        getHeight
      });
    });
    return nodes;
  };
  var gridContext = reactExports.useMemo(function() {
    return {
      columnsOffset
    };
  }, [columnsOffset]);
  var tblPrefixCls = "".concat(prefixCls, "-tbody");
  var wrapperComponent = getComponent(["body", "wrapper"]);
  var horizontalScrollBarStyle = {};
  if (sticky) {
    horizontalScrollBarStyle.position = "sticky";
    horizontalScrollBarStyle.bottom = 0;
    if (_typeof(sticky) === "object" && sticky.offsetScroll) {
      horizontalScrollBarStyle.bottom = sticky.offsetScroll;
    }
  }
  return /* @__PURE__ */ reactExports.createElement(GridContext.Provider, {
    value: gridContext
  }, /* @__PURE__ */ reactExports.createElement(List, {
    fullHeight: false,
    ref: listRef,
    prefixCls: "".concat(tblPrefixCls, "-virtual"),
    styles: {
      horizontalScrollBar: horizontalScrollBarStyle
    },
    className: tblPrefixCls,
    height: scrollY,
    itemHeight: listItemHeight || 24,
    data: flattenData2,
    itemKey: function itemKey2(item) {
      return getRowKey(item.record);
    },
    component: wrapperComponent,
    scrollWidth: scrollX,
    direction,
    onVirtualScroll: function onVirtualScroll(_ref4) {
      var _listRef$current7;
      var x = _ref4.x;
      onScroll({
        currentTarget: (_listRef$current7 = listRef.current) === null || _listRef$current7 === void 0 ? void 0 : _listRef$current7.nativeElement,
        scrollLeft: x
      });
    },
    onScroll: onTablePropScroll,
    extraRender
  }, function(item, index, itemProps) {
    var rowKey = getRowKey(item.record, index);
    return /* @__PURE__ */ reactExports.createElement(ResponseBodyLine, {
      data: item,
      rowKey,
      index,
      style: itemProps.style
    });
  }));
});
var ResponseGrid = responseImmutable(Grid);
var renderBody = function renderBody2(rawData, props) {
  var ref = props.ref, onScroll = props.onScroll;
  return /* @__PURE__ */ reactExports.createElement(ResponseGrid, {
    ref,
    data: rawData,
    onScroll
  });
};
function VirtualTable(props, ref) {
  var data = props.data, columns = props.columns, scroll = props.scroll, sticky = props.sticky, _props$prefixCls = props.prefixCls, prefixCls = _props$prefixCls === void 0 ? DEFAULT_PREFIX : _props$prefixCls, className = props.className, listItemHeight = props.listItemHeight, components = props.components, onScroll = props.onScroll;
  var _ref = scroll || {}, scrollX = _ref.x, scrollY = _ref.y;
  if (typeof scrollX !== "number") {
    scrollX = 1;
  }
  if (typeof scrollY !== "number") {
    scrollY = 500;
  }
  var getComponent = useEvent(function(path, defaultComponent) {
    return get(components, path) || defaultComponent;
  });
  var onInternalScroll = useEvent(onScroll);
  var context = reactExports.useMemo(function() {
    return {
      sticky,
      scrollY,
      listItemHeight,
      getComponent,
      onScroll: onInternalScroll
    };
  }, [sticky, scrollY, listItemHeight, getComponent, onInternalScroll]);
  return /* @__PURE__ */ reactExports.createElement(StaticContext.Provider, {
    value: context
  }, /* @__PURE__ */ reactExports.createElement(ImmutableTable, _extends({}, props, {
    className: classNames(className, "".concat(prefixCls, "-virtual")),
    scroll: _objectSpread2(_objectSpread2({}, scroll), {}, {
      x: scrollX
    }),
    components: _objectSpread2(_objectSpread2({}, components), {}, {
      // fix https://github.com/ant-design/ant-design/issues/48991
      body: data !== null && data !== void 0 && data.length ? renderBody : void 0
    }),
    columns,
    internalHooks: INTERNAL_HOOKS,
    tailor: true,
    ref
  })));
}
var RefVirtualTable = /* @__PURE__ */ reactExports.forwardRef(VirtualTable);
function genVirtualTable(shouldTriggerRender) {
  return makeImmutable(RefVirtualTable, shouldTriggerRender);
}
genVirtualTable();
const Column = (_) => null;
const ColumnGroup = (_) => null;
var TreeContext = /* @__PURE__ */ reactExports.createContext(null);
var UnstableContext = /* @__PURE__ */ reactExports.createContext({});
var Indent = function Indent2(_ref) {
  var prefixCls = _ref.prefixCls, level = _ref.level, isStart = _ref.isStart, isEnd = _ref.isEnd;
  var baseClassName = "".concat(prefixCls, "-indent-unit");
  var list = [];
  for (var i = 0; i < level; i += 1) {
    list.push(/* @__PURE__ */ reactExports.createElement("span", {
      key: i,
      className: classNames(baseClassName, _defineProperty(_defineProperty({}, "".concat(baseClassName, "-start"), isStart[i]), "".concat(baseClassName, "-end"), isEnd[i]))
    }));
  }
  return /* @__PURE__ */ reactExports.createElement("span", {
    "aria-hidden": "true",
    className: "".concat(prefixCls, "-indent")
  }, list);
};
const Indent$1 = /* @__PURE__ */ reactExports.memo(Indent);
var _excluded$2 = ["eventKey", "className", "style", "dragOver", "dragOverGapTop", "dragOverGapBottom", "isLeaf", "isStart", "isEnd", "expanded", "selected", "checked", "halfChecked", "loading", "domRef", "active", "data", "onMouseMove", "selectable"];
var ICON_OPEN = "open";
var ICON_CLOSE = "close";
var defaultTitle = "---";
var TreeNode = function TreeNode2(props) {
  var _unstableContext$node, _context$filterTreeNo, _classNames4;
  var eventKey = props.eventKey, className = props.className, style = props.style, dragOver = props.dragOver, dragOverGapTop = props.dragOverGapTop, dragOverGapBottom = props.dragOverGapBottom, isLeaf = props.isLeaf, isStart = props.isStart, isEnd = props.isEnd, expanded = props.expanded, selected = props.selected, checked = props.checked, halfChecked = props.halfChecked, loading = props.loading, domRef = props.domRef, active = props.active, data = props.data, onMouseMove = props.onMouseMove, selectable = props.selectable, otherProps = _objectWithoutProperties(props, _excluded$2);
  var context = ReactExports.useContext(TreeContext);
  var unstableContext = ReactExports.useContext(UnstableContext);
  var selectHandleRef = ReactExports.useRef(null);
  var _React$useState = ReactExports.useState(false), _React$useState2 = _slicedToArray(_React$useState, 2), dragNodeHighlight = _React$useState2[0], setDragNodeHighlight = _React$useState2[1];
  var isDisabled = !!(context.disabled || props.disabled || (_unstableContext$node = unstableContext.nodeDisabled) !== null && _unstableContext$node !== void 0 && _unstableContext$node.call(unstableContext, data));
  var isCheckable = ReactExports.useMemo(function() {
    if (!context.checkable || props.checkable === false) {
      return false;
    }
    return context.checkable;
  }, [context.checkable, props.checkable]);
  var onSelect = function onSelect2(e) {
    if (isDisabled) {
      return;
    }
    context.onNodeSelect(e, convertNodePropsToEventData(props));
  };
  var onCheck = function onCheck2(e) {
    if (isDisabled) {
      return;
    }
    if (!isCheckable || props.disableCheckbox) {
      return;
    }
    context.onNodeCheck(e, convertNodePropsToEventData(props), !checked);
  };
  var isSelectable = ReactExports.useMemo(function() {
    if (typeof selectable === "boolean") {
      return selectable;
    }
    return context.selectable;
  }, [selectable, context.selectable]);
  var onSelectorClick = function onSelectorClick2(e) {
    context.onNodeClick(e, convertNodePropsToEventData(props));
    if (isSelectable) {
      onSelect(e);
    } else {
      onCheck(e);
    }
  };
  var onSelectorDoubleClick = function onSelectorDoubleClick2(e) {
    context.onNodeDoubleClick(e, convertNodePropsToEventData(props));
  };
  var onMouseEnter = function onMouseEnter2(e) {
    context.onNodeMouseEnter(e, convertNodePropsToEventData(props));
  };
  var onMouseLeave = function onMouseLeave2(e) {
    context.onNodeMouseLeave(e, convertNodePropsToEventData(props));
  };
  var onContextMenu = function onContextMenu2(e) {
    context.onNodeContextMenu(e, convertNodePropsToEventData(props));
  };
  var isDraggable = ReactExports.useMemo(function() {
    return !!(context.draggable && (!context.draggable.nodeDraggable || context.draggable.nodeDraggable(data)));
  }, [context.draggable, data]);
  var onDragStart = function onDragStart2(e) {
    e.stopPropagation();
    setDragNodeHighlight(true);
    context.onNodeDragStart(e, props);
    try {
      e.dataTransfer.setData("text/plain", "");
    } catch (_unused) {
    }
  };
  var onDragEnter = function onDragEnter2(e) {
    e.preventDefault();
    e.stopPropagation();
    context.onNodeDragEnter(e, props);
  };
  var onDragOver = function onDragOver2(e) {
    e.preventDefault();
    e.stopPropagation();
    context.onNodeDragOver(e, props);
  };
  var onDragLeave = function onDragLeave2(e) {
    e.stopPropagation();
    context.onNodeDragLeave(e, props);
  };
  var onDragEnd = function onDragEnd2(e) {
    e.stopPropagation();
    setDragNodeHighlight(false);
    context.onNodeDragEnd(e, props);
  };
  var onDrop = function onDrop2(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragNodeHighlight(false);
    context.onNodeDrop(e, props);
  };
  var onExpand = function onExpand2(e) {
    if (loading) {
      return;
    }
    context.onNodeExpand(e, convertNodePropsToEventData(props));
  };
  var hasChildren = ReactExports.useMemo(function() {
    var _ref = getEntity(context.keyEntities, eventKey) || {}, children = _ref.children;
    return Boolean((children || []).length);
  }, [context.keyEntities, eventKey]);
  var memoizedIsLeaf = ReactExports.useMemo(function() {
    if (isLeaf === false) {
      return false;
    }
    return isLeaf || !context.loadData && !hasChildren || context.loadData && props.loaded && !hasChildren;
  }, [isLeaf, context.loadData, hasChildren, props.loaded]);
  ReactExports.useEffect(function() {
    if (loading) {
      return;
    }
    if (typeof context.loadData === "function" && expanded && !memoizedIsLeaf && !props.loaded) {
      context.onNodeLoad(convertNodePropsToEventData(props));
    }
  }, [loading, context.loadData, context.onNodeLoad, expanded, memoizedIsLeaf, props]);
  var dragHandlerNode = ReactExports.useMemo(function() {
    var _context$draggable;
    if (!((_context$draggable = context.draggable) !== null && _context$draggable !== void 0 && _context$draggable.icon)) {
      return null;
    }
    return /* @__PURE__ */ ReactExports.createElement("span", {
      className: "".concat(context.prefixCls, "-draggable-icon")
    }, context.draggable.icon);
  }, [context.draggable]);
  var renderSwitcherIconDom = function renderSwitcherIconDom2(isInternalLeaf) {
    var switcherIcon = props.switcherIcon || context.switcherIcon;
    if (typeof switcherIcon === "function") {
      return switcherIcon(_objectSpread2(_objectSpread2({}, props), {}, {
        isLeaf: isInternalLeaf
      }));
    }
    return switcherIcon;
  };
  var renderSwitcher = function renderSwitcher2() {
    if (memoizedIsLeaf) {
      var _switcherIconDom = renderSwitcherIconDom(true);
      return _switcherIconDom !== false ? /* @__PURE__ */ ReactExports.createElement("span", {
        className: classNames("".concat(context.prefixCls, "-switcher"), "".concat(context.prefixCls, "-switcher-noop"))
      }, _switcherIconDom) : null;
    }
    var switcherIconDom = renderSwitcherIconDom(false);
    return switcherIconDom !== false ? /* @__PURE__ */ ReactExports.createElement("span", {
      onClick: onExpand,
      className: classNames("".concat(context.prefixCls, "-switcher"), "".concat(context.prefixCls, "-switcher_").concat(expanded ? ICON_OPEN : ICON_CLOSE))
    }, switcherIconDom) : null;
  };
  var checkboxNode = ReactExports.useMemo(function() {
    if (!isCheckable) {
      return null;
    }
    var $custom = typeof isCheckable !== "boolean" ? isCheckable : null;
    return /* @__PURE__ */ ReactExports.createElement("span", {
      className: classNames("".concat(context.prefixCls, "-checkbox"), _defineProperty(_defineProperty(_defineProperty({}, "".concat(context.prefixCls, "-checkbox-checked"), checked), "".concat(context.prefixCls, "-checkbox-indeterminate"), !checked && halfChecked), "".concat(context.prefixCls, "-checkbox-disabled"), isDisabled || props.disableCheckbox)),
      onClick: onCheck,
      role: "checkbox",
      "aria-checked": halfChecked ? "mixed" : checked,
      "aria-disabled": isDisabled || props.disableCheckbox,
      "aria-label": "Select ".concat(typeof props.title === "string" ? props.title : "tree node")
    }, $custom);
  }, [isCheckable, checked, halfChecked, isDisabled, props.disableCheckbox, props.title]);
  var nodeState = ReactExports.useMemo(function() {
    if (memoizedIsLeaf) {
      return null;
    }
    return expanded ? ICON_OPEN : ICON_CLOSE;
  }, [memoizedIsLeaf, expanded]);
  var iconNode = ReactExports.useMemo(function() {
    return /* @__PURE__ */ ReactExports.createElement("span", {
      className: classNames("".concat(context.prefixCls, "-iconEle"), "".concat(context.prefixCls, "-icon__").concat(nodeState || "docu"), _defineProperty({}, "".concat(context.prefixCls, "-icon_loading"), loading))
    });
  }, [context.prefixCls, nodeState, loading]);
  var dropIndicatorNode = ReactExports.useMemo(function() {
    var rootDraggable = Boolean(context.draggable);
    var showIndicator = !props.disabled && rootDraggable && context.dragOverNodeKey === eventKey;
    if (!showIndicator) {
      return null;
    }
    return context.dropIndicatorRender({
      dropPosition: context.dropPosition,
      dropLevelOffset: context.dropLevelOffset,
      indent: context.indent,
      prefixCls: context.prefixCls,
      direction: context.direction
    });
  }, [context.dropPosition, context.dropLevelOffset, context.indent, context.prefixCls, context.direction, context.draggable, context.dragOverNodeKey, context.dropIndicatorRender]);
  var selectorNode = ReactExports.useMemo(function() {
    var _props$title = props.title, title2 = _props$title === void 0 ? defaultTitle : _props$title;
    var wrapClass = "".concat(context.prefixCls, "-node-content-wrapper");
    var $icon;
    if (context.showIcon) {
      var currentIcon = props.icon || context.icon;
      $icon = currentIcon ? /* @__PURE__ */ ReactExports.createElement("span", {
        className: classNames("".concat(context.prefixCls, "-iconEle"), "".concat(context.prefixCls, "-icon__customize"))
      }, typeof currentIcon === "function" ? currentIcon(props) : currentIcon) : iconNode;
    } else if (context.loadData && loading) {
      $icon = iconNode;
    }
    var titleNode;
    if (typeof title2 === "function") {
      titleNode = title2(data);
    } else if (context.titleRender) {
      titleNode = context.titleRender(data);
    } else {
      titleNode = title2;
    }
    return /* @__PURE__ */ ReactExports.createElement("span", {
      ref: selectHandleRef,
      title: typeof title2 === "string" ? title2 : "",
      className: classNames(wrapClass, "".concat(wrapClass, "-").concat(nodeState || "normal"), _defineProperty({}, "".concat(context.prefixCls, "-node-selected"), !isDisabled && (selected || dragNodeHighlight))),
      onMouseEnter,
      onMouseLeave,
      onContextMenu,
      onClick: onSelectorClick,
      onDoubleClick: onSelectorDoubleClick
    }, $icon, /* @__PURE__ */ ReactExports.createElement("span", {
      className: "".concat(context.prefixCls, "-title")
    }, titleNode), dropIndicatorNode);
  }, [context.prefixCls, context.showIcon, props, context.icon, iconNode, context.titleRender, data, nodeState, onMouseEnter, onMouseLeave, onContextMenu, onSelectorClick, onSelectorDoubleClick]);
  var dataOrAriaAttributeProps = pickAttrs(otherProps, {
    aria: true,
    data: true
  });
  var _ref2 = getEntity(context.keyEntities, eventKey) || {}, level = _ref2.level;
  var isEndNode = isEnd[isEnd.length - 1];
  var draggableWithoutDisabled = !isDisabled && isDraggable;
  var dragging = context.draggingNodeKey === eventKey;
  var ariaSelected = selectable !== void 0 ? {
    "aria-selected": !!selectable
  } : void 0;
  return /* @__PURE__ */ ReactExports.createElement("div", _extends({
    ref: domRef,
    role: "treeitem",
    "aria-expanded": isLeaf ? void 0 : expanded,
    className: classNames(className, "".concat(context.prefixCls, "-treenode"), (_classNames4 = {}, _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_classNames4, "".concat(context.prefixCls, "-treenode-disabled"), isDisabled), "".concat(context.prefixCls, "-treenode-switcher-").concat(expanded ? "open" : "close"), !isLeaf), "".concat(context.prefixCls, "-treenode-checkbox-checked"), checked), "".concat(context.prefixCls, "-treenode-checkbox-indeterminate"), halfChecked), "".concat(context.prefixCls, "-treenode-selected"), selected), "".concat(context.prefixCls, "-treenode-loading"), loading), "".concat(context.prefixCls, "-treenode-active"), active), "".concat(context.prefixCls, "-treenode-leaf-last"), isEndNode), "".concat(context.prefixCls, "-treenode-draggable"), isDraggable), "dragging", dragging), _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_classNames4, "drop-target", context.dropTargetKey === eventKey), "drop-container", context.dropContainerKey === eventKey), "drag-over", !isDisabled && dragOver), "drag-over-gap-top", !isDisabled && dragOverGapTop), "drag-over-gap-bottom", !isDisabled && dragOverGapBottom), "filter-node", (_context$filterTreeNo = context.filterTreeNode) === null || _context$filterTreeNo === void 0 ? void 0 : _context$filterTreeNo.call(context, convertNodePropsToEventData(props))), "".concat(context.prefixCls, "-treenode-leaf"), memoizedIsLeaf))),
    style,
    draggable: draggableWithoutDisabled,
    onDragStart: draggableWithoutDisabled ? onDragStart : void 0,
    onDragEnter: isDraggable ? onDragEnter : void 0,
    onDragOver: isDraggable ? onDragOver : void 0,
    onDragLeave: isDraggable ? onDragLeave : void 0,
    onDrop: isDraggable ? onDrop : void 0,
    onDragEnd: isDraggable ? onDragEnd : void 0,
    onMouseMove
  }, ariaSelected, dataOrAriaAttributeProps), /* @__PURE__ */ ReactExports.createElement(Indent$1, {
    prefixCls: context.prefixCls,
    level,
    isStart,
    isEnd
  }), dragHandlerNode, renderSwitcher(), checkboxNode, selectorNode);
};
TreeNode.isTreeNode = 1;
function arrDel(list, value) {
  if (!list) return [];
  var clone = list.slice();
  var index = clone.indexOf(value);
  if (index >= 0) {
    clone.splice(index, 1);
  }
  return clone;
}
function arrAdd(list, value) {
  var clone = (list || []).slice();
  if (clone.indexOf(value) === -1) {
    clone.push(value);
  }
  return clone;
}
function posToArr(pos) {
  return pos.split("-");
}
function getDragChildrenKeys(dragNodeKey, keyEntities) {
  var dragChildrenKeys = [];
  var entity = getEntity(keyEntities, dragNodeKey);
  function dig() {
    var list = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
    list.forEach(function(_ref) {
      var key = _ref.key, children = _ref.children;
      dragChildrenKeys.push(key);
      dig(children);
    });
  }
  dig(entity.children);
  return dragChildrenKeys;
}
function isLastChild(treeNodeEntity) {
  if (treeNodeEntity.parent) {
    var posArr = posToArr(treeNodeEntity.pos);
    return Number(posArr[posArr.length - 1]) === treeNodeEntity.parent.children.length - 1;
  }
  return false;
}
function isFirstChild(treeNodeEntity) {
  var posArr = posToArr(treeNodeEntity.pos);
  return Number(posArr[posArr.length - 1]) === 0;
}
function calcDropPosition(event, dragNodeProps, targetNodeProps, indent, startMousePosition, allowDrop2, flattenedNodes, keyEntities, expandKeys, direction) {
  var _abstractDropNodeEnti;
  var clientX = event.clientX, clientY = event.clientY;
  var _getBoundingClientRec = event.target.getBoundingClientRect(), top = _getBoundingClientRec.top, height = _getBoundingClientRec.height;
  var horizontalMouseOffset = (direction === "rtl" ? -1 : 1) * (((startMousePosition === null || startMousePosition === void 0 ? void 0 : startMousePosition.x) || 0) - clientX);
  var rawDropLevelOffset = (horizontalMouseOffset - 12) / indent;
  var filteredExpandKeys = expandKeys.filter(function(key) {
    var _keyEntities$key;
    return (_keyEntities$key = keyEntities[key]) === null || _keyEntities$key === void 0 || (_keyEntities$key = _keyEntities$key.children) === null || _keyEntities$key === void 0 ? void 0 : _keyEntities$key.length;
  });
  var abstractDropNodeEntity = getEntity(keyEntities, targetNodeProps.eventKey);
  if (clientY < top + height / 2) {
    var nodeIndex = flattenedNodes.findIndex(function(flattenedNode) {
      return flattenedNode.key === abstractDropNodeEntity.key;
    });
    var prevNodeIndex = nodeIndex <= 0 ? 0 : nodeIndex - 1;
    var prevNodeKey = flattenedNodes[prevNodeIndex].key;
    abstractDropNodeEntity = getEntity(keyEntities, prevNodeKey);
  }
  var initialAbstractDropNodeKey = abstractDropNodeEntity.key;
  var abstractDragOverEntity = abstractDropNodeEntity;
  var dragOverNodeKey = abstractDropNodeEntity.key;
  var dropPosition = 0;
  var dropLevelOffset = 0;
  if (!filteredExpandKeys.includes(initialAbstractDropNodeKey)) {
    for (var i = 0; i < rawDropLevelOffset; i += 1) {
      if (isLastChild(abstractDropNodeEntity)) {
        abstractDropNodeEntity = abstractDropNodeEntity.parent;
        dropLevelOffset += 1;
      } else {
        break;
      }
    }
  }
  var abstractDragDataNode = dragNodeProps.data;
  var abstractDropDataNode = abstractDropNodeEntity.node;
  var dropAllowed = true;
  if (isFirstChild(abstractDropNodeEntity) && abstractDropNodeEntity.level === 0 && clientY < top + height / 2 && allowDrop2({
    dragNode: abstractDragDataNode,
    dropNode: abstractDropDataNode,
    dropPosition: -1
  }) && abstractDropNodeEntity.key === targetNodeProps.eventKey) {
    dropPosition = -1;
  } else if ((abstractDragOverEntity.children || []).length && filteredExpandKeys.includes(dragOverNodeKey)) {
    if (allowDrop2({
      dragNode: abstractDragDataNode,
      dropNode: abstractDropDataNode,
      dropPosition: 0
    })) {
      dropPosition = 0;
    } else {
      dropAllowed = false;
    }
  } else if (dropLevelOffset === 0) {
    if (rawDropLevelOffset > -1.5) {
      if (allowDrop2({
        dragNode: abstractDragDataNode,
        dropNode: abstractDropDataNode,
        dropPosition: 1
      })) {
        dropPosition = 1;
      } else {
        dropAllowed = false;
      }
    } else {
      if (allowDrop2({
        dragNode: abstractDragDataNode,
        dropNode: abstractDropDataNode,
        dropPosition: 0
      })) {
        dropPosition = 0;
      } else if (allowDrop2({
        dragNode: abstractDragDataNode,
        dropNode: abstractDropDataNode,
        dropPosition: 1
      })) {
        dropPosition = 1;
      } else {
        dropAllowed = false;
      }
    }
  } else {
    if (allowDrop2({
      dragNode: abstractDragDataNode,
      dropNode: abstractDropDataNode,
      dropPosition: 1
    })) {
      dropPosition = 1;
    } else {
      dropAllowed = false;
    }
  }
  return {
    dropPosition,
    dropLevelOffset,
    dropTargetKey: abstractDropNodeEntity.key,
    dropTargetPos: abstractDropNodeEntity.pos,
    dragOverNodeKey,
    dropContainerKey: dropPosition === 0 ? null : ((_abstractDropNodeEnti = abstractDropNodeEntity.parent) === null || _abstractDropNodeEnti === void 0 ? void 0 : _abstractDropNodeEnti.key) || null,
    dropAllowed
  };
}
function calcSelectedKeys(selectedKeys, props) {
  if (!selectedKeys) return void 0;
  var multiple = props.multiple;
  if (multiple) {
    return selectedKeys.slice();
  }
  if (selectedKeys.length) {
    return [selectedKeys[0]];
  }
  return selectedKeys;
}
function parseCheckedKeys(keys) {
  if (!keys) {
    return null;
  }
  var keyProps;
  if (Array.isArray(keys)) {
    keyProps = {
      checkedKeys: keys,
      halfCheckedKeys: void 0
    };
  } else if (_typeof(keys) === "object") {
    keyProps = {
      checkedKeys: keys.checked || void 0,
      halfCheckedKeys: keys.halfChecked || void 0
    };
  } else {
    warningOnce(false, "`checkedKeys` is not an array or an object");
    return null;
  }
  return keyProps;
}
function conductExpandParent(keyList, keyEntities) {
  var expandedKeys = /* @__PURE__ */ new Set();
  function conductUp(key) {
    if (expandedKeys.has(key)) return;
    var entity = getEntity(keyEntities, key);
    if (!entity) return;
    expandedKeys.add(key);
    var parent = entity.parent, node = entity.node;
    if (node.disabled) return;
    if (parent) {
      conductUp(parent.key);
    }
  }
  (keyList || []).forEach(function(key) {
    conductUp(key);
  });
  return _toConsumableArray(expandedKeys);
}
const SELECTION_COLUMN = {};
const SELECTION_ALL = "SELECT_ALL";
const SELECTION_INVERT = "SELECT_INVERT";
const SELECTION_NONE = "SELECT_NONE";
const EMPTY_LIST$1 = [];
const flattenData = (childrenColumnName, data, list = []) => {
  (data || []).forEach((record) => {
    list.push(record);
    if (record && typeof record === "object" && childrenColumnName in record) {
      flattenData(childrenColumnName, record[childrenColumnName], list);
    }
  });
  return list;
};
const useSelection = (config, rowSelection) => {
  const {
    preserveSelectedRowKeys,
    selectedRowKeys,
    defaultSelectedRowKeys,
    getCheckboxProps,
    getTitleCheckboxProps,
    onChange: onSelectionChange,
    onSelect,
    onSelectAll,
    onSelectInvert,
    onSelectNone,
    onSelectMultiple,
    columnWidth: selectionColWidth,
    type: selectionType,
    selections,
    fixed,
    renderCell: customizeRenderCell,
    hideSelectAll,
    checkStrictly = true
  } = rowSelection || {};
  const {
    prefixCls,
    data,
    pageData,
    getRecordByKey,
    getRowKey,
    expandType,
    childrenColumnName,
    locale: tableLocale,
    getPopupContainer
  } = config;
  const warning = devUseWarning();
  const [multipleSelect, updatePrevSelectedIndex] = useMultipleSelect((item) => item);
  const [mergedSelectedKeys, setMergedSelectedKeys] = useMergedState(selectedRowKeys || defaultSelectedRowKeys || EMPTY_LIST$1, {
    value: selectedRowKeys
  });
  const preserveRecordsRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const updatePreserveRecordsCache = reactExports.useCallback((keys) => {
    if (preserveSelectedRowKeys) {
      const newCache = /* @__PURE__ */ new Map();
      keys.forEach((key) => {
        let record = getRecordByKey(key);
        if (!record && preserveRecordsRef.current.has(key)) {
          record = preserveRecordsRef.current.get(key);
        }
        newCache.set(key, record);
      });
      preserveRecordsRef.current = newCache;
    }
  }, [getRecordByKey, preserveSelectedRowKeys]);
  reactExports.useEffect(() => {
    updatePreserveRecordsCache(mergedSelectedKeys);
  }, [mergedSelectedKeys]);
  const flattedData = reactExports.useMemo(() => flattenData(childrenColumnName, pageData), [childrenColumnName, pageData]);
  const {
    keyEntities
  } = reactExports.useMemo(() => {
    if (checkStrictly) {
      return {
        keyEntities: null
      };
    }
    let convertData = data;
    if (preserveSelectedRowKeys) {
      const keysSet = new Set(flattedData.map((record, index) => getRowKey(record, index)));
      const preserveRecords = Array.from(preserveRecordsRef.current).reduce((total, [key, value]) => keysSet.has(key) ? total : total.concat(value), []);
      convertData = [].concat(_toConsumableArray(convertData), _toConsumableArray(preserveRecords));
    }
    return convertDataToEntities(convertData, {
      externalGetKey: getRowKey,
      childrenPropName: childrenColumnName
    });
  }, [data, getRowKey, checkStrictly, childrenColumnName, preserveSelectedRowKeys, flattedData]);
  const checkboxPropsMap = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    flattedData.forEach((record, index) => {
      const key = getRowKey(record, index);
      const checkboxProps = (getCheckboxProps ? getCheckboxProps(record) : null) || {};
      map.set(key, checkboxProps);
    });
    return map;
  }, [flattedData, getRowKey, getCheckboxProps]);
  const isCheckboxDisabled = reactExports.useCallback((r) => {
    const rowKey = getRowKey(r);
    let checkboxProps;
    if (checkboxPropsMap.has(rowKey)) {
      checkboxProps = checkboxPropsMap.get(getRowKey(r));
    } else {
      checkboxProps = getCheckboxProps ? getCheckboxProps(r) : void 0;
    }
    return !!(checkboxProps === null || checkboxProps === void 0 ? void 0 : checkboxProps.disabled);
  }, [checkboxPropsMap, getRowKey]);
  const [derivedSelectedKeys, derivedHalfSelectedKeys] = reactExports.useMemo(() => {
    if (checkStrictly) {
      return [mergedSelectedKeys || [], []];
    }
    const {
      checkedKeys,
      halfCheckedKeys
    } = conductCheck(mergedSelectedKeys, true, keyEntities, isCheckboxDisabled);
    return [checkedKeys || [], halfCheckedKeys];
  }, [mergedSelectedKeys, checkStrictly, keyEntities, isCheckboxDisabled]);
  const derivedSelectedKeySet = reactExports.useMemo(() => {
    const keys = selectionType === "radio" ? derivedSelectedKeys.slice(0, 1) : derivedSelectedKeys;
    return new Set(keys);
  }, [derivedSelectedKeys, selectionType]);
  const derivedHalfSelectedKeySet = reactExports.useMemo(() => selectionType === "radio" ? /* @__PURE__ */ new Set() : new Set(derivedHalfSelectedKeys), [derivedHalfSelectedKeys, selectionType]);
  reactExports.useEffect(() => {
    if (!rowSelection) {
      setMergedSelectedKeys(EMPTY_LIST$1);
    }
  }, [!!rowSelection]);
  const setSelectedKeys = reactExports.useCallback((keys, method) => {
    let availableKeys;
    let records;
    updatePreserveRecordsCache(keys);
    if (preserveSelectedRowKeys) {
      availableKeys = keys;
      records = keys.map((key) => preserveRecordsRef.current.get(key));
    } else {
      availableKeys = [];
      records = [];
      keys.forEach((key) => {
        const record = getRecordByKey(key);
        if (record !== void 0) {
          availableKeys.push(key);
          records.push(record);
        }
      });
    }
    setMergedSelectedKeys(availableKeys);
    onSelectionChange === null || onSelectionChange === void 0 ? void 0 : onSelectionChange(availableKeys, records, {
      type: method
    });
  }, [setMergedSelectedKeys, getRecordByKey, onSelectionChange, preserveSelectedRowKeys]);
  const triggerSingleSelection = reactExports.useCallback((key, selected, keys, event) => {
    if (onSelect) {
      const rows = keys.map((k) => getRecordByKey(k));
      onSelect(getRecordByKey(key), selected, rows, event);
    }
    setSelectedKeys(keys, "single");
  }, [onSelect, getRecordByKey, setSelectedKeys]);
  const mergedSelections = reactExports.useMemo(() => {
    if (!selections || hideSelectAll) {
      return null;
    }
    const selectionList = selections === true ? [SELECTION_ALL, SELECTION_INVERT, SELECTION_NONE] : selections;
    return selectionList.map((selection) => {
      if (selection === SELECTION_ALL) {
        return {
          key: "all",
          text: tableLocale.selectionAll,
          onSelect() {
            setSelectedKeys(data.map((record, index) => getRowKey(record, index)).filter((key) => {
              const checkProps = checkboxPropsMap.get(key);
              return !(checkProps === null || checkProps === void 0 ? void 0 : checkProps.disabled) || derivedSelectedKeySet.has(key);
            }), "all");
          }
        };
      }
      if (selection === SELECTION_INVERT) {
        return {
          key: "invert",
          text: tableLocale.selectInvert,
          onSelect() {
            const keySet = new Set(derivedSelectedKeySet);
            pageData.forEach((record, index) => {
              const key = getRowKey(record, index);
              const checkProps = checkboxPropsMap.get(key);
              if (!(checkProps === null || checkProps === void 0 ? void 0 : checkProps.disabled)) {
                if (keySet.has(key)) {
                  keySet.delete(key);
                } else {
                  keySet.add(key);
                }
              }
            });
            const keys = Array.from(keySet);
            if (onSelectInvert) {
              warning.deprecated(false, "onSelectInvert", "onChange");
              onSelectInvert(keys);
            }
            setSelectedKeys(keys, "invert");
          }
        };
      }
      if (selection === SELECTION_NONE) {
        return {
          key: "none",
          text: tableLocale.selectNone,
          onSelect() {
            onSelectNone === null || onSelectNone === void 0 ? void 0 : onSelectNone();
            setSelectedKeys(Array.from(derivedSelectedKeySet).filter((key) => {
              const checkProps = checkboxPropsMap.get(key);
              return checkProps === null || checkProps === void 0 ? void 0 : checkProps.disabled;
            }), "none");
          }
        };
      }
      return selection;
    }).map((selection) => Object.assign(Object.assign({}, selection), {
      onSelect: (...rest) => {
        var _a2;
        var _a;
        (_a = selection.onSelect) === null || _a === void 0 ? void 0 : (_a2 = _a).call.apply(_a2, [selection].concat(rest));
        updatePrevSelectedIndex(null);
      }
    }));
  }, [selections, derivedSelectedKeySet, pageData, getRowKey, onSelectInvert, setSelectedKeys]);
  const transformColumns = reactExports.useCallback((columns) => {
    var _a;
    if (!rowSelection) {
      return columns.filter((col) => col !== SELECTION_COLUMN);
    }
    let cloneColumns = _toConsumableArray(columns);
    const keySet = new Set(derivedSelectedKeySet);
    const recordKeys = flattedData.map(getRowKey).filter((key) => !checkboxPropsMap.get(key).disabled);
    const checkedCurrentAll = recordKeys.every((key) => keySet.has(key));
    const checkedCurrentSome = recordKeys.some((key) => keySet.has(key));
    const onSelectAllChange = () => {
      const changeKeys = [];
      if (checkedCurrentAll) {
        recordKeys.forEach((key) => {
          keySet.delete(key);
          changeKeys.push(key);
        });
      } else {
        recordKeys.forEach((key) => {
          if (!keySet.has(key)) {
            keySet.add(key);
            changeKeys.push(key);
          }
        });
      }
      const keys = Array.from(keySet);
      onSelectAll === null || onSelectAll === void 0 ? void 0 : onSelectAll(!checkedCurrentAll, keys.map((k) => getRecordByKey(k)), changeKeys.map((k) => getRecordByKey(k)));
      setSelectedKeys(keys, "all");
      updatePrevSelectedIndex(null);
    };
    let title2;
    let columnTitleCheckbox;
    if (selectionType !== "radio") {
      let customizeSelections;
      if (mergedSelections) {
        const menu = {
          getPopupContainer,
          items: mergedSelections.map((selection, index) => {
            const {
              key,
              text,
              onSelect: onSelectionClick
            } = selection;
            return {
              key: key !== null && key !== void 0 ? key : index,
              onClick: () => {
                onSelectionClick === null || onSelectionClick === void 0 ? void 0 : onSelectionClick(recordKeys);
              },
              label: text
            };
          })
        };
        customizeSelections = /* @__PURE__ */ reactExports.createElement("div", {
          className: `${prefixCls}-selection-extra`
        }, /* @__PURE__ */ reactExports.createElement(Dropdown, {
          menu,
          getPopupContainer
        }, /* @__PURE__ */ reactExports.createElement("span", null, /* @__PURE__ */ reactExports.createElement(RefIcon$i, null))));
      }
      const allDisabledData = flattedData.map((record, index) => {
        const key = getRowKey(record, index);
        const checkboxProps = checkboxPropsMap.get(key) || {};
        return Object.assign({
          checked: keySet.has(key)
        }, checkboxProps);
      }).filter(({
        disabled: disabled2
      }) => disabled2);
      const allDisabled = !!allDisabledData.length && allDisabledData.length === flattedData.length;
      const allDisabledAndChecked = allDisabled && allDisabledData.every(({
        checked
      }) => checked);
      const allDisabledSomeChecked = allDisabled && allDisabledData.some(({
        checked
      }) => checked);
      const customCheckboxProps = (getTitleCheckboxProps === null || getTitleCheckboxProps === void 0 ? void 0 : getTitleCheckboxProps()) || {};
      const {
        onChange,
        disabled
      } = customCheckboxProps;
      columnTitleCheckbox = /* @__PURE__ */ reactExports.createElement(Checkbox, Object.assign({
        "aria-label": customizeSelections ? "Custom selection" : "Select all"
      }, customCheckboxProps, {
        checked: !allDisabled ? !!flattedData.length && checkedCurrentAll : allDisabledAndChecked,
        indeterminate: !allDisabled ? !checkedCurrentAll && checkedCurrentSome : !allDisabledAndChecked && allDisabledSomeChecked,
        onChange: (e) => {
          onSelectAllChange();
          onChange === null || onChange === void 0 ? void 0 : onChange(e);
        },
        disabled: disabled !== null && disabled !== void 0 ? disabled : flattedData.length === 0 || allDisabled,
        skipGroup: true
      }));
      title2 = !hideSelectAll && /* @__PURE__ */ reactExports.createElement("div", {
        className: `${prefixCls}-selection`
      }, columnTitleCheckbox, customizeSelections);
    }
    let renderCell;
    if (selectionType === "radio") {
      renderCell = (_, record, index) => {
        const key = getRowKey(record, index);
        const checked = keySet.has(key);
        const checkboxProps = checkboxPropsMap.get(key);
        return {
          node: /* @__PURE__ */ reactExports.createElement(Radio, Object.assign({}, checkboxProps, {
            checked,
            onClick: (e) => {
              var _a2;
              e.stopPropagation();
              (_a2 = checkboxProps === null || checkboxProps === void 0 ? void 0 : checkboxProps.onClick) === null || _a2 === void 0 ? void 0 : _a2.call(checkboxProps, e);
            },
            onChange: (event) => {
              var _a2;
              if (!keySet.has(key)) {
                triggerSingleSelection(key, true, [key], event.nativeEvent);
              }
              (_a2 = checkboxProps === null || checkboxProps === void 0 ? void 0 : checkboxProps.onChange) === null || _a2 === void 0 ? void 0 : _a2.call(checkboxProps, event);
            }
          })),
          checked
        };
      };
    } else {
      renderCell = (_, record, index) => {
        var _a2;
        const key = getRowKey(record, index);
        const checked = keySet.has(key);
        const indeterminate = derivedHalfSelectedKeySet.has(key);
        const checkboxProps = checkboxPropsMap.get(key);
        let mergedIndeterminate;
        if (expandType === "nest") {
          mergedIndeterminate = indeterminate;
        } else {
          mergedIndeterminate = (_a2 = checkboxProps === null || checkboxProps === void 0 ? void 0 : checkboxProps.indeterminate) !== null && _a2 !== void 0 ? _a2 : indeterminate;
        }
        return {
          node: /* @__PURE__ */ reactExports.createElement(Checkbox, Object.assign({}, checkboxProps, {
            indeterminate: mergedIndeterminate,
            checked,
            skipGroup: true,
            onClick: (e) => {
              var _a3;
              e.stopPropagation();
              (_a3 = checkboxProps === null || checkboxProps === void 0 ? void 0 : checkboxProps.onClick) === null || _a3 === void 0 ? void 0 : _a3.call(checkboxProps, e);
            },
            onChange: (event) => {
              var _a3;
              const {
                nativeEvent
              } = event;
              const {
                shiftKey
              } = nativeEvent;
              const currentSelectedIndex = recordKeys.indexOf(key);
              const isMultiple = derivedSelectedKeys.some((item) => recordKeys.includes(item));
              if (shiftKey && checkStrictly && isMultiple) {
                const changedKeys = multipleSelect(currentSelectedIndex, recordKeys, keySet);
                const keys = Array.from(keySet);
                onSelectMultiple === null || onSelectMultiple === void 0 ? void 0 : onSelectMultiple(!checked, keys.map((recordKey) => getRecordByKey(recordKey)), changedKeys.map((recordKey) => getRecordByKey(recordKey)));
                setSelectedKeys(keys, "multiple");
              } else {
                const originCheckedKeys = derivedSelectedKeys;
                if (checkStrictly) {
                  const checkedKeys = checked ? arrDel(originCheckedKeys, key) : arrAdd(originCheckedKeys, key);
                  triggerSingleSelection(key, !checked, checkedKeys, nativeEvent);
                } else {
                  const result = conductCheck([].concat(_toConsumableArray(originCheckedKeys), [key]), true, keyEntities, isCheckboxDisabled);
                  const {
                    checkedKeys,
                    halfCheckedKeys
                  } = result;
                  let nextCheckedKeys = checkedKeys;
                  if (checked) {
                    const tempKeySet = new Set(checkedKeys);
                    tempKeySet.delete(key);
                    nextCheckedKeys = conductCheck(Array.from(tempKeySet), {
                      halfCheckedKeys
                    }, keyEntities, isCheckboxDisabled).checkedKeys;
                  }
                  triggerSingleSelection(key, !checked, nextCheckedKeys, nativeEvent);
                }
              }
              if (checked) {
                updatePrevSelectedIndex(null);
              } else {
                updatePrevSelectedIndex(currentSelectedIndex);
              }
              (_a3 = checkboxProps === null || checkboxProps === void 0 ? void 0 : checkboxProps.onChange) === null || _a3 === void 0 ? void 0 : _a3.call(checkboxProps, event);
            }
          })),
          checked
        };
      };
    }
    const renderSelectionCell = (_, record, index) => {
      const {
        node,
        checked
      } = renderCell(_, record, index);
      if (customizeRenderCell) {
        return customizeRenderCell(checked, record, index, node);
      }
      return node;
    };
    if (!cloneColumns.includes(SELECTION_COLUMN)) {
      if (cloneColumns.findIndex((col) => {
        var _a2;
        return ((_a2 = col[INTERNAL_COL_DEFINE]) === null || _a2 === void 0 ? void 0 : _a2.columnType) === "EXPAND_COLUMN";
      }) === 0) {
        const [expandColumn, ...restColumns] = cloneColumns;
        cloneColumns = [expandColumn, SELECTION_COLUMN].concat(_toConsumableArray(restColumns));
      } else {
        cloneColumns = [SELECTION_COLUMN].concat(_toConsumableArray(cloneColumns));
      }
    }
    const selectionColumnIndex = cloneColumns.indexOf(SELECTION_COLUMN);
    cloneColumns = cloneColumns.filter((column, index) => column !== SELECTION_COLUMN || index === selectionColumnIndex);
    const prevCol = cloneColumns[selectionColumnIndex - 1];
    const nextCol = cloneColumns[selectionColumnIndex + 1];
    let mergedFixed = fixed;
    if (mergedFixed === void 0) {
      if ((nextCol === null || nextCol === void 0 ? void 0 : nextCol.fixed) !== void 0) {
        mergedFixed = nextCol.fixed;
      } else if ((prevCol === null || prevCol === void 0 ? void 0 : prevCol.fixed) !== void 0) {
        mergedFixed = prevCol.fixed;
      }
    }
    if (mergedFixed && prevCol && ((_a = prevCol[INTERNAL_COL_DEFINE]) === null || _a === void 0 ? void 0 : _a.columnType) === "EXPAND_COLUMN" && prevCol.fixed === void 0) {
      prevCol.fixed = mergedFixed;
    }
    const columnCls = classNames(`${prefixCls}-selection-col`, {
      [`${prefixCls}-selection-col-with-dropdown`]: selections && selectionType === "checkbox"
    });
    const renderColumnTitle2 = () => {
      if (!(rowSelection === null || rowSelection === void 0 ? void 0 : rowSelection.columnTitle)) {
        return title2;
      }
      if (typeof rowSelection.columnTitle === "function") {
        return rowSelection.columnTitle(columnTitleCheckbox);
      }
      return rowSelection.columnTitle;
    };
    const selectionColumn = {
      fixed: mergedFixed,
      width: selectionColWidth,
      className: `${prefixCls}-selection-column`,
      title: renderColumnTitle2(),
      render: renderSelectionCell,
      onCell: rowSelection.onCell,
      align: rowSelection.align,
      [INTERNAL_COL_DEFINE]: {
        className: columnCls
      }
    };
    return cloneColumns.map((col) => col === SELECTION_COLUMN ? selectionColumn : col);
  }, [getRowKey, flattedData, rowSelection, derivedSelectedKeys, derivedSelectedKeySet, derivedHalfSelectedKeySet, selectionColWidth, mergedSelections, expandType, checkboxPropsMap, onSelectMultiple, triggerSingleSelection, isCheckboxDisabled]);
  return [transformColumns, derivedSelectedKeySet];
};
function renderExpandIcon(locale) {
  return (props) => {
    const {
      prefixCls,
      onExpand,
      record,
      expanded,
      expandable
    } = props;
    const iconPrefix = `${prefixCls}-row-expand-icon`;
    return /* @__PURE__ */ reactExports.createElement("button", {
      type: "button",
      onClick: (e) => {
        onExpand(record, e);
        e.stopPropagation();
      },
      className: classNames(iconPrefix, {
        [`${iconPrefix}-spaced`]: !expandable,
        [`${iconPrefix}-expanded`]: expandable && expanded,
        [`${iconPrefix}-collapsed`]: expandable && !expanded
      }),
      "aria-label": expanded ? locale.collapse : locale.expand,
      "aria-expanded": expanded
    });
  };
}
function useContainerWidth(prefixCls) {
  const getContainerWidth = (ele, width) => {
    const container = ele.querySelector(`.${prefixCls}-container`);
    let returnWidth = width;
    if (container) {
      const style = getComputedStyle(container);
      const borderLeft = Number.parseInt(style.borderLeftWidth, 10);
      const borderRight = Number.parseInt(style.borderRightWidth, 10);
      returnWidth = width - borderLeft - borderRight;
    }
    return returnWidth;
  };
  return getContainerWidth;
}
const getColumnKey = (column, defaultKey) => {
  if ("key" in column && column.key !== void 0 && column.key !== null) {
    return column.key;
  }
  if (column.dataIndex) {
    return Array.isArray(column.dataIndex) ? column.dataIndex.join(".") : column.dataIndex;
  }
  return defaultKey;
};
function getColumnPos(index, pos) {
  return pos ? `${pos}-${index}` : `${index}`;
}
const renderColumnTitle = (title2, props) => {
  if (typeof title2 === "function") {
    return title2(props);
  }
  return title2;
};
const safeColumnTitle = (title2, props) => {
  const res = renderColumnTitle(title2, props);
  if (Object.prototype.toString.call(res) === "[object Object]") {
    return "";
  }
  return res;
};
var FilterFilled$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M349 838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V642H349v196zm531.1-684H143.9c-24.5 0-39.8 26.7-27.5 48l221.3 376h348.8l221.3-376c12.1-21.3-3.2-48-27.7-48z" } }] }, "name": "filter", "theme": "filled" };
var FilterFilled = function FilterFilled2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: FilterFilled$1
  }));
};
var RefIcon$g = /* @__PURE__ */ reactExports.forwardRef(FilterFilled);
var DropIndicator = function DropIndicator2(props) {
  var dropPosition = props.dropPosition, dropLevelOffset = props.dropLevelOffset, indent = props.indent;
  var style = {
    pointerEvents: "none",
    position: "absolute",
    right: 0,
    backgroundColor: "red",
    height: 2
  };
  switch (dropPosition) {
    case -1:
      style.top = 0;
      style.left = -dropLevelOffset * indent;
      break;
    case 1:
      style.bottom = 0;
      style.left = -dropLevelOffset * indent;
      break;
    case 0:
      style.bottom = 0;
      style.left = indent;
      break;
  }
  return /* @__PURE__ */ ReactExports.createElement("div", {
    style
  });
};
function _objectDestructuringEmpty(t) {
  if (null == t) throw new TypeError("Cannot destructure " + t);
}
function useUnmount(triggerStart, triggerEnd) {
  var _React$useState = reactExports.useState(false), _React$useState2 = _slicedToArray(_React$useState, 2), firstMount = _React$useState2[0], setFirstMount = _React$useState2[1];
  useLayoutEffect(function() {
    if (firstMount) {
      triggerStart();
      return function() {
        triggerEnd();
      };
    }
  }, [firstMount]);
  useLayoutEffect(function() {
    setFirstMount(true);
    return function() {
      setFirstMount(false);
    };
  }, []);
}
var _excluded$1 = ["className", "style", "motion", "motionNodes", "motionType", "onMotionStart", "onMotionEnd", "active", "treeNodeRequiredProps"];
var MotionTreeNode = /* @__PURE__ */ reactExports.forwardRef(function(oriProps, ref) {
  var className = oriProps.className, style = oriProps.style, motion = oriProps.motion, motionNodes = oriProps.motionNodes, motionType = oriProps.motionType, onOriginMotionStart = oriProps.onMotionStart, onOriginMotionEnd = oriProps.onMotionEnd, active = oriProps.active, treeNodeRequiredProps = oriProps.treeNodeRequiredProps, props = _objectWithoutProperties(oriProps, _excluded$1);
  var _React$useState = reactExports.useState(true), _React$useState2 = _slicedToArray(_React$useState, 2), visible = _React$useState2[0], setVisible = _React$useState2[1];
  var _React$useContext = reactExports.useContext(TreeContext), prefixCls = _React$useContext.prefixCls;
  var targetVisible = motionNodes && motionType !== "hide";
  useLayoutEffect(function() {
    if (motionNodes) {
      if (targetVisible !== visible) {
        setVisible(targetVisible);
      }
    }
  }, [motionNodes]);
  var triggerMotionStart = function triggerMotionStart2() {
    if (motionNodes) {
      onOriginMotionStart();
    }
  };
  var triggerMotionEndRef = reactExports.useRef(false);
  var triggerMotionEnd = function triggerMotionEnd2() {
    if (motionNodes && !triggerMotionEndRef.current) {
      triggerMotionEndRef.current = true;
      onOriginMotionEnd();
    }
  };
  useUnmount(triggerMotionStart, triggerMotionEnd);
  var onVisibleChanged = function onVisibleChanged2(nextVisible) {
    if (targetVisible === nextVisible) {
      triggerMotionEnd();
    }
  };
  if (motionNodes) {
    return /* @__PURE__ */ reactExports.createElement(CSSMotion, _extends({
      ref,
      visible
    }, motion, {
      motionAppear: motionType === "show",
      onVisibleChanged
    }), function(_ref, motionRef) {
      var motionClassName = _ref.className, motionStyle = _ref.style;
      return /* @__PURE__ */ reactExports.createElement("div", {
        ref: motionRef,
        className: classNames("".concat(prefixCls, "-treenode-motion"), motionClassName),
        style: motionStyle
      }, motionNodes.map(function(treeNode) {
        var restProps = Object.assign({}, (_objectDestructuringEmpty(treeNode.data), treeNode.data)), title2 = treeNode.title, key = treeNode.key, isStart = treeNode.isStart, isEnd = treeNode.isEnd;
        delete restProps.children;
        var treeNodeProps = getTreeNodeProps(key, treeNodeRequiredProps);
        return /* @__PURE__ */ reactExports.createElement(TreeNode, _extends({}, restProps, treeNodeProps, {
          title: title2,
          active,
          data: treeNode.data,
          key,
          isStart,
          isEnd
        }));
      }));
    });
  }
  return /* @__PURE__ */ reactExports.createElement(TreeNode, _extends({
    domRef: ref,
    className,
    style
  }, props, {
    active
  }));
});
function findExpandedKeys() {
  var prev = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : [];
  var next = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : [];
  var prevLen = prev.length;
  var nextLen = next.length;
  if (Math.abs(prevLen - nextLen) !== 1) {
    return {
      add: false,
      key: null
    };
  }
  function find(shorter, longer) {
    var cache = /* @__PURE__ */ new Map();
    shorter.forEach(function(key) {
      cache.set(key, true);
    });
    var keys = longer.filter(function(key) {
      return !cache.has(key);
    });
    return keys.length === 1 ? keys[0] : null;
  }
  if (prevLen < nextLen) {
    return {
      add: true,
      key: find(prev, next)
    };
  }
  return {
    add: false,
    key: find(next, prev)
  };
}
function getExpandRange(shorter, longer, key) {
  var shorterStartIndex = shorter.findIndex(function(data) {
    return data.key === key;
  });
  var shorterEndNode = shorter[shorterStartIndex + 1];
  var longerStartIndex = longer.findIndex(function(data) {
    return data.key === key;
  });
  if (shorterEndNode) {
    var longerEndIndex = longer.findIndex(function(data) {
      return data.key === shorterEndNode.key;
    });
    return longer.slice(longerStartIndex + 1, longerEndIndex);
  }
  return longer.slice(longerStartIndex + 1);
}
var _excluded = ["prefixCls", "data", "selectable", "checkable", "expandedKeys", "selectedKeys", "checkedKeys", "loadedKeys", "loadingKeys", "halfCheckedKeys", "keyEntities", "disabled", "dragging", "dragOverNodeKey", "dropPosition", "motion", "height", "itemHeight", "virtual", "scrollWidth", "focusable", "activeItem", "focused", "tabIndex", "onKeyDown", "onFocus", "onBlur", "onActiveChange", "onListChangeStart", "onListChangeEnd"];
var HIDDEN_STYLE = {
  width: 0,
  height: 0,
  display: "flex",
  overflow: "hidden",
  opacity: 0,
  border: 0,
  padding: 0,
  margin: 0
};
var noop = function noop2() {
};
var MOTION_KEY = "RC_TREE_MOTION_".concat(Math.random());
var MotionNode = {
  key: MOTION_KEY
};
var MotionEntity = {
  key: MOTION_KEY,
  level: 0,
  index: 0,
  pos: "0",
  node: MotionNode,
  nodes: [MotionNode]
};
var MotionFlattenData = {
  parent: null,
  children: [],
  pos: MotionEntity.pos,
  data: MotionNode,
  title: null,
  key: MOTION_KEY,
  /** Hold empty list here since we do not use it */
  isStart: [],
  isEnd: []
};
function getMinimumRangeTransitionRange(list, virtual, height, itemHeight) {
  if (virtual === false || !height) {
    return list;
  }
  return list.slice(0, Math.ceil(height / itemHeight) + 1);
}
function itemKey(item) {
  var key = item.key, pos = item.pos;
  return getKey(key, pos);
}
function getAccessibilityPath(item) {
  var path = String(item.data.key);
  var current = item;
  while (current.parent) {
    current = current.parent;
    path = "".concat(current.data.key, " > ").concat(path);
  }
  return path;
}
var NodeList = /* @__PURE__ */ reactExports.forwardRef(function(props, ref) {
  var prefixCls = props.prefixCls, data = props.data;
  props.selectable;
  props.checkable;
  var expandedKeys = props.expandedKeys, selectedKeys = props.selectedKeys, checkedKeys = props.checkedKeys, loadedKeys = props.loadedKeys, loadingKeys = props.loadingKeys, halfCheckedKeys = props.halfCheckedKeys, keyEntities = props.keyEntities, disabled = props.disabled, dragging = props.dragging, dragOverNodeKey = props.dragOverNodeKey, dropPosition = props.dropPosition, motion = props.motion, height = props.height, itemHeight = props.itemHeight, virtual = props.virtual, scrollWidth = props.scrollWidth, focusable = props.focusable, activeItem = props.activeItem, focused = props.focused, tabIndex = props.tabIndex, onKeyDown2 = props.onKeyDown, onFocus = props.onFocus, onBlur = props.onBlur, onActiveChange = props.onActiveChange, onListChangeStart = props.onListChangeStart, onListChangeEnd = props.onListChangeEnd, domProps = _objectWithoutProperties(props, _excluded);
  var listRef = reactExports.useRef(null);
  var indentMeasurerRef = reactExports.useRef(null);
  reactExports.useImperativeHandle(ref, function() {
    return {
      scrollTo: function scrollTo2(scroll) {
        listRef.current.scrollTo(scroll);
      },
      getIndentWidth: function getIndentWidth() {
        return indentMeasurerRef.current.offsetWidth;
      }
    };
  });
  var _React$useState = reactExports.useState(expandedKeys), _React$useState2 = _slicedToArray(_React$useState, 2), prevExpandedKeys = _React$useState2[0], setPrevExpandedKeys = _React$useState2[1];
  var _React$useState3 = reactExports.useState(data), _React$useState4 = _slicedToArray(_React$useState3, 2), prevData = _React$useState4[0], setPrevData = _React$useState4[1];
  var _React$useState5 = reactExports.useState(data), _React$useState6 = _slicedToArray(_React$useState5, 2), transitionData = _React$useState6[0], setTransitionData = _React$useState6[1];
  var _React$useState7 = reactExports.useState([]), _React$useState8 = _slicedToArray(_React$useState7, 2), transitionRange = _React$useState8[0], setTransitionRange = _React$useState8[1];
  var _React$useState9 = reactExports.useState(null), _React$useState10 = _slicedToArray(_React$useState9, 2), motionType = _React$useState10[0], setMotionType = _React$useState10[1];
  var dataRef = reactExports.useRef(data);
  dataRef.current = data;
  function onMotionEnd() {
    var latestData = dataRef.current;
    setPrevData(latestData);
    setTransitionData(latestData);
    setTransitionRange([]);
    setMotionType(null);
    onListChangeEnd();
  }
  useLayoutEffect(function() {
    setPrevExpandedKeys(expandedKeys);
    var diffExpanded = findExpandedKeys(prevExpandedKeys, expandedKeys);
    if (diffExpanded.key !== null) {
      if (diffExpanded.add) {
        var keyIndex = prevData.findIndex(function(_ref) {
          var key = _ref.key;
          return key === diffExpanded.key;
        });
        var rangeNodes = getMinimumRangeTransitionRange(getExpandRange(prevData, data, diffExpanded.key), virtual, height, itemHeight);
        var newTransitionData = prevData.slice();
        newTransitionData.splice(keyIndex + 1, 0, MotionFlattenData);
        setTransitionData(newTransitionData);
        setTransitionRange(rangeNodes);
        setMotionType("show");
      } else {
        var _keyIndex = data.findIndex(function(_ref2) {
          var key = _ref2.key;
          return key === diffExpanded.key;
        });
        var _rangeNodes = getMinimumRangeTransitionRange(getExpandRange(data, prevData, diffExpanded.key), virtual, height, itemHeight);
        var _newTransitionData = data.slice();
        _newTransitionData.splice(_keyIndex + 1, 0, MotionFlattenData);
        setTransitionData(_newTransitionData);
        setTransitionRange(_rangeNodes);
        setMotionType("hide");
      }
    } else if (prevData !== data) {
      setPrevData(data);
      setTransitionData(data);
    }
  }, [expandedKeys, data]);
  reactExports.useEffect(function() {
    if (!dragging) {
      onMotionEnd();
    }
  }, [dragging]);
  var mergedData = motion ? transitionData : data;
  var treeNodeRequiredProps = {
    expandedKeys,
    selectedKeys,
    loadedKeys,
    loadingKeys,
    checkedKeys,
    halfCheckedKeys,
    dragOverNodeKey,
    dropPosition,
    keyEntities
  };
  return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, focused && activeItem && /* @__PURE__ */ reactExports.createElement("span", {
    style: HIDDEN_STYLE,
    "aria-live": "assertive"
  }, getAccessibilityPath(activeItem)), /* @__PURE__ */ reactExports.createElement("div", null, /* @__PURE__ */ reactExports.createElement("input", {
    style: HIDDEN_STYLE,
    disabled: focusable === false || disabled,
    tabIndex: focusable !== false ? tabIndex : null,
    onKeyDown: onKeyDown2,
    onFocus,
    onBlur,
    value: "",
    onChange: noop,
    "aria-label": "for screen reader"
  })), /* @__PURE__ */ reactExports.createElement("div", {
    className: "".concat(prefixCls, "-treenode"),
    "aria-hidden": true,
    style: {
      position: "absolute",
      pointerEvents: "none",
      visibility: "hidden",
      height: 0,
      overflow: "hidden",
      border: 0,
      padding: 0
    }
  }, /* @__PURE__ */ reactExports.createElement("div", {
    className: "".concat(prefixCls, "-indent")
  }, /* @__PURE__ */ reactExports.createElement("div", {
    ref: indentMeasurerRef,
    className: "".concat(prefixCls, "-indent-unit")
  }))), /* @__PURE__ */ reactExports.createElement(List, _extends({}, domProps, {
    data: mergedData,
    itemKey,
    height,
    fullHeight: false,
    virtual,
    itemHeight,
    scrollWidth,
    prefixCls: "".concat(prefixCls, "-list"),
    ref: listRef,
    role: "tree",
    onVisibleChange: function onVisibleChange(originList) {
      if (originList.every(function(item) {
        return itemKey(item) !== MOTION_KEY;
      })) {
        onMotionEnd();
      }
    }
  }), function(treeNode) {
    var pos = treeNode.pos, restProps = Object.assign({}, (_objectDestructuringEmpty(treeNode.data), treeNode.data)), title2 = treeNode.title, key = treeNode.key, isStart = treeNode.isStart, isEnd = treeNode.isEnd;
    var mergedKey = getKey(key, pos);
    delete restProps.key;
    delete restProps.children;
    var treeNodeProps = getTreeNodeProps(mergedKey, treeNodeRequiredProps);
    return /* @__PURE__ */ reactExports.createElement(MotionTreeNode, _extends({}, restProps, treeNodeProps, {
      title: title2,
      active: !!activeItem && key === activeItem.key,
      pos,
      data: treeNode.data,
      isStart,
      isEnd,
      motion,
      motionNodes: key === MOTION_KEY ? transitionRange : null,
      motionType,
      onMotionStart: onListChangeStart,
      onMotionEnd,
      treeNodeRequiredProps,
      onMouseMove: function onMouseMove() {
        onActiveChange(null);
      }
    }));
  }));
});
var MAX_RETRY_TIMES = 10;
var Tree$2 = /* @__PURE__ */ (function(_React$Component) {
  _inherits(Tree2, _React$Component);
  var _super = _createSuper(Tree2);
  function Tree2() {
    var _this;
    _classCallCheck(this, Tree2);
    for (var _len = arguments.length, _args = new Array(_len), _key = 0; _key < _len; _key++) {
      _args[_key] = arguments[_key];
    }
    _this = _super.call.apply(_super, [this].concat(_args));
    _defineProperty(_assertThisInitialized(_this), "destroyed", false);
    _defineProperty(_assertThisInitialized(_this), "delayedDragEnterLogic", void 0);
    _defineProperty(_assertThisInitialized(_this), "loadingRetryTimes", {});
    _defineProperty(_assertThisInitialized(_this), "state", {
      keyEntities: {},
      indent: null,
      selectedKeys: [],
      checkedKeys: [],
      halfCheckedKeys: [],
      loadedKeys: [],
      loadingKeys: [],
      expandedKeys: [],
      draggingNodeKey: null,
      dragChildrenKeys: [],
      // dropTargetKey is the key of abstract-drop-node
      // the abstract-drop-node is the real drop node when drag and drop
      // not the DOM drag over node
      dropTargetKey: null,
      dropPosition: null,
      // the drop position of abstract-drop-node, inside 0, top -1, bottom 1
      dropContainerKey: null,
      // the container key of abstract-drop-node if dropPosition is -1 or 1
      dropLevelOffset: null,
      // the drop level offset of abstract-drag-over-node
      dropTargetPos: null,
      // the pos of abstract-drop-node
      dropAllowed: true,
      // if drop to abstract-drop-node is allowed
      // the abstract-drag-over-node
      // if mouse is on the bottom of top dom node or no the top of the bottom dom node
      // abstract-drag-over-node is the top node
      dragOverNodeKey: null,
      treeData: [],
      flattenNodes: [],
      focused: false,
      activeKey: null,
      listChanging: false,
      prevProps: null,
      fieldNames: fillFieldNames()
    });
    _defineProperty(_assertThisInitialized(_this), "dragStartMousePosition", null);
    _defineProperty(_assertThisInitialized(_this), "dragNodeProps", null);
    _defineProperty(_assertThisInitialized(_this), "currentMouseOverDroppableNodeKey", null);
    _defineProperty(_assertThisInitialized(_this), "listRef", /* @__PURE__ */ reactExports.createRef());
    _defineProperty(_assertThisInitialized(_this), "onNodeDragStart", function(event, nodeProps) {
      var _this$state = _this.state, expandedKeys = _this$state.expandedKeys, keyEntities = _this$state.keyEntities;
      var onDragStart = _this.props.onDragStart;
      var eventKey = nodeProps.eventKey;
      _this.dragNodeProps = nodeProps;
      _this.dragStartMousePosition = {
        x: event.clientX,
        y: event.clientY
      };
      var newExpandedKeys = arrDel(expandedKeys, eventKey);
      _this.setState({
        draggingNodeKey: eventKey,
        dragChildrenKeys: getDragChildrenKeys(eventKey, keyEntities),
        indent: _this.listRef.current.getIndentWidth()
      });
      _this.setExpandedKeys(newExpandedKeys);
      window.addEventListener("dragend", _this.onWindowDragEnd);
      onDragStart === null || onDragStart === void 0 || onDragStart({
        event,
        node: convertNodePropsToEventData(nodeProps)
      });
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeDragEnter", function(event, nodeProps) {
      var _this$state2 = _this.state, expandedKeys = _this$state2.expandedKeys, keyEntities = _this$state2.keyEntities, dragChildrenKeys = _this$state2.dragChildrenKeys, flattenNodes = _this$state2.flattenNodes, indent = _this$state2.indent;
      var _this$props = _this.props, onDragEnter = _this$props.onDragEnter, onExpand = _this$props.onExpand, allowDrop2 = _this$props.allowDrop, direction = _this$props.direction;
      var pos = nodeProps.pos, eventKey = nodeProps.eventKey;
      if (_this.currentMouseOverDroppableNodeKey !== eventKey) {
        _this.currentMouseOverDroppableNodeKey = eventKey;
      }
      if (!_this.dragNodeProps) {
        _this.resetDragState();
        return;
      }
      var _calcDropPosition = calcDropPosition(event, _this.dragNodeProps, nodeProps, indent, _this.dragStartMousePosition, allowDrop2, flattenNodes, keyEntities, expandedKeys, direction), dropPosition = _calcDropPosition.dropPosition, dropLevelOffset = _calcDropPosition.dropLevelOffset, dropTargetKey = _calcDropPosition.dropTargetKey, dropContainerKey = _calcDropPosition.dropContainerKey, dropTargetPos = _calcDropPosition.dropTargetPos, dropAllowed = _calcDropPosition.dropAllowed, dragOverNodeKey = _calcDropPosition.dragOverNodeKey;
      if (
        // don't allow drop inside its children
        dragChildrenKeys.includes(dropTargetKey) || // don't allow drop when drop is not allowed caculated by calcDropPosition
        !dropAllowed
      ) {
        _this.resetDragState();
        return;
      }
      if (!_this.delayedDragEnterLogic) {
        _this.delayedDragEnterLogic = {};
      }
      Object.keys(_this.delayedDragEnterLogic).forEach(function(key) {
        clearTimeout(_this.delayedDragEnterLogic[key]);
      });
      if (_this.dragNodeProps.eventKey !== nodeProps.eventKey) {
        event.persist();
        _this.delayedDragEnterLogic[pos] = window.setTimeout(function() {
          if (_this.state.draggingNodeKey === null) {
            return;
          }
          var newExpandedKeys = _toConsumableArray(expandedKeys);
          var entity = getEntity(keyEntities, nodeProps.eventKey);
          if (entity && (entity.children || []).length) {
            newExpandedKeys = arrAdd(expandedKeys, nodeProps.eventKey);
          }
          if (!_this.props.hasOwnProperty("expandedKeys")) {
            _this.setExpandedKeys(newExpandedKeys);
          }
          onExpand === null || onExpand === void 0 || onExpand(newExpandedKeys, {
            node: convertNodePropsToEventData(nodeProps),
            expanded: true,
            nativeEvent: event.nativeEvent
          });
        }, 800);
      }
      if (_this.dragNodeProps.eventKey === dropTargetKey && dropLevelOffset === 0) {
        _this.resetDragState();
        return;
      }
      _this.setState({
        dragOverNodeKey,
        dropPosition,
        dropLevelOffset,
        dropTargetKey,
        dropContainerKey,
        dropTargetPos,
        dropAllowed
      });
      onDragEnter === null || onDragEnter === void 0 || onDragEnter({
        event,
        node: convertNodePropsToEventData(nodeProps),
        expandedKeys
      });
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeDragOver", function(event, nodeProps) {
      var _this$state3 = _this.state, dragChildrenKeys = _this$state3.dragChildrenKeys, flattenNodes = _this$state3.flattenNodes, keyEntities = _this$state3.keyEntities, expandedKeys = _this$state3.expandedKeys, indent = _this$state3.indent;
      var _this$props2 = _this.props, onDragOver = _this$props2.onDragOver, allowDrop2 = _this$props2.allowDrop, direction = _this$props2.direction;
      if (!_this.dragNodeProps) {
        return;
      }
      var _calcDropPosition2 = calcDropPosition(event, _this.dragNodeProps, nodeProps, indent, _this.dragStartMousePosition, allowDrop2, flattenNodes, keyEntities, expandedKeys, direction), dropPosition = _calcDropPosition2.dropPosition, dropLevelOffset = _calcDropPosition2.dropLevelOffset, dropTargetKey = _calcDropPosition2.dropTargetKey, dropContainerKey = _calcDropPosition2.dropContainerKey, dropTargetPos = _calcDropPosition2.dropTargetPos, dropAllowed = _calcDropPosition2.dropAllowed, dragOverNodeKey = _calcDropPosition2.dragOverNodeKey;
      if (dragChildrenKeys.includes(dropTargetKey) || !dropAllowed) {
        return;
      }
      if (_this.dragNodeProps.eventKey === dropTargetKey && dropLevelOffset === 0) {
        if (!(_this.state.dropPosition === null && _this.state.dropLevelOffset === null && _this.state.dropTargetKey === null && _this.state.dropContainerKey === null && _this.state.dropTargetPos === null && _this.state.dropAllowed === false && _this.state.dragOverNodeKey === null)) {
          _this.resetDragState();
        }
      } else if (!(dropPosition === _this.state.dropPosition && dropLevelOffset === _this.state.dropLevelOffset && dropTargetKey === _this.state.dropTargetKey && dropContainerKey === _this.state.dropContainerKey && dropTargetPos === _this.state.dropTargetPos && dropAllowed === _this.state.dropAllowed && dragOverNodeKey === _this.state.dragOverNodeKey)) {
        _this.setState({
          dropPosition,
          dropLevelOffset,
          dropTargetKey,
          dropContainerKey,
          dropTargetPos,
          dropAllowed,
          dragOverNodeKey
        });
      }
      onDragOver === null || onDragOver === void 0 || onDragOver({
        event,
        node: convertNodePropsToEventData(nodeProps)
      });
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeDragLeave", function(event, nodeProps) {
      if (_this.currentMouseOverDroppableNodeKey === nodeProps.eventKey && !event.currentTarget.contains(event.relatedTarget)) {
        _this.resetDragState();
        _this.currentMouseOverDroppableNodeKey = null;
      }
      var onDragLeave = _this.props.onDragLeave;
      onDragLeave === null || onDragLeave === void 0 || onDragLeave({
        event,
        node: convertNodePropsToEventData(nodeProps)
      });
    });
    _defineProperty(_assertThisInitialized(_this), "onWindowDragEnd", function(event) {
      _this.onNodeDragEnd(event, null, true);
      window.removeEventListener("dragend", _this.onWindowDragEnd);
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeDragEnd", function(event, nodeProps) {
      var onDragEnd = _this.props.onDragEnd;
      _this.setState({
        dragOverNodeKey: null
      });
      _this.cleanDragState();
      onDragEnd === null || onDragEnd === void 0 || onDragEnd({
        event,
        node: convertNodePropsToEventData(nodeProps)
      });
      _this.dragNodeProps = null;
      window.removeEventListener("dragend", _this.onWindowDragEnd);
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeDrop", function(event, _) {
      var _this$getActiveItem;
      var outsideTree = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : false;
      var _this$state4 = _this.state, dragChildrenKeys = _this$state4.dragChildrenKeys, dropPosition = _this$state4.dropPosition, dropTargetKey = _this$state4.dropTargetKey, dropTargetPos = _this$state4.dropTargetPos, dropAllowed = _this$state4.dropAllowed;
      if (!dropAllowed) {
        return;
      }
      var onDrop = _this.props.onDrop;
      _this.setState({
        dragOverNodeKey: null
      });
      _this.cleanDragState();
      if (dropTargetKey === null) return;
      var abstractDropNodeProps = _objectSpread2(_objectSpread2({}, getTreeNodeProps(dropTargetKey, _this.getTreeNodeRequiredProps())), {}, {
        active: ((_this$getActiveItem = _this.getActiveItem()) === null || _this$getActiveItem === void 0 ? void 0 : _this$getActiveItem.key) === dropTargetKey,
        data: getEntity(_this.state.keyEntities, dropTargetKey).node
      });
      var dropToChild = dragChildrenKeys.includes(dropTargetKey);
      warningOnce(!dropToChild, "Can not drop to dragNode's children node. This is a bug of rc-tree. Please report an issue.");
      var posArr = posToArr(dropTargetPos);
      var dropResult = {
        event,
        node: convertNodePropsToEventData(abstractDropNodeProps),
        dragNode: _this.dragNodeProps ? convertNodePropsToEventData(_this.dragNodeProps) : null,
        dragNodesKeys: [_this.dragNodeProps.eventKey].concat(dragChildrenKeys),
        dropToGap: dropPosition !== 0,
        dropPosition: dropPosition + Number(posArr[posArr.length - 1])
      };
      if (!outsideTree) {
        onDrop === null || onDrop === void 0 || onDrop(dropResult);
      }
      _this.dragNodeProps = null;
    });
    _defineProperty(_assertThisInitialized(_this), "cleanDragState", function() {
      var draggingNodeKey = _this.state.draggingNodeKey;
      if (draggingNodeKey !== null) {
        _this.setState({
          draggingNodeKey: null,
          dropPosition: null,
          dropContainerKey: null,
          dropTargetKey: null,
          dropLevelOffset: null,
          dropAllowed: true,
          dragOverNodeKey: null
        });
      }
      _this.dragStartMousePosition = null;
      _this.currentMouseOverDroppableNodeKey = null;
    });
    _defineProperty(_assertThisInitialized(_this), "triggerExpandActionExpand", function(e, treeNode) {
      var _this$state5 = _this.state, expandedKeys = _this$state5.expandedKeys, flattenNodes = _this$state5.flattenNodes;
      var expanded = treeNode.expanded, key = treeNode.key, isLeaf = treeNode.isLeaf;
      if (isLeaf || e.shiftKey || e.metaKey || e.ctrlKey) {
        return;
      }
      var node = flattenNodes.filter(function(nodeItem) {
        return nodeItem.key === key;
      })[0];
      var eventNode = convertNodePropsToEventData(_objectSpread2(_objectSpread2({}, getTreeNodeProps(key, _this.getTreeNodeRequiredProps())), {}, {
        data: node.data
      }));
      _this.setExpandedKeys(expanded ? arrDel(expandedKeys, key) : arrAdd(expandedKeys, key));
      _this.onNodeExpand(e, eventNode);
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeClick", function(e, treeNode) {
      var _this$props3 = _this.props, onClick = _this$props3.onClick, expandAction = _this$props3.expandAction;
      if (expandAction === "click") {
        _this.triggerExpandActionExpand(e, treeNode);
      }
      onClick === null || onClick === void 0 || onClick(e, treeNode);
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeDoubleClick", function(e, treeNode) {
      var _this$props4 = _this.props, onDoubleClick = _this$props4.onDoubleClick, expandAction = _this$props4.expandAction;
      if (expandAction === "doubleClick") {
        _this.triggerExpandActionExpand(e, treeNode);
      }
      onDoubleClick === null || onDoubleClick === void 0 || onDoubleClick(e, treeNode);
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeSelect", function(e, treeNode) {
      var selectedKeys = _this.state.selectedKeys;
      var _this$state6 = _this.state, keyEntities = _this$state6.keyEntities, fieldNames = _this$state6.fieldNames;
      var _this$props5 = _this.props, onSelect = _this$props5.onSelect, multiple = _this$props5.multiple;
      var selected = treeNode.selected;
      var key = treeNode[fieldNames.key];
      var targetSelected = !selected;
      if (!targetSelected) {
        selectedKeys = arrDel(selectedKeys, key);
      } else if (!multiple) {
        selectedKeys = [key];
      } else {
        selectedKeys = arrAdd(selectedKeys, key);
      }
      var selectedNodes = selectedKeys.map(function(selectedKey) {
        var entity = getEntity(keyEntities, selectedKey);
        return entity ? entity.node : null;
      }).filter(Boolean);
      _this.setUncontrolledState({
        selectedKeys
      });
      onSelect === null || onSelect === void 0 || onSelect(selectedKeys, {
        event: "select",
        selected: targetSelected,
        node: treeNode,
        selectedNodes,
        nativeEvent: e.nativeEvent
      });
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeCheck", function(e, treeNode, checked) {
      var _this$state7 = _this.state, keyEntities = _this$state7.keyEntities, oriCheckedKeys = _this$state7.checkedKeys, oriHalfCheckedKeys = _this$state7.halfCheckedKeys;
      var _this$props6 = _this.props, checkStrictly = _this$props6.checkStrictly, onCheck = _this$props6.onCheck;
      var key = treeNode.key;
      var checkedObj;
      var eventObj = {
        event: "check",
        node: treeNode,
        checked,
        nativeEvent: e.nativeEvent
      };
      if (checkStrictly) {
        var checkedKeys = checked ? arrAdd(oriCheckedKeys, key) : arrDel(oriCheckedKeys, key);
        var halfCheckedKeys = arrDel(oriHalfCheckedKeys, key);
        checkedObj = {
          checked: checkedKeys,
          halfChecked: halfCheckedKeys
        };
        eventObj.checkedNodes = checkedKeys.map(function(checkedKey) {
          return getEntity(keyEntities, checkedKey);
        }).filter(Boolean).map(function(entity) {
          return entity.node;
        });
        _this.setUncontrolledState({
          checkedKeys
        });
      } else {
        var _conductCheck = conductCheck([].concat(_toConsumableArray(oriCheckedKeys), [key]), true, keyEntities), _checkedKeys = _conductCheck.checkedKeys, _halfCheckedKeys = _conductCheck.halfCheckedKeys;
        if (!checked) {
          var keySet = new Set(_checkedKeys);
          keySet.delete(key);
          var _conductCheck2 = conductCheck(Array.from(keySet), {
            halfCheckedKeys: _halfCheckedKeys
          }, keyEntities);
          _checkedKeys = _conductCheck2.checkedKeys;
          _halfCheckedKeys = _conductCheck2.halfCheckedKeys;
        }
        checkedObj = _checkedKeys;
        eventObj.checkedNodes = [];
        eventObj.checkedNodesPositions = [];
        eventObj.halfCheckedKeys = _halfCheckedKeys;
        _checkedKeys.forEach(function(checkedKey) {
          var entity = getEntity(keyEntities, checkedKey);
          if (!entity) return;
          var node = entity.node, pos = entity.pos;
          eventObj.checkedNodes.push(node);
          eventObj.checkedNodesPositions.push({
            node,
            pos
          });
        });
        _this.setUncontrolledState({
          checkedKeys: _checkedKeys
        }, false, {
          halfCheckedKeys: _halfCheckedKeys
        });
      }
      onCheck === null || onCheck === void 0 || onCheck(checkedObj, eventObj);
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeLoad", function(treeNode) {
      var _entity$children;
      var key = treeNode.key;
      var keyEntities = _this.state.keyEntities;
      var entity = getEntity(keyEntities, key);
      if (entity !== null && entity !== void 0 && (_entity$children = entity.children) !== null && _entity$children !== void 0 && _entity$children.length) {
        return;
      }
      var loadPromise = new Promise(function(resolve, reject) {
        _this.setState(function(_ref) {
          var _ref$loadedKeys = _ref.loadedKeys, loadedKeys = _ref$loadedKeys === void 0 ? [] : _ref$loadedKeys, _ref$loadingKeys = _ref.loadingKeys, loadingKeys = _ref$loadingKeys === void 0 ? [] : _ref$loadingKeys;
          var _this$props7 = _this.props, loadData = _this$props7.loadData, onLoad = _this$props7.onLoad;
          if (!loadData || loadedKeys.includes(key) || loadingKeys.includes(key)) {
            return null;
          }
          var promise = loadData(treeNode);
          promise.then(function() {
            var currentLoadedKeys = _this.state.loadedKeys;
            var newLoadedKeys = arrAdd(currentLoadedKeys, key);
            onLoad === null || onLoad === void 0 || onLoad(newLoadedKeys, {
              event: "load",
              node: treeNode
            });
            _this.setUncontrolledState({
              loadedKeys: newLoadedKeys
            });
            _this.setState(function(prevState) {
              return {
                loadingKeys: arrDel(prevState.loadingKeys, key)
              };
            });
            resolve();
          }).catch(function(e) {
            _this.setState(function(prevState) {
              return {
                loadingKeys: arrDel(prevState.loadingKeys, key)
              };
            });
            _this.loadingRetryTimes[key] = (_this.loadingRetryTimes[key] || 0) + 1;
            if (_this.loadingRetryTimes[key] >= MAX_RETRY_TIMES) {
              var currentLoadedKeys = _this.state.loadedKeys;
              warningOnce(false, "Retry for `loadData` many times but still failed. No more retry.");
              _this.setUncontrolledState({
                loadedKeys: arrAdd(currentLoadedKeys, key)
              });
              resolve();
            }
            reject(e);
          });
          return {
            loadingKeys: arrAdd(loadingKeys, key)
          };
        });
      });
      loadPromise.catch(function() {
      });
      return loadPromise;
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeMouseEnter", function(event, node) {
      var onMouseEnter = _this.props.onMouseEnter;
      onMouseEnter === null || onMouseEnter === void 0 || onMouseEnter({
        event,
        node
      });
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeMouseLeave", function(event, node) {
      var onMouseLeave = _this.props.onMouseLeave;
      onMouseLeave === null || onMouseLeave === void 0 || onMouseLeave({
        event,
        node
      });
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeContextMenu", function(event, node) {
      var onRightClick = _this.props.onRightClick;
      if (onRightClick) {
        event.preventDefault();
        onRightClick({
          event,
          node
        });
      }
    });
    _defineProperty(_assertThisInitialized(_this), "onFocus", function() {
      var onFocus = _this.props.onFocus;
      _this.setState({
        focused: true
      });
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }
      onFocus === null || onFocus === void 0 || onFocus.apply(void 0, args);
    });
    _defineProperty(_assertThisInitialized(_this), "onBlur", function() {
      var onBlur = _this.props.onBlur;
      _this.setState({
        focused: false
      });
      _this.onActiveChange(null);
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }
      onBlur === null || onBlur === void 0 || onBlur.apply(void 0, args);
    });
    _defineProperty(_assertThisInitialized(_this), "getTreeNodeRequiredProps", function() {
      var _this$state8 = _this.state, expandedKeys = _this$state8.expandedKeys, selectedKeys = _this$state8.selectedKeys, loadedKeys = _this$state8.loadedKeys, loadingKeys = _this$state8.loadingKeys, checkedKeys = _this$state8.checkedKeys, halfCheckedKeys = _this$state8.halfCheckedKeys, dragOverNodeKey = _this$state8.dragOverNodeKey, dropPosition = _this$state8.dropPosition, keyEntities = _this$state8.keyEntities;
      return {
        expandedKeys: expandedKeys || [],
        selectedKeys: selectedKeys || [],
        loadedKeys: loadedKeys || [],
        loadingKeys: loadingKeys || [],
        checkedKeys: checkedKeys || [],
        halfCheckedKeys: halfCheckedKeys || [],
        dragOverNodeKey,
        dropPosition,
        keyEntities
      };
    });
    _defineProperty(_assertThisInitialized(_this), "setExpandedKeys", function(expandedKeys) {
      var _this$state9 = _this.state, treeData = _this$state9.treeData, fieldNames = _this$state9.fieldNames;
      var flattenNodes = flattenTreeData(treeData, expandedKeys, fieldNames);
      _this.setUncontrolledState({
        expandedKeys,
        flattenNodes
      }, true);
    });
    _defineProperty(_assertThisInitialized(_this), "onNodeExpand", function(e, treeNode) {
      var expandedKeys = _this.state.expandedKeys;
      var _this$state10 = _this.state, listChanging = _this$state10.listChanging, fieldNames = _this$state10.fieldNames;
      var _this$props8 = _this.props, onExpand = _this$props8.onExpand, loadData = _this$props8.loadData;
      var expanded = treeNode.expanded;
      var key = treeNode[fieldNames.key];
      if (listChanging) {
        return;
      }
      var certain = expandedKeys.includes(key);
      var targetExpanded = !expanded;
      warningOnce(expanded && certain || !expanded && !certain, "Expand state not sync with index check");
      expandedKeys = targetExpanded ? arrAdd(expandedKeys, key) : arrDel(expandedKeys, key);
      _this.setExpandedKeys(expandedKeys);
      onExpand === null || onExpand === void 0 || onExpand(expandedKeys, {
        node: treeNode,
        expanded: targetExpanded,
        nativeEvent: e.nativeEvent
      });
      if (targetExpanded && loadData) {
        var loadPromise = _this.onNodeLoad(treeNode);
        if (loadPromise) {
          loadPromise.then(function() {
            var newFlattenTreeData = flattenTreeData(_this.state.treeData, expandedKeys, fieldNames);
            _this.setUncontrolledState({
              flattenNodes: newFlattenTreeData
            });
          }).catch(function() {
            var currentExpandedKeys = _this.state.expandedKeys;
            var expandedKeysToRestore = arrDel(currentExpandedKeys, key);
            _this.setExpandedKeys(expandedKeysToRestore);
          });
        }
      }
    });
    _defineProperty(_assertThisInitialized(_this), "onListChangeStart", function() {
      _this.setUncontrolledState({
        listChanging: true
      });
    });
    _defineProperty(_assertThisInitialized(_this), "onListChangeEnd", function() {
      setTimeout(function() {
        _this.setUncontrolledState({
          listChanging: false
        });
      });
    });
    _defineProperty(_assertThisInitialized(_this), "onActiveChange", function(newActiveKey) {
      var activeKey = _this.state.activeKey;
      var _this$props9 = _this.props, onActiveChange = _this$props9.onActiveChange, _this$props9$itemScro = _this$props9.itemScrollOffset, itemScrollOffset = _this$props9$itemScro === void 0 ? 0 : _this$props9$itemScro;
      if (activeKey === newActiveKey) {
        return;
      }
      _this.setState({
        activeKey: newActiveKey
      });
      if (newActiveKey !== null) {
        _this.scrollTo({
          key: newActiveKey,
          offset: itemScrollOffset
        });
      }
      onActiveChange === null || onActiveChange === void 0 || onActiveChange(newActiveKey);
    });
    _defineProperty(_assertThisInitialized(_this), "getActiveItem", function() {
      var _this$state11 = _this.state, activeKey = _this$state11.activeKey, flattenNodes = _this$state11.flattenNodes;
      if (activeKey === null) {
        return null;
      }
      return flattenNodes.find(function(_ref2) {
        var key = _ref2.key;
        return key === activeKey;
      }) || null;
    });
    _defineProperty(_assertThisInitialized(_this), "offsetActiveKey", function(offset2) {
      var _this$state12 = _this.state, flattenNodes = _this$state12.flattenNodes, activeKey = _this$state12.activeKey;
      var index = flattenNodes.findIndex(function(_ref3) {
        var key = _ref3.key;
        return key === activeKey;
      });
      if (index === -1 && offset2 < 0) {
        index = flattenNodes.length;
      }
      index = (index + offset2 + flattenNodes.length) % flattenNodes.length;
      var item = flattenNodes[index];
      if (item) {
        var _key4 = item.key;
        _this.onActiveChange(_key4);
      } else {
        _this.onActiveChange(null);
      }
    });
    _defineProperty(_assertThisInitialized(_this), "onKeyDown", function(event) {
      var _this$state13 = _this.state, activeKey = _this$state13.activeKey, expandedKeys = _this$state13.expandedKeys, checkedKeys = _this$state13.checkedKeys, fieldNames = _this$state13.fieldNames;
      var _this$props10 = _this.props, onKeyDown2 = _this$props10.onKeyDown, checkable = _this$props10.checkable, selectable = _this$props10.selectable;
      switch (event.which) {
        case KeyCode.UP: {
          _this.offsetActiveKey(-1);
          event.preventDefault();
          break;
        }
        case KeyCode.DOWN: {
          _this.offsetActiveKey(1);
          event.preventDefault();
          break;
        }
      }
      var activeItem = _this.getActiveItem();
      if (activeItem && activeItem.data) {
        var treeNodeRequiredProps = _this.getTreeNodeRequiredProps();
        var expandable = activeItem.data.isLeaf === false || !!(activeItem.data[fieldNames.children] || []).length;
        var eventNode = convertNodePropsToEventData(_objectSpread2(_objectSpread2({}, getTreeNodeProps(activeKey, treeNodeRequiredProps)), {}, {
          data: activeItem.data,
          active: true
        }));
        switch (event.which) {
          // >>> Expand
          case KeyCode.LEFT: {
            if (expandable && expandedKeys.includes(activeKey)) {
              _this.onNodeExpand({}, eventNode);
            } else if (activeItem.parent) {
              _this.onActiveChange(activeItem.parent.key);
            }
            event.preventDefault();
            break;
          }
          case KeyCode.RIGHT: {
            if (expandable && !expandedKeys.includes(activeKey)) {
              _this.onNodeExpand({}, eventNode);
            } else if (activeItem.children && activeItem.children.length) {
              _this.onActiveChange(activeItem.children[0].key);
            }
            event.preventDefault();
            break;
          }
          // Selection
          case KeyCode.ENTER:
          case KeyCode.SPACE: {
            if (checkable && !eventNode.disabled && eventNode.checkable !== false && !eventNode.disableCheckbox) {
              _this.onNodeCheck({}, eventNode, !checkedKeys.includes(activeKey));
            } else if (!checkable && selectable && !eventNode.disabled && eventNode.selectable !== false) {
              _this.onNodeSelect({}, eventNode);
            }
            break;
          }
        }
      }
      onKeyDown2 === null || onKeyDown2 === void 0 || onKeyDown2(event);
    });
    _defineProperty(_assertThisInitialized(_this), "setUncontrolledState", function(state) {
      var atomic = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
      var forceState = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : null;
      if (!_this.destroyed) {
        var needSync = false;
        var allPassed = true;
        var newState = {};
        Object.keys(state).forEach(function(name) {
          if (_this.props.hasOwnProperty(name)) {
            allPassed = false;
            return;
          }
          needSync = true;
          newState[name] = state[name];
        });
        if (needSync && (!atomic || allPassed)) {
          _this.setState(_objectSpread2(_objectSpread2({}, newState), forceState));
        }
      }
    });
    _defineProperty(_assertThisInitialized(_this), "scrollTo", function(scroll) {
      _this.listRef.current.scrollTo(scroll);
    });
    return _this;
  }
  _createClass(Tree2, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      this.destroyed = false;
      this.onUpdated();
    }
  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate() {
      this.onUpdated();
    }
  }, {
    key: "onUpdated",
    value: function onUpdated() {
      var _this$props11 = this.props, activeKey = _this$props11.activeKey, _this$props11$itemScr = _this$props11.itemScrollOffset, itemScrollOffset = _this$props11$itemScr === void 0 ? 0 : _this$props11$itemScr;
      if (activeKey !== void 0 && activeKey !== this.state.activeKey) {
        this.setState({
          activeKey
        });
        if (activeKey !== null) {
          this.scrollTo({
            key: activeKey,
            offset: itemScrollOffset
          });
        }
      }
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
      window.removeEventListener("dragend", this.onWindowDragEnd);
      this.destroyed = true;
    }
  }, {
    key: "resetDragState",
    value: function resetDragState() {
      this.setState({
        dragOverNodeKey: null,
        dropPosition: null,
        dropLevelOffset: null,
        dropTargetKey: null,
        dropContainerKey: null,
        dropTargetPos: null,
        dropAllowed: false
      });
    }
  }, {
    key: "render",
    value: function render() {
      var _this$state14 = this.state, focused = _this$state14.focused, flattenNodes = _this$state14.flattenNodes, keyEntities = _this$state14.keyEntities, draggingNodeKey = _this$state14.draggingNodeKey, activeKey = _this$state14.activeKey, dropLevelOffset = _this$state14.dropLevelOffset, dropContainerKey = _this$state14.dropContainerKey, dropTargetKey = _this$state14.dropTargetKey, dropPosition = _this$state14.dropPosition, dragOverNodeKey = _this$state14.dragOverNodeKey, indent = _this$state14.indent;
      var _this$props12 = this.props, prefixCls = _this$props12.prefixCls, className = _this$props12.className, style = _this$props12.style, showLine = _this$props12.showLine, focusable = _this$props12.focusable, _this$props12$tabInde = _this$props12.tabIndex, tabIndex = _this$props12$tabInde === void 0 ? 0 : _this$props12$tabInde, selectable = _this$props12.selectable, showIcon = _this$props12.showIcon, icon = _this$props12.icon, switcherIcon = _this$props12.switcherIcon, draggable = _this$props12.draggable, checkable = _this$props12.checkable, checkStrictly = _this$props12.checkStrictly, disabled = _this$props12.disabled, motion = _this$props12.motion, loadData = _this$props12.loadData, filterTreeNode = _this$props12.filterTreeNode, height = _this$props12.height, itemHeight = _this$props12.itemHeight, scrollWidth = _this$props12.scrollWidth, virtual = _this$props12.virtual, titleRender = _this$props12.titleRender, dropIndicatorRender2 = _this$props12.dropIndicatorRender, onContextMenu = _this$props12.onContextMenu, onScroll = _this$props12.onScroll, direction = _this$props12.direction, rootClassName = _this$props12.rootClassName, rootStyle = _this$props12.rootStyle;
      var domProps = pickAttrs(this.props, {
        aria: true,
        data: true
      });
      var draggableConfig;
      if (draggable) {
        if (_typeof(draggable) === "object") {
          draggableConfig = draggable;
        } else if (typeof draggable === "function") {
          draggableConfig = {
            nodeDraggable: draggable
          };
        } else {
          draggableConfig = {};
        }
      }
      var contextValue = {
        prefixCls,
        selectable,
        showIcon,
        icon,
        switcherIcon,
        draggable: draggableConfig,
        draggingNodeKey,
        checkable,
        checkStrictly,
        disabled,
        keyEntities,
        dropLevelOffset,
        dropContainerKey,
        dropTargetKey,
        dropPosition,
        dragOverNodeKey,
        indent,
        direction,
        dropIndicatorRender: dropIndicatorRender2,
        loadData,
        filterTreeNode,
        titleRender,
        onNodeClick: this.onNodeClick,
        onNodeDoubleClick: this.onNodeDoubleClick,
        onNodeExpand: this.onNodeExpand,
        onNodeSelect: this.onNodeSelect,
        onNodeCheck: this.onNodeCheck,
        onNodeLoad: this.onNodeLoad,
        onNodeMouseEnter: this.onNodeMouseEnter,
        onNodeMouseLeave: this.onNodeMouseLeave,
        onNodeContextMenu: this.onNodeContextMenu,
        onNodeDragStart: this.onNodeDragStart,
        onNodeDragEnter: this.onNodeDragEnter,
        onNodeDragOver: this.onNodeDragOver,
        onNodeDragLeave: this.onNodeDragLeave,
        onNodeDragEnd: this.onNodeDragEnd,
        onNodeDrop: this.onNodeDrop
      };
      return /* @__PURE__ */ reactExports.createElement(TreeContext.Provider, {
        value: contextValue
      }, /* @__PURE__ */ reactExports.createElement("div", {
        className: classNames(prefixCls, className, rootClassName, _defineProperty(_defineProperty(_defineProperty({}, "".concat(prefixCls, "-show-line"), showLine), "".concat(prefixCls, "-focused"), focused), "".concat(prefixCls, "-active-focused"), activeKey !== null)),
        style: rootStyle
      }, /* @__PURE__ */ reactExports.createElement(NodeList, _extends({
        ref: this.listRef,
        prefixCls,
        style,
        data: flattenNodes,
        disabled,
        selectable,
        checkable: !!checkable,
        motion,
        dragging: draggingNodeKey !== null,
        height,
        itemHeight,
        virtual,
        focusable,
        focused,
        tabIndex,
        activeItem: this.getActiveItem(),
        onFocus: this.onFocus,
        onBlur: this.onBlur,
        onKeyDown: this.onKeyDown,
        onActiveChange: this.onActiveChange,
        onListChangeStart: this.onListChangeStart,
        onListChangeEnd: this.onListChangeEnd,
        onContextMenu,
        onScroll,
        scrollWidth
      }, this.getTreeNodeRequiredProps(), domProps))));
    }
  }], [{
    key: "getDerivedStateFromProps",
    value: function getDerivedStateFromProps(props, prevState) {
      var prevProps = prevState.prevProps;
      var newState = {
        prevProps: props
      };
      function needSync(name) {
        return !prevProps && props.hasOwnProperty(name) || prevProps && prevProps[name] !== props[name];
      }
      var treeData;
      var fieldNames = prevState.fieldNames;
      if (needSync("fieldNames")) {
        fieldNames = fillFieldNames(props.fieldNames);
        newState.fieldNames = fieldNames;
      }
      if (needSync("treeData")) {
        treeData = props.treeData;
      } else if (needSync("children")) {
        warningOnce(false, "`children` of Tree is deprecated. Please use `treeData` instead.");
        treeData = convertTreeToData(props.children);
      }
      if (treeData) {
        newState.treeData = treeData;
        var entitiesMap = convertDataToEntities(treeData, {
          fieldNames
        });
        newState.keyEntities = _objectSpread2(_defineProperty({}, MOTION_KEY, MotionEntity), entitiesMap.keyEntities);
      }
      var keyEntities = newState.keyEntities || prevState.keyEntities;
      if (needSync("expandedKeys") || prevProps && needSync("autoExpandParent")) {
        newState.expandedKeys = props.autoExpandParent || !prevProps && props.defaultExpandParent ? conductExpandParent(props.expandedKeys, keyEntities) : props.expandedKeys;
      } else if (!prevProps && props.defaultExpandAll) {
        var cloneKeyEntities = _objectSpread2({}, keyEntities);
        delete cloneKeyEntities[MOTION_KEY];
        var nextExpandedKeys = [];
        Object.keys(cloneKeyEntities).forEach(function(key) {
          var entity = cloneKeyEntities[key];
          if (entity.children && entity.children.length) {
            nextExpandedKeys.push(entity.key);
          }
        });
        newState.expandedKeys = nextExpandedKeys;
      } else if (!prevProps && props.defaultExpandedKeys) {
        newState.expandedKeys = props.autoExpandParent || props.defaultExpandParent ? conductExpandParent(props.defaultExpandedKeys, keyEntities) : props.defaultExpandedKeys;
      }
      if (!newState.expandedKeys) {
        delete newState.expandedKeys;
      }
      if (treeData || newState.expandedKeys) {
        var flattenNodes = flattenTreeData(treeData || prevState.treeData, newState.expandedKeys || prevState.expandedKeys, fieldNames);
        newState.flattenNodes = flattenNodes;
      }
      if (props.selectable) {
        if (needSync("selectedKeys")) {
          newState.selectedKeys = calcSelectedKeys(props.selectedKeys, props);
        } else if (!prevProps && props.defaultSelectedKeys) {
          newState.selectedKeys = calcSelectedKeys(props.defaultSelectedKeys, props);
        }
      }
      if (props.checkable) {
        var checkedKeyEntity;
        if (needSync("checkedKeys")) {
          checkedKeyEntity = parseCheckedKeys(props.checkedKeys) || {};
        } else if (!prevProps && props.defaultCheckedKeys) {
          checkedKeyEntity = parseCheckedKeys(props.defaultCheckedKeys) || {};
        } else if (treeData) {
          checkedKeyEntity = parseCheckedKeys(props.checkedKeys) || {
            checkedKeys: prevState.checkedKeys,
            halfCheckedKeys: prevState.halfCheckedKeys
          };
        }
        if (checkedKeyEntity) {
          var _checkedKeyEntity = checkedKeyEntity, _checkedKeyEntity$che = _checkedKeyEntity.checkedKeys, checkedKeys = _checkedKeyEntity$che === void 0 ? [] : _checkedKeyEntity$che, _checkedKeyEntity$hal = _checkedKeyEntity.halfCheckedKeys, halfCheckedKeys = _checkedKeyEntity$hal === void 0 ? [] : _checkedKeyEntity$hal;
          if (!props.checkStrictly) {
            var conductKeys = conductCheck(checkedKeys, true, keyEntities);
            checkedKeys = conductKeys.checkedKeys;
            halfCheckedKeys = conductKeys.halfCheckedKeys;
          }
          newState.checkedKeys = checkedKeys;
          newState.halfCheckedKeys = halfCheckedKeys;
        }
      }
      if (needSync("loadedKeys")) {
        newState.loadedKeys = props.loadedKeys;
      }
      return newState;
    }
  }]);
  return Tree2;
})(reactExports.Component);
_defineProperty(Tree$2, "defaultProps", {
  prefixCls: "rc-tree",
  showLine: false,
  showIcon: true,
  selectable: true,
  multiple: false,
  checkable: false,
  disabled: false,
  checkStrictly: false,
  draggable: false,
  defaultExpandParent: true,
  autoExpandParent: false,
  defaultExpandAll: false,
  defaultExpandedKeys: [],
  defaultCheckedKeys: [],
  defaultSelectedKeys: [],
  dropIndicatorRender: DropIndicator,
  allowDrop: function allowDrop() {
    return true;
  },
  expandAction: false
});
_defineProperty(Tree$2, "TreeNode", TreeNode);
var FileOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M854.6 288.6L639.4 73.4c-6-6-14.1-9.4-22.6-9.4H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V311.3c0-8.5-3.4-16.7-9.4-22.7zM790.2 326H602V137.8L790.2 326zm1.8 562H232V136h302v216a42 42 0 0042 42h216v494z" } }] }, "name": "file", "theme": "outlined" };
var FileOutlined = function FileOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: FileOutlined$1
  }));
};
var RefIcon$f = /* @__PURE__ */ reactExports.forwardRef(FileOutlined);
var FolderOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M880 298.4H521L403.7 186.2a8.15 8.15 0 00-5.5-2.2H144c-17.7 0-32 14.3-32 32v592c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V330.4c0-17.7-14.3-32-32-32zM840 768H184V256h188.5l119.6 114.4H840V768z" } }] }, "name": "folder", "theme": "outlined" };
var FolderOutlined = function FolderOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: FolderOutlined$1
  }));
};
var RefIcon$e = /* @__PURE__ */ reactExports.forwardRef(FolderOutlined);
const genDirectoryStyle = ({
  treeCls,
  treeNodeCls,
  directoryNodeSelectedBg,
  directoryNodeSelectedColor,
  motionDurationMid,
  borderRadius,
  controlItemBgHover
}) => ({
  [`${treeCls}${treeCls}-directory ${treeNodeCls}`]: {
    // >>> Title
    [`${treeCls}-node-content-wrapper`]: {
      position: "static",
      [`&:has(${treeCls}-drop-indicator)`]: {
        position: "relative"
      },
      [`> *:not(${treeCls}-drop-indicator)`]: {
        position: "relative"
      },
      "&:hover": {
        background: "transparent"
      },
      // Expand interactive area to whole line
      "&:before": {
        position: "absolute",
        inset: 0,
        transition: `background-color ${motionDurationMid}`,
        content: '""',
        borderRadius
      },
      "&:hover:before": {
        background: controlItemBgHover
      }
    },
    [`${treeCls}-switcher, ${treeCls}-checkbox, ${treeCls}-draggable-icon`]: {
      zIndex: 1
    },
    // ============= Selected =============
    "&-selected": {
      background: directoryNodeSelectedBg,
      borderRadius,
      [`${treeCls}-switcher, ${treeCls}-draggable-icon`]: {
        color: directoryNodeSelectedColor
      },
      // >>> Title
      [`${treeCls}-node-content-wrapper`]: {
        color: directoryNodeSelectedColor,
        background: "transparent",
        "&, &:hover": {
          color: directoryNodeSelectedColor
        },
        "&:before, &:hover:before": {
          background: directoryNodeSelectedBg
        }
      }
    }
  }
});
const treeNodeFX = new Keyframe("ant-tree-node-fx-do-not-use", {
  "0%": {
    opacity: 0
  },
  "100%": {
    opacity: 1
  }
});
const getSwitchStyle = (prefixCls, token) => ({
  [`.${prefixCls}-switcher-icon`]: {
    display: "inline-block",
    fontSize: 10,
    verticalAlign: "baseline",
    svg: {
      transition: `transform ${token.motionDurationSlow}`
    }
  }
});
const getDropIndicatorStyle = (prefixCls, token) => ({
  [`.${prefixCls}-drop-indicator`]: {
    position: "absolute",
    // it should displayed over the following node
    zIndex: 1,
    height: 2,
    backgroundColor: token.colorPrimary,
    borderRadius: 1,
    pointerEvents: "none",
    "&:after": {
      position: "absolute",
      top: -3,
      insetInlineStart: -6,
      width: 8,
      height: 8,
      backgroundColor: "transparent",
      border: `${unit(token.lineWidthBold)} solid ${token.colorPrimary}`,
      borderRadius: "50%",
      content: '""'
    }
  }
});
const genBaseStyle = (prefixCls, token) => {
  const {
    treeCls,
    treeNodeCls,
    treeNodePadding,
    titleHeight,
    indentSize,
    nodeSelectedBg,
    nodeHoverBg,
    colorTextQuaternary,
    controlItemBgActiveDisabled
  } = token;
  return {
    [treeCls]: Object.assign(Object.assign({}, resetComponent(token)), {
      // fix https://github.com/ant-design/ant-design/issues/50316
      ["--rc-virtual-list-scrollbar-bg"]: token.colorSplit,
      background: token.colorBgContainer,
      borderRadius: token.borderRadius,
      transition: `background-color ${token.motionDurationSlow}`,
      "&-rtl": {
        direction: "rtl"
      },
      [`&${treeCls}-rtl ${treeCls}-switcher_close ${treeCls}-switcher-icon svg`]: {
        transform: "rotate(90deg)"
      },
      [`&-focused:not(:hover):not(${treeCls}-active-focused)`]: genFocusOutline(token),
      // =================== Virtual List ===================
      [`${treeCls}-list-holder-inner`]: {
        alignItems: "flex-start"
      },
      [`&${treeCls}-block-node`]: {
        [`${treeCls}-list-holder-inner`]: {
          alignItems: "stretch",
          // >>> Title
          [`${treeCls}-node-content-wrapper`]: {
            flex: "auto"
          },
          // >>> Drag
          [`${treeNodeCls}.dragging:after`]: {
            position: "absolute",
            inset: 0,
            border: `1px solid ${token.colorPrimary}`,
            opacity: 0,
            animationName: treeNodeFX,
            animationDuration: token.motionDurationSlow,
            animationPlayState: "running",
            animationFillMode: "forwards",
            content: '""',
            pointerEvents: "none",
            borderRadius: token.borderRadius
          }
        }
      },
      // ===================== TreeNode =====================
      [treeNodeCls]: {
        display: "flex",
        alignItems: "flex-start",
        marginBottom: treeNodePadding,
        lineHeight: unit(titleHeight),
        position: "relative",
        // 非常重要，避免 drop-indicator 在拖拽过程中闪烁
        "&:before": {
          content: '""',
          position: "absolute",
          zIndex: 1,
          insetInlineStart: 0,
          width: "100%",
          top: "100%",
          height: treeNodePadding
        },
        // Disabled
        [`&-disabled ${treeCls}-node-content-wrapper`]: {
          color: token.colorTextDisabled,
          cursor: "not-allowed",
          "&:hover": {
            background: "transparent"
          }
        },
        [`${treeCls}-checkbox-disabled + ${treeCls}-node-selected,&${treeNodeCls}-disabled${treeNodeCls}-selected ${treeCls}-node-content-wrapper`]: {
          backgroundColor: controlItemBgActiveDisabled
        },
        // we can not set pointer-events to none for checkbox in tree
        // ref: https://github.com/ant-design/ant-design/issues/39822#issuecomment-2605234058
        [`${treeCls}-checkbox-disabled`]: {
          pointerEvents: "unset"
        },
        // not disable
        [`&:not(${treeNodeCls}-disabled)`]: {
          // >>> Title
          [`${treeCls}-node-content-wrapper`]: {
            "&:hover": {
              color: token.nodeHoverColor
            }
          }
        },
        [`&-active ${treeCls}-node-content-wrapper`]: {
          background: token.controlItemBgHover
        },
        [`&:not(${treeNodeCls}-disabled).filter-node ${treeCls}-title`]: {
          color: token.colorPrimary,
          fontWeight: token.fontWeightStrong
        },
        "&-draggable": {
          cursor: "grab",
          [`${treeCls}-draggable-icon`]: {
            // https://github.com/ant-design/ant-design/issues/41915
            flexShrink: 0,
            width: titleHeight,
            textAlign: "center",
            visibility: "visible",
            color: colorTextQuaternary
          },
          [`&${treeNodeCls}-disabled ${treeCls}-draggable-icon`]: {
            visibility: "hidden"
          }
        }
      },
      // >>> Indent
      [`${treeCls}-indent`]: {
        alignSelf: "stretch",
        whiteSpace: "nowrap",
        userSelect: "none",
        "&-unit": {
          display: "inline-block",
          width: indentSize
        }
      },
      // >>> Drag Handler
      [`${treeCls}-draggable-icon`]: {
        visibility: "hidden"
      },
      // Switcher / Checkbox
      [`${treeCls}-switcher, ${treeCls}-checkbox`]: {
        marginInlineEnd: token.calc(token.calc(titleHeight).sub(token.controlInteractiveSize)).div(2).equal()
      },
      // >>> Switcher
      [`${treeCls}-switcher`]: Object.assign(Object.assign({}, getSwitchStyle(prefixCls, token)), {
        position: "relative",
        flex: "none",
        alignSelf: "stretch",
        width: titleHeight,
        textAlign: "center",
        cursor: "pointer",
        userSelect: "none",
        transition: `all ${token.motionDurationSlow}`,
        "&-noop": {
          cursor: "unset"
        },
        "&:before": {
          pointerEvents: "none",
          content: '""',
          width: titleHeight,
          height: titleHeight,
          position: "absolute",
          left: {
            _skip_check_: true,
            value: 0
          },
          top: 0,
          borderRadius: token.borderRadius,
          transition: `all ${token.motionDurationSlow}`
        },
        [`&:not(${treeCls}-switcher-noop):hover:before`]: {
          backgroundColor: token.colorBgTextHover
        },
        [`&_close ${treeCls}-switcher-icon svg`]: {
          transform: "rotate(-90deg)"
        },
        "&-loading-icon": {
          color: token.colorPrimary
        },
        "&-leaf-line": {
          position: "relative",
          zIndex: 1,
          display: "inline-block",
          width: "100%",
          height: "100%",
          // https://github.com/ant-design/ant-design/issues/31884
          "&:before": {
            position: "absolute",
            top: 0,
            insetInlineEnd: token.calc(titleHeight).div(2).equal(),
            bottom: token.calc(treeNodePadding).mul(-1).equal(),
            marginInlineStart: -1,
            borderInlineEnd: `1px solid ${token.colorBorder}`,
            content: '""'
          },
          "&:after": {
            position: "absolute",
            width: token.calc(token.calc(titleHeight).div(2).equal()).mul(0.8).equal(),
            height: token.calc(titleHeight).div(2).equal(),
            borderBottom: `1px solid ${token.colorBorder}`,
            content: '""'
          }
        }
      }),
      // >>> Title
      // add `${treeCls}-checkbox + span` to cover checkbox `${checkboxCls} + span`
      [`${treeCls}-node-content-wrapper`]: Object.assign(Object.assign({
        position: "relative",
        minHeight: titleHeight,
        paddingBlock: 0,
        paddingInline: token.paddingXS,
        background: "transparent",
        borderRadius: token.borderRadius,
        cursor: "pointer",
        transition: `all ${token.motionDurationMid}, border 0s, line-height 0s, box-shadow 0s`
      }, getDropIndicatorStyle(prefixCls, token)), {
        "&:hover": {
          backgroundColor: nodeHoverBg
        },
        [`&${treeCls}-node-selected`]: {
          color: token.nodeSelectedColor,
          backgroundColor: nodeSelectedBg
        },
        // Icon
        [`${treeCls}-iconEle`]: {
          display: "inline-block",
          width: titleHeight,
          height: titleHeight,
          textAlign: "center",
          verticalAlign: "top",
          "&:empty": {
            display: "none"
          }
        }
      }),
      // https://github.com/ant-design/ant-design/issues/28217
      [`${treeCls}-unselectable ${treeCls}-node-content-wrapper:hover`]: {
        backgroundColor: "transparent"
      },
      [`${treeNodeCls}.drop-container > [draggable]`]: {
        boxShadow: `0 0 0 2px ${token.colorPrimary}`
      },
      // ==================== Show Line =====================
      "&-show-line": {
        // ================ Indent lines ================
        [`${treeCls}-indent-unit`]: {
          position: "relative",
          height: "100%",
          "&:before": {
            position: "absolute",
            top: 0,
            insetInlineEnd: token.calc(titleHeight).div(2).equal(),
            bottom: token.calc(treeNodePadding).mul(-1).equal(),
            borderInlineEnd: `1px solid ${token.colorBorder}`,
            content: '""'
          },
          "&-end:before": {
            display: "none"
          }
        },
        // ============== Cover Background ==============
        [`${treeCls}-switcher`]: {
          background: "transparent",
          "&-line-icon": {
            // https://github.com/ant-design/ant-design/issues/32813
            verticalAlign: "-0.15em"
          }
        }
      },
      [`${treeNodeCls}-leaf-last ${treeCls}-switcher-leaf-line:before`]: {
        top: "auto !important",
        bottom: "auto !important",
        height: `${unit(token.calc(titleHeight).div(2).equal())} !important`
      }
    })
  };
};
const genTreeStyle = (prefixCls, token, enableDirectory = true) => {
  const treeCls = `.${prefixCls}`;
  const treeNodeCls = `${treeCls}-treenode`;
  const treeNodePadding = token.calc(token.paddingXS).div(2).equal();
  const treeToken = merge(token, {
    treeCls,
    treeNodeCls,
    treeNodePadding
  });
  return [
    // Basic
    genBaseStyle(prefixCls, treeToken),
    // Directory
    enableDirectory && genDirectoryStyle(treeToken)
  ].filter(Boolean);
};
const initComponentToken = (token) => {
  const {
    controlHeightSM,
    controlItemBgHover,
    controlItemBgActive
  } = token;
  const titleHeight = controlHeightSM;
  return {
    titleHeight,
    indentSize: titleHeight,
    nodeHoverBg: controlItemBgHover,
    nodeHoverColor: token.colorText,
    nodeSelectedBg: controlItemBgActive,
    nodeSelectedColor: token.colorText
  };
};
const prepareComponentToken$1 = (token) => {
  const {
    colorTextLightSolid,
    colorPrimary
  } = token;
  return Object.assign(Object.assign({}, initComponentToken(token)), {
    directoryNodeSelectedColor: colorTextLightSolid,
    directoryNodeSelectedBg: colorPrimary
  });
};
const useStyle$1 = genStyleHooks("Tree", (token, {
  prefixCls
}) => [{
  [token.componentCls]: getStyle(`${prefixCls}-checkbox`, token)
}, genTreeStyle(prefixCls, token), genCollapseMotion(token)], prepareComponentToken$1);
const offset = 4;
function dropIndicatorRender(props) {
  const {
    dropPosition,
    dropLevelOffset,
    prefixCls,
    indent,
    direction = "ltr"
  } = props;
  const startPosition = direction === "ltr" ? "left" : "right";
  const endPosition = direction === "ltr" ? "right" : "left";
  const style = {
    [startPosition]: -dropLevelOffset * indent + offset,
    [endPosition]: 0
  };
  switch (dropPosition) {
    case -1:
      style.top = -3;
      break;
    case 1:
      style.bottom = -3;
      break;
    default:
      style.bottom = -3;
      style[startPosition] = indent + offset;
      break;
  }
  return /* @__PURE__ */ ReactExports.createElement("div", {
    style,
    className: `${prefixCls}-drop-indicator`
  });
}
var CaretDownFilled$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "0 0 1024 1024", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z" } }] }, "name": "caret-down", "theme": "filled" };
var CaretDownFilled = function CaretDownFilled2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: CaretDownFilled$1
  }));
};
var RefIcon$d = /* @__PURE__ */ reactExports.forwardRef(CaretDownFilled);
var MinusSquareOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M328 544h368c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8z" } }, { "tag": "path", "attrs": { "d": "M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z" } }] }, "name": "minus-square", "theme": "outlined" };
var MinusSquareOutlined = function MinusSquareOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: MinusSquareOutlined$1
  }));
};
var RefIcon$c = /* @__PURE__ */ reactExports.forwardRef(MinusSquareOutlined);
var PlusSquareOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M328 544h152v152c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V544h152c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H544V328c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v152H328c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8z" } }, { "tag": "path", "attrs": { "d": "M880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z" } }] }, "name": "plus-square", "theme": "outlined" };
var PlusSquareOutlined = function PlusSquareOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: PlusSquareOutlined$1
  }));
};
var RefIcon$b = /* @__PURE__ */ reactExports.forwardRef(PlusSquareOutlined);
const SwitcherIconCom = (props) => {
  var _a, _b;
  const {
    prefixCls,
    switcherIcon,
    treeNodeProps,
    showLine,
    switcherLoadingIcon
  } = props;
  const {
    isLeaf,
    expanded,
    loading
  } = treeNodeProps;
  if (loading) {
    if (/* @__PURE__ */ reactExports.isValidElement(switcherLoadingIcon)) {
      return switcherLoadingIcon;
    }
    return /* @__PURE__ */ reactExports.createElement(RefIcon$j, {
      className: `${prefixCls}-switcher-loading-icon`
    });
  }
  let showLeafIcon;
  if (showLine && typeof showLine === "object") {
    showLeafIcon = showLine.showLeafIcon;
  }
  if (isLeaf) {
    if (!showLine) {
      return null;
    }
    if (typeof showLeafIcon !== "boolean" && !!showLeafIcon) {
      const leafIcon = typeof showLeafIcon === "function" ? showLeafIcon(treeNodeProps) : showLeafIcon;
      const leafCls = `${prefixCls}-switcher-line-custom-icon`;
      if (/* @__PURE__ */ reactExports.isValidElement(leafIcon)) {
        return cloneElement(leafIcon, {
          className: classNames((_a = leafIcon.props) === null || _a === void 0 ? void 0 : _a.className, leafCls)
        });
      }
      return leafIcon;
    }
    return showLeafIcon ? /* @__PURE__ */ reactExports.createElement(RefIcon$f, {
      className: `${prefixCls}-switcher-line-icon`
    }) : /* @__PURE__ */ reactExports.createElement("span", {
      className: `${prefixCls}-switcher-leaf-line`
    });
  }
  const switcherCls = `${prefixCls}-switcher-icon`;
  const switcher = typeof switcherIcon === "function" ? switcherIcon(treeNodeProps) : switcherIcon;
  if (/* @__PURE__ */ reactExports.isValidElement(switcher)) {
    return cloneElement(switcher, {
      className: classNames((_b = switcher.props) === null || _b === void 0 ? void 0 : _b.className, switcherCls)
    });
  }
  if (switcher !== void 0) {
    return switcher;
  }
  if (showLine) {
    return expanded ? /* @__PURE__ */ reactExports.createElement(RefIcon$c, {
      className: `${prefixCls}-switcher-line-icon`
    }) : /* @__PURE__ */ reactExports.createElement(RefIcon$b, {
      className: `${prefixCls}-switcher-line-icon`
    });
  }
  return /* @__PURE__ */ reactExports.createElement(RefIcon$d, {
    className: switcherCls
  });
};
const Tree$1 = /* @__PURE__ */ ReactExports.forwardRef((props, ref) => {
  var _a;
  const {
    getPrefixCls,
    direction,
    virtual,
    tree
  } = ReactExports.useContext(ConfigContext);
  const {
    prefixCls: customizePrefixCls,
    className,
    showIcon = false,
    showLine,
    switcherIcon,
    switcherLoadingIcon,
    blockNode = false,
    children,
    checkable = false,
    selectable = true,
    draggable,
    disabled,
    motion: customMotion,
    style
  } = props;
  const prefixCls = getPrefixCls("tree", customizePrefixCls);
  const rootPrefixCls = getPrefixCls();
  const contextDisabled = ReactExports.useContext(DisabledContext);
  const mergedDisabled = disabled !== null && disabled !== void 0 ? disabled : contextDisabled;
  const motion = customMotion !== null && customMotion !== void 0 ? customMotion : Object.assign(Object.assign({}, initCollapseMotion(rootPrefixCls)), {
    motionAppear: false
  });
  const newProps = Object.assign(Object.assign({}, props), {
    checkable,
    selectable,
    showIcon,
    motion,
    blockNode,
    disabled: mergedDisabled,
    showLine: Boolean(showLine),
    dropIndicatorRender
  });
  const [wrapCSSVar, hashId, cssVarCls] = useStyle$1(prefixCls);
  const [, token] = useToken();
  const itemHeight = token.paddingXS / 2 + (((_a = token.Tree) === null || _a === void 0 ? void 0 : _a.titleHeight) || token.controlHeightSM);
  const draggableConfig = ReactExports.useMemo(() => {
    if (!draggable) {
      return false;
    }
    let mergedDraggable = {};
    switch (typeof draggable) {
      case "function":
        mergedDraggable.nodeDraggable = draggable;
        break;
      case "object":
        mergedDraggable = Object.assign({}, draggable);
        break;
    }
    if (mergedDraggable.icon !== false) {
      mergedDraggable.icon = mergedDraggable.icon || /* @__PURE__ */ ReactExports.createElement(RefIcon$k, null);
    }
    return mergedDraggable;
  }, [draggable]);
  const renderSwitcherIcon = (nodeProps) => /* @__PURE__ */ ReactExports.createElement(SwitcherIconCom, {
    prefixCls,
    switcherIcon,
    switcherLoadingIcon,
    treeNodeProps: nodeProps,
    showLine
  });
  return wrapCSSVar(
    // @ts-ignore
    /* @__PURE__ */ ReactExports.createElement(Tree$2, Object.assign({
      itemHeight,
      ref,
      virtual
    }, newProps, {
      // newProps may contain style so declare style below it
      style: Object.assign(Object.assign({}, tree === null || tree === void 0 ? void 0 : tree.style), style),
      prefixCls,
      className: classNames({
        [`${prefixCls}-icon-hide`]: !showIcon,
        [`${prefixCls}-block-node`]: blockNode,
        [`${prefixCls}-unselectable`]: !selectable,
        [`${prefixCls}-rtl`]: direction === "rtl",
        [`${prefixCls}-disabled`]: mergedDisabled
      }, tree === null || tree === void 0 ? void 0 : tree.className, className, hashId, cssVarCls),
      direction,
      checkable: checkable ? /* @__PURE__ */ ReactExports.createElement("span", {
        className: `${prefixCls}-checkbox-inner`
      }) : checkable,
      selectable,
      switcherIcon: renderSwitcherIcon,
      draggable: draggableConfig
    }), children)
  );
});
const RECORD_NONE = 0;
const RECORD_START = 1;
const RECORD_END = 2;
function traverseNodesKey(treeData, callback, fieldNames) {
  const {
    key: fieldKey,
    children: fieldChildren
  } = fieldNames;
  function processNode(dataNode) {
    const key = dataNode[fieldKey];
    const children = dataNode[fieldChildren];
    if (callback(key, dataNode) !== false) {
      traverseNodesKey(children || [], callback, fieldNames);
    }
  }
  treeData.forEach(processNode);
}
function calcRangeKeys({
  treeData,
  expandedKeys,
  startKey,
  endKey,
  fieldNames
}) {
  const keys = [];
  let record = RECORD_NONE;
  if (startKey && startKey === endKey) {
    return [startKey];
  }
  if (!startKey || !endKey) {
    return [];
  }
  function matchKey(key) {
    return key === startKey || key === endKey;
  }
  traverseNodesKey(treeData, (key) => {
    if (record === RECORD_END) {
      return false;
    }
    if (matchKey(key)) {
      keys.push(key);
      if (record === RECORD_NONE) {
        record = RECORD_START;
      } else if (record === RECORD_START) {
        record = RECORD_END;
        return false;
      }
    } else if (record === RECORD_START) {
      keys.push(key);
    }
    return expandedKeys.includes(key);
  }, fillFieldNames(fieldNames));
  return keys;
}
function convertDirectoryKeysToNodes(treeData, keys, fieldNames) {
  const restKeys = _toConsumableArray(keys);
  const nodes = [];
  traverseNodesKey(treeData, (key, node) => {
    const index = restKeys.indexOf(key);
    if (index !== -1) {
      nodes.push(node);
      restKeys.splice(index, 1);
    }
    return !!restKeys.length;
  }, fillFieldNames(fieldNames));
  return nodes;
}
var __rest$1 = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
function getIcon(props) {
  const {
    isLeaf,
    expanded
  } = props;
  if (isLeaf) {
    return /* @__PURE__ */ reactExports.createElement(RefIcon$f, null);
  }
  return expanded ? /* @__PURE__ */ reactExports.createElement(RefIcon$l, null) : /* @__PURE__ */ reactExports.createElement(RefIcon$e, null);
}
function getTreeData({
  treeData,
  children
}) {
  return treeData || convertTreeToData(children);
}
const DirectoryTree = (_a, ref) => {
  var {
    defaultExpandAll,
    defaultExpandParent,
    defaultExpandedKeys
  } = _a, props = __rest$1(_a, ["defaultExpandAll", "defaultExpandParent", "defaultExpandedKeys"]);
  const lastSelectedKey = reactExports.useRef(null);
  const cachedSelectedKeys = reactExports.useRef(null);
  const getInitExpandedKeys = () => {
    const {
      keyEntities
    } = convertDataToEntities(getTreeData(props), {
      fieldNames: props.fieldNames
    });
    let initExpandedKeys;
    if (defaultExpandAll) {
      initExpandedKeys = Object.keys(keyEntities);
    } else if (defaultExpandParent) {
      initExpandedKeys = conductExpandParent(props.expandedKeys || defaultExpandedKeys || [], keyEntities);
    } else {
      initExpandedKeys = props.expandedKeys || defaultExpandedKeys || [];
    }
    return initExpandedKeys;
  };
  const [selectedKeys, setSelectedKeys] = reactExports.useState(props.selectedKeys || props.defaultSelectedKeys || []);
  const [expandedKeys, setExpandedKeys] = reactExports.useState(() => getInitExpandedKeys());
  reactExports.useEffect(() => {
    if ("selectedKeys" in props) {
      setSelectedKeys(props.selectedKeys);
    }
  }, [props.selectedKeys]);
  reactExports.useEffect(() => {
    if ("expandedKeys" in props) {
      setExpandedKeys(props.expandedKeys);
    }
  }, [props.expandedKeys]);
  const onExpand = (keys, info) => {
    var _a2;
    if (!("expandedKeys" in props)) {
      setExpandedKeys(keys);
    }
    return (_a2 = props.onExpand) === null || _a2 === void 0 ? void 0 : _a2.call(props, keys, info);
  };
  const onSelect = (keys, event) => {
    var _a2;
    const {
      multiple,
      fieldNames
    } = props;
    const {
      node,
      nativeEvent
    } = event;
    const {
      key = ""
    } = node;
    const treeData = getTreeData(props);
    const newEvent = Object.assign(Object.assign({}, event), {
      selected: true
    });
    const ctrlPick = (nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.ctrlKey) || (nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.metaKey);
    const shiftPick = nativeEvent === null || nativeEvent === void 0 ? void 0 : nativeEvent.shiftKey;
    let newSelectedKeys;
    if (multiple && ctrlPick) {
      newSelectedKeys = keys;
      lastSelectedKey.current = key;
      cachedSelectedKeys.current = newSelectedKeys;
      newEvent.selectedNodes = convertDirectoryKeysToNodes(treeData, newSelectedKeys, fieldNames);
    } else if (multiple && shiftPick) {
      newSelectedKeys = Array.from(new Set([].concat(_toConsumableArray(cachedSelectedKeys.current || []), _toConsumableArray(calcRangeKeys({
        treeData,
        expandedKeys,
        startKey: key,
        endKey: lastSelectedKey.current,
        fieldNames
      })))));
      newEvent.selectedNodes = convertDirectoryKeysToNodes(treeData, newSelectedKeys, fieldNames);
    } else {
      newSelectedKeys = [key];
      lastSelectedKey.current = key;
      cachedSelectedKeys.current = newSelectedKeys;
      newEvent.selectedNodes = convertDirectoryKeysToNodes(treeData, newSelectedKeys, fieldNames);
    }
    (_a2 = props.onSelect) === null || _a2 === void 0 ? void 0 : _a2.call(props, newSelectedKeys, newEvent);
    if (!("selectedKeys" in props)) {
      setSelectedKeys(newSelectedKeys);
    }
  };
  const {
    getPrefixCls,
    direction
  } = reactExports.useContext(ConfigContext);
  const {
    prefixCls: customizePrefixCls,
    className,
    showIcon = true,
    expandAction = "click"
  } = props, otherProps = __rest$1(props, ["prefixCls", "className", "showIcon", "expandAction"]);
  const prefixCls = getPrefixCls("tree", customizePrefixCls);
  const connectClassName = classNames(`${prefixCls}-directory`, {
    [`${prefixCls}-directory-rtl`]: direction === "rtl"
  }, className);
  return /* @__PURE__ */ reactExports.createElement(Tree$1, Object.assign({
    icon: getIcon,
    ref,
    blockNode: true
  }, otherProps, {
    showIcon,
    expandAction,
    prefixCls,
    className: connectClassName,
    expandedKeys,
    selectedKeys,
    onSelect,
    onExpand
  }));
};
const ForwardDirectoryTree = /* @__PURE__ */ reactExports.forwardRef(DirectoryTree);
const Tree = Tree$1;
Tree.DirectoryTree = ForwardDirectoryTree;
Tree.TreeNode = TreeNode;
const FilterSearch = (props) => {
  const {
    value,
    filterSearch,
    tablePrefixCls,
    locale,
    onChange
  } = props;
  if (!filterSearch) {
    return null;
  }
  return /* @__PURE__ */ reactExports.createElement("div", {
    className: `${tablePrefixCls}-filter-dropdown-search`
  }, /* @__PURE__ */ reactExports.createElement(Input, {
    prefix: /* @__PURE__ */ reactExports.createElement(RefIcon$m, null),
    placeholder: locale.filterSearchPlaceholder,
    onChange,
    value,
    // for skip min-width of input
    htmlSize: 1,
    className: `${tablePrefixCls}-filter-dropdown-search-input`
  }));
};
const onKeyDown = (event) => {
  const {
    keyCode
  } = event;
  if (keyCode === KeyCode.ENTER) {
    event.stopPropagation();
  }
};
const FilterDropdownMenuWrapper = /* @__PURE__ */ reactExports.forwardRef((props, ref) => /* @__PURE__ */ reactExports.createElement("div", {
  className: props.className,
  onClick: (e) => e.stopPropagation(),
  onKeyDown,
  ref
}, props.children));
function flattenKeys(filters) {
  let keys = [];
  (filters || []).forEach(({
    value,
    children
  }) => {
    keys.push(value);
    if (children) {
      keys = [].concat(_toConsumableArray(keys), _toConsumableArray(flattenKeys(children)));
    }
  });
  return keys;
}
function hasSubMenu(filters) {
  return filters.some(({
    children
  }) => children);
}
function searchValueMatched(searchValue, text) {
  if (typeof text === "string" || typeof text === "number") {
    return text === null || text === void 0 ? void 0 : text.toString().toLowerCase().includes(searchValue.trim().toLowerCase());
  }
  return false;
}
function renderFilterItems({
  filters,
  prefixCls,
  filteredKeys,
  filterMultiple,
  searchValue,
  filterSearch
}) {
  return filters.map((filter, index) => {
    const key = String(filter.value);
    if (filter.children) {
      return {
        key: key || index,
        label: filter.text,
        popupClassName: `${prefixCls}-dropdown-submenu`,
        children: renderFilterItems({
          filters: filter.children,
          prefixCls,
          filteredKeys,
          filterMultiple,
          searchValue,
          filterSearch
        })
      };
    }
    const Component = filterMultiple ? Checkbox : Radio;
    const item = {
      key: filter.value !== void 0 ? key : index,
      label: /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(Component, {
        checked: filteredKeys.includes(key)
      }), /* @__PURE__ */ reactExports.createElement("span", null, filter.text))
    };
    if (searchValue.trim()) {
      if (typeof filterSearch === "function") {
        return filterSearch(searchValue, filter) ? item : null;
      }
      return searchValueMatched(searchValue, filter.text) ? item : null;
    }
    return item;
  });
}
function wrapStringListType(keys) {
  return keys || [];
}
const FilterDropdown = (props) => {
  var _a, _b, _c, _d;
  const {
    tablePrefixCls,
    prefixCls,
    column,
    dropdownPrefixCls,
    columnKey,
    filterOnClose,
    filterMultiple,
    filterMode = "menu",
    filterSearch = false,
    filterState,
    triggerFilter,
    locale,
    children,
    getPopupContainer,
    rootClassName
  } = props;
  const {
    filterResetToDefaultFilteredValue,
    defaultFilteredValue,
    filterDropdownProps = {},
    // Deprecated
    filterDropdownOpen,
    filterDropdownVisible,
    onFilterDropdownVisibleChange,
    onFilterDropdownOpenChange
  } = column;
  const [visible, setVisible] = reactExports.useState(false);
  const filtered = !!(filterState && (((_a = filterState.filteredKeys) === null || _a === void 0 ? void 0 : _a.length) || filterState.forceFiltered));
  const triggerVisible = (newVisible) => {
    var _a2;
    setVisible(newVisible);
    (_a2 = filterDropdownProps.onOpenChange) === null || _a2 === void 0 ? void 0 : _a2.call(filterDropdownProps, newVisible);
    onFilterDropdownOpenChange === null || onFilterDropdownOpenChange === void 0 ? void 0 : onFilterDropdownOpenChange(newVisible);
    onFilterDropdownVisibleChange === null || onFilterDropdownVisibleChange === void 0 ? void 0 : onFilterDropdownVisibleChange(newVisible);
  };
  const mergedVisible = (_d = (_c = (_b = filterDropdownProps.open) !== null && _b !== void 0 ? _b : filterDropdownOpen) !== null && _c !== void 0 ? _c : filterDropdownVisible) !== null && _d !== void 0 ? _d : visible;
  const propFilteredKeys = filterState === null || filterState === void 0 ? void 0 : filterState.filteredKeys;
  const [getFilteredKeysSync, setFilteredKeysSync] = useSyncState(wrapStringListType(propFilteredKeys));
  const onSelectKeys = ({
    selectedKeys
  }) => {
    setFilteredKeysSync(selectedKeys);
  };
  const onCheck = (keys, {
    node,
    checked
  }) => {
    if (!filterMultiple) {
      onSelectKeys({
        selectedKeys: checked && node.key ? [node.key] : []
      });
    } else {
      onSelectKeys({
        selectedKeys: keys
      });
    }
  };
  reactExports.useEffect(() => {
    if (!visible) {
      return;
    }
    onSelectKeys({
      selectedKeys: wrapStringListType(propFilteredKeys)
    });
  }, [propFilteredKeys]);
  const [openKeys, setOpenKeys] = reactExports.useState([]);
  const onOpenChange = (keys) => {
    setOpenKeys(keys);
  };
  const [searchValue, setSearchValue] = reactExports.useState("");
  const onSearch = (e) => {
    const {
      value
    } = e.target;
    setSearchValue(value);
  };
  reactExports.useEffect(() => {
    if (!visible) {
      setSearchValue("");
    }
  }, [visible]);
  const internalTriggerFilter = (keys) => {
    const mergedKeys = (keys === null || keys === void 0 ? void 0 : keys.length) ? keys : null;
    if (mergedKeys === null && (!filterState || !filterState.filteredKeys)) {
      return null;
    }
    if (isEqual(mergedKeys, filterState === null || filterState === void 0 ? void 0 : filterState.filteredKeys, true)) {
      return null;
    }
    triggerFilter({
      column,
      key: columnKey,
      filteredKeys: mergedKeys
    });
  };
  const onConfirm = () => {
    triggerVisible(false);
    internalTriggerFilter(getFilteredKeysSync());
  };
  const onReset = ({
    confirm: confirm2,
    closeDropdown
  } = {
    confirm: false,
    closeDropdown: false
  }) => {
    if (confirm2) {
      internalTriggerFilter([]);
    }
    if (closeDropdown) {
      triggerVisible(false);
    }
    setSearchValue("");
    if (filterResetToDefaultFilteredValue) {
      setFilteredKeysSync((defaultFilteredValue || []).map((key) => String(key)));
    } else {
      setFilteredKeysSync([]);
    }
  };
  const doFilter = ({
    closeDropdown
  } = {
    closeDropdown: true
  }) => {
    if (closeDropdown) {
      triggerVisible(false);
    }
    internalTriggerFilter(getFilteredKeysSync());
  };
  const onVisibleChange = (newVisible, info) => {
    if (info.source === "trigger") {
      if (newVisible && propFilteredKeys !== void 0) {
        setFilteredKeysSync(wrapStringListType(propFilteredKeys));
      }
      triggerVisible(newVisible);
      if (!newVisible && !column.filterDropdown && filterOnClose) {
        onConfirm();
      }
    }
  };
  const dropdownMenuClass = classNames({
    [`${dropdownPrefixCls}-menu-without-submenu`]: !hasSubMenu(column.filters || [])
  });
  const onCheckAll = (e) => {
    if (e.target.checked) {
      const allFilterKeys = flattenKeys(column === null || column === void 0 ? void 0 : column.filters).map((key) => String(key));
      setFilteredKeysSync(allFilterKeys);
    } else {
      setFilteredKeysSync([]);
    }
  };
  const getTreeData2 = ({
    filters
  }) => (filters || []).map((filter, index) => {
    const key = String(filter.value);
    const item = {
      title: filter.text,
      key: filter.value !== void 0 ? key : String(index)
    };
    if (filter.children) {
      item.children = getTreeData2({
        filters: filter.children
      });
    }
    return item;
  });
  const getFilterData2 = (node) => {
    var _a2;
    return Object.assign(Object.assign({}, node), {
      text: node.title,
      value: node.key,
      children: ((_a2 = node.children) === null || _a2 === void 0 ? void 0 : _a2.map((item) => getFilterData2(item))) || []
    });
  };
  let dropdownContent;
  const {
    direction,
    renderEmpty
  } = reactExports.useContext(ConfigContext);
  if (typeof column.filterDropdown === "function") {
    dropdownContent = column.filterDropdown({
      prefixCls: `${dropdownPrefixCls}-custom`,
      setSelectedKeys: (selectedKeys) => onSelectKeys({
        selectedKeys
      }),
      selectedKeys: getFilteredKeysSync(),
      confirm: doFilter,
      clearFilters: onReset,
      filters: column.filters,
      visible: mergedVisible,
      close: () => {
        triggerVisible(false);
      }
    });
  } else if (column.filterDropdown) {
    dropdownContent = column.filterDropdown;
  } else {
    const selectedKeys = getFilteredKeysSync() || [];
    const getFilterComponent = () => {
      var _a2, _b2;
      const empty2 = (_a2 = renderEmpty === null || renderEmpty === void 0 ? void 0 : renderEmpty("Table.filter")) !== null && _a2 !== void 0 ? _a2 : /* @__PURE__ */ reactExports.createElement(Empty, {
        image: Empty.PRESENTED_IMAGE_SIMPLE,
        description: locale.filterEmptyText,
        styles: {
          image: {
            height: 24
          }
        },
        style: {
          margin: 0,
          padding: "16px 0"
        }
      });
      if ((column.filters || []).length === 0) {
        return empty2;
      }
      if (filterMode === "tree") {
        return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(FilterSearch, {
          filterSearch,
          value: searchValue,
          onChange: onSearch,
          tablePrefixCls,
          locale
        }), /* @__PURE__ */ reactExports.createElement("div", {
          className: `${tablePrefixCls}-filter-dropdown-tree`
        }, filterMultiple ? /* @__PURE__ */ reactExports.createElement(Checkbox, {
          checked: selectedKeys.length === flattenKeys(column.filters).length,
          indeterminate: selectedKeys.length > 0 && selectedKeys.length < flattenKeys(column.filters).length,
          className: `${tablePrefixCls}-filter-dropdown-checkall`,
          onChange: onCheckAll
        }, (_b2 = locale === null || locale === void 0 ? void 0 : locale.filterCheckall) !== null && _b2 !== void 0 ? _b2 : locale === null || locale === void 0 ? void 0 : locale.filterCheckAll) : null, /* @__PURE__ */ reactExports.createElement(Tree, {
          checkable: true,
          selectable: false,
          blockNode: true,
          multiple: filterMultiple,
          checkStrictly: !filterMultiple,
          className: `${dropdownPrefixCls}-menu`,
          onCheck,
          checkedKeys: selectedKeys,
          selectedKeys,
          showIcon: false,
          treeData: getTreeData2({
            filters: column.filters
          }),
          autoExpandParent: true,
          defaultExpandAll: true,
          filterTreeNode: searchValue.trim() ? (node) => {
            if (typeof filterSearch === "function") {
              return filterSearch(searchValue, getFilterData2(node));
            }
            return searchValueMatched(searchValue, node.title);
          } : void 0
        })));
      }
      const items = renderFilterItems({
        filters: column.filters || [],
        filterSearch,
        prefixCls,
        filteredKeys: getFilteredKeysSync(),
        filterMultiple,
        searchValue
      });
      const isEmpty = items.every((item) => item === null);
      return /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, /* @__PURE__ */ reactExports.createElement(FilterSearch, {
        filterSearch,
        value: searchValue,
        onChange: onSearch,
        tablePrefixCls,
        locale
      }), isEmpty ? empty2 : /* @__PURE__ */ reactExports.createElement(Menu, {
        selectable: true,
        multiple: filterMultiple,
        prefixCls: `${dropdownPrefixCls}-menu`,
        className: dropdownMenuClass,
        onSelect: onSelectKeys,
        onDeselect: onSelectKeys,
        selectedKeys,
        getPopupContainer,
        openKeys,
        onOpenChange,
        items
      }));
    };
    const getResetDisabled = () => {
      if (filterResetToDefaultFilteredValue) {
        return isEqual((defaultFilteredValue || []).map((key) => String(key)), selectedKeys, true);
      }
      return selectedKeys.length === 0;
    };
    dropdownContent = /* @__PURE__ */ reactExports.createElement(reactExports.Fragment, null, getFilterComponent(), /* @__PURE__ */ reactExports.createElement("div", {
      className: `${prefixCls}-dropdown-btns`
    }, /* @__PURE__ */ reactExports.createElement(Button, {
      type: "link",
      size: "small",
      disabled: getResetDisabled(),
      onClick: () => onReset()
    }, locale.filterReset), /* @__PURE__ */ reactExports.createElement(Button, {
      type: "primary",
      size: "small",
      onClick: onConfirm
    }, locale.filterConfirm)));
  }
  if (column.filterDropdown) {
    dropdownContent = /* @__PURE__ */ reactExports.createElement(OverrideProvider, {
      selectable: void 0
    }, dropdownContent);
  }
  dropdownContent = /* @__PURE__ */ reactExports.createElement(FilterDropdownMenuWrapper, {
    className: `${prefixCls}-dropdown`
  }, dropdownContent);
  const getDropdownTrigger = () => {
    let filterIcon;
    if (typeof column.filterIcon === "function") {
      filterIcon = column.filterIcon(filtered);
    } else if (column.filterIcon) {
      filterIcon = column.filterIcon;
    } else {
      filterIcon = /* @__PURE__ */ reactExports.createElement(RefIcon$g, null);
    }
    return /* @__PURE__ */ reactExports.createElement("span", {
      role: "button",
      tabIndex: -1,
      className: classNames(`${prefixCls}-trigger`, {
        active: filtered
      }),
      onClick: (e) => {
        e.stopPropagation();
      }
    }, filterIcon);
  };
  const mergedDropdownProps = mergeProps({
    trigger: ["click"],
    placement: direction === "rtl" ? "bottomLeft" : "bottomRight",
    children: getDropdownTrigger(),
    getPopupContainer
  }, Object.assign(Object.assign({}, filterDropdownProps), {
    rootClassName: classNames(rootClassName, filterDropdownProps.rootClassName),
    open: mergedVisible,
    onOpenChange: onVisibleChange,
    popupRender: () => {
      if (typeof (filterDropdownProps === null || filterDropdownProps === void 0 ? void 0 : filterDropdownProps.dropdownRender) === "function") {
        return filterDropdownProps.dropdownRender(dropdownContent);
      }
      return dropdownContent;
    }
  }));
  return /* @__PURE__ */ reactExports.createElement("div", {
    className: `${prefixCls}-column`
  }, /* @__PURE__ */ reactExports.createElement("span", {
    className: `${tablePrefixCls}-column-title`
  }, children), /* @__PURE__ */ reactExports.createElement(Dropdown, Object.assign({}, mergedDropdownProps)));
};
const collectFilterStates = (columns, init, pos) => {
  let filterStates = [];
  (columns || []).forEach((column, index) => {
    var _a;
    const columnPos = getColumnPos(index, pos);
    const filterDropdownIsDefined = column.filterDropdown !== void 0;
    if (column.filters || filterDropdownIsDefined || "onFilter" in column) {
      if ("filteredValue" in column) {
        let filteredValues = column.filteredValue;
        if (!filterDropdownIsDefined) {
          filteredValues = (_a = filteredValues === null || filteredValues === void 0 ? void 0 : filteredValues.map(String)) !== null && _a !== void 0 ? _a : filteredValues;
        }
        filterStates.push({
          column,
          key: getColumnKey(column, columnPos),
          filteredKeys: filteredValues,
          forceFiltered: column.filtered
        });
      } else {
        filterStates.push({
          column,
          key: getColumnKey(column, columnPos),
          filteredKeys: init && column.defaultFilteredValue ? column.defaultFilteredValue : void 0,
          forceFiltered: column.filtered
        });
      }
    }
    if ("children" in column) {
      filterStates = [].concat(_toConsumableArray(filterStates), _toConsumableArray(collectFilterStates(column.children, init, columnPos)));
    }
  });
  return filterStates;
};
function injectFilter(prefixCls, dropdownPrefixCls, columns, filterStates, locale, triggerFilter, getPopupContainer, pos, rootClassName) {
  return columns.map((column, index) => {
    const columnPos = getColumnPos(index, pos);
    const {
      filterOnClose = true,
      filterMultiple = true,
      filterMode,
      filterSearch
    } = column;
    let newColumn = column;
    if (newColumn.filters || newColumn.filterDropdown) {
      const columnKey = getColumnKey(newColumn, columnPos);
      const filterState = filterStates.find(({
        key
      }) => columnKey === key);
      newColumn = Object.assign(Object.assign({}, newColumn), {
        title: (renderProps) => /* @__PURE__ */ reactExports.createElement(FilterDropdown, {
          tablePrefixCls: prefixCls,
          prefixCls: `${prefixCls}-filter`,
          dropdownPrefixCls,
          column: newColumn,
          columnKey,
          filterState,
          filterOnClose,
          filterMultiple,
          filterMode,
          filterSearch,
          triggerFilter,
          locale,
          getPopupContainer,
          rootClassName
        }, renderColumnTitle(column.title, renderProps))
      });
    }
    if ("children" in newColumn) {
      newColumn = Object.assign(Object.assign({}, newColumn), {
        children: injectFilter(prefixCls, dropdownPrefixCls, newColumn.children, filterStates, locale, triggerFilter, getPopupContainer, columnPos, rootClassName)
      });
    }
    return newColumn;
  });
}
const generateFilterInfo = (filterStates) => {
  const currentFilters = {};
  filterStates.forEach(({
    key,
    filteredKeys,
    column
  }) => {
    const keyAsString = key;
    const {
      filters,
      filterDropdown
    } = column;
    if (filterDropdown) {
      currentFilters[keyAsString] = filteredKeys || null;
    } else if (Array.isArray(filteredKeys)) {
      const keys = flattenKeys(filters);
      currentFilters[keyAsString] = keys.filter((originKey) => filteredKeys.includes(String(originKey)));
    } else {
      currentFilters[keyAsString] = null;
    }
  });
  return currentFilters;
};
const getFilterData = (data, filterStates, childrenColumnName) => {
  const filterDatas = filterStates.reduce((currentData, filterState) => {
    const {
      column: {
        onFilter,
        filters
      },
      filteredKeys
    } = filterState;
    if (onFilter && filteredKeys && filteredKeys.length) {
      return currentData.map((record) => Object.assign({}, record)).filter((record) => filteredKeys.some((key) => {
        const keys = flattenKeys(filters);
        const keyIndex = keys.findIndex((k) => String(k) === String(key));
        const realKey = keyIndex !== -1 ? keys[keyIndex] : key;
        if (record[childrenColumnName]) {
          record[childrenColumnName] = getFilterData(record[childrenColumnName], filterStates, childrenColumnName);
        }
        return onFilter(realKey, record);
      }));
    }
    return currentData;
  }, data);
  return filterDatas;
};
const getMergedColumns = (rawMergedColumns) => rawMergedColumns.flatMap((column) => {
  if ("children" in column) {
    return [column].concat(_toConsumableArray(getMergedColumns(column.children || [])));
  }
  return [column];
});
const useFilter = (props) => {
  const {
    prefixCls,
    dropdownPrefixCls,
    mergedColumns: rawMergedColumns,
    onFilterChange,
    getPopupContainer,
    locale: tableLocale,
    rootClassName
  } = props;
  devUseWarning();
  const mergedColumns = reactExports.useMemo(() => getMergedColumns(rawMergedColumns || []), [rawMergedColumns]);
  const [filterStates, setFilterStates] = reactExports.useState(() => collectFilterStates(mergedColumns, true));
  const mergedFilterStates = reactExports.useMemo(() => {
    const collectedStates = collectFilterStates(mergedColumns, false);
    if (collectedStates.length === 0) {
      return collectedStates;
    }
    let filteredKeysIsAllNotControlled = true;
    collectedStates.forEach(({
      filteredKeys
    }) => {
      if (filteredKeys !== void 0) {
        filteredKeysIsAllNotControlled = false;
      }
    });
    if (filteredKeysIsAllNotControlled) {
      const keyList = (mergedColumns || []).map((column, index) => getColumnKey(column, getColumnPos(index)));
      return filterStates.filter(({
        key
      }) => keyList.includes(key)).map((item) => {
        const col = mergedColumns[keyList.indexOf(item.key)];
        return Object.assign(Object.assign({}, item), {
          column: Object.assign(Object.assign({}, item.column), col),
          forceFiltered: col.filtered
        });
      });
    }
    return collectedStates;
  }, [mergedColumns, filterStates]);
  const filters = reactExports.useMemo(() => generateFilterInfo(mergedFilterStates), [mergedFilterStates]);
  const triggerFilter = (filterState) => {
    const newFilterStates = mergedFilterStates.filter(({
      key
    }) => key !== filterState.key);
    newFilterStates.push(filterState);
    setFilterStates(newFilterStates);
    onFilterChange(generateFilterInfo(newFilterStates), newFilterStates);
  };
  const transformColumns = (innerColumns) => injectFilter(prefixCls, dropdownPrefixCls, innerColumns, mergedFilterStates, tableLocale, triggerFilter, getPopupContainer, void 0, rootClassName);
  return [transformColumns, mergedFilterStates, filters];
};
const useLazyKVMap = (data, childrenColumnName, getRowKey) => {
  const mapCacheRef = reactExports.useRef({});
  function getRecordByKey(key) {
    var _a;
    if (!mapCacheRef.current || mapCacheRef.current.data !== data || mapCacheRef.current.childrenColumnName !== childrenColumnName || mapCacheRef.current.getRowKey !== getRowKey) {
      let dig = function(records) {
        records.forEach((record, index) => {
          const rowKey = getRowKey(record, index);
          kvMap.set(rowKey, record);
          if (record && typeof record === "object" && childrenColumnName in record) {
            dig(record[childrenColumnName] || []);
          }
        });
      };
      const kvMap = /* @__PURE__ */ new Map();
      dig(data);
      mapCacheRef.current = {
        data,
        childrenColumnName,
        kvMap,
        getRowKey
      };
    }
    return (_a = mapCacheRef.current.kvMap) === null || _a === void 0 ? void 0 : _a.get(key);
  }
  return [getRecordByKey];
};
var __rest = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
const DEFAULT_PAGE_SIZE = 10;
function getPaginationParam(mergedPagination, pagination) {
  const param = {
    current: mergedPagination.current,
    pageSize: mergedPagination.pageSize
  };
  const paginationObj = pagination && typeof pagination === "object" ? pagination : {};
  Object.keys(paginationObj).forEach((pageProp) => {
    const value = mergedPagination[pageProp];
    if (typeof value !== "function") {
      param[pageProp] = value;
    }
  });
  return param;
}
function usePagination(total, onChange, pagination) {
  const _a = pagination && typeof pagination === "object" ? pagination : {}, {
    total: paginationTotal = 0
  } = _a, paginationObj = __rest(_a, ["total"]);
  const [innerPagination, setInnerPagination] = reactExports.useState(() => ({
    current: "defaultCurrent" in paginationObj ? paginationObj.defaultCurrent : 1,
    pageSize: "defaultPageSize" in paginationObj ? paginationObj.defaultPageSize : DEFAULT_PAGE_SIZE
  }));
  const mergedPagination = mergeProps(innerPagination, paginationObj, {
    total: paginationTotal > 0 ? paginationTotal : total
  });
  const maxPage = Math.ceil((paginationTotal || total) / mergedPagination.pageSize);
  if (mergedPagination.current > maxPage) {
    mergedPagination.current = maxPage || 1;
  }
  const refreshPagination = (current, pageSize) => {
    setInnerPagination({
      current: current !== null && current !== void 0 ? current : 1,
      pageSize: pageSize || mergedPagination.pageSize
    });
  };
  const onInternalChange = (current, pageSize) => {
    var _a2;
    if (pagination) {
      (_a2 = pagination.onChange) === null || _a2 === void 0 ? void 0 : _a2.call(pagination, current, pageSize);
    }
    refreshPagination(current, pageSize);
    onChange(current, pageSize || (mergedPagination === null || mergedPagination === void 0 ? void 0 : mergedPagination.pageSize));
  };
  if (pagination === false) {
    return [{}, () => {
    }];
  }
  return [Object.assign(Object.assign({}, mergedPagination), {
    onChange: onInternalChange
  }), refreshPagination];
}
var CaretUpOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "0 0 1024 1024", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z" } }] }, "name": "caret-up", "theme": "outlined" };
var CaretUpOutlined = function CaretUpOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: CaretUpOutlined$1
  }));
};
var RefIcon$a = /* @__PURE__ */ reactExports.forwardRef(CaretUpOutlined);
const ASCEND = "ascend";
const DESCEND = "descend";
const getMultiplePriority = (column) => {
  if (typeof column.sorter === "object" && typeof column.sorter.multiple === "number") {
    return column.sorter.multiple;
  }
  return false;
};
const getSortFunction = (sorter) => {
  if (typeof sorter === "function") {
    return sorter;
  }
  if (sorter && typeof sorter === "object" && sorter.compare) {
    return sorter.compare;
  }
  return false;
};
const nextSortDirection = (sortDirections, current) => {
  if (!current) {
    return sortDirections[0];
  }
  return sortDirections[sortDirections.indexOf(current) + 1];
};
const collectSortStates = (columns, init, pos) => {
  let sortStates = [];
  const pushState = (column, columnPos) => {
    sortStates.push({
      column,
      key: getColumnKey(column, columnPos),
      multiplePriority: getMultiplePriority(column),
      sortOrder: column.sortOrder
    });
  };
  (columns || []).forEach((column, index) => {
    const columnPos = getColumnPos(index, pos);
    if (column.children) {
      if ("sortOrder" in column) {
        pushState(column, columnPos);
      }
      sortStates = [].concat(_toConsumableArray(sortStates), _toConsumableArray(collectSortStates(column.children, init, columnPos)));
    } else if (column.sorter) {
      if ("sortOrder" in column) {
        pushState(column, columnPos);
      } else if (init && column.defaultSortOrder) {
        sortStates.push({
          column,
          key: getColumnKey(column, columnPos),
          multiplePriority: getMultiplePriority(column),
          sortOrder: column.defaultSortOrder
        });
      }
    }
  });
  return sortStates;
};
const injectSorter = (prefixCls, columns, sorterStates, triggerSorter, defaultSortDirections, tableLocale, tableShowSorterTooltip, pos) => {
  const finalColumns = (columns || []).map((column, index) => {
    const columnPos = getColumnPos(index, pos);
    let newColumn = column;
    if (newColumn.sorter) {
      const sortDirections = newColumn.sortDirections || defaultSortDirections;
      const showSorterTooltip = newColumn.showSorterTooltip === void 0 ? tableShowSorterTooltip : newColumn.showSorterTooltip;
      const columnKey = getColumnKey(newColumn, columnPos);
      const sorterState = sorterStates.find(({
        key
      }) => key === columnKey);
      const sortOrder = sorterState ? sorterState.sortOrder : null;
      const nextSortOrder = nextSortDirection(sortDirections, sortOrder);
      let sorter;
      if (column.sortIcon) {
        sorter = column.sortIcon({
          sortOrder
        });
      } else {
        const upNode = sortDirections.includes(ASCEND) && /* @__PURE__ */ reactExports.createElement(RefIcon$a, {
          className: classNames(`${prefixCls}-column-sorter-up`, {
            active: sortOrder === ASCEND
          })
        });
        const downNode = sortDirections.includes(DESCEND) && /* @__PURE__ */ reactExports.createElement(RefIcon$n, {
          className: classNames(`${prefixCls}-column-sorter-down`, {
            active: sortOrder === DESCEND
          })
        });
        sorter = /* @__PURE__ */ reactExports.createElement("span", {
          className: classNames(`${prefixCls}-column-sorter`, {
            [`${prefixCls}-column-sorter-full`]: !!(upNode && downNode)
          })
        }, /* @__PURE__ */ reactExports.createElement("span", {
          className: `${prefixCls}-column-sorter-inner`,
          "aria-hidden": "true"
        }, upNode, downNode));
      }
      const {
        cancelSort,
        triggerAsc,
        triggerDesc
      } = tableLocale || {};
      let sortTip = cancelSort;
      if (nextSortOrder === DESCEND) {
        sortTip = triggerDesc;
      } else if (nextSortOrder === ASCEND) {
        sortTip = triggerAsc;
      }
      const tooltipProps = typeof showSorterTooltip === "object" ? Object.assign({
        title: sortTip
      }, showSorterTooltip) : {
        title: sortTip
      };
      newColumn = Object.assign(Object.assign({}, newColumn), {
        className: classNames(newColumn.className, {
          [`${prefixCls}-column-sort`]: sortOrder
        }),
        title: (renderProps) => {
          const columnSortersClass = `${prefixCls}-column-sorters`;
          const renderColumnTitleWrapper = /* @__PURE__ */ reactExports.createElement("span", {
            className: `${prefixCls}-column-title`
          }, renderColumnTitle(column.title, renderProps));
          const renderSortTitle = /* @__PURE__ */ reactExports.createElement("div", {
            className: columnSortersClass
          }, renderColumnTitleWrapper, sorter);
          if (showSorterTooltip) {
            if (typeof showSorterTooltip !== "boolean" && (showSorterTooltip === null || showSorterTooltip === void 0 ? void 0 : showSorterTooltip.target) === "sorter-icon") {
              return /* @__PURE__ */ reactExports.createElement("div", {
                className: classNames(columnSortersClass, `${columnSortersClass}-tooltip-target-sorter`)
              }, renderColumnTitleWrapper, /* @__PURE__ */ reactExports.createElement(Tooltip, Object.assign({}, tooltipProps), sorter));
            }
            return /* @__PURE__ */ reactExports.createElement(Tooltip, Object.assign({}, tooltipProps), renderSortTitle);
          }
          return renderSortTitle;
        },
        onHeaderCell: (col) => {
          var _a;
          const cell = ((_a = column.onHeaderCell) === null || _a === void 0 ? void 0 : _a.call(column, col)) || {};
          const originOnClick = cell.onClick;
          const originOKeyDown = cell.onKeyDown;
          cell.onClick = (event) => {
            triggerSorter({
              column,
              key: columnKey,
              sortOrder: nextSortOrder,
              multiplePriority: getMultiplePriority(column)
            });
            originOnClick === null || originOnClick === void 0 ? void 0 : originOnClick(event);
          };
          cell.onKeyDown = (event) => {
            if (event.keyCode === KeyCode.ENTER) {
              triggerSorter({
                column,
                key: columnKey,
                sortOrder: nextSortOrder,
                multiplePriority: getMultiplePriority(column)
              });
              originOKeyDown === null || originOKeyDown === void 0 ? void 0 : originOKeyDown(event);
            }
          };
          const renderTitle = safeColumnTitle(column.title, {});
          const displayTitle = renderTitle === null || renderTitle === void 0 ? void 0 : renderTitle.toString();
          if (sortOrder) {
            cell["aria-sort"] = sortOrder === "ascend" ? "ascending" : "descending";
          }
          cell["aria-label"] = displayTitle || "";
          cell.className = classNames(cell.className, `${prefixCls}-column-has-sorters`);
          cell.tabIndex = 0;
          if (column.ellipsis) {
            cell.title = (renderTitle !== null && renderTitle !== void 0 ? renderTitle : "").toString();
          }
          return cell;
        }
      });
    }
    if ("children" in newColumn) {
      newColumn = Object.assign(Object.assign({}, newColumn), {
        children: injectSorter(prefixCls, newColumn.children, sorterStates, triggerSorter, defaultSortDirections, tableLocale, tableShowSorterTooltip, columnPos)
      });
    }
    return newColumn;
  });
  return finalColumns;
};
const stateToInfo = (sorterState) => {
  const {
    column,
    sortOrder
  } = sorterState;
  return {
    column,
    order: sortOrder,
    field: column.dataIndex,
    columnKey: column.key
  };
};
const generateSorterInfo = (sorterStates) => {
  const activeSorters = sorterStates.filter(({
    sortOrder
  }) => sortOrder).map(stateToInfo);
  if (activeSorters.length === 0 && sorterStates.length) {
    const lastIndex = sorterStates.length - 1;
    return Object.assign(Object.assign({}, stateToInfo(sorterStates[lastIndex])), {
      column: void 0,
      order: void 0,
      field: void 0,
      columnKey: void 0
    });
  }
  if (activeSorters.length <= 1) {
    return activeSorters[0] || {};
  }
  return activeSorters;
};
const getSortData = (data, sortStates, childrenColumnName) => {
  const innerSorterStates = sortStates.slice().sort((a, b) => b.multiplePriority - a.multiplePriority);
  const cloneData = data.slice();
  const runningSorters = innerSorterStates.filter(({
    column: {
      sorter
    },
    sortOrder
  }) => getSortFunction(sorter) && sortOrder);
  if (!runningSorters.length) {
    return cloneData;
  }
  return cloneData.sort((record1, record2) => {
    for (let i = 0; i < runningSorters.length; i += 1) {
      const sorterState = runningSorters[i];
      const {
        column: {
          sorter
        },
        sortOrder
      } = sorterState;
      const compareFn = getSortFunction(sorter);
      if (compareFn && sortOrder) {
        const compareResult = compareFn(record1, record2, sortOrder);
        if (compareResult !== 0) {
          return sortOrder === ASCEND ? compareResult : -compareResult;
        }
      }
    }
    return 0;
  }).map((record) => {
    const subRecords = record[childrenColumnName];
    if (subRecords) {
      return Object.assign(Object.assign({}, record), {
        [childrenColumnName]: getSortData(subRecords, sortStates, childrenColumnName)
      });
    }
    return record;
  });
};
const useFilterSorter = (props) => {
  const {
    prefixCls,
    mergedColumns,
    sortDirections,
    tableLocale,
    showSorterTooltip,
    onSorterChange
  } = props;
  const [sortStates, setSortStates] = reactExports.useState(() => collectSortStates(mergedColumns, true));
  const getColumnKeys = (columns, pos) => {
    const newKeys = [];
    columns.forEach((item, index) => {
      const columnPos = getColumnPos(index, pos);
      newKeys.push(getColumnKey(item, columnPos));
      if (Array.isArray(item.children)) {
        const childKeys = getColumnKeys(item.children, columnPos);
        newKeys.push.apply(newKeys, _toConsumableArray(childKeys));
      }
    });
    return newKeys;
  };
  const mergedSorterStates = reactExports.useMemo(() => {
    let validate = true;
    const collectedStates = collectSortStates(mergedColumns, false);
    if (!collectedStates.length) {
      const mergedColumnsKeys = getColumnKeys(mergedColumns);
      return sortStates.filter(({
        key
      }) => mergedColumnsKeys.includes(key));
    }
    const validateStates = [];
    function patchStates(state) {
      if (validate) {
        validateStates.push(state);
      } else {
        validateStates.push(Object.assign(Object.assign({}, state), {
          sortOrder: null
        }));
      }
    }
    let multipleMode = null;
    collectedStates.forEach((state) => {
      if (multipleMode === null) {
        patchStates(state);
        if (state.sortOrder) {
          if (state.multiplePriority === false) {
            validate = false;
          } else {
            multipleMode = true;
          }
        }
      } else if (multipleMode && state.multiplePriority !== false) {
        patchStates(state);
      } else {
        validate = false;
        patchStates(state);
      }
    });
    return validateStates;
  }, [mergedColumns, sortStates]);
  const columnTitleSorterProps = reactExports.useMemo(() => {
    var _a, _b;
    const sortColumns = mergedSorterStates.map(({
      column,
      sortOrder
    }) => ({
      column,
      order: sortOrder
    }));
    return {
      sortColumns,
      // Legacy
      sortColumn: (_a = sortColumns[0]) === null || _a === void 0 ? void 0 : _a.column,
      sortOrder: (_b = sortColumns[0]) === null || _b === void 0 ? void 0 : _b.order
    };
  }, [mergedSorterStates]);
  const triggerSorter = (sortState) => {
    let newSorterStates;
    if (sortState.multiplePriority === false || !mergedSorterStates.length || mergedSorterStates[0].multiplePriority === false) {
      newSorterStates = [sortState];
    } else {
      newSorterStates = [].concat(_toConsumableArray(mergedSorterStates.filter(({
        key
      }) => key !== sortState.key)), [sortState]);
    }
    setSortStates(newSorterStates);
    onSorterChange(generateSorterInfo(newSorterStates), newSorterStates);
  };
  const transformColumns = (innerColumns) => injectSorter(prefixCls, innerColumns, mergedSorterStates, triggerSorter, sortDirections, tableLocale, showSorterTooltip);
  const getSorters = () => generateSorterInfo(mergedSorterStates);
  return [transformColumns, mergedSorterStates, columnTitleSorterProps, getSorters];
};
const fillTitle = (columns, columnTitleProps) => {
  const finalColumns = columns.map((column) => {
    const cloneColumn = Object.assign({}, column);
    cloneColumn.title = renderColumnTitle(column.title, columnTitleProps);
    if ("children" in cloneColumn) {
      cloneColumn.children = fillTitle(cloneColumn.children, columnTitleProps);
    }
    return cloneColumn;
  });
  return finalColumns;
};
const useTitleColumns = (columnTitleProps) => {
  const filledColumns = reactExports.useCallback((columns) => fillTitle(columns, columnTitleProps), [columnTitleProps]);
  return [filledColumns];
};
const RcTable = genTable((prev, next) => {
  const {
    _renderTimes: prevRenderTimes
  } = prev;
  const {
    _renderTimes: nextRenderTimes
  } = next;
  return prevRenderTimes !== nextRenderTimes;
});
const RcVirtualTable = genVirtualTable((prev, next) => {
  const {
    _renderTimes: prevRenderTimes
  } = prev;
  const {
    _renderTimes: nextRenderTimes
  } = next;
  return prevRenderTimes !== nextRenderTimes;
});
const genBorderedStyle = (token) => {
  const {
    componentCls,
    lineWidth,
    lineType,
    tableBorderColor,
    tableHeaderBg,
    tablePaddingVertical,
    tablePaddingHorizontal,
    calc
  } = token;
  const tableBorder = `${unit(lineWidth)} ${lineType} ${tableBorderColor}`;
  const getSizeBorderStyle = (size, paddingVertical, paddingHorizontal) => ({
    [`&${componentCls}-${size}`]: {
      [`> ${componentCls}-container`]: {
        [`> ${componentCls}-content, > ${componentCls}-body`]: {
          [`
            > table > tbody > tr > th,
            > table > tbody > tr > td
          `]: {
            [`> ${componentCls}-expanded-row-fixed`]: {
              margin: `${unit(calc(paddingVertical).mul(-1).equal())}
              ${unit(calc(calc(paddingHorizontal).add(lineWidth)).mul(-1).equal())}`
            }
          }
        }
      }
    }
  });
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}${componentCls}-bordered`]: Object.assign(Object.assign(Object.assign({
        // ============================ Title =============================
        [`> ${componentCls}-title`]: {
          border: tableBorder,
          borderBottom: 0
        },
        // ============================ Content ============================
        [`> ${componentCls}-container`]: {
          borderInlineStart: tableBorder,
          borderTop: tableBorder,
          [`
            > ${componentCls}-content,
            > ${componentCls}-header,
            > ${componentCls}-body,
            > ${componentCls}-summary
          `]: {
            "> table": {
              // ============================= Cell =============================
              [`
                > thead > tr > th,
                > thead > tr > td,
                > tbody > tr > th,
                > tbody > tr > td,
                > tfoot > tr > th,
                > tfoot > tr > td
              `]: {
                borderInlineEnd: tableBorder
              },
              // ============================ Header ============================
              "> thead": {
                "> tr:not(:last-child) > th": {
                  borderBottom: tableBorder
                },
                "> tr > th::before": {
                  backgroundColor: "transparent !important"
                }
              },
              // Fixed right should provides additional border
              [`
                > thead > tr,
                > tbody > tr,
                > tfoot > tr
              `]: {
                [`> ${componentCls}-cell-fix-right-first::after`]: {
                  borderInlineEnd: tableBorder
                }
              },
              // ========================== Expandable ==========================
              [`
                > tbody > tr > th,
                > tbody > tr > td
              `]: {
                [`> ${componentCls}-expanded-row-fixed`]: {
                  margin: `${unit(calc(tablePaddingVertical).mul(-1).equal())} ${unit(calc(calc(tablePaddingHorizontal).add(lineWidth)).mul(-1).equal())}`,
                  "&::after": {
                    position: "absolute",
                    top: 0,
                    insetInlineEnd: lineWidth,
                    bottom: 0,
                    borderInlineEnd: tableBorder,
                    content: '""'
                  }
                }
              }
            }
          }
        },
        // ============================ Scroll ============================
        [`&${componentCls}-scroll-horizontal`]: {
          [`> ${componentCls}-container > ${componentCls}-body`]: {
            "> table > tbody": {
              [`
                > tr${componentCls}-expanded-row,
                > tr${componentCls}-placeholder
              `]: {
                "> th, > td": {
                  borderInlineEnd: 0
                }
              }
            }
          }
        }
      }, getSizeBorderStyle("middle", token.tablePaddingVerticalMiddle, token.tablePaddingHorizontalMiddle)), getSizeBorderStyle("small", token.tablePaddingVerticalSmall, token.tablePaddingHorizontalSmall)), {
        // ============================ Footer ============================
        [`> ${componentCls}-footer`]: {
          border: tableBorder,
          borderTop: 0
        }
      }),
      // ============================ Nested ============================
      [`${componentCls}-cell`]: {
        [`${componentCls}-container:first-child`]: {
          // :first-child to avoid the case when bordered and title is set
          borderTop: 0
        },
        // https://github.com/ant-design/ant-design/issues/35577
        "&-scrollbar:not([rowspan])": {
          boxShadow: `0 ${unit(lineWidth)} 0 ${unit(lineWidth)} ${tableHeaderBg}`
        }
      },
      [`${componentCls}-bordered ${componentCls}-cell-scrollbar`]: {
        borderInlineEnd: tableBorder
      }
    }
  };
};
const genEllipsisStyle = (token) => {
  const {
    componentCls
  } = token;
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-cell-ellipsis`]: Object.assign(Object.assign({}, textEllipsis), {
        wordBreak: "keep-all",
        // Fixed first or last should special process
        [`
          &${componentCls}-cell-fix-left-last,
          &${componentCls}-cell-fix-right-first
        `]: {
          overflow: "visible",
          [`${componentCls}-cell-content`]: {
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }
        },
        [`${componentCls}-column-title`]: {
          overflow: "hidden",
          textOverflow: "ellipsis",
          wordBreak: "keep-all"
        }
      })
    }
  };
};
const genEmptyStyle = (token) => {
  const {
    componentCls
  } = token;
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-tbody > tr${componentCls}-placeholder`]: {
        textAlign: "center",
        color: token.colorTextDisabled,
        [`
          &:hover > th,
          &:hover > td,
        `]: {
          background: token.colorBgContainer
        }
      }
    }
  };
};
const genExpandStyle = (token) => {
  const {
    componentCls,
    antCls,
    motionDurationSlow,
    lineWidth,
    paddingXS,
    lineType,
    tableBorderColor,
    tableExpandIconBg,
    tableExpandColumnWidth,
    borderRadius,
    tablePaddingVertical,
    tablePaddingHorizontal,
    tableExpandedRowBg,
    paddingXXS,
    expandIconMarginTop,
    expandIconSize,
    expandIconHalfInner,
    expandIconScale,
    calc
  } = token;
  const tableBorder = `${unit(lineWidth)} ${lineType} ${tableBorderColor}`;
  const expandIconLineOffset = calc(paddingXXS).sub(lineWidth).equal();
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-expand-icon-col`]: {
        width: tableExpandColumnWidth
      },
      [`${componentCls}-row-expand-icon-cell`]: {
        textAlign: "center",
        [`${componentCls}-row-expand-icon`]: {
          display: "inline-flex",
          float: "none",
          verticalAlign: "sub"
        }
      },
      [`${componentCls}-row-indent`]: {
        height: 1,
        float: "left"
      },
      [`${componentCls}-row-expand-icon`]: Object.assign(Object.assign({}, operationUnit(token)), {
        position: "relative",
        float: "left",
        width: expandIconSize,
        height: expandIconSize,
        color: "inherit",
        lineHeight: unit(expandIconSize),
        background: tableExpandIconBg,
        border: tableBorder,
        borderRadius,
        transform: `scale(${expandIconScale})`,
        "&:focus, &:hover, &:active": {
          borderColor: "currentcolor"
        },
        "&::before, &::after": {
          position: "absolute",
          background: "currentcolor",
          transition: `transform ${motionDurationSlow} ease-out`,
          content: '""'
        },
        "&::before": {
          top: expandIconHalfInner,
          insetInlineEnd: expandIconLineOffset,
          insetInlineStart: expandIconLineOffset,
          height: lineWidth
        },
        "&::after": {
          top: expandIconLineOffset,
          bottom: expandIconLineOffset,
          insetInlineStart: expandIconHalfInner,
          width: lineWidth,
          transform: "rotate(90deg)"
        },
        // Motion effect
        "&-collapsed::before": {
          transform: "rotate(-180deg)"
        },
        "&-collapsed::after": {
          transform: "rotate(0deg)"
        },
        "&-spaced": {
          "&::before, &::after": {
            display: "none",
            content: "none"
          },
          background: "transparent",
          border: 0,
          visibility: "hidden"
        }
      }),
      [`${componentCls}-row-indent + ${componentCls}-row-expand-icon`]: {
        marginTop: expandIconMarginTop,
        marginInlineEnd: paddingXS
      },
      [`tr${componentCls}-expanded-row`]: {
        "&, &:hover": {
          "> th, > td": {
            background: tableExpandedRowBg
          }
        },
        // https://github.com/ant-design/ant-design/issues/25573
        [`${antCls}-descriptions-view`]: {
          display: "flex",
          table: {
            flex: "auto",
            width: "100%"
          }
        }
      },
      // With fixed
      [`${componentCls}-expanded-row-fixed`]: {
        position: "relative",
        margin: `${unit(calc(tablePaddingVertical).mul(-1).equal())} ${unit(calc(tablePaddingHorizontal).mul(-1).equal())}`,
        padding: `${unit(tablePaddingVertical)} ${unit(tablePaddingHorizontal)}`
      }
    }
  };
};
const genFilterStyle = (token) => {
  const {
    componentCls,
    antCls,
    iconCls,
    tableFilterDropdownWidth,
    tableFilterDropdownSearchWidth,
    paddingXXS,
    paddingXS,
    colorText,
    lineWidth,
    lineType,
    tableBorderColor,
    headerIconColor,
    fontSizeSM,
    tablePaddingHorizontal,
    borderRadius,
    motionDurationSlow,
    colorIcon,
    colorPrimary,
    tableHeaderFilterActiveBg,
    colorTextDisabled,
    tableFilterDropdownBg,
    tableFilterDropdownHeight,
    controlItemBgHover,
    controlItemBgActive,
    boxShadowSecondary,
    filterDropdownMenuBg,
    calc
  } = token;
  const dropdownPrefixCls = `${antCls}-dropdown`;
  const tableFilterDropdownPrefixCls = `${componentCls}-filter-dropdown`;
  const treePrefixCls = `${antCls}-tree`;
  const tableBorder = `${unit(lineWidth)} ${lineType} ${tableBorderColor}`;
  return [
    {
      [`${componentCls}-wrapper`]: {
        [`${componentCls}-filter-column`]: {
          display: "flex",
          justifyContent: "space-between"
        },
        [`${componentCls}-filter-trigger`]: {
          position: "relative",
          display: "flex",
          alignItems: "center",
          marginBlock: calc(paddingXXS).mul(-1).equal(),
          marginInline: `${unit(paddingXXS)} ${unit(calc(tablePaddingHorizontal).div(2).mul(-1).equal())}`,
          padding: `0 ${unit(paddingXXS)}`,
          color: headerIconColor,
          fontSize: fontSizeSM,
          borderRadius,
          cursor: "pointer",
          transition: `all ${motionDurationSlow}`,
          "&:hover": {
            color: colorIcon,
            background: tableHeaderFilterActiveBg
          },
          "&.active": {
            color: colorPrimary
          }
        }
      }
    },
    {
      // Dropdown
      [`${antCls}-dropdown`]: {
        [tableFilterDropdownPrefixCls]: Object.assign(Object.assign({}, resetComponent(token)), {
          minWidth: tableFilterDropdownWidth,
          backgroundColor: tableFilterDropdownBg,
          borderRadius,
          boxShadow: boxShadowSecondary,
          overflow: "hidden",
          // Reset menu
          [`${dropdownPrefixCls}-menu`]: {
            // https://github.com/ant-design/ant-design/issues/4916
            // https://github.com/ant-design/ant-design/issues/19542
            maxHeight: tableFilterDropdownHeight,
            overflowX: "hidden",
            border: 0,
            boxShadow: "none",
            borderRadius: "unset",
            backgroundColor: filterDropdownMenuBg,
            "&:empty::after": {
              display: "block",
              padding: `${unit(paddingXS)} 0`,
              color: colorTextDisabled,
              fontSize: fontSizeSM,
              textAlign: "center",
              content: '"Not Found"'
            }
          },
          [`${tableFilterDropdownPrefixCls}-tree`]: {
            paddingBlock: `${unit(paddingXS)} 0`,
            paddingInline: paddingXS,
            [treePrefixCls]: {
              padding: 0
            },
            [`${treePrefixCls}-treenode ${treePrefixCls}-node-content-wrapper:hover`]: {
              backgroundColor: controlItemBgHover
            },
            [`${treePrefixCls}-treenode-checkbox-checked ${treePrefixCls}-node-content-wrapper`]: {
              "&, &:hover": {
                backgroundColor: controlItemBgActive
              }
            }
          },
          [`${tableFilterDropdownPrefixCls}-search`]: {
            padding: paddingXS,
            borderBottom: tableBorder,
            "&-input": {
              input: {
                minWidth: tableFilterDropdownSearchWidth
              },
              [iconCls]: {
                color: colorTextDisabled
              }
            }
          },
          [`${tableFilterDropdownPrefixCls}-checkall`]: {
            width: "100%",
            marginBottom: paddingXXS,
            marginInlineStart: paddingXXS
          },
          // Operation
          [`${tableFilterDropdownPrefixCls}-btns`]: {
            display: "flex",
            justifyContent: "space-between",
            padding: `${unit(calc(paddingXS).sub(lineWidth).equal())} ${unit(paddingXS)}`,
            overflow: "hidden",
            borderTop: tableBorder
          }
        })
      }
    },
    // Dropdown Menu & SubMenu
    {
      // submenu of table filter dropdown
      [`${antCls}-dropdown ${tableFilterDropdownPrefixCls}, ${tableFilterDropdownPrefixCls}-submenu`]: {
        // Checkbox
        [`${antCls}-checkbox-wrapper + span`]: {
          paddingInlineStart: paddingXS,
          color: colorText
        },
        "> ul": {
          maxHeight: "calc(100vh - 130px)",
          overflowX: "hidden",
          overflowY: "auto"
        }
      }
    }
  ];
};
const genFixedStyle = (token) => {
  const {
    componentCls,
    lineWidth,
    colorSplit,
    motionDurationSlow,
    zIndexTableFixed: zIndexTableFixed2,
    tableBg,
    zIndexTableSticky,
    calc
  } = token;
  const shadowColor = colorSplit;
  return {
    [`${componentCls}-wrapper`]: {
      [`
        ${componentCls}-cell-fix-left,
        ${componentCls}-cell-fix-right
      `]: {
        position: "sticky !important",
        zIndex: zIndexTableFixed2,
        background: tableBg
      },
      [`
        ${componentCls}-cell-fix-left-first::after,
        ${componentCls}-cell-fix-left-last::after
      `]: {
        position: "absolute",
        top: 0,
        right: {
          _skip_check_: true,
          value: 0
        },
        bottom: calc(lineWidth).mul(-1).equal(),
        width: 30,
        transform: "translateX(100%)",
        transition: `box-shadow ${motionDurationSlow}`,
        content: '""',
        pointerEvents: "none",
        // fix issues: https://github.com/ant-design/ant-design/issues/54587
        willChange: "transform"
      },
      [`${componentCls}-cell-fix-left-all::after`]: {
        display: "none"
      },
      [`
        ${componentCls}-cell-fix-right-first::after,
        ${componentCls}-cell-fix-right-last::after
      `]: {
        position: "absolute",
        top: 0,
        bottom: calc(lineWidth).mul(-1).equal(),
        left: {
          _skip_check_: true,
          value: 0
        },
        width: 30,
        transform: "translateX(-100%)",
        transition: `box-shadow ${motionDurationSlow}`,
        content: '""',
        pointerEvents: "none"
      },
      [`${componentCls}-container`]: {
        position: "relative",
        "&::before, &::after": {
          position: "absolute",
          top: 0,
          bottom: 0,
          zIndex: calc(zIndexTableSticky).add(1).equal({
            unit: false
          }),
          width: 30,
          transition: `box-shadow ${motionDurationSlow}`,
          content: '""',
          pointerEvents: "none"
        },
        "&::before": {
          insetInlineStart: 0
        },
        "&::after": {
          insetInlineEnd: 0
        }
      },
      [`${componentCls}-ping-left`]: {
        [`&:not(${componentCls}-has-fix-left) ${componentCls}-container::before`]: {
          boxShadow: `inset 10px 0 8px -8px ${shadowColor}`
        },
        [`
          ${componentCls}-cell-fix-left-first::after,
          ${componentCls}-cell-fix-left-last::after
        `]: {
          boxShadow: `inset 10px 0 8px -8px ${shadowColor}`
        },
        [`${componentCls}-cell-fix-left-last::before`]: {
          backgroundColor: "transparent !important"
        }
      },
      [`${componentCls}-ping-right`]: {
        [`&:not(${componentCls}-has-fix-right) ${componentCls}-container::after`]: {
          boxShadow: `inset -10px 0 8px -8px ${shadowColor}`
        },
        [`
          ${componentCls}-cell-fix-right-first::after,
          ${componentCls}-cell-fix-right-last::after
        `]: {
          boxShadow: `inset -10px 0 8px -8px ${shadowColor}`
        }
      },
      // Gapped fixed Columns do not show the shadow
      [`${componentCls}-fixed-column-gapped`]: {
        [`
        ${componentCls}-cell-fix-left-first::after,
        ${componentCls}-cell-fix-left-last::after,
        ${componentCls}-cell-fix-right-first::after,
        ${componentCls}-cell-fix-right-last::after
      `]: {
          boxShadow: "none"
        }
      }
    }
  };
};
const genPaginationStyle = (token) => {
  const {
    componentCls,
    antCls,
    margin
  } = token;
  return {
    [`${componentCls}-wrapper ${componentCls}-pagination${antCls}-pagination`]: {
      margin: `${unit(margin)} 0`
    }
  };
};
const genRadiusStyle = (token) => {
  const {
    componentCls,
    tableRadius
  } = token;
  return {
    [`${componentCls}-wrapper`]: {
      [componentCls]: {
        // https://github.com/ant-design/ant-design/issues/39115#issuecomment-1362314574
        [`${componentCls}-title, ${componentCls}-header`]: {
          borderRadius: `${unit(tableRadius)} ${unit(tableRadius)} 0 0`
        },
        [`${componentCls}-title + ${componentCls}-container`]: {
          borderStartStartRadius: 0,
          borderStartEndRadius: 0,
          // https://github.com/ant-design/ant-design/issues/41975
          [`${componentCls}-header, table`]: {
            borderRadius: 0
          },
          "table > thead > tr:first-child": {
            "th:first-child, th:last-child, td:first-child, td:last-child": {
              borderRadius: 0
            }
          }
        },
        "&-container": {
          borderStartStartRadius: tableRadius,
          borderStartEndRadius: tableRadius,
          "table > thead > tr:first-child": {
            "> *:first-child": {
              borderStartStartRadius: tableRadius
            },
            "> *:last-child": {
              borderStartEndRadius: tableRadius
            }
          }
        },
        "&-footer": {
          borderRadius: `0 0 ${unit(tableRadius)} ${unit(tableRadius)}`
        }
      }
    }
  };
};
const genStyle = (token) => {
  const {
    componentCls
  } = token;
  return {
    [`${componentCls}-wrapper-rtl`]: {
      direction: "rtl",
      table: {
        direction: "rtl"
      },
      [`${componentCls}-pagination-left`]: {
        justifyContent: "flex-end"
      },
      [`${componentCls}-pagination-right`]: {
        justifyContent: "flex-start"
      },
      [`${componentCls}-row-expand-icon`]: {
        float: "right",
        "&::after": {
          transform: "rotate(-90deg)"
        },
        "&-collapsed::before": {
          transform: "rotate(180deg)"
        },
        "&-collapsed::after": {
          transform: "rotate(0deg)"
        }
      },
      [`${componentCls}-container`]: {
        "&::before": {
          insetInlineStart: "unset",
          insetInlineEnd: 0
        },
        "&::after": {
          insetInlineStart: 0,
          insetInlineEnd: "unset"
        },
        [`${componentCls}-row-indent`]: {
          float: "right"
        }
      }
    }
  };
};
const genSelectionStyle = (token) => {
  const {
    componentCls,
    antCls,
    iconCls,
    fontSizeIcon,
    padding,
    paddingXS,
    headerIconColor,
    headerIconHoverColor,
    tableSelectionColumnWidth,
    tableSelectedRowBg,
    tableSelectedRowHoverBg,
    tableRowHoverBg,
    tablePaddingHorizontal,
    calc
  } = token;
  return {
    [`${componentCls}-wrapper`]: {
      // ========================== Selections ==========================
      [`${componentCls}-selection-col`]: {
        width: tableSelectionColumnWidth,
        [`&${componentCls}-selection-col-with-dropdown`]: {
          width: calc(tableSelectionColumnWidth).add(fontSizeIcon).add(calc(padding).div(4)).equal()
        }
      },
      [`${componentCls}-bordered ${componentCls}-selection-col`]: {
        width: calc(tableSelectionColumnWidth).add(calc(paddingXS).mul(2)).equal(),
        [`&${componentCls}-selection-col-with-dropdown`]: {
          width: calc(tableSelectionColumnWidth).add(fontSizeIcon).add(calc(padding).div(4)).add(calc(paddingXS).mul(2)).equal()
        }
      },
      [`
        table tr th${componentCls}-selection-column,
        table tr td${componentCls}-selection-column,
        ${componentCls}-selection-column
      `]: {
        paddingInlineEnd: token.paddingXS,
        paddingInlineStart: token.paddingXS,
        textAlign: "center",
        [`${antCls}-radio-wrapper`]: {
          marginInlineEnd: 0
        }
      },
      [`table tr th${componentCls}-selection-column${componentCls}-cell-fix-left`]: {
        zIndex: calc(token.zIndexTableFixed).add(1).equal({
          unit: false
        })
      },
      [`table tr th${componentCls}-selection-column::after`]: {
        backgroundColor: "transparent !important"
      },
      [`${componentCls}-selection`]: {
        position: "relative",
        display: "inline-flex",
        flexDirection: "column"
      },
      [`${componentCls}-selection-extra`]: {
        position: "absolute",
        top: 0,
        zIndex: 1,
        cursor: "pointer",
        transition: `all ${token.motionDurationSlow}`,
        marginInlineStart: "100%",
        paddingInlineStart: unit(calc(tablePaddingHorizontal).div(4).equal()),
        [iconCls]: {
          color: headerIconColor,
          fontSize: fontSizeIcon,
          verticalAlign: "baseline",
          "&:hover": {
            color: headerIconHoverColor
          }
        }
      },
      // ============================= Rows =============================
      [`${componentCls}-tbody`]: {
        [`${componentCls}-row`]: {
          [`&${componentCls}-row-selected`]: {
            [`> ${componentCls}-cell`]: {
              background: tableSelectedRowBg,
              "&-row-hover": {
                background: tableSelectedRowHoverBg
              }
            }
          },
          [`> ${componentCls}-cell-row-hover`]: {
            background: tableRowHoverBg
          }
        }
      }
    }
  };
};
const genSizeStyle = (token) => {
  const {
    componentCls,
    tableExpandColumnWidth,
    calc
  } = token;
  const getSizeStyle = (size, paddingVertical, paddingHorizontal, fontSize) => ({
    [`${componentCls}${componentCls}-${size}`]: {
      fontSize,
      [`
        ${componentCls}-title,
        ${componentCls}-footer,
        ${componentCls}-cell,
        ${componentCls}-thead > tr > th,
        ${componentCls}-tbody > tr > th,
        ${componentCls}-tbody > tr > td,
        tfoot > tr > th,
        tfoot > tr > td
      `]: {
        padding: `${unit(paddingVertical)} ${unit(paddingHorizontal)}`
      },
      [`${componentCls}-filter-trigger`]: {
        marginInlineEnd: unit(calc(paddingHorizontal).div(2).mul(-1).equal())
      },
      [`${componentCls}-expanded-row-fixed`]: {
        margin: `${unit(calc(paddingVertical).mul(-1).equal())} ${unit(calc(paddingHorizontal).mul(-1).equal())}`
      },
      [`${componentCls}-tbody`]: {
        // ========================= Nest Table ===========================
        [`${componentCls}-wrapper:only-child ${componentCls}`]: {
          marginBlock: unit(calc(paddingVertical).mul(-1).equal()),
          marginInline: `${unit(calc(tableExpandColumnWidth).sub(paddingHorizontal).equal())} ${unit(calc(paddingHorizontal).mul(-1).equal())}`
        }
      },
      // https://github.com/ant-design/ant-design/issues/35167
      [`${componentCls}-selection-extra`]: {
        paddingInlineStart: unit(calc(paddingHorizontal).div(4).equal())
      }
    }
  });
  return {
    [`${componentCls}-wrapper`]: Object.assign(Object.assign({}, getSizeStyle("middle", token.tablePaddingVerticalMiddle, token.tablePaddingHorizontalMiddle, token.tableFontSizeMiddle)), getSizeStyle("small", token.tablePaddingVerticalSmall, token.tablePaddingHorizontalSmall, token.tableFontSizeSmall))
  };
};
const genSorterStyle = (token) => {
  const {
    componentCls,
    marginXXS,
    fontSizeIcon,
    headerIconColor,
    headerIconHoverColor
  } = token;
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-thead th${componentCls}-column-has-sorters`]: {
        outline: "none",
        cursor: "pointer",
        // why left 0s? Avoid column header move with transition when left is changed
        // https://github.com/ant-design/ant-design/issues/50588
        transition: `all ${token.motionDurationSlow}, left 0s`,
        "&:hover": {
          background: token.tableHeaderSortHoverBg,
          "&::before": {
            backgroundColor: "transparent !important"
          }
        },
        "&:focus-visible": {
          color: token.colorPrimary
        },
        // https://github.com/ant-design/ant-design/issues/30969
        [`
          &${componentCls}-cell-fix-left:hover,
          &${componentCls}-cell-fix-right:hover
        `]: {
          background: token.tableFixedHeaderSortActiveBg
        }
      },
      [`${componentCls}-thead th${componentCls}-column-sort`]: {
        background: token.tableHeaderSortBg,
        "&::before": {
          backgroundColor: "transparent !important"
        }
      },
      [`td${componentCls}-column-sort`]: {
        background: token.tableBodySortBg
      },
      [`${componentCls}-column-title`]: {
        position: "relative",
        zIndex: 1,
        flex: 1,
        minWidth: 0
      },
      [`${componentCls}-column-sorters`]: {
        display: "flex",
        flex: "auto",
        alignItems: "center",
        justifyContent: "space-between",
        "&::after": {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          content: '""'
        }
      },
      [`${componentCls}-column-sorters-tooltip-target-sorter`]: {
        "&::after": {
          content: "none"
        }
      },
      [`${componentCls}-column-sorter`]: {
        marginInlineStart: marginXXS,
        color: headerIconColor,
        fontSize: 0,
        transition: `color ${token.motionDurationSlow}`,
        "&-inner": {
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center"
        },
        "&-up, &-down": {
          fontSize: fontSizeIcon,
          "&.active": {
            color: token.colorPrimary
          }
        },
        [`${componentCls}-column-sorter-up + ${componentCls}-column-sorter-down`]: {
          marginTop: "-0.3em"
        }
      },
      [`${componentCls}-column-sorters:hover ${componentCls}-column-sorter`]: {
        color: headerIconHoverColor
      }
    }
  };
};
const genStickyStyle = (token) => {
  const {
    componentCls,
    opacityLoading,
    tableScrollThumbBg,
    tableScrollThumbBgHover,
    tableScrollThumbSize,
    tableScrollBg,
    zIndexTableSticky,
    stickyScrollBarBorderRadius,
    lineWidth,
    lineType,
    tableBorderColor
  } = token;
  const tableBorder = `${unit(lineWidth)} ${lineType} ${tableBorderColor}`;
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-sticky`]: {
        "&-holder": {
          position: "sticky",
          zIndex: zIndexTableSticky,
          background: token.colorBgContainer
        },
        "&-scroll": {
          position: "sticky",
          bottom: 0,
          height: `${unit(tableScrollThumbSize)} !important`,
          zIndex: zIndexTableSticky,
          display: "flex",
          alignItems: "center",
          background: tableScrollBg,
          borderTop: tableBorder,
          opacity: opacityLoading,
          "&:hover": {
            transformOrigin: "center bottom"
          },
          // fake scrollbar style of sticky
          "&-bar": {
            height: tableScrollThumbSize,
            backgroundColor: tableScrollThumbBg,
            borderRadius: stickyScrollBarBorderRadius,
            transition: `all ${token.motionDurationSlow}, transform 0s`,
            position: "absolute",
            bottom: 0,
            "&:hover, &-active": {
              backgroundColor: tableScrollThumbBgHover
            }
          }
        }
      }
    }
  };
};
const genSummaryStyle = (token) => {
  const {
    componentCls,
    lineWidth,
    tableBorderColor,
    calc
  } = token;
  const tableBorder = `${unit(lineWidth)} ${token.lineType} ${tableBorderColor}`;
  return {
    [`${componentCls}-wrapper`]: {
      [`${componentCls}-summary`]: {
        position: "relative",
        zIndex: token.zIndexTableFixed,
        background: token.tableBg,
        "> tr": {
          "> th, > td": {
            borderBottom: tableBorder
          }
        }
      },
      [`div${componentCls}-summary`]: {
        boxShadow: `0 ${unit(calc(lineWidth).mul(-1).equal())} 0 ${tableBorderColor}`
      }
    }
  };
};
const genVirtualStyle = (token) => {
  const {
    componentCls,
    motionDurationMid,
    lineWidth,
    lineType,
    tableBorderColor,
    calc
  } = token;
  const tableBorder = `${unit(lineWidth)} ${lineType} ${tableBorderColor}`;
  const rowCellCls = `${componentCls}-expanded-row-cell`;
  return {
    [`${componentCls}-wrapper`]: {
      // ========================== Row ==========================
      [`${componentCls}-tbody-virtual`]: {
        [`${componentCls}-tbody-virtual-holder-inner`]: {
          [`
            & > ${componentCls}-row, 
            & > div:not(${componentCls}-row) > ${componentCls}-row
          `]: {
            display: "flex",
            boxSizing: "border-box",
            width: "100%"
          }
        },
        [`${componentCls}-cell`]: {
          borderBottom: tableBorder,
          transition: `background ${motionDurationMid}`
        },
        [`${componentCls}-expanded-row`]: {
          [`${rowCellCls}${rowCellCls}-fixed`]: {
            position: "sticky",
            insetInlineStart: 0,
            overflow: "hidden",
            width: `calc(var(--virtual-width) - ${unit(lineWidth)})`,
            borderInlineEnd: "none"
          }
        }
      },
      // ======================== Border =========================
      [`${componentCls}-bordered`]: {
        [`${componentCls}-tbody-virtual`]: {
          "&:after": {
            content: '""',
            insetInline: 0,
            bottom: 0,
            borderBottom: tableBorder,
            position: "absolute"
          },
          [`${componentCls}-cell`]: {
            borderInlineEnd: tableBorder,
            [`&${componentCls}-cell-fix-right-first:before`]: {
              content: '""',
              position: "absolute",
              insetBlock: 0,
              insetInlineStart: calc(lineWidth).mul(-1).equal(),
              borderInlineStart: tableBorder
            }
          }
        },
        // Empty placeholder
        [`&${componentCls}-virtual`]: {
          [`${componentCls}-placeholder ${componentCls}-cell`]: {
            borderInlineEnd: tableBorder,
            borderBottom: tableBorder
          }
        }
      }
    }
  };
};
const genTableStyle = (token) => {
  const {
    componentCls,
    fontWeightStrong,
    tablePaddingVertical,
    tablePaddingHorizontal,
    tableExpandColumnWidth,
    lineWidth,
    lineType,
    tableBorderColor,
    tableFontSize,
    tableBg,
    tableRadius,
    tableHeaderTextColor,
    motionDurationMid,
    tableHeaderBg,
    tableHeaderCellSplitColor,
    tableFooterTextColor,
    tableFooterBg,
    calc
  } = token;
  const tableBorder = `${unit(lineWidth)} ${lineType} ${tableBorderColor}`;
  return {
    [`${componentCls}-wrapper`]: Object.assign(Object.assign({
      clear: "both",
      maxWidth: "100%",
      // fix https://github.com/ant-design/ant-design/issues/46177
      ["--rc-virtual-list-scrollbar-bg"]: token.tableScrollBg
    }, clearFix()), {
      [componentCls]: Object.assign(Object.assign({}, resetComponent(token)), {
        fontSize: tableFontSize,
        background: tableBg,
        borderRadius: `${unit(tableRadius)} ${unit(tableRadius)} 0 0`,
        // https://github.com/ant-design/ant-design/issues/47486
        scrollbarColor: `${token.tableScrollThumbBg} ${token.tableScrollBg}`
      }),
      // https://github.com/ant-design/ant-design/issues/17611
      table: {
        width: "100%",
        textAlign: "start",
        borderRadius: `${unit(tableRadius)} ${unit(tableRadius)} 0 0`,
        borderCollapse: "separate",
        borderSpacing: 0
      },
      // ============================= Cell ==============================
      [`
          ${componentCls}-cell,
          ${componentCls}-thead > tr > th,
          ${componentCls}-tbody > tr > th,
          ${componentCls}-tbody > tr > td,
          tfoot > tr > th,
          tfoot > tr > td
        `]: {
        position: "relative",
        padding: `${unit(tablePaddingVertical)} ${unit(tablePaddingHorizontal)}`,
        overflowWrap: "break-word"
      },
      // ============================ Title =============================
      [`${componentCls}-title`]: {
        padding: `${unit(tablePaddingVertical)} ${unit(tablePaddingHorizontal)}`
      },
      // ============================ Header ============================
      [`${componentCls}-thead`]: {
        [`
          > tr > th,
          > tr > td
        `]: {
          position: "relative",
          color: tableHeaderTextColor,
          fontWeight: fontWeightStrong,
          textAlign: "start",
          background: tableHeaderBg,
          borderBottom: tableBorder,
          transition: `background ${motionDurationMid} ease`,
          "&[colspan]:not([colspan='1'])": {
            textAlign: "center"
          },
          [`&:not(:last-child):not(${componentCls}-selection-column):not(${componentCls}-row-expand-icon-cell):not([colspan])::before`]: {
            position: "absolute",
            top: "50%",
            insetInlineEnd: 0,
            width: 1,
            height: "1.6em",
            backgroundColor: tableHeaderCellSplitColor,
            transform: "translateY(-50%)",
            transition: `background-color ${motionDurationMid}`,
            content: '""'
          }
        },
        "> tr:not(:last-child) > th[colspan]": {
          borderBottom: 0
        }
      },
      // ============================ Body ============================
      [`${componentCls}-tbody`]: {
        "> tr": {
          "> th, > td": {
            transition: `background ${motionDurationMid}, border-color ${motionDurationMid}`,
            borderBottom: tableBorder,
            // ========================= Nest Table ===========================
            [`
              > ${componentCls}-wrapper:only-child,
              > ${componentCls}-expanded-row-fixed > ${componentCls}-wrapper:only-child
            `]: {
              [componentCls]: {
                marginBlock: unit(calc(tablePaddingVertical).mul(-1).equal()),
                marginInline: `${unit(calc(tableExpandColumnWidth).sub(tablePaddingHorizontal).equal())}
                ${unit(calc(tablePaddingHorizontal).mul(-1).equal())}`,
                [`${componentCls}-tbody > tr:last-child > td`]: {
                  borderBottomWidth: 0,
                  "&:first-child, &:last-child": {
                    borderRadius: 0
                  }
                }
              }
            }
          },
          "> th": {
            position: "relative",
            color: tableHeaderTextColor,
            fontWeight: fontWeightStrong,
            textAlign: "start",
            background: tableHeaderBg,
            borderBottom: tableBorder,
            transition: `background ${motionDurationMid} ease`
          },
          // measure cell styles
          [`& > ${componentCls}-measure-cell`]: {
            paddingBlock: `0 !important`,
            borderBlock: `0 !important`,
            [`${componentCls}-measure-cell-content`]: {
              height: 0,
              overflow: "hidden",
              pointerEvents: "none"
            }
          }
        }
      },
      // ============================ Footer ============================
      [`${componentCls}-footer`]: {
        padding: `${unit(tablePaddingVertical)} ${unit(tablePaddingHorizontal)}`,
        color: tableFooterTextColor,
        background: tableFooterBg
      }
    })
  };
};
const prepareComponentToken = (token) => {
  const {
    colorFillAlter,
    colorBgContainer,
    colorTextHeading,
    colorFillSecondary,
    colorFillContent,
    controlItemBgActive,
    controlItemBgActiveHover,
    padding,
    paddingSM,
    paddingXS,
    colorBorderSecondary,
    borderRadiusLG,
    controlHeight,
    colorTextPlaceholder,
    fontSize,
    fontSizeSM,
    lineHeight,
    lineWidth,
    colorIcon,
    colorIconHover,
    opacityLoading,
    controlInteractiveSize
  } = token;
  const colorFillSecondarySolid = new FastColor(colorFillSecondary).onBackground(colorBgContainer).toHexString();
  const colorFillContentSolid = new FastColor(colorFillContent).onBackground(colorBgContainer).toHexString();
  const colorFillAlterSolid = new FastColor(colorFillAlter).onBackground(colorBgContainer).toHexString();
  const baseColorAction = new FastColor(colorIcon);
  const baseColorActionHover = new FastColor(colorIconHover);
  const expandIconHalfInner = controlInteractiveSize / 2 - lineWidth;
  const expandIconSize = expandIconHalfInner * 2 + lineWidth * 3;
  return {
    headerBg: colorFillAlterSolid,
    headerColor: colorTextHeading,
    headerSortActiveBg: colorFillSecondarySolid,
    headerSortHoverBg: colorFillContentSolid,
    bodySortBg: colorFillAlterSolid,
    rowHoverBg: colorFillAlterSolid,
    rowSelectedBg: controlItemBgActive,
    rowSelectedHoverBg: controlItemBgActiveHover,
    rowExpandedBg: colorFillAlter,
    cellPaddingBlock: padding,
    cellPaddingInline: padding,
    cellPaddingBlockMD: paddingSM,
    cellPaddingInlineMD: paddingXS,
    cellPaddingBlockSM: paddingXS,
    cellPaddingInlineSM: paddingXS,
    borderColor: colorBorderSecondary,
    headerBorderRadius: borderRadiusLG,
    footerBg: colorFillAlterSolid,
    footerColor: colorTextHeading,
    cellFontSize: fontSize,
    cellFontSizeMD: fontSize,
    cellFontSizeSM: fontSize,
    headerSplitColor: colorBorderSecondary,
    fixedHeaderSortActiveBg: colorFillSecondarySolid,
    headerFilterHoverBg: colorFillContent,
    filterDropdownMenuBg: colorBgContainer,
    filterDropdownBg: colorBgContainer,
    expandIconBg: colorBgContainer,
    selectionColumnWidth: controlHeight,
    stickyScrollBarBg: colorTextPlaceholder,
    stickyScrollBarBorderRadius: 100,
    expandIconMarginTop: (fontSize * lineHeight - lineWidth * 3) / 2 - Math.ceil((fontSizeSM * 1.4 - lineWidth * 3) / 2),
    headerIconColor: baseColorAction.clone().setA(baseColorAction.a * opacityLoading).toRgbString(),
    headerIconHoverColor: baseColorActionHover.clone().setA(baseColorActionHover.a * opacityLoading).toRgbString(),
    expandIconHalfInner,
    expandIconSize,
    expandIconScale: controlInteractiveSize / expandIconSize
  };
};
const zIndexTableFixed = 2;
const useStyle = genStyleHooks("Table", (token) => {
  const {
    colorTextHeading,
    colorSplit,
    colorBgContainer,
    controlInteractiveSize: checkboxSize,
    headerBg,
    headerColor,
    headerSortActiveBg,
    headerSortHoverBg,
    bodySortBg,
    rowHoverBg,
    rowSelectedBg,
    rowSelectedHoverBg,
    rowExpandedBg,
    cellPaddingBlock,
    cellPaddingInline,
    cellPaddingBlockMD,
    cellPaddingInlineMD,
    cellPaddingBlockSM,
    cellPaddingInlineSM,
    borderColor,
    footerBg,
    footerColor,
    headerBorderRadius,
    cellFontSize,
    cellFontSizeMD,
    cellFontSizeSM,
    headerSplitColor,
    fixedHeaderSortActiveBg,
    headerFilterHoverBg,
    filterDropdownBg,
    expandIconBg,
    selectionColumnWidth,
    stickyScrollBarBg,
    calc
  } = token;
  const tableToken = merge(token, {
    tableFontSize: cellFontSize,
    tableBg: colorBgContainer,
    tableRadius: headerBorderRadius,
    tablePaddingVertical: cellPaddingBlock,
    tablePaddingHorizontal: cellPaddingInline,
    tablePaddingVerticalMiddle: cellPaddingBlockMD,
    tablePaddingHorizontalMiddle: cellPaddingInlineMD,
    tablePaddingVerticalSmall: cellPaddingBlockSM,
    tablePaddingHorizontalSmall: cellPaddingInlineSM,
    tableBorderColor: borderColor,
    tableHeaderTextColor: headerColor,
    tableHeaderBg: headerBg,
    tableFooterTextColor: footerColor,
    tableFooterBg: footerBg,
    tableHeaderCellSplitColor: headerSplitColor,
    tableHeaderSortBg: headerSortActiveBg,
    tableHeaderSortHoverBg: headerSortHoverBg,
    tableBodySortBg: bodySortBg,
    tableFixedHeaderSortActiveBg: fixedHeaderSortActiveBg,
    tableHeaderFilterActiveBg: headerFilterHoverBg,
    tableFilterDropdownBg: filterDropdownBg,
    tableRowHoverBg: rowHoverBg,
    tableSelectedRowBg: rowSelectedBg,
    tableSelectedRowHoverBg: rowSelectedHoverBg,
    zIndexTableFixed,
    zIndexTableSticky: calc(zIndexTableFixed).add(1).equal({
      unit: false
    }),
    tableFontSizeMiddle: cellFontSizeMD,
    tableFontSizeSmall: cellFontSizeSM,
    tableSelectionColumnWidth: selectionColumnWidth,
    tableExpandIconBg: expandIconBg,
    tableExpandColumnWidth: calc(checkboxSize).add(calc(token.padding).mul(2)).equal(),
    tableExpandedRowBg: rowExpandedBg,
    // Dropdown
    tableFilterDropdownWidth: 120,
    tableFilterDropdownHeight: 264,
    tableFilterDropdownSearchWidth: 140,
    // Virtual Scroll Bar
    tableScrollThumbSize: 8,
    // Mac scroll bar size
    tableScrollThumbBg: stickyScrollBarBg,
    tableScrollThumbBgHover: colorTextHeading,
    tableScrollBg: colorSplit
  });
  return [genTableStyle(tableToken), genPaginationStyle(tableToken), genSummaryStyle(tableToken), genSorterStyle(tableToken), genFilterStyle(tableToken), genBorderedStyle(tableToken), genRadiusStyle(tableToken), genExpandStyle(tableToken), genSummaryStyle(tableToken), genEmptyStyle(tableToken), genSelectionStyle(tableToken), genFixedStyle(tableToken), genStickyStyle(tableToken), genEllipsisStyle(tableToken), genSizeStyle(tableToken), genStyle(tableToken), genVirtualStyle(tableToken)];
}, prepareComponentToken, {
  unitless: {
    expandIconScale: true
  }
});
const EMPTY_LIST = [];
const InternalTable = (props, ref) => {
  var _a, _b;
  const {
    prefixCls: customizePrefixCls,
    className,
    rootClassName,
    style,
    size: customizeSize,
    bordered,
    dropdownPrefixCls: customizeDropdownPrefixCls,
    dataSource,
    pagination,
    rowSelection,
    rowKey = "key",
    rowClassName,
    columns,
    children,
    childrenColumnName: legacyChildrenColumnName,
    onChange,
    getPopupContainer,
    loading,
    expandIcon,
    expandable,
    expandedRowRender,
    expandIconColumnIndex,
    indentSize,
    scroll,
    sortDirections,
    locale,
    showSorterTooltip = {
      target: "full-header"
    },
    virtual
  } = props;
  devUseWarning();
  const baseColumns = reactExports.useMemo(() => columns || convertChildrenToColumns(children), [columns, children]);
  const needResponsive = reactExports.useMemo(() => baseColumns.some((col) => col.responsive), [baseColumns]);
  const screens = useBreakpoint(needResponsive);
  const mergedColumns = reactExports.useMemo(() => {
    const matched = new Set(Object.keys(screens).filter((m) => screens[m]));
    return baseColumns.filter((c) => !c.responsive || c.responsive.some((r) => matched.has(r)));
  }, [baseColumns, screens]);
  const tableProps = omit(props, ["className", "style", "columns"]);
  const {
    locale: contextLocale = localeValues,
    direction,
    table,
    renderEmpty,
    getPrefixCls,
    getPopupContainer: getContextPopupContainer
  } = reactExports.useContext(ConfigContext);
  const mergedSize = useSize(customizeSize);
  const tableLocale = Object.assign(Object.assign({}, contextLocale.Table), locale);
  const rawData = dataSource || EMPTY_LIST;
  const prefixCls = getPrefixCls("table", customizePrefixCls);
  const dropdownPrefixCls = getPrefixCls("dropdown", customizeDropdownPrefixCls);
  const [, token] = useToken();
  const rootCls = useCSSVarCls(prefixCls);
  const [wrapCSSVar, hashId, cssVarCls] = useStyle(prefixCls, rootCls);
  const mergedExpandable = Object.assign(Object.assign({
    childrenColumnName: legacyChildrenColumnName,
    expandIconColumnIndex
  }, expandable), {
    expandIcon: (_a = expandable === null || expandable === void 0 ? void 0 : expandable.expandIcon) !== null && _a !== void 0 ? _a : (_b = table === null || table === void 0 ? void 0 : table.expandable) === null || _b === void 0 ? void 0 : _b.expandIcon
  });
  const {
    childrenColumnName = "children"
  } = mergedExpandable;
  const expandType = reactExports.useMemo(() => {
    if (rawData.some((item) => item === null || item === void 0 ? void 0 : item[childrenColumnName])) {
      return "nest";
    }
    if (expandedRowRender || (expandable === null || expandable === void 0 ? void 0 : expandable.expandedRowRender)) {
      return "row";
    }
    return null;
  }, [rawData]);
  const internalRefs = {
    body: reactExports.useRef(null)
  };
  const getContainerWidth = useContainerWidth(prefixCls);
  const rootRef = reactExports.useRef(null);
  const tblRef = reactExports.useRef(null);
  useProxyImperativeHandle(ref, () => Object.assign(Object.assign({}, tblRef.current), {
    nativeElement: rootRef.current
  }));
  const getRowKey = reactExports.useMemo(() => {
    if (typeof rowKey === "function") {
      return rowKey;
    }
    return (record) => record === null || record === void 0 ? void 0 : record[rowKey];
  }, [rowKey]);
  const [getRecordByKey] = useLazyKVMap(rawData, childrenColumnName, getRowKey);
  const changeEventInfo = {};
  const triggerOnChange = (info, action, reset = false) => {
    var _a2, _b2, _c, _d;
    const changeInfo = Object.assign(Object.assign({}, changeEventInfo), info);
    if (reset) {
      (_a2 = changeEventInfo.resetPagination) === null || _a2 === void 0 ? void 0 : _a2.call(changeEventInfo);
      if ((_b2 = changeInfo.pagination) === null || _b2 === void 0 ? void 0 : _b2.current) {
        changeInfo.pagination.current = 1;
      }
      if (pagination) {
        (_c = pagination.onChange) === null || _c === void 0 ? void 0 : _c.call(pagination, 1, (_d = changeInfo.pagination) === null || _d === void 0 ? void 0 : _d.pageSize);
      }
    }
    if (scroll && scroll.scrollToFirstRowOnChange !== false && internalRefs.body.current) {
      scrollTo(0, {
        getContainer: () => internalRefs.body.current
      });
    }
    onChange === null || onChange === void 0 ? void 0 : onChange(changeInfo.pagination, changeInfo.filters, changeInfo.sorter, {
      currentDataSource: getFilterData(getSortData(rawData, changeInfo.sorterStates, childrenColumnName), changeInfo.filterStates, childrenColumnName),
      action
    });
  };
  const onSorterChange = (sorter, sorterStates) => {
    triggerOnChange({
      sorter,
      sorterStates
    }, "sort", false);
  };
  const [transformSorterColumns, sortStates, sorterTitleProps, getSorters] = useFilterSorter({
    prefixCls,
    mergedColumns,
    onSorterChange,
    sortDirections: sortDirections || ["ascend", "descend"],
    tableLocale,
    showSorterTooltip
  });
  const sortedData = reactExports.useMemo(() => getSortData(rawData, sortStates, childrenColumnName), [rawData, sortStates]);
  changeEventInfo.sorter = getSorters();
  changeEventInfo.sorterStates = sortStates;
  const onFilterChange = (filters2, filterStates2) => {
    triggerOnChange({
      filters: filters2,
      filterStates: filterStates2
    }, "filter", true);
  };
  const [transformFilterColumns, filterStates, filters] = useFilter({
    prefixCls,
    locale: tableLocale,
    dropdownPrefixCls,
    mergedColumns,
    onFilterChange,
    getPopupContainer: getPopupContainer || getContextPopupContainer,
    rootClassName: classNames(rootClassName, rootCls)
  });
  const mergedData = getFilterData(sortedData, filterStates, childrenColumnName);
  changeEventInfo.filters = filters;
  changeEventInfo.filterStates = filterStates;
  const columnTitleProps = reactExports.useMemo(() => {
    const mergedFilters = {};
    Object.keys(filters).forEach((filterKey) => {
      if (filters[filterKey] !== null) {
        mergedFilters[filterKey] = filters[filterKey];
      }
    });
    return Object.assign(Object.assign({}, sorterTitleProps), {
      filters: mergedFilters
    });
  }, [sorterTitleProps, filters]);
  const [transformTitleColumns] = useTitleColumns(columnTitleProps);
  const onPaginationChange = (current, pageSize) => {
    triggerOnChange({
      pagination: Object.assign(Object.assign({}, changeEventInfo.pagination), {
        current,
        pageSize
      })
    }, "paginate");
  };
  const [mergedPagination, resetPagination] = usePagination(mergedData.length, onPaginationChange, pagination);
  changeEventInfo.pagination = pagination === false ? {} : getPaginationParam(mergedPagination, pagination);
  changeEventInfo.resetPagination = resetPagination;
  const pageData = reactExports.useMemo(() => {
    if (pagination === false || !mergedPagination.pageSize) {
      return mergedData;
    }
    const {
      current = 1,
      total,
      pageSize = DEFAULT_PAGE_SIZE
    } = mergedPagination;
    if (mergedData.length < total) {
      if (mergedData.length > pageSize) {
        return mergedData.slice((current - 1) * pageSize, current * pageSize);
      }
      return mergedData;
    }
    return mergedData.slice((current - 1) * pageSize, current * pageSize);
  }, [!!pagination, mergedData, mergedPagination === null || mergedPagination === void 0 ? void 0 : mergedPagination.current, mergedPagination === null || mergedPagination === void 0 ? void 0 : mergedPagination.pageSize, mergedPagination === null || mergedPagination === void 0 ? void 0 : mergedPagination.total]);
  const [transformSelectionColumns, selectedKeySet] = useSelection({
    prefixCls,
    data: mergedData,
    pageData,
    getRowKey,
    getRecordByKey,
    expandType,
    childrenColumnName,
    locale: tableLocale,
    getPopupContainer: getPopupContainer || getContextPopupContainer
  }, rowSelection);
  const internalRowClassName = (record, index, indent) => {
    let mergedRowClassName;
    if (typeof rowClassName === "function") {
      mergedRowClassName = classNames(rowClassName(record, index, indent));
    } else {
      mergedRowClassName = classNames(rowClassName);
    }
    return classNames({
      [`${prefixCls}-row-selected`]: selectedKeySet.has(getRowKey(record, index))
    }, mergedRowClassName);
  };
  mergedExpandable.__PARENT_RENDER_ICON__ = mergedExpandable.expandIcon;
  mergedExpandable.expandIcon = mergedExpandable.expandIcon || expandIcon || renderExpandIcon(tableLocale);
  if (expandType === "nest" && mergedExpandable.expandIconColumnIndex === void 0) {
    mergedExpandable.expandIconColumnIndex = rowSelection ? 1 : 0;
  } else if (mergedExpandable.expandIconColumnIndex > 0 && rowSelection) {
    mergedExpandable.expandIconColumnIndex -= 1;
  }
  if (typeof mergedExpandable.indentSize !== "number") {
    mergedExpandable.indentSize = typeof indentSize === "number" ? indentSize : 15;
  }
  const transformColumns = reactExports.useCallback((innerColumns) => transformTitleColumns(transformSelectionColumns(transformFilterColumns(transformSorterColumns(innerColumns)))), [transformSorterColumns, transformFilterColumns, transformSelectionColumns]);
  const getPaginationNodes = () => {
    if (pagination === false || !(mergedPagination === null || mergedPagination === void 0 ? void 0 : mergedPagination.total)) {
      return {};
    }
    const getPaginationSize = () => mergedPagination.size || (mergedSize === "small" || mergedSize === "middle" ? "small" : void 0);
    const renderPagination = (position) => {
      const align = position === "left" ? "start" : position === "right" ? "end" : position;
      return /* @__PURE__ */ reactExports.createElement(Pagination, Object.assign({}, mergedPagination, {
        align: mergedPagination.align || align,
        className: classNames(`${prefixCls}-pagination`, mergedPagination.className),
        size: getPaginationSize()
      }));
    };
    const defaultPosition = direction === "rtl" ? "left" : "right";
    const positions = mergedPagination.position;
    if (positions === null || !Array.isArray(positions)) {
      return {
        bottom: renderPagination(defaultPosition)
      };
    }
    const topPosition = positions.find((pos) => typeof pos === "string" && pos.toLowerCase().includes("top"));
    const bottomPosition = positions.find((pos) => typeof pos === "string" && pos.toLowerCase().includes("bottom"));
    const isNone = positions.every((pos) => `${pos}` === "none");
    const topAlign = topPosition ? topPosition.toLowerCase().replace("top", "") : "";
    const bottomAlign = bottomPosition ? bottomPosition.toLowerCase().replace("bottom", "") : "";
    const shouldDefaultBottom = !topPosition && !bottomPosition && !isNone;
    const renderTop = () => topAlign ? renderPagination(topAlign) : void 0;
    const renderBottom = () => {
      if (bottomAlign) {
        return renderPagination(bottomAlign);
      }
      if (shouldDefaultBottom) {
        return renderPagination(defaultPosition);
      }
      return void 0;
    };
    return {
      top: renderTop(),
      bottom: renderBottom()
    };
  };
  const spinProps = reactExports.useMemo(() => {
    if (typeof loading === "boolean") {
      return {
        spinning: loading
      };
    } else if (typeof loading === "object" && loading !== null) {
      return Object.assign({
        spinning: true
      }, loading);
    } else {
      return void 0;
    }
  }, [loading]);
  const wrapperClassNames = classNames(cssVarCls, rootCls, `${prefixCls}-wrapper`, table === null || table === void 0 ? void 0 : table.className, {
    [`${prefixCls}-wrapper-rtl`]: direction === "rtl"
  }, className, rootClassName, hashId);
  const mergedStyle = Object.assign(Object.assign({}, table === null || table === void 0 ? void 0 : table.style), style);
  const mergedEmptyNode = reactExports.useMemo(() => {
    if ((spinProps === null || spinProps === void 0 ? void 0 : spinProps.spinning) && rawData === EMPTY_LIST) {
      return null;
    }
    if (typeof (locale === null || locale === void 0 ? void 0 : locale.emptyText) !== "undefined") {
      return locale.emptyText;
    }
    return (renderEmpty === null || renderEmpty === void 0 ? void 0 : renderEmpty("Table")) || /* @__PURE__ */ reactExports.createElement(DefaultRenderEmpty, {
      componentName: "Table"
    });
  }, [spinProps === null || spinProps === void 0 ? void 0 : spinProps.spinning, rawData, locale === null || locale === void 0 ? void 0 : locale.emptyText, renderEmpty]);
  const TableComponent = virtual ? RcVirtualTable : RcTable;
  const virtualProps = {};
  const listItemHeight = reactExports.useMemo(() => {
    const {
      fontSize,
      lineHeight,
      lineWidth,
      padding,
      paddingXS,
      paddingSM
    } = token;
    const fontHeight = Math.floor(fontSize * lineHeight);
    switch (mergedSize) {
      case "middle":
        return paddingSM * 2 + fontHeight + lineWidth;
      case "small":
        return paddingXS * 2 + fontHeight + lineWidth;
      default:
        return padding * 2 + fontHeight + lineWidth;
    }
  }, [token, mergedSize]);
  if (virtual) {
    virtualProps.listItemHeight = listItemHeight;
  }
  const {
    top: topPaginationNode,
    bottom: bottomPaginationNode
  } = getPaginationNodes();
  return wrapCSSVar(/* @__PURE__ */ reactExports.createElement("div", {
    ref: rootRef,
    className: wrapperClassNames,
    style: mergedStyle
  }, /* @__PURE__ */ reactExports.createElement(Spin, Object.assign({
    spinning: false
  }, spinProps), topPaginationNode, /* @__PURE__ */ reactExports.createElement(TableComponent, Object.assign({}, virtualProps, tableProps, {
    ref: tblRef,
    columns: mergedColumns,
    direction,
    expandable: mergedExpandable,
    prefixCls,
    className: classNames({
      [`${prefixCls}-middle`]: mergedSize === "middle",
      [`${prefixCls}-small`]: mergedSize === "small",
      [`${prefixCls}-bordered`]: bordered,
      [`${prefixCls}-empty`]: rawData.length === 0
    }, cssVarCls, rootCls, hashId),
    data: pageData,
    rowKey: getRowKey,
    rowClassName: internalRowClassName,
    emptyText: mergedEmptyNode,
    // Internal
    internalHooks: INTERNAL_HOOKS,
    internalRefs,
    transformColumns,
    getContainerWidth,
    measureRowRender: (measureRow) => /* @__PURE__ */ reactExports.createElement(ConfigProvider, {
      getPopupContainer: (node) => node
    }, measureRow)
  })), bottomPaginationNode)));
};
const InternalTable$1 = /* @__PURE__ */ reactExports.forwardRef(InternalTable);
const Table = (props, ref) => {
  const renderTimesRef = reactExports.useRef(0);
  renderTimesRef.current += 1;
  return /* @__PURE__ */ reactExports.createElement(InternalTable$1, Object.assign({}, props, {
    ref,
    _renderTimes: renderTimesRef.current
  }));
};
const ForwardTable = /* @__PURE__ */ reactExports.forwardRef(Table);
ForwardTable.SELECTION_COLUMN = SELECTION_COLUMN;
ForwardTable.EXPAND_COLUMN = EXPAND_COLUMN;
ForwardTable.SELECTION_ALL = SELECTION_ALL;
ForwardTable.SELECTION_INVERT = SELECTION_INVERT;
ForwardTable.SELECTION_NONE = SELECTION_NONE;
ForwardTable.Column = Column;
ForwardTable.ColumnGroup = ColumnGroup;
ForwardTable.Summary = FooterComponents;
var BookOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-260 72h96v209.9L621.5 312 572 347.4V136zm220 752H232V136h280v296.9c0 3.3 1 6.6 3 9.3a15.9 15.9 0 0022.3 3.7l83.8-59.9 81.4 59.4c2.7 2 6 3.1 9.4 3.1 8.8 0 16-7.2 16-16V136h64v752z" } }] }, "name": "book", "theme": "outlined" };
var BookOutlined = function BookOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: BookOutlined$1
  }));
};
var RefIcon$9 = /* @__PURE__ */ reactExports.forwardRef(BookOutlined);
var CheckCircleOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M699 353h-46.9c-10.2 0-19.9 4.9-25.9 13.3L469 584.3l-71.2-98.8c-6-8.3-15.6-13.3-25.9-13.3H325c-6.5 0-10.3 7.4-6.5 12.7l124.6 172.8a31.8 31.8 0 0051.7 0l210.6-292c3.9-5.3.1-12.7-6.4-12.7z" } }, { "tag": "path", "attrs": { "d": "M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" } }] }, "name": "check-circle", "theme": "outlined" };
var CheckCircleOutlined = function CheckCircleOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: CheckCircleOutlined$1
  }));
};
var RefIcon$8 = /* @__PURE__ */ reactExports.forwardRef(CheckCircleOutlined);
var CloudDownloadOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M624 706.3h-74.1V464c0-4.4-3.6-8-8-8h-60c-4.4 0-8 3.6-8 8v242.3H400c-6.7 0-10.4 7.7-6.3 12.9l112 141.7a8 8 0 0012.6 0l112-141.7c4.1-5.2.4-12.9-6.3-12.9z" } }, { "tag": "path", "attrs": { "d": "M811.4 366.7C765.6 245.9 648.9 160 512.2 160S258.8 245.8 213 366.6C127.3 389.1 64 467.2 64 560c0 110.5 89.5 200 199.9 200H304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8h-40.1c-33.7 0-65.4-13.4-89-37.7-23.5-24.2-36-56.8-34.9-90.6.9-26.4 9.9-51.2 26.2-72.1 16.7-21.3 40.1-36.8 66.1-43.7l37.9-9.9 13.9-36.6c8.6-22.8 20.6-44.1 35.7-63.4a245.6 245.6 0 0152.4-49.9c41.1-28.9 89.5-44.2 140-44.2s98.9 15.3 140 44.2c19.9 14 37.5 30.8 52.4 49.9 15.1 19.3 27.1 40.7 35.7 63.4l13.8 36.5 37.8 10C846.1 454.5 884 503.8 884 560c0 33.1-12.9 64.3-36.3 87.7a123.07 123.07 0 01-87.6 36.3H720c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h40.1C870.5 760 960 670.5 960 560c0-92.7-63.1-170.7-148.6-193.3z" } }] }, "name": "cloud-download", "theme": "outlined" };
var CloudDownloadOutlined = function CloudDownloadOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: CloudDownloadOutlined$1
  }));
};
var RefIcon$7 = /* @__PURE__ */ reactExports.forwardRef(CloudDownloadOutlined);
var ClusterOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M888 680h-54V540H546v-92h238c8.8 0 16-7.2 16-16V168c0-8.8-7.2-16-16-16H240c-8.8 0-16 7.2-16 16v264c0 8.8 7.2 16 16 16h238v92H190v140h-54c-4.4 0-8 3.6-8 8v176c0 4.4 3.6 8 8 8h176c4.4 0 8-3.6 8-8V688c0-4.4-3.6-8-8-8h-54v-72h220v72h-54c-4.4 0-8 3.6-8 8v176c0 4.4 3.6 8 8 8h176c4.4 0 8-3.6 8-8V688c0-4.4-3.6-8-8-8h-54v-72h220v72h-54c-4.4 0-8 3.6-8 8v176c0 4.4 3.6 8 8 8h176c4.4 0 8-3.6 8-8V688c0-4.4-3.6-8-8-8zM256 805.3c0 1.5-1.2 2.7-2.7 2.7h-58.7c-1.5 0-2.7-1.2-2.7-2.7v-58.7c0-1.5 1.2-2.7 2.7-2.7h58.7c1.5 0 2.7 1.2 2.7 2.7v58.7zm288 0c0 1.5-1.2 2.7-2.7 2.7h-58.7c-1.5 0-2.7-1.2-2.7-2.7v-58.7c0-1.5 1.2-2.7 2.7-2.7h58.7c1.5 0 2.7 1.2 2.7 2.7v58.7zM288 384V216h448v168H288zm544 421.3c0 1.5-1.2 2.7-2.7 2.7h-58.7c-1.5 0-2.7-1.2-2.7-2.7v-58.7c0-1.5 1.2-2.7 2.7-2.7h58.7c1.5 0 2.7 1.2 2.7 2.7v58.7zM360 300a40 40 0 1080 0 40 40 0 10-80 0z" } }] }, "name": "cluster", "theme": "outlined" };
var ClusterOutlined = function ClusterOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: ClusterOutlined$1
  }));
};
var RefIcon$6 = /* @__PURE__ */ reactExports.forwardRef(ClusterOutlined);
var CodeOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M516 673c0 4.4 3.4 8 7.5 8h185c4.1 0 7.5-3.6 7.5-8v-48c0-4.4-3.4-8-7.5-8h-185c-4.1 0-7.5 3.6-7.5 8v48zm-194.9 6.1l192-161c3.8-3.2 3.8-9.1 0-12.3l-192-160.9A7.95 7.95 0 00308 351v62.7c0 2.4 1 4.6 2.9 6.1L420.7 512l-109.8 92.2a8.1 8.1 0 00-2.9 6.1V673c0 6.8 7.9 10.5 13.1 6.1zM880 112H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z" } }] }, "name": "code", "theme": "outlined" };
var CodeOutlined = function CodeOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: CodeOutlined$1
  }));
};
var RefIcon$5 = /* @__PURE__ */ reactExports.forwardRef(CodeOutlined);
var DatabaseOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M832 64H192c-17.7 0-32 14.3-32 32v832c0 17.7 14.3 32 32 32h640c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-600 72h560v208H232V136zm560 480H232V408h560v208zm0 272H232V680h560v208zM304 240a40 40 0 1080 0 40 40 0 10-80 0zm0 272a40 40 0 1080 0 40 40 0 10-80 0zm0 272a40 40 0 1080 0 40 40 0 10-80 0z" } }] }, "name": "database", "theme": "outlined" };
var DatabaseOutlined = function DatabaseOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: DatabaseOutlined$1
  }));
};
var RefIcon$4 = /* @__PURE__ */ reactExports.forwardRef(DatabaseOutlined);
var PoweroffOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M705.6 124.9a8 8 0 00-11.6 7.2v64.2c0 5.5 2.9 10.6 7.5 13.6a352.2 352.2 0 0162.2 49.8c32.7 32.8 58.4 70.9 76.3 113.3a355 355 0 0127.9 138.7c0 48.1-9.4 94.8-27.9 138.7a355.92 355.92 0 01-76.3 113.3 353.06 353.06 0 01-113.2 76.4c-43.8 18.6-90.5 28-138.5 28s-94.7-9.4-138.5-28a353.06 353.06 0 01-113.2-76.4A355.92 355.92 0 01184 650.4a355 355 0 01-27.9-138.7c0-48.1 9.4-94.8 27.9-138.7 17.9-42.4 43.6-80.5 76.3-113.3 19-19 39.8-35.6 62.2-49.8 4.7-2.9 7.5-8.1 7.5-13.6V132c0-6-6.3-9.8-11.6-7.2C178.5 195.2 82 339.3 80 506.3 77.2 745.1 272.5 943.5 511.2 944c239 .5 432.8-193.3 432.8-432.4 0-169.2-97-315.7-238.4-386.7zM480 560h64c4.4 0 8-3.6 8-8V88c0-4.4-3.6-8-8-8h-64c-4.4 0-8 3.6-8 8v464c0 4.4 3.6 8 8 8z" } }] }, "name": "poweroff", "theme": "outlined" };
var PoweroffOutlined = function PoweroffOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: PoweroffOutlined$1
  }));
};
var RefIcon$3 = /* @__PURE__ */ reactExports.forwardRef(PoweroffOutlined);
var ReadOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M928 161H699.2c-49.1 0-97.1 14.1-138.4 40.7L512 233l-48.8-31.3A255.2 255.2 0 00324.8 161H96c-17.7 0-32 14.3-32 32v568c0 17.7 14.3 32 32 32h228.8c49.1 0 97.1 14.1 138.4 40.7l44.4 28.6c1.3.8 2.8 1.3 4.3 1.3s3-.4 4.3-1.3l44.4-28.6C602 807.1 650.1 793 699.2 793H928c17.7 0 32-14.3 32-32V193c0-17.7-14.3-32-32-32zM324.8 721H136V233h188.8c35.4 0 69.8 10.1 99.5 29.2l48.8 31.3 6.9 4.5v462c-47.6-25.6-100.8-39-155.2-39zm563.2 0H699.2c-54.4 0-107.6 13.4-155.2 39V298l6.9-4.5 48.8-31.3c29.7-19.1 64.1-29.2 99.5-29.2H888v488zM396.9 361H211.1c-3.9 0-7.1 3.4-7.1 7.5v45c0 4.1 3.2 7.5 7.1 7.5h185.7c3.9 0 7.1-3.4 7.1-7.5v-45c.1-4.1-3.1-7.5-7-7.5zm223.1 7.5v45c0 4.1 3.2 7.5 7.1 7.5h185.7c3.9 0 7.1-3.4 7.1-7.5v-45c0-4.1-3.2-7.5-7.1-7.5H627.1c-3.9 0-7.1 3.4-7.1 7.5zM396.9 501H211.1c-3.9 0-7.1 3.4-7.1 7.5v45c0 4.1 3.2 7.5 7.1 7.5h185.7c3.9 0 7.1-3.4 7.1-7.5v-45c.1-4.1-3.1-7.5-7-7.5zm416 0H627.1c-3.9 0-7.1 3.4-7.1 7.5v45c0 4.1 3.2 7.5 7.1 7.5h185.7c3.9 0 7.1-3.4 7.1-7.5v-45c.1-4.1-3.1-7.5-7-7.5z" } }] }, "name": "read", "theme": "outlined" };
var ReadOutlined = function ReadOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: ReadOutlined$1
  }));
};
var RefIcon$2 = /* @__PURE__ */ reactExports.forwardRef(ReadOutlined);
var RobotOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M300 328a60 60 0 10120 0 60 60 0 10-120 0zM852 64H172c-17.7 0-32 14.3-32 32v660c0 17.7 14.3 32 32 32h680c17.7 0 32-14.3 32-32V96c0-17.7-14.3-32-32-32zm-32 660H204V128h616v596zM604 328a60 60 0 10120 0 60 60 0 10-120 0zm250.2 556H169.8c-16.5 0-29.8 14.3-29.8 32v36c0 4.4 3.3 8 7.4 8h729.1c4.1 0 7.4-3.6 7.4-8v-36c.1-17.7-13.2-32-29.7-32zM664 508H360c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h304c4.4 0 8-3.6 8-8v-60c0-4.4-3.6-8-8-8z" } }] }, "name": "robot", "theme": "outlined" };
var RobotOutlined = function RobotOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: RobotOutlined$1
  }));
};
var RefIcon$1 = /* @__PURE__ */ reactExports.forwardRef(RobotOutlined);
var StarOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M908.1 353.1l-253.9-36.9L540.7 86.1c-3.1-6.3-8.2-11.4-14.5-14.5-15.8-7.8-35-1.3-42.9 14.5L369.8 316.2l-253.9 36.9c-7 1-13.4 4.3-18.3 9.3a32.05 32.05 0 00.6 45.3l183.7 179.1-43.4 252.9a31.95 31.95 0 0046.4 33.7L512 754l227.1 119.4c6.2 3.3 13.4 4.4 20.3 3.2 17.4-3 29.1-19.5 26.1-36.9l-43.4-252.9 183.7-179.1c5-4.9 8.3-11.3 9.3-18.3 2.7-17.5-9.5-33.7-27-36.3zM664.8 561.6l36.1 210.3L512 672.7 323.1 772l36.1-210.3-152.8-149L417.6 382 512 190.7 606.4 382l211.2 30.7-152.8 148.9z" } }] }, "name": "star", "theme": "outlined" };
var StarOutlined = function StarOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: StarOutlined$1
  }));
};
var RefIcon = /* @__PURE__ */ reactExports.forwardRef(StarOutlined);
const BASE_URL_RULES = [
  { required: true, message: "请填写 Base URL" }
];
const OPTIONAL_URL_RULES = [
  {
    validator: async (_rule, value) => {
      const trimmed = String(value ?? "").trim();
      if (!trimmed) return;
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          throw new Error("invalid");
        }
      } catch {
        throw new Error("请输入包含协议的完整链接，如 https://api.example.com/v1/models");
      }
    }
  }
];
const MODEL_RULES = [
  { required: true, message: "请选择模型" }
];
const modal$4 = "_modal_1996g_1";
const lead$5 = "_lead_1996g_17";
const form$5 = "_form_1996g_24";
const styles$b = {
  modal: modal$4,
  lead: lead$5,
  form: form$5
};
const DEFAULT_FORM = {
  label: "",
  defaultBaseUrl: "https://api.openai.com/v1",
  modelsUrl: "",
  defaultModel: "gpt-4o-mini"
};
function AddModelProviderModal({
  open,
  onCancel,
  onSubmit
}) {
  const [form2] = Form.useForm();
  reactExports.useEffect(() => {
    if (!open) return;
    form2.setFieldsValue(DEFAULT_FORM);
  }, [open, form2]);
  const handleOk = async () => {
    const values = await form2.validateFields();
    const modelsUrl = values.modelsUrl.trim();
    await onSubmit({
      id: queryNewCustomProviderId(),
      label: values.label.trim(),
      // 为什么：自定义供应商密钥标签统一为 API Key，不再让用户配置
      apiKeyLabel: "API Key",
      defaultBaseUrl: values.defaultBaseUrl.trim(),
      defaultModel: values.defaultModel.trim() || "gpt-4o-mini",
      ...modelsUrl ? { modelsUrl } : {}
    });
    form2.resetFields();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Modal,
    {
      title: "添加模型供应商",
      open,
      onCancel,
      onOk: () => void handleOk(),
      okText: "添加",
      cancelText: "取消",
      destroyOnHidden: true,
      className: styles$b.modal,
      width: 480,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$b.lead, children: "自定义供应商按 OpenAI 兼容协议接入，添加后可在供应商下拉中选用，不会自动切换当前供应商。" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Form, { form: form2, layout: "vertical", className: styles$b.form, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "供应商名称",
              name: "label",
              rules: [{ required: true, message: "请填写供应商名称" }],
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input$1, { placeholder: "如：月之暗面、MiniMax、本地网关", maxLength: 32 })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "默认 Base URL",
              name: "defaultBaseUrl",
              rules: BASE_URL_RULES,
              extra: "须包含协议，切换到此供应商时会预填。",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input$1, { placeholder: "https://api.example.com/v1" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "模型列表获取链接",
              name: "modelsUrl",
              rules: OPTIONAL_URL_RULES,
              extra: "留空则使用 Base URL + /models；部分网关需填写完整列表地址。",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input$1, { placeholder: "https://api.example.com/v1/models" })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "默认模型",
              name: "defaultModel",
              extra: "拉取平台列表失败或尚未配置 Key 时的兜底模型 id。",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input$1, { placeholder: "gpt-4o-mini" })
            }
          )
        ] })
      ]
    }
  );
}
const MIN_PROVIDER_API_KEY_LENGTH = 8;
const PROVIDER_MODELS_DEBOUNCE_MS = 400;
function queryFriendlyIpcErrorMessage(err) {
  const raw = err instanceof Error ? err.message : String(err);
  const match = raw.match(/Error:\s+(.+)$/);
  return match?.[1]?.trim() || raw;
}
function queryProviderModelsCacheKey(creds) {
  return `${creds.provider}|${creds.baseUrl.trim()}|${creds.apiKey.trim()}`;
}
function queryProviderModelsRequest(creds) {
  const providerMeta = queryProviderOption(creds.provider, creds.customProviders ?? []);
  return {
    provider: creds.provider,
    apiKey: creds.apiKey.trim(),
    baseUrl: (creds.baseUrl.trim() || providerMeta.defaultBaseUrl).trim()
  };
}
function queryCanFetchProviderModels(apiKey) {
  return apiKey.trim().length >= MIN_PROVIDER_API_KEY_LENGTH;
}
async function queryProviderModelsFromApi(creds) {
  return window.api.queryProviderModels(queryProviderModelsRequest(creds));
}
function queryProviderModelsStatusHint(input) {
  const apiKey = input.apiKey.trim();
  if (!apiKey) return "填写 API Key 后将从平台 /models 拉取可选模型";
  if (!queryCanFetchProviderModels(apiKey)) return "API Key 过短，请填写完整密钥后再拉取";
  if (input.loading) return "正在从平台拉取模型列表…";
  if (input.remoteCount != null && input.remoteCount > 0) {
    return `已从平台加载 ${input.remoteCount} 个模型（可搜索）`;
  }
  if (input.error) return `${input.error}；当前显示本地兜底列表`;
  return "填写 API Key 后可从平台拉取可选模型";
}
function queryConnectionModelsStatusHint(input) {
  const apiKey = input.apiKey.trim();
  if (!apiKey) return null;
  if (!queryCanFetchProviderModels(apiKey)) return "API Key 过短，请填写完整后再拉取";
  if (input.loading) return "正在从平台拉取…";
  if (input.remoteCount != null && input.remoteCount > 0) {
    return `已从平台加载 ${input.remoteCount} 个模型`;
  }
  if (input.error) return `${input.error}；当前显示本地兜底列表`;
  return null;
}
const EMPTY_CUSTOM_PROVIDERS = [];
function queryCustomProvidersSignature(customProviders) {
  if (customProviders.length === 0) return "";
  return customProviders.map(
    (p) => `${p.id}|${p.label}|${p.apiKeyLabel}|${p.defaultBaseUrl}|${p.defaultModel}`
  ).join(";");
}
function useProviderModels(options) {
  const {
    enabled,
    provider,
    apiKey,
    baseUrl,
    customProviders = EMPTY_CUSTOM_PROVIDERS,
    autoFetch = true,
    refreshToken = 0
  } = options;
  const [remoteModels, setRemoteModels] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const [manualRefreshToken, setManualRefreshToken] = reactExports.useState(0);
  const fetchedCredsRef = reactExports.useRef(null);
  const consumedForceTokenRef = reactExports.useRef(0);
  const customProvidersSignature = reactExports.useMemo(
    () => queryCustomProvidersSignature(customProviders),
    [customProviders]
  );
  const forceToken = refreshToken + manualRefreshToken;
  const refresh = reactExports.useCallback(() => {
    setManualRefreshToken((n) => n + 1);
  }, []);
  reactExports.useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return;
    }
    const trimmedKey = apiKey.trim();
    if (!queryCanFetchProviderModels(trimmedKey)) {
      fetchedCredsRef.current = null;
      setRemoteModels(null);
      setLoading(false);
      setError(null);
      return;
    }
    const credsKey = `${provider}|${trimmedKey}|${baseUrl.trim()}|${customProvidersSignature}`;
    const forceRequested = forceToken > consumedForceTokenRef.current;
    if (forceRequested) {
      consumedForceTokenRef.current = forceToken;
    } else if (!autoFetch) {
      return;
    } else if (fetchedCredsRef.current === credsKey) {
      return;
    }
    let cancelled = false;
    setError(null);
    const timer = window.setTimeout(() => {
      setLoading(true);
      void queryProviderModelsFromApi({
        provider,
        apiKey: trimmedKey,
        baseUrl,
        customProviders
      }).then((result) => {
        if (cancelled) return;
        fetchedCredsRef.current = credsKey;
        if (result.fetchError) {
          setRemoteModels(null);
          setError(`${result.fetchError}；当前显示本地兜底`);
          return;
        }
        if (result.models.length > 0) {
          setRemoteModels(result.models);
          setError(null);
        } else {
          setError("平台返回空列表，已使用本地兜底");
        }
      }).catch((err) => {
        if (cancelled) return;
        fetchedCredsRef.current = credsKey;
        setError(queryFriendlyIpcErrorMessage(err) || "拉取模型列表失败");
      }).finally(() => {
        if (!cancelled) setLoading(false);
      });
    }, PROVIDER_MODELS_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    enabled,
    provider,
    apiKey,
    baseUrl,
    customProvidersSignature,
    autoFetch,
    forceToken
  ]);
  return { remoteModels, loading, error, refresh };
}
const modal$3 = "_modal_1rfod_1";
const lead$4 = "_lead_1rfod_17";
const providerBadge = "_providerBadge_1rfod_24";
const form$4 = "_form_1rfod_37";
const modelLabelRow = "_modelLabelRow_1rfod_54";
const styles$a = {
  modal: modal$3,
  lead: lead$4,
  providerBadge,
  form: form$4,
  modelLabelRow
};
function EditProviderCredentialsModal({
  open,
  provider,
  providerLabel,
  initialValues,
  customProviders,
  providerModelCatalog,
  onCancel,
  onSubmit
}) {
  const [form2] = Form.useForm();
  const [modelsRefreshToken, setModelsRefreshToken] = reactExports.useState(0);
  const watchedApiKey = Form.useWatch("apiKey", form2);
  const watchedBaseUrl = Form.useWatch("baseUrl", form2);
  const providerOption = provider ? queryProviderOption(provider, customProviders) : queryProviderOption("dashscope", customProviders);
  const draftApiKey = String(watchedApiKey ?? "").trim();
  const draftBaseUrl = String(watchedBaseUrl ?? "").trim() || providerOption.defaultBaseUrl;
  const { remoteModels, loading: modelsLoading, error: modelsError } = useProviderModels({
    enabled: open && Boolean(provider),
    provider: provider ?? "dashscope",
    apiKey: draftApiKey,
    baseUrl: draftBaseUrl,
    customProviders,
    autoFetch: false,
    refreshToken: modelsRefreshToken
  });
  reactExports.useEffect(() => {
    if (!open || !provider) return;
    form2.setFieldsValue({
      apiKey: initialValues.apiKey,
      baseUrl: initialValues.baseUrl,
      model: initialValues.model
    });
  }, [open, provider, initialValues, form2]);
  const modelSelectOptions = reactExports.useMemo(() => {
    if (!provider) return [];
    const merged = queryResolvedModelOptionsForProvider(
      provider,
      providerModelCatalog,
      remoteModels
    );
    return merged.map((m) => ({
      value: m.value,
      label: queryModelOptionDisplayLabel(m)
    }));
  }, [provider, remoteModels, providerModelCatalog]);
  const modelListExtra = queryProviderModelsStatusHint({
    apiKey: draftApiKey,
    loading: modelsLoading,
    remoteCount: remoteModels?.length ?? null,
    error: modelsError
  });
  const handleOk = async () => {
    const values = await form2.validateFields();
    onSubmit({
      apiKey: values.apiKey,
      baseUrl: values.baseUrl.trim(),
      model: values.model
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Modal,
    {
      title: `编辑供应商 · ${providerLabel}`,
      open,
      onCancel,
      onOk: () => void handleOk(),
      okText: "确定",
      cancelText: "取消",
      destroyOnHidden: true,
      className: styles$a.modal,
      width: 520,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$a.providerBadge, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$o, {}),
          providerLabel
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$a.lead, children: "密钥仅写入本机 Electron userData，不参与任何遥测或同步。" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Form, { form: form2, layout: "vertical", className: styles$a.form, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "API Key",
              name: "apiKey",
              rules: [{ required: true, message: "请填写 API Key" }],
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input$1.Password, { prefix: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$o, {}), placeholder: "sk-..." })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "Base URL",
              name: "baseUrl",
              rules: BASE_URL_RULES,
              extra: "请输入包含协议的完整服务地址。",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input$1,
                {
                  prefix: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$p, {}),
                  placeholder: providerOption.defaultBaseUrl
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$a.modelLabelRow, children: [
                "默认模型",
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "link",
                    size: "small",
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$q, {}),
                    disabled: !draftApiKey || modelsLoading,
                    loading: modelsLoading,
                    onClick: () => setModelsRefreshToken((n) => n + 1),
                    children: "从平台刷新"
                  }
                )
              ] }),
              name: "model",
              rules: MODEL_RULES,
              extra: modelListExtra,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Select,
                {
                  showSearch: true,
                  optionFilterProp: "label",
                  options: modelSelectOptions,
                  placeholder: draftApiKey ? "从平台选择模型" : "先填写 API Key",
                  loading: modelsLoading,
                  notFoundContent: modelsLoading ? "加载中…" : draftApiKey ? "暂无模型" : "请先填写 API Key"
                }
              )
            }
          )
        ] })
      ]
    }
  );
}
const drawer = "_drawer_6dscg_1";
const lead$3 = "_lead_6dscg_42";
const tabs = "_tabs_6dscg_61";
const tabLabel = "_tabLabel_6dscg_92";
const tabCount = "_tabCount_6dscg_98";
const tabPane = "_tabPane_6dscg_120";
const tableArea = "_tableArea_6dscg_128";
const tableWrap = "_tableWrap_6dscg_136";
const paneHint = "_paneHint_6dscg_151";
const paneHintActions = "_paneHintActions_6dscg_170";
const platformSearch = "_platformSearch_6dscg_184";
const platformSearchMeta = "_platformSearchMeta_6dscg_194";
const errorBanner = "_errorBanner_6dscg_201";
const modelIdCell = "_modelIdCell_6dscg_227";
const metaTags = "_metaTags_6dscg_232";
const emptyBlock = "_emptyBlock_6dscg_238";
const editModal = "_editModal_6dscg_249";
const form$3 = "_form_6dscg_253";
const switchRow = "_switchRow_6dscg_264";
const switchItem = "_switchItem_6dscg_270";
const styles$9 = {
  drawer,
  lead: lead$3,
  tabs,
  tabLabel,
  tabCount,
  tabPane,
  tableArea,
  tableWrap,
  paneHint,
  paneHintActions,
  platformSearch,
  platformSearchMeta,
  errorBanner,
  modelIdCell,
  metaTags,
  emptyBlock,
  editModal,
  form: form$3,
  switchRow,
  switchItem
};
const TABLE_HEAD_HEIGHT_PX = 40;
const { Text: Text$6 } = Typography;
function queryRecordToForm(record) {
  return {
    modelId: record.modelId,
    displayName: record.displayName ?? "",
    contextWindow: record.contextWindow ?? "",
    size: record.size ?? "",
    category: record.category ?? queryModelCategory(record.modelId),
    description: record.description ?? "",
    supportsThinking: Boolean(record.supportsThinking),
    supportsVision: Boolean(record.supportsVision)
  };
}
function queryFormToRecord(id, values) {
  const modelId = values.modelId.trim();
  if (!modelId) return null;
  const displayName = values.displayName.trim();
  const contextWindow = values.contextWindow.trim();
  const size = values.size.trim();
  const category = values.category.trim();
  const description = values.description.trim();
  return {
    id,
    modelId,
    ...displayName ? { displayName } : {},
    ...contextWindow ? { contextWindow } : {},
    ...size ? { size } : {},
    ...category ? { category } : {},
    ...description ? { description } : {},
    ...values.supportsThinking ? { supportsThinking: true } : {},
    ...values.supportsVision ? { supportsVision: true } : {}
  };
}
function queryOptionToTableRow(option) {
  const modelId = option.value.trim();
  return {
    key: modelId,
    modelId,
    displayName: option.label?.trim() || modelId,
    category: option.category?.trim() || queryModelCategory(modelId),
    description: option.description,
    supportsThinking: queryModelSupportsThinking(modelId),
    supportsVision: /vl|vision|qvq|ocr|omni/i.test(modelId)
  };
}
function queryFilterCatalogRows(rows, keyword) {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row2) => {
    const haystack = [
      row2.modelId,
      row2.displayName,
      row2.category,
      row2.description ?? ""
    ].join(" ").toLowerCase();
    return haystack.includes(needle);
  });
}
function queryRecordToTableRow(record) {
  return {
    key: record.id,
    modelId: record.modelId,
    displayName: record.displayName?.trim() || record.modelId,
    category: record.category?.trim() || queryModelCategory(record.modelId),
    description: record.description,
    contextWindow: record.contextWindow,
    size: record.size,
    supportsThinking: record.supportsThinking,
    supportsVision: record.supportsVision,
    record
  };
}
const categoryOptions = PROVIDER_MODEL_CATEGORY_PRESETS.map((label2) => ({
  value: label2,
  label: label2
}));
function ProviderModelsMaintenanceDrawer({
  open,
  provider,
  providerLabel,
  records,
  apiKey,
  baseUrl,
  customProviders,
  onClose,
  onChange
}) {
  const [form2] = Form.useForm();
  const [activeTab, setActiveTab] = reactExports.useState("manual");
  const [editorOpen, setEditorOpen] = reactExports.useState(false);
  const [editingId, setEditingId] = reactExports.useState(null);
  const [platformRefreshToken, setPlatformRefreshToken] = reactExports.useState(0);
  const [platformSearch2, setPlatformSearch] = reactExports.useState("");
  const tableHostRef = reactExports.useRef(null);
  const [tableScrollY, setTableScrollY] = reactExports.useState(320);
  const syncTableScrollHeight = reactExports.useCallback(() => {
    const el = tableHostRef.current;
    if (!el) return;
    const next = Math.max(120, el.clientHeight - TABLE_HEAD_HEIGHT_PX);
    setTableScrollY((prev) => prev === next ? prev : next);
  }, []);
  const trimmedKey = apiKey.trim();
  const canFetchPlatform = trimmedKey.length >= 8;
  const {
    remoteModels,
    loading: platformLoading,
    error: platformError
  } = useProviderModels({
    /** 抽屉打开即拉取平台列表，便于 Tab 角标与切换后直接展示 */
    enabled: open && Boolean(provider),
    provider: provider ?? "dashscope",
    apiKey: trimmedKey,
    baseUrl,
    customProviders,
    autoFetch: canFetchPlatform,
    refreshToken: platformRefreshToken
  });
  reactExports.useEffect(() => {
    if (!open) {
      setEditorOpen(false);
      setEditingId(null);
      setActiveTab("manual");
      setPlatformSearch("");
    }
  }, [open]);
  const editingRecord = reactExports.useMemo(
    () => records.find((item) => item.id === editingId) ?? null,
    [records, editingId]
  );
  const manualRows = reactExports.useMemo(
    () => records.map(queryRecordToTableRow),
    [records]
  );
  const fallbackRows = reactExports.useMemo(() => {
    if (!provider) return [];
    return queryModelOptions(provider).map(queryOptionToTableRow);
  }, [provider]);
  const platformRows = reactExports.useMemo(() => {
    if (!remoteModels) return [];
    return remoteModels.map(queryOptionToTableRow);
  }, [remoteModels]);
  const filteredPlatformRows = reactExports.useMemo(
    () => queryFilterCatalogRows(platformRows, platformSearch2),
    [platformRows, platformSearch2]
  );
  const registeredModelIds = reactExports.useMemo(
    () => new Set(records.map((item) => item.modelId)),
    [records]
  );
  reactExports.useLayoutEffect(() => {
    if (!open) return;
    syncTableScrollHeight();
    const el = tableHostRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => syncTableScrollHeight());
    observer.observe(el);
    return () => observer.disconnect();
  }, [
    open,
    activeTab,
    platformError,
    records.length,
    fallbackRows.length,
    platformRows.length,
    filteredPlatformRows.length,
    platformSearch2,
    platformLoading,
    syncTableScrollHeight
  ]);
  const openCreate = () => {
    setActiveTab("manual");
    setEditingId(null);
    form2.setFieldsValue({
      modelId: "",
      displayName: "",
      contextWindow: "",
      size: "",
      category: "文本对话",
      description: "",
      supportsThinking: false,
      supportsVision: false
    });
    setEditorOpen(true);
  };
  const openEdit = (record) => {
    setEditingId(record.id);
    form2.setFieldsValue(queryRecordToForm(record));
    setEditorOpen(true);
  };
  const postAdoptToManual = (row2) => {
    if (registeredModelIds.has(row2.modelId)) {
      appMessage.info("该模型已在本机登记");
      return;
    }
    const next = {
      id: queryNewProviderModelRecordId(),
      modelId: row2.modelId,
      displayName: row2.displayName !== row2.modelId ? row2.displayName : void 0,
      category: row2.category,
      description: row2.description,
      ...row2.supportsThinking ? { supportsThinking: true } : {},
      ...row2.supportsVision ? { supportsVision: true } : {}
    };
    onChange([...records, next]);
    appMessage.success(`已登记「${row2.displayName}」到本机`);
  };
  const handleDelete = (record) => {
    Modal.confirm({
      title: `删除模型「${record.displayName || record.modelId}」？`,
      content: "仅从本机目录移除，不影响平台与本地兜底列表。",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => onChange(records.filter((item) => item.id !== record.id))
    });
  };
  const handleEditorOk = async () => {
    const values = await form2.validateFields();
    const modelId = values.modelId.trim();
    const duplicate = records.some(
      (item) => item.modelId === modelId && item.id !== editingId
    );
    if (duplicate) {
      appMessage.warning("该模型编码已存在");
      return;
    }
    const id = editingId ?? queryNewProviderModelRecordId();
    const nextRecord = queryFormToRecord(id, values);
    if (!nextRecord) return;
    if (editingId) {
      onChange(records.map((item) => item.id === editingId ? nextRecord : item));
    } else {
      onChange([...records, nextRecord]);
    }
    setEditorOpen(false);
    setEditingId(null);
  };
  const manualColumns = [
    {
      title: "编码",
      dataIndex: "modelId",
      key: "modelId",
      width: 160,
      render: (value) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$9.modelIdCell, children: value })
    },
    {
      title: "名称",
      dataIndex: "displayName",
      key: "displayName",
      ellipsis: true
    },
    {
      title: "上下文",
      dataIndex: "contextWindow",
      key: "contextWindow",
      width: 88,
      render: (value) => value?.trim() || "—"
    },
    {
      title: "规模",
      dataIndex: "size",
      key: "size",
      width: 72,
      render: (value) => value?.trim() || "—"
    },
    {
      title: "类型",
      dataIndex: "category",
      key: "category",
      width: 96
    },
    {
      title: "能力",
      key: "flags",
      width: 120,
      render: (_value, row2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$9.metaTags, children: [
        row2.supportsThinking ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: "blue", children: "思考" }) : null,
        row2.supportsVision ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: "purple", children: "视觉" }) : null,
        !row2.supportsThinking && !row2.supportsVision ? /* @__PURE__ */ jsxRuntimeExports.jsx(Text$6, { type: "secondary", children: "—" }) : null
      ] })
    },
    {
      title: "操作",
      key: "actions",
      width: 108,
      fixed: "right",
      render: (_value, row2) => row2.record ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { size: 4, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "link", size: "small", onClick: () => openEdit(row2.record), children: "编辑" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "link", size: "small", danger: true, onClick: () => handleDelete(row2.record), children: "删除" })
      ] }) : null
    }
  ];
  const readonlyColumns = [
    {
      title: "编码",
      dataIndex: "modelId",
      key: "modelId",
      width: 180,
      render: (value) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$9.modelIdCell, children: value })
    },
    {
      title: "名称",
      dataIndex: "displayName",
      key: "displayName",
      ellipsis: true
    },
    {
      title: "类型",
      dataIndex: "category",
      key: "category",
      width: 100
    },
    {
      title: "说明",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (value) => value?.trim() || "—"
    },
    {
      title: "能力",
      key: "flags",
      width: 120,
      render: (_value, row2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$9.metaTags, children: [
        row2.supportsThinking ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: "blue", children: "思考" }) : null,
        row2.supportsVision ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: "purple", children: "视觉" }) : null,
        !row2.supportsThinking && !row2.supportsVision ? /* @__PURE__ */ jsxRuntimeExports.jsx(Text$6, { type: "secondary", children: "—" }) : null
      ] })
    },
    {
      title: "操作",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_value, row2) => {
        const adopted = registeredModelIds.has(row2.modelId);
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "link",
            size: "small",
            disabled: adopted,
            onClick: () => postAdoptToManual(row2),
            children: adopted ? "已登记" : "登记"
          }
        );
      }
    }
  ];
  const queryTabLabel = (key, count, label2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$9.tabLabel, children: [
    label2,
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$9.tabCount, children: count })
  ] });
  const renderTable = (rows, columns, empty2) => {
    if (rows.length === 0) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$9.emptyBlock, children: empty2 });
    }
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$9.tableWrap, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      ForwardTable,
      {
        rowKey: "key",
        size: "small",
        virtual: true,
        pagination: false,
        scroll: { x: 640, y: tableScrollY },
        columns,
        dataSource: rows
      }
    ) });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Drawer,
      {
        title: providerLabel,
        placement: "right",
        width: Math.min(760, typeof window !== "undefined" ? window.innerWidth - 24 : 760),
        open: open && Boolean(provider),
        onClose,
        closable: true,
        closeIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$r, {}),
        destroyOnHidden: true,
        className: styles$9.drawer,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$9.lead, children: "本机登记可增删改；本地兜底为应用内置列表；平台拉取来自供应商 /models。保存设置后本机登记会与平台列表合并供下拉选用。" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Tabs,
            {
              activeKey: activeTab,
              onChange: (key) => setActiveTab(key),
              destroyInactiveTabPane: true,
              className: styles$9.tabs,
              items: [
                {
                  key: "manual",
                  label: queryTabLabel("manual", manualRows.length, "本机登记"),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$9.tabPane, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$9.paneHint, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "手动维护编码、上下文、规模与类型；点「保存设置」写入本机。" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", onClick: openCreate, children: "添加模型" })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$9.tableArea, ref: tableHostRef, children: renderTable(
                      manualRows,
                      manualColumns,
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          RefIcon$4,
                          {
                            style: { fontSize: 28, marginBottom: 8, opacity: 0.35 }
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "暂无本机登记" })
                      ] })
                    ) })
                  ] })
                },
                {
                  key: "fallback",
                  label: queryTabLabel("fallback", fallbackRows.length, "本地兜底"),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$9.tabPane, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$9.paneHint, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "应用内置静态列表，平台不可达时下拉会回退到此处。只读，可将条目登记到本机以补充元数据。" }) }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$9.tableArea, ref: tableHostRef, children: renderTable(
                      fallbackRows,
                      readonlyColumns,
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          RefIcon$9,
                          {
                            style: { fontSize: 28, marginBottom: 8, opacity: 0.35 }
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "该供应商暂无内置兜底模型" })
                      ] })
                    ) })
                  ] })
                },
                {
                  key: "platform",
                  label: queryTabLabel("platform", platformRows.length, "平台拉取"),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$9.tabPane, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$9.paneHint, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: canFetchPlatform ? "登记喜爱的模型" : "请先在供应商卡片配置完整 API Key，再拉取平台列表。" }) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$9.paneHintActions, children: [
                        platformRows.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Input$1,
                            {
                              allowClear: true,
                              prefix: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$m, {}),
                              placeholder: "检索编码、名称、类型或说明…",
                              value: platformSearch2,
                              onChange: (e) => setPlatformSearch(e.target.value),
                              className: styles$9.platformSearch
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(Text$6, { type: "secondary", className: styles$9.platformSearchMeta, children: [
                            filteredPlatformRows.length,
                            " / ",
                            platformRows.length
                          ] })
                        ] }) : null,
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$q, {}),
                            loading: platformLoading,
                            disabled: !canFetchPlatform,
                            onClick: () => setPlatformRefreshToken((n) => n + 1),
                            children: "刷新"
                          }
                        )
                      ] })
                    ] }),
                    platformError ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$9.errorBanner, children: platformError }) : null,
                    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$9.tableArea, ref: tableHostRef, children: platformLoading && platformRows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$9.emptyBlock, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, {}),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { marginTop: 10 }, children: "正在从平台拉取模型…" })
                    ] }) : renderTable(
                      filteredPlatformRows,
                      readonlyColumns,
                      platformRows.length > 0 && platformSearch2.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          RefIcon$m,
                          {
                            style: { fontSize: 28, marginBottom: 8, opacity: 0.35 }
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "无匹配模型，请调整检索关键词" })
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          RefIcon$7,
                          {
                            style: { fontSize: 28, marginBottom: 8, opacity: 0.35 }
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: canFetchPlatform ? "暂无平台模型，可点击右上角刷新" : "未配置 API Key，无法拉取" }),
                        canFetchPlatform ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            type: "link",
                            loading: platformLoading,
                            onClick: () => setPlatformRefreshToken((n) => n + 1),
                            children: "立即拉取"
                          }
                        ) : null
                      ] })
                    ) })
                  ] })
                }
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        title: editingRecord ? "编辑模型" : "添加模型",
        open: editorOpen,
        onCancel: () => {
          setEditorOpen(false);
          setEditingId(null);
        },
        onOk: () => void handleEditorOk(),
        okText: "确定",
        cancelText: "取消",
        destroyOnHidden: true,
        className: styles$9.editModal,
        width: 480,
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Form, { form: form2, layout: "vertical", className: styles$9.form, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "模型编码",
              name: "modelId",
              rules: [{ required: true, message: "请填写模型编码（API model 字段）" }],
              extra: "与请求体中的 model 参数一致，如 qwen-plus、deepseek-v4-flash",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input$1,
                {
                  prefix: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
                  placeholder: "model-id",
                  disabled: Boolean(editingRecord)
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "展示名称", name: "displayName", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input$1, { placeholder: "下拉中显示的名称，可留空" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "支持上下文", name: "contextWindow", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input$1, { placeholder: "如 128K、200000 tokens" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "规模", name: "size", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input$1, { placeholder: "如 7B、235B-A22B" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "模型类型", name: "category", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Select,
            {
              showSearch: true,
              allowClear: true,
              options: categoryOptions,
              placeholder: "选择或输入类型",
              optionFilterProp: "label"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "说明", name: "description", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input$1.TextArea, { rows: 2, placeholder: "计费、场景、限制等补充信息" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$9.switchRow, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: styles$9.switchItem, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "supportsThinking", valuePropName: "checked", noStyle: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { size: "small" }) }),
              "支持思考模式"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: styles$9.switchItem, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "supportsVision", valuePropName: "checked", noStyle: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { size: "small" }) }),
              "支持视觉输入"
            ] })
          ] })
        ] })
      }
    )
  ] });
}
function queryInitialProviderDrafts(settings) {
  const drafts = {};
  const customProviders = settings.customProviders ?? [];
  for (const option of queryAllProviderOptions(customProviders)) {
    drafts[option.value] = queryProviderCredentialsFromSettings(settings, option.value);
  }
  return drafts;
}
function queryMergeProviderDraftWithSaved(draft, saved, defaults) {
  const base = draft ?? saved;
  return {
    apiKey: base.apiKey.trim() ? base.apiKey : saved.apiKey,
    baseUrl: (base.baseUrl || saved.baseUrl || defaults.defaultBaseUrl).trim(),
    model: (base.model || saved.model || defaults.defaultModel).trim()
  };
}
function queryProviderCredentialConnectionId(provider) {
  return `cred-${provider}`;
}
function queryApplyProviderDraftsToConnections(connections, drafts, customProviders) {
  let next = connections.map((conn) => {
    const draft = drafts[conn.provider];
    if (!draft) return conn;
    const meta = queryProviderOption(conn.provider, customProviders);
    const merged = queryMergeProviderDraftWithSaved(
      draft,
      {
        apiKey: conn.apiKey,
        baseUrl: conn.baseUrl,
        model: conn.model
      },
      meta
    );
    return {
      ...conn,
      apiKey: merged.apiKey,
      baseUrl: merged.baseUrl || meta.defaultBaseUrl,
      model: merged.model || meta.defaultModel
    };
  });
  for (const option of queryAllProviderOptions(customProviders)) {
    const draft = drafts[option.value];
    if (!draft?.apiKey.trim()) continue;
    if (next.some((conn) => conn.provider === option.value)) continue;
    const merged = queryMergeProviderDraftWithSaved(
      draft,
      {
        apiKey: "",
        baseUrl: option.defaultBaseUrl,
        model: option.defaultModel
      },
      option
    );
    next = [
      ...next,
      {
        id: queryProviderCredentialConnectionId(option.value),
        label: `${option.label}（凭证）`,
        provider: option.value,
        apiKey: merged.apiKey,
        baseUrl: merged.baseUrl || option.defaultBaseUrl,
        model: merged.model || option.defaultModel,
        capabilities: ["chat"]
      }
    ];
  }
  return next;
}
function queryModelApiSavePatch(params) {
  const {
    activeProvider,
    drafts,
    settings,
    maxTurns,
    fullAccess,
    thinkingEnabled,
    customProviders
  } = params;
  const activeMeta = queryProviderOption(activeProvider, customProviders);
  const savedActive = queryProviderCredentialsFromSettings(settings, activeProvider);
  const activeDraft = queryMergeProviderDraftWithSaved(
    drafts[activeProvider],
    savedActive,
    activeMeta
  );
  const aligned = queryAlignConnectionsToActiveProvider({
    connections: settings.connections ?? [],
    activeProvider,
    activeCreds: {
      apiKey: activeDraft.apiKey,
      baseUrl: activeDraft.baseUrl,
      model: activeDraft.model
    },
    defaultConnectionId: settings.defaultConnectionId,
    catalog: params.providerModelCatalog,
    customProviders
  });
  const connections = queryApplyProviderDraftsToConnections(
    aligned.connections,
    drafts,
    customProviders
  );
  return {
    provider: activeProvider,
    apiKey: activeDraft.apiKey,
    baseUrl: activeDraft.baseUrl,
    model: aligned.model,
    maxTurns,
    fullAccess,
    thinkingEnabled,
    customProviders,
    providerModelCatalog: params.providerModelCatalog,
    connections,
    defaultConnectionId: aligned.defaultConnectionId
  };
}
const panel$3 = "_panel_1x0rd_3";
const toolbar$3 = "_toolbar_1x0rd_10";
const toolbarText$1 = "_toolbarText_1x0rd_18";
const title$3 = "_title_1x0rd_22";
const desc$1 = "_desc_1x0rd_29";
const runtimeSection = "_runtimeSection_1x0rd_35";
const runtimeHeader = "_runtimeHeader_1x0rd_42";
const runtimeGrid = "_runtimeGrid_1x0rd_46";
const runtimeCard = "_runtimeCard_1x0rd_52";
const runtimeIcon = "_runtimeIcon_1x0rd_65";
const runtimeContent = "_runtimeContent_1x0rd_78";
const runtimeTitle = "_runtimeTitle_1x0rd_86";
const runtimeDesc = "_runtimeDesc_1x0rd_92";
const runtimeControl = "_runtimeControl_1x0rd_98";
const footerHint = "_footerHint_1x0rd_102";
const manageModelsBtn = "_manageModelsBtn_1x0rd_117";
const styles$8 = {
  panel: panel$3,
  toolbar: toolbar$3,
  toolbarText: toolbarText$1,
  title: title$3,
  desc: desc$1,
  runtimeSection,
  runtimeHeader,
  runtimeGrid,
  runtimeCard,
  runtimeIcon,
  runtimeContent,
  runtimeTitle,
  runtimeDesc,
  runtimeControl,
  footerHint,
  manageModelsBtn
};
const { Text: Text$5, Title: Title$3 } = Typography;
function queryMaskApiKey(key) {
  const trimmed = key.trim();
  if (!trimmed) return "未配置";
  if (trimmed.length <= 8) return "••••••••";
  return `${trimmed.slice(0, 4)}••••${trimmed.slice(-4)}`;
}
function ModelApiPanel() {
  const settings = useSettingsStore((s) => s.settings);
  const loaded = useSettingsStore((s) => s.loaded);
  const postSettings = useSettingsStore((s) => s.postSettings);
  const [saving, setSaving] = reactExports.useState(false);
  const [addProviderOpen, setAddProviderOpen] = reactExports.useState(false);
  const [activeProvider, setActiveProvider] = reactExports.useState(settings.provider);
  const [providerDrafts, setProviderDrafts] = reactExports.useState({});
  const [maxTurns, setMaxTurns] = reactExports.useState(settings.maxTurns);
  const [fullAccess, setFullAccess] = reactExports.useState(settings.fullAccess);
  const [thinkingEnabled, setThinkingEnabled] = reactExports.useState(settings.thinkingEnabled);
  const [customProviders, setCustomProviders] = reactExports.useState(
    settings.customProviders ?? []
  );
  const [editingProvider, setEditingProvider] = reactExports.useState(null);
  const [modelsManagingProvider, setModelsManagingProvider] = reactExports.useState(null);
  const [providerModelCatalog, setProviderModelCatalog] = reactExports.useState({});
  const skipSyncRef = reactExports.useRef(false);
  const activeProviderDirtyRef = reactExports.useRef(false);
  const providerDraftsDirtyRef = reactExports.useRef(false);
  const providerOptions = reactExports.useMemo(
    () => queryAllProviderOptions(customProviders),
    [customProviders]
  );
  const generalChatConnection = reactExports.useMemo(
    () => queryGeneralChatModelConnection(settings),
    [settings]
  );
  reactExports.useEffect(() => {
    if (!loaded) return;
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      setCustomProviders(settings.customProviders ?? []);
      return;
    }
    setActiveProvider(
      (prev) => activeProviderDirtyRef.current ? prev : settings.provider
    );
    if (!providerDraftsDirtyRef.current) {
      setProviderDrafts(queryInitialProviderDrafts(settings));
    }
    setMaxTurns(settings.maxTurns);
    setFullAccess(settings.fullAccess);
    setThinkingEnabled(settings.thinkingEnabled);
    setCustomProviders(settings.customProviders ?? []);
    setProviderModelCatalog(settings.providerModelCatalog ?? {});
  }, [loaded, settings]);
  const handleSave = async () => {
    const activeDraft = providerDrafts[activeProvider];
    const activeHasKey = Boolean(activeDraft?.apiKey?.trim());
    const anyProviderHasKey = Object.values(providerDrafts).some((d) => d?.apiKey?.trim());
    if (!activeHasKey && !anyProviderHasKey) {
      appMessage.warning("请至少为一个供应商配置 API Key");
      return;
    }
    if (!activeHasKey) {
      appMessage.warning("当前选用供应商尚未配置 API Key，对话将不可用，已保存其他供应商凭证");
    }
    setSaving(true);
    try {
      await postSettings(
        queryModelApiSavePatch({
          activeProvider,
          drafts: providerDrafts,
          settings,
          maxTurns,
          fullAccess,
          thinkingEnabled,
          customProviders,
          providerModelCatalog
        })
      );
      activeProviderDirtyRef.current = false;
      providerDraftsDirtyRef.current = false;
      appMessage.success("设置已保存");
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };
  const handleAddCustomProvider = async (provider) => {
    const nextProviders = [...customProviders, provider];
    setAddProviderOpen(false);
    setCustomProviders(nextProviders);
    setProviderDrafts((prev) => ({
      ...prev,
      [provider.id]: {
        apiKey: "",
        baseUrl: provider.defaultBaseUrl,
        model: provider.defaultModel
      }
    }));
    providerDraftsDirtyRef.current = true;
    skipSyncRef.current = true;
    try {
      await postSettings({ customProviders: nextProviders });
      appMessage.success(`已添加供应商「${provider.label}」`);
    } catch {
      skipSyncRef.current = false;
      setCustomProviders(customProviders);
      appMessage.error("添加供应商失败，请重试");
    }
  };
  const handleDeleteCustomProvider = async (providerId) => {
    if (!queryIsCustomModelProvider(providerId)) return;
    const target = customProviders.find((item) => item.id === providerId);
    if (!target) return;
    const nextProviders = queryRemoveCustomProvider(customProviders, providerId);
    setCustomProviders(nextProviders);
    setProviderDrafts((prev) => {
      const next = { ...prev };
      delete next[providerId];
      return next;
    });
    if (activeProvider === providerId) {
      setActiveProvider(settings.provider === providerId ? "dashscope" : settings.provider);
    }
    const deletingSelected = activeProvider === providerId;
    if (!deletingSelected) {
      skipSyncRef.current = true;
    }
    try {
      await postSettings({ customProviders: nextProviders });
      appMessage.success(`已删除供应商「${target.label}」`);
    } catch {
      skipSyncRef.current = false;
      setCustomProviders(customProviders);
      appMessage.error("删除供应商失败，请重试");
    }
  };
  const handleConfirmDelete = (providerId, label2) => {
    Modal.confirm({
      title: `删除供应商「${label2}」？`,
      content: "多模型连接中若引用该供应商，将自动回退到默认供应商。",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => handleDeleteCustomProvider(providerId)
    });
  };
  const editingProviderMeta = providerOptions.find((item) => item.value === editingProvider);
  const modelsManagingMeta = providerOptions.find((item) => item.value === modelsManagingProvider);
  const modelsManagingRecords = modelsManagingProvider ? queryProviderModelCatalogForProvider(providerModelCatalog, modelsManagingProvider) : [];
  const editingDraft = editingProvider ? providerDrafts[editingProvider] ?? {
    apiKey: "",
    baseUrl: editingProviderMeta?.defaultBaseUrl ?? "",
    model: editingProviderMeta?.defaultModel ?? ""
  } : { apiKey: "", baseUrl: "", model: "" };
  if (!loaded) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.loading, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Text$5, { type: "secondary", children: "正在加载本机配置…" })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$8.panel, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$8.toolbar, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$8.toolbarText, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Title$3, { level: 5, className: styles$8.title, children: "模型与API" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Text$5, { type: "secondary", className: styles$8.desc, children: [
          "内置百炼 / DeepSeek / OfoxAI，也可添加自定义 OpenAI 兼容网关；Ofox 模型与",
          /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "https://ofox.io/zh/models", target: "_blank", rel: "noreferrer", children: "模型广场" }),
          "同步；点击卡片编辑凭证"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "dashed",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$s, {}),
            onClick: () => setAddProviderOpen(true),
            children: "添加供应商"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "primary",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}),
            loading: saving,
            onClick: () => void handleSave(),
            children: "保存设置"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.grid, children: providerOptions.map((option, index) => {
      const draft = providerDrafts[option.value] ?? {
        apiKey: "",
        baseUrl: option.defaultBaseUrl,
        model: option.defaultModel
      };
      const isActive = activeProvider === option.value;
      const isCustom = queryIsCustomModelProvider(option.value);
      const configured = Boolean(draft.apiKey.trim());
      const manualModelCount = queryProviderModelCatalogForProvider(
        providerModelCatalog,
        option.value
      ).length;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Card,
        {
          variant: "borderless",
          className: `${cardStyles.card} ${isActive ? cardStyles.cardActive : ""}`,
          style: { "--card-index": index },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardHead, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Text$5, { className: cardStyles.cardTitle, ellipsis: { tooltip: option.label }, children: option.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.tagRow, children: [
                  isActive ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.primaryTag, children: "当前选用" }) : null,
                  isCustom ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.mutedTag, children: "自定义" }) : null,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: configured ? cardStyles.successTag : cardStyles.neutralTag, children: configured ? "已配置" : "未配置" }),
                  manualModelCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { className: cardStyles.mutedTag, children: [
                    manualModelCount,
                    " 个登记模型"
                  ] }) : null
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardActions, children: [
                !isActive ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "设为当前选用", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "text",
                    size: "small",
                    className: cardStyles.actionBtn,
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}),
                    "aria-label": `将 ${option.label} 设为当前选用`,
                    onClick: () => {
                      activeProviderDirtyRef.current = true;
                      setActiveProvider(option.value);
                      setProviderDrafts((prev) => {
                        if (prev[option.value]?.apiKey?.trim()) return prev;
                        const saved = queryProviderCredentialsFromSettings(
                          settings,
                          option.value
                        );
                        return { ...prev, [option.value]: saved };
                      });
                    }
                  }
                ) }) : null,
                /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "编辑凭证", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "text",
                    size: "small",
                    className: cardStyles.actionBtn,
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$t, {}),
                    "aria-label": `编辑 ${option.label}`,
                    onClick: () => setEditingProvider(option.value)
                  }
                ) }),
                isCustom ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "删除供应商", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "text",
                    danger: true,
                    size: "small",
                    className: cardStyles.actionBtn,
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$u, {}),
                    "aria-label": `删除 ${option.label}`,
                    onClick: () => handleConfirmDelete(option.value, option.label)
                  }
                ) }) : null
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardBody, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.metaRow, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Text$5, { type: "secondary", className: cardStyles.metaLabel, children: "API Key" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Text$5,
                  {
                    className: `${cardStyles.metaValue} ${!configured ? cardStyles.metaValueMuted : ""}`,
                    ellipsis: { tooltip: configured ? queryMaskApiKey(draft.apiKey) : "未配置" },
                    children: queryMaskApiKey(draft.apiKey)
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.metaRow, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Text$5, { type: "secondary", className: cardStyles.metaLabel, children: "Base URL" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Text$5,
                  {
                    className: cardStyles.metaValue,
                    ellipsis: { tooltip: draft.baseUrl || option.defaultBaseUrl },
                    children: draft.baseUrl || option.defaultBaseUrl
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.metaRow, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Text$5, { type: "secondary", className: cardStyles.metaLabel, children: isActive && generalChatConnection.provider === option.value ? "对话模型" : "默认模型" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Text$5,
                  {
                    className: cardStyles.metaValue,
                    ellipsis: {
                      tooltip: isActive && generalChatConnection.provider === option.value ? generalChatConnection.model : draft.model || option.defaultModel
                    },
                    children: isActive && generalChatConnection.provider === option.value ? generalChatConnection.model || draft.model || option.defaultModel : draft.model || option.defaultModel
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardFooter, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Text$5, { type: "secondary", className: cardStyles.footerHint, children: "平台列表 + 本机登记合并展示" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "link",
                  size: "small",
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
                  className: styles$8.manageModelsBtn,
                  onClick: () => setModelsManagingProvider(option.value),
                  children: "管理模型"
                }
              )
            ] })
          ]
        },
        option.value
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$8.runtimeSection, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$8.runtimeHeader, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Title$3, { level: 5, className: styles$8.title, children: "运行参数" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text$5, { type: "secondary", className: styles$8.desc, children: "Agent 全局行为偏好，与具体供应商无关" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$8.runtimeGrid, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { variant: "borderless", className: styles$8.runtimeCard, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$8.runtimeIcon, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$v, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$8.runtimeContent, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$8.runtimeTitle, children: "最大工具轮次" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text$5, { type: "secondary", className: styles$8.runtimeDesc, children: "单次任务允许 Agent 连续调用工具的上限" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$8.runtimeControl, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            TypedInputNumber,
            {
              min: 5,
              max: 100,
              value: maxTurns,
              onChange: (v) => setMaxTurns(Number(v) || 40)
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { variant: "borderless", className: styles$8.runtimeCard, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$8.runtimeIcon, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$w, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$8.runtimeContent, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$8.runtimeTitle, children: "完全访问" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text$5, { type: "secondary", className: styles$8.runtimeDesc, children: "跳过敏感确认与方案选择；自动发布/流程连续执行（确认节点、扫码、渲染除外）" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$8.runtimeControl, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: fullAccess, onChange: setFullAccess }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { variant: "borderless", className: styles$8.runtimeCard, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$8.runtimeIcon, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$x, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$8.runtimeContent, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$8.runtimeTitle, children: "思考模式" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text$5, { type: "secondary", className: styles$8.runtimeDesc, children: "允许部分模型输出 thinking / reasoning 过程（DeepSeek 可能影响多轮工具调用）" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$8.runtimeControl, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: thinkingEnabled, onChange: setThinkingEnabled }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$8.footerHint, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "新设置将在下一条 Agent 消息中生效" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditProviderCredentialsModal,
      {
        open: Boolean(editingProvider),
        provider: editingProvider,
        providerLabel: editingProviderMeta?.label ?? "",
        initialValues: editingDraft,
        customProviders,
        providerModelCatalog,
        onCancel: () => setEditingProvider(null),
        onSubmit: (values) => {
          if (!editingProvider) return;
          providerDraftsDirtyRef.current = true;
          setProviderDrafts((prev) => ({
            ...prev,
            [editingProvider]: values
          }));
          setEditingProvider(null);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddModelProviderModal,
      {
        open: addProviderOpen,
        onCancel: () => setAddProviderOpen(false),
        onSubmit: handleAddCustomProvider
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      ProviderModelsMaintenanceDrawer,
      {
        open: Boolean(modelsManagingProvider),
        provider: modelsManagingProvider,
        providerLabel: modelsManagingMeta?.label ?? "",
        records: modelsManagingRecords,
        apiKey: modelsManagingProvider ? providerDrafts[modelsManagingProvider]?.apiKey ?? "" : "",
        baseUrl: modelsManagingProvider ? providerDrafts[modelsManagingProvider]?.baseUrl || modelsManagingMeta?.defaultBaseUrl || "" : "",
        customProviders,
        onClose: () => setModelsManagingProvider(null),
        onChange: (nextRecords) => {
          if (!modelsManagingProvider) return;
          setProviderModelCatalog((prev) => {
            const next = { ...prev };
            if (nextRecords.length === 0) {
              delete next[modelsManagingProvider];
            } else {
              next[modelsManagingProvider] = nextRecords;
            }
            return next;
          });
        }
      }
    )
  ] });
}
const BUILTIN_ROLE_TASK_IDS = [
  "general",
  "researcher",
  "writer",
  "publisher",
  "scriptwriter",
  "videographer",
  "editor",
  "script",
  "storyboard",
  "video"
];
const BUILTIN_ROLE_TASK_SET = new Set(BUILTIN_ROLE_TASK_IDS);
function queryIsBuiltinRoleTask(roleId) {
  return BUILTIN_ROLE_TASK_SET.has(roleId);
}
const CUSTOM_AGENT_ROLE_PREFIX = "custom_";
function queryIsCustomAgentRoleId(roleId) {
  return roleId.startsWith(CUSTOM_AGENT_ROLE_PREFIX);
}
function queryPostCustomAgentRoleId(label2, existingIds) {
  const used = new Set(existingIds);
  const base = label2.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32);
  const stem = base || "role";
  let candidate = `${CUSTOM_AGENT_ROLE_PREFIX}${stem}`;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${CUSTOM_AGENT_ROLE_PREFIX}${stem}_${n}`;
    n += 1;
  }
  return candidate;
}
function queryRoleTaskCardMetaList(settings) {
  const builtin = [
    {
      value: "general",
      label: "通用助手",
      description: "闲聊、问答、单步工具与通用任务编排",
      builtin: true
    },
    {
      value: "researcher",
      label: "调研员",
      description: "热点调研、素材收集与配图路径汇总",
      builtin: true
    },
    {
      value: "writer",
      label: "撰稿人",
      description: "基于调研结果撰写标题、正文与话题标签",
      builtin: true
    },
    {
      value: "publisher",
      label: "发布员",
      description: "按成稿与配图完成小红书 / 抖音渠道发布",
      builtin: true
    },
    {
      value: "scriptwriter",
      label: "编剧",
      description: "创意脚本、分镜拆分与提示词精细化",
      builtin: true
    },
    {
      value: "videographer",
      label: "视频制作",
      description: "场景素材生成、T2I / I2V 渲染与校验",
      builtin: true
    },
    {
      value: "editor",
      label: "剪辑师",
      description: "音画对齐、粗剪拼接与成片导出",
      builtin: true
    },
    {
      value: "script",
      label: "剧本任务",
      description: "独立剧本生成任务使用的模型连接",
      builtin: true
    },
    {
      value: "storyboard",
      label: "分镜任务",
      description: "独立分镜生成任务使用的模型连接",
      builtin: true
    },
    {
      value: "video",
      label: "视频任务",
      description: "独立视频生成任务使用的模型连接",
      builtin: true
    }
  ];
  const custom = (settings.customAgentRoles ?? []).map((r) => ({
    value: r.id,
    label: r.label,
    description: r.description || "用户自定义聊天角色",
    builtin: false
  }));
  return [...builtin, ...custom];
}
async function queryAgentToolsCatalog() {
  return window.api.queryAgentToolsCatalog();
}
async function queryAgentAssets(options) {
  return window.api.queryAgentAssets(options);
}
async function postDeleteAgentAsset(filePath) {
  return window.api.postDeleteAgentAsset(filePath);
}
async function postDeleteAgentAssets(filePaths) {
  if (typeof window.api.postDeleteAgentAssets === "function") {
    return window.api.postDeleteAgentAssets(filePaths);
  }
  let deletedCount = 0;
  for (const filePath of filePaths) {
    const result = await window.api.postDeleteAgentAsset(filePath);
    deletedCount += result.deletedCount;
  }
  return { ok: true, deletedCount };
}
async function postClearAgentAssets() {
  return window.api.postClearAgentAssets();
}
async function queryAgentAssetTextPreview(filePath) {
  return window.api.queryAgentAssetTextPreview(filePath);
}
const modal$2 = "_modal_rl064_1";
const lead$2 = "_lead_rl064_5";
const form$2 = "_form_rl064_12";
const styles$7 = {
  modal: modal$2,
  lead: lead$2,
  form: form$2
};
const { TextArea: TextArea$1 } = Input$1;
function AddCustomRoleModal({
  open,
  onCancel,
  onSubmit
}) {
  const [form2] = Form.useForm();
  reactExports.useEffect(() => {
    if (!open) return;
    form2.setFieldsValue({
      label: "",
      description: "",
      systemPrompt: ""
    });
  }, [open, form2]);
  const handleOk = async () => {
    const values = await form2.validateFields();
    onSubmit({
      label: values.label.trim(),
      description: values.description.trim(),
      systemPrompt: values.systemPrompt.trim(),
      toolWhitelist: null
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Modal,
    {
      title: "添加自定义角色",
      open,
      onCancel,
      onOk: () => void handleOk(),
      okText: "创建",
      cancelText: "取消",
      destroyOnHidden: true,
      className: styles$7.modal,
      width: 560,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$7.lead, children: "自定义角色会出现在角色卡片列表中，可由 Supervisor 路由直达（单步执行后结束）。内置角色不可删除。" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Form, { form: form2, layout: "vertical", className: styles$7.form, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "角色名称",
              name: "label",
              rules: [{ required: true, message: "请填写角色名称" }],
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input$1, { placeholder: "如：法务顾问、数据分析师", maxLength: 40, showCount: true })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "卡片摘要", name: "description", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input$1, { placeholder: "在设置卡片上展示的简短说明", maxLength: 120, showCount: true }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "角色系统说明",
              name: "systemPrompt",
              rules: [{ required: true, message: "请填写角色职责与输出要求" }],
              extra: "Markdown；会追加在通用能力基座之后，作为该角色的核心指令。",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextArea$1,
                {
                  rows: 8,
                  placeholder: "描述该角色负责什么、禁止什么、输出格式等…",
                  maxLength: 8e3,
                  showCount: true
                }
              )
            }
          )
        ] })
      ]
    }
  );
}
function useConnectionProviderModels(connections, enabled = true, customProviders = []) {
  const [modelsByKey, setModelsByKey] = reactExports.useState({});
  const [loadingKeys, setLoadingKeys] = reactExports.useState({});
  const [errorsByKey, setErrorsByKey] = reactExports.useState({});
  const credentialsSignature = reactExports.useMemo(
    () => connections.map(
      (c) => `${c.id}:${c.provider}:${c.baseUrl}:${c.apiKey.trim() ? "1" : "0"}:${c.apiKey}`
    ).join("|"),
    [connections]
  );
  reactExports.useEffect(() => {
    if (!enabled) return;
    const unique = /* @__PURE__ */ new Map();
    for (const conn of connections) {
      const trimmedKey = conn.apiKey.trim();
      if (!queryCanFetchProviderModels(trimmedKey)) continue;
      const cacheKey = queryProviderModelsCacheKey(conn);
      if (!unique.has(cacheKey)) unique.set(cacheKey, conn);
    }
    const activeKeys = new Set(unique.keys());
    setModelsByKey((prev) => {
      const next = {};
      for (const key of Array.from(activeKeys)) {
        if (key in prev) next[key] = prev[key];
      }
      return next;
    });
    setErrorsByKey((prev) => {
      const next = {};
      for (const key of Array.from(activeKeys)) {
        if (key in prev) next[key] = prev[key];
      }
      return next;
    });
    const controllers = [];
    for (const [cacheKey, conn] of Array.from(unique.entries())) {
      let cancelled = false;
      setLoadingKeys((prev) => ({ ...prev, [cacheKey]: true }));
      setErrorsByKey((prev) => ({ ...prev, [cacheKey]: null }));
      const timer = window.setTimeout(() => {
        void queryProviderModelsFromApi({
          provider: conn.provider,
          apiKey: conn.apiKey,
          baseUrl: conn.baseUrl,
          customProviders
        }).then((result) => {
          if (cancelled) return;
          if (result.fetchError) {
            setModelsByKey((prev) => ({ ...prev, [cacheKey]: null }));
            setErrorsByKey((prev) => ({
              ...prev,
              [cacheKey]: `${result.fetchError}；当前显示本地兜底`
            }));
            return;
          }
          setModelsByKey((prev) => ({
            ...prev,
            [cacheKey]: result.models.length > 0 ? result.models : null
          }));
          setErrorsByKey((prev) => ({
            ...prev,
            [cacheKey]: result.models.length > 0 ? null : "平台返回空列表，已使用本地兜底"
          }));
        }).catch((err) => {
          if (cancelled) return;
          setModelsByKey((prev) => ({ ...prev, [cacheKey]: null }));
          setErrorsByKey((prev) => ({
            ...prev,
            [cacheKey]: queryFriendlyIpcErrorMessage(err) || "拉取模型列表失败"
          }));
        }).finally(() => {
          if (!cancelled) {
            setLoadingKeys((prev) => ({ ...prev, [cacheKey]: false }));
          }
        });
      }, PROVIDER_MODELS_DEBOUNCE_MS);
      controllers.push(() => {
        cancelled = true;
        window.clearTimeout(timer);
      });
    }
    return () => {
      for (const cancel of controllers) cancel();
    };
  }, [enabled, credentialsSignature, connections, customProviders]);
  const queryRemoteModels = (conn) => {
    if (!queryCanFetchProviderModels(conn.apiKey)) return void 0;
    return modelsByKey[queryProviderModelsCacheKey(conn)];
  };
  const queryIsLoading = (conn) => {
    if (!queryCanFetchProviderModels(conn.apiKey)) return false;
    return Boolean(loadingKeys[queryProviderModelsCacheKey(conn)]);
  };
  const queryModelHint = (conn) => {
    const cacheKey = queryProviderModelsCacheKey(conn);
    const remote = modelsByKey[cacheKey];
    return queryConnectionModelsStatusHint({
      apiKey: conn.apiKey,
      loading: Boolean(loadingKeys[cacheKey]),
      remoteCount: Array.isArray(remote) ? remote.length : null,
      error: errorsByKey[cacheKey] ?? null
    });
  };
  return {
    modelsByKey,
    loadingKeys,
    errorsByKey,
    queryModelHint,
    queryRemoteModels,
    queryIsLoading
  };
}
const CAPABILITY_OPTIONS = [
  { value: "chat", label: "对话" },
  { value: "reasoning", label: "推理" },
  { value: "vision", label: "视觉" },
  { value: "longContext", label: "长上下文" },
  { value: "creative", label: "文生图/图生视频" }
];
queryRoleTaskCardMetaList({ customAgentRoles: [] }).map(
  ({ value, label: label2, description }) => ({ value, label: label2, description })
);
function queryCapabilityLabel(cap) {
  return CAPABILITY_OPTIONS.find((item) => item.value === cap)?.label ?? cap;
}
function queryRolePromptPlaceholder(role) {
  return DEFAULT_ROLE_PROMPT_OVERRIDES[role] ?? "追加角色语气、输出格式或业务偏好；留空则仅使用系统内置说明。";
}
function queryNewConnectionId() {
  return `conn-${Date.now().toString(36)}`;
}
const modal$1 = "_modal_6s3a4_1";
const lead$1 = "_lead_6s3a4_17";
const form$1 = "_form_6s3a4_24";
const modelHint = "_modelHint_6s3a4_40";
const styles$6 = {
  modal: modal$1,
  lead: lead$1,
  form: form$1,
  modelHint
};
const { Text: Text$4 } = Typography;
function querySelectOptions(models, currentModel, provider) {
  const options = models.map((m) => ({
    value: m.value,
    label: queryModelOptionDisplayLabel(m)
  }));
  if (currentModel && !models.some((m) => m.value === currentModel)) {
    options.unshift({
      value: currentModel,
      label: queryModelOptionDisplayLabel({
        value: currentModel,
        label: currentModel
      })
    });
  }
  return options;
}
function EditModelConnectionModal({
  open,
  connection,
  settings,
  onCancel,
  onSubmit
}) {
  const [form2] = Form.useForm();
  const watchedProvider = Form.useWatch("provider", form2);
  const watchedModel = Form.useWatch("model", form2);
  const draftConnection = reactExports.useMemo(() => {
    if (!connection) return null;
    const provider = watchedProvider ?? connection.provider;
    const creds = queryProviderCredentialsFromSettings(settings, provider);
    return {
      ...connection,
      provider,
      model: String(watchedModel ?? connection.model),
      apiKey: connection.provider === provider ? connection.apiKey : creds.apiKey,
      baseUrl: connection.provider === provider ? connection.baseUrl : creds.baseUrl
    };
  }, [connection, settings, watchedModel, watchedProvider]);
  const draftList = reactExports.useMemo(
    () => draftConnection ? [draftConnection] : [],
    [draftConnection]
  );
  const { queryRemoteModels, queryIsLoading, queryModelHint } = useConnectionProviderModels(
    draftList,
    open && Boolean(draftConnection),
    settings.customProviders ?? []
  );
  const providerOptions = reactExports.useMemo(
    () => queryAllProviderOptions(settings.customProviders ?? []).map((option) => ({
      value: option.value,
      label: option.label
    })),
    [settings.customProviders]
  );
  reactExports.useEffect(() => {
    if (!open || !connection) return;
    form2.setFieldsValue({
      label: connection.label,
      provider: connection.provider,
      model: connection.model,
      capabilities: connection.capabilities
    });
  }, [open, connection, form2]);
  const handleOk = async () => {
    if (!connection) return;
    const values = await form2.validateFields();
    const provider = values.provider;
    const creds = queryProviderCredentialsFromSettings(settings, provider);
    onSubmit({
      ...connection,
      label: values.label.trim() || connection.label,
      provider,
      model: values.model,
      capabilities: values.capabilities,
      apiKey: connection.provider === provider ? connection.apiKey : creds.apiKey,
      baseUrl: connection.provider === provider ? connection.baseUrl : creds.baseUrl
    });
  };
  const remote = draftConnection ? queryRemoteModels(draftConnection) : void 0;
  const modelOptions = draftConnection ? querySelectOptions(
    queryResolvedModelOptionsForProvider(
      draftConnection.provider,
      settings.providerModelCatalog,
      Array.isArray(remote) ? remote : null
    ),
    draftConnection.model,
    draftConnection.provider
  ) : [];
  const modelsLoading = draftConnection ? queryIsLoading(draftConnection) : false;
  const modelHint2 = draftConnection ? queryModelHint(draftConnection) : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Modal,
    {
      title: connection ? `编辑连接 · ${connection.label}` : "编辑连接",
      open,
      onCancel,
      onOk: () => void handleOk(),
      okText: "保存",
      cancelText: "取消",
      destroyOnHidden: true,
      className: styles$6.modal,
      width: 520,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$6.lead, children: "连接凭证继承自「模型与 API」中对应供应商的配置；此处维护名称、模型与能力标签。" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Form, { form: form2, layout: "vertical", className: styles$6.form, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "连接名称",
              name: "label",
              rules: [{ required: true, message: "请填写连接名称" }],
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input$1, { placeholder: "如：百炼 Qwen Plus", maxLength: 48 })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "供应商",
              name: "provider",
              rules: [{ required: true, message: "请选择供应商" }],
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Select,
                {
                  options: providerOptions,
                  onChange: (provider) => {
                    const creds = queryProviderCredentialsFromSettings(settings, provider);
                    form2.setFieldValue("model", creds.model);
                  }
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Form.Item,
            {
              label: "模型",
              name: "model",
              rules: [{ required: true, message: "请选择或填写模型" }],
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Select,
                  {
                    showSearch: true,
                    optionFilterProp: "label",
                    options: modelOptions,
                    loading: modelsLoading,
                    placeholder: draftConnection?.apiKey.trim() ? "从平台选择模型" : "请先在「模型与 API」中配置 API Key"
                  }
                ),
                modelHint2 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Text$4, { type: "secondary", className: styles$6.modelHint, children: modelHint2 }) : null
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "能力标签", name: "capabilities", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Select, { mode: "multiple", options: CAPABILITY_OPTIONS }) })
        ] })
      ]
    }
  );
}
const modal = "_modal_1blyv_1";
const lead = "_lead_1blyv_17";
const form = "_form_1blyv_37";
const promptArea = "_promptArea_1blyv_53";
const toolsHeader = "_toolsHeader_1blyv_58";
const toolsTitle = "_toolsTitle_1blyv_65";
const customHint = "_customHint_1blyv_71";
const toolsAlert = "_toolsAlert_1blyv_77";
const footer = "_footer_1blyv_81";
const styles$5 = {
  modal,
  lead,
  form,
  promptArea,
  toolsHeader,
  toolsTitle,
  customHint,
  toolsAlert,
  footer
};
const { TextArea } = Input$1;
function querySameToolList(a, b) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((name, i) => name === sb[i]);
}
function EditRoleTaskModal({
  open,
  role,
  roleLabel: roleLabel2,
  roleDescription,
  connectionId,
  promptOverride,
  promptPlaceholder,
  toolWhitelist = null,
  defaultToolWhitelist = null,
  toolWhitelistCustomized = false,
  customSystemPrompt,
  skillIds = [],
  skillOptions = [],
  connections,
  canDeleteRole = false,
  onCancel,
  onSubmit,
  onDelete
}) {
  const [form2] = Form.useForm();
  const [toolOptions, setToolOptions] = reactExports.useState([]);
  const [toolsLoading, setToolsLoading] = reactExports.useState(false);
  const canEditTools = Boolean(role && queryIsChatPipelineRole(role));
  const toolInjectAll = Form.useWatch("toolInjectAll", form2);
  const watchedToolNames = Form.useWatch("toolNames", form2);
  reactExports.useEffect(() => {
    if (!open || !role) return;
    form2.setFieldsValue({
      connectionId,
      promptOverride: promptOverride ?? "",
      customSystemPrompt: customSystemPrompt ?? "",
      toolInjectAll: canEditTools ? toolWhitelist === null : false,
      toolNames: canEditTools && Array.isArray(toolWhitelist) ? [...toolWhitelist] : [],
      skillIds: canEditTools ? [...skillIds] : []
    });
  }, [
    open,
    role,
    connectionId,
    promptOverride,
    customSystemPrompt,
    toolWhitelist,
    skillIds,
    canEditTools,
    form2
  ]);
  reactExports.useEffect(() => {
    if (!open || !canEditTools) return;
    let cancelled = false;
    setToolsLoading(true);
    void queryAgentToolsCatalog().then((catalog) => {
      if (cancelled) return;
      setToolOptions(
        catalog.tools.map((t) => ({
          value: t.name,
          label: `${queryToolLabel(t.name)}（${t.name}）`
        }))
      );
    }).catch(() => {
      if (!cancelled) setToolOptions([]);
    }).finally(() => {
      if (!cancelled) setToolsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, canEditTools]);
  const mergedToolOptions = reactExports.useMemo(() => {
    const names = watchedToolNames ?? [];
    const known = new Set(toolOptions.map((o) => o.value));
    const extras = names.filter((n) => n && !known.has(n)).map((n) => ({ value: n, label: n }));
    return extras.length ? [...toolOptions, ...extras] : toolOptions;
  }, [toolOptions, watchedToolNames]);
  const handleOk = async () => {
    const values = await form2.validateFields();
    let nextTools;
    if (canEditTools) {
      const resolved = values.toolInjectAll ? null : (values.toolNames ?? []).map((n) => String(n).trim()).filter(Boolean);
      nextTools = querySameToolList(resolved, defaultToolWhitelist) ? "default" : resolved;
    }
    onSubmit({
      connectionId: values.connectionId,
      promptOverride: values.promptOverride.trim(),
      toolWhitelist: nextTools,
      skillIds: canEditTools ? Array.from(
        new Set((values.skillIds ?? []).map((id) => String(id).trim()).filter(Boolean))
      ) : void 0,
      customSystemPrompt: canDeleteRole ? String(values.customSystemPrompt ?? "").trim() : void 0
    });
  };
  const handleRestoreDefault = () => {
    if (!canEditTools) return;
    form2.setFieldsValue({
      toolInjectAll: defaultToolWhitelist === null,
      toolNames: Array.isArray(defaultToolWhitelist) ? [...defaultToolWhitelist] : []
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Modal,
    {
      title: `编辑角色 · ${roleLabel2}`,
      open,
      onCancel,
      onOk: () => void handleOk(),
      okText: "保存",
      cancelText: "取消",
      destroyOnHidden: true,
      className: styles$5.modal,
      width: 600,
      footer: (_, { OkBtn, CancelBtn }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$5.footer, children: [
        canDeleteRole && onDelete ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { danger: true, type: "text", onClick: onDelete, children: "删除角色" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CancelBtn, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(OkBtn, {})
        ] })
      ] }),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles$5.lead, children: roleDescription }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Form, { form: form2, layout: "vertical", className: styles$5.form, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "模型连接",
              name: "connectionId",
              extra: "留空则使用默认连接；Supervisor 路由到此角色后按此连接调用模型。",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Select,
                {
                  allowClear: true,
                  placeholder: "使用默认连接",
                  options: connections.map((c) => ({ value: c.id, label: c.label }))
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "角色设定补充",
              name: "promptOverride",
              extra: "追加到内置角色说明之后，用于约束语气、输出格式或业务偏好；清空并保存可关闭该角色的补充设定。",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                TextArea,
                {
                  className: styles$5.promptArea,
                  rows: 4,
                  placeholder: promptPlaceholder ?? "追加角色语气、输出格式或业务偏好；留空则仅使用系统内置说明。",
                  maxLength: 4e3,
                  showCount: true
                }
              )
            }
          ),
          canDeleteRole ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "角色系统说明",
              name: "customSystemPrompt",
              rules: [{ required: true, message: "请填写角色系统说明" }],
              extra: "自定义角色的核心指令（Markdown），保存后写入角色定义。",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { className: styles$5.promptArea, rows: 6, maxLength: 8e3, showCount: true })
            }
          ) : null,
          canEditTools ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$5.toolsHeader, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$5.toolsTitle, children: "工具注入" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { size: 8, children: [
                toolWhitelistCustomized ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$5.customHint, children: "已自定义" }) : null,
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "link", size: "small", onClick: handleRestoreDefault, children: "恢复默认" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Alert,
              {
                type: "info",
                showIcon: true,
                className: styles$5.toolsAlert,
                message: "仅影响聊天多角色管线。关闭「全量」且名单为空时，该角色将无法调用任何工具。"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                label: "注入全部已注册工具",
                name: "toolInjectAll",
                valuePropName: "checked",
                extra: "开启后与 general 默认行为一致，忽略下方名单。",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, {})
              }
            ),
            toolInjectAll ? null : /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                label: "工具白名单",
                name: "toolNames",
                extra: toolInjectAll ? "当前为全量注入，名单仅作参考；关闭上方开关后生效。" : "勾选该角色可调用的工具；保存后随「保存连接」写入本机。",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Select,
                  {
                    mode: "multiple",
                    allowClear: true,
                    showSearch: true,
                    loading: toolsLoading,
                    disabled: Boolean(toolInjectAll),
                    placeholder: "选择工具",
                    options: mergedToolOptions,
                    optionFilterProp: "label",
                    maxTagCount: "responsive"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Form.Item,
              {
                label: "关联技能",
                name: "skillIds",
                extra: "选用该角色时注入这些自定义技能（与会话「学习技能」、自定义全局注入取并集）。内置技能始终全局注入。",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Select,
                  {
                    mode: "multiple",
                    allowClear: true,
                    showSearch: true,
                    placeholder: skillOptions.length ? "选择自定义技能" : "暂无自定义技能",
                    disabled: skillOptions.length === 0,
                    options: skillOptions,
                    optionFilterProp: "label",
                    maxTagCount: "responsive"
                  }
                )
              }
            )
          ] }) : null
        ] })
      ]
    }
  );
}
const panel$2 = "_panel_i4dfv_3";
const toolbar$2 = "_toolbar_i4dfv_10";
const toolbarText = "_toolbarText_i4dfv_18";
const title$2 = "_title_i4dfv_22";
const desc = "_desc_i4dfv_29";
const capabilityRow = "_capabilityRow_i4dfv_35";
const capTag = "_capTag_i4dfv_44";
const roleSection = "_roleSection_i4dfv_55";
const roleHeader = "_roleHeader_i4dfv_59";
const roleGrid = "_roleGrid_i4dfv_67";
const roleCard = "_roleCard_i4dfv_73";
const roleCardHead = "_roleCardHead_i4dfv_103";
const roleLabel = "_roleLabel_i4dfv_111";
const roleEditIcon = "_roleEditIcon_i4dfv_117";
const roleDesc = "_roleDesc_i4dfv_128";
const roleMeta = "_roleMeta_i4dfv_137";
const roleMetaIcon = "_roleMetaIcon_i4dfv_144";
const roleConnection = "_roleConnection_i4dfv_150";
const roleToolMeta = "_roleToolMeta_i4dfv_156";
const roleTags = "_roleTags_i4dfv_162";
const customPromptTag = "_customPromptTag_i4dfv_169";
const styles$4 = {
  panel: panel$2,
  toolbar: toolbar$2,
  toolbarText,
  title: title$2,
  desc,
  capabilityRow,
  capTag,
  roleSection,
  roleHeader,
  roleGrid,
  roleCard,
  roleCardHead,
  roleLabel,
  roleEditIcon,
  roleDesc,
  roleMeta,
  roleMetaIcon,
  roleConnection,
  roleToolMeta,
  roleTags,
  customPromptTag
};
const { Text: Text$3, Title: Title$2 } = Typography;
const { confirm } = Modal;
function ModelConnectionsPanel() {
  const settings = useSettingsStore((s) => s.settings);
  const postSettings = useSettingsStore((s) => s.postSettings);
  const [saving, setSaving] = reactExports.useState(false);
  const [connections, setConnections] = reactExports.useState(
    querySyncConnectionsProviderCredentials(
      settings.connections?.length ? settings.connections : [{ ...DEFAULT_CONNECTION }],
      settings
    )
  );
  const [defaultConnectionId, setDefaultConnectionId] = reactExports.useState(
    settings.defaultConnectionId || connections[0]?.id
  );
  const [roleModelMap, setRoleModelMap] = reactExports.useState(
    settings.roleModelMap ?? {}
  );
  const [rolePromptOverrides, setRolePromptOverrides] = reactExports.useState(
    settings.rolePromptOverrides ?? {}
  );
  const [roleToolWhitelistOverrides, setRoleToolWhitelistOverrides] = reactExports.useState(settings.roleToolWhitelistOverrides ?? {});
  const [roleSkillIds, setRoleSkillIds] = reactExports.useState(settings.roleSkillIds ?? {});
  const [customAgentRoles, setCustomAgentRoles] = reactExports.useState(
    settings.customAgentRoles ?? []
  );
  const [roleInjections, setRoleInjections] = reactExports.useState([]);
  const [editingConnection, setEditingConnection] = reactExports.useState(null);
  const [editingRole, setEditingRole] = reactExports.useState(null);
  const [addingRole, setAddingRole] = reactExports.useState(false);
  const skills = useSkillsStore((s) => s.skills);
  const hydrateSkills = useSkillsStore((s) => s.hydrate);
  const customSkillOptions = reactExports.useMemo(
    () => skills.filter((s) => !s.isBuiltin).map((s) => ({ value: s.id, label: s.name })),
    [skills]
  );
  reactExports.useEffect(() => {
    void hydrateSkills();
  }, [hydrateSkills]);
  const providerLabelById = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const option of queryAllProviderOptions(settings.customProviders ?? [])) {
      map.set(option.value, option.label);
    }
    return map;
  }, [settings.customProviders]);
  const injectionByRole = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const row2 of roleInjections) map.set(row2.role, row2);
    return map;
  }, [roleInjections]);
  reactExports.useEffect(() => {
    setConnections(
      querySyncConnectionsProviderCredentials(
        settings.connections?.length ? settings.connections : [{ ...DEFAULT_CONNECTION }],
        settings
      )
    );
    setDefaultConnectionId(settings.defaultConnectionId);
    setRoleModelMap(settings.roleModelMap ?? {});
    setRolePromptOverrides(settings.rolePromptOverrides ?? {});
    setRoleToolWhitelistOverrides(settings.roleToolWhitelistOverrides ?? {});
    setRoleSkillIds(settings.roleSkillIds ?? {});
    setCustomAgentRoles(settings.customAgentRoles ?? []);
  }, [
    settings.connections,
    settings.defaultConnectionId,
    settings.roleModelMap,
    settings.rolePromptOverrides,
    settings.roleToolWhitelistOverrides,
    settings.roleSkillIds,
    settings.customAgentRoles,
    settings.apiKey,
    settings.provider,
    settings.baseUrl,
    settings.model,
    settings.customProviders
  ]);
  reactExports.useEffect(() => {
    let cancelled = false;
    void queryAgentToolsCatalog().then((catalog) => {
      if (!cancelled) setRoleInjections(catalog.roleInjections);
    }).catch(() => {
      if (!cancelled) setRoleInjections([]);
    });
    return () => {
      cancelled = true;
    };
  }, [settings.roleToolWhitelistOverrides, settings.customAgentRoles]);
  const roleTaskCards = reactExports.useMemo(
    () => queryRoleTaskCardMetaList({ customAgentRoles }),
    [customAgentRoles]
  );
  const handleSave = async () => {
    if (connections.length === 0) {
      appMessage.warning("至少保留一条模型连接");
      return;
    }
    setSaving(true);
    try {
      await postSettings({
        connections,
        defaultConnectionId: defaultConnectionId || connections[0].id,
        roleModelMap,
        rolePromptOverrides,
        roleToolWhitelistOverrides,
        roleSkillIds,
        customAgentRoles
      });
      appMessage.success("模型连接已保存");
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };
  const queryConnectionLabel = (id) => {
    if (!id) return "默认连接";
    return connections.find((c) => c.id === id)?.label ?? "默认连接";
  };
  const queryRoleToolSummary = (role) => {
    if (!queryIsChatPipelineRole(role)) return "";
    const customized = Object.prototype.hasOwnProperty.call(roleToolWhitelistOverrides, role);
    const override = roleToolWhitelistOverrides[role];
    if (customized) {
      if (override === null) return "工具：全量（已自定义）";
      return `工具：${override?.length ?? 0} 项（已自定义）`;
    }
    const inj = injectionByRole.get(role);
    if (!inj) return "工具：默认";
    if (inj.mode === "all") return "工具：全量（默认）";
    return `工具：${inj.toolNames.length} 项（默认）`;
  };
  const editingRoleMeta = roleTaskCards.find((item) => item.value === editingRole);
  const editingInjection = editingRole ? injectionByRole.get(editingRole) : void 0;
  const editingCustomRole = editingRole ? customAgentRoles.find((r) => r.id === editingRole) : void 0;
  const handleDeleteEditingRole = () => {
    if (!editingRole || queryIsBuiltinRoleTask(editingRole)) return;
    const label2 = editingRoleMeta?.label ?? editingRole;
    confirm({
      title: `删除角色「${label2}」？`,
      content: "将移除该自定义角色及其模型映射、工具注入配置。内置角色不可删除。",
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: () => {
        const roleId = editingRole;
        setCustomAgentRoles((prev) => prev.filter((r) => r.id !== roleId));
        setRoleModelMap((prev) => {
          const next = { ...prev };
          delete next[roleId];
          return next;
        });
        setRolePromptOverrides((prev) => {
          const next = { ...prev };
          delete next[roleId];
          return next;
        });
        setRoleToolWhitelistOverrides((prev) => {
          const next = { ...prev };
          delete next[roleId];
          return next;
        });
        setRoleSkillIds((prev) => {
          const next = { ...prev };
          delete next[roleId];
          return next;
        });
        setEditingRole(null);
        appMessage.success("已删除角色（请点击「保存连接」落盘）");
      }
    });
  };
  const queryEditingEffectiveTools = () => {
    if (!editingRole || !queryIsChatPipelineRole(editingRole)) return void 0;
    if (Object.prototype.hasOwnProperty.call(roleToolWhitelistOverrides, editingRole)) {
      return roleToolWhitelistOverrides[editingRole] ?? null;
    }
    if (!editingInjection) return null;
    if (editingInjection.mode === "all") return null;
    return editingInjection.toolNames;
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.panel, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.toolbar, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.toolbarText, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Title$2, { level: 5, className: styles$4.title, children: "模型连接" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text$3, { type: "secondary", className: styles$4.desc, children: "Agent 按角色自动选型；请在「模型与 API」中配置凭证，点击卡片或编辑按钮维护连接" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "dashed",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$s, {}),
            onClick: () => {
              const creds = queryProviderCredentialsFromSettings(settings, settings.provider);
              setEditingConnection({
                ...DEFAULT_CONNECTION,
                id: queryNewConnectionId(),
                label: `连接 ${connections.length + 1}`,
                provider: settings.provider,
                apiKey: creds.apiKey,
                baseUrl: creds.baseUrl,
                model: creds.model
              });
            },
            children: "添加连接"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", loading: saving, onClick: () => void handleSave(), children: "保存连接" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.grid, children: connections.map((conn, index) => {
      const isDefault = defaultConnectionId === conn.id;
      const providerLabel = providerLabelById.get(conn.provider) ?? conn.provider;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Card,
        {
          variant: "borderless",
          className: `${cardStyles.card} ${isDefault ? cardStyles.cardActive : ""}`,
          style: { "--card-index": index },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardHead, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.cardTitleBlock, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Text$3, { className: cardStyles.cardTitle, ellipsis: { tooltip: conn.label }, children: conn.label }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardActions, children: [
                !isDefault ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "设为默认", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "text",
                    size: "small",
                    className: cardStyles.actionBtn,
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}),
                    "aria-label": `将 ${conn.label} 设为默认`,
                    onClick: () => setDefaultConnectionId(conn.id)
                  }
                ) }) : null,
                /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "编辑连接", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "text",
                    size: "small",
                    className: cardStyles.actionBtn,
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$t, {}),
                    "aria-label": `编辑 ${conn.label}`,
                    onClick: () => setEditingConnection(conn)
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: connections.length <= 1 ? "至少保留一条连接" : "删除连接", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "text",
                    danger: true,
                    size: "small",
                    className: cardStyles.actionBtn,
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$u, {}),
                    disabled: connections.length <= 1,
                    "aria-label": `删除 ${conn.label}`,
                    onClick: () => {
                      setConnections((prev) => {
                        const next = prev.filter((c) => c.id !== conn.id);
                        if (defaultConnectionId === conn.id && next[0]) {
                          setDefaultConnectionId(next[0].id);
                        }
                        return next;
                      });
                    }
                  }
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardBody, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.metaRow, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Text$3, { type: "secondary", className: cardStyles.metaLabel, children: "供应商" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Text$3,
                  {
                    className: cardStyles.metaValue,
                    ellipsis: { tooltip: providerLabel },
                    children: providerLabel
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.metaRow, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Text$3, { type: "secondary", className: cardStyles.metaLabel, children: "模型" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Text$3,
                  {
                    className: cardStyles.metaValue,
                    ellipsis: { tooltip: conn.model || "—" },
                    children: conn.model || "—"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.capabilityRow, children: conn.capabilities.map((cap) => /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: styles$4.capTag, children: queryCapabilityLabel(cap) }, cap)) })
            ] })
          ]
        },
        conn.id
      );
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.roleSection, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.roleHeader, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Title$2, { level: 5, className: styles$4.title, children: "角色 / 任务 → 模型" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Text$3, { type: "secondary", className: styles$4.desc, children: "Supervisor 路由到角色后使用对应连接；可添加自定义角色（内置不可删）" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "dashed", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$s, {}), onClick: () => setAddingRole(true), children: "添加角色" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$4.roleGrid, children: roleTaskCards.map((role, index) => {
        const mappedId = roleModelMap[role.value];
        const currentPrompt = rolePromptOverrides[role.value]?.trim() ?? "";
        const defaultPrompt = DEFAULT_ROLE_PROMPT_OVERRIDES[role.value]?.trim() ?? "";
        const hasOverride = Boolean(currentPrompt) && currentPrompt !== defaultPrompt;
        const toolSummary = queryRoleToolSummary(role.value);
        const toolsCustomized = Object.prototype.hasOwnProperty.call(
          roleToolWhitelistOverrides,
          role.value
        );
        const linkedSkills = roleSkillIds[role.value] ?? [];
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            className: styles$4.roleCard,
            style: { "--card-index": index },
            onClick: () => setEditingRole(role.value),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.roleCardHead, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Text$3, { className: styles$4.roleLabel, children: role.label }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$t, { className: styles$4.roleEditIcon, "aria-hidden": true })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Text$3, { type: "secondary", className: styles$4.roleDesc, children: role.description }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.roleMeta, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$6, { className: styles$4.roleMetaIcon, "aria-hidden": true }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Text$3, { className: styles$4.roleConnection, children: queryConnectionLabel(mappedId) })
              ] }),
              toolSummary ? /* @__PURE__ */ jsxRuntimeExports.jsx(Text$3, { type: "secondary", className: styles$4.roleToolMeta, children: toolSummary }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$4.roleTags, children: [
                !role.builtin ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: styles$4.customPromptTag, children: "自定义角色" }) : null,
                hasOverride ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: styles$4.customPromptTag, children: "已自定义设定" }) : null,
                toolsCustomized ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: styles$4.customPromptTag, children: "已自定义工具" }) : null,
                linkedSkills.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { className: styles$4.customPromptTag, children: [
                  "技能 ",
                  linkedSkills.length
                ] }) : null
              ] })
            ]
          },
          role.value
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditModelConnectionModal,
      {
        open: Boolean(editingConnection),
        connection: editingConnection,
        settings,
        onCancel: () => setEditingConnection(null),
        onSubmit: (next) => {
          setConnections((prev) => {
            const exists = prev.some((c) => c.id === next.id);
            if (exists) {
              return prev.map((c) => c.id === next.id ? next : c);
            }
            return [...prev, next];
          });
          if (!defaultConnectionId) {
            setDefaultConnectionId(next.id);
          }
          setEditingConnection(null);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      EditRoleTaskModal,
      {
        open: Boolean(editingRole),
        role: editingRole,
        roleLabel: editingRoleMeta?.label ?? "",
        roleDescription: editingRoleMeta?.description ?? "",
        connectionId: editingRole ? roleModelMap[editingRole] : void 0,
        promptOverride: editingRole ? rolePromptOverrides[editingRole] : void 0,
        promptPlaceholder: editingRole ? queryRolePromptPlaceholder(editingRole) : void 0,
        customSystemPrompt: editingCustomRole?.systemPrompt,
        toolWhitelist: queryEditingEffectiveTools(),
        defaultToolWhitelist: editingInjection ? editingInjection.defaultToolNames === void 0 ? null : editingInjection.defaultToolNames : editingCustomRole ? editingCustomRole.toolWhitelist : null,
        toolWhitelistCustomized: Boolean(
          editingRole && Object.prototype.hasOwnProperty.call(roleToolWhitelistOverrides, editingRole)
        ),
        skillIds: editingRole ? roleSkillIds[editingRole] ?? [] : [],
        skillOptions: customSkillOptions,
        connections,
        canDeleteRole: Boolean(editingRole && queryIsCustomAgentRoleId(editingRole)),
        onCancel: () => setEditingRole(null),
        onDelete: handleDeleteEditingRole,
        onSubmit: ({ connectionId, promptOverride, toolWhitelist, skillIds, customSystemPrompt }) => {
          if (!editingRole) return;
          setRoleModelMap((prev) => {
            const next = { ...prev };
            if (!connectionId) delete next[editingRole];
            else next[editingRole] = connectionId;
            return next;
          });
          setRolePromptOverrides((prev) => {
            const next = { ...prev };
            if (!promptOverride) next[editingRole] = "";
            else next[editingRole] = promptOverride;
            return next;
          });
          if (toolWhitelist !== void 0 && queryIsChatPipelineRole(editingRole)) {
            setRoleToolWhitelistOverrides((prev) => {
              const next = { ...prev };
              if (toolWhitelist === "default") {
                delete next[editingRole];
              } else {
                next[editingRole] = toolWhitelist;
              }
              return next;
            });
          }
          if (skillIds !== void 0 && queryIsChatPipelineRole(editingRole)) {
            setRoleSkillIds((prev) => {
              const next = { ...prev };
              if (!skillIds.length) delete next[editingRole];
              else next[editingRole] = skillIds;
              return next;
            });
          }
          if (customSystemPrompt !== void 0 && queryIsCustomAgentRoleId(editingRole)) {
            setCustomAgentRoles(
              (prev) => prev.map(
                (r) => r.id === editingRole ? {
                  ...r,
                  systemPrompt: customSystemPrompt || r.systemPrompt,
                  updatedAt: Date.now()
                } : r
              )
            );
          }
          setEditingRole(null);
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AddCustomRoleModal,
      {
        open: addingRole,
        onCancel: () => setAddingRole(false),
        onSubmit: (payload) => {
          const id = queryPostCustomAgentRoleId(
            payload.label,
            customAgentRoles.map((r) => r.id)
          );
          const now = Date.now();
          const created = {
            id,
            label: payload.label,
            description: payload.description,
            systemPrompt: payload.systemPrompt,
            toolWhitelist: payload.toolWhitelist,
            createdAt: now,
            updatedAt: now
          };
          setCustomAgentRoles((prev) => [...prev, created]);
          setAddingRole(false);
          setEditingRole(id);
          appMessage.success("已添加角色（请点击「保存连接」落盘）");
        }
      }
    )
  ] });
}
const panel$1 = "_panel_1fe0r_3";
const panelHeader$1 = "_panelHeader_1fe0r_13";
const titleRow$1 = "_titleRow_1fe0r_22";
const title$1 = "_title_1fe0r_22";
const countBadge$1 = "_countBadge_1fe0r_36";
const panelDesc$1 = "_panelDesc_1fe0r_50";
const errorAlert$1 = "_errorAlert_1fe0r_54";
const toolbar$1 = "_toolbar_1fe0r_59";
const searchInput$1 = "_searchInput_1fe0r_67";
const resultCount$1 = "_resultCount_1fe0r_71";
const listScroll$1 = "_listScroll_1fe0r_75";
const virtualList$1 = "_virtualList_1fe0r_93";
const empty$1 = "_empty_1fe0r_98";
const chipWrap = "_chipWrap_1fe0r_108";
const toolChip = "_toolChip_1fe0r_114";
const usageModal = "_usageModal_1fe0r_122";
const usageBody = "_usageBody_1fe0r_127";
const usageMarkdown = "_usageMarkdown_1fe0r_133";
const detailModal = "_detailModal_1fe0r_139";
const detailBody = "_detailBody_1fe0r_144";
const detailMeta = "_detailMeta_1fe0r_150";
const detailId = "_detailId_1fe0r_157";
const sourcePath = "_sourcePath_1fe0r_165";
const detailDesc = "_detailDesc_1fe0r_170";
const detailSection = "_detailSection_1fe0r_177";
const sectionLabel = "_sectionLabel_1fe0r_183";
const codeBlock = "_codeBlock_1fe0r_190";
const styles$3 = {
  panel: panel$1,
  panelHeader: panelHeader$1,
  titleRow: titleRow$1,
  title: title$1,
  countBadge: countBadge$1,
  panelDesc: panelDesc$1,
  errorAlert: errorAlert$1,
  toolbar: toolbar$1,
  searchInput: searchInput$1,
  resultCount: resultCount$1,
  listScroll: listScroll$1,
  virtualList: virtualList$1,
  empty: empty$1,
  chipWrap,
  toolChip,
  usageModal,
  usageBody,
  usageMarkdown,
  detailModal,
  detailBody,
  detailMeta,
  detailId,
  sourcePath,
  detailDesc,
  detailSection,
  sectionLabel,
  codeBlock
};
const TOOL_CARD_ROW_ESTIMATE = 188;
const INJECTION_CARD_ESTIMATE = 120;
const { Text: Text$2, Title: Title$1, Paragraph: Paragraph$1 } = Typography;
const ROLE_LABELS = {
  supervisor: "调度器",
  general: "通用助手",
  researcher: "调研员",
  writer: "撰稿人",
  publisher: "发布员",
  scriptwriter: "编剧",
  videographer: "视频制作",
  editor: "剪辑师"
};
const PERMISSION_TAG_CLASS = {
  safe: cardStyles.successTag,
  sensitive: cardStyles.warningTag,
  dangerous: cardStyles.dangerTag
};
const PERMISSION_META = {
  safe: { label: "安全", tagClass: PERMISSION_TAG_CLASS.safe },
  sensitive: { label: "敏感", tagClass: PERMISSION_TAG_CLASS.sensitive },
  dangerous: { label: "危险", tagClass: PERMISSION_TAG_CLASS.dangerous }
};
const MODE_LABELS = {
  all: "全量注入",
  whitelist: "白名单",
  none: "无工具"
};
function matchToolQuery(tool, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return tool.name.toLowerCase().includes(q) || tool.description.toLowerCase().includes(q) || queryToolLabel(tool.name).toLowerCase().includes(q);
}
function ToolsPanel() {
  const [view, setView] = reactExports.useState("list");
  const [loading, setLoading] = reactExports.useState(true);
  const [tools, setTools] = reactExports.useState([]);
  const [injections, setInjections] = reactExports.useState([]);
  const [search, setSearch] = reactExports.useState("");
  const [error, setError] = reactExports.useState(null);
  const [detailOpen, setDetailOpen] = reactExports.useState(false);
  const [detail, setDetail] = reactExports.useState(null);
  const [usageOpen, setUsageOpen] = reactExports.useState(false);
  const [usageTool, setUsageTool] = reactExports.useState(null);
  const hydrate = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const catalog = await queryAgentToolsCatalog();
      setTools(catalog.tools);
      setInjections(catalog.roleInjections);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "加载工具目录失败";
      setError(msg);
      appMessage.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    void hydrate();
  }, [hydrate]);
  const filtered = reactExports.useMemo(
    () => tools.filter((t) => matchToolQuery(t, search)),
    [tools, search]
  );
  const generalInjected = reactExports.useMemo(() => {
    const row2 = injections.find((r) => r.role === "general");
    return row2?.toolNames ?? tools.map((t) => t.name);
  }, [injections, tools]);
  const openDetail = (tool) => {
    setDetail(tool);
    setDetailOpen(true);
  };
  const openUsage = (tool) => {
    setUsageTool(tool);
    setUsageOpen(true);
  };
  const rolesUsingTool = (toolName) => injections.filter((row2) => row2.mode !== "none" && row2.toolNames.includes(toolName)).map((row2) => row2.role);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.panel, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.panelHeader, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.titleRow, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Title$1, { level: 4, className: styles$3.title, children: "Agent 工具" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.countBadge, children: tools.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text$2, { type: "secondary", className: styles$3.panelDesc, children: "查看已注册工具与源码；角色注入可在「模型连接 → 角色卡片」中维护，此处为只读一览" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Segmented,
          {
            value: view,
            onChange: (v) => setView(v),
            options: [
              { label: "工具列表", value: "list" },
              { label: "角色注入", value: "injection" }
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$q, {}),
            loading,
            onClick: () => void hydrate(),
            children: "刷新"
          }
        )
      ] })
    ] }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { type: "error", showIcon: true, message: error, className: styles$3.errorAlert }) : null,
    view === "list" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.toolbar, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input$1,
          {
            allowClear: true,
            prefix: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$m, {}),
            placeholder: "搜索工具名或描述…",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: styles$3.searchInput
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Text$2, { type: "secondary", className: styles$3.resultCount, children: [
          filtered.length,
          " / ",
          tools.length,
          " · general 注入 ",
          generalInjected.length,
          " 项"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.listScroll, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { spinning: loading && tools.length === 0, children: filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        Empty,
        {
          image: Empty.PRESENTED_IMAGE_SIMPLE,
          description: loading ? "加载中…" : "暂无匹配工具",
          className: styles$3.empty
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
        VirtualGrid,
        {
          className: styles$3.virtualList,
          items: filtered,
          gap: 16,
          overscan: 4,
          estimateSize: TOOL_CARD_ROW_ESTIMATE,
          getItemKey: (tool) => tool.name,
          renderItem: (tool, index) => {
            const roles = rolesUsingTool(tool.name);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Card,
              {
                variant: "borderless",
                className: cardStyles.card,
                style: { "--card-index": index },
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardHead, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardIdentity, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.cardIcon, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$w, {}) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Text$2, { className: cardStyles.cardTitle, children: queryToolLabel(tool.name) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: cardStyles.cardSubtitle, children: tool.name })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardActions, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "使用说明", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "text",
                          size: "small",
                          className: cardStyles.actionBtn,
                          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}),
                          "aria-label": `查看 ${queryToolLabel(tool.name)} 使用说明`,
                          onClick: () => openUsage(tool)
                        }
                      ) }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "查看详情", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "text",
                          size: "small",
                          className: cardStyles.actionBtn,
                          icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$y, {}),
                          "aria-label": `查看 ${queryToolLabel(tool.name)} 详情`,
                          onClick: () => openDetail(tool)
                        }
                      ) })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cardStyles.cardDescription, children: tool.description }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.cardFooter, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Text$2, { type: "secondary", className: cardStyles.footerHint, children: roles.length ? `注入 ${roles.map((r) => ROLE_LABELS[r] ?? r).join("、")}` : "未注入任何角色" }) })
                ]
              }
            );
          }
        }
      ) }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.listScroll, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { spinning: loading && injections.length === 0, children: injections.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Empty,
      {
        image: Empty.PRESENTED_IMAGE_SIMPLE,
        description: loading ? "加载中…" : "暂无角色注入配置",
        className: styles$3.empty
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      VirtualList,
      {
        className: styles$3.virtualList,
        items: injections,
        gap: 14,
        overscan: 4,
        estimateSize: INJECTION_CARD_ESTIMATE,
        getItemKey: (row2) => row2.role,
        renderItem: (row2, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Card,
          {
            variant: "borderless",
            className: cardStyles.card,
            style: { "--card-index": index },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardHead, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Text$2, { className: cardStyles.cardTitle, children: ROLE_LABELS[row2.role] ?? row2.role }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: cardStyles.cardSubtitle, children: row2.role })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { size: 6, children: [
                  row2.customized ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.primaryTag, children: "已自定义" }) : null,
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Tag,
                    {
                      className: row2.mode === "all" ? cardStyles.primaryTag : row2.mode === "none" ? cardStyles.mutedTag : cardStyles.successTag,
                      children: MODE_LABELS[row2.mode]
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$3.countBadge, children: row2.toolNames.length })
                ] })
              ] }),
              row2.toolNames.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Text$2, { type: "secondary", children: "此角色不挂载任何工具（仅路由）" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.chipWrap, children: row2.toolNames.map((name) => /* @__PURE__ */ jsxRuntimeExports.jsx(
                Tag,
                {
                  className: styles$3.toolChip,
                  onClick: () => {
                    const tool = tools.find((t) => t.name === name);
                    if (tool) openDetail(tool);
                  },
                  children: name
                },
                name
              )) })
            ]
          }
        )
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        title: usageTool ? `${queryToolLabel(usageTool.name)} · 使用说明` : "使用说明",
        open: usageOpen,
        onCancel: () => setUsageOpen(false),
        footer: null,
        width: 680,
        destroyOnHidden: true,
        className: styles$3.usageModal,
        children: !usageTool ? /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "未选择工具" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.usageBody, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles$3.detailId, children: usageTool.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$3.usageMarkdown, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkillMarkdown, { source: usageTool.usageGuide }) })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        title: detail ? queryToolLabel(detail.name) : "工具详情",
        open: detailOpen,
        onCancel: () => setDetailOpen(false),
        footer: null,
        width: 860,
        destroyOnHidden: true,
        className: styles$3.detailModal,
        children: !detail ? /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "未选择工具" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.detailBody, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.detailMeta, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles$3.detailId, children: detail.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: PERMISSION_META[detail.permission].tagClass, children: PERMISSION_META[detail.permission].label }),
            detail.source ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Text$2, { type: "secondary", className: styles$3.sourcePath, children: [
              detail.source.relativePath,
              ":",
              detail.source.startLine,
              "–",
              detail.source.endLine
            ] }) : null
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Paragraph$1, { className: styles$3.detailDesc, children: detail.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.detailSection, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: styles$3.sectionLabel, children: "注入角色" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Space, { wrap: true, size: [6, 6], children: rolesUsingTool(detail.name).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Text$2, { type: "secondary", children: "无" }) : rolesUsingTool(detail.name).map((role) => /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { children: ROLE_LABELS[role] ?? role }, role)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.detailSection, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: styles$3.sectionLabel, children: "参数 Schema" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: styles$3.codeBlock, children: JSON.stringify(detail.parameters, null, 2) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$3.detailSection, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: styles$3.sectionLabel, children: "源码预览" }),
            detail.sourceCode ? /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: styles$3.codeBlock, children: detail.sourceCode }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              Empty,
              {
                image: Empty.PRESENTED_IMAGE_SIMPLE,
                description: "未能读取源码（打包环境可能不含 TypeScript 源文件）"
              }
            )
          ] })
        ] })
      }
    )
  ] });
}
const panel = "_panel_1c3p9_3";
const panelHeader = "_panelHeader_1c3p9_13";
const titleRow = "_titleRow_1c3p9_32";
const title = "_title_1c3p9_32";
const countBadge = "_countBadge_1c3p9_46";
const panelDesc = "_panelDesc_1c3p9_60";
const errorAlert = "_errorAlert_1c3p9_88";
const toolbar = "_toolbar_1c3p9_93";
const searchInput = "_searchInput_1c3p9_101";
const resultCount = "_resultCount_1c3p9_105";
const listScroll = "_listScroll_1c3p9_111";
const virtualList = "_virtualList_1c3p9_129";
const empty = "_empty_1c3p9_134";
const assetIdentity = "_assetIdentity_1c3p9_144";
const assetIcon = "_assetIcon_1c3p9_151";
const assetPath = "_assetPath_1c3p9_171";
const footerActions = "_footerActions_1c3p9_178";
const fileActions = "_fileActions_1c3p9_185";
const iconAction = "_iconAction_1c3p9_191";
const iconActionDanger = "_iconActionDanger_1c3p9_210";
const previewDrawer = "_previewDrawer_1c3p9_215";
const previewWrap = "_previewWrap_1c3p9_219";
const previewMeta = "_previewMeta_1c3p9_226";
const previewPath = "_previewPath_1c3p9_233";
const previewLoading = "_previewLoading_1c3p9_239";
const previewImageWrap = "_previewImageWrap_1c3p9_248";
const previewImage = "_previewImage_1c3p9_248";
const previewMedia = "_previewMedia_1c3p9_264";
const previewAudio = "_previewAudio_1c3p9_271";
const previewFrame = "_previewFrame_1c3p9_275";
const previewText = "_previewText_1c3p9_283";
const previewFallback = "_previewFallback_1c3p9_298";
const previewFallbackIcon = "_previewFallbackIcon_1c3p9_311";
const styles$2 = {
  panel,
  panelHeader,
  titleRow,
  title,
  countBadge,
  panelDesc,
  errorAlert,
  toolbar,
  searchInput,
  resultCount,
  listScroll,
  virtualList,
  empty,
  assetIdentity,
  assetIcon,
  assetPath,
  footerActions,
  fileActions,
  iconAction,
  iconActionDanger,
  previewDrawer,
  previewWrap,
  previewMeta,
  previewPath,
  previewLoading,
  previewImageWrap,
  previewImage,
  previewMedia,
  previewAudio,
  previewFrame,
  previewText,
  previewFallback,
  previewFallbackIcon
};
const { Text: Text$1, Title, Paragraph } = Typography;
const ASSET_CARD_ROW_ESTIMATE = 188;
const KIND_FILTER_OPTIONS = [
  { label: "全部", value: "all" },
  { label: "图片", value: "image" },
  { label: "视频", value: "video" },
  { label: "音频", value: "audio" },
  { label: "网页", value: "html" },
  { label: "文档", value: "document" },
  { label: "其他", value: "other" }
];
const ZONE_FILTER_OPTIONS = [
  { label: "全部分区", value: "all" },
  { label: "通用产物", value: "artifacts" },
  { label: "场景素材", value: "videos/scenes" },
  { label: "视频项目", value: "videos/projects" }
];
const KIND_ICON = {
  image: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$B, {}),
  video: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$A, {}),
  audio: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$z, {}),
  html: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$p, {}),
  document: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$h, {}),
  other: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$f, {})
};
function matchAssetQuery(asset, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return asset.name.toLowerCase().includes(q) || asset.path.toLowerCase().includes(q) || AGENT_ASSET_ZONE_LABELS[asset.zone].toLowerCase().includes(q);
}
function queryMtimeLabel(iso) {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}
function AssetPreviewBody({ asset }) {
  const [imageUrl, setImageUrl] = reactExports.useState(null);
  const [mediaUrl, setMediaUrl] = reactExports.useState(null);
  const [textContent, setTextContent] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setImageUrl(null);
    setMediaUrl(null);
    setTextContent(null);
    void (async () => {
      if (asset.kind === "image") {
        const url = await queryLocalImageDataUrl(asset.path);
        if (!cancelled) setImageUrl(url);
      } else if (asset.kind === "video" || asset.kind === "audio" || asset.kind === "html") {
        const url = await queryLocalMediaUrl(asset.path);
        if (!cancelled) setMediaUrl(url);
      } else if (asset.kind === "document" || asset.kind === "other") {
        const text = await queryAgentAssetTextPreview(asset.path);
        if (!cancelled) setTextContent(text);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [asset.path, asset.kind]);
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.previewLoading, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { type: "secondary", children: "正在加载预览…" })
    ] });
  }
  if (asset.kind === "image" && imageUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.previewImageWrap, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { src: imageUrl, alt: asset.name, className: styles$2.previewImage }) });
  }
  if (asset.kind === "video" && mediaUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("video", { controls: true, className: styles$2.previewMedia, src: mediaUrl });
  }
  if (asset.kind === "audio" && mediaUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("audio", { controls: true, className: styles$2.previewAudio, src: mediaUrl });
  }
  if (asset.kind === "html" && mediaUrl) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "iframe",
      {
        className: styles$2.previewFrame,
        title: asset.name,
        src: mediaUrl,
        sandbox: "allow-scripts allow-same-origin allow-forms allow-popups"
      }
    );
  }
  if (textContent != null) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: styles$2.previewText, children: textContent });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.previewFallback, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$f, { className: styles$2.previewFallbackIcon }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { type: "secondary", children: "该文件类型暂不支持内联预览，请使用下方操作打开" })
  ] });
}
function AssetsPanel() {
  const [loading, setLoading] = reactExports.useState(true);
  const [assets, setAssets] = reactExports.useState([]);
  const [error, setError] = reactExports.useState(null);
  const [search, setSearch] = reactExports.useState("");
  const [kindFilter, setKindFilter] = reactExports.useState("all");
  const [zoneFilter, setZoneFilter] = reactExports.useState("all");
  const [deletingPath, setDeletingPath] = reactExports.useState(null);
  const [batchDeleting, setBatchDeleting] = reactExports.useState(false);
  const [clearing, setClearing] = reactExports.useState(false);
  const [selectedPaths, setSelectedPaths] = reactExports.useState(() => /* @__PURE__ */ new Set());
  const [previewOpen, setPreviewOpen] = reactExports.useState(false);
  const [previewAsset, setPreviewAsset] = reactExports.useState(null);
  const hydrate = reactExports.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await queryAgentAssets();
      setAssets(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "加载资产列表失败";
      setError(msg);
      appMessage.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);
  reactExports.useEffect(() => {
    void hydrate();
  }, [hydrate]);
  const filtered = reactExports.useMemo(() => {
    return assets.filter((a) => {
      if (kindFilter !== "all" && a.kind !== kindFilter) return false;
      if (zoneFilter !== "all" && a.zone !== zoneFilter) return false;
      return matchAssetQuery(a, search);
    });
  }, [assets, kindFilter, zoneFilter, search]);
  const totalSize = reactExports.useMemo(
    () => assets.reduce((sum, a) => sum + a.size, 0),
    [assets]
  );
  const selectedCount = selectedPaths.size;
  const selectedInFilteredCount = reactExports.useMemo(
    () => filtered.filter((asset) => selectedPaths.has(asset.path)).length,
    [filtered, selectedPaths]
  );
  const allFilteredSelected = filtered.length > 0 && selectedInFilteredCount === filtered.length;
  const someFilteredSelected = selectedInFilteredCount > 0 && selectedInFilteredCount < filtered.length;
  const selectedTotalSize = reactExports.useMemo(
    () => assets.filter((asset) => selectedPaths.has(asset.path)).reduce((sum, a) => sum + a.size, 0),
    [assets, selectedPaths]
  );
  const toggleAssetSelected = (path, checked) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (checked) next.add(path);
      else next.delete(path);
      return next;
    });
  };
  const handleToggleSelectAllFiltered = () => {
    setSelectedPaths((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((asset) => next.delete(asset.path));
      } else {
        filtered.forEach((asset) => next.add(asset.path));
      }
      return next;
    });
  };
  const clearSelection = () => {
    setSelectedPaths(/* @__PURE__ */ new Set());
  };
  const openPreview = (asset) => {
    setPreviewAsset(asset);
    setPreviewOpen(true);
  };
  const handleDelete = async (asset) => {
    setDeletingPath(asset.path);
    try {
      await postDeleteAgentAsset(asset.path);
      setAssets((prev) => prev.filter((a) => a.path !== asset.path));
      setSelectedPaths((prev) => {
        if (!prev.has(asset.path)) return prev;
        const next = new Set(prev);
        next.delete(asset.path);
        return next;
      });
      if (previewAsset?.path === asset.path) {
        setPreviewOpen(false);
        setPreviewAsset(null);
      }
      appMessage.success("已删除");
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeletingPath(null);
    }
  };
  const handleBatchDelete = () => {
    const paths = Array.from(selectedPaths);
    if (!paths.length) return;
    Modal.confirm({
      title: `删除选中的 ${paths.length} 个文件？`,
      content: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paragraph, { children: [
        "将永久删除 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { strong: true, children: paths.length }),
        " 个文件（共",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { strong: true, children: queryFormatAssetSize(selectedTotalSize) }),
        "），此操作不可撤销。"
      ] }),
      okText: "确认删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        setBatchDeleting(true);
        try {
          const result = await postDeleteAgentAssets(paths);
          const deleted = new Set(paths);
          setAssets((prev) => prev.filter((asset) => !deleted.has(asset.path)));
          setSelectedPaths(/* @__PURE__ */ new Set());
          if (previewAsset && deleted.has(previewAsset.path)) {
            setPreviewOpen(false);
            setPreviewAsset(null);
          }
          appMessage.success(`已删除 ${result.deletedCount} 个文件`);
        } catch (err) {
          appMessage.error(err instanceof Error ? err.message : "批量删除失败");
        } finally {
          setBatchDeleting(false);
        }
      }
    });
  };
  const handleClearAll = () => {
    Modal.confirm({
      title: "一键清空全部资产？",
      content: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paragraph, { children: [
        "将永久删除 ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { strong: true, children: assets.length }),
        " 个文件（共",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { strong: true, children: queryFormatAssetSize(totalSize) }),
        "），包括通用产物、场景素材与视频项目。此操作不可撤销。"
      ] }) }),
      okText: "确认清空",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        setClearing(true);
        try {
          const result = await postClearAgentAssets();
          setAssets([]);
          setSelectedPaths(/* @__PURE__ */ new Set());
          setPreviewOpen(false);
          setPreviewAsset(null);
          appMessage.success(`已清空 ${result.deletedCount} 个文件`);
        } catch (err) {
          appMessage.error(err instanceof Error ? err.message : "清空失败");
        } finally {
          setClearing(false);
        }
      }
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.panel, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.panelHeader, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.titleRow, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Title, { level: 4, className: styles$2.title, children: "Agent 资产" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$2.countBadge, children: assets.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Text$1, { type: "secondary", className: styles$2.panelDesc, children: [
          "查看、预览与维护 Agent 生成的全部本地文件 · 占用 ",
          queryFormatAssetSize(totalSize)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
        filtered.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.batchBar, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Checkbox,
            {
              checked: allFilteredSelected,
              indeterminate: someFilteredSelected,
              onChange: () => handleToggleSelectAllFiltered(),
              children: "全选当前筛选"
            }
          ),
          selectedCount > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, size: 8, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Text$1, { type: "secondary", className: styles$2.batchHint, children: [
              "已选 ",
              selectedCount,
              " 项 · ",
              queryFormatAssetSize(selectedTotalSize)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "link", size: "small", onClick: clearSelection, children: "取消选择" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                danger: true,
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$u, {}),
                loading: batchDeleting,
                onClick: handleBatchDelete,
                children: "删除选中"
              }
            )
          ] }) : null
        ] }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            danger: true,
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$u, {}),
            onClick: handleClearAll,
            loading: clearing,
            disabled: !assets.length,
            children: "一键清空"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$q, {}), onClick: () => void hydrate(), loading, children: "刷新" })
      ] })
    ] }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { type: "error", showIcon: true, message: error, className: styles$2.errorAlert }) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.toolbar, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Segmented,
        {
          value: kindFilter,
          onChange: (v) => setKindFilter(v),
          options: KIND_FILTER_OPTIONS
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Segmented,
        {
          value: zoneFilter,
          onChange: (v) => setZoneFilter(v),
          options: ZONE_FILTER_OPTIONS
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: styles$2.resultCount, children: [
        filtered.length === assets.length ? `共 ${assets.length} 项` : `筛选 ${filtered.length} / ${assets.length}`,
        selectedCount > 0 ? ` · 已选 ${selectedCount}` : ""
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Input$1,
        {
          allowClear: true,
          placeholder: "搜索文件名或路径…",
          value: search,
          onChange: (e) => setSearch(e.target.value),
          className: styles$2.searchInput
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles$2.listScroll, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { spinning: loading && assets.length === 0, children: filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Empty,
      {
        className: styles$2.empty,
        image: Empty.PRESENTED_IMAGE_SIMPLE,
        description: loading ? "加载中…" : assets.length === 0 ? "暂无 Agent 产出文件" : "没有匹配的资产"
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      VirtualGrid,
      {
        className: styles$2.virtualList,
        items: filtered,
        gap: 16,
        overscan: 4,
        estimateSize: ASSET_CARD_ROW_ESTIMATE,
        getItemKey: (asset) => asset.path,
        renderItem: (asset, index) => {
          const isSelected = selectedPaths.has(asset.path);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Card,
            {
              variant: "borderless",
              hoverable: true,
              className: `${cardStyles.card} ${cardStyles.cardSelectable}${isSelected ? ` ${cardStyles.cardActive}` : ""}`,
              style: { "--card-index": index },
              onClick: () => toggleAssetSelected(asset.path, !isSelected),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardHead, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.assetIdentity, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      "span",
                      {
                        className: `${cardStyles.cardIcon} ${styles$2.assetIcon}`,
                        "data-kind": asset.kind,
                        children: KIND_ICON[asset.kind]
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { className: cardStyles.cardTitle, title: asset.name, children: asset.name }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cardStyles.cardSubtitle, children: [
                        queryFormatAssetSize(asset.size),
                        " · ",
                        queryMtimeLabel(asset.mtime)
                      ] })
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.primaryTag, children: AGENT_ASSET_KIND_LABELS[asset.kind] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardBody, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.tagRow, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.mutedTag, children: AGENT_ASSET_ZONE_LABELS[asset.zone] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Text$1,
                    {
                      type: "secondary",
                      className: `${cardStyles.metaMono} ${styles$2.assetPath}`,
                      ellipsis: { tooltip: asset.path },
                      children: asset.path
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "div",
                  {
                    className: cardStyles.cardFooter,
                    onClick: (e) => e.stopPropagation(),
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.footerActions, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "预览", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            type: "text",
                            size: "small",
                            className: styles$2.iconAction,
                            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$y, {}),
                            onClick: () => openPreview(asset),
                            "aria-label": "预览"
                          }
                        ) }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          ArtifactFileActions,
                          {
                            filePath: asset.path,
                            showBrowserOpen: asset.kind === "html",
                            iconOnly: true,
                            className: styles$2.fileActions
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Popconfirm,
                          {
                            title: "删除此文件？",
                            description: "删除后无法恢复",
                            okText: "删除",
                            okType: "danger",
                            cancelText: "取消",
                            onConfirm: () => void handleDelete(asset),
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "删除", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                              Button,
                              {
                                type: "text",
                                size: "small",
                                danger: true,
                                className: `${styles$2.iconAction} ${styles$2.iconActionDanger}`,
                                loading: deletingPath === asset.path,
                                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$u, {}),
                                "aria-label": "删除"
                              }
                            ) })
                          }
                        )
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Checkbox,
                        {
                          className: cardStyles.cardCheckbox,
                          checked: isSelected,
                          onClick: (e) => e.stopPropagation(),
                          onChange: (e) => toggleAssetSelected(asset.path, e.target.checked)
                        }
                      )
                    ]
                  }
                )
              ]
            }
          );
        }
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Drawer,
      {
        title: previewAsset?.name ?? "资产预览",
        open: previewOpen,
        onClose: () => setPreviewOpen(false),
        width: Math.min(720, window.innerWidth - 48),
        className: styles$2.previewDrawer,
        destroyOnHidden: true,
        extra: previewAsset ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            ArtifactFileActions,
            {
              filePath: previewAsset.path,
              showBrowserOpen: previewAsset.kind === "html"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Popconfirm,
            {
              title: "删除此文件？",
              okText: "删除",
              okType: "danger",
              cancelText: "取消",
              onConfirm: () => previewAsset && void handleDelete(previewAsset),
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { danger: true, size: "small", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$u, {}), children: "删除" })
            }
          )
        ] }) : null,
        children: previewAsset ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.previewWrap, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$2.previewMeta, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { children: AGENT_ASSET_KIND_LABELS[previewAsset.kind] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { children: AGENT_ASSET_ZONE_LABELS[previewAsset.zone] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { type: "secondary", children: queryFormatAssetSize(previewAsset.size) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { type: "secondary", children: queryMtimeLabel(previewAsset.mtime) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(AssetPreviewBody, { asset: previewAsset }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Text$1, { type: "secondary", className: styles$2.previewPath, copyable: true, children: previewAsset.path })
        ] }) : null
      }
    )
  ] });
}
const fields = "_fields_173xo_1";
const row = "_row_173xo_8";
const label = "_label_173xo_14";
const actions = "_actions_173xo_20";
const styles$1 = {
  fields,
  row,
  label,
  actions
};
function ComfyUiPanel() {
  const settings = useSettingsStore((s) => s.settings);
  const loaded = useSettingsStore((s) => s.loaded);
  const postSettings = useSettingsStore((s) => s.postSettings);
  const [testing, setTesting] = reactExports.useState(false);
  const [draftUrl, setDraftUrl] = reactExports.useState(null);
  const baseUrl = draftUrl ?? settings.comfyUi?.baseUrl ?? "http://127.0.0.1:8188";
  const enabled = settings.comfyUi?.enabled !== false;
  const handleSaveUrl = async () => {
    try {
      await postSettings({
        comfyUi: {
          baseUrl: baseUrl.trim().replace(/\/+$/, ""),
          enabled
        }
      });
      setDraftUrl(null);
      appMessage.success("已保存 ComfyUI 地址");
    } catch {
      appMessage.error("保存失败");
    }
  };
  const handleTest = async () => {
    setTesting(true);
    try {
      await postSettings({
        comfyUi: {
          baseUrl: baseUrl.trim().replace(/\/+$/, ""),
          enabled
        }
      });
      setDraftUrl(null);
      const res = await window.api.queryComfyUiStatus();
      if (res.ok) {
        appMessage.success(res.message);
      } else {
        appMessage.error(res.message);
      }
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "测试失败");
    } finally {
      setTesting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.grid, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Card,
    {
      variant: "borderless",
      className: cardStyles.card,
      style: { "--card-index": 0 },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.cardHead, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardIdentity, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.cardIcon, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$o, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.cardTitle, children: "ComfyUI 连接" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.primaryTag, children: "AI 视频" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cardStyles.cardDescription, children: "配置远程 ComfyUI 服务地址，供 AI 视频无限画布调用文生图、图生视频与合成工作流" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.fields, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.row, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.label, children: "启用" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                checked: enabled,
                disabled: !loaded,
                onChange: async (checked) => {
                  try {
                    await postSettings({
                      comfyUi: { baseUrl: baseUrl.trim(), enabled: checked }
                    });
                    appMessage.success(checked ? "已启用 ComfyUI" : "已关闭 ComfyUI");
                  } catch {
                    appMessage.error("更新失败");
                  }
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.row, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles$1.label, children: "服务地址" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input$1,
              {
                value: baseUrl,
                disabled: !loaded,
                placeholder: "http://127.0.0.1:8188",
                onChange: (e) => setDraftUrl(e.target.value),
                onPressEnter: () => void handleSaveUrl()
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles$1.actions, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !loaded, onClick: () => void handleSaveUrl(), children: "保存" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "primary",
                loading: testing,
                disabled: !loaded || !enabled,
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$v, {}),
                onClick: () => void handleTest(),
                children: "测试连接"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.cardFooter, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.footerHint, children: "默认本地 8188 · 需 API Format 工作流" }) })
      ]
    }
  ) });
}
const localBadge = "_localBadge_18w0j_3";
const formLoading = "_formLoading_18w0j_162";
const styles = {
  localBadge,
  formLoading
};
const { Text } = Typography;
const SETTINGS_TAB_STORAGE_KEY = "lingxi:settings-tab";
const SETTINGS_TAB_OPTIONS = [
  { label: "模型与API", value: "model" },
  { label: "多模型连接", value: "connections" },
  { label: "应用与启动", value: "app" },
  { label: "外部集成", value: "integrations" },
  { label: "渠道", value: "channels" },
  { label: "工具", value: "tools" },
  { label: "资产", value: "assets" }
];
function queryInitialSettingsTab() {
  try {
    const saved = localStorage.getItem(SETTINGS_TAB_STORAGE_KEY);
    if (saved && SETTINGS_TAB_OPTIONS.some((item) => item.value === saved)) {
      return saved;
    }
  } catch {
  }
  return "model";
}
function postPersistSettingsTab(tab) {
  try {
    localStorage.setItem(SETTINGS_TAB_STORAGE_KEY, tab);
  } catch {
  }
}
function SettingsPage() {
  const settings = useSettingsStore((s) => s.settings);
  const loaded = useSettingsStore((s) => s.loaded);
  const postSettings = useSettingsStore((s) => s.postSettings);
  const [tab, setTab] = reactExports.useState(queryInitialSettingsTab);
  const handleTabChange = (next) => {
    setTab(next);
    postPersistSettingsTab(next);
  };
  const connectionCount = settings.connections?.length ?? 0;
  const providerCount = queryAllProviderOptions(settings.customProviders ?? []).length;
  const tabHint = tab === "model" ? `${providerCount} 个供应商` : tab === "connections" ? `${connectionCount || 1} 条连接` : tab === "app" ? "本机启动偏好" : tab === "integrations" ? "ComfyUI 等外部服务" : tab === "channels" ? "发布与通知渠道" : tab === "tools" ? "Agent 工具注册表" : tab === "assets" ? "Agent 产出文件" : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FeaturePageHeader,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$C, {}),
        title: "设置",
        badge: "偏好中心",
        badgeVariant: "muted",
        description: "配置模型服务、运行参数，并管理发布与通知渠道",
        extra: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.localBadge, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "敏感信息仅存本机" })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageToolbar, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Segmented,
        {
          value: tab,
          onChange: (v) => handleTabChange(v),
          options: SETTINGS_TAB_OPTIONS
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: shellStyles.toolbarRight, children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: shellStyles.resultCount, children: tabHint }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(FeatureScrollBody, { locked: tab === "tools" || tab === "assets" || tab === "channels", children: [
      tab === "model" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ModelApiPanel, {}, "model") : null,
      tab === "connections" ? loaded ? /* @__PURE__ */ jsxRuntimeExports.jsx(ModelConnectionsPanel, {}, "connections") : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.formLoading, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", children: "正在加载本机配置…" })
      ] }, "connections-loading") : null,
      tab === "app" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.grid, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { variant: "borderless", className: cardStyles.card, style: { "--card-index": 0 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.cardHead, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardIdentity, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.cardIcon, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.cardTitle, children: "开机自启" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.primaryTag, children: "启动" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cardStyles.cardDescription, children: "登录 macOS / Windows 后自动启动灵犀，便于后台定时任务与渠道保持在线" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardFooter, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.footerHint, children: "本机偏好 · 即时生效" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                checked: settings.launchAtLogin,
                disabled: !loaded,
                onChange: async (checked) => {
                  try {
                    await postSettings({ launchAtLogin: checked });
                    appMessage.success(checked ? "已开启开机自启" : "已关闭开机自启");
                  } catch {
                    appMessage.error("更新开机自启失败，请重试");
                  }
                }
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { variant: "borderless", className: cardStyles.card, style: { "--card-index": 1 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.cardHead, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardIdentity, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.cardIcon, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$D, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.cardTitle, children: "关闭到托盘" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.primaryTag, children: "托盘" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cardStyles.cardDescription, children: "关闭主窗口时隐藏到状态栏托盘，进程继续运行；可从托盘图标重新打开或彻底退出" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardFooter, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.footerHint, children: "本机偏好 · 即时生效" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Switch,
              {
                checked: settings.closeToTray,
                disabled: !loaded,
                onChange: async (checked) => {
                  try {
                    await postSettings({ closeToTray: checked });
                    appMessage.success(checked ? "已开启关闭到托盘" : "已关闭：关闭窗口将退出应用");
                  } catch {
                    appMessage.error("更新托盘偏好失败，请重试");
                  }
                }
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { variant: "borderless", className: cardStyles.card, style: { "--card-index": 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.cardHead, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardIdentity, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.cardIcon, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$E, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.cardTitle, children: "运行环境" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.mutedTag, children: "应用" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cardStyles.cardDescription, children: "配置与密钥仅写入本机 Electron userData，不参与遥测或云端同步" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardFooter, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cardStyles.footerHint, children: "本地优先" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.successTag, children: "已隔离" })
          ] })
        ] })
      ] }, "app") : null,
      tab === "integrations" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ComfyUiPanel, {}, "integrations") : null,
      tab === "channels" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChannelsPanel, {}, "channels") : null,
      tab === "tools" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ToolsPanel, {}, "tools") : null,
      tab === "assets" ? /* @__PURE__ */ jsxRuntimeExports.jsx(AssetsPanel, {}, "assets") : null
    ] })
  ] });
}
export {
  SettingsPage
};
