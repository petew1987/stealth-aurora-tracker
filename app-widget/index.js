/**
 * Stealth Aurora Tracker - Shortcut Card (AppWidget)
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen)
 * Publisher: Stealth Apps
 *
 * ARCHITECTURAL ROLE:
 * - Renders an ambient glance card on the Amazfit shortcut feed (swiping right).
 * - Reads cached space weather and cloud conditions from globalData.
 * - Single tap opens the full Aurora Tracker page via hmApp.gotoPage().
 */

const SCREEN_WIDTH = 466
const CARD_HEIGHT = 160
const CARD_MARGIN = 24
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2 // 418px

AppWidget({
  state: {
    kp: '3.5',
    chancePercent: 70,
    clouds: 15,
    textGuidance: 'High Viewing Chance',
    locationText: 'Tromsø, Norway'
  },

  widgets: {
    bgCard: null,
    titleLabel: null,
    probLabel: null,
    statusLabel: null,
    clickOverlay: null
  },

  onInit() {
    console.log('[StealthAurora] AppWidget initialized')
    this.readGlobalData()
  },

  readGlobalData() {
    const app = typeof getApp === 'function' ? getApp() : null
    if (app && app._options && app._options.globalData) {
      const gd = app._options.globalData
      if (gd.kp !== undefined) this.state.kp = gd.kp
      if (gd.chancePercent !== undefined) this.state.chancePercent = gd.chancePercent
      if (gd.clouds !== undefined) this.state.clouds = gd.clouds
      if (gd.textGuidance) this.state.textGuidance = gd.textGuidance
      if (gd.locationText) this.state.locationText = gd.locationText
    }
  },

  build() {
    if (typeof hmUI !== 'undefined' && hmUI.setAppWidgetSize) {
      hmUI.setAppWidgetSize({ h: CARD_HEIGHT })
    }

    const startX = CARD_MARGIN
    const startY = 10

    if (typeof hmUI !== 'undefined') {
      // 1. Background Rounded Card
      this.widgets.bgCard = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: startX,
        y: startY,
        w: CARD_WIDTH,
        h: CARD_HEIGHT - 20,
        radius: 24,
        color: 0x0f172a
      })

      // 2. Section Header with Location & Kp
      this.widgets.titleLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: startX + 24,
        y: startY + 18,
        w: CARD_WIDTH - 48,
        h: 22,
        color: 0x38bdf8,
        text_size: 14,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: `AURORA · ${this.state.locationText} · Kp ${this.state.kp}`
      })

      // 3. Huge Probability Display
      const chance = this.state.chancePercent
      const probColor = chance >= 70 ? 0x10b981 : chance >= 40 ? 0x06b6d4 : 0x94a3b8
      this.widgets.probLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: startX + 24,
        y: startY + 44,
        w: CARD_WIDTH - 48,
        h: 46,
        color: probColor,
        text_size: 36,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: `${chance}% Likelihood`
      })

      // 4. Subtitle / Guidance and Cloud Cover
      this.widgets.statusLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: startX + 24,
        y: startY + 96,
        w: CARD_WIDTH - 48,
        h: 22,
        color: 0x94a3b8,
        text_size: 14,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: `${this.state.textGuidance} · ☁ ${this.state.clouds}% clouds`
      })

      // 5. Click Overlay to Jump to Full Page
      this.widgets.clickOverlay = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: startX,
        y: startY,
        w: CARD_WIDTH,
        h: CARD_HEIGHT - 20,
        normal_color: 0x000000,
        press_color: 0x1e293b,
        click_func: () => {
          if (typeof hmApp !== 'undefined' && hmApp.gotoPage) {
            hmApp.gotoPage({ url: 'page/index' })
          }
        }
      })
    }
  },

  onResume() {
    this.readGlobalData()
    if (this.widgets.titleLabel) {
      this.widgets.titleLabel.setProperty(
        hmUI.prop.TEXT,
        `AURORA · ${this.state.locationText} · Kp ${this.state.kp}`
      )
    }
    if (this.widgets.probLabel) {
      const chance = this.state.chancePercent
      const probColor = chance >= 70 ? 0x10b981 : chance >= 40 ? 0x06b6d4 : 0x94a3b8
      this.widgets.probLabel.setProperty(hmUI.prop.TEXT, `${chance}% Likelihood`)
      this.widgets.probLabel.setProperty(hmUI.prop.COLOR, probColor)
    }
    if (this.widgets.statusLabel) {
      this.widgets.statusLabel.setProperty(
        hmUI.prop.TEXT,
        `${this.state.textGuidance} · ☁ ${this.state.clouds}% clouds`
      )
    }
  },

  onPause() {},
  onDestroy() {}
})
