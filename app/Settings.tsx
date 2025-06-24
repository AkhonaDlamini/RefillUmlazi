import React, { useContext } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { ThemeContext } from "../context/ThemeContext";

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#FFF" }]}>
      <Text style={[styles.title, { color: isDark ? "#FFF" : "#1E90FF" }]}>Settings</Text>
      <View style={styles.option}>
        <Text style={[styles.label, { color: isDark ? "#FFF" : "#000" }]}>Dark Mode</Text>
        <Switch value={isDark} onValueChange={toggleTheme} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: '#1E90FF' },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  label: { fontSize: 18 },
});