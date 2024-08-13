// screens/LoginScreen.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { Alert, View, TextInput, Button, ActivityIndicator, Image, StyleSheet } from 'react-native';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import _ from 'lodash';
import * as Location from 'expo-location';
import { setClientUid, loginUser } from '../reducers/userSlice';  // Adjust path as needed
import { loginAPI } from '../../apis/api';
import { useNavigation } from '@react-navigation/native';
// import { useNavigation } from 'expo-router';

const LoginScreen = () => {
  const userData = useSelector((state) => state?.user); // Destructuring state for clarity

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null); // Example for location state

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const onFinish = async () => {
    try {
      setIsLoading(true);

      if (!userLocation) {
        Alert.alert('Error', 'Please allow Location access.');

        return;
      }
      const clientUid = uuidv4();

      const submitData = {
        username: email,
        password: password,
        client_uid: clientUid,
      };

      if (!_.isEmpty(userLocation)) {
        submitData["location"] = {
          ...userLocation,
          uid: uuidv4(),
        };
      }

      const res = await loginAPI.post(``, submitData);

      console.log('ressss', res)

      if (res) {
        const token = res?.data?.jwt;

        // Save the token to local storage
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', res?.data?.user?.username);

        dispatch(setClientUid(clientUid));

        dispatch(
          loginUser({
            user: res?.data?.user,
            token: res?.data?.jwt,
            location: userLocation
          })
        );

        // Navigate to the next screen or show a success message
        Alert.alert('Success', 'Logged in successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Projects'), // Assuming 'Dashboard' is the route name for your dashboard screen
          },
        ]);
      } else {
        // Handle login failure
        Alert.alert('Error', 'Login failed. Please try again.');
      }
    } catch (error) {
      // Handle errors
      Alert.alert('Error', 'An error occurred. Please try again.');
      console.log('error', error)
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getPermissions = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log("Please grant location permissions");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setUserLocation(currentLocation);
      // console.log("Location:");
      // console.log(currentLocation);
    };
    getPermissions();
  }, []);

  useEffect(() => {
    //if userData.user has data then redirect to Projects page 
    if (userData?.user) {
      navigation.navigate('Projects');
    }
  }, [userData?.user])


  return (
    <View style={styles.main}>
      <Image source={require('../assets/quickso.png')} style={styles.img} />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        required
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        required
      />
      <Button title="Login" onPress={onFinish} disabled={isLoading} />
      {isLoading && <ActivityIndicator size="large" color="#0000ff" />}
    </View>
  );
};

const styles = StyleSheet.create({
  main: {
    display: 'flex',
    alignitems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffff',
    padding: 20,
    height: '100%'
  },

  img: {
    width: '100%',
    objectFit: 'contain',
    marginBottom: 40
  },

  input: {
    marginBottom: 20,
    borderWidth: 1,
    border: '1px solid #E7E8ED',
    padding: 10,
    borderRadius: 6
  }
})

export default LoginScreen;
