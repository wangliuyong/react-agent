const BUILTIN_ID_PREFIX = "builtin-";
function isBuiltinSeedId(id) {
  return id.startsWith(BUILTIN_ID_PREFIX);
}
export {
  isBuiltinSeedId as i
};
