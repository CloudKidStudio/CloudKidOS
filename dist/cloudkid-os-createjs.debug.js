!function(undefined) {
    var OS = function() {}, p = OS.prototype = new createjs.Container(), _paused = !1, _isReady = !1, _framerate = null, _lastFrameTime = 0, _lastFPSUpdateTime = 0, _framerateValue = null, _frameCount = 0, _tickCallback = null, _instance = null, _tickId = -1, _useRAF = !1, _fps = 0, _msPerFrame = 0;
    OS.VERSION = "1.1.25", p.Container_initialize = p.initialize, p.stage = null, 
    p._app = null, p.options = null, p._updateFunctions = {}, OS.init = function(stageName, options) {
        return _instance || (Debug.log("Creating the singleton instance of OS"), _instance = new OS(), 
        _instance.initialize(stageName, options)), _instance;
    }, p.initialize = function(stageName, options) {
        this.Container_initialize(), this.options = options || {}, this.options.parseQueryString !== undefined && (this.options = parseQueryStringParams(this.options)), 
        this.options.debug !== undefined && (Debug.enabled = this.options.debug === !0 || "true" === this.options.debug), 
        this.options.minLogLevel !== undefined && (Debug.minLogLevel = parseInt(this.options.minLogLevel, 10)), 
        "string" == typeof this.options.ip && Debug.connect(this.options.ip);
        var loader = cloudkid.MediaLoader.init();
        this.stage = new createjs.Stage(stageName), this.stage.name = "cloudkid.OS", this.stage.canvas.onmousedown = function(e) {
            e.preventDefault();
        };
        var mouseOverRate = this.options.mouseOverRate = this.options.mouseOverRate || 30;
        this.stage.enableMouseOver(mouseOverRate), this.stage.addChild(this), this.visibleListener = this.onWindowVisibilityChanged.bind(this), 
        addPageHideListener(this.visibleListener);
        var touchDevice = window.hasOwnProperty("ontouchstart");
        -1 == window.navigator.userAgent.indexOf("MSIE 10.0") || touchDevice ? createjs.Touch.enable(this.stage) : Debug.log("IE10 Desktop"), 
        this.stage.autoClear = !!this.options.clearView || !1, this.options.showFramerate && (_framerate = new createjs.Text("", "10px Arial", "#000"), 
        _framerate.stroke = {
            width: 2,
            color: "#ffffff"
        }, _framerate.x = _framerate.y = 5, this.addChild(_framerate)), this.stage.update();
        if (_tickCallback = this.tick.bind(this), _useRAF = this.options.raf || !1, this.fps = this.options.fps || 60, 
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
        for (var myVar, splitFlashVars = vars.split("&"), i = 0; i < splitFlashVars.length; i++) myVar = splitFlashVars[i].split("="), 
        Debug.log(myVar[0] + " -> " + myVar[1]), output[myVar[0]] = myVar[1];
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
            return _instance.stage.canvas.width;
        }
    }), Object.defineProperty(p, "stageHeight", {
        get: function() {
            return _instance.stage.canvas.height;
        }
    });
    var setTargetedTimeout = function(callback, timeInFrame) {
        var timeToCall = 0;
        return timeInFrame && (timeToCall = Math.max(0, _msPerFrame - timeInFrame)), setTimeout(callback, timeToCall);
    };
    p.removeApp = function(destroying) {
        var removed = !1, stage = this.stage;
        return this._app && (this.contains(this._app) && this.removeChild(this._app), stage.removeAllChildren(), 
        this._app.destroy(), removed = !0), this._app = null, this.pause(), destroying || (stage.addChild(this), 
        _framerate && (_framerate.text = "FPS: 0.000"), _lastFrameTime = _lastFPSUpdateTime = _framerateValue = _frameCount = 0, 
        this.stage.update()), removed;
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
            elapsed > 1e3 && (_framerateValue = 1e3 / elapsed * _frameCount, _framerate.text = "FPS: " + Math.round(1e3 * _framerateValue) / 1e3, 
            _lastFPSUpdateTime = now, _frameCount = 0);
        }
        _lastFrameTime = now, this._app && this._app.update(dTime);
        for (var alias in this._updateFunctions) this._updateFunctions[alias](dTime);
        this.stage.update(dTime), _tickId = _useRAF ? requestAnimFrame(_tickCallback) : setTargetedTimeout(_tickCallback, this.getTime() - _lastFrameTime);
    }, p.destroy = function() {
        var stage = this.stage, ml = cloudkid.MediaLoader.instance;
        this.pause(), this.removeApp(!0), _instance = null, createjs.Touch.disable(stage), 
        stage.enableMouseOver(-1), stage.enableDOMEvents(!1), ml.destroy(), this.stage = null, 
        this._updateFunctions = null, removePageHideListener(this.visibleListener);
    }, Object.defineProperty(OS, "instance", {
        get: function() {
            if (!_instance) throw "Call cloudkid.OS.init(canvasId)";
            return _instance;
        }
    }), namespace("cloudkid").OS = OS;
}(), function(window) {
    "use strict";
    var FunctionUtils = {};
    Function.prototype.bind || (FunctionUtils.bind = Function.prototype.bind = function(that) {
        var target = this;
        if ("function" != typeof target) throw new TypeError();
        var args = Array.prototype.slice.call(arguments, 1), bound = function() {
            if (this instanceof bound) {
                var F = function() {};
                F.prototype = target.prototype;
                var self = new F(), result = target.apply(self, args.concat(Array.prototype.slice.call(arguments)));
                return Object(result) === result ? result : self;
            }
            return target.apply(that, args.concat(Array.prototype.slice.call(arguments)));
        };
        return bound;
    });
    for (var lastTime = 0, vendors = [ "ms", "moz", "webkit", "o" ], x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) window.requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"], 
    window.cancelAnimationFrame = window[vendors[x] + "CancelAnimationFrame"] || window[vendors[x] + "CancelRequestAnimationFrame"];
    window.requestAnimationFrame || (window.requestAnimationFrame = function(callback) {
        var currTime = new Date().getTime(), timeToCall = Math.max(0, 16 - (currTime - lastTime)), id = window.setTimeout(function() {
            callback(currTime + timeToCall);
        }, timeToCall);
        return lastTime = currTime + timeToCall, id;
    }, window.cancelAnimationFrame || (window.cancelAnimationFrame = function(id) {
        clearTimeout(id);
    })), FunctionUtils.requestAnimationFrame = window.requestAnimationFrame, window.requestAnimFrame = window.requestAnimationFrame, 
    FunctionUtils.cancelAnimationFrame = window.cancelAnimationFrame, namespace("cloudkid").FunctionUtils = FunctionUtils;
}(window), function() {
    "use strict";
    var BitmapUtils = {};
    BitmapUtils.loadSpriteSheet = function(frameDict, spritesheetImage, scale) {
        scale > 0 || (scale = 1);
        for (var key in frameDict) {
            var frame = frameDict[key], index = key.indexOf(".");
            index > 0 && (key = key.substring(0, index));
            var bitmap = lib[key], newBitmap = lib[key] = function() {
                createjs.Container.call(this);
                var child = new createjs.Bitmap(this._image);
                this.addChild(child), child.sourceRect = this._frameRect;
                var s = this._scale;
                child.setTransform(this._frameOffsetX * s, this._frameOffsetY * s, s, s);
            }, p = newBitmap.prototype = new createjs.Container();
            p._image = spritesheetImage, p._scale = scale;
            var frameRect = frame.frame;
            p._frameRect = new createjs.Rectangle(frameRect.x, frameRect.y, frameRect.w, frameRect.h), 
            frame.trimmed ? (p._frameOffsetX = frame.spriteSourceSize.x, p._frameOffsetY = frame.spriteSourceSize.y) : p._frameOffsetX = p._frameOffsetY = 0, 
            p.nominalBounds = bitmap && bitmap.prototype.nominalBounds ? bitmap.prototype.nominalBounds : new createjs.Rectangle(0, 0, frame.sourceSize.w, frame.sourceSize.h);
        }
    }, BitmapUtils.replaceWithScaledBitmap = function(idOrDict, scale) {
        if (1 != scale && scale > 0) {
            var key, bitmap, newBitmap, p;
            if ("string" == typeof idOrDict) key = idOrDict, bitmap = lib[key], bitmap && (newBitmap = lib[key] = function() {
                createjs.Container.call(this);
                var child = new this._oldBM();
                this.addChild(child), child.setTransform(0, 0, this._scale, this._scale);
            }, p = newBitmap.prototype = new createjs.Container(), p._oldBM = bitmap, p._scale = scale, 
            p.nominalBounds = bitmap.prototype.nominalBounds); else for (key in idOrDict) bitmap = lib[key], 
            bitmap && (newBitmap = lib[key] = function() {
                createjs.Container.call(this);
                var child = new this._oldBM();
                this.addChild(child), child.setTransform(0, 0, this._scale, this._scale);
            }, p = newBitmap.prototype = new createjs.Container(), p._oldBM = bitmap, p._scale = scale, 
            p.nominalBounds = bitmap.prototype.nominalBounds);
        }
    }, namespace("cloudkid").BitmapUtils = BitmapUtils;
}(), function() {
    "use strict";
    var SavedData = {}, WEB_STORAGE_SUPPORT = "undefined" != typeof window.Storage, ERASE_COOKIE = -1;
    if (WEB_STORAGE_SUPPORT) try {
        localStorage.setItem("LS_TEST", "test"), localStorage.removeItem("LS_TEST");
    } catch (e) {
        WEB_STORAGE_SUPPORT = !1;
    }
    Object.defineProperty(SavedData, "useWebStorage", {
        get: function() {
            return WEB_STORAGE_SUPPORT;
        },
        set: function(value) {
            if (value && "undefined" != typeof window.Storage) try {
                localStorage.setItem("LS_TEST", "test"), localStorage.removeItem("LS_TEST"), WEB_STORAGE_SUPPORT = !0;
            } catch (e) {
                WEB_STORAGE_SUPPORT = !1;
            } else WEB_STORAGE_SUPPORT = !1;
        }
    }), SavedData.remove = function(name) {
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
    "use strict";
    window.URL = window.URL || window.webkitURL, window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
    var Worker = {};
    Worker.init = function(codeString) {
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
    }, namespace("cloudkid").createWorker = Worker.init, namespace("cloudkid").Worker = Worker;
    var SubWorker = function(codeString, parent) {
        this._wParent = parent, eval(codeString);
    }, p = SubWorker.prototype;
    p.onmessage = null, p._wParent = null, p.postMessage = function(data) {
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
    "use strict";
    var CombinedCallback = function(call, obj, prop, callProp) {
        obj[prop] ? obj[callProp] = call : call();
    };
    CombinedCallback.create = function(call, obj, prop, callProp) {
        return CombinedCallback.bind(this, call, obj, prop, callProp);
    }, namespace("cloudkid").CombinedCallback = CombinedCallback;
}(), function(undefined) {
    "use strict";
    var NEXT_ID = 0, DelayedCall = function(callback, delay, repeat, autoDestroy) {
        this._callback = callback, this._delay = delay, this._timer = delay, this._repeat = !!repeat, 
        this._autoDestroy = autoDestroy === undefined ? !0 : !!autoDestroy, this._updateId = "DelayedCall#" + ++NEXT_ID, 
        this._paused = !1, this._update = this._update.bind(this), cloudkid.OS.instance.addUpdateCallback(this._updateId, this._update);
    }, p = DelayedCall.prototype;
    p._update = function(elapsed) {
        return this._callback ? (this._timer -= elapsed, void (this._timer <= 0 && (this._callback(), 
        this._repeat ? this._timer += this._delay : this._autoDestroy ? this.destroy() : cloudkid.OS.instance.removeUpdateCallback(this._updateId)))) : void this.destroy();
    }, p.restart = function() {
        if (this._callback) {
            var os = cloudkid.OS.instance;
            os.hasUpdateCallback(this._updateId) || os.addUpdateCallback(this._updateId, this._update), 
            this._timer = this._delay, this._paused = !1;
        }
    }, p.stop = function() {
        cloudkid.OS.instance.removeUpdateCallback(this._updateId), this._paused = !1;
    }, Object.defineProperty(p, "paused", {
        get: function() {
            return this._paused;
        },
        set: function(value) {
            if (this._callback) {
                var os = cloudkid.OS.instance;
                this._paused && !value ? (this._paused = !1, os.hasUpdateCallback(this._updateId) || os.addUpdateCallback(this._updateId, this._update)) : value && os.hasUpdateCallback(this._updateId) && (this._paused = !0, 
                os.removeUpdateCallback(this._updateId));
            }
        }
    }), p.destroy = function() {
        cloudkid.OS.instance.removeUpdateCallback(this._updateId), this._callback = null;
    }, namespace("cloudkid").DelayedCall = DelayedCall;
}(), function() {
    "use strict";
    var p, Application = function() {
        this.initialize();
    };
    p = Application.prototype = new createjs.Container(), p.init = function() {}, p.update = function() {}, 
    p.destroy = function() {}, p.resize = function() {}, namespace("cloudkid").Application = Application;
}(), function() {
    "use strict";
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
    "use strict";
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
    "use strict";
    var MediaLoaderResult = function(content, url, loader) {
        this.content = content, this.url = url, this.loader = loader;
    }, p = MediaLoaderResult.prototype;
    p.content = null, p.url = null, p.loader = null, p.toString = function() {
        return "[MediaLoaderResult('" + this.url + "')]";
    }, p.destroy = function() {
        this.callback = null, this.url = null, this.content = null;
    }, namespace("cloudkid").MediaLoaderResult = MediaLoaderResult;
}(), function(undefined) {
    "use strict";
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
    "use strict";
    function clone(obj) {
        if (!obj || "object" != typeof obj) return null;
        var copy = obj.constructor();
        for (var attr in obj) obj.hasOwnProperty(attr) && (copy[attr] = obj[attr]);
        return copy;
    }
    var Button = function(imageSettings, label, enabled) {
        imageSettings && this.initialize(imageSettings, label, enabled);
    }, p = Button.prototype = new createjs.Container(), s = createjs.Container.prototype;
    p.back = null, p.label = null, p._overCB = null, p._outCB = null, p._downCB = null, 
    p._upCB = null, p._clickCB = null, p._stateFlags = null, p._statePriority = null, 
    p._stateData = null, p._width = 0, p._height = 0, p._offset = null, Button.BUTTON_PRESS = "buttonPress";
    var RESERVED_STATES = [ "disabled", "enabled", "up", "over", "down" ], DEFAULT_PRIORITY = [ "disabled", "down", "over", "up" ];
    p.initialize = function(imageSettings, label, enabled) {
        s.initialize.call(this), this.mouseChildren = !1, this._downCB = this._onMouseDown.bind(this), 
        this._upCB = this._onMouseUp.bind(this), this._overCB = this._onMouseOver.bind(this), 
        this._outCB = this._onMouseOut.bind(this), this._clickCB = this._onClick.bind(this);
        var _stateData = this._stateData = {};
        this._stateFlags = {}, this._offset = new createjs.Point();
        var labelData;
        label && (labelData = clone(label), delete labelData.text, labelData.x === undefined && (labelData.x = "center"), 
        labelData.y === undefined && (labelData.y = "center"));
        var image, width, height, i, state;
        if (imageSettings.image) {
            for (image = imageSettings.image, this._statePriority = imageSettings.priority || DEFAULT_PRIORITY, 
            i = this._statePriority.length - 1; i >= 0; --i) {
                state = this._statePriority[i], this._addProperty(state), "disabled" != state && "up" != state && (this._stateFlags[state] = !1);
                var inputData = imageSettings[state];
                if (_stateData[state] = inputData ? clone(inputData) : _stateData.up, label) if (inputData && inputData.label) {
                    inputData = inputData.label;
                    var stateLabel = _stateData[state].label = {};
                    stateLabel.font = inputData.font || labelData.font, stateLabel.color = inputData.color || labelData.color, 
                    stateLabel.stroke = inputData.hasOwnProperty("stroke") ? inputData.stroke : labelData.stroke, 
                    stateLabel.shadow = inputData.hasOwnProperty("shadow") ? inputData.shadow : labelData.shadow, 
                    stateLabel.textBaseline = inputData.textBaseline || labelData.textBaseline, stateLabel.x = inputData.x || labelData.x, 
                    stateLabel.y = inputData.y || labelData.y;
                } else _stateData[state].label = labelData;
            }
            if (_stateData.up.trim) {
                var upTrim = _stateData.up.trim;
                width = upTrim.width, height = upTrim.height;
            } else width = _stateData.up.src.width, height = _stateData.up.src.height;
            _stateData.up || (Debug.error("Button lacks an up state! This is a serious problem! Input data follows:"), 
            Debug.error(imageSettings)), _stateData.over || (_stateData.over = _stateData.up), 
            _stateData.down || (_stateData.down = _stateData.up), _stateData.disabled || (_stateData.disabled = _stateData.up), 
            imageSettings.offset ? (this._offset.x = imageSettings.offset.x, this._offset.y = imageSettings.offset.y) : this._offset.x = this._offset.y = 0;
        } else image = imageSettings, width = image.width, height = image.height / 3, this._statePriority = DEFAULT_PRIORITY, 
        _stateData.disabled = _stateData.up = {
            src: new createjs.Rectangle(0, 0, width, height)
        }, _stateData.over = {
            src: new createjs.Rectangle(0, height, width, height)
        }, _stateData.down = {
            src: new createjs.Rectangle(0, 2 * height, width, height)
        }, labelData && (_stateData.up.label = _stateData.over.label = _stateData.down.label = _stateData.disabled.label = labelData), 
        this._offset.x = this._offset.y = 0;
        this.back = new createjs.Bitmap(image), this.addChild(this.back), this._width = width, 
        this._height = height, label && (this.label = new createjs.Text(label.text || "", _stateData.up.label.font, _stateData.up.label.color), 
        this.addChild(this.label)), this.enabled = enabled === undefined ? !0 : !!enabled;
    }, Object.defineProperty(p, "width", {
        get: function() {
            return this._width * this.scaleX;
        },
        set: function(value) {
            this.scaleX = value / this._width;
        }
    }), Object.defineProperty(p, "height", {
        get: function() {
            return this._height * this.scaleY;
        },
        set: function(value) {
            this.scaleY = value / this._height;
        }
    }), p.setText = function(text) {
        if (this.label) {
            this.label.text = text;
            for (var data, i = 0; i < this._statePriority.length; ++i) if (this._stateFlags[this._statePriority[i]]) {
                data = this._stateData[this._statePriority[i]];
                break;
            }
            data || (data = this._stateData.up), data = data.label, this.label.x = "center" == data.x ? .5 * (this._width - this.label.getMeasuredWidth()) + this._offset.x : data.x + this._offset.x, 
            this.label.y = "center" == data.y ? .5 * this._height + this._offset.y : data.y + this._offset.y;
        }
    }, Object.defineProperty(p, "enabled", {
        get: function() {
            return !this._stateFlags.disabled;
        },
        set: function(value) {
            this._stateFlags.disabled = !value, value ? (this.cursor = "pointer", this.addEventListener("mousedown", this._downCB), 
            this.addEventListener("mouseover", this._overCB), this.addEventListener("mouseout", this._outCB)) : (this.cursor = null, 
            this.removeEventListener("mousedown", this._downCB), this.removeEventListener("mouseover", this._overCB), 
            this.removeEventListener("mouseout", this._outCB), this.removeEventListener("pressup", this._upCB), 
            this.removeEventListener("click", this._clickCB), this._stateFlags.down = this._stateFlags.over = !1), 
            this._updateState();
        }
    }), p._addProperty = function(propertyName) {
        RESERVED_STATES.indexOf(propertyName) >= 0 || Object.defineProperty(this, propertyName, {
            get: function() {
                return this._stateFlags[propertyName];
            },
            set: function(value) {
                this._stateFlags[propertyName] = value, this._updateState();
            }
        });
    }, p._updateState = function() {
        if (this.back) {
            for (var data, i = 0; i < this._statePriority.length; ++i) if (this._stateFlags[this._statePriority[i]]) {
                data = this._stateData[this._statePriority[i]];
                break;
            }
            data || (data = this._stateData.up), this.back.sourceRect = data.src, data.trim ? (this.back.x = data.trim.x + this._offset.x, 
            this.back.y = data.trim.y + this._offset.y) : (this.back.x = this._offset.x, this.back.y = this._offset.y), 
            this.label && (data = data.label, this.label.textBaseline = data.textBaseline || "middle", 
            this.label.stroke = data.stroke, this.label.shadow = data.shadow, this.label.font = data.font, 
            this.label.color = data.color || "#000", this.label.x = "center" == data.x ? .5 * (this._width - this.label.getMeasuredWidth()) + this._offset.x : data.x + this._offset.x, 
            this.label.y = "center" == data.y ? .5 * this._height + this._offset.y : data.y + this._offset.y);
        }
    }, p._onMouseDown = function() {
        this.addEventListener("pressup", this._upCB), this.addEventListener("click", this._clickCB), 
        this._stateFlags.down = !0, this._updateState();
    }, p._onMouseUp = function() {
        this.removeEventListener("pressup", this._upCB), this.removeEventListener("click", this._clickCB), 
        this._stateFlags.down = !1, this._updateState();
    }, p._onClick = function() {
        this.dispatchEvent(new createjs.Event(Button.BUTTON_PRESS));
    }, p._onMouseOver = function() {
        this._stateFlags.over = !0, this._updateState();
    }, p._onMouseOut = function() {
        this._stateFlags.over = !1, this._updateState();
    }, p.destroy = function() {
        this.removeAllChildren(), this.removeAllEventListeners(), this._downCB = null, this._upCB = null, 
        this._overCB = null, this._outCB = null, this.back = null, this.label = null, this._statePriority = null, 
        this._stateFlags = null, this._stateData = null;
    }, Button.generateDefaultStates = function(image, disabledSettings, highlightSettings) {
        var buttonWidth = image.width, buttonHeight = image.height / 3, canvas = document.createElement("canvas"), width = buttonWidth, height = image.height;
        disabledSettings && (height += buttonHeight), highlightSettings && (width += 2 * highlightSettings.size, 
        height += buttonHeight + 2 * highlightSettings.size), canvas.width = width, canvas.height = height;
        var context = canvas.getContext("2d");
        context.drawImage(image, 0, 0);
        var output = {
            image: canvas,
            up: {
                src: new createjs.Rectangle(0, 0, buttonWidth, buttonHeight)
            },
            over: {
                src: new createjs.Rectangle(0, buttonHeight, buttonWidth, buttonHeight)
            },
            down: {
                src: new createjs.Rectangle(0, 2 * buttonHeight, buttonWidth, buttonHeight)
            }
        }, drawingBitmap = new createjs.Bitmap(image);
        drawingBitmap.sourceRect = output.up.src;
        var nextY = image.height;
        if (disabledSettings) {
            context.save(), context.translate(0, nextY);
            var matrix = new createjs.ColorMatrix();
            disabledSettings.saturation !== undefined && matrix.adjustSaturation(disabledSettings.saturation), 
            disabledSettings.brightness !== undefined && matrix.adjustBrightness(2.55 * disabledSettings.brightness), 
            disabledSettings.contrast !== undefined && matrix.adjustContrast(disabledSettings.contrast), 
            drawingBitmap.filters = [ new createjs.ColorMatrixFilter(matrix) ], drawingBitmap.cache(0, 0, output.up.src.width, output.up.src.height), 
            drawingBitmap.draw(context), output.disabled = {
                src: new createjs.Rectangle(0, nextY, buttonWidth, buttonHeight)
            }, nextY += buttonHeight, context.restore();
        }
        if (highlightSettings) {
            context.save();
            var highlightStateWidth = buttonWidth + 2 * highlightSettings.size, highlightStateHeight = buttonHeight + 2 * highlightSettings.size;
            drawingBitmap.filters = [ new createjs.ColorFilter(0, 0, 0, 1, highlightSettings.red, highlightSettings.green, highlightSettings.blue, highlightSettings.alpha !== undefined ? -255 + highlightSettings.alpha : 0) ], 
            drawingBitmap.scaleX = highlightStateWidth / buttonWidth, drawingBitmap.scaleY = highlightStateHeight / buttonHeight, 
            drawingBitmap.x = 0, drawingBitmap.y = nextY, drawingBitmap.cache(0, 0, highlightStateWidth, highlightStateHeight), 
            drawingBitmap.updateContext(context), drawingBitmap.draw(context), context.restore(), 
            drawingBitmap.scaleX = drawingBitmap.scaleY = 1, drawingBitmap.x = highlightSettings.size, 
            drawingBitmap.y = nextY + highlightSettings.size, drawingBitmap.filters = null, 
            drawingBitmap.uncache(), drawingBitmap.updateContext(context), drawingBitmap.draw(context);
            var trim = new createjs.Rectangle(highlightSettings.size, highlightSettings.size, highlightStateWidth, highlightStateHeight);
            output.up.trim = trim, output.over.trim = trim, output.down.trim = trim, output.disabled && (output.disabled.trim = trim), 
            output.highlighted = {
                src: new createjs.Rectangle(0, nextY, highlightStateWidth, highlightStateHeight)
            }, output.priority = DEFAULT_PRIORITY.slice(), output.priority.unshift("highlighted"), 
            output.offset = {
                x: -highlightSettings.size,
                y: -highlightSettings.size
            };
        }
        return output;
    }, namespace("cloudkid").Button = Button;
}(), function() {
    "use strict";
    var DragManager = function(startCallback, endCallback) {
        this.initialize(startCallback, endCallback);
    }, p = DragManager.prototype = {};
    p.draggedObj = null, p.dragStartThreshold = 20, p.mouseDownStagePos = null, p.mouseDownObjPos = null, 
    p.allowStickyClick = !0, p.isTouchMove = !1, p.isHeldDrag = !1, p.isStickyClick = !1, 
    p.snapSettings = null, p._theStage = null, p._dragOffset = null, p._dragStartCallback = null, 
    p._dragEndCallback = null, p._triggerHeldDragCallback = null, p._triggerStickyClickCallback = null, 
    p._stageMouseUpCallback = null, p._draggableObjects = null, p._updateCallback = null, 
    p._helperPoint = null, p.initialize = function(startCallback, endCallback) {
        this._updateCallback = this._updateObjPosition.bind(this), this._triggerHeldDragCallback = this._triggerHeldDrag.bind(this), 
        this._triggerStickyClickCallback = this._triggerStickyClick.bind(this), this._stageMouseUpCallback = this._stopDrag.bind(this), 
        this._theStage = cloudkid.OS.instance.stage, this._dragStartCallback = startCallback, 
        this._dragEndCallback = endCallback, this._draggableObjects = [], this.mouseDownStagePos = {
            x: 0,
            y: 0
        }, this.mouseDownObjPos = {
            x: 0,
            y: 0
        };
    }, p.startDrag = function(object, ev) {
        this._objMouseDown(ev, object);
    }, p._objMouseDown = function(ev, obj) {
        null === this.draggedObj && (this.draggedObj = obj, createjs.Tween.removeTweens(obj), 
        this._dragOffset = this.draggedObj.parent.globalToLocal(ev ? ev.stageX : 0, ev ? ev.stageY : 0), 
        this._dragOffset.x -= obj.x, this._dragOffset.y -= obj.y, this.mouseDownObjPos.x = obj.x, 
        this.mouseDownObjPos.y = obj.y, ev ? (this._theStage._getPointerData(ev.pointerID).target = obj, 
        this.allowStickyClick && "touchstart" != ev.nativeEvent.type ? (this.mouseDownStagePos.x = ev.stageX, 
        this.mouseDownStagePos.y = ev.stageY, obj.addEventListener("pressmove", this._triggerHeldDragCallback), 
        obj.addEventListener("pressup", this._triggerStickyClickCallback)) : (this.mouseDownStagePos.x = ev.stageX, 
        this.mouseDownStagePos.y = ev.stageY, this.isTouchMove = "touchstart" == ev.nativeEvent.type, 
        this.isHeldDrag = !0, this._startDrag())) : (this.isHeldDrag = !0, this._startDrag()));
    }, p._triggerStickyClick = function() {
        this.isStickyClick = !0, this.draggedObj.removeEventListener("pressmove", this._triggerHeldDragCallback), 
        this.draggedObj.removeEventListener("pressup", this._triggerStickyClickCallback), 
        this._startDrag();
    }, p._triggerHeldDrag = function(ev) {
        var xDiff = ev.stageX - this.mouseDownStagePos.x, yDiff = ev.stageY - this.mouseDownStagePos.y;
        xDiff * xDiff + yDiff * yDiff >= this.dragStartThreshold * this.dragStartThreshold && (this.isHeldDrag = !0, 
        this.draggedObj.removeEventListener("pressmove", this._triggerHeldDragCallback), 
        this.draggedObj.removeEventListener("pressup", this._triggerStickyClickCallback), 
        this._startDrag());
    }, p._startDrag = function() {
        var stage = this._theStage;
        stage.removeEventListener("stagemousemove", this._updateCallback), stage.addEventListener("stagemousemove", this._updateCallback), 
        stage.removeEventListener("stagemouseup", this._stageMouseUpCallback), stage.addEventListener("stagemouseup", this._stageMouseUpCallback), 
        this._dragStartCallback(this.draggedObj);
    }, p.stopDrag = function(doCallback) {
        this._stopDrag(null, doCallback === !0);
    }, p._stopDrag = function(ev, doCallback) {
        var obj = this.draggedObj;
        obj.removeEventListener("pressmove", this._triggerHeldDragCallback), obj.removeEventListener("pressup", this._triggerStickyClickCallback), 
        this._theStage.removeEventListener("stagemousemove", this._updateCallback), this._theStage.removeEventListener("stagemouseup", this._stageMouseUpCallback), 
        this.draggedObj = null, this.isTouchMove = !1, this.isStickyClick = !1, this.isHeldMove = !1, 
        doCallback !== !1 && this._dragEndCallback(obj);
    }, p._updateObjPosition = function(e) {
        if (this.isTouchMove || this._theStage.mouseInBounds) {
            var draggedObj = this.draggedObj, mousePos = draggedObj.parent.globalToLocal(e.stageX, e.stageY, this._helperPoint), bounds = draggedObj._dragBounds;
            if (draggedObj.x = clamp(mousePos.x - this._dragOffset.x, bounds.x, bounds.right), 
            draggedObj.y = clamp(mousePos.y - this._dragOffset.y, bounds.y, bounds.bottom), 
            this.snapSettings) switch (this.snapSettings.mode) {
              case "points":
                this._handlePointSnap(mousePos);
                break;

              case "grid":
                break;

              case "line":            }
        }
    }, p._handlePointSnap = function(localMousePos) {
        for (var snapSettings = this.snapSettings, minDistSq = snapSettings.dist * snapSettings.dist, points = snapSettings.points, objX = localMousePos.x - this._dragOffset.x, objY = localMousePos.y - this._dragOffset.y, leastDist = -1, closestPoint = null, i = points.length - 1; i >= 0; --i) {
            var p = points[i], distSq = distSquared(objX, objY, p.x, p.y);
            minDistSq >= distSq && (leastDist > distSq || -1 == leastDist) && (leastDist = distSq, 
            closestPoint = p);
        }
        closestPoint && (this.draggedObj.x = closestPoint.x, this.draggedObj.y = closestPoint.y);
    };
    var distSquared = function(x1, y1, x2, y2) {
        var xDiff = x1 - x2, yDiff = y1 - y2;
        return xDiff * xDiff + yDiff * yDiff;
    }, clamp = function(x, a, b) {
        return a > x ? a : x > b ? b : x;
    }, enableDrag = function() {
        this.addEventListener("mousedown", this._onMouseDownListener), this.cursor = "pointer";
    }, disableDrag = function() {
        this.removeEventListener("mousedown", this._onMouseDownListener), this.cursor = null;
    }, _onMouseDown = function(ev) {
        this._dragMan._objMouseDown(ev, this);
    };
    p.addObject = function(obj, bounds) {
        bounds || (bounds = {
            x: 0,
            y: 0,
            width: this._theStage.canvas.width,
            height: this._theStage.canvas.height
        }), bounds.right = bounds.x + bounds.width, bounds.bottom = bounds.y + bounds.height, 
        obj._dragBounds = bounds, this._draggableObjects.indexOf(obj) >= 0 || (obj.enableDrag = enableDrag, 
        obj.disableDrag = disableDrag, obj._onMouseDownListener = _onMouseDown.bind(obj), 
        obj._dragMan = this, this._draggableObjects.push(obj));
    }, p.removeObject = function(obj) {
        obj.disableDrag(), delete obj.enableDrag, delete obj.disableDrag, delete obj._onMouseDownListener, 
        delete obj._dragMan, delete obj._dragBounds;
        var index = this._draggableObjects.indexOf(obj);
        index >= 0 && this._draggableObjects.splice(index, 1);
    }, p.destroy = function() {
        null !== this.draggedObj && (this.draggedObj.removeEventListener("pressmove", this._triggerHeldDragCallback), 
        this.draggedObj.removeEventListener("pressup", this._triggerStickyClickCallback), 
        this._theStage.removeEventListener("stagemousemove", this._updateCallback), this.draggedObj = null), 
        this._updateCallback = null, this._dragStartCallback = null, this._dragEndCallback = null, 
        this._triggerHeldDragCallback = null, this._triggerStickyClickCallback = null, this._stageMouseUpCallback = null, 
        this._theStage = null;
        for (var i = this._draggableObjects.length - 1; i >= 0; --i) {
            var obj = this._draggableObjects[i];
            obj.disableDrag(), delete obj.enableDrag, delete obj.disableDrag, delete obj._onMouseDownListener, 
            delete obj._dragMan, delete obj._dragBounds;
        }
        this._draggableObjects = null, this._helperPoint = null;
    }, namespace("cloudkid").DragManager = DragManager;
}(), function() {
    "use strict";
    var Positioner = function() {};
    Positioner.prototype = {}, Positioner.positionItems = function(parent, itemSettings) {
        var rot, pt;
        for (var iName in itemSettings) {
            var item = parent[iName];
            if (item) {
                var setting = itemSettings[iName];
                if (item.x = setting.x, item.y = setting.y, pt = setting.scale, pt && (item.scaleX *= pt.x, 
                item.scaleY *= pt.y), pt = setting.pivot, pt && (item.regX = pt.x, item.regY = pt.y), 
                rot = setting.rotation, rot && (item.rotation = rot), setting.hitArea) {
                    var hitArea = setting.hitArea;
                    item.hitShape = Positioner.generateHitArea(hitArea);
                }
            } else Debug.error("could not find object '" + iName + "'");
        }
    }, Positioner.generateHitArea = function(hitArea, scale) {
        scale || (scale = 1);
        var library;
        if (library = window.createjs, isArray(hitArea)) {
            if (1 == scale) return new library.Polygon(hitArea);
            for (var temp = [], i = 0, len = hitArea.length; len > i; ++i) temp.push(new library.Point(hitArea[i].x * scale, hitArea[i].y * scale));
            return new library.Polygon(temp);
        }
        return "rect" != hitArea.type && hitArea.type ? "ellipse" == hitArea.type ? new library.Ellipse((hitArea.x - .5 * hitArea.w) * scale, (hitArea.y - .5 * hitArea.h) * scale, hitArea.w * scale, hitArea.h * scale) : "circle" == hitArea.type ? new library.Circle(hitArea.x * scale, hitArea.y * scale, hitArea.r * scale) : "sector" == hitArea.type ? new library.Sector(hitArea.x * scale, hitArea.y * scale, hitArea.r * scale, hitArea.start, hitArea.end) : null : new library.Rectangle(hitArea.x * scale, hitArea.y * scale, hitArea.w * scale, hitArea.h * scale);
    };
    var isArray = function(o) {
        return "[object Array]" === Object.prototype.toString.call(o);
    };
    namespace("cloudkid").Positioner = Positioner;
}(), function() {
    "use strict";
    var ScreenSettings = function(width, height, ppi) {
        this.width = width, this.height = height, this.ppi = ppi;
    };
    ScreenSettings.prototype = {}, namespace("cloudkid").ScreenSettings = ScreenSettings;
}(), function() {
    "use strict";
    var UIScaler, UIElement = function(item, settings, designedScreen) {
        switch (UIScaler = cloudkid.UIScaler, this._item = item, this._settings = settings, 
        this._designedScreen = designedScreen, this.origScaleX = item.scaleX, this.origScaleY = item.scaleY, 
        this.origWidth = item.width, this.origBounds = {
            x: 0,
            y: 0,
            width: item.width,
            height: item.height
        }, this.origBounds.right = this.origBounds.x + this.origBounds.width, this.origBounds.bottom = this.origBounds.y + this.origBounds.height, 
        settings.vertAlign) {
          case UIScaler.ALIGN_TOP:
            this.origMarginVert = item.y + this.origBounds.y;
            break;

          case UIScaler.ALIGN_CENTER:
            this.origMarginVert = .5 * designedScreen.height - item.y;
            break;

          case UIScaler.ALIGN_BOTTOM:
            this.origMarginVert = designedScreen.height - (item.y + this.origBounds.bottom);
        }
        switch (settings.horiAlign) {
          case UIScaler.ALIGN_LEFT:
            this.origMarginHori = item.x + this.origBounds.x;
            break;

          case UIScaler.ALIGN_CENTER:
            this.origMarginHori = .5 * designedScreen.width - item.x;
            break;

          case UIScaler.ALIGN_RIGHT:
            this.origMarginHori = designedScreen.width - (item.x + this.origBounds.right);
        }
    }, p = UIElement.prototype = {};
    p.origMarginHori = 0, p.origMarginVert = 0, p.origWidth = 0, p.origScaleX = 0, p.origScaleY = 0, 
    p.origBounds = null, p._settings = null, p._item = null, p._designedScreen = null, 
    p.resize = function(newScreen) {
        var overallScale = newScreen.height / this._designedScreen.height, ppiScale = newScreen.ppi / this._designedScreen.ppi, letterBoxWidth = (newScreen.width - this._designedScreen.width * overallScale) / 2, itemScale = overallScale / ppiScale;
        this._settings.minScale && itemScale < this._settings.minScale ? itemScale = this._settings.minScale : this._settings.maxScale && itemScale > this._settings.maxScale && (itemScale = this._settings.maxScale), 
        itemScale *= ppiScale, this._item.scaleX = this.origScaleX * itemScale, this._item.scaleY = this.origScaleY * itemScale;
        var m;
        switch (m = this.origMarginVert * overallScale, this._settings.vertAlign) {
          case UIScaler.ALIGN_TOP:
            this._item.y = m - this.origBounds.y * itemScale;
            break;

          case UIScaler.ALIGN_CENTER:
            this._item.y = .5 * newScreen.height - m;
            break;

          case UIScaler.ALIGN_BOTTOM:
            this._item.y = newScreen.height - m - this.origBounds.bottom * itemScale;
        }
        switch (m = this.origMarginHori * overallScale, this._settings.horiAlign) {
          case UIScaler.ALIGN_LEFT:
            this._item.x = this._settings.titleSafe ? letterBoxWidth + m - this.origBounds.x * itemScale : m - this.origBounds.x * itemScale;
            break;

          case UIScaler.ALIGN_CENTER:
            this._item.x = this._settings.centeredHorizontally ? .5 * (newScreen.width - this._item.width) : .5 * newScreen.width - m;
            break;

          case UIScaler.ALIGN_RIGHT:
            this._item.x = this._settings.titleSafe ? newScreen.width - letterBoxWidth - m - this.origBounds.right * itemScale : newScreen.width - m - this.origBounds.right * itemScale;
        }
    }, p.destroy = function() {
        this.origBounds = null, this._item = null, this._settings = null, this._designedScreen = null;
    }, namespace("cloudkid").UIElement = UIElement;
}(), function() {
    "use strict";
    var UIElementSettings = function() {}, p = UIElementSettings.prototype = {};
    p.vertAlign = null, p.horiAlign = null, p.titleSafe = !1, p.maxScale = 1, p.minScale = 1, 
    p.centeredHorizontally = !1, namespace("cloudkid").UIElementSettings = UIElementSettings;
}(), function() {
    "use strict";
    var UIElementSettings = cloudkid.UIElementSettings, UIElement = cloudkid.UIElement, ScreenSettings = cloudkid.ScreenSettings, UIScaler = function(parent, designedWidth, designedHeight, designedPPI) {
        this._parent = parent, this._items = [], this._designedScreen = new ScreenSettings(designedWidth, designedHeight, designedPPI);
    }, p = UIScaler.prototype = {}, currentScreen = new ScreenSettings(0, 0, 0), initialized = !1;
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
        currentScreen.width = screenWidth, currentScreen.height = screenHeight, currentScreen.ppi = screenPPI, 
        initialized = !0;
    }, p.getScale = function() {
        return currentScreen.height / this._designedScreen.height;
    }, p.add = function(item, vertAlign, horiAlign, titleSafe, minScale, maxScale, centeredHorizontally) {
        var s = new UIElementSettings();
        s.vertAlign = vertAlign || UIScaler.ALIGN_CENTER, s.horiAlign = horiAlign || UIScaler.ALIGN_CENTER, 
        s.titleSafe = "boolean" != typeof titleSafe ? !1 : titleSafe, s.maxScale = "number" != typeof maxScale ? 0/0 : maxScale, 
        s.minScale = "number" != typeof minScale ? 0/0 : minScale, s.centeredHorizontally = centeredHorizontally || !1, 
        this._items.push(new UIElement(item, s, this._designedScreen));
    }, UIScaler.resizeBackground = function(bitmap) {
        if (initialized) {
            var h, w, scale;
            h = bitmap.image.height, w = bitmap.image.width, scale = currentScreen.height / h, 
            bitmap.scaleX = bitmap.scaleY = scale, bitmap.x = .5 * (currentScreen.width - w * scale);
        }
    }, UIScaler.resizeBackgrounds = function(bitmaps) {
        for (var i = 0, len = bitmaps.length; len > i; ++i) UIScaler.resizeBackground(bitmaps[i]);
    }, p.resize = function() {
        if (this._items.length > 0) for (var i = 0, len = this._items.length; len > i; ++i) this._items[i].resize(currentScreen);
    }, p.destroy = function() {
        if (this._items.length > 0) for (var i = 0, len = this._items.length; len > i; ++i) this._items[i].destroy();
        this._parent = null, this._designedScreen = null, this._items = null;
    }, namespace("cloudkid").UIScaler = UIScaler;
}();