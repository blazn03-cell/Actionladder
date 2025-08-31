# ActionLadder Mobile App

The official ActionLadder mobile application built with React Native and Expo.

## Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- EAS CLI: `npm install -g eas-cli`

### Development

1. **Install dependencies:**
   ```bash
   cd mobile-app
   npm install
   ```

2. **Update the app URL:**
   Edit `App.js` and change `APP_URL` to your ActionLadder deployment URL.

3. **Start development server:**
   ```bash
   npm start
   ```

4. **Test on device:**
   - Install Expo Go on your phone
   - Scan QR code from terminal/browser
   - App loads ActionLadder web app in native WebView

### Building for Production

1. **Configure EAS:**
   ```bash
   eas login
   eas build:configure
   ```

2. **Build APK for testing:**
   ```bash
   npm run preview:android
   ```

3. **Build for app stores:**
   ```bash
   npm run build:android  # Google Play Store
   npm run build:ios      # Apple App Store
   ```

## Features

- **Native WebView Integration**: Full ActionLadder web app in mobile wrapper
- **Camera/Microphone Access**: OCR scanning, live streaming, match recording
- **Push Notifications**: Tournament updates, match results, live stream alerts
- **Deep Linking**: actionladder:// URLs for tournament/match sharing
- **Offline Fallback**: Cached content when internet unavailable
- **Mobile Optimizations**: Touch gestures, keyboard handling, performance

## Configuration

### App URLs
Update these URLs in the configuration files:
- `App.js`: Change `APP_URL` to your deployment
- `app.json`: Update `extra.actionLadder.apiUrl`

### Assets
Replace placeholder assets:
- `assets/icon.png` - 1024x1024 app icon
- `assets/splash.png` - Splash screen image
- `assets/favicon.png` - Web favicon

### Store Metadata
Update store information in `app.json`:
- Bundle identifiers
- App Store Connect details
- Permissions descriptions

## Deployment

### Google Play Store
1. Build app bundle: `npm run build:android`
2. Submit: `npm run submit:android`

### Apple App Store
1. Build IPA: `npm run build:ios`
2. Submit: `npm run submit:ios`

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