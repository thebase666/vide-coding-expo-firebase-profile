import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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

import * as ImagePicker from "expo-image-picker";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/firebase";

type UserProfile = {
  uid: string;
  email?: string;
  nickname?: string;
  avatarUrl?: string;
};

function nicknameFromEmail(email?: string | null) {
  if (!email) return "User";
  return email.split("@")[0] || "User";
}

async function uriToBlob(uri: string): Promise<Blob> {
  const res = await fetch(uri);
  return await res.blob();
}

export default function ProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [nicknameDraft, setNicknameDraft] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const userDocRef = useMemo(() => {
    if (!user?.uid) return null;
    return doc(db, "users", user.uid);
  }, [user?.uid]);

  useEffect(() => {
    // 保护函数：没登录就不建立侦听
    if (!userDocRef || !user?.uid) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);

    const currentUid = user.uid;
    const currentEmail = user.email;
    const unsub = onSnapshot(
      userDocRef,
      (snap) => {
        const data = (snap.data() ?? {}) as Partial<UserProfile>;
        const merged: UserProfile = {
          uid: currentUid,
          email: currentEmail ?? data.email,
          nickname: data.nickname ?? nicknameFromEmail(currentEmail),
          avatarUrl: data.avatarUrl ?? "",
        };
        setProfile(merged);
        setNicknameDraft(merged.nickname ?? "");
        setLoadingProfile(false);
      },
      () => {
        setLoadingProfile(false);
      },
    );

    return unsub;
  }, [user, userDocRef]);

  const displayName = useMemo(() => {
    return profile?.nickname ?? nicknameFromEmail(user?.email);
  }, [profile?.nickname, user?.email]);

  async function onSaveNickname() {
    if (!userDocRef || !user?.uid) return;
    const next = nicknameDraft.trim();
    if (!next) {
      Alert.alert("提示", "昵称不能为空。");
      return;
    }
    setSavingNickname(true);
    try {
      Keyboard.dismiss();
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          email: user.email ?? "",
          nickname: next,
        },
        { merge: true },
      );
    } finally {
      setSavingNickname(false);
    }
  }

  async function ensureMediaLibraryPermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      Alert.alert("需要权限", "请允许访问相册以选择头像。");
      return false;
    }
    return true;
  }

  async function onPickFromAlbum() {
    const ok = await ensureMediaLibraryPermission();
    if (!ok) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;
    setLocalAvatarUri(asset.uri);
  }

  async function onUploadSelectedAvatar() {
    if (!userDocRef || !user?.uid) return;
    if (!localAvatarUri) {
      Alert.alert("提示", "请先选择一张图片。");
      return;
    }

    setUploadingAvatar(true);
    try {
      const blob = await uriToBlob(localAvatarUri);
      const objectRef = ref(storage, `avatars/${user.uid}/${Date.now()}.jpg`);
      await uploadBytes(objectRef, blob);
      const url = await getDownloadURL(objectRef);

      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          avatarUrl: url,
        },
        { merge: true },
      );

      setAvatarModalVisible(false);
      setLocalAvatarUri(null);
    } catch (e) {
      Alert.alert(
        "上传失败",
        String((e as { message?: string })?.message ?? e),
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="never"
          >
            <Text style={styles.title}>Profile</Text>

            {!user ? (
              <Text style={styles.muted}>未登录</Text>
            ) : loadingProfile ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator />
                <Text style={styles.muted}>加载中…</Text>
              </View>
            ) : (
              <>
                <View style={styles.avatarRow}>
                  <View style={styles.avatarWrap}>
                    {profile?.avatarUrl ? (
                      <Image
                        source={{ uri: profile.avatarUrl }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarPlaceholderText}>
                          {displayName.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.avatarMeta}>
                    <Text style={styles.name}>{displayName}</Text>
                    <Text style={styles.muted}>{user.email}</Text>
                    <Pressable
                      onPress={() => setAvatarModalVisible(true)}
                      disabled={savingNickname || uploadingAvatar}
                      style={({ pressed }) => [
                        styles.linkButton,
                        pressed ? styles.linkButtonPressed : null,
                      ]}
                    >
                      <Text style={styles.linkButtonText}>修改头像</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.label}>昵称</Text>
                  <TextInput
                    value={nicknameDraft}
                    onChangeText={setNicknameDraft}
                    placeholder="输入昵称"
                    placeholderTextColor="#9AA3AF"
                    style={styles.input}
                    editable={!savingNickname && !uploadingAvatar}
                    returnKeyType="done"
                    onSubmitEditing={onSaveNickname}
                  />

                  <Pressable
                    onPress={onSaveNickname}
                    disabled={savingNickname || uploadingAvatar}
                    style={({ pressed }) => [
                      styles.button,
                      (savingNickname || uploadingAvatar) &&
                        styles.buttonDisabled,
                      pressed &&
                        !(savingNickname || uploadingAvatar) &&
                        styles.buttonPressed,
                    ]}
                  >
                    {savingNickname ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>保存昵称</Text>
                    )}
                  </Pressable>
                </View>

                <Modal
                  visible={avatarModalVisible}
                  transparent
                  animationType="fade"
                  onRequestClose={() => setAvatarModalVisible(false)}
                >
                  <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setAvatarModalVisible(false)}
                  >
                    <Pressable style={styles.modalCard} onPress={() => {}}>
                      <Text style={styles.modalTitle}>修改头像</Text>
                      <Text style={styles.mutedSmall}>
                        从相册选择一张图片，然后上传到 Storage 并保存 URL 到 Firestore。
                      </Text>

                      <View style={styles.modalPreviewRow}>
                        <View style={styles.avatarWrap}>
                          {localAvatarUri ? (
                            <Image
                              source={{ uri: localAvatarUri }}
                              style={styles.avatar}
                            />
                          ) : profile?.avatarUrl ? (
                            <Image
                              source={{ uri: profile.avatarUrl }}
                              style={styles.avatar}
                            />
                          ) : (
                            <View
                              style={[styles.avatar, styles.avatarPlaceholder]}
                            >
                              <Text style={styles.avatarPlaceholderText}>
                                {displayName.slice(0, 1).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.modalPreviewMeta}>
                          <Text style={styles.muted}>
                            {localAvatarUri ? "已选择新头像" : "未选择"}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.modalButtonsRow}>
                        <Pressable
                          onPress={onPickFromAlbum}
                          disabled={uploadingAvatar}
                          style={({ pressed }) => [
                            styles.buttonSecondary,
                            uploadingAvatar && styles.buttonDisabled,
                            pressed && !uploadingAvatar && styles.buttonPressed,
                          ]}
                        >
                          <Text style={styles.buttonSecondaryText}>打开相册</Text>
                        </Pressable>

                        <Pressable
                          onPress={onUploadSelectedAvatar}
                          disabled={uploadingAvatar || !localAvatarUri}
                          style={({ pressed }) => [
                            styles.button,
                            (uploadingAvatar || !localAvatarUri) &&
                              styles.buttonDisabled,
                            pressed &&
                              !(uploadingAvatar || !localAvatarUri) &&
                              styles.buttonPressed,
                          ]}
                        >
                          {uploadingAvatar ? (
                            <ActivityIndicator color="#FFFFFF" />
                          ) : (
                            <Text style={styles.buttonText}>上传</Text>
                          )}
                        </Pressable>
                      </View>
                    </Pressable>
                  </Pressable>
                </Modal>
              </>
            )}
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
    paddingTop: 18,
    paddingBottom: 28,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.3,
    color: "#FFFFFF",
  },
  muted: { color: "#B7C0D1" },
  mutedSmall: { color: "#B7C0D1", fontSize: 12, marginTop: -4 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: { alignItems: "center", justifyContent: "center" },
  avatarPlaceholderText: { color: "#FFFFFF", fontSize: 28, fontWeight: "900" },
  avatarMeta: { flex: 1, gap: 2 },
  name: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  card: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    gap: 10,
  },
  label: { fontSize: 13, color: "#D7DDEA" },
  input: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: "#FFFFFF",
  },
  inputMultiline: { minHeight: 92, textAlignVertical: "top" },
  button: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondary: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    flex: 1,
  },
  buttonSecondaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  buttonDisabled: { opacity: 0.6 },
  buttonPressed: { transform: [{ scale: 0.99 }] },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },

  linkButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(147,197,253,0.14)",
    borderWidth: 1,
    borderColor: "rgba(147,197,253,0.28)",
  },
  linkButtonPressed: { opacity: 0.9 },
  linkButtonText: { color: "#93C5FD", fontWeight: "800" },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 18,
    justifyContent: "center",
  },
  modalCard: {
    borderRadius: 18,
    padding: 16,
    backgroundColor: "#0B1020",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 12,
  },
  modalTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "900" },
  modalPreviewRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  modalPreviewMeta: { flex: 1 },
  modalButtonsRow: { flexDirection: "row", gap: 10, alignItems: "center" },
});
