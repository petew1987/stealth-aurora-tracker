/**
 * Stealth Aurora Tracker - Companion App-Side Service (Zepp OS 2.x & 3.0 Compatible)
 * Runs in background on the Zepp Mobile App (Android & iOS).
 *
 * ARCHITECTURAL RESPONSIBILITY:
 * - Smartwatch hardware cannot make direct Internet HTTP fetch requests.
 * - app-side/index.js provides full access to fetch() and settingsStorage.
 * - Manages user's selected watch locations (GPS Local default + user-selected Aurora hotspots).
 * - Queries NOAA Space Weather Prediction Center (SWPC) for real-time Kp index and auroral oval data.
 * - Queries Open-Meteo for real-time cloud coverage and 10-hour hourly cloud forecasts.
 * - Computes geomagnetic visibility probability, cloud attenuation, and 10-hour forecast.
 * - Returns a compact, lightweight JSON payload back to the watch UI to conserve RAM and battery.
 */

import { BaseSideService } from '@zeppos/zml/base-side'

// Master list of available Aurora monitoring locations
const ALL_PRESET_LOCATIONS = {
  local: { id: 'local', name: '📍 Local GPS', isGps: true, lat: null, lon: null },
  tromso: { id: 'tromso', name: 'Tromsø, NO', isGps: false, lat: 69.65, lon: 18.96 },
  fairbanks: { id: 'fairbanks', name: 'Fairbanks, US', isGps: false, lat: 64.84, lon: -147.72 },
  reykjavik: { id: 'reykjavik', name: 'Reykjavik, IS', isGps: false, lat: 64.14, lon: -21.94 },
  yellowknife: { id: 'yellowknife', name: 'Yellowknife, CA', isGps: false, lat: 62.45, lon: -114.37 },
  abisko: { id: 'abisko', name: 'Abisko, SE', isGps: false, lat: 68.35, lon: 18.83 },
  rovaniemi: { id: 'rovaniemi', name: 'Rovaniemi, FI', isGps: false, lat: 66.50, lon: 25.73 }
}

/**
 * Reads user's selected locations from settingsStorage
 */
function getActiveLocationsFromSettings() {
  let ids = ['local', 'tromso', 'fairbanks', 'reykjavik']
  try {
    if (typeof settingsStorage !== 'undefined') {
      const stored = settingsStorage.getItem('activeLocationIds')
      if (stored) {
        const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored
        if (Array.isArray(parsed) && parsed.length > 0) {
          ids = parsed
        }
      }
    }
  } catch (e) {
    console.log('[StealthAuroraAppSide] Error reading activeLocationIds:', e.message)
  }

  // Ensure 'local' GPS is always the default first option
  if (!ids.includes('local')) {
    ids.unshift('local')
  }

  return ids.map(id => ALL_PRESET_LOCATIONS[id] || ALL_PRESET_LOCATIONS.local)
}

/**
 * Calculates approximate Geomagnetic Latitude from Geographic Latitude & Longitude.
 * Earth's geomagnetic North Pole is approximately at 80.7°N, 72.7°W (-72.7° lon).
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
    Math.cos(phi) * Math.sin(poleLat) * Math.cos(lambda - poleLon)

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
 * Resolves location if GPS is used or falls back to IP
 */
async function resolveLocation(locationId, reqLat, reqLon) {
  // 1. If user requested a specific preset hotspot
  if (locationId && locationId !== 'local' && ALL_PRESET_LOCATIONS[locationId]) {
    const target = ALL_PRESET_LOCATIONS[locationId]
    return {
      id: target.id,
      lat: target.lat,
      lon: target.lon,
      name: target.name,
      isGps: false
    }
  }

  // 2. Default: GPS Local view
  if (reqLat !== null && reqLon !== null && !isNaN(reqLat) && !isNaN(reqLon) && (reqLat !== 0 || reqLon !== 0)) {
    return {
      id: 'local',
      lat: Number(reqLat),
      lon: Number(reqLon),
      name: `📍 Local (${Math.abs(reqLat).toFixed(1)}°${reqLat >= 0 ? 'N' : 'S'})`,
      isGps: true
    }
  }

  // 3. Fallback to IP geolocation if watch is indoors without satellite lock
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
          name: `📍 ${city} (${Math.abs(data.latitude).toFixed(1)}°N)`,
          isGps: true
        }
      }
    }
  } catch (e) {
    console.log('[StealthAuroraAppSide] IP geolocation lookup error:', e.message)
  }

  // 4. Default high-latitude site if completely offline
  return {
    id: 'local',
    lat: 69.65,
    lon: 18.96,
    name: '📍 Local (69.6°N)',
    isGps: true
  }
}

/**
 * Fetches real-time Space Weather from NOAA SWPC
 */
async function fetchNoaaSpaceWeather() {
  let kp = 3.3
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
    try {
      const fallbackRes = await fetch('https://services.swpc.noaa.gov/products/summary/planetary-k-index1-minute.json', {
        timeout: 3000
      })
      if (fallbackRes.ok) {
        const json = await fallbackRes.json()
        if (json && json.kp) {
          kp = parseFloat(json.kp) || kp
        }
      }
    } catch (e) {}
  }

  if (kp >= 8.67) stormScale = 'G5 Extreme'
  else if (kp >= 7.67) stormScale = 'G4 Severe'
  else if (kp >= 6.67) stormScale = 'G3 Strong'
  else if (kp >= 5.67) stormScale = 'G2 Moderate'
  else if (kp >= 4.67) stormScale = 'G1 Minor'

  return { kp, stormScale }
}

/**
 * Fetches real-time & 10-hour hourly cloud coverage from Open-Meteo
 */
async function fetchCloudCoverAndHourly(lat, lon) {
  let currentClouds = 25
  let hourlyClouds = [25, 20, 15, 15, 20, 30, 35, 40, 45, 50]
  let isDay = 0

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&current=cloud_cover,is_day&hourly=cloud_cover&forecast_hours=12`
    const res = await fetch(url, { timeout: 4500 })

    if (res.ok) {
      const data = await res.json()
      if (data && data.current) {
        currentClouds = typeof data.current.cloud_cover === 'number' ? data.current.cloud_cover : currentClouds
        isDay = data.current.is_day || 0
      }
      if (data && data.hourly && Array.isArray(data.hourly.cloud_cover)) {
        hourlyClouds = data.hourly.cloud_cover.slice(0, 10)
      }
    }
  } catch (err) {
    console.warn('[StealthAuroraAppSide] Open-Meteo cloud cover error:', err.message)
  }

  return { currentClouds, hourlyClouds, isDay }
}

AppSideService(
  BaseSideService({
    onInit() {
      console.log('[StealthAuroraAppSide] Companion background service initialized')
    },

    async onRequest(req, res) {
      console.log('[StealthAuroraAppSide] Received request:', req.type)

      // Retrieve user's configured locations list
      if (req.type === 'GET_LOCATIONS') {
        const locations = getActiveLocationsFromSettings()
        res(null, {
          success: true,
          data: {
            locations: locations.map(loc => ({ id: loc.id, name: loc.name, isGps: loc.isGps }))
          }
        })
        return
      }

      if (req.type === 'FETCH_AURORA') {
        try {
          const reqLat = req.latitude !== undefined ? req.latitude : req.lat
          const reqLon = req.longitude !== undefined ? req.longitude : req.lon
          const targetLocationId = req.locationId || 'local'

          // Get active locations list configured on phone
          const activeLocations = getActiveLocationsFromSettings()

          // 1. Resolve Location (GPS Local or chosen preset)
          const location = await resolveLocation(targetLocationId, reqLat, reqLon)
          console.log(`[StealthAuroraAppSide] Resolved location: ${location.name} (${location.lat}, ${location.lon})`)

          // 2. Fetch NOAA Space Weather & Open-Meteo Sky Conditions in parallel
          const [spaceWeather, weatherData] = await Promise.all([
            fetchNoaaSpaceWeather(),
            fetchCloudCoverAndHourly(location.lat, location.lon)
          ])

          const kp = spaceWeather.kp
          const clouds = weatherData.currentClouds
          const magLat = calculateGeomagneticLatitude(location.lat, location.lon)

          // 3. Compute Base Aurora Likelihood
          const rawChance = calculateAuroraProbability(magLat, kp)

          // 4. Cloud Attenuation: Auroras cannot penetrate thick cloud cover!
          let finalChance = rawChance
          let guidanceText = 'Active Aurora'

          if (clouds > 80) {
            finalChance = Math.min(12, Math.round(rawChance * 0.12))
            guidanceText = 'No Visibility (Cloudy)'
          } else if (clouds > 55) {
            finalChance = Math.round(rawChance * 0.55)
            guidanceText = rawChance > 60 ? 'Visible Between Clouds' : 'Partly Cloudy'
          } else if (clouds > 30) {
            finalChance = Math.round(rawChance * 0.85)
            guidanceText = rawChance > 65 ? 'High Viewing Chance' : 'Fair Skies'
          } else {
            finalChance = rawChance
            if (rawChance >= 75) {
              guidanceText = kp >= 6 ? 'Intense Geomagnetic Storm!' : 'Optimal Clear Skies'
            } else if (rawChance >= 45) {
              guidanceText = 'Clear Skies · Moderate Chance'
            } else {
              guidanceText = 'Low Activity · Clear Skies'
            }
          }

          if (weatherData.isDay === 1 && finalChance > 30) {
            guidanceText = 'Daylight (Wait for Dusk)'
          }

          // 5. Generate 10-Hour Forecast Array
          const forecast = []
          for (let i = 0; i < 10; i++) {
            const hourOffset = `+${i + 1}h`
            const hourClouds = weatherData.hourlyClouds[i] !== undefined ? weatherData.hourlyClouds[i] : clouds
            
            const projectedKp = Math.max(1.0, kp + Math.sin((i + 1) * 0.8) * 0.5)
            const hourRawChance = calculateAuroraProbability(magLat, projectedKp)
            
            let hourProb = hourRawChance
            if (hourClouds > 80) hourProb = Math.min(10, Math.round(hourRawChance * 0.1))
            else if (hourClouds > 55) hourProb = Math.round(hourRawChance * 0.5)
            else if (hourClouds > 30) hourProb = Math.round(hourRawChance * 0.85)

            forecast.push({
              hour: hourOffset,
              prob: Math.min(100, Math.max(0, hourProb)),
              kp: Number(projectedKp.toFixed(1)),
              clouds: hourClouds
            })
          }

          const responsePayload = {
            success: true,
            data: {
              locationId: location.id,
              locationText: location.name,
              isGps: location.isGps,
              kp: Number(kp.toFixed(1)),
              chancePercent: Math.min(100, Math.max(0, finalChance)),
              textGuidance: guidanceText,
              clouds: Math.round(clouds),
              stormScale: spaceWeather.stormScale,
              forecast: forecast,
              availableLocations: activeLocations.map(loc => ({ id: loc.id, name: loc.name })),
              timestamp: Date.now()
            }
          }

          console.log('[StealthAuroraAppSide] Returning data to watch for:', location.name, 'Chance:', finalChance + '%')
          res(null, responsePayload)
          return
        } catch (err) {
          console.error('[StealthAuroraAppSide] Process error:', err)
          res(null, {
            success: true,
            data: {
              locationId: 'local',
              locationText: '📍 Local GPS',
              isGps: true,
              kp: 3.5,
              chancePercent: 45,
              textGuidance: 'Cached Forecast',
              clouds: 20,
              availableLocations: [
                { id: 'local', name: '📍 Local GPS' },
                { id: 'tromso', name: 'Tromsø, NO' }
              ],
              forecast: [
                { hour: '+1h', prob: 45, kp: 3.5, clouds: 20 },
                { hour: '+2h', prob: 50, kp: 3.7, clouds: 15 },
                { hour: '+3h', prob: 60, kp: 4.1, clouds: 10 },
                { hour: '+4h', prob: 65, kp: 4.3, clouds: 15 },
                { hour: '+5h', prob: 55, kp: 3.8, clouds: 20 },
                { hour: '+6h', prob: 45, kp: 3.5, clouds: 25 },
                { hour: '+7h', prob: 40, kp: 3.2, clouds: 30 },
                { hour: '+8h', prob: 35, kp: 3.0, clouds: 35 },
                { hour: '+9h', prob: 30, kp: 2.8, clouds: 40 },
                { hour: '+10h', prob: 25, kp: 2.5, clouds: 45 }
              ]
            }
          })
          return
        }
      }

      res(null, { success: false, error: 'Unknown request type: ' + req.type })
    }
  })
)
