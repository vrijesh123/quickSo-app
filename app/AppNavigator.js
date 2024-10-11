import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import LoginScreen from "./screens/Login";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Projects from "./screens/Projects";
import { Text, Image, TouchableOpacity, View, StatusBar, Button, StyleSheet } from "react-native";
import DailyTasks from "./screens/DailyTasks";
import { useDispatch, useSelector } from "react-redux";
import DailyAttendance from "./screens/DailyAttendance";
import { logoutAPI } from "../apis/api";
import { logoutUser } from "./reducers/userSlice";
import Toast from "react-native-toast-message";
import * as Location from 'expo-location';

const Drawer = createDrawerNavigator();

export default function AppNavigator() {

    const userData = useSelector((state) => state?.user); // Destructuring state for clarity

    const getToken = async () => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            if (token !== null) {
                // Token exists, proceed accordingly
            }
        } catch (error) {
            console.log('Error retrieving token:', error);
        }
    };

    const isLoggedIn = getToken(); // Check if user is logged in by checking if there's a token

    return (
        <NavigationContainer>
            <Drawer.Navigator
                initialRouteName={userData?.user ? "Projects" : "Login"}
                screenOptions={({ navigation }) => ({
                    header: () => <CustomHeader navigation={navigation} />,
                    drawerPosition: 'right',
                })}
                drawerContent={(props) => <CustomDrawerContent {...props} />} // Custom drawer content
                drawerStyle={styles.drawerStyle} // Style the drawer container
                drawerContentOptions={{
                    activeTintColor: '#2E4494', // Color of active label and icon
                    inactiveTintColor: '#000', // Color of inactive label and icon
                    activeBackgroundColor: '#E7E8ED', // Background color for active item
                    labelStyle: styles.drawerLabel, // Style for labels
                    itemStyle: styles.drawerItem, // Style for each item
                }}
            >
                <Drawer.Screen name="Projects" component={Projects} options={{ title: 'Project' }} />
                <Drawer.Screen name="DailyTasks" component={DailyTasks} options={{ title: 'Daily Tasks' }} />
                <Drawer.Screen
                    name="DailyAttendance"
                    component={DailyAttendance}
                    options={{ title: 'Daily Attendance' }} />

                <Drawer.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />

            </Drawer.Navigator>
        </NavigationContainer>
    );
}

const CustomDrawerContent = (props) => {
    const dispatch = useDispatch();
    const userData = useSelector((state) => state?.user); // Destructuring state for clarity
    const LOCATION_TASK_NAME = 'background-location-task';

    const handleLogout = async () => {
        try {
            // Call the logout API
            const res = await logoutAPI.post('', {
                uid: props.userData?.user?.uid
            });

            // Dispatch the logout action to clear the Redux store
            dispatch(logoutUser());

            // Clear AsyncStorage
            await AsyncStorage.clear();
            // await AsyncStorage.removeItem('userData');
            // await AsyncStorage.removeItem('checkedInProject');

            // // Stop background location tracking
            // await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);

            // Show a toast message for successful logout
            Toast.show({
                type: 'success',
                text1: 'Logged out successfully',
                position: 'bottom',
            });

            // Delay the navigation to allow the toast message to be shown
            setTimeout(() => {
                props.navigation.navigate('Login');
            }, 10); // 1 second delay

        } catch (error) {
            // Handle the error if needed
            Toast.show({
                type: 'error',
                text1: 'Logout failed',
                text2: 'Please try again later.',
                position: 'bottom',
            });
        }
    };

    return (
        <View style={styles.drawerContent}>
            <Text style={styles.title}>Mocking Bird</Text>
            <Text style={styles.username}>{userData?.user?.username}</Text>

            {/* Add your navigation items */}
            <View style={styles.menuItems}>
                {props.state.routes
                    .filter(route => route.name !== "DailyAttendance" && route.name !== "Login") // Filter out the DailyAttendance route
                    .map((route, index) => (
                        <TouchableOpacity
                            key={route.key}
                            onPress={() => props.navigation.navigate(route.name)}
                        >
                            <Text style={styles.menuItem}>
                                {route.name.replace(/([A-Z])/g, ' $1').trim()}
                            </Text>
                        </TouchableOpacity>
                    ))
                }
            </View>
            {/* Add the Logout button */}
            <TouchableOpacity onPress={handleLogout}>
                <Text style={styles.logoutButton}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
};

const CustomHeader = ({ navigation }) => {
    return (
        <View style={styles.headerContainer}>
            {/* Logo */}
            <Image
                source={require('../app/assets/quickso.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            {/* Drawer Icon */}
            <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
                <Text style={{ fontSize: 25 }}>☰</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    drawerContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#fff',
        marginTop: StatusBar.currentHeight || 0,

    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textTransform: 'capitalize',
        fontFamily: 'Inter_400Regular',

    },
    username: {
        fontSize: 20,
        fontWeight: 'bold',
        textTransform: 'capitalize',
        marginBottom: 40,
        fontFamily: 'Inter_400Regular',

    },

    menuItem: {
        fontSize: 16,
        paddingVertical: 10,
        fontFamily: 'Inter_400Regular',
    },
    drawerStyle: {
        width: 250,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        // paddingTop: 20,
        backgroundColor: '#fff',
        marginTop: StatusBar.currentHeight || 0,
    },
    logo: {
        width: 150,
    },
    logoutButton: {
        fontSize: 16,
        paddingVertical: 10,
        fontFamily: 'Inter_400Regular',
        color: 'red'
    }
});
