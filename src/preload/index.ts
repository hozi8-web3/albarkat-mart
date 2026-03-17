import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  db: {
    run: (query: string, params?: any[]) => ipcRenderer.invoke('db:run', query, params),
    get: (query: string, params?: any[]) => ipcRenderer.invoke('db:get', query, params),
    all: (query: string, params?: any[]) => ipcRenderer.invoke('db:all', query, params)
  },
  auth: {
    hash: (text: string) => ipcRenderer.invoke('auth:hash', text),
    compare: (text: string, hash: string) => ipcRenderer.invoke('auth:compare', text, hash)
  },
  printReceipt: () => ipcRenderer.send('print-receipt'),
  receipt: {
    save: (invoiceNumber: string, html: string) => ipcRenderer.invoke('receipt:save', invoiceNumber, html),
    list: () => ipcRenderer.invoke('receipt:list'),
    openFolder: () => ipcRenderer.invoke('receipt:open-folder'),
    openFile: (filePath: string) => ipcRenderer.invoke('receipt:open-file', filePath),
    delete: (filePath: string) => ipcRenderer.invoke('receipt:delete', filePath),
    printFile: (filePath: string) => ipcRenderer.invoke('receipt:print-file', filePath),
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
