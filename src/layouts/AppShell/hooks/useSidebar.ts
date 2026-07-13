import { useAppStore } from '@/stores/app-store'

/** 侧边栏折叠态：读写全局 store，供 Sidebar 容器使用 */
export function useSidebar() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useAppStore((s) => s.toggleSidebar)

  return { sidebarCollapsed, toggleSidebar }
}
