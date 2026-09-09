# Changelog

All notable changes to this project are documented in this file,
following the [Keep a Changelog](https://keepachangelog.com/) convention.
Entries are bilingual (English / Russian).

## [Unreleased]

### Added / Добавлено

- CI workflow (GitHub Actions): `npm ci` + typecheck on every push/PR; publishes the container image to `ghcr.io/masoniclounge/masonicskin:<version>` on release tags `vX.Y.Z`.
- CI workflow (GitHub Actions): `npm ci` + typecheck на каждый push/PR; публикация образа контейнера в `ghcr.io/masoniclounge/masonicskin:<version>` по релизным тегам `vX.Y.Z`.

- Container image: `Dockerfile` (Node 24 build stage → nginx runtime) with `nginx.conf` serving the SPA and proxying `/api`, `/media` and the `/ws` WebSocket upgrade to the backend.
- Образ контейнера: `Dockerfile` (сборка Node 24 → рантайм nginx) с `nginx.conf`, раздающим SPA и проксирующим `/api`, `/media` и WebSocket-upgrade `/ws` на бэкенд.

- Admin panel at `/admin` for administrators only: tabs for group management
  (create/delete), user administration (role checkboxes and status select),
  forum settings (name editing), media (attachment list and deletion) and
  version information (backend + DB schema).
  Рус.: Админ-панель на `/admin` только для администраторов: вкладки
  управления группами (создание/удаление), пользователями (чекбоксы ролей и
  выбор статуса), настройками форума (редактирование названия), медиа (список
  и удаление вложений) и версиями (бэкенд + схема БД).

- Install wizard at `/install`: first-run setup form (forum name + administrator
  account) with a startup guard that redirects to `/install` while the forum is
  not yet set up (`GET`/`POST /api/v1/install`).
  Рус.: Мастер установки на `/install`: форма первичной настройки (название
  форума + аккаунт администратора) с гардом при старте, который перенаправляет
  на `/install`, пока форум не настроен (`GET`/`POST /api/v1/install`).

- Public forum pages wired to the MasonicCore API: forum categories, threads
  and posts with persistent pagination helpers, plus create-thread/reply forms.
  Рус.: Публичные страницы форума, подключённые к API MasonicCore: категории,
  темы и сообщения с постраничными помощниками, плюс формы создания темы и
  ответа.
- Authentication flow: login, registration and profile views with an access
  token stored in `localStorage`, a shared session store and sign-out action.
  Рус.: Авторизация: представления входа, регистрации и профиля с токеном
  доступа в `localStorage`, общее хранилище сессии и выход из аккаунта.
- Typed backend DTOs (`src/api/types.ts`) and endpoint helpers
  (`src/api/endpoints.ts`) mirroring the MasonicCore REST contracts.
  Рус.: Типизированные DTO бэкенда (`src/api/types.ts`) и помощники
  эндпоинтов (`src/api/endpoints.ts`), повторяющие REST-контракты MasonicCore.
- Frontend skeleton: Vite + TypeScript + Lit, app shell layout, `@vaadin/router`
  routing, design tokens with light/dark themes, inline SVG icon set.
  Рус.: Каркас фронтенда: Vite + TypeScript + Lit, раскладка app shell,
  роутинг через `@vaadin/router`, дизайн-токены со светлой/тёмной темами,
  встроенный набор SVG-иконок.
- REST API client with typed helpers and structured `ApiError`, plus an
  API status badge showing backend and DB schema versions at startup.
  Рус.: Клиент REST API с типизированными помощниками и структурированной
  ошибкой `ApiError`, плюс индикатор состояния API с версиями бэкенда и схемы БД.