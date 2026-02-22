// 记录当前准备执行的漏洞载荷名称
var currentPayload = '';

// 全局设备支持状态标志
var isDeviceSupportedGlobal = true;

// ------------------------------------------------------------------
// 新增：多语言 JSON 字典配置
// ------------------------------------------------------------------
var i18nDictionary = {
    'zh': {
        'langBtn': '🌐 EN',
        'appTitle': 'iOS 工具箱',
        'appSubtitle': '支持 32 位设备 (iOS 8.0 - 9.3.6)',
        'detecting': '正在检测设备环境...',
        'jbTitle': '越狱 (Jailbreak)',
        'jbDesc': '获取设备 Root 权限并安装 Cydia',
        'dgTitle': '修改版本 (Downgrade)',
        'dgDesc': '伪造 SystemVersion 实现 OTA 降级',
        'sbTitle': '安装 Substrate',
        'sbDesc': '网页安装运行环境 (保底方案)',
        'kdfuTitle': '进入 KDFU 模式',
        'kdfuDesc': '底层引导劫持 (供专业人士强刷系统)',
        'footer': 'Based on WebKit Exploit &copy; 2026',
        'modalTitleTip': '提示',
        'btnCancel': '取消',
        'btnInstallCert': '去安装证书',
        'btnConfirm': '确认',
        // 动态检测状态文本
        'sysCompat': '[✅ 系统兼容 ℹ️]',
        'sysIncompat': '[⚠️ 版本不兼容 ℹ️]',
        'sysNotSupport': '[⚠️ 完全不支持 ℹ️]',
        'currDevice': '当前：',
        'unknownVer': '未知版本',
        'nonIOS': '非 iOS 设备',
        // 弹窗配置文本
        'mod_support_title': '支持的设备与系统',
        'mod_support_content': '<p><strong>系统版本：</strong>iOS 8.0 - 9.3.6</p><p><strong>A5(X) 设备：</strong>iPhone 4S；iPad 2、3、mini 1；iPod touch 5</p><p><strong>A6(X) 设备：</strong>iPhone 5、5C；iPad 4</p>',
        'mod_support_close': '关闭',
        'mod_jber_title': '越狱前确认',
        'mod_jber_content': '<p><span class="highlight">注意：</span>iOS 9.3.5 和 9.3.6 并非完全完美越狱，仅支持不完美越狱。</p><p>⚠️ 请确认您已提前安装好了证书！</p>',
        'mod_jber_confirm': '已安装，越狱',
        'mod_dg_title': '版本号修改降级',
        'mod_dg_content': '<p>此功能将 iOS 9.x 的版本号修改伪装，从而实现 OTA 降级至 iOS 8.4.1。</p><p><span class="highlight">注意：</span>执行成功并重启设备后，请前往“设置 - 通用 - 软件更新”检查并下载更新。</p>',
        'mod_dg_confirm': '执行降级',
        'mod_sb_title': '安装 Substrate',
        'mod_sb_content': '<p>网页安装 Substrate 与 SafeMode。</p><p><span class="highlight">注意：</span>此方案效果不佳，极度不稳定。仅作为其他方式均失败后的最后保底方案！</p>',
        'mod_sb_confirm': '强制安装',
        'mod_kdfu_title': '⚠️ KDFU 模式警告',
        'mod_kdfu_content': '<p>警告：进入 KDFU 模式后<span class="highlight">设备将直接黑屏</span>，且只能通过电脑端 odysseusOTA 等专业工具恢复。</p><p>普通用户请勿点击！确认执行？</p>',
        'mod_kdfu_confirm': '确认进入'
    },
    'en': {
        'langBtn': '🌐 中文',
        'appTitle': 'iOS Toolkit',
        'appSubtitle': 'Supports 32-bit (iOS 8.0 - 9.3.6)',
        'detecting': 'Detecting device environment...',
        'jbTitle': 'Jailbreak',
        'jbDesc': 'Get Root access and install Cydia',
        'dgTitle': 'Downgrade',
        'dgDesc': 'Spoof SystemVersion for OTA downgrade',
        'sbTitle': 'Install Substrate',
        'sbDesc': 'Web-based fallback installation',
        'kdfuTitle': 'Enter KDFU Mode',
        'kdfuDesc': 'BootROM hijack for custom firmware',
        'footer': 'Based on WebKit Exploit &copy; 2026',
        'modalTitleTip': 'Prompt',
        'btnCancel': 'Cancel',
        'btnInstallCert': 'Install Cert',
        'btnConfirm': 'Confirm',
        // 动态检测状态文本
        'sysCompat': '[✅ Compatible ℹ️]',
        'sysIncompat': '[⚠️ Incompatible ℹ️]',
        'sysNotSupport': '[⚠️ Unsupported ℹ️]',
        'currDevice': 'Current: ',
        'unknownVer': 'Unknown',
        'nonIOS': 'Non-iOS Device',
        // 弹窗配置文本
        'mod_support_title': 'Supported Devices',
        'mod_support_content': '<p><strong>iOS Version:</strong> 8.0 - 9.3.6</p><p><strong>A5(X) Devices:</strong> iPhone 4S; iPad 2, 3, mini 1; iPod touch 5</p><p><strong>A6(X) Devices:</strong> iPhone 5, 5C; iPad 4</p>',
        'mod_support_close': 'Close',
        'mod_jber_title': 'Jailbreak Confirmation',
        'mod_jber_content': '<p><span class="highlight">Note:</span> iOS 9.3.5 and 9.3.6 are tethered/semi-untethered only.</p><p>⚠️ Make sure you have installed the certificate!</p>',
        'mod_jber_confirm': 'Installed, Jailbreak',
        'mod_dg_title': 'Downgrade Spoof',
        'mod_dg_content': '<p>This spoofs iOS 9.x version to allow OTA downgrade to iOS 8.4.1.</p><p><span class="highlight">Note:</span> After success and reboot, go to Settings -> General -> Software Update.</p>',
        'mod_dg_confirm': 'Downgrade',
        'mod_sb_title': 'Install Substrate',
        'mod_sb_content': '<p>Web installation of Substrate & SafeMode.</p><p><span class="highlight">Note:</span> Highly unstable fallback method only!</p>',
        'mod_sb_confirm': 'Force Install',
        'mod_kdfu_title': '⚠️ KDFU Warning',
        'mod_kdfu_content': '<p>Warning: Device will <span class="highlight">go black</span> and require odysseusOTA to restore.</p><p>For advanced users only! Proceed?</p>',
        'mod_kdfu_confirm': 'Enter KDFU'
    }
};

// 当前激活的语言标识，默认优先读取本地存储
var currentLang = 'zh';
if (window.localStorage) {
    currentLang = localStorage.getItem('legacyPwnLang') || 'zh';
}
var langData = i18nDictionary[currentLang];

// 动态获取不同操作的弹窗文案配置（重构为函数以支持语言热切换）
function getModalConfigs() {
    return {
        'supportInfo': {
            title: langData['mod_support_title'],
            content: langData['mod_support_content'],
            cancelText: langData['mod_support_close'],
            hideConfirm: true,
            showCertBtn: false
        },
        'jber': {
            title: langData['mod_jber_title'],
            content: langData['mod_jber_content'],
            confirmText: langData['mod_jber_confirm'],
            cancelText: langData['btnCancel'],
            btnStyle: 'modal-btn-confirm',
            showCertBtn: true
        },
        'downgrade': {
            title: langData['mod_dg_title'],
            content: langData['mod_dg_content'],
            confirmText: langData['mod_dg_confirm'],
            cancelText: langData['btnCancel'],
            btnStyle: 'modal-btn-confirm',
            showCertBtn: false
        },
        'instdeb': {
            title: langData['mod_sb_title'],
            content: langData['mod_sb_content'],
            confirmText: langData['mod_sb_confirm'],
            cancelText: langData['btnCancel'],
            btnStyle: 'modal-btn-confirm',
            showCertBtn: false
        },
        'kdfu': {
            title: langData['mod_kdfu_title'],
            content: langData['mod_kdfu_content'],
            confirmText: langData['mod_kdfu_confirm'],
            cancelText: langData['btnCancel'],
            btnStyle: 'modal-btn-danger',
            showCertBtn: false
        }
    };
}

// 切换语言方法
function toggleLanguage() {
    var newLang = (currentLang === 'zh') ? 'en' : 'zh';
    currentLang = newLang;
    langData = i18nDictionary[newLang];
    
    if (window.localStorage) {
        localStorage.setItem('legacyPwnLang', newLang);
    }
    
    applyLanguageToDOM();
    checkDeviceInfo(); // 重新渲染设备状态徽章
}

// 将语言应用到 HTML 的 data-i18n 节点上
function applyLanguageToDOM() {
    var elements = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < elements.length; i++) {
        var key = elements[i].getAttribute('data-i18n');
        if (langData[key]) {
            elements[i].innerHTML = langData[key];
        }
    }
    // 修改 html 标签的 lang 属性
    document.documentElement.lang = (currentLang === 'zh') ? 'zh-CN' : 'en';
}

// ------------------------------------------------------------------

// 显示弹窗函数
function showModal(payloadName) {
    // 如果设备不支持，且点击的不是“支持信息”弹窗，则直接拦截点击事件
    if (!isDeviceSupportedGlobal && payloadName !== 'supportInfo') {
        return;
    }

    currentPayload = payloadName;
    var config = getModalConfigs()[payloadName]; // 获取当前语言下的配置
    
    if(config) {
        document.getElementById('modalTitle').innerHTML = config.title;
        if (payloadName === 'kdfu') {
            document.getElementById('modalTitle').className = 'modal-title danger';
        } else {
            document.getElementById('modalTitle').className = 'modal-title';
        }
        
        document.getElementById('modalContent').innerHTML = config.content;
        
        // 根据配置判断是否需要隐藏确认按钮
        var btnConfirm = document.getElementById('btnConfirm');
        if (config.hideConfirm) {
            btnConfirm.style.display = 'none';
        } else {
            btnConfirm.style.display = 'inline-block';
            btnConfirm.innerText = config.confirmText;
            btnConfirm.className = 'modal-btn ' + config.btnStyle;
        }
        
        // 统一将 btnCancel 的行为设置为关闭弹窗
        document.getElementById('btnCancel').innerText = config.cancelText;
        document.getElementById('btnCancel').onclick = closeModal;

        // 判断是否需要显示“去安装证书”的独立按钮
        var btnCert = document.getElementById('btnInstallCert');
        if(config.showCertBtn) {
            btnCert.style.display = 'inline-block';
            btnCert.innerText = langData['btnInstallCert'];
        } else {
            btnCert.style.display = 'none';
        }

        // 极致兼容性优化：放弃 classList，改用最原始的 className 字符串覆盖
        document.getElementById('customModal').className = 'modal-overlay active';
    }
}

// 关闭弹窗函数
function closeModal() {
    // 极致兼容性优化：恢复默认 class 隐藏弹窗
    document.getElementById('customModal').className = 'modal-overlay';
    currentPayload = '';
}

// 独立的去安装证书逻辑函数
function installCert() {
    window.location.href = "assets/certs/beeg.mobileconfig";
    closeModal();
}

// 弹窗中点击确认后执行核心代码
function executeCurrentAction() {
    // 如果是纯信息展示弹窗，则不执行任何漏洞脚本
    if (!currentPayload || currentPayload === 'supportInfo') {
        closeModal();
        return;
    }
    
    var targetPayload = currentPayload;
    closeModal(); // 先关闭弹窗

    // 调用 wkloader 执行漏洞逻辑
    if (typeof wkloader !== 'undefined' && wkloader.run) {
        // 给予弹窗动画一点关闭时间再执行高负载漏洞，防止 UI 卡死
        setTimeout(function() {
            wkloader.run(targetPayload);
        }, 300);
    } else {
        alert("核心提权脚本未能成功加载，请刷新页面重试。\nCore exploit script failed to load, please refresh.");
    }
}

// 检测当前设备 UA 和系统版本，并与支持列表进行比对
function checkDeviceInfo() {
    var ua = navigator.userAgent;
    var deviceType = "";
    var osVersion = "";
    var isSupported = false;
    var isIOS = false;

    // 1. 判断是否为 iOS 设备族
    if (ua.indexOf("iPhone") > -1) { deviceType = "iPhone"; isIOS = true; }
    else if (ua.indexOf("iPad") > -1) { deviceType = "iPad"; isIOS = true; }
    else if (ua.indexOf("iPod") > -1) { deviceType = "iPod touch"; isIOS = true; }

    // 2. 提取并判断系统版本
    if (isIOS) {
        var match = ua.match(/OS (\d+)_(\d+)(?:_(\d+))?/);
        if (match) {
            var major = parseInt(match[1], 10);
            var minor = parseInt(match[2], 10);
            var patch = match[3] ? parseInt(match[3], 10) : 0;
            osVersion = major + "." + minor + (patch > 0 ? "." + patch : "");

            // 判断版本是否在 8.0 - 9.3.6 之间
            if (major === 8 || (major === 9 && minor <= 3)) {
                isSupported = true;
                if (major === 9 && minor === 3 && patch > 6) {
                    isSupported = false;
                }
            }
        } else {
            osVersion = langData['unknownVer'];
        }
    } else {
        deviceType = langData['nonIOS'];
    }

    // 3. 渲染结果到页面并更新全局状态
    var infoEl = document.getElementById("deviceInfo");
    if (infoEl) {
        var clickAction = ' onclick="showModal(\'supportInfo\')"';
        if (isIOS) {
            var displayStr = langData['currDevice'] + deviceType + " (iOS " + osVersion + ")";
            if (isSupported) {
                infoEl.innerHTML = displayStr + ' <span class="status-ok"' + clickAction + '>' + langData['sysCompat'] + '</span>';
                isDeviceSupportedGlobal = true;
            } else {
                infoEl.innerHTML = displayStr + ' <span class="status-err"' + clickAction + '>' + langData['sysIncompat'] + '</span>';
                isDeviceSupportedGlobal = false;
            }
        } else {
            infoEl.innerHTML = langData['currDevice'] + deviceType + ' <span class="status-err"' + clickAction + '>' + langData['sysNotSupport'] + '</span>';
            isDeviceSupportedGlobal = false;
        }
    }

    // 如果设备不支持，则将所有操作卡片视觉上置为禁用状态
    if (!isDeviceSupportedGlobal) {
        var cards = document.getElementsByClassName('action-card');
        for (var i = 0; i < cards.length; i++) {
            if (cards[i].className.indexOf('disabled') === -1) {
                cards[i].className += ' disabled';
            }
        }
    }
}

// 页面加载解析完毕后自动初始化多语言与设备检测
applyLanguageToDOM();
checkDeviceInfo();