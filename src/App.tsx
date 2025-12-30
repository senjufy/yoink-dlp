import { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Link as LinkIcon, 
  Trash2, 
  Copy, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  Music, 
  Video, 
  CheckCircle2 
} from 'lucide-react';

// --- Types ---
interface DownloadHistoryItem {
  title: string;
  filePath: string;
  url: string;
}

function App() {
  // --- State ---
  const [url, setUrl] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('bestvideo+bestaudio');
  const [logs, setLogs] = useState('');
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  
  // UI State
  const [showLogs, setShowLogs] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const logsEndRef = useRef<HTMLTextAreaElement>(null);

  // --- Logic ---
  const fetchHistory = async () => {
    // @ts-ignore
    const history = await window.ipcRenderer.invoke('get-download-history');
    setHistory(history);
  };

  useEffect(() => {
    fetchHistory();

    const handleDownloadFinished = () => {
      setIsDownloading(false);
      setProgress(100);
      fetchHistory();
      setTimeout(() => setProgress(0), 3000);
    };

    const handleHistoryCleared = () => {
      fetchHistory();
    };
    
    const handleProgress = (_event: any, data: string) => {
      const progressRegex = /\[download\]\s+([0-9\.]+)%/;
      const match = data.match(progressRegex);
      if (match) {
        setProgress(parseFloat(match[1]));
      }
      setLogs((prevLogs) => prevLogs + data);
      
      if (logsEndRef.current) {
        logsEndRef.current.scrollTop = logsEndRef.current.scrollHeight;
      }
    };

    // @ts-ignore
    window.ipcRenderer.on('download-progress', handleProgress);
    // @ts-ignore
    window.ipcRenderer.on('download-finished', handleDownloadFinished);
    // @ts-ignore
    window.ipcRenderer.on('history-cleared', handleHistoryCleared);

    return () => {
      // @ts-ignore
      window.ipcRenderer.off('download-progress', handleProgress);
      // @ts-ignore
      window.ipcRenderer.off('download-finished', handleDownloadFinished);
      // @ts-ignore
      window.ipcRenderer.off('history-cleared', handleHistoryCleared);
    }
  }, []);

  const handleDownload = () => {
    if (!url) return;
    setLogs('');
    setProgress(0);
    setIsDownloading(true);
    setShowLogs(true);
    // @ts-ignore
    window.ipcRenderer.send('download-video', url, selectedFormat);
  };
  
  const handleClearHistory = () => {
    // @ts-ignore
    window.ipcRenderer.send('clear-download-history');
  }

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // --- Render ---
  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-500/30 flex flex-col overflow-hidden relative">
      
      {/* Background Ambient Glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none opacity-50" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none opacity-50" />

      {/* Main Content Container - Flex Col ensuring footer stays at bottom if needed */}
      <div className="relative z-10 w-full h-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-4 sm:gap-6">
        
        {/* Header */}
        <div className="text-center shrink-0">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter bg-gradient-to-br from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Yoink<span className="text-purple-500">.</span>
          </h1>
          <p className="text-zinc-500 text-sm sm:text-base mt-1 font-medium">We run on yt-dlp Engine.</p>
        </div>

        {/* Input Card */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl shrink-0">
          
          {/* URL Input */}
          <div className="relative group mb-3 sm:mb-4">
            <div className="absolute inset-y-0 left-3 sm:left-4 flex items-center pointer-events-none">
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste link here..."
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl sm:rounded-2xl py-3 sm:py-4 pl-10 sm:pl-12 pr-4 text-base sm:text-lg placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
            />
          </div>

          {/* Controls: Stack on mobile, Row on desktop */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            
            {/* Format Selector */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                {selectedFormat.includes('audio') && !selectedFormat.includes('video') ? (
                   <Music className="w-4 h-4 text-zinc-500" />
                ) : (
                   <Video className="w-4 h-4 text-zinc-500" />
                )}
              </div>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full appearance-none bg-zinc-800/50 border border-zinc-700/50 rounded-xl py-3 pl-10 pr-8 text-sm font-medium hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/30 cursor-pointer text-zinc-200"
              >
                <option value="bestvideo+bestaudio">Best (MKV/MP4)</option>
                <option value="bestvideo">Video Only</option>
                <option value="bestaudio">Audio Only</option>
                <option value="mp3">MP3 Audio</option>
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading || !url}
              className={`
                flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 text-sm sm:text-base whitespace-nowrap
                ${isDownloading 
                  ? 'bg-zinc-700 cursor-not-allowed opacity-50' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:shadow-purple-500/25'
                }
              `}
            >
              {isDownloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Yoinking...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Yoink It</span>
                </>
              )}
            </button>
          </div>

          {/* Progress Bar */}
          <div className={`mt-4 sm:mt-6 transition-all duration-500 ${isDownloading || progress > 0 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="flex justify-between text-xs font-mono text-zinc-400 mb-1">
              <span>PROGRESS</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 sm:h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300 ease-out relative"
                style={{ width: `${progress}%` }}
              >
                 {isDownloading && (
                  <div className="absolute inset-0 bg-white/30 animate-[shimmer_1s_infinite] w-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)' }} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Toggle */}
        <div className="flex justify-center shrink-0">
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors py-1"
          >
            <Terminal className="w-3 h-3" />
            {showLogs ? 'Hide Terminal' : 'Show Terminal'}
            {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Content Area: Split View */}
        {/* Uses min-h-0 to allow scrolling inside children instead of overflowing body */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
          
          {/* Logs Area */}
          {showLogs && (
            <div className="h-48 md:h-auto md:w-1/2 md:flex-1 bg-black/80 backdrop-blur border border-zinc-800 rounded-2xl p-4 flex flex-col shrink-0 md:shrink">
              <h2 className="text-xs font-bold text-zinc-500 mb-2 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-3 h-3" /> Logs
              </h2>
              <textarea
                ref={logsEndRef}
                value={logs}
                readOnly
                className="flex-1 w-full bg-transparent resize-none focus:outline-none font-mono text-xs text-green-400 leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800"
                placeholder="Waiting..."
              />
            </div>
          )}

          {/* History Area */}
          <div className={`
            flex-1 flex flex-col bg-zinc-900/30 border border-white/5 rounded-2xl transition-all duration-300 overflow-hidden
            ${showLogs ? 'md:w-1/2' : 'w-full'}
          `}>
            <div className="p-3 sm:p-4 border-b border-white/5 flex justify-between items-center bg-zinc-900/50 shrink-0">
              <h2 className="font-bold text-zinc-300 text-sm sm:text-base flex items-center gap-2">
                <Download className="w-4 h-4 text-purple-500" />
                History
              </h2>
              {history.length > 0 && (
                <button 
                  onClick={handleClearHistory}
                  className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-white/5"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-600 p-8">
                  <div className="p-3 sm:p-4 bg-zinc-800/50 rounded-full mb-3">
                     <Download className="w-5 h-5 sm:w-6 sm:h-6 opacity-50" />
                  </div>
                  <p className="text-xs sm:text-sm">No downloads yet.</p>
                </div>
              ) : (
                history.map((item, index) => (
                  <div key={index} className="group p-3 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/5 transition-all flex items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-500">
                        {item.title.endsWith('mp3') ? <Music className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-xs sm:text-sm font-medium text-zinc-200 truncate" title={item.title}>
                          {item.title || 'Unknown Title'}
                        </span>
                        <span className="text-[10px] sm:text-xs text-zinc-500 truncate">{item.url}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => copyToClipboard(item.url, index)}
                      className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors relative shrink-0"
                      title="Copy Link"
                    >
                      {copiedIndex === index ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;