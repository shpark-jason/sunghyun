# Researcher Portfolio

Astro로 만든 연구자 포트폴리오 초안입니다.

## 페이지

- Home
- About
- Education & Experience
- Publications
- Presentations
- Projects
- News
- Blog — Tistory / Instagram URL 카드
- Contact

## 내 정보로 바꾸기

대부분의 내용은 `src/data/site.ts` 한 파일에서 수정할 수 있습니다.

- `site`: 이름, 소속, 이메일, 연구 분야, 외부 링크
- `education`: 학력
- `experience`: 경력
- `publications`: 논문
- `presentations`: 발표
- `projects`: 프로젝트
- `news`: 소식
- `blogPosts`: Tistory 및 Instagram 게시물 URL

사이트 색상과 글꼴은 `src/styles/global.css`의 `:root`에서 변경할 수 있습니다.

## 수정 페이지 사용

로컬 사이트를 실행한 뒤 아래 주소를 엽니다.

```text
http://localhost:4322/admin
```

각 항목을 폼에서 수정하고 **수정 파일 저장**을 누르면 로컬 프로젝트의
`src/data/site.ts`에 바로 저장됩니다. 홈페이지를 새로고침하면 변경 내용을 확인할 수 있습니다.

공개된 사이트에서도 `/sunghyun/admin`에 접속할 수 있지만, GitHub Pages에는 서버가 없으므로
내용이 GitHub에 직접 저장되지는 않습니다. 수정 파일을 로컬 프로젝트에 저장한 후
`publish.ps1`을 실행해야 공개 사이트에 반영됩니다.

## 로컬 실행

Node.js 22 이상을 설치한 뒤 다음 명령을 실행합니다.

```bash
npm install
npm run dev
```

빌드 확인:

```bash
npm run build
```

## GitHub Pages 배포

현재 프로젝트는 `shpark-jason/sunghyun` 저장소의 GitHub Pages 배포를 기준으로 설정되어 있습니다.

1. 이 프로젝트를 `shpark-jason/sunghyun`의 `main` 브랜치에 올립니다.
2. 저장소의 기존 정적 사이트는 이번 Astro 사이트로 교체됩니다.
3. 저장소의 **Settings → Pages → Build and deployment → Source**를 **GitHub Actions**로 설정합니다.
4. 이후 `main`에 변경사항을 올릴 때마다 자동 배포됩니다.

PowerShell에서 한 번에 업로드하려면 프로젝트 폴더에서 아래를 실행합니다.

```powershell
.\publish.ps1
```

이 스크립트는 `https://github.com/shpark-jason/sunghyun.git`을 기본 대상으로 사용합니다. 기존 원격 주소가 다르면 덮어쓰지 않고 중단합니다.

배포 주소는 `https://shpark-jason.github.io/sunghyun/`입니다.

## 블로그 글 추가

`src/data/site.ts`의 `blogPosts` 배열에 항목을 추가합니다.

```ts
{
  source: "Tistory",
  date: "Jun 22, 2026",
  title: "글 제목",
  excerpt: "카드에 표시할 짧은 설명",
  url: "https://내블로그.tistory.com/글번호",
  tone: "sage",
}
```

## Tistory 자동 연동

`https://sh-life.tistory.com/rss`에서 최신 글 10개를 자동으로 가져옵니다.

로컬에서 즉시 갱신:

```powershell
npm.cmd run sync:tistory
```

GitHub Pages에서는 GitHub Actions가 매일 오전 6시 17분경(한국 시간)에 RSS를 다시 읽고 사이트를 재배포합니다. 저장소의 Actions 화면에서 배포 워크플로를 수동 실행해 즉시 갱신할 수도 있습니다.

## 언론보도 자동 카드

관리자 페이지의 News 항목에 기사 URL을 입력하면 빌드할 때 기사 제목, 언론사, 대표 이미지와 공식 요약문을 수집합니다. 공식 요약문이 없는 경우에만 기사 첫 문단 일부를 사용합니다.

로컬에서 기사 정보를 즉시 갱신:

```powershell
npm.cmd run sync:news
```

### 영문 자동 번역

DeepL API Free 키를 `DEEPL_API_KEY`로 등록하면 한국어 기사 제목과 요약 아래에 영문 번역이 자동 표시됩니다.

- 로컬 PowerShell: `$env:DEEPL_API_KEY="발급받은 키"`
- GitHub: 저장소 **Settings → Secrets and variables → Actions → New repository secret**
- Secret 이름: `DEEPL_API_KEY`

API 키가 없다면 관리자 페이지의 영문 제목·영문 요약 필드에 직접 입력할 수 있습니다.
