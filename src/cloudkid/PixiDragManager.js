(function() {
	
	/**
	*  [CreateJS only] Drag manager is responsible for handling the dragging of stage elements
	*  supports click-n-stick and click-n-drag functionality
	*  @class cloudkid.DragManager
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
	* The object that's being dragged
	* @public
	* @readOnly
	* @property {PIXI.DisplayObject} draggedObj
	*/
	p.draggedObj = null;
	
	/**
	* The local to global position of the drag
	* @private
	* @property {PIXI.Point} _dragOffset
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
	* @property {PIXI.Point} mouseDownStagePos
	*/
	p.mouseDownStagePos = null;

	/**
	* The position x, y of the object when interaction with it started.
	* @private
	* @property {PIXI.Point} mouseDownObjPos
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
	* If sticky click dragging is allowed.
	* @public
	* @readOnly
	* @property {Bool} allowStickyClick
	* @default true
	*/
	p.allowStickyClick = true;
	
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
	
	var helperPoint = null;
	
	var TYPE_MOUSE = 0;
	var TYPE_TOUCH = 1;
	
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
		this.mouseDownStagePos = new PIXI.Point(0, 0);
		this.mouseDownObjPos = new PIXI.Point(0, 0);
		helperPoint = new PIXI.Point(0, 0);
	};
	
	/**
	*	Manually starts dragging an object. If a mouse down event is not supplied as the second argument, it 
	*   defaults to a held drag, that ends as soon as the mouse is released.
	*  @method startDrag
	*  @public
	*  @param {PIXI.DisplayObject} object The object that should be dragged.
	*  @param {PIXI.InteractionData} interactionData The interaction data about the input event that triggered this.
	*/
	p.startDrag = function(object, interactionData)
	{
		this._objMouseDown(TYPE_MOUSE, object, interactionData);
	};
	
	/**
	* Mouse down on an obmect
	*  @method _objMouseDown
	*  @private
	*  @param {int} type The type of input that triggered this call - either TYPE_MOUSE or TYPE_TOUCH.
	*  @param {PIXI.DisplayObject} object The object that should be dragged.
	*/
	p._objMouseDown = function(type, obj, interactionData)
	{
		// if we are dragging something, then ignore any mouse downs
		// until we release the currently dragged stuff
		if(this.draggedObj !== null) return;

		this.draggedObj = obj;
		createjs.Tween.removeTweens(this.draggedObj);
		createjs.Tween.removeTweens(this.draggedObj.position);
		
		//get the mouse position and convert it to object parent space
		this._dragOffset = interactionData.getLocalPosition(this.draggedObj.parent);
		
		//move the offset to respect the object's current position
		this._dragOffset.x -= this.draggedObj.position.x;
		this._dragOffset.y -= this.draggedObj.position.y;

		this.mouseDownObjPos.x = this.draggedObj.position.x;
		this.mouseDownObjPos.y = this.draggedObj.position.y;
		
		this.mouseDownStagePos.x = interactionData.global.x;
		this.mouseDownStagePos.y = interactionData.global.y;
		if(!this.allowStickyClick || type == TYPE_TOUCH)//if it is a touch event, force it to be the held drag type
		{
			this.isTouchMove = type == TYPE_TOUCH;
			this.isHeldDrag = true;
			this._startDrag();
		}
		else//otherwise, wait for a movement or a mouse up in order to do a held drag or a sticky click drag
		{
			this.draggedObj.mousemove = this._triggerHeldDragCallback;
			this._theStage.interactionManager.stageUp = this._triggerStickyClickCallback;
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
		this.draggedObj.mousemove = null;
		this._theStage.interactionManager.stageUp = null;
		this._startDrag();
	};

	/**
	* Start hold dragging
	* @method _triggerHeldDrag
	* @private
	* @param {PIXI.InteractionData} interactionData The ineraction data about the moved mouse
	*/
	p._triggerHeldDrag = function(interactionData)
	{
		var xDiff = interactionData.global.x - this.mouseDownStagePos.x;
		var yDiff = interactionData.global.y - this.mouseDownStagePos.y;
		if(xDiff * xDiff + yDiff * yDiff >= this.dragStartThreshold * this.dragStartThreshold)
		{
			this.isHeldDrag = true;
			this.draggedObj.mousemove = null;
			this._theStage.interactionManager.stageUp = null;
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
		var im = this._theStage.interactionManager;
		im.stageUp = this._stageMouseUpCallback;
		this.draggedObj.mousemove = this.draggedObj.touchmove = this._updateCallback;
		
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
	p._stopDrag = function(origMouseEv, doCallback)
	{
		if(this.draggedObj)
			this.draggedObj.touchmove = this.draggedObj.mousemove = null;
		var im = this._theStage.interactionManager;
		im.stageUp = null;
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
	* @param {PIXI.InteractionData} interactionData Mouse move event
	*/
	p._updateObjPosition = function(interactionData)
	{
		if(!this.isTouchMove && !this._theStage.interactionManager.mouseInStage) return;
		if(!this.draggedObj || !this.draggedObj.parent)//not quite sure what chain of events would lead to this, but we'll stop dragging to be safe
		{
			this._stopDrag(null, false);
			return;
		}
		
		var mousePos = interactionData.getLocalPosition(this.draggedObj.parent, helperPoint);
		var bounds = this.draggedObj._dragBounds;
		this.draggedObj.position.x = clamp(mousePos.x - this._dragOffset.x, bounds.x, bounds.right);
		this.draggedObj.position.y = clamp(mousePos.y - this._dragOffset.y, bounds.y, bounds.bottom);
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
		this.mousedown = this._onMouseDownListener;
		this.touchstart = this._onTouchStartListener;
		this.buttonMode = this.interactive = true;
	};
	
	var disableDrag = function()
	{
		this.mousedown = this.touchstart = null;
		this.buttonMode = this.interactive = false;
	};
	
	var _onMouseDown = function(type, mouseData)
	{
		this._dragMan._objMouseDown(type, this, mouseData);
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
			var canvas = cloudkid.OS.instance._renderer.view;
			bounds = {x:0, y:0, width:canvas.width, height:canvas.height};
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
		obj._onMouseDownListener = _onMouseDown.bind(obj, TYPE_MOUSE);
		obj._onTouchStartListener = _onMouseDown.bind(obj, TYPE_TOUCH);
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
		var index = this._draggableObjects.indexOf(obj);
		if(index >= 0)
		{
			obj.disableDrag();
			delete obj.enableDrag;
			delete obj.disableDrag;
			delete obj._onMouseDownListener;
			delete obj._onTouchStartListener;
			delete obj._dragMan;
			delete obj._dragBounds;
			this._draggableObjects.splice(index, 1);
		}
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
			this._stopDrag(null, false);
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