# ActionLadder Mobile App - Build Documentation

This guide provides step-by-step instructions for building and distributing the ActionLadder mobile app for Android and iOS platforms.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Building for Android](#building-for-android)
- [Building for iOS](#building-for-ios)
- [Downloading Builds](#downloading-builds)
- [Testing on Devices](#testing-on-devices)
- [Troubleshooting](#troubleshooting)
- [Store Submission](#store-submission)

---

## Prerequisites

Before building the mobile app, ensure you have:

### Required Accounts
- **Expo Account**: Sign up at [expo.dev](https://expo.dev)
- **Apple Developer Account**: Required for iOS builds ($99/year) - [developer.apple.com](https://developer.apple.com)
- **Google Play Console Account**: Required for Play Store ($25 one-time) - [play.google.com/console](https://play.google.com/console)

### Required Software
- **Node.js**: Version 18 or higher - [nodejs.org](https://nodejs.org)
- **EAS CLI**: Install globally with `npm install -g eas-cli`
- **Git**: For version control

### Optional Tools
- **Android Studio**: For Android emulator testing
- **Xcode**: For iOS simulator testing (Mac only)

---

## Initial Setup

### 1. Install Dependencies

```bash
cd mobile-app
npm install
```

### 2. Login to Expo

```bash
eas login
```

Enter your Expo account credentials when prompted.

### 3. Configure Your Project

If this is your first build, initialize EAS:

```bash
eas build:configure
```

This will create or update the `eas.json` configuration file.

### 4. Update API URL (Optional)

If your ActionLadder backend URL has changed, update it in two places:

**App.js:**
```javascript
const APP_URL = "https://your-backend-url.com";
```

**app.json:**
```json
"extra": {
  "actionLadder": {
    "apiUrl": "https://your-backend-url.com"
  }
}
```

---

## Building for Android

### Build APK (For Testing)

APK files can be installed directly on Android devices without going through Google Play Store.

```bash
cd mobile-app
eas build --platform android --profile preview
```

**Build Process:**
1. EAS CLI will upload your code to Expo's build servers
2. Build takes approximately 10-20 minutes
3. You'll receive a URL to download the APK
4. Or scan the QR code to download directly to your device

**When to use APK:**
- Internal testing with team members
- Beta testing with users
- Quick iterations during development

### Build AAB (For Play Store)

AAB (Android App Bundle) is required for Google Play Store submission.

```bash
cd mobile-app
eas build --platform android --profile production
```

**Build Process:**
1. Build takes approximately 10-20 minutes
2. Downloads as `.aab` file
3. Upload to Google Play Console for distribution

**When to use AAB:**
- Production releases to Google Play Store
- Optimized app size for end users
- Required by Google Play since August 2021

### Android Build Configuration

The build profiles are defined in `eas.json`:

- **preview**: Builds APK for testing
- **production**: Builds AAB for Play Store

---

## Building for iOS

### Build IPA (For App Store & TestFlight)

```bash
cd mobile-app
eas build --platform ios --profile production
```

**Important:** iOS builds require:
1. Apple Developer account ($99/year)
2. EAS will guide you through certificate creation
3. Build takes approximately 15-30 minutes

**First-time iOS Setup:**

EAS will prompt you to:
1. Generate iOS credentials (certificates & provisioning profiles)
2. Choose to let EAS manage credentials automatically (recommended)
3. Or provide your own credentials

### iOS Build for Simulator (Testing)

For testing on iOS Simulator (Mac only):

```bash
cd mobile-app
eas build --platform ios --profile preview
```

This builds a simulator-compatible version for quick testing.

### iOS Build Configuration

The build profiles are defined in `eas.json`:

- **preview**: Builds for iOS Simulator
- **production**: Builds IPA for App Store/TestFlight

---

## Downloading Builds

### Method 1: Expo Dashboard (Recommended)

1. Visit [expo.dev](https://expo.dev)
2. Log in to your account
3. Navigate to your project
4. Click on "Builds" in the left sidebar
5. Find your build in the list
6. Click "Download" to get the file
7. Or scan the QR code to install directly on device

### Method 2: Terminal Link

After build completes, EAS CLI provides:
- Direct download URL
- QR code in terminal (scan with device camera)

Example output:
```
✔ Build successful!
Download: https://expo.dev/artifacts/eas/...
```

### Method 3: Email Notification

Expo sends email when build completes with:
- Download link
- Build details
- QR code for installation

---

## Testing on Devices

### Android Testing

#### Method 1: Direct Download (APK only)

1. Build APK using preview profile
2. Download APK to your device or computer
3. If downloaded to computer, transfer to phone via USB
4. On Android device:
   - Go to Settings → Security
   - Enable "Install from Unknown Sources"
   - Open the APK file
   - Tap "Install"

#### Method 2: QR Code (APK only)

1. After build completes, scan QR code with Android camera
2. Download and install APK directly

#### Method 3: Google Play Internal Testing (AAB)

1. Build AAB using production profile
2. Upload to Google Play Console
3. Create an Internal Testing release
4. Add testers by email
5. Testers receive Play Store link to install

### iOS Testing

#### Method 1: TestFlight (Recommended)

1. Build IPA using production profile
2. Submit to App Store Connect (see Store Submission section)
3. Upload build to TestFlight
4. Add internal or external testers
5. Testers install via TestFlight app

#### Method 2: iOS Simulator (Mac only)

1. Build using preview profile
2. Download build
3. Drag and drop to iOS Simulator

#### Method 3: Direct Installation (Development Only)

Requires paid Apple Developer account and device registered:
1. Open Xcode
2. Window → Devices and Simulators
3. Select your device
4. Drag IPA file to install

### What to Test

Essential test scenarios:

**Authentication:**
- [ ] User login works correctly
- [ ] Session persists after app restart
- [ ] Logout functionality

**Navigation:**
- [ ] All menu items accessible
- [ ] Back button works correctly (Android)
- [ ] Swipe gestures work (iOS)
- [ ] Deep links open correctly

**Core Features:**
- [ ] Ladder rankings load and display
- [ ] Tournament brackets render properly
- [ ] Live streaming video plays
- [ ] Camera permissions work for OCR scanning
- [ ] Location permissions work for hall finder
- [ ] Push notifications arrive (if configured)

**Performance:**
- [ ] App loads in under 3 seconds
- [ ] Smooth scrolling on lists
- [ ] Images load quickly
- [ ] No crashes or freezes

**Offline Functionality:**
- [ ] App shows offline message when no internet
- [ ] Cached content still viewable
- [ ] Graceful error handling

---

## Troubleshooting

### Common Build Errors

#### "No valid iOS distribution certificate found"

**Solution:**
```bash
eas credentials
```
Select your project and platform, then choose to generate new credentials.

#### "Android build failed: Gradle error"

**Solution:**
1. Clear build cache: `eas build --platform android --clear-cache`
2. Check `package.json` for incompatible dependencies
3. Ensure Expo SDK versions are compatible

#### "Build quota exceeded"

**Solution:**
- Free Expo accounts have limited builds per month
- Upgrade to Expo paid plan for unlimited builds
- Or wait until quota resets next month

### Installation Issues

#### Android: "App not installed"

**Causes:**
1. Existing app with same package name but different signature
2. Insufficient storage space
3. Corrupted APK download

**Solutions:**
1. Uninstall existing app first
2. Free up device storage
3. Re-download APK

#### iOS: "Unable to install"

**Causes:**
1. Device not registered in provisioning profile
2. Expired certificates
3. Mismatched bundle identifier

**Solutions:**
1. Rebuild with device registered
2. Regenerate certificates with `eas credentials`
3. Verify bundle identifier in app.json

### Performance Issues

#### "App loads slowly"

**Solutions:**
1. Optimize images in web app
2. Enable caching in WebView
3. Minimize JavaScript bundle size
4. Use production build (not development)

#### "WebView crashes on Android"

**Solutions:**
1. Update `react-native-webview` to latest version
2. Enable hardware acceleration in app.json
3. Reduce memory usage in web app

---

## Store Submission

### Google Play Store Submission

1. **Build Production AAB:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Upload to Play Console:**
   - Log in to [play.google.com/console](https://play.google.com/console)
   - Select your app (or create new app)
   - Navigate to "Production" → "Create new release"
   - Upload the AAB file
   - Fill out release notes
   - Submit for review

3. **Store Listing Requirements:**
   - App icon (512x512 PNG)
   - Feature graphic (1024x500 PNG)
   - Screenshots (min 2, up to 8)
   - Privacy policy URL
   - App description and short description

### Apple App Store Submission

1. **Build Production IPA:**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

   Or manually:
   - Open [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
   - Create new app or select existing
   - Upload build via Transporter app
   - Fill out app information
   - Submit for review

3. **Store Listing Requirements:**
   - App icon (1024x1024 PNG)
   - Screenshots for all device sizes
   - Privacy policy URL
   - App description
   - Keywords
   - Support URL

### Review Process

**Google Play:**
- Initial review: 1-3 days
- Updates: Few hours to 1 day
- Can appeal rejections

**Apple App Store:**
- Initial review: 1-3 days
- Updates: 1-2 days
- Stricter review guidelines

---

## Additional Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview)

### Support
- [Expo Forums](https://forums.expo.dev/)
- [Expo Discord](https://discord.gg/expo)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

### Build Commands Reference

```bash
# Development builds
eas build --platform android --profile development
eas build --platform ios --profile development

# Preview/Testing builds
eas build --platform android --profile preview  # APK
eas build --platform ios --profile preview      # Simulator

# Production builds
eas build --platform android --profile production  # AAB
eas build --platform ios --profile production      # IPA

# Build both platforms
eas build --platform all --profile production

# Clear cache and rebuild
eas build --platform android --clear-cache

# Check build status
eas build:list

# View build logs
eas build:view [build-id]
```

---

## Version Management

### Updating Version Numbers

Before each release, update version numbers in:

**app.json:**
```json
{
  "expo": {
    "version": "1.0.1",
    "ios": {
      "buildNumber": "2"
    },
    "android": {
      "versionCode": 2
    }
  }
}
```

**Version Number Guidelines:**
- **version**: Human-readable (1.0.0, 1.0.1, 1.1.0)
- **iOS buildNumber**: Increment for each build
- **Android versionCode**: Increment for each build (must be integer)

### OTA Updates (Optional)

For minor updates without rebuilding:

```bash
eas update --branch production --message "Fix login bug"
```

Note: OTA updates only work for JavaScript changes, not native code changes.

---

## Cost Summary

### Build Costs
- **Expo Free Plan**: Limited builds per month
- **Expo Production Plan**: $29/month - Unlimited builds
- **Expo Enterprise Plan**: Custom pricing

### Distribution Costs
- **Google Play**: $25 one-time registration
- **Apple App Store**: $99/year developer program

### Recommended Setup
For production use, budget for:
- Expo Production plan: $29/month
- Apple Developer: $99/year
- Google Play: $25 one-time
- **Total first year**: ~$473 (~$348 subsequent years)

---

## Quick Start Checklist

- [ ] Install Node.js 18+
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Create Expo account
- [ ] Run `cd mobile-app && npm install`
- [ ] Run `eas login`
- [ ] Build Android APK: `eas build --platform android --profile preview`
- [ ] Download and test APK on Android device
- [ ] Build iOS (if needed): `eas build --platform ios --profile production`
- [ ] Test on devices
- [ ] Submit to stores when ready

---

## Support

For issues specific to ActionLadder mobile app:
- Check this documentation first
- Review [Expo troubleshooting docs](https://docs.expo.dev/build-reference/troubleshooting/)
- Contact ActionLadder development team

**Happy Building! 🚀**
