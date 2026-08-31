import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || "";

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "plant-watering-tracker-2026.firebaseapp.com",
  projectId: "plant-watering-tracker-2026",
  storageBucket: "plant-watering-tracker-2026.appspot.com",
  messagingSenderId: "358974981913",
  appId: "1:358974981913:web:plantcaretracker"
};

export const app = apiKey ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;

/**
 * Syncs user authentication to Firebase Auth if a valid Web API key is configured.
 */
export async function syncFirebaseUser(email, password = "PlantCare2026!") {
  if (!email || !auth || !apiKey) {
    return null;
  }

  const cleanEmail = email.includes("@") ? email.trim() : `${email.trim()}@plants.local`;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return userCredential.user;
  } catch (signInError) {
    if (
      signInError.code === "auth/user-not-found" ||
      signInError.code === "auth/invalid-credential"
    ) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        return userCredential.user;
      } catch (createError) {
        // Silently catch to prevent console error pollution
      }
    }
  }
  return null;
}
