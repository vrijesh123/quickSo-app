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

export const getDistanceBetweenPoints = (lat1, lon1, lat2, lon2) => {
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