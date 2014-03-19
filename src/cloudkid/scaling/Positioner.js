(function() {
	
	var Positioner = function()
	{
	};
	
	Positioner.prototype = {};
	
	Positioner.positionItems = function(parent, itemSettings)
	{
		var rot, pt, degToRad;
		if(CONFIG_PIXI)
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
			if(CONFIG_PIXI)
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
				if(CONFIG_PIXI)
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
	
	if(CONFIG_PIXI)
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