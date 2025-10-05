# 📑 Changelog

All notable changes to **Taskly** will be documented in this file.  
This project follows **[Semantic Versioning](https://semver.org/)**.

---

## [1.0.2] - 2025-10-05
### ✨ Features
- **feat**: Add swipe-to-delete gesture support for task items with smooth animations
- **feat**: Implement haptic feedback for improved user interaction (theme toggle, task form, swipe gestures)
- **feat**: Add GestureHandlerRootView wrapper for proper gesture support

### 🎨 UI/UX Improvements
- **ui**: Redesign task form with modern card-less layout and improved spacing
- **ui**: Enhance AI suggestion display with better visual hierarchy
- **ui**: Add smooth animations to task form (fade-in, slide-in effects)
- **ui**: Improve task item visual feedback during swipe gestures (red background, trash icon scaling)
- **ui**: Enhance task form submit button with loading state

### 🐛 Bug Fixes
- **fix**: Improve Select component value handling to prevent crashes
- **fix**: Add proper error handling for swipe-to-delete operations
- **fix**: Implement fallback support for devices without gesture support
- **fix**: Add safety checks for invalid task data in TaskItem component

### ♻️ Code Quality
- **refactor**: Optimize TaskItem with React hooks (useCallback, useMemo, useRef)
- **refactor**: Improve task form state management and async operations
- **refactor**: Add comprehensive inline documentation for gesture requirements
- **refactor**: Implement proper animation cleanup for memory management

### 📦 Dependencies
- **deps**: Add `react-native-gesture-handler` ^2.28.0 for swipe gestures
- **deps**: Add `@egjs/hammerjs` and `hoist-non-react-statics` (peer dependencies)

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