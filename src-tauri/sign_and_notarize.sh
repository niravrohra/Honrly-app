#!/bin/bash

set -e

APP_NAME="Honrly"
APP_PATH="src-tauri/target/release/bundle/macos/${APP_NAME}.app"
ENTITLEMENTS="src-tauri/entitlements.plist"
DEVELOPER_ID="Developer ID Application: Dinesh Rohra (P754QXQ64B)"
ZIP_PATH="${APP_NAME}.zip"

INFO_PLIST="${APP_PATH}/Contents/Info.plist"

echo "🔧 Injecting camera/mic usage descriptions..."
/usr/libexec/PlistBuddy -c "Add :NSCameraUsageDescription string 'Honrly needs access to your camera for video interviews.'" "$INFO_PLIST" || true
/usr/libexec/PlistBuddy -c "Add :NSMicrophoneUsageDescription string 'Honrly needs access to your microphone for interview audio.'" "$INFO_PLIST" || true

echo "🛠️ Signing the app..."
codesign --deep --force --options runtime \
  --entitlements "$ENTITLEMENTS" \
  --sign "$DEVELOPER_ID" \
  "$APP_PATH"

echo "📦 Zipping..."
ditto -c -k --sequesterRsrc --keepParent "$APP_PATH" "$ZIP_PATH"

echo "🚀 Submitting for notarization..."
xcrun notarytool submit "$ZIP_PATH" \
  --keychain-profile "notary-profile-name" \
  --wait

echo "📎 Stapling..."
xcrun stapler staple "$APP_PATH"

echo "✅ Done: Signed, Notarized, Stapled!"
