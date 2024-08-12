import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import LoginScreen from "./screens/Login";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Projects from "./screens/Projects";
import { Text, Image, TouchableOpacity, View, StatusBar, Button } from "react-native";

const Drawer = createDrawerNavigator();

export default function AppNavigator() {
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
        <NavigationContainer style={styles.container}>
            <Drawer.Navigator
                initialRouteName={isLoggedIn ? "Projects" : "Login"}
                screenOptions={({ navigation }) => ({
                    header: () => <CustomHeader navigation={navigation} />, // Custom Header
                    drawerPosition: 'right',
                    // headerShown: false,
                })}
            >
                {isLoggedIn ? (
                    <>
                        <Drawer.Screen name="Projects" component={Projects} options={{ title: 'Project' }} />
                    </>
                ) : (
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

const styles = {
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        marginTop: StatusBar.currentHeight || 0,
    },
    logo: {
        width: 150,
    },
};
