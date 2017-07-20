
// JavaScript has no 'class-defining' statements or declarations: instead we
// simply create a new object type by defining its constructor function, and
// add member methods/functions using JavaScript's 'prototype' feature.
//
// The object prototypes below (and their comments) are suitable for any and all
// features described in the Ray-Tracing Project Assignment Sheet.
//
// HOWEVER, they're not required, nor even particularly good:
//				(notably awkward style from their obvious C/C++ origins) 
// They're here to help you get 'started' on better code of your own,
// and to help you avoid common structural 'traps' in writing ray-tracers
//		that might otherwise force ugly/messy refactoring later, such as:
//  --lack of a well-polished vector/matrix library; e.g. open-src glmatrix.js
//  --lack of floating-point RGB values to compute light transport accurately,
//	--no distinct 'camera', 'image', and 'window' objects to separate lengthy 
//		ray-tracing calculations from screen display and refresh.
//	--lack of ray-trace image-buffer; STOP! resize-window discards your work! 
//  --lack of texture-mapped image display; permit ray-traced image of any 
//		resolution to display on any screen at any desired image size
//  --the need to describe geometry/shape independently from surface materials,
//		and to select material(s) for each shape from a list of materials
//  --materials that permit procedural 3D textures, turbulence & Perlin Noise,  
//	--need to describe light sources independently, and possibly inherit their
//		location from a geometric shape (e.g. a light-bulb shape).
//  --need to create a sortable LIST of ray/object hit-points, and not just
//		the intersection nearest to the eyepoint, to enable shape-creation by
//		Constructive Solid Geometry (CSG), and to streamline transparency effects
//  --functions organized well to permit easy recursive ray-tracing:  don't 
//		tangle together ray/object intersection-finding tasks with shading, 
//		lighting, and materials-describing tasks.(e.g. traceRay(), findShade() )
//	--the need to match openGL/WebGL functions with ray-tracing results. 
//		Do it by constructing matching ray-tracing functions for cameras, views, 
//		transformations, lighting, and materials (e.g. rayFrustum(), rayLookAt(); 
//		rayTranlate(), rayRotate(), rayScale()...)
//  --need straightforward method to implement scene graphs & jointed objects. 
//		Do it by transforming world-space rays to model coordinates, rather than 
//		models to world coords, using a 4x4 worl2model matrix stored in each 
//		model (each CGeom primitive).  Set it by OpenGL-like functions 
//		rayTranslate(), rayRotate(), rayScale(), etc.


function CRay() {
//==============================================================================
// Object for a ray in an unspecified coord. system (usually 'world' coords).
	this.orig = vec4.fromValues(0,0,0,1);			// Ray starting point (x,y,z,w)
																						// (default: at origin
	this.dir = 	vec4.fromValues(0,0,5,0);			// The ray's direction vector 
																						// (default: look down -z axis)

}

CRay.prototype.printMe = function() {
//==============================================================================
// print ray's values in the console window:

	if(name == undefined) name = ' ';

	console.log('CRay::' + this.constructor.name + '.origin:\t' + this.orig[0] 
	+',\t'+ this.orig[1] +',\t'+ this.orig[2] +',\t'+ this.orig[3]);
	console.log('     ', + this.constructor.name + '.direction:\t' + this.dir[0] 
	+',\t'+  this.dir[1] + '\t'+  this.dir[2] +',\t'+ this.dir[3]);
}

function CCamera() {
//==============================================================================
// Object for a ray-tracing camera defined the 'world' coordinate system, with
// a) -- 'extrinsic' parameters that set the camera's position and aiming
//	from the camera-defining UVN coordinate system 
// (coord. system origin at the eye-point; coord axes U,V define camera image 
// horizontal and vertical; camera gazes along the -N axis): 
// Default settings: put camera eye-point at world-space origin, and
	this.eyePt = vec4.fromValues(0,0,0,1);
	this.uAxis = vec4.fromValues(1,0,0,0);	// camera U axis == world x axis			
  this.vAxis = vec4.fromValues(0,1,0,0);	// camera V axis == world y axis
  this.nAxis = vec4.fromValues(0,0,1,0);	// camera N axis == world z axis.
		  	// (and thus we're gazing down the -Z axis with default camera). 

// b) --  Camera 'intrinsic' parameters that set the camera's optics and images.
// They define the camera's image frustum: its image plane is at N = -znear  
// (the plane that 'splits the universe', perpendicular to N axis), and no 
// 'zfar' plane at all (not needed: ray-tracer doesn't have or need the CVV).  
// The ray-tracing camera creates an rectangular image plane perpendicular to  
//	the cam-coord. system N axis at -iNear(defined by N vector in world coords),
// 			horizontally	spanning 'iLeft' <= u <= 'iRight' along the U vector, and
//			vertically    spanning  'iBot' <= v <=  'iTop' along the V vector. 
// As the default camera creates an image plane at distance iNear = 1 from the 
// camera's center-of-projection (at the u,v,n origin), these +/-1 
// defaults define a square ray-traced image with a +/-45-degree field-of-view:

//rayFrustum = function(left, right, bottom, top, near, far)
  //this.rayFrustum(-1, 1, -1, 1, 1);
  this.rayFrustum(Math.tan(15),-Math.tan(15), -1,1, 1,1);
  /*
	this.iNear = 1;
	this.iLeft = -1.0;		
	this.iRight = 1.0;
	this.iBot =  -1.0;
	this.iTop =   1.0; */
// And the lower-left-most corner of the image is at (u,v,n) = (iLeft,iBot,-1).
	this.xmax = 256;			// horizontal,
	this.ymax = 256;			// vertical image resolution.
// To ray-trace an image of xmax,ymax pixels, divide this rectangular image 
// plane into xmax,ymax rectangular tiles, and shoot eye-rays from the camera's
// center-of-projection through those tiles to find scene color values.  
// --For the simplest, fastest image (without antialiasing), trace each eye-ray 
// through the CENTER of each tile to find pixel colors.  
// --For slower, better-looking, anti-aliased image making, apply jittered 
// super-sampling: For each pixel:
//			--subdivide the 'tile' into equal-sized 'sub-tiles';
//			--trace one ray per sub-tile, but randomize (jitter) the ray's position 
//					within the sub-tile,
//			--set pixel color to the average of all sub-tile colors. 
// Let's do that:

// Divide the image plane into rectangular tiles, one for each pixel:
	this.ufrac = (this.iRight - this.iLeft) / this.xmax;	// pixel tile's width
	this.vfrac = (this.iTop   - this.iBot ) / this.ymax;	// pixel tile's height.
}

CCamera.prototype.setEyeRay = function(myeRay, xpos, ypos) {
//==============================================================================
// Set values of a CRay object to specify a ray in world coordinates that 
// originates at the camera's eyepoint (its center-of-projection: COP) and aims 
// in the direction towards the image-plane location (xpos,ypos) given in units 
// of pixels.  The ray's direction vector is *NOT* normalized.
//
// !CAREFUL! Be SURE you understand these floating-point xpos,ypos arguments!
// For the default CCamera (+/-45 degree FOV, xmax,ymax == 256x256 resolution) 
// the function call makeEyeRay(0,0) creates a ray to the image rectangle's 
// lower-left-most corner at U,V,N = (iLeft,iBot,-1), and the function call
// makeEyeRay(256,256) creates a ray to the image rectangle's upper-left-most  
// corner at U,V,N = (iRight,iTop,-1). 
//	To get the eye ray for pixel (x,y), DON'T call setEyeRay(myRay, x,y);
//                                   instead call setEyeRay(myRay,x+0.5,y+0.5)
// (Later you will trace multiple eye-rays per pixel to implement antialiasing) 
// WHY?  
//	-- because the half-pixel offset (x+0.5, y+0.5) traces the ray through the
//     CENTER of the pixel's tile, and not its lower-left corner.
// As we learned in class (and from optional reading "A Pixel is Not a Little 
// Square" by Alvy Ray Smith), a pixel is NOT a little square -- it is a 
// point-like location, one of many in a grid-like arrangement, where we store 
// a neighborhood summary of an image's color(s).  While we could (and often 
// do) define that pixel's 'neighborhood' as a small tile of the image plane, 
// and summarize its color as the tile's average color, it is not our only 
// choice and certainly not our best choice.  
// (ASIDE: You can dramatically improve the appearance of a digital image by 
//     making pixels  that summarize overlapping tiles by making a weighted 
//     average for the neighborhood colors, with maximum weight at the pixel 
//     location, and with weights that fall smoothly to zero as you reach the 
//     outer limits of the pixel's tile or 'neighborhood'. Google: antialiasing 
//     bilinear filter, Mitchell-Netravali piecewise bicubic prefilter, etc).

// Convert image-plane location (xpos,ypos) in the camera's U,V,N coords:
var posU = this.iLeft + xpos*this.ufrac; 	// U coord,
var posV = this.iBot  + ypos*this.vfrac;	// V coord,
//  and the N coord is always -1, at the image-plane (zNear) position.
// Then convert this point location to world-space X,Y,Z coords using our 
// camera's unit-length coordinate axes uAxis,vAxis,nAxis
 xyzPos = vec4.create();    // make vector 0,0,0,0.	
	vec4.scaleAndAdd(xyzPos, xyzPos, this.uAxis, posU); // xyzPos += Uaxis * posU;
	vec4.scaleAndAdd(xyzPos, xyzPos, this.vAxis, posV); // xyzPos += Vaxis * posU;
  vec4.scaleAndAdd(xyzPos, xyzPos, this.nAxis, -this.iNear); 
  // 																								xyzPos += Naxis * (-1)
  // NEXT, WE --COULD-- 
  // finish converting from UVN coordinates to XYZ coordinates: we made a
  // weighted sum of the U,V,N axes; now add UVN origin point, and we
  // would get (xyzPos + eyePt).
  // BUT WE DON'T NEED TO DO THAT.
  // The eyeRay we want consists of just 2 world-space values:
  //  	-- the ray origin == camera origin == eyePt in XYZ coords
  //		-- the ray direction TO image-plane point FROM ray origin;
  //				myeRay.dir = (xyzPos + eyePt) - eyePt = xyzPos; thus
	vec4.copy(myeRay.orig, this.eyePt);	
	vec4.copy(myeRay.dir, xyzPos);
}



CCamera.prototype.makeEyeRay = function(PxOrig, xSize, ySize, pixSize) {

  this.PxRayList = [];

  for(var j=0; j< ySize; j ++) {            // for the j-th row of pixels
    for(var i=0; i< xSize; i ++) {          // and the i-th pixel on that row,
      var idx = (j*xSize + i)*pixSize;  // Array index at pixel (i,j) 

      xpos = i;
      ypos = j;

      var posU = this.iLeft + xpos*this.ufrac;  // U coord,
      var posV = this.iBot  + ypos*this.vfrac;  // V coord,

      xyzPos = vec4.create();    // make vector 0,0,0,0. 
      vec4.scaleAndAdd(xyzPos, xyzPos, this.uAxis, posU); // xyzPos += Uaxis * posU;
      vec4.scaleAndAdd(xyzPos, xyzPos, this.vAxis, posV); // xyzPos += Vaxis * posU;
      vec4.scaleAndAdd(xyzPos, xyzPos, this.nAxis, -this.iNear);  
      
      ray = new CRay()
      vec4.copy(ray.orig, PxOrig); 
      vec4.copy(ray.dir, xyzPos);

      this.PxRayList.push(ray);
    }
  }
}



CCamera.prototype.printMe = function() {
//==============================================================================
// print CCamera object's current contents in console window:
	//
	// YOU WRITE THIS (see CRay.prototype.printMe() function above)
	//
	if(name == undefined) name = ' ';

		console.log('CCamera::' + this.constructor.name + '.eye-point:\t' + this.eyePt[0] +',\t'+ this.eyePt[1] +',\t'+ this.eyePt[2] +',\t'+ this.eyePt[3]);
		console.log('     ', + this.constructor.name + '.Camera U axis:\t' + this.uAxis[0] +',\t'+  this.uAxis[1] + '\t'+  this.uAxis[2] +',\t'+ this.uAxis[3]);
		console.log('     ', + this.constructor.name + '.Camera V axis:\t' + this.vAxis[0] +',\t'+  this.vAxis[1] + '\t'+  this.vAxis[2] +',\t'+ this.vAxis[3]);
		console.log('     ', + this.constructor.name + '.Camera N axis:\t' + this.nAxis[0] +',\t'+  this.nAxis[1] + '\t'+  this.nAxis[2] +',\t'+ this.nAxis[3]);
	
}

CCamera.prototype.rayLookAt = function(eyeX, eyeY, eyeZ, centerX, centerY, centerZ, upX, upY, upZ) {
	var fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;
	fx = centerX - eyeX;
  	fy = centerY - eyeY;
  	fz = centerZ - eyeZ;
  	//eyeY = eyeY + 1.35;
  	//eyeX = eyeX + 1.35;
  	// Normalize f.
  rlf = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
  fx *= rlf;
  fy *= rlf;
  fz *= rlf;

   // Calculate cross product of f and up.
  sx = fy * upZ - fz * upY;
  sy = fz * upX - fx * upZ;
  sz = fx * upY - fy * upX;

  // Normalize s.
  rls = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
  sx *= rls;
  sy *= rls;
  sz *= rls;

  // Calculate cross product of s and f.
  ux = sy * fz - sz * fy;
  uy = sz * fx - sx * fz;
  uz = sx * fy - sy * fx;

  this.uAxis[0] = sx;
  this.uAxis[1] = sy;
  this.uAxis[2] = sz;

  this.vAxis[0] = ux;
  this.vAxis[1] = uy;
  this.vAxis[2] = uz;

  this.nAxis[0] = -fx;
  this.nAxis[1] = -fy;
  this.nAxis[2] = -fz;

  this.eyePt[0] = eyeX; // + 0.8;
  this.eyePt[1] = eyeY; // + 0.8;
  this.eyePt[2] = eyeZ; // - 0.45;

  //console.log(this.eyePt);
}


CCamera.prototype.rayFrustum = function(left, right, bottom, top, near) {

  this.iNear = near;
  this.iLeft = left;    
  this.iRight = right;
  this.iBot =  bottom;
  this.iTop =   top; 

}

//=============================================================================
// allowable values for CGeom.shapeType variable.  Add some of your own!
const JT_GNDPLANE = 0;    // An endless 'ground plane' surface.
const JT_SPHERE   = 3;    // A sphere.
const JT_SPHERE2   = 4;
const JT_SPHERE3   = 1;
const JT_SPHERE4   = 2;
const JT_BOX      = 5;    // An axis-aligned cube.
const JT_BOX2      = 6;
const JT_BOX3      = 7;
const JT_BOX4      = 8;
const JT_GNDPLANE2   = 9;
const JT_NOTHING    = 0;
const JT_GNDPLANE_CHECKBOARD = 100;




 const JT_CYLINDER = 50;    // A cylinder with user-settable radius at each end
//                         // and user-settable length.  radius of 0 at either
//                         // end makes a cone; length of 0 with nonzero
//                         // radius at each end makes a disk.

// const JT_DISK     = 20;
// const JT_DISK1    = 30;

// const JT_TRIANGLE = 60;    // a triangle with 3 vertices.
// const JT_BLOBBIES = 70;    // Implicit surface:Blinn-style Gaussian 'blobbies'.


const JT_HITLIST_MAX = 10;
var checkBoard = false;




var matlSel= MATL_RED_PLASTIC;        // see keypress(): 'm' key changes matlSel
var matl0 = new Material(matlSel);  

function CGeom(shapeSelect) {
//==============================================================================
// Generic object for a geometric shape.  
// Each instance describes just one shape, but you can select from several 
// different kinds of shapes by setting the 'shapeType' member.  CGeom can 
// describe ANY shape, including sphere, box, cone, quadric, etc. and it holds 
// all/any variables needed for each shapeType.
//
// Advanced Version: try it!
//        Ray tracing lets us position and distort these shapes in a new way;
// instead of transforming the shape itself for 'hit' testing against a traced
// ray, we transform the 3D ray by the matrix 'world2model' before the hit-test.
// This matrix simplifies our shape descriptions, because we don't need
// separate parameters for position, orientation, scale, or skew.  For example,
// JT_SPHERE and JT_BOX need NO parameters--they each describe a unit sphere or
// unit cube centered at the origin.  To get a larger, rotated, offset sphere
// or box, just set the parameters in world2model matrix. Note that you can 
// scale the box or sphere differently in different directions, forming 
// ellipsoids for the unit sphere and rectangles (or prisms) from the unit box.
//if(shapeSelect == undefined) shapeSelect = JT_GNDPLANE; // default
  //this.gapColor = vec4.fromValues( 51/255, 51/255, 51/255,1.0);  // near-white
  this.gapColor = vec4.fromValues( 140/255, 220/255, 255/255,1.0);  // near-white
  if(g_show1){
	
    switch(shapeSelect){

      case JT_GNDPLANE:

        this.shapeType = JT_GNDPLANE;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        // Ground-plane 'Line-grid' parameters:
        this.zGrid = -5;  // create line-grid on the unbounded plane at z=zGrid
        this.xgap = 1;  // line-to-line spacing
        this.ygap = 1;
        this.lineWidth = 0.1; // fraction of xgap used for grid-line width
        this.hitColor = vec4.fromValues(1,1,1,1.0);  // RGBA green(A== opacity)
        
      break;
      case JT_GNDPLANE2:

        this.shapeType = JT_GNDPLANE2;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        // Ground-plane 'Line-grid' parameters:
        this.zGrid = -6;  // create line-grid on the unbounded plane at z=zGrid
        this.xgap = 1;  // line-to-line spacing
        this.ygap = 1;
        this.lineWidth = 0.1; // fraction of xgap used for grid-line width
        this.hitColor = vec4.fromValues(1,1,1,1.0);  // RGBA green(A== opacity)
        
      break;
      
      case JT_BOX:
        this.shapeType = JT_BOX;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sideWall = 1;
        this.frontWall = 1;
        this.aboveWall = 1;
        this.xgap = Math.pow(0.3,3);  // line-to-line spacing
        this.ygap = Math.pow(0.3,3);
        this.zgap = Math.pow(0.3,3);
        this.hitColor = vec4.fromValues(0.8,0.5,0.5,1.0);
        this.rayTranslate(-2,3,-3);
        this.rayScale(0.5,0.5,0.5);

      break;
      case JT_BOX2:
        this.shapeType = JT_BOX;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sideWall = 1;
        this.frontWall = 1;
        this.aboveWall = 1;
        this.xgap = Math.pow(0.3,3);  // line-to-line spacing
        this.ygap = Math.pow(0.3,3);
        this.zgap = Math.pow(0.3,3);
        this.hitColor = vec4.fromValues(0.8,0.5,0.5,1.0);
        this.rayTranslate(4,0,-3);
        this.rayScale(0.1,0.2,4);

      break;
      case JT_BOX3:
        this.shapeType = JT_BOX;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sideWall = 1;
        this.frontWall = 1;
        this.aboveWall = 1;
        this.xgap = Math.pow(0.3,3);  // line-to-line spacing
        this.ygap = Math.pow(0.3,3);
        this.zgap = Math.pow(0.3,3);
        this.hitColor = vec4.fromValues(0.8,0.5,0.5,1.0);
        this.rayTranslate(1,2,-4);
        this.rayRotate(-15,0,1,0);
        this.rayScale(0.7,0.5,0.2);
        this.rayRotate(45,1,1,0);

      break;
      case JT_BOX4:
        this.shapeType = JT_BOX;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sideWall = 1;
        this.frontWall = 1;
        this.aboveWall = 1;
        this.xgap = Math.pow(0.3,3);  // line-to-line spacing
        this.ygap = Math.pow(0.3,3);
        this.zgap = Math.pow(0.3,3);
        this.hitColor = vec4.fromValues(0.8,0.5,0.5,1.0);
        this.rayTranslate(-5,0,-3);
        this.rayScale(0.1,2,1);

      break;
      case JT_SPHERE:

        this.shapeType = JT_SPHERE;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sphereCenter = 0;
        this.sphereRad = 1;
        this.xgap = 0.5;
        this.ygap = 0.5;
        this.zgap = 0.5;
        this.hitColor = vec4.fromValues(0.8,0.5,1,1.0);
        matlSel = (5)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 

        this.rayTranslate(-2.5,0,-3);
        //this.rayRotate(90,0,0,1);
        //this.rayScale(0.5,0.5,0.5);
      break;
      case JT_SPHERE2:
        this.shapeType = JT_SPHERE;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sphereCenter = 0;
        this.sphereRad = 1;
        this.xgap = 0.5;
        this.ygap = 0.5;
        this.zgap = 0.5;
        this.hitColor = vec4.fromValues(0.8,0.5,1,1.0);
        matlSel = (6)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, &
    
        this.rayTranslate(-0.5,-1,-1);
        //this.rayRotate(90,0,0,1);
        this.rayScale(1.5,0.1,0.5);
      break;
      case JT_SPHERE3:
        this.shapeType = JT_SPHERE;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sphereCenter = 0;
        this.sphereRad = 1;
        this.xgap = 0.5;
        this.ygap = 0.5;
        this.zgap = 0.5;
        this.hitColor = vec4.fromValues(0.8,0.5,1,1.0);
        matlSel = (19)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, &
    
        this.rayTranslate(2,0,-2);
        this.rayRotate(-15,0,1,0);
        this.rayScale(1,1,2);
      break;
      case JT_SPHERE4:
        this.shapeType = JT_SPHERE;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sphereRad = 1;
        this.hitColor = vec4.fromValues(0.8,0.5,1,1.0);
        matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, &
    
        this.rayTranslate(0,0,-3);
        //this.rayRotate(-35,0,1,0);
        this.rayScale(1,1,1);
      break;
      case JT_CYLINDER:

        this.shapeType = JT_SPHERE;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();

        this.sphereRad = 1;
        this.height = 1;
        this.hitColor = vec4.fromValues(0.8,0.5,1,1.0);

        matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, &
    
        this.rayTranslate(-0.5,0,-3);
        //this.rayRotate(-35,0,1,0);
        this.rayScale(1.3,1.3,1.3);

      break;

    }
  }
  else{
      
    switch(shapeSelect){

      case JT_GNDPLANE:

        this.shapeType = JT_GNDPLANE_CHECKBOARD;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        // Ground-plane 'Line-grid' parameters:
        this.zGrid = -6;  // create line-grid on the unbounded plane at z=zGrid
        this.xgap = 1;  // line-to-line spacing
        this.ygap = 1;
        this.lineWidth = 0.1; // fraction of xgap used for grid-line width
        this.hitColor = vec4.fromValues(1,1,1,1.0);  // RGBA green(A== opacity)
        this.rayRotate(30,0,0,1);
        
      break;
      case JT_GNDPLANE2:

        this.shapeType = JT_GNDPLANE2;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        // Ground-plane 'Line-grid' parameters:
        this.zGrid = -7;  // create line-grid on the unbounded plane at z=zGrid
        this.xgap = 1;  // line-to-line spacing
        this.ygap = 1;
        this.lineWidth = 0.1; // fraction of xgap used for grid-line width
        this.hitColor = vec4.fromValues(1,1,1,1.0);  // RGBA green(A== opacity)
        
      break;
      
      case JT_BOX:
        this.shapeType = JT_BOX;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sideWall = 1;
        this.frontWall = 1;
        this.aboveWall = 1;
        this.xgap = Math.pow(0.3,3);  // line-to-line spacing
        this.ygap = Math.pow(0.3,3);
        this.zgap = Math.pow(0.3,3);
        this.hitColor = vec4.fromValues(0.8,0.5,0.5,1.0);
        this.rayTranslate(-3,3,-4);
        this.rayScale(0.5,0.5,0.5);

      break;
      case JT_BOX2:
        this.shapeType = JT_BOX;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sideWall = 1;
        this.frontWall = 1;
        this.aboveWall = 1;
        this.xgap = Math.pow(0.3,3);  // line-to-line spacing
        this.ygap = Math.pow(0.3,3);
        this.zgap = Math.pow(0.3,3);
        this.hitColor = vec4.fromValues(0.8,0.5,0.5,1.0);
        this.rayTranslate(4,-2,-3);
        this.rayScale(0.1,0.2,2);

      break;
      case JT_BOX3:
        this.shapeType = JT_BOX;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sideWall = 1;
        this.frontWall = 1;
        this.aboveWall = 1;
        this.xgap = Math.pow(0.3,3);  // line-to-line spacing
        this.ygap = Math.pow(0.3,3);
        this.zgap = Math.pow(0.3,3);
        this.hitColor = vec4.fromValues(0.8,0.5,0.5,1.0);
        this.rayTranslate(1,-2,0);
        this.rayScale(0.4,0.4,0.1);

      break;
      case JT_BOX4:
        this.shapeType = JT_BOX;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sideWall = 1;
        this.frontWall = 1;
        this.aboveWall = 1;
        this.xgap = Math.pow(0.3,3);  // line-to-line spacing
        this.ygap = Math.pow(0.3,3);
        this.zgap = Math.pow(0.3,3);
        this.hitColor = vec4.fromValues(0.8,0.5,0.5,1.0);
        this.rayTranslate(-3,-5,-2);
        this.rayRotate(70,0,0,1);
        this.rayScale(0.1,6,5);


      break;
      case JT_SPHERE:

        this.shapeType = JT_SPHERE;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sphereCenter = 0;
        this.sphereRad = 1;
        this.xgap = 0.5;
        this.ygap = 0.5;
        this.zgap = 0.5;
        this.hitColor = vec4.fromValues(0.8,0.5,1,1.0);
        matlSel = (5)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 

        this.rayTranslate(0,3,-4);
        //this.rayRotate(90,0,0,1);
        this.rayScale(0.5,0.5,0.5);
      break;
      case JT_SPHERE2:
        this.shapeType = JT_SPHERE;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sphereCenter = 0;
        this.sphereRad = 1;
        this.xgap = 0.5;
        this.ygap = 0.5;
        this.zgap = 0.5;
        this.hitColor = vec4.fromValues(0.8,0.5,1,1.0);
        matlSel = (6)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, &
    
        this.rayTranslate(-0.5,-1,-1);
        //this.rayRotate(90,0,0,1);
        this.rayScale(1.5,0.1,0.5);
      break;
      case JT_SPHERE3:
        this.shapeType = JT_SPHERE;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sphereCenter = 0;
        this.sphereRad = 1;
        this.xgap = 0.5;
        this.ygap = 0.5;
        this.zgap = 0.5;
        this.hitColor = vec4.fromValues(0.8,0.5,1,1.0);
        matlSel = (19)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, &
    
        this.rayTranslate(3,2,-3.5);
        this.rayRotate(-15,0,1,0);
        this.rayScale(1.5,1.5,1.5);
      break;
      case JT_SPHERE4:
        this.shapeType = JT_SPHERE;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();
        this.sphereRad = 1;
        this.hitColor = vec4.fromValues(0.8,0.5,1,1.0);
        matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, &
    
        this.rayTranslate(-0.5,0,-3.5);
        //this.rayRotate(-35,0,1,0);
        this.rayScale(1.5,1.5,1.5);
      break;
      case JT_CYLINDER:

        this.shapeType = JT_SPHERE;
    
        this.world2model = mat4.create();   // the matrix used to transform rays from
                                        // 'world' coord system to 'model' coords;
                                        // Use this to set shape size, position,
                                        // orientation, and squash/stretch amount.
        this.w2mTranspose = mat4.create();

        this.sphereRad = 1;
        this.height = 1;
        this.hitColor = vec4.fromValues(0.8,0.5,1,1.0);

        matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, &
    
        this.rayTranslate(-0.5,0,-3);
        //this.rayRotate(-35,0,1,0);
        this.rayScale(1.3,1.3,1.3);

      break;
    }
  }
}



CGeom.prototype.FindNormal2 = function(shapeType) {

  switch(shapeType){
    case JT_GNDPLANE:
      
      this.surfNorm = vec4.fromValues(0.0, 0.0, 1.0, 0.0);
      vec4.transformMat4(this.surfNorm, this.surfNorm, this.w2mTranspose);
      vec4.normalize(this.surfNorm,this.surfNorm);
    break;
    case JT_GNDPLANE2:
      
      this.surfNorm = vec4.fromValues(0.0, 0.0, 1.0, 0.0);
      vec4.transformMat4(this.surfNorm, this.surfNorm, this.w2mTranspose);
      vec4.normalize(this.surfNorm,this.surfNorm);
    break;

    case JT_GNDPLANE_CHECKBOARD:
      
      this.surfNorm = vec4.fromValues(0.0, 0.0, 1.0, 0.0);
      vec4.transformMat4(this.surfNorm, this.surfNorm, this.w2mTranspose);
      vec4.normalize(this.surfNorm,this.surfNorm);
    break;

    case JT_SPHERE:
    
      
      this.surfNormVec3 = vec3.fromValues(this.hitPtModel[0], this.hitPtModel[1], this.hitPtModel[2]);
      vec3.transformMat4(this.surfNormVec3, this.surfNormVec3, this.w2mTranspose);
      /////console.log(this.surfNorm);
      /////mat4.multiply(this.surfNorm,this.w2mTranspose,this.surfNorm);
      vec3.normalize(this.surfNormVec3,this.surfNormVec3);
      this.surfNorm = vec4.fromValues(this.surfNormVec3[0],this.surfNormVec3[1],this.surfNormVec3[2],0);


      //this.surfNorm = vec4.fromValues(this.hitPtModel[0], this.hitPtModel[1], this.hitPtModel[2], 0.0);
      //vec4.transformMat4(this.surfNorm, this.surfNorm, this.w2mTranspose);
      //vec4.normalize(this.surfNorm,this.surfNorm);


    break;
    case JT_BOX:
      this.surfNormVec3 = vec3.fromValues(this.wall[0],this.wall[1],this.wall[2]);
      vec3.transformMat4(this.surfNormVec3, this.surfNormVec3, this.w2mTranspose);
      /////console.log(this.surfNorm);
      /////mat4.multiply(this.surfNorm,this.w2mTranspose,this.surfNorm);
      vec3.normalize(this.surfNormVec3,this.surfNormVec3);
      this.surfNorm = vec4.fromValues(this.surfNormVec3[0],this.surfNormVec3[1],this.surfNormVec3[2],0);

    break;

  }
}






CGeom.prototype.traceGridHelper = function(inRay,sel,myCHitList,shapeInd) {
//==============================================================================
// Find intersection of CRay object 'inRay' with grid-plane at z== this.zGrid
// return -1 if ray MISSES the plane
// return  0 if ray hits BETWEEN lines
// return  1 if ray hits ON the lines
// HOW?!?
// 1) we parameterize the ray by 't', so that we can find any point on the
// ray by:
//          Ray(t) = ray.orig + t*ray.dir
// To find where the ray hit the plane, solve for t where R(t) = x,y,zGrid:
//          Ray(t0) = zGrid = ray.orig[2] + t0*ray.dir[2];
//  solve for t0:   t0 = (zGrid - ray.orig[2]) / ray.dir[2]
//  then find x,y value along ray for value t0:
//  hitPoint = ray.orig + t0*ray.dir
//  BUT if t0 <0, we can only hit the plane at points BEHIND our camera;
//  thus the ray going FORWARD through the camera MISSED the plane!.
//
// 2) Our grid-plane exists for all x,y, at the value z=zGrid.
//      location x,y, zGrid is ON the lines on the plane if
//          (x/xgap) has fractional part < linewidth  *OR*
//          (y/ygap) has fractional part < linewidth.
//      otherwise ray hit BETWEEN the lines.
/*
	*
	*
	*
	  YOU WRITE THIS!  
	*
	*
	*
	*
	*/

  //inRay = vec4.transformMat4(inRay,this.world2model,inRay)

  
  myHitListTemp = [];
  switch(sel){

    case JT_GNDPLANE:
      //console.log(inRay.orig);
      this.hitx;
      this.hity;
      this.hitz;
      this.t0;
      this.hitPtWorld = vec4.create();
      this.hitPtModel = vec4.create();
      this.surfNorm;


      modRay = new CRay();
      vec4.transformMat4(modRay.orig,inRay.orig,this.world2model);
      vec4.transformMat4(modRay.dir,inRay.dir,this.world2model);


      t0 = (this.zGrid - modRay.orig[2]) / modRay.dir[2];
      x0 = modRay.orig[0] + modRay.dir[0]*t0;
      y0 = modRay.orig[1] + modRay.dir[1]*t0;
      z0 = modRay.orig[2] + modRay.dir[2]*t0;
      //console.log("z0: " + z0);
      if (z0 == this.zGrid && t0 > 0){
        xfrac = (x0 / this.xgap) - Math.floor(x0 / this.xgap);
        yfrac = (y0 / this.ygap) - Math.floor(y0 / this.ygap);
        if(xfrac < this.lineWidth || yfrac < this.lineWidth && !checkBoard){


          this.hitColor = this.hitColor;
          this.gapColor = this.gapColor;

          t0dir = vec4.create();
          vec4.scale(t0dir, inRay.dir, t0);
          vec4.add(this.hitPtWorld,inRay.orig, t0dir);

          offDir = vec4.create();
          vec4.scale(offDir,inRay.dir, Math.pow(10,-14));
          //vec4.subtract(this.hitPtWorld, this.hitPtWorld, offDir);

          this.hitPtModel = vec4.fromValues(x0,y0,z0,1);

          this.FindNormal2(sel);

          myCHit = new CHit(shapeInd, this.hitPtWorld, this.hitPtModel, this.hitColor, t0, this.surfNorm, inRay, modRay);
          //CHit(JT_obj,hitPtWorld,hitPtModel,EyeRay,color,hitTime)
          if(myCHitList){
            myCHitList.HitList.push(myCHit);
          }
        

          return 0;
        }
        else{

          return 1
        }
      }else{
        return -1
      }
      
    break;
    case JT_GNDPLANE2:
      //console.log(inRay.orig);
      this.hitx;
      this.hity;
      this.hitz;
      this.t0;
      this.hitPtWorld = vec4.create();
      this.hitPtModel = vec4.create();
      this.surfNorm;


      modRay = new CRay();
      vec4.transformMat4(modRay.orig,inRay.orig,this.world2model);
      vec4.transformMat4(modRay.dir,inRay.dir,this.world2model);


      t0 = (this.zGrid - modRay.orig[2]) / modRay.dir[2];
      x0 = modRay.orig[0] + modRay.dir[0]*t0;
      y0 = modRay.orig[1] + modRay.dir[1]*t0;
      z0 = modRay.orig[2] + modRay.dir[2]*t0;
      //console.log("z0: " + z0);
      if (z0 == this.zGrid && t0 > 0){
        xfrac = (x0 / this.xgap) - Math.floor(x0 / this.xgap);
        yfrac = (y0 / this.ygap) - Math.floor(y0 / this.ygap);


          this.hitColor = this.hitColor;
          this.gapColor = this.gapColor;

          t0dir = vec4.create();
          vec4.scale(t0dir, inRay.dir, t0);
          vec4.add(this.hitPtWorld,inRay.orig, t0dir);

          offDir = vec4.create();
          vec4.scale(offDir,inRay.dir, Math.pow(10,-14));
          //vec4.subtract(this.hitPtWorld, this.hitPtWorld, offDir);

          this.hitPtModel = vec4.fromValues(x0,y0,z0,1);

          this.FindNormal2(sel);

          myCHit = new CHit(shapeInd, this.hitPtWorld, this.hitPtModel, this.hitColor, t0, this.surfNorm, inRay, modRay);
          //CHit(JT_obj,hitPtWorld,hitPtModel,EyeRay,color,hitTime)
          if(myCHitList){
            myCHitList.HitList.push(myCHit);
          }

      }else{
        return -1
      }
      
    break;

    case JT_GNDPLANE_CHECKBOARD:
    //console.log(inRay.orig);
      this.hitPtWorld = vec4.create();
      this.hitPtModel = vec4.create();
      this.surfNorm;
      modRay = new CRay();
      vec4.transformMat4(modRay.orig,inRay.orig,this.world2model);
      vec4.transformMat4(modRay.dir,inRay.dir,this.world2model);


      t0 = (this.zGrid - modRay.orig[2]) / modRay.dir[2];
      x0 = modRay.orig[0] + modRay.dir[0]*t0;
      y0 = modRay.orig[1] + modRay.dir[1]*t0;
      z0 = modRay.orig[2] + modRay.dir[2]*t0;
      //console.log("z0: " + z0);
      if (z0 == this.zGrid && t0 > 0){
          if(true){

        t0dir = vec4.create();
        vec4.scale(t0dir, inRay.dir, t0);
        vec4.add(this.hitPtWorld,inRay.orig, t0dir);

        offDir = vec4.create();
        vec4.scale(offDir,inRay.dir, Math.pow(10,-14));
        //vec4.subtract(this.hitPtWorld, this.hitPtWorld, offDir);

        this.hitPtModel = vec4.fromValues(x0,y0,z0,1);

        this.FindNormal2(sel);

        myCHit = new CHit(shapeInd, this.hitPtWorld, this.hitPtModel, this.hitColor, t0, this.surfNorm, inRay, modRay);
        //CHit(JT_obj,hitPtWorld,hitPtModel,EyeRay,color,hitTime)
        if(myCHitList){
          myCHitList.HitList.push(myCHit);
        }
        }
      }else{
      }
        
    break;
    
    case JT_CYLINDER:
      this.hitx;
      this.hity;
      this.hitz;  
      this.t0;
      this.hitPtWorld = vec4.create();
      this.hitPtModel = vec4.create();
      this.surfNorm;


      modRay = new CRay();
      vec4.transformMat4(modRay.orig,inRay.orig,this.world2model);
      vec4.transformMat4(modRay.dir,inRay.dir,this.world2model);


      centerSurrfaceT = (0 - modRay.orig[1]) / modRay.dir[1];
      centerSurrfaceX = modRay.orig[0] + modRay.dir[0]*centerSurrfaceT;
      centerSurrfaceY = modRay.orig[1] + modRay.dir[1]*centerSurrfaceT;
      centerSurrfaceZ = modRay.orig[2] + modRay.dir[2]*centerSurrfaceT;
      if (Math.pow(centerSurrfaceX,2) + Math.pow(centerSurrfaceY,2) <= 1 && 0 <= centerSurrfaceZ <= 1){
        //hit the cylinder somewhere

      }


    break;
    case JT_BOX:
      this.hitx;
      this.hity;
      this.hitz;  
      this.t0;
      this.hitPtWorld = vec4.create();
      this.hitPtModel = vec4.create();
      this.surfNorm;

      HitListTemp = [];

      modRay = new CRay();
      vec4.transformMat4(modRay.orig,inRay.orig,this.world2model);
      vec4.transformMat4(modRay.dir,inRay.dir,this.world2model);



      t0 = (this.sideWall - modRay.orig[0]) / modRay.dir[0];
      x0 = modRay.orig[0] + modRay.dir[0]*t0;
      y0 = modRay.orig[1] + modRay.dir[1]*t0;
      z0 = modRay.orig[2] + modRay.dir[2]*t0;
      if (t0>0){
        if(y0*y0 <= this.frontWall && z0*z0 <= this.aboveWall && t0 > 0){
          this.wall = vec4.fromValues(1,0,0,0);
          this.hitx = x0;
          this.hity = y0;
          this.hitz = z0;
          this.t0   = t0;
          this.hitColor = vec4.fromValues(0.2,0.4,0.8,1);
              
              
          t0dir = vec4.create();
          vec4.scale(t0dir, inRay.dir, t0);
          vec4.add(this.hitPtWorld,inRay.orig, t0dir);

          this.hitPtModel = vec4.fromValues(x0,y0,z0,1);
          this.FindNormal2(sel);
              //console.log("sphere")
              //console.log(myHitList);
          myCHit = new CHit(shapeInd, this.hitPtWorld, this.hitPtModel, this.hitColor, t0, this.surfNorm, inRay, modRay);

              //if(myCHitList){
              //  myCHitList.HitList.push(myCHit);
              //}
          HitListTemp.push(myCHit);

          //return 1;
        }
      }
      myCHitList.HitList = myCHitList.HitList;




      t0 = (-this.sideWall - modRay.orig[0]) / modRay.dir[0];
      x0 = modRay.orig[0] + modRay.dir[0]*t0;
      y0 = modRay.orig[1] + modRay.dir[1]*t0;
      z0 = modRay.orig[2] + modRay.dir[2]*t0;
      if (t0>0)
      if(y0*y0 <= this.frontWall && z0*z0 <= this.aboveWall && t0 > 0){

        this.wall = vec4.fromValues(-1,0,0,0);
        this.hitx = x0;
        this.hity = y0;
        this.hitz = z0;
        this.t0   = t0;
        this.hitColor = vec4.fromValues(0.8,0.4,0.8,1);
        
              
        t0dir = vec4.create();
        vec4.scale(t0dir, inRay.dir, t0);
        vec4.add(this.hitPtWorld,inRay.orig, t0dir);

        this.hitPtModel = vec4.fromValues(x0,y0,z0,1);
        this.FindNormal2(sel);
              //console.log("sphere")
              //console.log(myHitList);
        myCHit = new CHit(shapeInd, this.hitPtWorld, this.hitPtModel, this.hitColor, t0, this.surfNorm, inRay, modRay);


        HitListTemp.push(myCHit);
        //return 1;
      }else{
        
      }






      t0 = (this.frontWall - modRay.orig[1]) / modRay.dir[1];
      x0 = modRay.orig[0] + modRay.dir[0]*t0;
      y0 = modRay.orig[1] + modRay.dir[1]*t0;
      z0 = modRay.orig[2] + modRay.dir[2]*t0;
      if (t0>0){
      if(x0*x0 <= this.sideWall && z0*z0 <= this.aboveWall && t0 > 0){

        this.wall = vec4.fromValues(0,1,0,0);
        this.hitx = x0;
        this.hity = y0;
        this.hitz = z0;
        this.t0   = t0;
        
              
        t0dir = vec4.create();
        vec4.scale(t0dir, inRay.dir, t0);
        vec4.add(this.hitPtWorld,inRay.orig, t0dir);

        this.hitPtModel = vec4.fromValues(x0,y0,z0,1);
        this.FindNormal2(sel);
              //console.log("sphere")
              //console.log(myHitList);
        myCHit = new CHit(shapeInd, this.hitPtWorld, this.hitPtModel, this.hitColor, t0, this.surfNorm, inRay, modRay);

              //if(myCHitList){
              //  myCHitList.HitList.push(myCHit);
              //}
        HitListTemp.push(myCHit);
        //return 1;
      }else{
        
      }
    }



      t0 = (-this.frontWall - modRay.orig[1]) / modRay.dir[1];
      x0 = modRay.orig[0] + modRay.dir[0]*t0;
      y0 = modRay.orig[1] + modRay.dir[1]*t0;
      z0 = modRay.orig[2] + modRay.dir[2]*t0;
      if (t0>0){
      if(x0*x0 <= this.sideWall && z0*z0 <= this.aboveWall && t0 > 0){

        this.wall = vec4.fromValues(0,-1,0,0);
        this.hitx = x0;
        this.hity = y0;
        this.hitz = z0;
        this.t0   = t0;
        this.hitColor = vec4.fromValues(0.3,0.1,0.3,1)
              
        t0dir = vec4.create();
        vec4.scale(t0dir, inRay.dir, t0);
        vec4.add(this.hitPtWorld,inRay.orig, t0dir);

        this.hitPtModel = vec4.fromValues(x0,y0,z0,1);
        this.FindNormal2(sel);
              //console.log("sphere")
              //console.log(myHitList);
        myCHit = new CHit(shapeInd, this.hitPtWorld, this.hitPtModel, this.hitColor, t0, this.surfNorm, inRay, modRay);

              //if(myCHitList){
              //  myCHitList.HitList.push(myCHit);
              //}
        HitListTemp.push(myCHit);
        //return 1;
      }else{
        
      }
    }



      t0 = (this.frontWall - modRay.orig[2]) / modRay.dir[2];
      x0 = modRay.orig[0] + modRay.dir[0]*t0;
      y0 = modRay.orig[1] + modRay.dir[1]*t0;
      z0 = modRay.orig[2] + modRay.dir[2]*t0;
      if (t0>0){
      if(x0*x0 <= this.sideWall && y0*y0 <= this.aboveWall && t0 > 0){

        this.wall = vec4.fromValues(0,0,1,0);
        this.hitx = x0;
        this.hity = y0;
        this.hitz = z0;
        this.t0   = t0;
              
              
        t0dir = vec4.create();
        vec4.scale(t0dir, inRay.dir, t0);
        vec4.add(this.hitPtWorld,inRay.orig, t0dir);

        this.hitPtModel = vec4.fromValues(x0,y0,z0,1);
        this.FindNormal2(sel);
              //console.log("sphere")
              //console.log(myHitList);
        myCHit = new CHit(shapeInd, this.hitPtWorld, this.hitPtModel, this.hitColor, t0, this.surfNorm, inRay, modRay);

        //if(myCHitList){
        //  myCHitList.HitList.push(myCHit);
        //}
        HitListTemp.push(myCHit);
        //return 1;
      }else{
        
      }
    }


      t0 = (-this.frontWall - modRay.orig[2]) / modRay.dir[2];
      x0 = modRay.orig[0] + modRay.dir[0]*t0;
      y0 = modRay.orig[1] + modRay.dir[1]*t0;
      z0 = modRay.orig[2] + modRay.dir[2]*t0;
      if (t0>0){
      if(x0*x0 <= this.sideWall && y0*y0 <= this.aboveWall && t0 > 0){

        this.wall = vec4.fromValues(0,0,-1,0);
        this.hitx = x0;
        this.hity = y0;
        this.hitz = z0;
        this.t0   = t0;
              
              
        t0dir = vec4.create();
        vec4.scale(t0dir, inRay.dir, t0);
        vec4.add(this.hitPtWorld,inRay.orig, t0dir);

        this.hitPtModel = vec4.fromValues(x0,y0,z0,1);
        this.FindNormal2(sel);
              //console.log("sphere")
              //console.log(myHitList);
        myCHit = new CHit(shapeInd, this.hitPtWorld, this.hitPtModel, this.hitColor, t0, this.surfNorm, inRay, modRay);

        //if(myCHitList){
        //  myCHitList.HitList.push(myCHit);
        //}
        HitListTemp.push(myCHit);
        //return 1;
      }else{
        //return 0;
      }
    }
      

    HitListTemp = HitListTemp.sort(sortHitt0);
      if(HitListTemp.length > 0){
        myCHitList.HitList.push(HitListTemp[0]);
      //console.log(HitListTemp.length);
      }



      



    break;
    case JT_SPHERE:

      this.hitx;
      this.hity;
      this.hitz;  
      this.t0;

      this.hitPtWorld = vec4.create();
      this.hitPtModel = vec4.create();
      this.surfNorm = vec4.create();

      this.hitPtWorld1 = vec4.create();
      this.hitPtModel1 = vec4.create();
      this.surfNorm1 = vec4.create();

      HitListTemp = [];

      modRay = new CRay();
      vec4.transformMat4(modRay.orig,inRay.orig,this.world2model);
      vec4.transformMat4(modRay.dir,inRay.dir,this.world2model);
      //console.log(modRay.orig)

      torg = modRay.orig;
      tdir = modRay.dir;
      r2s = vec4.fromValues(0 - torg[0],0 - torg[1],0 - torg[2], 0);
      //console.log(r2s)
      L2 = vec4.dot(r2s,r2s);

      tcaS = vec4.dot(tdir,r2s);

      if (L2 > Math.pow(this.sphereRad,2)){
        if(tcaS < 0){
          return 0;
        }else{

        }
      }


      DL2 = vec4.dot(tdir,tdir);

      tca2 = tcaS*tcaS/DL2;

      LM2 = L2 - tca2;
      		if(LM2 > Math.pow(this.sphereRad,2)){
      			//console.log("missed")
      			return 0
      		}else{
      			Lhc2 = Math.pow(this.sphereRad,2) - LM2;
      			if(L2 > Math.pow(this.sphereRad,2)){
      				t0 = tcaS/DL2 - Math.sqrt(Lhc2/DL2);

              t1 = tcaS/DL2 + Math.sqrt(Lhc2/DL2);

              t0 = Math.min(t1,t0);

      				x0 = modRay.orig[0] + modRay.dir[0]*t0;
      				y0 = modRay.orig[1] + modRay.dir[1]*t0;
      				z0 = modRay.orig[2] + modRay.dir[2]*t0;


      				

      				x1 = modRay.orig[0] + modRay.dir[0]*t1;
      				y1 = modRay.orig[1] + modRay.dir[1]*t1;
      				z1 = modRay.orig[2] + modRay.dir[2]*t1;

              
              //console.log(t1 < t0);

              this.hitx = x0;
              this.hity = y0;
              this.hitz = z0;
              this.t0   = t0;
              
              
              t0dir = vec4.create();
              vec4.scale(t0dir, inRay.dir, t0);
              vec4.add(this.hitPtWorld,inRay.orig, t0dir);

              offDir = vec4.create();
              vec4.scale(offDir,inRay.dir, Math.pow(10,-14));
              //vec4.subtract(this.hitPtWorld, this.hitPtWorld, offDir);

              this.hitPtModel = vec4.fromValues(x0,y0,z0,1);
              this.FindNormal2(sel);
              //console.log("sphere")
              //console.log(myHitList);
              myCHit = new CHit(shapeInd, this.hitPtWorld, this.hitPtModel, this.hitColor, t0, this.surfNorm, inRay, modRay);
              myCHit.entering = true;
              //if(myCHitList){
              //  myCHitList.HitList.push(myCHit);
              //}
              HitListTemp.push(myCHit);
              //myHitList.HitList.push();

              //console.log(myHitList);


              
              this.hit1x = x1;
              this.hit1y = y1;
              this.hit1z = z1;
              this.t10   = t1;

              
              t0dir1 = vec4.create();
              vec4.scale(t0dir1, inRay.dir, t1);
              vec4.add(this.hitPtWorld,inRay.orig, t0dir1);

              offDir = vec4.create();
              vec4.scale(offDir,inRay.dir, Math.pow(10,-14));
              //vec4.subtract(this.hitPtWorld, this.hitPtWorld, offDir);

              this.hitPtModel = vec4.fromValues(x1,y1,z1,1);

              this.FindNormal2(sel);

              myCHit = new CHit(shapeInd, this.hitPtWorld, this.hitPtModel, this.hitColor, t1, this.surfNorm, inRay, modRay);
              myCHit.entering = false;
              //if(myCHitList){
              //  myCHitList.HitList.push(myCHit);
              //}
              HitListTemp.push(myCHit);
              //myHitList.HitList.push();


        			//console.log("hit sphere")
              //console.log("sphere");
              //console.log(myHitList);
              
      				//return 1

      			}else{
      				t0 = (tcaS/DL2) + Math.sqrt(Lhc2/DL2)

      				x0 = modRay.orig[0] + modRay.dir[0]*t0;
      				y0 = modRay.orig[1] + modRay.dir[1]*t0;
      				z0 = modRay.orig[2] + modRay.dir[2]*t0;

              this.hitx = x0;
              this.hity = y0;
              this.hitz = z0;
              this.t0   = t0;

              t0dir = vec4.create();
              vec4.scale(t0dir, inRay.dir, t0);
              vec4.add(this.hitPtWorld,inRay.orig, t0dir);

              offDir = vec4.create();
              vec4.scale(offDir,inRay.dir, Math.pow(10,-14));
              //vec4.subtract(this.hitPtWorld, this.hitPtWorld, offDir);

              this.hitPtModel = vec4.fromValues(x0,y0,z0,1);
              this.FindNormal2(sel);

              myCHit = new CHit(shapeInd, this.hitPtWorld, this.hitPtModel, this.hitColor, t0, this.surfNorm, inRay, modRay);
              myCHit.entering = false;
              //if(myCHitList){
              //  myCHitList.HitList.push(myCHit);
              //}
              HitListTemp.push(myCHit);
              //myHitList.HitList.push();
      				//return 1
      			}	

            HitListTemp = HitListTemp.sort(sortHitt0);
            // for (var i = 0; i < HitListTemp.length; i++){
            //   myCHitList.HitList.push(HitListTemp[i]);
            // }
            if(HitListTemp.length > 0){
              myCHitList.HitList.push(HitListTemp[0]);
              //  console.log(HitListTemp.length);
            }
      			
      		}
     




    break;
    case JT_CYLINDER:
    break;
    
  }
	

  


}

CGeom.prototype.rayLoadIdentity = function(x,y,z) {
  //this.world2model.rotate(angle,x,y,z);
  this.world2model = mat4.create();
  this.w2mTranspose = mat4.create();
  //mat4.copy(this.world2model, this.mtran);
  //console.log(this.mtran);
}

CGeom.prototype.rayTranslate = function(x,y,z) {
  //this.world2model.rotate(angle,x,y,z);
  this.mtran = mat4.create();
  this.mtran[12] = -x;
  this.mtran[13] = -y;
  this.mtran[14] = -z;

  mat4.multiply(this.world2model,this.mtran,this.world2model);
  mat4.copy(this.w2mTranspose, this.world2model);
  mat4.transpose(this.w2mTranspose,this.world2model);

  //console.log("this.mtran: " + this.mtran);
  //console.log("this.world2model: " + this.world2model)
  //mat4.copy(this.world2model, this.mtran);
  //console.log(this.mtran);
}


CGeom.prototype.rayRotate = function(angle,x,y,z) {
  //this.world2model.rotate(angle,x,y,z);

  len2 = x*x + y*y + z*z;
  if (len2 != 1){
    if(len2 < Math.pow(10,-15)){
      return;
      console.log("not unit");
    }
    len2 = Math.sqrt(len2);      // find actual vector length, then
    x = x/len2;             // normalize the vector.
    y = y/len2;
    z = z/len2;
  }

  var c = Math.cos(-angle*Math.PI / 180);
  var s = Math.sin(-angle*Math.PI / 180);

  this.mrot = mat4.create();

  this.mrot[0] = x*x*(1-c) + c;
  this.mrot[1] = y*x*(1-c) + z*s;
  this.mrot[2] = z*x*(1-c) - y*s;

  this.mrot[4] = x*y*(1-c) -z*s;
  this.mrot[5] = y*y*(1-c) + c;
  this.mrot[6] = z*y*(1-c) + x*s;

  this.mrot[8] = x*z*(1-c) + y*s;
  this.mrot[9] = y*z*(1-c) - x*s;
  this.mrot[10] = z*z*(1-c) + c;

  mat4.multiply(this.world2model,this.mrot,this.world2model);
  mat4.copy(this.w2mTranspose, this.world2model);
  mat4.transpose(this.w2mTranspose,this.world2model);

  //console.log("this.world2model for rotate: " + this.world2model)
  //console.log("finish rotate")
}

CGeom.prototype.rayScale = function(sx,sy,sz) {
  //this.world2model.rotate(angle,x,y,z);

  this.mscl = mat4.create();
  this.mscl[0] = 1/sx;
  this.mscl[5] = 1/sy;
  this.mscl[10] = 1/sz;


  mat4.multiply(this.world2model,this.mscl,this.world2model);

  mat4.copy(this.w2mTranspose, this.world2model);
  mat4.transpose(this.w2mTranspose,this.world2model);

}




function CImgBuf(wide, tall) {
//==============================================================================
// Construct an 'image-buffer' object to hold a floating-point ray-traced image.
//  Contains BOTH
//	iBuf -- 2D array of 8-bit RGB pixel values we can display on-screen, AND
//	fBuf -- 2D array of floating-point RGB pixel values we often CAN'T display,
//          but contains full-precision results of ray-tracing.
//			--Both buffers hold the same numbers of pixel values (xSiz,ySiz,pixSiz)
//			--imgBuf.int2float() copies/converts current iBuf contents to fBuf
//			--imgBuf.float2int() copies/converts current fBuf contents to iBuf
//	WHY?  
//	--Our ray-tracer computes floating-point light amounts(e.g. radiance L) 
//    but neither our display nor our WebGL texture-map buffers can accept 
//		images with floating-point pixel values.
//	--You will NEED all those floating-point values for applications such as
//    environment maps (re-lighting from sky image) and lighting simulations.
// Stay simple in early versions of your ray-tracer: keep 0.0 <= RGB < 1.0, 
// but later you can modify your ray-tracer 
// to use radiometric units of Radiance (watts/(steradians*meter^2), or convert 
// to use photometric units of luminance (lumens/(steradians*meter^2 or cd/m^2) 
// to compute in physically verifiable units of visible light.

	this.xSiz = wide;							// image width in pixels
	this.ySiz =	tall;							// image height in pixels
	this.pixSiz = 3;							// pixel size (3 for RGB, 4 for RGBA, etc)
	this.iBuf = new Uint8Array(  this.xSiz * this.ySiz * this.pixSiz);	
	this.fBuf = new Float32Array(this.xSiz * this.ySiz * this.pixSiz);
}

CImgBuf.prototype.setTestPattern = function(pattNum) {
//==============================================================================
// Replace current 8-bit RGB contents of 'imgBuf' with a colorful pattern
	// 2D color image:  8-bit unsigned integers in a 256*256*3 array
	// to store r,g,b,r,g,b integers (8-bit)
	// In WebGL texture map sizes MUST be a power-of-two (2,4,8,16,32,64,...4096)
	// with origin at lower-left corner
	// (NOTE: this 'power-of-two' limit will probably vanish in a few years of
	// WebGL advances, just as it did for OpenGL)
	
  // use local vars to set the array's contents.
  console.log();
  for(var j=0; j< this.ySiz; j++) {						// for the j-th row of pixels
  	for(var i=0; i< this.xSiz; i++) {					// and the i-th pixel on that row,
	  	var idx = (j*this.xSiz + i)*this.pixSiz;// Array index at pixel (i,j) 
	  	switch(pattNum) {
	  		case 0:	//================(Colorful L-shape)============================
			  	if(i < this.xSiz/4 || j < this.ySiz/4) {
			  		this.iBuf[idx   ] = i;								// 0 <= red <= 255
			  		this.iBuf[idx +1] = j;								// 0 <= grn <= 255
			  	}
			  	else {
			  		this.iBuf[idx   ] = 0;
			  		this.iBuf[idx +1] = 0;
			  		}
			  	this.iBuf[idx +2] = 255 -i -j;								// 0 <= blu <= 255
			  	break;
			  case 1: //================(bright orange)===============================
			  	this.iBuf[idx   ] = 255;	// bright orange
			  	this.iBuf[idx +1] = 128;
			  	this.iBuf[idx +2] =   0;
	  			break;
	  		default:
	  			console.log("imgBuf.setTestPattern() says: WHUT!?");
	  		break;
	  	}
  	}
  }
  this.int2float();		// fill the floating-point buffer with same test pattern.
}

CImgBuf.prototype.int2float = function() {
//==============================================================================
// Convert the integer RGB image in iBuf into floating-point RGB image in fBuf
for(var j=0; j< this.ySiz; j++) {		// for each scanline
  	for(var i=0; i< this.xSiz; i++) {		// for each pixel on that scanline
  		var idx = (j*this.xSiz + i)*this.pixSiz;// Find array index at pixel (i,j)
			// convert integer 0 <= RGB <= 255 to floating point 0.0 <= R,G,B <= 1.0
  		this.fBuf[idx   ] = this.iBuf[idx   ] / 255.0;	// red
  		this.fBuf[idx +1] = this.iBuf[idx +1] / 255.0;	// grn
  		this.fBuf[idx +2] = this.iBuf[idx +2] / 255.0;	// blu  		
  	}
  }
}

CImgBuf.prototype.float2int = function() {
//==============================================================================
// Convert the floating-point RGB image in fBuf into integer RGB image in iBuf
for(var j=0; j< this.ySiz; j++) {		// for each scanline
  	for(var i=0; i< this.xSiz; i++) {	// for each pixel on that scanline
  		var idx = (j*this.xSiz + i)*this.pixSiz;// Find array index at pixel (i,j)
			// find 'clamped' color values that stay >=0.0 and <=1.0:
  		var rval = Math.min(1.0, Math.max(0.0, this.fBuf[idx   ]));
  		var gval = Math.min(1.0, Math.max(0.0, this.fBuf[idx +1]));
  		var bval = Math.min(1.0, Math.max(0.0, this.fBuf[idx +2]));
			// Divide [0,1] span into 256 equal-sized parts:  Math.floor(rval*256)
			// In the rare case when rval==1.0 you get unwanted '256' result that 
			// won't fit into the 8-bit RGB values.  Fix it with Math.min():
  		this.iBuf[idx   ] = Math.min(255,Math.floor(rval*256.0));	// red
  		this.iBuf[idx +1] = Math.min(255,Math.floor(gval*256.0));	// grn
  		this.iBuf[idx +2] = Math.min(255,Math.floor(bval*256.0));	// blu
  		
  	}
  }
}

CImgBuf.prototype.printPixAt = function(xpix,ypix) {
//==============================================================================
// Use console.log() to print the integer and floating-point values (R,B,B,...)
// stored in our CImgBuf object for the pixel at (xpix,ypix)
		//
		//
		//		YOU WRITE THIS
		//
		//
	if(name == undefined) name = ' ';

		console.log('CImgBuf::' + this.constructor.name + '.xpix:\t' + this.xpix[0] +',\t'+ this.xpix[1] +',\t'+ this.xpix[2]);
		console.log('     ', + this.constructor.name + '.ypix:\t' + this.ypix[0] +',\t'+  this.ypix[1] + '\t'+  this.ypix[2]);
	
}
antialiasing = false;

function CShadowRay(Orig,Dir){
  this.orig = Orig;   // Ray starting point (x,y,z,w)
                                            // (default: at origin
  this.dir =  Dir;     // The ray's direction vector 
                                            // (default: look down -z axis)
}

//var lamp0 = new LightsT();
//var lamp1 = new LightsT();

function CLight(lampInd){
  /*lamp0.I_pos.elements.set( [-6, 0, -2]);

  lamp0.I_ambi.elements.set([0.4, 0.4, 0.4]);
  lamp0.I_diff.elements.set([1.0, 1.0, 1.0]);
  lamp0.I_spec.elements.set([1.0, 1.0, 1.0]);*/

 ////
 //console.log(lamp0.I_pos.elements[0])
 this.I_pos = vec4.create();
 this.I_ambi = vec4.create();
 this.I_diff = vec4.create();
 this.I_spec = vec4.create();
 switch(lampInd){
  case 0:
    if(g_show1){
      this.I_pos = vec4.fromValues(lamp0.I_pos.elements[0], lamp0.I_pos.elements[1], lamp0.I_pos.elements[2],1.0);
      //this.I_pos = vec4.fromValues(0, -5, lamp0.I_pos.elements[2],1.0);
      this.I_ambi = vec4.fromValues(lamp0.I_ambi.elements[0], lamp0.I_ambi.elements[1], lamp0.I_ambi.elements[2],1.0);
      this.I_diff = vec4.fromValues(lamp0.I_diff.elements[0], lamp0.I_diff.elements[1], lamp0.I_diff.elements[2],1.0);
      this.I_spec = vec4.fromValues(lamp0.I_spec.elements[0], lamp0.I_spec.elements[1], lamp0.I_spec.elements[2],1.0);
    }else{
      this.I_pos  = vec4.fromValues(lamp2.I_pos.elements[0], lamp2.I_pos.elements[1], lamp2.I_pos.elements[2],1.0);
      this.I_ambi = vec4.fromValues(lamp2.I_ambi.elements[0], lamp2.I_ambi.elements[1], lamp2.I_ambi.elements[2],1.0);
      this.I_diff = vec4.fromValues(lamp2.I_diff.elements[0], lamp2.I_diff.elements[1], lamp2.I_diff.elements[2],1.0);
      this.I_spec = vec4.fromValues(lamp2.I_spec.elements[0], lamp2.I_spec.elements[1], lamp2.I_spec.elements[2],1.0);
    
    }
    
  break;
  case 1:
  if(g_show1){
      this.I_pos = vec4.fromValues(lamp1.I_pos.elements[0], lamp1.I_pos.elements[1], lamp1.I_pos.elements[2],1.0);
      //this.I_pos = vec4.fromValues(0, -5, lamp0.I_pos.elements[2],1.0);
      this.I_ambi = vec4.fromValues(lamp1.I_ambi.elements[0], lamp1.I_ambi.elements[1], lamp1.I_ambi.elements[2],1.0);
      this.I_diff = vec4.fromValues(lamp1.I_diff.elements[0], lamp1.I_diff.elements[1], lamp1.I_diff.elements[2],1.0);
      this.I_spec = vec4.fromValues(lamp1.I_spec.elements[0], lamp1.I_spec.elements[1], lamp1.I_spec.elements[2],1.0);
  }else{
      this.I_pos = vec4.fromValues(lamp3.I_pos.elements[0], lamp3.I_pos.elements[1], lamp3.I_pos.elements[2],1.0);
      this.I_ambi = vec4.fromValues(lamp3.I_ambi.elements[0], lamp3.I_ambi.elements[1], lamp3.I_ambi.elements[2],1.0);
      this.I_diff = vec4.fromValues(lamp3.I_diff.elements[0], lamp3.I_diff.elements[1], lamp3.I_diff.elements[2],1.0);
      this.I_spec = vec4.fromValues(lamp3.I_spec.elements[0], lamp3.I_spec.elements[1], lamp3.I_spec.elements[2],1.0);
  }
  break;
 }

  this.PtColor = vec4.create();
}

CLight.prototype.LightOn = function(CHit, myCamera) {

  vPos = vec4.fromValues(CHit.HitX, CHit.HitY, CHit.HitZ,1.0);
  //vPos = vec4.fromValues(myGeom.hitPtWorld[0], myGeom.hitPtWorld[1], myGeom.hitPtWorld[2],1.0);
  //ePos = vec4.fromValues(g_EyeX, g_EyeX, g_EyeX,1.0);
  ePos = myCamera.eyePt;
  //console.log()

  //normal = normalize(CHit.surfNorm);
  normal = vec4.create();

  vec4.normalize(normal,CHit.surfNorm);
  //normal[3] = 0;
  //console.log(normal);

  this.applyMat(CHit.JTObj,CHit.hitPtModel);

  this.emissive = vec4.create();
  this.ambient = vec4.create();
  this.diffuse = vec4.create();
  this.speculr = vec4.create();


  this.lightDirection           = vec4.create();
  this.eyeDirection             = vec4.create();
  this.nDotL                    = 0;
  this.H                        = vec4.create();
  this.nDotH                    = 0;
  this.e64                      = 0;
  this.lightreflectionDirection = vec4.create();
  this.phongSpecular            = 0;


  vec4.subtract(this.lightDirection, this.I_pos, vPos);
  vec4.subtract(this.eyeDirection, ePos, vPos);
  //console.log(this.eyeDirection);

  //negEyeRayDir = vec4.create();
  //vec4.negate(negEyeRayDir, CHit.modRay.dir);

  vec4.normalize(this.lightDirection, this.lightDirection);
  vec4.normalize(this.eyeDirection, this.eyeDirection);

  //console.log(this.lightDirection)
  
  nDotLTemp = vec4.create();
  vec4.add(nDotLTemp, this.lightDirection,this.eyeDirection)
  nDotLTempdotsurfNorm = vec4.dot(nDotLTemp, normal);
  this.nDotL = Math.max(nDotLTempdotsurfNorm,0);
  //this.nDotL = Math.max(vec4.dot(this.lightDirection, normal),0);
  //console.log(nDotL)
  //vec4.normalize(this.H, nDotLTemp)

  //this.nDotH = Math.max(vec4.dot(this.H, normal),0.0);

  //this.e64 = Math.pow(this.nDotH, this.K_Shiny);

  this.neglightDirection = vec4.create();
  vec4.negate(this.neglightDirection, this.lightDirection);
  this.lightreflectionDirection = reflect(this.neglightDirection, normal)
  this.phongSpecular = Math.max(vec4.dot(this.lightreflectionDirection, this.eyeDirection),0.0);


  vec4.copy(this.emissive, this.K_e);
  vec4.multiply(this.ambient, this.I_ambi, this.K_a);

  vec4.multiply(this.diffuse, this.I_diff, this.K_d);
  vec4.scale(this.diffuse,this.diffuse,this.nDotL);


  vec4.multiply(this.speculr, this.I_spec, this.K_s);
  vec4.scale(this.speculr,this.speculr, Math.pow(this.phongSpecular, 6.0));
  
  vec4.add4(this.PtColor, this.emissive, this.ambient, this.diffuse, this.speculr);
  

}

function reflect(b, n){
  NL = vec4.dot(b, n)
  C = vec4.create();
  vec4.scale(C, n, NL);

  C2 = vec4.create();
  vec4.scale(C2, C, 2);

  R = vec4.create();
  vec4.subtract(R,b, C2);

  return R;
}

const materials_Ayerdi = 0;
const materials_wood = 1;
const materials_checkerboard = 2;

CLight.prototype.applyMat = function(shapeType,hitPtWorld) {
  //t is the JT_Object index;
  var materials;
  if(g_show1){
    switch(shapeType){
      case JT_GNDPLANE:
        matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        materials = materials_Ayerdi;
      break;

      case JT_GNDPLANE2:
        matlSel = (9)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        materials = materials_Ayerdi;
      break;
      
      case JT_SPHERE:
        matlSel = (1)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        materials = materials_Ayerdi;
        //matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        //matl0 = new Material(matlSel);          // REPLACE our current material, & 
      break;
      case JT_SPHERE2:
        matlSel = (6)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        materials = materials_Ayerdi;
        //matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        //matl0 = new Material(matlSel);          // REPLACE our current material, & 
      break;
      case JT_SPHERE3:
        matlSel = (19)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        materials = materials_Ayerdi;
        //matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        //matl0 = new Material(matlSel);          // REPLACE our current material, & 

      break;
      case JT_SPHERE4:
        matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        materials = materials_Ayerdi;
      break;
      case JT_BOX:
        matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        
        materials = materials_wood;
        break;
      case JT_BOX2:
        matlSel = (1)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        
        materials = materials_checkerboard;
        break;
      case JT_BOX3:
        matlSel = (15)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        
        materials = materials_wood;
        break;
      case JT_BOX4:
        matlSel = (10)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        
        materials = materials_Ayerdi;
        break;

    }
  }else{
    switch(shapeType){
      case JT_GNDPLANE:
        matlSel = (10)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        materials = materials_checkerboard;
      break;
      
      case JT_SPHERE:
        matlSel = (1)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        materials = materials_wood;
        //matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        //matl0 = new Material(matlSel);          // REPLACE our current material, & 
      break;
      case JT_SPHERE2:
        matlSel = (6)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        materials = materials_Ayerdi;
        //matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        //matl0 = new Material(matlSel);          // REPLACE our current material, & 
      break;
      case JT_SPHERE3:
        matlSel = (19)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        materials = materials_Ayerdi;
        //matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        //matl0 = new Material(matlSel);          // REPLACE our current material, & 

      break;
      case JT_SPHERE4:
        matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        materials = materials_Ayerdi;
      break;
      case JT_BOX:
        matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        
        materials = materials_wood;
        break;
      case JT_BOX2:
        matlSel = (1)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        
        materials = materials_Ayerdi;
        break;
      case JT_BOX3:
        matlSel = (15)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        
        materials = materials_Ayerdi;
        break;
      case JT_BOX4:
        matlSel = (9)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
        matl0 = new Material(matlSel);          // REPLACE our current material, & 
        
        materials = materials_Ayerdi;
        break;

    }
  }

  this.K_e1 = matl0.K_emit;
  this.K_a1 = matl0.K_ambi;
      //console.log(this.K_a)
  this.K_d1 = matl0.K_diff;
  this.K_s1 = matl0.K_spec;
  this.K_Shiny = matl0.K_shiny;


  this.K_e = vec4.fromValues(this.K_e1[0],this.K_e1[1],this.K_e1[2],1);
  this.K_a = vec4.fromValues(this.K_a1[0],this.K_a1[1],this.K_a1[2],1);
  this.K_s = vec4.fromValues(this.K_s1[0],this.K_s1[1],this.K_s1[2],1);

  if(materials == materials_Ayerdi){
    this.K_d = vec4.fromValues(this.K_d1[0],this.K_d1[1],this.K_d1[2],1);
    
  }else if(materials == materials_wood){
    this.K_d = vec4.fromValues(this.K_d1[0],this.K_d1[1],this.K_d1[2],1);
    
    r = Math.sqrt(Math.pow(hitPtWorld[0]/Math.pow(0.4,3),2), Math.pow(hitPtWorld[1]/Math.pow(0.4,3),2))
        
    ran = 2 * (Math.random() + 1);
    //r = 5.0 * turbulence(r,0.0125)
    //r = r + ran;
        //r = Math.sqrt
    b = 0.5 * (1 + Math.sin(r));

    mat1 = vec4.fromValues(104/255,58/255,16/255);
    mat2 = vec4.fromValues(146/255,106/255,68/255);

    vec4.scale(this.K_d, mat1, b);
    colorHelper = vec4.create();
    vec4.scale(colorHelper, mat2, 1-b);
    vec4.add(this.K_d,this.K_d,colorHelper)

  }else if(materials == materials_checkerboard){
    this.K_d = vec4.fromValues(this.K_d1[0],this.K_d1[1],this.K_d1[2],1);
    gapColor = vec4.fromValues(1,1,1,1);

    tot = Math.floor(hitPtWorld[0]/2) + Math.floor(hitPtWorld[1]/2) + Math.floor(hitPtWorld[2]/0.3);
    y = tot%2;
    if(y<0){
      y = -y;
    }
    if(y > 0.5){
      vec4.copy(this.K_d,this.K_d);
    }else{
      matlSel = (9)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
      matl0 = new Material(matlSel);          // REPLACE our current material, & 
      this.K_d1 = matl0.K_diff;
      this.K_d = vec4.fromValues(this.K_d1[0],this.K_d1[1],this.K_d1[2],1);
      //vec4.copy(this.K_d,gapColor);
    }

  }

}

var perm = new Array(512);
var gradP = new Array(512);

function Grad(x, y, z) {
    this.x = x; this.y = y; this.z = z;
  }
  
  Grad.prototype.dot2 = function(x, y) {
    return this.x*x + this.y*y;
  };

  Grad.prototype.dot3 = function(x, y, z) {
    return this.x*x + this.y*y + this.z*z;
  };


function turbulence(pos,pixel_size){
  x = 0;
  scale = 1;
  while(scale>pixel_size){
    pos = pos/scale;
    x = x + noise(pos)*scale;
    scale = scale/2;
  }
  return pos;
}

function noise(a){
  return a * (Math.random());

}


CImgBuf.prototype.findPtValue = function(HitList, myGeom, myCamera) {
  //t is the JT_Object index;
  //CHit(JT_obj,hitPtWorld,hitPtModel,color,hitTime)

  var gapAmt = jitterAmt * jitterAmt - HitList.length;
  //console.log(gapAmt);
  var PtColor = vec4.create();
  var PtHitPtWorld = vec4.create();
  var PtHitPtModel = vec4.create();
  var PtHitTime = 0;
  var PtJT_obj = 0;
  var PtSurfNorm = vec4.create();
  var PtWldRay = vec4.create();
  var PtModRay = vec4.create();
  vec4.scale(PtColor, myGeom.gapColor, gapAmt);
  var PtColorHit = vec4.create();


  for (var i = 0; i < HitList.length; i++){
    myCScene = new CScene();
    recursionDepth = globalRecursionDepth;
    //vec4.copy(HitList[i].ObjColor, myCScene.findShade(HitList[i],myCamera));
    //myCScene.findShade(HitList[i],myCamera)
    //vec4.add(PtColor, PtColor, HitList[i].ObjColor);

    vec4.add(PtHitPtWorld, PtHitPtWorld, HitList[i].hitPtWorld);
    vec4.add(PtHitPtModel, PtHitPtModel, HitList[i].hitPtModel);
    PtHitTime = PtHitTime + HitList[i].t0;
    //console.log(HitList[i].t0)
    PtJT_obj = PtJT_obj + HitList[i].JTObj;
    vec4.add(PtSurfNorm, PtSurfNorm, HitList[i].surfNorm);
    vec4.add(PtWldRay, PtWldRay, HitList[i].wldRay);
    vec4.add(PtModRay, PtModRay, HitList[i].modRay);
    
   
  }

  //vec4.add(PtColor,PtColor,PtColorHit);
  //vec4.divideScale(PtColor,PtColor,jitterAmt * jitterAmt);
  


  // vec4.divideScale(PtColor,PtColor,jitterAmt * jitterAmt);
  //console.log(PtColor);

  vec4.divideScale(PtHitPtWorld,PtHitPtWorld,HitList.length);
  vec4.divideScale(PtHitPtModel,PtHitPtModel,HitList.length);
  vec4.divideScale(PtSurfNorm,PtSurfNorm,HitList.length);
  vec4.divideScale(PtWldRay,PtWldRay,HitList.length);
  vec4.divideScale(PtModRay,PtModRay,HitList.length);
  //vec4.divideScale(lamp0ClrTemp,lamp0ClrTemp,HitList.length);
  //vec4.divideScale(lamp1ClrTemp,lamp1ClrTemp,HitList.length);
  //console.log(PtHitPtWorld);
  PtHitTime = PtHitTime / HitList.length;
  //console.log(PtHitTime);

  PtJT_obj = HitList[0].JTObj;
  
  //console.log(PtColor);

  CHitObj = new CHit(PtJT_obj, PtHitPtWorld, PtHitPtModel, PtColor, PtHitTime, PtSurfNorm, PtWldRay ,PtModRay);
  CHitObj.jitterList = HitList
  //CHitObj = new CHit(HitList[0].JTObj, HitList[0].hitPtWorld, HitList[0].hitPtModel, HitList[0].ObjColor, HitList[0].t0);
  //vec4.copy(CHitObj.lamp0Clr, lamp0ClrTemp);
  //vec4.copy(CHitObj.lamp1Clr, lamp1ClrTemp);
  return CHitObj;

}

var Light1On = true;
var Light2On = true;

var jitterAmt = 1;


CImgBuf.prototype.clearfBuf = function() {
  for(var j=0; j< this.ySiz; j ++) {            // for the j-th row of pixels
    for(var i=0; i< this.xSiz; i ++) {          // and the i-th pixel on that row,
      var idx = (j*this.xSiz + i)*this.pixSiz;  // Array index at pixel (i,j) 
      this.fBuf[idx   ] = 0;//*div*div;  // bright blue
      this.fBuf[idx +1] = 0;//*div*div;
      this.fBuf[idx +2] = 0;//*div*div;
    }
  }
}

var globalRecursionDepth = 1;
CImgBuf.prototype.makeRayTracedImage = function() {
//==============================================================================
// TEMPORARY!!!! 
// THIS FUNCTION SHOULD BE A MEMBER OF YOUR CScene OBJECTS (when you make them),
// and NOT a member of CImgBuf OBJECTS!
//
// Create an image by Ray-tracing.   (called when you press 'T' or 't')
console.log("tracing start!");
  var eyeRay = new CRay();	// the ray we trace from our camera for each pixel
  var myCam = new CCamera();	// the 3D camera that sets eyeRay values
  
  myCam.rayLookAt(g_EyeX, g_EyeY, g_EyeZ, g_AtX, g_AtY, g_AtZ, 0, 0, 1);

	var hit = 0;

  var div = 1/jitterAmt;
	//console.log("gets to makeRayTracedImage: " + this.ySiz);
  for(var j=0; j< this.ySiz; j ++) {						// for the j-th row of pixels
  	for(var i=0; i< this.xSiz; i ++) {					// and the i-th pixel on that row,
	  	var idx = (j*this.xSiz + i)*this.pixSiz;	// Array index at pixel (i,j) 

      
                  // create ray for pixel (i,j)
      myCam.setEyeRay(eyeRay,i,j); 
      myCScene = new CScene();
      nearestHitPt = myCScene.traceRay(eyeRay, myCam, this, div, i, j);
      
      
        //console.log(nearestHitPt == myHitList.HitList[0])
        //if (myHitList.HitList.length > 0){
        if (nearestHitPt != 0){
          //recursionDepth = 2;
          //myCScene.findShade(nearestHitPt, myCam);
          //nearestHitPt = nearestHitPt;
          this.fBuf[idx   ] = nearestHitPt.ObjColor[0];//*div*div;  // bright blue
          this.fBuf[idx +1] = nearestHitPt.ObjColor[1];//*div*div;
          this.fBuf[idx +2] = nearestHitPt.ObjColor[2];//*div*div;
          

          //this.RayTraceShadow(eyeRay, myHitList.HitList[0].HitX,myHitList.HitList[0].HitY,myHitList.HitList[0].HitZ);
          //shadeing = this.shade;
          
          //console.log(myHitList.HitList[0].ObjColor)
        }else{
            this.fBuf[idx   ] = mygapColor[0];  // bright blue
            this.fBuf[idx +1] = mygapColor[1];
            this.fBuf[idx +2] = mygapColor[2];//*div*div;


          
        }

      }
  	}
  this.float2int();		// create integer image from floating-point buffer.
  //console.log(this.fBuf);
}



function sortHitt0(a,b){
  if(a.t0 < b.t0){
    return -1;
  }else{
    return 1;
  }

}


function CScene() {
//==============================================================================
// A complete ray tracer object prototype (formerly a C/C++ 'class').
//      My code uses just one CScene instance (myScene) to describe the entire 
//			ray tracer.  Note that I could add more CScene objects to make multiple
//			ray tracers (perhaps on different threads or processors) and then 
//			combine their results into a giant video sequence, a giant image, or 
//			use one ray-traced result as input to make the next ray-traced result.
//
//The CScene class includes:
// One CImgBuf object that holds a floating-point RGB image, and uses that
//		  image to create a corresponding 8,8,8 bit RGB image suitable for WebGL
//			display as a texture-map in an HTML-5 canvas object within a webpage.
// One CCamera object that describes an antialiased ray-tracing camera;
//      in my code, it is the 'rayCam' variable within the CScene prototype.
//      The CCamera class defines the SOURCE of rays we trace from our eyepoint
//      into the scene, and uses those rays to set output image pixel values.
// One CRay object 'eyeRay' that describes the ray we're currently tracing from
//      eyepoint into the scene.
// One CHitList object 'eyeHits' that describes each 3D point where the 'eyeRay'
//      pierces a shape (a CGeom object) in our CScene.  Each CHitList object
//      in our ray-tracer holds a COLLECTION of hit-points (CHit objects) for a
//      ray, and keeps track of which hit-point is closest to the camera. That
//			collection is held in the eyeHits member of the CScene class.
// a COLLECTION of CGeom objects that each describe an individual visible thing,
//      single item or thing we may see in the scene.  That collection is the 
//			held in the 'item[]' array within the CScene class.
//      		Each CGeom element in the 'item[]' array holds one shape on-screen.
//      To see three spheres and a ground-plane we'll have 4 CGeom objects, one 
//			for each of the spheres, and one for the ground-plane.
//      Each CGeom object includes a 'matlIndex' index number that selects which
//      material to use in rendering the CGeom shape. I assume all lights in the
//      scene may affect all CGeom shapes, but you may wish to add an light-src
//      index to permit each CGeom object to choose which lights(s) affect it.
// a COLLECTION of CMatl objects; each describes one light-modifying material.
//      That collection is held in the 'matter[]' array within the CScene class.
//      Each CMatl element in the 'matter[]' array describes one particular
//      individual material we will use for one or more CGeom shapes. We may
//      have one CMatl object that describes clear glass, another for a
//      Phong-shaded brass-metal material, another for a texture-map, another
//      for a bump mapped material for the surface of an orange (fruit),
//      another for a marble-like material defined by Perlin noise, etc.
// a COLLECTION of CLight objects that each describe one light source.  
//			That collection is held in the 'lamp[]' array within the CScene class.
//      Note that I apply all lights to all CGeom objects.  You may wish to
//      add an index to the CGeom class to select which lights affect each item.
//
// The default CScene constructor creates a simple scene that will create a
// picture if traced:
// --rayCam with +/- 45 degree Horiz field of view, aimed at the origin from 
// 			world-space location (0,0,5)
// --item[0] is a unit sphere at the origin that uses matter[0] material;
// --matter[0] material is a shiny red Phong-lit material, lit by lamp[0];
// --lamp[0] is a point-light source at location (5,5,5).

	//
	//
	//
	//
	//  	YOU WRITE THIS!  
	//
	//
	//
	//
	//
}


CScene.prototype.traceRay = function(eyeRay, myCam, myCImgBuf, div,i,j){ 

      myHitList = new CHitList(eyeRay);

      for (var t = 0; t < JT_HITLIST_MAX; t++){
        var myGeom = new CGeom(t);
        mygapColor = myGeom.gapColor;
        //myHitListPt.HitList = [];

        myHitListPt = new CHitList(eyeRay);

        for (var a=0; a < 1/div; a++){
          for (var b=0; b < 1/div; b++){
            var posX = i + a*div + div*Math.random();
            var posY = j + b*div + div*Math.random();

            myCam.setEyeRay(eyeRay,posX,posY);   
            myGeom.traceGridHelper(eyeRay,myGeom.shapeType,myHitListPt,t);           // trace ray to the grid

          }
        }
        if(myHitListPt.HitList.length > 0){
          myHit = myCImgBuf.findPtValue(myHitListPt.HitList, myGeom, myCam);
          myHitList.HitList.push(myHit);
        }
          
    }

    myHitList.HitList = myHitList.HitList.sort(sortHitt0);

  
    if (myHitList.HitList.length > 0){
      this.CHitList = myHitList.HitList;
      this.findAvgColor(myHitList.HitList[0],myGeom,myCam)
      return myHitList.HitList[0];
    }else{
      return 0;
    }

}


CScene.prototype.findAvgColor = function(CHit,myGeom, myCamera){ 
  PtColor = vec4.create();
  HitList = CHit.jitterList
  var gapAmt = jitterAmt * jitterAmt - HitList.length;
  vec4.scale(PtColor, myGeom.gapColor, gapAmt);

  for(var i  = 0; i < HitList.length; i++){
    myCScene = new CScene();
    recursionDepth = globalRecursionDepth;
    //vec4.copy(HitList[i].ObjColor, myCScene.findShade(HitList[i],myCamera));
    myCScene.findShade(HitList[i],myCamera)
    vec4.add(PtColor, PtColor, HitList[i].ObjColor);
  }

  vec4.divideScale(PtColor,PtColor,jitterAmt * jitterAmt);

  vec4.copy(CHit.ObjColor,PtColor);

}

CScene.prototype.findShade = function(CHit,myCamera){ 

  var lamp0 = new CLight(0);
  var lamp1 = new CLight(1);
  lamp0Clr = vec4.create();
  lamp1Clr = vec4.create();
  hitPtClr = vec4.create();


  // if(Light1On){
  //   lamp0.LightOn(CHit,myCamera);
  //   vec4.copy(lamp0Clr,lamp0.PtColor);
  //   vec4.add(hitPtClr,hitPtClr,lamp0Clr);
  // }

  // if(Light2On){
  //   lamp1.LightOn(CHit,myCamera);
  //   vec4.copy(lamp1Clr,lamp1.PtColor);
  //   vec4.add(hitPtClr,hitPtClr,lamp1Clr);
    
  // }



  viewRay = new CRay();
  vec4.copy(viewRay.orig, myCamera.eyePt);
  rayDir = vec4.create();
  vec4.subtract(rayDir, CHit.hitPtWorld, viewRay.orig);
  vec4.normalize(rayDir,rayDir);

  actualHitPt = vec4.fromValues(0,0,0,1);
  offDir = vec4.create();
  vec4.scale(offDir,rayDir, Math.pow(10,-3));
  vec4.subtract(actualHitPt, CHit.hitPtWorld, offDir);

  vec4.copy(viewRay.dir,rayDir);

  normal = vec4.create()
  vec4.copy(normal,CHit.surfNorm);


  reflectRay = new CRay();
  vec4.copy(reflectRay.orig, actualHitPt);
  rayDirNeg = vec4.create();
  vec4.negate(rayDirNeg,rayDir)
  reflectRay.dir = reflect(rayDir, normal);


  refractRay = new CRay();
  vec4.copy(refractRay.orig, actualHitPt);

  // theta1 = Math.acos(vec4.dot(CHit.surfNorm,rayDir)/(vec4.length(CHit.surfNorm) * vec4.length(rayDir)));
  // theta2 = Math.asin(1.000293*Math.sin(theta1)/1.6)
  normalNeg = vec4.create();
  vec4.negate(normalNeg,CHit.surfNorm);
  negNcrossS1 = vec4.create();
  vec4.cross(negNcrossS1,normalNeg,rayDir);

  a = vec4.create();
  vec4.multiply(a,CHit.surfNorm,negNcrossS1);
  //console.log(a)
  if(CHit.entering){
    vec4.scale(a,a,1.000293/1.6);
  }else{
    vec4.scale(a,a,1.6/1.000293);
  }
  

  NcrossS1 = vec4.create();
  vec4.cross(NcrossS1,CHit.surfNorm,rayDir);
  b = vec4.create();
  if(CHit.entering){
    vec4.scale(b,CHit.surfNorm,Math.sqrt(1-vec4.dot(NcrossS1,NcrossS1) * Math.pow(1.000293/1.6,2)))
  }else{
    vec4.scale(b,CHit.surfNorm,Math.sqrt(1-vec4.dot(NcrossS1,NcrossS1) * Math.pow(1.6/1.000293,2)))
  }
  
  
  
  vec4.subtract(refractRay.dir, a,b);



  // theta1 = Math.asin(CHit.surfNorm/rayDir);
  // theta2 = Math.asin(1.000293*Math.sin(theta1)/1.6)
  // rayDirNeg = vec4.create();
  // vec4.negate(rayDirNeg,rayDir)
  // reflectRay.dir = reflect(rayDir, normal);



  this.ShadowRayOrigTemp = vec4.create();
  vec4.scale(this.ShadowRayOrigTemp,rayDir, Math.pow(10,-1));
  if(!this.Shadow(CHit,0) && Light1On){
    //console.log(CHit.speculrVal);
    lamp0.LightOn(CHit,myCamera);
    vec4.copy(lamp0Clr,lamp0.PtColor);
    vec4.add(hitPtClr,hitPtClr,lamp0Clr);
  }

  if(!this.Shadow(CHit,1) && Light2On ){
    lamp1.LightOn(CHit,myCamera);
    vec4.copy(lamp1Clr,lamp1.PtColor);
    vec4.add(hitPtClr,hitPtClr,lamp1Clr);
    //vec4.scale(CHit.ObjColor,CHit.ObjColor,0.5);
  }

  if(CHit.JTObj == JT_SPHERE3 && g_show1 != 1){
    this.refractRayClr = vec4.create();

      this.findRefractColor(CHit, refractRay, myCamera);
      //this.findReflectColor(CHit, refractRay, myCamera);
      //vec4.add(CHit.ObjColor, CHit.ObjColor, this.reflectRayClr);
      vec4.scale(hitPtClr, hitPtClr, 0.5);
      // console.log(this.refractRayClr)
      vec4.add(hitPtClr, hitPtClr, this.refractRayClr);
  }

  vec4.copy(CHit.ObjColor, hitPtClr);




  
  if(recursionDepth > 0 && CHit.JTObj != JT_GNDPLANE && CHit.JTObj != JT_BOX && CHit.JTObj != JT_BOX2 && CHit.JTObj != JT_SPHERE){
    if(CHit.JTObj == JT_BOX4){
      this.reflectRayClr = vec4.create();
      vec4.copy(this.reflectRayClr, hitPtClr);
      this.findReflectColor(CHit, reflectRay, myCamera);
      //vec4.add(CHit.ObjColor, CHit.ObjColor, this.reflectRayClr);
      //vec4.add(CHit.ObjColor, CHit.ObjColor, this.reflectRayClr);
      vec4.copy(CHit.ObjColor, this.reflectRayClr);
    }else{
      this.reflectRayClr = vec4.create();
      //vec4.copy(this.reflectRayClr, hitPtClr);
      this.findReflectColor(CHit, reflectRay, myCamera);
      //vec4.add(CHit.ObjColor, CHit.ObjColor, this.reflectRayClr);
      vec4.scale(CHit.ObjColor, CHit.ObjColor, 0.5);
      vec4.add(CHit.ObjColor, CHit.ObjColor, this.reflectRayClr);
    }
    
    //vec4.copy(hitPtClr, hitPtClr, this.reflectRayClr);
    //vec4.copy(CHit.ObjColor, this.reflectRayClr);
    //vec4.scale(hitPtClr, hitPtClr, 0.5);
    //this.findReflectColor(CHit, reflectRay, myCamera, reflectClr);
  }

  


  //console.log("get's here");
  //RGB = vec4.create();

  //return hitPtClr;
}


CScene.prototype.findRefractColor = function(CHit, reflectRay, myCamera){ 

  var lamp0 = new CLight(0);
  var lamp1 = new CLight(1);
  lamp0Clr = vec4.create();
  lamp1Clr = vec4.create();

  var clearColor = vec4.create();
  
  myHitListPt3 = new CHitList(reflectRay);
  for (var t = 0; t < JT_HITLIST_MAX; t++){
    var myGeom = new CGeom(t);
    myGeom.traceGridHelper(reflectRay,myGeom.shapeType,myHitListPt3,t);           // trace ray to the grid
  }
  myHitListPt3.HitList = myHitListPt3.HitList.sort(sortHitt0);

  if(myHitListPt3.HitList.length > 1 && myHitListPt3.HitList[1].JTObj != CHit.JTObj){//&& myHitListPt.HitList[1].t0 > 0){
    recursionDepth = recursionDepth - 1;
    
    //vec4.copy(myHitListPt3.HitList[1].ObjColor, clearColor);
    nearestPt2 = myHitListPt3.HitList[1];
    //vec4.copy(this.refractRayClr, clearColor);
    
    this.findShade(nearestPt2,myCamera);

    vec4.copy(this.refractRayClr, nearestPt2.ObjColor);
    vec4.scale(this.refractRayClr, this.refractRayClr, 0.5);
    //console.log(this.refractRayClr)

  }else{
    vec4.copy(this.refractRayClr, myGeom.gapColor);
    vec4.scale(this.refractRayClr, this.refractRayClr, 0.8);
  }

  //return 

  
}

CScene.prototype.findReflectColor = function(CHit, reflectRay, myCamera){ 

  var lamp0 = new CLight(0);
  var lamp1 = new CLight(1);
  lamp0Clr = vec4.create();
  lamp1Clr = vec4.create();

  var clearColor = vec4.create();
  
  myHitListPt2 = new CHitList(reflectRay);
  for (var t = 0; t < JT_HITLIST_MAX; t++){
    var myGeom = new CGeom(t);
    myGeom.traceGridHelper(reflectRay,myGeom.shapeType,myHitListPt2,t);           // trace ray to the grid
  }
  myHitListPt2.HitList = myHitListPt2.HitList.sort(sortHitt0);

  if(myHitListPt2.HitList.length > 1 && myHitListPt2.HitList[1].JTObj != CHit.JTObj){//&& myHitListPt.HitList[1].t0 > 0){
    recursionDepth = recursionDepth - 1;
    nearestPt = myHitListPt2.HitList[1];
    vec4.copy(myHitListPt2.HitList[1].ObjColor, clearColor);
    vec4.copy(this.reflectRayClr, clearColor);
    
    this.findShade(nearestPt,myCamera)
    //vec4.add(reflectClr,reflectClr, this.findShade(nearestPt,myCamera));
    
    //white = vec4.fromValues(1,1,1,1);
    //vec4.copy(this.reflectRayClr, white);
    
    vec4.copy(this.reflectRayClr, nearestPt.ObjColor);
    if(CHit.JTObj == JT_BOX4){
    }else{
      vec4.scale(this.reflectRayClr, this.reflectRayClr, 0.3);
    }

  }else{
    vec4.copy(this.reflectRayClr, myGeom.gapColor);
    vec4.scale(this.reflectRayClr, this.reflectRayClr, 0.3);
  }

  //return 

  
}


CScene.prototype.Shadow = function(CHit, lampInd){ 
  lamp = new CLight(lampInd);

  rayOrig = vec4.create();
  vec4.copy(rayOrig, CHit.hitPtWorld);

  lampPos = vec4.create();
  vec4.copy(lampPos, lamp.I_pos);

  rayDir = vec4.create();
  vec4.subtract(rayDir,lampPos, rayOrig);

  vec4.normalize(rayDir,rayDir);
  inShadow = false;

  lampt0 = (lampPos[0] - rayOrig[0])/rayDir[0];

  //lampPos[0] = rayOrig[0] + lampt0*rayDir[0];
  //lampt0 = (lampPos[0] - rayOrig[0])/rayDir[0]
  ray = new CRay();
  vec4.copy(ray.orig, rayOrig);
  vec4.copy(ray.dir, rayDir);

  myHitListPt = new CHitList(ray);

  for (var t = 0; t < JT_HITLIST_MAX; t++){
        var myGeom = new CGeom(t);
        myGeom.traceGridHelper(ray,myGeom.shapeType,myHitListPt,t);           // trace ray to the grid


  }

  myHitListPt.HitList = myHitListPt.HitList.sort(sortHitt0);

  //if(myHitListPt.HitList.length > 0 && myHitListPt.HitList[0].t0 < lampt0){
  //  return true;
  //}else{
  //  return false;
  //}
  for (var i = 0; i < myHitListPt.HitList.length; i++){
    if (myHitListPt.HitList[i].t0 < lampt0 && myHitListPt.HitList[i].JTObj != CHit.JTObj){
      inShadow = true;
      //console.log(myHitListPt.HitList[i].t0);
    }
    else{
      //console.log("nothing in between")
    }
  }

  return inShadow
}



function CHit(JT_obj,hitPtWorld,hitPtModel,color,hitTime, surfNorm, inRay, modRay) {
//==============================================================================
// Describes one ray/object intersection point that was found by 'tracing' one
// ray through one shape (through a single CGeom object, held in the
// CScene.item[] array).
// CAREFUL! We don't use isolated CHit objects, but instead gather all the CHit
// objects for one ray in one list held inside a CHitList object.
// (CHit, CHitList classes are consistent with the 'HitInfo' and 'Intersection'
// classes described in FS Hill, pg 746).

	//
	//
	//
	//
	//  	YOU WRITE THIS!  
	//
	//
	//
	//
	//
  this.HitX = hitPtWorld[0];
  this.HitY = hitPtWorld[1];
  this.HitZ = hitPtWorld[2];

  this.hitPtWorld = hitPtWorld;
  this.hitPtModel = hitPtModel;

  //this.HitX = hitPtModel[0];
  //this.HitY = hitPtModel[1];
  //this.HitZ = hitPtModel[2];


  this.JTObj = JT_obj;
  //this.eyePos = EyeRay.eyePt;
  this.wldRay = inRay;
  this.modRay = modRay;
  this.eyeToHitDis;// = Math.sqrt((x- g_EyeX)^2 + (y-g_EyeY)^2 + (z-g_EyeZ)^2)
  this.ObjColor = color;
  this.t0 = hitTime;

  this.surfNorm = surfNorm;

  this.lamp0Clr = vec4.create();
  this.lamp1Clr = vec4.create();

  this.recursionDepth;
  this.jitterList = [];

  this.entering = false;
  //console.log("what's wrong here??")


}



function CHitList(inRay) {
//==============================================================================
// Holds all the ray/object intersection results from tracing a single ray(CRay)
// through all objects (CGeom) in our scene (CScene).  ALWAYS holds at least
// one valid CHit 'hit-point', as we initialize pierce[0] to the CScene's
// background color.  Otherwise, each CHit element in the 'pierce[]' array
// describes one point on the ray where it enters or leaves a CGeom object.
// (each point is in front of the ray, not behind it; t>0).
//  -- 'iEnd' index selects the next available CHit object at the end of
//      our current list in the pierce[] array. if iEnd=0, the list is empty.
//      CAREFUL! *YOU* must prevent buffer overflow! Keep iEnd<= JT_HITLIST_MAX!
//  -- 'iNearest' index selects the CHit object nearest the ray's origin point.

	//
	//
	//
	//
	//  	YOU WRITE THIS!  
	//
	//
	//
	//
	//

  this.HitList = []

/*
  myGrid = new CGeom(JT_DISK);
  hit = myGrid.traceGrid(inRay,JT_DISK);

    //console.log(hit)
    if (hit == 1){

      CHLHit = new CHit(JT_DISK,myGrid.hitx,myGrid.hity,myGrid.hitz);
      //console.log(CHLHit)
      this.HitList.push(CHLHit);
      //console.log(this.HitList[0])
      //console.log("got here hit == 1for disk")
    }else{
      //console.log("hit == something else")
      //console.log(this.HitList[0])
    }
    //console.log(this.HitList[0])
*/

}


