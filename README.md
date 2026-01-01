# Yoink ⚡

**A profound, modern GUI experience for `yt-dlp`.**

Yoink re-imagines the video downloading experience. While the powerful `yt-dlp` command-line tool handles the heavy lifting, Yoink provides a sleek, responsive, and beautiful interface designed for humans, not just terminals.

## 🖼️ Preview

<p align="center">
  <img src="/public/Screens/Main.png" alt="Yoink Main Interface" />
</p>

> **Design Highlight:** Yoink features a surgical-grade glass-morphism UI that adapts to your desktop environment, providing a high-fidelity experience that looks native on modern OSs like Fedora and Windows 11.

## 💎 Features
* **URL Input & Download:** Easily paste video URLs and initiate downloads with a click.
* **Format Selection:** Choose desired video and audio formats, resolution, and quality before downloading.
* **Automatic Title Fetching:** Automatically fetches the video title to suggest a filename, streamlining the saving process.
* **Real-time Progress:** Live updates on download progress, including percentage, speed, and estimated time.
* **Log Viewer:** Detailed logs from `yt-dlp` are displayed in real-time for transparency and debugging.
* **Download Location:** Choose your preferred directory to save downloaded videos.
* **Download History:** Keep track of all your downloaded videos with their titles and quick access to their original URLs.

## 🏗 Tech Stack
* **Core:** [Electron](https://www.electronjs.org/) (Process Management)
* **Frontend:** [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Bundler:** [Vite](https://vitejs.dev/)

## 🙏 Credits
Yoink is built upon the incredible power of [`yt-dlp`](https://github.com/yt-dlp/yt-dlp), a free and open-source command-line program to download videos and audio from YouTube and many other video sites. All video downloading capabilities are provided by `yt-dlp`.

## 🚀 Getting Started

To run Yoink in development mode:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start the application:**
    ```bash
    npm run dev
    ```