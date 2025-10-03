# 🤝 Contributing to Taskly

Thank you for your interest in contributing to **Taskly**! We welcome contributions from developers of all skill levels.

---

## 🚀 Quick Start

### 1. Fork & Clone
```bash
git clone https://github.com/Celestial-0/taskly.git
cd taskly/taskly
npm install
```

### 2. Set Up Environment
Create a `.env` file in the `taskly/` directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### 3. Run the Development Server
```bash
npm run dev
```

---

## 📋 Development Guidelines

### Code Style
- We use **Prettier** for code formatting
- Follow **TypeScript** best practices
- Use **Nativewind/Tailwind** for styling
- Keep components small and focused

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: add voice input for task creation
fix: resolve SQLite connection issue
docs: update installation guide
```

### Branch Naming
- `feature/task-voice-input`
- `fix/sqlite-connection`
- `docs/readme-update`

---

## 🐛 Reporting Issues

When reporting bugs, please include:
- **Device/OS version**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Screenshots** (if applicable)

---

## 💡 Feature Requests

Before suggesting new features:
1. Check existing issues and roadmap
2. Consider if it aligns with Taskly's **local-first** philosophy
3. Provide clear use cases and benefits

---

## 🔄 Pull Request Process

1. **Create an issue** first (unless it's a small fix)
2. **Fork the repo** and create a feature branch
3. **Write clear commit messages**
4. **Test your changes** thoroughly
5. **Update documentation** if needed
6. **Submit a PR** with a clear description

### PR Checklist
- [ ] Code follows project style guidelines
- [ ] Changes are tested on both iOS and Android
- [ ] Documentation is updated (if applicable)
- [ ] No breaking changes (or clearly documented)

---

## 🏗️ Project Structure

```
taskly/
├── app/             # Expo Router pages
├── components/      # Reusable UI components
│   ├── core/        # Core app components
│   └── ui/          # UI primitives
├── services/        # API, database, AI logic
├── models/          # Database schemas
├── lib/             # Utilities and helpers
└── assets/          # Images, icons, fonts
```

---

## 🧪 Testing

```bash
# Run tests (when available)
npm run test

# Type checking
npx tsc --noEmit

# Linting
npx prettier --check .
```

---

## 📚 Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Nativewind](https://www.nativewind.dev/)

---

## 🎯 Current Focus Areas

Based on our [roadmap](README.md#-roadmap), we're currently focusing on:

### MVP (Phase 1)
- Core task CRUD operations
- SQLite + Drizzle ORM integration
- Basic AI categorization
- Import/Export functionality

### Looking for Help With:
- UI/UX improvements
- Performance optimizations
- Cross-platform testing
- Documentation improvements

---

## 💬 Community

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and ideas
- **Discord**: Real-time chat (coming soon)

---

## 📜 License

By contributing to Taskly, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

**Happy coding!** 🚀