# APP Latitude e Longitude

This is an application developed with React Native that captures the user's latitude and longitude. It has the option to run in the background, sending the coordinates to a webhook every 5 seconds.

## Download the App

You can download the application using the link below.

[Download the App](https://expo.dev/accounts/jamacio/projects/gps-app/builds/81945b4c-78c4-4d56-9e09-3a54c804ffdc)

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

![image2](https://github.com/user-attachments/assets/4c06872f-ebe5-40f8-bca5-f1f873b2ca00)

## Technologies Used

- React Native
- Expo
- EAS CLI
