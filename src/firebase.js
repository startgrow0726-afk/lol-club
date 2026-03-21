// ============================================
// Firebase 설정 파일
// 아래 firebaseConfig의 값을 본인의 Firebase 설정으로 교체하세요!
// ============================================

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue } from "firebase/database";

// ★★★ 여기를 본인의 Firebase 설정으로 교체하세요 ★★★
const firebaseConfig = {
  apiKey: "AIzaSyBEs-EtTt-a2guHIX-F1uLiWLfArG3QxGY",
  authDomain: "lol-club-1fd08.firebaseapp.com",
  databaseURL: "https://lol-club-1fd08-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "lol-club-1fd08",
  storageBucket: "lol-club-1fd08.firebasestorage.app",
  messagingSenderId: "454882670307",
  appId: "1:454882670307:web:926bc39b5b53a386c2b7d6",
  measurementId: "G-DY3DNJQYJR"
};
// ★★★ 위를 본인의 Firebase 설정으로 교체하세요 ★★★

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 데이터 저장
export async function saveData(path, data) {
  try {
    await set(ref(db, path), data);
    return true;
  } catch (e) {
    console.error("Firebase save error:", e);
    return false;
  }
}

// 데이터 1회 읽기
export async function loadData(path) {
  try {
    const snapshot = await get(ref(db, path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (e) {
    console.error("Firebase load error:", e);
    return null;
  }
}

// 실시간 구독 (다른 사람이 바꾸면 바로 반영)
export function subscribeData(path, callback) {
  const unsubscribe = onValue(ref(db, path), (snapshot) => {
    callback(snapshot.exists() ? snapshot.val() : null);
  });
  return unsubscribe;
}
