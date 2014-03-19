
(function(){
	
	/**
	*  An application is an abstract class which extends `createjs.Container`
	*  and is managed by the `cloudkid.OS`
	*
	*  @class cloudkid.Application
	*/
	var Application = function()
	{
		if(CONFIG_CREATEJS) 
		{
			this.initialize();
		}	
		else if(CONFIG_PIXI)
		{
			PIXI.DisplayObjectContainer.call(this);
		}	
	};
	
	// Shortcut reference to the prototype
	var p;
	
	// Extends the container
	if (CONFIG_CREATEJS)
	{
		p = Application.prototype = new createjs.Container();
	}
	// Extends the PIXI display object
	else if (CONFIG_PIXI)
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