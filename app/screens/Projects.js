import React, { useEffect, useState, useCallback } from "react";
import {
  Button,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { projectsAPI } from "../../apis/api";
import { commonStyles } from "../styles/styles";
import { useSelector } from "react-redux";
import { clearStorage, getDistanceBetweenPoints } from "../utils";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import * as Notifications from 'expo-notifications';
import AsyncStorage from "@react-native-async-storage/async-storage";

const Projects = () => {
  const userData = useSelector((state) => state?.user);
  const navigation = useNavigation();

  const [data, setData] = useState([]);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(null);
  // const [checkedInProject, setCheckedInProject] = useState(null);

  let checkedInProject = null;
  const LOCATION_TASK_NAME = 'background-location-task';


  useEffect(() => {
    // Start both tracking modes on component mount
    startForegroundLocationTracking();
    startBackgroundLocationTracking();

    return () => {
      // Clean up subscription on unmount
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (currentCoords) {
      checkProximity(currentCoords); // Check proximity when location changes
    }
  }, [currentCoords, checkedInProject]);

  const startForegroundLocationTracking = async () => {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 500,
          distanceInterval: 1,
        },
        (location) => {
          setCurrentCoords(location.coords); // Update location state
        }
      );
      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Error starting foreground location tracking:', error);
    }
  };

  const startBackgroundLocationTracking = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status === "granted") {
      try {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          timeInterval: 500,
          distanceInterval: 1,
          deferredUpdatesIntervalMillis: 1000,
          foregroundService: {
            notificationTitle: "QuickSo is using your location",
            notificationBody: "Tracking your location in the background.",
            notificationColor: "#FF0000",
          },
          showsBackgroundLocationIndicator: true,
        });
      } catch (error) {
        console.error('Error starting background location tracking:', error);
      }
    } else {
      Alert.alert("Permission required", "Background location permission is required.");
    }
  };

  const checkProximity = async (currentCoords) => {
    const checkedInProjectString = await AsyncStorage.getItem('checkedInProject');
    if (checkedInProjectString) {
      checkedInProject = JSON.parse(checkedInProjectString);
    }

    console.log('checkedInProject', checkedInProject)

    if (!checkedInProject) {
      sendAttendance(currentCoords);
      return;
    }

    const { latitude, longitude, radius } = checkedInProject;
    const distance = getDistanceBetweenPoints(
      currentCoords.latitude,
      currentCoords.longitude,
      latitude,
      longitude
    );

    console.log('radiusssss', distance, radius)

    if (distance > radius) {
      sendCheckout(currentCoords);
    }
  };

  const sendAttendance = async (currentCoords) => {
    const userDataString = await AsyncStorage.getItem('userData');
    const userData = JSON.parse(userDataString);

    try {
      const response = await fetch(
        'https://uat-api.quickso.in/api/attendance-checkin/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: userData?.uid,
            latitude: currentCoords.latitude,
            longitude: currentCoords.longitude,
          }),
        }
      );

      const data = await response.json();
      console.log('check in sucesss', data)


      if (data?.check_in) {
        checkedInProject = {
          id: data?.project?.id,
          latitude: data?.project?.location?.latitude,
          longitude: data?.project?.location?.longitude,
          radius: data?.project?.location?.radius,
        };

        // Store checkedInProject in AsyncStorage
        await AsyncStorage.setItem('checkedInProject', JSON.stringify(checkedInProject));

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Checked In',
            body: 'checkin',
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error('Error sending attendance:', error);
    }
  };

  const sendCheckout = async (currentCoords) => {
    const userDataString = await AsyncStorage.getItem('userData');
    const userData = JSON.parse(userDataString);
    try {
      const response = await fetch(
        'https://uat-api.quickso.in/api/attendance-checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: userData?.uid,
            latitude: currentCoords.latitude,
            longitude: currentCoords.longitude,
            check_out: true,
            out_time: new Date().toTimeString().split(' ')[0]
          }),
        }
      );

      const data = await response.json();

      console.log('checkoutttttttt', data)


      if (data?.success) {
        // setCheckedInProject(null); // Reset checked-in project state
        await AsyncStorage.removeItem('checkedInProject');

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Checked Out',
            body: 'checkout',
          },
          trigger: null,
        });
      }
    } catch (error) {
      console.error('Error sending checkout:', error);
    }
  };

  const fetchData = useCallback(async () => {
    try {
      const res = await projectsAPI.get("?populate=%2A");
      const project_data = res?.data?.map((data) => ({
        id: data.id,
        name: data?.attributes?.name,
        location: data?.attributes?.location,
      }));

      setData(project_data || []);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderItem = ({ item }) => {
    const handlePress = () => {
      navigation.navigate("DailyAttendance", { project: item });
    };

    return (
      <View style={styles.item}>
        <Text style={styles.itemText}>{item?.name}</Text>
        <TouchableOpacity onPress={handlePress}>
          <Text style={styles.linkText}>View Details</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.name}>
        <Text style={styles.userTitle}>
          Welcome, <Text style={styles.username}>{userData?.user?.username}</Text>
        </Text>
        <Text style={styles.heading}>Current Location:</Text>
        {currentCoords ? (
          <View>
            <Text>Latitude: {currentCoords.latitude}</Text>
            <Text>Longitude: {currentCoords.longitude}</Text>
            <Text>Accuracy: {currentCoords.accuracy} meters</Text>
          </View>
        ) : (
          <Text>Fetching location...</Text>
        )}
      </View>
      <Text style={commonStyles.title}>Projects</Text>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item?.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  name: {
    borderBottomWidth: 1,
    borderBlockColor: "#E7E8ED",
    marginBottom: 30,
  },
  userTitle: {
    fontSize: 20,
    marginBottom: 10,
    fontFamily: "Inter_400Medium",
    textTransform: "capitalize",
  },
  username: {
    fontWeight: "bold",
  },
  item: {
    marginVertical: 5,
    paddingVertical: 10,
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E7E8ED",
    justifyContent: "space-between",
  },
  itemText: {
    color: "#000",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  linkText: {
    color: "#2E4494",
    fontSize: 12,
    textDecorationLine: "underline",
    fontFamily: "Inter_400Regular",
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default Projects;
