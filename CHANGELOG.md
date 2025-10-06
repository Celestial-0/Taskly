# 📑 Changelog

All notable changes to **Taskly** will be documented in this file.  
This project follows **[Semantic Versioning](https://semver.org/)**.

---

## [1.1.2] - 2025-10-07
### ✨ Features
- **feat**: New detailed task view screen with comprehensive information display
- **feat**: Markdown preview and edit toggle for task descriptions
- **feat**: Enhanced subtask management with improved UX and dialogs
- **feat**: Time tracking UI with session history and total time display
- **feat**: Task detail navigation on tap from task list

### 🎨 UI/UX Improvements
- **ui**: Redesigned task detail screen with progress bars, meta information, and action buttons
- **ui**: Added markdown support in task descriptions (headers, bold, italic, lists, code)
- **ui**: Improved subtask manager with better visual feedback and animations
- **ui**: Enhanced time tracker with active session display and formatted time
- **ui**: Added category badge component with customizable colors and sizes

### 🐛 Bug Fixes
- **fix**: Corrected progress bar color from foreground to primary
- **fix**: Fixed completion percentage logic for tasks with and without subtasks
- **fix**: Improved progress bar animation with proper spring configuration
- **fix**: Enhanced task item tap navigation to detail screen

### 📦 Dependencies
- **deps**: Add `date-fns` ^4.1.0 for date formatting and manipulation

### ♻️ Code Quality
- **refactor**: Create reusable CategoryBadge component for consistent category display
- **refactor**: Implement SubtaskManager component with comprehensive error handling
- **refactor**: Build TimeTracker component with proper state management
- **refactor**: Add task detail screen with modular card-based layout

---

## [1.1.1] - 2025-10-06
### 📚 Documentation
- **docs**: Add comprehensive CONTRIBUTING.md with contribution guidelines, code of conduct, and development workflow
- **docs**: Create detailed LICENSE.md with MIT License terms and conditions
- **docs**: Enhance README.md with improved project structure, features documentation, and developer setup instructions
- **docs**: Add issue and pull request templates for better community engagement
- **docs**: Update documentation structure for better clarity and accessibility

---

## [1.1.0] - 2025-10-06
### 🎨 Major UI Overhaul
- **feat**: Complete redesign of Settings screen with modular, section-based architecture
- **feat**: Implement theme toggle with platform-specific haptic feedback (iOS 25ms, Android 30ms)
- **feat**: Create dedicated icon components library (GitHub, Taskly logos)
- **feat**: Add SafeAreaView integration for improved cross-platform compatibility
- **feat**: Enhance visual hierarchy with modernized UI components

### 🏗️ Architecture & Code Quality
- **refactor**: Major component reorganization into feature-based folders (`tasks/`, `settings/`, `icons/`, `provider/`)
- **refactor**: Extract modular Settings sections (About, AI, Notifications, Export/Import)
- **refactor**: Remove ~1,897 lines of legacy code for better maintainability
- **refactor**: Implement enhanced separation of concerns across components
- **refactor**: Improve component reusability with better abstraction

### ⚙️ Settings System
- **feat**: Implement Zustand-based settings state management (`settings-store.ts`)
- **feat**: Create About section with app info, tech stack, developer details, and project links
- **feat**: Add AI settings configuration section
- **feat**: Build Notifications settings management
- **feat**: Design Export/Import data management interface

### � Component Architecture
- **refactor**: Split monolithic components into focused, single-responsibility modules
- **refactor**: Create `components/settings/` folder for all settings-related UI
- **refactor**: Organize task components under `components/tasks/`
- **refactor**: Move provider components to `components/provider/`
- **refactor**: Add icon library in `components/icons/`

### 💅 UI/UX Improvements
- **ui**: Redesign Settings cards with better spacing and visual hierarchy
- **ui**: Add animated theme toggle with smooth transitions
- **ui**: Enhance Settings navigation with section-based layout
- **ui**: Improve Settings card components with consistent styling
- **ui**: Add developer and project information cards

### 🐛 Bug Fixes & Polish
- **fix**: Resolve haptic feedback timing issues across platforms
- **fix**: Improve Settings screen scroll performance
- **fix**: Fix component import paths after reorganization
- **fix**: Enhance error boundary handling

### 🔧 Developer Experience
- **dx**: Better folder structure for improved code navigation
- **dx**: Clearer component naming conventions
- **dx**: Enhanced code maintainability with smaller, focused files
- **dx**: Improved import organization with feature-based modules

---

💡 **Breaking Changes:** Complete component reorganization may require import path updates in custom modifications.

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