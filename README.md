# 🎈 Лопни шарик — тестовый плагин Pilot-Web

Это настоящее frontend-расширение Pilot-Web на JavaScript, собранное через Webpack Module Federation. Предназначено для проверки загрузки пользовательских расширений через Pilot-Web SDK. **Это не .NET-плагин для Pilot-BIM Desktop.**

В игровом пространстве шарики поднимаются вверх. Нажимайте на них мышкой, пальцем или клавиатурой: за каждое попадание даются очки, за серию — бонус. Есть таймер на 30 секунд, рекорд, пауза и повторная игра. Игра изолирована от интерфейса Pilot через Shadow DOM. К данным Pilot не обращается.

## Быстро проверить игру

Нужен Node.js 20+.

```bash
npm run preview
```

Затем откройте **http://127.0.0.1:4173/preview/index.html**. Это только локальный предпросмотр, а не запущенный Pilot-Web-Server.

## Сборка установочного ZIP

```bash
npm install
npm test
npm run build
```

Файл для установки: **dist/balloon-pop-pilot-web.zip**. В архиве находятся `frontend/extensions.config.json`, `frontend/balloon-pop.js` и chunk-файлы Webpack.

В GitHub Actions workflow **Pilot-Web balloon plugin** также собирает ZIP и публикует его в Artifacts.

## Установка в Pilot-Web

1. Авторизуйтесь в рабочем Pilot-Web под пользователем с правами управления расширениями.
2. Откройте **Настройки → Модули расширения → Добавить → Расширение**.
3. Укажите файл `balloon-pop-pilot-web.zip`.
4. Обновите страницу и найдите дополнительное пространство игры. Его расположение может зависеть от версии Pilot-Web.

Загрузка файлов в GitHub **не устанавливает** расширение автоматически в Pilot-Web. Интеграцию с реальным сервером Pilot-Web нужно проверить отдельно.

## SDK

- [Официальная настройка web-расширений Pilot](https://pilot.ascon.ru/docssdk/pages/webserver/sborka/vue-nastroyka.html)
- [Интерфейс IOpenspaceView и встраивание в UI](https://pilot.ascon.ru/docssdk/pages/webserver/sborka/react-ui.html)
- [Загрузка ZIP-расширения](https://help.pilotems.com/ru/Content/web-plugin.htm)
