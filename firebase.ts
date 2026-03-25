// Import the functions you need from the SDKs you need
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC3vOVLYDydAbXqJENCyKuHiUbdBjsxpcQ",
  authDomain: "expo-firebase1-a5071.firebaseapp.com",
  projectId: "expo-firebase1-a5071",
  storageBucket: "expo-firebase1-a5071.firebasestorage.app",
  messagingSenderId: "652611285071",
  appId: "1:652611285071:web:1c3d68b94995ef4a373a3a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

type ReactNativePersistenceFn = (
  storage: typeof AsyncStorage,
) => FirebaseAuth.Persistence;

export const auth =
  Platform.OS === "web"
    ? FirebaseAuth.getAuth(app)
    : (() => {
        const getReactNativePersistence = (
          FirebaseAuth as unknown as {
            getReactNativePersistence?: ReactNativePersistenceFn;
          }
        ).getReactNativePersistence;

        try {
          return FirebaseAuth.initializeAuth(app, {
            persistence: getReactNativePersistence?.(AsyncStorage),
          });
        } catch {
          // Fallback when Auth was already initialized (e.g. Fast Refresh).
          return FirebaseAuth.getAuth(app);
        }
      })();
