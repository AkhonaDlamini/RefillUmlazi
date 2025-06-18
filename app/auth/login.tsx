import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Checkbox, Snackbar } from "react-native-paper";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../config/firebaseConfig";
import { ref, get, set } from "firebase/database";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarColor, setSnackbarColor] = useState("#d32f2f");

  // Load saved credentials
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("savedEmail");
        const savedPassword = await AsyncStorage.getItem("savedPassword");
        if (savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (err) {
        console.error("Failed to load saved credentials", err);
      }
    };
    loadCredentials();
  }, []);

  const showSnackbar = (msg: string, color: string = "#d32f2f") => {
    setSnackbarMsg(msg);
    setSnackbarColor(color);
    setSnackbarVisible(true);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showSnackbar("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      const userData = snapshot.val();

      if (!userData) {
        showSnackbar("User data not found.");
        await auth.signOut();
        setEmail("");
        setPassword("");
        return;
      }

      const { role, displayName } = userData;

      if (rememberMe) {
        await AsyncStorage.setItem("savedEmail", email);
        await AsyncStorage.setItem("savedPassword", password);
      } else {
        await AsyncStorage.removeItem("savedEmail");
        await AsyncStorage.removeItem("savedPassword");
      }

      if (!displayName) {
        const nameFromEmail = email.split("@")[0];
        await set(ref(db, `users/${user.uid}/displayName`), nameFromEmail);
      }

      showSnackbar("Login successful!", "#388e3c");
      setTimeout(() => {
        if (role === "admin") {
          router.replace("/admin/dashboard");
        } else if (role === "user") {
          router.replace("/users/schedules");
        } else {
          showSnackbar("Your account does not have a valid role assigned.");
          auth.signOut();
        }
      }, 1000);
    } catch (error: any) {
let msg = "Sign in failed. Please try again.";      
if (error.code === "auth/user-not-found" || error.code === "auth/invalid-email") {
        msg = "Email not found or invalid.";
        setEmail("");
        setPassword("");
      } else if (error.code === "auth/wrong-password") {
        msg = "Incorrect password.";
        setPassword("");
      }
      showSnackbar(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.appName}>Refill Umlazi</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          keyboardType="email-address"
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

        <View style={styles.optionsRow}>
          <TouchableOpacity
            onPress={() => setRememberMe(!rememberMe)}
            style={styles.rememberMe}
          >
            <Checkbox status={rememberMe ? "checked" : "unchecked"} />
            <Text style={styles.rememberText}>Remember Me</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/auth/forgot")}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.signInButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.signInText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/auth/register")}
          style={styles.backButton}
        >
          <Text style={styles.backText}>Don&#39;t have an account? Register</Text>
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
    flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF", padding: 20,
  },
  appName: {
    fontSize: 26, fontWeight: "bold", color: "#1E90FF", marginBottom: 10,
  },
  subtitle: {
    fontSize: 16, color: "#333", marginBottom: 20,
  },
  card: {
    width: "100%", backgroundColor: "#F8F9FA", padding: 20, borderRadius: 10, elevation: 3,
  },
  label: {
    fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: 5,
  },
  input: {
    height: 40, borderWidth: 1, borderColor: "#DDD", borderRadius: 8, paddingHorizontal: 10,
    marginBottom: 15, backgroundColor: "#FFF", color: "#000",
  },
  passwordContainer: {
    flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#DDD",
    borderRadius: 8, paddingHorizontal: 10, marginBottom: 15, backgroundColor: "#FFF",
  },
  passwordInput: { flex: 1, height: 40, color: "#000" },
  optionsRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15,
  },
  rememberMe: { flexDirection: "row", alignItems: "center" },
  rememberText: { marginLeft: 5, color: "#333" },
  forgotText: { color: "#1E90FF", fontWeight: "bold" },
  signInButton: {
    backgroundColor: "#1E90FF", padding: 12, borderRadius: 8, alignItems: "center",
  },
  signInText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  backButton: { marginTop: 10, alignItems: "center" },
  backText: { color: "#1E90FF" },
});
