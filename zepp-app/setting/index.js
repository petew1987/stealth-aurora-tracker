/**
 * Stealth Aurora Tracker - Settings App (Runs on Smartphone Zepp App for Android & iOS)
 * Publisher: Stealth Apps
 *
 * FEATURES:
 * - Up to 5 user-chosen preset locations (no hardcoded preloaded locations).
 * - Text search system using Open-Meteo Geocoding to find any global city/town coordinates.
 * - Permanent default: GPS Local view.
 * - Add/remove saved presets to watch rotation.
 */

AppSettingsPage({
  state: {
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    searchError: ''
  },

  build(props) {
    let savedLocations = []
    try {
      const stored = props.settingsStorage.getItem('customLocations')
      if (stored) {
        const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored
        if (Array.isArray(parsed)) {
          savedLocations = parsed.slice(0, 5)
        }
      }
    } catch (e) {
      console.log('[StealthAuroraSettings] Error reading customLocations:', e)
    }

    let cloudThreshold = '60'
    try {
      const storedClouds = props.settingsStorage.getItem('cloudThreshold')
      if (storedClouds) {
        cloudThreshold = typeof storedClouds === 'string' ? storedClouds : storedClouds.value || storedClouds
      }
    } catch (e) {}

    const updateSavedLocations = (newList) => {
      const capped = newList.slice(0, 5)
      props.settingsStorage.setItem('customLocations', JSON.stringify(capped))
    }

    const removeLocation = (locId) => {
      const updated = savedLocations.filter(loc => loc.id !== locId)
      updateSavedLocations(updated)
    }

    const addLocation = (item) => {
      if (savedLocations.length >= 5) {
        return
      }
      if (savedLocations.some(loc => loc.id === item.id)) {
        return
      }
      const newLoc = {
        id: String(item.id || Date.now()),
        name: item.name,
        country: item.country || '',
        admin1: item.admin1 || '',
        lat: Number(item.latitude.toFixed(4)),
        lon: Number(item.longitude.toFixed(4))
      }
      updateSavedLocations([...savedLocations, newLoc])
    }

    const executeSearch = (query) => {
      if (!query || query.trim().length < 2) return

      const trimmed = query.trim()
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=en&format=json`

      fetch(url)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.results)) {
            props.settingsStorage.setItem('tempSearchResults', JSON.stringify(data.results))
          } else {
            props.settingsStorage.setItem('tempSearchResults', JSON.stringify([]))
          }
        })
        .catch(err => {
          console.log('[StealthAuroraSettings] Geocoding error:', err)
        })
    }

    let currentResults = []
    try {
      const tempRes = props.settingsStorage.getItem('tempSearchResults')
      if (tempRes) {
        currentResults = typeof tempRes === 'string' ? JSON.parse(tempRes) : tempRes
      }
    } catch (e) {}

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
            }, 'GPS Local is always your primary default view. Search below to add up to 5 custom preset locations to your watch rotation.')
          ]
        ),

        // Default GPS Local Card
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
                    }, '📍 GPS Local (Default)'),
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

        // Saved Custom Preset Locations (Max 5)
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
                            }, `${idx + 1}. ${loc.name}${loc.country ? ', ' + loc.country : ''}`),
                            Text({
                              style: { fontSize: '11px', color: '#94a3b8', marginTop: '2px' }
                            }, `${loc.lat >= 0 ? loc.lat + '°N' : Math.abs(loc.lat) + '°S'}, ${loc.lon >= 0 ? loc.lon + '°E' : Math.abs(loc.lon) + '°W'}`)
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
            title: 'SEARCH & ADD LOCATIONS',
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
              ['Tromsø', 'Fairbanks', 'Reykjavik', 'Yellowknife', 'Abisko', 'Inverness'].map(city => {
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
                    }, 'SEARCH RESULTS — TAP TO ADD:'),

                    ...currentResults.map(res => {
                      const isAlreadyAdded = savedLocations.some(l => l.id === String(res.id))
                      const isFull = savedLocations.length >= 5

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
                              }, `${res.name}${res.admin1 ? ', ' + res.admin1 : ''}${res.country ? ' (' + res.country + ')' : ''}`),
                              Text({
                                style: { fontSize: '11px', color: '#64748b' }
                              }, `Lat: ${res.latitude.toFixed(3)}, Lon: ${res.longitude.toFixed(3)}`)
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
                              if (!isAlreadyAdded && !isFull) {
                                addLocation(res)
                              }
                            }
                          })
                        ]
                      )
                    })
                  ]
                )
              : null
          ]
        ),

        // Cloud Threshold Section
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
              style: { fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }
            }, 'Adjust cloud cover visibility threshold:'),

            Select({
              label: 'Max Cloud Tolerance',
              settingsKey: 'cloudThreshold',
              options: [
                { name: 'Strict (< 30% clouds)', value: '30' },
                { name: 'Standard (< 60% clouds)', value: '60' },
                { name: 'Permissive (< 80% clouds)', value: '80' }
              ]
            })
          ]
        ),

        // Footer Instructions
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
            }, 'Watch Usage: On your Amazfit watch, tap the location pill at the top of the screen to cycle between GPS Local and your saved presets.')
          ]
        )
      ]
    )
  }
})
