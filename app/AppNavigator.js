import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import LoginScreen from "./screens/Login";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Projects from "./screens/Projects";
import { Text, Image, TouchableOpacity, View, StatusBar, Button, StyleSheet } from "react-native";
import DailyTasks from "./screens/DailyTasks";
import { useSelector } from "react-redux";

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
                {!userData?.user && (
                    <Drawer.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                )}
            </Drawer.Navigator>
        </NavigationContainer>
    );
}

const CustomDrawerContent = (props) => {
    const userData = useSelector((state) => state?.user); // Destructuring state for clarity

    return (
        <View style={styles.drawerContent}>
            <Text style={styles.title}>Mocking Bird</Text>
            <Text style={styles.username}>{userData?.user?.username}</Text>

            {/* Add your navigation items */}
            <View style={styles.menuItems}>
                {props.state.routes.map((route, index) => (
                    <TouchableOpacity
                        key={route.key}
                        onPress={() => props.navigation.navigate(route.name)}
                    >
                        <Text style={styles.menuItem}>
                            {route.name.replace(/([A-Z])/g, ' $1').trim()}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
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
});
