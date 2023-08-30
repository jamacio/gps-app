import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';
const TIME_TO_UPDATE = 1000;

export default function App() {
  const [deviceData, setDeviceData] = useState({});
  const [teste, setTeste] = useState(0);

  const updateLatLong = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      setErrorMsg('Permission to access location was denied');
      return;
    }

    const prositionInfo = await Location.getCurrentPositionAsync({});
    const batteryInfo = await Battery.getPowerStateAsync();
    console.log(batteryInfo);
    setDeviceData({ ...prositionInfo, ...batteryInfo });
  }

  const requestPermissions = async () => {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus === 'granted') {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus === 'granted') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.Balanced,
        });
      }
    }
  };

  useEffect(() => {
    setInterval(() => {

      updateLatLong();
    }, TIME_TO_UPDATE);
  })

  TaskManager.defineTask(LOCATION_TASK_NAME, ({ data, error }) => {
    if (error) {
      return;
    }

    if (data) {
      let testetetse = teste;
      setInterval(() => {
        setTeste(testetetse++)
        updateLatLong();
      }, TIME_TO_UPDATE);
    }
  });




  return (
    <View style={styles.container}>
      <Text>lat: {deviceData?.coords?.latitude} </Text>
      <Text>long: {deviceData?.coords?.longitude} </Text>
      <Text>------------------</Text>
      <Text>batteryLevel: {deviceData?.batteryLevel} </Text>
      <Text>batteryState: {deviceData?.batteryState} </Text>
      <Text>lowPowerMode: {deviceData?.lowPowerMode ? 'true' : 'false'} </Text>
      <Text>teste: {teste} </Text>
      <Button onPress={requestPermissions} title="Enable background location" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
