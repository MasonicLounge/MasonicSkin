# Changelog

All notable changes to this project are documented in this file,
following the [Keep a Changelog](https://keepachangelog.com/) convention.
Entries are bilingual (English / Russian).

## [Unreleased]

### Added / Добавлено

- Global form styling (inputs, textarea, select, labels, buttons — primary/secondary) based on the design tokens in both light and dark themes; install wizard form laid out as a centered column.
- Глобальные стили форм (input, textarea, select, label, кнопки — primary/secondary) на базе дизайн-токенов в светлой и тёмной темах; форма мастера установки выровнена колонкой по центру.

- Forum name from `GET /api/v1/settings` is now shown in the header brand and in the document title (falls back to “Masonic Lounge”).
- Название форума из `GET /api/v1/settings` теперь отображается в шапке и в заголовке вкладки (по умолчанию — “Masonic Lounge”).

- Attachments in replies and threads: file picker in the reply and new-thread composers, upload to MinIO via `POST /api/v1/media/attachments`, and image/preview rendering (images inline, other files as links).
- Вложения в ответах и темах: выбор файлов в формах ответа и создания темы, загрузка в MinIO через `POST /api/v1/media/attachments`, отрисовка (картинки — инлайн, прочие файлы — ссылками).

- WebSocket client (`src/ws/client.ts`): typed realtime events (`pm`, `notification`, `presence`), automatic reconnection with exponential backoff (up to 30 s), connection lifecycle management. Connected whenever a session starts, disconnected on logout.
- Веб-сокет-клиент (`src/ws/client.ts`): типизированные realtime-события (`pm`, `notification`, `presence`), автоматическое переподключение с экспоненциальной задержкой (до 30 с), управление жизненным циклом соединения. Подключается при старте сессии, отключается при выходе.

- Private messages view at `/pms`: conversation list, one-on-one chat, reply box (Ctrl+Enter to send), new-conversation composer, live message appending over WebSocket.
- Страница личных сообщений на `/pms`: список диалогов, чат один-на-один, поле ответа (отправка по Ctrl+Enter), форма нового диалога, живые сообщения через WebSocket.

- Notifications dropdown in the header (`notifications-dropdown`): bell icon with unread count badge (messages + notifications), live refresh on realtime events, “mark all read”, navigation to messages.
- Выпадающая панель уведомлений в шапке (`notifications-dropdown`): колокольчик со счётчиком непрочитанного (сообщения + уведомления), обновление в реальном времени, «прочитать всё», переход к сообщениям.

- Presence indicators (`presence-dot` + `src/ws/presence.ts` store): online/offline dots next to thread authors, post authors and on the profile page, driven by WebSocket presence events with initial bootstrap from `GET /api/v1/presence`.
- Индикаторы присутствия (`presence-dot` + стор `src/ws/presence.ts`): точки онлайн/офлайн рядом с авторами тем, постов и на странице профиля; работают через события присутствия WebSocket с начальной загрузкой из `GET /api/v1/presence`.

- New API client helpers in `src/api/endpoints.ts` for private messages, notifications, unread counts and presence; new DTO types (`PrivateMessage`, `PMConversation`, `PresenceUpdate`) and `Notification` in `src/api/types.ts`.
- Новые хелперы API-клиента в `src/api/endpoints.ts` для личных сообщений, уведомлений, счётчиков непрочитанного и присутствия; новые DTO (`PrivateMessage`, `PMConversation`, `PresenceUpdate`) и `Notification` в `src/api/types.ts`.

- New inline SVG icons: `bell`, `x`, `chevron-down`.
- Новые инлайн-иконки SVG: `bell`, `x`, `chevron-down`.

- Internationalization (i18n): lightweight custom module `src/i18n/index.ts` (no new dependencies) with locale catalogs `src/locales/en.json` and `src/locales/ru.json` (Crowdin-compatible flat key format), `getLocale`/`setLocale`/`subscribeLocale`/`t()` helpers, language detection (saved preference → browser language) and a language switcher in the header (English/Русский). All views and components now render translated strings; dates/times use the active locale.
- Интернационализация (i18n): лёгкий самописный модуль `src/i18n/index.ts` (без новых зависимостей) с каталогами локалей `src/locales/en.json` и `src/locales/ru.json` (плоский формат ключей, совместимый с Crowdin), хелперы `getLocale`/`setLocale`/`subscribeLocale`/`t()`, определение языка (сохранённая настройка → язык браузера) и переключатель языка в шапке (English/Русский). Все представления и компоненты теперь рендерят переведённые строки; даты/время используют активную локаль.

- Profile editing at `/profile`: display name update (`PATCH /api/v1/auth/me`), avatar upload (`POST /api/v1/media/avatar`), password change (`POST /api/v1/auth/change-password`). In-memory session state is refreshed so the brand/header react immediately.
- Редактирование профиля на `/profile`: смена отображаемого имени (`PATCH /api/v1/auth/me`), загрузка аватара (`POST /api/v1/media/avatar`), смена пароля (`POST /api/v1/auth/change-password`). Локальное состояние сессии обновляется, шапка реагирует сразу.

- Reusable component library in `src/components/`: `ml-loading` (localized loading indicator), `ml-message` (info/error/success status line), `ml-badge` (accent/primary pill label), `ml-avatar` (image with initials fallback), `ml-card` (surface container) and `ml-button` (primary/secondary/danger). Adopted by the home, group, thread, profile and composer views.
- Библиотека переиспользуемых компонентов в `src/components/`: `ml-loading` (локализованный индикатор загрузки), `ml-message` (строка состояния info/error/success), `ml-badge` (пилюля accent/primary), `ml-avatar` (изображение с запасным вариантом — инициалы), `ml-card` (контейнер-поверхность) и `ml-button` (primary/secondary/danger). Используются в представлениях главной, группы, темы, профиля и композерах.

- Pagination UI (`ml-pagination`): previous/next navigation with a page counter for thread lists, post lists, admin user/media tables and the PM inbox, driven by the `limit`/`offset` window returned by the API.
- Пагинация (`ml-pagination`): навигация «назад/вперёд» со счётчиком страниц для списков тем, постов, таблиц пользователей/медиа в админке и входящих ЛС, на основе окна `limit`/`offset`, возвращаемого API.

- Test setup: `@web/test-runner` with the Playwright Chromium launcher, `@web/dev-server-esbuild` (TS + JSON) and `@open-wc/testing`. Tests cover the i18n module (`t()`, locale switching, interpolation) and the `ml-pagination` component (page info, disabled states, `page-change` events). CI now runs typecheck and the test suite with Playwright Chromium installed.
- Настройка тестов: `@web/test-runner` с Playwright Chromium, `@web/dev-server-esbuild` (TS + JSON) и `@open-wc/testing`. Тесты покрывают модуль i18n (`t()`, переключение локали, интерполяция) и компонент `ml-pagination` (счётчик страниц, disabled-состояния, события `page-change`). CI теперь запускает typecheck и тесты с установленным Playwright Chromium.

### Fixed / Исправлено

- Router was never initialized because the `#outlet` lookup ran in module scope while the outlet lives inside the `app-shell` shadow DOM — views (install wizard, home, etc.) rendered as an empty page. The router is now bound to the shadow outlet from `app-shell` via a new `initRouter()` helper.
- Роутер не инициализировался: поиск `#outlet` выполнялся на этапе загрузки модуля, а выход находился в shadow DOM `app-shell` — представления (мастер установки, главная и др.) не рендерились, оставаясь пустой страницей. Роутер теперь привязывается к shadow-outlet из `app-shell` через новый хелпер `initRouter()`.

### Changed / Изменено

- README CI badge now points at the `dev` integration branch instead of `MVP`.
- В README бейдж CI теперь указывает на интеграционную ветку `dev` вместо `MVP`.

## [0.1.0] - 2026-09-09

### Added / Добавлено

- GNU GPL v3.0 license file (`LICENSE`) added to the repository.
- Лицензия GNU GPL v3.0 (`LICENSE`) добавлена в репозиторий.

- Bilingual README (`README.md`) describing the module: responsibility, implemented features, tech stack, repository layout, development, tests and license; dynamic shields.io badges (CI, commit activity, contributors, last commit).
- Двуязычное README (`README.md`): назначение модуля, реализованные возможности, стек, структура репозитория, разработка, тесты и лицензия; динамические бейджи shields.io (CI, активность коммитов, контрибуторы, последний коммит).

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