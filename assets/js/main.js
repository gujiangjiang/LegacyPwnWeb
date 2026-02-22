// 记录当前准备执行的漏洞载荷名称
var currentPayload = '';

// 定义不同操作的弹窗文案配置（使用 var 提升旧版 iOS Safari 兼容性）
var modalConfigs = {
    // 新增：独立的设备支持信息弹窗配置，用于首页全局点击展示
    'supportInfo': {
        title: '支持的设备与系统',
        content: '<p><strong>系统版本：</strong>iOS 8.0 - 9.3.6</p><p><strong>A5(X) 设备：</strong>iPhone 4S；iPad 2、3、mini 1；iPod touch 5</p><p><strong>A6(X) 设备：</strong>iPhone 5、5C；iPad 4</p>',
        cancelText: '关闭',
        hideConfirm: true, // 新增：标识隐藏确认按钮（仅作信息展示用）
        showCertBtn: false
    },
    'jber': {
        title: '越狱前确认',
        // 优化：将支持设备信息移出，使文案更精简
        content: '<p><span class="highlight">注意：</span>iOS 9.3.5 和 9.3.6 并非完全完美越狱，仅支持不完美越狱。</p><p>⚠️ 请确认您已提前安装好了证书！</p>',
        confirmText: '已安装，越狱',
        cancelText: '取消', // 优化：恢复正常的取消文案
        btnStyle: 'modal-btn-confirm',
        showCertBtn: true // 新增：标识在此弹窗中需要显示“去安装证书”按钮
    },
    'downgrade': {
        title: '版本号修改降级',
        content: '<p>此功能将 iOS 9.x 的版本号修改伪装，从而实现 OTA 降级至 iOS 8.4.1。</p><p><span class="highlight">注意：</span>执行成功并重启设备后，请前往“设置 - 通用 - 软件更新”检查并下载更新。</p>',
        confirmText: '执行降级',
        cancelText: '取消',
        btnStyle: 'modal-btn-confirm',
        showCertBtn: false
    },
    'instdeb': {
        title: '安装 Substrate',
        content: '<p>网页安装 Substrate 与 SafeMode。</p><p><span class="highlight">注意：</span>此方案效果不佳，极度不稳定。仅作为其他方式均失败后的最后保底方案！</p>',
        confirmText: '强制安装',
        cancelText: '取消',
        btnStyle: 'modal-btn-confirm',
        showCertBtn: false
    },
    'kdfu': {
        title: '⚠️ KDFU 模式警告',
        content: '<p>警告：进入 KDFU 模式后<span class="highlight">设备将直接黑屏</span>，且只能通过电脑端 odysseusOTA 等专业工具恢复。</p><p>普通用户请勿点击！确认执行？</p>',
        confirmText: '确认进入',
        cancelText: '取消',
        btnStyle: 'modal-btn-danger',
        showCertBtn: false
    }
};

// 显示弹窗函数
function showModal(payloadName) {
    currentPayload = payloadName;
    var config = modalConfigs[payloadName];
    
    if(config) {
        document.getElementById('modalTitle').innerHTML = config.title;
        if (payloadName === 'kdfu') {
            document.getElementById('modalTitle').className = 'modal-title danger';
        } else {
            document.getElementById('modalTitle').className = 'modal-title';
        }
        
        document.getElementById('modalContent').innerHTML = config.content;
        
        // 优化：根据配置判断是否需要隐藏确认按钮
        var btnConfirm = document.getElementById('btnConfirm');
        if (config.hideConfirm) {
            btnConfirm.style.display = 'none';
        } else {
            btnConfirm.style.display = 'inline-block';
            btnConfirm.innerText = config.confirmText;
            btnConfirm.className = 'modal-btn ' + config.btnStyle;
        }
        
        // 优化：统一将 btnCancel 的行为设置为关闭弹窗
        document.getElementById('btnCancel').innerText = config.cancelText || '取消';
        document.getElementById('btnCancel').onclick = closeModal;

        // 新增：判断是否需要显示“去安装证书”的独立按钮
        var btnCert = document.getElementById('btnInstallCert');
        if(config.showCertBtn) {
            btnCert.style.display = 'inline-block';
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

// 新增：独立的去安装证书逻辑函数
function installCert() {
    window.location.href = "assets/certs/beeg.mobileconfig";
    closeModal();
}

// 弹窗中点击确认后执行核心代码
function executeCurrentAction() {
    // 优化：如果是纯信息展示弹窗，则不执行任何漏洞脚本
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
        alert("核心提权脚本未能成功加载，请刷新页面重试。");
    }
}

// 新增：检测当前设备 UA 和系统版本，并与支持列表进行比对
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
        // 正则匹配 OS 版本号，例如 "OS 9_3_5"
        var match = ua.match(/OS (\d+)_(\d+)(?:_(\d+))?/);
        if (match) {
            var major = parseInt(match[1], 10);
            var minor = parseInt(match[2], 10);
            var patch = match[3] ? parseInt(match[3], 10) : 0;
            osVersion = major + "." + minor + (patch > 0 ? "." + patch : "");

            // 判断版本是否在 8.0 - 9.3.6 之间
            if (major === 8 || (major === 9 && minor <= 3)) {
                isSupported = true;
                // 排除 9.3.7 及以上 (虽然理论上 iOS 9 官方只到 9.3.6)
                if (major === 9 && minor === 3 && patch > 6) {
                    isSupported = false;
                }
            }
        } else {
            osVersion = "未知版本";
        }
    } else {
        deviceType = "非 iOS 设备";
    }

    // 3. 渲染结果到页面（注：受限于浏览器 UA 机制，无法精准区分具体机型如 iPhone 4S 还是 5）
    var infoEl = document.getElementById("deviceInfo");
    if (infoEl) {
        if (isIOS) {
            var displayStr = "当前：" + deviceType + " (iOS " + osVersion + ")";
            if (isSupported) {
                infoEl.innerHTML = displayStr + ' <span class="status-ok">[✅ 系统兼容]</span>';
            } else {
                infoEl.innerHTML = displayStr + ' <span class="status-err">[⚠️ 版本不兼容]</span>';
            }
        } else {
            infoEl.innerHTML = "当前：" + deviceType + ' <span class="status-err">[⚠️ 完全不支持]</span>';
        }
    }
}

// 页面加载解析完毕后自动执行设备检测
checkDeviceInfo();