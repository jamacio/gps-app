import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, Alert, TextInput } from 'react-native';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

const config = {
  LOCATION_TASK_NAME: "background-location-task",
  TIME_INTERVAL: 3600000, // 1 hour
  DISTANCE_INTERVAL: 100, // 100 meters
};

const sendDataToWebhook = async (data, webhookUrl) => {
  const isTracking = await AsyncStorage.getItem('location_update');
  try {
    if (isTracking === 'send') {
      const response = await fetch(webhookUrl, {
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
          deviceName: data?.deviceName,
        }),
      });

      if (!response.ok) {
        console.log('Error sending data to webhook:', response.status);
      } else {
        console.log('Data successfully sent to webhook');
      }
    }
  } catch (error) {
    console.log('Error sending data to webhook:', error);
  }
};

TaskManager.defineTask(config.LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const batteryInfo = await Battery.getPowerStateAsync();
    const webhookUrl = await AsyncStorage.getItem('webhook_url');
    const savedDeviceName = await AsyncStorage.getItem('device_name');
    const locationData = {
      coords: locations[0]?.coords,
      ...batteryInfo,
      savedDeviceName
    };
    console.log('Background location:', locationData);

    await sendDataToWebhook(locationData, webhookUrl);
  }
});

function WebhookScreen({ webhookUrl, setWebhookUrl, registerWebhookUrl, timeInterval, setTimeInterval, distanceInterval, setDistanceInterval, deviceName, setDeviceName }) {
  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.label}>Webhook URL (POST):</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter webhook URL"
        value={webhookUrl}
        onChangeText={setWebhookUrl}
      />
      <Text style={styles.label}>Time Interval (ms):</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter time interval"
        value={timeInterval}
        onChangeText={setTimeInterval}
        keyboardType="numeric"
      />
      <Text style={styles.label}>Distance Interval (meters):</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter distance interval"
        value={distanceInterval}
        onChangeText={setDistanceInterval}
        keyboardType="numeric"
      />
      <Text style={styles.label}>Device Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter device name"
        value={deviceName}
        onChangeText={setDeviceName}
      />
      <Button onPress={registerWebhookUrl} title="Salvar" />
    </View>
  );
}

function DeviceDataScreen({ deviceData, isTracking, startLocationUpdates, stopLocationUpdates }) {
  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.title}>Device Data</Text>
      <Text>Latitude: {deviceData?.coords?.latitude || "N/A"}</Text>
      <Text>Longitude: {deviceData?.coords?.longitude || "N/A"}</Text>
      <View style={styles.divider} />
      <Text>Battery Level: {deviceData?.batteryLevel || "N/A"}</Text>
      <Text>Battery State: {deviceData?.batteryState || "N/A"}</Text>
      <Text>Low Power Mode: {deviceData?.lowPowerMode ? 'Yes' : 'No'}</Text>
      <Button
        onPress={isTracking ? stopLocationUpdates : startLocationUpdates}
        title={isTracking ? 'Stop Tracking' : 'Start Tracking'}
      />
      <Text style={styles.version}>V1.0.2</Text>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  const [deviceData, setDeviceData] = useState({});
  const [isTracking, setIsTracking] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [timeInterval, setTimeInterval] = useState(String(config.TIME_INTERVAL));
  const [distanceInterval, setDistanceInterval] = useState(String(config.DISTANCE_INTERVAL));
  const [deviceName, setDeviceName] = useState('Device Name');

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const savedUrl = await AsyncStorage.getItem('webhook_url');
        const savedTimeInterval = await AsyncStorage.getItem('time_interval');
        const savedDistanceInterval = await AsyncStorage.getItem('distance_interval');
        const savedDeviceName = await AsyncStorage.getItem('device_name');

        if (savedUrl) setWebhookUrl(savedUrl);
        if (savedTimeInterval) setTimeInterval(savedTimeInterval);
        if (savedDistanceInterval) setDistanceInterval(savedDistanceInterval);
        if (savedDeviceName) setDeviceName(savedDeviceName);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadStoredData();
  }, []);

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
            timeInterval: Number(timeInterval),
            distanceInterval: Number(distanceInterval),
          },
          (location) => {
            updateDeviceData(location);
          }
        );

        const hasStarted = await Location.hasStartedLocationUpdatesAsync(config.LOCATION_TASK_NAME);
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
  }, [timeInterval, distanceInterval]);

  const updateDeviceData = async (location) => {
    try {
      const batteryInfo = await Battery.getPowerStateAsync();
      const savedWebhookUrl = await AsyncStorage.getItem('webhook_url');
      const savedDeviceName = await AsyncStorage.getItem('device_name');

      const updatedData = { ...location, ...batteryInfo, savedDeviceName };
      setDeviceData(updatedData);
      console.log('Location updated:', updatedData);

      await sendDataToWebhook(updatedData, savedWebhookUrl);
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

      await Location.startLocationUpdatesAsync(config.LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: Number(timeInterval),
        distanceInterval: Number(distanceInterval),
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'App Running',
          notificationBody: 'We are tracking your location in the background',
          notificationColor: '#FF0000',
        },
      });
      await AsyncStorage.setItem('location_update', 'send');
      await AsyncStorage.setItem('webhook_url', webhookUrl);
      await AsyncStorage.setItem('device_name', deviceName);
      setIsTracking(true);
      console.log('Tracking started');
    } catch (error) {
      console.error('Error starting location updates:', error);
    }
  };

  const stopLocationUpdates = async () => {
    try {
      await Location.stopLocationUpdatesAsync(config.LOCATION_TASK_NAME);
      await AsyncStorage.setItem('location_update', '');
      setIsTracking(false);
      console.log('Tracking stopped');
    } catch (error) {
      console.error('Error stopping location updates:', error);
    }
  };

  const registerWebhookUrl = async () => {
    try {
      await AsyncStorage.setItem('webhook_url', webhookUrl);
      await AsyncStorage.setItem('time_interval', timeInterval);
      await AsyncStorage.setItem('distance_interval', distanceInterval);
      await AsyncStorage.setItem('device_name', deviceName);
      Alert.alert('Success', 'Settings successfully registered');
    } catch (error) {
      console.error('Error registering webhook URL:', error);
    }
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'Device Data') {
              iconName = 'home';
            } else if (route.name === 'Config') {
              iconName = 'settings';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: 'green',
          tabBarInactiveTintColor: 'gray',
        })}
      >
        <Tab.Screen name="Device Data">
          {() => (
            <DeviceDataScreen
              deviceData={deviceData}
              isTracking={isTracking}
              startLocationUpdates={startLocationUpdates}
              stopLocationUpdates={stopLocationUpdates}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Config">
          {() => (
            <WebhookScreen
              webhookUrl={webhookUrl}
              setWebhookUrl={setWebhookUrl}
              registerWebhookUrl={registerWebhookUrl}
              timeInterval={timeInterval}
              setTimeInterval={setTimeInterval}
              distanceInterval={distanceInterval}
              setDistanceInterval={setDistanceInterval}
              deviceName={deviceName}
              setDeviceName={setDeviceName}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 8,
    marginBottom: 16,
    width: '80%',
  },
  divider: {
    marginVertical: 16,
  },
  version: {
    marginTop: 16,
    fontSize: 12,
    color: 'gray',
  },
});
