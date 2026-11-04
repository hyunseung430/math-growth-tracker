# Math Growth Tracker — 공통수학2 학습 성장 기록장

조선대학교 교육대학원 AI융합교육 전공 중간 대체 과제용 웹앱 소스코드입니다.

## 1. 웹앱이 하는 일
- 익명 학습자 코드(S001), 공통수학2 단원, 정답률, 자신감, 학습 시간, AI 코스웨어 활용 여부, 학습 소감 입력
- 입력값 검증 후 Firebase Cloud Firestore에 저장 및 실시간 조회
- 기록 삭제, 단원·익명코드 검색, CSV 다운로드
- 평균 정답률·자신감·학습시간 통계 및 최근 정답률 꺾은선그래프
- Firebase Authentication 이메일·비밀번호 로그인
- Firestore 규칙으로 오직 승인된 교사 UID 1개만 DB 읽기·쓰기 허용
- GitHub Pages 정적 배포

## 2. 실행 원리 — 아주 쉽게
1. 선생님이 웹페이지에서 `S001`, `함수`, `75%`를 입력하고 **저장**을 누릅니다.
2. `app.js`가 입력값을 확인한 다음 로그인 상태로 Firebase에 기록을 전송합니다.
3. Firestore는 `firestore.rules`에 따라 승인된 계정인지 확인합니다.
4. 승인이 되면 데이터를 저장하고, 웹페이지가 다시 데이터를 받아 그래프와 목록을 갱신합니다.
5. 다른 계정은 DB에 접속하더라도 규칙 때문에 자료를 읽거나 수정할 수 없습니다.

## 3. 초기 준비
- **Firebase**: https://console.firebase.google.com/
- **GitHub**: https://github.com/
- 같은 GitHub 저장소의 `index.html`, `app.js`, `style.css`, `firebase-config.js`가 사이트를 구성합니다.
- `firestore.rules`는 GitHub에 올릴 수 있으나 **Firebase 콘솔에 별도로 붙여넣어 '게시'해야 실제 적용됩니다**.

## 4. Firebase DB 만들기
1. Firebase 콘솔에서 새 프로젝트 만들기 (`math-growth-tracker` 등).
2. 프로젝트 개요 오른쪽의 **웹 앱(</>)** 등록.
3. 표시된 `firebaseConfig` 값들을 `firebase-config.js`에 복사합니다. **정확히 복사할 항목**: `apiKey`, `authDomain`, `projectId`, `appId`.
4. 왼쪽 `빌드 > Firestore Database > 데이터베이스 만들기` 선택. 운영 환경 권한을 갖춘 DB를 만듭니다. 지역은 적절한 지원 지역을 선택합니다. **테스트 모드의 공개 규칙을 계속 사용하면 안 됩니다.**
5. `빌드 > Authentication > 시작하기 > Sign-in method > 이메일/비밀번호` 사용 설정.
6. `Authentication > Users > 사용자 추가`에서 **선생님 계정 1개** 등록(이메일, 강력한 비밀번호).
7. `Authentication > Users`에서 계정의 **UID**를 복사합니다.
8. `firestore.rules`의 `REPLACE_WITH_APPROVED_FIREBASE_UID`를 이 UID로 교체합니다.
9. `Firestore Database > 규칙(Rules)`에 전체 내용을 복사하여 붙여넣고 **게시(Publish)** 합니다. (GitHub에 올리기만 해서는 보안 규칙이 적용되지 않습니다.)
10. `Authentication > Settings > Authorized domains`에 `내계정.github.io` 도메인을 추가합니다(로그인 과정에서 도메인 관련 오류가 나타나는 경우 특히 확인). 로그인 방식에 따라 적용 방식은 달라질 수 있습니다.

## 5. 리퍼러 제한(교수님 조건)
1. Google Cloud Console https://console.cloud.google.com/apis/credentials 접속, Firebase 프로젝트 선택.
2. 실제 웹앱 설정에 사용한 API 키를 선택.
3. `Application restrictions` → `Websites (HTTP referrers)` 선택.
4. 허용할 사이트 도메인에 `https://내계정.github.io` 및 `https://내계정.github.io/*` 추가(프로젝트별 **경로**가 아니라 호스트 기준으로 먼저 시험).
5. `API restrictions`에는 Firebase에서 사용하는 API만 허용하고, 설정 후 **로그인·DB 저장을 다시 테스트**합니다. 너무 좁게 제한하면 Firebase 로그인 오류가 발생할 수 있습니다.
6. 중요: **리퍼러 제한은 계정 권한 보호가 아닙니다.** DB 내용 보호는 `firestore.rules`가 담당합니다. Firebase 설정값이나 API 키는 비밀번호가 아닙니다.

## 6. GitHub Pages 배포
1. GitHub 로그인 → `New repository` 클릭.
2. 이름을 `math-growth-tracker`로 지정. GitHub Free의 Pages 배포가 가능한 공개 저장소(Public)를 권장합니다. **코드만 공개하고 실제 학생 데이터는 올리지 않습니다.**
3. 이 폴더에서 `index.html`, `app.js`, `style.css`, `firebase-config.js`, `firestore.rules`, `README.md`, `.nojekyll`을 저장소 **최상위 경로**에 업로드합니다. ZIP 자체를 그대로 업로드하면 GitHub Pages가 파일을 인식하지 못합니다.
4. `Settings > Pages` 이동 → `Build and deployment > Source: Deploy from a branch` → `main` / `/(root)` → `Save`.
5. 안내된 주소 `https://내계정.github.io/math-growth-tracker/` 접속.
6. 계정 로그인 → S001 예시 기록 저장 → 새로고침 후 자료 유지 확인 → CSV 내보내기 테스트.

## 7. 테스트 체크리스트
- [ ] 실제 모드 배너에 `Firebase 연동 모드`가 표시된다(체험 모드가 아님)
- [ ] 허가된 계정으로 로그인할 수 있다
- [ ] S001 예시 기록이 등록되고 그래프 및 표가 변한다
- [ ] 새로고침 후 등록 기록이 그대로 보인다(실제 DB에 저장됐다는 증거)
- [ ] 해당 기록이 Firebase Firestore 콘솔의 `learningRecords`에서 보인다
- [ ] 검색·단원 필터·CSV 내보내기가 동작한다
- [ ] 기록 삭제가 동작한다
- [ ] 비로그인 상태에서 DB 기록이 보이지 않는다
- [ ] 타 계정 로그인 시 기록 조회가 `permission-denied`로 거부된다
- [ ] Google Cloud에서 HTTP referrer 제한을 설정했다
- [ ] GitHub Pages 배포 주소가 정상적으로 열린다

## 8. 시연 동선(교수님께 보여주기)
1. GitHub Pages 배포 주소를 연다. 로그인 화면 확인.
2. 승인된 계정으로 로그인한다.
3. `S001`, `함수`, 정답률 65%, 자신감 3점, AI 활용 체크 후 저장한다.
4. 같은 코드를 활용해 두 번째 기록(정답률 85%, 자신감 4점)을 추가한다.
5. 그래프와 평균이 변한 것을 설명한다.
6. Firebase Console에서 실제 DB에 두 기록이 저장된 화면을 보여준다.
7. 보안 규칙에서 승인 UID와 기타 접근 차단을 보여준다.
8. GitHub Settings > Pages에서 배포 주소를 보여준다.

## 9. 자주 발생하는 오류
- **체험 모드로만 나옴**: `firebase-config.js`의 REPLACE 값이 남아 있음.
- **로그인이 안 됨**: Authentication 이메일/비밀번호 공급자가 꺼져 있거나 Users에 계정이 없음. API 키 제한을 너무 좁게 지정했는지도 확인.
- **permission-denied**: `firestore.rules`의 승인 UID가 실제 Firebase Authentication UID와 다른 경우가 많음. 게시 여부도 확인.
- **사이트는 보이지만 기능이 안 됨**: GitHub 저장소의 최상위에 파일이 배치됐는지, F12 개발자 콘솔에 404/SDK 오류가 있는지 확인.
- **새로고침 후 내용 사라짐**: 체험 모드이거나 저장 실패. Firestore 콘솔에서 데이터 존재 여부 확인.

## 10. 개인정보 및 연구윤리
- 실명, 학번, 연락처, 상담기록, 공식 성적 등을 입력하지 마세요. 앱은 S001 같은 비식별 코드만 받습니다.
- 코드와 학생 신원을 연결하는 별도 대응표가 있다면 공개 저장소나 Firebase에 올리지 말고 학교 내부 규정을 따르세요.
- 실제 학생 자료 수집·연구 분석은 학교 및 대학원 연구윤리·개인정보 지침을 먼저 확인해야 합니다. 과제 시연은 가상 데이터 S001 등으로 충분합니다.
- 평균 정답률 증가는 학습 효과의 **인과관계 입증**이 아닙니다. 이 프로그램은 학습 경향을 기록해 시각화하는 도구입니다.

## 11. 공식 참고 문서
- Firebase Security Rules: https://firebase.google.com/docs/firestore/security/rules-conditions
- Firebase 웹 SDK: https://firebase.google.com/docs/web/learn-more
- Firebase API 키: https://firebase.google.com/docs/projects/api-keys
- Google Cloud API 키 리퍼러 제한: https://docs.cloud.google.com/docs/authentication/api-keys
- GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
