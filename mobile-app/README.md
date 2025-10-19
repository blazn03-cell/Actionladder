# ActionLadder Mobile App

The official ActionLadder mobile application built with React Native and Expo.

> **📱 For complete build instructions, see [BUILD.md](./BUILD.md)**

## Quick Start

### Development Setup

1. **Install dependencies:**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Start development server:**
   ```bash
   npm start
   ```

3. **Test on device:**
   - Install Expo Go on your phone
   - Scan QR code from terminal/browser
   - App loads ActionLadder web app in native WebView

### Building Apps

**For detailed build instructions, troubleshooting, and store submission guides, see [BUILD.md](./BUILD.md)**

Quick build commands:

```bash
# Android APK (for testing)
npm run preview:android

# Android AAB (for Play Store)
npm run build:android

# iOS IPA (for App Store)
npm run build:ios
```

## Features

- **Native WebView Integration**: Full ActionLadder web app in mobile wrapper
- **Camera/Microphone Access**: OCR scanning, live streaming, match recording
- **Push Notifications**: Tournament updates, match results, live stream alerts
- **Deep Linking**: actionladder:// URLs for tournament/match sharing
- **Offline Fallback**: Cached content when internet unavailable
- **Mobile Optimizations**: Touch gestures, keyboard handling, performance

## Configuration

The app is pre-configured to connect to the ActionLadder production backend at:
```
https://billiard-ladder-blazn03.replit.app
```

**To change the backend URL:**
- Edit `App.js`: Update `APP_URL` constant
- Edit `app.json`: Update `extra.actionLadder.apiUrl`

**To customize branding:**
- Replace `assets/icon.png` - 1024x1024 app icon
- Replace `assets/splash.png` - Splash screen image
- Replace `assets/favicon.png` - Web favicon

## Store Submission

**For complete store submission instructions, see [BUILD.md](./BUILD.md#store-submission)**

Quick links:
- [Google Play Store Guide](./BUILD.md#google-play-store-submission)
- [Apple App Store Guide](./BUILD.md#apple-app-store-submission)
- [Troubleshooting](./BUILD.md#troubleshooting)

## ActionLadder Integration

The mobile app provides native access to all ActionLadder features:
- Player ladder rankings and statistics
- Live tournament streaming and betting
- Kelly Pool and Money on the Table games
- Pool hall discovery and check-ins
- QR code scanning for quick game entry
- Real-time match updates and notifications

## Support

For technical issues or feature requests, contact the ActionLadder development team.