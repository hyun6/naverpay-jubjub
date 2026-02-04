# NaverPay JubJub CLI

네이버 페이 포인트 수집 자동화 CLI 도구입니다.

## 설정

1. 의존성 설치:
   ```bash
   npm install
   ```

2. `.env.example`을 `.env`로 복사하고 계정 정보를 입력:
   ```bash
   cp .env.example .env
   ```

   **환경변수:**
   - `NAVER_ID1`, `NAVER_PASSWORD1`: 첫 번째 네이버 계정
   - `NAVER_ID2`, `NAVER_PASSWORD2`: 두 번째 네이버 계정
   - `CONCURRENCY`: (선택) 동시에 열 탭 수 제한 (미설정 시 전체 병렬 처리)

## 실행

```bash
npm start -- <target_url>
```

**예시:**
```bash
npm start -- https://damoang.net/economy/53800
```

## 종료 코드

- `0`: 모든 계정 처리 성공
- `1`: 하나 이상의 계정 처리 실패
