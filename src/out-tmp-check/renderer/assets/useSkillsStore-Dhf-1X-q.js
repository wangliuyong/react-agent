import { dk as create } from "./index-D2SMd1bE.js";
async function queryProjectSkills() {
  return window.api.queryProjectSkills();
}
async function queryProjectSkillDetail(id) {
  return window.api.queryProjectSkillDetail(id);
}
async function postSkillStates(states) {
  return window.api.postSkillStates(states);
}
async function postProjectSkill(input) {
  return window.api.postProjectSkill(input);
}
async function postDeleteProjectSkill(id) {
  return window.api.postDeleteProjectSkill(id);
}
async function querySkillTemplates() {
  return window.api.querySkillTemplates();
}
async function postInstallSkillTemplate(templateId, targetId) {
  return window.api.postInstallSkillTemplate(templateId, targetId);
}
async function querySkillImportPreview(url) {
  return window.api.querySkillImportPreview(url);
}
async function postImportSkillFromUrl(url, targetId) {
  return window.api.postImportSkillFromUrl(url, targetId);
}
async function postSummarizeSkillFromSession(sessionId) {
  return window.api.postSummarizeSkillFromSession(sessionId);
}
async function postRevealSkillDir(dirPath) {
  return window.api.postRevealPath(dirPath);
}
function createEmptySkill() {
  return {
    id: "",
    name: "my-skill",
    description: "描述该技能的用途与触发场景，供 Agent 自动发现。",
    content: `# 我的技能

## 适用场景

（在此描述何时使用该技能）

## 执行步骤

1. ...
2. ...
`,
    examplesContent: ""
  };
}
function skillDetailToInput(detail) {
  return {
    id: detail.id,
    name: detail.name,
    description: detail.description,
    content: detail.content,
    examplesContent: detail.examplesContent ?? ""
  };
}
function slugifySkillId(name) {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-").slice(0, 64);
  return slug || `skill-${Date.now()}`;
}
function isValidSkillId(id) {
  return /^[a-z0-9-]{1,64}$/.test(id) && !id.startsWith(".") && id !== "_templates";
}
const useSkillsStore = create((set, get) => ({
  skills: [],
  activeSkillId: null,
  detail: null,
  templates: [],
  loading: false,
  hydrate: async () => {
    set({ loading: true });
    try {
      const skills = await queryProjectSkills();
      const activeSkillId = skills[0]?.id ?? null;
      set({ skills, activeSkillId });
      if (activeSkillId) {
        const detail = await queryProjectSkillDetail(activeSkillId);
        set({ detail });
      }
    } finally {
      set({ loading: false });
    }
  },
  setActive: async (id) => {
    set({ activeSkillId: id, detail: null });
    if (!id) return;
    const detail = await queryProjectSkillDetail(id);
    set({ detail });
  },
  toggleEnabled: async (id, enabled) => {
    await postSkillStates({ [id]: { enabled } });
    set((s) => ({
      skills: s.skills.map((sk) => sk.id === id ? { ...sk, enabled } : sk),
      detail: s.detail?.id === id ? { ...s.detail, enabled } : s.detail
    }));
  },
  refresh: async () => {
    const { activeSkillId } = get();
    const skills = await queryProjectSkills();
    set({ skills });
    if (activeSkillId) {
      const detail = await queryProjectSkillDetail(activeSkillId);
      set({ detail });
    }
  },
  createSkillDraft: () => createEmptySkill(),
  saveSkill: async (input) => {
    const detail = await postProjectSkill(input);
    const skills = await queryProjectSkills();
    set({ skills, activeSkillId: detail.id, detail });
    return detail;
  },
  removeSkill: async (id) => {
    await postDeleteProjectSkill(id);
    set((s) => {
      const skills = s.skills.filter((sk) => sk.id !== id);
      const nextActiveId = s.activeSkillId === id ? skills[0]?.id ?? null : s.activeSkillId;
      return {
        skills,
        activeSkillId: nextActiveId,
        detail: s.detail?.id === id ? null : s.detail
      };
    });
    const { activeSkillId } = get();
    if (activeSkillId) {
      const detail = await queryProjectSkillDetail(activeSkillId);
      set({ detail });
    } else {
      set({ detail: null });
    }
  },
  loadTemplates: async () => {
    const templates = await querySkillTemplates();
    set({ templates });
    return templates;
  },
  installTemplate: async (templateId, targetId) => {
    const detail = await postInstallSkillTemplate(templateId, targetId);
    const skills = await queryProjectSkills();
    set({ skills, activeSkillId: detail.id, detail });
    return detail;
  },
  previewImport: async (url) => querySkillImportPreview(url),
  importFromUrl: async (url, targetId) => {
    const detail = await postImportSkillFromUrl(url, targetId);
    const skills = await queryProjectSkills();
    set({ skills, activeSkillId: detail.id, detail });
    return detail;
  },
  /** 本地 / 已解析的 JSON 技能批量写入（同 id 覆盖） */
  importFromJson: async (inputs, targetId) => {
    if (inputs.length === 0) {
      throw new Error("没有可导入的技能");
    }
    const normalizedTarget = targetId?.trim() ? inputs.length === 1 ? targetId.trim() : void 0 : void 0;
    const toWrite = inputs.length === 1 && normalizedTarget ? [{ ...inputs[0], id: normalizedTarget }] : inputs;
    let last = null;
    for (const input of toWrite) {
      last = await postProjectSkill(input);
    }
    if (!last) {
      throw new Error("导入失败");
    }
    const skills = await queryProjectSkills();
    set({ skills, activeSkillId: last.id, detail: last });
    return last;
  }
}));
export {
  postProjectSkill as a,
  postSkillStates as b,
  skillDetailToInput as c,
  postRevealSkillDir as d,
  isValidSkillId as i,
  postSummarizeSkillFromSession as p,
  queryProjectSkillDetail as q,
  slugifySkillId as s,
  useSkillsStore as u
};
