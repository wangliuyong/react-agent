function queryNormalizeMarkdownImageSrc(src) {
  const trimmed = String(src ?? "").trim().replace(/^["'`]+|["'`]+$/g, "").replace(/[，,;；]+$/g, "");
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}
function queryIsLocalAbsPath(src) {
  if (!src || src.startsWith("//")) return false;
  return src.startsWith("/") || /^[A-Za-z]:[\\/]/.test(src);
}
function queryFormatMarkdownImage(alt, src) {
  const path = queryNormalizeMarkdownImageSrc(src);
  const safeAlt = String(alt ?? "").replace(/[\[\]]/g, "");
  const needsBracket = queryIsLocalAbsPath(path) && /[\s()<>]/.test(path);
  const dest = needsBracket ? `<${path}>` : path;
  return `![${safeAlt}](${dest})`;
}
export {
  queryFormatMarkdownImage as a,
  queryNormalizeMarkdownImageSrc as q
};
