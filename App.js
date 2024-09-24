import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as TaskManager from 'expo-task-manager';

const LOCATION_TASK_NAME = 'background-location-task';

export default function App() {
  const [deviceData, setDeviceData] = useState({});
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    let subscription;

    const initialize = async () => {
      try {
        // Solicita permissões de localização em primeiro plano
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        if (foregroundStatus !== 'granted') {
          Alert.alert('Permissão negada', 'Permissão de localização em primeiro plano negada.');
          return;
        }

        // Inicia o listener para atualizar dados quando a localização mudar
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000, // Atualiza a cada 5 segundos
            distanceInterval: 0,
          },
          (location) => {
            updateDeviceData(location);
          }
        );

        // Verifica se a tarefa já está em execução
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        setIsTracking(hasStarted);

      } catch (error) {
        console.error('Erro na inicialização:', error);
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
      setDeviceData({ ...location, ...batteryInfo });
      console.log('Localização atualizada:', location);
    } catch (error) {
      console.error('Erro ao atualizar dados do dispositivo:', error);
    }
  };

  const startLocationUpdates = async () => {
    try {
      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus !== 'granted') {
        Alert.alert('Permissão negada', 'Permissão de localização em segundo plano negada.');
        return;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Atualiza a cada 5 segundos
        distanceInterval: 0,
        showsBackgroundLocationIndicator: true, // Apenas iOS
        foregroundService: {
          notificationTitle: 'Aplicativo em Execução',
          notificationBody: 'Estamos rastreando sua localização em segundo plano',
          notificationColor: '#FF0000',
        },
      });

      setIsTracking(true);
      console.log('Rastreamento iniciado');
    } catch (error) {
      console.error('Erro ao iniciar atualizações de localização:', error);
    }
  };

  const stopLocationUpdates = async () => {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      setIsTracking(false);
      console.log('Rastreamento parado');
    } catch (error) {
      console.error('Erro ao parar atualizações de localização:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Latitude: {deviceData?.coords?.latitude} </Text>
      <Text>Longitude: {deviceData?.coords?.longitude} </Text>
      <Text>------------------</Text>
      <Text>Nível de Bateria: {deviceData?.batteryLevel} </Text>
      <Text>Estado da Bateria: {deviceData?.batteryState} </Text>
      <Text>Modo de Baixa Energia: {deviceData?.lowPowerMode ? 'Sim' : 'Não'} </Text>
      <Button
        onPress={isTracking ? stopLocationUpdates : startLocationUpdates}
        title={isTracking ? 'Parar Rastreamento' : 'Iniciar Rastreamento em Segundo Plano'}
      />
    </View>
  );
}

// Definição da tarefa em segundo plano
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Erro na tarefa de localização:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const batteryInfo = await Battery.getPowerStateAsync();
    console.log('Localização em segundo plano:', locations[0]);
    // Aqui você pode enviar os dados para um servidor ou armazená-los localmente
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
