(function(undefined){
	
	/**
	*  Designed to mimic the feature-set of the CloudKidOS for AS3
	*  Provides a staging framework for other things to load
	*  handles the stage query string parameters, provides debug tools,
	*  as well as browser cache-busting.
	*  @class cloudkid.OS
	*  @extends createjs.Container|PIXI.DisplayObjectContainer
	*/
	var OS = function(){},
	
	/**
	* The prototype extends the easeljs' Container class
	* or the PIXI.DisplayObjectContainer class
	* 
	* @private
	* @property {createjs.Container|PIXI.DisplayObjectContainer} p
	*/
	p = OS.prototype = (false) ? new createjs.Container() : Object.create(PIXI.DisplayObjectContainer.prototype),
	
	/**
	*  Boolean to keep track if we're paused
	*  
	*  @property {bool} _paused
	*  @private
	*/
	_paused = false,
	
	/**
	*  When the OS is ready to use
	* 
	*  @property {bool} _isReady
	*  @private
	*/
	_isReady = false,
	
	/**
	*  The frame rate object
	*  @private
	*  @property {createjs.Text|PIXI.Text} _framerate
	*/
	_framerate = null,
	
	/**
	*  The number of ms since the last frame update
	*  @private
	*  @property {int} _lastFrameTime
	*/
	_lastFrameTime = 0,
	
	/**
	*  The last time since the last fps update
	*  @private
	*  @property {int} _lastFPSUpdateTime
	*/
	_lastFPSUpdateTime = 0,
	
	/**
	*  The calculated _framerate
	*  @private
	*  @property {Number} _framerateValue
	*/
	_framerateValue = null,
	
	/**
	*  The number of frames since the last fps update
	*  @private
	*  @property {int} _frameCount
	*/
	_frameCount = 0,
	
	/**
	*	The bound callback for listening to tick events
	*	@private
	*   @property {Function} _tickCallback
	*/
	_tickCallback = null,
	
	/**
	* Reference to the private instance object
	* 
	* @property {cloudkid.OS} _instance
	* @static
	* @protected
	*/
	_instance = null,
	
	/**
	* The id of the active requestAnimationFrame or setTimeout call.
	*
	* @property {Number} _tickId
	* @private
	*/
	_tickId = -1,
	
	/**
	* If requestionAnimationFrame should be used
	*
	* @private
	* @property {Bool} _useRAF
	* @default false
	*/
	_useRAF = false,
	
	/** 
	* The current internal frames per second
	*
	* @property {Number} _fps
	* @private
	*/
	_fps = 0,
	
	/**
	* The number of milliseconds per frame
	*
	* @property {int} _msPerFrame
	* @private
	*/
	_msPerFrame = 0;
	
	/** 
	* The version number 
	* @public
	* @static
	* @property {String} VERSION
	*/
	OS.VERSION = "${version}";	
	
	/**
	* Reference to the Container initialize()
	* @protected
	* @property {Function} Container_initialize
	*/
	if(false)
		p.Container_initialize = p.initialize;
		
	/**
	* Reference to the stage object
	* 
	* @property {createjs.Stage|PIXI.Stage} stage
	* @public
	*/
	p.stage = null;
	
	/**
	* [Pixi Only] The renderer used to draw the frame.
	* 
	* @property {PIXI.CanvasRenderer|PIXI.WebGLRenderer} _renderer The PixiJS renderer.
	* @private
	*/
	if(true)
		p._renderer = null;
	
	/**
	* [Pixi Only] A div that contains the canvas, so that games can layer it with other canvases if desired
	* 
	* @property canvasContainer The div element.
	*/
	if(true)
		p.canvasContainer = null;
	
	/**
	* Reference to the current application
	* @protected
	* @property {cloudkid.Application} _app
	*/
	p._app = null;
	
	/**
	* The collection of query string parameters
	* @public
	* @property {Dictionary} options
	*/
	p.options = null;
	
	/**
	*  Collection of update functions
	*  @protected
	*  @property {Dictionary} _updateFunctions
	*/
	p._updateFunctions = {};
	
	/**
	*  Static constructor for setting up the stage
	*  
	*  @example
		var os = cloudkid.OS.init("stage", {
			showFramerate: true,
			fps: 60,
			parseQueryString: true,
			debug: true
		});
		
		os.addApp(myApplication);
	*  
	*  @method init
	*  @static
	*  @public
	*  @param {string} stageName The stage name selector
	*  @param {Dictionary} options Additional options
	*/
	OS.init = function(stageName, options)
	{
		if (!_instance)
		{
			if (true)
			{
				Debug.log("Creating the singleton instance of OS");
			}
			
			_instance = new OS();
			_instance.initialize(stageName, options);
		}
		return _instance;
	};
	
	/**
	*  The internal constructor extends Container constructor
	*  @constructor
	*  @public
	*  @method initialize
	*  @param {string} stageName The string name of the stage id
	*  @param {object*} opts The optional options to set
	*/
	p.initialize = function(stageName, opts)
	{
		// Call the super constructor
		if (false) this.Container_initialize();
		if (true) PIXI.DisplayObjectContainer.call(this);
		
		// Setup the options container
		this.options = opts || {};
		
		// See if we should parse querystring
		if (this.options.parseQueryString !== undefined)
			this.options = parseQueryStringParams(this.options);
		
		// Turn on debugging
		if (this.options.debug !== undefined)
			Debug.enabled = this.options.debug === true || this.options.debug === "true";
			
		if (this.options.minLogLevel !== undefined)
			Debug.minLogLevel = parseInt(this.options.minLogLevel, 10);
		
		if(typeof this.options.ip == "string")//if we were supplied with an IP address, connect to it with the Debug class for logging
		{
			Debug.connect(this.options.ip);
		}
	
		// Setup the medialoader
		var loader = cloudkid.MediaLoader.init();
		
		// Setup the stage
		if(false)
		{
			this.stage = new createjs.Stage(stageName);
			this.stage.name = "cloudkid.OS";
		
			// prevent mouse down turning into cursor
			this.stage.canvas.onmousedown = function(e)
			{
				e.preventDefault();
			};
		}
		
		if(true)
		{
			this.stage = new PIXI.Stage(this.options.backgroundColor || 0, true);
		}
		this.stage.addChild(this);
		
		//listen for when the page visibility changes so we can pause our timings
		this.visibleListener = this.onWindowVisibilityChanged.bind(this);
		addPageHideListener(this.visibleListener);
		
		if(false)
		{
			// Setup the touch events
			var touchDevice=(window.hasOwnProperty('ontouchstart'));
			
			//IE10 doesn't send mouseover events properly if touch is enabled
			if(window.navigator.userAgent.indexOf("MSIE 10.0") != -1 && !touchDevice)
			{
				if (true) Debug.log('IE10 Desktop');
			}
			else
				createjs.Touch.enable(this.stage);

			// Clear the stage
			this.stage.autoClear = !!this.options.clearView || false;
			
			if(this.options.showFramerate)
			{
				// Add the frame rate object
				_framerate = new createjs.Text('', '10px Arial', '#000');
				_framerate.stroke = {width:2, color:"#ffffff"};
				_framerate.x = _framerate.y = 5;
				this.addChild(_framerate);
			}
			
			// Initial render
			this.stage.update();
		}
		
		if(true)
		{
			var transparent = !!this.options.transparent || false;
			var preMultAlpha = !!this.options.preMultAlpha || false;

			this.containerName = (typeof stageName == "string") ? stageName : stageName.attr("id");
			var container = (typeof stageName == "string") ? document.getElementById(stageName) : stageName;
			var canvasContainer = this.canvasContainer = document.createElement("div");
			container.appendChild(canvasContainer);
			canvasContainer.id = "CKOS";
			
			//create the rendererer
			var width = this.options.width || container.innerWidth;
			var height = this.options.height || container.innerHeight;
			if(this.options.forceContext == "canvas2d")
			{
				this._renderer = new PIXI.CanvasRenderer(
					width, 
					height, 
					null, 
					transparent
				);
			}
			else if(this.options.forceContext == "webgl")
			{
				this._renderer = new PIXI.WebGLRenderer(
					width, 
					height,
					null, 
					transparent,
					preMultAlpha
				);
			}
			else
			{
				this._renderer = PIXI.autoDetectRenderer(
					width, 
					height,
					null, 
					transparent,
					preMultAlpha
				);
			}
			canvasContainer.appendChild(this._renderer.view);
			canvasContainer.setAttribute("style","position:relative;width:" + width + "px;height:" + height + "px");
			
			//Here at CloudKid, we always have a bitmap background, so we can get better performance by not clearing the render area each render
			this._renderer.clearView = !!this.options.clearView;

			if(this.options.showFramerate)
			{
				// Add the frame rate object
				_framerate = new PIXI.Text('FPS: 0.000', {font:'10px Arial', fill:'black', stroke:'white', strokeThickness:2});
				_framerate.x = _framerate.y = 5;
				this.addChild(_framerate);
			}
			
			// Initial render
			this._renderer.render(this.stage);
		}
		
		//set up the tick callback
		_tickCallback = this.tick.bind(this);
		
		// If we should use requestAnimationFrame in the browser instead of setTimeout
		_useRAF = this.options.raf || false;
		
		//The fps to target - only used if not using requestAnimationFrame
		this.fps = this.options.fps || 60;

		// Set the app to default
		this.removeApp();
		
		// Check to see if we should load a versions file
		// The versions file keeps track of the OS version
		if (this.options.versionsFile !== undefined)
		{
			_isReady = false;
			
			var os = this;
			
			// Try to load the default versions file
			// callback should be made with a scope in mind
			loader.cacheManager.addVersionsFile(
				this.options.versionsFile, 
				function(){
					
					_isReady = true;
					
					// Someone added an application before the OS was ready
					// lets initialize is now
					if (os._app)
					{
						os.addChildAt(os._app, 0);
						os._app.init();
						os.resume();
					}
				}
			);
		}
		else
		{
			_isReady = true;
		}
	};
	
	var hidden = null;//needed inside the event listener as well
	var evtMap = null;
	var v = 'visible', h = 'hidden';
	var addPageHideListener = function(listener)
	{
		hidden = "hidden";
		// Standards:
		if (hidden in document)
			document.addEventListener("visibilitychange", listener);
		else if ((hidden = "mozHidden") in document)
			document.addEventListener("mozvisibilitychange", listener);
		else if ((hidden = "webkitHidden") in document)
			document.addEventListener("webkitvisibilitychange", listener);
		else if ((hidden = "msHidden") in document)
			document.addEventListener("msvisibilitychange", listener);
		else if ('onfocusin' in document)// IE 9 and lower:
		{
			evtMap = { focusin:v, focusout:h };
			document.onfocusin = document.onfocusout = listener;
		}
		else// All others:
		{
			evtMap = { focus:v, pageshow:v, blur:h, pagehide:h };
			window.onpageshow = window.onpagehide = window.onfocus = window.onblur = listener;
		}
	};
	
	var removePageHideListener = function(listener)
	{
		var hidden = "hidden";
		if (hidden in document)
			document.removeEventListener("visibilitychange", listener);
		else if ((hidden = "mozHidden") in document)
			document.removeEventListener("mozvisibilitychange", listener);
		else if ((hidden = "webkitHidden") in document)
			document.removeEventListener("webkitvisibilitychange", listener);
		else if ((hidden = "msHidden") in document)
			document.removeEventListener("msvisibilitychange", listener);
		document.onfocusin = document.onfocusout = null;
		window.onpageshow = window.onpagehide = window.onfocus = window.onblur = null;
	};

	p.onWindowVisibilityChanged = function(evt)
	{
		var v = 'visible', h = 'hidden';

		evt = evt || window.event;
		var value;
		if (evtMap)
			value = evtMap[evt.type];
		else
			value = document[hidden] ? h : v;
		if(value == h)
			this.pause();
		else
			this.resume();
	};
	
	/**
	*  Define all of the query string parameters
	*  @private
	*  @method parseQueryStringParams
	*  @param {object} output The object reference to update
	*/
	var parseQueryStringParams = function(output)
	{
		var href = window.location.href;
		var questionMark = href.indexOf("?");
		if (questionMark == -1) return output;
		
		var vars = questionMark < 0 ? '' : href.substr(questionMark+1);
		var pound = vars.indexOf('#');
		vars = pound < 0 ? vars : vars.substring(0, pound);
		var splitFlashVars = vars.split("&");
		var myVar;
		for( var i in splitFlashVars )
		{
			myVar = splitFlashVars[i].split("=");
			if (true)
			{
				Debug.log(myVar[0] + " -> " + myVar[1]);
			}
			output[myVar[0]] = myVar[1];
		}
		return output;
	};
	
	/**
	*  Pause the OS and stop frame updates
	*  @public
	*  @method pause
	*/
	p.pause = function()
	{
		if(_tickId != -1)
		{
			if(_useRAF)
			{
				if(window.cancelAnimationFrame)
					cancelAnimationFrame(_tickId);
			}
			else
				clearTimeout(_tickId);
			_tickId = -1;
		}
		_paused = true;
	};
	
	var nowFunc = window.performance && (performance.now || performance.mozNow || performance.msNow || performance.oNow || performance.webkitNow);
	if(nowFunc)
		nowFunc = nowFunc.bind(performance);
	else
		nowFunc = function() { return new Date().getTime(); };//apparently in Chrome this is extremely inaccurate (triple framerate or something silly)

	/**
	*  Gets the current time in milliseconds for timing purposes
	*  @public
	*  @method getTime
	*/
	p.getTime = function()
	{
		return nowFunc();
	};
	
	/**
	*  Resume the OS updates
	*  @public
	*  @method resume
	*/
	p.resume = function()
	{
		_paused = false;
		
		if(_tickId == -1)
		{
			_tickId = _useRAF ? 
				requestAnimFrame(_tickCallback): 
				setTargetedTimeout(_tickCallback);
		}
		_lastFPSUpdateTime = _lastFrameTime = this.getTime();
	};
	
	/**
	* The FPS that the OS is targeting.
	* 
	* @property {Number} fps
	* @public
	*/
	Object.defineProperty(p, "fps", {
		get: function() { return _fps; },
		set: function(value) {
			if(typeof value != "number") return;
			_fps = value;
			_msPerFrame = (1000 / _fps) | 0;
		}
	});
	
	/**
	*  Convenience for accessing the stage's width
	*   
	*  @property {Number} stageWidth
	*  @public
	*  @readOnly
	*/
	Object.defineProperty(p, "stageWidth", {
		get: function(){
			if (false) return _instance.stage.canvas.width;
			if (true) return _instance._renderer.view.width;
		}
	});
	
	/**
	*  Convenience for accessing the stage's height
	*   
	*  @property {Number} stageHeight
	*  @public
	*  @readOnly
	*/
	Object.defineProperty(p, "stageHeight", {
		get: function(){
			if (false) return _instance.stage.canvas.height;
			if (true) return _instance._renderer.view.height;
		}
	});
	
	var setTargetedTimeout = function(callback, timeInFrame)
	{
		var timeToCall = 0;
		if(timeInFrame)
			timeToCall = Math.max(0, _msPerFrame - timeInFrame);//subtract the time spent in the frame to actually hit the target fps
		return setTimeout(callback, timeToCall);
	};
	
	/**
	*  Remove the application
	*  @public
	*  @method removeApp
	*  @param {Boolean} destroying If the OS is being destroyed and shouldn't bother running any resetting code.
	*  @return {Boolean} If an `cloudkid.Application` was successfully removed
	*/
	p.removeApp = function(destroying)
	{
		var removed = false;
		
		var stage = this.stage;
		if (this._app)
		{
			if(false)
			{
				if(this.contains(this._app))
					this.removeChild(this._app);
				stage.removeAllChildren();
			}
			if(true)
			{
				if(this._app.parent == this)
					this.removeChild(this._app);
				stage.removeChildren();
			}
			this._app.destroy();
			removed = true;
		}
		this._app = null;
		
		// Stop the update
		this.pause();
				
		if(!destroying)
		{			
			stage.addChild(this);
			if(_framerate)
			{
				// Reset the framerate
				_framerate.text = "FPS: 0.000";
			}
			
			// Ignore spikes in frame count
			_lastFrameTime = _lastFPSUpdateTime = _framerateValue = _frameCount = 0;
			
			// Update the stage
			if(true) this._renderer.render(stage);
			else if(false) this.stage.update();
		}
		
		return removed;
	};
	
	/**
	*  Add an app to this display list
	*  @public 
	*  @method addApp
	*  @param {cloudkid.Application} app The application to add
	*/
	p.addApp = function(app)
	{
		this.removeApp();
		if (!(app instanceof cloudkid.Application))
		{
			throw new Error("Can only objects that inherit cloudkid.Application");
		}
		this._app = app;
		if (_isReady)
		{
			this.addChildAt(app, 0);
			this._app.init();
			this.resume();
		}
	};
	
	/**
	*  Get the current application
	*  @method getApp
	*  @public
	*  @return {cloudkid.Application} The current Application, null if no application
	*/
	p.getApp = function()
	{
		return this._app;
	};
	
	/**
	*  Add an update callback, must take elapsed as a parameter
	*  @method addUpdateCallback
	*  @public
	*  @param {string} alias An alias to associate with this callback
	*  @param {function} f The callback function
	*/
	p.addUpdateCallback = function(alias, f)
	{
		if (this._updateFunctions[alias] === undefined)
		{
			this._updateFunctions[alias] = f;
		}		
	};
	
	/**
	*  Remove an update callback, must take elapsed as a parameter
	*  @public
	*  @method removeUpdateCallback
	*  @param {string} alias The callback function alias
	*/
	p.removeUpdateCallback = function(alias)
	{
		if (this._updateFunctions[alias] !== undefined)
		{
			delete this._updateFunctions[alias];
		}
	};
	
	/**
	*  Called by the stage listener
	*  @public
	*  @method tick
	*/
	p.tick = function()
	{
		if (_paused)
		{
			_tickId = -1;
			return;
		}
		
		var now = this.getTime();
		var dTime = now - _lastFrameTime;
		
		// Only update the framerate ever second
		if(_framerate && _framerate.visible)
		{
			_frameCount++;
			var elapsed = now - _lastFPSUpdateTime;
			if (elapsed > 1000)
			{
				_framerateValue = 1000 / elapsed * _frameCount;
				if(true)
					_framerate.setText("FPS: " + (Math.round(_framerateValue * 1000) / 1000));
				else if(false)
					_framerate.text = "FPS: " + (Math.round(_framerateValue * 1000) / 1000);
				_lastFPSUpdateTime = now;
				_frameCount = 0;
			}
		}
		_lastFrameTime = now;
		
		//update app				
		if (this._app)
		{
			this._app.update(dTime);
		}
		//update other functions
		for(var alias in this._updateFunctions)
		{
			this._updateFunctions[alias](dTime);
		}
		//render stage
		if (true) this._renderer.render(this.stage);
		if (false) this.stage.update(dTime);
		
		//request the next animation frame
		_tickId = _useRAF ? 
			requestAnimFrame(_tickCallback) : 
			setTargetedTimeout(_tickCallback, this.getTime() - _lastFrameTime);
	};
	
	/**
	*  [PIXI Only] Resizes the renderer and the canvasContainer.
	*  @public
	*  @method resize
	*/
	if(true)
	{
		p.resize = function(width, height)
		{
			this._renderer.resize(width, height);
			this.canvasContainer.setAttribute("style","position:relative;width:" + width + "px;height:" + height + "px");
		};
	}
	
	/**
	*  Destroy the instance of the OS, can init after this,
	*  also destroys the application, if around
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		var stage = this.stage;//keep a reference for later in case the OS is removed from the stage
		
		var ml = cloudkid.MediaLoader.instance;
		this.pause();
		this.removeApp(true);
		_instance = null;
		
		if(false)
		{
			createjs.Touch.disable(stage);
			stage.enableMouseOver(-1);//disable mouseover events
			stage.enableDOMEvents(false);
		}
		
		ml.destroy();
		this.stage = null;
		this._updateFunctions = null;
		removePageHideListener(this.visibleListener);
		
		if(true)
		{
			this.removeChildren(true);
			stage.destroy();
			this._renderer.destroy();
			this._renderer = null;
			this.canvasContainer = null;
		}
	};
	
	/**
	*  Static function for getting the singleton instance
	*  @static
	*  @readOnly
	*  @public
	*  @attribute instance
	*  @type cloudkid.OS
	*/
	Object.defineProperty(OS, "instance", {
		get:function()
		{
			if (!_instance)
			{
				throw 'Call cloudkid.OS.init(canvasId)';
			}
			return _instance;
		}
	});
	
	// Add to the name space
	namespace('cloudkid').OS = OS;
}());
(function(){
	"use strict";
	
	/** The SavedData functions use localStorage and sessionStorage, with a cookie fallback. */
	// Create a class object
	var SavedData = function(){},
	
	/** A constant to determine if we can use localStorage and sessionStorage */
	WEB_STORAGE_SUPPORT = typeof(window.Storage) !== "undefined",
	
	/** A constant for cookie fallback for SavedData.clear() */
	ERASE_COOKIE = -1;

	//in iOS, if the user is in Private Browsing, writing to localStorage throws an error.
	if(WEB_STORAGE_SUPPORT)
	{
		try
		{
			localStorage.setItem("LS_TEST", "test");
			localStorage.removeItem("LS_TEST");
		}
		catch(e)
		{
			WEB_STORAGE_SUPPORT = false;
		}
	}
	
	/** 
	*  Remove a saved variable by name.
	*  @param name The name of the value to remove
	*/
	SavedData.remove = function(name)
	{
		if(WEB_STORAGE_SUPPORT)
		{
			localStorage.removeItem(name);
			sessionStorage.removeItem(name);
		}
		else
			SavedData.write(name,"",ERASE_COOKIE);
	};
	
	/**
	*  Save a variable.
	*  @param name The name of the value to save
	*  @param value The value to save. This will be run through JSON.stringify().
	*  @param tempOnly If the value should be saved only in the current browser session.
	*/
	SavedData.write = function(name,value,tempOnly)
	{
		if(WEB_STORAGE_SUPPORT)
		{
			if(tempOnly)
				sessionStorage.setItem(name, JSON.stringify(value));
			else
				localStorage.setItem(name, JSON.stringify(value));
		}
		else
		{
			var expires;
			if (tempOnly)
			{
				if(tempOnly !== ERASE_COOKIE)
					expires = "";//remove when browser is closed
				else
					expires = "; expires=Thu, 01 Jan 1970 00:00:00 GMT";//save cookie in the past for immediate removal
			}
			else
				expires = "; expires="+new Date(2147483646000).toGMTString();//THE END OF (32bit UNIX) TIME!
				
			document.cookie = name+"="+escape(JSON.stringify(value))+expires+"; path=/";
		}
	};
	
	/**
	*  Read the value of a saved variable
	*  @param name The name of the variable
	*  @return The value (run through JSON.parse()) or null if it doesn't exist
	*/
	SavedData.read = function(name)
	{
		if(WEB_STORAGE_SUPPORT)
		{
			var value = localStorage.getItem(name) || sessionStorage.getItem(name);
			if(value)
				return JSON.parse(value);
			else
				return null;
		}
		else
		{
			var nameEQ = name + "=",
				ca = document.cookie.split(';'),
				i = 0, c;
				
			for(i=0;i < ca.length;i++)
			{
				c = ca[i];
				while (c.charAt(0) == ' ') c = c.substring(1,c.length);
				if (c.indexOf(nameEQ) === 0) return JSON.parse(unescape(c.substring(nameEQ.length,c.length)));
			}
			return null;
		}
	};
	
	// Assign to the global space
	namespace('cloudkid').SavedData = SavedData;
	
}());
(function(){
	
	//Example worker code:
	/*var workerCode = "this.initialVariable = 10;" +
	"this.onmessage = function(event)" +
	"{" +
		"var data = event.data;" +
		"var returnVal = this.initialVariable + data.addValue;" +
		"this.postMessage(returnVal);" +
	"};"*/
	
	window.URL = window.URL || window.webkitURL;
	window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
	//assign the function to the namespace
	/** Creates a Worker or a fallback with the same API.
	*	@param codeString The code in string form to make the worker from. As a string, fallback support is easier.
	*	@return Either a Worker or a fallback with the same API to use. */
	namespace("cloudkid").createWorker = function(codeString)
	{
		if(!window.URL || !window.Worker) return new FallbackWorker(codeString);

		var blob;
		try
		{
			blob = new Blob([codeString], {type: 'application/javascript'});
		}
		catch (e)
		{
			// try Backwards-compatibility with blob builders
			if(!window.BlobBuilder) return new FallbackWorker(codeString);
			try
			{
				blob = new BlobBuilder();
				blob.append(codeString);
				blob = blob.getBlob();
			}
			catch(error)
			{
				//no way of generating a blob to create worker from
				return new FallbackWorker(codeString);
			}
		}
		if(!blob) return new FallbackWorker(codeString);//if somehow no blob was created, return a fallback worker
		try
		{
			//IE 10 and 11, while supporting Blob and Workers, should throw an error here, so we should catch it and fall back
			var worker = new Worker(URL.createObjectURL(blob));
			return worker;
		}
		catch(e)
		{
			//can't create a worker
			return new FallbackWorker(codeString);
		}
	};
	
	/* Internal class pretends to be a Worker's context */
	var SubWorker = function(codeString, parent)
	{
		this._wParent = parent;
		eval(codeString); // jshint ignore:line
	};

	var p = SubWorker.prototype;
	p.onmessage = null;

	p.postMessage = function(data)
	{
		var parent = this._wParent;
		setTimeout(parent.onmessage.bind(parent, {data:data}), 1);
	};
	
	/* Internal class duplicates Worker API */
	var FallbackWorker = function(codeString)
	{
		this._wChild = new SubWorker(codeString, this);
	};

	p = FallbackWorker.prototype;

	p.postMessage = function(data)
	{
		var child = this._wChild;
		setTimeout(child.onmessage.bind(child, {data:data}), 1);
	};

	p.terminate = function()
	{
		this.onmessage = null;
		var child = this._wChild;
		child._wParent = null;
		child.onmessage = null;
		this._wChild = null;
	};

	p.onmessage = null;
	p._wChild = null;
}());
(function() {
	var CombinedCallback = function(call, obj, prop, callProp)
	{
		if(!obj[prop])//accept anything that resolves to false: eg voPlayer.playing == false
			call();
		else
			obj[callProp] = call;
	};

	CombinedCallback.create = function(call, obj, prop, callProp)
	{
		return CombinedCallback.bind(this, call, obj, prop, callProp);
	};

	namespace('cloudkid').CombinedCallback = CombinedCallback;
}());

(function(){
	
	/**
	*  An application is an abstract class which extends `createjs.Container`
	*  and is managed by the `cloudkid.OS`
	*
	*  @class cloudkid.Application
	*/
	var Application = function()
	{
		if(false) 
		{
			this.initialize();
		}	
		else if(true)
		{
			PIXI.DisplayObjectContainer.call(this);
		}	
	};
	
	// Shortcut reference to the prototype
	var p;
	
	// Extends the container
	if (false)
	{
		p = Application.prototype = new createjs.Container();
	}
	// Extends the PIXI display object
	else if (true)
	{
		p = Application.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
	}
		
	/**
	* The application is ready to use, added to stage
	*
	* @public
	* @method init
	*/
	p.init = function(){};
	
	/**
	*  The updated function called by the OS
	*  this function is implementation-specific
	*
	*  @public
	*  @method update
	*  @param {int} elapsed The number of MS since the last frame update
	*/
	p.update = function(elapsed){};
	
	/**
	* Destroy the application, don't use after this
	* 
	* @public
	* @method destroy
	*/
	p.destroy = function(){};
	
	/**
	*  Resize the application
	*
	* @public 
	* @method resize
	*/
	p.resize = function(){};
	
	namespace('cloudkid').Application = Application;
}());
(function(){
	
	/**
	*  Represents a single item in the loader queue 
	*  @class cloudkid.LoaderQueueItem
	*/
	var LoaderQueueItem = function(){};
	
	/** Reference to the prototype */
	var p = LoaderQueueItem.prototype;
	
	/** 
	* Highest priority
	* @static
	* @public
	* @final
	* @property {int} PRIORITY_HIGH
	*/
	LoaderQueueItem.PRIORITY_HIGH = 1;
	
	/** 
	* Normal priority, the default
	* @static
	* @public
	* @final
	* @property {int} PRIORITY_NORMAL
	*/
	LoaderQueueItem.PRIORITY_NORMAL = 0;
	
	/** 
	* Lowest priority
	* @static
	* @public
	* @final
	* @property {int} PRIORITY_LOW
	*/
	LoaderQueueItem.PRIORITY_LOW = -1;
	
	/**
	*  The url of the load
	*  @public
	*  @property {string} url
	*/
	p.url = null;
	
	/**
	*  Data associate with the load
	*  @public
	*  @property {*} data
	*/
	p.data = null;
	
	/**
	*  The callback function of the load, to call when 
	*  the load as finished, takes one argument as result
	*  @public
	*  @property {function} callback
	*/
	p.callback = null;
	
	/**
	*  The priority of this item
	*  @property {int} priority
	*  @public
	*/
	p.priority = 0;
	
	/**
	*  The amount we've loaded so far, from 0 to 1
	*  @public
	*  @property {Number} progress
	*/
	p.progress = 0;
	
	/**
	*  The progress callback
	*  @public
	*  @proprty {function} updateCallback
	*/
	p.updateCallback = null;
	
	p._boundFail = null;
	p._boundProgress = null;
	p._boundComplete = null;
	
	/**
	*  Represent this object as a string
	*  @public
	*  @method toString
	*  @return {string} The string representation of this object
	*/
	p.toString = function()
	{
		return "[LoaderQueueItem(url:'"+this.url+"', priority:"+this.priority+")]";
	};
	
	/**
	*  Destroy this result
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		this.callback = null;
		this.updateCallback = null;
		this.data = null;
		this._boundFail = null;
		this._boundProgress = null;
		this._boundComplete = null;
	};
	
	// Assign to the name space
	namespace('cloudkid').LoaderQueueItem = LoaderQueueItem;
}());
(function(){
	
	/**
	*  The Medialoader is the singleton loader for loading all assets
	*  including images, data, code and sounds. MediaLoader supports cache-busting
	*  in the browser using dynamic query string parameters.
	* 
	*  @class cloudkid.MediaLoader
	*/
	var MediaLoader = function(){};
	
	/** The prototype */
	var p = MediaLoader.prototype;
	
	/**
	* Reference to the private instance object
	* @static
	* @protected
	*/
	MediaLoader._instance = null;
	
	/**
	*  The collection of LoaderQueueItems
	*  @private
	*/
	var queue = null;
	
	/**
	*  The collection of LoaderQueueItems by url
	*  @private
	*/
	var queueItems = null;
	
	/**
	*  The collection of loaders
	*  @private
	*  @property {object} loaders
	*/
	var loaders = null;
	
	var qiPool = null;
	var loaderPool = null;
	var resultPool = null;
	
	/**
	*  The current number of items loading
	*  @private
	*  @property {int} numLoads
	*  @default 0
	*/
	var numLoads = 0;
	
	var retries = null;
	
	/**
	*  If we can load
	*  @private
	*/
	p._canLoad = true;
	
	/**
	*  The maximum number of simulaneous loads
	*  @public
	*  @property {int} maxSimultaneousLoads
	*  @default 2
	*/
	p.maxSimultaneousLoads = 2;
	
	/**
	*  The reference to the cache manager
	*  @public
	*  @property {cloudkid.CacheManager} cacheManager
	*/
	p.cacheManager = null;
	
	/**
	*  Static constructor creating the singleton
	*  @method init
	*  @static
	*  @public
	*/
	MediaLoader.init = function()
	{
		if (!MediaLoader._instance)
		{
			MediaLoader._instance = new MediaLoader();
			MediaLoader._instance._initialize();
		}
		return MediaLoader._instance;
	};
		
	/**
	*  Static function for getting the singleton instance
	*  @static
	*  @readOnly
	*  @public
	*  @property {cloudkid.OS} instance
	*/
	Object.defineProperty(MediaLoader, "instance", {
		get:function()
		{
			if (!MediaLoader._instance)
			{
				throw 'Call cloudkid.MediaLoader.init()';
			}
			return MediaLoader._instance;
		}
	});
	
	/**
	*  Destroy the MediaLoader singleton, don't use after this
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		var i, len, key, arr = this.queue;
		if(arr)
		{
			for(i = 0, len = arr.length; i < i; ++i)
				arr[i].destroy();
			arr = qiPool;
			for(i = 0, len = arr.length; i < i; ++i)
				arr[i].destroy();
			arr = resultPool;
			for(i = 0, len = arr.length; i < i; ++i)
				arr[i].destroy();
			for(key in loaders)
			{
				queueItems[key].destroy();
				loaders[key].close();
			}
		}
		MediaLoader._instance = null;
		if (this.cacheManager)
			this.cacheManager.destroy();
		this.cacheManager = null;
		queue = null;
		resultPool = null;
		loaderPool = null;
		qiPool = null;
		queueItems = null;
		retries = null;
		loaders = null;
	};
	
	/**
	*  Initilize the object
	*  @protected
	*  @method _initialize
	*/
	p._initialize = function()
	{
		qiPool = [];
		loaderPool = [];
		resultPool = [];
		queue = [];
		queueItems = {};
		loaders = {};
		retries = {};
		this.cacheManager = new cloudkid.CacheManager();
	};
	
	/**
	*  Load a file 
	*  @method load
	*  @public
	*  @param {string} url The file path to load
	*  @param {function} callback The callback function when completed
	*  @param {function*} updateCallback The callback for load progress update, passes 0-1 as param
	*  @param {int*} priority The priority of the load
	*  @param {*} data optional data
	*/
	p.load = function(url, callback, updateCallback, priority, data)
	{
		var qi = this._getQI();
		
		var basePath = cloudkid.OS.instance.options.basePath;
		if (basePath !== undefined && /^http(s)?\:/.test(url) === false && url.search(basePath) == -1)
		{
			qi.basePath = basePath;
		}
		
		qi.url = url;
		qi.callback = callback;
		qi.updateCallback = updateCallback || null;
		qi.priority = priority || cloudkid.LoaderQueueItem.PRIORITY_NORMAL;
		qi.data = data || null;
		
		queue.push(qi);
		
		// Sory by priority
		queue.sort(function(a, b){
			return a.priority - b.priority;
		});
		
		// Try to load the next queue item
		this._tryNextLoad();
	};
	
	/**
	*  There was an error loading the file
	*  @private
	*  @method _onLoadFailed
	*  @param {cloudkid.LoaderQueueItem} qi The loader queue item
	*/
	p._onLoadFailed = function(qi, event)
	{
		Debug.error("Unable to load file: " + qi.url  + " - reason: " + event.error);
		
		var loader = loaders[qi.url];
		loader.removeAllEventListeners();
		loader.close();
		this._poolLoader(loader);
		
		delete queueItems[qi.url];
		delete loaders[qi.url];
		
		if(retries[qi.url])
			retries[qi.url]++;
		else
			retries[qi.url] = 1;
		if(retries[qi.url] > 3)
			this._loadDone(qi, null);
		else
		{
			numLoads--;
			queue.push(qi);
			this._tryNextLoad();
		}
	};
	
	/**
	*  The file load progress event
	*  @method _onLoadProgress
	*  @private
	*  @param {cloudkid.LoaderQueueItem} qi The loader queue item
	*  @param {object} event The progress event
	*/
	p._onLoadProgress = function(qi, event)
	{
		qi.progress = event.progress;
		if (qi.updateCallback){
			qi.updateCallback(qi.progress);
		}	
	};
	
	/**
	*  The file was loaded successfully
	*  @private
	*  @method _onLoadCompleted
	*  @param {cloudkid.LoaderQueueItem} qi The loader queue item
	*  @param {object} ev The load event
	*/
	p._onLoadCompleted = function(qi, ev)
	{
		if(true)
		{
			Debug.log("File loaded successfully from " + qi.url);
		}
		var loader = loaders[qi.url];
		loader.removeAllEventListeners();
		loader.close();
		this._poolLoader(loader);
		
		delete queueItems[qi.url];
		delete loaders[qi.url];
		this._loadDone(qi, this._getResult(ev.result, qi.url, loader));
	};
	
	/**
	*  Attempt to do the next load
	*  @method _tryNextLoad
	*  @private
	*/
	p._tryNextLoad = function()
	{
		if (numLoads > this.maxSimultaneousLoads - 1 || queue.length === 0) return;
		
		numLoads++;
		
		var qi = queue.shift();
		
		if(true)
		{
			Debug.log("Attempting to load file '" + qi.url + "'");
		}
		
		queueItems[qi.url] = qi;
		
		var loader = this._getLoader(qi.basePath);
		
		// Add to the list of loaders
		loaders[qi.url] = loader;
		
		loader.addEventListener("fileload", qi._boundComplete);
		loader.addEventListener("error", qi._boundFail);
		loader.addEventListener("fileprogress", qi._boundProgress);
		var url = this.cacheManager.prepare(qi.url);
		loader.loadFile(qi.data ? {id:qi.data.id, src:url, data:qi.data} : url);
	};
	
	/**
	*  Alert that the loading is finished
	*  @private 
	*  @method _loadDone
	*  @param {cloudkid.LoaderQueueItem} qi The loader queue item
	*  @param {object} result The event from preloadjs or null
	*/
	p._loadDone = function(qi, result)
	{
		numLoads--;
		if(qi.data && result)//a way to keep track of load results without excessive function binding
			result.id = qi.data.id;
		qi.callback(result);
		//qi.destroy();
		this._poolQI(qi);
		this._tryNextLoad();
	};
	
	/**
	*  Cancel a load that's currently in progress
	*  @public
	*  @method cancel
	*  @param {string} url The url
	*  @return {bool} If canceled returns true, false if not canceled
	*/
	p.cancel = function(url)
	{
		var qi = queueItems[url];
		var loader = loaders[url];
		
		if (qi && loader)
		{
			loader.close();
			delete loaders[url];
			delete queueItems[qi.url];
			numLoads--;
			this._poolLoader(loader);
			this._poolQI(qi);
			return true;
		}
		
		for(i = 0, len = queue.length; i < len; i++)
		{
			qi = queue[i];
			if (qi.url == url){
				queue.splice(i, 1);
				this._poolQI(qi);
				return true;
			}
		}
		return false;		
	};
	
	p._getQI = function()
	{
		var rtn;
		if(qiPool.length)
			rtn = qiPool.pop();
		else
		{
			rtn = new cloudkid.LoaderQueueItem();
			rtn._boundFail = this._onLoadFailed.bind(this, rtn);
			rtn._boundProgress = this._onLoadProgress.bind(this, rtn);
			rtn._boundComplete = this._onLoadCompleted.bind(this, rtn);
		}
		return rtn;
	};
	
	p._poolQI = function(qi)
	{
		qiPool.push(qi);
		qi.callback = qi.updateCallback = qi.data = qi.url = null;
		qi.progress = 0;
	};
	
	p._getLoader = function(basePath)
	{
		var rtn;
		if(loaderPool.length)
		{
			rtn = loaderPool.pop();
			rtn._basePath = basePath;//apparently they neglected to make this public
		}
		else
			rtn = new createjs.LoadQueue(true, basePath);
		//allow the loader to handle sound as well
		if(createjs.Sound)
			rtn.installPlugin(createjs.Sound);
		return rtn;
	};
	
	p._poolLoader = function(loader)
	{
		loader.removeAll();//clear the loader for reuse
		loaderPool.push(loader);
	};
	
	p._getResult = function(result, url, loader)
	{
		var rtn;
		if(resultPool.length)
		{
			rtn = resultPool.pop();
			rtn.content = result;
			rtn.url = url;
			rtn.loader = loader;
		}
		else
			rtn = new cloudkid.MediaLoaderResult(result, url, loader);
		return rtn;
	};
	
	p._poolResult = function(result)
	{
		result.content = result.url = result.loader = result.id = null;
		resultPool.push(result);
	};
	
	namespace('cloudkid').MediaLoader = MediaLoader;
}());
(function(){
	
	/**
	*  The return result of the MediaLoader load
	*  @class cloudkid.MediaLoaderResult
	*  @constructor
	*  @param {*} content The dynamic content loaded
	*  @param {string} string
	*  @param {createjs.LoadQueue} loader
	*/
	var MediaLoaderResult = function(content, url, loader)
	{
		this.content = content;
		this.url = url;
		this.loader = loader;
	};
	
	/** Reference to the prototype */
	var p = MediaLoaderResult.prototype;
	
	/**
	*  The contents of the load
	*  @public
	*  @property {*} content 
	*/
	p.content = null;
	
	/**
	*  The url of the load
	*  @public
	*  @property {string} url
	*/
	p.url = null;
	
	/**
	*  Reference to the preloader object
	*  @public
	*  @property {createjs.LoaderQueue} loader
	*/
	p.loader = null;
	
	/**
	* A to string method
	* @public
	* @method toString
	* @return {string} A string rep of the object
	*/
	p.toString = function()
	{
		return "[MediaLoaderResult('"+this.url+"')]";
	};
	
	/**
	* Destroy this result
	* @public
	* @method destroy
	*/
	p.destroy = function()
	{
		this.callback = null;
		this.url = null;
		this.content = null;
	};
	
	// Assign to the name space
	namespace('cloudkid').MediaLoaderResult = MediaLoaderResult;
}());
(function(undefined){
	
	/**
	*  Used for managing the browser cache of loading external elements
	*  can easily load version manifest and apply it to the media loader
	*  supports cache busting all media load requests
	*  uses the query string to bust browser versions.
	*  
	*  @class cloudkid.CacheManager
	*/
	var CacheManager = function()
	{
		this.initialize();
	};
	
	/** Easy access to the prototype */
	var p = CacheManager.prototype = {};
	
	/**
	*  The collection of version numbers
	*  @protected
	*  @property {Dictionary} _versions
	*/
	p._versions = null;
	
	/**
	*  If we are suppose to cache bust every file
	*  @property {bool} cacheBust
	*  @public
	*  @default false
	*/
	p.cacheBust = false;
	
	/**
	* The constructor for the Cache manager
	* @public
	* @constructor
	* @method initialize
	*/
	p.initialize = function()
	{
		this._versions = [];
				
		var cb = cloudkid.OS.instance.options.cacheBust;
		this.cacheBust = cb ? (cb === "true" || cb === true) : false;
		
		if(true)
		{
			if (this.cacheBust) Debug.log("CacheBust all files is on.");
		}
	};
	
	/**
	*  Destroy the cache manager, don't use after this
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		this._versions = null;
	};
	
	/**
	*  Add the versions
	*  @public
	*  @method addVersionsFile
	*  @param {string} url The url of the versions file
	*  @param {function} callback Callback when the url has been laoded
	*  @param {string} baseUrl A base url to prepend all lines of the file
	*/
	p.addVersionsFile = function(url, callback, baseUrl)
	{		
		Debug.assert(/^.*\.txt$/.test(url), "The versions file must be a *.txt file");
				
		var ml = cloudkid.MediaLoader.instance;
		
		// If we already cache busting, we can ignore this
		if (this.cacheBust)
		{
			if (callback) callback();
			return;
		}
		
		// Add a random version number to never cache the text file
		this.addVersion(url, Math.round(Math.random()*100000));
		
		var cm = this;
		
		// Load the version
		ml.load(url, 
			function(result)
			{				
				// check for a valid result content
				if (result && result.content)
				{
					// Remove carrage returns and split on newlines
					var lines = result.content.replace(/\r/g, '').split("\n");
					var i, parts;

					// Go line by line
					for(i = 0; i < lines.length; i++)
					{	
						// Check for a valid line
						if (!lines[i]) continue;

						// Split lines
						parts = lines[i].split(' ');

						// Add the parts
						if (parts.length != 2) continue;

						// Add the versioning
						cm.addVersion((baseUrl || "") + parts[0], parts[1]);
					}
				}
				if (callback) callback();
			}
		);
	};
	
	/**
	*  Add a version number for a file
	*  @method addVersion
	*  @public
	*  @param {string} url The url of the object
	*  @param {string} version Version number or has of file
	*/
	p.addVersion = function(url, version)
	{
		var ver = this._getVersionByUrl(url);
		if (!ver)
			this._versions.push({'url': url, 'version': version});
	};
	
	/**
	*  Search for a version number by url
	*  @method _getVersionByUrl
	*  @private
	*  @param {string} url The url to search
	*  @return {string} The version number as a string or null
	*/
	p._getVersionByUrl = function(url)
	{
		var i, len = this._versions.length;
		for(i = 0; i < len; i++)
		{
			if (url == this._versions[i].url)
			{
				return this._versions[i];
			}
		}
		return null;
	};
	
	/**
	*  Prepare a URL with the necessary cache busting and/or versioning
	*  as well as the base directoryr
	*  @public
	*  @method prepare
	*  @param {string} url The url to prepare
	*  @param {bool} applyBasePath If the global base path should be applied to the url. This defaults to false because it can 
	*								potentially interfere with later regular expression checks, particularly with PreloadJS
	*  @return {string} The final url with version/cache and basePath added
	*/
	p.prepare = function(url, applyBasePath)
	{
		var ver = this._getVersionByUrl(url);
		
		if (this.cacheBust && /(\?|\&)cb\=[0-9]*/.test(url) === false)
		{
			if(!this._cbVal)
				this._cbVal = new Date().getTime().toString();
			url = url + (url.indexOf("?") < 0 ? "?" : "&") + "cb=" + this._cbVal;
		} 
		else if (ver && /(\?|\&)v\=[0-9]*/.test(url) === false)
		{
			url = url + (url.indexOf("?") < 0 ? "?" : "&") + "v=" + ver.version;
		}
		if(applyBasePath)
		{
			var basePath = cloudkid.OS.instance.options.basePath;
			if (/^http(s)?\:/.test(url) === false && basePath !== undefined && url.search(basePath) == -1)
			{
				url = basePath + url;
			}
		}
		return url;
	};
	
	namespace('cloudkid').CacheManager = CacheManager;
	
}());
(function(undefined) {
	/**
	*  A Multipurpose button class. It is designed to have one image, and an optional text label.
	*  The button can be a normal button or a selectable button.
	*  The button functions similarly with both CreateJS and PIXI, but slightly differently in
	*  initialization and callbacks.
	*
	*  - Initialization - the parameters for initialization are different. See the documentation for initialize().
	*  - [PIXI only] Use releaseCallback and overCallback to know about button clicks and mouse overs, respectively.
	*  - [CreateJS only] Add event listeners for click and mouseover to know about button clicks and mouse overs, respectively.
	*  @class cloudkid.Button
	*  @extends createjs.Container|PIXI.DisplayObjectContainer
	*/
	var Button = function(imageSettings, label, enabled)
	{
		PIXI.DisplayObjectContainer.call(this);
		this.initialize(imageSettings, label, enabled);
	};
	
	// Reference to the prototype
	var p = Button.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
	
	/*
	*  The sprite that is the body of the button.
	*  The type of this property is dependent on which version of the OS library is used.
	*  @public
	*  @property {createjs.Bitmap|PIXI.Sprite} back
	*  @readOnly
	*/
	p.back = null;
	/*
	*  The text field of the button. The label is centered by both width and height on the button.
	*  The type of this property is dependent on which version of the OS library is used.
	*  @public
	*  @property {createjs.Text|PIXI.Text|PIXI.BitmapText} label
	*  @readOnly
	*/
	p.label = null;
	/**
	*  **[PIXI only]** The function that should be called when the button is released.
	*  @public
	*  @property {function} releaseCallback
	*/
	p.releaseCallback = null;
	/**
	*  **[PIXI only]** The function that should be called when the button is moused over.
	*  @public
	*  @property {function} overCallback
	*/
	p.overCallback = null;
	
	/**
	*  **[PIXI only]** The function that should be called when mouse leaves the button.
	*  @public
	*  @property {function} outCallback
	*/
	p.outCallback = null;
	
	//===button state variables
	/*
	* If this button is enabled.
	* @private
	* @property {Boolean} _enabled
	*/
	p._enabled = false;
	/*
	* If this button is held down.
	* @private
	* @property {Boolean} _isDown
	*/
	p._isDown = false;
	/*
	* If the mouse is over this button
	* @private
	* @property {Boolean} _isOver
	*/
	p._isOver = false;
	/*
	* If this button is selected.
	* @private
	* @property {Boolean} _isSelected
	*/
	p._isSelected = false;
	/*
	* If this button is a selectable button, and will respond to select being set.
	* @private
	* @property {Boolean} _isSelectable
	*/
	p._isSelectable = false;
	/*
	* If this button is highlighted.
	* @private
	* @property {Boolean} _isHighlighted
	*/
	p._isHighlighted = false;
	
	//===callbacks for mouse/touch events
	/*
	* Callback for mouse over, bound to this button.
	* @private
	* @property {Function} _overCB
	*/
	p._overCB = null;
	/*
	* Callback for mouse out, bound to this button.
	* @private
	* @property {Function} _outCB
	*/
	p._outCB = null;
	/*
	* Callback for mouse down, bound to this button.
	* @private
	* @property {Function} _downCB
	*/
	p._downCB = null;
	/*
	* Callback for mouse up, bound to this button.
	* @private
	* @property {Function} _upCB
	*/
	p._upCB = null;
	/**
	* [PIXI only] Callback for mouse up outside, bound to this button.
	* @private
	* @property {Function} _upOutCB
	*/
	p._upOutCB = null;
	
	//===textures for different button states
	/**
	* [PIXI only] The texture for the up state of the button
	* @private
	* @property {PIXI.Texture} _upTex
	*/
	p._upTex = null;
	/**
	* [PIXI only] The texture for the over state of the button
	* @private
	* @property {PIXI.Texture} _overTex
	*/
	p._overTex = null;
	/**
	* [PIXI only] The texture for the down state of the button
	* @private
	* @property {PIXI.Texture} _downTex
	*/
	p._downTex = null;
	/**
	* [PIXI only] The texture for the disabled state of the button
	* @private
	* @property {PIXI.Texture} _disabledTex
	*/
	p._disabledTex = null;
	/**
	* [PIXI only] The texture for the selected state of the button
	* @private
	* @property {PIXI.Texture} _selectedTex
	*/
	p._selectedTex = null;
	/**
	* [PIXI only] The texture for the highlighted state of the button
	* @private
	* @property {PIXI.Texture} _highlightedTex
	*/
	p._highlightedTex = null;
	
	/*
	* [PIXI only] An additional sprite that is made to be a 'slave' to this button. Its state is updated with the button state, from slaveSettings's art.
	* @private
	* @property {PIXI.Sprite} _slave
	* @readOnly
	*/
	p._slave = null;
	
	//===textures for different button states
	/**
	* [PIXI only] The texture for the up state of the button
	* @private
	* @property {PIXI.Texture} _slaveUpTex
	*/
	p._slaveUpTex = null;
	/**
	* [PIXI only] The texture for the over state of the button
	* @private
	* @property {PIXI.Texture} _slaveOverTex
	*/
	p._slaveOverTex = null;
	/**
	* [PIXI only] The texture for the down state of the button
	* @private
	* @property {PIXI.Texture} _slaveDownTex
	*/
	p._slaveDownTex = null;
	/**
	* [PIXI only] The texture for the disabled state of the button
	* @private
	* @property {PIXI.Texture} _slaveDisabledTex
	*/
	p._slaveDisabledTex = null;
	/**
	* [PIXI only] The texture for the selected state of the button
	* @private
	* @property {PIXI.Texture} _slaveSelectedTex
	*/
	p._slaveSelectedTex = null;
	/**
	* [PIXI only] The texture for the highlighted state of the button
	* @private
	* @property {PIXI.Texture} _slaveHighlightedTex
	*/
	p._slaveHighlightedTex = null;
	
	/*
	* The width of the button art, independent of the scaling of the button itself.
	* @private
	* @property {Number} _width
	*/
	p._width = 0;
	/*
	* The height of the button art, independent of the scaling of the button itself.
	* @private
	* @property {Number} _height
	*/
	p._height = 0;
	
	/** 
	* **[PIXI only]** Constructor for the button when using PIXI.
	* @method initialize
	* @constructor
	* @param  {Object} [imageSettings] Information about the art to be used for button states, as well as if the button is selectable or not.
	*	@param {PIXI.Texture} [imageSettings.up] The texture for the up state of the button.
	*	@param {PIXI.Texture} [imageSettings.over=null] The texture for the over state of the button. If omitted, uses the up state.
	*	@param {PIXI.Texture} [imageSettings.down=null] The texture for the down state of the button. If omitted, uses the up state.
	*	@param {PIXI.Texture} [imageSettings.disabled=null] The texture for the disabled state of the button. If omitted, uses the up state.
	*	@param {PIXI.Texture} [imageSettings.highlighted=null] The texture for the highlighted state of the button. If omitted, uses the over state.
	*	@param {PIXI.Texture} [imageSettings.selected=null] The texture for the selected state of the button. If omitted, the button is not a selectable button.
	*	@param {Number} [imageSettings.scale=1] The scale to use for the textures. This allows smaller art assets than the designed size to be used.
	* @param {Object} [label=null] Information about the text label on the button. Omitting this makes the button not use a label.
	*	@param {String} [label.type] If label.type is "bitmap", then a PIXI.BitmapText text is created, otherwise a PIXI.Text is created for the label.
	*	@param {String} [label.text] The text to display on the label.
	*	@param {Object} [label.style] The style of the text field, in the format that PIXI.BitmapText and PIXI.Text expect.
	* @param {Boolean} [enabled=true] Whether or not the button is initially enabled.
	*/
	p.initialize = function(imageSettings, label, enabled)
	{
		this.back = new PIXI.Sprite(imageSettings.up);
		this.addChild(this.back);
		
		this._overCB = this._onOver.bind(this);
		this._outCB = this._onOut.bind(this);
		this._downCB = this._onDown.bind(this);
		this._upCB = this._onUp.bind(this);
		this._upOutCB = this._onUpOutside.bind(this);
		
		this._upTex = imageSettings.up;
		this._overTex = imageSettings.over || this._upTex;
		this._downTex = imageSettings.down || this._upTex;
		this._disabledTex = imageSettings.disabled || this._upTex;
		this._highlightedTex = imageSettings.highlighted || this._overTex;
		if(imageSettings.selected)
		{
			this._isSelectable = true;
			this._selectedTex = imageSettings.selected;
		}
		if(imageSettings.slave && imageSettings.slaveSettings)
		{
			this._slave = imageSettings.slave;
			var slaveSettings = imageSettings.slaveSettings;
			this._slaveUpTex = slaveSettings.up;
			this._slaveOverTex = slaveSettings.over || this._slaveUpTex;
			this._slaveDownTex = slaveSettings.down || this._slaveUpTex;
			this._slaveDisabledTex = slaveSettings.disabled || this._slaveUpTex;
			this._slaveHighlightedTex = slaveSettings.highlighted || this._slaveOverTex;
			if(this._isSelectable)
				this._slaveSelectedTex = slaveSettings.selected || this._slaveUpTex;
		}
		if(imageSettings.scale)
		{
			var s = imageSettings.scale || 1;
			this.back.scale.x = this.back.scale.y = s;
			if(this._slave)
				this._slave.scale.x = this._slave.scale.x = s;
		}
		
		if(label)
		{
			this.label = label.type == "bitmap" ? new PIXI.BitmapText(label.text, label.style) : new PIXI.Text(label.text, label.style);
			this.addChild(this.label);
			this.label.position.x = (this.back.width - this.label.width) * 0.5;
			var h = this.label.height;
			this.label.position.y = (this.back.height - h) * 0.5 + h * 0.125;
		}
		
		this._width = this.back.width;
		this._height = this.back.height;
		
		this.enabled = enabled === undefined ? true : !!enabled;
	};
	
	/*
	*  The width of the button, based on the width of back. This value is affected by scale.
	*  @public
	*  @property {Number} width
	*/
	Object.defineProperty(p, "width", {
		get:function(){return this._width * this.scale.x;},
		set:function(value){
			this.scale.x = value / this._width;
		}
	});
	/*
	*  The height of the button, based on the height of back. This value is affected by scale.
	*  @public
	*  @property {Number} height
	*/
	Object.defineProperty(p, "height", {
		get:function(){return this._height * this.scale.y;},
		set:function(value){
			this.scale.y = value / this._height;
		}
	});
	
	/*
	*  Sets the text of the label. This does nothing if the button was not initialized with a label.
	*  @public
	*  @method setText
	*  @param {String} text The text to set the label to.
	*/
	p.setText = function(text)
	{
		if(this.label)
		{
			this.label.setText(text);
			this.label.forceUpdateText();
			this.label.position.x = (this.back.width - this.label.width) * 0.5;
			var h = this.label.height;
			this.label.position.y = (this.back.height - h) * 0.5 + h * 0.125;
		}
	};
	
	/*
	*  Whether or not the button is enabled.
	*  @public
	*  @property {Boolean} enabled
	*  @default true
	*/
	Object.defineProperty(p, "enabled", {
		get: function() { return this._enabled; },
		set: function(value)
		{
			this._enabled = value;
			this.buttonMode = value;
			this.interactive = value;
			
			//make sure interaction callbacks are properly set
			if(value)
			{
				this.mousedown = this.touchstart = this._downCB;
				this.mouseover = this._overCB;
				this.mouseout = this._outCB;
			}
			else
			{
				this.mousedown = this.touchstart = this.mouseover = this.mouseout = null;
				this.mouseup = this.touchend = this.mouseupoutside = this.touchendoutside = null;
				this._isDown = this._isOver = false;
				//also turn off pixi values so that re-enabling button works properly
				this.__isOver = false;
			}
			
			this._updateState();
		}
	});
	
	/*
	*  Whether or not the button is selected. Setting this only works if the button was given selected state when initialized.
	*  @public
	*  @property {Boolean} selected
	*  @default false
	*/
	Object.defineProperty(p, "selected", {
		get: function() { return this._isSelected; },
		set: function(value)
		{
			if(this._isSelectable)
			{
				this._isSelected = value;
				this._updateState();
			}
		}
	});
	
	/*
	*  Whether or not the button is highlighted. The default highlighted state is the over state, but a specific texture can be supplied.
	*  @public
	*  @property {Boolean} highlighted
	*  @default false
	*/
	Object.defineProperty(p, "highlighted", {
		get: function() { return this._isHighlighted; },
		set: function(value)
		{
			this._isHighlighted = value;
			this._updateState();
		}
	});
	
	/*
	*  Updates back based on the current button state.
	*  @private
	*  @method _updateState
	*/
	p._updateState = function()
	{
		if(!this.back) return;
		if(this._isHighlighted)
			this.back.setTexture(this._highlightedTex);
		else if(!this._enabled)
			this.back.setTexture(this._disabledTex);
		else if(this._isDown)
			this.back.setTexture(this._downTex);
		else if(this._isOver)
			this.back.setTexture(this._overTex);
		else if(this._isSelected)
			this.back.setTexture(this._selectedTex);
		else
			this.back.setTexture(this._upTex);
		if(this._slave)
		{
			if(this._isHighlighted)
				this._slave.setTexture(this._slaveHighlightedTex);
			else if(!this._enabled)
				this._slave.setTexture(this._slaveDisabledTex);
			else if(this._isDown)
				this._slave.setTexture(this._slaveDownTex);
			else if(this._isOver)
				this._slave.setTexture(this._slaveOverTex);
			else if(this._isSelected)
				this._slave.setTexture(this._slaveSelectedTex);
			else
				this._slave.setTexture(this._slaveUpTex);
		}
	};
	
	/**
	*  [PIXI only] The callback for when the button is moused over.
	*  @private
	*  @method _onOver
	*/
	p._onOver = function(data)
	{
		this._isOver = true;
		this._updateState();
		if(this.overCallback)
			this.overCallback(this);
	};
	
	/**
	*  [PIXI only] The callback for when the mouse leaves the button area.
	*  @private
	*  @method _onOut
	*/
	p._onOut = function(data)
	{
		this._isOver = false;
		this._updateState();
		if(this.outCallback)
			this.outCallback(this);
	};
	
	/**
	*  [PIXI only] The callback for when the button receives a mouse down event.
	*  @private
	*  @method _onDown
	*/
	p._onDown = function(data)
	{
		data.originalEvent.preventDefault();
		this._isDown = true;
		this._updateState();
		
		this.mouseup = this.touchend = this._upCB;
		this.mouseupoutside = this.touchendoutside = this._upOutCB;
	};
	
	/**
	*  [PIXI only] The callback for when the button for when the mouse/touch is released on the button
	*  - only when the button was held down initially.
	*  @private
	*  @method _onUp
	*/
	p._onUp = function(data)
	{
		data.originalEvent.preventDefault();
		this._isDown = false;
		this.mouseup = this.touchend = null;
		this.mouseupoutside = this.touchendoutside = null;
		
		this._updateState();
		if(this.releaseCallback)
			this.releaseCallback(this);
	};
	
	/**
	*  [PIXI only] The callback for when the mouse/touch is released outside the button when the button was held down.
	*  @private
	*  @method _onUpOutside
	*/
	p._onUpOutside = function(data)
	{
		this._isDown = false;
		this.mouseup = this.touchend = null;
		this.mouseupoutside = this.touchendoutside = null;
		
		this._updateState();
	};
	
	/*
	*  Destroys the button.
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		this.mousedown = this.touchstart = this.mouseover = this.mouseout = null;
		this.mouseup = this.touchend = this.mouseupoutside = this.touchendoutside = null;
		this.removeChildren(true);
		this._upTex = null;
		this._overTex = null;
		this._downTex = null;
		this._disabledTex = null;
		this._selectedTex = null;
		this._highlightedTex = null;
		this.label = null;
		this.back = null;
		this.releaseCallback = null;
		this.overCallback = null;
		this.outCallback = null;
		this._slave = null;
		this._slaveUpTex = null;
		this._slaveOverTex = null;
		this._slaveDownTex = null;
		this._slaveDisabledTex = null;
		this._slaveSelectedTex = null;
		this._slaveHighlightedTex = null;
	};
	
	namespace('cloudkid').Button = Button;
}());
(function() {
	
	/**
	*  [CreateJS only] Drag manager is responsible for handling the dragging of stage elements
	*  supports click-n-stick and click-n-drag functionality
	*  @class cloudkid.DragManager
	*/
	var DragManager = function(startCallback, endCallback)
	{
		this.initialize(startCallback, endCallback);
	};
	
	/** Reference to the drag manager */
	var p = DragManager.prototype = {};
		
	/**
	* The function call when finished dragging
	* @private
	* @property {function} _updateCallback 
	*/
	p._updateCallback = null;
	
	/**
	* The object that's being dragged
	* @public
	* @readOnly
	* @property {PIXI.DisplayObject} draggedObj
	*/
	p.draggedObj = null;
	
	/**
	* The local to global position of the drag
	* @private
	* @property {PIXI.Point} _dragOffset
	*/
	p._dragOffset = null;
	
	/**
	* The radius in pixel to allow for dragging, or else does sticky click
	* @public
	* @property dragStartThreshold
	* @default 20
	*/
	p.dragStartThreshold = 20;
	
	/**
	* The position x, y of the mouse down on the stage
	* @private
	* @property {PIXI.Point} mouseDownStagePos
	*/
	p.mouseDownStagePos = null;

	/**
	* The position x, y of the object when interaction with it started.
	* @private
	* @property {PIXI.Point} mouseDownObjPos
	*/
	p.mouseDownObjPos = null;
	
	/**
	* Is the move touch based
	* @public
	* @readOnly
	* @property {Bool} isTouchMove
	* @default false
	*/
	p.isTouchMove = false;
	
	/**
	* Is the drag being held on mouse down (not sticky clicking)
	* @public
	* @readOnly
	* @property {Bool} isHeldDrag
	* @default false
	*/
	p.isHeldDrag = false;
	
	/**
	* Is the drag a sticky clicking (click on a item, then mouse the mouse)
	* @public
	* @readOnly
	* @property {Bool} isStickyClick
	* @default false
	*/
	p.isStickyClick = false;
	
	/**
	* If sticky click dragging is allowed.
	* @public
	* @readOnly
	* @property {Bool} allowStickyClick
	* @default true
	*/
	p.allowStickyClick = true;
	
	/**
	* Reference to the stage
	* @private
	* @property {createjsStage} _theStage
	*/
	p._theStage = null;
	
	/**
	* Callback when we start dragging
	* @private
	* @property {Function} _dragStartCallback
	*/
	p._dragStartCallback = null;
	
	/**
	* Callback when we are done dragging
	* @private
	* @property {Function} _dragEndCallback
	*/
	p._dragEndCallback = null;
	
	/**
	* Callback when we are done dragging holding drag
	* @private
	* @property {Function} _triggerHeldDragCallback
	*/
	p._triggerHeldDragCallback = null;
	
	/**
	* Callback when we are done width sticky clicking
	* @private
	* @property {Function} _triggerStickyClickCallback
	*/
	p._triggerStickyClickCallback = null;
	
	/**
	* Callback when we are done width sticky clicking
	* @private
	* @property {Function} _stageMouseUpCallback
	*/
	p._stageMouseUpCallback = null;
	
	/**
	* The collection of draggable objects
	* @private
	* @property {Array} _draggableObjects
	*/
	p._draggableObjects = null;
	
	var helperPoint = null;
	
	var TYPE_MOUSE = 0;
	var TYPE_TOUCH = 1;
	
	/** 
	* Constructor 
	* @method initialize
	* @constructor
	* @param {function} startCallback The callback when when starting
	* @param {function} endCallback The callback when ending
	*/
	p.initialize = function(startCallback, endCallback)
	{
		this._updateCallback = this._updateObjPosition.bind(this);
		this._triggerHeldDragCallback = this._triggerHeldDrag.bind(this);
		this._triggerStickyClickCallback = this._triggerStickyClick.bind(this);
		this._stageMouseUpCallback = this._stopDrag.bind(this);
		this._theStage = cloudkid.OS.instance.stage;
		this._dragStartCallback = startCallback;
		this._dragEndCallback = endCallback;
		this._draggableObjects = [];
		this.mouseDownStagePos = new PIXI.Point(0, 0);
		this.mouseDownObjPos = new PIXI.Point(0, 0);
		helperPoint = new PIXI.Point(0, 0);
	};
	
	/**
	*	Manually starts dragging an object. If a mouse down event is not supplied as the second argument, it 
	*   defaults to a held drag, that ends as soon as the mouse is released.
	*  @method startDrag
	*  @public
	*  @param {PIXI.DisplayObject} object The object that should be dragged.
	*  @param {PIXI.InteractionData} interactionData The interaction data about the input event that triggered this.
	*/
	p.startDrag = function(object, interactionData)
	{
		this._objMouseDown(TYPE_MOUSE, object, interactionData);
	};
	
	/**
	* Mouse down on an obmect
	*  @method _objMouseDown
	*  @private
	*  @param {int} type The type of input that triggered this call - either TYPE_MOUSE or TYPE_TOUCH.
	*  @param {PIXI.DisplayObject} object The object that should be dragged.
	*/
	p._objMouseDown = function(type, obj, interactionData)
	{
		// if we are dragging something, then ignore any mouse downs
		// until we release the currently dragged stuff
		if(this.draggedObj !== null) return;

		this.draggedObj = obj;
		createjs.Tween.removeTweens(this.draggedObj);
		createjs.Tween.removeTweens(this.draggedObj.position);
		
		//get the mouse position and convert it to object parent space
		this._dragOffset = interactionData.getLocalPosition(this.draggedObj.parent);
		
		//move the offset to respect the object's current position
		this._dragOffset.x -= this.draggedObj.position.x;
		this._dragOffset.y -= this.draggedObj.position.y;

		this.mouseDownObjPos.x = this.draggedObj.position.x;
		this.mouseDownObjPos.y = this.draggedObj.position.y;
		
		this.mouseDownStagePos.x = interactionData.global.x;
		this.mouseDownStagePos.y = interactionData.global.y;
		if(!this.allowStickyClick || type == TYPE_TOUCH)//if it is a touch event, force it to be the held drag type
		{
			this.isTouchMove = type == TYPE_TOUCH;
			this.isHeldDrag = true;
			this._startDrag();
		}
		else//otherwise, wait for a movement or a mouse up in order to do a held drag or a sticky click drag
		{
			this.draggedObj.mousemove = this._triggerHeldDragCallback;
			this._theStage.interactionManager.stageUp = this._triggerStickyClickCallback;
		}
	};
	
	/**
	* Start the sticky click
	* @method _triggerStickyClick
	* @private
	*/
	p._triggerStickyClick = function()
	{
		this.isStickyClick = true;
		this.draggedObj.mousemove = null;
		this._theStage.interactionManager.stageUp = null;
		this._startDrag();
	};

	/**
	* Start hold dragging
	* @method _triggerHeldDrag
	* @private
	* @param {PIXI.InteractionData} interactionData The ineraction data about the moved mouse
	*/
	p._triggerHeldDrag = function(interactionData)
	{
		var xDiff = interactionData.global.x - this.mouseDownStagePos.x;
		var yDiff = interactionData.global.y - this.mouseDownStagePos.y;
		if(xDiff * xDiff + yDiff * yDiff >= this.dragStartThreshold * this.dragStartThreshold)
		{
			this.isHeldDrag = true;
			this.draggedObj.mousemove = null;
			this._theStage.interactionManager.stageUp = null;
			this._startDrag();
		}
	};

	/**
	* Internal start dragging on the stage
	* @method _startDrag
	* @private 
	*/
	p._startDrag = function()
	{
		var im = this._theStage.interactionManager;
		im.stageUp = this._stageMouseUpCallback;
		this.draggedObj.mousemove = this.draggedObj.touchmove = this._updateCallback;
		
		this._dragStartCallback(this.draggedObj);
	};
	
	/**
	* Stops dragging the currently dragged object.
	* @public
	* @method stopDrag
	* @param {Bool} doCallback If the drag end callback should be called. Default is false.
	*/
	p.stopDrag = function(doCallback)
	{
		this._stopDrag(null, doCallback === true);//pass true if it was explicitly passed to us, false and undefined -> false
	};

	/**
	* Internal stop dragging on the stage
	* @method _stopDrag
	* @private 
	* @param {createjs.MouseEvent} ev Mouse up event
	* @param {Bool} doCallback If we should do the callback
	*/
	p._stopDrag = function(origMouseEv, doCallback)
	{
		if(this.draggedObj)
			this.draggedObj.touchmove = this.draggedObj.mousemove = null;
		var im = this._theStage.interactionManager;
		im.stageUp = null;
		var obj = this.draggedObj;
		this.draggedObj = null;
		this.isTouchMove = false;
		this.isStickyClick = false;
		this.isHeldMove = false;

		if(doCallback !== false) // true or undefined
			this._dragEndCallback(obj);
	};

	/**
	* Update the object position based on the mouse
	* @method _updateObjPosition
	* @private
	* @param {PIXI.InteractionData} interactionData Mouse move event
	*/
	p._updateObjPosition = function(interactionData)
	{
		if(!this.isTouchMove && !this._theStage.interactionManager.mouseInStage) return;
		if(!this.draggedObj || !this.draggedObj.parent)//not quite sure what chain of events would lead to this, but we'll stop dragging to be safe
		{
			this._stopDrag(null, false);
			return;
		}
		
		var mousePos = interactionData.getLocalPosition(this.draggedObj.parent, helperPoint);
		var bounds = this.draggedObj._dragBounds;
		this.draggedObj.position.x = clamp(mousePos.x - this._dragOffset.x, bounds.x, bounds.right);
		this.draggedObj.position.y = clamp(mousePos.y - this._dragOffset.y, bounds.y, bounds.bottom);
	};
	
	/**
	* Simple clamp function
	*/
	var clamp = function(x,a,b)
	{
		return (x < a ? a : (x > b ? b : x));
	};
	
	//=== Giving functions and properties to draggable objects objects
	var enableDrag = function()
	{
		this.mousedown = this._onMouseDownListener;
		this.touchstart = this._onTouchStartListener;
		this.buttonMode = this.interactive = true;
	};
	
	var disableDrag = function()
	{
		this.mousedown = this.touchstart = null;
		this.buttonMode = this.interactive = false;
	};
	
	var _onMouseDown = function(type, mouseData)
	{
		this._dragMan._objMouseDown(type, this, mouseData);
	};
	
	/** 
	* Adds properties and functions to the object - use enableDrag() and disableDrag() on 
	* objects to enable/disable them (they start out disabled). Properties added to objects:
	* _dragBounds (Rectangle), _onMouseDownListener (Function), _dragMan (cloudkid.DragManager) reference to the DragManager
	* these will override any existing properties of the same name
	* @method addObject
	* @public
	* @param {createjs.DisplayObject} obj The display object
	* @param {createjs.Rectangle} bound The rectangle bounds
	*/
	p.addObject = function(obj, bounds)
	{
		if(!bounds)
		{
			var canvas = cloudkid.OS.instance._renderer.view;
			bounds = {x:0, y:0, width:canvas.width, height:canvas.height};
		}
		bounds.right = bounds.x + bounds.width;
		bounds.bottom = bounds.y + bounds.height;
		obj._dragBounds = bounds;
		if(this._draggableObjects.indexOf(obj) >= 0)
		{
			//don't change any of the functions or anything, just quit the function after having updated the bounds
			return;
		}
		obj.enableDrag = enableDrag;
		obj.disableDrag = disableDrag;
		obj._onMouseDownListener = _onMouseDown.bind(obj, TYPE_MOUSE);
		obj._onTouchStartListener = _onMouseDown.bind(obj, TYPE_TOUCH);
		obj._dragMan = this;
		this._draggableObjects.push(obj);
	};
	
	/** 
	* Removes properties and functions added by addObject().
	* @public
	* @method removeObject
	* @param {createjs.DisplayObject} obj The display object
	*/
	p.removeObject = function(obj)
	{
		var index = this._draggableObjects.indexOf(obj);
		if(index >= 0)
		{
			obj.disableDrag();
			delete obj.enableDrag;
			delete obj.disableDrag;
			delete obj._onMouseDownListener;
			delete obj._onTouchStartListener;
			delete obj._dragMan;
			delete obj._dragBounds;
			this._draggableObjects.splice(index, 1);
		}
	};
	
	/**
	*  Destroy the manager
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		if(this.draggedObj !== null)
		{
			//clean up dragged obj
			this._stopDrag(null, false);
		}
		this._updateCallback = null;
		this._dragStartCallback = null;
		this._dragEndCallback = null;
		this._triggerHeldDragCallback = null;
		this._triggerStickyClickCallback = null;
		this._stageMouseUpCallback = null;
		this._theStage = null;
		for(var i = this._draggableObjects.length - 1; i >= 0; --i)
		{
			var obj = this._draggableObjects[i];
			obj.disableDrag();
			delete obj.enableDrag;
			delete obj.disableDrag;
			delete obj._onMouseDownListener;
			delete obj._dragMan;
			delete obj._dragBounds;
		}
		this._draggableObjects = null;
	};
	
	/** Assign to the global namespace */
	namespace('cloudkid').DragManager = DragManager;
}());
(function() {
	
	/**
	* [PIXI Only] Animator for interacting with Spine animations
	* @class cloudkid.PixiAnimator
	* @constructor
	*/
	var PixiAnimator = function()
	{
		this._timelines = [];
		this._boundUpdate = this._update.bind(this);
	};
	
	var p = PixiAnimator.prototype = {};
	
	/**
	* A reference to this instance of PixiAnimator. This is internal to PixiAnimator and can't be accessed externally.
	* @property {cloudkid.PixiAnimator} _instance
	* @private
	* @static
	*/
	var _instance = null;
	
	/**
	* The collection of AnimTimelines that are playing
	* @property {Array} _timelines
	* @private
	*/
	p._timelines = null;
	
	/**
	* The number of animations
	* @property {int} _numAnims
	* @private
	*/
	p._numAnims = 0;
	
	/**
	* A string reference to PixiAnimator's update callback
	* so it can be removed in the event that there are no
	* animations to play
	* @property {String} _updateAlias
	* @private
	*/
	p._updateAlias = "animator";
	
	/**
	* The function that PixiAnimator uses for update calls. Do not modify.
	* @property {function} _boundUpdate
	* @private
	*/
	p._boundUpdate = null;
	
	/**
	 * Stored collection of AnimTimelines. This is internal to PixiAnimator and can't be accessed externally.
	 * @property {Array} _animPool
	 * @private
	 * @static
	 */
	var _animPool = null;
	
	/**
	 * Initializes the singleton instance of PixiAnimator.
	 * @method init
	 * @static
	 */
	PixiAnimator.init = function()
	{
		_instance = new PixiAnimator();
		_animPool = [];
	};
	
	/**
	* Getter for the reference to this instance of PixiAnimator
	* @property instance
	* @type cloudkid.PixiAnimator
	* @readOnly
	* @static
	*/
	Object.defineProperty(PixiAnimator, "instance",
	{
		get: function() { return _instance; }
	});
	
	/**
	 * Play a specified animation
	 * 
	 * @function play
	 * @param {PIXI.MovieClip|PIXI.Spine} clip The clip to play
	 * @param {String} anim The alias for the animation to play
	 * @param {function} callback The function to call once the animation has finished
	 * @param {bool} loop Whether the animation should loop
	 * @param {int} speed The speed at which to play the animation
	 * @param {int} startTime The time in milliseconds into the animation to start.
	 */
	p.play = function(clip, anim, callback, loop, speed, startTime, soundData)
	{
		if(clip === null || (!(clip instanceof PIXI.Spine) && !(clip.updateAnim/*clip instanceof PIXI.MovieClip*/)))
		{
			if(callback)
				callback();
			return;
		}
		
		this.stop(clip);
		loop = loop || false;
		startTime = startTime ? startTime * 0.001 : 0;//convert into seconds, as that is what the time uses internally
		
		var t = _animPool.length ? _animPool.pop().init(clip, callback || null, speed || 1) : new AnimTimeline(clip, callback || null, speed || 1);
		if(t.isSpine)//PIXI.Spine
		{
			var i;
			
			if(typeof anim == "string")//allow the animations to be a string, or an array of strings
			{
				if(!checkSpineForAnimation(clip, anim))
				{
					this._repool(t);
					if(callback)
						callback();
					return;
				}
				clip.state.setAnimationByName(anim, loop);
				clip.updateAnim(startTime > 0 ? startTime * t.speed : 0);
			}
			else//Array - either animations in order or animations at the same time
			{
				if(typeof anim[0] == "string")//array of Strings, play animations by name in order
				{
					clip.state.setAnimationByName(anim[0], false);
					for(i = 1; i < anim.length; ++i)
					{
						clip.state.addAnimationByName(anim[i], loop && i == anim.length - 1);
					}
					clip.updateAnim(startTime > 0 ? startTime * t.speed : 0);
				}
				else//array of objects - play different animations at the same time
				{
					t.spineStates = new Array(anim.length);
					t.speed = new Array(anim.length);
					for(i = 0; i < anim.length; ++i)
					{
						var s = new PIXI.spine.AnimationState(clip.stateData);
						t.spineStates[i] = s;
						s.setAnimationByName(anim[i].anim, loop || anim[i].loop);
						if(anim[i].speed)
							t.speed[i] = anim[i].speed;
						else
							t.speed[i] = speed || 1;
						if(startTime > 0)
							s.update(startTime * t.speed[i]);
						s.apply(clip.skeleton);
					}
				}
			}
		}
		else//standard PIXI.MovieClip
		{
			if(anim && anim instanceof Array)
			{
				clip.textures = anim;
				clip.updateDuration();
			}
			clip.loop = loop;
			clip.onComplete = this._onMovieClipDone.bind(this, t);
			clip.gotoAndPlay(0);
			if(startTime > 0)
				clip.update(startTime * t.speed);
		}
		if(soundData)
		{
			t.playSound = true;
			t.soundStart = soundData.start;//seconds
			t.soundAlias = soundData.alias;
			if(t.soundStart === 0)
			{
				t.soundInst = cloudkid.Sound.instance.play(t.soundAlias, undefined, 
					undefined, undefined, undefined, undefined, undefined, 
					onSoundDone.bind(this, t), onSoundStarted.bind(this, t));
			}
			else
				cloudkid.Sound.instance.preloadSound(soundData.alias);
		}
		t.loop = loop;
		t.time = startTime > 0 ? startTime : 0;
		this._timelines.push(t);
		if(++this._numAnims == 1)
			cloudkid.OS.instance.addUpdateCallback(this._updateAlias, this._boundUpdate);
		return t;
	};
	
	/**
	 * Checks to see if a spine includes a given animation alias
	 * 
	 * @function checkSpineForAnimation
	 * @param {PIXI.spine} clip The spine to search
	 * @param {String} anim The animation alias to search
	 * @returns {Boolean} Returns true if the animation is found
	 */
	var checkSpineForAnimation = function(clip, anim)
	{
		return clip.stateData.skeletonData.findAnimation(anim) !== null;
	};
	
	/**
	 * Stop a clip
	 * 
	 * @function stop
	 * @param {PIXI.MovieClip|PIXI.Spine} clip The clip to stop
	 * @param {bool} doCallback Whether the animations callback should be run
	 */
	p.stop = function(clip, doCallback)
	{
		for(var i = 0; i < this._numAnims; ++i)
		{
			if(this._timelines[i].clip === clip)
			{
				var t = this._timelines[i];
				this._timelines.splice(i, 1);
				if(--this._numAnims === 0)
					cloudkid.OS.instance.removeUpdateCallback(this._updateAlias);
				if(doCallback && t.callback)
					t.callback();
				if(t.soundInst)
					t.soundInst.stop();
				this._repool(t);
				break;
			}
		}
	};
	
	/**
	 * Stops all current animations
	 * 
	 * @function stop
	 */
	p.stopAll = function()
	{
		for(var i = 0; i < this._numAnims; ++i)
		{
				var t = this._timelines[i];
				if(t.soundInst)
					t.soundInst.stop();
				this._repool(t);
				break;
		}		
		cloudkid.OS.instance.removeUpdateCallback(this._updateAlias);
		this._timelines.length = this._numAnims = 0;
	};
	
	/**
	 * Put an AnimTimeline back into the general pool after it's done playing
	 * or has been manually stopped
	 * 
	 * @function _repool
	 * @param {cloudkid.PixiAnimator.AnimTimeline} timeline
	 * @private
	 */
	p._repool = function(timeline)
	{
		timeline.clip = null;
		timeline.callback = null;
		timeline.loop = false;
		timeline.spineStates = null;
		timeline.speed = null;
		timeline.soundInst = null;
		_animPool.push(timeline);
	};
	
	/**
	 * Update each frame
	 * 
	 * @function _update
	 * @param {int} elapsed The time since the last frame
	 * @private
	 */
	p._update = function(elapsed)
	{
		var delta = elapsed * 0.001;//ms -> sec
		
		for(var i = this._numAnims - 1; i >= 0; --i)
		{
			var t = this._timelines[i];
			var prevTime = t.time;
			if(t.soundInst)
			{
				t.time = t.soundStart + t.soundInst.position * 0.001;//convert sound position ms -> sec
			}
			else
			{
				t.time += delta;
				if(t.playSound && t.time >= t.soundStart)
				{
					t.time = t.soundStart;
					t.soundInst = cloudkid.Sound.instance.play(t.soundAlias, undefined, 
						undefined, undefined, undefined, undefined, undefined, 
						onSoundDone.bind(this, t), onSoundStarted.bind(this, t));
				}
			}
			var c = t.clip;
			if(t.isSpine)//PIXI.Spine
			{
				if(t.spineStates)
				{
					var complete = false;
					for(var j = 0, len = t.spineStates.length; j < len; ++j)
					{
						var s = t.spineStates[j];
						s.update((t.time - prevTime) * t.speed[j]);
						s.apply(c.skeleton);
						if(!s.currentLoop && s.isComplete())
							complete = true;
					}
					if(complete)
					{
						this._timelines.splice(i, 1);
						this._numAnims--;
						if(t.callback)
							t.callback();
						this._repool(t);
					}
				}
				else
				{
					c.updateAnim((t.time - prevTime) * t.speed);
					var state = c.state;
					if(!state.currentLoop && state.queue.length === 0 && state.currentTime >= state.current.duration)
					{
						this._timelines.splice(i, 1);
						this._numAnims--;
						if(t.callback)
							t.callback();
						this._repool(t);
					}
				}
			}
			else//standard PIXI.MovieClip
			{
				c.updateAnim((t.time - prevTime) * t.speed);
			}
		}
		if(this._numAnims === 0)
			cloudkid.OS.instance.removeUpdateCallback(this._updateAlias);
	};
	
	var onSoundStarted = function(timeline)
	{
		timeline.playSound = false;
		timeline.soundEnd = timeline.soundStart + timeline.soundInst.length * 0.001;//convert sound length to seconds
	};
	
	var onSoundDone = function(timeline)
	{
		timeline.time = timeline.soundEnd || timeline.soundStart;//in case the sound goes wrong, 
		timeline.soundInst = null;
	};
	
	/**
	 * Called when a movie clip is done playing, calls the AnimTimeline's
	 * callback if it has one
	 * 
	 * @function _onMovieClipDone
	 * @param {cloudkid.PixiAnimator.AnimTimeline} timeline
	 * @private
	 */
	p._onMovieClipDone = function(timeline)
	{
		for(var i = 0; i < this._numAnims; ++i)
		{
			if(this._timelines[i] === timeline)
			{
				var t = this._timelines[i];
				t.clip.onComplete = null;
				this._timelines.splice(i, 1);
				if(--this._numAnims === 0)
					cloudkid.OS.instance.removeUpdateCallback(this._updateAlias);
				if(t.callback)
					t.callback();
				this._repool(t);
				break;
			}
		}
	};
	
	/**
	 * Destroy this
	 * 
	 * @function destroy
	 */
	p.destroy = function()
	{
		_instance = null;
		_animPool = null;
		this._timelines = null;
		cloudkid.OS.instance.removeUpdateCallback(this._updateAlias);
		this._boundUpdate = null;
	};
	
	/**
	 * [Pixi Only] Internal PixiAnimator class for keeping track of animations
	 * 
	 * @class cloudkid.PixiAnimator.AnimTimeline
	 * @constructor
	 * @param {PIXI.MovieClip|Pixi.Spine} clip The AnimTimeline's clip
	 * @param {function} callback The function to call when the clip is finished playing
	 * @param {int} speed The speed at which the clip should be played
	 */
	var AnimTimeline = function(clip, callback, speed)
	{
		this.init(clip, callback, speed);
	};
	
	AnimTimeline.constructor = AnimTimeline;
	
	/**
	 * Initialize the AnimTimeline
	 * 
	 * @function init
	 * @param {PIXI.MovieClip|Pixi.Spine} clip The AnimTimeline's clip
	 * @param {function} callback The function to call when the clip is finished playing
	 * @param {int} speed The speed at which the clip should be played
	 * @returns {cloudkid.PixiAnimator.AnimTimeline}
	 */
	AnimTimeline.prototype.init = function(clip, callback, speed)
	{
		/**
		 * The clip for this AnimTimeLine
		 * @property {PIXI.MovieClip|PIXI.Spine} clip
		 */
		this.clip = clip;
		/**
		 * Whether the clip is a PIXI.Spine
		 * @property {bool} isSpine
		 */
		this.isSpine = clip instanceof PIXI.Spine;
		/**
		 * The function to call when the clip is finished playing
		 * @property {function} callback
		 */
		this.callback = callback;
		/**
		 * The speed at which the clip should be played
		 * @property {int} speed
		 */
		this.speed = speed;
		/**
		 * @property {Array} spineStates
		 */
		this.spineStates = null;
		/**
		 * Not used by PixiAnimator, but potentially useful for other code to keep track of what type of animation is being played
		 * @property {bool} loop
		 */
		this.loop = null;
		/**
		 * @property {number} The position of the animation in seconds
		 */
		this.time = 0;
		/** @property {string} Sound alias to sync to during the animation. */
		this.soundAlias = null;
		/**
		 * @property {Object} A sound instance object from cloudkid.Sound, used for tracking sound position.
		 */
		this.soundInst = null;
		/** @property {bool} If the timeline will, but has yet to, play a sound */
		this.playSound = false;
		/** @property {number} The time (seconds) into the animation that the sound starts */
		this.soundStart = 0;
		/** @property {number} The time (seconds) into the animation that the sound ends */
		this.soundEnd = 0;
		return this;
	};
	
	namespace('cloudkid').PixiAnimator = PixiAnimator;
}());
(function() {
	
	var Positioner = function()
	{
	};
	
	Positioner.prototype = {};
	
	Positioner.positionItems = function(parent, itemSettings)
	{
		var rot, pt, degToRad;
		if(true)
			degToRad = Math.PI / 180;
		for(var iName in itemSettings)
		{
			var item = parent[iName];
			if(!item)
			{
				Debug.error("could not find object '" +  iName + "'");
				continue;
			}
			var setting = itemSettings[iName];
			if(true)
			{
				item.position.x = setting.x;
				item.position.y = setting.y;
				pt = setting.scale;
				if(pt)
				{
					item.scale.x *= pt.x;
					item.scale.y *= pt.y;
				}
				pt = setting.pivot;
				if(pt)
				{
					item.pivot.x = pt.x;
					item.pivot.y = pt.y;
				}
				rot = setting.rotation;
				if(rot)
					item.rotation = rot * degToRad;
			}
			else
			{
				item.x = setting.x;
				item.y = setting.y;
				pt = setting.scale;
				if(pt)
				{
					item.scaleX *= pt.x;
					item.scaleY *= pt.y;
				}
				pt = setting.pivot;
				if(pt)
				{
					item.regX = pt.x;
					item.regY = pt.y;
				}
				rot = setting.rotation;
				if(rot)
					item.rotation = rot;
			}
			//item.name = iName;
			if(setting.hitArea)
			{
				var hitArea = setting.hitArea;
				if(true)
				{
					item.hitArea = Positioner.generateHitArea(hitArea);
				}
				else
				{
					if(hitArea.type == "rect")
						item.hitRect = new createjs.Rectangle(hitArea.x, hitArea.y, hitArea.w, hitArea.h);
				}
			}
		}
	};
	
	if(true)
	{
		Positioner.generateHitArea = function(hitArea, scale)
		{
			if(!scale)
				scale = 1;
			if(isArray(hitArea))
			{
				if(scale == 1)
					return new PIXI.Polygon(hitArea);
				else
				{
					var temp = [];
					for(var i = 0, len = hitArea.length; i < len; ++i)
					{
						temp.push(new PIXI.Point(hitArea[i].x * scale, hitArea[i].y * scale));
					}
					return new PIXI.Polygon(temp);
				}
			}
			else if(hitArea.type == "rect" || !hitArea.type)
				return new PIXI.Rectangle(hitArea.x * scale, hitArea.y * scale, hitArea.w * scale, hitArea.h * scale);
			else if(hitArea.type == "ellipse")
				return new PIXI.Ellipse((hitArea.x - hitArea.w * 0.5) * scale, (hitArea.y - hitArea.h * 0.5) * scale, hitArea.w * scale, hitArea.h * scale);//convert center to upper left corner
			else if(hitArea.type == "circle")
				return new PIXI.Circle(hitArea.x * scale, hitArea.y * scale, hitArea.r * scale);//x & y are center, pixi documentation lies
			return null;
		};
	}

	var isArray = function(o)
	{
		return Object.prototype.toString.call(o) === '[object Array]';
	};
	
	namespace('cloudkid').Positioner = Positioner;
}());
(function() {
	
	/**
	*   Object that contains the screen settings to help scaling
	*   @param The screen width in pixels
	*   @param The screen height in pixels
	*   @param The screen pixel density (PPI)
	*/
	var ScreenSettings = function(w, h, p)
	{
		this.width = w;
		this.height = h;
		this.ppi = p;
	};
	
	ScreenSettings.prototype = {};
	
	namespace('cloudkid').ScreenSettings = ScreenSettings;
}());
(function() {
	/**
	*  A single UI item that needs to be resized
	*/
	/**
	*   Create the UI Item
	*	@param The item to affect  
	*   @param The scale settings
	*	@param The original screen the item was designed for
	*/
	var UIElement = function(item, settings, designedScreen)
	{
		this._item = item;			
		this._settings = settings;
		this._designedScreen = designedScreen;
		
		if(true)
		{
			this.origScaleX = item.scale.x;
			this.origScaleY = item.scale.y;
		}
		else
		{
			this.origScaleX = item.scaleX;
			this.origScaleY = item.scaleY;
		}
		this.origWidth = item.width;

		//this.origBounds = item.getBounds(item);
		this.origBounds = {x:0, y:0, width:item.width, height:item.height};
		this.origBounds.right = this.origBounds.x + this.origBounds.width;
		this.origBounds.bottom = this.origBounds.y + this.origBounds.height;
		
		var UIScaler = cloudkid.UIScaler;
		switch(settings.vertAlign)
		{
			case UIScaler.ALIGN_TOP:
			{
				if(true)
					this.origMarginVert = item.position.y + this.origBounds.y;
				else
					this.origMarginVert = item.y + this.origBounds.y;
				break;
			}
			case UIScaler.ALIGN_CENTER:
			{
				if(true)
					this.origMarginVert = designedScreen.height * 0.5 - item.position.y;
				else
					this.origMarginVert = designedScreen.height * 0.5 - item.y;
				break;
			}
			case UIScaler.ALIGN_BOTTOM:
			{
				if(true)
					this.origMarginVert = designedScreen.height - (item.position.y + this.origBounds.bottom);
				else
					this.origMarginVert = designedScreen.height - (item.y + this.origBounds.bottom);
				break;
			}
		}

		switch(settings.horiAlign)
		{
			case UIScaler.ALIGN_LEFT:
			{
				if(true)
					this.origMarginHori = item.position.x + this.origBounds.x;
				else
					this.origMarginHori = item.x + this.origBounds.x;
				break;
			}
			case UIScaler.ALIGN_CENTER:
			{
				if(true)
					this.origMarginHori = designedScreen.width * 0.5 - item.position.x;
				else
					this.origMarginHori = designedScreen.width * 0.5 - item.x;
				break;
			}
			case UIScaler.ALIGN_RIGHT:
			{
				if(true)
					this.origMarginHori = designedScreen.width - (item.position.x + this.origBounds.right);
				else
					this.origMarginHori = designedScreen.width - (item.x + this.origBounds.right);
				break;
			}
		}
		
		//Debug.log("setup for " + item.name + ": " + item.position.x + ", " + item.position.y + "; margin: " + this.origMarginHori + ", " + this.origMarginVert);
		//Debug.log("bottom: " + this.origBounds.bottom + ", height: " + this.origBounds.height);
	};
	
	var p = UIElement.prototype = {};
		
	/** Original horizontal margin in pixels */
	p.origMarginHori = 0;

	/** Original vertical margin in pixels */
	p.origMarginVert = 0;

	/** Original width in pixels */
	p.origWidth = 0;

	/** The original scale of the item. */
	p.origScaleX = 0;

	/** The original scale of the item. */
	p.origScaleY = 0;

	/** Used to determine the distance to each edge of the item from its origin */
	p.origBounds = null;

	/** The UI Item settings */
	p._settings = null;
	
	/** The UI Item */
	p._item = null;
	
	/** The screen that the UI element was designed for */
	p._designedScreen = null;
	
	/**
	*   Adjust the item scale and position, to reflect new screen
	*   @param The current screen settings
	*/
	p.resize = function(newScreen)
	{
		var overallScale = newScreen.height / this._designedScreen.height;
		var ppiScale = newScreen.ppi / this._designedScreen.ppi;
		var letterBoxWidth = (newScreen.width - this._designedScreen.width * overallScale) / 2;

		// Scale item to the overallScale to match rest of the app, 
		// then clamp its physical size as specified 
		// then set the item's scale to be correct - the screen is not scaled

		//Full math:
		/*var physicalScale:Number = overallScale / ppiScale;
		var itemScale:Number = MathUtils.clamp(physicalScale, minScale, maxScale) / physicalScale * overallScale;*/

		//Optimized math:
		var itemScale = overallScale / ppiScale;
		if(this._settings.minScale && itemScale < this._settings.minScale)
			itemScale = this._settings.minScale;
		else if(this._settings.maxScale && itemScale > this._settings.maxScale)
			itemScale = this._settings.maxScale;
		itemScale *= ppiScale;

		if(true)
		{
			this._item.scale.x = this.origScaleX * itemScale;
			this._item.scale.y = this.origScaleY * itemScale;
		}
		else
		{
			this._item.scaleX = this.origScaleX * itemScale;
			this._item.scaleY = this.origScaleY * itemScale;
		}

		// positioning
		var m;

		// vertical move
		m = this.origMarginVert * overallScale;
		
		var UIScaler = cloudkid.UIScaler;
		switch(this._settings.vertAlign)
		{
			case UIScaler.ALIGN_TOP:
			{
				if(true)
					this._item.position.y = m - this.origBounds.y * itemScale;
				else
					this._item.y = m - this.origBounds.y * itemScale;
				break;
			}
			case UIScaler.ALIGN_CENTER:
			{
				if(true)
					this._item.position.y = newScreen.height * 0.5 - m;
				else
					this._item.y = newScreen.height * 0.5 - m;
				break;
			}
			case UIScaler.ALIGN_BOTTOM:
			{
				if(true)
					this._item.position.y = newScreen.height - m - this.origBounds.bottom * itemScale;
				else
					this._item.y = newScreen.height - m - this.origBounds.bottom * itemScale;
				break;
			}
		}

		// horizontal move
		m = this.origMarginHori * overallScale;
		
		switch(this._settings.horiAlign)
		{
			case UIScaler.ALIGN_LEFT:
			{
				if(this._settings.titleSafe)
				{
					if(true)
						this._item.position.x = letterBoxWidth + m - this.origBounds.x * itemScale;
					else
						this._item.x = letterBoxWidth + m - this.origBounds.x * itemScale;
				}
				else
				{
					if(true)
						this._item.position.x = m - this.origBounds.x * itemScale;
					else
						this._item.x = m - this.origBounds.x * itemScale;
				}
				break;
			}
			case UIScaler.ALIGN_CENTER:
			{
				if(this._settings.centeredHorizontally)
				{
					if(true)
						this._item.position.x = (newScreen.width - this._item.width) * 0.5;
					else
						this._item.x = (newScreen.width - this._item.width) * 0.5;
				}
				else
				{
					if(true)
						this._item.position.x = newScreen.width * 0.5 - m;
					else
						this._item.x = newScreen.width * 0.5 - m;
				}
				break;
			}	
			case UIScaler.ALIGN_RIGHT:
			{
				if(this._settings.titleSafe)
				{
					if(true)
						this._item.position.x = newScreen.width - letterBoxWidth - m - this.origBounds.right * itemScale;
					else
						this._item.x = newScreen.width - letterBoxWidth - m - this.origBounds.right * itemScale;
				}
				else
				{
					if(true)
						this._item.position.x = newScreen.width - m - this.origBounds.right * itemScale;
					else
						this._item.x = newScreen.width - m - this.origBounds.right * itemScale;
				}
				break;
			}		
		}
	};
	
	/**
	*   Destroy this item, don't use after this
	*/
	p.destroy = function()
	{
		this._item = null;
		this._settings = null;
		this._designedScreen = null;
	};
	
	namespace('cloudkid').UIElement = UIElement;
}());
(function() {
	
	/**
	*  The UI Item Settings
	*/
	var UIElementSettings = function(){};
	
	var p = UIElementSettings.prototype = {};
	
	/** What vertical screen location the item should be aligned to */
	p.vertAlign = null;
	/** What horizontal screen location the item should be aligned to */
	p.horiAlign = null;
	/** If this element should be aligned to the title safe area, not the actual screen */
	p.titleSafe = false;
	/** Maximum scale allowed in physical size */
	p.maxScale = 1;
	/** Minimum scale allowed in physical size */
	p.minScale = 1;
	
	p.centeredHorizontally = false;
	
	namespace('cloudkid').UIElementSettings = UIElementSettings;
}());
(function() {
	
	/**
	*   The UI scale is responsible for scaling UI components
	*   to help easy the burden of different device aspect ratios
	*   @author Andrew Start <andrewstart@cloudkid.com>
	*   @author Matt Moore <matt@cloudkid.com>
	*/
	
	/**
	*  Create the scaler
	*  @param The UI display container
	*  @param The designed width of the UI
	*  @param The designed height of the UI
	*  @param The designed PPI of the UI
	*/
	var UIScaler = function(parent, designedWidth, designedHeight, designedPPI)
	{
		this._parent = parent;
		this._items = [];
		this._designedScreen = new cloudkid.ScreenSettings(designedWidth, designedHeight, designedPPI);
	};
	
	var p = UIScaler.prototype = {};
				
	/** The current screen settings */
	UIScaler._currentScreen = new cloudkid.ScreenSettings(0, 0, 0);
	
	/** if the screensize has been set */
	UIScaler._initialized = false;
	
	/** The UI display object to update */
	p._parent = null;
	
	/** The screen settings object, contains information about designed size */
	p._designedScreen = null;
	
	/** The configuration for each items */
	p._items = null;
	
	/** Different scale alignments */
	UIScaler.ALIGN_TOP = "top";
	UIScaler.ALIGN_BOTTOM = "bottom";
	UIScaler.ALIGN_LEFT = "left";
	UIScaler.ALIGN_RIGHT = "right";
	UIScaler.ALIGN_CENTER = "center";
	
	/**
	*  Create the scaler from JSON data
	*  @param The UI display container
	*  @param The json of the designed settings (designedWidth, designedHeight, designedPPI keys)
	*  @param The json items object
	*  @param If we should immediately cleanup the UIScaler after scaling items (default is true)
	*  @param Return the UIScaler object
	*/
	UIScaler.fromJSON = function(parent, jsonSettings, jsonItems, immediateDestroy)
	{
		if(typeof immediateDestroy != "boolean") immediateDestroy = true;
			
		var scaler = new UIScaler(
			parent, 
			jsonSettings.designedWidth,
			jsonSettings.designedHeight,
			jsonSettings.designedPPI
		);
		
		// Temp variables
		var item, i, align, vertAlign, horiAlign;
		
		// Loop through all the items and register
		// each dpending on the settings
		for(i in jsonItems)
		{
			item = jsonItems[i];
			
			if (item.align)
			{
				align = item.align.split("-");
				vertAlign = align[0];
				horiAlign = align[1];
			}
			else
			{
				vertAlign = ALIGN_CENTER;
				horiAlign = ALIGN_CENTER;
			}
			scaler.add(
				parent[i], 
				vertAlign,
				horiAlign,
				item.titleSafe || false,
				item.minScale || NaN,
				item.maxScale || NaN,
				item.centeredHorizontally || false
			);
		}
		
		// Scale the items
		scaler.resize();
		
		if (immediateDestroy)
		{
			scaler.destroy();
		}
		return scaler;
	};
	
	/**
	*   Set the current screen settings. If the stagesize changes at all, re-call this function
	*   @param The fullscreen width
	*   @param The fullscreen height
	*   @param The screen resolution density
	*/
	UIScaler.init = function(screenWidth, screenHeight, screenPPI)
	{
		UIScaler._currentScreen.width = screenWidth;
		UIScaler._currentScreen.height = screenHeight;
		UIScaler._currentScreen.ppi = screenPPI;
		UIScaler._initialized = true;
	};

	p.getScale = function()
	{
		return UIScaler._currentScreen.height / this._designedScreen.height;
	};
	
	/**
	*   Manually add an item 
	*   @param The display object item to add
	*   @param The vertical align of the item (cefault is center)
	*   @param The horizontal align of the item (default is center)
	*   @param If the item needs to be in the title safe area (default is false)
	*   @param The minimum scale amount (default, scales the same size as the stage)
	*   @param The maximum scale amount (default, scales the same size as the stage)
	*/
	p.add = function(item, vertAlign, horiAlign, titleSafe, minScale, maxScale, centeredHorizontally)
	{
		if(!vertAlign)
			vertAlign = UIScaler.ALIGN_CENTER;
		if(!horiAlign)
			horiAlign = UIScaler.ALIGN_CENTER;
		if(typeof titleSafe != "boolean")
			titleSafe = false;
		if(typeof minScale != "number")
			minScale = NaN;
		if(typeof maxScale != "number")
			maxScale = NaN;
		// Create the item settings
		var s = new cloudkid.UIElementSettings();
			s.vertAlign = vertAlign;
			s.horiAlign = horiAlign;
			s.titleSafe = titleSafe;
			s.maxScale = maxScale;
			s.minScale = minScale;
			s.centeredHorizontally = centeredHorizontally;
				
		this._items.push(new cloudkid.UIElement(item, s, this._designedScreen));
	};
	
	/**
	*   Scale a single background image according to the UIScaler.width and height
	*   @param The bitmap to scale
	*/
	UIScaler.resizeBackground = function(b)
	{
		if(!UIScaler._initialized) return;
		
		var h = b.height / b.scale.y;
		var w = b.width / b.scale.x;
		//scale the background
		var scale = UIScaler._currentScreen.height / h;
		b.scale.x = b.scale.y = scale;
		
		//center the background
		b.position.x = (UIScaler._currentScreen.width - b.width) * 0.5;
	};
	
	/**
	*   Convenience function to scale a collection of backgrounds
	*   @param The vector of bitmap images
	*/
	UIScaler.resizeBackgrounds = function(bs)
	{
		for(var i = 0, len = bs.length; i < len; ++i)
		{
			resizeBackground(bs[i]);
		}
	};
	
	/**
	*   Scale the UI items that have been registered
	*/
	p.resize = function()
	{
		if (this._items.length > 0)
		{
			for(var i = 0, len = this._items.length; i < len; ++i)
			{
				this._items[i].resize(UIScaler._currentScreen);
			}
		}
	};
	
	/**
	*   Destroy the scaler object
	*/
	p.destroy = function()
	{
		if (this._items.length > 0)
		{
			for(var i = 0, len = this._items.length; i < len; ++i)
			{
				this._items[i].destroy();
			}
		}
		
		this._parent = null;
		this._designedScreen = null;
		this._items = null;
	};
	
	namespace('cloudkid').UIScaler = UIScaler;
}());
(function() {
	
	/**
	*  The UI Item Settings
	*/
	var AssetManager = function(){};
	
	var p = AssetManager.prototype = {};
	
	/** Dictionary of assets by asset id */
	AssetManager._assets = null;
	AssetManager._assetUrlCache = null;
	/** Dictionary of scales by asset id */
	AssetManager.scales = null;
	AssetManager._sizes = null;
	/** The scaling value for each asset size id */
	AssetManager._scales = null;
	AssetManager._paths = null;
	AssetManager._sizeOrder = null;
	AssetManager.lowHW = false;
	
	AssetManager.init = function(config, width, height)
	{
		AssetManager.scales = {};
		AssetManager._assets = config.assets;
		AssetManager._assetUrlCache = {};
		AssetManager._paths = config.path;
		AssetManager._sizes = config.sizing;
		AssetManager._scales = config.scale;
		AssetManager._pickScale(width, height);
	};
	
	AssetManager.getPreferredSize = function()
	{
		return AssetManager._sizeOrder[0];
	};
	
	AssetManager.getPreferredScale = function()
	{
		return AssetManager._scales[AssetManager._sizeOrder[0]];
	};
	
	AssetManager._pickScale = function(width, height)
	{
		var minSize = width < height ? width : height;
		var s;
		for(var i = AssetManager._sizes.length - 1; i >= 0; --i)
		{
			if(AssetManager._sizes[i].maxSize > minSize)
				s = AssetManager._sizes[i];
			else	
				break;
		}
		AssetManager._sizeOrder = s.order;
	};
	
	AssetManager.getUrl = function(assetId)
	{
		var a = AssetManager._assets[assetId];
		if(!a) return null;
		
		if(AssetManager._assetUrlCache[assetId])
			return AssetManager._assetUrlCache[assetId];
		
		var url;
		if(a.anim)
		{
			url = AssetManager._assetUrlCache[assetId] = AssetManager._paths.anim + a.src;
			return url;
		}

		if(AssetManager.lowHW && a.lowHW)
		{
			AssetManager.scales[assetId] = AssetManager._scales[a.lowHW];
			url = AssetManager._assetUrlCache[assetId] = AssetManager._paths[a.lowHW] + a.src;
			return url;
		}
		
		for(var i = 0; i < AssetManager._sizeOrder.length; ++i)
		{
			var typeId = AssetManager._sizeOrder[i];
			if(a[typeId])
			{
				AssetManager.scales[assetId] = AssetManager._scales[typeId];
				url = AssetManager._assetUrlCache[assetId] = AssetManager._paths[typeId] + a.src;
				return url;
			}
		}
		return null;
	};
	
	AssetManager.unload = function(assetOrAssets)
	{
		var a;
		if(assetOrAssets instanceof Array)
		{
			for(var i = assetOrAssets.length - 1; i >= 0; --i)
			{
				var id = assetOrAssets[i];
				unloadAsset(id);
			}
		}
		else//string
		{
			unloadAsset(assetOrAssets);
		}
	};

	function unloadAsset(asset)
	{
		if(!AssetManager._assetUrlCache[asset]) return;//if this doesn't exist, then it wasn't loaded
		a = AssetManager._assets[asset];
		if(!a) return;//asset never existed in the master list
		if(a.anim) return;//don't unload these, they are pretty small
		if(a.isFont)
		{
			if(PIXI.BitmapText.fonts[asset])
				delete PIXI.BitmapText.fonts[asset];
		}
		//anything else is a texture
		PIXI.Texture.destroyTexture(AssetManager._assetUrlCache[asset]);
		delete AssetManager.scales[asset];
		delete AssetManager._assetUrlCache[asset];
	}

	AssetManager.getAnims = function(anims, maxDigits, outObj)
	{
		if(maxDigits === undefined)
			maxDigits = 4;
		if(maxDigits < 0)
			maxDigits = 0;
		var zeros = [];
		var compares = [];
		var i, c;
		for(i = 1; i < maxDigits; ++i)
		{
			var s = "";
			c = 1;
			for(var j = 0; j < i; ++j)
			{
				s += "0";
				c *= 10;
			}
			zeros.unshift(s);
			compares.push(c);
		}
		var compareLength = compares.length;
		
		var rtnDict = outObj || {};
		var fromFrame = PIXI.Texture.fromFrame;
		var prevTex;
		for(var a in anims)
		{
			var data = anims[a];
			var list = [];

			for(i = data.numberMin, len = data.numberMax; i <= len; ++i)
			{
				var num = null;
				for(c = 0; c < compareLength; ++c)
				{
					if(i < compares[c])
					{
						num = zeros[c] + i;
						break;
					}
				}
				if(!num)
					num = i.toString();
				
				//If the texture doesn't exist, use the previous texture - this should allow us to use fewer textures
				//that are in fact the same, if we can find an easy way to improve the spritesheet format for that purpose
				var texName = data.name.replace("#", num);
				var tex = fromFrame(texName, true);
				if(tex)
					prevTex = tex;
				list.push(prevTex);
			}
			rtnDict[a] = list;
		}
		return rtnDict;
	};
	
	namespace('cloudkid').AssetManager = AssetManager;
}());
