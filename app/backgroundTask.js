// App.js or a dedicated file like backgroundTask.js

import * as TaskManager from 'expo-task-manager';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-location-task';
const GEOFENCE_RADIUS_METERS = 100;

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    if (error) {
        console.error(error);
        return;
    }
    if (data) {
        const { locations } = data;
        const currentLocation = locations[0];

        // Retrieve the stored projects from AsyncStorage
        const projects = JSON.parse(await AsyncStorage.getItem('projects'));
        if (projects && projects.length > 0) {
            projects.forEach(project => {
                const { latitude, longitude } = project.location.data.attributes.coordinates[0];
                const distance = getDistanceFromLatLonInMeters(
                    currentLocation.coords.latitude,
                    currentLocation.coords.longitude,
                    latitude,
                    longitude
                );

                if (distance <= GEOFENCE_RADIUS_METERS) {
                    triggerGeofenceEvent(project);
                }
            });
        }
    }
});

const getDistanceFromLatLonInMeters = (lat1, lon1, lat2, lon2) => {
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

const triggerGeofenceEvent = async (project) => {
    try {
        // Call your API here
        // const response = await axios.post('YOUR_API_ENDPOINT', {
        //     project_id: project.id,
        //     location_name: project.name,
        //     timestamp: new Date().toISOString(),
        // });

        console.log('Geofence event triggered for project:', project);
        // console.log('API response:', response.data);
    } catch (error) {
        console.error('Error triggering geofence event:', error);
    }
};
