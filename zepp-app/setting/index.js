/**
 * Stealth Aurora Tracker - Settings App (Runs on Smartphone Zepp App for Android & iOS)
 * Publisher: Stealth Apps
 *
 * Provides phone configuration for:
 * - Active locations list on watch (GPS Local default, plus user-selected auroral hotspots)
 * - Cloud cover sensitivity filter
 * - Quick preset toggles
 */

const PRESET_LOCATIONS = [
  { id: 'local', name: '📍 GPS Local (Default)', desc: 'Current device GPS position', isGps: true, lat: null, lon: null },
  { id: 'tromso', name: '🇳🇴 Tromsø, Norway', desc: '69.6°N, 18.9°E · Prime Auroral Oval', lat: 69.65, lon: 18.96 },
  { id: 'fairbanks', name: '🇺🇸 Fairbanks, Alaska', desc: '64.8°N, -147.7°W · Interior Dark Sky', lat: 64.84, lon: -147.72 },
  { id: 'reykjavik', name: '🇮🇸 Reykjavik, Iceland', desc: '64.1°N, -21.9°W · Maritime Aurora Belt', lat: 64.14, lon: -21.94 },
  { id: 'yellowknife', name: '🇨🇦 Yellowknife, Canada', desc: '62.4°N, -114.4°W · Sub-Arctic Capital', lat: 62.45, lon: -114.37 },
  { id: 'abisko', name: '🇸🇪 Abisko, Sweden', desc: '68.3°N, 18.8°E · Clear Sky Microclimate', lat: 68.35, lon: 18.83 },
  { id: 'rovaniemi', name: '🇫🇮 Rovaniemi, Finland', desc: '66.5°N, 25.7°E · Arctic Circle Lapland', lat: 66.50, lon: 25.73 }
]

const CLOUD_THRESHOLD_OPTIONS = [
  { name: 'Strict (< 30% clouds only)', value: '30' },
  { name: 'Standard (< 60% clouds)', value: '60' },
  { name: 'Permissive (< 80% clouds)', value: '80' }
]

AppSettingsPage({
  state: {
    selectedIds: ['local', 'tromso', 'fairbanks', 'reykjavik']
  },

  build(props) {
    let activeIds = ['local', 'tromso', 'fairbanks', 'reykjavik']
    try {
      const stored = props.settingsStorage.getItem('activeLocationIds')
      if (stored) {
        const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored
        if (Array.isArray(parsed) && parsed.length > 0) {
          activeIds = parsed
        }
      }
    } catch (e) {
      console.log('[StealthAuroraSettings] Error reading activeLocationIds:', e)
    }

    if (!activeIds.includes('local')) {
      activeIds.unshift('local')
    }

    const toggleLocation = (id) => {
      if (id === 'local') return
      let updated = [...activeIds]
      if (updated.includes(id)) {
        updated = updated.filter(item => item !== id)
      } else {
        updated.push(id)
      }
      props.settingsStorage.setItem('activeLocationIds', JSON.stringify(updated))
    }

    return View(
      {
        style: {
          padding: '16px 14px',
          backgroundColor: '#090d16',
          color: '#f8fafc',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      },
      [
        // Header
        View(
          { style: { paddingBottom: '12px', borderBottom: '1px solid #1e293b' } },
          [
            Text({
              style: {
                fontSize: '20px',
                fontWeight: '700',
                color: '#10b981',
                marginBottom: '4px',
                lineHeight: '26px'
              }
            }, 'Stealth Aurora Tracker'),
            Text({
              style: { fontSize: '13px', color: '#94a3b8', lineHeight: '18px' }
            }, 'Select locations to monitor on your Amazfit Active 3 watch. GPS Local is active by default; tap the location title on the watch to cycle through your selected sites.')
          ]
        ),

        // Locations Management Section
        Section(
          {
            title: 'WATCH LOCATIONS LIST',
            style: {
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '14px'
            }
          },
          [
            Text({
              style: { fontSize: '12px', color: '#cbd5e1', marginBottom: '12px', lineHeight: '18px' }
            }, 'Tap any location below to enable or disable it on the watch app:'),

            View(
              {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }
              },
              PRESET_LOCATIONS.map(loc => {
                const isSelected = activeIds.includes(loc.id)
                const isGpsDefault = loc.id === 'local'

                return View(
                  {
                    style: {
                      display: 'flex',
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: isSelected ? '#132338' : '#0a0f1d',
                      border: isSelected ? '1px solid #0284c7' : '1px solid #1e293b',
                      borderRadius: '10px'
                    }
                  },
                  [
                    View(
                      { style: { display: 'flex', flexDirection: 'column', flex: 1, marginRight: '10px' } },
                      [
                        Text({
                          style: {
                            fontSize: '14px',
                            fontWeight: '600',
                            color: isSelected ? '#38bdf8' : '#e2e8f0'
                          }
                        }, loc.name),
                        Text({
                          style: { fontSize: '11px', color: '#94a3b8', marginTop: '2px' }
                        }, loc.desc)
                      ]
                    ),
                    Button({
                      label: isGpsDefault ? 'DEFAULT' : (isSelected ? 'ENABLED' : 'ADD'),
                      style: {
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '6px 12px',
                        backgroundColor: isGpsDefault
                          ? '#059669'
                          : (isSelected ? '#0284c7' : '#334155'),
                        color: '#ffffff',
                        borderRadius: '6px'
                      },
                      onClick: () => {
                        toggleLocation(loc.id)
                      }
                    })
                  ]
                )
              })
            )
          ]
        ),

        // Sky Sensitivity Section
        Section(
          {
            title: 'CLOUD SENSITIVITY FILTER',
            style: {
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '14px'
            }
          },
          [
            Text({
              style: { fontSize: '13px', color: '#cbd5e1', marginBottom: '10px', lineHeight: '20px' }
            }, 'Thick clouds obstruct auroral visibility. Adjust sky transparency threshold:'),

            Select({
              label: 'Max Cloud Cover Tolerance',
              settingsKey: 'cloudThreshold',
              options: CLOUD_THRESHOLD_OPTIONS
            })
          ]
        ),

        // Quick Preset Bundles
        Section(
          {
            title: 'QUICK PRESET BUNDLES',
            style: {
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '14px'
            }
          },
          [
            Text({
              style: { fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }
            }, 'Quickly set your watch rotation:'),

            View(
              {
                style: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px',
                  flexWrap: 'wrap'
                }
              },
              [
                Button({
                  label: 'GPS Only',
                  style: {
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '8px 12px',
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    borderRadius: '8px'
                  },
                  onClick: () => {
                    props.settingsStorage.setItem('activeLocationIds', JSON.stringify(['local']))
                  }
                }),
                Button({
                  label: 'All Nordic Sites',
                  style: {
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '8px 12px',
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    borderRadius: '8px'
                  },
                  onClick: () => {
                    props.settingsStorage.setItem(
                      'activeLocationIds',
                      JSON.stringify(['local', 'tromso', 'reykjavik', 'abisko', 'rovaniemi'])
                    )
                  }
                }),
                Button({
                  label: 'North America',
                  style: {
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '8px 12px',
                    backgroundColor: '#8b5cf6',
                    color: '#ffffff',
                    borderRadius: '8px'
                  },
                  onClick: () => {
                    props.settingsStorage.setItem(
                      'activeLocationIds',
                      JSON.stringify(['local', 'fairbanks', 'yellowknife'])
                    )
                  }
                })
              ]
            )
          ]
        ),

        // Info footer
        View(
          {
            style: {
              backgroundColor: '#1e293b/40',
              border: '1px solid #334155',
              borderRadius: '12px',
              padding: '12px'
            }
          },
          [
            Text({
              style: { fontSize: '12px', color: '#94a3b8', lineHeight: '18px' }
            }, 'Watch Tip: On your Amazfit watch screen, tap the location header at the top to cycle between GPS Local and your chosen locations.')
          ]
        )
      ]
    )
  }
})
