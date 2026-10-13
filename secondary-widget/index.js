/**
 * Stealth Aurora Tracker - Secondary Widget (Swipe-Left Glanceable Widget)
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen)
 * Publisher: Stealth Apps
 * ZERO emojis used.
 */

const SCREEN_SIZE = 466

SecondaryWidget({
  state: {
    kp: '4.2',
    chancePercent: 78,
    clouds: 18,
    textGuidance: 'High Viewing Chance',
    locationText: 'Local GPS'
  },

  widgets: {
    bgArc: null,
    probArc: null,
    titleLabel: null,
    probLabel: null,
    statusLabel: null,
    cloudsLabel: null,
    clickOverlay: null
  },

  onInit() {
    console.log('[StealthAurora] SecondaryWidget glance initialized')
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
    if (typeof hmUI === 'undefined') return

    // 1. Background Frame Arc
    this.widgets.bgArc = hmUI.createWidget(hmUI.widget.ARC, {
      x: 38,
      y: 38,
      w: 390,
      h: 390,
      start_angle: 135,
      end_angle: 405,
      color: 0x1e293b,
      line_width: 8
    })

    const sweep = Math.round((this.state.chancePercent / 100) * 270)
    const probColor = this.state.chancePercent >= 70 ? 0x10b981 : 0x06b6d4

    this.widgets.probArc = hmUI.createWidget(hmUI.widget.ARC, {
      x: 38,
      y: 38,
      w: 390,
      h: 390,
      start_angle: 135,
      end_angle: 135 + sweep,
      color: probColor,
      line_width: 8
    })

    // 2. Title Pill
    this.widgets.titleLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 33,
      y: 110,
      w: 400,
      h: 24,
      color: 0x38bdf8,
      text_size: 15,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: `AURORA · Kp ${this.state.kp}`
    })

    // 3. Huge Probability Number
    this.widgets.probLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 33,
      y: 145,
      w: 400,
      h: 68,
      color: probColor,
      text_size: 54,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: `${this.state.chancePercent}%`
    })

    // 4. Viewing Guidance
    this.widgets.statusLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 33,
      y: 220,
      w: 400,
      h: 26,
      color: 0xf8fafc,
      text_size: 17,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: this.state.textGuidance
    })

    // 5. Cloud conditions & location (NO emojis)
    this.widgets.cloudsLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 33,
      y: 255,
      w: 400,
      h: 24,
      color: 0x94a3b8,
      text_size: 14,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: `${this.state.locationText} · Cloud ${this.state.clouds}%`
    })

    // 6. Click overlay
    this.widgets.clickOverlay = hmUI.createWidget(hmUI.widget.BUTTON, {
      x: 0,
      y: 0,
      w: SCREEN_SIZE,
      h: SCREEN_SIZE,
      normal_color: 0x000000,
      press_color: 0x1e293b,
      click_func: () => {
        if (typeof hmApp !== 'undefined' && hmApp.gotoPage) {
          hmApp.gotoPage({ url: 'page/index' })
        }
      }
    })
  },

  onResume() {
    this.readGlobalData()
    const sweep = Math.round((this.state.chancePercent / 100) * 270)
    const probColor = this.state.chancePercent >= 70 ? 0x10b981 : 0x06b6d4

    if (this.widgets.probArc) {
      this.widgets.probArc.setProperty(hmUI.prop.MORE, {
        start_angle: 135,
        end_angle: 135 + sweep,
        color: probColor
      })
    }
    if (this.widgets.titleLabel) {
      this.widgets.titleLabel.setProperty(hmUI.prop.TEXT, `AURORA · Kp ${this.state.kp}`)
    }
    if (this.widgets.probLabel) {
      this.widgets.probLabel.setProperty(hmUI.prop.TEXT, `${this.state.chancePercent}%`)
      this.widgets.probLabel.setProperty(hmUI.prop.COLOR, probColor)
    }
    if (this.widgets.statusLabel) {
      this.widgets.statusLabel.setProperty(hmUI.prop.TEXT, this.state.textGuidance)
    }
    if (this.widgets.cloudsLabel) {
      this.widgets.cloudsLabel.setProperty(
        hmUI.prop.TEXT,
        `${this.state.locationText} · Cloud ${this.state.clouds}%`
      )
    }
  },

  onPause() {},
  onDestroy() {}
})
