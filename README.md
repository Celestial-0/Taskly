# 📖 Taskly Documentation

## 📌 Overview

**Taskly** is an **open-source, AI-powered task management app** built with **React Native** and **Expo**.
It helps you **capture, organize, and manage tasks** with AI-powered categorization and a modern, offline-first approach.

Designed to be **local-first**, **extensible**, and **community-driven**, Taskly is the productivity companion for **students, developers, and teams** who value simplicity, speed, and data portability.

**Current Version:** `1.0.2` (Latest Release)

---

## 🆕 What's New in v1.0.2

* 👆 **Swipe-to-Delete** – Swipe left on tasks to delete with smooth animations
* 📳 **Haptic Feedback** – Feel your interactions with tactile feedback across the app
* 🎨 **Redesigned Task Form** – Cleaner, more modern UI with better animations
* ✨ **Enhanced Gestures** – Better touch interactions with `react-native-gesture-handler`
* 🐛 **Bug Fixes** – Improved stability and error handling

See the [CHANGELOG.md](CHANGELOG.md) for full details.

---

## ✨ Features

### 🎯 Core Features
* 📝 **Task Management** – Create, update, complete, and delete tasks
* 🎯 **Swipe Gestures** – Swipe-to-delete with haptic feedback (v1.0.2)
* 💾 **Offline-First Storage** – Expo SQLite + Drizzle ORM with AsyncStorage fallback
* 🤖 **AI-Powered Categorization** – Auto-categorize tasks (Work, Study, Personal, etc.)
* 📤📥 **Import/Export** – Backup and restore tasks in JSON/CSV format
* 🌙 **Modern UI/UX** – Clean interface with dark mode and smooth animations
* 📳 **Haptic Feedback** – Tactile feedback for improved user experience (v1.0.2)
* 📱 **Cross-Platform** – iOS, Android, and Web support via Expo

### 🚀 Coming Soon
* 📸 **OCR Input** – Scan handwritten notes and convert to tasks
* 🎙️ **Voice Input** – Create tasks via speech-to-text
* 🔄 **Cloud Sync** – Multi-device synchronization with Supabase
* 🔌 **Plugin System** – Community-driven extensions

---

## 🛠️ Tech Stack

* **Frontend:** [React Native](https://reactnative.dev/) + [Expo Router](https://docs.expo.dev/router/)
* **Styling:** [Nativewind](https://www.nativewind.dev/) + [RN Primitives](https://rn-primitives.vercel.app/)
* **Database:** [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) + [Drizzle ORM](https://orm.drizzle.team/)
* **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
* **Cloud Sync (optional):** [Supabase](https://supabase.com/)
* **AI:** [OpenAI API](https://platform.openai.com/) (categorization & summarization)

---

## 📂 Folder Structure

```
taskly/
├── app/             # Expo Router pages & main entry point
├── components/      # Reusable UI components
│   ├── core/        # Core app components (Screens & Layouts)
│   └── ui/          # UI primitives (from @rn-primitives)
├── services/        # API, AI, OCR, and database logic
├── models/          # Database schemas (Drizzle ORM)
├── lib/             # Utilities and helper functions
├── assets/          # Images, icons, fonts
├── db/              # Database migrations and setup
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Celestial-0/taskly.git
cd taskly
```

### 2. Navigate to Project Directory

```bash
cd taskly
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Environment Setup

Create a `.env` file in the `taskly/` directory:

```bash
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url (optional)
SUPABASE_KEY=your_supabase_key (optional)
```

### 5. Run the App

```bash
# Development server
npm run dev

# Android
npm run android

# iOS
npm run ios

# Web
npm run web
```

---


## 📅 Roadmap

Taskly will evolve step by step — starting small, then expanding into a powerful open-source productivity ecosystem.

---

This looks really solid already 🔥
I’d recommend a few **enhancements for README polish** so contributors and users instantly “get it”:

---

## 📅 Roadmap

Taskly will evolve step by step — starting small, then expanding into a powerful open-source productivity ecosystem.

---

### ✅ MVP (Foundations)

Focus on **simplicity and offline-first usability**:

* ✏️ **Core task management (CRUD)** → Create, update, complete, delete tasks
* 💾 **Offline-first local storage** with **Expo SQLite + Drizzle ORM** and **AsyncStorage**
* 🤖 **Basic AI categorization** → Auto-tag tasks (Work, Study, Personal, etc.)
* 📤📥 **Import/Export tasks** → JSON/CSV for backup & portability

📌 **Goal:** A lightweight, offline-first task manager that feels fast and reliable.

---

### 🚀 Phase 2 (Smarter Inputs & Extensibility)

Expand beyond manual input with **AI-first task capture**:

* 📸 **OCR input** → Scan handwritten/digital notes → auto-generate tasks
* 🎙️ **Voice input** → Create tasks via speech-to-text
* ✨ **Enhanced AI summarization** → Turn raw notes into structured tasks
* 🔌 **Plugin system (v1)** → Allow developers to extend Taskly with mini-plugins

📌 **Goal:** Reduce friction in capturing tasks, and open the door for community contributions.

---

### 🌍 Phase 3 (Collaboration & Integrations)

Transform Taskly into a **connected, multi-device, team-friendly tool**:

* 🔄 **Multi-device sync** → Supabase (Postgres + Realtime) backend
* 🔗 **Integrations** → GitHub Issues, Notion pages, Obsidian notes
* 👥 **Team collaboration** → Shared task lists, permissions, real-time updates
* 🏆 **Gamification** → Streaks, badges, and progress insights for motivation

📌 **Goal:** Move from personal productivity → team productivity.

---

### 🔮 Phase 4 (AI Productivity Ecosystem)

Long-term vision: Taskly as an **AI-powered open productivity hub**:

* 🧑‍💻 **AI assistant** → Personalized study/work planner with adaptive reminders
* 📚 **Knowledge extraction** → Auto-extract insights from notes, PDFs, slides
* 🌐 **Cross-platform companions** → Chrome extension + Gmail add-on
* 🛠️ **Community plugin marketplace** → Share & discover Taskly plugins

📌 **Goal:** Build a thriving **open-source ecosystem** around productivity.

---

⚡ **Note:** This roadmap is **community-driven** — features may shift as contributors propose ideas and users share feedback.

---

## 🧪 Testing & Development

```bash
# Type checking
npx tsc --noEmit

# Code formatting
npx prettier --check .
npx prettier --write .

# Clean build
npm run clean
```

---

## 🤝 Contributing

We ❤️ contributions!

* Open an issue for bugs or feature requests.
* Fork the repo and submit a PR.
* Follow our [CONTRIBUTING.md](CONTRIBUTING.md) guide.

---

## 📜 License

**MIT License** – free to use, modify, and share.

---

