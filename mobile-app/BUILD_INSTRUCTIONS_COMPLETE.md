# ActionLadder Mobile App - Complete Build Instructions

## Current Status

The ActionLadder mobile app is **configured and ready for building**, but requires:
1. **Expo Account** for cloud builds
2. **App Assets** (icons and splash screens)
3. **EAS CLI** installed and dependencies

---

## Prerequisites Checklist

### ✅ Already Configured
- [x] App configuration (`app.json`) is complete
- [x] Build profiles (`eas.json`) are set up
- [x] WebView wrapper (`App.js`) is implemented
- [x] Package dependencies are defined (`package.json`)
- [x] API URL is configured: `https://billiard-ladder-blazn03.replit.app`

### ⚠️ Required Before Building

#### 1. App Assets (CRITICAL)
The app requires these image files in `mobile-app/assets/`:
- **icon.png** - 1024x1024px PNG (app icon)
- **splash.png** - 1284x2778px PNG (splash screen)
- **favicon.png** - 48x48px PNG (web favicon)

**Background color for assets:** #0B0B0F (dark blue-black)

#### 2. Expo Account
- Create free account at: https://expo.dev/signup
- Required for cloud builds on EAS (Expo Application Services)

#### 3. Developer Accounts (for store submission)
- **Apple Developer**: $99/year - https://developer.apple.com
- **Google Play Console**: $25 one-time - https://play.google.com/console

---

## Build Instructions

### Step 1: Install Dependencies

```bash
cd mobile-app
npm install
```

This installs:
- Expo SDK (~49.0.0)
- React Native (0.72.6)
- EAS CLI (latest)
- All required dependencies

### Step 2: Login to Expo

```bash
npx eas login
```

Enter your Expo account credentials when prompted.

### Step 3: Build APK (Android Testing)

**Purpose:** For internal testing and distribution outside Google Play Store

```bash
cd mobile-app
npx eas build --platform android --profile preview
```

**Build time:** ~10-20 minutes

**Output:** APK file downloadable from Expo dashboard or terminal link

**Installation:**
1. Download APK to Android device or computer
2. On Android: Settings → Security → Enable "Install from Unknown Sources"
3. Open and install APK file

### Step 4: Build AAB (Google Play Store)

**Purpose:** Required format for Google Play Store submission

```bash
cd mobile-app
npx eas build --platform android --profile production
```

**Build time:** ~10-20 minutes

**Output:** AAB (Android App Bundle) file

**Next steps:**
1. Download AAB file
2. Upload to Google Play Console
3. Create release (internal testing, beta, or production)

### Step 5: Build IPA (Apple App Store & TestFlight)

**Purpose:** Required for iOS App Store and TestFlight distribution

**Requirements:**
- Apple Developer account ($99/year)
- EAS will manage certificates automatically (recommended)

```bash
cd mobile-app
npx eas build --platform ios --profile production
```

**Build time:** ~15-30 minutes

**First-time iOS setup:**
- EAS will prompt you to create iOS credentials
- Choose "Let EAS manage automatically" (recommended)
- Or provide your own certificates

**Output:** IPA file

**Next steps:**
1. Download IPA file
2. Upload to App Store Connect
3. Submit to TestFlight for testing
4. Submit to App Store for production

---

## Alternative: Build All Platforms at Once

```bash
cd mobile-app
npx eas build --platform all --profile production
```

This will build both Android AAB and iOS IPA in parallel.

---

## Downloading Builds

### Method 1: Expo Dashboard (Easiest)
1. Visit https://expo.dev
2. Login to your account
3. Navigate to your project
4. Click "Builds" in sidebar
5. Download completed builds

### Method 2: Terminal
After build completes, EAS CLI shows:
- Direct download URL
- QR code (scan with device camera)

### Method 3: Email
Expo sends email notification with:
- Download link
- Build status
- QR code

---

## Build Profiles Reference

Defined in `eas.json`:

### Android Profiles
- **preview**: Builds APK for testing (faster, smaller)
- **production**: Builds AAB for Play Store (required by Google)

### iOS Profiles
- **preview**: Builds for iOS Simulator (Mac only, faster testing)
- **production**: Builds IPA for App Store/TestFlight

---

## Troubleshooting

### Problem: Missing Assets Error
```
Error: Could not find file at path: ./assets/icon.png
```

**Solution:** Create required assets (icon.png, splash.png, favicon.png) in `mobile-app/assets/` directory

### Problem: Not Logged Into Expo
```
Error: Not logged in. Please run 'eas login'
```

**Solution:** Run `npx eas login` and enter your Expo credentials

### Problem: Apple Developer Account Required
```
Error: iOS builds require Apple Developer account
```

**Solution:** You need an Apple Developer account ($99/year). Sign up at https://developer.apple.com

### Problem: Build Queue Wait Time
**Solution:** Free Expo accounts may have queue wait times. Priority builds available with paid plans.

---

## Quick Build Checklist

**Before you start:**
- [ ] Create app assets (icon.png, splash.png, favicon.png)
- [ ] Install dependencies: `cd mobile-app && npm install`
- [ ] Login to Expo: `npx eas login`

**Build commands:**
```bash
# Android APK (testing)
npx eas build --platform android --profile preview

# Android AAB (Play Store)
npx eas build --platform android --profile production

# iOS IPA (App Store/TestFlight)
npx eas build --platform ios --profile production
```

**After builds complete:**
- [ ] Download builds from Expo dashboard
- [ ] Test APK on Android device
- [ ] Upload AAB to Google Play Console
- [ ] Upload IPA to App Store Connect

---

## Build Artifacts Location

After successful builds, artifacts will be available at:

**Expo Dashboard:**
- URL: https://expo.dev/accounts/[your-account]/projects/actionladder-app/builds
- Files: APK, AAB, IPA downloadable for 30 days

**Local Download:**
- Save downloaded files to: `mobile-app/builds/` (create directory if needed)
- Recommended naming:
  - `ActionLadder-v1.0.0.apk`
  - `ActionLadder-v1.0.0.aab`
  - `ActionLadder-v1.0.0.ipa`

---

## Current Configuration

### App Details
- **Name:** ActionLadder
- **Package/Bundle ID:** net.actionladder.app
- **Version:** 1.0.0
- **API URL:** https://billiard-ladder-blazn03.replit.app

### Permissions Configured
**Android:**
- Internet, Camera, Microphone
- External Storage (Read/Write)
- Location (Coarse & Fine)

**iOS:**
- Camera, Microphone
- Photo Library
- Location (When In Use)

---

## Support

For build issues:
- Expo Documentation: https://docs.expo.dev/build/introduction/
- EAS Build Guide: https://docs.expo.dev/build/setup/
- Expo Forums: https://forums.expo.dev

For mobile app code issues:
- Check `mobile-app/App.js` for WebView configuration
- Check `mobile-app/app.json` for app configuration
- Check `mobile-app/eas.json` for build profiles
