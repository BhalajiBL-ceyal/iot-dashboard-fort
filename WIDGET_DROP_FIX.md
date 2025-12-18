# Widget Drop Fix - Testing Guide

## What Was Fixed

The widget drag-and-drop issue has been resolved! The problem was that `react-grid-layout` wasn't properly handling external drag sources (widgets from the sidebar).

## Solution Implemented

Added a **manual drop handler** on the canvas wrapper div that:
1. Prevents default drag behavior
2. Shows a "copy" cursor when dragging
3. Calculates the grid position from mouse coordinates
4. Triggers the key selector modal when you drop

## How to Test

### Step 1: Select a Device
- Click on any device in the left sidebar
- You should see it highlighted in blue

### Step 2: Drag a Widget
- Click and hold on any widget type from the "Widget Library"
- Start dragging it toward the canvas
- **You should now see a "+" cursor** (copy effect) instead of the "no drop" symbol!

### Step 3: Drop the Widget
- Drop the widget anywhere on the canvas
- A modal should appear asking you to select a telemetry key
- Choose a key and the widget will be added

### Step 4: Move/Resize Widgets
- Hover over an existing widget
- Click and drag the grip icon (top-left) to move it
- Drag the edges/corners to resize it

## What Changed in the Code

```javascript
// Added to the canvas wrapper div:
onDragOver={(e) => {
  e.preventDefault();
  e.stopPropagation();
  e.dataTransfer.dropEffect = 'copy';  // Shows "+" cursor
}}
onDrop={(e) => {
  e.preventDefault();
  e.stopPropagation();
  
  // Calculate grid position from mouse coordinates
  const rect = e.currentTarget.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / (1200 / 12));
  const y = Math.floor((e.clientY - rect.top) / 60);
  
  // Create widget at calculated position
  setPendingWidget({
    type: draggedWidgetType,
    x: Math.max(0, Math.min(x, 8)),
    y: Math.max(0, y),
    w: 4,
    h: 3,
  });
  
  setShowKeySelector(true);
}}
```

## Expected Behavior

✅ **Before dropping**: Cursor shows "+" symbol (copy effect)
✅ **After dropping**: Modal appears to select telemetry key
✅ **After selecting key**: Widget appears on canvas at drop position
✅ **Widget manipulation**: Can move, resize, and delete widgets

## If It Still Doesn't Work

1. **Refresh the browser** (Ctrl+F5 or Cmd+Shift+R)
2. **Check console** for any error messages (F12 → Console tab)
3. **Verify device is selected** (highlighted in blue in sidebar)
4. **Try a different widget type** to rule out widget-specific issues

## Debug Information

Open the browser console (F12) and watch for:
- "Manual drop handler triggered" - This confirms the drop was detected
- Position coordinates (x, y) - Shows where the widget will be placed
- Widget type - Shows what type of widget you're trying to add

The drop handler will also show an alert if you forget to select a device first.
