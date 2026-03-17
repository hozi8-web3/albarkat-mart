import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import * as fs from 'fs'
import * as path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import db, { initDb } from './db'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'Al-Barkat Mart POS',
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.albarkatmart.pos')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initDb()
  setupIpcHandlers()

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/* ── Receipt folder ── */
const getReceiptDir = () => {
  const dir = path.join(app.getPath('userData'), 'receipts')
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

function setupIpcHandlers() {
  /* ── DB handlers ── */
  ipcMain.handle('db:run', (_, query: string, params: any[] = []) => {
    try {
      const stmt = db.prepare(query)
      const info = stmt.run(...params)
      return { success: true, info }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:get', (_, query: string, params: any[] = []) => {
    try {
      const stmt = db.prepare(query)
      const row = stmt.get(...params)
      return { success: true, row }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('db:all', (_, query: string, params: any[] = []) => {
    try {
      const stmt = db.prepare(query)
      const rows = stmt.all(...params)
      return { success: true, rows }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  /* ── Auth handlers ── */
  ipcMain.handle('auth:hash', async (_, text: string) => {
    try {
      const bcrypt = require('bcryptjs')
      const hash = await bcrypt.hash(text, 10)
      return { success: true, hash }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('auth:compare', async (_, text: string, hash: string) => {
    try {
      const bcrypt = require('bcryptjs')
      const match = await bcrypt.compare(text, hash)
      return { success: true, match }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  /* ── Receipt: save HTML to disk ── */
  ipcMain.handle('receipt:save', (_, invoiceNumber: string, htmlContent: string) => {
    try {
      const dir = getReceiptDir()
      const filename = `${invoiceNumber.replace(/[^a-zA-Z0-9-_]/g, '_')}.html`
      const filePath = path.join(dir, filename)
      fs.writeFileSync(filePath, htmlContent, 'utf-8')
      return { success: true, filePath }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  /* ── Receipt: list saved receipts ── */
  ipcMain.handle('receipt:list', () => {
    try {
      const dir = getReceiptDir()
      const files = fs.readdirSync(dir)
        .filter(f => f.endsWith('.html'))
        .map(f => {
          const stat = fs.statSync(path.join(dir, f))
          return {
            filename: f,
            invoiceNumber: f.replace('.html', '').replace(/_/g, '-'),
            createdAt: stat.birthtime.toISOString(),
            filePath: path.join(dir, f),
            size: stat.size
          }
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return { success: true, files }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  /* ── Receipt: open folder in Explorer ── */
  ipcMain.handle('receipt:open-folder', () => {
    try {
      shell.openPath(getReceiptDir())
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  /* ── Receipt: open single receipt in browser/default viewer ── */
  ipcMain.handle('receipt:open-file', (_, filePath: string) => {
    try {
      shell.openPath(filePath)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  /* ── Receipt: delete receipt ── */
  ipcMain.handle('receipt:delete', (_, filePath: string) => {
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  /* ── Print (silent direct print to default printer) ── */
  ipcMain.on('print-receipt', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.webContents.print({ silent: true, printBackground: true }, (success, failureReason) => {
        if (!success) console.error('Print failed:', failureReason)
      })
    }
  })

  /* ── Print: open print preview window for a receipt file ── */
  ipcMain.handle('receipt:print-file', (_, filePath: string) => {
    try {
      const printWin = new BrowserWindow({
        width: 500,
        height: 700,
        show: false,
        title: 'Receipt',
        webPreferences: { contextIsolation: true }
      })
      printWin.loadFile(filePath)
      printWin.webContents.once('did-finish-load', () => {
        printWin.webContents.print({ silent: true, printBackground: true }, (_success) => {
          setTimeout(() => printWin.close(), 500)
        })
      })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })
}
