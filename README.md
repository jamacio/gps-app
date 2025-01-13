# APP Latitude e Longitude

This is an application developed with React Native that captures the user's latitude and longitude. It has the option to run in the background, sending the coordinates to a webhook every 5 seconds.

## Download the App

You can download the application using the link below.

[Download the App](https://expo.dev/accounts/jamacio/projects/gps-app/builds/a5af9e7d-07b2-4f8b-a181-8810fbabdfdf)

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

![image0](https://github.com/user-attachments/assets/3c4bbc34-f967-4c52-94de-474a71069187)
![image1](https://github.com/user-attachments/assets/0d6b493f-6f99-46f5-b33f-d12fd699fb01)

## Technologies Used

- React Native
- Expo
- EAS CLI
