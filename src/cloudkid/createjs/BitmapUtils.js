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
		if(!(scale > 0)) scale = 1;//scale should default to 1

		for(var key in frameDict)
		{
			var bitmap = lib[key];
			if(bitmap)
			{
				var frame = frameDict[key];
				var newBitmap = lib[key] = function()
				{
					var child = new createjs.Bitmap(this._image);
					this.addChild(child);
					child.sourceRect = this._frameRect;
					var s = this._scale;
					child.x = this._frameOffsetX * s;
					child.y = this._frameOffsetY * s;
					child.setTransform(0, 0, s, s);
				}
				var p = newBitmap.prototype = new createjs.Container();
				p._image = spritesheetImage;//give it a reference to the spritesheet
				p._scale = scale;//tell it what scale to use on the Bitmap to bring it to normal size
				var frameRect = frame.frame;
				//save the source rectangle of the sprite
				p._frameRect = new createjs.Rectangle(frameRect.x, frameRect.y, frameRect.width, frameRect.height);
				//if the sprite is trimmed, then save the amount that was trimmed off the left and top sides
				if(frame.trimmed)
				{
					p._frameOffsetX = frame.spriteSourceSize.x;
					p._frameOffsetY = frame.spriteSourceSize.y;
				}
				else
					p._frameOffsetX = p._frameOffsetY = 0;
				p.nominalBounds = bitmap.nominalBounds;//keep the nominal bounds
			}
		}
	};

	/**
	*	Replaces Bitmaps in the global lib dictionary with a version that pulls the image from a spritesheet.
	*
	*	@method replaceWithScaledBitmap
	*	@static
	*	@param {String|Object} idOrDict A dictionary of Bitmap ids to replace, or a single id.
	*	@param {Number} [scale] The scale to apply to the image(s).
	*/
	BitmapUtils.replaceWithScaledBitmap = function(idOrDict, scale)
	{
		//scale is required, but it doesn't hurt to check - also, don't bother for a scale of 1
		if(scale == 1 || !(scale > 0)) return;
		var key, bitmap, newBitmap, p;
		if(typeof idOrDict == "string")
		{
			key = idOrDict;
			bitmap = lib[key];
			if(bitmap)
			{
				newBitmap = lib[key] = function()
				{
					var child = new this._oldBM();
					this.addChild(child);
					child.setTransform(0, 0, this._scale, this._scale);
				}
				p = newBitmap.prototype = new createjs.Container();
				p._oldBM = bitmap;//give it a reference to the Bitmap
				p._scale = scale;//tell it what scale to use on the Bitmap to bring it to normal size
				p.nominalBounds = bitmap.nominalBounds;//keep the nominal bounds
			}
		}
		else
		{
			for(key in idOrDict)
			{
				bitmap = lib[key];
				if(bitmap)
				{
					newBitmap = lib[key] = function()
					{
						var child = new this._oldBM();
						this.addChild(child);
						child.setTransform(0, 0, this._scale, this._scale);
					}
					p = newBitmap.prototype = new createjs.Container();
					p._oldBM = bitmap;//give it a reference to the Bitmap
					p._scale = scale;//tell it what scale to use on the Bitmap to bring it to normal size
					p.nominalBounds = bitmap.nominalBounds;//keep the nominal bounds
				}
			}
		}
	};

	namespace('cloudkid').BitmapUtils = BitmapUtils;
}());