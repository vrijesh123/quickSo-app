import AsyncStorage from "@react-native-async-storage/async-storage";

export const clearStorage = async () => {
    try {
        await AsyncStorage.removeItem('userToken');
        console.log('AsyncStorage cleared successfully.');
    } catch (error) {
        console.error('Failed to clear AsyncStorage:', error);
    }
};

export const timeToString = (time) => {
    const date = new Date(time);
    return date.toISOString().split('T')[0];
};