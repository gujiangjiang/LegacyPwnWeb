# 📦 LegacyPwnWeb - Unified Web-based iOS Legacy Toolkit

LegacyPwnWeb 是一个专为 32 位旧版 iOS 设备（iOS 8.0 - 9.3.6）设计的现代化在线越狱与底层维护工具箱。

本项目将离散的 WebKit 漏洞利用页面（如原始越狱、降级伪造、KDFU 等）进行了重构与深度整合。通过一套统一的底层漏洞利用框架（Exploit Chain）和动态载荷（Payload）加载机制，实现了在一个美观的网页前端完成越狱、降级和底层特权引导等多种高阶操作。

## ✨ 核心功能 (Features)

* 🔍 **环境智能检测与拦截:** 通过解析 User-Agent 自动识别设备族类与 iOS 版本，实时提示兼容性。在 UI 层禁用按钮的基础上，底层 `wkloader` 核心更加入了严格的 OS 主版本过滤，彻底阻断在非 iOS 8/9 设备上引发的不合法载荷请求与报错，并**优化了加载顺序，大幅节省了无效请求带来的服务器带宽压力**。
* ℹ️ **设备支持查询:** 点击检测状态徽章即可全局查看详细的设备支持兼容列表。
* 🔓 **越狱 (Jailbreak):** 一键获取系统 Root 权限并部署 Cydia 运行环境。（支持 A5-A6 设备，内置图文向导、独立证书安装与检查弹窗）
* ⬇️ **降级伪装 (Downgrade):** 动态修改 `SystemVersion.plist` 以欺骗 OTA 验证机制，实现平滑降级至 iOS 8.4.1。
* 🧩 **基础环境配置 (Substrate):** 一键安装 Cydia Substrate 与 SafeMode。（作为常规安装失败后的网页端保底方案）
* ⚠️ **特权恢复模式 (KDFU):** 通过劫持 BootROM 引导进入无视签名的 Pwned DFU 模式，供高级用户强刷自制固件。

## 📱 支持设备 (Supported Devices)

仅支持运行 **iOS 8.0 至 iOS 9.3.6** 的 **32位** 苹果设备，包括但不限于：
* iPhone 4S, iPhone 5, iPhone 5C
* iPad 2, iPad 3, iPad 4
* iPad mini 1
* iPod touch 5G

## 📂 目录结构 (Directory Structure)

项目采用了完全解耦的设计，将前端 UI、核心漏洞利用代码与功能载荷严格分离：

```text
LegacyPwnWeb/
├── index.html                   # 现代化深色主题仪表盘 (UI 前端，内置交互弹窗)
└── assets/
    ├── css/                     # 样式文件目录
    │   └── style.css            # 全局及弹窗组件样式表
    ├── certs/                   # 证书文件目录
    │   └── beeg.mobileconfig    # 越狱必备的信任证书文件
    ├── js/
    │   ├── main.js              # 页面 UI 交互控制与弹窗逻辑脚本 (独立解耦)
    │   └── wkloader.js          # 核心 WebKit 漏洞加载器 (支持动态载荷路由，内置版本拦截)
    ├── core/                    # 共享底层 Exploit 跳板与补丁 (固定不变)
    │   ├── loader8.b64
    │   ├── loader9.b64
    │   └── patch.b64
    └── payloads/                # 动态加载的业务 Mach-O 载荷 (可无限扩展)
        ├── jber.b64             # 越狱载荷
        ├── downgrade.b64        # 版本伪造载荷
        ├── instdeb.b64          # Substrate 安装载荷
        └── kdfu.b64             # kloader 引导载荷
```

## 🚀 部署与使用 (Deployment & Usage)

本项目为纯静态网站，无需任何复杂的后端语言或数据库支持。

### 方法 1：本地快速运行 (Python)
如果你想在局域网内给自己的旧设备使用：
1. 克隆或下载本仓库到本地。
2. 在终端进入该目录，运行：
   ```bash
   python3 -m http.server 80
   ```
3. 确保你的 iOS 设备与电脑在同一 Wi-Fi 下，使用 Safari 访问电脑的局域网 IP 即可。

### 方法 2：部署到 GitHub Pages (推荐)
1. Fork 本仓库。
2. 在仓库的 `Settings` -> `Pages` 中，将 `Source` 设为 `main` 分支。
3. 保存后，即可通过 `https://<你的用户名>.github.io/<仓库名>` 在任意支持的 iOS 设备上访问。

## ⚠️ 注意事项与免责声明 (Disclaimer)

* **证书要求：** 在执行“越狱”功能前，请确保已点击页面提示安装 `beeg.mobileconfig` 并在系统设置中信任该描述文件，否则越狱载荷可能无法顺利写入。
* **KDFU 警告：** 执行 KDFU 载荷会导致设备立即黑屏进入底层恢复模式，**仅限知道如何使用 odysseusOTA 的高级用户操作**，普通用户切勿好奇点击！
* 本项目仅供 iOS 安全研究与旧设备折腾爱好者学习交流使用。由操作不当造成的设备白苹果或数据丢失，开发者概不负责。

## 🤝 鸣谢 (Credits)

本工具箱的前端逻辑与整合由社区重构，但核心的底层 WebKit/Kernel 漏洞利用与二进制载荷归功于以下安全研究人员的无私开源：
* [@mineekdev](https://github.com/mineek)
* [@staturnzdev](https://github.com/staturnzz)
* *以及所有为 iOS 32-bit 越狱社区做出贡献的开发者们。*