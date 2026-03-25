import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router } from "expo-router";

import { useAuth } from "@/context/AuthContext";

function toFriendlyAuthErrorMessage(error: unknown): string {
  const rawMessage =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";

  const rawCode =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  const code = rawCode || rawMessage;
  if (code.includes("auth/invalid-email")) return "邮箱格式不正确。";
  if (code.includes("auth/missing-password")) return "请输入密码。";
  if (code.includes("auth/invalid-credential")) return "邮箱或密码错误。";
  if (code.includes("auth/user-not-found")) return "该邮箱未注册。";
  if (code.includes("auth/wrong-password")) return "密码错误。";
  if (code.includes("auth/too-many-requests"))
    return "尝试次数过多，请稍后再试。";

  return "登录失败，请稍后重试。";
}

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !submitting;
  }, [email, password, submitting]);

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorText(null);

    try {
      Keyboard.dismiss();
      await login(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setErrorText(toFriendlyAuthErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="never"
          >
            <View style={styles.header}>
              <Text style={styles.title}>登录</Text>
              <Text style={styles.subtitle}>使用邮箱与密码登录</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.label}>邮箱</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                placeholderTextColor="#9AA3AF"
                style={styles.input}
                editable={!submitting}
                returnKeyType="next"
              />

              <Text style={[styles.label, styles.mt12]}>密码</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                placeholder="请输入密码"
                placeholderTextColor="#9AA3AF"
                style={styles.input}
                editable={!submitting}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />

              {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

              <Pressable
                onPress={onSubmit}
                disabled={!canSubmit}
                style={({ pressed }) => [
                  styles.button,
                  !canSubmit ? styles.buttonDisabled : null,
                  pressed && canSubmit ? styles.buttonPressed : null,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>登录</Text>
                )}
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>还没有账号？</Text>
                <Link href="/register" asChild>
                  <Pressable disabled={submitting}>
                    <Text style={styles.link}>去注册</Text>
                  </Pressable>
                </Link>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#0B1020" },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 28,
    justifyContent: "flex-start",
  },
  bottomSpacer: { height: 24 },
  header: { marginBottom: 18 },
  title: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: "#FFFFFF",
  },
  subtitle: { marginTop: 6, fontSize: 14, color: "#B7C0D1" },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  label: { fontSize: 13, color: "#D7DDEA", marginBottom: 8 },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: "#FFFFFF",
  },
  mt12: { marginTop: 12 },
  error: { marginTop: 10, color: "#FCA5A5", fontSize: 13 },
  button: {
    marginTop: 14,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  buttonPressed: { transform: [{ scale: 0.99 }] },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  footerRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  footerText: { color: "#B7C0D1" },
  link: { color: "#93C5FD", fontWeight: "700" },
});

