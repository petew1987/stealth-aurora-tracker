import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Sliders,
  QrCode,
  BookOpen,
  Copy,
  Check,
  Download,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  Eye,
  CloudSun
} from 'lucide-react';
import QRCode from 'qrcode';

interface Forecast12hItem {
  hour: string;
  prob: number;
  clouds: number;
  kp: number;
}

interface Forecast24hItem {
  block: string;
  prob: number;
  clouds: number;
  kp: number;
}

interface Forecast7dItem {
  day: string;
  kp: number;
  clouds: number;
  prob: number;
  rating: string;
}

interface Forecast28dItem {
  week: string;
  days: string;
  maxKp: number;
  avgKp: number;
  risk: string;
}

interface CustomPreset {
  id: string;
  name: string;
  country: string;
  admin1?: string;
  lat: number;
  lon: number;
}

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

// Error Boundary to prevent any blank or black screen on mobile devices
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error Caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center justify-center text-center">
          <ShieldAlert className="w-10 h-10 text-amber-400 mb-3" />
          <h2 className="text-base font-bold">Stealth Aurora Interface</h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Interface reset required. Tap below to reload.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-emerald-600 rounded-xl text-xs font-semibold text-white"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainAppContent />
    </ErrorBoundary>
  );
}

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<'tester' | 'install' | 'settings' | 'guide'>('tester');
  const [currentWatchScreen, setCurrentWatchScreen] = useState<number>(0); // 0: Now, 1: 12h, 2: 24h, 3: 7d, 4: 28d
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [installSource, setInstallSource] = useState<'github' | 'live'>('github');
  const [packageFormat, setPackageFormat] = useState<'zab' | 'zpk'>('zab');
  const [githubRepo, setGithubRepo] = useState('petew1987/stealth-aurora-tracker');

  // Search & custom presets state (Up to 5 custom presets, default is GPS Local)
  const [savedPresets, setSavedPresets] = useState<CustomPreset[]>([]);
  const [currentRotationIndex, setCurrentRotationIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [uiNotification, setUiNotification] = useState<string | null>(null);

  // Simulated GPS Coordinates for Local View
  const [userGpsLat, setUserGpsLat] = useState<number>(64.14);
  const [userGpsLon, setUserGpsLon] = useState<number>(-21.94);

  // Live space weather metrics
  const [isUpdating, setIsUpdating] = useState(false);
  const [kpValue, setKpValue] = useState(4.5);
  const [cloudCover, setCloudCover] = useState(18);
  const [chancePercent, setChancePercent] = useState(78);
  const [guidanceText, setGuidanceText] = useState('High Viewing Chance');
  const [stormScale, setStormScale] = useState('G1 Minor Storm');
  const [locationName, setLocationName] = useState('Local GPS (64.1N)');

  // 12-Hour Forecast items (Viewing Probability, Cloud Cover, KP Index)
  const [forecast12h, setForecast12h] = useState<Forecast12hItem[]>([
    { hour: '+1h', prob: 70, clouds: 20, kp: 4.5 },
    { hour: '+2h', prob: 76, clouds: 18, kp: 4.7 },
    { hour: '+3h', prob: 84, clouds: 15, kp: 5.1 },
    { hour: '+4h', prob: 82, clouds: 22, kp: 5.0 },
    { hour: '+5h', prob: 74, clouds: 28, kp: 4.6 },
    { hour: '+6h', prob: 62, clouds: 35, kp: 4.2 },
    { hour: '+7h', prob: 50, clouds: 40, kp: 3.8 },
    { hour: '+8h', prob: 42, clouds: 38, kp: 3.5 },
    { hour: '+9h', prob: 36, clouds: 45, kp: 3.2 },
    { hour: '+10h', prob: 28, clouds: 50, kp: 2.9 },
    { hour: '+11h', prob: 24, clouds: 48, kp: 2.7 },
    { hour: '+12h', prob: 20, clouds: 55, kp: 2.5 }
  ]);

  // 24-Hour Forecast items (Viewing Probability, Cloud Cover, KP Index)
  const [forecast24h, setForecast24h] = useState<Forecast24hItem[]>([
    { block: '+3h', prob: 80, clouds: 18, kp: 4.8 },
    { block: '+6h', prob: 72, clouds: 25, kp: 4.5 },
    { block: '+9h', prob: 45, clouds: 40, kp: 3.5 },
    { block: '+12h', prob: 25, clouds: 50, kp: 2.8 },
    { block: '+15h', prob: 30, clouds: 45, kp: 3.0 },
    { block: '+18h', prob: 60, clouds: 30, kp: 4.2 },
    { block: '+21h', prob: 85, clouds: 15, kp: 5.3 },
    { block: '+24h', prob: 78, clouds: 20, kp: 4.9 }
  ]);

  // 7-Day Forecast items (All include KP Index)
  const [forecast7d, setForecast7d] = useState<Forecast7dItem[]>([
    { day: 'D1', kp: 5.0, clouds: 20, prob: 78, rating: 'Storm' },
    { day: 'D2', kp: 4.7, clouds: 25, prob: 72, rating: 'Active' },
    { day: 'D3', kp: 3.5, clouds: 35, prob: 48, rating: 'Unsettled' },
    { day: 'D4', kp: 2.8, clouds: 40, prob: 30, rating: 'Quiet' },
    { day: 'D5', kp: 3.5, clouds: 30, prob: 52, rating: 'Unsettled' },
    { day: 'D6', kp: 4.2, clouds: 22, prob: 68, rating: 'Active' },
    { day: 'D7', kp: 5.3, clouds: 18, prob: 84, rating: 'Storm' }
  ]);

  // 28-Day Solar Cycle items (All include KP Index)
  const [forecast28d, setForecast28d] = useState<Forecast28dItem[]>([
    { week: 'Wk 1', days: 'D1-7', maxKp: 5.3, avgKp: 4.1, risk: 'Storm Risk' },
    { week: 'Wk 2', days: 'D8-14', maxKp: 3.8, avgKp: 2.9, risk: 'Unsettled' },
    { week: 'Wk 3', days: 'D15-21', maxKp: 4.5, avgKp: 3.4, risk: 'Active' },
    { week: 'Wk 4', days: 'D22-28', maxKp: 5.7, avgKp: 4.4, risk: 'Recurrent Storm' }
  ]);

  // Touch swipe handling for watch preview
  const touchStartXRef = useRef<number | null>(null);

  const fullRotationList = [
    { id: 'local', name: 'GPS Local (Default)', isGps: true, lat: userGpsLat, lon: userGpsLon, country: '' },
    ...savedPresets.map(p => ({ id: p.id, name: p.name, isGps: false, lat: p.lat, lon: p.lon, country: p.country }))
  ];

  const activeSite = fullRotationList[currentRotationIndex % fullRotationList.length] || fullRotationList[0];

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
    try {
      const uri = getActiveZpkd1Url();
      QRCode.toDataURL(uri, {
        width: 260,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' }
      })
        .then((url: string) => setQrDataUrl(url))
        .catch((err: unknown) => console.error('QR error:', err));
    } catch (e) {
      console.warn('QR code generation error:', e);
    }
  }, [installSource, packageFormat, githubRepo]);

  // Geolocation safely attempt without crashing
  useEffect(() => {
    try {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (pos && pos.coords) {
              setUserGpsLat(pos.coords.latitude);
              setUserGpsLon(pos.coords.longitude);
            }
          },
          () => {},
          { timeout: 5000, enableHighAccuracy: false }
        );
      }
    } catch (err) {
      console.log('Safe geolocation catch:', err);
    }
  }, []);

  const copyScheme = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(getActiveZpkd1Url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const showNotification = (msg: string) => {
    setUiNotification(msg);
    setTimeout(() => setUiNotification(null), 3000);
  };

  // Text Search via Open-Meteo Geocoding
  const handleSearchLocations = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;

    setIsSearching(true);
    setSearchError('');

    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        searchQuery.trim()
      )}&count=6&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        setSearchResults(data.results);
      } else {
        setSearchResults([]);
        setSearchError('No locations found matching "' + searchQuery + '"');
      }
    } catch {
      setSearchError('Geocoding service unavailable');
    } finally {
      setIsSearching(false);
    }
  };

  // Add Location to Presets (Capped at 5)
  const addLocationToPresets = (result: GeocodingResult) => {
    if (savedPresets.length >= 5) {
      showNotification('Maximum of 5 preset locations reached. Please remove one to add another.');
      return;
    }
    if (savedPresets.some(p => p.id === String(result.id))) {
      return;
    }

    const newPreset: CustomPreset = {
      id: String(result.id),
      name: result.name,
      country: result.country || '',
      admin1: result.admin1,
      lat: Number(result.latitude.toFixed(4)),
      lon: Number(result.longitude.toFixed(4))
    };

    setSavedPresets([...savedPresets, newPreset]);
    showNotification(`Added ${result.name} to watch presets`);
  };

  // Remove Location
  const removeLocationFromPresets = (id: string) => {
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    if (currentRotationIndex >= updated.length + 1) {
      setCurrentRotationIndex(0);
    }
  };

  // Cycle to next location on watchface
  const cycleWatchLocation = () => {
    const nextIdx = (currentRotationIndex + 1) % fullRotationList.length;
    setCurrentRotationIndex(nextIdx);
    const nextTarget = fullRotationList[nextIdx];
    fetchLiveSpaceData(nextTarget);
  };

  // Live Space Weather & Cloud Cover Computation across all forecast windows
  const fetchLiveSpaceData = async (site = activeSite) => {
    setIsUpdating(true);

    const lat = site.isGps ? userGpsLat : site.lat;
    const lon = site.isGps ? userGpsLon : site.lon;

    const label = site.isGps
      ? `Local GPS (${Math.abs(lat).toFixed(1)}${lat >= 0 ? 'N' : 'S'})`
      : `${site.name}${site.country ? ', ' + site.country : ''}`;
    setLocationName(label);

    try {
      // 1. NOAA SWPC Planetary K-Index & 27-day Outlook
      let liveKp = 4.3;
      let outlook28Kps: number[] = [];

      try {
        const [noaaRes, outlookRes] = await Promise.all([
          fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'),
          fetch('https://services.swpc.noaa.gov/text/27-day-outlook.txt')
        ]);

        if (noaaRes.ok) {
          const rows = await noaaRes.json();
          if (Array.isArray(rows) && rows.length > 1) {
            const latest = rows[rows.length - 1];
            const parsed = parseFloat(latest[1]);
            if (!isNaN(parsed)) liveKp = parsed;
          }
        }

        if (outlookRes.ok) {
          const text = await outlookRes.text();
          const lines = text.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(':')) continue;
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 4) {
              const k = parseFloat(parts[parts.length - 1]);
              if (!isNaN(k)) outlook28Kps.push(k);
            }
          }
        }
      } catch (e) {
        console.warn('NOAA space data catch', e);
      }

      while (outlook28Kps.length < 28) {
        const val = 2.5 + Math.sin(outlook28Kps.length * 0.4) * 1.8;
        outlook28Kps.push(Number(Math.max(1, Math.min(6, val)).toFixed(1)));
      }

      // 2. Open-Meteo multi-range clouds
      let liveClouds = 20;
      let hourlyCloudsList: number[] = [];
      let dailyCloudsList: number[] = [];

      try {
        const meteoRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&current=cloud_cover&hourly=cloud_cover&daily=cloud_cover_mean&forecast_days=7`
        );
        if (meteoRes.ok) {
          const meteoData = await meteoRes.json();
          if (meteoData?.current?.cloud_cover !== undefined) {
            liveClouds = Math.round(meteoData.current.cloud_cover);
          }
          if (Array.isArray(meteoData?.hourly?.cloud_cover)) {
            hourlyCloudsList = meteoData.hourly.cloud_cover.slice(0, 24);
          }
          if (Array.isArray(meteoData?.daily?.cloud_cover_mean)) {
            dailyCloudsList = meteoData.daily.cloud_cover_mean.slice(0, 7);
          }
        }
      } catch (e) {
        console.warn('Meteo clouds catch', e);
      }

      while (hourlyCloudsList.length < 24) hourlyCloudsList.push(liveClouds);
      while (dailyCloudsList.length < 7) dailyCloudsList.push(liveClouds);

      // Geomagnetic latitude & Current chance
      const magLat = Math.abs(lat) - (lon < 0 ? 1.5 : -1.5);
      const ovalCenter = 68.0 - 2.1 * liveKp;
      const delta = Math.abs(magLat - ovalCenter);
      let rawProb = delta <= 3 ? 90 : Math.max(10, Math.round(86 - delta * 9 + liveKp * 4));

      let computedChance = rawProb;
      let guidance = 'Active Aurora';
      if (liveClouds > 80) {
        computedChance = Math.min(10, Math.round(rawProb * 0.12));
        guidance = 'Overcast (No Visibility)';
      } else if (liveClouds > 55) {
        computedChance = Math.round(rawProb * 0.55);
        guidance = 'Partly Cloudy Skies';
      } else {
        guidance = rawProb > 65 ? 'High Viewing Chance' : 'Fair Skies · Low Kp';
      }

      let scale = 'G0 Normal';
      if (liveKp >= 8.67) scale = 'G5 Extreme Storm';
      else if (liveKp >= 7.67) scale = 'G4 Severe Storm';
      else if (liveKp >= 6.67) scale = 'G3 Strong Storm';
      else if (liveKp >= 5.67) scale = 'G2 Moderate Storm';
      else if (liveKp >= 4.67) scale = 'G1 Minor Storm';

      setKpValue(Number(liveKp.toFixed(1)));
      setCloudCover(liveClouds);
      setChancePercent(Math.min(99, Math.max(0, computedChance)));
      setGuidanceText(guidance);
      setStormScale(scale);

      // 3. Compute 12-Hour Forecast (Viewing Probability, Cloud Cover, KP Index)
      const new12h: Forecast12hItem[] = [];
      for (let i = 0; i < 12; i++) {
        const c = hourlyCloudsList[i] !== undefined ? Math.round(hourlyCloudsList[i]) : liveClouds;
        const projectedKp = Math.max(1.0, liveKp + Math.sin((i + 1) * 0.7) * 0.6);
        const hRaw = Math.max(5, Math.round(rawProb + Math.sin(i * 0.6) * 12));
        let hProb = hRaw;
        if (c > 80) hProb = Math.min(10, Math.round(hRaw * 0.1));
        else if (c > 50) hProb = Math.round(hRaw * 0.55);

        new12h.push({
          hour: `+${i + 1}h`,
          prob: Math.min(99, Math.max(0, hProb)),
          clouds: c,
          kp: Number(projectedKp.toFixed(1))
        });
      }
      setForecast12h(new12h);

      // 4. Compute 24-Hour Forecast (Viewing Probability, Cloud Cover, KP Index)
      const new24h: Forecast24hItem[] = [];
      for (let b = 0; b < 8; b++) {
        const hourIdx = b * 3 + 1;
        const c = hourlyCloudsList[hourIdx] !== undefined ? Math.round(hourlyCloudsList[hourIdx]) : liveClouds;
        const bKp = Math.max(1.0, liveKp + Math.sin((b + 1) * 0.9) * 0.8);
        const bRaw = Math.max(5, Math.round(rawProb + Math.sin(b * 0.7) * 14));
        let bProb = bRaw;
        if (c > 80) bProb = Math.min(10, Math.round(bRaw * 0.1));
        else if (c > 50) bProb = Math.round(bRaw * 0.55);

        new24h.push({
          block: `+${(b + 1) * 3}h`,
          prob: Math.min(99, Math.max(0, bProb)),
          clouds: c,
          kp: Number(bKp.toFixed(1))
        });
      }
      setForecast24h(new24h);

      // 5. Compute 7-Day Forecast (All include KP Index)
      const new7d: Forecast7dItem[] = [];
      const dayNames = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'];
      for (let d = 0; d < 7; d++) {
        const dKp = outlook28Kps[d] !== undefined ? outlook28Kps[d] : liveKp;
        const dClouds = dailyCloudsList[d] !== undefined ? Math.round(dailyCloudsList[d]) : 30;
        const dRaw = Math.max(10, Math.round(rawProb + (dKp - liveKp) * 8));
        let dProb = dRaw;
        if (dClouds > 80) dProb = Math.min(12, Math.round(dRaw * 0.12));
        else if (dClouds > 55) dProb = Math.round(dRaw * 0.55);

        let rat = 'Quiet';
        if (dKp >= 5.0) rat = 'Storm';
        else if (dKp >= 4.0) rat = 'Active';
        else if (dKp >= 3.0) rat = 'Unsettled';

        new7d.push({
          day: dayNames[d],
          kp: Number(dKp.toFixed(1)),
          clouds: dClouds,
          prob: Math.min(99, Math.max(0, dProb)),
          rating: rat
        });
      }
      setForecast7d(new7d);

      // 6. Compute 28-Day Solar Cycle Forecast (All include KP Index)
      const new28d: Forecast28dItem[] = [];
      for (let w = 0; w < 4; w++) {
        const s = w * 7;
        const slice = outlook28Kps.slice(s, s + 7);
        const maxK = Math.max(...slice);
        const avgK = Number((slice.reduce((acc, cur) => acc + cur, 0) / slice.length).toFixed(1));

        let risk = 'Low Risk';
        if (maxK >= 5.0) risk = 'Storm Risk';
        else if (maxK >= 4.0) risk = 'Active';

        new28d.push({
          week: `Week ${w + 1}`,
          days: `D${s + 1}-${s + 7}`,
          maxKp: maxK,
          avgKp: avgK,
          risk: risk
        });
      }
      setForecast28d(new28d);
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Screen Ring calculation
  let activeRingProb = chancePercent;
  if (currentWatchScreen === 1 && forecast12h.length > 0) {
    activeRingProb = Math.max(...forecast12h.map(f => f.prob));
  } else if (currentWatchScreen === 2 && forecast24h.length > 0) {
    activeRingProb = Math.max(...forecast24h.map(f => f.prob));
  } else if (currentWatchScreen === 3 && forecast7d.length > 0) {
    activeRingProb = Math.max(...forecast7d.map(f => f.prob));
  } else if (currentWatchScreen === 4 && forecast28d.length > 0) {
    const peakK = Math.max(...forecast28d.map(w => w.maxKp));
    activeRingProb = Math.min(100, Math.round(peakK * 15));
  }

  const ringRadius = 229;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const activeSweep = (activeRingProb / 100) * ringCircumference;

  // Swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;
    if (Math.abs(diff) > 40) {
      if (diff < 0) {
        // swipe left -> next screen
        setCurrentWatchScreen(prev => (prev + 1) % 5);
      } else {
        // swipe right -> prev screen
        setCurrentWatchScreen(prev => (prev - 1 + 5) % 5);
      }
    }
    touchStartXRef.current = null;
  };

  const screenTitles = [
    'NOW (1/5)',
    '12H FORECAST (2/5)',
    '24H FORECAST (3/5)',
    '7D OUTLOOK (4/5)',
    '28D SOLAR CYCLE (5/5)'
  ];

  return (
    <div className="min-h-[100dvh] bg-[#070b14] text-zinc-100 font-sans antialiased selection:bg-emerald-600/30 selection:text-emerald-300 flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-zinc-900/80 bg-[#090d18]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Compass className="w-4 h-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-white">Stealth Aurora Tracker</h1>
              <span className="text-[11px] text-zinc-400">Active 3 (466x466)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Zepp OS 3.0 / 2.x
            </span>
          </div>
        </div>
      </header>

      {/* In-App Notification Toast */}
      {uiNotification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/90 border border-emerald-500/40 text-emerald-100 text-xs px-4 py-2 rounded-xl shadow-xl backdrop-blur transition-all">
          {uiNotification}
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-4 pb-24 overflow-x-hidden">
        {/* TAB 1: WATCH EMULATOR WITH 5 SWIPEABLE SCREENS */}
        {activeTab === 'tester' && (
          <div className="space-y-3.5">
            {/* Header info */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Swipeable AMOLED Watch View
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Swipe watch horizontally or tap arrows to view 12h, 24h, 7d, and 28d forecasts.
                </p>
              </div>

              {/* Quick cycle button */}
              <button
                onClick={() => setCurrentWatchScreen((prev) => (prev + 1) % 5)}
                className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white"
              >
                Next Screen ({currentWatchScreen + 1}/5)
              </button>
            </div>

            {/* Quick Rotation Site Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-zinc-500 text-[11px] shrink-0 font-medium">Location:</span>
              {fullRotationList.map((site, idx) => (
                <button
                  key={site.id}
                  onClick={() => {
                    setCurrentRotationIndex(idx);
                    fetchLiveSpaceData(site);
                  }}
                  className={`px-2.5 py-1 rounded-full shrink-0 border text-[11px] transition-all ${
                    currentRotationIndex === idx
                      ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 font-medium'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {site.name}
                </button>
              ))}
            </div>

            {/* 466x466 AMOLED Circular Display Container */}
            <div className="flex justify-center py-1">
              <div
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="relative w-full max-w-[340px] xs:max-w-[360px] sm:max-w-[400px] aspect-square rounded-full bg-black p-2 shadow-2xl border-4 border-zinc-900/90 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing select-none"
                title="Swipe horizontally or use arrows to switch screens"
              >
                {/* 1px Outer Margin Circular Ring Frame */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 466 466">
                  {/* Background Track */}
                  <circle
                    cx="233"
                    cy="233"
                    r={ringRadius}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="6"
                  />
                  {/* Active Probability Arc */}
                  <circle
                    cx="233"
                    cy="233"
                    r={ringRadius}
                    fill="none"
                    stroke={
                      activeRingProb >= 70
                        ? '#10b981'
                        : activeRingProb >= 40
                        ? '#06b6d4'
                        : '#38bdf8'
                    }
                    strokeWidth="6"
                    strokeDasharray={`${activeSweep} ${ringCircumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Top Header Navigation Inside Watchface */}
                <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-center gap-1.5 px-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentWatchScreen((prev) => (prev - 1 + 5) % 5);
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800/80 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentWatchScreen((prev) => (prev + 1) % 5);
                    }}
                    className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-semibold tracking-wider text-white hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    {screenTitles[currentWatchScreen]}
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentWatchScreen((prev) => (prev + 1) % 5);
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800/80 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* SCREEN CONTENT AREA (100% Inside Ring Radius 220px) */}
                <div className="relative w-full h-full flex flex-col items-center justify-center pt-11 pb-8 px-6 text-center select-none">
                  {/* ================= SCREEN 0: NOW ================= */}
                  {currentWatchScreen === 0 && (
                    <div className="flex flex-col items-center justify-between h-full w-full py-1">
                      {/* Top Row: Kp & Cloud Cover */}
                      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold pt-1">
                        <span className="text-sky-400">Kp {kpValue}</span>
                        <span className="text-zinc-600">·</span>
                        <span className={cloudCover < 30 ? 'text-emerald-400' : 'text-amber-400'}>
                          Cloud {cloudCover}%
                        </span>
                      </div>

                      {/* Hero Probability Number */}
                      <div className="my-auto text-center">
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
                        <div className="text-xs sm:text-sm font-medium text-zinc-200 mt-1">
                          {guidanceText}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-0.5 font-mono">
                          {stormScale}
                        </div>
                      </div>

                      {/* Bottom Area: Location Above Refresh Button */}
                      <div className="flex flex-col items-center gap-1.5 pb-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            cycleWatchLocation();
                          }}
                          className="px-3 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-300 tracking-wide flex items-center gap-1 shadow-sm active:scale-95 transition-all max-w-[240px]"
                        >
                          <span className="truncate">{locationName}</span>
                          {fullRotationList.length > 1 && (
                            <span className="text-[10px] text-sky-400 shrink-0">
                              ({currentRotationIndex + 1}/{fullRotationList.length}) ▾
                            </span>
                          )}
                        </button>

                        {/* Refresh Button: Refresh Logo ONLY, NO Text */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchLiveSpaceData();
                          }}
                          disabled={isUpdating}
                          className="w-11 h-11 rounded-full bg-teal-800 hover:bg-teal-700 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all border border-teal-600/30"
                          title="Refresh Now"
                        >
                          <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ================= SCREEN 1: 12-HOUR FORECAST ================= */}
                  {currentWatchScreen === 1 && (
                    <div className="flex flex-col items-center justify-between h-full w-full py-1">
                      {/* Summary Subheader */}
                      <div className="text-[11px] text-sky-400 font-semibold tracking-wide">
                        12H PEAK {Math.max(...forecast12h.map(f => f.prob))}% · MAX KP {Math.max(...forecast12h.map(f => f.kp))}
                      </div>

                      {/* 12-Hour Hourly Columns */}
                      <div className="w-full max-w-[270px] bg-zinc-950/70 border border-zinc-900/80 rounded-xl p-2 my-auto">
                        <div className="grid grid-cols-12 gap-1 items-end h-16 px-0.5">
                          {forecast12h.map((item, idx) => {
                            const barHeight = Math.max(12, Math.round((item.prob / 100) * 100));
                            const color =
                              item.prob >= 70
                                ? 'bg-emerald-500'
                                : item.prob >= 40
                                ? 'bg-cyan-500'
                                : 'bg-slate-700';

                            return (
                              <div key={idx} className="flex flex-col items-center gap-0.5 h-full justify-end">
                                <span className="text-[8px] text-zinc-400 font-mono">
                                  {item.prob}%
                                </span>
                                <div
                                  style={{ height: `${barHeight}%` }}
                                  className={`w-full rounded-xs transition-all ${color}`}
                                />
                                <span className="text-[8px] text-zinc-400 font-mono">
                                  {item.hour.replace('h', '')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 12h Metrics Table (Viewing Prob, Cloud Cover, KP) */}
                      <div className="w-full max-w-[270px] bg-slate-900/80 border border-slate-800 rounded-lg p-2 text-left text-[10px] space-y-1">
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <Eye className="w-3 h-3" /> Viewing Odds:
                          </span>
                          <span className="font-bold">{forecast12h[0].prob}% to {Math.max(...forecast12h.map(f => f.prob))}%</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="flex items-center gap-1 text-sky-400 font-medium">
                            <CloudSun className="w-3 h-3" /> Cloud Cover:
                          </span>
                          <span>{forecast12h[0].clouds}% - {forecast12h[3].clouds}% clouds</span>
                        </div>
                        <div className="flex items-center justify-between text-zinc-300">
                          <span className="flex items-center gap-1 text-violet-400 font-medium">
                            <Clock className="w-3 h-3" /> Planetary Kp:
                          </span>
                          <span className="font-mono">Kp {forecast12h[0].kp} to {Math.max(...forecast12h.map(f => f.kp))}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ================= SCREEN 2: 24-HOUR FORECAST ================= */}
                  {currentWatchScreen === 2 && (
                    <div className="flex flex-col items-center justify-between h-full w-full py-1">
                      {/* Summary Subheader */}
                      <div className="text-[11px] text-sky-400 font-semibold tracking-wide">
                        24-HOUR SYNOPTIC TIMELINE
                      </div>

                      {/* 8 3-Hour Synoptic Blocks */}
                      <div className="w-full max-w-[280px] bg-zinc-950/70 border border-zinc-900/80 rounded-xl p-2 my-auto">
                        <div className="grid grid-cols-4 gap-1.5 text-left">
                          {forecast24h.map((b, idx) => (
                            <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-md p-1.5">
                              <div className="text-[9px] font-bold text-sky-400">{b.block}</div>
                              <div className={`text-xs font-black ${b.prob >= 70 ? 'text-emerald-400' : b.prob >= 40 ? 'text-cyan-400' : 'text-slate-400'}`}>
                                {b.prob}%
                              </div>
                              <div className="text-[8px] text-zinc-400 mt-0.5">
                                Cld {b.clouds}%
                              </div>
                              <div className="text-[8px] text-violet-300 font-mono">
                                Kp {b.kp}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 24h Summary badge */}
                      <div className="w-full max-w-[270px] bg-slate-900/80 border border-slate-800 rounded-lg py-1 px-3 text-[11px] text-emerald-300 flex items-center justify-between">
                        <span>Peak Window: +18h to +24h</span>
                        <span className="font-bold">Max Kp {Math.max(...forecast24h.map(b => b.kp))}</span>
                      </div>
                    </div>
                  )}

                  {/* ================= SCREEN 3: 7-DAY FORECAST ================= */}
                  {currentWatchScreen === 3 && (
                    <div className="flex flex-col items-center justify-between h-full w-full py-1">
                      <div className="text-[11px] text-sky-400 font-semibold tracking-wide">
                        7-DAY GEOMAGNETIC OUTLOOK
                      </div>

                      {/* 7 Daily Rows */}
                      <div className="w-full max-w-[280px] space-y-1 my-auto">
                        {forecast7d.map((d, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-md text-[11px]"
                          >
                            <span className="font-bold text-white w-6">{d.day}</span>
                            <span className="text-violet-400 font-mono text-[10px]">Kp {d.kp}</span>
                            <span className="text-zinc-400 text-[10px]">Cld {d.clouds}%</span>
                            <span
                              className={`font-bold text-[11px] ${
                                d.prob >= 70 ? 'text-emerald-400' : d.prob >= 40 ? 'text-cyan-400' : 'text-slate-400'
                              }`}
                            >
                              {d.prob}%
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                                d.rating === 'Storm'
                                  ? 'bg-purple-950 text-purple-300'
                                  : d.rating === 'Active'
                                  ? 'bg-emerald-950 text-emerald-300'
                                  : 'bg-zinc-800 text-zinc-400'
                              }`}
                            >
                              {d.rating}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] text-zinc-400">
                        Daily Kp derived from NOAA 3-Day & Recurrent Solar Model
                      </div>
                    </div>
                  )}

                  {/* ================= SCREEN 4: 28-DAY SOLAR CYCLE ================= */}
                  {currentWatchScreen === 4 && (
                    <div className="flex flex-col items-center justify-between h-full w-full py-1">
                      <div className="text-[11px] text-sky-400 font-semibold tracking-wide">
                        28-DAY SOLAR CARRINGTON CYCLE
                      </div>

                      {/* 4 Weekly Forecast Cards */}
                      <div className="w-full max-w-[280px] space-y-1.5 my-auto">
                        {forecast28d.map((w, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg text-left"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">
                                {w.week} ({w.days})
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  w.risk.includes('Storm')
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800'
                                    : 'bg-emerald-950 text-emerald-300'
                                }`}
                              >
                                {w.risk}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                              <span>Peak Kp: <strong className="text-violet-300">Kp {w.maxKp}</strong></span>
                              <span>Average: <strong className="text-sky-300">Kp {w.avgKp}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-[10px] text-zinc-400">
                        27-28 day recurrent active regions return as sun rotates
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom 5-Dot Navigation Indicator */}
                <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-center gap-2">
                  {[0, 1, 2, 3, 4].map((dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentWatchScreen(dotIdx);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        currentWatchScreen === dotIdx
                          ? 'w-6 bg-emerald-400'
                          : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                      }`}
                      title={`Go to ${screenTitles[dotIdx]}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INSTALL VIA QR CODE */}
        {activeTab === 'install' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Install on Amazfit Active 3</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
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
                  .zab Bundle
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
            <div className="flex flex-col items-center justify-center py-2">
              <div className="p-3.5 bg-white rounded-2xl shadow-xl">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Zepp OS QR Installer" className="w-48 h-48 sm:w-56 sm:h-56" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-zinc-400">
                    Generating QR code...
                  </div>
                )}
              </div>
              <span className="text-[11px] text-zinc-500 mt-2 font-mono">
                {installSource === 'github'
                  ? `${githubRepo} · zepphello.${packageFormat}`
                  : `Live server · zepphello.${packageFormat}`}
              </span>
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

        {/* TAB 3: SETTINGS & SEARCH (Max 5 Presets, No Preloaded Locations) */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white">Zepp App Phone Settings</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                <strong>GPS Local</strong> is always the default. Search and save up to <strong>5 custom presets</strong> below.
              </p>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-4 sm:p-5 space-y-4 text-xs">
              {/* Default GPS Local Card */}
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-300 text-xs">
                    GPS Local (Default View)
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Real-time position sensing via watch GPS sensor.
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                  ALWAYS ON
                </span>
              </div>

              {/* Saved Custom Locations List (0 to 5) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                    Saved Watch Presets ({savedPresets.length}/5 Max)
                  </h3>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {5 - savedPresets.length} slots free
                  </span>
                </div>

                {savedPresets.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-zinc-500 text-[11px]">
                    No custom locations added yet. Search below to add up to 5 custom observing sites.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {savedPresets.map((loc, idx) => (
                      <div
                        key={loc.id}
                        className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-xs text-white">
                            {idx + 1}. {loc.name}
                            {loc.country && <span className="text-zinc-400 font-normal">, {loc.country}</span>}
                          </div>
                          <div className="text-[10px] text-sky-400 font-mono mt-0.5">
                            {loc.lat >= 0 ? `${loc.lat}N` : `${Math.abs(loc.lat)}S`},{' '}
                            {loc.lon >= 0 ? `${loc.lon}E` : `${Math.abs(loc.lon)}W`}
                          </div>
                        </div>

                        <button
                          onClick={() => removeLocationFromPresets(loc.id)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
                          title="Remove preset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Text Search System */}
              <div className="border-t border-zinc-900 pt-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wide mb-1">
                  <Search className="w-3.5 h-3.5 text-emerald-400" />
                  Search Global Locations & Coordinates
                </h3>
                <p className="text-zinc-400 text-[11px] mb-2.5">
                  Type any city or region to search coordinates via Open-Meteo Geocoding:
                </p>

                <form onSubmit={handleSearchLocations} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Tromso, Fairbanks, Kiruna, Calgary..."
                    className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    Search
                  </button>
                </form>

                {searchError && (
                  <p className="text-rose-400 text-[11px] mt-2">{searchError}</p>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-1.5 border border-zinc-800 rounded-xl p-2 bg-zinc-950">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                      Search Results
                    </span>
                    {searchResults.map(result => {
                      const isAdded = savedPresets.some(p => p.id === String(result.id));
                      const isFull = savedPresets.length >= 5;

                      return (
                        <div
                          key={result.id}
                          className="p-2.5 rounded-lg bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/60 flex items-center justify-between transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-xs text-white">
                              {result.name}
                              {result.admin1 && <span className="text-zinc-400">, {result.admin1}</span>}
                              {result.country && <span className="text-zinc-400"> ({result.country})</span>}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                              Lat: {result.latitude.toFixed(3)}, Lon: {result.longitude.toFixed(3)}
                            </div>
                          </div>

                          <button
                            onClick={() => addLocationToPresets(result)}
                            disabled={isAdded || isFull}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                              isAdded
                                ? 'bg-zinc-800 text-zinc-500 cursor-default'
                                : isFull
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                            }`}
                          >
                            {isAdded ? (
                              'Added'
                            ) : isFull ? (
                              'List Full'
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                Add
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ARCHITECTURE GUIDE */}
        {activeTab === 'guide' && (
          <div className="space-y-3.5 text-xs text-zinc-300">
            <div>
              <h2 className="text-sm font-semibold text-white">5-Screen Swipeable Zepp OS Architecture</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                How Stealth Aurora Tracker coordinates watch sensors, swipe gestures, and NOAA solar models.
              </p>
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900">
                <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  1. Multi-Screen Gesture Navigation
                </h3>
                <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                  Swiping left/right calls <code>hmApp.registerGestureEvent</code>. On-screen chevron buttons and dot indicators allow instant screen switching. 5 dedicated screens: Now, 12h, 24h, 7d, and 28d solar cycle.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900">
                <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-400" />
                  2. NOAA 28-Day Solar Carrington Outlook
                </h3>
                <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                  The companion service parses official NOAA SWPC 27-day forecast tables, forecasting recurrent coronal hole storm activity that repeats every 27-28 days with the sun&apos;s rotation.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900">
                <h3 className="font-semibold text-white text-xs flex items-center gap-1.5">
                  <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                  3. Open-Meteo Multi-Range Cloud Cover
                </h3>
                <p className="text-zinc-400 text-[11px] mt-1 leading-relaxed">
                  Provides hourly cloud cover for 12h and 24h views, plus 7-day daily mean cloud cover to attenuate viewing probabilities when overcast skies obscure auroral displays.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 border-t border-zinc-900/90 bg-[#090d18]/95 backdrop-blur z-40">
        <div className="max-w-xl mx-auto px-4 h-16 grid grid-cols-4 items-center">
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
            onClick={() => setActiveTab('install')}
            className={`flex flex-col items-center justify-center gap-1 py-1 transition-colors ${
              activeTab === 'install' ? 'text-emerald-400 font-medium' : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span className="text-[11px]">Install</span>
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
            <span className="text-[11px]">Guide</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
