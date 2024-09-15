// screens/LoginScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import "react-native-get-random-values";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  View,
  TextInput,
  Button,
  ActivityIndicator,
  Image,
  StyleSheet,
} from "react-native";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { setClientUid, loginUser } from "../reducers/userSlice"; // Adjust path as needed
import { loginAPI, projectsAPI } from "../../apis/api";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const LOCATION_TASK_NAME = "background-location-task";
const GEOFENCE_RADIUS_METERS = 100; // Adjust the radius as needed

const LoginScreen = () => {
  const userData = useSelector((state) => state?.user); // Destructuring state for clarity

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null); // Example for location state

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const fetchData = useCallback(async () => {
    try {
      const res = await projectsAPI.get("?populate=%2A");
      const project_data = res?.data?.map((data) => ({
        id: data.id,
        name: data?.attributes?.name,
        location: data?.attributes?.location,
      }));

      // Store project data in AsyncStorage for background task access
      await AsyncStorage.setItem("projects", JSON.stringify(project_data));
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  const startBackgroundLocationTracking = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    console.log("startBackgroundLocationTracking", status);

    if (status === "granted") {
      const locRes = await Location.startLocationUpdatesAsync(
        LOCATION_TASK_NAME,
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 1, // in meters
          deferredUpdatesInterval: 1000, // in milliseconds
          foregroundService: {
            notificationTitle: "QuickSo is using your location",
            notificationBody:
              "Your location is being used to track your attendance.",
            notificationColor: "#FF0000", // Optional: Change the notification color
          },
        }
      );

      console.log("location ressss", locRes);
    } else {
      Alert.alert(
        "Permission required",
        "Please grant background location permissions."
      );
    }
  };

  const onFinish = async () => {
    try {
      setIsLoading(true);

      if (!userLocation) {
        Alert.alert("Error", "Please allow Location access.");
        return;
      }
      const clientUid = uuidv4();

      const submitData = {
        username: email,
        password: password,
        client_uid: clientUid,
      };

      const res = await loginAPI.post(``, submitData);

      if (res && res.data.user.user_type !== "Employee") {
        Toast.show({
          type: "error",
          text1: "Only Employee can login",
          text2: "Login Failed!",
          position: "bottom",
        });

        return;
      }

      if (res) {
        const token = res?.data?.jwt;

        // Save the token to local storage
        await AsyncStorage.setItem("userToken", token);
        await AsyncStorage.setItem("userData", res?.data?.user?.username);

        dispatch(setClientUid(clientUid));
        dispatch(
          loginUser({
            user: res?.data?.user,
            token: res?.data?.jwt,
            location: userLocation,
          })
        );

        // Fetch projects and start background tracking after login
        await fetchData();
        await startBackgroundLocationTracking();

        Alert.alert("Success", "Logged in successfully!", [
          {
            text: "OK",
            onPress: () => navigation.navigate("Projects"),
          },
        ]);
      } else {
        Alert.alert("Error", "Login failed. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred. Please try again.");
      console.log("error", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const getPermissions = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
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
      navigation.navigate("Projects");
    }
  }, [userData?.user]);

  console.log("user", userLocation);

  return (
    <View style={styles.main}>
      <Image source={require("../assets/quickso.png")} style={styles.img} />
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
    display: "flex",
    alignitems: "center",
    justifyContent: "center",
    backgroundColor: "#ffff",
    padding: 20,
    height: "100%",
  },

  img: {
    width: "100%",
    objectFit: "contain",
    marginBottom: 40,
  },

  input: {
    marginBottom: 20,
    borderWidth: 1,
    border: "1px solid #E7E8ED",
    padding: 10,
    borderRadius: 6,
  },
});

export default LoginScreen;
