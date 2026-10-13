import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sliders,
  QrCode,
  BookOpen,
  Copy,
  Check,
  Download,
  RefreshCw,
  Cloud,
  Activity,
  MapPin,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';
import QRCode from 'qrcode';

interface ForecastItem {
  hour: string;
  prob: number;
  kp: number;
  clouds: number;
}

interface SiteOption {
  id: string;
  name: string;
  desc: string;
  isGps: boolean;
  lat: number | null;
  lon: number | null;
}

const ALL_SITES: SiteOption[] = [
  { id: 'local', name: '📍 GPS Local (Default)', desc: 'Real-time device position', isGps: true, lat: null, lon: null },
  { id: 'tromso', name: '🇳🇴 Tromsø, Norway', desc: '69.6°N, 18.9°E · Prime Auroral Oval', isGps: false, lat: 69.65, lon: 18.96 },
  { id: 'fairbanks', name: '🇺🇸 Fairbanks, Alaska', desc: '64.8°N, -147.7°W · Interior Dark Sky', isGps: false, lat: 64.84, lon: -147.72 },
  { id: 'reykjavik', name: '🇮🇸 Reykjavik, Iceland', desc: '64.1°N, -21.9°W · Maritime Aurora Belt', isGps: false, lat: 64.14, lon: -21.94 },
  { id: 'yellowknife', name: '🇨🇦 Yellowknife, Canada', desc: '62.4°N, -114.4°W · Sub-Arctic Capital', isGps: false, lat: 62.45, lon: -114.37 },
  { id: 'abisko', name: '🇸🇪 Abisko, Sweden', desc: '68.3°N, 18.8°E · Clear Sky Microclimate', isGps: false, lat: 68.35, lon: 18.83 },
  { id: 'rovaniemi', name: '🇫🇮 Rovaniemi, Finland', desc: '66.5°N, 25.7°E · Arctic Circle Lapland', isGps: false, lat: 66.50, lon: 25.73 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'install' | 'tester' | 'settings' | 'guide'>('install');
  const [watchView, setWatchView] = useState<'page' | 'widget' | 'glance'>('page');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [installSource, setInstallSource] = useState<'github' | 'live'>('github');
  const [packageFormat, setPackageFormat] = useState<'zab' | 'zpk'>('zab');
  const [githubRepo, setGithubRepo] = useState('petew1987/stealth-aurora-tracker');

  // Multi-location selection on phone (GPS Local is always the default first entry)
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([
    'local',
    'tromso',
    'fairbanks',
    'reykjavik'
  ]);
  const [currentWatchIndex, setCurrentWatchIndex] = useState(0);

  // Simulated GPS Coordinates
  const [userGpsLat, setUserGpsLat] = useState<number>(64.14);
  const [userGpsLon, setUserGpsLon] = useState<number>(-21.94);

  // Watch Metrics State
  const [isUpdating, setIsUpdating] = useState(false);
  const [kpValue, setKpValue] = useState(4.7);
  const [cloudCover, setCloudCover] = useState(18);
  const [chancePercent, setChancePercent] = useState(78);
  const [guidanceText, setGuidanceText] = useState('High Viewing Chance');
  const [locationName, setLocationName] = useState('📍 Local GPS (64.1°N)');
  const [forecast, setForecast] = useState<ForecastItem[]>([
    { hour: '+1h', prob: 70, kp: 4.5, clouds: 20 },
    { hour: '+2h', prob: 78, kp: 4.7, clouds: 18 },
    { hour: '+3h', prob: 84, kp: 5.1, clouds: 15 },
    { hour: '+4h', prob: 82, kp: 5.0, clouds: 22 },
    { hour: '+5h', prob: 75, kp: 4.6, clouds: 28 },
    { hour: '+6h', prob: 64, kp: 4.2, clouds: 35 },
    { hour: '+7h', prob: 52, kp: 3.8, clouds: 42 },
    { hour: '+8h', prob: 45, kp: 3.5, clouds: 40 },
    { hour: '+9h', prob: 38, kp: 3.2, clouds: 45 },
    { hour: '+10h', prob: 30, kp: 2.9, clouds: 50 }
  ]);

  // Determine active locations list
  const activeLocationsList = ALL_SITES.filter(s => selectedLocationIds.includes(s.id));
  const activeLocation = activeLocationsList[currentWatchIndex % activeLocationsList.length] || ALL_SITES[0];

  const getActiveDownloadUrl = () => {
    if (installSource === 'github') {
      const cleanRepo = githubRepo.trim() || 'petew1987/stealth-aurora-tracker';
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

  // Try fetching browser GPS for real local view
  useEffect(() => {
    if (navigator?.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserGpsLat(pos.coords.latitude);
          setUserGpsLon(pos.coords.longitude);
        },
        () => {},
        { timeout: 5000 }
      );
    }
  }, []);

  const copyScheme = () => {
    navigator.clipboard.writeText(getActiveZpkd1Url());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle location in phone selection
  const toggleLocationSelection = (id: string) => {
    if (id === 'local') return; // Local GPS is always retained as the base default
    setSelectedLocationIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Cycle to next location on watchface
  const cycleWatchLocation = () => {
    const nextIdx = (currentWatchIndex + 1) % activeLocationsList.length;
    setCurrentWatchIndex(nextIdx);
    const nextTarget = activeLocationsList[nextIdx];
    fetchLiveSpaceData(nextTarget);
  };

  // Real-time API simulation calling NOAA and Open-Meteo
  const fetchLiveSpaceData = async (site = activeLocation) => {
    setIsUpdating(true);

    const lat = site.isGps ? userGpsLat : (site.lat ?? 69.65);
    const lon = site.isGps ? userGpsLon : (site.lon ?? 18.96);

    const labelName = site.isGps
      ? `📍 Local GPS (${Math.abs(lat).toFixed(1)}°${lat >= 0 ? 'N' : 'S'})`
      : site.name.replace(/^[^\s]+\s/, ''); // strip emoji flag
    setLocationName(labelName);

    try {
      // 1. Fetch live NOAA planetary K-index
      let liveKp = 4.3;
      try {
        const noaaRes = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
        if (noaaRes.ok) {
          const rows = await noaaRes.json();
          if (Array.isArray(rows) && rows.length > 1) {
            const latest = rows[rows.length - 1];
            const parsed = parseFloat(latest[1]);
            if (!isNaN(parsed)) liveKp = parsed;
          }
        }
      } catch (e) {
        console.warn('NOAA fetch error, using modeled Kp', e);
      }

      // 2. Fetch live Open-Meteo cloud cover
      let liveClouds = 22;
      let hourlyCloudsList = [20, 22, 25, 20, 18, 15, 25, 30, 40, 45];
      try {
        const meteoRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&current=cloud_cover&hourly=cloud_cover&forecast_hours=12`
        );
        if (meteoRes.ok) {
          const meteoData = await meteoRes.json();
          if (meteoData?.current?.cloud_cover !== undefined) {
            liveClouds = Math.round(meteoData.current.cloud_cover);
          }
          if (Array.isArray(meteoData?.hourly?.cloud_cover)) {
            hourlyCloudsList = meteoData.hourly.cloud_cover.slice(0, 10);
          }
        }
      } catch (e) {
        console.warn('Meteo fetch error', e);
      }

      // 3. Geomagnetic model computation
      const magLat = Math.abs(lat) - (lon < 0 ? 1.5 : -1.5);
      const ovalCenter = 68.0 - 2.1 * liveKp;
      const delta = Math.abs(magLat - ovalCenter);
      let rawProb = delta <= 3 ? 90 : Math.max(10, Math.round(86 - delta * 9 + liveKp * 4));

      let computedChance = rawProb;
      let guidance = 'Active Aurora';
      if (liveClouds > 80) {
        computedChance = Math.min(10, Math.round(rawProb * 0.12));
        guidance = 'No Visibility (Cloudy)';
      } else if (liveClouds > 55) {
        computedChance = Math.round(rawProb * 0.55);
        guidance = 'Partly Cloudy';
      } else {
        guidance = rawProb > 65 ? 'High Viewing Chance' : 'Fair Skies · Low Kp';
      }

      setKpValue(Number(liveKp.toFixed(1)));
      setCloudCover(liveClouds);
      setChancePercent(Math.min(99, Math.max(0, computedChance)));
      setGuidanceText(guidance);

      // Hourly Forecast
      const newForecast: ForecastItem[] = [];
      for (let i = 0; i < 10; i++) {
        const c = hourlyCloudsList[i] !== undefined ? hourlyCloudsList[i] : liveClouds;
        const projectedKp = Math.max(1.0, liveKp + Math.sin((i + 1) * 0.8) * 0.5);
        const hRaw = Math.max(5, Math.round(rawProb + Math.sin(i * 0.6) * 12));
        let hProb = hRaw;
        if (c > 80) hProb = Math.min(10, Math.round(hRaw * 0.1));
        else if (c > 50) hProb = Math.round(hRaw * 0.55);

        newForecast.push({
          hour: `+${i + 1}h`,
          prob: Math.min(99, Math.max(0, hProb)),
          kp: Number(projectedKp.toFixed(1)),
          clouds: c
        });
      }
      setForecast(newForecast);
    } catch (err) {
      console.error('Update error', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const arcRadius = 185;
  const arcCircumference = 2 * Math.PI * arcRadius;
  const arcTotalLength = arcCircumference * 0.75;
  const activeArcLength = (chancePercent / 100) * arcTotalLength;

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans antialiased selection:bg-emerald-600/30 selection:text-emerald-300 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-zinc-900 bg-black/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Compass className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-white">Stealth Aurora Tracker</h1>
              <span className="text-xs text-zinc-400">by Stealth Apps</span>
            </div>
          </div>

          <div className="text-xs text-zinc-400 font-mono">Amazfit Active 3 · 466x466</div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-xl w-full mx-auto px-5 py-6 pb-28">
        {/* TAB 1: INSTALL VIA QR CODE */}
        {activeTab === 'install' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white">Install on Amazfit Watch</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Scan with the Developer Mode QR scanner inside the smartphone Zepp App.
              </p>
            </div>

            {/* Source Segment Control */}
            <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-950 border border-zinc-900 text-xs font-medium">
              <button
                onClick={() => setInstallSource('github')}
                className={`py-2 rounded-lg transition-all ${
                  installSource === 'github'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                GitHub Release
              </button>
              <button
                onClick={() => setInstallSource('live')}
                className={`py-2 rounded-lg transition-all ${
                  installSource === 'live'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Live Web Server
              </button>
            </div>

            {/* Format Toggle */}
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-zinc-400">Package Format:</span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPackageFormat('zab')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    packageFormat === 'zab'
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  .zab Bundle (Recommended)
                </button>
                <button
                  onClick={() => setPackageFormat('zpk')}
                  className={`px-3 py-1 rounded-md font-medium transition-all ${
                    packageFormat === 'zpk'
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
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
                {installSource === 'github'
                  ? `${githubRepo} · zepphello.${packageFormat}`
                  : `Live server · zepphello.${packageFormat}`}
              </span>
            </div>

            {/* Numbered Steps */}
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Installation Steps
              </h3>
              <div className="divide-y divide-zinc-900 border-t border-b border-zinc-900 text-xs">
                <div className="py-2.5 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </span>
                  <span className="text-zinc-300">
                    Open <strong>Zepp App</strong> &rarr; Profile &rarr; Settings &rarr; About &rarr; tap Zepp logo 7 times.
                  </span>
                </div>
                <div className="py-2.5 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </span>
                  <span className="text-zinc-300">
                    Return to <strong>Profile &rarr; Amazfit Active 3 &rarr; Developer Mode</strong>.
                  </span>
                </div>
                <div className="py-2.5 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </span>
                  <span className="text-zinc-300">
                    Tap the <strong>QR Scanner icon</strong> (top-right) and scan the code above.
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={copyScheme}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs font-medium flex items-center justify-center gap-2 border border-zinc-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied zpkd1 URI' : 'Copy zpkd1:// URI'}
              </button>
              <a
                href={getActiveDownloadUrl()}
                download
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-medium flex items-center justify-center gap-2 text-white shadow-sm transition-colors text-center"
              >
                <Download className="w-3.5 h-3.5" />
                Download .{packageFormat}
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE WATCH EMULATOR */}
        {activeTab === 'tester' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">466x466 AMOLED Watchface</h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tap the top location pill to cycle through your selected locations!
                </p>
              </div>

              {/* View Switcher */}
              <div className="flex rounded-lg bg-zinc-950 border border-zinc-900 p-0.5 text-[11px]">
                <button
                  onClick={() => setWatchView('page')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    watchView === 'page' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400'
                  }`}
                >
                  Main Page
                </button>
                <button
                  onClick={() => setWatchView('widget')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    watchView === 'widget' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400'
                  }`}
                >
                  Widget
                </button>
                <button
                  onClick={() => setWatchView('glance')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    watchView === 'glance' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400'
                  }`}
                >
                  Glance
                </button>
              </div>
            </div>

            {/* Quick Active Location Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-zinc-400 text-[11px] shrink-0">Watch Rotation:</span>
              {activeLocationsList.map((site, idx) => (
                <button
                  key={site.id}
                  onClick={() => {
                    setCurrentWatchIndex(idx);
                    fetchLiveSpaceData(site);
                  }}
                  className={`px-2.5 py-1 rounded-full shrink-0 border text-[11px] transition-all ${
                    currentWatchIndex === idx
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 font-medium'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {site.name.split(' ')[1] || site.name}
                </button>
              ))}
            </div>

            {/* Interactive 466x466 Circular Watch Display */}
            <div className="flex justify-center py-2">
              <div className="relative w-[360px] h-[360px] sm:w-[410px] sm:h-[410px] rounded-full bg-black p-3.5 shadow-2xl border-4 border-zinc-900 flex items-center justify-center overflow-hidden">
                {/* Watch Outer Bezel Ring */}
                <div className="absolute inset-0 rounded-full border border-zinc-800 pointer-events-none" />

                {/* VIEW 1: MAIN 466x466 WATCH PAGE */}
                {watchView === 'page' && (
                  <div className="relative w-full h-full rounded-full bg-black flex flex-col items-center justify-between py-6 px-4 select-none">
                    {/* SVG 270-degree Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 466 466">
                      {/* Track Arc */}
                      <circle
                        cx="233"
                        cy="233"
                        r={arcRadius}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="10"
                        strokeDasharray={`${arcTotalLength} ${arcCircumference}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        transform="rotate(135 233 233)"
                      />
                      {/* Active Arc */}
                      <circle
                        cx="233"
                        cy="233"
                        r={arcRadius}
                        fill="none"
                        stroke={chancePercent >= 70 ? '#10b981' : chancePercent >= 40 ? '#06b6d4' : '#38bdf8'}
                        strokeWidth="10"
                        strokeDasharray={`${activeArcLength} ${arcCircumference}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        transform="rotate(135 233 233)"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>

                    {/* Top Row: Location Pill (Clickable on Watch to Cycle Sites) */}
                    <div className="z-10 text-center pt-2">
                      <button
                        onClick={cycleWatchLocation}
                        className="px-3.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800/80 text-[12px] font-semibold text-slate-300 tracking-wide flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                        title="Tap to cycle between GPS Local and your other selected locations"
                      >
                        <span>{locationName}</span>
                        {activeLocationsList.length > 1 && (
                          <span className="text-[10px] text-sky-400">
                            ({currentWatchIndex + 1}/{activeLocationsList.length}) ▾
                          </span>
                        )}
                      </button>

                      {/* Sub-metrics: Kp Index & Clouds */}
                      <div className="flex items-center justify-center gap-2 mt-1.5 text-[14px]">
                        <span className="font-semibold text-sky-400">Kp {kpValue}</span>
                        <span className="text-zinc-600">·</span>
                        <span className={`font-semibold ${cloudCover < 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          ☁ {cloudCover}%
                        </span>
                      </div>
                    </div>

                    {/* Center Hero: Large Viewing Probability */}
                    <div className="z-10 text-center my-auto">
                      <div
                        className={`text-5xl sm:text-6xl font-black tracking-tight ${
                          chancePercent >= 70
                            ? 'text-emerald-400'
                            : chancePercent >= 40
                            ? 'text-cyan-400'
                            : 'text-sky-300'
                        }`}
                      >
                        {chancePercent}%
                      </div>
                      <div className="text-sm font-medium text-zinc-200 mt-1">
                        {guidanceText}
                      </div>
                    </div>

                    {/* 10-Hour Forecast Timeline */}
                    <div className="z-10 w-full max-w-[310px] pb-1">
                      <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider text-center mb-1.5">
                        10-Hour Forecast
                      </div>
                      <div className="grid grid-cols-10 gap-1 items-end h-11 px-1 bg-zinc-950/60 rounded-lg p-1 border border-zinc-900/60">
                        {forecast.map((item, idx) => {
                          const barHeight = Math.max(12, Math.round((item.prob / 100) * 100));
                          const barColor =
                            item.prob >= 70 ? 'bg-emerald-500' : item.prob >= 40 ? 'bg-cyan-500' : 'bg-slate-700';
                          return (
                            <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                              <div
                                style={{ height: `${barHeight}%` }}
                                className={`w-full rounded-xs transition-all duration-500 ${barColor}`}
                                title={`${item.hour}: ${item.prob}% (Kp ${item.kp})`}
                              />
                              <span className="text-[9px] text-zinc-400 font-mono scale-90">
                                {item.hour.replace('h', '')}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Bottom Action: Refresh Button */}
                    <div className="z-10 pb-2">
                      <button
                        onClick={() => fetchLiveSpaceData()}
                        disabled={isUpdating}
                        className="px-5 py-2 rounded-full bg-teal-800 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                      >
                        <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
                        {isUpdating ? 'UPDATING...' : 'REFRESH'}
                      </button>
                    </div>
                  </div>
                )}

                {/* VIEW 2: SHORTCUT WIDGET CARD */}
                {watchView === 'widget' && (
                  <div className="w-full px-4 flex flex-col justify-center">
                    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg text-left">
                      <div className="text-[12px] font-semibold text-sky-400 uppercase tracking-wide">
                        AURORA · {locationName} · Kp {kpValue}
                      </div>
                      <div className="text-3xl font-black text-emerald-400 mt-1">
                        {chancePercent}% Likelihood
                      </div>
                      <div className="text-xs text-zinc-400 mt-2 flex items-center justify-between">
                        <span>{guidanceText}</span>
                        <span>☁ {cloudCover}% clouds</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-400 text-center mt-3">
                      Tap card to launch full Stealth Aurora Tracker
                    </p>
                  </div>
                )}

                {/* VIEW 3: SECONDARY QUICK GLANCE */}
                {watchView === 'glance' && (
                  <div className="relative w-full h-full rounded-full bg-black flex flex-col items-center justify-center p-6 text-center select-none">
                    <div className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                      AURORA · Kp {kpValue}
                    </div>
                    <div className="text-5xl font-black text-emerald-400 my-2">
                      {chancePercent}%
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {guidanceText}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      {locationName} · ☁ {cloudCover}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Live Query Controls */}
            <div className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Live API Query Test
                </span>
                <button
                  onClick={() => fetchLiveSpaceData()}
                  disabled={isUpdating}
                  className="px-3 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-emerald-400 font-medium border border-zinc-800 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
                  Poll NOAA SWPC
                </button>
              </div>
              <p className="text-zinc-400 text-[11px]">
                Currently querying real-time space weather for {locationName}. Tapping the location button on the watch cycles to the next selected site in your rotation!
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: PHONE SETTINGS VIEW (Multi-location selection) */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-white">Zepp App Phone Settings</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Select which locations are accessible on your watch. <strong>GPS Local</strong> is always the default.
              </p>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 space-y-5 text-xs">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  Watch Locations Rotation ({selectedLocationIds.length} Active)
                </h3>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Check or uncheck sites below to include them on your Amazfit Active 3:
                </p>

                <div className="space-y-2 mt-3">
                  {ALL_SITES.map(loc => {
                    const isSelected = selectedLocationIds.includes(loc.id);
                    const isDefault = loc.id === 'local';

                    return (
                      <div
                        key={loc.id}
                        onClick={() => toggleLocationSelection(loc.id)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500/50 text-white'
                            : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-600 shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-xs text-white flex items-center gap-1.5">
                              {loc.name}
                              {isDefault && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">{loc.desc}</div>
                          </div>
                        </div>

                        <span
                          className={`text-[11px] font-semibold px-2 py-1 rounded ${
                            isSelected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {isSelected ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cloud Sensitivity */}
              <div className="border-t border-zinc-900 pt-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Cloud className="w-4 h-4 text-sky-400" />
                  Cloud Sensitivity Filter
                </h3>
                <p className="text-zinc-400 text-[11px] mt-0.5">
                  Adjust sky transparency tolerance threshold:
                </p>
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium hover:bg-zinc-800">
                    Strict (&lt;30%)
                  </button>
                  <button className="flex-1 py-2 rounded-lg bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-medium">
                    Standard (&lt;60%)
                  </button>
                  <button className="flex-1 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium hover:bg-zinc-800">
                    Permissive (&lt;80%)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DEVELOPER ARCHITECTURE GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-4 text-xs text-zinc-300">
            <div>
              <h2 className="text-base font-semibold text-white">Zepp OS Multi-Location Architecture</h2>
              <p className="text-xs text-zinc-400 mt-1">
                How Stealth Aurora Tracker handles location resolution, phone companion settings, and NOAA APIs.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900">
                <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  1. page/index.js (Smartwatch Native AMOLED UI)
                </h3>
                <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                  Default view is <strong>GPS Local</strong>. When tapped, the location pill cycles through the list of locations enabled in the Zepp App settings. It requests current coordinates via watch GPS and messages the companion via <code>this.request(&#123; type: 'FETCH_AURORA', locationId &#125;)</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900">
                <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-sky-400" />
                  2. app-side/index.js (Companion Service)
                </h3>
                <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                  Reads user settings via <code>settingsStorage</code>. For GPS Local, it resolves position using the watch's GPS (or phone IP fallback if indoors). For selected hotspots, it uses precise coordinates, queries NOAA SWPC and Open-Meteo, and packages the 10-hour forecast.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900">
                <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  3. setting/index.js (Phone App Settings)
                </h3>
                <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                  Allows users to toggle multiple locations for their watch rotation with a single tap, keeping GPS Local as the permanent default.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-900 bg-black/95 backdrop-blur z-40">
        <div className="max-w-xl mx-auto px-4 h-16 grid grid-cols-4 items-center">
          <button
            onClick={() => setActiveTab('install')}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === 'install' ? 'text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span className="text-[11px]">Install</span>
          </button>
          <button
            onClick={() => setActiveTab('tester')}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === 'tester' ? 'text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span className="text-[11px]">Watch</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === 'settings' ? 'text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span className="text-[11px]">Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === 'guide' ? 'text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-[11px]">Architecture</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
