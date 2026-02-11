/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
  /** Scheduler filesystem API — exposed via contextBridge */
  api: {
    readFile(relativePath: string): Promise<string>
    writeFile(relativePath: string, content: string): Promise<void>
    fileExists(relativePath: string): Promise<boolean>
    ensureDir(relativePath: string): Promise<void>
    getDataPath(): Promise<string>
  }
}
