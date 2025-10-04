# 📑 Changelog

All notable changes to **Taskly** will be documented in this file.  
This project follows **[Semantic Versioning](https://semver.org/)**.

---

## [1.0.1] - 2025-10-05
### ⚡ Performance
- **perf**: Optimize TaskList component with React.memo, useMemo, and useCallback
- **perf**: Implement proper component lifecycle management with refs to prevent memory leaks
- **perf**: Reduce unnecessary re-renders in filter and category components
- **perf**: Add task sorting UI (time/priority toggle) for better task organization

### 🐛 Bug Fixes
- **fix**: Replace crash-prone custom header with native Expo Router navigation header
- **fix**: Normalize category names to lowercase for consistent data handling
- **fix**: Improve task initialization logic to prevent duplicate database calls
- **fix**: Prevent rapid theme toggle issues with debouncing and state management

### ♻️ Refactoring
- **refactor**: Move AppProvider from lib/ to components/provider/ for better project structure
- **refactor**: Extract Main component from index screen for better separation of concerns
- **refactor**: Improve code organization with section comments and consistent formatting
- **refactor**: Simplify header components using proper React Navigation integration
- **refactor**: Update demo data to tutorial-focused onboarding tasks

---

## [1.0.0] - 2025-10-03
### 🎉 Initial Release (MVP)
- 📝 Core task management (CRUD): create, update, complete, delete tasks
- 💾 Offline-first local storage with **Expo SQLite + Drizzle ORM** (AsyncStorage fallback)
- 🤖 AI-powered categorization (Work, Study, Personal, etc.)
- 📤📥 Import/Export tasks in **JSON/CSV**
- 🌙 Modern UI/UX with dark mode support

📌 **Goal:** Deliver a lightweight MVP focused on simplicity, speed, and offline-first reliability.

---