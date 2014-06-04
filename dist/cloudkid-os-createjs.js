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
	p = OS.prototype = (true) ? new createjs.Container() : Object.create(PIXI.DisplayObjectContainer.prototype),
	
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
	if(true)
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
	if(false)
		p._renderer = null;
	
	/**
	* [Pixi Only] A div that contains the canvas, so that games can layer it with other canvases if desired
	* 
	* @property canvasContainer The div element.
	*/
	if(false)
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
	*  @param {string} stageName The stage name selector
	*  @param {Dictionary} [options] Additional options
	*  @param {int} [options.mouseOverRate=30] (CreateJS only) the framerate for mouseover effects, higher is more responsive
	*  @param {Boolean} [options.debug=false] If we should enable the Debug class for doing console and remote logs
	*  @param {int} [options.minLogLevel=0] The minimum log level for the Debug class, default is show all statements, values from 0 (all)-4 (errors only)
	*  @param {String} [options.ip] The IP address for doing remote debugging
	*  @param {Boolean} [options.parseQueryString=false] If we should convert the query string into OS options
	*  @param {Boolean} [options.showFramerate=false] To display the current framerate counter
	*  @param {Boolean} [options.clearView=false] Auto clear the stage render
	*  @param {int} [options.backgroundColor] (PIXI only) The background color of the stage as a uint, e.g. 0xFFFFFF for white.
	*  @param {Boolean} [options.preMultAlpha] (PIXI only) If the renderer is to use pre multiplied alpha for all images. This only affects the WebGL renderer.
	*  @param {Boolean} [options.transparent] (PIXI only) The stage is transparent
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
	*  @protected
	*  @method initialize
	*  @param {string} stageName The string name of the stage id
	*  @param {object} [options] The optional options to set, see OS.init() for more information on the options that can be set.
	*/
	p.initialize = function(stageName, options)
	{
		// Call the super constructor
		if (true) this.Container_initialize();
		if (false) PIXI.DisplayObjectContainer.call(this);
		
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
		if(true)
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
		
		if(false)
		{
			this.stage = new PIXI.Stage(this.options.backgroundColor || 0, true);
		}
		this.stage.addChild(this);
		


		//listen for when the page visibility changes so we can pause our timings
		this.visibleListener = this.onWindowVisibilityChanged.bind(this);
		addPageHideListener(this.visibleListener);
		
		if(true)
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
		
		if(false)
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
			if (true) return _instance.stage.canvas.width;
			if (false) return _instance._renderer.view.width;
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
			if (true) return _instance.stage.canvas.height;
			if (false) return _instance._renderer.view.height;
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
			if(true)
			{
				if(this.contains(this._app))
					this.removeChild(this._app);
				stage.removeAllChildren();
			}
			if(false)
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
			if(false) this._renderer.render(stage);
			else if(true) this.stage.update();
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
				if(false)
					_framerate.setText("FPS: " + (Math.round(_framerateValue * 1000) / 1000));
				else if(true)
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
		if (false) this._renderer.render(this.stage);
		if (true) this.stage.update(dTime);
		
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
	if(false)
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
		
		if(true)
		{
			createjs.Touch.disable(stage);
			stage.enableMouseOver(-1);//disable mouseover events
			stage.enableDOMEvents(false);
		}
		
		ml.destroy();
		this.stage = null;
		this._updateFunctions = null;
		removePageHideListener(this.visibleListener);
		
		if(false)
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
/**
*  @module cloudkid
*/
(function(window){
	
	"use strict";

	/**
	*  [CreateJS only] Designed to provide utility related to functions and polyfills
	*  @class FunctionUtils (CreateJS)
	*/
	var FunctionUtils = {};
	
	// If there's already a bind, ignore
	if (!Function.prototype.bind)
	{
		/**
		*  Add the bind functionality to the Function prototype
		*  this allows passing a reference in the function callback 
		*
		*	var callback = function(){};
		*	cloudkid.MediaLoader.instance.load('something.json', callback.bind(this));
		*
		*  @method bind
		*  @static
		*  @param {function} that The reference to the function
		*  @return {function} The bound function
		*/
		FunctionUtils.bind = Function.prototype.bind = function bind(that) 
		{
			var target = this;

			if (typeof target != "function") 
			{
				throw new TypeError();
			}

			var args = Array.prototype.slice.call(arguments, 1),
			bound = function()
			{
				if (this instanceof bound) 
				{
					var F = function(){};
					F.prototype = target.prototype;
					var self = new F();

					var result = target.apply(self, args.concat(Array.prototype.slice.call(arguments)));
				
					if (Object(result) === result)
					{
						return result;
					}
					return self;
				}
				else 
				{
					return target.apply(that, args.concat(Array.prototype.slice.call(arguments)));
				}
			};
			return bound;
		};
	}
	
	// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
	// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating
	// requestAnimationFrame polyfill by Erik M??ller. fixes from Paul Irish and Tino Zijdel
	// MIT license

	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x)
	{
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	// Check for the animation frame
	if (!window.requestAnimationFrame)
	{
		// Create the polyfill
		window.requestAnimationFrame = function(callback)
		{
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};

		// Only set this up if the corresponding requestAnimationFrame was set up
		if (!window.cancelAnimationFrame)
		{
			window.cancelAnimationFrame = function(id) {
				clearTimeout(id);
			};
		}
	}

	/**
	*  A polyfill for requestAnimationFrame, this also gets assigned to the window if it doesn't exist
	*  also window.requestAnimFrame is a redundant and short way to access this property
	*  @static
	*  @method requestAnimationFrame
	*/
	FunctionUtils.requestAnimationFrame = window.requestAnimationFrame;
	window.requestAnimFrame = window.requestAnimationFrame;

	/**
	*  A polyfill for cancelAnimationFrame, this also gets assigned to the window if it doesn't exist
	*  @static
	*  @method cancelAnimationFrame
	*/
	FunctionUtils.cancelAnimationFrame = window.cancelAnimationFrame;	

	// Assign to namespace
	namespace('cloudkid').FunctionUtils = FunctionUtils;
	
}(window));
/**
*  @module cloudkid
*/
(function() {

	"use strict";

	/**
	*  [CreateJS only] Designed to provide utility related to Bitmaps.
	*  @class BitmapUtils (CreateJS)
	*/
	var BitmapUtils = {};

	/**
	*	Replaces Bitmaps in the global lib dictionary with a version that pulls the image from a spritesheet.
	*
	*	@method loadSpriteSheet
	*	@static
	*	@param {Object} frameDict A dictionary of frame information, with frame, trimmed, 
	*		and spriteSourceSize properties (like the JSON hash output from TexturePacker).
	*	@param {Image|HTMLCanvasElement} spritesheetImage The spritesheet image that contains all of the frames.
	*	@param {Number} [scale=1] The scale to apply to all sprites from the spritesheet. 
	*		For example, a half sized spritesheet should have a scale of 2.
	*/
	BitmapUtils.loadSpriteSheet = function(frameDict, spritesheetImage, scale)
	{
		if(scale > 0) 
		{
			// Do nothing
		}
		else
		{
			scale = 1;//scale should default to 1
		}

		for(var key in frameDict)
		{
			var frame = frameDict[key];
			var index = key.indexOf(".");
			if(index > 0)
				key = key.substring(0, index);//remove any file extension from the frame id
			var bitmap = lib[key];
			/* jshint ignore:start */
			var newBitmap = lib[key] = function()
			{
				var child = new createjs.Bitmap(this._image);
				this.addChild(child);
				child.sourceRect = this._frameRect;
				var s = this._scale;
				child.setTransform(this._frameOffsetX * s, this._frameOffsetY * s, s, s);
			};
			/* jshint ignore:end */
			var p = newBitmap.prototype = new createjs.Container();
			p._image = spritesheetImage;//give it a reference to the spritesheet
			p._scale = scale;//tell it what scale to use on the Bitmap to bring it to normal size
			var frameRect = frame.frame;
			//save the source rectangle of the sprite
			p._frameRect = new createjs.Rectangle(frameRect.x, frameRect.y, frameRect.w, frameRect.h);
			//if the sprite is trimmed, then save the amount that was trimmed off the left and top sides
			if(frame.trimmed)
			{
				p._frameOffsetX = frame.spriteSourceSize.x;
				p._frameOffsetY = frame.spriteSourceSize.y;
			}
			else
				p._frameOffsetX = p._frameOffsetY = 0;
			if(bitmap && bitmap.prototype.nominalBounds)
				p.nominalBounds = bitmap.prototype.nominalBounds;//keep the nominal bounds from the original bitmap, if it existed
			else
				p.nominalBounds = new createjs.Rectangle(0, 0, frame.sourceSize.w, frame.sourceSize.h);
		}
	};

	/**
	*	Replaces Bitmaps in the global lib dictionary with a version that uses a scaled bitmap, so you can load up
	*	smaller bitmaps behind the scenes that are scaled back up to normal size.
	*
	*	@method replaceWithScaledBitmap
	*	@static
	*	@param {String|Object} idOrDict A dictionary of Bitmap ids to replace, or a single id.
	*	@param {Number} [scale] The scale to apply to the image(s).
	*/
	BitmapUtils.replaceWithScaledBitmap = function(idOrDict, scale)
	{
		//scale is required, but it doesn't hurt to check - also, don't bother for a scale of 1
		if(scale != 1 && scale > 0) 
		{
			// Do nothing
		}
		else
		{
			return;
		}

		var key, bitmap, newBitmap, p;
		if(typeof idOrDict == "string")
		{
			key = idOrDict;
			bitmap = lib[key];
			if(bitmap)
			{
				/* jshint ignore:start */
				newBitmap = lib[key] = function()
				{
					var child = new this._oldBM();
					this.addChild(child);
					child.setTransform(0, 0, this._scale, this._scale);
				};
				/* jshint ignore:end */
				p = newBitmap.prototype = new createjs.Container();
				p._oldBM = bitmap;//give it a reference to the Bitmap
				p._scale = scale;//tell it what scale to use on the Bitmap to bring it to normal size
				p.nominalBounds = bitmap.prototype.nominalBounds;//keep the nominal bounds
			}
		}
		else
		{
			for(key in idOrDict)
			{
				bitmap = lib[key];
				if(bitmap)
				{
					/* jshint ignore:start */
					newBitmap = lib[key] = function()
					{
						var child = new this._oldBM();
						this.addChild(child);
						child.setTransform(0, 0, this._scale, this._scale);
					};
					/* jshint ignore:end */
					p = newBitmap.prototype = new createjs.Container();
					p._oldBM = bitmap;//give it a reference to the Bitmap
					p._scale = scale;//tell it what scale to use on the Bitmap to bring it to normal size
					p.nominalBounds = bitmap.prototype.nominalBounds;//keep the nominal bounds
				}
			}
		}
	};

	namespace('cloudkid').BitmapUtils = BitmapUtils;
}());
/**
*  @module cloudkid
*/
(function(){
	
	"use strict";
	
	/** 
	*  The SavedData functions use localStorage and sessionStorage, with a cookie fallback. 
	*
	*  @class SavedData
	*/
	var SavedData = {},
	
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
	*  @method remove
	*  @static
	*  @param {String} name The name of the value to remove
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
	*  @method write
	*  @static
	*  @param {String} name The name of the value to save
	*  @param {mixed} value The value to save. This will be run through JSON.stringify().
	*  @param {Boolean} [tempOnly=false] If the value should be saved only in the current browser session.
	*/
	SavedData.write = function(name, value, tempOnly)
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
	*  @method read
	*  @static
	*  @param {String} name The name of the variable
	*  @return {mixed} The value (run through `JSON.parse()`) or null if it doesn't exist
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
/**
*  @module cloudkid
*/
(function(){
	
	"use strict";
	
	// Combine prefixed URL for createObjectURL from blobs.
	window.URL = window.URL || window.webkitURL;

	// Combine prefixed blob builder
	window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;

	/**
	*  The Web Workers specification defines an API for spawning background scripts in your web 
	*  application. Web Workers allow you to do things like fire up long-running scripts to 
	*  handle computationally intensive tasks, but without blocking the UI or other scripts 
	*  to handle user interactions. Because Workers aren't available on all browsers, we provide
	*  a helpful polyfill for backward compatibility.
	*
	*	var workerCode = "this.initialVariable = 10;" +
	*	"this.onmessage = function(event)" +
	*	"{" +
	*		"var data = event.data;" +
	*		"var returnVal = this.initialVariable + data.addValue;" +
	*		"this.postMessage(returnVal);" +
	*	"};";
	*
	*	// Create the worker
	*	var worker = cloudkid.Worker.init(workerCode);
	*	worker.onmessage = function(e) {
	*		// e.data is the returnVal
	*	};
	*	
	*	// Start the worker.
	*	worker.postMessage(); 
	*
	*  @class Worker
	*/
	var Worker = {};

	/**
	*  Initialize the worker, this is how you create a Worker or FallbackWorker object.
	*  @method init
	*  @static
	*  @param {String} codeString The code in string form to make the worker from. As a string, fallback support is easier.
	*  @return {FallbackWorker|window.Worker} Either a Web Worker or a fallback with the same API to use.
	*/
	Worker.init = function(codeString)
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
				//no way of generating a blob to create the worker from
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

	// Deprecated implementation
	namespace("cloudkid").createWorker = Worker.init;

	// Assign to namespace
	namespace("cloudkid").Worker = Worker;
	
	/**
	*	Internal class that pretends to be a Web Worker's context.
	*	@class SubWorker
	*	@constructor
	*	@param {String} codeString A string to evaluate into worker code.
	*	@param {FallbackWorker} parent The FallbackWorker that owns this SubWorker.
	*/
	var SubWorker = function(codeString, parent)
	{
		this._wParent = parent;
		eval(codeString); // jshint ignore:line
	};

	var p = SubWorker.prototype;

	/**
	*	see https://developer.mozilla.org/en-US/docs/Web/API/Worker.onmessage
	*	@property {Function} onmessage
	*/
	p.onmessage = null;

	/**
	*	The FallbackWorker that is controlls by this SubWorker.
	*	@property {FallbackWorker} _wParent
	*	@private
	*/
	p._wParent = null;

	/**
	*	See https://developer.mozilla.org/en-US/docs/Web/API/Worker.postMessage
	*	@method postMessage
	*	@param {*} data The data to send.
	*/
	p.postMessage = function(data)
	{
		var parent = this._wParent;
		setTimeout(parent.onmessage.bind(parent, {data:data}), 1);
	};
	
	/**
	*	An internal class that duplicates the Worker API as a fallback when WebWorkers are not supported.
	*	@class FallbackWorker
	*	@constructor
	*	@param {String} codeString A string to evaluate into worker code.
	*/
	var FallbackWorker = function(codeString)
	{
		this._wChild = new SubWorker(codeString, this);
	};

	p = FallbackWorker.prototype;

	/**
	*	See https://developer.mozilla.org/en-US/docs/Web/API/Worker.postMessage
	*	@method postMessage
	*	@param {*} data The data to send.
	*/
	p.postMessage = function(data)
	{
		var child = this._wChild;
		setTimeout(child.onmessage.bind(child, {data:data}), 1);
	};

	/**
	*	See https://developer.mozilla.org/en-US/docs/Web/API/Worker.terminate
	*	@method terminate
	*/
	p.terminate = function()
	{
		this.onmessage = null;
		var child = this._wChild;
		child._wParent = null;
		child.onmessage = null;
		this._wChild = null;
	};

	/**
	*	See https://developer.mozilla.org/en-US/docs/Web/API/Worker.onmessage
	*	@property {Function} onmessage
	*/
	p.onmessage = null;
	
	/**
	*	The SubWorker that is controlled by this FallbackWorker.
	*	@property {SubWorker} _wChild
	*	@private
	*/
	p._wChild = null;
	
}());
/**
*  @module cloudkid
*/
(function() {
	
	"use strict";

	/**
	*  A function that is used as a normal callback, but checks an object for a property in order to combine two
	*  callbacks into one. For example usage:
	*
	*  var voPlayer = new cloudkid.VOPlayer();
	*  var callback = cloudkid.CombinedCallback.create(myFunc.bind(this), voPlayer, "playing", "_callback");
	*  Animator.play(myClip, "myAnim", callback);
	*  
	*  In this example, when Animator calls 'callback', if voPlayer["playing"] is false, 'myFunc' is called immediately.
	*  If voPlayer["playing"] is true, then voPlayer["_callback"] is set to 'myFunc' so that it will be called when voPlayer completes.
	*  
	*  @class CombinedCallback
	*  @constructor
	*  @param {function} call The callback to call when everything is complete.
	*  @param {*} obj The object to check as an additional completion dependency.
	*  @param {String} prop The property to check on obj. If obj[prop] is false, then it is considered complete.
	*  @param {String} callProp The property to set on obj if obj[prop] is true when the CombinedCallback is called.
	*/
	var CombinedCallback = function(call, obj, prop, callProp)
	{
		if(!obj[prop])//accept anything that resolves to false: eg voPlayer.playing == false
			call();
		else
			obj[callProp] = call;
	};

	/**
	*  Creates a CombinedCallback for use.
	*  
	*  @method create
	*  @static
	*  @param {function} call The callback to call when everything is complete.
	*  @param {*} obj The object to check as an additional completion dependency.
	*  @param {String} prop The property to check on obj. If obj[prop] is false, then it is considered complete.
	*  @param {String} callProp The property to set on obj if obj[prop] is true when the CombinedCallback is called.
	*/
	CombinedCallback.create = function(call, obj, prop, callProp)
	{
		return CombinedCallback.bind(this, call, obj, prop, callProp);
	};

	namespace('cloudkid').CombinedCallback = CombinedCallback;
}());
/**
*  @module cloudkid
*/
(function(){
	
	"use strict";

	/**
	*  An application is an abstract class which extends `createjs.Container`
	*  and is managed by the `cloudkid.OS`
	*
	*  @class Application
	*/
	var Application = function()
	{
		if(true) 
		{
			this.initialize();
		}	
		else if(false)
		{
			PIXI.DisplayObjectContainer.call(this);
		}	
	};
	
	// Shortcut reference to the prototype
	var p;
	
	// Extends the container
	if (true)
	{
		p = Application.prototype = new createjs.Container();
	}
	// Extends the PIXI display object
	else if (false)
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
/**
*  @module cloudkid
*/
(function(){
	
	"use strict";

	/**
	*  Represents a single item in the loader queue 
	*
	*  @class LoaderQueueItem
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
/**
*  @module cloudkid
*/
(function(){
	
	"use strict";
	
	/**
	*  The Medialoader is the singleton loader for loading all assets
	*  including images, data, code and sounds. MediaLoader supports cache-busting
	*  in the browser using dynamic query string parameters.
	* 
	*  @class MediaLoader
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
/**
*  @module cloudkid
*/
(function(){
	
	"use strict";

	/**
	*  The return result of the MediaLoader load
	*  @class MediaLoaderResult
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
/**
*  @module cloudkid
*/
(function(undefined){
	
	"use strict";
	
	/**
	*  Used for managing the browser cache of loading external elements
	*  can easily load version manifest and apply it to the media loader
	*  supports cache busting all media load requests
	*  uses the query string to bust browser versions.
	* 
	*  @class CacheManager
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
/**
*  @module cloudkid
*/
(function(undefined) {

	"use strict";
	
	/**
	*  A Multipurpose button class. It is designed to have one image, and an optional text label.
	*  The button can be a normal button or a selectable button.
	*  The button functions similarly with both CreateJS and PIXI, but slightly differently in
	*  initialization and callbacks. Add event listeners for click and mouseover to know about 
	*  button clicks and mouse overs, respectively.
	* 
	*  @class Button (CreateJS)
	*  @extends createjs.Container
	*  @constructor
	*  @param {Object|Image|HTMLCanvasElement} [imageSettings] Information about the art to be used for button states, as well as if the button is selectable or not.
	*         If this is an Image or Canvas element, then the button assumes that the image is full width and 3 images
	*         tall, in the order (top to bottom) up, over, down. If so, then the properties of imageSettings are ignored.
	*  @param {Image|HTMLCanvasElement} [imageSettings.image] The image to use for all of the button states.
	*  @param {Object} [imageSettings.up] The rectangle information about the up state.
	*  @param {createjs.Rectangle} [imageSettings.up.src] The sourceRect for the state within the image.
	*  @param {createjs.Rectangle} [imageSettings.up.trim=null] Trim data about the state, where x & y are how many pixels were 
	*         trimmed off the left and right, and height & width are the untrimmed size of the button.
	*  @param {Object} [imageSettings.over=null] The rectangle information about the over state. If omitted, uses the up state.
	*  @param {createjs.Rectangle} [imageSettings.over.src] The sourceRect for the state within the image.
	*  @param {createjs.Rectangle} [imageSettings.over.trim=null] Trim data about the state, where x & y are how many pixels were 
	*         trimmed off the left and right, and height & width are the untrimmed size of the button.
	*  @param {Object} [imageSettings.down=null] The rectangle information about the down state. If omitted, uses the up state.
	*  @param {createjs.Rectangle} [imageSettings.down.src] The sourceRect for the state within the image.
	*  @param {createjs.Rectangle} [imageSettings.down.trim=null] Trim data about the state, where x & y are how many pixels were 
	*         trimmed off the left and right, and height & width are the untrimmed size of the button.
	*  @param {Object} [imageSettings.disabled=null] The rectangle information about the disabled state. If omitted, uses the up state.
	*  @param {createjs.Rectangle} [imageSettings.disabled.src] The sourceRect for the state within the image.
	*  @param {createjs.Rectangle} [imageSettings.disabled.trim=null] Trim data about the state, where x & y are how many pixels were 
	*         trimmed off the left and right, and height & width are the untrimmed size of the button.
	*  @param {Object} [imageSettings.highlighted=null] The rectangle information about the highlighted state. If omitted, uses the over state.
	*  @param {createjs.Rectangle} [imageSettings.disabled.src] The sourceRect for the state within the image.
	*  @param {createjs.Rectangle} [imageSettings.disabled.trim=null] Trim data about the state, where x & y are how many pixels were 
	*         trimmed off the left and right, and height & width are the untrimmed size of the button.
	*  @param {Object} [imageSettings.selected=null] The rectangle information about the over state. If omitted, the button is not a selectable button.
	*  @param {createjs.Rectangle} [imageSettings.selected.src] The sourceRect for the state within the image.
	*  @param {createjs.Rectangle} [imageSettings.selected.trim=null] Trim data about the state, where x & y are how many pixels were 
	*         trimmed off the left and right, and height & width are the untrimmed size of the button.
	*  @param {Object} [label=null] Information about the text label on the button. Omitting this makes the button not use a label.
	*  @param {String} [label.text] The text to display on the label.
	*  @param {String} [label.font] The font name and size to use on the label, as createjs.Text expects.
	*  @param {String} [label.color] The color of the text to use on the label, as createjs.Text expects.
	*  @param {String} [label.textBaseline=top] The baseline for the label text, as createjs.Text expects.
	*  @param {String} [label.stroke=null] The stroke to use for the label text, if desired, as createjs.Text expects.
	*  @param {Boolean} [enabled=true] Whether or not the button is initially enabled.
	*/
	var Button = function(imageSettings, label, enabled)
	{
		if(!imageSettings) return;
		this.initialize(imageSettings, label, enabled);
	};
	
	// Extend Container
	var p = Button.prototype = new createjs.Container();
	
	var s = createjs.Container.prototype;//super
	
	/**
	*  The sprite that is the body of the button.
	*  The type of this property is dependent on which version of the OS library is used.
	*  @public
	*  @property {createjs.Bitmap} back
	*  @readOnly
	*/
	p.back = null;

	/**
	*  The text field of the button. The label is centered by both width and height on the button.
	*  The type of this property is dependent on which version of the OS library is used.
	*  @public
	*  @property {createjs.Text} label
	*  @readOnly
	*/
	p.label = null;
	
	//===callbacks for mouse/touch events
	/**
	* Callback for mouse over, bound to this button.
	* @private
	* @property {Function} _overCB
	*/
	p._overCB = null;

	/**
	* Callback for mouse out, bound to this button.
	* @private
	* @property {Function} _outCB
	*/
	p._outCB = null;

	/**
	* Callback for mouse down, bound to this button.
	* @private
	* @property {Function} _downCB
	*/
	p._downCB = null;

	/**
	* Callback for mouse up, bound to this button.
	* @private
	* @property {Function} _upCB
	*/
	p._upCB = null;

	/**
	* A reference to the mouse down event that was triggered on this button.
	* @private
	* @property {createjs.MouseEvent} _downEvent
	*/
	p._downEvent = null;
	
	//===button state variables
	/**
	* If this button is enabled.
	* @private
	* @property {Boolean} _enabled
	*/
	p._enabled = false;

	/**
	* If this button is held down.
	* @private
	* @property {Boolean} _isDown
	*/
	p._isDown = false;

	/**
	* If the mouse is over this button
	* @private
	* @property {Boolean} _isOver
	*/
	p._isOver = false;

	/**
	* If this button is selected.
	* @private
	* @property {Boolean} _isSelected
	*/
	p._isSelected = false;

	/**
	* If this button is a selectable button, and will respond to select being set.
	* @private
	* @property {Boolean} _isSelectable
	*/
	p._isSelectable = false;

	/**
	* If this button is highlighted.
	* @private
	* @property {Boolean} _isHighlighted
	*/
	p._isHighlighted = false;

	
	//===textures for different button states
	/**
	* [CreateJS only] An object noting the rectangles for the button up state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _upRects
	*/
	p._upRects = null;

	/**
	* [CreateJS only] An object noting the rectangles for the button over state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _overRects
	*/
	p._overRects = null;

	/**
	* [CreateJS only] An object noting the rectangles for the button down state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _downRects
	*/
	p._downRects = null;

	/**
	* [CreateJS only] An object noting the rectangles for the button disabled state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _disabledRects
	*/
	p._disabledRects = null;

	/**
	* [CreateJS only] An object noting the rectangles for the button selected state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _selectedRects
	*/
	p._selectedRects = null;

	/**
	* [CreateJS only] An object noting the rectangles for the button highlighted state. This should have a src property
	*	and an optional trim property, both createjs.Rectangles.
	* @private
	* @property {Object} _highlightedRects
	*/
	p._highlightedRects = null;

	/**
	* The width of the button art, independent of the scaling of the button itself.
	* @private
	* @property {Number} _width
	*/
	p._width = 0;

	/**
	* The height of the button art, independent of the scaling of the button itself.
	* @private
	* @property {Number} _height
	*/
	p._height = 0;
	
	/** 
	*  [CreateJS only] Constructor for the button when using CreateJS.
	*  @method initialize
	*  @param {Object|Image|HTMLCanvasElement} [imageSettings] See the constructor for more information
	*  {Object} [label=null] Information about the text label on the button. Omitting this makes the button not use a label.
	*  {Boolean} [enabled=true] Whether or not the button is initially enabled.
	*/
	p.initialize = function(imageSettings, label, enabled)
	{
		s.initialize.call(this);
		
		this._downCB = this._onMouseDown.bind(this);
		this._upCB = this._onMouseUp.bind(this);
		this._overCB = this._onMouseOver.bind(this);
		this._outCB = this._onMouseOut.bind(this);
		
		var image, width, height;
		if(imageSettings.image)//is a settings object with rectangles
		{
			image = imageSettings.image;
			//each rects object has a src property (createjs.Rectangle), and optionally a trim rectangle
			this._upRects = imageSettings.up;
			if(this._upRects.trim)//if the texture is trimmed, use that for the sizing
			{
				this.upTrim = this._upRects.trim;
				width = this.upTrim.width;
				height = this.upTrim.height;
			}
			else//texture is not trimmed and is full size
			{
				width = this.upRect.src.width;
				height = this.upRect.src.height;
			}
			this._overRects = imageSettings.over || this._upRects;
			this._downRects = imageSettings.down || this._upRects;
			this._disabledRects = imageSettings.disabled || this._upRects;
			this._highlightedRects = imageSettings.highlighted || this._overRects;
			if(imageSettings.selected)
			{
				this._selectedRects = imageSettings.selected;
				this._isSelectable = true;
			}
		}
		else//imageSettings is just an image to use directly - use the old stacked images method
		{
			image = imageSettings;
			width = image.width;
			height = image.height / 3;
			this._upRects = {src:new createjs.Rectangle(0, 0, width, height)};
			this._highlightedRects = this._overRects = {src:new createjs.Rectangle(0, height, width, height)};
			this._downRects = {src:new createjs.Rectangle(0, height * 2, width, height)};
			this._disabledRects = this._upRects;
		}
		
		this.back = new createjs.Bitmap(image);
		this.addChild(this.back);
		this._width = width;
		this._height = height;
		
		if(label)
		{
			this.label = new createjs.Text(label.text, label.font, label.color);
			if(label.textBaseline)
				this.label.textBaseline = label.textBaseline;
			this.label.stroke = label.stroke;
			this.addChild(this.label);
			this.label.x = (width - this.label.getMeasuredWidth()) * 0.5;
			var h = this.label.getMeasuredLineHeight();
			this.label.y = (height - h) * 0.5;
		}
		
		this.enabled = enabled === undefined ? true : !!enabled;
	};
	
	/**
	*  The width of the button, based on the width of back. This value is affected by scale.
	*  @property {Number} width
	*/
	Object.defineProperty(p, "width", {
		get:function(){return this._width * this.scaleX;},
		set:function(value){
			this.scaleX = value / this._width;
		}
	});

	/**
	*  The height of the button, based on the height of back. This value is affected by scale.
	*  @property {Number} height
	*/
	Object.defineProperty(p, "height", {
		get:function(){return this._height * this.scaleY;},
		set:function(value){
			this.scaleY = value / this._height;
		}
	});
	
	/**
	*  Sets the text of the label. This does nothing if the button was not initialized with a label.
	*  @public
	*  @method setText
	*  @param {String} text The text to set the label to.
	*/
	p.setText = function(text)
	{
		if(this.label)
		{
			this.label.text = text;
			this.label.x = (width - this.label.getMeasuredWidth()) * 0.5;
			var h = this.label.getMeasuredLineHeight();
			this.label.y = (height - h) * 0.5;
		}
	};
	
	/**
	*  Whether or not the button is enabled.
	*  @property {Boolean} enabled
	*  @default true
	*/
	Object.defineProperty(p, "enabled", {
		get: function() { return this._enabled; },
		set: function(value)
		{
			this._enabled = value;
			
			if(this._enabled)
			{
				this.cursor = 'pointer';
				this.addEventListener('mousedown', this._downCB);
				this.addEventListener('mouseover', this._overCB);
				this.addEventListener('mouseout', this._outCB);
			}
			else
			{
				this.cursor = null;
				this.removeEventListener('mousedown', this._downCB);
				this.removeEventListener('mouseover', this._overCB);
				this.removeEventListener('mouseout', this._outCB);
				this._isDown = this._isOver = false;
			}
			
			this._updateState();
		}
	});
	
	/**
	*  Whether or not the button is selected. Setting this only works if the button was given selected state when initialized.
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
	
	/**
	*  Whether or not the button is highlighted. The default highlighted state is the over state, but a specific texture can be supplied.
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
	
	/**
	*  Updates back based on the current button state.
	*  @private
	*  @method _updateState
	*/
	p._updateState = function()
	{
		if(!this.back) return;
		var data;
		if(this._isHighlighted)
			data = this._highlightedRects;
		else if(!this._enabled)
			data = this._disabledRects;
		else if(this._isDown)
			data = this._downRects;
		else if(this._isOver)
			data = this._overRects;
		else if(this._isSelected)
			data = this._selectedRects;
		else
			data = this._upRects;
		this.back.sourceRect = data.src;
		if(data.trim)
		{
			this.back.x = data.trim.x;
			this.back.y = data.trim.y;
		}
		else
		{
			this.back.x = this.back.y = 0;
		}
	};
	
	/**
	*  [CreateJS only] The callback for when the button receives a mouse down event.
	*  @private
	*  @method _onMouseDown
	*/
	p._onMouseDown = function(e)
	{
		this._downEvent = e;
		this._downEvent.target.addEventListener('pressup', this._upCB);
		this._isDown = true;
		this._updateState();
	};
	
	/**
	*  The callback for when the button for when the mouse/touch is released on the button
	*  - only when the button was held down initially.
	*  @private
	*  @method _onMouseUp
	*/
	p._onMouseUp = function(e)
	{
		this._downEvent.target.removeEventListener('pressup', this._upCB);
		this._downEvent = null;
		this._isDown = false;
		this._updateState();
	};
	
	/**
	*  [CreateJS only] The callback for when the button is moused over.
	*  @private
	*  @method _onMouseOver
	*/
	p._onMouseOver = function(e)
	{
		if(this._downEvent && this._downEvent.nativeEvent.type != 'mousedown') return;
		this._isOver = true;
		this._updateState();
	};
	
	/**
	*  [CreateJS only] The callback for when the mouse leaves the button area.
	*  @private
	*  @method _onMouseOut
	*/
	p._onMouseOut = function(e)
	{
		this._isOver = false;
		this._updateState();
	};
	
	/**
	*  Destroys the button.
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		this.removeAllChildren();
		this.removeAllEventListeners();
		this._upRects = null;
		this._overRects = null;
		this._downRects = null;
		this._disabledRects = null;
		this._selectedRects = null;
		this._highlightedRects = null;
		this._downCB = null;
		this._upCB = null;
		this._overCB = null;
		this._outCB = null;
		if(this._downEvent)
		{
			this._downEvent.target.removeEventListener('mouseup', this._upCB);
			this._downEvent = null;
		}
		this.back = null;
		this.label = null;
	};

	namespace('cloudkid').Button = Button;
}());
/**
*  @module cloudkid
*/
(function() {
	
	"use strict";
	
	/**
	*  [CreateJS only] Drag manager is responsible for handling the dragging of stage elements
	*  supports click-n-stick and click-n-drag functionality.
	*  
	*  @class DragManager (CreateJS)
	*  @constructor
	*  @param {function} startCallback The callback when when starting
	*  @param {function} endCallback The callback when ending
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
	* The moust down event while draggin
	* @private
	* @property {createjs.MouseEvent} _mouseDownEvent 
	*/
	p._mouseDownEvent = null;
	
	/**
	* The object that's being dragged
	* @public
	* @readOnly
	* @property {createjs.DisplayObject} draggedObj
	*/
	p.draggedObj = null;
	
	/**
	* The local to global position of the drag
	* @private
	* @property {createjs.Point} _dragOffset
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
	* @property {object} mouseDownStagePos
	*/
	p.mouseDownStagePos = null;

	/**
	* The position x, y of the object when interaction with it started.
	* @private
	* @property {object} mouseDownObjPos
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
		this.mouseDownStagePos = {x:0, y:0};
		this.mouseDownObjPos = {x:0, y:0};
	};
	
	/**
	*	Manually starts dragging an object. If a mouse down event is not supplied as the second argument, it 
	*   defaults to a held drag, that ends as soon as the mouse is released.
	*  @method startDrag
	*  @public
	*  @param {createjs.DisplayObject} object The object that should be dragged.
	*  @param {createjs.MouseEvent} ev A mouse down event to listen to to determine what type of drag should be used.
	*/
	p.startDrag = function(object, ev)
	{
		this._objMouseDown(ev, object);
	};
	
	/**
	* Mouse down on an obmect
	*  @method _objMouseDown
	*  @private
	*  @param {createjs.MouseEvent} ev A mouse down event to listen to to determine what type of drag should be used.
	*  @param {createjs.DisplayObject} object The object that should be dragged.
	*/
	p._objMouseDown = function(ev, obj)
	{
		// if we are dragging something, then ignore any mouse downs
		// until we release the currently dragged stuff
		if(this.draggedObj !== null) return;

		this.draggedObj = obj;
		createjs.Tween.removeTweens(this.draggedObj);
		
		//get the mouse postion in object space
		this._dragOffset = this.draggedObj.globalToLocal(ev.stageX, ev.stageY);
		
		//get that object space position and convert it to parent space
		this._dragOffset = this.draggedObj.localToLocal(this._dragOffset.x, this._dragOffset.y, this.draggedObj.parent);
		
		//move the offset to respect the object's current position
		this._dragOffset.x -= this.draggedObj.x;
		this._dragOffset.y -= this.draggedObj.y;

		this.mouseDownObjPos.x = this.draggedObj.x;
		this.mouseDownObjPos.y = this.draggedObj.y;
		
		if(!ev)//if we don't get an event (manual call neglected to pass one) then default to a held drag
		{
			this.isHeldDrag = true;
			this._startDrag();
		}
		else if(ev.nativeEvent.type == 'touchstart')//if it is a touch event, force it to be the held drag type
		{
			this.mouseDownStagePos.x = ev.stageX;
			this.mouseDownStagePos.y = ev.stageY;
			this.isTouchMove = true;
			this.isHeldDrag = true;
			this._startDrag();
		}
		else//otherwise, wait for a movement or a mouse up in order to do a held drag or a sticky click drag
		{
			this.mouseDownStagePos.x = ev.stageX;
			this.mouseDownStagePos.y = ev.stageY;
			this._mouseDownEvent = ev;
			ev.target.addEventListener("pressmove", this._triggerHeldDragCallback);
			ev.target.addEventListener("pressup", this._triggerStickyClickCallback);
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
		this._mouseDownEvent.target.removeAllEventListeners();
		this._mouseDownEvent = null;
		this._startDrag();
	};

	/**
	* Start hold dragging
	* @method _triggerHeldDrag
	* @private
	* @param {createjs.MouseEvent} ev The mouse down event
	*/
	p._triggerHeldDrag = function(ev)
	{
		var xDiff = ev.stageX - this.mouseDownStagePos.x;
		var yDiff = ev.stageY - this.mouseDownStagePos.y;
		if(xDiff * xDiff + yDiff * yDiff >= this.dragStartThreshold * this.dragStartThreshold)
		{
			this.isHeldDrag = true;
			this._mouseDownEvent.target.removeAllEventListeners();
			this._mouseDownEvent = null;
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
		this._theStage.removeEventListener("stagemousemove", this._updateCallback);
		this._theStage.addEventListener("stagemousemove", this._updateCallback);
		this._theStage.removeEventListener("stagemouseup", this._stageMouseUpCallback);
		this._theStage.addEventListener("stagemouseup", this._stageMouseUpCallback);
		
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
	p._stopDrag = function(ev, doCallback)
	{
		if(this._mouseDownEvent !== null)
		{
			this._mouseDownEvent.target.removeAllEventListeners();
			this._mouseDownEvent = null;
		}
		this._theStage.removeEventListener("stagemousemove", this._updateCallback);
		this._theStage.removeEventListener("stagemouseup", this._stageMouseUpCallback);
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
	* @param {createjs.MouseEvent} e Mouse move event
	*/
	p._updateObjPosition = function(e)
	{
		if(!this.isTouchMove && !this._theStage.mouseInBounds) return;
		
		var mousePos = this.draggedObj.parent.globalToLocal(e.stageX, e.stageY);
		var bounds = this.draggedObj._dragBounds;
		this.draggedObj.x = clamp(mousePos.x - this._dragOffset.x, bounds.x, bounds.right);
		this.draggedObj.y = clamp(mousePos.y - this._dragOffset.y, bounds.y, bounds.bottom);
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
		this.addEventListener("mousedown", this._onMouseDownListener);
		this.cursor = "pointer";
	};
	
	var disableDrag = function()
	{
		this.removeEventListener("mousedown", this._onMouseDownListener);
		this.cursor = null;
	};
	
	var _onMouseDown = function(ev)
	{
		this._dragMan._objMouseDown(ev, this);
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
			bounds = {x:0, y:0, width:this._theStage.canvas.width, height:this._theStage.canvas.height};
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
		obj._onMouseDownListener = _onMouseDown.bind(obj);
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
		obj.disableDrag();
		delete obj.enableDrag;
		delete obj.disableDrag;
		delete obj._onMouseDownListener;
		delete obj._dragMan;
		delete obj._dragBounds;
		var index = this._draggableObjects.indexOf(obj);
		if(index >= 0)
			this._draggableObjects.splice(index, 1);
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
			this._mouseDownEvent.target.removeAllEventListeners();
			this._mouseDownEvent = null;
			this._theStage.removeEventListener("stagemousemove", this._updateCallback);
			this.draggedObj = null;
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
	
	"use strict";
	
	/**
	*  Initially layouts all interface elements
	*  @module cloudkid
	*  @class Positioner
	*/
	var Positioner = function(){};
	
	// Set the protype
	Positioner.prototype = {};
	
	/**
	*  Initial position of all layout items
	*  @method positionItems
	*  @static
	*  @param {createjs.DisplayObject|PIXI.DisplayObject} parent
	*  @param {Object} itemSettings JSON format with position information
	*/
	Positioner.positionItems = function(parent, itemSettings)
	{
		var rot, pt, degToRad;
		if(false)
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
			if(false)
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
					item.rotation = rot * degToRad;//Pixi rotations are in radians
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
				if(false)
				{
					item.hitArea = Positioner.generateHitArea(hitArea);
				}
				else
				{
					item.hitShape = Positioner.generateHitArea(hitArea);
				}
			}
		}
	};
	
	/**
	*  Create the polygon hit area for interface elements
	*  @static
	*  @method generateHitArea
	*  @param {Object|Array} hitArea One of the following: <br/>
	*  * An array of points for a polygon, e.g. 
	*
	*		[{x:0, y:0}, {x:0, y:20}, {x:20, y:0}]
	*
	*  * An object describing a rectangle, e.g.
	*
	*		{type:"rect", x:0, y:0, w:10, h:30}
	*
	*  * An object describing an ellipse, where x and y are the center, e.g. 
	*
	*		{type:"ellipse", x:0, y:0, w:10, h:30}
	*
	*  * An object describing a circle, where x and y are the center, e.g.
	*
	*		{type:"circle", x:0, y:0, r:20}
	*  @param {Number} scale The size to scale hitArea by
	*/
	Positioner.generateHitArea = function(hitArea, scale)
	{
		if(!scale)
			scale = 1;
		var library;
		if(false)
			library = window.PIXI;
		else
			library = window.createjs;
		if(isArray(hitArea))
		{
			if(scale == 1)
				return new library.Polygon(hitArea);
			else
			{
				var temp = [];
				for(var i = 0, len = hitArea.length; i < len; ++i)
				{
					temp.push(new library.Point(hitArea[i].x * scale, hitArea[i].y * scale));
				}
				return new library.Polygon(temp);
			}
		}
		else if(hitArea.type == "rect" || !hitArea.type)
			return new library.Rectangle(hitArea.x * scale, hitArea.y * scale, hitArea.w * scale, hitArea.h * scale);
		else if(hitArea.type == "ellipse")
			return new library.Ellipse((hitArea.x - hitArea.w * 0.5) * scale, (hitArea.y - hitArea.h * 0.5) * scale, hitArea.w * scale, hitArea.h * scale);//convert center to upper left corner
		else if(hitArea.type == "circle")
			return new library.Circle(hitArea.x * scale, hitArea.y * scale, hitArea.r * scale);//x & y are center, pixi documentation lies
		return null;
	};

	var isArray = function(o)
	{
		return Object.prototype.toString.call(o) === '[object Array]';
	};
	
	namespace('cloudkid').Positioner = Positioner;
}());
(function() {
	
	"use strict";

	/**
	*   Object that contains the screen settings to help scaling
	*   @module cloudkid
	*   @class ScreenSettings
	*   @constructor
	*   @param {Number} width The screen width in pixels
	*   @param {Number} height The screen height in pixels
	*   @param {Number} ppi The screen pixel density (PPI)
	*/
	var ScreenSettings = function(width, height, ppi)
	{
		/**
		*  The screen width in pixels
		*  @property {Number} width 
		*/
		this.width = width;

		/**
		*  The screen height in pixels
		*  @property {Number} width 
		*/
		this.height = height;

		/**
		*  The screen pixel density (PPI)
		*  @property {Number} ppi
		*/
		this.ppi = ppi;
	};
	
	// Set the prototype
	ScreenSettings.prototype = {};
	
	// Assign to namespace
	namespace('cloudkid').ScreenSettings = ScreenSettings;

}());
(function() {

	"use strict";

	// Class imports
	var UIScaler;

	/**
	*   A single UI item that needs to be resized	
	*
	*   @module cloudkid
	*   @class UIElement
	*	@param {createjs.DisplayObject|PIXI.DisplayObject} item The item to affect  
	*   @param {UIElementSettings} settings The scale settings
	*	@param {ScreenSettings} designedScreen The original screen the item was designed for
	*/
	var UIElement = function(item, settings, designedScreen)
	{
		UIScaler = cloudkid.UIScaler;
		
		this._item = item;			
		this._settings = settings;
		this._designedScreen = designedScreen;
		
		if(false)
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

		this.origBounds = {x:0, y:0, width:item.width, height:item.height};
		this.origBounds.right = this.origBounds.x + this.origBounds.width;
		this.origBounds.bottom = this.origBounds.y + this.origBounds.height;
		
		switch(settings.vertAlign)
		{
			case UIScaler.ALIGN_TOP:
			{
				if(false)
					this.origMarginVert = item.position.y + this.origBounds.y;
				else
					this.origMarginVert = item.y + this.origBounds.y;
				break;
			}
			case UIScaler.ALIGN_CENTER:
			{
				if(false)
					this.origMarginVert = designedScreen.height * 0.5 - item.position.y;
				else
					this.origMarginVert = designedScreen.height * 0.5 - item.y;
				break;
			}
			case UIScaler.ALIGN_BOTTOM:
			{
				if(false)
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
				if(false)
					this.origMarginHori = item.position.x + this.origBounds.x;
				else
					this.origMarginHori = item.x + this.origBounds.x;
				break;
			}
			case UIScaler.ALIGN_CENTER:
			{
				if(false)
					this.origMarginHori = designedScreen.width * 0.5 - item.position.x;
				else
					this.origMarginHori = designedScreen.width * 0.5 - item.x;
				break;
			}
			case UIScaler.ALIGN_RIGHT:
			{
				if(false)
					this.origMarginHori = designedScreen.width - (item.position.x + this.origBounds.right);
				else
					this.origMarginHori = designedScreen.width - (item.x + this.origBounds.right);
				break;
			}
		}
	};
	
	var p = UIElement.prototype = {};

	/**
	*  Original horizontal margin in pixels
	*  @property {Number} origMarginHori
	*  @default 0
	*/
	p.origMarginHori = 0;

	/**
	*  Original vertical margin in pixels
	*  @property {Number} origMarginVert
	*  @default 0
	*/
	p.origMarginVert = 0;

	/** 
	*  Original width in pixels 
	*  @property {Number} origWidth
	*  @default 0
	*/
	p.origWidth = 0;

	/**
	*  Original X scale of the item
	*  @property {Number} origScaleX
	*  @default 0
	*/
	p.origScaleX = 0;

	/**
	*  The original Y scale of the item
	*  @property {Number} origScaleY
	*  @default 0
	*/
	p.origScaleY = 0;

	/**
	*  The original bounds of the item with x, y, right, bottom, width, height properties.
	*  Used to determine the distance to each edge of the item from its origin
	*  @property {Object} origBounds
	*/
	p.origBounds = null;

	/**
	*  The reference to the scale settings
	*  @private
	*  @property {UIElementSettings} _settings
	*/	
	p._settings = null;
	
	/**
	*  The reference to the interface item we're scaling
	*  @private
	*  @property {createjs.DisplayObject|PIXI.DisplayObject} _item
	*/
	p._item = null;
	
	/**
	*  The original screen the item was designed for
	*  @private
	*  @property {ScreenSettings} _designedScreen
	*/
	p._designedScreen = null;
	
	/**
	*  Adjust the item scale and position, to reflect new screen
	*  @method resize
	*  @param {ScreenSettings} newScreen The current screen settings
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

		if(false)
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
		
		
		switch(this._settings.vertAlign)
		{
			case UIScaler.ALIGN_TOP:
			{
				if(false)
					this._item.position.y = m - this.origBounds.y * itemScale;
				else
					this._item.y = m - this.origBounds.y * itemScale;
				break;
			}
			case UIScaler.ALIGN_CENTER:
			{
				if(false)
					this._item.position.y = newScreen.height * 0.5 - m;
				else
					this._item.y = newScreen.height * 0.5 - m;
				break;
			}
			case UIScaler.ALIGN_BOTTOM:
			{
				if(false)
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
					if(false)
						this._item.position.x = letterBoxWidth + m - this.origBounds.x * itemScale;
					else
						this._item.x = letterBoxWidth + m - this.origBounds.x * itemScale;
				}
				else
				{
					if(false)
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
					if(false)
						this._item.position.x = (newScreen.width - this._item.width) * 0.5;
					else
						this._item.x = (newScreen.width - this._item.width) * 0.5;
				}
				else
				{
					if(false)
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
					if(false)
						this._item.position.x = newScreen.width - letterBoxWidth - m - this.origBounds.right * itemScale;
					else
						this._item.x = newScreen.width - letterBoxWidth - m - this.origBounds.right * itemScale;
				}
				else
				{
					if(false)
						this._item.position.x = newScreen.width - m - this.origBounds.right * itemScale;
					else
						this._item.x = newScreen.width - m - this.origBounds.right * itemScale;
				}
				break;
			}		
		}
	};
	
	/**
	*  Destroy this item, don't use after this
	*  @method destroy
	*/
	p.destroy = function()
	{
		this.origBounds = null;
		this._item = null;
		this._settings = null;
		this._designedScreen = null;
	};
	
	namespace('cloudkid').UIElement = UIElement;
}());
(function() {
	
	"use strict";

	/**
	*  The UI Item Settings which is the positioning settings used to adjust each element
	*  @module cloudkid
	*  @class UIElementSettings
	*/
	var UIElementSettings = function(){};
	
	// Reference to the prototype
	var p = UIElementSettings.prototype = {};
	
	/** 
	*  What vertical screen location the item should be aligned to: "top", "center", "bottom"
	*  @property {String} vertAlign
	*/
	p.vertAlign = null;

	/** 
	*  What horizontal screen location the item should be aligned to: "left", "center", "right"
	*  @property {String} horiAlign
	*/
	p.horiAlign = null;

	/** 
	*  If this element should be aligned to the title safe area, not the actual screen 
	*  @property {Boolean} titleSafe
	*  @default false
	*/
	p.titleSafe = false;

	/** 
	*  Maximum scale allowed in physical size 
	*  @property {Number} maxScale
	*  @default 1
	*/
	p.maxScale = 1;

	/** 
	*  Minimum scale allowed in physical size 
	*  @property {Number} minScale
	*  @default 1
	*/
	p.minScale = 1;
	
	/**
	*  If the UI element is centered horizontally
	*  @property {Boolean} centeredHorizontally
	*  @default false
	*/
	p.centeredHorizontally = false;
	
	namespace('cloudkid').UIElementSettings = UIElementSettings;
}());
(function() {
	
	"use strict";

	// Class imports
	var UIElementSettings = cloudkid.UIElementSettings,
		UIElement = cloudkid.UIElement,
		ScreenSettings = cloudkid.ScreenSettings;

	/**
	*   The UI scale is responsible for scaling UI components
	*   to help easy the burden of different device aspect ratios
	*
	*  @module cloudkid
	*  @class UIScaler
	*  @constructor
	*  @param {createjs.DisplayObject|PIXI.DisplayObject} parent The UI display container
	*  @param {Number} designedWidth The designed width of the UI
	*  @param {Number} designedHeight The designed height of the UI
	*  @param {Number} designedPPI The designed PPI of the UI
	*/
	var UIScaler = function(parent, designedWidth, designedHeight, designedPPI)
	{
		this._parent = parent;
		this._items = [];
		this._designedScreen = new ScreenSettings(designedWidth, designedHeight, designedPPI);
	};
	
	// Reference to the prototype
	var p = UIScaler.prototype = {};
				
	/** 
	*  The current screen settings 
	*  @property {ScreenSettings} currentScreen
	*  @static
	*  @private
	*/
	var currentScreen = new ScreenSettings(0, 0, 0);
	
	/** 
	*  If the screensize has been set 
	*  @property {Boolean} initialized
	*  @static
	*  @private
	*/
	var initialized = false;
	
	/** 
	*  The UI display object to update 
	*  @property {createjs.DisplayObject|PIXI.DisplayObject} _parent
	*  @private
	*/
	p._parent = null;
	
	/** 
	*  The screen settings object, contains information about designed size 
	*  @property {ScreenSettings} _designedScreen
	*  @private
	*/
	p._designedScreen = null;
	
	/** 
	*  The configuration for each items
	*  @property {Array} _items
	*  @private
	*/
	p._items = null;
	
	/**
	*  Vertically align to the top
	*  @property {String} ALIGN_TOP
	*  @static
	*  @final
	*  @readOnly
	*  @default "top"
	*/
	UIScaler.ALIGN_TOP = "top";

	/**
	*  Vertically align to the bottom
	*  @property {String} ALIGN_BOTTOM
	*  @static
	*  @final
	*  @readOnly
	*  @default "bottom"
	*/
	UIScaler.ALIGN_BOTTOM = "bottom";

	/**
	*  Horizontally align to the left
	*  @property {String} ALIGN_LEFT
	*  @static
	*  @final
	*  @readOnly
	*  @default "left"
	*/
	UIScaler.ALIGN_LEFT = "left";

	/**
	*  Horizontally align to the right
	*  @property {String} ALIGN_RIGHT
	*  @static
	*  @final
	*  @readOnly
	*  @default "right"
	*/
	UIScaler.ALIGN_RIGHT = "right";

	/**
	*  Vertically or horizontally align to the center
	*  @property {String} ALIGN_CENTER
	*  @static
	*  @final
	*  @readOnly
	*  @default "center"
	*/
	UIScaler.ALIGN_CENTER = "center";
	
	/**
	*  Create the scaler from JSON data
	*  @method fromJSON
	*  @static
	*  @param {createjs.DisplayObject|PIXI.DisplayObject} parent The UI display container
	*  @param {Object} jsonSettings The json of the designed settings {designedWidth:800, designedHeight:600, designedPPI:72}
	*  @param {Object} jsonItems The json items object where the keys are the name of the property on the parent and the value
	*         is an object with keys of "titleSafe", "minScale", "maxScale", "centerHorizontally", "align"
	*  @param {Boolean} [immediateDestroy=true] If we should immediately cleanup the UIScaler after scaling items
	*  @return {UIScaler} The scaler object that can be reused
	*/
	UIScaler.fromJSON = function(parent, jsonSettings, jsonItems, immediateDestroy)
	{
		if (typeof immediateDestroy != "boolean") immediateDestroy = true;
			
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
	*   Set the current screen settings. If the stage size changes at all, re-call this function
	*   @method init
	*   @static
	*   @param {Number} screenWidth The fullscreen width
	*   @param {Number} screenHeight The fullscreen height
	*   @param {Number} screenPPI The screen resolution density
	*/
	UIScaler.init = function(screenWidth, screenHeight, screenPPI)
	{
		currentScreen.width = screenWidth;
		currentScreen.height = screenHeight;
		currentScreen.ppi = screenPPI;
		initialized = true;
	};

	/**
	*  Get the current scale of the screen
	*  @method getScale
	*  @return {Number} The current stage scale
	*/
	p.getScale = function()
	{
		return currentScreen.height / this._designedScreen.height;
	};
	
	/**
	*   Manually add an item 
	*   @method add
	*   @param {createjs.DisplayObject|PIXI.DisplayObject} item The display object item to add
	*   @param {String} [vertAlign="center"] The vertical align of the item (cefault is center)
	*   @param {String} [horiAlign="center"] The horizontal align of the item (default is center)
	*   @param {Boolean} [titleSafe=false] If the item needs to be in the title safe area (default is false)
	*   @param {Number} [minScale=1] The minimum scale amount (default, scales the same size as the stage)
	*   @param {Number} [maxScale=1] The maximum scale amount (default, scales the same size as the stage)
	*   @param {Boolean} [centeredHorizontally=false] Makes sure that the center of the object was at the center of the screen, assuming an origin at the top left of the object
	*/
	p.add = function(item, vertAlign, horiAlign, titleSafe, minScale, maxScale, centeredHorizontally)
	{
		// Create the item settings
		var s = new UIElementSettings();
		
		s.vertAlign = vertAlign || UIScaler.ALIGN_CENTER;
		s.horiAlign = horiAlign || UIScaler.ALIGN_CENTER;
		s.titleSafe = (typeof titleSafe != "boolean") ? false : titleSafe;
		s.maxScale = (typeof maxScale != "number") ? NaN : maxScale;
		s.minScale = (typeof minScale != "number") ? NaN : minScale;
		s.centeredHorizontally = centeredHorizontally || false;
				
		this._items.push(new UIElement(item, s, this._designedScreen));
	};
	
	/**
	*   Scale a single background image according to the UIScaler.width and height
	*   @method resizeBackground
	*   @static
	*   @param {createjs.Bitmap|PIXI.Bitmap} The bitmap to scale
	*/
	UIScaler.resizeBackground = function(bitmap)
	{
		if (!initialized) return;
		
		var h = bitmap.height / bitmap.scale.y;
		var w = bitmap.width / bitmap.scale.x;

		//scale the background
		var scale = currentScreen.height / h;
		bitmap.scale.x = bitmap.scale.y = scale;
		
		//center the background
		bitmap.position.x = (currentScreen.width - b.width) * 0.5;
	};
	
	/**
	*  Convenience function to scale a collection of backgrounds
	*  @method resizeBackgrounds
	*  @static
	*  @param {Array} bitmaps The collection of bitmap images
	*/
	UIScaler.resizeBackgrounds = function(bitmaps)
	{
		for(var i = 0, len = bitmaps.length; i < len; ++i)
		{
			UIScaler.resizeBackground(bitmaps[i]);
		}
	};
	
	/**
	*  Scale the UI items that have been registered to the current screen
	*  @method resize
	*/
	p.resize = function()
	{
		if (this._items.length > 0)
		{
			for(var i = 0, len = this._items.length; i < len; ++i)
			{
				this._items[i].resize(currentScreen);
			}
		}
	};
	
	/**
	*  Destroy the scaler object
	*  @method destroy
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
