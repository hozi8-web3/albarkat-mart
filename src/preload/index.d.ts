import { ElectronAPI } from '@electron-toolkit/preload'

export interface DBResult {
  success: boolean
  error?: string
  info?: any
  row?: any
  rows?: any[]
}

export interface ReceiptFile {
  filename: string
  invoiceNumber: string
  createdAt: string
  filePath: string
  size: number
}

export interface AppAPI {
  db: {
    run: (query: string, params?: any[]) => Promise<DBResult>
    get: (query: string, params?: any[]) => Promise<DBResult>
    all: (query: string, params?: any[]) => Promise<DBResult>
  }
  auth: {
    hash: (text: string) => Promise<{ success: boolean; hash?: string; error?: string }>
    compare: (text: string, hash: string) => Promise<{ success: boolean; match?: boolean; error?: string }>
  }
  printReceipt: () => void
  receipt: {
    save: (invoiceNumber: string, html: string) => Promise<{ success: boolean; filePath?: string; error?: string }>
    list: () => Promise<{ success: boolean; files?: ReceiptFile[]; error?: string }>
    openFolder: () => Promise<{ success: boolean; error?: string }>
    openFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
    delete: (filePath: string) => Promise<{ success: boolean; error?: string }>
    printFile: (filePath: string) => Promise<{ success: boolean; error?: string }>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppAPI
  }
}
