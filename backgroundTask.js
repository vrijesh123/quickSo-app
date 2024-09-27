import * as TaskManager from 'expo-task-manager';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { attendanceAPI } from './apis/api';
import { Log } from 'expo';
import * as Notifications from 'expo-notifications';
import { v4 as uuidv4 } from "uuid";

const LOCATION_TASK_NAME = 'background-location-task';
const GEOFENCE_RADIUS_METERS = 15;

// This object will keep track of the user's entry times by project ID
let entryTimes = {};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Background Task Running',
            body: 'Location updated!',
        },
        trigger: null,
    });

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
                    18.9612344,
                    72.8236589,
                    18.9612344,
                    72.8236589
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

// const triggerGeofenceEvent = async (project, inTime, outTime) => {
//     try {
//         const response = await attendanceAPI.post('', {
//             project_id: project.id,
//             location: project.location.data.id,
//             in_time: inTime.toISOString(),
//             out_time: outTime.toISOString(),
//         });

//         console.log(`Geofence event for project ${project.name}: In at ${inTime}, Out at ${outTime}`);
//         console.log('API response:', response);
//     } catch (error) {
//         console.error('Error triggering geofence event:', error);

//         // Retry mechanism for failed API requests
//         setTimeout(() => {
//             triggerGeofenceEvent(project, inTime, outTime);
//         }, 5000);  // Retry after 5 seconds
//     }
// };

const triggerGeofenceEvent = async (project, inTime, outTime) => {
    try {
        const response = await fetch('https://uat-api.quickso.in/api/attendances/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Include any necessary headers, such as authorization tokens
            },
            body: JSON.stringify({
                "attendance_type": 1,
                "location": 4,
                "shift": 1,
                "date": "2024-09-24T09:45:56.095Z",
                "employee": 28,
                "in_time": "02:00:00.835",
                "out_time": "06:00:00.992",
                "description": "",
                "uid": uuidv4()
            }),
        });

        const data = await response.json();
        console.log(`Geofence event for project ${project.name}:`, data);
    } catch (error) {
        console.error('Error triggering geofence event:', error);
    }
};


// import * as TaskManager from 'expo-task-manager';
// import * as FileSystem from 'expo-file-system';

// const LOCATION_TASK_NAME = 'background-location-task';
// const GEOFENCE_RADIUS_METERS = 10;
// const ENTRY_TIMES_FILE = `${FileSystem.documentDirectory}entryTimes.json`;

// TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
//   if (error) {
//     console.error('Location task error:', error);
//     return;
//   }
//   if (data) {
//     const { locations, projectData } = data;
//     if (locations && locations.length > 0) {
//       const currentLocation = locations[0];
//       const entryTimes = await loadEntryTimes();

//       for (const project of projectData) {
//         const { latitude, longitude } = project.location.data.attributes.coordinates[0];
//         const distance = getDistanceFromLatLonInMeters(
//           currentLocation.coords.latitude,
//           currentLocation.coords.longitude,
//           latitude,
//           longitude
//         );

//         const projectId = project.id;
//         const currentTime = new Date();

//         if (distance <= GEOFENCE_RADIUS_METERS) {
//           if (!entryTimes[projectId]) {
//             entryTimes[projectId] = currentTime;
//             await saveEntryTimes(entryTimes);
//             console.log(`User entered project ${project.name} at ${currentTime}`);
//           }
//         } else {
//           if (entryTimes[projectId]) {
//             const inTime = entryTimes[projectId];
//             const outTime = currentTime;
//             await triggerGeofenceEvent(project, inTime, outTime);
//             delete entryTimes[projectId];
//             await saveEntryTimes(entryTimes);
//           }
//         }
//       }
//     }
//   }
// });

// const loadEntryTimes = async () => {
//   try {
//     const data = await FileSystem.readAsStringAsync(ENTRY_TIMES_FILE);
//     return JSON.parse(data);
//   } catch (error) {
//     return {};
//   }
// };

// const saveEntryTimes = async (entryTimes) => {
//   await FileSystem.writeAsStringAsync(ENTRY_TIMES_FILE, JSON.stringify(entryTimes));
// };



