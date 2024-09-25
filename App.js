import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-location-task';
const WEBHOOK_URL = 'https://webhook.site/b45c0ba9-6d04-4914-b08a-a0ce2e12fbb6';

// Definição global da função
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
        console.error('Erro ao enviar dados para o webhook:', response.status);
      } else {
        console.log('Dados enviados para o webhook com sucesso');
      }
    }
  } catch (error) {
    console.error('Erro ao enviar dados para o webhook:', error);
  }
};

// Definição da tarefa em segundo plano
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Erro na tarefa de localização:', error);
    return;
  }
  if (data) {
    const { locations } = data;
    const batteryInfo = await Battery.getPowerStateAsync();
    const locationData = {
      coords: locations[0]?.coords,
      ...batteryInfo,
    };
    console.log('Localização em segundo plano:', locationData);

    // Envia os dados para o webhook
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
            timeInterval: 60000, // Atualiza a cada 60 segundos
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
      const updatedData = { ...location, ...batteryInfo };
      setDeviceData(updatedData);
      console.log('Localização atualizada:', updatedData);

      // Envia os dados para o webhook
      await sendDataToWebhook(updatedData);
    } catch (error) {
      console.error('Erro ao atualizar dados do dispositivo:', error);
    }
  };

  const startLocationUpdates = async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        Alert.alert('Permissão negada', 'Permissão de localização em primeiro plano negada.');
        return;
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        Alert.alert('Permissão negada', 'Permissão de localização em segundo plano negada.');
        return;
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 60000, // Atualiza a cada 60 segundos
        distanceInterval: 0,
        showsBackgroundLocationIndicator: true, // Apenas iOS
        foregroundService: {
          notificationTitle: 'Aplicativo em Execução',
          notificationBody: 'Estamos rastreando sua localização em segundo plano',
          notificationColor: '#FF0000',
        },
      });
      await AsyncStorage.setItem('location_update', 'send');
      setIsTracking(true);
      console.log('Rastreamento iniciado');
    } catch (error) {
      console.error('Erro ao iniciar atualizações de localização:', error);
    }
  };

  const stopLocationUpdates = async () => {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      await AsyncStorage.setItem('location_update', '');
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
