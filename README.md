# KLIMENT — редизайн kliment74.ru

Одностраничный сайт производителя автоматических моек деталей (АМ 700 / 800 / 1000 / 1200).
Статический HTML/CSS/JS, публикуется через GitHub Pages: https://pequodd.github.io/kliment74/

## Структура
- `index.html` — вся страница
- `assets/css/style.css` — стили и токены
- `assets/js/main.js` — прелоадер, плавный скролл (Lenis), GSAP ScrollTrigger, подбор модели, «смывание грязи», форма
- `assets/js/hero.js` — WebGL-сцена первого экрана (three.js): корзина из частиц и струи из рамп
- `assets/img/` — фото с текущего сайта, сжатые в WebP

## Форма заявки
У GitHub Pages нет сервера, поэтому форма открывает почтовый клиент с готовым письмом на klimentcompany@mail.ru.
Для приёма заявок без почтового клиента подключите обработчик (например, Formspree или вебхук CRM) в `assets/js/main.js`, блок «lead form».

## Локальный запуск
```
python -m http.server 8000
```
