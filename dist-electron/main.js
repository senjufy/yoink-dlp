import { app, ipcMain, dialog, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { spawn, execFile } from "child_process";
import fs from "node:fs";
import os from "node:os";
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
const historyFilePath = path.join(app.getPath("userData"), "downloads.json");
const readHistory = () => {
  try {
    if (fs.existsSync(historyFilePath)) {
      const history = fs.readFileSync(historyFilePath, "utf-8");
      return JSON.parse(history);
    }
  } catch (error) {
    console.error("Error reading history:", error);
  }
  return [];
};
const writeHistory = (history) => {
  try {
    fs.writeFileSync(historyFilePath, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error("Error writing history:", error);
  }
};
const addToHistory = (item) => {
  const history = readHistory();
  history.unshift(item);
  writeHistory(history);
};
function createWindow() {
  win = new BrowserWindow({
    title: "Yoink",
    // Set the application title here
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    autoHideMenuBar: true,
    // Hide the menubar
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
const ytdlpPath = app.isPackaged ? path.join(process.resourcesPath, "yt-dlp-x86_64-unknown-linux-gnu") : path.join(process.env.APP_ROOT, "resources", "yt-dlp-x86_64-unknown-linux-gnu");
const sanitizeFilename = (filename) => {
  return filename.replace(/[\\/:\*\?"<>\|]/g, "");
};
const getVideoTitle = (url) => {
  return new Promise((resolve, reject) => {
    execFile(ytdlpPath, ["--get-title", "--no-playlist", url], { timeout: 3e4 }, (error, stdout, stderr) => {
      if (error) {
        reject(`yt-dlp exited with error: ${error}. Stderr: ${stderr}`);
      } else {
        resolve(stdout.trim());
      }
    });
  });
};
ipcMain.on("download-video", async (_event, url, format) => {
  console.log("Received download request for:", url, "with format:", format);
  try {
    const title = await getVideoTitle(url);
    const sanitizedTitle = sanitizeFilename(title);
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: "Save Video",
      buttonLabel: "Save",
      defaultPath: `${sanitizedTitle}.mp4`
    });
    if (canceled || !filePath) {
      win == null ? void 0 : win.webContents.send("download-finished", "Download canceled.");
      return;
    }
    let ytdlpArgs = [url];
    if (format === "mp3") {
      ytdlpArgs.push("-x", "--audio-format", "mp3");
    } else {
      ytdlpArgs.push("-f", format);
    }
    ytdlpArgs.push("-o", filePath, "--progress", "--no-playlist");
    const ytdlp = spawn(ytdlpPath, ytdlpArgs);
    const tempDir = os.tmpdir();
    const logFilePath = path.join(tempDir, `yoink-download-${Date.now()}.log`);
    fs.writeFileSync(logFilePath, `Starting download for ${url}
`);
    let downloadTimer = null;
    let had403Error = false;
    const finalizeDownload = (message, success = true) => {
      if (downloadTimer) clearTimeout(downloadTimer);
      if (ytdlp.pid && !ytdlp.killed) {
        ytdlp.kill();
        fs.appendFileSync(logFilePath, `
yt-dlp process forcefully killed due to: ${message}
`);
      }
      if (success && filePath && title) {
        addToHistory({ title, filePath, url });
        win == null ? void 0 : win.webContents.send("download-finished", `${message}. Logs saved to: ${logFilePath}`);
      } else {
        win == null ? void 0 : win.webContents.send("download-finished", `Download failed: ${message}. Logs saved to: ${logFilePath}`);
      }
    };
    const resetDownloadTimer = () => {
      if (downloadTimer) clearTimeout(downloadTimer);
      downloadTimer = setTimeout(() => {
        finalizeDownload("Download finished (silence timeout).", true);
      }, 5e3);
    };
    resetDownloadTimer();
    ytdlp.stdout.on("data", (data) => {
      const logData = data.toString();
      win == null ? void 0 : win.webContents.send("download-progress", logData);
      fs.appendFileSync(logFilePath, logData);
      resetDownloadTimer();
    });
    ytdlp.stderr.on("data", (data) => {
      const logData = data.toString();
      if (logData.includes("HTTP Error 403: Forbidden")) {
        had403Error = true;
        win == null ? void 0 : win.webContents.send("download-warning", "Encountered HTTP Error 403: Forbidden, but download might continue.");
      }
      win == null ? void 0 : win.webContents.send("download-progress", logData);
      fs.appendFileSync(logFilePath, logData);
      resetDownloadTimer();
    });
    ytdlp.on("close", (code) => {
      fs.appendFileSync(logFilePath, `
Process closed with code: ${code}
`);
      if (downloadTimer) clearTimeout(downloadTimer);
      if (code === 0) {
        if (had403Error) {
          finalizeDownload("Download finished successfully with warnings (HTTP Error 403 encountered).", true);
        } else {
          finalizeDownload("Download finished successfully (process closed).", true);
        }
      } else {
        finalizeDownload(`child process exited with code ${code}`, false);
      }
    });
    ytdlp.on("error", (err) => {
      fs.appendFileSync(logFilePath, `
Process error: ${err.message}
`);
      if (downloadTimer) clearTimeout(downloadTimer);
      finalizeDownload(`Download process encountered an error: ${err.message}`, false);
    });
    ytdlp.on("exit", (code, signal) => {
      fs.appendFileSync(logFilePath, `
Process exited with code ${code} and signal ${signal}
`);
      if (downloadTimer) clearTimeout(downloadTimer);
    });
  } catch (error) {
    win == null ? void 0 : win.webContents.send("download-finished", `Error: ${error}`);
    console.error("Error during download process:", error);
  }
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
ipcMain.handle("get-download-history", () => {
  return readHistory();
});
ipcMain.on("clear-download-history", () => {
  writeHistory([]);
  win == null ? void 0 : win.webContents.send("history-cleared");
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
