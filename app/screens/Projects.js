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
import { clearStorage } from "../utils";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { v4 as uuidv4 } from "uuid";

const Projects = () => {
  const userData = useSelector((state) => state?.user); // Destructuring state for clarity
  const navigation = useNavigation();

  const [data, setData] = useState([]);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [checkedInProject, setCheckedInProject] = useState(null); // Store project and radius after check-in
  const [trackingActive, setTrackingActive] = useState(true); // Control tracking state

  useEffect(() => {
    startForegroundLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [trackingActive]);

  const startForegroundLocationTracking = async () => {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 1000, // Update every second
        distanceInterval: 1, // Update every 1 meter
      },
      (location) => {
        checkProximity(location.coords); // Check proximity on each update
        setLocationSubscription(location.coords);
      }
    );
  };

  // Function to check proximity with project location
  const checkProximity = (currentCoords) => {
    // If checked into a project, verify if user is outside the radius
    if (checkedInProject) {
      const { latitude, longitude, radius } = checkedInProject;
      const distance = getDistanceBetweenPoints(currentCoords?.latitude, currentCoords?.longitude, latitude, longitude);

      if (distance > radius) {
        // If out of radius, send checkout request
        sendCheckout();
      }
    } else {
      // If not checked in, continue to send attendance until check-in is successful
      sendAttendance(currentCoords);
    }
  };

  // Function to calculate distance between two points using the Haversine formula
  const getDistanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radius of the Earth in meters
    const φ1 = lat1 * (Math.PI / 180);
    const φ2 = lat2 * (Math.PI / 180);
    const Δφ = (lat2 - lat1) * (Math.PI / 180);
    const Δλ = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in meters
    return distance;
  };

  // Function to send attendance to API
  const sendAttendance = async (currentCoords) => {
    console.log('Sending attendance...');

    try {
      const response = await fetch('http://192.168.0.114:1337/api/attendance-check/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include any necessary headers, such as authorization tokens
        },
        body: JSON.stringify({
          uid: userData?.user?.uid, // Replace with your employee ID
          latitude: currentCoords?.latitude,
          longitude: currentCoords?.longitude,

        }),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (data?.check_in) {
        console.log('Check-in successful');
        // Save the project location and radius to track for checkout
        setCheckedInProject({
          latitude: data?.project?.location?.latitude,
          longitude: data?.project?.location?.longitude,
          radius: data?.project?.location?.radius, // Assuming API sends radius in meters
        });
        setTrackingActive(false); // Stop sending attendance once checked in
      }
    } catch (error) {
      console.error('Error sending attendance:', error);
    }
  };

  // Function to send checkout request to API when user leaves project area
  const sendCheckout = async () => {
    console.log('Sending checkout request...');
    try {
      const response = await fetch('http://192.168.0.114:1337/api/attendance-check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include necessary headers like authorization tokens
        },
        body: JSON.stringify({
          employee: 28, // Replace with your employee ID
          project_id: checkedInProject?.id, // Project ID you checked into
        }),
      });

      const data = await response.json();
      console.log('Checkout Response:', data);

      if (data?.checkout_success) {
        // Clear checked-in project state and restart tracking for new check-ins
        setCheckedInProject(null);
        setTrackingActive(true); // Resume tracking for check-in at new project
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

      setData(project_data || []); // Handling possible undefined values
    } catch (error) {
      console.error("Failed to fetch projects:", error); // Better error handling
    }
  }, []); // Empty dependency array since there are no external dependencies

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

  console.log('cordsssssssssss loooooo', checkedInProject, trackingActive)

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.name}>
        <Text style={styles.userTitle}>
          Welcome,{" "}
          <Text style={styles.username}>{userData?.user?.username}</Text>
        </Text>
        <Text style={styles.heading}>Current Location:</Text>
        {locationSubscription ? (
          <View>
            <Text>Latitude: {locationSubscription?.latitude}</Text>
            <Text>Longitude: {locationSubscription?.longitude}</Text>
            <Text>Accuracy: {locationSubscription?.accuracy} meters</Text>
          </View>
        ) : (
          <Text>Fetching location...</Text>
        )}
      </View>
      <Text style={commonStyles.title}>Projects</Text>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item?.id.toString()} // Ensure key is a string
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
    fontWeight: "bold", // This will make the username bold
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
    paddingBottom: 20, // Adding some padding at the bottom
  },
});

export default Projects;
