/**
 * ZeppHello - Shortcut Card (AppWidget)
 * Publisher: Stealth Apps
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen)
 *
 * TEMPLATE ARCHITECTURE NOTES:
 * - AppWidget renders a quick card in the Amazfit Shortcut Screen (swiping right).
 * - Reads shared globalData from the running app instance.
 * - Tapping the card jumps directly to the full app via hmApp.gotoPage().
 */

const SCREEN_WIDTH = 466
const CARD_HEIGHT = 160
const CARD_MARGIN = 24
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2 // 418px

AppWidget({
  state: {
    textColor: '#10b981',
    clickCount: 0
  },

  widgets: {
    bgCard: null,
    titleLabel: null,
    helloLabel: null,
    counterLabel: null,
    clickOverlay: null
  },

  onInit() {
    console.log('[ZeppHello] AppWidget initialized by Stealth Apps')
    const app = typeof getApp === 'function' ? getApp() : null
    if (app && app._options && app._options.globalData) {
      if (app._options.globalData.textColor) {
        this.state.textColor = app._options.globalData.textColor
      }
      if (app._options.globalData.clickCount !== undefined) {
        this.state.clickCount = app._options.globalData.clickCount
      }
    }
  },

  build() {
    if (typeof hmUI !== 'undefined' && hmUI.setAppWidgetSize) {
      hmUI.setAppWidgetSize({ h: CARD_HEIGHT })
    }

    const startX = CARD_MARGIN
    const startY = 10

    if (typeof hmUI !== 'undefined') {
      // 1. Background Card
      this.widgets.bgCard = hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: startX,
        y: startY,
        w: CARD_WIDTH,
        h: CARD_HEIGHT - 20,
        radius: 24,
        color: 0x0f172a
      })

      // 2. Title
      this.widgets.titleLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: startX + 24,
        y: startY + 20,
        w: CARD_WIDTH - 48,
        h: 24,
        color: 0x38bdf8,
        text_size: 15,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: 'ZEPPHELLO SHORTCUT CARD'
      })

      // 3. Hello Message
      this.widgets.helloLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: startX + 24,
        y: startY + 50,
        w: CARD_WIDTH - 48,
        h: 44,
        color: 0x10b981,
        text_size: 32,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: 'Hello, Zepp OS!'
      })

      // 4. Subtitle / Taps
      this.widgets.counterLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: startX + 24,
        y: startY + 98,
        w: CARD_WIDTH - 48,
        h: 22,
        color: 0x94a3b8,
        text_size: 13,
        align_h: hmUI.align.LEFT,
        align_v: hmUI.align.CENTER_V,
        text: `Stealth Apps · Taps: ${this.state.clickCount}`
      })

      // 5. Click overlay
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
    const app = typeof getApp === 'function' ? getApp() : null
    if (app && app._options && app._options.globalData) {
      if (app._options.globalData.clickCount !== undefined && this.widgets.counterLabel) {
        this.state.clickCount = app._options.globalData.clickCount
        this.widgets.counterLabel.setProperty(
          hmUI.prop.TEXT,
          `Stealth Apps · Taps: ${this.state.clickCount}`
        )
      }
    }
  },

  onPause() {},
  onDestroy() {}
})
