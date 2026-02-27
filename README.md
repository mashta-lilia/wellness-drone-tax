# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
Для проєкту сервісу розрахунку податків на доставку дронами в Нью-Йорку було налаштовано базову інфраструктуру для контейнеризації та безперервної інтеграції. Ви можете додати наступний розділ до вашого `README.md`, щоб описати цю частину роботи:

---

## 🚀 DevOps: Інфраструктура та CI/CD

У проєкті реалізована повна контейнеризація сервісів та налаштований автоматизований конвеєр для перевірки коду.

### Що було реалізовано:
* **Оркестрація контейнерів**: Створено `docker-compose.yml`, який описує два незалежні сервіси: `api` (бекенд) та `frontend`. Для обох сервісів налаштована політика `restart: always`, що забезпечує їхній автоматичний перезапуск при збоях.
* **Безперервна інтеграція (CI)**: Налаштовано GitHub Actions (`ci.yml`), який автоматично спрацьовує при подіях `push` та `pull_request` у гілку `main`.
* **Перевірки в CI**:
  * Для фронтенду розгортається середовище Node.js 24, після чого виконується чисте встановлення залежностей (`npm ci`), лінтинг (`npm run lint`) та тестова збірка проєкту (`npm run build`).
  * Для бекенду розгортається середовище Python 3.12 і перевіряється коректність встановлення всіх залежностей з файлу `requirements.txt`.

### 🛠 Як запускати проєкт

Для запуску проєкту вам знадобляться встановлені Docker та Docker Compose.

1. **Налаштування змінних оточення**. Проєкт вимагає наявності певних змінних для успішного старту. Створіть файл `.env` у кореневій директорії (або експортуйте їх у консолі), вказавши наступні значення:
   * `DATABASE_URL` — рядок підключення до вашої бази даних для бекенду.
   * `FRONTEND_PORT` — локальний порт, на якому буде доступний інтерфейс користувача.

2. **Збірка та запуск**. Знаходячись у корені проєкту, виконайте команду:
   ```bash
   docker-compose up --build -d
Доступ до сервісів:

API (бекенд) буде доступний за адресою: http://localhost:8000.

Фронтенд буде доступний за адресою: http://localhost:<Ваш_FRONTEND_PORT>.

✅ Як перевіряти працездатність
Локальна перевірка інфраструктури:

Переконайтеся, що контейнери успішно піднялися із заданими іменами drone-tax-backend та drone-tax-frontend, виконавши команду docker-compose ps.

Перевірте логи бекенду (docker logs drone-tax-backend), щоб переконатися, що застосунок успішно підключився до бази даних (для цього в контейнер передається змінна PYTHONUNBUFFERED=1 для виведення логів у реальному часі).

Перевірка через CI-пайплайн:

Будь-який новий код, відправлений у гілку main, буде автоматично перевірений пайплайном.

Перейдіть у вкладку "Actions" на GitHub, щоб переконатися, що кроки Lint Frontend та Build Frontend завершуються без помилок.

Примітка для бекенду: У пайплайні підготовлено крок Run Backend Tests. На даний момент він виводить заглушку echo "Backend checks passed", сюди необхідно буде додати команду запуску pytest після написання тестів.
