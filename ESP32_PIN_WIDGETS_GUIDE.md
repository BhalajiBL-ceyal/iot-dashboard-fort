# 🔌 ESP32 Pin Mapping Widgets - Complete Guide

## ✅ Successfully Added!

Two powerful new widgets to help you work with ESP32 boards!

---

## 📊 **Widget Types**

### 1. **ESP32 Pin Mapping** (Live Diagnostic Tool)
Shows exact pin mappings for your connected ESP32 device with **real-time values**.

### 2. **ESP32 Pin Reference** (Quick Reference)
A compact reference guide showing safe pins, capabilities, and warnings.

---

## 🎯 **ESP32 Pin Mapping Widget** 

### Features:
- ✅ **Auto-detection** - Automatically finds which pins are active
- ✅ **Real-time values** - Shows current reading from each pin
- ✅ **Color-coded status** - Blue highlight for active pins
- ✅ **Pin capabilities** - Shows ADC channel, Touch, SPI, I2C
- ✅ **Safety warnings** - Highlights pins to avoid
- ✅ **Organized categories**:
  - 🔵 Active Pins (currently in use)
  - ⚠️ Input Only Pins
  - 📊 ADC/Analog Pins
  - ⚡ Digital/Communication Pins

### How to Use:
1. **Select your ESP32 device** from sidebar
2. **Drag "ESP32 Pin Mapping"** from Widget Library
3. **Drop on canvas**
4. Widget automatically shows all active pins!

### What It Shows:

**For Each Pin:**
- **Pin Name** (e.g., D32, VP, TX)
- **GPIO Number** (e.g., GPIO32)
- **ADC Channel** (if applicable, e.g., ADC1_CH4)
- **Pin Type** (Input Only, ADC/DAC/Touch, Digital, etc.)
- **Current Value** (real-time reading if active)
- **Special Notes** (warnings, boot behavior, etc.)

### Example Display:
```
🔵 Active Pins (3)
─────────────────────────────────────
D32    GPIO32  [ADC1_CH4]  ADC/DAC/Touch    25.67
D33    GPIO33  [ADC1_CH5]  ADC/DAC/Touch    18.42
D23    GPIO23  SPI/Digital                 1.00

⚠️ Input Only Pins
─────────────────────────────────────
VP     GPIO36  [ADC1_CH0]  Input Only  Sensor VP
VN     GPIO39  [ADC1_CH3]  Input Only  Sensor VN
...
```

### Pin Name Detection:
The widget automatically detects pins from telemetry key names:
- `temperature_D32` → Matches GPIO32
- `sensor_vp` → Matches VP (GPIO36)
- `gpio25_value` → Matches GPIO25

---

## 📖 **ESP32 Pin Reference Widget**

### Features:
- ✅ **Quick reference** - No device needed
- ✅ **Safe GPIO list** - Shows which pins are safe to use
- ✅ **ADC information** - ADC1 vs ADC2 channels
- ✅ **Avoid list** - Pins that cause problems
- ✅ **Touch pins** - Capacitive touch capable pins
- ✅ **Compact design** - Small widget, big info

### How to Use:
1. **Drag "ESP32 Pin Reference"** from Widget Library
2. **Drop on canvas**
3. That's it! No device selection needed

### What It Shows:

**Safe GPIO Pins:**
```
GPIO: 4, 5, 12-19, 21-23, 25-27, 32-33
```

**Input Only Pins:**
```
GPIO: 34, 35, 36 (VP), 39 (VN)
⚠️ No internal pull-up/pull-down resistors
```

**ADC Pins:**
```
ADC1: 32-39 (WiFi safe)
ADC2: 0, 2, 4, 12-15, 25-27
Note: ADC2 unavailable when WiFi is on
```

**Avoid These:**
```
• GPIO 0: Boot button (pulled low boots in download mode)
• GPIO 1, 3: Serial TX/RX (conflicts with serial monitor)
• GPIO 6-11: Flash memory (connected to SPI flash)
• GPIO 12: Boot fail if HIGH (pulled high at boot)
```

**Touch Pins:**
```
T0-T9: GPIO 4, 0, 2, 15, 13, 12, 14, 27, 33, 32
```

---

## 🎨 **Visual Guide**

### Pin Mapping Widget Colors:

| Color | Meaning |
|-------|---------|
| 🔵 Blue highlight | Pin currently active/in use |
| ⚠️ Yellow section | Input-only pins (use with caution) |
| 📊 Green section | ADC/Analog capable pins |
| ⚡ Purple section | Digital/Communication pins |
| 🚫 Red section (reference) | Pins to avoid |

### Pin Type Badges:

| Badge | Description |
|-------|-------------|
| `ADC1_CH4` | ADC1 Channel 4 (WiFi safe) |
| `ADC2_CH5` | ADC2 Channel 5 (WiFi conflicts) |
| `ADC/DAC/Touch` | Multi-function pin |
| `SPI/Digital` | SPI bus or digital I/O |
| `I2C/Digital` | I2C bus or digital I/O |
| `Input Only` | Can't output, no pull resistors |

---

## 💡 **Common Use Cases**

### 1. **Debugging Pin Assignments**
Use Pin Mapping widget to verify:
- Which pins are actually sending data
- If you're reading from the correct GPIO
- Current values to troubleshoot sensors

### 2. **Planning New Sensors**
Use Pin Reference widget to:
- Find available safe pins
- Check if pin supports ADC (for analog sensors)
- Avoid conflicting pins

### 3. **Multi-Sensor Projects**
- See all active pins at a glance
- Verify no pin conflicts
- Monitor all sensor values together

### 4. **Teaching/Documentation**
- Quick reference for team members
- No need to look up datasheets
- Visual pin status for presentations

---

## 🔍 **Pin Details Reference**

### Input Only Pins (VP, VN, 34-35):
- **No pull-up/pull-down** - Must use external resistors
- **ADC capable** - Great for analog sensors
- **High impedance** - Prone to noise without pull resistor
- **Use for**: Analog sensors (temperature, light, etc.)

### ADC1 Pins (32-39):
- **WiFi safe** - Works even when WiFi is active
- **12-bit resolution** - 0-4095 values
- **Voltage range** - 0-3.3V (with attenuation)
- **Use for**: Battery monitoring, analog sensors

### ADC2 Pins (0, 2, 4, 12-15, 25-27):
- **WiFi conflict** - Can't use when WiFi is on
- **Limited use** - Only for WiFi-off projects
- **Use for**: Standalone (non-WiFi) analog reading

### Touch Pins:
- **Capacitive sensing** - No physical button needed
- **Touch threshold** - Adjustable sensitivity
- **Use for**: Touch buttons, proximity sensing

### SPI Pins (18, 19, 23, 5):
- **High-speed bus** - For displays, SD cards
- **VSPI** - Virtual SPI (programmable)
- **Use for**: TFT displays, SD cards, external ADCs

### I2C Pins (21, 22):
- **Default** - GPIO21=SDA, GPIO22=SCL
- **Multi-device** - Connect multiple I2C sensors
- **Use for**: OLED, BME280, RTC modules

---

## ⚙️ **Widget Settings**

Both widgets support:
- ✅ **Custom titles**
- ✅ **Dark mode**
- ✅ **Resizing** (Pin Mapping: 4x6 to 12x12)
- ✅ **Resizing** (Pin Reference: 3x4 minimum)

---

## 🚀 **Pro Tips**

1. **Keep Pin Reference visible** - Always have it on screen while developing
2. **Use Pin Mapping for debugging** - Quickly see which pins have values
3. **Name telemetry keys with pin numbers** - e.g., "temp_D32" auto-highlights GPIO32
4. **Place side-by-side** - Reference on left, Mapping on right
5. **Copy for multiple devices** - Duplicate widgets for each ESP32

---

## 📐 **Recommended Sizes**

**Pin Mapping:**
- Minimum: 4 wide × 6 tall
- Recommended: 6 wide × 8 tall
- Maximum: Full screen for detailed debugging

**Pin Reference:**
- Minimum: 3 wide × 4 tall
- Recommended: 4 wide × 6 tall
- Compact: Perfect for corner placement

---

## 🎯 **Example Layouts**

### Development Dashboard:
```
┌─────────────┬─────────────────────┐
│             │                     │
│  Pin Ref    │   Temperature       │
│  (4×6)      │   Chart (8×6)       │
│             │                     │
├─────────────┴─────────────────────┤
│                                   │
│   Pin Mapping (12×8)              │
│   (Shows all active pins)         │
│                                   │
└───────────────────────────────────┘
```

### Production Monitoring:
```
┌─────────────┬─────────────┬──────┐
│  Multi      │  Multi      │ Pin  │
│  Sensor 1   │  Sensor 2   │ Ref  │
│             │             │(3×4) │
├─────────────┴─────────────┴──────┤
│  Historical Charts...            │
└──────────────────────────────────┘
```

---

## 📊 **Data Format**

The Pin Mapping widget auto-detects these patterns:

| Telemetry Key Format | Detected As |
|---------------------|-------------|
| `temp_D32` | GPIO32 |
| `sensor_gpio25` | GPIO25 |
| `vp_reading` | GPIO36 (VP) |
| `analog_34` | GPIO34 |
| `D33_value` | GPIO33 |

**Case insensitive** - Works with any capitalization

---

## ✨ **Integration Benefits**

- **No manual mapping needed** - Widget auto-detects
- **Visual debugging** - See pin status at a glance
- **Reference always handy** - No datasheet lookup
- **Team collaboration** - Everyone sees same info
- **Documentation** - Screenshots show exact setup

---

## 🎉 **You Now Have:**

✅ **22 widget types** total
✅ **6 advanced charts** with zoom/pan
✅ **2 ESP32 pin tools** for hardware debugging
✅ **Full Phase 1 features** (Edit mode, dark mode, undo/redo)
✅ **Professional IoT dashboard** platform

---

## 🚀 **Ready to Use!**

Both widgets are in your **Widget Library** sidebar:
- Look for **Cpu icon** - ESP32 Pin Mapping
- Look for **CircuitBoard icon** - ESP32 Pin Reference

**Your ESP32 development just got 10x easier!** 🎯
