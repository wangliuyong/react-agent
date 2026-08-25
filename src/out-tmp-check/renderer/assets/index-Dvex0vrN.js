import { r as reactExports, j as jsxRuntimeExports } from "./vendor-xyflow-ByVkQ6-f.js";
import { S as SkillMarkdown } from "./SkillMarkdown-B9mv4weK.js";
import { cF as useRulesStore, af as Form, aI as FeaturePageHeader, a6 as Space, E as Button, D as appMessage, aK as RefIcon, at as RefIcon$1, al as RefIcon$2, ar as Segmented, as as shellStyles, ah as Input, aC as RefIcon$3, S as Spin, aw as Empty, aT as cardStyles, am as Card, T as Typography, a5 as Tooltip, aF as RefIcon$4, aU as RefIcon$5, ag as Modal, aA as Popconfirm, aB as RefIcon$6, a_ as Switch, ax as Tag, cG as ruleToInput, cH as slugifyRuleId, cI as isValidRuleId, cJ as createEmptyRule } from "./index-BQnnWLUu.js";
import { F as FeaturePageShell, a as FeatureScrollBody } from "./FeatureScrollBody-BTNfhjBJ.js";
import { F as FeaturePageToolbar } from "./FeaturePageToolbar-DU3L1YVp.js";
import "./LazyChatMarkdown-BGGvM4yz.js";
const searchInput = "_searchInput_1gneb_3";
const empty = "_empty_1gneb_7";
const cardDisabled = "_cardDisabled_1gneb_16";
const detailModal = "_detailModal_1gneb_20";
const detailBody = "_detailBody_1gneb_24";
const detailHeader = "_detailHeader_1gneb_30";
const detailId = "_detailId_1gneb_40";
const detailTags = "_detailTags_1gneb_50";
const injectToggle = "_injectToggle_1gneb_57";
const injectLabel = "_injectLabel_1gneb_67";
const description = "_description_1gneb_73";
const sectionLabel = "_sectionLabel_1gneb_96";
const styles = {
  searchInput,
  empty,
  cardDisabled,
  detailModal,
  detailBody,
  detailHeader,
  detailId,
  detailTags,
  injectToggle,
  injectLabel,
  description,
  sectionLabel
};
const { Text } = Typography;
function matchRuleQuery(rule, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return rule.name.toLowerCase().includes(q) || rule.description.toLowerCase().includes(q) || rule.id.toLowerCase().includes(q) || rule.content.toLowerCase().includes(q);
}
function RuleStatusTag({ enabled }) {
  if (!enabled) return /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.warningTag, children: "未启用" });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.successTag, children: "已启用" });
}
function RulesPage() {
  const rules = useRulesStore((s) => s.rules);
  const loading = useRulesStore((s) => s.loading);
  const hydrate = useRulesStore((s) => s.hydrate);
  const saveRule = useRulesStore((s) => s.saveRule);
  const removeRule = useRulesStore((s) => s.removeRule);
  const toggleEnabled = useRulesStore((s) => s.toggleEnabled);
  const [filter, setFilter] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const [detailOpen, setDetailOpen] = reactExports.useState(false);
  const [detailRule, setDetailRule] = reactExports.useState(null);
  const [editOpen, setEditOpen] = reactExports.useState(false);
  const [editMode, setEditMode] = reactExports.useState("create");
  const [editDraft, setEditDraft] = reactExports.useState(null);
  const [saving, setSaving] = reactExports.useState(false);
  const [form] = Form.useForm();
  reactExports.useEffect(() => {
    void hydrate();
  }, [hydrate]);
  const enabledCount = reactExports.useMemo(() => rules.filter((r) => r.enabled).length, [rules]);
  const filtered = reactExports.useMemo(() => {
    let list = rules;
    if (filter === "enabled") list = list.filter((r) => r.enabled);
    if (filter === "disabled") list = list.filter((r) => !r.enabled);
    return list.filter((r) => matchRuleQuery(r, search));
  }, [rules, filter, search]);
  const closeEdit = () => {
    setEditOpen(false);
    setEditDraft(null);
  };
  const openCreate = () => {
    const draft = createEmptyRule();
    setEditMode("create");
    setEditDraft(draft);
    setEditOpen(true);
  };
  const openEdit = (rule) => {
    setEditMode("update");
    setEditDraft(ruleToInput(rule));
    setEditOpen(true);
  };
  const openDetail = (rule) => {
    setDetailRule(rule);
    setDetailOpen(true);
  };
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const rawId = editMode === "update" ? values.id || editDraft?.id || "" : values.id || values.name || "";
      const normalizedId = editMode === "create" ? slugifyRuleId(String(rawId)) : String(rawId).trim();
      if (!isValidRuleId(normalizedId)) {
        appMessage.error("规则 id 仅允许小写字母、数字、连字符和下划线");
        return Promise.reject(new Error("validation"));
      }
      setSaving(true);
      const saved = await saveRule({
        id: normalizedId,
        name: values.name.trim(),
        description: (values.description ?? "").trim(),
        content: values.content.trim(),
        enabled: Boolean(values.enabled)
      });
      appMessage.success(editMode === "create" ? "规则已创建" : "规则已更新");
      closeEdit();
      if (detailRule?.id === saved.id) setDetailRule(saved);
    } catch (err) {
      if (err instanceof Error && err.message && err.message !== "validation") {
        appMessage.error(err.message);
      }
      return Promise.reject(err instanceof Error ? err : new Error("save failed"));
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id) => {
    try {
      await removeRule(id);
      appMessage.success("规则已删除");
      if (detailRule?.id === id) {
        setDetailOpen(false);
        setDetailRule(null);
      }
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "删除失败");
    }
  };
  const handleToggle = async (id, enabled) => {
    try {
      await toggleEnabled(id, enabled);
      appMessage.success(enabled ? "已启用，将注入 Agent" : "已禁用");
      if (detailRule?.id === id) {
        setDetailRule((prev) => prev ? { ...prev, enabled } : prev);
      }
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "更新失败");
    }
  };
  reactExports.useEffect(() => {
    if (!detailRule) return;
    const next = rules.find((r) => r.id === detailRule.id);
    if (next) setDetailRule(next);
  }, [rules, detailRule?.id]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FeaturePageHeader,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}),
        title: "规则",
        badge: rules.length,
        description: `Always Apply 持久指令；已启用 ${enabledCount} 条，对话时优先于技能注入系统提示`,
        extra: /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}),
              onClick: async () => {
                await hydrate();
                appMessage.success("已刷新");
              },
              children: "刷新"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}), onClick: openCreate, children: "新建规则" })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageToolbar, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Segmented,
        {
          value: filter,
          onChange: (v) => setFilter(v),
          options: [
            { label: "全部", value: "all" },
            { label: "已启用", value: "enabled" },
            { label: "未启用", value: "disabled" }
          ]
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
            prefix: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, {}),
            placeholder: "搜索规则...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: styles.searchInput
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureScrollBody, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { spinning: loading && rules.length === 0, children: filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Empty,
      {
        image: Empty.PRESENTED_IMAGE_SIMPLE,
        description: rules.length === 0 ? "暂无规则" : "暂无匹配的规则",
        className: styles.empty,
        children: rules.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}), onClick: openCreate, children: "新建规则" }) : null
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.grid, children: filtered.map((rule, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        variant: "borderless",
        className: `${cardStyles.card} ${rule.enabled ? "" : styles.cardDisabled}`,
        style: { "--card-index": index },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardHead, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { className: cardStyles.cardTitle, ellipsis: { tooltip: rule.name }, children: rule.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.tagRow, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RuleStatusTag, { enabled: rule.enabled }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardActions, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "查看详情", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "text",
                  size: "small",
                  className: cardStyles.actionBtn,
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
                  "aria-label": `查看规则 ${rule.name}`,
                  onClick: () => openDetail(rule)
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "编辑规则", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "text",
                  size: "small",
                  className: cardStyles.actionBtn,
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
                  "aria-label": `编辑规则 ${rule.name}`,
                  onClick: () => openEdit(rule)
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cardStyles.cardDescription, children: rule.description?.trim() || "暂无简介，使用右上角图标查看或编辑。" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardFooter, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { type: "secondary", className: cardStyles.footerHint, children: [
              "@",
              rule.id
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: cardStyles.metaLabel, children: rule.enabled ? "注入 Agent" : "未注入" })
          ] })
        ]
      },
      rule.id
    )) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        title: detailRule?.name ?? "规则详情",
        open: detailOpen,
        onCancel: () => setDetailOpen(false),
        footer: null,
        width: 760,
        destroyOnHidden: true,
        className: styles.detailModal,
        children: !detailRule ? /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "未找到规则详情" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.detailBody, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.detailHeader, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles.detailId, children: detailRule.id }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.detailTags, children: /* @__PURE__ */ jsxRuntimeExports.jsx(RuleStatusTag, { enabled: detailRule.enabled }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
                  onClick: () => openEdit(detailRule),
                  children: "编辑"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Popconfirm,
                {
                  title: "确定删除该规则？",
                  description: "删除后对话将不再注入此指令。",
                  onConfirm: () => void handleDelete(detailRule.id),
                  okText: "删除",
                  cancelText: "取消",
                  okButtonProps: { danger: true },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { danger: true, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$6, {}), children: "删除" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.injectToggle, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.injectLabel, children: "注入 Agent" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Switch,
                  {
                    checked: detailRule.enabled,
                    onChange: (v) => void handleToggle(detailRule.id, v)
                  }
                )
              ] })
            ] })
          ] }),
          detailRule.description?.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles.description, children: detailRule.description }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles.sectionLabel, children: "规则正文" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SkillMarkdown, { source: detailRule.content })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        title: editMode === "create" ? "新建规则" : "编辑规则",
        open: editOpen,
        onCancel: closeEdit,
        onOk: () => void handleSave(),
        confirmLoading: saving,
        destroyOnHidden: true,
        width: 640,
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Form,
          {
            form,
            layout: "vertical",
            preserve: false,
            initialValues: editDraft ?? void 0,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Form.Item,
                {
                  name: "id",
                  label: "规则 ID",
                  tooltip: editMode === "create" ? "留空则根据名称自动生成；仅小写字母、数字、连字符与下划线" : void 0,
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      disabled: editMode === "update",
                      placeholder: editMode === "create" ? "例如 reply_zh_cn" : void 0
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Form.Item,
                {
                  name: "name",
                  label: "名称",
                  rules: [{ required: true, message: "请输入规则名称" }],
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "例如 简体中文回复" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "description", label: "简介", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 2, placeholder: "列表卡片上展示的简短说明" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "enabled", label: "启用并注入 Agent", valuePropName: "checked", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checkedChildren: "开", unCheckedChildren: "关" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Form.Item,
                {
                  name: "content",
                  label: "规则正文",
                  rules: [{ required: true, message: "请输入规则正文" }],
                  tooltip: "Markdown，启用后会拼进 Agent 系统提示",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input.TextArea,
                    {
                      rows: 7,
                      placeholder: "用自然语言写清约束，例如：所有回复必须使用简体中文。"
                    }
                  )
                }
              )
            ]
          },
          editDraft ? `${editMode}-${editDraft.id || "new"}` : "closed"
        )
      }
    )
  ] });
}
export {
  RulesPage
};
