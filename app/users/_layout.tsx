import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { AnnouncementsProvider, useAnnouncements } from "../../context/AnnouncementsContext";
import React from "react";

function TabLayoutContent() {
  const { unreadCount }: { unreadCount: number } = useAnnouncements();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false, // Hide labels for a cleaner look
        tabBarActiveTintColor: "#1E90FF",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: {
          height: Platform.OS === "android" ? 48 : 60, // Reduce height
          paddingTop: 4,
          paddingBottom: Platform.OS === "android" ? 2 : 6, // Less bottom padding
        },
      }}
    >
      <Tabs.Screen
        name="schedules"
        options={{
          title: "Schedules",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="locations"
        options={{
          title: "Locations",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="refill-stations"
        options={{
          title: "Stations",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="water-outline" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: "Updates",
          tabBarBadge: unreadCount > 0 ? unreadCount.toString() : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size + 2} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size + 2} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <AnnouncementsProvider>
      <TabLayoutContent />
    </AnnouncementsProvider>
  );
}
