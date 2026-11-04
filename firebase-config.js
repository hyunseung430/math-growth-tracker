// Firebase 콘솔 > 프로젝트 설정 > 내 앱 > 웹 앱의 firebaseConfig 값을 복사하세요.
// Firebase 웹 API 키는 프로젝트 식별자이며 DB 접근 권한의 대체 수단이 아닙니다.
// Firestore Security Rules로 특정 UID만 허용해야 합니다.
export const firebaseConfig = {
  apiKey: "AIzaSyADgoYEUxQe5t3_Dyv9Qxvepgx3DjyaO18",
  authDomain: "math-growth-tracker.firebaseapp.com",
  projectId: "math-growth-tracker",
  appId: "1:1004461655944:web:89393317a856fb5e175c3d"
};

// 설정 전에는 브라우저 localStorage를 쓰는 기능 시연 모드로 작동합니다.
// 반드시 위 값을 수정하고 Firebase에 연결한 후에 과제를 제출하세요.
export const isDemoMode = firebaseConfig.apiKey.startsWith("REPLACE_WITH_");
