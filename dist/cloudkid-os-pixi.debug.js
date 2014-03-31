!function(undefined) {
    var OS = function() {}, p = OS.prototype = Object.create(PIXI.DisplayObjectContainer.prototype), _paused = !1, _isReady = !1, _framerate = null, _lastFrameTime = 0, _lastFPSUpdateTime = 0, _framerateValue = null, _frameCount = 0, _tickCallback = null, _instance = null, _tickId = -1, _useRAF = !1, _fps = 0, _msPerFrame = 0;
    OS.VERSION = "1.1.0", p.stage = null, p._renderer = null, p.canvasContainer = null, 
    p._app = null, p.options = null, p._updateFunctions = {}, OS.init = function(stageName, options) {
        return _instance || (Debug.log("Creating the singleton instance of OS"), _instance = new OS(), 
        _instance.initialize(stageName, options)), _instance;
    }, p.initialize = function(stageName, opts) {
        PIXI.DisplayObjectContainer.call(this), this.options = opts || {}, this.options.parseQueryString !== undefined && (this.options = parseQueryStringParams(this.options)), 
        this.options.debug !== undefined && (Debug.enabled = this.options.debug === !0 || "true" === this.options.debug), 
        this.options.minLogLevel !== undefined && (Debug.minLogLevel = parseInt(this.options.minLogLevel, 10)), 
        "string" == typeof this.options.ip && Debug.connect(this.options.ip);
        var loader = cloudkid.MediaLoader.init();
        this.stage = new PIXI.Stage(this.options.backgroundColor || 0, !0), this.stage.addChild(this), 
        this.visibleListener = this.onWindowVisibilityChanged.bind(this), addPageHideListener(this.visibleListener);
        var transparent = !!this.options.transparent || !1, preMultAlpha = !!this.options.preMultAlpha || !1;
        this.containerName = "string" == typeof stageName ? stageName : stageName.attr("id");
        var container = "string" == typeof stageName ? document.getElementById(stageName) : stageName, canvasContainer = this.canvasContainer = document.createElement("div");
        container.appendChild(canvasContainer), canvasContainer.id = "CKOS";
        var width = this.options.width || container.innerWidth, height = this.options.height || container.innerHeight;
        if (this._renderer = "canvas2d" == this.options.forceContext ? new PIXI.CanvasRenderer(width, height, null, transparent) : "webgl" == this.options.forceContext ? new PIXI.WebGLRenderer(width, height, null, transparent, preMultAlpha) : PIXI.autoDetectRenderer(width, height, null, transparent, preMultAlpha), 
        canvasContainer.appendChild(this._renderer.view), canvasContainer.setAttribute("style", "position:relative;width:" + width + "px;height:" + height + "px"), 
        this._renderer.clearView = !!this.options.clearView, this.options.showFramerate && (_framerate = new PIXI.Text("FPS: 0.000", {
            font: "10px Arial",
            fill: "black",
            stroke: "white",
            strokeThickness: 2
        }), _framerate.x = _framerate.y = 5, this.addChild(_framerate)), this._renderer.render(this.stage), 
        _tickCallback = this.tick.bind(this), _useRAF = this.options.raf || !1, this.fps = this.options.fps || 60, 
        this.removeApp(), this.options.versionsFile !== undefined) {
            _isReady = !1;
            var os = this;
            loader.cacheManager.addVersionsFile(this.options.versionsFile, function() {
                _isReady = !0, os._app && (os.addChildAt(os._app, 0), os._app.init(), os.resume());
            });
        } else _isReady = !0;
    };
    var hidden = null, evtMap = null, v = "visible", h = "hidden", addPageHideListener = function(listener) {
        hidden = "hidden", hidden in document ? document.addEventListener("visibilitychange", listener) : (hidden = "mozHidden") in document ? document.addEventListener("mozvisibilitychange", listener) : (hidden = "webkitHidden") in document ? document.addEventListener("webkitvisibilitychange", listener) : (hidden = "msHidden") in document ? document.addEventListener("msvisibilitychange", listener) : "onfocusin" in document ? (evtMap = {
            focusin: v,
            focusout: h
        }, document.onfocusin = document.onfocusout = listener) : (evtMap = {
            focus: v,
            pageshow: v,
            blur: h,
            pagehide: h
        }, window.onpageshow = window.onpagehide = window.onfocus = window.onblur = listener);
    }, removePageHideListener = function(listener) {
        var hidden = "hidden";
        hidden in document ? document.removeEventListener("visibilitychange", listener) : (hidden = "mozHidden") in document ? document.removeEventListener("mozvisibilitychange", listener) : (hidden = "webkitHidden") in document ? document.removeEventListener("webkitvisibilitychange", listener) : (hidden = "msHidden") in document && document.removeEventListener("msvisibilitychange", listener), 
        document.onfocusin = document.onfocusout = null, window.onpageshow = window.onpagehide = window.onfocus = window.onblur = null;
    };
    p.onWindowVisibilityChanged = function(evt) {
        var v = "visible", h = "hidden";
        evt = evt || window.event;
        var value;
        value = evtMap ? evtMap[evt.type] : document[hidden] ? h : v, value == h ? this.pause() : this.resume();
    };
    var parseQueryStringParams = function(output) {
        var href = window.location.href, questionMark = href.indexOf("?");
        if (-1 == questionMark) return output;
        var vars = 0 > questionMark ? "" : href.substr(questionMark + 1), pound = vars.indexOf("#");
        vars = 0 > pound ? vars : vars.substring(0, pound);
        var myVar, splitFlashVars = vars.split("&");
        for (var i in splitFlashVars) myVar = splitFlashVars[i].split("="), Debug.log(myVar[0] + " -> " + myVar[1]), 
        output[myVar[0]] = myVar[1];
        return output;
    };
    p.pause = function() {
        -1 != _tickId && (_useRAF ? window.cancelAnimationFrame && cancelAnimationFrame(_tickId) : clearTimeout(_tickId), 
        _tickId = -1), _paused = !0;
    };
    var nowFunc = window.performance && (performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow);
    nowFunc = nowFunc ? nowFunc.bind(performance) : function() {
        return new Date().getTime();
    }, p.getTime = function() {
        return nowFunc();
    }, p.resume = function() {
        _paused = !1, -1 == _tickId && (_tickId = _useRAF ? requestAnimFrame(_tickCallback) : setTargetedTimeout(_tickCallback)), 
        _lastFPSUpdateTime = _lastFrameTime = this.getTime();
    }, Object.defineProperty(p, "fps", {
        get: function() {
            return _fps;
        },
        set: function(value) {
            "number" == typeof value && (_fps = value, _msPerFrame = 1e3 / _fps | 0);
        }
    }), Object.defineProperty(p, "stageWidth", {
        get: function() {
            return _instance._renderer.view.width;
        }
    }), Object.defineProperty(p, "stageHeight", {
        get: function() {
            return _instance._renderer.view.height;
        }
    });
    var setTargetedTimeout = function(callback, timeInFrame) {
        var timeToCall = 0;
        return timeInFrame && (timeToCall = Math.max(0, _msPerFrame - timeInFrame)), setTimeout(callback, timeToCall);
    };
    p.removeApp = function(destroying) {
        var removed = !1, stage = this.stage;
        return this._app && (this._app.parent == this && this.removeChild(this._app), stage.removeChildren(), 
        this._app.destroy(), removed = !0), this._app = null, this.pause(), destroying || (stage.addChild(this), 
        _framerate && (_framerate.text = "FPS: 0.000"), _lastFrameTime = _lastFPSUpdateTime = _framerateValue = _frameCount = 0, 
        this._renderer.render(stage)), removed;
    }, p.addApp = function(app) {
        if (this.removeApp(), !(app instanceof cloudkid.Application)) throw new Error("Can only objects that inherit cloudkid.Application");
        this._app = app, _isReady && (this.addChildAt(app, 0), this._app.init(), this.resume());
    }, p.getApp = function() {
        return this._app;
    }, p.addUpdateCallback = function(alias, f) {
        this._updateFunctions[alias] === undefined && (this._updateFunctions[alias] = f);
    }, p.removeUpdateCallback = function(alias) {
        this._updateFunctions[alias] !== undefined && delete this._updateFunctions[alias];
    }, p.tick = function() {
        if (_paused) return void (_tickId = -1);
        var now = this.getTime(), dTime = now - _lastFrameTime;
        if (_framerate && _framerate.visible) {
            _frameCount++;
            var elapsed = now - _lastFPSUpdateTime;
            elapsed > 1e3 && (_framerateValue = 1e3 / elapsed * _frameCount, _framerate.setText("FPS: " + Math.round(1e3 * _framerateValue) / 1e3), 
            _lastFPSUpdateTime = now, _frameCount = 0);
        }
        _lastFrameTime = now, this._app && this._app.update(dTime);
        for (var alias in this._updateFunctions) this._updateFunctions[alias](dTime);
        this._renderer.render(this.stage), _tickId = _useRAF ? requestAnimFrame(_tickCallback) : setTargetedTimeout(_tickCallback, this.getTime() - _lastFrameTime);
    }, p.resize = function(width, height) {
        this._renderer.resize(width, height), this.canvasContainer.setAttribute("style", "position:relative;width:" + width + "px;height:" + height + "px");
    }, p.destroy = function() {
        var stage = this.stage, ml = cloudkid.MediaLoader.instance;
        this.pause(), this.removeApp(!0), _instance = null, ml.destroy(), this.stage = null, 
        this._updateFunctions = null, removePageHideListener(this.visibleListener), this.removeChildren(!0), 
        stage.destroy(), this._renderer.destroy(), this._renderer = null, this.canvasContainer = null;
    }, Object.defineProperty(OS, "instance", {
        get: function() {
            if (!_instance) throw "Call cloudkid.OS.init(canvasId)";
            return _instance;
        }
    }), namespace("cloudkid").OS = OS;
}(), function() {
    "use strict";
    var SavedData = function() {}, WEB_STORAGE_SUPPORT = "undefined" != typeof window.Storage, ERASE_COOKIE = -1;
    if (WEB_STORAGE_SUPPORT) try {
        localStorage.setItem("LS_TEST", "test"), localStorage.removeItem("LS_TEST");
    } catch (e) {
        WEB_STORAGE_SUPPORT = !1;
    }
    SavedData.remove = function(name) {
        WEB_STORAGE_SUPPORT ? (localStorage.removeItem(name), sessionStorage.removeItem(name)) : SavedData.write(name, "", ERASE_COOKIE);
    }, SavedData.write = function(name, value, tempOnly) {
        if (WEB_STORAGE_SUPPORT) tempOnly ? sessionStorage.setItem(name, JSON.stringify(value)) : localStorage.setItem(name, JSON.stringify(value)); else {
            var expires;
            expires = tempOnly ? tempOnly !== ERASE_COOKIE ? "" : "; expires=Thu, 01 Jan 1970 00:00:00 GMT" : "; expires=" + new Date(2147483646e3).toGMTString(), 
            document.cookie = name + "=" + escape(JSON.stringify(value)) + expires + "; path=/";
        }
    }, SavedData.read = function(name) {
        if (WEB_STORAGE_SUPPORT) {
            var value = localStorage.getItem(name) || sessionStorage.getItem(name);
            return value ? JSON.parse(value) : null;
        }
        var c, nameEQ = name + "=", ca = document.cookie.split(";"), i = 0;
        for (i = 0; i < ca.length; i++) {
            for (c = ca[i]; " " == c.charAt(0); ) c = c.substring(1, c.length);
            if (0 === c.indexOf(nameEQ)) return JSON.parse(unescape(c.substring(nameEQ.length, c.length)));
        }
        return null;
    }, namespace("cloudkid").SavedData = SavedData;
}(), function() {
    window.URL = window.URL || window.webkitURL, window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder, 
    namespace("cloudkid").createWorker = function(codeString) {
        if (!window.URL || !window.Worker) return new FallbackWorker(codeString);
        var blob;
        try {
            blob = new Blob([ codeString ], {
                type: "application/javascript"
            });
        } catch (e) {
            if (!window.BlobBuilder) return new FallbackWorker(codeString);
            try {
                blob = new BlobBuilder(), blob.append(codeString), blob = blob.getBlob();
            } catch (error) {
                return new FallbackWorker(codeString);
            }
        }
        if (!blob) return new FallbackWorker(codeString);
        try {
            var worker = new Worker(URL.createObjectURL(blob));
            return worker;
        } catch (e) {
            return new FallbackWorker(codeString);
        }
    };
    var SubWorker = function(codeString, parent) {
        this._wParent = parent, eval(codeString);
    }, p = SubWorker.prototype;
    p.onmessage = null, p.postMessage = function(data) {
        var parent = this._wParent;
        setTimeout(parent.onmessage.bind(parent, {
            data: data
        }), 1);
    };
    var FallbackWorker = function(codeString) {
        this._wChild = new SubWorker(codeString, this);
    };
    p = FallbackWorker.prototype, p.postMessage = function(data) {
        var child = this._wChild;
        setTimeout(child.onmessage.bind(child, {
            data: data
        }), 1);
    }, p.terminate = function() {
        this.onmessage = null;
        var child = this._wChild;
        child._wParent = null, child.onmessage = null, this._wChild = null;
    }, p.onmessage = null, p._wChild = null;
}(), function() {
    var CombinedCallback = function(call, obj, prop, callProp) {
        obj[prop] ? obj[callProp] = call : call();
    };
    CombinedCallback.create = function(call, obj, prop, callProp) {
        return CombinedCallback.bind(this, call, obj, prop, callProp);
    }, namespace("cloudkid").CombinedCallback = CombinedCallback;
}(), function() {
    var p, Application = function() {
        PIXI.DisplayObjectContainer.call(this);
    };
    p = Application.prototype = Object.create(PIXI.DisplayObjectContainer.prototype), 
    p.init = function() {}, p.update = function() {}, p.destroy = function() {}, p.resize = function() {}, 
    namespace("cloudkid").Application = Application;
}(), function() {
    var LoaderQueueItem = function() {}, p = LoaderQueueItem.prototype;
    LoaderQueueItem.PRIORITY_HIGH = 1, LoaderQueueItem.PRIORITY_NORMAL = 0, LoaderQueueItem.PRIORITY_LOW = -1, 
    p.url = null, p.data = null, p.callback = null, p.priority = 0, p.progress = 0, 
    p.updateCallback = null, p._boundFail = null, p._boundProgress = null, p._boundComplete = null, 
    p.toString = function() {
        return "[LoaderQueueItem(url:'" + this.url + "', priority:" + this.priority + ")]";
    }, p.destroy = function() {
        this.callback = null, this.updateCallback = null, this.data = null, this._boundFail = null, 
        this._boundProgress = null, this._boundComplete = null;
    }, namespace("cloudkid").LoaderQueueItem = LoaderQueueItem;
}(), function() {
    var MediaLoader = function() {}, p = MediaLoader.prototype;
    MediaLoader._instance = null;
    var queue = null, queueItems = null, loaders = null, qiPool = null, loaderPool = null, resultPool = null, numLoads = 0, retries = null;
    p._canLoad = !0, p.maxSimultaneousLoads = 2, p.cacheManager = null, MediaLoader.init = function() {
        return MediaLoader._instance || (MediaLoader._instance = new MediaLoader(), MediaLoader._instance._initialize()), 
        MediaLoader._instance;
    }, Object.defineProperty(MediaLoader, "instance", {
        get: function() {
            if (!MediaLoader._instance) throw "Call cloudkid.MediaLoader.init()";
            return MediaLoader._instance;
        }
    }), p.destroy = function() {
        var i, len, key, arr = this.queue;
        if (arr) {
            for (i = 0, len = arr.length; i > i; ++i) arr[i].destroy();
            for (arr = qiPool, i = 0, len = arr.length; i > i; ++i) arr[i].destroy();
            for (arr = resultPool, i = 0, len = arr.length; i > i; ++i) arr[i].destroy();
            for (key in loaders) queueItems[key].destroy(), loaders[key].close();
        }
        MediaLoader._instance = null, this.cacheManager && this.cacheManager.destroy(), 
        this.cacheManager = null, queue = null, resultPool = null, loaderPool = null, qiPool = null, 
        queueItems = null, retries = null, loaders = null;
    }, p._initialize = function() {
        qiPool = [], loaderPool = [], resultPool = [], queue = [], queueItems = {}, loaders = {}, 
        retries = {}, this.cacheManager = new cloudkid.CacheManager();
    }, p.load = function(url, callback, updateCallback, priority, data) {
        var qi = this._getQI(), basePath = cloudkid.OS.instance.options.basePath;
        void 0 !== basePath && /^http(s)?\:/.test(url) === !1 && -1 == url.search(basePath) && (qi.basePath = basePath), 
        qi.url = url, qi.callback = callback, qi.updateCallback = updateCallback || null, 
        qi.priority = priority || cloudkid.LoaderQueueItem.PRIORITY_NORMAL, qi.data = data || null, 
        queue.push(qi), queue.sort(function(a, b) {
            return a.priority - b.priority;
        }), this._tryNextLoad();
    }, p._onLoadFailed = function(qi, event) {
        Debug.error("Unable to load file: " + qi.url + " - reason: " + event.error);
        var loader = loaders[qi.url];
        loader.removeAllEventListeners(), loader.close(), this._poolLoader(loader), delete queueItems[qi.url], 
        delete loaders[qi.url], retries[qi.url] ? retries[qi.url]++ : retries[qi.url] = 1, 
        retries[qi.url] > 3 ? this._loadDone(qi, null) : (numLoads--, queue.push(qi), this._tryNextLoad());
    }, p._onLoadProgress = function(qi, event) {
        qi.progress = event.progress, qi.updateCallback && qi.updateCallback(qi.progress);
    }, p._onLoadCompleted = function(qi, ev) {
        Debug.log("File loaded successfully from " + qi.url);
        var loader = loaders[qi.url];
        loader.removeAllEventListeners(), loader.close(), this._poolLoader(loader), delete queueItems[qi.url], 
        delete loaders[qi.url], this._loadDone(qi, this._getResult(ev.result, qi.url, loader));
    }, p._tryNextLoad = function() {
        if (!(numLoads > this.maxSimultaneousLoads - 1 || 0 === queue.length)) {
            numLoads++;
            var qi = queue.shift();
            Debug.log("Attempting to load file '" + qi.url + "'"), queueItems[qi.url] = qi;
            var loader = this._getLoader(qi.basePath);
            loaders[qi.url] = loader, loader.addEventListener("fileload", qi._boundComplete), 
            loader.addEventListener("error", qi._boundFail), loader.addEventListener("fileprogress", qi._boundProgress);
            var url = this.cacheManager.prepare(qi.url);
            loader.loadFile(qi.data ? {
                id: qi.data.id,
                src: url,
                data: qi.data
            } : url);
        }
    }, p._loadDone = function(qi, result) {
        numLoads--, qi.data && result && (result.id = qi.data.id), qi.callback(result), 
        this._poolQI(qi), this._tryNextLoad();
    }, p.cancel = function(url) {
        var qi = queueItems[url], loader = loaders[url];
        if (qi && loader) return loader.close(), delete loaders[url], delete queueItems[qi.url], 
        numLoads--, this._poolLoader(loader), this._poolQI(qi), !0;
        for (i = 0, len = queue.length; len > i; i++) if (qi = queue[i], qi.url == url) return queue.splice(i, 1), 
        this._poolQI(qi), !0;
        return !1;
    }, p._getQI = function() {
        var rtn;
        return qiPool.length ? rtn = qiPool.pop() : (rtn = new cloudkid.LoaderQueueItem(), 
        rtn._boundFail = this._onLoadFailed.bind(this, rtn), rtn._boundProgress = this._onLoadProgress.bind(this, rtn), 
        rtn._boundComplete = this._onLoadCompleted.bind(this, rtn)), rtn;
    }, p._poolQI = function(qi) {
        qiPool.push(qi), qi.callback = qi.updateCallback = qi.data = qi.url = null, qi.progress = 0;
    }, p._getLoader = function(basePath) {
        var rtn;
        return loaderPool.length ? (rtn = loaderPool.pop(), rtn._basePath = basePath) : rtn = new createjs.LoadQueue(!0, basePath), 
        createjs.Sound && rtn.installPlugin(createjs.Sound), rtn;
    }, p._poolLoader = function(loader) {
        loader.removeAll(), loaderPool.push(loader);
    }, p._getResult = function(result, url, loader) {
        var rtn;
        return resultPool.length ? (rtn = resultPool.pop(), rtn.content = result, rtn.url = url, 
        rtn.loader = loader) : rtn = new cloudkid.MediaLoaderResult(result, url, loader), 
        rtn;
    }, p._poolResult = function(result) {
        result.content = result.url = result.loader = result.id = null, resultPool.push(result);
    }, namespace("cloudkid").MediaLoader = MediaLoader;
}(), function() {
    var MediaLoaderResult = function(content, url, loader) {
        this.content = content, this.url = url, this.loader = loader;
    }, p = MediaLoaderResult.prototype;
    p.content = null, p.url = null, p.loader = null, p.toString = function() {
        return "[MediaLoaderResult('" + this.url + "')]";
    }, p.destroy = function() {
        this.callback = null, this.url = null, this.content = null;
    }, namespace("cloudkid").MediaLoaderResult = MediaLoaderResult;
}(), function(undefined) {
    var CacheManager = function() {
        this.initialize();
    }, p = CacheManager.prototype = {};
    p._versions = null, p.cacheBust = !1, p.initialize = function() {
        this._versions = [];
        var cb = cloudkid.OS.instance.options.cacheBust;
        this.cacheBust = cb ? "true" === cb || cb === !0 : !1, this.cacheBust && Debug.log("CacheBust all files is on.");
    }, p.destroy = function() {
        this._versions = null;
    }, p.addVersionsFile = function(url, callback, baseUrl) {
        Debug.assert(/^.*\.txt$/.test(url), "The versions file must be a *.txt file");
        var ml = cloudkid.MediaLoader.instance;
        if (this.cacheBust) return void (callback && callback());
        this.addVersion(url, Math.round(1e5 * Math.random()));
        var cm = this;
        ml.load(url, function(result) {
            if (result && result.content) {
                var i, parts, lines = result.content.replace(/\r/g, "").split("\n");
                for (i = 0; i < lines.length; i++) lines[i] && (parts = lines[i].split(" "), 2 == parts.length && cm.addVersion((baseUrl || "") + parts[0], parts[1]));
            }
            callback && callback();
        });
    }, p.addVersion = function(url, version) {
        var ver = this._getVersionByUrl(url);
        ver || this._versions.push({
            url: url,
            version: version
        });
    }, p._getVersionByUrl = function(url) {
        var i, len = this._versions.length;
        for (i = 0; len > i; i++) if (url == this._versions[i].url) return this._versions[i];
        return null;
    }, p.prepare = function(url, applyBasePath) {
        var ver = this._getVersionByUrl(url);
        if (this.cacheBust && /(\?|\&)cb\=[0-9]*/.test(url) === !1 ? (this._cbVal || (this._cbVal = new Date().getTime().toString()), 
        url = url + (url.indexOf("?") < 0 ? "?" : "&") + "cb=" + this._cbVal) : ver && /(\?|\&)v\=[0-9]*/.test(url) === !1 && (url = url + (url.indexOf("?") < 0 ? "?" : "&") + "v=" + ver.version), 
        applyBasePath) {
            var basePath = cloudkid.OS.instance.options.basePath;
            /^http(s)?\:/.test(url) === !1 && basePath !== undefined && -1 == url.search(basePath) && (url = basePath + url);
        }
        return url;
    }, namespace("cloudkid").CacheManager = CacheManager;
}(), function(undefined) {
    var Button = function(imageSettings, label, enabled) {
        PIXI.DisplayObjectContainer.call(this), this.initialize(imageSettings, label, enabled);
    }, p = Button.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
    p.back = null, p.label = null, p.releaseCallback = null, p.overCallback = null, 
    p.outCallback = null, p._enabled = !1, p._isDown = !1, p._isOver = !1, p._isSelected = !1, 
    p._isSelectable = !1, p._isHighlighted = !1, p._overCB = null, p._outCB = null, 
    p._downCB = null, p._upCB = null, p._upOutCB = null, p._upTex = null, p._overTex = null, 
    p._downTex = null, p._disabledTex = null, p._selectedTex = null, p._highlightedTex = null, 
    p._slave = null, p._slaveUpTex = null, p._slaveOverTex = null, p._slaveDownTex = null, 
    p._slaveDisabledTex = null, p._slaveSelectedTex = null, p._slaveHighlightedTex = null, 
    p._width = 0, p._height = 0, p.initialize = function(imageSettings, label, enabled) {
        if (this.back = new PIXI.Sprite(imageSettings.up), this.addChild(this.back), this._overCB = this._onOver.bind(this), 
        this._outCB = this._onOut.bind(this), this._downCB = this._onDown.bind(this), this._upCB = this._onUp.bind(this), 
        this._upOutCB = this._onUpOutside.bind(this), this._upTex = imageSettings.up, this._overTex = imageSettings.over || this._upTex, 
        this._downTex = imageSettings.down || this._upTex, this._disabledTex = imageSettings.disabled || this._upTex, 
        this._highlightedTex = imageSettings.highlighted || this._overTex, imageSettings.selected && (this._isSelectable = !0, 
        this._selectedTex = imageSettings.selected), imageSettings.slave && imageSettings.slaveSettings) {
            this._slave = imageSettings.slave;
            var slaveSettings = imageSettings.slaveSettings;
            this._slaveUpTex = slaveSettings.up, this._slaveOverTex = slaveSettings.over || this._slaveUpTex, 
            this._slaveDownTex = slaveSettings.down || this._slaveUpTex, this._slaveDisabledTex = slaveSettings.disabled || this._slaveUpTex, 
            this._slaveHighlightedTex = slaveSettings.highlighted || this._slaveOverTex, this._isSelectable && (this._slaveSelectedTex = slaveSettings.selected || this._slaveUpTex);
        }
        if (imageSettings.scale) {
            var s = imageSettings.scale || 1;
            this.back.scale.x = this.back.scale.y = s, this._slave && (this._slave.scale.x = this._slave.scale.x = s);
        }
        if (label) {
            this.label = "bitmap" == label.type ? new PIXI.BitmapText(label.text, label.style) : new PIXI.Text(label.text, label.style), 
            this.addChild(this.label), this.label.position.x = .5 * (this.back.width - this.label.width);
            var h = this.label.height;
            this.label.position.y = .5 * (this.back.height - h) + .125 * h;
        }
        this._width = this.back.width, this._height = this.back.height, this.enabled = enabled === undefined ? !0 : !!enabled;
    }, Object.defineProperty(p, "width", {
        get: function() {
            return this._width * this.scale.x;
        },
        set: function(value) {
            this.scale.x = value / this._width;
        }
    }), Object.defineProperty(p, "height", {
        get: function() {
            return this._height * this.scale.y;
        },
        set: function(value) {
            this.scale.y = value / this._height;
        }
    }), p.setText = function(text) {
        if (this.label) {
            this.label.setText(text), this.label.forceUpdateText(), this.label.position.x = .5 * (this.back.width - this.label.width);
            var h = this.label.height;
            this.label.position.y = .5 * (this.back.height - h) + .125 * h;
        }
    }, Object.defineProperty(p, "enabled", {
        get: function() {
            return this._enabled;
        },
        set: function(value) {
            this._enabled = value, this.buttonMode = value, this.interactive = value, value ? (this.mousedown = this.touchstart = this._downCB, 
            this.mouseover = this._overCB, this.mouseout = this._outCB) : (this.mousedown = this.touchstart = this.mouseover = this.mouseout = null, 
            this.mouseup = this.touchend = this.mouseupoutside = this.touchendoutside = null, 
            this._isDown = this._isOver = !1, this.__isOver = !1), this._updateState();
        }
    }), Object.defineProperty(p, "selected", {
        get: function() {
            return this._isSelected;
        },
        set: function(value) {
            this._isSelectable && (this._isSelected = value, this._updateState());
        }
    }), Object.defineProperty(p, "highlighted", {
        get: function() {
            return this._isHighlighted;
        },
        set: function(value) {
            this._isHighlighted = value, this._updateState();
        }
    }), p._updateState = function() {
        this.back && (this.back.setTexture(this._isHighlighted ? this._highlightedTex : this._enabled ? this._isDown ? this._downTex : this._isOver ? this._overTex : this._isSelected ? this._selectedTex : this._upTex : this._disabledTex), 
        this._slave && this._slave.setTexture(this._isHighlighted ? this._slaveHighlightedTex : this._enabled ? this._isDown ? this._slaveDownTex : this._isOver ? this._slaveOverTex : this._isSelected ? this._slaveSelectedTex : this._slaveUpTex : this._slaveDisabledTex));
    }, p._onOver = function() {
        this._isOver = !0, this._updateState(), this.overCallback && this.overCallback(this);
    }, p._onOut = function() {
        this._isOver = !1, this._updateState(), this.outCallback && this.outCallback(this);
    }, p._onDown = function(data) {
        data.originalEvent.preventDefault(), this._isDown = !0, this._updateState(), this.mouseup = this.touchend = this._upCB, 
        this.mouseupoutside = this.touchendoutside = this._upOutCB;
    }, p._onUp = function(data) {
        data.originalEvent.preventDefault(), this._isDown = !1, this.mouseup = this.touchend = null, 
        this.mouseupoutside = this.touchendoutside = null, this._updateState(), this.releaseCallback && this.releaseCallback(this);
    }, p._onUpOutside = function() {
        this._isDown = !1, this.mouseup = this.touchend = null, this.mouseupoutside = this.touchendoutside = null, 
        this._updateState();
    }, p.destroy = function() {
        this.mousedown = this.touchstart = this.mouseover = this.mouseout = null, this.mouseup = this.touchend = this.mouseupoutside = this.touchendoutside = null, 
        this.removeChildren(!0), this._upTex = null, this._overTex = null, this._downTex = null, 
        this._disabledTex = null, this._selectedTex = null, this._highlightedTex = null, 
        this.label = null, this.back = null, this.releaseCallback = null, this.overCallback = null, 
        this.outCallback = null, this._slave = null, this._slaveUpTex = null, this._slaveOverTex = null, 
        this._slaveDownTex = null, this._slaveDisabledTex = null, this._slaveSelectedTex = null, 
        this._slaveHighlightedTex = null;
    }, namespace("cloudkid").Button = Button;
}(), function() {
    var DragManager = function(startCallback, endCallback) {
        this.initialize(startCallback, endCallback);
    }, p = DragManager.prototype = {};
    p._updateCallback = null, p.draggedObj = null, p._dragOffset = null, p.dragStartThreshold = 20, 
    p.mouseDownStagePos = null, p.mouseDownObjPos = null, p.isTouchMove = !1, p.isHeldDrag = !1, 
    p.isStickyClick = !1, p.allowStickyClick = !0, p._theStage = null, p._dragStartCallback = null, 
    p._dragEndCallback = null, p._triggerHeldDragCallback = null, p._triggerStickyClickCallback = null, 
    p._stageMouseUpCallback = null, p._draggableObjects = null;
    var helperPoint = null, TYPE_MOUSE = 0, TYPE_TOUCH = 1;
    p.initialize = function(startCallback, endCallback) {
        this._updateCallback = this._updateObjPosition.bind(this), this._triggerHeldDragCallback = this._triggerHeldDrag.bind(this), 
        this._triggerStickyClickCallback = this._triggerStickyClick.bind(this), this._stageMouseUpCallback = this._stopDrag.bind(this), 
        this._theStage = cloudkid.OS.instance.stage, this._dragStartCallback = startCallback, 
        this._dragEndCallback = endCallback, this._draggableObjects = [], this.mouseDownStagePos = new PIXI.Point(0, 0), 
        this.mouseDownObjPos = new PIXI.Point(0, 0), helperPoint = new PIXI.Point(0, 0);
    }, p.startDrag = function(object, interactionData) {
        this._objMouseDown(TYPE_MOUSE, object, interactionData);
    }, p._objMouseDown = function(type, obj, interactionData) {
        null === this.draggedObj && (this.draggedObj = obj, createjs.Tween.removeTweens(this.draggedObj), 
        createjs.Tween.removeTweens(this.draggedObj.position), this._dragOffset = interactionData.getLocalPosition(this.draggedObj.parent), 
        this._dragOffset.x -= this.draggedObj.position.x, this._dragOffset.y -= this.draggedObj.position.y, 
        this.mouseDownObjPos.x = this.draggedObj.position.x, this.mouseDownObjPos.y = this.draggedObj.position.y, 
        this.mouseDownStagePos.x = interactionData.global.x, this.mouseDownStagePos.y = interactionData.global.y, 
        this.allowStickyClick && type != TYPE_TOUCH ? (this.draggedObj.mousemove = this._triggerHeldDragCallback, 
        this._theStage.interactionManager.stageUp = this._triggerStickyClickCallback) : (this.isTouchMove = type == TYPE_TOUCH, 
        this.isHeldDrag = !0, this._startDrag()));
    }, p._triggerStickyClick = function() {
        this.isStickyClick = !0, this.draggedObj.mousemove = null, this._theStage.interactionManager.stageUp = null, 
        this._startDrag();
    }, p._triggerHeldDrag = function(interactionData) {
        var xDiff = interactionData.global.x - this.mouseDownStagePos.x, yDiff = interactionData.global.y - this.mouseDownStagePos.y;
        xDiff * xDiff + yDiff * yDiff >= this.dragStartThreshold * this.dragStartThreshold && (this.isHeldDrag = !0, 
        this.draggedObj.mousemove = null, this._theStage.interactionManager.stageUp = null, 
        this._startDrag());
    }, p._startDrag = function() {
        var im = this._theStage.interactionManager;
        im.stageUp = this._stageMouseUpCallback, this.draggedObj.mousemove = this.draggedObj.touchmove = this._updateCallback, 
        this._dragStartCallback(this.draggedObj);
    }, p.stopDrag = function(doCallback) {
        this._stopDrag(null, doCallback === !0);
    }, p._stopDrag = function(origMouseEv, doCallback) {
        this.draggedObj && (this.draggedObj.touchmove = this.draggedObj.mousemove = null);
        var im = this._theStage.interactionManager;
        im.stageUp = null;
        var obj = this.draggedObj;
        this.draggedObj = null, this.isTouchMove = !1, this.isStickyClick = !1, this.isHeldMove = !1, 
        doCallback !== !1 && this._dragEndCallback(obj);
    }, p._updateObjPosition = function(interactionData) {
        if (this.isTouchMove || this._theStage.interactionManager.mouseInStage) {
            if (!this.draggedObj || !this.draggedObj.parent) return void this._stopDrag(null, !1);
            var mousePos = interactionData.getLocalPosition(this.draggedObj.parent, helperPoint), bounds = this.draggedObj._dragBounds;
            this.draggedObj.position.x = clamp(mousePos.x - this._dragOffset.x, bounds.x, bounds.right), 
            this.draggedObj.position.y = clamp(mousePos.y - this._dragOffset.y, bounds.y, bounds.bottom);
        }
    };
    var clamp = function(x, a, b) {
        return a > x ? a : x > b ? b : x;
    }, enableDrag = function() {
        this.mousedown = this._onMouseDownListener, this.touchstart = this._onTouchStartListener, 
        this.buttonMode = this.interactive = !0;
    }, disableDrag = function() {
        this.mousedown = this.touchstart = null, this.buttonMode = this.interactive = !1;
    }, _onMouseDown = function(type, mouseData) {
        this._dragMan._objMouseDown(type, this, mouseData);
    };
    p.addObject = function(obj, bounds) {
        if (!bounds) {
            var canvas = cloudkid.OS.instance._renderer.view;
            bounds = {
                x: 0,
                y: 0,
                width: canvas.width,
                height: canvas.height
            };
        }
        bounds.right = bounds.x + bounds.width, bounds.bottom = bounds.y + bounds.height, 
        obj._dragBounds = bounds, this._draggableObjects.indexOf(obj) >= 0 || (obj.enableDrag = enableDrag, 
        obj.disableDrag = disableDrag, obj._onMouseDownListener = _onMouseDown.bind(obj, TYPE_MOUSE), 
        obj._onTouchStartListener = _onMouseDown.bind(obj, TYPE_TOUCH), obj._dragMan = this, 
        this._draggableObjects.push(obj));
    }, p.removeObject = function(obj) {
        var index = this._draggableObjects.indexOf(obj);
        index >= 0 && (obj.disableDrag(), delete obj.enableDrag, delete obj.disableDrag, 
        delete obj._onMouseDownListener, delete obj._onTouchStartListener, delete obj._dragMan, 
        delete obj._dragBounds, this._draggableObjects.splice(index, 1));
    }, p.destroy = function() {
        null !== this.draggedObj && this._stopDrag(null, !1), this._updateCallback = null, 
        this._dragStartCallback = null, this._dragEndCallback = null, this._triggerHeldDragCallback = null, 
        this._triggerStickyClickCallback = null, this._stageMouseUpCallback = null, this._theStage = null;
        for (var i = this._draggableObjects.length - 1; i >= 0; --i) {
            var obj = this._draggableObjects[i];
            obj.disableDrag(), delete obj.enableDrag, delete obj.disableDrag, delete obj._onMouseDownListener, 
            delete obj._dragMan, delete obj._dragBounds;
        }
        this._draggableObjects = null;
    }, namespace("cloudkid").DragManager = DragManager;
}(), function() {
    var Positioner = function() {};
    Positioner.prototype = {}, Positioner.positionItems = function(parent, itemSettings) {
        var rot, pt, degToRad;
        degToRad = Math.PI / 180;
        for (var iName in itemSettings) {
            var item = parent[iName];
            if (item) {
                var setting = itemSettings[iName];
                if (item.position.x = setting.x, item.position.y = setting.y, pt = setting.scale, 
                pt && (item.scale.x *= pt.x, item.scale.y *= pt.y), pt = setting.pivot, pt && (item.pivot.x = pt.x, 
                item.pivot.y = pt.y), rot = setting.rotation, rot && (item.rotation = rot * degToRad), 
                setting.hitArea) {
                    var hitArea = setting.hitArea;
                    item.hitArea = Positioner.generateHitArea(hitArea);
                }
            } else Debug.error("could not find object '" + iName + "'");
        }
    }, Positioner.generateHitArea = function(hitArea, scale) {
        if (scale || (scale = 1), isArray(hitArea)) {
            if (1 == scale) return new PIXI.Polygon(hitArea);
            for (var temp = [], i = 0, len = hitArea.length; len > i; ++i) temp.push(new PIXI.Point(hitArea[i].x * scale, hitArea[i].y * scale));
            return new PIXI.Polygon(temp);
        }
        return "rect" != hitArea.type && hitArea.type ? "ellipse" == hitArea.type ? new PIXI.Ellipse((hitArea.x - .5 * hitArea.w) * scale, (hitArea.y - .5 * hitArea.h) * scale, hitArea.w * scale, hitArea.h * scale) : "circle" == hitArea.type ? new PIXI.Circle(hitArea.x * scale, hitArea.y * scale, hitArea.r * scale) : null : new PIXI.Rectangle(hitArea.x * scale, hitArea.y * scale, hitArea.w * scale, hitArea.h * scale);
    };
    var isArray = function(o) {
        return "[object Array]" === Object.prototype.toString.call(o);
    };
    namespace("cloudkid").Positioner = Positioner;
}(), function() {
    var ScreenSettings = function(w, h, p) {
        this.width = w, this.height = h, this.ppi = p;
    };
    ScreenSettings.prototype = {}, namespace("cloudkid").ScreenSettings = ScreenSettings;
}(), function() {
    var UIElement = function(item, settings, designedScreen) {
        this._item = item, this._settings = settings, this._designedScreen = designedScreen, 
        this.origScaleX = item.scale.x, this.origScaleY = item.scale.y, this.origWidth = item.width, 
        this.origBounds = {
            x: 0,
            y: 0,
            width: item.width,
            height: item.height
        }, this.origBounds.right = this.origBounds.x + this.origBounds.width, this.origBounds.bottom = this.origBounds.y + this.origBounds.height;
        var UIScaler = cloudkid.UIScaler;
        switch (settings.vertAlign) {
          case UIScaler.ALIGN_TOP:
            this.origMarginVert = item.position.y + this.origBounds.y;
            break;

          case UIScaler.ALIGN_CENTER:
            this.origMarginVert = .5 * designedScreen.height - item.position.y;
            break;

          case UIScaler.ALIGN_BOTTOM:
            this.origMarginVert = designedScreen.height - (item.position.y + this.origBounds.bottom);
        }
        switch (settings.horiAlign) {
          case UIScaler.ALIGN_LEFT:
            this.origMarginHori = item.position.x + this.origBounds.x;
            break;

          case UIScaler.ALIGN_CENTER:
            this.origMarginHori = .5 * designedScreen.width - item.position.x;
            break;

          case UIScaler.ALIGN_RIGHT:
            this.origMarginHori = designedScreen.width - (item.position.x + this.origBounds.right);
        }
    }, p = UIElement.prototype = {};
    p.origMarginHori = 0, p.origMarginVert = 0, p.origWidth = 0, p.origScaleX = 0, p.origScaleY = 0, 
    p.origBounds = null, p._settings = null, p._item = null, p._designedScreen = null, 
    p.resize = function(newScreen) {
        var overallScale = newScreen.height / this._designedScreen.height, ppiScale = newScreen.ppi / this._designedScreen.ppi, letterBoxWidth = (newScreen.width - this._designedScreen.width * overallScale) / 2, itemScale = overallScale / ppiScale;
        this._settings.minScale && itemScale < this._settings.minScale ? itemScale = this._settings.minScale : this._settings.maxScale && itemScale > this._settings.maxScale && (itemScale = this._settings.maxScale), 
        itemScale *= ppiScale, this._item.scale.x = this.origScaleX * itemScale, this._item.scale.y = this.origScaleY * itemScale;
        var m;
        m = this.origMarginVert * overallScale;
        var UIScaler = cloudkid.UIScaler;
        switch (this._settings.vertAlign) {
          case UIScaler.ALIGN_TOP:
            this._item.position.y = m - this.origBounds.y * itemScale;
            break;

          case UIScaler.ALIGN_CENTER:
            this._item.position.y = .5 * newScreen.height - m;
            break;

          case UIScaler.ALIGN_BOTTOM:
            this._item.position.y = newScreen.height - m - this.origBounds.bottom * itemScale;
        }
        switch (m = this.origMarginHori * overallScale, this._settings.horiAlign) {
          case UIScaler.ALIGN_LEFT:
            this._item.position.x = this._settings.titleSafe ? letterBoxWidth + m - this.origBounds.x * itemScale : m - this.origBounds.x * itemScale;
            break;

          case UIScaler.ALIGN_CENTER:
            this._item.position.x = this._settings.centeredHorizontally ? .5 * (newScreen.width - this._item.width) : .5 * newScreen.width - m;
            break;

          case UIScaler.ALIGN_RIGHT:
            this._item.position.x = this._settings.titleSafe ? newScreen.width - letterBoxWidth - m - this.origBounds.right * itemScale : newScreen.width - m - this.origBounds.right * itemScale;
        }
    }, p.destroy = function() {
        this._item = null, this._settings = null, this._designedScreen = null;
    }, namespace("cloudkid").UIElement = UIElement;
}(), function() {
    var UIElementSettings = function() {}, p = UIElementSettings.prototype = {};
    p.vertAlign = null, p.horiAlign = null, p.titleSafe = !1, p.maxScale = 1, p.minScale = 1, 
    p.centeredHorizontally = !1, namespace("cloudkid").UIElementSettings = UIElementSettings;
}(), function() {
    var UIScaler = function(parent, designedWidth, designedHeight, designedPPI) {
        this._parent = parent, this._items = [], this._designedScreen = new cloudkid.ScreenSettings(designedWidth, designedHeight, designedPPI);
    }, p = UIScaler.prototype = {};
    UIScaler._currentScreen = new cloudkid.ScreenSettings(0, 0, 0), UIScaler._initialized = !1, 
    p._parent = null, p._designedScreen = null, p._items = null, UIScaler.ALIGN_TOP = "top", 
    UIScaler.ALIGN_BOTTOM = "bottom", UIScaler.ALIGN_LEFT = "left", UIScaler.ALIGN_RIGHT = "right", 
    UIScaler.ALIGN_CENTER = "center", UIScaler.fromJSON = function(parent, jsonSettings, jsonItems, immediateDestroy) {
        "boolean" != typeof immediateDestroy && (immediateDestroy = !0);
        var item, i, align, vertAlign, horiAlign, scaler = new UIScaler(parent, jsonSettings.designedWidth, jsonSettings.designedHeight, jsonSettings.designedPPI);
        for (i in jsonItems) item = jsonItems[i], item.align ? (align = item.align.split("-"), 
        vertAlign = align[0], horiAlign = align[1]) : (vertAlign = ALIGN_CENTER, horiAlign = ALIGN_CENTER), 
        scaler.add(parent[i], vertAlign, horiAlign, item.titleSafe || !1, item.minScale || 0/0, item.maxScale || 0/0, item.centeredHorizontally || !1);
        return scaler.resize(), immediateDestroy && scaler.destroy(), scaler;
    }, UIScaler.init = function(screenWidth, screenHeight, screenPPI) {
        UIScaler._currentScreen.width = screenWidth, UIScaler._currentScreen.height = screenHeight, 
        UIScaler._currentScreen.ppi = screenPPI, UIScaler._initialized = !0;
    }, p.getScale = function() {
        return UIScaler._currentScreen.height / this._designedScreen.height;
    }, p.add = function(item, vertAlign, horiAlign, titleSafe, minScale, maxScale, centeredHorizontally) {
        vertAlign || (vertAlign = UIScaler.ALIGN_CENTER), horiAlign || (horiAlign = UIScaler.ALIGN_CENTER), 
        "boolean" != typeof titleSafe && (titleSafe = !1), "number" != typeof minScale && (minScale = 0/0), 
        "number" != typeof maxScale && (maxScale = 0/0);
        var s = new cloudkid.UIElementSettings();
        s.vertAlign = vertAlign, s.horiAlign = horiAlign, s.titleSafe = titleSafe, s.maxScale = maxScale, 
        s.minScale = minScale, s.centeredHorizontally = centeredHorizontally, this._items.push(new cloudkid.UIElement(item, s, this._designedScreen));
    }, UIScaler.resizeBackground = function(b) {
        if (UIScaler._initialized) {
            var h = b.height / b.scale.y, scale = (b.width / b.scale.x, UIScaler._currentScreen.height / h);
            b.scale.x = b.scale.y = scale, b.position.x = .5 * (UIScaler._currentScreen.width - b.width);
        }
    }, UIScaler.resizeBackgrounds = function(bs) {
        for (var i = 0, len = bs.length; len > i; ++i) resizeBackground(bs[i]);
    }, p.resize = function() {
        if (this._items.length > 0) for (var i = 0, len = this._items.length; len > i; ++i) this._items[i].resize(UIScaler._currentScreen);
    }, p.destroy = function() {
        if (this._items.length > 0) for (var i = 0, len = this._items.length; len > i; ++i) this._items[i].destroy();
        this._parent = null, this._designedScreen = null, this._items = null;
    }, namespace("cloudkid").UIScaler = UIScaler;
}(), function() {
    function unloadAsset(asset) {
        AssetManager._assetUrlCache[asset] && (a = AssetManager._assets[asset], a && (a.anim || (a.isFont && PIXI.BitmapText.fonts[asset] && delete PIXI.BitmapText.fonts[asset], 
        PIXI.Texture.destroyTexture(AssetManager._assetUrlCache[asset]), delete AssetManager.scales[asset], 
        delete AssetManager._assetUrlCache[asset])));
    }
    {
        var AssetManager = function() {};
        AssetManager.prototype = {};
    }
    AssetManager._assets = null, AssetManager._assetUrlCache = null, AssetManager.scales = null, 
    AssetManager._sizes = null, AssetManager._scales = null, AssetManager._paths = null, 
    AssetManager._sizeOrder = null, AssetManager.lowHW = !1, AssetManager.init = function(config, width, height) {
        AssetManager.scales = {}, AssetManager._assets = config.assets, AssetManager._assetUrlCache = {}, 
        AssetManager._paths = config.path, AssetManager._sizes = config.sizing, AssetManager._scales = config.scale, 
        AssetManager._pickScale(width, height);
    }, AssetManager.getPreferredSize = function() {
        return AssetManager._sizeOrder[0];
    }, AssetManager.getPreferredScale = function() {
        return AssetManager._scales[AssetManager._sizeOrder[0]];
    }, AssetManager._pickScale = function(width, height) {
        for (var s, minSize = height > width ? width : height, i = AssetManager._sizes.length - 1; i >= 0 && AssetManager._sizes[i].maxSize > minSize; --i) s = AssetManager._sizes[i];
        AssetManager._sizeOrder = s.order;
    }, AssetManager.getUrl = function(assetId) {
        var a = AssetManager._assets[assetId];
        if (!a) return null;
        if (AssetManager._assetUrlCache[assetId]) return AssetManager._assetUrlCache[assetId];
        var url;
        if (a.anim) return url = AssetManager._assetUrlCache[assetId] = AssetManager._paths.anim + a.src;
        if (AssetManager.lowHW && a.lowHW) return AssetManager.scales[assetId] = AssetManager._scales[a.lowHW], 
        url = AssetManager._assetUrlCache[assetId] = AssetManager._paths[a.lowHW] + a.src;
        for (var i = 0; i < AssetManager._sizeOrder.length; ++i) {
            var typeId = AssetManager._sizeOrder[i];
            if (a[typeId]) return AssetManager.scales[assetId] = AssetManager._scales[typeId], 
            url = AssetManager._assetUrlCache[assetId] = AssetManager._paths[typeId] + a.src;
        }
        return null;
    }, AssetManager.unload = function(assetOrAssets) {
        if (assetOrAssets instanceof Array) for (var i = assetOrAssets.length - 1; i >= 0; --i) {
            var id = assetOrAssets[i];
            unloadAsset(id);
        } else unloadAsset(assetOrAssets);
    }, AssetManager.getAnims = function(anims, maxDigits, outObj) {
        void 0 === maxDigits && (maxDigits = 4), 0 > maxDigits && (maxDigits = 0);
        var i, c, zeros = [], compares = [];
        for (i = 1; maxDigits > i; ++i) {
            var s = "";
            c = 1;
            for (var j = 0; i > j; ++j) s += "0", c *= 10;
            zeros.unshift(s), compares.push(c);
        }
        var prevTex, compareLength = compares.length, rtnDict = outObj || {}, fromFrame = PIXI.Texture.fromFrame;
        for (var a in anims) {
            var data = anims[a], list = [];
            for (i = data.numberMin, len = data.numberMax; len >= i; ++i) {
                var num = null;
                for (c = 0; compareLength > c; ++c) if (i < compares[c]) {
                    num = zeros[c] + i;
                    break;
                }
                num || (num = i.toString());
                var texName = data.name.replace("#", num), tex = fromFrame(texName, !0);
                tex && (prevTex = tex), list.push(prevTex);
            }
            rtnDict[a] = list;
        }
        return rtnDict;
    }, namespace("cloudkid").AssetManager = AssetManager;
}();