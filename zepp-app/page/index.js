/**
 * ZeppHello - Watch Page UI (Zepp OS 2.x & 3.0 Compatible)
 * Publisher: Stealth Apps
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen, Center: x=233, y=233)
 *
 * CODEBASE ARCHITECTURE NOTES (Stealth Apps Template Guide):
 * 1. page/index.js: The main watch screen UI. Uses hmUI.createWidget for rendering
 *    text, buttons, arcs, and shapes on the watch canvas.
 * 2. app-side/index.js: Companion background service running on the mobile phone
 *    with a full fetch/network environment and settingsStorage access.
 * 3. setting/index.js: Smartphone Zepp App settings page for customizing preferences.
 * 4. app-widget/index.js & secondary-widget/index.js: Shortcut cards & swipe widgets.
 *
 * This template demonstrates:
 * - Reactive state management on the watch.
 * - Tap interactions that change UI properties dynamically.
 * - IPC request communication with companion app-side.
 */

import { BasePage } from '@zeppos/zml/base-page'

const SCREEN_SIZE = 466
const CENTER_X = 233
const CENTER_Y = 233

// Vibrant AMOLED Color Palette
const COLORS = [
  { name: 'Emerald', hex: '#10b981', int: 0x10b981 },
  { name: 'Cyan', hex: '#06b6d4', int: 0x06b6d4 },
  { name: 'Amber', hex: '#f59e0b', int: 0xf59e0b },
  { name: 'Pink', hex: '#ec4899', int: 0xec4899 },
  { name: 'Violet', hex: '#8b5cf6', int: 0x8b5cf6 },
  { name: 'Sky', hex: '#38bdf8', int: 0x38bdf8 }
]

Page(
  BasePage({
    state: {
      colorIndex: 0,
      clickCount: 0,
      currentColor: COLORS[0].int,
      colorName: COLORS[0].name
    },

    widgets: {
      bgArc: null,
      titleLabel: null,
      helloBtn: null,
      counterLabel: null,
      infoLabel: null,
      syncBtn: null
    },

    onInit() {
      console.log('[ZeppHello] Watch page initialized by Stealth Apps for round 466x466 display')
      try {
        const app = typeof getApp === 'function' ? getApp() : null
        if (app && app._options && app._options.globalData && app._options.globalData.textColor) {
          const storedHex = app._options.globalData.textColor
          const foundIndex = COLORS.findIndex(c => c.hex.toLowerCase() === storedHex.toLowerCase())
          if (foundIndex !== -1) {
            this.state.colorIndex = foundIndex
            this.state.currentColor = COLORS[foundIndex].int
            this.state.colorName = COLORS[foundIndex].name
          }
        }
      } catch (e) {
        console.warn('Could not read globalData color:', e)
      }
    },

    build() {
      this.createBackgroundDesign()
      this.createHelloWidgets()
    },

    createBackgroundDesign() {
      if (typeof hmUI !== 'undefined') {
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
      }
    },

    createHelloWidgets() {
      if (typeof hmUI === 'undefined') return

      // 1. Subtitle header
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 100,
        w: SCREEN_SIZE,
        h: 24,
        color: 0x94a3b8,
        text_size: 14,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'STEALTH APPS · ZEPP OS'
      })

      // 2. Main interactive Hello Button
      this.widgets.helloBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 83,
        y: 140,
        w: 300,
        h: 120,
        normal_color: 0x0f172a,
        press_color: 0x1e293b,
        radius: 24,
        text: 'Hello, Zepp OS!',
        text_size: 32,
        color: this.state.currentColor,
        click_func: () => {
          this.onHelloTap()
        }
      })

      // 3. Click Counter label
      this.widgets.counterLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 280,
        w: SCREEN_SIZE,
        h: 30,
        color: 0xf8fafc,
        text_size: 18,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: `Taps: 0 · Color: ${this.state.colorName}`
      })

      // 4. Instructions label
      this.widgets.infoLabel = hmUI.createWidget(hmUI.widget.TEXT, {
        x: 40,
        y: 320,
        w: SCREEN_SIZE - 80,
        h: 40,
        color: 0x64748b,
        text_size: 12,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text: 'Tap button above to change color. Set default in Zepp App.'
      })

      // 5. Sync / Companion Test Button
      this.widgets.syncBtn = hmUI.createWidget(hmUI.widget.BUTTON, {
        x: 153,
        y: 380,
        w: 160,
        h: 40,
        normal_color: 0x115e59,
        press_color: 0x0f766e,
        radius: 12,
        text: 'SYNC SETTINGS',
        text_size: 14,
        color: 0xf8fafc,
        click_func: () => {
          this.fetchCompanionSettings()
        }
      })
    },

    onHelloTap() {
      this.state.clickCount++
      this.state.colorIndex = (this.state.colorIndex + 1) % COLORS.length
      const activeColor = COLORS[this.state.colorIndex]
      this.state.currentColor = activeColor.int
      this.state.colorName = activeColor.name

      if (this.widgets.helloBtn) {
        this.widgets.helloBtn.setProperty(hmUI.prop.COLOR, activeColor.int)
      }
      if (this.widgets.counterLabel) {
        this.widgets.counterLabel.setProperty(
          hmUI.prop.TEXT,
          `Taps: ${this.state.clickCount} · Color: ${activeColor.name}`
        )
      }

      try {
        const app = typeof getApp === 'function' ? getApp() : null
        if (app && app._options && app._options.globalData) {
          app._options.globalData.clickCount = this.state.clickCount
          app._options.globalData.textColor = activeColor.hex
        }
      } catch (e) {}
    },

    fetchCompanionSettings() {
      if (this.widgets.counterLabel) {
        this.widgets.counterLabel.setProperty(hmUI.prop.TEXT, 'Syncing with companion...')
      }

      try {
        this.request({
          type: 'GET_SETTINGS'
        }).then((response) => {
          if (response && response.success && response.data) {
            const data = response.data
            if (data.textColor) {
              const foundIndex = COLORS.findIndex(c => c.hex.toLowerCase() === data.textColor.toLowerCase())
              if (foundIndex !== -1) {
                this.state.colorIndex = foundIndex
                this.state.currentColor = COLORS[foundIndex].int
                this.state.colorName = COLORS[foundIndex].name
                if (this.widgets.helloBtn) {
                  this.widgets.helloBtn.setProperty(hmUI.prop.COLOR, this.state.currentColor)
                }
              }
            }
            if (this.widgets.counterLabel) {
              this.widgets.counterLabel.setProperty(
                hmUI.prop.TEXT,
                `Synced! Color: ${this.state.colorName}`
              )
            }
          }
        }).catch(() => {
          if (this.widgets.counterLabel) {
            this.widgets.counterLabel.setProperty(hmUI.prop.TEXT, 'Companion disconnected')
          }
        })
      } catch (e) {
        if (this.widgets.counterLabel) {
          this.widgets.counterLabel.setProperty(hmUI.prop.TEXT, 'Sync error')
        }
      }
    },

    onDestroy() {
      console.log('[ZeppHello] Watch page destroyed')
    }
  })
)
