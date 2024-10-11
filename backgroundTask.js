import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { getDistanceBetweenPoints } from './app/utils';
import { Platform } from 'react-native';

const LOCATION_TASK_NAME = 'background-location-task';

let checkedInProject = null; // Store checked-in project
let userData = null; // Store user data globally if needed

// Registering background task for location tracking
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Background Task Running',
            body: `Location updated! ${data}`,
        },
        trigger: null,
    });

    if (error) {
        console.error('Location Task Error:', error);
        return;
    }

    if (data) {
        const { locations } = data;
        const location = locations[0]; // Get the latest location

        if (location) {
            const currentCoords = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            if (!checkedInProject) {
                // If not checked in, send attendance
                await sendAttendance(currentCoords);
            } else {
                // Check proximity to project
                const { latitude, longitude, radius } = checkedInProject;
                const distance = getDistanceBetweenPoints(
                    currentCoords.latitude,
                    currentCoords.longitude,
                    latitude,
                    longitude
                );

                if (distance > radius) {
                    // If outside project radius, send checkout
                    await sendCheckout(currentCoords);
                }
            }
        }
    }
});

// Start location tracking in the background
export const startBackgroundLocationTracking = async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status === 'granted') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            distanceInterval: 1, // Update every 1 meter
            timeInterval: 500,   // Update every 500ms
            foregroundService: Platform.OS === 'android' ? {
                notificationTitle: 'Location Tracking Active',
                notificationBody: 'Tracking your location for attendance.',
            } : undefined,
        });
    } else {
        console.error('Background location permission not granted');
    }
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
                    uid: userData?.uid,
                    latitude: currentCoords.latitude,
                    longitude: currentCoords.longitude,
                }),
            }
        );

        const data = await response.json();
        if (data?.check_in) {
            console.log('Check-in successful');
            checkedInProject = {
                id: data?.project?.id,
                latitude: data?.project?.location?.latitude,
                longitude: data?.project?.location?.longitude,
                radius: data?.project?.location?.radius,
            };

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Checked In Successfully',
                    body: 'checkin',
                },
                trigger: null,
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
                    uid: userData?.uid,
                    latitude: currentCoords.latitude,
                    longitude: currentCoords.longitude,
                    check_out: true,
                    out_time: new Date().toTimeString().split(' ')[0],
                }),
            }
        );

        const data = await response.json();
        if (data?.success) {
            checkedInProject = null; // Reset project

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: 'Checked Out Successfully',
                    body: 'checkout',
                },
                trigger: null,
            });
        }
    } catch (error) {
        console.error('Error sending checkout:', error);
    }
};
