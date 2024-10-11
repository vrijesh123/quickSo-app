// import { StatusBar } from 'expo-status-bar';
// import { StyleSheet, Text, View } from 'react-native';

// export default function App() {
//   return (
//     <View style={styles.container}>
//       <Text>Open up App.j your appx!</Text>
//       <Text>Heloox!</Text>

//       <StatusBar style="auto" />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
// });

import './backgroundTask.js'; // Import the TaskManager setup
import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { persistor, store } from "./app/store";
import AppNavigator from "./app/AppNavigator";
import AppLoading from "expo-app-loading";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter'; // import the font variants you need
import { PersistGate } from "redux-persist/integration/react";
import Toast from 'react-native-toast-message';
import { startBackgroundLocationTracking } from './backgroundTask.js';

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  // Move the useEffect Hook before the return statement
  useEffect(() => {
    if (fontsLoaded) {
      startBackgroundLocationTracking();
    }
  }, [fontsLoaded]); // Add fontsLoaded to the dependency array

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppNavigator />
        <Toast />
      </PersistGate>
    </Provider>
  );
}

