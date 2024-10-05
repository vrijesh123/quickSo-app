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
  const [currentCoords, setCurrentCoords] = useState(null);
  const [checkedInProject, setCheckedInProject] = useState(null);
  const [trackingActive, setTrackingActive] = useState(true);

  useEffect(() => {
    startForegroundLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (currentCoords) {
      // Trigger proximity check when coordinates or project data updates
      checkProximity(currentCoords);
    }
  }, [currentCoords, checkedInProject]); // Check proximity only when the state updates

  const startForegroundLocationTracking = async () => {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 500,
        distanceInterval: 1,
      },
      (location) => {
        setCurrentCoords(location.coords); // Update coordinates state
      }
    );
    setLocationSubscription(subscription);
  };

  // Function to check proximity with project location
  const checkProximity = (currentCoords) => {
    if (!checkedInProject) {
      console.log("No checked in project, sending attendance...");
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

    console.log("Distance to project:", distance, "Radius:", radius);

    if (distance > radius) {
      console.log("Out of bounds, sending checkout...");
      sendCheckout(currentCoords);
    }
  };

  // Function to calculate distance between two points using the Haversine formula
  const getDistanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
    // Haversine formula implementation
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Function to send attendance to API
  const sendAttendance = async (currentCoords) => {
    try {
      const response = await fetch(
        'https://uat-api.quickso.in/api/attendance-checkin/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: userData?.user?.uid,
            latitude: currentCoords.latitude,
            longitude: currentCoords.longitude,
          }),
        }
      );

      const data = await response.json();
      console.log('API Response:', data);

      if (data?.check_in) {
        console.log('Check-in successful');
        setCheckedInProject({
          id: data?.project?.id,
          latitude: data?.project?.location?.latitude,
          longitude: data?.project?.location?.longitude,
          radius: data?.project?.location?.radius,
        });
      }
    } catch (error) {
      console.error('Error sending attendance:', error);
    }
  };

  // Function to send checkout request to API when user leaves project area
  const sendCheckout = async (currentCoords) => {
    console.log('Sending checkout request...');
    try {
      const response = await fetch(
        'https://uat-api.quickso.in/api/attendance-checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            uid: userData?.user?.uid,
            latitude: currentCoords.latitude,
            longitude: currentCoords.longitude,
            check_out: true,
            out_time: new Date().toTimeString().split(' ')[0]
          }),
        }
      );

      const data = await response.json();
      console.log('Checkout Response:', data);

      if (data?.success) {
        setCheckedInProject(null); // Reset project
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

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.name}>
        <Text style={styles.userTitle}>
          Welcome,{" "}
          <Text style={styles.username}>{userData?.user?.username}</Text>
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
