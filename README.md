# APP Latitude e Longitude

This is an application developed with React Native that captures the user's latitude and longitude. It has the option to run in the background, sending the coordinates to a webhook every 5 seconds.

## Installation and Start
1. Install dependencies:
   ```sh
   yarn
   ```
2. Start the application:
   ```sh
   yarn start
   ```

## EAS CLI Configuration
1. Install EAS CLI globally:
   ```sh
   npm install -g eas-cli
   ```
2. Build for Android:
   ```sh
   eas build -p android
   ```
3. Build for Android with preview APK profile:
   ```sh
   eas build -p android --profile preview-apk
   ```

## Update Expo
To upgrade Expo to the latest version:
```sh
yarn add expo@latest
```

## Screenshots
- Main Screen

## Technologies Used
- React Native
- Expo
- EAS CLI
