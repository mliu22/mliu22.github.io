//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// TwoVBOs.js  for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

/* Demonstrate use of two separate VBOs with different contents & attributes. 
VERSION HISTORY:
	01:--detailed explanatory comments; 
 	   --expand from 2D vertices to 4D; add 'a_Color' attribute to each vertex
 	   --modify HTML-5 buttons & the fcns they call; soon to toggle VBOs on/off
	02:--create global vars to eliminate function arguments 
 			(later: organize all globals into a sensible object-oriented design,
 			  			e.g. ShapeBuf, Cam, GUI objects... YOU decide!)
	03:--add a_Color attrib, v_colr varying to shaders for per-pixel colors;
			(change a_PositionID to a_PositionLoc; add precision specs to shaders)
		 --draw(): SAME VBO twice, but not at same angle; buttons show/hide them
	04:--write initVBO2() fcn to create a 2nd VBO with different shapes and 
			colors, but same attribs as VBO 1. Note that after we call initVBO2() we 
			changed binding to VBO2; THUS we see ONLY VBO2 contents...
	05:--in draw(), change buffer binding (e.g. call bindBuffer()) BEFORE we make 
			the WebGL drawing call drawArray(). !? We STILL see only VBO2 contents!? 
			?Why?  
			Because the buffer-bind change isn't enough! 
			It DOESN'T CHANGE THE DATA SOURCE for GLSL shader attributes: they're 
			still using VBO2!
	06:--OK; then to switch VBOs, let's change the 'binding' AND change the data 
			source for each attribute:
		 --call bindBuffer() to select our desired VBO data source, and then
		 --call gl.vertexAttribPointer() to change the attrib's data source.
		 It works!  Now make the VBOs different sizes (but same attributes): 
		 					enlarge VBO1 by adding a 2nd triangle.  It still works!
		 					Now make the VBOs even MORE different; step-by-step, add another 
		 					attrib to VBO2 only (not VBO1):
		 --Draw VBO2 using gl.POINTS prims instead of gl.TRIANGLES used for VBO1
			 (CAUTION! points may look invisible until your Vertex Shader sets value 
			 for the built-in attribute gl_PointSize >=1).  Make it big: 10.0!
	07BAD:--Step-by-step, add a 'point-size' attribute ONLY in VBO2 (not VBO1!);
		 --Create u_VBOnum uniform:==1 for VBO1, ==2 for VBO2;used in Vertex Shader,
			to select how we render each different VBO. 
		 --For VBO2 ONLY, add 'point-size' attrib data (increases 'stride' for all
		 	attribs in VBO2; changes initVBO2() and draw() fcns). IT WORKS!
		 --Add attribute 'a_PtSize' to Vertex Shader fed ONLY from VBO2:   
	!! SURPRISE !!  WEIRD and SUBTLE ERROR !!
	Clues:
		--in draw(), VBO2 draws correctly (3 different-sized points), but each VBO1 
		drawing attempt causes 'Attribute out-of-range' error!!!
		--The error vanishes if I use the same number of vertices in VBO1 and VBO2:
		--The 'oddball' new a_PtSize attribute gets its data ONLY from VBO2; THUS
		when draw() renders VBO1, Vertex Shaders read from BOTH VBO1 and VBO2.
		-- You might THINK that the Vertex Shader's 'if/else' statement ensures we 
		don't use the VBO2 attribute a_PtSize' when rendering VBO1, but that's the 
		problem!  
		GLSL compiles to SIMD code--thus branching (if/else) is always awkward; it 
		must complete ALL vertex shader programs at exactly the same time for all 
		possible branches of all shaders.  THUS the GPU actually compute BOTH 
		branches of a conditional, and then discards the unwanted the result. Thus 
		when we render VBO1, the GPU will always access a_PtSize attributes even if 
		u_VBOnum==1!
		To render 6-vertex VBO1, the GPU runs 6 instances of the vertex shader in 
		parallel.  However, the a_PtSize attribute data comes from the 3-vertex 
		VBO2, and thus vertex shaders TRY to read 6 values of a_PtSize from VBO2 
		that holds only 3 of them --> THUS VBO2 drawing fails by 'out-of-range 
		attribute' error. 
		
		HOW DO WE FIX THIS? Two ways:
		=============================
		08)--EASY HACK WAY:  When we switch from rendering one VBO to another, use 
			the new VBO to supply **ALL** the Shader program's attribute values -- 
			even the attribute values that don't exist in the new VBO.  Specifically: 
			when draw() function switches to VBO1, we need to re-assign the a_PtSize 
			attribute to get its data from VBO1 as well, and not VBO2.  While it's 
			true that VBO1 doesn't hold any valid a_PtSize values, it's also true 
			that the shader won't use any of the a_PtSize values taken from VBO1.  We 
			only need to ensure that a_PtSize will retrieve data from VBO1 without 
			accessing data outside VBO1.
		09)--BETTER, PROPER WAY:  If VBO1 and VBO2 hold different sets of vertices 
		with different attributes that look different on-screen, then why are you 
		trying to render them both with the same GLSL shader programs? Why are you 
		using slow, awkward conditionals to select between tow different kinds of 
		rendering?  Instead, write a separate GLSL shader program (vertex shader, 
		fragment shader) for each VBO, and switch between those shader programs!  
			--See textbook, Chapter 10, pg 386 "Switching Shaders".  The book also 
			gives you working example code "ProgramObject.js" that shows you how.

	08:--Let's try the 'EASY HACK WAY' first.
	==========================================
	  in initVBO1() and draw(), set the a_PtSize attribute to access VBO1 when
	  we're rendering VBO1.  This ensures ALL attributes come from the same VBO 
	  when we're drawing it. When drawing VBO1 (which doesn't hold any values for 
	  a_PtSize) change the data source for the a_PtSize attribute to VBO1 EVEN 
	  THOUGH VBO1 HAS NO a_PtSize data!  We will get invalid, 'junk' values for 
	  a_PtSize, but that's OK, because our shaders will not use those values 
	  (ensured by the u_VBOnum uniform). When we select VBO1, set the a_PtSize 
	  'stride' to match that used for all other VBO1 attribs (7*FSIZE1) and set 
	  offset to 0; then VBO1 supplies a_PtSize with the x-position values it 
	  stores. Test. YES! It works!

	09:--BETTER, PROPER WAY: TWO DIFFERENT SHADERS, TWO DIFFERENT VBOs
	==================================================
	Let's create two different shader programs; each 'program' consists of a 
	vertex shader and fragment shader that work together.  We will create one ]
	'shader program' for  VBO1, and a different shader program for VBO2.  
	(see  "WebGL Programming Guide" textbook, Chap 10, pg. 386, and it's example 
	code: "ProgramObject.js".) 

	09a)--Rename shaders (VSHADER_1SRC, FSHADER_1SRC) and test; then copy and 
			test rename again to make GLSL shaders named (VSHADER_2SRC, FSHADER_2SRC).
		  --Modify the on-screen look for the 2nd shaders;blend colors w/50% purple.
	09b)--In main(), replace the 'initShaders()' call with createProgram() calls 
		(both found in textbook's 'cuon-utils.js' library) to build the two shaders.
			--First, use the g_ShaderID1 program ONLY: replace every instance of 
			gl.program (e.g. args to getAttribLocation(), getUniformLocation(), etc) 
			with  g_ShaderID1, and call 'useProgram(g_ShaderID1)' at the start of the 
			draw() function.  YAY!  It works!  
	However, we can't use the 2nd shader program so easily: before we can call 
	useProgram(g_ShaderID2)) to switch to our other shader program we must change 
	the stored 'location' our JavaScript function will use to access each of the 
	shader's attributes and uniforms variables.
			Why? 
		Because useProgram() selects an executable program stored on the GPU. The 
	GPU location for the 'a_Color' attribute in one executable (such as our  
	g_ShaderID1 program) is quite different from the GPU location where a 
	different executable (e.g. our g_ShaderID2 program) keeps its own, separately 
	stored  'a_Color' attribute.  
		--)More formally: the executable result of each successfully compiled and 
	linked shader program gets its own block of memory and its own separate 
	namespace.  As useProgram() directs the GPU to run a different executable, 
	then our JavaScript program must access different locations to set values for 
	the executable's uniform variables and attribute variables, even if their 
	names (e.g. 'a_Color' are identical to variables in other executables.)
	--tl;dr:
			--Create separate global 'location' vars for each uniform and attribute:
				(e.g. a_PositionLoc1, a_PositionLoc2; a_ColorLoc1, a_ColorLoc2; 
						  u_ModelMatrixLoc1, u_ModelMatrixLoc2; u_VBOnumLoc1, u_VBOnumLoc2)
			--Organize; set these different uniform and attribute locations in the
				 'initVBO1()' and 'initVBO2()' fcns. 
			--modify draw() to use only the Shader 1 locations -- test. YES!
			--modify the draw() function to draw VBO2 with the 2nd shader, using the
			2nd shader locations for all uniforms and attributes. test. YES!
	10:--SIMPLIFY & CLEANUP:		
	Now that Shader1 draws ONLY the VBO1 contents (triangles; no point-size) and 
						Shader2 draws ONLY thew VBO2 contents (points; uses point-size): 
		--In Shader 1, REMOVE the conditional code, the u_VBOnum uniform, and the
 				a_PtSize attributes we don't need, + their location1 vars. TEST: works!
		--In Shader 2, REMOVE the conditional code, the u_VBOnum uniform & its 
				location2 vars. TEST: Works!
		--Create more-obvious name differences for Shader 1:  	TEST: works!
				a_Color --> a_Colr1, a_Position to a_Pos1; u_ModelMatrix-->u_ModelMat1. 
 	!DONE!
 		Two different shader programs ('program'==vertex + fragment shader), each 
 		with a different set of uniforms, a different set of attributes, and each 
 		fed from a different VBO that holds differently-formatted data.

 	==============================================
 	11:--BETTER OBJECT-ORIENTED DESIGN:  VBObox
 	=============================================
	Create a re-usable 'VBObox' object/class/prototype & library that holds all 
	data and functions we need to more easily render vertices in one Vertex 
	Buffer Object (VBO) on-screen, including:
	--All source code for all Vertex Shader(s) and Fragment shader(s) we may use 
		to render the vertices stored in this VBO;
	--all variables needed to select and access this object's VBO, shaders, 
		uniforms, attributes, samplers, texture buffers, and any misc. items. 
	--all variables that hold values we will transfer to the GPU to enable it to 
		render the vertices in our VBO.
	--support functions: init(), draw(), adjust(), reload(), empty(), restore().
	Put all in 'VBObox.js', a separate library file.
	CONVERSION:
	11a)--create a vboBox1 object named 'preView' and, one-by-one, comment out 	
		each existing vbo1-related VARIABLE and replace w/ 'preView' member; test. 
	11b)--comment out each vbo1-related FUNCTION call and function, and replace 
	with 'preView' members (all of initVBO1(), parts of draw(), etc) test;
	11c)--remove old vbo1 comments, create vboBox2 object name 'rayView' and use all its members to replace existing vbo2-related VARIABLEs and FUNCTIONs. test.
		--Move all the VBObox objects to the 'VBOboxes.js' library.
==============================================================================*/
// TABS set to 2.

// Global Variables  (BAD IDEA! put them inside a few well-organized objects!)
// ============================================================================
// for WebGL usage:--------------------
var gl;													// WebGL rendering context -- the 'webGL' object
																// in JavaScript with all its member fcns & data
var g_canvasID;									// HTML-5 'canvas' element ID#

// For the VBOs & Shaders:-----------------
preView = new VBObox1();		// For WebGLpreview: holds one VBO and its shaders
rayView = new VBObox2();		// for displaying the ray-tracing results.
VBObox3 = new VBObox3();
VBObox4 = new VBObox4();
VBObox5 = new VBObox5();


// For animation:---------------------
var g_last = Date.now();				// Timestamp: set after each frame of animation,
																// used by 'animate()' function to find how much
																// time passed since we last updated our canvas.
var g_angleStep = 45.0;					// Rotation angle rate, in degrees/second.
var g_currentAngle = 0.0; 				// Current rotation angle

// For mouse/keyboard:------------------------
var g_show1 = 1;								// 0==Show, 1==Hide VBO1 contents on-screen.
var g_show2 = 1;								// 	"					"			VBO2		"				"				" 
var g_show3 = 1;
var g_show4 = 1;
var g_show5 = 1;

function main() {
//=============================================================================
  // Retrieve <canvas> element
  g_canvasID = document.getElementById('webgl');
 

  // Create the the WebGL rendering context: one giant JavaScript object that
  // contains the WebGL state machine adjusted by large sets of WebGL functions,
  // built-in variables & parameters, and member data. Every WebGL function call
  // will follow this format:  gl.WebGLfunctionName(args);
  gl = getWebGLContext(g_canvasID);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  // Initialize each of our 'vboBox' objects: 
  preView.init(gl);		// VBO + shaders + uniforms + attribs for WebGL preview
  rayView.init(gl);		//  "		"		" for ray-traced on-screen result.
  VBObox3.init(gl);
  VBObox4.init(gl);
  VBObox5.init(gl);
	
  gl.clearColor(0.2, 0.2, 0.2, 1);	  // RGBA color for clearing <canvas>

  g_canvasID.onmousedown	=	function(ev){myMouseDown( ev, gl, g_canvasID) };
  g_canvasID.onmousemove = 	function(ev){myMouseMove( ev, gl, g_canvasID) };				
  g_canvasID.onmouseup = 		function(ev){myMouseUp(   ev, gl, g_canvasID)}; 

  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);
  window.addEventListener("keypress", myKeyPress, false);

  PartSys_init3(0, s30, f30, c30, partCount3);
  PartSys_init4(0, s40, f40, c40, partCount4);
  PartSys_init5(0, s50, f50, c50, partCount5);
  PartSys_init(0, s0, f0, c0, partCount2);			// 0 == full reset, bouncy-balls; 1==add velocity
  
  
	//gl.uniform1i(rayView.u_runModeID, myRunMode);		// (keyboard callbacks set myRunMode)
  
  // ==============ANIMATION=============
  // Quick tutorial on synchronous, real-time animation in JavaScript/HTML-5: 
  //  	http://creativejs.com/resources/requestanimationframe/
  //		--------------------------------------------------------
  // Why use 'requestAnimationFrame()' instead of the simpler-to-use
  //	fixed-time setInterval() or setTimeout() functions?  Because:
  //		1) it draws the next animation frame 'at the next opportunity' instead 
  //			of a fixed time interval. It allows your browser and operating system
  //			to manage its own processes, power, & computing loads, and to respond 
  //			to on-screen window placement (to skip battery-draining animation in 
  //			any window that was hidden behind others, or was scrolled off-screen)
  //		2) it helps your program avoid 'stuttering' or 'jittery' animation
  //			due to delayed or 'missed' frames.  Your program can read and respond 
  //			to the ACTUAL time interval between displayed frames instead of fixed
  //		 	fixed-time 'setInterval()' calls that may take longer than expected.
  var tick = function() {			// define our self-calling animation function:
    timeStep = animate(timeStep);  // get time passed since last screen redraw. 
    g_currentAngle = makeSpin(g_currentAngle);  // Update the rotation angle
    draw(); // Draw the triangle
    requestAnimationFrame(tick, g_canvasID); // browser request: ?call tick fcn
  };
  tick();
}

function makeSpin(angle) {
//=============================================================================
// Find the next rotation angle to use for on-screen drawing:
  // Calculate the elapsed time.
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Return the next rotation angle by adjusting it for the elapsed time.
  var newAngle = angle + (g_angleStep * elapsed) / 1000.0;
  return newAngle %= 360.0;					// keep angle >=0.0 and <360.0 degrees
}

function draw() {
//=============================================================================
  // Clear on-screen HTML-5 <canvas> object:
  gl.clear(gl.COLOR_BUFFER_BIT);

	if(g_show1 == 1) {	// IF user didn't press HTML button to 'hide' VBO1:
		preView.adjust(gl);		// Send new values for uniforms to the GPU, and
		preView.draw(gl);			// draw our VBO's contents using our shaders.
  	}
  	if(g_show2 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
  		rayView.adjust(gl);		// Send new values for uniforms to the GPU, and
  		rayView.draw(gl);			// draw our VBO's contents using our shaders.
	}
	if(g_show3 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
  		VBObox3.adjust(gl);		// Send new values for uniforms to the GPU, and
  		VBObox3.draw(gl);			// draw our VBO's contents using our shaders.
	}
	if(g_show4 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
  		VBObox4.adjust(gl);		// Send new values for uniforms to the GPU, and
  		VBObox4.draw(gl);			// draw our VBO's contents using our shaders.
	}
	if(g_show5 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
  		VBObox5.adjust(gl);		// Send new values for uniforms to the GPU, and
  		VBObox5.draw(gl);			// draw our VBO's contents using our shaders.
	}
}

function VBO1toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
  if(g_show1 != 1) g_show1 = 1;				// show,
  else g_show1 = 0;										// hide.
  console.log('g_show1: '+g_show1);
}

function VBO2toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
  if(g_show2 != 1) g_show2 = 1;			// show,
  else g_show2 = 0;									// hide.
  console.log('g_show2: '+g_show2);
}

function VBO3toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
  if(g_show3 != 1) g_show3 = 1;			// show,
  else g_show3 = 0;									// hide.
  console.log('g_show3: '+g_show3);
}

function VBO4toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
  if(g_show4 != 1) g_show4 = 1;			// show,
  else g_show4 = 0;									// hide.
  console.log('g_show4: '+g_show4);
}

function VBO5toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
  if(g_show5 != 1) g_show5 = 1;			// show,
  else g_show5 = 0;									// hide.
  console.log('g_show5: '+g_show5);
}

function animate(timeStep) {
//============================================================================== 
// How much time passed since we last updated the 'canvas' screen elements?
  var now = Date.now();												
  var elapsed = now - g_last;								
  g_last = now;  
  return elapsed;					// Return the amount of time passed.
}


var rad = 50;
var cos0xy = ((g_AtY - g_EyeY) * (g_AtY- g_EyeY))/(Math.sqrt((g_AtX - g_EyeX)*(g_AtX - g_EyeX)+(g_AtY - g_EyeY)*(g_AtY - g_EyeY))*(g_AtY - g_EyeY));
var angle = Math.acos(cos0xy);
console.log(angle);
var cos0xyz = ((g_AtX - g_EyeX)*(g_AtX - g_EyeX) + (g_AtY - g_EyeY)*(g_AtY - g_EyeY))/ (Math.sqrt((g_AtX - g_EyeX)*(g_AtX - g_EyeX) + (g_AtY - g_EyeY)*(g_AtY - g_EyeY) + (g_AtZ - g_EyeZ)*(g_AtZ - g_EyeZ)) * Math.sqrt((g_AtX - g_EyeX)*(g_AtX - g_EyeX) + (g_AtY - g_EyeY)*(g_AtY - g_EyeY)));
var angleud = Math.asin(cos0xyz);

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

        angle += 0.62831853072/20;
	}

        
        

} else if (ev.keyCode == 37) { // The left arrow key was pressed
    if(flying_mode){

	}else{
        console.log('g_AtX: '+g_AtX + '\t g_AtY: '+g_AtY + '\t g_AtZ: '+g_AtZ+'\t g_EyeX: ' + g_EyeX + '\t g_EyeY: ' + g_EyeY+'\t g_EyeZ: ' + g_EyeZ);

        g_AtY = rad * Math.cos(angle);
        g_AtX = rad * Math.sin(angle);

        angle -= 0.62831853072/20;
    }
      

} else if (ev.keyCode == 38) { // The up arrow key was pressed
	if(flying_mode){

	}else{

    	g_AtZ = rad * Math.cos(angleud);
    	g_AtY = rad * Math.cos(angle) * Math.sin(angleud);

    	angleud -= 0.62831853072/100;
    }
       
} else if (ev.keyCode == 40) { // The down arrow key was pressed
	if(flying_mode){

	}else{

        g_AtZ = rad * Math.cos(angleud);
        g_AtY = rad * Math.cos(angle) * Math.sin(angleud);

        angleud += 0.62831853072/100;
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
        g_EyeX += 0.015*vx;
        g_EyeY += 0.015*vy;
        g_EyeZ += 0.015*vz;
        g_AtX += 0.015*vx;
        g_AtY += 0.015*vy;
        g_AtZ += 0.015*vz;
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
        g_EyeX -= 0.015*vx;
        g_EyeY -= 0.015*vy;
        g_EyeZ -= 0.015*vz;
        g_AtX -= 0.015*vx;
        g_AtY -= 0.015*vy;
        g_AtZ -= 0.015*vz;
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
		case '0':	
			myRunMode = 0;			// RESET!
			myRunMode3 = 0;
			myRunMode4 = 0;
			myRunMode5 = 0;
			break;
		case '1':
			myRunMode = 1;			// PAUSE!
			myRunMode3 = 1;
			myRunMode4 = 1;
			myRunMode5 = 1;
			break;
		case '2':
			myRunMode = 2;			// STEP!
			myRunMode3 = 2;
			myRunMode4 = 2;
			myRunMode5 = 2;
			break;
		case '3':							// RUN!
			myRunMode = 3;
			myRunMode3 = 3;
			myRunMode4 = 3;
			myRunMode5 = 3;
			break;
		case '4':							// RUN!
			flying_mode = !flying_mode;
			if (flying_mode){
				document.getElementById("flyingMode").innerHTML = "ON";
			}else{
				document.getElementById("flyingMode").innerHTML = "OFF";
			}
			break;
		case 'R':  // HARD reset: position AND velocity.
		  	myRunMode = 0;			// RESET!
		   	myRunMode3 = 0;
		   	myRunMode4 = 0;
		   	myRunMode5 = 0;
		  /* REPLACE with a call to PartSys_init()
			s0[PART_XPOS] =     0.0;	s0[PART_YPOS] =     0.0;	s0[PART_ZPOS] =  0.0;	
			s0[PART_XVEL]= INIT_VEL;	s0[PART_YVEL]= INIT_VEL;	s0[PART_ZVEL] =  0.0;
			*/
			PartSys_init(0, s0, f0, c0, partCount2);
			PartSys_init3(0, s30, f30, c30, partCount3);
			PartSys_init4(0, s40, f40, c40, partCount4);
			PartSys_init5(0, s50, f50, c50, partCount5);
			break;
		case 'r':		// 'SOFT' reset: boost velocity only.
			// don't change myRunMode
			/* REPLACE with a call to PartSys_init()
			if(s0[PART_XVEL] > 0.0) s0[PART_XVEL] += INIT_VEL; 
												 else s0[PART_XVEL] -= INIT_VEL;
			if(s0[PART_YVEL] > 0.0) s0[PART_YVEL] += INIT_VEL; 
												 else s0[PART_YVEL] -= INIT_VEL;
			*/
			PartSys_init(1, s0, f0, c0, partCount2);
			PartSys_init3(1, s30, f30, c30, partCount3);
			PartSys_init4(1, s40, f40, c40, partCount4);
			PartSys_init5(1, s50, f50, c50, partCount5);
			break;	
		case 'p':
		case 'P':			// toggle pause/run:
			if(myRunMode==3) myRunMode = 1;		// if running, pause
			else myRunMode = 3;		// if paused, run.

			if(myRunMode3==3) myRunMode3 = 1;		// if running, pause
			else myRunMode3 = 3;		// if paused, run.

			if(myRunMode4==3) myRunMode4 = 1;		// if running, pause
			else myRunMode4 = 3;		// if paused, run.

			if(myRunMode5==3) myRunMode5 = 1;		// if running, pause
			else myRunMode5 = 3;		// if paused, run.

			break;
		case ' ':			// space-bar: single-step
			myRunMode = 2;
			myRunMode3 = 2;
			myRunMode4 = 2;
			myRunMode5 = 2;
			break;
		case 'z':			// z backwards
			s0[(partCount2-1)*PART_MAXVAR + PART_YPOS] -= 0.01;
			//s0[partCount2*PART_MAXVAR + PART_YVEL] -= 0.01
			console.log()
			break;
		case 'x':			// x forwards
			s0[(partCount2-1)*PART_MAXVAR + PART_YPOS] += 0.01;
			//s0[partCount2*PART_MAXVAR + PART_YVEL] += 0.01;
			break;

		case 'a':			// a left
			s0[(partCount2-1) *PART_MAXVAR + PART_XPOS] += 0.02;
			/*s0[0*widthCount*PART_MAXVAR + PART_XPOS] += 0.04 * 2;
			s0[0*widthCount*PART_MAXVAR + PART_XVEL] += 0.01 * 2;

			s0[2*widthCount*PART_MAXVAR + PART_XPOS] += 0.02 * 2;
			s0[2*widthCount*PART_MAXVAR + PART_XVEL] += 0.01 * 2;

			s0[4*widthCount*PART_MAXVAR + PART_XPOS] += 0.02 * 2;
			s0[4*widthCount*PART_MAXVAR + PART_XVEL] += 0.01 * 2;

			s0[6*widthCount*PART_MAXVAR + PART_XPOS] += 0.02 * 2;
			s0[6*widthCount*PART_MAXVAR + PART_XVEL] += 0.01 * 2;
			console.log()*/
			break;
		case 'd':			// d right
			s0[(partCount2-1) *PART_MAXVAR + PART_XPOS] -= 0.02;
			/*s0[0*widthCount*PART_MAXVAR + PART_XPOS] -= 0.02 * 2;
			s0[0*widthCount*PART_MAXVAR + PART_XVEL] -= 0.01 * 2;

			s0[2*widthCount*PART_MAXVAR + PART_XPOS] -= 0.02 * 2;
			s0[2*widthCount*PART_MAXVAR + PART_XVEL] -= 0.01 * 2;

			s0[4*widthCount*PART_MAXVAR + PART_XPOS] -= 0.02 * 2;
			s0[4*widthCount*PART_MAXVAR + PART_XVEL] -= 0.01 * 2;

			s0[6*widthCount*PART_MAXVAR + PART_XPOS] -= 0.02 * 2;
			s0[6*widthCount*PART_MAXVAR + PART_XVEL] -= 0.01 * 2;*/
			break;
		case 'w':			// w up

			s0[(partCount2-1) *PART_MAXVAR + PART_ZPOS] += 0.02;
			//s0[partCount2 *PART_MAXVAR + PART_ZVEL] += 0.01
			console.log()
			break;
		case 's':			// s down
			s0[(partCount2-1)*PART_MAXVAR + PART_ZPOS] -= 0.02;
			//s0[0*PART_MAXVAR + PART_ZVEL] -= 0.01
			break;
		default:
			console.log('myKeyPress(): Ignored key: '+myChar);
			break;
		case 'b':			// w up
			wind_fire(f40,ForcerCount4);
			wind_fire(f30,ForcerCount3);
			blow(f0, ForcerCount);
			//s0[0*PART_MAXVAR + PART_ZPOS] += 0.02;
			//s0[0*PART_MAXVAR + PART_ZVEL] += 0.01
			console.log()
		break;
	}
}

function LookAtVBO2(){
	g_EyeX = 0, g_EyeY = 4, g_EyeZ =0.0;
 	g_AtX = 0, g_AtY = 0, g_AtZ = 0; 

}
function LookAtVBO3(){
	g_EyeX = -3, g_EyeY = 4, g_EyeZ =0.0;
 	g_AtX = -3, g_AtY = 0, g_AtZ = 0; 

}
function LookAtVBO4(){
	g_EyeX = 2, g_EyeY = 4, g_EyeZ =0.0;
 	g_AtX = 2, g_AtY = 0, g_AtZ = 0; 
	
}
function LookAtVBO5(){
	g_EyeX = 3, g_EyeY = -2, g_EyeZ =0.0;
 	g_AtX = 3, g_AtY = -6, g_AtZ = 0; 
}

function increase_rate(){
		if (h2 > 0.5){
			h2 = 0.5;
		}else{
			h2 += 0.02;
		}

		if (h3 > 0.5){
			h3 = 0.5;
		}else{
			h3 += 0.02;
		}
		if (h4 > 0.5){
			h4 = 0.5;
		}else{
			h4 += 0.02;
		}
		if (h5 > 0.3){
			h5 = 0.3;
		}else{
			h5 += 0.01;
		}
		

}
function decrease_rate(){
	
		if (h2 < 0.05){
			h2 = 0.05;
		}else{
			h2 -= 0.02;
		}
		if (h3 < 0.05){
			h3 = 0.05;
		}else{
			h3 -= 0.02;
		}
		if (h4 < 0.05){
			h4 = 0.05;
		}else{
			h4 -= 0.02;
		}
		if (h5 < 0.02){
			h5 = 0.02;
		}else{
			h5 -= 0.01;
		}
}


