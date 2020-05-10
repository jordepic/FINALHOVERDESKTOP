/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';

let close = false;

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  // process.env.NODE_ENV === 'development' ||
  // process.env.DEBUG_PROD === 'true'
  true
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    minHeight: 728,
    minWidth: 1024,
    frame: false,
    titleBarStyle: "hidden",
    title: "HoverGG",
    icon: path.join(__dirname, 'Assets/desktopicon.png'),
    webPreferences:
      process.env.NODE_ENV === 'development' || process.env.E2E_BUILD === 'true'
        ? {
            nodeIntegration: true
          }
        : {
            preload: path.join(__dirname, 'dist/renderer.prod.js')
          }
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('minimize',(event) => {
    event.preventDefault();
  });

  mainWindow.on('close', (event) => {
    if (!close) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
});

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

let tray : Tray | null = null;

app.on('ready', () => {
  // var monitor = require('active-window');
  // var _ = require('lodash');
  // var ps = require('current-processes');

  // let callback = function(window){
  // try {

  //   let cpuTop = false;
  //   let memTop = false;

  //   ps.get(function(err, processes) {
  //     var sortedCPU = _.sortBy(processes, 'cpu');
  //     var top5CPU  = sortedCPU.reverse().splice(0, 1);
  //     var sortedMEM = _.sortBy(processes, 'mem.usage');
  //     var top5MEM  = sortedMEM.reverse().splice(0, 1);
  //     console.log(top5CPU);
  //     console.log(top5MEM);
  //     for (const process of top5CPU) {
  //       if (process.name === window.app) {
  //         cpuTop = true;
  //       }
  //     }
  //     for (const process of top5MEM) {
  //       if (process.name === window.app) {
  //         memTop = true;
  //       }
  //     }
  //     console.log("App: " + window.app);
  //     console.log("Title: " + window.title);
  //     console.log(cpuTop);
  //     console.log(memTop);
  //   });
  //   }catch(err) {
  //     console.log(err);
  //   }
  // }

  // monitor.getActiveWindow(callback, -1, 30);

  createWindow();
  const trayIcon = path.join(__dirname, 'Assets/tray.png');
  const nimage = nativeImage.createFromPath(trayIcon);
  tray = new Tray(nimage);
  tray.setToolTip('HoverGG')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click:  function(){
        mainWindow.show();
    } },
    { label: 'Quit', click:  function(){
        close = true;
        app.quit();
        if (tray !== null) {
          tray.destroy();
        }
    } }
  ]);
  tray.setContextMenu(contextMenu)
  tray.on('click', () => {
    mainWindow.show();
  })
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

const { session } = require('electron')

ipcMain.on('auth-token-store', (event, arg) => {
  const cookie = { url: 'https://hover.gg', name: 'refresh_token', value: arg, expirationDate: (new Date(new Date().setFullYear(new Date().getFullYear() + 1))).getTime()/1000 }
  session.defaultSession.cookies.set(cookie)
  .then(() => {
  })
})

ipcMain.on('auth-token-fetch', (event) => {
  session.defaultSession.cookies.get({ url: 'https://hover.gg', name: 'refresh_token' })
  .then((cookie) => {
    event.reply('auth-token-fetch-reply', cookie[0].value)
  })
  .catch((error) => {
    console.log(error)
  })
})

ipcMain.on('auth-token-remove', (event) => {
  session.defaultSession.cookies.remove( 'https://hover.gg', 'refresh_token' )
  .then(() => {
    event.reply('auth-token-remove-reply')
  })
})

const { dialog } = require('electron');

ipcMain.on('open-directory-chooser', (event) => {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }).then(path => {
    if(path.filePaths !== []){

      const options = {
        type: 'question',
        buttons: ['Cancel', 'Yes, please', 'No, thanks'],
        defaultId: 2,
        title: 'Question',
        message: 'Upload existing clips in this directory (and subdirectories)?',
      }
      let index = dialog.showMessageBoxSync(options);

      if (index === 1 || index === 2) {
        const cookie = { url: 'https://hover.gg', name: 'clip_path', value: path.filePaths[0], expirationDate: (new Date(new Date().setFullYear(new Date().getFullYear() + 1))).getTime()/1000 }
        session.defaultSession.cookies.set(cookie)
        .then(() => {
        index === 1 ? event.reply('open-directory-chooser-reply', true) : event.reply('open-directory-chooser-reply', false);
        })
        .catch((error) => {
          console.log(error)
        })
      }
    }
  })
})

ipcMain.on('clip-path-fetch', (event, arg) => {
  session.defaultSession.cookies.get({ url: 'https://hover.gg', name: 'clip_path' })
  .then((cookie) => {
    event.reply('clip-path-fetch-reply', cookie[0].value);
    event.reply('start-watcher', {path: cookie[0].value, uploadExisting: arg});
  })
  .catch((error) => {
    console.log(error)
  })
})

ipcMain.on('ffmpeg-path-fetch', (event) => {
  var ffmpeg = require('ffmpeg-static-electron').path.replace('app.asar', 'app.asar.unpacked');
  var ffprobe = require('ffprobe-static-electron').path.replace('app.asar', 'app.asar.unpacked');
  //var pathToFfmpeg = require('ffmpeg-static');
  let response = {ffmpeg, ffprobe}
  event.reply('ffmpeg-path-reply', response);
})

var AutoLaunch = require('auto-launch');
var hoverAutoLauncher = new AutoLaunch({
    name: 'Hover.gg',
    isHidden: true
});

hoverAutoLauncher.enable();

hoverAutoLauncher.isEnabled()
.then(function(isEnabled){
    if(isEnabled){
        return;
    }
    hoverAutoLauncher.enable();
})
.catch(function(err){
    // handle error
});

