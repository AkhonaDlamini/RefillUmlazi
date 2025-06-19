import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { get, ref, set } from "firebase/database";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, Platform, StyleSheet, View, Alert } from "react-native";
import * as Notifications from "expo-notifications";
import { auth, db } from "../config/firebaseConfig";
import * as Device from "expo-device";

 Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true, // Add this property
    shouldShowList: true, // Add this property
  }),
});


// Configure foreground behavior for notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true, // Add this property
    shouldShowList: true, // Add this property
  }),
});
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true, // Add this property
    shouldShowList: true, // Add this property
  }),
});Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true, // Add this property
    shouldShowList: true, // Add this property
  }),
});

export default function IndexScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Register device for push notifications and save token
 /* async function registerForPushNotificationsAsync(userId: string) {
    if (!Device.isDevice) {
      Alert.alert("Push notifications only work on physical devices");
      return;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      Alert.alert("Permission not granted for notifications");
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await set(ref(db, `users/${userId}/expoPushToken`), token);

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  }*/

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const start = Date.now();

      if (user) {
        try {
          //await registerForPushNotificationsAsync(user.uid);

          const roleSnap = await get(ref(db, `users/${user.uid}/role`));
          const role = roleSnap.val();

          if (role === "admin") {
            router.replace("/admin/dashboard");
          } else if (role === "user") {
            const loc = await AsyncStorage.getItem("selectedLocation");
            router.replace(loc ? "/users/schedules" : "/users/locations");
          } else {
            await auth.signOut();
            router.replace("/auth/login");
          }
        } catch (e) {
          console.error("Auth/navigation error", e);
          await auth.signOut();
          router.replace("/auth/login");
        }
      } else {
        router.replace("/auth/login");
      }

      const elapsed = Date.now() - start;
      if (elapsed < 3000) {
        setTimeout(() => setLoading(false), 3000 - elapsed);
      } else {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [router]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
});
