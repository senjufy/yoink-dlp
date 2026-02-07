import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { spawn, execFile } from 'child_process'
import fs from 'node:fs'
import os from 'node:os'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

const historyFilePath = path.join(app.getPath('userData'), 'downloads.json');

interface DownloadHistoryItem {
  title: string;
  filePath: string;
  url: string;
}

const readHistory = (): DownloadHistoryItem[] => {
  try {
    if (fs.existsSync(historyFilePath)) {
      const history = fs.readFileSync(historyFilePath, 'utf-8');
      return JSON.parse(history);
    }
  } catch (error) {
    console.error('Error reading history:', error);
  }
  return [];
};

const writeHistory = (history: DownloadHistoryItem[]) => {
  try {
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Error writing history:', error);
  }
};

const addToHistory = (item: DownloadHistoryItem) => {
  const history = readHistory();
  history.unshift(item); // Add to the beginning of the list
  writeHistory(history);
};

function createWindow() {
  win = new BrowserWindow({
    title: 'Yoink', // Set the application title here
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    autoHideMenuBar: true, // Hide the menubar
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

const ytdlpPath = app.isPackaged
  ? path.join(process.resourcesPath, 'yt-dlp-x86_64-unknown-linux-gnu')
  : path.join(process.env.APP_ROOT, 'resources', 'yt-dlp-x86_64-unknown-linux-gnu');

const sanitizeFilename = (filename: string) => {
  return filename.replace(/[\\/:\*\?"<>\|]/g, '');
}

const getVideoTitle = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    execFile(ytdlpPath, ['--get-title', '--no-playlist', url], { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject(`yt-dlp exited with error: ${error}. Stderr: ${stderr}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
};

ipcMain.on('download-video', async (_event, url, format) => {
  console.log('Received download request for:', url, 'with format:', format);
  try {
    const title = await getVideoTitle(url);
    const sanitizedTitle = sanitizeFilename(title);

    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Video',
      buttonLabel: 'Save',
      defaultPath: `${sanitizedTitle}.mp4`,
    });

    if (canceled || !filePath) {
      win?.webContents.send('download-finished', 'Download canceled.');
      return;
    }

    let ytdlpArgs: string[] = [url];

    // Add format-specific arguments
    if (format === 'mp3') {
      ytdlpArgs.push('-x', '--audio-format', 'mp3');
    } else {
      ytdlpArgs.push('-f', format);
    }
    
    // Add common arguments
    ytdlpArgs.push('-o', filePath, '--progress', '--no-playlist');

    const ytdlp = spawn(ytdlpPath, ytdlpArgs);

    const tempDir = os.tmpdir();
    const logFilePath = path.join(tempDir, `yoink-download-${Date.now()}.log`);
    fs.writeFileSync(logFilePath, `Starting download for ${url}\n`);

    let downloadTimer: NodeJS.Timeout | null = null;
    let had403Error: boolean = false; // Flag to track 403 errors

    const finalizeDownload = (message: string, success: boolean = true) => {
      if (downloadTimer) clearTimeout(downloadTimer);
      if (ytdlp.pid && !ytdlp.killed) {
        ytdlp.kill();
        fs.appendFileSync(logFilePath, `\nyt-dlp process forcefully killed due to: ${message}\n`);
      }
      if (success && filePath && title) {
        addToHistory({ title, filePath, url });
        win?.webContents.send('download-finished', `${message}. Logs saved to: ${logFilePath}`);
      } else {
        win?.webContents.send('download-finished', `Download failed: ${message}. Logs saved to: ${logFilePath}`);
      }
    };

    const resetDownloadTimer = () => {
      if (downloadTimer) clearTimeout(downloadTimer);
      downloadTimer = setTimeout(() => {
        finalizeDownload('Download finished (silence timeout).', true);
      }, 5000); // 5 seconds of silence
    };

    resetDownloadTimer(); // Start the timer when download begins

    ytdlp.stdout.on('data', (data) => {
      const logData = data.toString();
      win?.webContents.send('download-progress', logData);
      fs.appendFileSync(logFilePath, logData);
      resetDownloadTimer(); // Reset timer on output
    });

    ytdlp.stderr.on('data', (data) => {
      const logData = data.toString();
      if (logData.includes('HTTP Error 403: Forbidden')) {
        had403Error = true;
        // Optionally, send a specific warning to the renderer without stopping progress
        win?.webContents.send('download-warning', 'Encountered HTTP Error 403: Forbidden, but download might continue.');
      }
      win?.webContents.send('download-progress', logData);
      fs.appendFileSync(logFilePath, logData);
      resetDownloadTimer(); // Reset timer on output
    });

    ytdlp.on('close', (code) => {
      fs.appendFileSync(logFilePath, `\nProcess closed with code: ${code}\n`);
      if (downloadTimer) clearTimeout(downloadTimer); // Clear timer as process is truly closed
      if (code === 0) {
        if (had403Error) {
          finalizeDownload('Download finished successfully with warnings (HTTP Error 403 encountered).', true);
        } else {
          finalizeDownload('Download finished successfully (process closed).', true);
        }
      } else {
        finalizeDownload(`child process exited with code ${code}`, false);
      }
    });

    ytdlp.on('error', (err) => {
      fs.appendFileSync(logFilePath, `\nProcess error: ${err.message}\n`);
      if (downloadTimer) clearTimeout(downloadTimer); // Clear timer on error
      finalizeDownload(`Download process encountered an error: ${err.message}`, false);
    });

    ytdlp.on('exit', (code, signal) => {
      fs.appendFileSync(logFilePath, `\nProcess exited with code ${code} and signal ${signal}\n`);
      if (downloadTimer) clearTimeout(downloadTimer); // Clear timer on exit
    });
  } catch (error) {
    win?.webContents.send('download-finished', `Error: ${error}`);
    console.error('Error during download process:', error);
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('get-download-history', () => {
  return readHistory();
});

ipcMain.on('clear-download-history', () => {
  writeHistory([]);
  win?.webContents.send('history-cleared');
});

app.whenReady().then(createWindow)