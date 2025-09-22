# 📖 Taskly Documentation

## 📌 Overview

**Taskly** is an **open-source, AI-powered task management app** built with **React Native**.
It helps you **capture, organize, and manage tasks** from text, voice, or images—while AI automatically **categorizes and summarizes** them for you.

Designed to be **local-first**, **extensible**, and **community-driven**, Taskly is the productivity companion for **students, developers, and teams** who value openness and portability.

---

## ✨ Features

* 📝 **Smart Task Capture** – Add tasks via text, voice, or OCR (images).
* 🤖 **AI-Powered Organization** – Auto-categorization and summarization of tasks.
* 📂 **Data Portability** – Export and import tasks in JSON/Markdown.
* 📱 **Cross-Platform** – Built with React Native (iOS + Android support).
* 🌙 **Modern UI/UX** – Powered by Nativewind with light/dark mode.
* 🔌 **Extensible** – Plugin system for community-driven integrations.
* 📶 **Local-First with Optional Cloud Sync** – Works offline, syncs with Supabase/Postgres if needed.

---

## 🛠️ Tech Stack

* **Frontend:** [React Native](https://reactnative.dev/) + [Nativewind](https://www.nativewind.dev/)
* **Database:** SQLite / AsyncStorage (offline-first)
* **Cloud Sync (optional):** [Supabase](https://supabase.com/)
* **AI:** [OpenAI API](https://platform.openai.com/) (categorization & summarization)
* **OCR:** [Tesseract.js](https://github.com/naptha/tesseract.js) or [Google ML Kit](https://developers.google.com/ml-kit)

---

## 📂 Folder Structure

```
taskly/
├── app/             # Main entry point
├── components/      # Reusable UI components
│   ├── core/        # Core components (Screens & Layouts)
│   ├── ui/          # UI components from npx @react-native-reusables/cli@latest add 
├── hooks/           # Custom React hooks
├── services/        # API, AI, OCR, and DB logic
├── plugins/         # Community plugin integrations
├── utils/           # Helper functions
└── styles/          # Theme and global styles
├── assets/              # Images, icons, fonts
├── docs/                # Documentation files
├── tests/               # Unit and integration tests
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_GITHUB/taskly.git
cd taskly
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the App

```bash
# Android
npm run android

# iOS
npm run ios
```

### 4. Environment Setup

Create a `.env` file in the root:

```bash
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
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

## 🧪 Testing

Run unit and integration tests:

```bash
npm run test
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

