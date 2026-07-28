import { r as reactExports, j as jsxRuntimeExports } from "./vendor-xyflow-C3K48oRM.js";
import { u as useSkillsStore, i as isValidSkillId, s as slugifySkillId, q as queryProjectSkillDetail, c as skillDetailToInput, d as postRevealSkillDir } from "./useSkillsStore-Dhf-1X-q.js";
import { S as SkillMarkdown } from "./SkillMarkdown-8re16Z8j.js";
import { I as Icon, d as _extends, a7 as Form, aB as FeaturePageHeader, a0 as Space, B as Button, am as RefIcon$3, z as appMessage, aD as RefIcon$4, af as RefIcon$5, ak as Segmented, al as shellStyles, a9 as Input, av as RefIcon$6, a4 as Select, S as Spin, ap as Empty, aM as cardStyles, ae as Card, T as Typography, aq as Tag, $ as Tooltip, ay as RefIcon$7, aN as RefIcon$8, a8 as Modal, aP as DB_THEME, at as Popconfirm, au as RefIcon$a, aT as Switch, ao as Drawer } from "./index-D2SMd1bE.js";
import { F as FeaturePageShell, a as FeatureScrollBody } from "./FeatureScrollBody-CxFpEk7V.js";
import { F as FeaturePageToolbar } from "./FeaturePageToolbar-CnaQ0apm.js";
import { R as RefIcon$2 } from "./ExportOutlined-BiYuV3Uy.js";
import { R as RefIcon$9 } from "./FolderOpenOutlined-CpyBDLdr.js";
import "./LazyChatMarkdown-P37oNEmY.js";
var DollarOutlined$1 = { "icon": { "tag": "svg", "attrs": { "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zm47.7-395.2l-25.4-5.9V348.6c38 5.2 61.5 29 65.5 58.2.5 4 3.9 6.9 7.9 6.9h44.9c4.7 0 8.4-4.1 8-8.8-6.1-62.3-57.4-102.3-125.9-109.2V263c0-4.4-3.6-8-8-8h-28.1c-4.4 0-8 3.6-8 8v33c-70.8 6.9-126.2 46-126.2 119 0 67.6 49.8 100.2 102.1 112.7l24.7 6.3v142.7c-44.2-5.9-69-29.5-74.1-61.3-.6-3.8-4-6.6-7.9-6.6H363c-4.7 0-8.4 4-8 8.7 4.5 55 46.2 105.6 135.2 112.1V761c0 4.4 3.6 8 8 8h28.4c4.4 0 8-3.6 8-8.1l-.2-31.7c78.3-6.9 134.3-48.8 134.3-124-.1-69.4-44.2-100.4-109-116.4zm-68.6-16.2c-5.6-1.6-10.3-3.1-15-5-33.8-12.2-49.5-31.9-49.5-57.3 0-36.3 27.5-57 64.5-61.7v124zM534.3 677V543.3c3.1.9 5.9 1.6 8.8 2.2 47.3 14.4 63.2 34.4 63.2 65.1 0 39.1-29.4 62.6-72 66.4z" } }] }, "name": "dollar", "theme": "outlined" };
var DollarOutlined = function DollarOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: DollarOutlined$1
  }));
};
var RefIcon$1 = /* @__PURE__ */ reactExports.forwardRef(DollarOutlined);
var ImportOutlined$1 = { "icon": { "tag": "svg", "attrs": { "fill-rule": "evenodd", "viewBox": "64 64 896 896", "focusable": "false" }, "children": [{ "tag": "path", "attrs": { "d": "M880 912H144c-17.7 0-32-14.3-32-32V144c0-17.7 14.3-32 32-32h360c4.4 0 8 3.6 8 8v56c0 4.4-3.6 8-8 8H184v656h656V520c0-4.4 3.6-8 8-8h56c4.4 0 8 3.6 8 8v360c0 17.7-14.3 32-32 32zM653.3 424.6l52.2 52.2a8.01 8.01 0 01-4.7 13.6l-179.4 21c-5.1.6-9.5-3.7-8.9-8.9l21-179.4c.8-6.6 8.9-9.4 13.6-4.7l52.4 52.4 256.2-256.2c3.1-3.1 8.2-3.1 11.3 0l42.4 42.4c3.1 3.1 3.1 8.2 0 11.3L653.3 424.6z" } }] }, "name": "import", "theme": "outlined" };
var ImportOutlined = function ImportOutlined2(props, ref) {
  return /* @__PURE__ */ reactExports.createElement(Icon, _extends({}, props, {
    ref,
    icon: ImportOutlined$1
  }));
};
var RefIcon = /* @__PURE__ */ reactExports.forwardRef(ImportOutlined);
function isValidSkillImportId(id) {
  return /^[a-z0-9-]{1,64}$/.test(id) && !id.startsWith(".") && id !== "_templates";
}
function slugifySkillImportId(raw) {
  const slug = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-").slice(0, 64);
  return slug || `skill-${Date.now()}`;
}
function parseSkillImportJson(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("JSON 解析失败，请检查文件内容");
  }
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) {
    throw new Error("JSON 为空，至少需要一条技能");
  }
  return items.map((item, index) => normalizeSkillImportItem(item, index));
}
function normalizeSkillImportItem(item, index) {
  const label = `第 ${index + 1} 条`;
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error(`${label}不是有效的技能对象`);
  }
  const o = item;
  const content = typeof o.content === "string" ? o.content.trim() : "";
  if (!content) {
    throw new Error(
      `${label}缺少 content 正文（旧版摘要导出无法导入，请先用新版「导出」生成完整 JSON）`
    );
  }
  const name = typeof o.name === "string" && o.name.trim() ? o.name.trim() : typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
  if (!name) {
    throw new Error(`${label}缺少 name`);
  }
  const description2 = typeof o.description === "string" && o.description.trim() ? o.description.trim() : "从 JSON 导入的技能";
  const idSource = typeof o.id === "string" && o.id.trim() ? o.id.trim() : slugifySkillImportId(name);
  const id = slugifySkillImportId(idSource);
  if (!isValidSkillImportId(id)) {
    throw new Error(`${label}技能 id「${id}」格式无效`);
  }
  const examplesRaw = o.examplesContent;
  const examplesContent = typeof examplesRaw === "string" && examplesRaw.trim() ? examplesRaw.trim() : void 0;
  return {
    id,
    name,
    description: description2,
    content,
    examplesContent
  };
}
const searchInput = "_searchInput_18hwx_3";
const sortSelect = "_sortSelect_18hwx_7";
const empty = "_empty_18hwx_11";
const loading = "_loading_18hwx_20";
const editDrawer = "_editDrawer_18hwx_28";
const editDrawerFooter = "_editDrawerFooter_18hwx_55";
const detailModal = "_detailModal_18hwx_62";
const detailBody = "_detailBody_18hwx_66";
const detailHeader = "_detailHeader_18hwx_72";
const detailId = "_detailId_18hwx_82";
const detailTags = "_detailTags_18hwx_92";
const dirPathRow = "_dirPathRow_18hwx_100";
const dirPathIcon = "_dirPathIcon_18hwx_122";
const dirPathText = "_dirPathText_18hwx_129";
const injectToggle = "_injectToggle_18hwx_140";
const injectLabel = "_injectLabel_18hwx_150";
const description = "_description_18hwx_156";
const markdown = "_markdown_18hwx_179";
const sectionLabel = "_sectionLabel_18hwx_183";
const examples = "_examples_18hwx_200";
const templateList = "_templateList_18hwx_205";
const templateCard = "_templateCard_18hwx_213";
const templateCardHeader = "_templateCardHeader_18hwx_218";
const templateId = "_templateId_18hwx_226";
const templateDesc = "_templateDesc_18hwx_231";
const importPreview = "_importPreview_18hwx_237";
const importPreviewDesc = "_importPreviewDesc_18hwx_243";
const importReasoning = "_importReasoning_18hwx_249";
const modalHint = "_modalHint_18hwx_255";
const importModalBody = "_importModalBody_18hwx_269";
const importJsonList = "_importJsonList_18hwx_273";
const styles = {
  searchInput,
  sortSelect,
  empty,
  loading,
  editDrawer,
  editDrawerFooter,
  detailModal,
  detailBody,
  detailHeader,
  detailId,
  detailTags,
  dirPathRow,
  dirPathIcon,
  dirPathText,
  injectToggle,
  injectLabel,
  description,
  markdown,
  sectionLabel,
  examples,
  templateList,
  templateCard,
  templateCardHeader,
  templateId,
  templateDesc,
  importPreview,
  importPreviewDesc,
  importReasoning,
  modalHint,
  importModalBody,
  importJsonList
};
const { Text } = Typography;
function matchSkillQuery(skill, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return skill.name.toLowerCase().includes(q) || skill.description.toLowerCase().includes(q) || skill.id.toLowerCase().includes(q);
}
function matchTemplateQuery(template, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return template.name.toLowerCase().includes(q) || template.description.toLowerCase().includes(q) || template.id.toLowerCase().includes(q);
}
function sortSkills(list, sort) {
  const next = [...list];
  switch (sort) {
    case "name_desc":
      return next.sort((a, b) => b.name.localeCompare(a.name, "zh-CN"));
    case "updated_desc":
      return next.sort((a, b) => b.updatedAt - a.updatedAt);
    default:
      return next.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  }
}
function sortTemplates(list, sort) {
  const next = [...list];
  if (sort === "name_desc") {
    return next.sort((a, b) => b.name.localeCompare(a.name, "zh-CN"));
  }
  return next.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}
function SkillStatusTag({ skill }) {
  if (!skill.enabled) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.warningTag, children: "草稿" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.successTag, children: "已启用" });
}
function SkillsPage() {
  const skills = useSkillsStore((s) => s.skills);
  const detail = useSkillsStore((s) => s.detail);
  const templates = useSkillsStore((s) => s.templates);
  const loading2 = useSkillsStore((s) => s.loading);
  const hydrate = useSkillsStore((s) => s.hydrate);
  const setActive = useSkillsStore((s) => s.setActive);
  const toggleEnabled = useSkillsStore((s) => s.toggleEnabled);
  const refresh = useSkillsStore((s) => s.refresh);
  const createSkillDraft = useSkillsStore((s) => s.createSkillDraft);
  const saveSkill = useSkillsStore((s) => s.saveSkill);
  const removeSkill = useSkillsStore((s) => s.removeSkill);
  const loadTemplates = useSkillsStore((s) => s.loadTemplates);
  const installTemplate = useSkillsStore((s) => s.installTemplate);
  const previewImport = useSkillsStore((s) => s.previewImport);
  const importFromUrl = useSkillsStore((s) => s.importFromUrl);
  const importFromJson = useSkillsStore((s) => s.importFromJson);
  const [tab, setTab] = reactExports.useState("all");
  const [scope, setScope] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const [sort, setSort] = reactExports.useState("name_asc");
  const [detailOpen, setDetailOpen] = reactExports.useState(false);
  const [detailLoading, setDetailLoading] = reactExports.useState(false);
  const [revealingDir, setRevealingDir] = reactExports.useState(false);
  const [editOpen, setEditOpen] = reactExports.useState(false);
  const [editMode, setEditMode] = reactExports.useState("create");
  const [editDraft, setEditDraft] = reactExports.useState(null);
  const [saving, setSaving] = reactExports.useState(false);
  const [templateOpen, setTemplateOpen] = reactExports.useState(false);
  const [templateLoading, setTemplateLoading] = reactExports.useState(false);
  const [installingId, setInstallingId] = reactExports.useState(null);
  const [installTargetIds, setInstallTargetIds] = reactExports.useState({});
  const [marketTemplatePreview, setMarketTemplatePreview] = reactExports.useState(null);
  const [importOpen, setImportOpen] = reactExports.useState(false);
  const [importUrl, setImportUrl] = reactExports.useState("");
  const [importTargetId, setImportTargetId] = reactExports.useState("");
  const [importPreview2, setImportPreview] = reactExports.useState(null);
  const [importJsonDrafts, setImportJsonDrafts] = reactExports.useState(null);
  const [importPreviewing, setImportPreviewing] = reactExports.useState(false);
  const [importing, setImporting] = reactExports.useState(false);
  const [exporting, setExporting] = reactExports.useState(false);
  const importFileInputRef = reactExports.useRef(null);
  const [form] = Form.useForm();
  reactExports.useEffect(() => {
    void hydrate();
  }, [hydrate]);
  reactExports.useEffect(() => {
    if (tab !== "market") return;
    void loadTemplates();
  }, [tab, loadTemplates]);
  const tabCount = reactExports.useMemo(() => {
    if (tab === "market") return templates.length;
    if (tab === "all") return skills.length;
    if (tab === "active") return skills.filter((s) => s.enabled).length;
    if (tab === "archived") return skills.filter((s) => !s.enabled).length;
    return skills.filter((s) => !s.isBuiltin).length;
  }, [tab, skills, templates]);
  const filteredSkills = reactExports.useMemo(() => {
    let list = skills;
    if (tab === "active") list = list.filter((s) => s.enabled);
    else if (tab === "archived") list = list.filter((s) => !s.enabled);
    else if (tab === "mine") list = list.filter((s) => !s.isBuiltin);
    if (scope === "platform") list = list.filter((s) => s.isBuiltin);
    else if (scope === "custom") list = list.filter((s) => !s.isBuiltin);
    list = list.filter((s) => matchSkillQuery(s, search));
    return sortSkills(list, sort);
  }, [skills, tab, scope, search, sort]);
  const filteredTemplates = reactExports.useMemo(() => {
    let list = templates.filter((t) => matchTemplateQuery(t, search));
    if (scope === "platform") {
      list = list;
    } else if (scope === "custom") {
      list = [];
    }
    return sortTemplates(list, sort);
  }, [templates, search, sort, scope]);
  const openCreate = () => {
    const draft = createSkillDraft();
    setEditMode("create");
    setEditDraft(draft);
    form.setFieldsValue(draft);
    setEditOpen(true);
  };
  const openEdit = () => {
    if (!detail) return;
    const draft = skillDetailToInput(detail);
    setEditMode("update");
    setEditDraft(draft);
    form.setFieldsValue(draft);
    setEditOpen(true);
  };
  const openSkillEdit = async (skillId) => {
    try {
      await setActive(skillId);
      const loaded = useSkillsStore.getState().detail;
      if (!loaded) {
        appMessage.error("未找到技能详情");
        return;
      }
      const draft = skillDetailToInput(loaded);
      setEditMode("update");
      setEditDraft(draft);
      form.setFieldsValue(draft);
      setEditOpen(true);
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "加载技能失败");
    }
  };
  const openSkillDetail = async (skillId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      await setActive(skillId);
    } finally {
      setDetailLoading(false);
    }
  };
  const handleRevealSkillDir = async () => {
    if (!detail?.dirPath) {
      appMessage.warning("未找到技能目录路径");
      return;
    }
    setRevealingDir(true);
    try {
      const result = await postRevealSkillDir(detail.dirPath);
      if (!result.ok) {
        appMessage.warning(result.error);
      }
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "无法打开技能目录");
    } finally {
      setRevealingDir(false);
    }
  };
  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const normalizedId = slugifySkillId(values.id);
      if (!isValidSkillId(normalizedId)) {
        appMessage.error("技能 id 仅允许小写字母、数字和连字符");
        return Promise.reject(new Error("validation"));
      }
      setSaving(true);
      await saveSkill({
        ...values,
        id: normalizedId,
        examplesContent: values.examplesContent?.trim() || void 0
      });
      appMessage.success(editMode === "create" ? "技能已创建" : "技能已更新");
      setEditOpen(false);
      setEditDraft(null);
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
      await removeSkill(id);
      appMessage.success("技能已删除");
      setDetailOpen(false);
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "删除失败");
    }
  };
  const openTemplateModal = async () => {
    setTemplateOpen(true);
    setTemplateLoading(true);
    try {
      const list = await loadTemplates();
      const ids = {};
      for (const t of list) {
        ids[t.id] = t.id;
      }
      setInstallTargetIds(ids);
    } finally {
      setTemplateLoading(false);
    }
  };
  const handleInstall = async (template) => {
    const targetId = installTargetIds[template.id]?.trim() || template.id;
    if (!isValidSkillId(targetId)) {
      appMessage.error("目标 id 格式无效");
      return;
    }
    setInstallingId(template.id);
    try {
      await installTemplate(template.id, targetId);
      appMessage.success(`已安装技能「${template.name}」`);
      setTemplateOpen(false);
      setMarketTemplatePreview(null);
      setTab("mine");
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "安装失败");
    } finally {
      setInstallingId(null);
    }
  };
  const openImportModal = () => {
    setImportUrl("");
    setImportTargetId("");
    setImportPreview(null);
    setImportJsonDrafts(null);
    setImportOpen(true);
  };
  const handleImportJsonFile = async (file) => {
    setImportPreviewing(true);
    setImportPreview(null);
    setImportJsonDrafts(null);
    try {
      const text = await file.text();
      const items = parseSkillImportJson(text);
      const first = items[0];
      setImportJsonDrafts(items);
      setImportUrl("");
      setImportTargetId(first.id);
      setImportPreview({
        url: "",
        method: "json",
        skillMdUrl: file.name,
        suggestedId: first.id,
        name: items.length === 1 ? first.name : `${items.length} 个技能`,
        description: items.length === 1 ? first.description : items.map((s) => s.name).join("、"),
        hasExamples: items.some((s) => Boolean(s.examplesContent?.trim())),
        reasoning: `本地文件「${file.name}」`,
        jsonItems: items.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          hasExamples: Boolean(s.examplesContent?.trim())
        }))
      });
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "JSON 解析失败");
    } finally {
      setImportPreviewing(false);
      if (importFileInputRef.current) {
        importFileInputRef.current.value = "";
      }
    }
  };
  const handleImportPreview = async () => {
    const url = importUrl.trim();
    if (!url) {
      appMessage.warning("请输入技能链接，或选择本地 JSON 文件");
      return;
    }
    setImportPreviewing(true);
    setImportPreview(null);
    setImportJsonDrafts(null);
    try {
      const preview = await previewImport(url);
      setImportPreview(preview);
      setImportTargetId(preview.suggestedId);
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "预览失败");
    } finally {
      setImportPreviewing(false);
    }
  };
  const handleImportConfirm = async () => {
    const jsonCount = importJsonDrafts?.length ?? importPreview2?.jsonItems?.length ?? 0;
    const isJsonMulti = importPreview2?.method === "json" && jsonCount > 1;
    const normalizedId = slugifySkillId(
      importTargetId.trim() || importPreview2?.suggestedId || ""
    );
    if (!importJsonDrafts && !importUrl.trim()) {
      appMessage.warning("请输入技能链接，或选择本地 JSON 文件");
      return Promise.reject(new Error("validation"));
    }
    if (!isJsonMulti && (!normalizedId || !isValidSkillId(normalizedId))) {
      appMessage.error("目标 id 格式无效，请使用小写字母、数字和连字符");
      return Promise.reject(new Error("validation"));
    }
    setImporting(true);
    try {
      if (importJsonDrafts) {
        await importFromJson(
          importJsonDrafts,
          isJsonMulti ? void 0 : normalizedId
        );
        appMessage.success(
          importJsonDrafts.length === 1 ? `已导入技能「${importPreview2?.name ?? normalizedId}」` : `已导入 ${importJsonDrafts.length} 个技能`
        );
      } else {
        await importFromUrl(importUrl.trim(), isJsonMulti ? void 0 : normalizedId);
        appMessage.success(
          importPreview2?.method === "json" && (importPreview2.jsonItems?.length ?? 0) > 1 ? `已导入 ${importPreview2.jsonItems?.length} 个技能` : `已导入技能「${importPreview2?.name ?? normalizedId}」`
        );
      }
      setImportOpen(false);
      setTab("mine");
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "导入失败");
      return Promise.reject(err instanceof Error ? err : new Error("import failed"));
    } finally {
      setImporting(false);
    }
  };
  const handleExport = async () => {
    if (skills.length === 0) {
      appMessage.warning("暂无技能可导出");
      return;
    }
    setExporting(true);
    try {
      const details = await Promise.all(skills.map((s) => queryProjectSkillDetail(s.id)));
      const payload = details.filter((d) => Boolean(d)).map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        content: d.content,
        examplesContent: d.examplesContent
      }));
      if (payload.length === 0) {
        appMessage.error("未能读取技能正文");
        return;
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `skills-export-${Date.now()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      appMessage.success(`已导出 ${payload.length} 个技能（完整 JSON）`);
    } catch (err) {
      appMessage.error(err instanceof Error ? err.message : "导出失败");
    } finally {
      setExporting(false);
    }
  };
  const importBusy = importing || importPreviewing;
  const importJsonMulti = importPreview2?.method === "json" && (importPreview2.jsonItems?.length ?? 0) > 1;
  const importLoadingTip = importing ? importPreview2?.method === "git_clone" ? "正在 git clone 并安装技能，请稍候…" : importPreview2?.method === "http_download" ? "正在下载并安装技能，请稍候…" : importPreview2?.method === "json" ? "正在写入 JSON 技能，请稍候…" : "正在导入技能，请稍候…" : "正在分析并预览技能…";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      FeaturePageHeader,
      {
        icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$5, {}),
        title: "技能",
        badge: skills.length,
        description: "将领域知识注入 Agent 系统提示",
        extra: /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}), onClick: openImportModal, children: "导入" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$2, {}), loading: exporting, onClick: () => void handleExport(), children: "导出" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$1, {}), onClick: () => void openTemplateModal(), children: "智能整理" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, {}), onClick: openCreate, children: "创建" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$4, {}),
              onClick: async () => {
                await refresh();
                appMessage.success("已刷新");
              },
              children: "刷新"
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(FeaturePageToolbar, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Segmented,
        {
          value: tab,
          onChange: (v) => setTab(v),
          options: [
            { label: "全部", value: "all" },
            { label: "活跃技能", value: "active" },
            { label: "已归档", value: "archived" },
            { label: "市场", value: "market" },
            { label: "我的", value: "mine" }
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Segmented,
        {
          value: scope,
          onChange: (v) => setScope(v),
          options: [
            { label: "全部", value: "all" },
            { label: "平台/公共", value: "platform" },
            { label: "我的", value: "custom" }
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: shellStyles.toolbarRight, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: shellStyles.resultCount, children: [
          tabCount,
          " 项"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            allowClear: true,
            prefix: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$6, {}),
            placeholder: "搜索技能...",
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
              { label: "名称 A→Z", value: "name_asc" },
              { label: "名称 Z→A", value: "name_desc" },
              { label: "最近更新", value: "updated_desc" }
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(FeatureScrollBody, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { spinning: loading2 && (tab === "market" ? templates.length === 0 : skills.length === 0), children: tab === "market" ? filteredTemplates.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Empty,
      {
        image: Empty.PRESENTED_IMAGE_SIMPLE,
        description: templateLoading ? "加载模板中…" : "暂无市场模板",
        className: styles.empty
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.grid, children: filteredTemplates.map((template, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        variant: "borderless",
        className: cardStyles.card,
        style: { "--card-index": index },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardHead, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { className: cardStyles.cardTitle, ellipsis: { tooltip: template.name }, children: template.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.tagRow, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.primaryTag, children: "模板" }) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.cardActions, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "查看详情", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "text",
                size: "small",
                className: cardStyles.actionBtn,
                icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$7, {}),
                "aria-label": `查看模板 ${template.name}`,
                onClick: () => setMarketTemplatePreview(template)
              }
            ) }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cardStyles.cardDescription, children: template.description || "暂无描述" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardFooter, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: cardStyles.footerHint, children: "@平台" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "link",
                size: "small",
                loading: installingId === template.id,
                onClick: (e) => {
                  e.stopPropagation();
                  void handleInstall(template);
                },
                children: "安装"
              }
            )
          ] })
        ]
      },
      template.id
    )) }) : filteredSkills.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Empty,
      {
        image: Empty.PRESENTED_IMAGE_SIMPLE,
        description: "暂无匹配的技能",
        className: styles.empty,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$3, {}), onClick: openCreate, children: "创建技能" })
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cardStyles.grid, children: filteredSkills.map((skill, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Card,
      {
        variant: "borderless",
        className: cardStyles.card,
        style: { "--card-index": index },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardHead, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardTitleBlock, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { className: cardStyles.cardTitle, ellipsis: { tooltip: skill.name }, children: skill.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.tagRow, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SkillStatusTag, { skill }),
                skill.isBuiltin ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { className: cardStyles.mutedTag, children: "内置" }) : null
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardActions, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "查看详情", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "text",
                  size: "small",
                  className: cardStyles.actionBtn,
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$7, {}),
                  "aria-label": `查看技能 ${skill.name}`,
                  onClick: () => void openSkillDetail(skill.id)
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "编辑技能", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  type: "text",
                  size: "small",
                  className: cardStyles.actionBtn,
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}),
                  "aria-label": `编辑技能 ${skill.name}`,
                  onClick: () => void openSkillEdit(skill.id)
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: cardStyles.cardDescription, children: skill.description || "暂无描述" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cardStyles.cardFooter, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: cardStyles.footerHint, children: skill.isBuiltin ? "@平台" : "@你" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Text, { type: "secondary", className: cardStyles.metaLabel, children: "0 次使用" })
          ] })
        ]
      },
      skill.id
    )) }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        title: marketTemplatePreview?.name ?? "模板详情",
        open: Boolean(marketTemplatePreview),
        onCancel: () => setMarketTemplatePreview(null),
        footer: marketTemplatePreview ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            type: "primary",
            loading: installingId === marketTemplatePreview.id,
            onClick: () => void handleInstall(marketTemplatePreview),
            children: "安装到项目"
          }
        ) : null,
        width: 560,
        destroyOnHidden: true,
        children: marketTemplatePreview ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles.description, children: marketTemplatePreview.description || "暂无描述" }) : null
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        title: detail?.name ?? "技能详情",
        open: detailOpen,
        onCancel: () => setDetailOpen(false),
        footer: null,
        width: 760,
        destroyOnHidden: true,
        className: styles.detailModal,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { spinning: detailLoading, children: !detail ? /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "未找到技能详情" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.detailBody, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.detailHeader, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles.detailId, children: detail.id }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.detailTags, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SkillStatusTag, { skill: detail }),
                detail.isBuiltin ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: DB_THEME.primary, children: "内置" }) : null,
                detail.hasExamples ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { children: "含示例" }) : null
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Button,
                {
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$9, {}),
                  loading: revealingDir,
                  onClick: () => void handleRevealSkillDir(),
                  children: "打开目录"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$8, {}), onClick: openEdit, children: "编辑" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Popconfirm,
                {
                  title: detail.isBuiltin ? "这是项目内置技能，删除可能影响 Agent 行为，确定删除？" : "确定删除该技能？",
                  onConfirm: () => void handleDelete(detail.id),
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { danger: true, icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$a, {}), children: "删除" })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.injectToggle, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: styles.injectLabel, children: "注入 Agent" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Switch,
                  {
                    checked: detail.enabled,
                    onChange: (v) => void toggleEnabled(detail.id, v)
                  }
                )
              ] })
            ] })
          ] }),
          detail.dirPath ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: styles.dirPathRow,
              title: "在文件管理器中打开",
              onClick: () => void handleRevealSkillDir(),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon$9, { className: styles.dirPathIcon, "aria-hidden": true }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles.dirPathText, children: detail.dirPath })
              ]
            }
          ) : null,
          detail.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles.description, children: detail.description }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.markdown, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SkillMarkdown, { source: detail.content }) }),
          detail.examplesContent ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.examples, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: styles.sectionLabel, children: "示例" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SkillMarkdown, { source: detail.examplesContent })
          ] }) : null
        ] }) })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Drawer,
      {
        title: editMode === "create" ? "新建技能" : "编辑技能",
        placement: "right",
        width: "69vw",
        open: editOpen,
        onClose: () => {
          setEditOpen(false);
          setEditDraft(null);
        },
        destroyOnHidden: true,
        zIndex: 1200,
        className: styles.editDrawer,
        footer: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.editDrawerFooter, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              onClick: () => {
                setEditOpen(false);
                setEditDraft(null);
              },
              children: "取消"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "primary", loading: saving, onClick: () => void handleSave(), children: "保存" })
        ] }),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Form,
          {
            form,
            layout: "vertical",
            initialValues: editDraft ?? void 0,
            disabled: saving,
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
                  extra: "仅小写字母、数字、连字符，如 my-xhs-skill",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { disabled: editMode === "update", placeholder: "my-skill" })
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
                        if (editMode === "create") {
                          form.setFieldValue("id", slugifySkillId(e.target.value));
                        }
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
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 14, placeholder: "# 技能标题\n\n## 步骤..." })
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Form.Item, { name: "examplesContent", label: "示例（可选，Markdown）", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input.TextArea, { rows: 6, placeholder: "# 示例\n..." }) })
            ]
          },
          editDraft ? `${editMode}-${editDraft.id || "new"}` : "closed"
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        title: "从模板安装",
        open: templateOpen,
        onCancel: () => setTemplateOpen(false),
        footer: null,
        width: 640,
        destroyOnHidden: true,
        children: templateLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.loading, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { tip: "加载模板..." }) }) : templates.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Empty, { description: "未找到内置模板（resources/skill-templates）" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: styles.templateList, children: templates.map((template) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { size: "small", className: styles.templateCard, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.templateCardHeader, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: template.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: styles.templateId, children: template.id })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                type: "primary",
                size: "small",
                loading: installingId === template.id,
                onClick: () => void handleInstall(template),
                children: "安装"
              }
            )
          ] }),
          template.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles.templateDesc, children: template.description }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              size: "small",
              addonBefore: "目标 ID",
              value: installTargetIds[template.id] ?? template.id,
              onChange: (e) => setInstallTargetIds((prev) => ({
                ...prev,
                [template.id]: e.target.value
              })),
              placeholder: template.id
            }
          )
        ] }, template.id)) })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Modal,
      {
        title: "导入技能",
        open: importOpen,
        onCancel: () => setImportOpen(false),
        onOk: handleImportConfirm,
        okText: "导入",
        confirmLoading: importing,
        closable: !importBusy,
        maskClosable: !importBusy,
        okButtonProps: { disabled: importPreviewing || !importPreview2 },
        cancelButtonProps: { disabled: importBusy },
        width: 640,
        destroyOnHidden: true,
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(Spin, { spinning: importBusy, tip: importLoadingTip, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: styles.importModalBody, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: styles.modalHint, children: [
            "支持 Git / HTTP 直链，以及技能 JSON（本地文件或以 ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: ".json" }),
            " 结尾的 URL）。JSON 可为单个对象或数组，字段含",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: "id / name / description / content" }),
            "。"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: importFileInputRef,
              type: "file",
              accept: "application/json,.json",
              style: { display: "none" },
              onChange: (e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportJsonFile(file);
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Space, { wrap: true, style: { marginBottom: 16 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Button,
            {
              icon: /* @__PURE__ */ jsxRuntimeExports.jsx(RefIcon, {}),
              disabled: importBusy,
              onClick: () => importFileInputRef.current?.click(),
              children: "选择 JSON 文件"
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Space.Compact, { style: { width: "100%", marginBottom: 16 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                placeholder: "Git / SKILL.md 链接，或 https://…/skills.json",
                value: importUrl,
                disabled: importBusy,
                onChange: (e) => {
                  setImportUrl(e.target.value);
                  setImportPreview(null);
                  setImportJsonDrafts(null);
                },
                onPressEnter: () => void handleImportPreview()
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                loading: importPreviewing,
                disabled: importing,
                onClick: () => void handleImportPreview(),
                children: "预览"
              }
            )
          ] }),
          importPreview2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { size: "small", className: styles.importPreview, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: importPreview2.name }),
            importPreview2.description ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles.importPreviewDesc, children: importPreview2.description }) : null,
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Space, { wrap: true, size: 4, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Tag,
                {
                  color: importPreview2.method === "git_clone" ? DB_THEME.primary : importPreview2.method === "json" ? "processing" : "default",
                  children: importPreview2.method === "git_clone" ? "Git Clone" : importPreview2.method === "json" ? "JSON" : "HTTP 下载"
                }
              ),
              importPreview2.hasExamples ? /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { children: "含示例" }) : null,
              /* @__PURE__ */ jsxRuntimeExports.jsx(Tag, { color: "success", children: "可导入" })
            ] }),
            importPreview2.reasoning ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: styles.importReasoning, children: importPreview2.reasoning }) : null,
            importPreview2.jsonItems && importPreview2.jsonItems.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: styles.importJsonList, children: importPreview2.jsonItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { children: item.id }),
              " · ",
              item.name,
              item.hasExamples ? "（含示例）" : ""
            ] }, item.id)) }) : null
          ] }) : null,
          /* @__PURE__ */ jsxRuntimeExports.jsx(Form, { layout: "vertical", style: { marginTop: 16 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            Form.Item,
            {
              label: "目标 ID（安装目录名）",
              extra: importJsonMulti ? "多条 JSON 将使用各自的 id，此项不生效" : "仅小写字母、数字、连字符；与 .cursor/skills/<id> 对应",
              required: !importJsonMulti,
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  value: importTargetId,
                  disabled: importBusy || importJsonMulti,
                  onChange: (e) => setImportTargetId(slugifySkillId(e.target.value)),
                  placeholder: "my-skill"
                }
              )
            }
          ) })
        ] }) })
      }
    )
  ] });
}
export {
  SkillsPage
};
