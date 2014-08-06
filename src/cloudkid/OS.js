/**
*  @module cloudkid
*/
(function(undefined){
	
	/**
	*  Designed to mimic the feature-set of the CloudKidOS for AS3
	*  Provides a staging framework for other things to load
	*  handles the stage query string parameters, provides debug tools,
	*  as well as browser cache-busting.
	*
	*  @class OS
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
	p = OS.prototype = (CONFIG_CREATEJS) ? new createjs.Container() : Object.create(PIXI.DisplayObjectContainer.prototype),
	
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
	* @property {OS} _instance
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
	if(CONFIG_CREATEJS)
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
	if(CONFIG_PIXI)
		p._renderer = null;
	
	/**
	* [Pixi Only] A div that contains the canvas, so that games can layer it with other canvases if desired.
	* 
	* @property {DOMElement} canvasContainer
	* @public
	*/
	if(CONFIG_PIXI)
		p.canvasContainer = null;
	
	/**
	* Reference to the current application
	* @protected
	* @property {Application} _app
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
	*  @param {String} stageName The stage name selector
	*  @param {Dictionary} [options] Additional options
	*  @param {int} [options.mouseOverRate=30] (CreateJS only) the framerate for mouseover effects, higher is more responsive
	*  @param {Boolean} [options.debug=false] If we should enable the Debug class for doing console and remote logs
	*  @param {int} [options.minLogLevel=0] The minimum log level for the Debug class, default is show all statements, values from 0 (all)-4 (errors only)
	*  @param {String} [options.ip=null] The IP address for doing remote debugging
	*  @param {Boolean} [options.parseQueryString=false] If we should convert the query string into OS options
	*  @param {Boolean} [options.showFramerate=false] To display the current framerate counter
	*  @param {Boolean} [options.clearView=false] Auto clear the stage render
	*  @param {int} [options.backgroundColor=0x000000] (PIXI only) The background color of the stage as a uint, e.g. 0xFFFFFF for white.
	*  @param {Boolean} [options.preMultAlpha=false] (PIXI only) If the renderer is to use pre multiplied alpha for all images. This only affects the WebGL renderer.
	*  @param {Boolean} [options.transparent=false] (PIXI only) The stage is transparent
	*  @param {int} [options.width] (PIXI only) The width of the renderer, default is the canvas width
	*  @param {int} [options.height] (PIXI only) The height of the renderer, default is the canvas height
	*  @param {String} [options.forceContext=null] (PIXI only) The stage renderer, options are "canvas2d", "webgl" or null. Omitting this (or null) uses WebGL if available, and Canvas2D otherwise.
	*  @param {Boolean} [options.raf=false] Use the request animation frame instead of a setInterval
	*  @param {int} [options.fps=60] Set the framerate 
	*  @param {String} [options.versionsFile] The text field to store cache-busting versions for individual files
	*  @param {String} [options.basePath] The base path to load all files from (useful if using a CDN)
	*  @param {Boolean} [options.cacheBust=false] If all file requests with the MediaLoader should be cacheBusted (e.g., "file.mp3?cb=123123")
	*/
	OS.init = function(stageName, options)
	{
		if (!_instance)
		{
			if (DEBUG)
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
	*  @protected
	*  @method initialize
	*  @param {string} stageName The string name of the stage id
	*  @param {object} [options] The optional options to set, see OS.init() for more information on the options that can be set.
	*/
	p.initialize = function(stageName, options)
	{
		// Call the super constructor
		if (CONFIG_CREATEJS) this.Container_initialize();
		if (CONFIG_PIXI) PIXI.DisplayObjectContainer.call(this);
		
		// Setup the options container
		this.options = options || {};
		
		// See if we should parse querystring
		if (this.options.parseQueryString !== undefined)
			this.options = parseQueryStringParams(this.options);
		
		// Turn on debugging
		if (this.options.debug !== undefined)
			Debug.enabled = this.options.debug === true || this.options.debug === "true";
			
		if (this.options.minLogLevel !== undefined)
			Debug.minLogLevel = parseInt(this.options.minLogLevel, 10);

		//if we were supplied with an IP address, connect to it with the Debug class for logging
		if(typeof this.options.ip == "string")
			Debug.connect(this.options.ip);
	
		// Setup the medialoader
		var loader = cloudkid.MediaLoader.init();
		
		// Setup the stage
		if(CONFIG_CREATEJS)
		{
			this.stage = new createjs.Stage(stageName);
			this.stage.name = "cloudkid.OS";
		
			// prevent mouse down turning into cursor
			this.stage.canvas.onmousedown = function(e)
			{
				e.preventDefault();
			};

			// Enable the mouseover by setting the frequency
			// if we set mouseOverRate <= 0, then turns off mouseover effects
			var mouseOverRate = this.options.mouseOverRate = this.options.mouseOverRate || 30;
			this.stage.enableMouseOver(mouseOverRate);
		}
		
		if(CONFIG_PIXI)
		{
			this.stage = new PIXI.Stage(this.options.backgroundColor || 0, true);
		}
		this.stage.addChild(this);
		
		//listen for when the page visibility changes so we can pause our timings
		this.visibleListener = this.onWindowVisibilityChanged.bind(this);
		addPageHideListener(this.visibleListener);
		
		if(CONFIG_CREATEJS)
		{
			// Setup the touch events
			var touchDevice=(window.hasOwnProperty('ontouchstart'));
			
			//IE10 doesn't send mouseover events properly if touch is enabled
			if(window.navigator.userAgent.indexOf("MSIE 10.0") != -1 && !touchDevice)
			{
				if (DEBUG) Debug.log('IE10 Desktop');
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
		
		if(CONFIG_PIXI)
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
		for (var i = 0; i < splitFlashVars.length; i++)
		{
			myVar = splitFlashVars[i].split("=");
			if (DEBUG)
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
			if (CONFIG_CREATEJS) return _instance.stage.canvas.width;
			if (CONFIG_PIXI) return _instance._renderer.view.width;
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
			if (CONFIG_CREATEJS) return _instance.stage.canvas.height;
			if (CONFIG_PIXI) return _instance._renderer.view.height;
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
	*  @return {Boolean} If an `Application` was successfully removed
	*/
	p.removeApp = function(destroying)
	{
		var removed = false;
		
		var stage = this.stage;
		if (this._app)
		{
			if(CONFIG_CREATEJS)
			{
				if(this.contains(this._app))
					this.removeChild(this._app);
				stage.removeAllChildren();
			}
			if(CONFIG_PIXI)
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
			if(CONFIG_PIXI) this._renderer.render(stage);
			else if(CONFIG_CREATEJS) this.stage.update();
		}
		
		return removed;
	};
	
	/**
	*  Add an app to this display list
	*  @public 
	*  @method addApp
	*  @param {Application} app The application to add
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
	*  @return {Application} The current Application, null if no application
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
				if(CONFIG_PIXI)
					_framerate.setText("FPS: " + (Math.round(_framerateValue * 1000) / 1000));
				else if(CONFIG_CREATEJS)
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
		if (CONFIG_PIXI) this._renderer.render(this.stage);
		if (CONFIG_CREATEJS) this.stage.update(dTime);
		
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
	if(CONFIG_PIXI)
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
		
		if(CONFIG_CREATEJS)
		{
			createjs.Touch.disable(stage);
			stage.enableMouseOver(-1);//disable mouseover events
			stage.enableDOMEvents(false);
		}
		
		ml.destroy();
		this.stage = null;
		this._updateFunctions = null;
		removePageHideListener(this.visibleListener);
		
		if(CONFIG_PIXI)
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
	*  @type OS
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