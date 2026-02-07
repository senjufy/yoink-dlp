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

## ✨ How to Use (for Non-Technical Users)

Since there are no pre-built releases yet, you will need to run the application from its source code. Don't worry, this guide will walk you through it step-by-step.

### Step 1: Install Node.js

Node.js is a runtime environment that lets you run the application.

1.  **Go to the official Node.js website:** [https://nodejs.org/](https://nodejs.org/)
2.  **Download the LTS version:** On the homepage, you'll see two versions. Click on the one that says "LTS" (Long-Term Support). This is the most stable version.
3.  **Install Node.js:** Once the download is complete, open the installer and follow the on-screen instructions. You can accept all the default settings.

### Step 2: Download and Unzip Yoink

1.  **Go to the Yoink GitHub page:** [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME) (Replace `YOUR_USERNAME/YOUR_REPO_NAME` with the actual path to Yoink's GitHub repository).
2.  **Download the code:** Click the green "<> Code" button, then click "Download ZIP".
3.  **Unzip the file:** Find the downloaded ZIP file in your "Downloads" folder and unzip it. You can usually do this by right-clicking and selecting "Extract All..." or "Unzip".

### Step 3: Run the Application

This is the final step, where you'll use the command line to start the application.

1.  **Open your terminal/command prompt:**
    *   **Windows:** Press the `Windows Key`, type `cmd`, and press Enter.
    *   **macOS:** Open "Launchpad" and search for "Terminal".
    *   **Linux:** Press `Ctrl + Alt + T` or search for "Terminal" in your applications.
2.  **Navigate to the Yoink folder:** In your terminal, type `cd` followed by a space, and then drag the unzipped Yoink folder into the terminal window. It should look something like this:
    ```
    cd /path/to/yoink-folder
    ```
    Press Enter.
3.  **Install dependencies:** This command downloads all the necessary code libraries Yoink needs to run. Type the following and press Enter:
    ```bash
    npm install
    ```
    You will see a lot of text scrolling by. Wait for it to finish.
4.  **Start Yoink:** Once `npm install` is done, type the following and press Enter:
    ```bash
    npm run dev
    ```
    This will start the Yoink application. You can now use it to download videos!



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