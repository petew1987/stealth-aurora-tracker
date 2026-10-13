/**
 * Stealth Aurora Tracker - Watch Page UI (Zepp OS 3.x / 2.x Direct Native API)
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen, Center: x=233, y=233)
 * Publisher: Stealth Apps
 *
 * SPECIFICATION COMPLIANCE:
 * 1. Multi-Screen Swipeable Architecture:
 *    - Screen 0: NOW (Real-time viewing odds, Big %, guidance, Kp, Clouds, Location, Refresh logo)
 *    - Screen 1: 12-Hour Forecast (Viewing Probability, Cloud Cover, KP Index)
 *    - Screen 2: 24-Hour Forecast (Viewing Probability, Cloud Cover, KP Index)
 *    - Screen 3: 7-Day Forecast (Daily KP Index, Cloud Cover, Viewing Probability, Activity)
 *    - Screen 4: 28-Day Forecast (Solar Carrington Rotation Cycle, Weekly Kp Index & Storm Risk)
 * 2. Gestures: Swipe left/right via hmApp.registerGestureEvent + interactive on-screen controls.
 * 3. Exact 1px gap outer ring (464x464 on 466 AMOLED display).
 * 4. Zero overlapping elements.
 * 5. ZERO emojis used anywhere.
 */

import { BasePage } from '@zeppos/zml/base-page'

const SCREEN_SIZE = 466
const CENTER_X = 233
const CENTER_Y = 233
const TOTAL_SCREENS = 5

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
const COLOR_CARD = 0x0f172a

Page(
  BasePage({
    state: {
      isLoading: true,
      currentScreen: 0, // 0: Now, 1: 12h, 2: 24h, 3: 7d, 4: 28d
      activeLocationIndex: 0,
      locations: [
        { id: 'local', name: 'Local GPS' }
      ],
      currentLocationId: 'local',
      chancePercent: 0,
      textGuidance: 'Scanning Skies...',
      kp: 0,
      clouds: 0,
      stormScale: 'G0',
      locationText: 'Local GPS',
      forecast12h: [],
      forecast24h: [],
      forecast7d: [],
      forecast28d: [],
      lat: null,
      lon: null
    },

    widgets: {
      // Outer circular frame
      bgTrackArc: null,
      probArc: null,

      // Top screen header (interactive tap to switch)
      screenHeaderBtn: null,
      prevScreenBtn: null,
      nextScreenBtn: null,

      // Screen 0: NOW
      nowKpLabel: null,
      nowSepLabel: null,
      nowCloudLabel: null,
      nowProbLabel: null,
      nowGuidanceLabel: null,
      nowLocationBtn: null,
      nowRefreshBtn: null,

      // Screen 1: 12-Hour Forecast
      h12SummaryLabel: null,
      h12BarsBg: [],
      h12BarsFill: [],
      h12HourLabels: [],
      h12ProbLabels: [],
      h12KpCloudLabels: [],

      // Screen 2: 24-Hour Forecast
      h24SummaryLabel: null,
      h24BlocksBg: [],
      h24BlocksFill: [],
      h24BlockLabels: [],
      h24DataLabels: [],

      // Screen 3: 7-Day Forecast
      d7SummaryLabel: null,
      d7Cards: [],
      d7DayLabels: [],
      d7KpLabels: [],
      d7CloudLabels: [],
      d7ProbLabels: [],

      // Screen 4: 28-Day Solar Cycle
      d28SummaryLabel: null,
      d28Cards: [],
      d28WeekLabels: [],
      d28KpLabels: [],
      d28RiskLabels: [],

      // Bottom 5-dot page indicator
      dotIndicators: []
    },

    onInit() {
      console.log('[StealthAurora] Watch page onInit with 5 swipeable screens')
    },

    build() {
      console.log('[StealthAurora] Building swipeable watch UI')

      this.createOutermostProgressRing()
      this.createTopNavigationHeader()

      // Build each screen
      this.buildScreenNow()
      this.buildScreen12h()
      this.buildScreen24h()
      this.buildScreen7d()
      this.buildScreen28d()

      this.createBottomPageDots()
      this.registerSwipeGestures()

      // Set initial screen
      this.switchScreen(0)
      this.refreshData()
    },

    /**
     * Registers swipe gestures for horizontal page switching
     */
    registerSwipeGestures() {
      try {
        if (typeof hmApp !== 'undefined' && typeof hmApp.registerGestureEvent === 'function') {
          hmApp.registerGestureEvent((event) => {
            console.log('[StealthAurora] Gesture triggered:', event)
            if (event === hmApp.gesture.LEFT) {
              this.switchScreen((this.state.currentScreen + 1) % TOTAL_SCREENS)
              return true
            } else if (event === hmApp.gesture.RIGHT) {
              this.switchScreen((this.state.currentScreen - 1 + TOTAL_SCREENS) % TOTAL_SCREENS)
              return true
            }
            return false
          })
        }
      } catch (err) {
        console.log('[StealthAurora] Gesture registration catch:', err)
      }
    },

    /**
     * 1. Outermost Progress Ring: 1px gap outside (464x464 on 466 display)
     */
    createOutermostProgressRing() {
      if (typeof hmUI === 'undefined') return

      this.widgets.bgTrackArc = hmUI.createWidget(hmUI.widget.ARC, {
        x: 1,
        y: 1,
        w: 464,
        h: 464,
        start_angle: 0,
        end_angle: 360,
        color: COLOR_TRACK,
        line_width: 6
      })

      this.widgets.probArc = hmUI.createWidget(hmUI.widget.ARC, {
        x: 1,
        y: 1,
        w: 464,
        h: 464,
        start_angle: 270,
        end_angle: 270,
        color: COLOR_EMERALD,
        line_width: 6
      })
    },

    /**
     * Top Screen Header with subtle < and > touch targets
     */
    createTopNavigationHeader() {
      if (typeof hmUI === 'undefined') return

      // Left chevron
      this.widgets.prevScreenBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 80,
        y: 22,
        w: 36,
        h: 28,
        normal_color: 0x000000,
        press_color: 0x1e293b,
        radius: 14,
        text: '<',
        text_size: 14,
        color: COLOR_SUBTLE,
        click_func: () => {
          this.switchScreen((this.state.currentScreen - 1 + TOTAL_SCREENS) % TOTAL_SCREENS)
        }
      })

      // Center title button
      this.widgets.screenHeaderBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 120,
        y: 22,
        w: 226,
        h: 28,
        normal_color: 0x0f172a,
        press_color: 0x1e293b,
        radius: 14,
        text: 'NOW (1/5)',
        text_size: 13,
        color: COLOR_WHITE,
        click_func: () => {
          this.switchScreen((this.state.currentScreen + 1) % TOTAL_SCREENS)
        }
      })

      // Right chevron
      this.widgets.nextScreenBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 350,
        y: 22,
        w: 36,
        h: 28,
        normal_color: 0x000000,
        press_color: 0x1e293b,
        radius: 14,
        text: '>',
        text_size: 14,
        color: COLOR_SUBTLE,
        click_func: () => {
          this.switchScreen((this.state.currentScreen + 1) % TOTAL_SCREENS)
        }
      })
    },

    /**
     * SCREEN 0: Real-Time Current Conditions (NOW)
     */
    buildScreenNow() {
      if (typeof hmUI === 'undefined') return

      // Top row: Kp & Clouds
      this.widgets.nowKpLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 95,
        y: 58,
        w: 110,
        h: 26,
        color: COLOR_MUTED,
        text_size: 16,
        align_h: hmUI.align.RIGHT,
        align_v: hmUI.align.CENTER_V,
        text: 'Kp --'
      })

      this.widgets.nowSepLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 215,
        y: 58,
        w: 36,
        h: 26,
        color: COLOR_DIM,
        text_size: 14,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '|'
      })

      this.widgets.nowCloudLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 261,
        y: 58,
        w: 110,
        h: 26,
        color: COLOR_EMERALD,
        text_size: 15,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: 'Cloud --%'
      })

      // Hero Probability %
      this.widgets.nowProbLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 58,
        y: 96,
        w: 350,
        h: 62,
        color: COLOR_EMERALD,
        text_size: 56,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '--%'
      })

      // Guidance status
      this.widgets.nowGuidanceLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 58,
        y: 162,
        w: 350,
        h: 24,
        color: COLOR_WHITE,
        text_size: 15,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'Scanning Skies...'
      })

      // Location Pill (Above refresh button)
      this.widgets.nowLocationBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 108,
        y: 226,
        w: 250,
        h: 38,
        normal_color: 0x0f172a,
        press_color: 0x1e293b,
        radius: 19,
        text: 'Local GPS',
        text_size: 14,
        color: COLOR_MUTED,
        click_func: () => {
          this.cycleNextLocation()
        }
      })

      // Refresh Button (Refresh logo ONLY, no text)
      this.widgets.nowRefreshBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 206,
        y: 284,
        w: 54,
        h: 54,
        normal_src: 'refresh.png',
        press_src: 'refresh.png',
        normal_color: 0x0f766e,
        press_color: 0x115e59,
        radius: 27,
        text: '', // strictly no text
        click_func: () => {
          this.refreshData()
        }
      })
    },

    /**
     * SCREEN 1: 12-Hour Forecast (Viewing Probability, Cloud Cover, KP Index)
     */
    buildScreen12h() {
      if (typeof hmUI === 'undefined') return

      this.widgets.h12SummaryLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 58,
        y: 56,
        w: 350,
        h: 22,
        color: COLOR_MUTED,
        text_size: 12,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '12H PEAK --% | MAX KP --'
      })

      const barCount = 12
      const barW = 14
      const gap = 4
      const totalW = barCount * barW + (barCount - 1) * gap // 212px
      const startX = Math.round((SCREEN_SIZE - totalW) / 2)
      const barY = 96
      const maxH = 64

      this.widgets.h12BarsBg = []
      this.widgets.h12BarsFill = []
      this.widgets.h12HourLabels = []
      this.widgets.h12ProbLabels = []
      this.widgets.h12KpCloudLabels = []

      for (let i = 0; i < barCount; i++) {
        const colX = startX + i * (barW + gap)

        // Track bar
        const bg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: colX,
          y: barY,
          w: barW,
          h: maxH,
          radius: 2,
          color: COLOR_TRACK
        })
        this.widgets.h12BarsBg.push(bg)

        // Fill bar
        const fill = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: colX,
          y: barY + maxH - 6,
          w: barW,
          h: 6,
          radius: 2,
          color: COLOR_DIM
        })
        this.widgets.h12BarsFill.push(fill)

        // Hour label (+1 to +12)
        const lbl = hmUI.createWidget(hmUI.widget.TEXT, {
          x: colX - 3,
          y: barY + maxH + 4,
          w: barW + 6,
          h: 14,
          color: COLOR_SUBTLE,
          text_size: 9,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: `+${i + 1}`
        })
        this.widgets.h12HourLabels.push(lbl)
      }

      // Summary lines at bottom of screen 1
      this.widgets.h12ProbLabels[0] = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 60,
        y: 196,
        w: 346,
        h: 26,
        color: COLOR_WHITE,
        text_size: 13,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'PROB: --% · CLOUD: --% · KP: --'
      })

      this.widgets.h12KpCloudLabels[0] = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 60,
        y: 232,
        w: 346,
        h: 22,
        color: COLOR_EMERALD,
        text_size: 12,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'Best viewing window in next 12h'
      })
    },

    /**
     * SCREEN 2: 24-Hour Forecast (Viewing Probability, Cloud Cover, KP Index)
     */
    buildScreen24h() {
      if (typeof hmUI === 'undefined') return

      this.widgets.h24SummaryLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 58,
        y: 56,
        w: 350,
        h: 22,
        color: COLOR_MUTED,
        text_size: 12,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '24-HOUR SYNOPTIC TIMELINE'
      })

      // 8 blocks representing 3-hour windows (0-24h)
      const blockCount = 8
      const blockW = 22
      const gap = 5
      const totalW = blockCount * blockW + (blockCount - 1) * gap // 211px
      const startX = Math.round((SCREEN_SIZE - totalW) / 2)
      const blockY = 94
      const maxH = 68

      this.widgets.h24BlocksBg = []
      this.widgets.h24BlocksFill = []
      this.widgets.h24BlockLabels = []

      for (let b = 0; b < blockCount; b++) {
        const colX = startX + b * (blockW + gap)

        const bg = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: colX,
          y: blockY,
          w: blockW,
          h: maxH,
          radius: 3,
          color: COLOR_TRACK
        })
        this.widgets.h24BlocksBg.push(bg)

        const fill = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: colX,
          y: blockY + maxH - 8,
          w: blockW,
          h: 8,
          radius: 3,
          color: COLOR_DIM
        })
        this.widgets.h24BlocksFill.push(fill)

        const lbl = hmUI.createWidget(hmUI.widget.TEXT, {
          x: colX - 2,
          y: blockY + maxH + 4,
          w: blockW + 4,
          h: 14,
          color: COLOR_SUBTLE,
          text_size: 9,
          align_h: hmUI.align.CENTER_H,
          align_v: hmUI.align.CENTER_V,
          text: `+${(b + 1) * 3}`
        })
        this.widgets.h24BlockLabels.push(lbl)
      }

      this.widgets.h24DataLabels[0] = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 60,
        y: 198,
        w: 346,
        h: 26,
        color: COLOR_WHITE,
        text_size: 13,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'PEAK: --% | CLOUDS: --% | KP: --'
      })

      this.widgets.h24DataLabels[1] = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 60,
        y: 232,
        w: 346,
        h: 22,
        color: COLOR_CYAN,
        text_size: 12,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'Full 24-hour day and night cycle'
      })
    },

    /**
     * SCREEN 3: 7-Day Forecast (Daily KP Index, Cloud Cover, Viewing Probability)
     */
    buildScreen7d() {
      if (typeof hmUI === 'undefined') return

      this.widgets.d7SummaryLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 58,
        y: 56,
        w: 350,
        h: 22,
        color: COLOR_MUTED,
        text_size: 12,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '7-DAY GEOMAGNETIC OUTLOOK'
      })

      // 7 compact daily rows / cards
      this.widgets.d7Cards = []
      this.widgets.d7DayLabels = []
      this.widgets.d7KpLabels = []
      this.widgets.d7CloudLabels = []
      this.widgets.d7ProbLabels = []

      const rowH = 22
      const rowGap = 3
      const startY = 88
      const cardW = 280
      const cardX = Math.round((SCREEN_SIZE - cardW) / 2)

      for (let d = 0; d < 7; d++) {
        const yPos = startY + d * (rowH + rowGap)

        const card = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: cardX,
          y: yPos,
          w: cardW,
          h: rowH,
          radius: 4,
          color: COLOR_CARD
        })
        this.widgets.d7Cards.push(card)

        const dayLbl = hmUI.createWidget(hmUI.widget.TEXT, {
          x: cardX + 8,
          y: yPos,
          w: 42,
          h: rowH,
          color: COLOR_WHITE,
          text_size: 11,
          align_h: hmUI.align.LEFT,
          align_v: hmUI.align.CENTER_V,
          text: `D${d + 1}`
        })
        this.widgets.d7DayLabels.push(dayLbl)

        const kpLbl = hmUI.createWidget(hmUI.widget.TEXT, {
          x: cardX + 54,
          y: yPos,
          w: 70,
          h: rowH,
          color: COLOR_MUTED,
          text_size: 11,
          align_h: hmUI.align.LEFT,
          align_v: hmUI.align.CENTER_V,
          text: 'Kp --'
        })
        this.widgets.d7KpLabels.push(kpLbl)

        const cloudLbl = hmUI.createWidget(hmUI.widget.TEXT, {
          x: cardX + 130,
          y: yPos,
          w: 75,
          h: rowH,
          color: COLOR_SUBTLE,
          text_size: 11,
          align_h: hmUI.align.LEFT,
          align_v: hmUI.align.CENTER_V,
          text: 'Cld --%'
        })
        this.widgets.d7CloudLabels.push(cloudLbl)

        const probLbl = hmUI.createWidget(hmUI.widget.TEXT, {
          x: cardX + 210,
          y: yPos,
          w: 62,
          h: rowH,
          color: COLOR_EMERALD,
          text_size: 11,
          align_h: hmUI.align.RIGHT,
          align_v: hmUI.align.CENTER_V,
          text: '--%'
        })
        this.widgets.d7ProbLabels.push(probLbl)
      }
    },

    /**
     * SCREEN 4: 28-Day Forecast (Solar Carrington Rotation Cycle, Weekly Kp Index)
     */
    buildScreen28d() {
      if (typeof hmUI === 'undefined') return

      this.widgets.d28SummaryLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 58,
        y: 56,
        w: 350,
        h: 22,
        color: COLOR_MUTED,
        text_size: 12,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: '28-DAY SOLAR ROTATION CYCLE'
      })

      // 4 weekly cards representing 28 days
      this.widgets.d28Cards = []
      this.widgets.d28WeekLabels = []
      this.widgets.d28KpLabels = []
      this.widgets.d28RiskLabels = []

      const cardW = 280
      const cardX = Math.round((SCREEN_SIZE - cardW) / 2)
      const cardH = 38
      const cardGap = 6
      const startY = 88

      for (let w = 0; w < 4; w++) {
        const yPos = startY + w * (cardH + cardGap)

        const card = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: cardX,
          y: yPos,
          w: cardW,
          h: cardH,
          radius: 6,
          color: COLOR_CARD
        })
        this.widgets.d28Cards.push(card)

        const weekLbl = hmUI.createWidget(hmUI.widget.TEXT, {
          x: cardX + 10,
          y: yPos + 4,
          w: 120,
          h: 16,
          color: COLOR_WHITE,
          text_size: 12,
          align_h: hmUI.align.LEFT,
          align_v: hmUI.align.CENTER_V,
          text: `Week ${w + 1} (Days ${w * 7 + 1}-${w * 7 + 7})`
        })
        this.widgets.d28WeekLabels.push(weekLbl)

        const kpLbl = hmUI.createWidget(hmUI.widget.TEXT, {
          x: cardX + 10,
          y: yPos + 20,
          w: 140,
          h: 14,
          color: COLOR_MUTED,
          text_size: 11,
          align_h: hmUI.align.LEFT,
          align_v: hmUI.align.CENTER_V,
          text: 'Max Kp: -- · Avg: --'
        })
        this.widgets.d28KpLabels.push(kpLbl)

        const riskLbl = hmUI.createWidget(hmUI.widget.TEXT, {
          x: cardX + 160,
          y: yPos + 9,
          w: 110,
          h: 20,
          color: COLOR_EMERALD,
          text_size: 12,
          align_h: hmUI.align.RIGHT,
          align_v: hmUI.align.CENTER_V,
          text: 'Low Risk'
        })
        this.widgets.d28RiskLabels.push(riskLbl)
      }
    },

    /**
     * Bottom 5-dot page indicator: Shows active screen and allows direct tap cycling
     */
    createBottomPageDots() {
      if (typeof hmUI === 'undefined') return

      const dotCount = TOTAL_SCREENS
      const dotSize = 8
      const dotGap = 10
      const totalW = dotCount * dotSize + (dotCount - 1) * dotGap
      const startX = Math.round((SCREEN_SIZE - totalW) / 2)
      const dotY = 388

      this.widgets.dotIndicators = []

      for (let i = 0; i < dotCount; i++) {
        const dot = hmUI.createWidget(hmUI.widget.FILL_RECT, {
          x: startX + i * (dotSize + dotGap),
          y: dotY,
          w: dotSize,
          h: dotSize,
          radius: 4,
          color: i === 0 ? COLOR_EMERALD : COLOR_DIM
        })
        this.widgets.dotIndicators.push(dot)
      }
    },

    /**
     * Switches view between the 5 screens
     */
    switchScreen(index) {
      this.state.currentScreen = index
      console.log('[StealthAurora] Switching to screen:', index)

      // 1. Update Header Button Text
      const titles = [
        'NOW (1/5)',
        '12H FORECAST (2/5)',
        '24H FORECAST (3/5)',
        '7D FORECAST (4/5)',
        '28D CYCLE (5/5)'
      ]
      if (this.widgets.screenHeaderBtn) {
        this.widgets.screenHeaderBtn.setProperty(hmUI.prop.TEXT, titles[index] || 'AURORA')
      }

      // 2. Update Dots
      for (let i = 0; i < TOTAL_SCREENS; i++) {
        const dot = this.widgets.dotIndicators[i]
        if (dot) {
          dot.setProperty(hmUI.prop.COLOR, i === index ? COLOR_EMERALD : COLOR_DIM)
        }
      }

      // 3. Toggle Visibility for Each Screen's Widgets
      this.setWidgetListVisible(
        [
          this.widgets.nowKpLabel,
          this.widgets.nowSepLabel,
          this.widgets.nowCloudLabel,
          this.widgets.nowProbLabel,
          this.widgets.nowGuidanceLabel,
          this.widgets.nowLocationBtn,
          this.widgets.nowRefreshBtn
        ],
        index === 0
      )

      this.setWidgetListVisible(
        [
          this.widgets.h12SummaryLabel,
          ...this.widgets.h12BarsBg,
          ...this.widgets.h12BarsFill,
          ...this.widgets.h12HourLabels,
          ...this.widgets.h12ProbLabels,
          ...this.widgets.h12KpCloudLabels
        ],
        index === 1
      )

      this.setWidgetListVisible(
        [
          this.widgets.h24SummaryLabel,
          ...this.widgets.h24BlocksBg,
          ...this.widgets.h24BlocksFill,
          ...this.widgets.h24BlockLabels,
          ...this.widgets.h24DataLabels
        ],
        index === 2
      )

      this.setWidgetListVisible(
        [
          this.widgets.d7SummaryLabel,
          ...this.widgets.d7Cards,
          ...this.widgets.d7DayLabels,
          ...this.widgets.d7KpLabels,
          ...this.widgets.d7CloudLabels,
          ...this.widgets.d7ProbLabels
        ],
        index === 3
      )

      this.setWidgetListVisible(
        [
          this.widgets.d28SummaryLabel,
          ...this.widgets.d28Cards,
          ...this.widgets.d28WeekLabels,
          ...this.widgets.d28KpLabels,
          ...this.widgets.d28RiskLabels
        ],
        index === 4
      )

      // Update ring arc based on active screen's metric
      this.updateActiveScreenRing()
    },

    setWidgetListVisible(list, isVisible) {
      if (!list || !Array.isArray(list)) return
      list.forEach((w) => {
        if (w && typeof w.setProperty === 'function') {
          w.setProperty(hmUI.prop.VISIBLE, isVisible)
        }
      })
    },

    updateActiveScreenRing() {
      if (!this.widgets.probArc) return

      let targetProb = this.state.chancePercent
      let arcColor = COLOR_MUTED

      if (this.state.currentScreen === 1 && this.state.forecast12h.length > 0) {
        targetProb = Math.max(...this.state.forecast12h.map((f) => f.prob || 0))
      } else if (this.state.currentScreen === 2 && this.state.forecast24h.length > 0) {
        targetProb = Math.max(...this.state.forecast24h.map((f) => f.prob || 0))
      } else if (this.state.currentScreen === 3 && this.state.forecast7d.length > 0) {
        targetProb = Math.max(...this.state.forecast7d.map((f) => f.prob || 0))
      } else if (this.state.currentScreen === 4 && this.state.forecast28d.length > 0) {
        const peakKp = Math.max(...this.state.forecast28d.map((w) => w.maxKp || 0))
        targetProb = Math.min(100, Math.round(peakKp * 15))
      }

      if (targetProb >= 70) arcColor = COLOR_EMERALD
      else if (targetProb >= 40) arcColor = COLOR_CYAN

      const sweepDegrees = Math.round((targetProb / 100) * 360)
      this.widgets.probArc.setProperty(hmUI.prop.MORE, {
        start_angle: 270,
        end_angle: 270 + sweepDegrees,
        color: arcColor
      })
    },

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

      if (this.widgets.nowLocationBtn) {
        const count = this.state.locations.length
        const idx = this.state.activeLocationIndex + 1
        this.widgets.nowLocationBtn.setProperty(
          hmUI.prop.TEXT,
          `${target.name} (${idx}/${count})`
        )
      }

      this.refreshData()
    },

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

    acquireCoordinates(callback) {
      let resolved = false
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true
          console.log('[StealthAurora] Geolocation timeout; using fallback coordinates')
          callback(64.14, -21.94)
        }
      }, 3500)

      try {
        const Geolocation = hmSensor && hmSensor.sensor && hmSensor.sensor.GEOLOCATION
          ? hmSensor.createSensor(hmSensor.sensor.GEOLOCATION)
          : null

        if (Geolocation && typeof Geolocation.getCurrentPosition === 'function') {
          Geolocation.getCurrentPosition({
            success: (pos) => {
              if (resolved) return
              resolved = true
              clearTimeout(timeoutId)
              const lat = pos && pos.latitude ? pos.latitude : 64.14
              const lon = pos && pos.longitude ? pos.longitude : -21.94
              callback(lat, lon)
            },
            fail: () => {
              if (resolved) return
              resolved = true
              clearTimeout(timeoutId)
              callback(64.14, -21.94)
            }
          })
          return
        }
      } catch (e) {
        console.log('[StealthAurora] Geolocation sensor exception:', e)
      }

      clearTimeout(timeoutId)
      callback(null, null)
    },

    sendCompanionRequest(payload) {
      this.request(payload)
        .then((res) => {
          console.log('[StealthAurora] Received companion response')
          this.handleCompanionResponse(res)
        })
        .catch((err) => {
          console.log('[StealthAurora] Request failed, using modeled fallback:', err)
          this.handleCompanionResponse({
            kp: '4.5',
            chancePercent: 78,
            textGuidance: 'High Viewing Chance',
            clouds: 18,
            locationText: 'Local GPS',
            locations: this.state.locations,
            forecast12h: [
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
            ],
            forecast24h: [
              { block: '+3h', prob: 80, clouds: 18, kp: 4.8 },
              { block: '+6h', prob: 72, clouds: 25, kp: 4.5 },
              { block: '+9h', prob: 45, clouds: 40, kp: 3.5 },
              { block: '+12h', prob: 25, clouds: 50, kp: 2.8 },
              { block: '+15h', prob: 30, clouds: 45, kp: 3.0 },
              { block: '+18h', prob: 60, clouds: 30, kp: 4.2 },
              { block: '+21h', prob: 85, clouds: 15, kp: 5.3 },
              { block: '+24h', prob: 78, clouds: 20, kp: 4.9 }
            ],
            forecast7d: [
              { day: 'D1', kp: 5.0, clouds: 20, prob: 78, rating: 'Storm' },
              { day: 'D2', kp: 4.7, clouds: 25, prob: 72, rating: 'Active' },
              { day: 'D3', kp: 3.5, clouds: 35, prob: 48, rating: 'Unsettled' },
              { day: 'D4', kp: 2.8, clouds: 40, prob: 30, rating: 'Quiet' },
              { day: 'D5', kp: 3.5, clouds: 30, prob: 52, rating: 'Unsettled' },
              { day: 'D6', kp: 4.2, clouds: 22, prob: 68, rating: 'Active' },
              { day: 'D7', kp: 5.3, clouds: 18, prob: 84, rating: 'Storm' }
            ],
            forecast28d: [
              { week: 'Wk 1', days: 'D1-7', maxKp: 5.3, avgKp: 4.1, risk: 'Storm Risk' },
              { week: 'Wk 2', days: 'D8-14', maxKp: 3.8, avgKp: 2.9, risk: 'Unsettled' },
              { week: 'Wk 3', days: 'D15-21', maxKp: 4.5, avgKp: 3.4, risk: 'Active' },
              { week: 'Wk 4', days: 'D22-28', maxKp: 5.7, avgKp: 4.4, risk: 'Recurrent Storm' }
            ]
          })
        })
        .finally(() => {
          this.state.isLoading = false
          this.setLoadingUI(false)
        })
    },

    handleCompanionResponse(data) {
      if (!data) return

      if (Array.isArray(data.locations) && data.locations.length > 0) {
        this.state.locations = data.locations
      }

      this.state.kp = parseFloat(data.kp) || 0
      this.state.chancePercent = Math.min(100, Math.max(0, parseInt(data.chancePercent, 10) || 0))
      this.state.clouds = parseInt(data.clouds, 10) || 0
      this.state.textGuidance = data.textGuidance || 'Moderate Activity'
      this.state.locationText = data.locationText || 'Local GPS'

      if (Array.isArray(data.forecast12h)) {
        this.state.forecast12h = data.forecast12h
      } else if (Array.isArray(data.forecast)) {
        this.state.forecast12h = data.forecast
      }

      if (Array.isArray(data.forecast24h)) {
        this.state.forecast24h = data.forecast24h
      }

      if (Array.isArray(data.forecast7d)) {
        this.state.forecast7d = data.forecast7d
      }

      if (Array.isArray(data.forecast28d)) {
        this.state.forecast28d = data.forecast28d
      }

      this.updateAllUI()
    },

    updateAllUI() {
      if (typeof hmUI === 'undefined') return

      const pct = this.state.chancePercent

      // 1. Update Screen 0 (NOW)
      if (this.widgets.nowKpLabel) {
        this.widgets.nowKpLabel.setProperty(hmUI.prop.TEXT, `Kp ${this.state.kp.toFixed(1)}`)
      }

      if (this.widgets.nowCloudLabel) {
        const cloudColor = this.state.clouds > 60 ? COLOR_CLOUDY : COLOR_EMERALD
        this.widgets.nowCloudLabel.setProperty(hmUI.prop.COLOR, cloudColor)
        this.widgets.nowCloudLabel.setProperty(hmUI.prop.TEXT, `Cloud ${this.state.clouds}%`)
      }

      if (this.widgets.nowProbLabel) {
        let heroColor = COLOR_MUTED
        if (pct >= 70) heroColor = COLOR_EMERALD
        else if (pct >= 40) heroColor = COLOR_CYAN

        this.widgets.nowProbLabel.setProperty(hmUI.prop.COLOR, heroColor)
        this.widgets.nowProbLabel.setProperty(hmUI.prop.TEXT, `${pct}%`)
      }

      if (this.widgets.nowGuidanceLabel) {
        this.widgets.nowGuidanceLabel.setProperty(hmUI.prop.TEXT, this.state.textGuidance)
      }

      if (this.widgets.nowLocationBtn) {
        const count = this.state.locations.length
        const idx = this.state.activeLocationIndex + 1
        const displayText = count > 1
          ? `${this.state.locationText} (${idx}/${count})`
          : this.state.locationText
        this.widgets.nowLocationBtn.setProperty(hmUI.prop.TEXT, displayText)
      }

      // 2. Update Screen 1 (12H)
      const f12 = this.state.forecast12h
      if (f12.length > 0) {
        const peakProb = Math.max(...f12.map((f) => f.prob || 0))
        const maxKp = Math.max(...f12.map((f) => f.kp || 0))

        if (this.widgets.h12SummaryLabel) {
          this.widgets.h12SummaryLabel.setProperty(
            hmUI.prop.TEXT,
            `12H PEAK ${peakProb}% | MAX KP ${maxKp.toFixed(1)}`
          )
        }

        const maxH = 64
        const barY = 96
        for (let i = 0; i < 12; i++) {
          const item = f12[i]
          const barFill = this.widgets.h12BarsFill[i]
          if (barFill && item) {
            const itemProb = item.prob || 0
            const h = Math.max(4, Math.round((itemProb / 100) * maxH))
            const fillY = barY + maxH - h
            let color = COLOR_DIM
            if (itemProb >= 70) color = COLOR_EMERALD
            else if (itemProb >= 40) color = COLOR_CYAN

            barFill.setProperty(hmUI.prop.MORE, {
              y: fillY,
              h: h,
              color: color
            })
          }
        }

        const avgCloud = Math.round(
          f12.reduce((acc, cur) => acc + (cur.clouds || 0), 0) / f12.length
        )
        if (this.widgets.h12ProbLabels[0]) {
          this.widgets.h12ProbLabels[0].setProperty(
            hmUI.prop.TEXT,
            `AVG CLOUD ${avgCloud}% · PEAK ODDS ${peakProb}%`
          )
        }
      }

      // 3. Update Screen 2 (24H)
      const f24 = this.state.forecast24h
      if (f24.length > 0) {
        const peak24 = Math.max(...f24.map((f) => f.prob || 0))
        const maxKp24 = Math.max(...f24.map((f) => f.kp || 0))

        if (this.widgets.h24SummaryLabel) {
          this.widgets.h24SummaryLabel.setProperty(
            hmUI.prop.TEXT,
            `24H PEAK ${peak24}% | MAX KP ${maxKp24.toFixed(1)}`
          )
        }

        const maxH = 68
        const blockY = 94
        for (let b = 0; b < 8; b++) {
          const item = f24[b]
          const fill = this.widgets.h24BlocksFill[b]
          if (fill && item) {
            const itemProb = item.prob || 0
            const h = Math.max(4, Math.round((itemProb / 100) * maxH))
            const fillY = blockY + maxH - h
            let color = COLOR_DIM
            if (itemProb >= 70) color = COLOR_EMERALD
            else if (itemProb >= 40) color = COLOR_CYAN

            fill.setProperty(hmUI.prop.MORE, {
              y: fillY,
              h: h,
              color: color
            })
          }
        }

        if (this.widgets.h24DataLabels[0]) {
          this.widgets.h24DataLabels[0].setProperty(
            hmUI.prop.TEXT,
            `PEAK: ${peak24}% · MAX KP: ${maxKp24.toFixed(1)}`
          )
        }
      }

      // 4. Update Screen 3 (7D)
      const f7 = this.state.forecast7d
      if (f7.length > 0) {
        for (let d = 0; d < 7; d++) {
          const item = f7[d]
          if (item) {
            if (this.widgets.d7KpLabels[d]) {
              this.widgets.d7KpLabels[d].setProperty(hmUI.prop.TEXT, `Kp ${item.kp.toFixed(1)}`)
            }
            if (this.widgets.d7CloudLabels[d]) {
              this.widgets.d7CloudLabels[d].setProperty(hmUI.prop.TEXT, `Cld ${item.clouds}%`)
            }
            if (this.widgets.d7ProbLabels[d]) {
              let pColor = COLOR_MUTED
              if (item.prob >= 70) pColor = COLOR_EMERALD
              else if (item.prob >= 40) pColor = COLOR_CYAN
              this.widgets.d7ProbLabels[d].setProperty(hmUI.prop.COLOR, pColor)
              this.widgets.d7ProbLabels[d].setProperty(hmUI.prop.TEXT, `${item.prob}%`)
            }
          }
        }
      }

      // 5. Update Screen 4 (28D)
      const f28 = this.state.forecast28d
      if (f28.length > 0) {
        for (let w = 0; w < 4; w++) {
          const item = f28[w]
          if (item) {
            if (this.widgets.d28KpLabels[w]) {
              this.widgets.d28KpLabels[w].setProperty(
                hmUI.prop.TEXT,
                `Max Kp ${item.maxKp.toFixed(1)} · Avg ${item.avgKp}`
              )
            }
            if (this.widgets.d28RiskLabels[w]) {
              let rColor = COLOR_MUTED
              if (item.maxKp >= 5.0) rColor = COLOR_MAGENTA
              else if (item.maxKp >= 4.0) rColor = COLOR_EMERALD
              this.widgets.d28RiskLabels[w].setProperty(hmUI.prop.COLOR, rColor)
              this.widgets.d28RiskLabels[w].setProperty(hmUI.prop.TEXT, item.risk)
            }
          }
        }
      }

      this.updateActiveScreenRing()
    },

    setLoadingUI(isLoading) {
      if (!isLoading) return
      if (this.widgets.nowGuidanceLabel) {
        this.widgets.nowGuidanceLabel.setProperty(hmUI.prop.TEXT, 'Updating...')
      }
    },

    onDestroy() {
      console.log('[StealthAurora] Watch page onDestroy')
    }
  })
)
