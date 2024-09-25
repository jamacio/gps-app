import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_TASK_NAME, WEBHOOK_URL, TIME_INTERVAL, DISTANCE_INTERVAL } from '@env';

const sendDataToWebhook = async (data) => {
  const isTracking = await AsyncStorage.getItem('location_update');

  try {
    if (isTracking === 'send') {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: data?.coords?.latitude,
          longitude: data?.coords?.longitude,
          batteryLevel: data?.batteryLevel,
          batteryState: data?.batteryState,
          lowPowerMode: data?.lowPowerMode,
        }),
      });

      if (!response.ok) {
        console.error('Error sending data to webhook:', response.status);
      } else {
        console.log('Data successfully sent to webhook');
      }
    }
  } catch (error) {
    console.error('Error sending data to webhook:', error);
  }
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const batteryInfo = await Battery.getPowerStateAsync();
    const locationData = {
      coords: locations[0]?.coords,
      ...batteryInfo,
    };
    console.log('Background location:', locationData);

    await sendDataToWebhook(locationData);
  }
});

export default function App() {
  const [deviceData, setDeviceData] = useState({});
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    let subscription;

    const initialize = async () => {
      try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          Alert.alert('Permission denied', 'Foreground location permission denied.');
          return;
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: Number(TIME_INTERVAL),
            distanceInterval: Number(DISTANCE_INTERVAL),
          },
          (location) => {
            updateDeviceData(location);
          }
        );

        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        setIsTracking(hasStarted);

      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initialize();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const updateDeviceData = async (location) => {
    try {
      const batteryInfo = await Battery.getPowerStateAsync();
      const updatedData = { ...location, ...batteryInfo };
      setDeviceData(updatedData);
      console.log('Location updated:', updatedData);

      await sendDataToWebhook(updatedData);
    } catch (error) {
      console.error('Error updating device data:', error);
    }
  };

  const startLocationUpdates = async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        Alert.alert('Permission denied', 'Foreground location permission denied.');
        return;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert('Permission denied', 'Background location permission denied.');
        return;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: Number(TIME_INTERVAL),
        distanceInterval: Number(DISTANCE_INTERVAL),
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'App Running',
          notificationBody: 'We are tracking your location in the background',
          notificationColor: '#FF0000',
        },
      });
      await AsyncStorage.setItem('location_update', 'send');
      setIsTracking(true);
      console.log('Tracking started');
    } catch (error) {
      console.error('Error starting location updates:', error);
    }
  };

  const stopLocationUpdates = async () => {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      await AsyncStorage.setItem('location_update', '');
      setIsTracking(false);
      console.log('Tracking stopped', TIME_INTERVAL);
    } catch (error) {
      console.error('Error stopping location updates:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Latitude: {deviceData?.coords?.latitude} </Text>
      <Text>Longitude: {deviceData?.coords?.longitude} </Text>
      <Text>------------------</Text>
      <Text>Battery Level: {deviceData?.batteryLevel} </Text>
      <Text>Battery State: {deviceData?.batteryState} </Text>
      <Text>Low Power Mode: {deviceData?.lowPowerMode ? 'Yes' : 'No'} </Text>
      <Button
        onPress={isTracking ? stopLocationUpdates : startLocationUpdates}
        title={isTracking ? 'Stop Tracking' : 'Start Background Tracking'}
      />
      <Text>V1.0.1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
