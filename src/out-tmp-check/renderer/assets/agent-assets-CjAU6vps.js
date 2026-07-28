const AGENT_ASSET_ZONE_LABELS = {
  artifacts: "通用产物",
  "videos/scenes": "场景素材",
  "videos/projects": "视频项目",
  "videos/other": "视频"
};
const AGENT_ASSET_KIND_LABELS = {
  image: "图片",
  video: "视频",
  audio: "音频",
  html: "网页",
  document: "文档",
  other: "其他"
};
function queryFormatAssetSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
export {
  AGENT_ASSET_KIND_LABELS as A,
  AGENT_ASSET_ZONE_LABELS as a,
  queryFormatAssetSize as q
};
