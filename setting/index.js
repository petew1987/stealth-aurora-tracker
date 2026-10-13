/**
 * ZeppHello - Settings App (Runs on Smartphone Zepp App for Android & iOS)
 */

const COLOR_OPTIONS = [
  { name: 'Purple (#a855f7)', value: '#a855f7' },
  { name: 'Emerald Green (#10b981)', value: '#10b981' },
  { name: 'Cyan Blue (#06b6d4)', value: '#06b6d4' },
  { name: 'Amber Gold (#f59e0b)', value: '#f59e0b' },
  { name: 'Hot Pink (#f43f5e)', value: '#f43f5e' },
  { name: 'Sky Blue (#38bdf8)', value: '#38bdf8' }
]

AppSettingsPage({
  state: {
    selectedColor: '#a855f7'
  },

  build(props) {
    let currentColor = '#a855f7'
    try {
      const stored = props.settingsStorage.getItem('textColor')
      if (stored) {
        currentColor = typeof stored === 'string' ? stored : stored.hex || stored
      }
    } catch (e) {
      console.log('[ZeppHelloSettings] Error reading settingsStorage:', e)
    }

    return View(
      {
        style: {
          padding: '16px 12px',
          backgroundColor: '#ffffff',
          color: '#111827',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
      },
      [
        // Header
        View(
          { style: { paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' } },
          [
            Text({
              style: {
                fontSize: '18px',
                fontWeight: '700',
                color: '#111827',
                marginBottom: '4px',
                lineHeight: '24px'
              }
            }, 'ZeppHello Customizer'),
            Text({
              style: { fontSize: '13px', color: '#4b5563', lineHeight: '18px' }
            }, 'Configure default text color for Amazfit smartwatch app.')
          ]
        ),

        // Color Selection Section
        Section(
          {
            title: 'TEXT COLOR THEME',
            style: {
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '14px'
            }
          },
          [
            Text({
              style: { fontSize: '13px', color: '#374151', marginBottom: '10px', lineHeight: '20px' }
            }, 'Select the default highlight color for the Hello message on your watch:'),

            Select({
              label: 'Hello Text Color',
              settingsKey: 'textColor',
              options: COLOR_OPTIONS
            })
          ]
        ),

        // Quick Preset Swatches Section
        Section(
          {
            title: 'QUICK SWATCHES',
            style: {
              backgroundColor: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '14px'
            }
          },
          [
            Text({
              style: { fontSize: '13px', color: '#374151', marginBottom: '10px', lineHeight: '20px' }
            }, 'Tap any swatch to apply instantly:'),

            View(
              {
                style: {
                  display: 'flex',
                  flexDirection: 'row',
                  gap: '8px',
                  flexWrap: 'wrap'
                }
              },
              COLOR_OPTIONS.map(opt => {
                const isActive = currentColor.toLowerCase() === opt.value.toLowerCase()
                return Button({
                  label: opt.name.split(' ')[0],
                  style: {
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '8px 12px',
                    backgroundColor: opt.value,
                    color: '#ffffff',
                    borderRadius: '8px',
                    border: isActive ? '2px solid #111827' : 'none'
                  },
                  onClick: () => {
                    props.settingsStorage.setItem('textColor', opt.value)
                  }
                })
              })
            )
          ]
        ),

        // Template Documentation Footer
        View(
          {
            style: {
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '14px',
              marginTop: '4px'
            }
          },
          [
            Text({
              style: { fontSize: '13px', fontWeight: '700', color: '#1f2937', marginBottom: '4px', lineHeight: '20px' }
            }, 'Developer Template Notes'),
            Text({
              style: { fontSize: '12px', color: '#4b5563', lineHeight: '18px' }
            }, 'To build your own app, modify page/index.js for watch UI, app-side/index.js for APIs, and setting/index.js for user options.')
          ]
        )
      ]
    )
  }
})
