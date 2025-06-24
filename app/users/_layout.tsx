import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useContext } from "react";
import { AnnouncementsProvider, useAnnouncements } from "../../context/AnnouncementsContext";
import { ThemeContext, ThemeProvider } from "../../context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabLayoutContent() {
  const { unreadCount }: { unreadCount: number } = useAnnouncements();
  const { isDark } = useContext(ThemeContext);
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: isDark ? "#23272b" : "#fff",
          borderTopColor: isDark ? "#444" : "#eee",
          height: 60 + insets.bottom,
          paddingTop: 4,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
        tabBarActiveTintColor: "#1E90FF",
        tabBarInactiveTintColor: isDark ? "#aaa" : "#888",
        headerStyle: {
          backgroundColor: isDark ? "#23272b" : "#fff",
        },
        headerTitleStyle: {
          color: isDark ? "#fff" : "#1E90FF",
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
    <ThemeProvider>
      <AnnouncementsProvider>
        <TabLayoutContent />
      </AnnouncementsProvider>
    </ThemeProvider>
  );
}