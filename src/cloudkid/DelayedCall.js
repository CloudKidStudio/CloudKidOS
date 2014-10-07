/**
*  @module cloudkid
*/
(function(undefined) {

	"use strict";

	var NEXT_ID = 0;

	/**
	*  A class for delaying a call through the OS, instead of relying on setInterval() or setTimeout().
	* 
	*  @class DelayedCall
	*  @constructor
	*  @param {function} callback The function to call when the delay has completed.
	*  @param {int} delay The time to delay the call, in milliseconds.
	*  @param {Boolean} repeat=false If the DelayedCall should automatically repeat itself when completed.
	*  @param {Boolean} autoDestroy=true If the DelayedCall should clean itself up when completed.
	*/
	var DelayedCall = function(callback, delay, repeat, autoDestroy)
	{
		/**
		*  The function to call when the delay is completed.
		*  @private
		*  @property {function} _callback
		*/
		this._callback = callback;
		/**
		*  The delay time, in milliseconds.
		*  @private
		*  @property {int} _delay
		*/
		this._delay = delay;
		/**
		*  The timer counting down from _delay, in milliseconds.
		*  @private
		*  @property {int} _timer
		*/
		this._timer = delay;
		/**
		*  If the DelayedCall should repeat itself automatically.
		*  @private
		*  @property {Boolean} _repeat
		*  @default false
		*/
		this._repeat = !!repeat;
		/**
		*  If the DelayedCall should destroy itself after completing
		*  @private
		*  @property {Boolean} _autoDestroy
		*  @default true
		*/
		this._autoDestroy = autoDestroy === undefined ? true : !!autoDestroy;
		/**
		*  The unique ID used for the update callback for the OS.
		*  @private
		*  @property {String} _updateId
		*/
		this._updateId = "DelayedCall#" + (++NEXT_ID);
		/**
		*  If the DelayedCall is currently paused (not stopped).
		*  @private
		*  @property {Boolean} _paused
		*/
		this._paused = false;

		//save a bound version of the update function
		this._update = this._update.bind(this);
		//start the delay
		cloudkid.OS.instance.addUpdateCallback(this._updateId, this._update);
	};

	var p = DelayedCall.prototype;

	/**
	*  The callback supplied to the OS for an update each frame.
	*  @private
	*  @method _update
	*  @param {int} elapsed The time elapsed since the previous frame.
	*/
	p._update = function(elapsed)
	{
		if(!this._callback)
		{
			this.destroy();
			return;
		}

		this._timer -= elapsed;
		if(this._timer <= 0)
		{
			this._callback();
			if(this._repeat)
				this._timer += this._delay;
			else if(this._autoDestroy)
				this.destroy();
			else
				cloudkid.OS.instance.removeUpdateCallback(this._updateId);
		}
	};

	/**
	*  Restarts the DelayedCall, whether it is running or not.
	*  @public
	*  @method restart
	*/
	p.restart = function()
	{
		if(!this._callback) return;
		var os = cloudkid.OS.instance;
		//can't add duplicates
		os.addUpdateCallback(this._updateId, this._update);
		this._timer = this._delay;
		this._paused = false;
	};

	/**
	*  Stops the DelayedCall, without destroying it.
	*  @public
	*  @method stop
	*/
	p.stop = function()
	{
		cloudkid.OS.instance.removeUpdateCallback(this._updateId);
		this._paused = false;
	};

	/**
	*  If the DelayedCall is paused or not.
	*  @public
	*  @property {Boolean} paused
	*/
	Object.defineProperty(p, "paused", {
		get: function() { return this._paused; },
		set: function(value)
		{
			if(!this._callback) return;
			var os = cloudkid.OS.instance;
			if(this._paused && !value)
			{
				this._paused = false;
				if(!os.hasUpdateCallback(this._updateId))
					os.addUpdateCallback(this._updateId, this._update);
			}
			else if(value)
			{
				if(os.hasUpdateCallback(this._updateId))
				{
					this._paused = true;
					os.removeUpdateCallback(this._updateId);
				}
			}
		}
	});

	/**
	*  Stops and cleans up the DelayedCall. Do not use it after calling
	*  destroy().
	*  @public
	*  @method destroy
	*/
	p.destroy = function()
	{
		cloudkid.OS.instance.removeUpdateCallback(this._updateId);
		this._callback = null;
	};

	namespace('cloudkid').DelayedCall = DelayedCall;
}());