/**
 * ZeppHello - Companion Side Service (Zepp OS 2.x & 3.0 Compatible)
 * Runs in the background on the Zepp Mobile App (Android & iOS).
 *
 * TEMPLATE ARCHITECTURE NOTES:
 * - The watch app cannot make direct network fetch requests or access local settings storage directly.
 * - app-side/index.js provides a full Node/browser fetch environment.
 * - Communicates with watch pages via this.request() / onRequest(req, res).
 * - Reads settings saved by setting/index.js via settingsStorage.getItem().
 */

import { BaseSideService } from '@zeppos/zml/base-side'

AppSideService(
  BaseSideService({
    onInit() {
      console.log('[ZeppHelloAppSide] Companion service initialized')
    },

    onRequest(req, res) {
      console.log('[ZeppHelloAppSide] Received request:', req.type)

      if (req.type === 'GET_SETTINGS') {
        let textColor = '#a855f7' // Default Purple
        try {
          if (typeof settingsStorage !== 'undefined') {
            const stored = settingsStorage.getItem('textColor')
            if (stored) {
              textColor = typeof stored === 'string' ? stored : stored.hex || stored
            }
          }
        } catch (e) {
          console.log('[ZeppHelloAppSide] Error reading settingsStorage:', e.message)
        }

        res(null, {
          success: true,
          data: {
            textColor,
            companionOnline: true,
            timestamp: Date.now()
          }
        })
        return
      }

      if (req.type === 'SET_COLOR') {
        const newColor = req.textColor || '#10b981'
        try {
          if (typeof settingsStorage !== 'undefined') {
            settingsStorage.setItem('textColor', newColor)
          }
        } catch (e) {}
        res(null, { success: true, data: { textColor: newColor } })
        return
      }

      res(null, { success: false, error: 'Unknown request type: ' + req.type })
    }
  })
)
