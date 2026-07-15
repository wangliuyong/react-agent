# 浏览器示例

## 示例：Profile 锁自动清理

```typescript
// service.ts launchWithRetry 内
releaseBrowserProfileLock()
await sleep(attempt === 1 ? 200 : 600)
this.context = await chromium.launchPersistentContext(profile, { ... })
```

## 示例：拟人点击

```typescript
import { humanClickLocator, humanTypeInto } from './human-input'

await humanClickLocator(page, page.getByPlaceholder('填写标题'))
await humanTypeInto(page, titleInput, title, { clearFirst: true })
```

## 示例：install-browser 镜像 URL 改写

官方：`.../builds/cft/{ver}/{platform}/chrome-*.zip`  
镜像：`https://cdn.npmmirror.com/binaries/chrome-for-testing/{ver}/{platform}/chrome-*.zip`
