import * as TaskManager from 'expo-task-manager';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { attendanceAPI } from '../apis/api';

const LOCATION_TASK_NAME = 'background-location-task';
const GEOFENCE_RADIUS_METERS = 10;

// This object will keep track of the user's entry times by project ID
let entryTimes = {};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
    console.log('geoooo locccc', data);

    if (error) {
        console.log('geoooo errrrr', error);
        return;
    }
    if (data && data.locations && data.locations.length > 0) {
        const { locations } = data;
        const currentLocation = locations[0];

        // Retrieve the stored projects from AsyncStorage
        const projects = JSON.parse(await AsyncStorage.getItem('projects') || '[]');
        if (Array.isArray(projects) && projects.length > 0) {
            projects.forEach(project => {
                const { latitude, longitude } = project.location.data.attributes.coordinates[0];
                const distance = getDistanceFromLatLonInMeters(
                    currentLocation.coords.latitude,
                    currentLocation.coords.longitude,
                    latitude,
                    longitude
                );

                const projectId = project.id;
                const currentTime = new Date();

                if (distance <= GEOFENCE_RADIUS_METERS) {
                    // User is within the geofence area
                    if (!entryTimes[projectId]) {
                        // User just entered the geofence
                        entryTimes[projectId] = currentTime;
                        console.log(`User entered project ${project.name} at ${entryTimes[projectId]}`);
                    }
                } else {
                    // User is outside the geofence area
                    if (entryTimes[projectId]) {
                        // User just exited the geofence
                        const inTime = entryTimes[projectId];
                        const outTime = currentTime;

                        // Trigger the exit event
                        triggerGeofenceEvent(project, inTime, outTime);

                        // Remove the entry time for this project
                        delete entryTimes[projectId];
                    }
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

const triggerGeofenceEvent = async (project, inTime, outTime) => {
    try {
        // Make the API call with in_time and out_time
        const response = await attendanceAPI.post('', {
            project_id: project.id,
            location: project.location.data.id,
            in_time: inTime.toISOString(),
            out_time: outTime.toISOString(),
        });

        console.log(`Geofence event for project ${project.name}: In at ${inTime}, Out at ${outTime}`);
        console.log('API response:', response);
    } catch (error) {
        console.error('Error triggering geofence event:', error);
    }
};
