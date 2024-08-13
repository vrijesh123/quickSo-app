import AsyncStorage from "@react-native-async-storage/async-storage";

export const clearStorage = async () => {
    try {
        await AsyncStorage.removeItem('userToken');
        console.log('AsyncStorage cleared successfully.');
    } catch (error) {
        console.error('Failed to clear AsyncStorage:', error);
    }
};