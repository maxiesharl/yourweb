# VER vs LEC 竞技时间轴知识图谱

以 Max Verstappen（VER）与 Charles Leclerc（LEC）从卡丁车到 F1 的竞争叙事为数据，
用「年份 → 标志性事件 → 赛事」的节点-连线图展示两人的宿敌轨迹。

纯前端静态项目，数据来自一份 Excel，构建后可直接部署到 GitHub Pages / 对象存储，
他人打开网址即可查看、筛选、点击节点查看来源。

---

## 功能

- **节点-连线图**：年份节点（蓝）、事件节点（按分类上色）、赛事节点（红），支持拖拽、缩放、悬停提示
- **分类筛选**：卡丁车 / 青训 / F1 / 赛季 / 言论
- **点击节点**：顶部显示该事件的来源链接（`source_url`）
- **纯静态**：无需后端，构建产物可直接托管

---

## 技术栈

| 层 | 选型 |
|---|---|
| 构建工具 | Vite |
| 图可视化 | vis（`vis-network` 的前身，4.x） |
| 数据格式 | JSON（由 Excel 转换） |
| 部署 | GitHub Pages / 阿里云 OSS / 腾讯云 COS |

---

## 项目结构

```
f1kg-static/
├── index.html               # 入口 HTML
├── package.json
├── vite.config.js           # base: "./"
├── excel_to_json.py         # Excel → JSON 转换脚本
├── src/
│   ├── main.js              # 图渲染逻辑
│   ├── style.css
│   └── data/
│       └── timeline.json    # 数据源（由 Excel 生成）
└── dist/                    # 构建产物（npm run build 后生成）
```

---

## 数据来源与字段

源数据为 `ver_lec_timeline.xlsx`，字段如下：

| 字段 | 说明 | 示例 |
|---|---|---|
| `year` | 年份 | `2022` |
| `event_title` | 事件短标题 | `巴林首战` |
| `event_desc` | 事件描述 | `LEC 从杆位夺冠，VER 因燃油系统 DNF` |
| `race_name` | 赛事名（可为空） | `Bahrain Grand Prix` |
| `race_date` | 比赛日期（可为空） | `2022-03-20` |
| `tag` | 分类 | `卡丁车` / `青训` / `F1` / `赛季` / `言论` |
| `source_url` | 来源链接（可为空） | `https://...` |

修改数据后重新运行转换脚本即可更新页面。

---

## 环境要求
（如果不知道这是什么，请先搜索并观看相关教程，再实行以下安装步骤，珍爱C盘人人有责）

- Node.js **18+**（推荐 20 LTS）
- Python **3.8+**（仅用于 Excel → JSON 转换，可选）

检查版本：

```bash
node -v
npm -v
```

---

## 安装

```bash
# 1. 进入项目目录
cd f1kg-static

# 2. 换国内镜像（推荐，避免 ECONNRESET，具体情况可参考：https://www.cnblogs.com/ljbguanli/p/20134805）
npm config set registry https://registry.npmmirror.com

# 3. 安装依赖
npm install

# 4. 确认 vis 已安装
npm ls vis
```

---

## 更新数据（从 Excel 转 JSON）

```bash
# 安装 Python 依赖（首次）
pip install pandas openpyxl

# 运行转换脚本
python excel_to_json.py
```

脚本会把 `ver_lec_timeline.xlsx` 的 `timeline` sheet 转成 `src/data/timeline.json`。

---

## 本地开发

```bash
npm run dev
```

终端输出：

```
VITE v5.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

浏览器打开 `http://localhost:5173/`，即可看到关系图。
修改 `src/data/timeline.json` 或 `src/main.js` 保存后页面自动刷新。

---

## 构建与预览

```bash
# 构建生产版本
npm run build

# 本地预览构建产物
npm run preview
```

- 构建产物在 `dist/`
- `npm run preview` 默认地址：`http://localhost:4173/`
- 也可直接双击 `dist/index.html` 打开（`base: "./"` 保证相对路径可用）

---

## 部署

### 方式 A：GitHub Pages

1. 把项目推到 GitHub 仓库；
2. 仓库 **Settings → Pages**，Source 选 **GitHub Actions**；
3. 添加 `.github/workflows/deploy.yml`（见下）；
4. 推送后自动构建部署，访问 `https://用户名.github.io/仓库名/`。

`.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages }
    steps:
      - uses: actions/deploy-pages@v4
```

### 方式 B：阿里云 OSS / 腾讯云 COS

```bash
npm run build
```

把 `dist/` 内所有文件上传到桶根目录，开启静态网站托管，绑定域名即可。

> `vite.config.js` 中 `base: "./"` 已保证子路径部署资源不 404。

---

## 常见问题

### 1. `npm install` 报 `ECONNRESET`

```bash
npm config set registry https://registry.npmmirror.com
npm cache clean --force
npm install --fetch-retries=5 --fetch-timeout=120000
```

### 2. `Failed to resolve import "vis-network"`

本项目用的是 `vis@4`，不是 `vis-network`。`src/main.js` 开头应为：

```javascript
import vis from "vis";
const { Network, DataSet } = vis;
```

若报找不到 `vis`：

```bash
npm install vis
```

### 3. `npm run build` 打印 tsc 帮助信息

`package.json` 的 `build` 脚本被改错了。应为：

```json
"build": "vite build"
```

不要带 `tsc &&` 或 `--base=...`；`base` 写在 `vite.config.js` 里。

### 4. 页面空白、无节点

- 检查 `src/data/timeline.json` 是否存在且以 `[` 开头；
- 检查 `#net` 容器高度是否 > 0（`src/style.css` 中 `#net { height: ... }`）；
- 打开浏览器 F12 Console 看有无报错。

### 5. GitHub Pages 打开 404

- `vite.config.js` 必须有 `base: "./"`；
- Settings → Pages 的 Source 选 **GitHub Actions**（不是 branch）。

---

## 许可

数据用于个人学习与竞技叙事整理；引用原文请保留 `source_url` 指向的原始出处。
