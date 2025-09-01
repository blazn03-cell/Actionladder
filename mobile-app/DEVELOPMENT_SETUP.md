# ActionLadder Mobile App - Development Setup

## 🚀 Quick Start Guide

### Prerequisites
1. **Install Expo CLI globally:**
   ```bash
   npm install -g expo-cli
   ```

2. **Install Expo Go app on your phone:**
   - **iOS**: Download from App Store
   - **Android**: Download from Google Play Store

### Development Setup

1. **Navigate to mobile app directory:**
   ```bash
   cd mobile-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Connect your phone:**
   - Open Expo Go app on your phone
   - Scan the QR code shown in terminal/browser
   - ActionLadder will load in mobile WebView wrapper

## ✅ Current Configuration

✓ **APP_URL configured**: `https://55c116d9-0e49-4c49-84e1-5d6a7add994d-00-2zj3cxyq9sjki.worf.replit.dev`  
✓ **Deep linking**: `actionladder://` URL scheme ready  
✓ **Permissions**: Camera, microphone, location configured  
✓ **Theme**: ActionLadder dark theme (#0B0B0F)  
✓ **Optimizations**: Pool game touch interactions enabled

## 📱 Testing Features

### Core Features to Test:
1. **Web App Loading**: ActionLadder loads properly in WebView
2. **Touch Interactions**: Pool table and tournament brackets respond correctly
3. **Camera Access**: Test OCR scanning functionality
4. **Live Streams**: Video playback and streaming controls
5. **Deep Links**: Test `actionladder://tournament/123` URLs
6. **Navigation**: Android back button handling

### Mobile-Specific Features:
- **Haptic Feedback**: Betting confirmations and important actions
- **Picture-in-Picture**: Live stream viewing while using other features
- **Background Audio**: Stream audio continues when app backgrounds
- **Auto-rotation**: Landscape mode for video viewing

## 🔧 Development Commands

```bash
# Start development server
npm start

# Start with specific platform
npm run android  # Android device/emulator
npm run ios      # iOS device/simulator

# Build preview APK for testing
npm run preview:android

# Build production apps
npm run build:android  # Google Play Store
npm run build:ios      # Apple App Store
```

## 🐛 Troubleshooting

### Common Issues:

1. **"Network Error" in WebView**
   - Ensure ActionLadder web app is running on port 5000
   - Check if Replit domain is accessible: `curl https://55c116d9-0e49-4c49-84e1-5d6a7add994d-00-2zj3cxyq9sjki.worf.replit.dev`

2. **QR Code Not Scanning**
   - Make sure Expo Go app is updated
   - Try using tunnel mode: `expo start --tunnel`

3. **Camera/Microphone Not Working**
   - Check permissions in phone settings
   - Restart Expo Go app after granting permissions

4. **Touch Issues on Pool Table**
   - Check mobile optimizations are loading in WebView
   - Test on physical device (touch works better than simulators)

### Debug Mode:
```bash
# Enable remote debugging
npm start --dev-client
```

## 📊 Performance Monitoring

### Key Metrics to Watch:
- **WebView Load Time**: Should be under 3 seconds
- **Touch Response**: Pool table interactions should be instant
- **Memory Usage**: Monitor for memory leaks during long sessions
- **Battery Usage**: Streaming and camera features

### Optimization Tips:
- Test on slower devices (older phones)
- Monitor network usage during live streaming
- Check app behavior with poor network conditions
- Test offline mode functionality

## 🚀 Ready for Production Testing

Once development testing is complete, you can build production versions:

1. **Google Play Store**: `npm run build:android`
2. **Apple App Store**: `npm run build:ios`

The app is configured with proper bundle identifiers and metadata for store deployment.

---

**Next Step**: Run `npm start` in the mobile-app directory and test with Expo Go!