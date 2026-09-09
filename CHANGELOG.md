# Changelog

All notable changes to this project are documented in this file,
following the [Keep a Changelog](https://keepachangelog.com/) convention.
Entries are bilingual (English / Russian).

## [Unreleased]

### Added / Добавлено

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