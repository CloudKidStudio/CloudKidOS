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
	
		var callback = function(){};
		cloudkid.MediaLoader.instance.load('something.json', callback.bind(this));
	
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
	// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
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