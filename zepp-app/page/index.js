/**
 * Stealth Aurora Tracker - Watch Page UI (Zepp OS 3.x / 2.x Direct Native API)
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen, Center: x=233, y=233)
 * Publisher: Stealth Apps
 *
 * ARCHITECTURAL FLOW:
 * 1. Default view is GPS Local (`📍 Local GPS`), sensing real-time watch position.
 * 2. Allows cycling through user-selected phone locations (e.g. Tromsø, Fairbanks, Reykjavik)
 *    by simply tapping the location header pill at the top of the watch screen.
 * 3. Draws round 466x466 AMOLED canvas centered around (233, 233).
 * 4. Displays real-time viewing probability arc, Kp index, sky/cloud conditions,
 *    and a dynamic 10-hour forecast bar graph.
 * 5. Provides one-tap manual refresh with clear loading states.
 */

import { BasePage } from '@zeppos/zml/base-page'

const SCREEN_SIZE = 466
const CENTER_X = 233
const CENTER_Y = 233
const FORECAST_COUNT = 10

// Auroral AMOLED Theme Colors
const COLOR_EMERALD = 0x10b981 // High aurora chance
const COLOR_CYAN = 0x06b6d4    // Moderate aurora chance
const COLOR_MAGENTA = 0xa855f7 // Severe storm / active auroral glow
const COLOR_MUTED = 0x38bdf8   // Low activity
const COLOR_CLOUDY = 0xf59e0b  // Cloud cover warning
const COLOR_TRACK = 0x1e293b   // Background arc track
const COLOR_WHITE = 0xf8fafc
const COLOR_SUBTLE = 0x94a3b8
const COLOR_DIM = 0x475569

Page(
  BasePage({
    state: {
      isLoading: true,
      activeLocationIndex: 0,
      locations: [
        { id: 'local', name: '📍 Local GPS' }
      ],
      currentLocationId: 'local',
      chancePercent: 0,
      textGuidance: 'Scanning...',
      kp: 0,
      clouds: 0,
      locationText: '📍 Local GPS',
      forecast: [],
      lat: null,
      lon: null
    },

    widgets: {
      bgTrackArc: null,
      probArc: null,
      locationBtn: null,
      locationLabel: null,
      kpLabel: null,
      sepLabel: null,
      cloudLabel: null,
      probLabel: null,
      guidanceLabel: null,
      forecastHeader: null,
      forecastBarsBg: [],
      forecastBarsFill: [],
      forecastLabels: [],
      refreshBtn: null
    },

    onInit() {
      console.log('[StealthAurora] Watch page onInit initialized for 466x466 round display')
    },

    build() {
      console.log('[StealthAurora] Building watch UI')

      this.createProbabilityArc()
      this.createCurrentMetrics()
      this.createForecastTimeline()
      this.createRefreshButton()

      // Automatically fetch current aurora status upon launch for default GPS Local view
      this.refreshData()
    },

    /**
     * 1. 270-degree Progress Ring representing 0 - 100% Aurora Viewing Likelihood
     */
    createProbabilityArc() {
      if (typeof hmUI === 'undefined') return

      // Background Arc track
      this.widgets.bgTrackArc = hmUI.createWidget(hmUI.widget.ARC, {
        x: 38,
        y: 38,
        w: 390,
        h: 390,
        start_angle: 135,
        end_angle: 405,
        color: COLOR_TRACK,
        line_width: 10
      })

      // Active Dynamic Progress Arc
      this.widgets.probArc = hmUI.createWidget(hmUI.widget.ARC, {
        x: 38,
        y: 38,
        w: 390,
        h: 390,
        start_angle: 135,
        end_angle: 135,
        color: COLOR_EMERALD,
        line_width: 10
      })
    },

    /**
     * 2. Center Metrics: Location (Interactive Pill), Kp Index, Sky Clouds, Big Probability %, and Guidance
     */
    createCurrentMetrics() {
      if (typeof hmUI === 'undefined') return

      // Interactive Location Button Pill (Top, below arc)
      // Tapping cycles through the user's phone-selected locations!
      this.widgets.locationBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 83,
        y: 82,
        w: 300,
        h: 32,
        normal_color: 0x0f172a,
        press_color: 0x1e293b,
        radius: 16,
        text: '📍 Local GPS ▾',
        text_size: 14,
        color: COLOR_SUBTLE,
        click_func: () => {
          this.cycleNextLocation()
        }
      })

      // Current Kp Index Label (Left chip)
      this.widgets.kpLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 60,
        y: 116,
        w: 165,
        h: 26,
        color: COLOR_MUTED,
        text_size: 15,
        align_h: hmUI.align.RIGHT,
        align_v: hmUI.align.CENTER_V,
        text: 'Kp --'
      })

      // Separator dot
      this.widgets.sepLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 228,
        y: 116,
        w: 10,
        h: 26,
        color: COLOR_DIM,
        text_size: 14,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '·'
      })

      // Sky Conditions / Cloud Cover (Right chip)
      this.widgets.cloudLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 241,
        y: 116,
        w: 165,
        h: 26,
        color: COLOR_EMERALD,
        text_size: 15,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: '☁ --%'
      })

      // Large Viewing Probability Hero
      this.widgets.probLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 48,
        y: 142,
        w: 370,
        h: 58,
        color: COLOR_EMERALD,
        text_size: 52,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '--%'
      })

      // Viewing Guidance Label
      this.widgets.guidanceLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 48,
        y: 200,
        w: 370,
        h: 24,
        color: COLOR_WHITE,
        text_size: 16,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'Checking Skies...'
      })
    },

    /**
     * 3. 10-Hour Forecast Timeline Section (Bars & Hour Tags)
     */
    createForecastTimeline() {
      if (typeof hmUI === 'undefined') return

      this.widgets.forecastHeader = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 60,
        y: 228,
        w: 346,
        h: 18,
        color: COLOR_DIM,
        text_size: 12,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '10-HOUR FORECAST'
      })

      const startX = 73
      const barY = 248
      const maxBarH = 46
      const barW = 24
      const gap = 8

      this.widgets.forecastBarsBg = []
      this.widgets.forecastBarsFill = []
      this.widgets.forecastLabels = []

      for (let i = 0; i < FORECAST_COUNT; i++) {
        const colX = startX + i * (barW + gap)

        // Background track slot for hour bar
        const bgBar = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: colX,
          y: barY,
          w: barW,
          h: maxBarH,
          radius: 4,
          color: COLOR_TRACK
        })
        this.widgets.forecastBarsBg.push(bgBar)

        // Active filled bar reflecting forecast probability
        const initialH = 6
        const fillBar = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: colX,
          y: barY + (maxBarH - initialH),
          w: barW,
          h: initialH,
          radius: 4,
          color: COLOR_DIM
        })
        this.widgets.forecastBarsFill.push(fillBar)

        // Hour offset label (+1h, +2h, ... +10h)
        const hourLabel = hmUI.createWidget(hmUI.widget.TEXT, {
          x: colX,
          y: barY + maxBarH + 4,
          w: barW,
          h: 14,
          color: COLOR_SUBTLE,
          text_size: 10,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: `+${i + 1}`
        })
        this.widgets.forecastLabels.push(hourLabel)
      }
    },

    /**
     * 4. Bottom Interactive Refresh Button
     */
    createRefreshButton() {
      if (typeof hmUI === 'undefined') return

      this.widgets.refreshBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 163,
        y: 338,
        w: 140,
        h: 42,
        normal_color: 0x0f766e,
        press_color: 0x115e59,
        radius: 21,
        text: 'REFRESH',
        text_size: 14,
        color: COLOR_WHITE,
        click_func: () => {
          this.refreshData()
        }
      })
    },

    /**
     * Cycles to the next location selected on the phone app
     */
    cycleNextLocation() {
      if (!this.state.locations || this.state.locations.length <= 1) {
        this.refreshData()
        return
      }

      this.state.activeLocationIndex =
        (this.state.activeLocationIndex + 1) % this.state.locations.length
      const target = this.state.locations[this.state.activeLocationIndex]
      this.state.currentLocationId = target.id

      console.log(`[StealthAurora] Cycled to location: ${target.name} (${target.id})`)

      if (this.widgets.locationBtn) {
        this.widgets.locationBtn.setProperty(
          hmUI.prop.TEXT,
          `${target.name} (${this.state.activeLocationIndex + 1}/${this.state.locations.length}) ▾`
        )
      }

      this.refreshData()
    },

    /**
     * Requests data for the currently selected location (GPS Local or chosen hotspot)
     */
    refreshData() {
      this.state.isLoading = true
      this.setLoadingUI(true)

      const isGpsLocal = this.state.currentLocationId === 'local'

      if (isGpsLocal) {
        this.acquireCoordinates((lat, lon) => {
          this.state.lat = lat
          this.state.lon = lon

          const payload = {
            type: 'FETCH_AURORA',
            locationId: 'local',
            latitude: lat,
            longitude: lon,
            lat: lat,
            lon: lon
          }
          this.sendCompanionRequest(payload)
        })
      } else {
        const payload = {
          type: 'FETCH_AURORA',
          locationId: this.state.currentLocationId,
          lat: null,
          lon: null
        }
        this.sendCompanionRequest(payload)
      }
    },

    /**
     * Acquires coordinates with fallback to companion IP resolution
     */
    acquireCoordinates(callback) {
      let resolved = false
      const finish = (lat, lon) => {
        if (!resolved) {
          resolved = true
          callback(lat, lon)
        }
      }

      try {
        if (typeof hmSensor !== 'undefined' && hmSensor.id && hmSensor.id.GEOLOCATION) {
          const gpsSensor = hmSensor.createSensor(hmSensor.id.GEOLOCATION)
          if (gpsSensor) {
            gpsSensor.start()
            const onChange = () => {
              const lat = gpsSensor.getLatitude ? gpsSensor.getLatitude() : null
              const lon = gpsSensor.getLongitude ? gpsSensor.getLongitude() : null
              if (lat && lon && lat !== 0) {
                try {
                  gpsSensor.removeEventListener(hmSensor.event.CHANGE, onChange)
                  gpsSensor.stop()
                } catch (e) {}
                finish(lat, lon)
              }
            }
            gpsSensor.addEventListener(hmSensor.event.CHANGE, onChange)
          }
        }
      } catch (err) {
        console.log('[StealthAurora] Sensor geolocation error:', err)
      }

      setTimeout(() => {
        finish(null, null)
      }, 2500)
    },

    /**
     * Dispatches request to companion
     */
    sendCompanionRequest(payload) {
      let timeoutId = setTimeout(() => {
        if (this.state.isLoading) {
          this.onFetchTimeout()
        }
      }, 12000)

      const handleSuccess = (res) => {
        clearTimeout(timeoutId)
        this.state.isLoading = false
        if (res && res.data) {
          this.updateUI(res.data)
        } else if (res && res.chancePercent !== undefined) {
          this.updateUI(res)
        } else {
          this.onFetchError('No Data')
        }
      }

      const handleError = (err) => {
        clearTimeout(timeoutId)
        this.state.isLoading = false
        console.warn('[StealthAurora] Companion request failed:', err)
        this.onFetchError('Companion Offline')
      }

      if (typeof this.request === 'function') {
        this.request(payload)
          .then(handleSuccess)
          .catch(handleError)
      } else if (typeof message !== 'undefined' && message.request) {
        message.request(payload, (err, res) => {
          if (err) handleError(err)
          else handleSuccess(res)
        })
      } else {
        handleError(new Error('No communication transport available'))
      }
    },

    /**
     * Updates all UI widgets with real-time NOAA and Open-Meteo processed data
     */
    updateUI(data) {
      if (typeof hmUI === 'undefined') return

      const chance = Math.max(0, Math.min(100, Math.round(data.chancePercent || 0)))
      const kp = typeof data.kp === 'number' ? data.kp.toFixed(1) : (data.kp || '0.0')
      const clouds = Math.round(data.clouds || 0)
      const location = data.locationText || 'Current Position'
      const guidance = data.textGuidance || (chance > 65 ? 'High Viewing Chance' : 'Low Activity')
      const forecast = Array.isArray(data.forecast) ? data.forecast : []

      if (Array.isArray(data.availableLocations) && data.availableLocations.length > 0) {
        this.state.locations = data.availableLocations
        const currentIndex = this.state.locations.findIndex(l => l.id === data.locationId)
        if (currentIndex !== -1) {
          this.state.activeLocationIndex = currentIndex
        }
      }

      this.state.chancePercent = chance
      this.state.kp = kp
      this.state.clouds = clouds
      this.state.locationText = location
      this.state.textGuidance = guidance
      this.state.forecast = forecast

      let themeColor = COLOR_MUTED
      if (chance >= 75) {
        themeColor = data.kp >= 6 ? COLOR_MAGENTA : COLOR_EMERALD
      } else if (chance >= 45) {
        themeColor = COLOR_CYAN
      } else if (clouds > 75) {
        themeColor = COLOR_CLOUDY
      }

      if (this.widgets.probArc) {
        const sweepAngle = Math.round((chance / 100) * 270)
        this.widgets.probArc.setProperty(hmUI.prop.MORE, {
          start_angle: 135,
          end_angle: 135 + sweepAngle,
          color: themeColor
        })
      }

      if (this.widgets.locationBtn) {
        const count = this.state.locations.length
        const idx = this.state.activeLocationIndex + 1
        const countTag = count > 1 ? ` (${idx}/${count}) ▾` : ''
        this.widgets.locationBtn.setProperty(hmUI.prop.TEXT, `${location}${countTag}`)
      }

      if (this.widgets.kpLabel) {
        this.widgets.kpLabel.setProperty(hmUI.prop.TEXT, `Kp ${kp}`)
      }

      if (this.widgets.cloudLabel) {
        const cloudColor = clouds < 30 ? COLOR_EMERALD : clouds > 70 ? COLOR_CLOUDY : COLOR_SUBTLE
        this.widgets.cloudLabel.setProperty(hmUI.prop.TEXT, `☁ ${clouds}%`)
        this.widgets.cloudLabel.setProperty(hmUI.prop.COLOR, cloudColor)
      }

      if (this.widgets.probLabel) {
        this.widgets.probLabel.setProperty(hmUI.prop.TEXT, `${chance}%`)
        this.widgets.probLabel.setProperty(hmUI.prop.COLOR, themeColor)
      }

      if (this.widgets.guidanceLabel) {
        this.widgets.guidanceLabel.setProperty(hmUI.prop.TEXT, guidance)
      }

      this.updateForecastBars(forecast)

      try {
        const app = typeof getApp === 'function' ? getApp() : null
        if (app && app._options && app._options.globalData) {
          app._options.globalData.kp = kp
          app._options.globalData.chancePercent = chance
          app._options.globalData.textGuidance = guidance
          app._options.globalData.clouds = clouds
          app._options.globalData.locationText = location
          app._options.globalData.forecast = forecast
          app._options.globalData.lastUpdated = Date.now()
        }
      } catch (e) {}

      if (this.widgets.refreshBtn) {
        this.widgets.refreshBtn.setProperty(hmUI.prop.TEXT, 'REFRESH')
      }
    },

    updateForecastBars(forecastList) {
      if (!this.widgets.forecastBarsFill || this.widgets.forecastBarsFill.length === 0) return

      const startX = 73
      const barY = 248
      const maxBarH = 46
      const barW = 24
      const gap = 8

      for (let i = 0; i < FORECAST_COUNT; i++) {
        const item = forecastList[i] || { prob: 0, hour: `+${i + 1}h` }
        const prob = Math.max(0, Math.min(100, item.prob || 0))
        const barH = Math.max(4, Math.round((prob / 100) * maxBarH))
        const colX = startX + i * (barW + gap)

        let barColor = COLOR_DIM
        if (prob >= 70) barColor = COLOR_EMERALD
        else if (prob >= 40) barColor = COLOR_CYAN
        else if (prob >= 20) barColor = COLOR_MUTED

        const fillBar = this.widgets.forecastBarsFill[i]
        if (fillBar) {
          fillBar.setProperty(hmUI.prop.MORE, {
            x: colX,
            y: barY + (maxBarH - barH),
            w: barW,
            h: barH,
            color: barColor
          })
        }

        const label = this.widgets.forecastLabels[i]
        if (label && item.hour) {
          label.setProperty(hmUI.prop.TEXT, item.hour.replace('h', ''))
        }
      }
    },

    setLoadingUI(isLoading) {
      if (typeof hmUI === 'undefined') return

      if (isLoading) {
        if (this.widgets.guidanceLabel) {
          this.widgets.guidanceLabel.setProperty(hmUI.prop.TEXT, 'Analyzing auroral oval...')
        }
        if (this.widgets.refreshBtn) {
          this.widgets.refreshBtn.setProperty(hmUI.prop.TEXT, 'UPDATING...')
        }
      }
    },

    onFetchTimeout() {
      if (typeof hmUI === 'undefined') return
      if (this.widgets.guidanceLabel) {
        this.widgets.guidanceLabel.setProperty(hmUI.prop.TEXT, 'Connection timed out')
      }
      if (this.widgets.refreshBtn) {
        this.widgets.refreshBtn.setProperty(hmUI.prop.TEXT, 'RETRY')
      }
    },

    onFetchError(msg) {
      if (typeof hmUI === 'undefined') return
      if (this.widgets.guidanceLabel) {
        this.widgets.guidanceLabel.setProperty(hmUI.prop.TEXT, msg || 'Network error')
      }
      if (this.widgets.refreshBtn) {
        this.widgets.refreshBtn.setProperty(hmUI.prop.TEXT, 'RETRY')
      }
    },

    onDestroy() {
      console.log('[StealthAurora] Watch page onDestroy')
    }
  })
)
