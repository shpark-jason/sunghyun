# Sunghyun Portfolio

GitHub Pages로 배포할 수 있는 정적 포트폴리오 웹사이트입니다.

## Files

- `index.html`: 페이지 구조
- `styles.css`: 디자인과 반응형 스타일
- `script.js`: 메뉴 활성화와 이메일 복사 기능
- `assets/hero-workspace.svg`: 첫 화면 비주얼 자산
- `.nojekyll`: GitHub Pages 정적 파일 배포 설정

## GitHub Pages

Repository `Settings` > `Pages`에서 다음처럼 설정합니다.

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/root`

커스텀 도메인을 연결하려면 루트에 `CNAME` 파일을 추가하고, 파일 내용에 도메인만 적습니다.

```text
example.com
```
