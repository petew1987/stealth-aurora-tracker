/**
 * Stealth Aurora Tracker - Settings App (Runs on Smartphone Zepp App for Android & iOS)
 * Publisher: Stealth Apps
 *
 * SPECIFICATION COMPLIANCE:
 * 1. Robust mobile rendering: Comprehensive defensive guards prevent black screen on Zepp App.
 * 2. User can pick up to 5 preset locations using a text search system for coordinates.
 * 3. Default view is always GPS Local.
 * 4. Zero emojis used anywhere in the UI.
 */

AppSettingsPage({
  state: {
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    searchError: ''
  },

  build(props) {
    try {
      const storage = props && props.settingsStorage ? props.settingsStorage : {
        getItem: () => null,
        setItem: () => {}
      }

      // 1. Load saved custom locations from settingsStorage (Max 5)
      let savedLocations = []
      try {
        const stored = storage.getItem('customLocations')
        if (stored) {
          const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored
          if (Array.isArray(parsed)) {
            savedLocations = parsed.slice(0, 5)
          }
        }
      } catch (e) {
        console.log('[StealthAuroraSettings] Error reading customLocations:', e)
      }

      // Method to save locations
      const updateSavedLocations = (newList) => {
        try {
          const capped = newList.slice(0, 5)
          storage.setItem('customLocations', JSON.stringify(capped))
        } catch (e) {
          console.log('[StealthAuroraSettings] Error saving customLocations:', e)
        }
      }

      const removeLocation = (locId) => {
        const updated = savedLocations.filter(loc => loc && loc.id !== locId)
        updateSavedLocations(updated)
      }

      // Geocoding search function via Open-Meteo
      const executeSearch = (query) => {
        if (!query || typeof query !== 'string' || query.trim().length < 2) return

        const trimmed = query.trim()
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=en&format=json`

        if (typeof fetch === 'function') {
          fetch(url)
            .then(res => res.json())
            .then(data => {
              if (data && Array.isArray(data.results)) {
                storage.setItem('tempSearchResults', JSON.stringify(data.results))
              } else {
                storage.setItem('tempSearchResults', JSON.stringify([]))
              }
            })
            .catch(err => {
              console.log('[StealthAuroraSettings] Geocoding error:', err)
            })
        }
      }

      // Retrieve any current search results
      let currentResults = []
      try {
        const tempRes = storage.getItem('tempSearchResults')
        if (tempRes) {
          currentResults = typeof tempRes === 'string' ? JSON.parse(tempRes) : tempRes
        }
      } catch (e) {}

      return View(
        {
          style: {
            padding: '16px 14px',
            backgroundColor: '#0b1120',
            color: '#f8fafc',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
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
              }, 'GPS Local is always your primary default view. Search below to add up to 5 custom preset locations to your watch rotation.')
            ]
          ),

          // Default GPS Local Card (NO emojis)
          Section(
            {
              title: 'DEFAULT VIEW (ACTIVE)',
              style: {
                backgroundColor: '#064e3b',
                border: '1px solid #059669',
                borderRadius: '12px',
                padding: '14px'
              }
            },
            [
              View(
                { style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
                [
                  View(
                    { style: { display: 'flex', flexDirection: 'column' } },
                    [
                      Text({
                        style: { fontSize: '15px', fontWeight: '700', color: '#ffffff' }
                      }, 'GPS Local (Default)'),
                      Text({
                        style: { fontSize: '12px', color: '#a7f3d0', marginTop: '2px' }
                      }, 'Continuously tracks viewing odds at watch position.')
                    ]
                  ),
                  Text({
                    style: {
                      fontSize: '11px',
                      fontWeight: '700',
                      backgroundColor: '#047857',
                      color: '#ffffff',
                      padding: '4px 8px',
                      borderRadius: '6px'
                    }
                  }, 'ALWAYS ON')
                ]
              )
            ]
          ),

          // Saved Custom Preset Locations (Max 5, NO emojis)
          Section(
            {
              title: `SAVED WATCH PRESETS (${savedLocations.length}/5 MAX)`,
              style: {
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '14px'
              }
            },
            [
              savedLocations.length === 0
                ? Text({
                    style: { fontSize: '13px', color: '#64748b', fontStyle: 'italic', padding: '6px 0' }
                  }, 'No custom presets added yet. Search below to add up to 5 locations.')
                : View(
                    { style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                    savedLocations.map((loc, idx) => {
                      if (!loc) return View({}, [])
                      const latVal = typeof loc.lat === 'number' ? loc.lat : parseFloat(loc.lat) || 0
                      const lonVal = typeof loc.lon === 'number' ? loc.lon : parseFloat(loc.lon) || 0
                      const latStr = latVal >= 0 ? `${latVal.toFixed(1)} N` : `${Math.abs(latVal).toFixed(1)} S`
                      const lonStr = lonVal >= 0 ? `${lonVal.toFixed(1)} E` : `${Math.abs(lonVal).toFixed(1)} W`

                      return View(
                        {
                          style: {
                            display: 'flex',
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 12px',
                            backgroundColor: '#132338',
                            border: '1px solid #0284c7',
                            borderRadius: '10px'
                          }
                        },
                        [
                          View(
                            { style: { display: 'flex', flexDirection: 'column', flex: 1, marginRight: '10px' } },
                            [
                              Text({
                                style: { fontSize: '14px', fontWeight: '600', color: '#38bdf8' }
                              }, `${idx + 1}. ${loc.name || 'Site'}${loc.country ? ', ' + loc.country : ''}`),
                              Text({
                                style: { fontSize: '11px', color: '#94a3b8', marginTop: '2px' }
                              }, `${latStr}, ${lonStr}`)
                            ]
                          ),
                          Button({
                            label: 'REMOVE',
                            style: {
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '6px 10px',
                              backgroundColor: '#e11d48',
                              color: '#ffffff',
                              borderRadius: '6px'
                            },
                            onClick: () => {
                              removeLocation(loc.id)
                            }
                          })
                        ]
                      )
                    })
                  )
            ]
          ),

          // Location Search System (Find any city/coordinates)
          Section(
            {
              title: 'SEARCH AND ADD LOCATIONS',
              style: {
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '12px',
                padding: '14px'
              }
            },
            [
              Text({
                style: { fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }
              }, 'Search any city, town, or observing site to fetch its exact coordinates:'),

              TextInput({
                label: 'Search Location',
                settingsKey: 'currentSearchInput',
                placeholder: 'e.g. Tromso, Fairbanks, Reykjavik, Kiruna...',
                onChange: (val) => {
                  executeSearch(val)
                }
              }),

              // Quick suggestion search shortcuts
              View(
                {
                  style: {
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '6px',
                    flexWrap: 'wrap',
                    marginTop: '10px',
                    marginBottom: '10px'
                  }
                },
                ['Tromso', 'Fairbanks', 'Reykjavik', 'Yellowknife', 'Abisko', 'Inverness'].map(city => {
                  return Button({
                    label: city,
                    style: {
                      fontSize: '11px',
                      padding: '5px 8px',
                      backgroundColor: '#1e293b',
                      color: '#94a3b8',
                      borderRadius: '6px'
                    },
                    onClick: () => {
                      executeSearch(city)
                    }
                  })
                })
              ),

              // Search Results List
              currentResults.length > 0
                ? View(
                    {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginTop: '8px',
                        borderTop: '1px solid #1e293b',
                        paddingTop: '10px'
                      }
                    },
                    [
                      Text({
                        style: { fontSize: '12px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }
                      }, 'SEARCH RESULTS -- TAP TO ADD:'),

                      ...currentResults.map(res => {
                        if (!res) return View({}, [])
                        const isAlreadyAdded = savedLocations.some(l => l && l.id === String(res.id))
                        const isFull = savedLocations.length >= 5
                        const latVal = typeof res.latitude === 'number' ? res.latitude : parseFloat(res.latitude) || 0
                        const lonVal = typeof res.longitude === 'number' ? res.longitude : parseFloat(res.longitude) || 0

                        return View(
                          {
                            style: {
                              display: 'flex',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 10px',
                              backgroundColor: '#0b1329',
                              border: '1px solid #1e293b',
                              borderRadius: '8px'
                            }
                          },
                          [
                            View(
                              { style: { display: 'flex', flexDirection: 'column', flex: 1, marginRight: '8px' } },
                              [
                                Text({
                                  style: { fontSize: '13px', fontWeight: '600', color: '#f8fafc' }
                                }, `${res.name || 'Location'}${res.admin1 ? ', ' + res.admin1 : ''}${res.country ? ' (' + res.country + ')' : ''}`),
                                Text({
                                  style: { fontSize: '11px', color: '#64748b' }
                                }, `Lat: ${latVal.toFixed(3)}, Lon: ${lonVal.toFixed(3)}`)
                              ]
                            ),
                            Button({
                              label: isAlreadyAdded ? 'ADDED' : (isFull ? 'LIST FULL' : '+ ADD'),
                              style: {
                                fontSize: '11px',
                                fontWeight: '700',
                                padding: '6px 10px',
                                backgroundColor: isAlreadyAdded ? '#334155' : (isFull ? '#475569' : '#059669'),
                                color: '#ffffff',
                                borderRadius: '6px'
                              },
                              onClick: () => {
                                if (isAlreadyAdded || isFull) return
                                const newLoc = {
                                  id: String(res.id || Date.now()),
                                  name: res.name || 'Observing Site',
                                  country: res.country || '',
                                  admin1: res.admin1 || '',
                                  lat: Number(latVal.toFixed(4)),
                                  lon: Number(lonVal.toFixed(4))
                                }
                                updateSavedLocations([...savedLocations, newLoc])
                              }
                            })
                          ]
                        )
                      })
                    ]
                  )
                : View({}, [])
            ]
          )
        ]
      )
    } catch (criticalErr) {
      console.log('[StealthAuroraSettings] Critical render error:', criticalErr)
      return View(
        {
          style: {
            padding: '24px 16px',
            backgroundColor: '#0b1120',
            color: '#ffffff',
            minHeight: '100%'
          }
        },
        [
          Text({
            style: { fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }
          }, 'Stealth Aurora Tracker Settings'),
          Text({
            style: { fontSize: '13px', color: '#94a3b8' }
          }, 'Settings initialized. Default view is GPS Local. Reopen settings to manage custom presets.')
        ]
      )
    }
  }
})
