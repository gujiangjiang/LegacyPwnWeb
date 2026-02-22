// 记录当前准备执行的漏洞载荷名称
var currentPayload = '';

// 全局设备支持状态标志
var isDeviceSupportedGlobal = true;

// 全局语言数据变量
var langData = {};

// 当前激活的语言标识，默认优先读取本地存储
var currentLang = 'zh';
if (window.localStorage) {
    currentLang = localStorage.getItem('legacyPwnLang') || 'zh';
}

// ------------------------------------------------------------------
// 新增：通过同步 XHR 请求加载外部 JSON 语言文件
// ------------------------------------------------------------------
function fetchLanguageJSON(langCode) {
    var xhttp = new XMLHttpRequest();
    // 加上时间戳防止旧版 iOS Safari 顽固的缓存机制
    xhttp.open("GET", "assets/lang/" + langCode + ".json?v=" + new Date().getTime(), false);
    
    try {
        xhttp.send();
        // 兼容处理：HTTP状态码 200 为正常，0 为旧版 WebKit 处理本地文件的特例
        if (xhttp.status === 200 || xhttp.status === 0) {
            return JSON.parse(xhttp.responseText);
        } else {
            console.error("Failed to load language file, status: " + xhttp.status);
        }
    } catch (e) {
        console.error("Error fetching language JSON: ", e);
    }
    return null;
}

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
    
    // 尝试拉取新的语言文件
    var newLangData = fetchLanguageJSON(newLang);
    if (newLangData) {
        currentLang = newLang;
        langData = newLangData;
        
        if (window.localStorage) {
            localStorage.setItem('legacyPwnLang', newLang);
        }
        
        applyLanguageToDOM();
        checkDeviceInfo(); // 重新渲染设备状态徽章
    } else {
        alert("语言文件加载失败，请检查网络或部署环境。\nFailed to load language file.");
    }
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

// 初始化应用语言
function initLanguage() {
    var initialData = fetchLanguageJSON(currentLang);
    if (initialData) {
        langData = initialData;
    } else {
        // 如果拉取失败，退回默认中文尝试一次
        console.warn("Falling back to default language.");
        currentLang = 'zh';
        langData = fetchLanguageJSON('zh') || {};
    }
    applyLanguageToDOM();
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
            osVersion = langData['unknownVer'] || "未知版本";
        }
    } else {
        deviceType = langData['nonIOS'] || "非 iOS 设备";
    }

    // 3. 渲染结果到页面并更新全局状态
    var infoEl = document.getElementById("deviceInfo");
    if (infoEl && langData['currDevice']) {
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
initLanguage();
checkDeviceInfo();