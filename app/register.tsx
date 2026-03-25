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
  if (code.includes("auth/email-already-in-use")) return "该邮箱已被注册。";
  if (code.includes("auth/weak-password")) return "密码太弱，请至少 6 位。";
  if (code.includes("auth/missing-password")) return "请输入密码。";
  if (code.includes("auth/too-many-requests"))
    return "请求过于频繁，请稍后再试。";

  return "注册失败，请稍后重试。";
}

export default function RegisterPage() {
  const { register } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (email.trim().length === 0) return false;
    if (password.length === 0) return false;
    if (confirmPassword.length === 0) return false;
    if (password !== confirmPassword) return false;
    return true;
  }, [email, password, confirmPassword, submitting]);

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorText(null);

    try {
      Keyboard.dismiss();
      await register(email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setErrorText(toFriendlyAuthErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  const passwordMismatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

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
              <Text style={styles.title}>注册</Text>
              <Text style={styles.subtitle}>创建一个新账号</Text>
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
                autoComplete="password-new"
                placeholder="至少 6 位"
                placeholderTextColor="#9AA3AF"
                style={styles.input}
                editable={!submitting}
                returnKeyType="next"
              />

              <Text style={[styles.label, styles.mt12]}>确认密码</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="password"
                placeholder="再次输入密码"
                placeholderTextColor="#9AA3AF"
                style={[
                  styles.input,
                  passwordMismatch ? styles.inputDanger : null,
                ]}
                editable={!submitting}
                returnKeyType="done"
                onSubmitEditing={onSubmit}
              />

              {passwordMismatch ? (
                <Text style={styles.hintDanger}>两次输入的密码不一致。</Text>
              ) : (
                <Text style={styles.hint}>提示：密码至少 6 位。</Text>
              )}

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
                  <Text style={styles.buttonText}>创建账号</Text>
                )}
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>已有账号？</Text>
                <Link href="/login" asChild>
                  <Pressable disabled={submitting}>
                    <Text style={styles.link}>去登录</Text>
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
  // 顶部留白不要太大，避免内容过于靠下
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
  inputDanger: { borderColor: "rgba(252,165,165,0.9)" },
  mt12: { marginTop: 12 },
  hint: { marginTop: 8, fontSize: 12, color: "#B7C0D1" },
  hintDanger: { marginTop: 8, fontSize: 12, color: "#FCA5A5" },
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

