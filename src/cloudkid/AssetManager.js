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