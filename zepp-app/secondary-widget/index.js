/**
 * ZeppHello - Secondary Widget (Swipe-Left Glanceable Widget)
 * Publisher: Stealth Apps
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen)
 *
 * TEMPLATE ARCHITECTURE NOTES:
 * - SecondaryWidget provides a full-screen glance view when swiping left from the watchface.
 * - Perfect for secondary information or quick actions.
 */

const SCREEN_SIZE = 466

SecondaryWidget({
  state: {
    textColor: '#10b981',
    clickCount: 0
  },

  widgets: {
    bgArc: null,
    titleLabel: null,
    helloLabel: null,
    hintLabel: null,
    clickOverlay: null
  },

  onInit() {
    console.log('[ZeppHello] SecondaryWidget initialized by Stealth Apps')
    const app = typeof getApp === 'function' ? getApp() : null
    if (app && app._options && app._options.globalData) {
      if (app._options.globalData.clickCount !== undefined) {
        this.state.clickCount = app._options.globalData.clickCount
      }
    }
  },

  build() {
    if (typeof hmUI === 'undefined') return

    // 1. Background frame arc
    this.widgets.bgArc = hmUI.createWidget(hmUI.widget.ARC, {
      x: 36,
      y: 36,
      w: 394,
      h: 394,
      start_angle: 135,
      end_angle: 405,
      color: 0x1e293b,
      line_width: 8
    })

    // 2. Title
    this.widgets.titleLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 33,
      y: 120,
      w: 400,
      h: 24,
      color: 0x38bdf8,
      text_size: 16,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: 'STEALTH APPS · QUICK GLANCE'
    })

    // 3. Hello message
    this.widgets.helloLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 33,
      y: 170,
      w: 400,
      h: 60,
      color: 0x10b981,
      text_size: 44,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: 'Hello, Zepp OS!'
    })

    // 4. Hint
    this.widgets.hintLabel = hmUI.createWidget(hmUI.widget.TEXT, {
      x: 33,
      y: 250,
      w: 400,
      h: 24,
      color: 0x94a3b8,
      text_size: 15,
      align_h: hmUI.align.CENTER_H,
      align_v: hmUI.align.CENTER_V,
      text: `Total Taps: ${this.state.clickCount} · Tap to launch`
    })

    // 5. Click overlay
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
    const app = typeof getApp === 'function' ? getApp() : null
    if (app && app._options && app._options.globalData) {
      if (app._options.globalData.clickCount !== undefined && this.widgets.hintLabel) {
        this.state.clickCount = app._options.globalData.clickCount
        this.widgets.hintLabel.setProperty(
          hmUI.prop.TEXT,
          `Total Taps: ${this.state.clickCount} · Tap to launch`
        )
      }
    }
  },

  onPause() {},
  onDestroy() {}
})
