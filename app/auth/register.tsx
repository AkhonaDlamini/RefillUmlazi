import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { auth, db } from "../../config/firebaseConfig"; // Adjust the import path as needed
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // ✅ Expo-compatible
import { Snackbar } from "react-native-paper";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarColor, setSnackbarColor] = useState("#d32f2f");

  const showSnackbar = (msg: string, color: string = "#d32f2f") => {
    setSnackbarMsg(msg);
    setSnackbarColor(color);
    setSnackbarVisible(true);
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showSnackbar("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      showSnackbar("Passwords do not match.");
      setPassword("");
      setConfirmPassword("");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await set(ref(db, `users/${user.uid}`), {
        email,
        role: "user",
        createdAt: new Date().toISOString(),
        location: null,
      });

      showSnackbar("Account created successfully!", "#388e3c");
      setTimeout(() => {
        router.replace("/users/locations");
      }, 1000);
    } catch (error: any) {
      let msg = "Registration failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        msg = "This email is already in use.";
        setEmail("");
      } else if (error.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
        setPassword("");
        setConfirmPassword("");
      }
      showSnackbar(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>Refill Umlazi</Text>
      <Text style={styles.subtitle}>Create your account</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Enter your password"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
            <MaterialCommunityIcons
              name={passwordVisible ? "eye" : "eye-off"}
              size={22}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm your password"
            secureTextEntry={!confirmPasswordVisible}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
            <MaterialCommunityIcons
              name={confirmPasswordVisible ? "eye" : "eye-off"}
              size={22}
              color="#888"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signInButton}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.signInText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/login")} style={styles.backButton}>
          <Text style={styles.backText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
        style={{ backgroundColor: snackbarColor }}
        action={{
          label: "Close",
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
  },
  appName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1E90FF",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#333",
    marginBottom: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#F8F9FA",
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#FFF",
    color: "#000",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#FFF",
  },
  passwordInput: {
    flex: 1,
    height: 40,
    color: "#000",
  },
  signInButton: {
    backgroundColor: "#1E90FF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  signInText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  backButton: {
    marginTop: 10,
    alignItems: "center",
  },
  backText: {
    color: "#1E90FF",
  },
});
