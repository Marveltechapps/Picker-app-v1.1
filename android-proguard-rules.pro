# Android ProGuard rules for production APK - prevents native module stripping
# Used by expo-build-properties plugin (extraProguardRules)

# React Native Vision Camera
-keep class com.mrousavy.camera.** { *; }
-keep class com.mrousavy.cameraview.** { *; }
-dontwarn com.mrousavy.camera.**

# React Native Worklets Core
-keep class com.worklets.** { *; }
-dontwarn com.worklets.**

# ML Kit Face Detection
-keep class com.google.mlkit.vision.face.** { *; }
-keep class com.infinitered.reactnativemlkit.** { *; }
-dontwarn com.google.mlkit.vision.face.**
-dontwarn com.infinitered.reactnativemlkit.**

# React Native Reanimated
-keep class com.swmansion.reanimated.** { *; }
-dontwarn com.swmansion.reanimated.**

# Expo Face Detector (used by FaceVerifySheet / expo-camera)
-keep class expo.modules.facedetector.** { *; }
-dontwarn expo.modules.facedetector.**

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep React Native bridge
-keep @com.facebook.react.bridge.ReactMethod class *
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod <methods>;
}
