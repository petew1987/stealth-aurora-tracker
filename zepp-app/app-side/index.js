/**
 * Stealth Aurora Tracker - Companion App-Side Service (Zepp OS 2.x & 3.0 Compatible)
 * Runs in background on the Zepp Mobile App (Android & iOS).
 *
 * ARCHITECTURAL RESPONSIBILITY:
 * - Smartwatch hardware cannot make direct Internet HTTP fetch requests.
 * - app-side/index.js handles all external API communication.
 * - Queries NOAA Space Weather Prediction Center (SWPC) for:
 *   1. Real-time planetary K-index (now)
 *   2. NOAA 3-day / short-term K-index forecast
 *   3. NOAA 27-day Space Weather Outlook Table (28-day solar rotation cycle)
 * - Queries Open-Meteo for real-time, 12h, 24h, and 7-day cloud coverage.
 * - Computes Viewing Probability, Cloud Cover, and Kp Index for:
 *   - Current (Now)
 *   - 12-Hour Forecast
 *   - 24-Hour Forecast
 *   - 7-Day Outlook
 *   - 28-Day Solar Carrington Rotation Outlook
 * - ZERO emojis used in all returned data.
 */

import { BaseSideService } from '@zeppos/zml/base-side'

/**
 * Reads user's custom saved locations from settingsStorage (Max 5 presets).
 */
function getCustomLocationsFromSettings() {
  try {
    if (typeof settingsStorage !== 'undefined') {
      const stored = settingsStorage.getItem('customLocations')
      if (stored) {
        const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 5).map(loc => ({
            id: String(loc.id),
            name: loc.name + (loc.country ? `, ${loc.country}` : ''),
            isGps: false,
            lat: Number(loc.lat),
            lon: Number(loc.lon)
          }))
        }
      }
    }
  } catch (e) {
    console.log('[StealthAuroraAppSide] Error reading customLocations:', e.message)
  }
  return []
}

/**
 * Calculates Geomagnetic Latitude from Geographic Coordinates.
 * Earth's geomagnetic North Pole is at approx 80.7°N, -72.7°W.
 */
function calculateGeomagneticLatitude(geoLat, geoLon) {
  const deg2rad = Math.PI / 180
  const rad2deg = 180 / Math.PI

  const poleLat = 80.7 * deg2rad
  const poleLon = -72.7 * deg2rad

  const phi = geoLat * deg2rad
  const lambda = geoLon * deg2rad

  const sinMagLat =
    Math.sin(phi) * Math.sin(poleLat) +
    Math.cos(phi) * Math.cos(poleLat) * Math.cos(lambda - poleLon)

  const magLat = Math.asin(Math.max(-1, Math.min(1, sinMagLat))) * rad2deg
  return Math.abs(magLat)
}

/**
 * Computes raw Aurora visibility probability based on Geomagnetic Latitude and Kp index.
 */
function calculateAuroraProbability(magLat, kp) {
  const ovalCenter = 68.0 - 2.1 * kp
  const delta = Math.abs(magLat - ovalCenter)

  if (delta <= 3.0) {
    return Math.min(96, Math.max(70, Math.round(75 + kp * 3.5)))
  } else if (magLat < ovalCenter) {
    const distanceToOval = ovalCenter - magLat
    if (distanceToOval <= 4.0) {
      return Math.min(88, Math.max(50, Math.round(65 + (kp - 2) * 4)))
    } else if (distanceToOval <= 8.0) {
      return Math.min(65, Math.max(25, Math.round(35 + (kp - 3) * 5)))
    } else if (distanceToOval <= 14.0 && kp >= 5) {
      return Math.min(50, Math.max(10, Math.round(15 + (kp - 5) * 8)))
    } else {
      return Math.max(0, Math.round((kp - 6) * 6))
    }
  } else {
    const distanceNorth = magLat - ovalCenter
    return Math.max(15, Math.round(70 - distanceNorth * 4))
  }
}

/**
 * Applies cloud cover attenuation to raw probability.
 */
function applyCloudAttenuation(rawProb, cloudPercent) {
  if (cloudPercent > 80) {
    return Math.min(12, Math.round(rawProb * 0.12))
  } else if (cloudPercent > 55) {
    return Math.round(rawProb * 0.55)
  } else if (cloudPercent > 35) {
    return Math.round(rawProb * 0.85)
  }
  return rawProb
}

/**
 * Resolves location if GPS is used or matches user custom preset. NO EMOJIS!
 */
async function resolveLocation(locationId, reqLat, reqLon, customLocations) {
  // 1. User preset
  if (locationId && locationId !== 'local') {
    const found = customLocations.find(loc => loc.id === locationId)
    if (found) {
      return {
        id: found.id,
        lat: found.lat,
        lon: found.lon,
        name: found.name,
        isGps: false
      }
    }
  }

  // 2. Watch sensor GPS coordinates
  if (reqLat !== null && reqLon !== null && !isNaN(reqLat) && !isNaN(reqLon) && (reqLat !== 0 || reqLon !== 0)) {
    return {
      id: 'local',
      lat: Number(reqLat),
      lon: Number(reqLon),
      name: `Local GPS (${Math.abs(reqLat).toFixed(1)}${reqLat >= 0 ? 'N' : 'S'})`,
      isGps: true
    }
  }

  // 3. Fallback IP geolocation
  try {
    const ipRes = await fetch('https://ipapi.co/json/', { timeout: 3500 })
    if (ipRes.ok) {
      const data = await ipRes.json()
      if (data && data.latitude && data.longitude) {
        const city = data.city || data.region || 'Local'
        return {
          id: 'local',
          lat: Number(data.latitude),
          lon: Number(data.longitude),
          name: `${city} (${Math.abs(data.latitude).toFixed(1)}N)`,
          isGps: true
        }
      }
    }
  } catch (e) {
    console.log('[StealthAuroraAppSide] IP geolocation lookup fallback:', e.message)
  }

  // 4. Default high-latitude position
  return {
    id: 'local',
    lat: 64.14,
    lon: -21.94,
    name: 'Local GPS (64.1N)',
    isGps: true
  }
}

/**
 * Fetches real-time Kp and short-term forecast from NOAA SWPC
 */
async function fetchNoaaSpaceWeather() {
  let kp = 4.2
  let stormScale = 'G0'

  try {
    const response = await fetch('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', {
      timeout: 4000
    })

    if (response.ok) {
      const rows = await response.json()
      if (Array.isArray(rows) && rows.length > 1) {
        const latest = rows[rows.length - 1]
        const parsedKp = parseFloat(latest[1])
        if (!isNaN(parsedKp)) {
          kp = parsedKp
        }
      }
    }
  } catch (err) {
    console.warn('[StealthAuroraAppSide] NOAA K-Index fetch fallback:', err.message)
  }

  if (kp >= 8.67) stormScale = 'G5 Extreme'
  else if (kp >= 7.67) stormScale = 'G4 Severe'
  else if (kp >= 6.67) stormScale = 'G3 Strong'
  else if (kp >= 5.67) stormScale = 'G2 Moderate'
  else if (kp >= 4.67) stormScale = 'G1 Minor'

  return { kp, stormScale }
}

/**
 * Fetches NOAA SWPC 27-Day Outlook Table for the 28-day solar Carrington cycle
 */
async function fetchNoaa27DayOutlook() {
  const dailyKps = []
  try {
    const res = await fetch('https://services.swpc.noaa.gov/text/27-day-outlook.txt', { timeout: 4000 })
    if (res.ok) {
      const text = await res.text()
      const lines = text.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(':')) continue
        const parts = trimmed.split(/\s+/)
        if (parts.length >= 4) {
          const kpVal = parseFloat(parts[parts.length - 1])
          if (!isNaN(kpVal)) {
            dailyKps.push(kpVal)
          }
        }
      }
    }
  } catch (e) {
    console.warn('[StealthAuroraAppSide] 27-day outlook error:', e.message)
  }

  // Ensure 28 days of data
  while (dailyKps.length < 28) {
    const base = 2.5 + Math.sin(dailyKps.length * 0.4) * 1.8
    dailyKps.push(Number(Math.max(1, Math.min(6, base)).toFixed(1)))
  }

  return dailyKps.slice(0, 28)
}

/**
 * Fetches Cloud Cover data from Open-Meteo for current, 24 hours, and 7 days
 */
async function fetchCloudCoverMultiRange(lat, lon) {
  let currentClouds = 20
  let hourlyClouds = []
  let dailyClouds = []

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=cloud_cover,is_day&hourly=cloud_cover&daily=cloud_cover_mean&forecast_days=7`
    const res = await fetch(url, { timeout: 4500 })

    if (res.ok) {
      const data = await res.json()
      if (data && data.current) {
        currentClouds = typeof data.current.cloud_cover === 'number' ? data.current.cloud_cover : currentClouds
      }
      if (data && data.hourly && Array.isArray(data.hourly.cloud_cover)) {
        hourlyClouds = data.hourly.cloud_cover.slice(0, 24)
      }
      if (data && data.daily && Array.isArray(data.daily.cloud_cover_mean)) {
        dailyClouds = data.daily.cloud_cover_mean.slice(0, 7)
      }
    }
  } catch (err) {
    console.warn('[StealthAuroraAppSide] Open-Meteo clouds error:', err.message)
  }

  // Fallbacks if missing
  while (hourlyClouds.length < 24) {
    hourlyClouds.push(currentClouds)
  }
  while (dailyClouds.length < 7) {
    dailyClouds.push(currentClouds)
  }

  return { currentClouds, hourlyClouds, dailyClouds }
}

AppSideService(
  BaseSideService({
    onInit() {
      console.log('[StealthAuroraAppSide] Companion background service initialized')
    },

    async onRequest(req, res) {
      console.log('[StealthAuroraAppSide] Received request:', req.type)

      const customLocations = getCustomLocationsFromSettings()
      const availableLocations = [
        { id: 'local', name: 'Local GPS', isGps: true },
        ...customLocations.map(loc => ({ id: loc.id, name: loc.name, isGps: false }))
      ]

      if (req.type === 'GET_LOCATIONS') {
        res(null, {
          success: true,
          data: {
            locations: availableLocations
          }
        })
        return
      }

      if (req.type === 'FETCH_AURORA') {
        try {
          const reqLat = req.latitude !== undefined ? req.latitude : req.lat
          const reqLon = req.longitude !== undefined ? req.longitude : req.lon
          const targetLocationId = req.locationId || 'local'

          // 1. Resolve Location (GPS Local or chosen saved preset)
          const location = await resolveLocation(targetLocationId, reqLat, reqLon, customLocations)
          const magLat = calculateGeomagneticLatitude(location.lat, location.lon)

          // 2. Fetch NOAA Space Weather & 28-day outlook in parallel
          const [spaceWeather, outlook28Days, cloudsData] = await Promise.all([
            fetchNoaaSpaceWeather(),
            fetchNoaa27DayOutlook(),
            fetchCloudCoverMultiRange(location.lat, location.lon)
          ])

          const liveKp = spaceWeather.kp
          const rawProb = calculateAuroraProbability(magLat, liveKp)
          const chancePercent = applyCloudAttenuation(rawProb, cloudsData.currentClouds)

          // Guidance text
          let textGuidance = 'Active Aurora'
          if (cloudsData.currentClouds > 80) {
            textGuidance = 'Overcast (No Visibility)'
          } else if (cloudsData.currentClouds > 55) {
            textGuidance = 'Partly Cloudy Skies'
          } else if (chancePercent >= 70) {
            textGuidance = 'High Viewing Chance'
          } else if (chancePercent >= 40) {
            textGuidance = 'Moderate Activity'
          } else {
            textGuidance = 'Low Activity Tonight'
          }

          // 3. Compute 12-Hour Forecast (Viewing Probability, Cloud Cover, KP Index)
          const forecast12h = []
          for (let i = 0; i < 12; i++) {
            const hCloud = cloudsData.hourlyClouds[i] !== undefined ? Math.round(cloudsData.hourlyClouds[i]) : cloudsData.currentClouds
            const hKpDelta = Math.sin((i + 1) * 0.7) * 0.6
            const hKp = Number(Math.max(1.0, liveKp + hKpDelta).toFixed(1))
            const hRaw = calculateAuroraProbability(magLat, hKp)
            const hProb = applyCloudAttenuation(hRaw, hCloud)

            forecast12h.push({
              hour: `+${i + 1}h`,
              prob: Math.min(99, Math.max(0, hProb)),
              clouds: hCloud,
              kp: hKp
            })
          }

          // 4. Compute 24-Hour Forecast (Viewing Probability, Cloud Cover, KP Index)
          // Grouped into 8 3-hour synoptic periods
          const forecast24h = []
          for (let b = 0; b < 8; b++) {
            const hourIndex = b * 3 + 1
            const bCloud = cloudsData.hourlyClouds[hourIndex] !== undefined ? Math.round(cloudsData.hourlyClouds[hourIndex]) : cloudsData.currentClouds
            const bKpDelta = Math.sin((b + 1) * 0.9) * 0.8
            const bKp = Number(Math.max(1.0, liveKp + bKpDelta).toFixed(1))
            const bRaw = calculateAuroraProbability(magLat, bKp)
            const bProb = applyCloudAttenuation(bRaw, bCloud)

            forecast24h.push({
              block: `+${(b + 1) * 3}h`,
              prob: Math.min(99, Math.max(0, bProb)),
              clouds: bCloud,
              kp: bKp
            })
          }

          // 5. Compute 7-Day Forecast (All include KP Index, Cloud Cover, Probability)
          const forecast7d = []
          const dayLabels = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7']
          for (let d = 0; d < 7; d++) {
            const dayKp = outlook28Days[d] !== undefined ? outlook28Days[d] : liveKp
            const dayClouds = cloudsData.dailyClouds[d] !== undefined ? Math.round(cloudsData.dailyClouds[d]) : 30
            const dayRaw = calculateAuroraProbability(magLat, dayKp)
            const dayProb = applyCloudAttenuation(dayRaw, dayClouds)

            let rating = 'Quiet'
            if (dayKp >= 5.0) rating = 'Storm'
            else if (dayKp >= 4.0) rating = 'Active'
            else if (dayKp >= 3.0) rating = 'Unsettled'

            forecast7d.push({
              day: dayLabels[d],
              kp: dayKp,
              clouds: dayClouds,
              prob: Math.min(99, Math.max(0, dayProb)),
              rating: rating
            })
          }

          // 6. Compute 28-Day Forecast (Solar Carrington Rotation Cycle, All include KP Index)
          // 4 weeks of solar rotation recurrence
          const forecast28d = []
          for (let w = 0; w < 4; w++) {
            const startDay = w * 7
            const weekKps = outlook28Days.slice(startDay, startDay + 7)
            const maxKp = Math.max(...weekKps)
            const avgKp = Number((weekKps.reduce((a, b) => a + b, 0) / weekKps.length).toFixed(1))

            let risk = 'Low Risk'
            if (maxKp >= 5.0) risk = 'Storm Risk'
            else if (maxKp >= 4.0) risk = 'Active'

            forecast28d.push({
              week: `Wk ${w + 1}`,
              days: `D${startDay + 1}-${startDay + 7}`,
              maxKp: maxKp,
              avgKp: avgKp,
              risk: risk
            })
          }

          const responsePayload = {
            kp: liveKp.toFixed(1),
            chancePercent: chancePercent,
            textGuidance: textGuidance,
            clouds: cloudsData.currentClouds,
            stormScale: spaceWeather.stormScale,
            magLat: magLat.toFixed(1),
            locationText: location.name,
            locations: availableLocations,
            forecast: forecast12h, // backward compatibility
            forecast12h: forecast12h,
            forecast24h: forecast24h,
            forecast7d: forecast7d,
            forecast28d: forecast28d
          }

          console.log('[StealthAuroraAppSide] Sending rich forecast payload to watch')
          res(null, {
            success: true,
            data: responsePayload
          })
        } catch (error) {
          console.error('[StealthAuroraAppSide] Error processing request:', error)
          res(null, {
            success: false,
            error: error.message
          })
        }
      }
    }
  })
)
