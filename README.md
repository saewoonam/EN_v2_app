#  NIST Exposure Notification v2

This is a mobile app that is written with the cordova package to communicate via bluetooth with NIST expsoure notification hardware.   The purpose of the app is to communicate with the hardware.

## Requirements
- Install cordova
- Use cordova-plugin-ble-central repo cited below instead of the standard repo.... Seems to help with android bugs having to do with gps
## Android

        cordova platform add android
        cordova plugin add git+https://github.com/rajeshpandalss/cordova-plugin-ble-central.git
        cordova plugin add cordova-plugin-webpack
        cordova run android

## iOS

        cordova platform add ios
        cordova plugin add git+https://github.com/rajeshpandalss/cordova-plugin-ble-central.git
        cordova plugin add cordova-plugin-webpack
        cordova run ios

Note: Sometimes Xcode can't deploy from the command line. If that happens, open metrics.xcworkspace and deploy to your phone using Xcode.  This can be fixed by opening the workspace and fixing the developer credentials.   After fixing the credentials it should compile in Xcode or from the command line using the cordova commands

    open platforms/ios/v2.xcworkspace


## made icons using:
https://appicon.co
## To deploy to app store
-  Remember to build for Generic iOS device
-  Select Build Archive, this is greyed out if a specific device has been selected
-  Go to Organizer to upload/validate app
