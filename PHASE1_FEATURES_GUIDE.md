# Phase 1 Features - Quick Reference Guide

## 🎉 7 NEW FEATURES IMPLEMENTED!

Your IoT Dashboard now has professional-grade features for building and managing dashboards.

---

## 1. 🔒 EDIT / VIEW MODE TOGGLE

**Location**: Top toolbar (Lock/Unlock button)

**What it does**:
- **Edit Mode** (Unlocked 🔓): Full editing capabilities
  - Drag widgets from sidebar
  - Move and resize widgets
  - Delete widgets
  - Access widget settings
  
- **View Mode** (Locked 🔒): Dashboard is read-only
  - Prevents accidental changes
  - Cleaner interface (no edit controls)
  - Perfect for monitoring displays

**How to use**:
1. Click the Lock/Unlock button in the top toolbar
2. In View Mode: All edit controls are hidden
3. In Edit Mode: Drag handles and buttons appear on hover

**Pro Tip**: Use View Mode for production dashboards and presentations

---

## 2. 🌙 DARK MODE

**Location**: Top toolbar (Moon/Sun icon)

**What it does**:
- Toggles between light and dark themes
- Automatically adjusts all widgets
- Preference is saved automatically
- Better for low-light environments

**How to use**:
1. Click the Moon 🌙 icon for dark mode
2. Click the Sun ☀️ icon for light mode
3. Your preference is saved in localStorage

**Supported Elements**:
- ✅ Sidebar
- ✅ Header
- ✅ All widgets
- ✅ Modals
- ✅ Canvas background

---

## 3. ↩️ UNDO / REDO

**Location**: Top toolbar (Arrow buttons)

**What it does**:
- Tracks all dashboard changes
- Undo last action (Ctrl+Z alternate)
- Redo undone action (Ctrl+Y alternate)
- Maintains history of up to 50 actions

**Tracked Actions**:
- Adding widgets
- Removing widgets
- Moving widgets
- Resizing widgets
- Duplicating widgets
- Changing widget settings

**How to use**:
1. Click ← Undo to revert last change
2. Click → Redo to re-apply undone change
3. Buttons are disabled when no actions available

---

## 4. 📋 WIDGET COPY / DUPLICATE

**Location**: Widget hover menu (Copy button)

**What it does**:
- Creates an exact copy of any widget
- Copies all settings (title, thresholds, units)
- Places duplicate slightly offset
- Saves time when creating similar widgets

**How to use**:
1. Hover over any widget
2. Click the green **Copy** button (appears top-right)
3. Duplicate appears at offset position
4. Move/resize as needed

**Pro Tip**: Great for creating multiple temperature sensors, status indicators, etc.

---

## 5. ⚙️ WIDGET SETTINGS PANEL

**Location**: Widget hover menu (Settings button)

**What it does**:
- Configure widget properties without recreating
- Customize display options
- Set thresholds and limits
- Add custom units

**Configurable Properties**:
- **Custom Title**: Override default label
- **Threshold**: Alert level (numeric/alarm widgets)
- **Min/Max Values**: Range for gauges
- **Unit**: Display unit (°C, %, kW, etc.)

**How to use**:
1. Hover over any widget
2. Click the blue **Settings** button (gear icon)
3. Modify properties in the modal
4. Click **Save** to apply changes

**Available for**:
- Numeric Card → Title, Threshold, Unit
- Gauge → Title, Min, Max, Unit
- Progress Bar → Title, Unit
- Chart → Title
- All widget types → Custom title

---

## 6. 💾 SAVE / LOAD DASHBOARD

**Location**: Top toolbar (Save 💾 and Load 📤 buttons)

**What it does**:
- Persist your dashboard layout
- Saves widget positions, sizes, and settings
- Stores in browser localStorage
- Survives page refreshes

**Saved Data**:
- All widget configurations
- Widget positions and sizes
- Dark mode preference
- Dashboard metadata

**How to use**:

**To Save**:
1. Build your dashboard
2. Click the **Save** button (💾 icon)
3. See "Dashboard saved successfully!" message

**To Load**:
1. Click the **Load** button (📤 icon)
2. Your last saved layout is restored
3. All widgets return to saved positions

**Storage**: Uses browser localStorage (up to 10MB)

**Pro Tip**: Save frequently to prevent work loss!

---

## 7. 📝 WIDGET TITLE CUSTOMIZATION

**Location**: Widget Settings Panel

**What it does**:
- Override default widget labels
- Add descriptive titles
- Better dashboard organization
- Support for emojis and special characters

**Examples**:
- Default: "temperature"
- Custom: "🌡️ Room Temperature"
- Default: "pressure"
- Custom: "⚙️ Hydraulic Pressure PSI"

**How to use**:
1. Click widget **Settings** button
2. Enter custom title in "Custom Title" field
3. Leave blank to use default
4. Click **Save**

---

## 🎯 COMBINING FEATURES

### Example Workflow: Building a Production Dashboard

1. **Start in Edit Mode** 🔓
2. **Add widgets** from sidebar
3. **Configure each widget**:
   - Click Settings button
   - Set custom titles
   - Configure thresholds
   - Add units
4. **Duplicate similar widgets** using Copy button
5. **Arrange layout** (drag/resize)
6. **Save dashboard** 💾
7. **Switch to Dark Mode** 🌙 (if preferred)
8. **Switch to View Mode** 🔒 for presentation
9. **Save again** to persist dark mode setting

### Example: Creating 10 Temperature Sensors

1. Create first sensor widget
2. Configure settings (title, unit=°C, threshold=80)
3. Click Copy to duplicate
4. Click Settings on duplicate
5. Change title to next sensor location
6. Repeat steps 3-5 for remaining sensors
7. **Result**: 10 configured widgets in ~2 minutes!

---

## ⌨️ KEYBOARD SHORTCUTS (Planned)

The following shortcuts are **planned for Phase 2**:

- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo
- `Ctrl+S`: Save dashboard
- `Ctrl+D`: Duplicate selected widget
- `Delete`: Remove selected widget
- `E`: Toggle Edit/View mode
- `D`: Toggle Dark mode

---

## 🐛 KNOWN LIMITATIONS

### Phase 1 Limitations:

1. **Single Dashboard**: Only one dashboard per browser
   - *Fix in Phase 2*: Multi-dashboard support

2. **Browser-Only Storage**: Data stored in localStorage
   - *Fix in Phase 3*: Backend database + cloud sync

3. **No User Accounts**: Dashboard is per-browser
   - *Fix in Phase 5*: User authentication + RBAC

4. **Limited History**: Only 50 undo steps
   - *Fix in Phase 5*: Unlimited versioned history

5. **No Export**: Can't export dashboard to file
   - *Fix in Phase 3*: JSON/CSV export

---

## 💡 TIPS & TRICKS

### Performance Tips:
- Keep widgets count under 50 for smooth performance
- Use View Mode for better rendering performance
- Clear browser cache if dashboard becomes slow

### Design Tips:
- Use consistent widget sizes (4×3 or 4×4)
- Group related widgets together
- Use dark mode to reduce eye strain
- Add descriptive custom titles for clarity

### Workflow Tips:
- Save frequently (before major changes)
- Use undo/redo to experiment safely
- Duplicate widgets to maintain consistency
- Test in View Mode before presenting

---

## 🆘 TROUBLESHOOTING

### Dashboard won't save:
- Check browser localStorage is enabled
- Try clearing old data: `localStorage.clear()` in console
- Reduce number of widgets if hitting storage limit

### Widgets disappear after page refresh:
- You forgot to save! Click Save button
- Check console for localStorage errors
- Verify you're in the same browser

### Undo/Redo not working:
- History only tracks changes made after page load
- Refresh resets history
- Maximum 50 steps tracked

### Dark mode looks broken:
- Hard refresh page (Ctrl+F5)
- Check for browser compatibility
- Try toggling mode off and on

---

## 🚀 WHAT'S NEXT?

**Phase 2 Features (Coming in 1-2 weeks)**:
- Grid snap & alignment guides
- Widget grouping
- Multi-dashboard support
- Widget lock/pin
- Dashboard templates
- More keyboard shortcuts

**Phase 3 Features (Coming in 2-3 weeks)**:
- More chart types (Bar, Area, Heatmap)
- Historical data playback
- Time range selector
- Advanced analytics

See `FEATURES_ROADMAP.md` for complete roadmap!

---

## 📞 FEEDBACK

Found a bug or have a feature request?
- Check `FEATURES_ROADMAP.md` for planned features
- Priority is based on user impact and complexity
- Critical bugs fixed within 24-48 hours

---

**Congratulations! Your IoT Dashboard now has 7 powerful new features! 🎉**
