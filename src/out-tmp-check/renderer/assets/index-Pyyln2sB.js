import { r as reactExports, j as jsxRuntimeExports } from "./vendor-xyflow-ByVkQ6-f.js";
import { aL as usePublishStore, aM as useWorkflowsStore, aq as useSessionStore, aj as useAppStore, aN as useChannelsStore, aO as queryEnabledPublishChannelsFromStore, aP as queryEnabledNotifyChannelsFromStore, aQ as normalizePublishPlan, aR as normalizePublishPlanWorkflowIds, aI as FeaturePageHeader, a6 as Space, E as Button, D as appMessage, aS as createEmptyPlan, at as RefIcon, ai as RefIcon$1, ar as Segmented, as as shellStyles, ah as Input, aC as RefIcon$2, aw as Empty, aT as cardStyles, am as Card, T as Typography, ax as Tag, a5 as Tooltip, aF as RefIcon$3, aU as RefIcon$4, aV as queryPublishPlanKindLabel, ag as Modal, aW as DB_THEME, aX as queryPublishChannelLabel, aA as Popconfirm, aB as RefIcon$6, aY as normalizePublishSubTask, aZ as createEmptySubTask, af as Form, ab as Select, a_ as Switch, a$ as postRunWorkflow } from "./index-BQnnWLUu.js";
import { i as isBuiltinSeedId } from "./builtin-seeds-D5FxdJgB.js";
import { F as FeaturePageShell, a as FeatureScrollBody } from "./FeatureScrollBody-BTNfhjBJ.js";
import { F as FeaturePageToolbar } from "./FeaturePageToolbar-DU3L1YVp.js";
import { R as RefIcon$5 } from "./PlayCircleOutlined-y8OhbKwX.js";
const searchInput = "_searchInput_1rebw_3";
const empty = "_empty_1rebw_7";
const detailModal = "_detailModal_1rebw_16";
const detailBody = "_detailBody_1rebw_20";
const detailHeader = "_detailHeader_1rebw_26";
const detailId = "_detailId_1rebw_36";
const detailTags = "_detailTags_1rebw_46";
const description = "_description_1rebw_53";
const sectionLabel = "_sectionLabel_1rebw_76";
const subList = "_subList_1rebw_93";
const subCard = "_subCard_1rebw_99";
const subIndex = "_subIndex_1rebw_113";
const subBody = "_subBody_1rebw_127";
const subTitleRow = "_subTitleRow_1rebw_132";
const subTitle = "_subTitle_1rebw_132";
const subPrompt = "_subPrompt_1rebw_145";
const styles = {
  searchInput,
  empty,
  detailModal,
  detailBody,
  detailHeader,
  detailId,
  detailTags,
  description,
  sectionLabel,
  subList,
  subCard,
  subIndex,
  subBody,
  subTitleRow,
  subTitle,
  subPrompt
};
const { Text, Paragraph } = Typography;
function matchPlanQuery(plan, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return plan.title.toLowerCase().includes(q) || plan.description.toLowerCase().includes(q) || plan.id.toLowerCase().includes(q);
}
function PlanEditModal({
  open,
  mode,
  initialPlan,
  workflows,
  notifyChannelOptions,
  onCancel,
  onSubmit
}) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = reactExports.useState(false);
  const kind = Form.useWatch("kind", form) ?? initialPlan?.kind ?? "normal";
  reactExports.useEffect(() => {
    if (!open || !initialPlan) {
      if (!open) form.resetFields();
      return;
    }
    form.setFieldsValue({
      title: initialPlan.title,
      description: initialPlan.description,
      kind: initialPlan.kind ?? "normal",
      workflowIds: normalizePublishPlanWorkflowIds(initialPlan),
      notifyChannels: initialPlan.notifyChannels ?? [],
      presetUserInput: initialPlan.presetUserInput ?? ""
    });
  }, [open, initialPlan, form]);
  const handleOk = async () => {
    if (!initialPlan) return;
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const nextKind = values.kind;
      await onSubmit({
        ...initialPlan,
        title: values.title.trim(),
        description: values.description.trim(),
        kind: nextKind,
        workflowIds: nextKind === "workflow" ? values.workflowIds ?? [] : [],
        workflowId: void 0,
        notifyChannels: values.notifyChannels ?? [],
        presetUserInput: values.presetUserInput?.trim() || void 0,
        // 切到流程任务时清空子任务，避免与关联流程混淆
        subTasks: nextKind === "workflow" ? [] : initialPlan.subTasks
      });
    } catch {
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Modal,
    {
      title: mode === "create" ? "新建发布任务" : "编辑发布任务",
      open,
      onCancel,
      onOk: () => void handleOk(),
      confirmLoading: submitting,
      okText: mode === "create" ? "创建" : "保存",
      destroyOnHidden: true,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Form, { form, layout: "vertical", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Form.Item,
          {
            label: "标题",
            name: "title",
            rules: [
              { required: true, whitespace: true, message: "请填写任务标题" },
              { max: 60, message: "标题不超过 60 字" }
            ],
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "例如：小红书每日发布", maxLength: 60, showCount: true })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "任务分类", name: "kind", rules: [{ required: true, message: "请选择分类" }], children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Segmented,
          {
            block: true,
            options: [
              { value: "normal", label: "普通任务" },
              { value: "workflow", label: "流程任务" }
            ]
          }
        ) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Form.Item,
          {
            label: "子流程",
            name: "workflowIds",
            hidden: kind !== "workflow",
            rules: kind === "workflow" ? [
              {
                validator: (_, value) => Array.isArray(value) && value.length > 0 ? Promise.resolve() : Promise.reject(new Error("请至少选择一个子流程"))
              }
            ] : void 0,
            extra: "可多选；运行时按选择顺序串行自动执行；仅当子流程含「等待确认」节点时才会暂停",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Select,
              {
                mode: "multiple",
                allowClear: true,
                placeholder: "选择一个或多个流程（顺序即执行顺序）",
                optionFilterProp: "label",
                options: workflows.map((w) => ({
                  value: w.id,
                  label: `${w.title}（${w.nodes.length} 步）`
                }))
              }
            )
          }
        ),
        kind !== "workflow" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", children: "保存后由子任务自动镜像为可执行流程，普通任务通过子任务配置渠道与内容说明" }) }) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Form.Item,
          {
            label: "计划结束通知",
            name: "notifyChannels",
            extra: "全部子任务结束后汇总通知；需在设置 → 渠道中配置飞书 Webhook 后可选",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Select,
              {
                mode: "multiple",
                allowClear: true,
                placeholder: "可选，选择通知渠道",
                options: notifyChannelOptions
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Form.Item,
          {
            label: "预设用户输入",
            name: "presetUserInput",
            extra: "有值时，执行本任务碰到流程「输入」节点直接采用该内容，不再等待人工输入（「等待确认」仍会暂停）",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input.TextArea,
              {
                rows: 3,
                placeholder: "例如：长江电力\n留空则仍按输入节点等待用户填写",
                maxLength: 2e3,
                showCount: true
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "说明", name: "description", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 3, placeholder: "可选，补充用途说明", maxLength: 200, showCount: true }) })
      ] })
    }
  );
}
function PublishWorkbench() {
  const plans = usePublishStore((s) => s.plans);
  const savePlan = usePublishStore((s) => s.savePlan);
  const removePlan = usePublishStore((s) => s.removePlan);
  const addBuiltinPlans = usePublishStore((s) => s.addBuiltinPlans);
  const workflows = useWorkflowsStore((s) => s.workflows);
  const hydrateWorkflows = useWorkflowsStore((s) => s.hydrate);
  const beginExternalRun = useSessionStore((s) => s.beginExternalRun);
  const hydrateSessions = useSessionStore((s) => s.hydrate);
  const setView = useAppStore((s) => s.setView);
  const channels = useChannelsStore((s) => s.channels);
  const enabledChannels = reactExports.useMemo(
    () => queryEnabledPublishChannelsFromStore(channels),
    [channels]
  );
  const enabledNotifyChannels = reactExports.useMemo(
    () => queryEnabledNotifyChannelsFromStore(channels),
    [channels]
  );
  const notifyChannelOptions = reactExports.useMemo(
    () => enabledNotifyChannels.map((c) => ({ value: c.id, label: c.label })),
    [enabledNotifyChannels]
  );
  const [kindFilter, setKindFilter] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const [detailOpen, setDetailOpen] = reactExports.useState(false);
  const [detailPlanId, setDetailPlanId] = reactExports.useState(null);
  const [planModal, setPlanModal] = reactExports.useState(null);
  const [subModal, setSubModal] = reactExports.useState(null);
  reactExports.useEffect(() => {
    void hydrateWorkflows();
  }, [hydrateWorkflows]);
  const filtered = reactExports.useMemo(() => {
    let list = plans;
    if (kindFilter !== "all") {
      list = list.filter((p) => (p.kind ?? "normal") === kindFilter);
    }
    return list.filter((p) => matchPlanQuery(p, search));
  }, [plans, kindFilter, search]);
  const detailPlan = reactExports.useMemo(() => {
    const plan = plans.find((p) => p.id === detailPlanId) ?? null;
    return plan ? normalizePublishPlan(plan) : null;
  }, [plans, detailPlanId]);
  const linkedWorkflows = reactExports.useMemo(() => {
    if (!detailPlan || detailPlan.kind !== "workflow") return [];
    return normalizePublishPlanWorkflowIds(detailPlan).map((id, index) => {
      const wf = workflows.find((w) => w.id === id);
      return {
        id,
        index,
        title: wf?.title ?? `未知流程（${id.slice(0, 8)}…）`,
        description: wf?.description ?? "",
        stepCount: wf?.nodes.length ?? 0,
        templateKind: wf?.templateKind,
        missing: !wf
      };
    });
  }, [detailPlan, workflows]);
  const openDetail = (id) => {
    setDetailPlanId(id);
    setDetailOpen(true);
  };
  const removeSubTask = async (subId) => {
    if (!detailPlan) return;
    const next = {
      ...detailPlan,
      subTasks: detailPlan.subTasks.filter((s) => s.id !== subId),
      updatedAt: Date.now()
    };
    await savePlan(next);
    if (subModal?.draft.id === subId) setSubModal(null);
    appMessage.success("已删除子任务");
  };
  const removeLinkedWorkflow = async (workflowId) => {
    if (!detailPlan || detailPlan.kind !== "workflow") return;
    const nextIds = normalizePublishPlanWorkflowIds(detailPlan).filter((id) => id !== workflowId);
    await savePlan({
      ...detailPlan,
      workflowIds: nextIds,
      updatedAt: Date.now()
    });
    appMessage.success("已移除子流程");
  };
  const runPlan = async (plan) => {
    const kind = plan.kind ?? "normal";
    try {
      await savePlan(plan);
      if (kind === "workflow") {
        if (!normalizePublishPlanWorkflowIds(plan).length) {
          appMessage.warning("请先关联至少一个子流程");
          return;
        }
      } else if (!plan.subTasks.length) {
        appMessage.warning("请先添加子任务");
        return;
      }
      const { sessionId } = await postRunWorkflow(plan.id, {
        presetUserInput: plan.presetUserInput
      });
      await hydrateSessions();
      beginExternalRun(sessionId);
      setView("chat");
      appMessage.success(
        kind === "workflow" ? "已按子流程顺序在主聊天窗口执行" : "已按子任务编排在主聊天窗口执行"
      );
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "启动发布失败");
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FeaturePageHeader,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}),
        title: "发布",
        badge: plans.length,
        description: "普通任务用子任务编排；流程任务可挂多个子流程并按序执行",
        extra: /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: async () => {
                await addBuiltinPlans();
                appMessage.success("已导入内置发布任务");
              },
              children: "导入示例"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "primary",
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}),
              onClick: () => {
                setPlanModal({ mode: "create", plan: createEmptyPlan("normal") });
              },
              children: "新建任务"
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageToolbar, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Segmented,
        {
          value: kindFilter,
          onChange: (v) => setKindFilter(v),
          options: [
            { label: "全部", value: "all" },
            { label: "普通任务", value: "normal" },
            { label: "流程任务", value: "workflow" }
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
            prefix: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}),
            placeholder: "搜索任务...",
            value: search,
            onChange: (e) => setSearch(e.target.value),
            className: styles.searchInput
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureScrollBody, { children: filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Empty,
      {
        image: Empty.PRESENTED_IMAGE_SIMPLE,
        description: plans.length === 0 ? "暂无发布任务" : "暂无匹配的任务",
        className: styles.empty,
        children: plans.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: async () => {
                await addBuiltinPlans();
                appMessage.success("已导入内置发布任务");
              },
              children: "导入示例"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              type: "primary",
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}),
              onClick: () => setPlanModal({ mode: "create", plan: createEmptyPlan("normal") }),
              children: "新建任务"
            }
          )
        ] }) : null
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.grid, children: filtered.map((plan, index) => {
      const kind = plan.kind ?? "normal";
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Card,
        {
          variant: "borderless",
          className: cardStyles.card,
          style: { "--card-index": index },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardHead, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { className: cardStyles.cardTitle, ellipsis: { tooltip: plan.title }, children: plan.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.tagRow, children: [
                  isBuiltinSeedId(plan.id) ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.mutedTag, children: "内置" }) : null,
                  kind === "workflow" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.primaryTag, children: "流程" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.mutedTag, children: "普通" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardActions, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "查看详情", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "text",
                    size: "small",
                    className: cardStyles.actionBtn,
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, {}),
                    "aria-label": `查看任务 ${plan.title}`,
                    onClick: () => openDetail(plan.id)
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "编辑任务", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "text",
                    size: "small",
                    className: cardStyles.actionBtn,
                    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
                    "aria-label": `编辑任务 ${plan.title}`,
                    onClick: () => setPlanModal({ mode: "edit", plan: normalizePublishPlan(plan) })
                  }
                ) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cardStyles.cardDescription, children: plan.description?.trim() || (kind === "workflow" ? "流程任务，使用右上角图标查看关联流程或编辑。" : "普通任务，使用右上角图标管理子任务与渠道。") }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardFooter, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Text, { type: "secondary", className: cardStyles.footerHint, children: [
                "@",
                queryPublishPlanKindLabel(kind)
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: cardStyles.metaLabel, children: kind === "workflow" ? `${normalizePublishPlanWorkflowIds(plan).length} 个子流程` : `${plan.subTasks.length} 子任务` })
            ] })
          ]
        },
        plan.id
      );
    }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        title: detailPlan?.title ?? "任务详情",
        open: detailOpen,
        onCancel: () => {
          setDetailOpen(false);
          setSubModal(null);
        },
        footer: null,
        width: 800,
        destroyOnHidden: true,
        className: styles.detailModal,
        children: !detailPlan ? /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "未找到任务详情" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.detailBody, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.detailHeader, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles.detailId, children: detailPlan.id }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.detailTags, children: [
                detailPlan.kind === "workflow" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: DB_THEME.primary, children: "流程任务" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { children: "普通任务" }),
                detailPlan.kind === "workflow" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { color: "processing", children: [
                  linkedWorkflows.length,
                  " 个子流程"
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { color: "processing", children: [
                  detailPlan.subTasks.length,
                  " 个子任务"
                ] }),
                (detailPlan.notifyChannels ?? []).map((ch) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { color: "cyan", children: [
                  "通知·",
                  queryPublishChannelLabel(ch)
                ] }, `plan-notify-${ch}`))
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
                  onClick: () => setPlanModal({ mode: "edit", plan: normalizePublishPlan(detailPlan) }),
                  children: "编辑"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "primary",
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
                  onClick: () => void runPlan(detailPlan),
                  children: "运行"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Popconfirm,
                {
                  title: "确定删除该发布任务？",
                  onConfirm: async () => {
                    await removePlan(detailPlan.id);
                    setDetailOpen(false);
                    setDetailPlanId(null);
                    appMessage.success("已删除");
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { danger: true, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$6, {}), children: "删除" })
                }
              )
            ] })
          ] }),
          detailPlan.description?.trim() ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles.description, children: detailPlan.description }) : null,
          detailPlan.kind === "workflow" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles.sectionLabel, children: "子流程（按序执行）" }),
            linkedWorkflows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              Empty,
              {
                image: Empty.PRESENTED_IMAGE_SIMPLE,
                description: "尚未关联子流程，请点击编辑多选"
              }
            ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.subList, children: [
              linkedWorkflows.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.subCard, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.subIndex, children: item.index + 1 }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.subBody, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.subTitleRow, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.subTitle, children: item.title }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Popconfirm,
                      {
                        title: "从本任务移除此子流程？",
                        description: "不会删除流程本身，仅取消关联",
                        onConfirm: () => void removeLinkedWorkflow(item.id),
                        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "link", size: "small", danger: true, children: "移除" })
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { size: 6, wrap: true, children: [
                    item.missing ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: "error", children: "流程不存在" }) : null,
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { children: [
                      item.stepCount,
                      " 步"
                    ] }),
                    item.templateKind ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { children: item.templateKind === "publish" ? "发布模板" : "通用" }) : null
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Paragraph, { type: "secondary", className: styles.subPrompt, children: item.description || "无流程说明" })
                ] })
              ] }, item.id)),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  block: true,
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
                  onClick: () => setPlanModal({
                    mode: "edit",
                    plan: normalizePublishPlan(detailPlan)
                  }),
                  children: "编辑子流程列表"
                }
              )
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles.sectionLabel, children: "子任务" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.subList, children: [
              detailPlan.subTasks.map((sub, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.subCard, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.subIndex, children: index + 1 }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.subBody, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.subTitleRow, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.subTitle, children: sub.title }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { size: 0, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Button,
                        {
                          type: "link",
                          size: "small",
                          onClick: () => setSubModal({
                            mode: "edit",
                            draft: normalizePublishSubTask(sub)
                          }),
                          children: "编辑"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        Popconfirm,
                        {
                          title: "确定删除该子任务？",
                          onConfirm: () => void removeSubTask(sub.id),
                          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "link", size: "small", danger: true, children: "删除" })
                        }
                      )
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { size: 6, wrap: true, children: [
                    sub.channels.map((ch) => /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { children: queryPublishChannelLabel(ch) }, ch)),
                    (sub.notifyChannels ?? []).map((ch) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Tag, { color: "cyan", children: [
                      "通知·",
                      queryPublishChannelLabel(ch)
                    ] }, `notify-${ch}`)),
                    sub.topic ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { children: sub.topic }) : null,
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: sub.autoPublish !== false ? "processing" : "default", children: sub.autoPublish !== false ? "自动发布" : "停在待发布" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Paragraph, { type: "secondary", className: styles.subPrompt, children: sub.contentPrompt || "未填写内容说明" })
                ] })
              ] }, sub.id)),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  block: true,
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}),
                  onClick: () => {
                    setSubModal({ mode: "create", draft: createEmptySubTask() });
                  },
                  children: "添加子任务"
                }
              )
            ] })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PlanEditModal,
      {
        open: Boolean(planModal),
        mode: planModal?.mode ?? "create",
        initialPlan: planModal?.plan ?? null,
        workflows,
        notifyChannelOptions,
        onCancel: () => setPlanModal(null),
        onSubmit: async (plan) => {
          const isCreate = planModal?.mode === "create";
          await savePlan(plan);
          setPlanModal(null);
          if (isCreate) {
            openDetail(plan.id);
          }
          appMessage.success(isCreate ? "已创建发布任务" : "已保存");
        }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        title: subModal?.mode === "create" ? "新建子任务" : "编辑子任务",
        open: Boolean(subModal) && Boolean(detailPlan) && detailPlan?.kind !== "workflow",
        onCancel: () => setSubModal(null),
        onOk: async () => {
          if (!detailPlan || !subModal) return;
          const { mode, draft } = subModal;
          if (!draft.channels.length) {
            appMessage.warning("请至少选择一个发布渠道");
            return;
          }
          const subTasks = mode === "create" ? [...detailPlan.subTasks, draft] : detailPlan.subTasks.map((s) => s.id === draft.id ? draft : s);
          await savePlan({
            ...detailPlan,
            subTasks,
            updatedAt: Date.now()
          });
          setSubModal(null);
          appMessage.success(mode === "create" ? "已添加子任务" : "已保存");
        },
        okText: subModal?.mode === "create" ? "添加" : "保存",
        destroyOnHidden: true,
        zIndex: 1100,
        children: subModal ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Form, { layout: "vertical", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "标题", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: subModal.draft.title,
              onChange: (e) => setSubModal({ ...subModal, draft: { ...subModal.draft, title: e.target.value } })
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "发布渠道", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Select,
            {
              mode: "multiple",
              value: subModal.draft.channels,
              onChange: (chs) => setSubModal({ ...subModal, draft: { ...subModal.draft, channels: chs } }),
              placeholder: "选择发布渠道，可多选",
              options: enabledChannels.map((c) => ({
                value: c.id,
                label: c.label
              }))
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "本任务结束通知",
              extra: "可选；在本子任务发布完成后额外通知，与计划结束通知可叠加",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Select,
                {
                  mode: "multiple",
                  allowClear: true,
                  value: subModal.draft.notifyChannels ?? [],
                  onChange: (chs) => setSubModal({
                    ...subModal,
                    draft: { ...subModal.draft, notifyChannels: chs }
                  }),
                  placeholder: "可选，选择通知渠道",
                  options: notifyChannelOptions
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "主题", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              value: subModal.draft.topic,
              onChange: (e) => setSubModal({ ...subModal, draft: { ...subModal.draft, topic: e.target.value } })
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { label: "内容说明", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input.TextArea,
            {
              rows: 4,
              value: subModal.draft.contentPrompt,
              onChange: (e) => setSubModal({
                ...subModal,
                draft: { ...subModal.draft, contentPrompt: e.target.value }
              })
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "自动发布",
              extra: "开启后填好内容会自动点发布；关闭则停在待发布。未登录时仍会暂停等人扫码。自动发布/流程按序连续执行，仅流程画布「等待确认」节点会暂停。",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Switch,
                {
                  checked: subModal.draft.autoPublish !== false,
                  onChange: (checked) => setSubModal({
                    ...subModal,
                    draft: { ...subModal.draft, autoPublish: checked }
                  })
                }
              )
            }
          )
        ] }) : null
      }
    )
  ] });
}
export {
  PublishWorkbench
};
