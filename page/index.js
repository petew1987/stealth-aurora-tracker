/**
 * ZeppHello - Watch Page UI (Zepp OS 3.x / 2.x Direct Native API)
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen)
 */

import { createWidget, widget, align, prop } from '@zos/ui'

const SCREEN_SIZE = 466

const COLORS = [
  { name: 'Purple', hex: '#a855f7', int: 0xa855f7 },
  { name: 'Emerald', hex: '#10b981', int: 0x10b981 },
  { name: 'Cyan', hex: '#06b6d4', int: 0x06b6d4 },
  { name: 'Amber', hex: '#f59e0b', int: 0xf59e0b },
  { name: 'Rose', hex: '#f43f5e', int: 0xf43f5e },
  { name: 'Sky', hex: '#38bdf8', int: 0x38bdf8 }
]

Page({
  state: {
    colorIndex: 0,
    clickCount: 0,
    currentColor: COLORS[0].int,
    colorName: COLORS[0].name
  },

  widgets: {
    bgArc: null,
    helloBtn: null,
    counterLabel: null,
    infoLabel: null,
    syncBtn: null
  },

  onInit() {
    console.log('[ZeppHello] Native page onInit')
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
      console.warn('onInit globalData error:', e)
    }
  },

  build() {
    console.log('[ZeppHello] Native page build')

    // 1. Background Arc
    try {
      this.widgets.bgArc = createWidget(widget.ARC, {
        x: 33,
        y: 33,
        w: 400,
        h: 400,
        start_angle: 135,
        end_angle: 405,
        color: 0x334155,
        line_width: 10
      })
    } catch (e) {
      console.warn('bgArc error:', e)
    }

    // 2. Subtitle header
    try {
      createWidget(widget.TEXT, {
        x: 33,
        y: 90,
        w: 400,
        h: 30,
        color: 0x94a3b8,
        text_size: 16,
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text: 'STEALTH APPS'
      })
    } catch (e) {
      console.warn('title error:', e)
    }

    // 3. Main Hello Button
    try {
      this.widgets.helloBtn = createWidget(widget.BUTTON, {
        x: 83,
        y: 130,
        w: 300,
        h: 110,
        normal_color: 0x1e293b,
        press_color: 0x334155,
        radius: 24,
        text: 'Hello!',
        text_size: 40,
        color: this.state.currentColor,
        click_func: () => {
          this.onHelloTap()
        }
      })
    } catch (e) {
      console.warn('helloBtn error:', e)
    }

    // 4. Click Counter label
    try {
      this.widgets.counterLabel = createWidget(widget.TEXT, {
        x: 33,
        y: 260,
        w: 400,
        h: 36,
        color: 0xffffff,
        text_size: 20,
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text: `Taps: 0 \n ${this.state.colorName}`
      })
    } catch (e) {
      console.warn('counterLabel error:', e)
    }

    // 5. Instructions label
    try {
      this.widgets.infoLabel = createWidget(widget.TEXT, {
        x: 33,
        y: 305,
        w: 400,
        h: 40,
        color: 0x94a3b8,
        text_size: 14,
        align_h: align.CENTER_H,
        align_v: align.CENTER_V,
        text: 'Tap button to cycle color'
      })
    } catch (e) {
      console.warn('infoLabel error:', e)
    }

    // 6. Sync Button
    try {
      this.widgets.syncBtn = createWidget(widget.BUTTON, {
        x: 143,
        y: 355,
        w: 180,
        h: 50,
        normal_color: 0x7e22ce,
        press_color: 0x6b21a8,
        radius: 16,
        text: 'SYNC',
        text_size: 16,
        color: 0xffffff,
        click_func: () => {
          this.fetchCompanionSettings()
        }
      })
    } catch (e) {
      console.warn('syncBtn error:', e)
    }
  },

  onHelloTap() {
    this.state.clickCount++
    this.state.colorIndex = (this.state.colorIndex + 1) % COLORS.length
    const activeColor = COLORS[this.state.colorIndex]
    this.state.currentColor = activeColor.int
    this.state.colorName = activeColor.name

    if (this.widgets.helloBtn) {
      try {
        this.widgets.helloBtn.setProperty(prop.COLOR, activeColor.int)
      } catch (e) {}
    }
    if (this.widgets.counterLabel) {
      try {
        this.widgets.counterLabel.setProperty(
          prop.TEXT,
          `Taps: ${this.state.clickCount} \n ${activeColor.name}`
        )
      } catch (e) {}
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
      try {
        this.widgets.counterLabel.setProperty(prop.TEXT, 'Syncing...')
      } catch (e) {}
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
                this.widgets.helloBtn.setProperty(prop.COLOR, this.state.currentColor)
              }
            }
          }
          if (this.widgets.counterLabel) {
            this.widgets.counterLabel.setProperty(
              prop.TEXT,
              `Synced \n ${this.state.colorName}`
            )
          }
        }
      }).catch(() => {
        if (this.widgets.counterLabel) {
          this.widgets.counterLabel.setProperty(prop.TEXT, 'Offline')
        }
      })
    } catch (e) {
      if (this.widgets.counterLabel) {
        this.widgets.counterLabel.setProperty(prop.TEXT, 'Error')
      }
    }
  },

  onDestroy() {
    console.log('[ZeppHello] Native page onDestroy')
  }
})
