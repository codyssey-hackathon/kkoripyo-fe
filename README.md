# kkoripyo-fe

## 화면 흐름

메인(`/`)에서 Instagram 아이디를 입력하고 제출하면 `/?handle=아이디`에서 스트리밍 답변을 확인할 수 있습니다. `새 분석 시작`을 누르면 입력 화면으로 돌아갑니다. 기존 `/streaming` 주소도 메인으로 이동합니다.

현재는 실제 계정 조회 없이 가상의 콘텐츠를 이용한 예시 분석을 제공합니다. 입력한 아이디는 결과 화면과 저장 파일 이름에 반영되며, 백엔드 분석 요청은 아직 전송하지 않습니다.

## 환경 변수

로컬 개발을 시작하기 전에 예시 파일을 복사합니다.

```sh
cp .env.example .env.local
npm run dev
```

개발 서버와 `npm run preview`는 모두 `http://localhost:3000`을 사용합니다. 포트가 이미 사용 중이면 다른 포트로 변경하지 않고 오류로 종료합니다.

`VITE_API_ORIGIN`은 사용자의 브라우저에서 접근할 수 있는 백엔드 오리진입니다. 로컬 기본 예시는 `http://localhost:8000`이며, `/api/v1` 같은 API 경로는 포함하지 않습니다. 앱에서 `import.meta.env.VITE_API_ORIGIN`으로 읽을 수 있습니다. 값이 없거나 올바른 HTTP(S) 오리진이 아니면 개발 서버 시작과 빌드를 중단합니다.

현재 화면은 모의 데이터를 사용합니다. 이 설정은 실제 API 연동을 위한 준비이며, API 호출 구현 시 해당 값을 사용해야 합니다.

## Docker Compose 실행 (권장)

Docker와 Docker Compose가 설치되어 실행 중인 서버에서 프로젝트 루트로 이동합니다.

```sh
cp .env.example .env
```

`.env`를 배포 환경에 맞게 수정합니다.

```dotenv
VITE_API_ORIGIN=https://kkoripyo.purplecodelabs.com
FRONTEND_PORT=3000
```

| 변수              | 용도                                         |
| ----------------- | -------------------------------------------- |
| `VITE_API_ORIGIN` | 필수. 브라우저에서 접근할 백엔드 오리진      |
| `FRONTEND_PORT`   | 서버에서 공개할 프론트엔드 포트. 기본 `3000` |

설정을 확인한 뒤 빌드하고 실행합니다.

```sh
docker compose -p kkoripyo-fe config --quiet
docker compose -p kkoripyo-fe up -d --build
```

로컬에서는 `http://localhost:3000`, 서버에 배포했다면 `http://서버주소:3000`으로 접속할 수 있습니다. 서버 포트에 접근할 수 있어야 하며, 포트를 변경했다면 해당 포트로 접속합니다. 리버스 프록시나 터널을 사용한다면 이 포트로 연결합니다.

프론트엔드 Compose 프로젝트명은 `kkoripyo-fe`로 유지합니다. 백엔드가 사용하는 `kkoripyo`와 같은 이름을 쓰면 백엔드 재배포 시 프론트엔드 컨테이너가 제거될 수 있습니다.

운영 명령은 다음과 같습니다.

```sh
# 상태 및 헬스체크 결과 확인
docker compose -p kkoripyo-fe ps

# 로그 확인
docker compose -p kkoripyo-fe logs -f --tail=100 frontend

# 코드 또는 백엔드 주소 변경 후 재빌드·배포
docker compose -p kkoripyo-fe up -d --build

# 종료 및 컨테이너 제거
docker compose -p kkoripyo-fe down
```

컨테이너는 `unless-stopped` 정책으로 재시작하며, Nginx의 HTTP 응답을 헬스체크합니다. 헬스체크 실패 자체가 재시작을 유발하지는 않습니다. 로그는 파일당 최대 10MB, 최대 3개로 순환합니다.

Compose는 기본적으로 `.env`를 읽어 백엔드 주소를 빌드 인자로 전달합니다. 로컬 개발용 `.env.local`은 Compose에서 자동으로 읽지 않습니다. 별도 환경 파일을 사용할 때는 모든 Compose 명령에 `--env-file`을 지정합니다. 자세한 동작은 [Docker의 환경 변수 안내](https://docs.docker.com/compose/how-tos/environment-variables/variable-interpolation/)를 참고하세요.

```sh
docker compose -p kkoripyo-fe --env-file .env.production up -d --build
```

## Docker 직접 실행

Docker가 실행 중인 상태에서 프로젝트 루트에서 이미지를 빌드하고 컨테이너를 실행합니다.

```sh
docker build --build-arg VITE_API_ORIGIN=http://localhost:8000 -t kkoripyo-fe .
docker run --rm -d --name kkoripyo-fe -p 3000:80 kkoripyo-fe
```

[http://localhost:3000](http://localhost:3000)에서 접속할 수 있습니다.

Node.js 24에서 `npm ci`와 `npm run build`를 실행한 뒤, Nginx가 빌드된 정적 파일을 제공합니다. `/streaming`처럼 클라이언트 라우팅을 사용하는 주소도 직접 접속하거나 새로고침할 수 있습니다.

컨테이너를 종료하려면 다음 명령을 실행합니다.

```sh
docker stop kkoripyo-fe
```

배포할 때는 `--build-arg VITE_API_ORIGIN=https://kkoripyo.purplecodelabs.com`처럼 실제 백엔드 오리진을 전달합니다. `localhost`는 접속한 사용자의 컴퓨터를 가리키므로 원격 배포에서는 사용하지 않습니다. 로컬 프론트엔드 주소 `http://localhost:3000`은 백엔드의 예시 CORS 허용 주소와 같습니다. 서버 IP나 외부 도메인으로 프론트엔드에 접속한다면, 포트가 같아도 다른 오리진이므로 백엔드의 `CORS_ORIGINS`에 그 접속 주소를 허용해야 합니다.

`.dockerignore`는 로컬 의존성, 빌드 결과, Git 정보와 `.env` 파일을 빌드 대상에서 제외합니다. Docker 빌드는 로컬 `.env.local`을 읽지 않으므로 위의 빌드 인자를 반드시 전달해야 합니다. `VITE_` 값은 빌드 시 정적 파일에 반영되며 공개 정보입니다. 비밀 키를 넣지 마세요. 실행 시 `docker run -e`로 바꿀 수 없으며, 주소 변경 시 이미지를 다시 빌드해야 합니다.
