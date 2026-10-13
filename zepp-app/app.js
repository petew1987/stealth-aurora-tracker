/**
 * Aurora Tracker - Zepp OS Application Entry Point
 * Target Device: Amazfit Active 3 (Round 466x466 AMOLED Screen)
 * Publisher: Stealth Apps
 *
 * ARCHITECTURE OVERVIEW:
 * - Root app.js executed when the Zepp OS mini-app initializes on the smartwatch.
 * - Stores shared globalData accessible to the main page, app-widgets, and secondary glance widgets.
 * - Manages application lifecycle hooks using @zeppos/zml BaseApp.
 */

import { BaseApp } from '@zeppos/zml/base-app'

App(
  BaseApp({
    globalData: {
      appName: 'Aurora Tracker',
      vender: 'Stealth Apps',
      kp: 0,
      chancePercent: 0,
      textGuidance: 'Ready to scan',
      clouds: 0,
      locationText: 'Locating...',
      forecast: [],
      lastUpdated: null
    },

    onCreate(options) {
      console.log('[AuroraTracker] App onCreate initialized for Amazfit Active 3 (466x466)')
    },

    onDestroy(options) {
      console.log('[AuroraTracker] App onDestroy called')
    }
  })
)
