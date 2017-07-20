//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// Chap 5: TexturedQuad.js (c) 2012 matsuda and kanda
//					"WebGL Programming Guide" pg. 163
// became:
//
//	traceWeek01_LineGrid.js 	MODIFIED for EECS 351-1, 
//																	Northwestern Univ. Jack Tumblin
//	--add comments
//	--two side-by-side viewports: 
//			LEFT:	--3D line-drawing preview
//			RIGHT:--texture-map from a Uint8Array object.  
//							(NOTE: Not all versions of WebGL can read the Float32Array
//							(made by our ray-tracer; convert it to 8-bit integer
//							(by rounding: intRGB = floatRGB*255.5
//	--include re-sizing to fit browser-window width
//							(see 351-1 starter code: 7.11.JT_HelloCube_Resize.js, .html)
//	--revise to use VBObox1,VBObox2 objects; each holds one VBO +one shader pgm,
//			so that changes to code for WebGL preview in the left viewport won't 
//			affect code for the right viewport that displays ray-traced result by 
//			texture-mapping.
//
//==============================================================================
// HOW DO WE CONSTRUCT A CAMERA?
//==============================================================================
// A perspective camera for ray-tracing, specified in 'world' coordinate system
// by 'intrinsic' or 'internal' parameters:
//				iLeft,iRight,iTop,iBot; iNear; // for view frustum;
//				xmax,ymax; 							// number of output image pixels; horiz,vert
//				xSampMax,ySampMax;			// antialiasing: # of samples/rays per pixel.
// and by 'extrinsic' or world-space 'camera-positioning' parameters:
//				 vrp,lookAtPt,vup 		// View Reference Point(3D center-of-projection)
//				 											// look-at point;cam's world-space aiming point,
//															// View Up Vector, in +y direction on on-screen
//
//     Users position and aim the camera by specifying two points and one vector
// in world-space.  The 'view reference point' (vrp) sets camera position; the
// 'lootAt' point sets the cameras' direction-of-gaze, and the 'view up' vector
// (vup) specifies a world-space direction that will appear vertical in the
// camera image.
//     From (vrp,lookAtPt,vup), compute the right-handed 3D camera coord. system
// consisting of its origin point and its 3 computed orthonormal vectors U,V,N
// (its just a world-space renaming of the eye-space x,y,z vector directions).
// The coord. system's origin point is == 'vrp', and we describe the coordinate
// axes by the unit-length world-space vectors U,V,N. To compute these vectors,
// use N = ||vrp-lookAtPt||, U= vup cross N; V= N cross U.  We can then easily
// convert a 3D point from camera coords (u,v,n) to world-space coords (x,y,z):
// we start at the camera's origin (vrp), add U,V,N axis vectors weighted by
// the point's u,v,n coords: by the coords (x,y,z) = vrp + U*u + V*v + N*n.
//     Users set the camera's internal parameters by choosing 6 numbers in the
// the camera coordinate system. The camera 'eye pt' or 'center of projection'
// is the origin: (u,v,n)=0,0,0; the camera viewing direction is the -N axis,
// and the U,V axes set the camera image's vertical and horizontal directions
// (x,y). We specify the image in the camera's n=-iNear plane for the view from
// the origin through the 'image rectangle' with these 4 user-specified corners:
//  	            (iLeft, iTop,-iNear) (iRight, iTop, -iNear)
//	              (iLeft, iBot,-iNear) (iRight, iBot, -iNear) in (u,v,n) coords.
// (EXAMPLE: If the user set iNear=1, iLeft=-1, iRight=+1, iTop=+1, iBot = -1, 
// then our image rectangle is a square, centered on the -N axis, and our 
// camera's field-of-view spans +/- 45 degrees horizontally and vertically.)
//
// Users specify resolution of this image rectangle in pixels (xmax,ymax), and
// the pixels divide the image rectangle into xsize,ysize 'little squares'. Each
// little square has the same width (ufrac) and height (vfrac), where:
//     ufrac = (iRight - iLeft)/xmax;  vfrac = (iTop - iBot)/ymax.
// (note: keep ufrac/vfrac =1, so the image won't appear stretched or squashed).
// The little square at the lower-left corner of the image rectangle holds the
// pixel (0,0), but recall that the pixel is NOT that little square! it is the
// POINT AT THE SQUARE'S CENTER; thus pixel (0,0) location in u,v,n coords is:
//               (iLeft +    0.5*ufrac,  iBot +    0.5*vfrac, -1).
// Similarly, pixel(x,y) location in u,v,n is:
//      uvnPix = (iLeft + (x+0.5)*ufrac, iBot + (y+0.5)*vfrac, -1).
//
// With uvnPix, we can easily make the 'eye' ray in (u,v,n) coords for the (x,y)
// pixel; the ray origin is (0,0,0), and the ray direction vector is
// uvnPix - (0,0,0) = uvnPix. However, we need an eyeRay in world-space coords;
// To convert, replace the ray origin with vrp (already in world-space coords),
// and compute ray direction as a coordinate-weighted sum of the unit-length
// U,V,N axis vectors; eye.dir = uvnPix.u * U + uvnPix.v * V + uvnPix.n * N.
// This 'weighted sum' is just a matrix multiply; cam2world * uvnPix,
// where U,V,N unit-length vectors are the columns of cam2world matrix.
//
// Finally, to move the CCamera in world space, just translate its VRP;
// to rotate CCamera around its VRP, just rotate the u,v,n axes (pre-multiply
// cam2world matrix with a rotation matrix).

//Global Vars:=================================================================

// for WebGL usage:--------------------
var gl;													// WebGL rendering context -- the 'webGL' object
																// in JavaScript with all its member fcns & data
var g_canvasID;									// HTML-5 'canvas' element ID#

// For the VBOs & Shaders:-----------------
preView = new VBObox1();		// For WebGLpreview: holds one VBO and its shaders
rayView = new VBObox2();		// for displaying the ray-tracing results.
VBObox3 = new VBObox3();

var g_show1 = 1;								// 0==Show, 1==Hide VBO1 contents on-screen.
//var g_show2 = 1;								// 	"					"			VBO2		"				"				" 




var gwidth;
var gheight;


var EyeToAtLen = 10;

var isDrag=false;   // mouse-drag: true when user holds down mouse button
var xMclik=0.0;     // last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  


//-----------Ray Tracer Objects:
//var myScene = new CScene();
//var myImg = new CImgBuf();
function main() {
//==============================================================================
//  test_glMatrix();		// make sure that the fast vector/matrix library we use
  										// is available and working properly.\
  g_canvasID = document.getElementById('webgl');   // Retrieve <canvas> element.
  gwidth = g_canvasID.width;
  gheight = g_canvasID.height;
  
  browserResize();			// Re-size this canvas before we use it. (ignore the 
  // size settings from our HTML file; fill all but a 20-pixel border with a 
  // canvas whose width is twice its height.)
  
  // Create the the WebGL rendering context: one giant JavaScript object that
  // contains the WebGL state machine adjusted by large sets of WebGL functions,
  // built-in variables & parameters, and member data. Every WebGL function call
  // will follow this format:  gl.WebGLfunctionName(args);
  gl = getWebGLContext(g_canvasID);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  gl.clearColor(0.2, 0.2, 0.2, 1);	  // set RGBA color for clearing <canvas>
  // gl.enable(gl.DEPTH_TEST); // CAREFUL! don't do depth tests for 2D!
  
  // Initialize each of our 'vboBox' objects: 
  preView.init(gl);		// VBO + shaders + uniforms + attribs for WebGL preview
  
  
  C_ImgBuf = new CImgBuf(1*256, 1*256);
  C_ImgBuf.makeRayTracedImage();
  rayView.init(gl);		//  "		"		" to display ray-traced on-screen result.

  //C_ImgBuf2 = new CImgBuf2(1*256, 1*256);
  //C_ImgBuf2.makeRayTracedImage();
  //rayView2.init(gl);		//  "		"		" to display ray-traced on-screen result.

  VBObox3.init(gl);
  //VBObox3.init(gl);


  g_canvasID.onmousedown	=	function(ev){myMouseDown( ev, gl, g_canvasID) };
  g_canvasID.onmousemove = 	function(ev){myMouseMove( ev, gl, g_canvasID) };				
  g_canvasID.onmouseup = 		function(ev){myMouseUp(   ev, gl, g_canvasID)}; 

  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);
  window.addEventListener("keypress", myKeyPress, false);

  
  var tick = function() {			// define our self-calling animation function:
  	//lamp1.I_pos.elements.set( [g_EyeX, g_EyeY, g_EyeZ]);
  	//lamp1.I_pos.elements.set( [-1, 2, -2]);
  	//preView.eyePosWorld.set([g_EyeX, g_EyeY, g_EyeZ]);
  	//VBObox3.eyePosWorld.set([g_EyeX, g_EyeY, g_EyeZ]);


    drawAll();
    requestAnimationFrame(tick, g_canvasID); // browser request: ?call tick fcni
  };
  tick();

  //Light2switch();

  //C_Ray = new CRay();
  //C_Ray.printMe();
  //C_Geom = new CGeom();
  //C_Geom.traceGrid();
  //C_ImgBuf = new CImgBuf(gl.drawingBufferWidth/2, gl.drawingBufferHeight);
  
}

function test_glMatrix() {
//=============================================================================
// Make sure that the fast vector/matrix library we use is available and works 
// properly. My search for 'webGL vector matrix library' found the GitHub 
// project glMatrix is intended for WebGL use, and is very fast, open source 
// and well respected.		 	SEE:       http://glmatrix.net/
// 			NOTE: cuon-matrix.js library (supplied with our textbook: "WebGL 
// Programming Guide") duplicates some of the glMatrix.js functions. For 
// example, the glMatrix.js function 		mat4.lookAt() 		is a work-alike 
//	 for the cuon-matrix.js function 		Matrix4.setLookAt().
	// Try some vector vec4 operations:
	var myV4 = vec4.fromValues(1,8,4,7);				// create a 4-vector 
																							// (without 'var'? global scope!)
	console.log(' myV4 = '+myV4+'\n myV4[0] = '+myV4[0]+'\n myV4[1] = ' 
			+ myV4[1]+'\n myV4[2] = '+myV4[2]+'\n myV4[3] = '+myV4[3]+'\n\n');
	var yerV4 = vec4.fromValues(1,1,1,1);
	console.log('yerV4[] = ', 
				yerV4[0], ', ', yerV4[1], ', ', yerV4[2], ', ', yerV4[3]);
	console.log('vec4.subtract(yerV4, yerV4, myV4) yields ');
	vec4.subtract(yerV4, yerV4, myV4);
		console.log('yerV4[] = ', 
				yerV4[0], ', ', yerV4[1], ', ', yerV4[2], ', ', yerV4[3]);
	// Try some matrix mat4 operations:
	var myM4 = mat4.create();							// create a 4x4 matrix
	console.log('mat4.str(myM4) = '+mat4.str(myM4)+'\n' );
	// Which is it? print out row[0], row[1], row[2], row[3],
	// or print out column[0], column[1], column[2], column[3]?
	// Create a 'translate' matrix to find out:
	var transV3 = vec3.fromValues(6,7,8);			// apply 3D translation vector
	mat4.translate(myM4, myM4, transV3);	// make into translation matrix
	console.log('mat4.str(myM4) = '+mat4.str(myM4)+'\n');	// print it as string
	// As you can see, the 'mat4' object stores matrix contents in COLUMN-first 
	// order; to display this translation matrix correctly, do this
	// (suggests you might want to add a 'print()' function to mat2,mat3,mat4): 
	console.log('---------Translation Matrix: tx,ty,tz == (6,7,8)-----------\n');
	console.log(
	' myM4 row0=[ '+myM4[ 0]+', '+myM4[ 4]+', '+myM4[ 8]+', '+myM4[12]+' ]\n');
	console.log(
	' myM4 row1=[ '+myM4[ 1]+', '+myM4[ 5]+', '+myM4[ 9]+', '+myM4[13]+' ]\n');
	console.log(
	' myM4 row2=[ '+myM4[ 2]+', '+myM4[ 6]+', '+myM4[10]+', '+myM4[14]+' ]\n');
		console.log(
	' myM4 row3=[ '+myM4[ 3]+', '+myM4[ 7]+', '+myM4[11]+', '+myM4[15]+' ]\n');
}

function drawAll() {
//==============================================================================
// Clear <canvas> color AND DEPTH buffer
  
  //if(g_show1 == 1) {	// IF user didn't press HTML button to 'hide' VBO1:
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	if(g_show1){



  // Use OpenGL/ WebGL 'viewports' to map the CVV to the 'drawing context',
	// (for WebGL, the 'gl' context describes how we draw inside an HTML-5 canvas)
	// Details? see
  //  https://www.khronos.org/registry/webgl/specs/1.0/#2.3
  // Draw in the LEFT viewport:
  //------------------------------------------
	// CHANGE from our default viewport:
	// myGL.viewport(0, 0, myGL.drawingBufferWidth, myGL.drawingBufferHeight);
	// to a smaller one:
	gl.viewport(0,														// Viewport lower-left corner
							0,														// (x,y) location(in pixels)
  						gl.drawingBufferWidth/2, 			// viewport width, height.
  						gl.drawingBufferHeight);
  // select fixed-color drawing: 
  	preView.adjust(gl);
	preView.draw(gl)
	}else{

	gl.viewport(0,														// Viewport lower-left corner
							0,														// (x,y) location(in pixels)
  						gl.drawingBufferWidth/2, 			// viewport width, height.
  						gl.drawingBufferHeight);
  // select fixed-color drawing: 
  	VBObox3.adjust(gl);
	VBObox3.draw(gl)

	}

	// Draw in the RIGHT viewport:

  //------------------------------------------
	// CHANGE from our default viewport:
	// myGL.viewport(0, 0, myGL.drawingBufferWidth, myGL.drawingBufferHeight);
	// to a smaller one:
	gl.viewport(gl.drawingBufferWidth/2, 			// Viewport lower-left corner
							0, 														// location(in pixels)
  						gl.drawingBufferWidth/2, 			// viewport width, height.
  						gl.drawingBufferHeight);
	//rayView.adjust(gl);
	rayView.draw(gl);						// Draw our VBObox2 object:
	//}else{

	//}


}

function VBO1toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
console.log("start changing view")
  if(g_show1 != 1) {
  	g_show1 = 1;				// show,
  	C_ImgBuf.clearfBuf();
  	C_ImgBuf.makeRayTracedImage();
  	rayView.init(gl);	
  }
  else {
  	g_show1 = 0;	
  	C_ImgBuf.clearfBuf();
  	C_ImgBuf.makeRayTracedImage();
  	rayView.init(gl);	
  }									// hide.
  
  console.log('g_show1: '+g_show1);
  console.log("changing view finished")
}

function browserResize() {
//==============================================================================
// Called when user re-sizes their browser window , because our HTML file
// contains:  <body onload="main()" onresize="browserResize()">

  /* SOLUTION to a pesky problem: ---------------------------------------------
  The main() function retrieves our WebGL drawing context as the variable 'gl', 
  then shares it as an argument to other functions.  
  That's awkward -- How can we access the 'gl' canvas within functions that 
  main() will NEVER call, such as the mouse and keyboard-handling functions, or 
  winResize()? 
	METHOD 1: Re-create our own local references to the current canvas and WebGL 
						drawing context, like this:
	---------
	var myCanvas = document.getElementById('webgl');	// get current canvas
	var myGL = getWebGLContext(myCanvas);							// and its current context:
 	//Report our current browser-window contents:
 	 console.log('myCanvas width,height=', myCanvas.width, myCanvas.height);		
 console.log('Browser window: innerWidth,innerHeight=', 
																innerWidth, innerHeight);	
										// See: http://www.w3schools.com/jsref/obj_window.asp
	---------
	METHOD 2: Why not make 'gl' and 'canvas' into global variables? The 'gl' 
	object gives unified access to the entire WebGL state machine, and 'canvas' 
	to the HTML-5 object that displays our WebGL-rendered result.
	---------
	*/
	//Make a square canvas/CVV fill the SMALLER of the width/2 or height:
	if(innerWidth > 2*innerHeight) {  // fit to brower-window height
		g_canvasID.width = 2*innerHeight-20;
		g_canvasID.height = innerHeight-20;
	  }
	else {	// fit canvas to browser-window width
		g_canvasID.width = innerWidth-20;
		g_canvasID.height = 0.5*innerWidth-20;
	  }	 
 console.log('NEW g_canvas width,height=' +  
  						g_canvasID.width + ', ' + g_canvasID .height);		
}




var rad = 20;
var cos0xy = ((g_AtY - g_EyeY) * (g_AtY- g_EyeY))/(Math.sqrt((g_AtX - g_EyeX)*(g_AtX - g_EyeX)+(g_AtY - g_EyeY)*(g_AtY - g_EyeY))*(g_AtY - g_EyeY));
var angle = Math.acos(cos0xy);
console.log(angle);
var cos0xyz = ((g_AtX - g_EyeX)*(g_AtX - g_EyeX) + (g_AtY - g_EyeY)*(g_AtY - g_EyeY))/ (Math.sqrt((g_AtX - g_EyeX)*(g_AtX - g_EyeX) + (g_AtY - g_EyeY)*(g_AtY - g_EyeY) + (g_AtZ - g_EyeZ)*(g_AtZ - g_EyeZ)) * Math.sqrt((g_AtX - g_EyeX)*(g_AtX - g_EyeX) + (g_AtY - g_EyeY)*(g_AtY - g_EyeY)));
var angleud = Math.asin(cos0xyz);
//var angleud = -180;

function crossProductX(x1, y1, z1, x2, y2, z2){
  var x3 = y1*z2 - z1*y2;
  return x3;
}
function crossProductY(x1, y1, z1, x2, y2, z2){
  var y3 = z1*x2 - x1*z2;
  return y3;
}
function crossProductZ(x1, y1, z1, x2, y2, z2){
  var z3 = x1*y2 - y1*z2;
  return z3;
}

var flying_mode = false;

function myKeyDown(ev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard, and captures the 
// keyboard's scancode or keycode (varies for different countries and alphabets).
//  CAUTION: You may wish to avoid 'keydown' and 'keyup' events: if you DON'T 
// need to sense non-ASCII keys (arrow keys, function keys, pgUp, pgDn, Ins, 
// Del, etc), then just use the 'keypress' event instead.
//	 The 'keypress' event captures the combined effects of alphanumeric keys and // the SHIFT, ALT, and CTRL modifiers.  It translates pressed keys into ordinary
// ASCII codes; you'll get uppercase 'S' if you hold shift and press the 's' key.
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of the messy way JavaScript handles keyboard events
// see:    http://javascript.info/tutorial/keyboard-events
//
if(ev.keyCode == 39) { // The right arrow key was pressed

	if(flying_mode){

	}else{
		console.log('g_AtX: '+g_AtX + '\t g_AtY: '+g_AtY + '\t g_AtZ: '+g_AtZ+'\t g_EyeX: ' + g_EyeX + '\t g_EyeY: ' + g_EyeY+'\t g_EyeZ: ' + g_EyeZ);

        g_AtY = rad * Math.cos(angle);
        g_AtX = rad * Math.sin(angle);

        angle += 0.62831853072/10;
	}

        
        

} else if (ev.keyCode == 37) { // The left arrow key was pressed
    if(flying_mode){

	}else{
        console.log('g_AtX: '+g_AtX + '\t g_AtY: '+g_AtY + '\t g_AtZ: '+g_AtZ+'\t g_EyeX: ' + g_EyeX + '\t g_EyeY: ' + g_EyeY+'\t g_EyeZ: ' + g_EyeZ);

        g_AtY = rad * Math.cos(angle);
        g_AtX = rad * Math.sin(angle);

        angle -= 0.62831853072/10;
    }
      

} else if (ev.keyCode == 38) { // The up arrow key was pressed
	if(flying_mode){

	}else{

    	g_AtZ = rad * Math.cos(angleud);
    	g_AtY = rad * Math.cos(angle) * Math.sin(angleud);

    	angleud -= 0.62831853072/50;
    	console.log('g_AtX: '+g_AtX + '\t g_AtY: '+g_AtY + '\t g_AtZ: '+g_AtZ+'\t g_EyeX: ' + g_EyeX + '\t g_EyeY: ' + g_EyeY+'\t g_EyeZ: ' + g_EyeZ);

    }
       
} else if (ev.keyCode == 40) { // The down arrow key was pressed
	if(flying_mode){

	}else{

        g_AtZ = rad * Math.cos(angleud);
        g_AtY = rad * Math.cos(angle) * Math.sin(angleud);

        angleud += 0.62831853072/50;
    }
       
} else if (ev.keyCode == 73) { // The w arrow key was pressed
//      g_EyeX -= 0.01;
        //g_EyeY += 0.03;    // INCREASED for perspective camera)
        //g_AtY += 0.03 ;
        //var vy = g_AtY - g_EyeY;
    if(flying_mode){

	}else{

		
        var vx = g_AtX - g_EyeX;
        var vy = g_AtY - g_EyeY;
        var vz = g_AtZ - g_EyeZ;
        g_EyeX += 0.01*vx;
        g_EyeY += 0.01*vy;
        g_EyeZ += 0.01*vz;
        g_AtX += 0.01*vx;
        g_AtY += 0.01*vy;
        g_AtZ += 0.01*vz;
        //g_EyeY -= 0.1;
        moving = true;
        console.log('g_EyeZ: '+g_EyeZ + "g_EyeX: " + g_EyeX + 'g_EyeY: ' + g_EyeY);
    }
} else if (ev.keyCode == 75) { // The s arrow key was pressed
	if(flying_mode){

	}else{

        var vx = g_AtX - g_EyeX;
        var vy = g_AtY - g_EyeY;
        var vz = g_AtZ - g_EyeZ;
        g_EyeX -= 0.01*vx;
        g_EyeY -= 0.01*vy;
        g_EyeZ -= 0.01*vz;
        g_AtX -= 0.01*vx;
        g_AtY -= 0.01*vy;
        g_AtZ -= 0.01*vz;
        moving = false;
    }
} else if (ev.keyCode == 74) { // The a arrow key was pressed
	if(flying_mode){

	}else{

		
        var cx = crossProductX(g_AtX - g_EyeX, g_AtY - g_EyeY, 0, 0, 0, -3);
        var cy = crossProductY(g_AtX - g_EyeX, g_AtY - g_EyeY, 0, 0, 0, -3);
        var cz = crossProductZ(g_AtX - g_EyeX, g_AtY - g_EyeY, 0, 0, 0, -3);
        console.log('cx: '+cx + "\ncy: " + cy + '\ncz: ' + cz);

        g_EyeX += 0.002 * cx;    // INCREASED for perspective camera)
        g_AtX += 0.002 * cx;
        g_EyeY += 0.002 * cy;
        g_AtY += 0.002 * cy;
        
        console.log('g_EyeX: '+g_EyeX + "\ng_EyeY: " + g_EyeY);
        console.log('g_AtX: '+g_AtX + "\ng_AtY: " + g_AtY);
    }
} else if (ev.keyCode == 76) { // The d arrow key was pressed
	if(flying_mode){

	}else{


        var cx = crossProductX(g_AtX - g_EyeX, g_AtY - g_EyeY, 0, 0, 0, -3);
        var cy = crossProductY(g_AtX - g_EyeX, g_AtY - g_EyeY, 0, 0, 0, -3);
        var cz = crossProductZ(g_AtX - g_EyeX, g_AtY - g_EyeY, 0, 0, 0, -3);
        console.log('cx: '+cx + "\tcy: " + cy + '\tcz: ' + cz);

        g_EyeX -= 0.002 * cx;    // INCREASED for perspective camera)
        g_AtX -= 0.002 * cx;
        g_EyeY -= 0.002 * cy;  
        g_AtY -= 0.002 * cy;
    }1
        
}else { return; } // Prevent the unnecessary drawing
   // drawGrid(gl, myVerts, timeStep, u_ViewMatrix, viewMatrix, u_ProjMatrix, projMatrix);  // compute new particle state at current time
  
}

function myKeyUp(ev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well
// You probably don't want to use this ('myKeyDown()' explains why); you'll find
// myKeyPress() can handle nearly all your keyboard-interface needs.
/*
	console.log('myKeyUp()--keyCode='+ev.keyCode+' released.');
*/
}

function myKeyPress(ev) {
//===============================================================================
// Best for capturing alphanumeric keys and key-combinations such as 
// CTRL-C, alt-F, SHIFT-4, etc.  Use this instead of myKeyDown(), myKeyUp() if
// you don't need to respond separately to key-down and key-up events.

/*
	// Report EVERYTHING about this pressed key in the console:
	console.log('myKeyPress():keyCode='+ev.keyCode  +', charCode=' +ev.charCode+
												', shift='    +ev.shiftKey + ', ctrl='    +ev.ctrlKey +
												', altKey='   +ev.altKey   +
												', metaKey(Command key or Windows key)='+ev.metaKey);
*/
	myChar = String.fromCharCode(ev.keyCode);	//	convert code to character-string
	// Report EVERYTHING about this pressed key in the webpage 
	// in the <div> element with id='Result':r
  			
  // update particle system state? myRunMode 0=reset; 1= pause; 2=step; 3=run
	switch(myChar) {
		case 't':
			C_ImgBuf.clearfBuf();
			C_ImgBuf.makeRayTracedImage();
  			rayView.init(gl);		
			break;

		
	}
}

function antiAliasing(jitterValue){
	jitterAmt = jitterValue;
	C_ImgBuf.clearfBuf();
	C_ImgBuf.makeRayTracedImage();
	rayView.init(gl);	
	console.log("got here");
}

function increaseDepth(){
	if(globalRecursionDepth<10){
		globalRecursionDepth += 1;
	}
	
	C_ImgBuf.clearfBuf();
	C_ImgBuf.makeRayTracedImage();
	rayView.init(gl);	
	console.log("recursion depth: " + globalRecursionDepth);
	document.getElementById("Recursion_Depth").innerHTML = globalRecursionDepth.toString();
}

function decreaseDepth(){
	if(globalRecursionDepth > 0){
		globalRecursionDepth -= 1;
	}
	C_ImgBuf.clearfBuf();
	C_ImgBuf.makeRayTracedImage();
	rayView.init(gl);	
	console.log("recursion depth: " + globalRecursionDepth);
	document.getElementById("Recursion_Depth").innerHTML = globalRecursionDepth.toString();
}


function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
//                  (Which button?    console.log('ev.button='+ev.button);   )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = true;                      // set our mouse-dragging flag
  xMclik = x;                         // record where mouse-dragging began
  yMclik = y;


  
};

function myMouseMove(ev,gl,canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
//                  (Which button?   console.log('ev.button='+ev.button);    )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

  if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);
if(g_show1 == 1){
	lamp0.I_pos.elements[2] += 2 * (y - yMclik);
	lamp0.I_pos.elements[0] -= 2 * (x - xMclik);
}else{
	lamp2.I_pos.elements[2] += 2 * (y - yMclik);
	lamp2.I_pos.elements[0] -= 2 * (x - xMclik);
}

dis = Math.sqrt(Math.pow(g_AtX-g_EyeX,2) + Math.pow(g_AtY-g_EyeY,2))

 // g_AtX = 5 * g_AtX/dis;
 // g_AtX = 5 * g_AtY/dis;
// //console.log("x1: " + x1 + "\t y1: " + y1)
// x2 = g_EyeX;
// y2 = g_EyeY;
// r1 = (x - xMclik)*100;
// r2 = 5;
//console.log((x - xMclik))
  // find how far we dragged the mouse:
  xMdragTot = (x - xMclik);          // Accumulate change-in-mouse-position,&
  yMdragTot = (y - yMclik);
  xMclik = x;                         // Make next drag-measurement from here.
  yMclik = y;
// (? why no 'document.getElementById() call here, as we did for myMouseDown()
// and myMouseUp()? Because the webpage doesn't get updated when we move the 
// mouse. Put the web-page updating command in the 'draw()' function instead)





// //d = Math.sqrt(Math.pow(x1-x2,2) + Math.pow(y1-y2,2));
// d = 5;
// //console.log("d: " + d)
// l = (Math.pow(r1,2) - Math.pow(r2,2) + Math.pow(d,2))/(2*d);
// //console.log("l: " + l)
// h = Math.sqrt(Math.abs(Math.pow(r2,2) - Math.pow(l,2)));
// //console.log("h: " + h)

// newx = (l/d)*(x2-x1) - (h/d)*(y2-y1) + x1;
// newy = (l/d)*(y1-y2) + (h/d)*(x2-x1) + y1;

// g_AtX = newx;
// g_AtY = newy;

//console.log("g_AtX: " + g_AtX + "\t g_AtY: " + g_AtY)
//console.log("xMdragTot: " + xMdragTot + "\t yMdragTot: " + yMdragTot)


bigr = 5;
deltaX = (x - xMclik);

newy = 0.5*Math.sqrt((Math.pow(bigr,2)-Math.pow(deltaX,2))/Math.pow(bigr,2));
newx = Math.sqrt(Math.pow(bigr,2) - Math.pow(newy,2));
yy = 5/(Math.cos(Math.acos(5/(g_AtY-g_EyeY)) - Math.acos(5/newy)))
xx = 5/(Math.sin(Math.acos(5/(g_AtY-g_EyeY)) - Math.acos(5/newy)))
// g_AtX = xx + g_EyeX;
// g_AtY = yy + g_EyeY;



console.log("g_AtX: " + (g_AtY-g_EyeY) + "\t g_AtY: " + yy)





/*g_AtX = EyeToAtLen * EX/ Math.sqrt(EX*EX+EY*EY);
g_AtY = EyeToAtLen * EY/ Math.sqrt(EX*EX+EY*EY);

g_AtX = g_AtX;
g_AtY = g_AtY;*/


};

function myMouseUp(ev,gl,canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
//                  (Which button?   console.log('ev.button='+ev.button);    )
//    ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//    pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
  //console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = false;                     // CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);

  //console.log('myMouseUp: xMdragTot,yMdragTot =',(x - xMclik),',\t',(y - yMclik));
  // Put it on our webpage too...
};

