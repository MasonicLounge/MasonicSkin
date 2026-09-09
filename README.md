# MasonicSkin

[![CI](https://img.shields.io/github/actions/workflow/status/masoniclounge/MasonicSkin/ci.yml?branch=MVP&label=CI)](https://github.com/masoniclounge/MasonicSkin/actions)
[![Commit activity](https://img.shields.io/github/commit-activity/m/masoniclounge/MasonicSkin)](https://github.com/masoniclounge/MasonicSkin/commits)
[![Contributors](https://img.shields.io/github/contributors/masoniclounge/MasonicSkin)](https://github.com/masoniclounge/MasonicSkin/graphs/contributors)
[![Last commit](https://img.shields.io/github/last-commit/masoniclounge/MasonicSkin)](https://github.com/masoniclounge/MasonicSkin/commits)

Frontend of **Masonic Lounge** — a self-hostable open-source forum engine.

## О проекте / About

**RU:** MasonicSkin — это клиентское приложение-сингл-пейдж (SPA) для Masonic Lounge. Оно реализовано на Lit.js и общается с бэкендом **MasonicCore** через версионированное REST API (`/api/v1`) и WebSocket. Включает публичные страницы форума, поток регистрации/входа, мастер установки и панель администратора.

**EN:** MasonicSkin is the single-page application of Masonic Lounge. Built with Lit.js, it talks to the **MasonicCore** backend through the versioned REST API (`/api/v1`) and WebSocket. It ships public forum pages, a sign-up/login flow, an install wizard and an admin panel.

## Возможности / Features

- Дизайн-токены и темы light/dark с сохранением выбора (приоритет системной схеме).
- Роутинг на @vaadin/router, набор inline SVG-иконок как Lit-компонентов.
- Публичные страницы: категории (группы), темы, сообщения, профиль.
- Аутентификация: форма входа и регистрации, сессия в памяти, токен в `localStorage`.
- Мастер установки `/install` с гвардом при первом запуске.
- Панель администратора: группы, пользователи/роли/статусы, настройки форума, медиа, версия и чистота базы.
- API-клиент с `ApiError` и бейдж статуса API (health + версия бэкенда/схемы БД).
- Разработка через Vite с проксированием `/api`, `/media` и `/ws` на бэкенд.

**EN:** design tokens with light/dark themes (persisted, system-preference aware); @vaadin/router routing; injectable inline SVG icon set as Lit components; public pages for groups, threads, posts and profiles; login/register flow with in-memory session and token in `localStorage`; `/install` wizard guarded by first-run check; admin panel for groups, users/roles/status, forum settings, media, backend and database schema version; API client with typed errors plus an API status badge; Vite dev server proxying `/api`, `/media` and `/ws` to the backend.

## Технологии / Tech stack

| Layer / Слой | Tech |
|---|---|
| Language | TypeScript 5.6 |
| UI | Lit 3.2 (web components) |
| Build | Vite 6 |
| Routing | @vaadin/router 1.7.5 |
| Deployment | multi-stage Docker (node → nginx:1.27-alpine) |
| CI | GitHub Actions on `<org>/MasonicSkin` |

## Структура репозитория / Repository layout

```
frontend/
├── src/
│   ├── api/            # REST client, DTOs, endpoint helpers
│   ├── app/            # app-shell (header, nav, theme, guards)
│   ├── auth/           # token store, session bindings
│   ├── icons/          # inline SVG icon components
│   ├── theme/          # design tokens (light/dark), base styles
│   ├── views/          # home, group, thread, login, register, profile, install, not-found
│   ├── admin/          # admin panel view
│   └── index.ts        # router setup
├── public/             # static assets, favicon
└── vite.config.ts
```

## Разработка / Development

```bash
npm install          # install dependencies
npm run dev          # Vite dev server (default http://localhost:5173)
VITE_API_TARGET=http://localhost:8080 npm run dev   # point the proxy at MasonicCore
npm run typecheck    # TypeScript check
npm run build        # typecheck + production build into dist/
```

## Тесты / Tests

- `npm run typecheck` — проверка TypeScript.
- `npm run build` — проверка сборки; production-билд раздаётся nginx-образом.

## Лицензия / License

GNU GPL v3.0 — см. файл `LICENSE` в репозитории.
GNU GPL v3.0 — see the repository `LICENSE` file.

## Контрибуторы / Contributors

[![Contributors](https://img.shields.io/github/contributors/masoniclounge/MasonicSkin)](https://github.com/masoniclounge/MasonicSkin/graphs/contributors)

Значки GitHub рендерятся после публикации репозитория в ветке GitHub.
GitHub badges render once the repository is published to GitHub.