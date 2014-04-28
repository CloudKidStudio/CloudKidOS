/**
*  @module cloudkid
*/
(function() {
	
	"use strict";

	/**
	*  [PIXI-only] Asset Manager is responsible for managing different resolutions of assets and spritesheets
	*  based on the resolution of the stage. This is a helpful optimization for PIXI which some low-hardware
	*  devices have a problem keeping up with.
	*
	*  @class AssetManager (PIXI)
	*/
	var AssetManager = {};
	
	/** 
	*  Dictionary of scales by asset id 
	*  @property {Object} scales
	*  @final
	*  @static
	*/
	AssetManager.scales = null;

	/**
	*  The available size definitions, e.g., {"maxSize":400, "order": ["tiny", "sd"]}
	*  @property {Array} sizes
	*  @private
	*  @static
	*/
	var sizes = null;

	/** 
	*  Dictionary of assets by asset id 
	*  @property {Object} assets
	*  @private
	*  @static
	*/
	var assets = null;

	/** 
	*  The cache of asset url paths
	*  @property {Object} assetUrlCache
	*  @private
	*  @static
	*/
	var assetUrlCache = null;

	/** 
	*  The scaling value for each asset size id, e.g., {"sd" : 1, "tiny" : 2}
	*  @property {Object} scales
	*  @private
	*  @static
	*/
	var scales = null;

	/**
	*  The paths to each resolution folder, e.g., {"sd":"images/sd/", "tiny":"images/tiny/"}
	*  @property {Object} paths
	*  @private
	*  @static
	*/
	var paths = null;

	/**
	*  The collection of perferred size to load
	*  @property {Array} sizeOrder
	*  @private
	*  @static
	*/
	var sizeOrder = null;

	/**
	*  If we should use low hardware, if we know we're on a slow device
	*  @property {Boolean} lowHW
	*  @static
	*/
	AssetManager.lowHW = false;
	
	/**
	*  Initialize the asset manager
	*  @method init
	*  @static
	*  @param {Object} config The configuration file which contains keys for "path", "scale", "sizing", "assets"
	*  @param {Number} width The stage width
	*  @param {Number} height The stage height
	*/
	AssetManager.init = function(config, width, height)
	{
		AssetManager.scales = {};
		assets = config.assets;
		assetUrlCache = {};
		paths = config.path;
		sizes = config.sizing;
		scales = config.scale;
		pickScale(width, height);
	};
	
	/**
	*  Get the alias of the preferred size to use
	*  @method getPreferredSize
	*  @static
	*  @return {String} The alias for the preferred size
	*/
	AssetManager.getPreferredSize = function()
	{
		return sizeOrder[0];
	};
	
	/**
	*  Get the preferred scale amount
	*  @method getPreferredScale
	*  @static
	*  @return {Number} The scale amount associated with the preferred size
	*/
	AssetManager.getPreferredScale = function()
	{
		return scales[sizeOrder[0]];
	};
	
	/**
	*  Pick the preferred scale based on the screen resolution
	*  @method pickScale
	*  @private
	*  @static
	*  @param {Number} width The stage width
	*  @param {Number} height The stage height
	*/
	var pickScale = function(width, height)
	{
		var minSize = width < height ? width : height;
		var s;
		for(var i = sizes.length - 1; i >= 0; --i)
		{
			if(sizes[i].maxSize > minSize)
				s = sizes[i];
			else	
				break;
		}
		sizeOrder = s.order;
	};
	
	/**
	*  Get a asset url by asset id
	*  @method getUrl
	*  @static
	*  @param {String} assetId The unique asset kdy
	*/
	AssetManager.getUrl = function(assetId)
	{
		var a = assets[assetId];
		if(!a) return null;
		
		if(assetUrlCache[assetId])
			return assetUrlCache[assetId];
		
		var url;
		if(a.anim)
		{
			url = assetUrlCache[assetId] = paths.anim + a.src;
			return url;
		}

		if(AssetManager.lowHW && a.lowHW)
		{
			AssetManager.scales[assetId] = scales[a.lowHW];
			url = assetUrlCache[assetId] = paths[a.lowHW] + a.src;
			return url;
		}
		
		for(var i = 0; i < sizeOrder.length; ++i)
		{
			var typeId = sizeOrder[i];
			if(a[typeId])
			{
				AssetManager.scales[assetId] = scales[typeId];
				url = assetUrlCache[assetId] = paths[typeId] + a.src;
				return url;
			}
		}
		return null;
	};
	
	/**
	*  Unload an asset
	*  @method unload
	*  @static
	*  @param {Array|String} assetOrAsset The collection of assets or single asset id
	*/
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

	/**
	*  Unload an asset
	*  @method unloadAsset
	*  @static
	*  @private
	*  @param {String} asset The asset id to unload
	*/
	var unloadAsset = function(asset)
	{
		if(!assetUrlCache[asset]) return;//if this doesn't exist, then it wasn't loaded
		a = assets[asset];
		if(!a) return;//asset never existed in the master list
		if(a.anim) return;//don't unload these, they are pretty small
		if(a.isFont)
		{
			if(PIXI.BitmapText.fonts[asset])
				delete PIXI.BitmapText.fonts[asset];
		}
		//anything else is a texture
		PIXI.Texture.destroyTexture(assetUrlCache[asset]);
		delete AssetManager.scales[asset];
		delete assetUrlCache[asset];
	};

	/**
	*  Get the collection of assets that are also animations
	*  @method getAnims
	*  @static
	*  @param {Object} anims The dictionary of animation assets
	*  @param {int} [maxDigits=4] Maximum number of digits, like 4 for an animation exported as anim_0001.png
	*  @param {Object} [outObj] If already using an return object
	*  @return {Object} An collection of PIXI.Textures for each animation id suitable for use in PIXI.MovieClip
	*/
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
	
	// Assign to the namespace
	namespace('cloudkid').AssetManager = AssetManager;
}());