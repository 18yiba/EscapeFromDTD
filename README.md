# 🚀 Escape From DTD v0.8.0

## ✨ 新增功能

- 🧩 路线牌系统：支持路径构建与旋转
- 🧠 BFS 连通判定：动态检测地标连接
- 🎯 宣告胜利机制：支持路径验证与结算

## 🎴 DTD 卡牌系统

- 空间焦虑：限制对手行动
- 路线混乱：旋转路径结构
- 地标混乱：交换地标位置
- 与路线牌共享卡池

## 🤖 AI 对战

- 有限记忆 AI（上限 5）
- 记忆遗忘机制
- 非最优决策（增加对抗体验）
- DTD 使用策略限制
- AI 思考延迟（模拟真实对手）

## 👁 信息系统优化

- AI 手牌隐藏
- 行动结果公开
- 查看为短暂显示（返回卡背）
- 复盘阶段全地图展示

## 🎨 UI

- 棋盘与卡牌素材接入
- 手牌区优化
- 验证阶段视觉增强
- 基础移动端适配

---

## ⚠️ 已知问题

- 桌面端布局存在不稳定情况
- 新手规则理解成本较高
- 部分交互提示不够清晰
- UI 视觉尚未统一

---

## 📌 下一步计划

- 新手引导与规则说明
- UI 统一与视觉优化
- 桌面端适配修复
- AI 行为反馈增强

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

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
