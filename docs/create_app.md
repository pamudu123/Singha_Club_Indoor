# Building Android APK File in Expo

To build an Android APK file for testing and manual installation (instead of an `.aab` file for Google Play Store), use the following commands.

---

## 🛠️ Step 1: Install & Login to EAS CLI (One-time)

```bash
npm install -g eas-cli
eas login
eas build:configure
```

---

## ⚙️ Step 2: Configure `eas.json` for APK Output

Make sure your root `eas.json` includes `"buildType": "apk"` in a custom profile (like `preview`). 

Here is the recommended configuration:

```json
{
  "cli": {
    "version": ">= 9.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

---

## 🚀 Step 3: Run the Build Command

Choose one of the following compilation options:

### Option A: Build in the EAS Cloud (Recommended)
This compiles the app on Expo's servers and outputs a shareable link/QR code to download and install the APK directly on Android devices.
```bash
eas build --platform android --profile preview
```

### Option B: Build Locally with EAS CLI (Requires Android SDK & Java JDK)
Compiles the APK locally on your machine using the EAS pipeline without waiting in cloud queues.
```bash
eas build --platform android --profile preview --local
```

### Option C: Direct Native Compilation (Without EAS)
Builds and packages a release APK directly using standard Gradle build scripts on your machine.
```bash
npx expo run:android --variant release
```
*After completion, the generated APK file will be located at:*  
`android/app/build/outputs/apk/release/app-release.apk`

---

## ⚠️ Important: Environment Variables (`.env.local`)

By default, `.env.local` is listed in your `.gitignore` and **will NOT be uploaded to EAS Cloud**. If you run `eas build --platform android --profile preview` directly, your Supabase URLs and keys will be empty in the compiled APK!

Here is how to make sure they are included:

### Option A: If building in the EAS Cloud (Recommended)
You must upload the environment variables as **EAS Secrets** so that the Expo Cloud builder can inject them at build time. Since your variables start with `EXPO_PUBLIC_`, they will automatically be loaded.

Run these commands in your terminal:
```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "your-supabase-url" --type string --scope project
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key" --type string --scope project
```
*(You can also set these up on the [Expo Application Services Dashboard](https://expo.dev) under your project settings).*

### Option B: If building Locally
If you build using the `--local` flag (`eas build ... --local` or `npx expo run:android`), you do **NOT** need to configure EAS Secrets. The local compiler runs directly on your machine and will automatically read your local `.env.local` file.

