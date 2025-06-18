import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebaseConfig";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handlePasswordReset = () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    // Send password reset email
    sendPasswordResetEmail(auth, email)
    .then(() => {
        Alert.alert("Success", "A reset link has been sent to your email.");
        router.push("/auth/login"); // Navigate back to login after success
    })
    .catch((error) => {
        let errorMessage = "Something went wrong. Please try again.";
        if (error.code === "auth/invalid-email"){
            errorMessage = "Invalid email address.";
        } else if (error.code === "auth/user-not-found"){
            errorMessage = "No user found with this email address.";
        }
        Alert.alert("Error", errorMessage);
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.instruction}>
          Enter your email address and we will send you a link to reset your password.
        </Text>

        {/* Email Input */}
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {/* Send Reset Link Button */}
        <TouchableOpacity style={styles.sendButton} onPress={handlePasswordReset}>
          <Text style={styles.sendButtonText}>Send Reset Link</Text>
        </TouchableOpacity>

        {/* Back to Login */}
        <TouchableOpacity onPress={() => router.push("/auth/login")} style={styles.backButton}>
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF", padding: 20 },
  card: { width: "100%", backgroundColor: "#F8F9FA", padding: 20, borderRadius: 10, elevation: 3 },
  title: { fontSize: 22, fontWeight: "bold", color: "#1E90FF", textAlign: "center", marginBottom: 10 },
  instruction: { fontSize: 14, color: "#333", textAlign: "center", marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "bold", color: "#333", marginBottom: 5 },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: "#FFF",
  },
  sendButton: { backgroundColor: "#1E90FF", padding: 12, borderRadius: 8, alignItems: "center" },
  sendButtonText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  backButton: { marginTop: 10, alignItems: "center" },
  backText: { color: "#1E90FF" },
});
