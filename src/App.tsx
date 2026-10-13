import React, { useState, useEffect } from 'react';
import {
  Watch,
  Sliders,
  QrCode,
  BookOpen,
  Copy,
  Check,
  Download,
  ExternalLink
} from 'lucide-react';
import QRCode from 'qrcode';

const COLORS = [
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Sky', hex: '#38bdf8' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'install' | 'tester' | 'settings' | 'guide'>('install');
  const [watchView, setWatchView] = useState<'page' | 'widget' | 'glance'>('page');
  const [currentColorHex, setCurrentColorHex] = useState('#a855f7');
  const [defaultColorHex, setDefaultColorHex] = useState('#a855f7');
  const [clickCount, setClickCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [installSource, setInstallSource] = useState<'github' | 'live'>('github');
  const [packageFormat, setPackageFormat] = useState<'zab' | 'zpk'>('zab');
  const [githubRepo, setGithubRepo] = useState('petew1987/ZeppHello');

  const getActiveDownloadUrl = () => {
    if (installSource === 'github') {
      const cleanRepo = githubRepo.trim() || 'petew1987/ZeppHello';
      return `https://github.com/${cleanRepo}/releases/latest/download/zepphello.${packageFormat}`;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
    return `${origin}/zepphello.${packageFormat}`;
  };

  const getActiveZpkd1Url = () => {
    const rawUrl = getActiveDownloadUrl();
    return `zpkd1://${rawUrl.replace(/^https?:\/\//, '')}`;
  };

  useEffect(() => {
    const uri = getActiveZpkd1Url();
    QRCode.toDataURL(uri, {
      width: 260,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    })
      .then((url: string) => setQrDataUrl(url))
      .catch((err: unknown) => console.error('QR error:', err));
  }, [installSource, packageFormat, githubRepo]);

  const handleWatchClick = () => {
    setClickCount(prev => prev + 1);
    const currentIndex = COLORS.findIndex(c => c.hex.toLowerCase() === currentColorHex.toLowerCase());
    const nextIndex = (currentIndex + 1) % COLORS.length;
    setCurrentColorHex(COLORS[nextIndex].hex);
  };

  const handleDefaultColorSelect = (hex: string) => {
    setDefaultColorHex(hex);
    setCurrentColorHex(hex);
  };

  const copyScheme = () => {
    navigator.clipboard.writeText(getActiveZpkd1Url());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeColorObj = COLORS.find(c => c.hex.toLowerCase() === currentColorHex.toLowerCase()) || COLORS[0];

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-purple-600/30 selection:text-purple-300 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-zinc-900 bg-black/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Watch className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-white">ZeppHello</h1>
              <span className="text-xs text-zinc-400">by Stealth Apps</span>
            </div>
          </div>

          <div className="text-xs text-zinc-400 font-mono">Amazfit Active 3</div>
        </div>
      </header>

      {/* Main Content Area - Mobile-First Layout */}
      <main className="flex-1 max-w-xl w-full mx-auto px-5 py-6 pb-28">
        {/* TAB 1: INSTALL VIA QR CODE */}
        {activeTab === 'install' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white">Install on Amazfit Watch</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Scan with the Developer Mode QR scanner in the smartphone Zepp App.
              </p>
            </div>

            {/* Source Segment Control */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-950 border border-zinc-900 text-xs font-medium">
              <button
                onClick={() => setInstallSource('github')}
                className={`py-2 rounded-lg transition-all ${
                  installSource === 'github'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                GitHub Release
              </button>
              <button
                onClick={() => setInstallSource('live')}
                className={`py-2 rounded-lg transition-all ${
                  installSource === 'live'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Live Web Server
              </button>
            </div>

            {/* Format Toggle (.zab bundle vs .zpk) */}
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-zinc-400">Package Format:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPackageFormat('zab')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    packageFormat === 'zab'
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  .zab Bundle (Recommended)
                </button>
                <button
                  onClick={() => setPackageFormat('zpk')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    packageFormat === 'zpk'
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  .zpk Single
                </button>
              </div>
            </div>

            {/* QR Code Presentation */}
            <div className="flex flex-col items-center justify-center py-3">
              <div className="p-4 bg-white rounded-2xl shadow-xl">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Zepp OS QR Installer" className="w-52 h-52 sm:w-60 sm:h-60" />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center text-xs text-zinc-400">
                    Generating QR code...
                  </div>
                )}
              </div>
              <span className="text-[11px] text-zinc-400 mt-2 font-mono">
                {installSource === 'github' ? `petew1987/ZeppHello · zepphello.${packageFormat}` : `Live server · zepphello.${packageFormat}`}
              </span>
            </div>

            {/* Numbered Steps */}
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Installation Steps
              </h3>
              <div className="divide-y divide-zinc-900 border-t border-b border-zinc-900 text-xs">
                <div className="py-2.5 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-purple-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <span className="text-zinc-300">
                    Open <strong>Zepp App</strong> &rarr; Profile &rarr; Settings &rarr; About &rarr; tap Zepp logo 7 times.
                  </span>
                </div>
                <div className="py-2.5 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-purple-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <span className="text-zinc-300">
                    Return to <strong>Profile &rarr; Amazfit Active 3 &rarr; Developer Mode</strong>.
                  </span>
                </div>
                <div className="py-2.5 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-purple-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <span className="text-zinc-300">
                    Tap the <strong>QR scanner icon</strong> in top right and scan the code above.
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={copyScheme}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-medium transition-all flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-purple-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                {copied ? 'Link Copied' : 'Copy Install Link'}
              </button>

              <a
                href={getActiveDownloadUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 font-medium transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4 text-zinc-400" />
                Test Link
              </a>

              <a
                href="/zepphello.zab"
                download="zepphello.zab"
                className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs text-white font-medium transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-950/20"
              >
                <Download className="w-4 h-4" />
                Download .zab
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: WATCH TESTER */}
        {activeTab === 'tester' && (
          <div className="space-y-6">
            {/* View Switcher Bar */}
            <div className="flex border-b border-zinc-900 pb-2 gap-6 text-xs">
              <button
                onClick={() => setWatchView('page')}
                className={`pb-1 font-medium transition-colors ${
                  watchView === 'page'
                    ? 'text-purple-400 border-b-2 border-purple-500 -mb-[9px]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Watch Face
              </button>
              <button
                onClick={() => setWatchView('widget')}
                className={`pb-1 font-medium transition-colors ${
                  watchView === 'widget'
                    ? 'text-purple-400 border-b-2 border-purple-500 -mb-[9px]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Shortcut Card
              </button>
              <button
                onClick={() => setWatchView('glance')}
                className={`pb-1 font-medium transition-colors ${
                  watchView === 'glance'
                    ? 'text-purple-400 border-b-2 border-purple-500 -mb-[9px]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Glance View
              </button>
            </div>

            {/* Circular AMOLED Watch Frame */}
            <div className="flex justify-center py-4">
              <div className="relative p-3.5 sm:p-5 rounded-full bg-gradient-to-b from-zinc-900 to-black border-2 border-zinc-800 shadow-2xl shadow-purple-950/20">
                <div
                  onClick={handleWatchClick}
                  className="w-[280px] h-[280px] sm:w-[320px] sm:h-[320px] rounded-full bg-black border border-zinc-900 relative overflow-hidden flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer group"
                >
                  <div className="absolute inset-2.5 rounded-full border border-zinc-900/80 pointer-events-none" />

                  {/* VIEW 1: Main Watch App */}
                  {watchView === 'page' && (
                    <div className="flex flex-col items-center justify-center w-full h-full">
                      <span className="text-[11px] tracking-wider text-zinc-400 uppercase font-medium mb-1">
                        Stealth Apps
                      </span>

                      <div
                        className="text-3xl sm:text-4xl font-bold tracking-tight transition-all duration-200 group-hover:scale-105 my-2"
                        style={{ color: currentColorHex }}
                      >
                        Hello!
                      </div>

                      <div className="text-xs text-zinc-400 font-medium">
                        {clickCount} {clickCount === 1 ? 'tap' : 'taps'} · {activeColorObj.name}
                      </div>

                      <div className="mt-5 text-[11px] text-purple-400 font-medium group-hover:text-purple-300 transition-colors">
                        Tap watch to cycle color
                      </div>
                    </div>
                  )}

                  {/* VIEW 2: Shortcut Card Widget */}
                  {watchView === 'widget' && (
                    <div className="w-full flex flex-col items-start justify-center px-4 text-left">
                      <span className="text-[10px] tracking-wider uppercase text-purple-400 font-semibold mb-1">
                        Shortcut Card
                      </span>
                      <div className="text-2xl font-bold tracking-tight" style={{ color: currentColorHex }}>
                        Hello!
                      </div>
                      <span className="text-xs text-zinc-400 mt-1">
                        {clickCount} taps · Tap to open
                      </span>
                    </div>
                  )}

                  {/* VIEW 3: Glance Widget */}
                  {watchView === 'glance' && (
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[10px] uppercase text-zinc-400 mb-1">Glance</span>
                      <div className="text-3xl font-bold tracking-tight" style={{ color: currentColorHex }}>
                        Hello!
                      </div>
                      <span className="text-xs text-zinc-400 mt-1">{clickCount} taps</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick State Summary */}
            <div className="flex items-center justify-between py-3 border-t border-b border-zinc-900 text-xs">
              <span className="text-zinc-400">Current Watch Color</span>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: currentColorHex }} />
                <span className="font-medium text-white">{activeColorObj.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: APP SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white">Default Text Color</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Choose the initial color for the Hello text. In Zepp OS, this is stored on the phone and synced to the watch.
              </p>
            </div>

            {/* Flat Color Picker List */}
            <div className="divide-y divide-zinc-900 border-t border-b border-zinc-900">
              {COLORS.map(c => {
                const isSelected = defaultColorHex.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    onClick={() => handleDefaultColorSelect(c.hex)}
                    className="w-full py-3.5 flex items-center justify-between text-left transition-colors hover:bg-zinc-950/60"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: c.hex }} />
                      <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-zinc-400'}`}>
                        {c.name}
                      </span>
                    </div>

                    {isSelected && <span className="text-xs text-purple-400 font-medium">Selected</span>}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setActiveTab('tester')}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md shadow-purple-950/30"
              >
                Apply to Watch
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: GUIDE & REPOSITORY DOCUMENTATION */}
        {activeTab === 'guide' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white">Template Guide</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Everything you need to configure GitHub and build new apps from this template.
              </p>
            </div>

            {/* GitHub Setup Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                GitHub Repository Requirements
              </h3>

              <div className="divide-y divide-zinc-900 border-t border-b border-zinc-900 text-xs">
                <div className="py-3 space-y-1">
                  <div className="font-medium text-white">1. Repository Visibility: Must Be Public</div>
                  <p className="text-zinc-400 leading-relaxed">
                    The Zepp App scanner downloads packages without authentication. In GitHub, go to <em>Settings &rarr; Danger Zone &rarr; Change repository visibility</em> and set to <strong>Public</strong>.
                  </p>
                </div>

                <div className="py-3 space-y-1">
                  <div className="font-medium text-white">2. Actions Workflow Permissions</div>
                  <p className="text-zinc-400 leading-relaxed">
                    In your repository, go to <em>Settings &rarr; Actions &rarr; General &rarr; Workflow permissions</em> and select <strong>"Read and write permissions"</strong> so releases are created on push.
                  </p>
                </div>

                <div className="py-3 space-y-1">
                  <div className="font-medium text-white">3. Repository Identifier</div>
                  <p className="text-zinc-400 leading-relaxed">
                    Configured for <strong>https://github.com/petew1987/ZeppHello/</strong>. If you change or fork this repository, remember to update the identifier in <code>scripts/generate-qr.js</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Architecture Section */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Codebase Overview
              </h3>

              <div className="divide-y divide-zinc-900 border-t border-b border-zinc-900 text-xs">
                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-white">page/index.js</span>
                  <span className="text-zinc-400">Watch face interface and touch interactions</span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-white">app-side/index.js</span>
                  <span className="text-zinc-400">Phone companion service with full network fetch</span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-white">setting/index.js</span>
                  <span className="text-zinc-400">Zepp App phone settings page with settingsStorage</span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-white">app-widget/index.js</span>
                  <span className="text-zinc-400">Shortcut screen card component</span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-white">secondary-widget/index.js</span>
                  <span className="text-zinc-400">Swipe-left glance widget</span>
                </div>

                <div className="py-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <span className="font-mono text-white">app.json</span>
                  <span className="text-zinc-400">Manifest declaring permissions, preview mode and 466x466 resolution</span>
                </div>
              </div>
            </div>

            {/* Local CLI Command */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-400">
                Local Testing with Zeus CLI
              </h3>
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 font-mono text-xs text-zinc-300">
                npm install -g @zeppos/zeus-cli<br />
                zeus preview
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur border-t border-zinc-900">
        <div className="max-w-xl mx-auto px-4 h-16 grid grid-cols-4 items-center">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'install' ? 'text-purple-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <QrCode className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Install</span>
          </button>

          <button
            onClick={() => setActiveTab('tester')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'tester' ? 'text-purple-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Watch className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Watch</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'settings' ? 'text-purple-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              activeTab === 'guide' ? 'text-purple-400' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-tight">Guide</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
