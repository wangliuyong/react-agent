/**
 * Remotion 官方音效库（@remotion/sfx）CDN 地址目录。
 * 峰值已归一化至约 -3dB，可免署名使用（详见 https://www.remotion.dev/docs/sfx）。
 *
 * 按需使用：需要音效时再从此文件或 `@remotion/sfx` 按需 import，勿整库预加载。
 * 若使用 `import { whoosh } from '@remotion/sfx'`，须先调用 Agent 工具 `remotion_enable_sfx`。
 */

/** 单条音效元数据 */
export type RemotionSfxEntry = {
  /** 与 @remotion/sfx 导出同名的标识 */
  id: string
  /** remotion.media 直链 */
  url: string
  /** 中文场景说明，便于 Agent 选音 */
  label: string
}

/**
 * 官方音效列表（与 @remotion/sfx 4.x 导出一致）。
 * 键名使用 camelCase，与包导出命名对齐。
 */
export const REMOTION_SFX = {
  whoosh: {
    id: 'whoosh',
    url: 'https://remotion.media/whoosh.wav',
    label: '嗖声 / 转场'
  },
  whip: {
    id: 'whip',
    url: 'https://remotion.media/whip.wav',
    label: '鞭击 / 硬切'
  },
  pageTurn: {
    id: 'pageTurn',
    url: 'https://remotion.media/page-turn.wav',
    label: '翻页'
  },
  uiSwitch: {
    id: 'uiSwitch',
    url: 'https://remotion.media/switch.wav',
    label: '开关 / 切换'
  },
  mouseClick: {
    id: 'mouseClick',
    url: 'https://remotion.media/mouse-click.wav',
    label: '鼠标点击'
  },
  shutterModern: {
    id: 'shutterModern',
    url: 'https://remotion.media/shutter-modern.wav',
    label: '现代快门'
  },
  shutterOld: {
    id: 'shutterOld',
    url: 'https://remotion.media/shutter-old.wav',
    label: '复古快门'
  },
  ding: {
    id: 'ding',
    url: 'https://remotion.media/ding.wav',
    label: '提示叮声'
  },
  recordScratch: {
    id: 'recordScratch',
    url: 'https://remotion.media/record-scratch.wav',
    label: '唱片刮擦 / 戛然而止'
  },
  vineBoom: {
    id: 'vineBoom',
    url: 'https://remotion.media/vine-boom.wav',
    label: '重低音强调（梗）'
  },
  windowsXpError: {
    id: 'windowsXpError',
    url: 'https://remotion.media/windows-xp-error.wav',
    label: '系统错误提示'
  },
  bruh: {
    id: 'bruh',
    url: 'https://remotion.media/bruh.wav',
    label: '吐槽 bruh'
  },
  fah: {
    id: 'fah',
    url: 'https://remotion.media/fah.wav',
    label: '失败 fah'
  },
  spongebobFail: {
    id: 'spongebobFail',
    url: 'https://remotion.media/spongebob-fail.wav',
    label: '失败喜剧'
  },
  omgHellNah: {
    id: 'omgHellNah',
    url: 'https://remotion.media/omg-hell-nah.wav',
    label: '夸张否定'
  },
  priceIsRightFail: {
    id: 'priceIsRightFail',
    url: 'https://remotion.media/price-is-right-fail.wav',
    label: '答错提示'
  },
  romanceMeme: {
    id: 'romanceMeme',
    url: 'https://remotion.media/romance-meme.wav',
    label: '浪漫梗'
  },
  boneCrack: {
    id: 'boneCrack',
    url: 'https://remotion.media/bone-crack.wav',
    label: '骨骼碎裂'
  },
  animeWow: {
    id: 'animeWow',
    url: 'https://remotion.media/anime-wow.wav',
    label: '动漫惊叹'
  },
  yippee: {
    id: 'yippee',
    url: 'https://remotion.media/yippee.wav',
    label: '欢呼'
  },
  loadingLag: {
    id: 'loadingLag',
    url: 'https://remotion.media/loading-lag.wav',
    label: '加载卡顿'
  },
  wilhelmScream: {
    id: 'wilhelmScream',
    url: 'https://remotion.media/wilhelm-scream.wav',
    label: '经典尖叫'
  },
  macQuack: {
    id: 'macQuack',
    url: 'https://remotion.media/mac-quack.wav',
    label: 'Mac 报错鸭'
  },
  skedaddle: {
    id: 'skedaddle',
    url: 'https://remotion.media/skedaddle.wav',
    label: '溜走'
  },
  snapchatNotification: {
    id: 'snapchatNotification',
    url: 'https://remotion.media/snapchat-notification.wav',
    label: '通知音'
  },
  nellyAhh: {
    id: 'nellyAhh',
    url: 'https://remotion.media/nelly-ahh.wav',
    label: '惊叹 ahh'
  },
  sanctuaryGuardianWhat: {
    id: 'sanctuaryGuardianWhat',
    url: 'https://remotion.media/sanctuary-guardian-what.wav',
    label: '游戏 what 梗'
  },
  minecraftHurt: {
    id: 'minecraftHurt',
    url: 'https://remotion.media/minecraft-hurt.wav',
    label: 'MC 受伤'
  },
  ohMyGodVine: {
    id: 'ohMyGodVine',
    url: 'https://remotion.media/oh-my-god-vine.wav',
    label: 'OMG 梗'
  },
  illuminatiConfirmed: {
    id: 'illuminatiConfirmed',
    url: 'https://remotion.media/illuminati-confirmed.wav',
    label: '阴谋确认梗'
  },
  dramaticBoomer: {
    id: 'dramaticBoomer',
    url: 'https://remotion.media/dramatic-boomer.wav',
    label: '戏剧转折'
  },
  triggered: {
    id: 'triggered',
    url: 'https://remotion.media/triggered.wav',
    label: '触发强调'
  }
} as const satisfies Record<string, RemotionSfxEntry>

export type RemotionSfxId = keyof typeof REMOTION_SFX

/** 按 id 取 CDN URL，便于与 Sequence 帧对齐时拼路径 */
export function queryRemotionSfxUrl(id: RemotionSfxId): string {
  return REMOTION_SFX[id].url
}
