/**
*  @module cloudkid
*/
(function(undefined) {

	"use strict";

	var NEXT_ID = 0;

	var DelayedCall = function(callback, delay, repeat, autoDestroy)
	{
		this._callback = callback;
		this._delay = delay;
		this._timer = delay;
		this._repeat = !!repeat;
		this._autoDestroy = autoDestroy === undefined ? true : !!autoDestroy;
		this._updateId = "DelayedCall#" + (++NEXT_ID);
		cloudkid.OS.instance.addUpdateCallback(this._updateId, this._update.bind(this));
	};

	var p = DelayedCall.prototype;

	p._update = function(elapsed)
	{
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

	p.restart = function()
	{
		var os = cloudkid.OS.instance;
		if(!os.hasUpdateCallback(this._updateId))
			os.addUpdateCallback(this._updateId, this._update.bind(this));
		this._timer = this._delay;
	};

	p.destroy = function()
	{
		cloudkid.OS.instance.removeUpdateCallback(this._updateId);
		this._callback = null;
	};

	namespace('cloudkid').DelayedCall = DelayedCall;
}());