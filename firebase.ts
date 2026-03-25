// Import the functions you need from the SDKs you need
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Your web app's Firebase configuration
const firebaseConfig = {
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
