async function queryBrowserStatus() {
  return window.api.queryBrowserStatus();
}
async function postBrowserStart() {
  return window.api.postBrowserStart();
}
async function postBrowserClose() {
  return window.api.postBrowserClose();
}
export {
  postBrowserStart as a,
  postBrowserClose as p,
  queryBrowserStatus as q
};
