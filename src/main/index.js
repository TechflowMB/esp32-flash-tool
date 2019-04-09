/**
 * Copyright (C) 2019 Aromajoin Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict'

import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import path from 'path'
import copyDefaultAssets from './copy_default_assets'
import spiFlashImage from './flash_image'
/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    minHeight: 780,
    minWidth: 800,
    show: false,
    icon: path.join(__static, '/images/512x512.png')
  })

  mainWindow.loadURL(winURL)

  // Refresh page via f5 button
  globalShortcut.register('f5', () => {
    mainWindow.reload()
  })

  globalShortcut.register('CommandOrControl+R', () => {
    mainWindow.reload()
  })

  // Hide menu bar
  mainWindow.setMenu(null)

  // Developer tool
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      mainWindow.show()
      mainWindow.focus()
    }, 200)
  })
}

app.on('ready', () => {
  copyDefaultAssets()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

ipcMain.on('reset-settings', (event) => {
  app.relaunch()
  app.quit()
})

ipcMain.on('spi-flash-image', (event, serialPort, initialOTADataBinPath,
  bootloaderBinPath, appBinPath, partitionsBinPath) => {
  let params = {
    before: 'default_reset',
    after: 'hard_reset',
    chip: 'esp32',
    port: serialPort,
    baudRate: 115200,
    flashMode: 'dio',
    compress: '-z',
    flashFreq: '80m',
    flashSize: '8MB',
    initialOTAIndex: '0xd000',
    initialOTADataBinPath: initialOTADataBinPath,
    bootloaderIndex: '0x1000',
    bootloaderBinPath: bootloaderBinPath,
    appIndex: '0x10000',
    appBinPath: appBinPath,
    partitionsTableIndex: '0x8000',
    partitionsBinPath: partitionsBinPath
  }
  spiFlashImage(mainWindow, params)
})
