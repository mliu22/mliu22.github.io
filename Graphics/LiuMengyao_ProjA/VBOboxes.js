//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

/*=====================
  VBOboxes.js library: 
  ===================== 
One 'VBObox' object contains all we need for WebGL/OpenGL to render on-screen a 
		the shapes made from vertices stored in one Vertex Buffer Object (VBO), 
		as drawn by one 'shader program' that runs on your computer's Graphical  
		Processing Unit(GPU).  
The 'shader program' consists of a Vertex Shader and a Fragment Shader written 
		in GLSL, compiled and linked and ready to execute as a Single-Instruction, 
		Multiple-Data (SIMD) parallel program executed simultaneously by multiple 
		'shader units' on the GPU.  The GPU runs one 'instance' of the Vertex 
		Shader for each vertex in every shape, and one 'instance' of the Fragment 
		Shader for every on-screen pixel covered by any part of any drawing 
		primitive defined by those vertices.
The 'VBO' consists of a 'buffer object' (a memory block reserved in the GPU),
		accessed by the shader program through its 'attribute' and 'uniform' 
		variables.  Each VBObox object stores its own 'uniform' values in 
		JavaScript; its 'adjust()'	function computes newly-updated values and 
		transfers them to the GPU for use.
This example uses the 'glmatrix.js' library for vectors and matrices: Google it!
		This vector/matrix library is more complete, more widely-used, and runs
		faster than our textbook's 'cuon-matrix' library.  
		--------------------------------------------------------------
		I recommend you use glMatrix.js instead of cuon-matrix-quat.js
		--------------------------------------------------------------
		for all future WebGL programs. You can CONVERT existing cuon-matrix-based
		programs to glmatrix.js in a very gradual, sensible, testable way:
		--add the glmatrix.js library to an existing cuon-matrix-based program;
			(but don't call any of its functions yet)
		--comment out the glmatrix.js parts (if any) that cause conflicts or in				any way disrupt the operation of your program.
		--make just one small local change in your program; find a small, simple,
			easy-to-test portion of your program where you can replace a 
			cuon-matrix object or function call with a glmatrix function call.
			Test; make sure it works.
		--Save a copy of this new program as your latest numbered version. Repeat
			the previous step: go on to the next small local change in your program
			and make another replacement of cuon-matrix use with glmatrix use. 
			Test it; make sure it works; save this as your next numbered version.
		--Continue this process until your program no longer uses any cuon-matrix
			library features at all, and no part of glmatrix is commented out.
			Remove cuon-matrix from your library, and now use only glmatrix.

	-------------------------------------------------------
	A MESSY SET OF CUSTOMIZED OBJECTS--NOT REALLY A 'CLASS'
	-------------------------------------------------------
As each 'VBObox' object will contain DIFFERENT GLSL shader programs, DIFFERENT 
		attributes for each vertex, DIFFERENT numbers of vertices in VBOs, and 
		DIFFERENT uniforms, I don't see any easy way to use the exact same object 
		constructors and prototypes for all VBObox objects.  Individual VBObox 
		objects may vary substantially, so I recommend that you copy and re-name an 
		existing VBObox prototype object, rename it, and modify as needed, as shown 
		here. (e.g. to make the VBObox2 object, copy the VBObox1 constructor and 
		all its prototype functions, then modify their contents for VBObox2 
		activities.)
Note that you don't really need a 'VBObox' object at all for simple, 
		beg -level WebGL/OpenGL programs: if all vertices contain exactly 
		the same attributes (e.g. position, color, surface normal), and use 
		the same shader program (e.g. same Vertex Shader and Fragment Shader), 
		then our textbook's simple 'example code' will suffice.  
		But that's rare -- most genuinely useful WebGL/OpenGL programs need 
		different sets of vertices with  different sets of attributes rendered 
		by different shader programs.  
		*** A customized VBObox object for each VBO/shader pair will help you
		remember and correctly implement ALL the WebGL/GLSL steps required for 
		a working multi-shader, multi-VBO program.
*/
// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
// 2017.02.20 J. Tumblin-- updated for EECS 351 use for Project C.
//=============================================================================
// Tabs set to 2

//=============================================================================
//=============================================================================
var floatsPerVertex = 7;
var gndVerts;
var canvas_width;
var canvas_height;
var g_EyeX = 0, g_EyeY = 4, g_EyeZ =0.0;
var g_AtX = 0, g_AtY = 0, g_AtZ = 0; 
var upX = 0, upY = 0, upZ = 1;

function VBObox1() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox1' object  that holds all data and 
// fcns needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate set of shaders.
  
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'precision mediump float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  //'uniform   int u_runMode; \n' +					// particle system state: 
  																				// 0=reset; 1= pause; 2=step; 3=run
  //'uniform   bool moving; \n' +
  //'uniform	 vec4 u_ballShift; \n' +			// single bouncy-ball's movement
  'attribute vec4 a_Pos1;\n' +
  'attribute vec3 a_Colr1;\n' +
  'uniform mat4 u_ViewMatrix1;\n' +
  'uniform mat4 u_ProjMatrix1;\n' +
  'varying   vec3 v_Colr1; \n' +
  'void main() {\n' +
  '	 gl_Position = u_ProjMatrix1 * u_ViewMatrix1 * a_Pos1; \n' +	
  '  v_Colr1 = a_Colr1;\n' +
  '} \n';

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'varying vec3 v_Colr1; \n' +
  'uniform bool moving; \n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr1, 1.0);\n' +
  '}\n';


  	
	/*this.vboContents = //--------------------- 
	new Float32Array ([						// Array of vertex attribute values we will
  															// transfer to GPU's vertex buffer object (VBO)
	// 1st triangle:
  	 0.0,	 0.5,	0.0, 1.0,		1.0, 0.0, 0.0, //1 vertex:pos x,y,z,w; color: r,g,b
    -0.5, -0.5, 0.0, 1.0,		0.0, 1.0, 0.0,
     0.5, -0.5, 0.0, 1.0,		0.0, 0.0, 1.0,
 // 2nd triangle:
		 0.0,  0.0, 0.0, 1.0,   1.0, 1.0, 1.0,		// (white)
		 0.3,  0.0, 0.0, 1.0,   0.0, 0.0, 1.0,		// (blue)
		 0.0,  0.3, 0.0, 1.0,   0.5, 0.5, 0.5,		// (gray)
		 ]);
*/
	makeGroundGrid();
	this.vboContents = gndVerts;
	this.vboVerts = gndVerts.length;						// # of vertices held in 'vboContents' array;
	this.vboLoc;										// Vertex Buffer Object location# on the GPU
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
																	// bytes req'd for 1 array element;
																	// (why? used to compute stride and offset 
																	// in bytes for vertexAttribPointer() calls) 
	this.shaderLoc;									// Shader-program location # on the GPU, made 
																	// by compile/link of VERT_SRC and FRAG_SRC.
								//-------------------- Attribute locations in our shaders
	this.a_PosLoc;									// GPU location for 'a_Pos1' attribute
	this.a_ColrLoc;									// GPU location for 'a_Colr1' attribute

								//-------------------- Uniform locations &values in our shaders
	//this.ModelMat = new Matrix4();		// Transforms CVV axes to model axes.
	//this.u_ModelMatLoc;								// GPU location for u_ModelMat uniform

	this.viewMatrix = new Matrix4();
  	this.projMatrix = new Matrix4();
  	this.u_ViewMatrix;
  	this.u_ProjMatrix;

}

VBObox1.prototype.init = function(myGL) {
//=============================================================================
// Create, compile, link this VBObox object's shaders to an executable 'program'
// ready for use in the GPU.  Create and fill a Float32Array that holds all VBO 
// vertices' values; create a new VBO on the GPU and fill it with those values. 
// Find the GPU location of	all our shaders' attribute- and uniform-variables; 
// assign the correct portions of VBO contents as the data source for each 
// attribute, and transfer current values to the GPU for each uniform variable.
// (usually called only once, within main()) 
// Compile,link,upload shaders-------------------------------------------------
	this.shaderLoc = createProgram(myGL, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
	// CUTE TRICK: we can print the NAME of this VBO object: tells us which one!
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
	myGL.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())
// Create VBO on GPU, fill it--------------------------------------------------
	this.vboLoc = myGL.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  // Specify the purpose of our newly-created VBO.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
  								this.vboLoc);				// the ID# the GPU uses for this buffer.
  											
 // Transfer data from JavaScript Float32Array object to the just-bound VBO. 
 //  (Recall gl.bufferData() changes GPU's memory allocation: use 
 //		gl.bufferSubData() to modify buffer contents without changing its size)
 //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
 //	(see OpenGL ES specification for more info).  Your choices are:
 //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
 //				contents rarely or never change.
 //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
 //				contents may change often as our program runs.
 //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
 // 			times and then discarded; for rapidly supplied & consumed VBOs.
  myGL.bufferData(gl.ARRAY_BUFFER, 			// GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.
  							 
// Find & Set All Attributes:------------------------------
  // a) Get the GPU location for each attribute var used in our shaders:
  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Pos1');
    return -1;	// error exit.
  }
 	this.a_ColrLoc = myGL.getAttribLocation(this.shaderLoc, 'a_Colr1');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() failed to get the GPU location of attribute a_Colr1');
    return -1;	// error exit.
  }
  // b) Next, set up GPU to fill these attribute vars in our shader with 
  // values pulled from the currently-bound VBO (see 'gl.bindBuffer()).
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  myGL.vertexAttribPointer(
		this.a_PosLoc,//index == ID# for the attribute var in your GLSL shaders;
		4,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		7*this.FSIZE,	// Stride == #bytes we must skip in the VBO to move from one 
									// of our stored attributes to the next.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		0);						// Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, 3, gl.FLOAT, false, 
  							7*this.FSIZE, 4*this.FSIZE);
  // c) Enable this assignment of the attribute to its' VBO source:
  myGL.enableVertexAttribArray(this.a_PosLoc);
  myGL.enableVertexAttribArray(this.a_ColrLoc);
// Find All Uniforms:--------------------------------
//Get GPU storage location for each uniform var used in our shader programs: 
/*	this.u_ModelMatLoc = myGL.getUniformLocation(this.shaderLoc, 'u_ModelMat1');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }
*/
  this.u_ViewMatrix = myGL.getUniformLocation(this.shaderLoc, 'u_ViewMatrix1');
  this.u_ProjMatrix = myGL.getUniformLocation(this.shaderLoc, 'u_ProjMatrix1');

  if (!this.u_ViewMatrix || !this.u_ProjMatrix) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ViewMatrix1 and u_ProjMatrix1 uniform');
    return;
  }
}

VBObox1.prototype.adjust = function(myGL) {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.
	// Adjust values for our uniforms,
  //this.ModelMat.setRotate(g_currentAngle, 0, 0, 1);	// rotate drawing axes,
  //this.ModelMat.translate(0.35, 0, 0);							// then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  //myGL.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  //										false, 				// use matrix transpose instead?
  //										this.ModelMat.elements);	// send data from Javascript.
  myGL.viewport(0, 0, myGL.drawingBufferWidth, myGL.drawingBufferHeight);
  myGL.viewport(0,                              // Viewport lower-left corner
              	0,                              // (x,y) location(in pixels)
              	myGL.drawingBufferWidth,        // viewport width, height.
              	myGL.drawingBufferHeight);

  // Set the matrix to be used for to set the camera view
  this.viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,  // eye position
                        g_AtX, g_AtY, g_AtZ,                // look-at point (origin)
                        0, 0, 1);               // up vector (+y)  

  this.canvas_width = g_canvasID.width;
  this.canvas_height = g_canvasID.height;
  this.projMatrix.setPerspective(30, this.canvas_width/this.canvas_height, 1, 100);
  
  //this.projMatrix.setPerspective(30, 400/400, 1, 100);
  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);

}

VBObox1.prototype.draw = function(myGL) {
//=============================================================================
// Send commands to GPU to select and render current VBObox contents.  	

  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.
//------CAREFUL! RE-BIND YOUR VBO AND RE-ASSIGN SHADER ATTRIBUTES!-------------
//		Each call to useProgram() reconfigures the GPU's processors & data paths 
// for efficient SIMD execution of the newly-selected shader program. While the 
// 'old' shader program's attributes and uniforms remain at their same memory 
// locations, starting the new shader program invalidates the old data paths 
// that connected these attributes to the VBOs in memory that supplied their 
// values. When we call useProgram() to return to our 'old' shader program, we 
// must re-establish those data-paths between shader attributes and VBOs, even 
// if those attributes, VBOs, and locations have not changed!
//		Thus after each useProgram() call, we must:
// a)--call bindBuffer() again to re-bind each VBO that our shader will use, &
// b)--call vertexAttribPointer() again for each attribute in our new shader
//		program, to re-connect the data-path(s) from bound VBO(s) to attribute(s):
// c)--call enableVertexAttribArray() to enable use of those data paths.
//----------------------------------------------------
	// a) Re-set the GPU's currently 'bound' vbo buffer;
	myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
										this.vboLoc);			// the ID# the GPU uses for this buffer.
	// (Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  // b) Re-connect data paths from VBO to each shader attribute:
  myGL.vertexAttribPointer(this.a_PosLoc, 4, myGL.FLOAT, false, 
  													7*this.FSIZE, 0);		// stride, offset
  myGL.vertexAttribPointer(this.a_ColrLoc, 3, myGL.FLOAT, false, 
  													7*this.FSIZE, 4*this.FSIZE); // stride, offset
  // c) enable the newly-re-assigned attributes:
  myGL.enableVertexAttribArray(this.a_PosLoc);
	myGL.enableVertexAttribArray(this.a_ColrLoc);


  this.viewMatrix.translate(0.0, 0.0, -0.6);
  this.viewMatrix.scale(0.05, 0.05,0.05);
  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  // ----------------------------Draw the contents of the currently-bound VBO:
  myGL.drawArrays(myGL.LINES, 	// select the drawing primitive to draw,
  								0, 								// location of 1st vertex to draw;
  								gndVerts.length/floatsPerVertex);		// number of vertices to draw on-screen.
  this.viewMatrix.scale(1/0.05, 1/0.05,1/0.05); 
  this.viewMatrix.translate(0.0, 0.0, 0.6);
  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);

}
/*
/
VBObox1.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU inside our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
// Give meaningful names to array indices for the particle(s) in state vectors.
const PART_XPOS     = 0;  //  position    
const PART_YPOS     = 1;
const PART_ZPOS     = 2;
const PART_XVEL     = 3; //  velocity    
const PART_YVEL     = 4;
const PART_ZVEL     = 5;
const PART_X_FTOT   = 6;  // force accumulator:'ApplyForces()' fcn clears
const PART_Y_FTOT   = 7;  // to zero, then adds each force to each particle.
const PART_Z_FTOT   = 8;        
const PART_R        = 9;  // color : red,green,blue
const PART_G        =10;  
const PART_B        =11;
const PART_MASS     =12;  // mass   
const PART_DIAM     =13;  // on-screen diameter (in pixels)
const PART_RENDMODE =14;  // on-screen appearance (square, round, or soft-round)
//const PART_SPEED    =15
/* // Other useful particle values, currently unused
const PART_AGE      =15;  // # of frame-times since creation/initialization
const PART_CHARGE   =16;  // for electrostatic repulsion/attraction
const PART_MASS_VEL =17;  // time-rate-of-change of mass.
const PART_MASS_FTOT=18;  // force-accumulator for mass-change
const PART_R_VEL    =19;  // time-rate-of-change of color:red
const PART_G_VEL    =20;  // time-rate-of-change of color:grn
const PART_B_VEL    =21;  // time-rate-of-change of color:blu
const PART_R_FTOT   =22;  // force-accumulator for color-change: red
const PART_G_FTOT   =23;  // force-accumulator for color-change: grn
const PART_B_FTOT   =24;  // force-accumulator for color-change: blu
*/
const PART_MAXVAR   =15;  // Size of array in CPart uses to store its values.

//name of forcer_obj items
const f_type = 0;
const grav_e = 1;
const grav_p = 2;
const K_s = 3;
const RLen_s = 4;
const Start_s = 5;
const End_s = 6;
const wind_x = 7;
const wind_y = 8;
const wind_z = 9;
const push_f = 10;
const boid_sep = 11;
const boid_cir = 12
const forcer_maxvar = 13;


//names for Forcer Set indexg
const F_NONE = 0;
const F_GRAV_E = 1;
const F_GRAV_P = 2;
const F_SPRING = 3;
const F_SPRING_GRID = 4;
const F_WIND = 5;
const F_WIND_FIRE = 6;
const F_PUSH = 7;
const F_BOID = 8;
const F_FIRE = 9;



const F_SPRING_K = 3;
const F_SPRING_L = 4;
//const F_SPRING_P0 = 5;
//const F_SPRING_P1 = 6;
//const F_SPRING_P2 = 7;

var F_SPRING_PSTART;
const F_SPRING_PEND = 6;


const F_MAX = 10;

//names for constraint set index
const CONSRNT1_XMIN = 0;
const CONSRNT1_YMIN = 1;
const CONSRNT1_ZMIN = 2;
const CONSRNT1_XMAX = 3;
const CONSRNT1_YMAX = 4;
const CONSRNT1_ZMAX = 5;
const CONSRNT_MAXVAR  =6;  // Size of array in CPart uses to store its values.



var timeStep = 1.0;        // initialize; current timestep in seconds
var h2 = 0.2;
var g_last = Date.now();        // Timestamp: set after each frame of animation,
                                // used by 'animate()' function to find how much
                                // time passed since we last updated our canvas.
var partCount2 = 9 * 6 * 5 + 1;       // # of particles in our state variable s[0] that
//TRY 321,123 particles...)   // we will actually display on-screen.      
var widthCount = 9 * 5;
var ForcerCount = 9;  
var ConsrntCount = 1;
var myRunMode = 0;      // Particle System: 0=reset; 1= pause; 2=step; 3=run
var INIT_VEL = 0.050;    // avg particle speed: ++Start,--Start buttons adjust.
// Create & initialize our first, simplest 'state variable' s0:
// Note that I've made 3 particles here, but at first I'll just use one of them.
var s0 = new Float32Array(partCount2 * PART_MAXVAR);
var s1 = new Float32Array(partCount2 * PART_MAXVAR);
var sm = new Float32Array(partCount2 * PART_MAXVAR);
var s0dot = new Float32Array(partCount2 * PART_MAXVAR);
var smdot = new Float32Array(partCount2 * PART_MAXVAR);

var sPre = new Float32Array(partCount2 * PART_MAXVAR);
for(var i = 0; i < sPre.length; i++){
  sPre[i] = 0.0000001;
}
var sPredot = new Float32Array(partCount2 * PART_MAXVAR);

var f0 = new Float32Array(forcer_maxvar*ForcerCount);
var c0 = new Float32Array(CONSRNT_MAXVAR);

var FSIZE = s0.BYTES_PER_ELEMENT; // memory needed to store an s0 array element;
                                  // (why? helps us compute stride and offset 
                                  // in the 
var isDrag=false;   // mouse-drag: true when user holds down mouse button
var xMclik=0.0;     // last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

var wind = false;

var hanging = true;

var line = false;

var solverSel = 1;


function VBObox2() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox' object  that holds all data and fcns 
// needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate set of shaders.
  
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'precision highp float;\n' +        // req'd in OpenGL ES if we use 'float'
  'uniform bool moving2; \n' +
  //'uniform bool moving; \n' +
  'uniform mat4 u_ViewMatrix2;\n' +
  'uniform mat4 u_ProjMatrix2;\n' +
  'int partCount;\n' +
  //'CPart *ps0;\n' +
  'int forcerCount;\n' +
  'int limitCount;\n' +
  //
  'attribute vec3 a_Position; \n' +       // current state: particle position
  'attribute vec3 a_Color; \n' +          // current state: particle color
  'attribute float a_diam; \n' +          // current state: diameter in pixels
  'varying   vec4 v_Color; \n' +          // (varying--send to particle
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix2 * u_ViewMatrix2 * vec4(a_Position.x - 0.9, a_Position.y - 0.9, a_Position.z, 1.0);  \n' +  
  '  gl_PointSize = a_diam; \n' +
  '  v_Color = vec4(a_Color, 1.0); \n' +
  '} \n';
// Each instance computes all the on-screen attributes for just one VERTEX,
// supplied by 'attribute vec4' variable a_Position, filled from the 
// Vertex Buffer Object (VBO) we created inside the graphics hardware by calling 
// the 'initVertexBuffers()' function, and updated by 'PartSys_render() calls.

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'uniform  int u_runMode; \n' +  
  'varying vec4 v_Color; \n' +
  'uniform bool moving2; \n' +
  'void main() {\n' +  
  ' if(!moving2) { \n' +
  '  gl_FragColor = v_Color;\n' +
  ' } \n' +
  ' else { \n' +
  '  if(u_runMode == 0) { \n' +
  '    gl_FragColor = v_Color;  \n' +   // red: 0==reset
  '  } \n' +
  '  else if(u_runMode == 1 || u_runMode == 2) {  \n' + //  1==pause, 2==step
  '    float dist = distance(gl_PointCoord, vec2(0.5,0.5)); \n' +
  '    if(dist < 0.5) { gl_FragColor = v_Color; } else {discard; } \n' +
  '  }  \n' +
  '  else { \n' +
  '    float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
  '    if(dist < 0.5) { \n' + 
  '       gl_FragColor = vec4((1.0 - 1.5*dist)*v_Color.rgb, 1.0);\n' +
  '    } else { discard; }\n' +
  '  }  \n;' +
  ' } \n' +

  '} \n';

	this.vboContents = //---------------------
		new Float32Array ([					// Array of vertex attribute values we will
  															// transfer to GPU's vertex buffer object (VBO)
			// 1 vertex per line: pos x,y,z,w;   color; r,g,b;   point-size; 
  	-0.3,  0.7,	0.0, 1.0,		0.0, 1.0, 1.0,   7.0,
    -0.3, -0.3, 0.0, 1.0,		1.0, 0.0, 1.0,  10.0,
     0.3, -0.3, 0.0, 1.0,		1.0, 1.0, 0.0,  13.0,
  ]);
	this.vboVerts = 3;							// # of vertices held in 'vboContents' array;
	this.vboLoc;										// Vertex Buffer Object location# on the GPU
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
																	// bytes req'd for 1 array element;
																	// (why? used to compute stride and offset 
																	// in bytes for vertexAttribPointer() calls) 
	this.shaderLoc;									// Shader-program location # on the GPU, made 
																	// by compile/link of VERT_SRC and FRAG_SRC.
								//-------------------- Attribute locations in our shaders
	this.a_PositionID;							// GPU location: shader 'a_Position' attribute
	this.a_ColorID;								// GPU location: shader 'a_Color' attribute
	//this.a_PtSize;									// GPU location: shader 'a_PtSize' attribute
								//-------------------- Uniform locations &values in our shaders


  this.viewMatrix = new Matrix4();
    this.projMatrix = new Matrix4();
    this.u_ViewMatrix;
    this.u_ProjMatrix;
};


VBObox2.prototype.init = function(myGL) {
//=============================================================================
// Create, compile, link this VBObox object's shaders to an executable 'program'
// ready for use in the GPU.  Create and fill a Float32Array that holds all VBO 
// vertices' values; create a new VBO on the GPU and fill it with those values. 
// Find the GPU location of	all our shaders' attribute- and uniform-variables; 
// assign the correct portions of VBO contents as the data source for each 
// attribute, and transfer current values to the GPU for each uniform variable.
// (usually called only once, within main()) 

	this.shaderLoc = createProgram(myGL, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
	this.vboLoc = myGL.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  // Specify the purpose of our newly-created VBO.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
  								this.vboLoc);				// the ID# the GPU uses for this buffer.
  											
 // Transfer data from our JavaScript Float32Array object to the just-bound VBO. 
 //  (Recall gl.bufferData() changes GPU's memory allocation: use 
 //		gl.bufferSubData() to modify buffer contents without changing its size)
 //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
 //	(see OpenGL ES specification for more info).  Your choices are:
 //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
 //				contents rarely or never change.
 //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
 //				contents may change often as our program runs.
 //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
 // 			times and then discarded; for rapidly supplied & consumed VBOs.
  myGL.bufferData(gl.ARRAY_BUFFER, 			// GLenum target(same as 'bindBuffer()')
 					 				s0, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.
  							 
// Find & Set All Attributes:------------------------------
  // a) Get the GPU location for each attribute var used in our shaders:
  this.a_PositionID = gl.getAttribLocation(this.shaderLoc, 'a_Position');
  if(this.a_PositionID < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Position');
    return -1;	// error exit.
  }
 	this.a_ColorID = myGL.getAttribLocation(this.shaderLoc, 'a_Color');
  if(this.a_ColorID < 0) {
    console.log(this.constructor.name + 
    						'.init() failed to get the GPU location of attribute a_Color');
    return -1;	// error exit.
  }

  // b) Next, set up GPU to fill these attribute vars in our shader with 
  // values pulled from the currently-bound VBO (see 'gl.bindBuffer()).
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  myGL.vertexAttribPointer(
		this.a_PositionID,//index == ID# for the attribute var in GLSL shader pgm;
		3,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		myGL.FLOAT,		// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		PART_MAXVAR*this.FSIZE,	// Stride == #bytes we must skip in the VBO to move from one 
									// of our stored attributes to the next.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Vertex size in bytes: 4 floats for pos; 3 color; 1 PtSize)
		PART_XPOS*this.FSIZE);						// Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  myGL.vertexAttribPointer(this.a_ColorID, 3, myGL.FLOAT, false, 
  						PART_MAXVAR*this.FSIZE, 			// stride for VBO2 (different from VBO1!)
  						PART_R*this.FSIZE);			// offset: skip the 1st 4 floats.

  // c) Enable this assignment of the attribute to its' VBO source:
  myGL.enableVertexAttribArray(this.a_PositionID);
  myGL.enableVertexAttribArray(this.a_ColorID);

   // ---------------Connect 'a_diam' attribute to bound buffer:---------------
  // Get the ID# for the scalar a_diam variable in the graphics hardware
  // (keep it as global var--we'll need it for PartSys_render())
  this.a_diamID = myGL.getAttribLocation(this.shaderLoc, 'a_diam');
  if(this.a_diamID < 0) {
    console.log('Failed to get the storage location of scalar a_diam');
    return -1;
  }
  // Tell GLSL to fill 'a_Position' attribute variable for each shader 
  // with values in the buffer object chosen by 'gl.bindBuffer()' command.
  // Websearch yields OpenGL version: 
  //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
  myGL.vertexAttribPointer(
    this.a_diamID,     //index == attribute var. name used in the shader pgm.
    1,            // size == how many dimensions for this attribute: 1,2,3 or 4?
    myGL.FLOAT,     // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  to normalize before use? true or false
    PART_MAXVAR*this.FSIZE,// stride == #bytes (of other, interleaved data) between 
                      // separating OUR values?
    PART_DIAM*this.FSIZE); // Offset -- how many bytes from START of buffer to the
                      // value we will actually use?  We start with position.
  // Enable this assignment of the a_Position variable to the bound buffer:
  myGL.enableVertexAttribArray(this.a_diamID);


  this.u_runModeID = myGL.getUniformLocation(this.shaderLoc, 'u_runMode');
  if(!this.u_runModeID) {
    console.log('Failed to get u_runMode variable location');
    return;
  }   
  this.u_ViewMatrix = myGL.getUniformLocation(this.shaderLoc, 'u_ViewMatrix2');
  this.u_ProjMatrix = myGL.getUniformLocation(this.shaderLoc, 'u_ProjMatrix2');

  this.u_moving = myGL.getUniformLocation(this.shaderLoc, 'moving2');
  if(!this.u_moving) {
    console.log('Failed to get moving variable location');
    //return;
  }


}

VBObox2.prototype.adjust = function(myGL) {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.
  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.

}

VBObox2.prototype.draw = function(myGL) {
//=============================================================================
// Send commands to GPU to select and render current VBObox contents.
  	
  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.
//------CAREFUL! RE-BIND YOUR VBO AND RE-ASSIGN SHADER ATTRIBUTES!-------------
//		Each call to useProgram() reconfigures the GPU's processors & data paths 
// for efficient SIMD execution of the newly-selected shader program. While the 
// 'old' shader program's attributes and uniforms remain at their same memory 
// locations, starting the new shader program invalidates the old data paths 
// that connected these attributes to the VBOs in memory that supplied their 
// values. When we call useProgram() to return to our 'old' shader program, we 
// must re-establish those data-paths between shader attributes and VBOs, even 
// if those attributes, VBOs, and locations have not changed!
//		Thus after each useProgram() call, we must:
// a)--call bindBuffer() again to re-bind each VBO that our shader will use, &
// b)--call vertexAttribPointer() again for each attribute in our new shader
//		program, to re-connect the data-path(s) from bound VBO(s) to attribute(s):
// c)--call enableVertexAttribArray() to enable use of those data paths.
//----------------------------------------------------
	// a) Re-set the GPU's currently 'bound' vbo buffer;
	myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
										this.vboLoc);			// the ID# the GPU uses for this buffer.
	// (Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  //b) Re-connect data paths from VBO to each shader attribute:
  myGL.vertexAttribPointer(this.a_PositionID, 4, myGL.FLOAT, false, 
  													PART_MAXVAR*this.FSIZE, PART_XPOS*FSIZE);							// stride, offset
  myGL.vertexAttribPointer(this.a_ColorID, 3, myGL.FLOAT, false, 
              PART_MAXVAR*this.FSIZE,       // stride for VBO2 (different from VBO1!)
              PART_R*this.FSIZE);     // offset: skip the 1st 4 floats.
  myGL.vertexAttribPointer(
    this.a_diamID,     //index == attribute var. name used in the shader pgm.
    1,            // size == how many dimensions for this attribute: 1,2,3 or 4?
    myGL.FLOAT,     // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  to normalize before use? true or false
    PART_MAXVAR*this.FSIZE,// stride == #bytes (of other, interleaved data) between 
                      // separating OUR values?
    PART_DIAM*this.FSIZE); // Offset -- how many bytes from START of buffer to the
                      // value we will actually use?  We start with position.

  // c) Re-Enable use of the data path for each attribute:
  myGL.enableVertexAttribArray(this.a_PositionID);
	myGL.enableVertexAttribArray(this.a_ColorID);

  myGL.uniform1i(this.u_runModeID, myRunMode); 

  myGL.viewport(0, 0, myGL.drawingBufferWidth, myGL.drawingBufferHeight);

  myGL.viewport(0,                              // Viewport lower-left corner
              0,                              // (x,y) location(in pixels)
              myGL.drawingBufferWidth,        // viewport width, height.
              myGL.drawingBufferHeight);

  this.viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,  // eye position
                        g_AtX, g_AtY, g_AtZ,                // look-at point (origin)
                        0, 0, 1);               // up vector (+y)  

  this.canvas_width = g_canvasID.width;
  this.canvas_height = g_canvasID.height;
  this.projMatrix.setPerspective(30, this.canvas_width/this.canvas_height, 1, 100);
  
  //this.projMatrix.setPerspective(30, 400/400, 1, 100);
  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);

  if(myRunMode>1) {                       // 0=reset; 1= pause; 2=step; 3=run
    if(myRunMode==2) myRunMode=1;         // (if 2, do just one step and pause.)
    
  }
  PartSys_ApplyForce(s0, f0,partCount2, c0);

  removeForce(s0,partCount2-1)

  PartSys_DotFinder(0, s0, s0dot,partCount2);
  //PartSys_DotFinder(0, sPre, sPredot,partCount2);
  //console.log(sPredot);



  myGL.uniform1i(this.u_runModeID, myRunMode); //run/step/pause changes particle shape
  

  this.viewMatrix.translate(0.0, 0.0, -0.6);
  this.viewMatrix.scale(0.8, 0.8,0.8);
  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  // ----------------------------Draw the contents of the currently-bound VBO:
  myGL.uniform1i(this.u_moving, true); 
  PartSys_render(myGL, s0,partCount2);  // Draw the particle-system on-screen:
  myGL.uniform1i(this.u_moving, false); 
  if (line){
    myGL.drawArrays(gl.LINE_STRIP, 0, partCount2-1); 
  }else{
    myGL.drawArrays(gl.TRIANGLE_STRIP, 0, partCount2-1); 
  }
  //myGL.drawArrays(gl.LINE_LOOP, f0[F_SPRING_PSTART], partCount2-1); 
  //myGL.drawArrays(gl.TRIANGLE_STRIP, 0, partCount2-1); 
  this.viewMatrix.scale(1/0.8, 1/0.8,1/0.8); 
  this.viewMatrix.translate(0.0, 0.0, 0.6);
  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);

  if(myRunMode>1) {                       // 0=reset; 1= pause; 2=step; 3=run
    if(myRunMode==2) myRunMode=1;         // (if 2, do just one step and pause.)
  

  PartSys_Solver(solverSel, s0, s0dot, s1, sm, smdot, sPre, sPredot, partCount2, h2, 0, f0);
  spring_grid_solver(s1, partCount2)
  damping(s1, 0.975, partCount2);

  PartSys_doConstraint(s1,partCount2, c0);


  
    
  PartSys_Swap(s0,s1,sPre, partCount2);
    

}

}

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

function Forcer_init_Helper(sel, f, fOff, partCount){
  switch(sel) {
    case F_NONE:
      f[fOff + f_type] = F_NONE;
      f[fOff + grav_e] = 0;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0;
      f[fOff + RLen_s] = 0;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = 0;
      f[fOff + wind_x] = 0;
      f[fOff + wind_y] = 0;
      f[fOff + wind_z] = 0;
      f[fOff + push_f] = 0;
      f[fOff + boid_sep] = 0;
      f[fOff + boid_cir] = 0;

    break;

    case F_GRAV_E:
      f[fOff + f_type] = F_GRAV_E;
      f[fOff + grav_e] = 9.8;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0;
      f[fOff + RLen_s] = 0;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = 0;
      f[fOff + wind_x] = 0;
      f[fOff + wind_y] = 0;
      f[fOff + wind_z] = 0;
      f[fOff + push_f] = 0;
      f[fOff + boid_sep] = 0;
      f[fOff + boid_cir] = 0;

    break;
    case F_GRAV_P:
      f[fOff + f_type] = F_GRAV_P;
      f[fOff + grav_e] = 0;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0;
      f[fOff + RLen_s] = 0;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = 0;
      f[fOff + wind_x] = 0;
      f[fOff + wind_y] = 0;
      f[fOff + wind_z] = 0;
      f[fOff + push_f] = 0;
      f[fOff + boid_sep] = 0;
      f[fOff + boid_cir] = 0;

    break;
    case F_SPRING:
      f[fOff + f_type] = F_SPRING;
      f[fOff + grav_e] = 9.8;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0.001;
      f[fOff + RLen_s] = 0.05;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = partCount-1;
      f[fOff + wind_x] = 0;
      f[fOff + wind_y] = 0;
      f[fOff + wind_z] = 0;
      f[fOff + push_f] = 0;
      f[fOff + boid_sep] = 0;
      f[fOff + boid_cir] = 0;

    break;
    case F_SPRING_GRID:
      f[fOff + f_type] = F_SPRING_GRID;
      f[fOff + grav_e] = 0;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0.001;
      f[fOff + RLen_s] = 0.05;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = partCount-2;
      f[fOff + wind_x] = 0;
      f[fOff + wind_y] = 0;
      f[fOff + wind_z] = 0;
      f[fOff + push_f] = 0;
      f[fOff + boid_sep] = 0;
      f[fOff + boid_cir] = 0;

      F_SPRING_PSTART = f[fOff + Start_s];
      //F_SPRING_PEND = f[fOff + End_s];


    break;
    case F_WIND:
      f[fOff + f_type] = F_WIND;
      f[fOff + grav_e] = 0;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0;
      f[fOff + RLen_s] = 0;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = 0;
      f[fOff + wind_x] = -1.5;
      f[fOff + wind_y] = (Math.random() * 2 - 1);
      f[fOff + wind_z] = (Math.random() * 2);
      f[fOff + push_f] = 0;
      f[fOff + boid_sep] = 0;
      f[fOff + boid_cir] = 0;

    break;
    case F_PUSH:
      f[fOff + f_type] = -F_PUSH;
      f[fOff + grav_e] = 0;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0;
      f[fOff + RLen_s] = 0;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = 0;
      f[fOff + wind_x] = 0;
      f[fOff + wind_y] = 0;
      f[fOff + wind_z] = 0;
      f[fOff + push_f] = 0;
      f[fOff + boid_sep] = 0;
      f[fOff + boid_cir] = 0;
      
    break;
    case F_WIND_FIRE:
      f[fOff + f_type] = -F_WIND_FIRE;
      f[fOff + grav_e] = 0;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0;
      f[fOff + RLen_s] = 0;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = 0;
      f[fOff + wind_x] = 0;
      f[fOff + wind_y] = 0;
      f[fOff + wind_z] = 0;
      f[fOff + push_f] = 0;
      f[fOff + boid_sep] = 0;
      f[fOff + boid_cir] = 0;
    break;
    case F_BOID:
      f[fOff + f_type] = -F_BOID;
      f[fOff + grav_e] = 0;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0;
      f[fOff + RLen_s] = 0;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = 0;
      f[fOff + wind_x] = 0;
      f[fOff + wind_y] = 0;
      f[fOff + wind_z] = 0;
      f[fOff + push_f] = 0;
      f[fOff + boid_sep] = 0;
      f[fOff + boid_cir] = 0;
    break;
    case F_FIRE:
      f[fOff + f_type] = -F_FIRE;
      f[fOff + grav_e] = 0;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0;
      f[fOff + RLen_s] = 0;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = 0;
      f[fOff + wind_x] = 0;
      f[fOff + wind_y] = 0;
      f[fOff + wind_z] = 0;
      f[fOff + push_f] = 0;
      f[fOff + boid_sep] = 0;
      f[fOff + boid_cir] = 0;
    break;
  }
}



function PartSys_init(sel, s, f, c, partCount) {
//==============================================================================
// set initial values of all particle-system state.
// sel==0 for 'hard' reset (user pressed 'R') that inits entire state-vector
// sel==1 to 'soft' reset (user pressed 'r') that only adds velocity to all 
//            particles

var doit=1;
  switch(sel) {
    case 0:
      for(var i=0; i < ForcerCount; i++) {
        var fOff = i*forcer_maxvar;
        Forcer_init_Helper(i, f, fOff, partCount);
      }

      for(var i=0; i < partCount; i++) {
        var pOff = i*PART_MAXVAR;     // starting index of each particle
        var pNextLevelOff = (i+widthCount+1)*PART_MAXVAR;

        var xcyc = roundRand3D(0);
        if(doit==1) {
          doit=0;
          }
        s[pOff + PART_XPOS] = 0.5 * Math.random() + 0.5;   // 0.0 <= randomRound() < 1.0
        //s[pOff + PART_YPOS] = 0.2 + 0.2*xcyc[1];
        s[pOff + PART_ZPOS] = 0.2 + 0.2*xcyc[2];
        if (i % 2 == 0 && i < widthCount){
          s[pOff + PART_ZPOS] = 1;
        }

        if(i == F_SPRING_PSTART){
          s[pOff + PART_XPOS] = 1;   // 0.0 <= randomRound() < 1.0
          s[pOff + PART_YPOS] = 1;
        }
        if(i == widthCount-1){
          s[pOff + PART_XPOS] = 0.5;   // 0.0 <= randomRound() < 1.0
          s[pOff + PART_YPOS] = 1;
        }
        s[pOff + PART_YPOS] = 1;


        xcyc = roundRand3D(0);
        /*s0[pOff + PART_XVEL] = INIT_VEL*(0.4 + 0.2*xcyc[0]);
        s0[pOff + PART_YVEL] = INIT_VEL*(0.4 + 0.2*xcyc[1]);
        s0[pOff + PART_ZVEL] = INIT_VEL*(0.4 + 0.2*xcyc[2]);*/
        s[pOff + PART_XVEL] = 0;
        s[pOff + PART_YVEL] = 0;
        s[pOff + PART_ZVEL] = 0;

        s[pOff + PART_X_FTOT] = 0.0;
        s[pOff + PART_Y_FTOT] = 0.0;
        s[pOff + PART_Z_FTOT] = 0.0;

        s[pOff + PART_R] = 0.4 + 0.5*Math.random();
        s[pOff + PART_G] = 0.4 + 0.5*Math.random();
        s[pOff + PART_B] = 0.4 + 0.5*Math.random();
        //s[pOff + PART_R] = 0.6;
        //s[pOff + PART_G] = 0.8;
        //s[pOff + PART_B] = 0.5;
        s[pOff + PART_MASS] = 0.001;
        //s0[pOff + PART_DIAM] = 1.0 + 20.0*Math.random();
        s[pOff + PART_DIAM] = 4;
        s[pOff + PART_RENDMODE] = Math.floor(4.0*Math.random()); // 0,1,2 or 3.

        if (i == partCount-1){
          s[pOff + PART_XPOS] = 0;
          s[pOff + PART_YPOS] = 2;
          s[pOff + PART_ZPOS] = 0;
          s[pOff + PART_MASS] = 1;
          //s0[pOff + PART_DIAM] = 1.0 + 20.0*Math.random();
          s[pOff + PART_DIAM] = 70;
        }


      }
      

      c[CONSRNT1_XMIN] = -0.4;
      c[CONSRNT1_YMIN] = -0.2;
      c[CONSRNT1_ZMIN] = 0;
      c[CONSRNT1_XMAX] = 2.2;
      c[CONSRNT1_YMAX] = 2;
      c[CONSRNT1_ZMAX] = 1.8;


       break;
    case 1:         // increase current velocity by INIT_VEL
    default:

      /*for(var i=0; i<2; i++) {
        var pOff = i*PART_MAXVAR;     // starting index of each particle
        if(  s[pOff + PART_XVEL] > 0) {
             s[pOff + PART_XVEL] += (0.2 + 0.8*Math.random())*INIT_VEL;
          }
        else s[pOff + PART_XVEL] -= (0.2 + 0.8*Math.random())*INIT_VEL;
        if(  s[pOff + PART_YVEL] > 0) {
             s[pOff + PART_YVEL] += (0.2 + 0.8*Math.random())*INIT_VEL;
          }
        else s[pOff + PART_YVEL] -= (0.2 + 0.8*Math.random())*INIT_VEL;
        if(  s[pOff + PART_ZVEL] > 0) {
             s[pOff + PART_ZVEL] += (0.2 + 0.8*Math.random())*INIT_VEL;
          }
        else s[pOff + PART_ZVEL] -= (0.2 + 0.8*Math.random())*INIT_VEL;
      }*/
      
      break;
   }
}

function ApplyForce_Helper(sel,s,f, j,partCount, c){
  
  var fOff = j*forcer_maxvar;
  switch(sel) {
    case F_NONE:
      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;
        s[pOff + PART_X_FTOT] = 0.0;
        s[pOff + PART_Y_FTOT] = 0.0;
        s[pOff + PART_Z_FTOT] = 0.0;
      }
    break;
    case -F_GRAV_E:
    break;
    case F_GRAV_E:
      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;
        s[pOff + PART_X_FTOT] += 0;
        s[pOff + PART_Y_FTOT] += 0;
        s[pOff + PART_Z_FTOT] += -s[pOff + PART_MASS] * f[fOff + grav_e]/1000;
      }

    break;
    case -F_GRAV_P:
    break;
    case F_GRAV_P:
      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;
        s[pOff + PART_X_FTOT] += 0;
        s[pOff + PART_Y_FTOT] += 0;
        s[pOff + PART_Z_FTOT] += 0;
      }

    break;
    case -F_SPRING:
    break;
    case F_SPRING:
      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;
        s[pOff + PART_X_FTOT] += 0;
        s[pOff + PART_Y_FTOT] += 0;
        s[pOff + PART_Z_FTOT] += 0;
      }

    break;
    case -F_SPRING_GRID:
    break;
    case F_SPRING_GRID:
      for (var i = f[fOff + Start_s] + 1; i <= f[fOff + End_s]; i++){
        var pOff = i*PART_MAXVAR;
        var pPreOff = (i-1)*PART_MAXVAR;
        var pSecPreOff = (i-2)*PART_MAXVAR;

        if ((i%widthCount) > f[fOff + Start_s] + 1 && (i % widthCount) % 2 == 1){
        //-------Second Pre----------------
          var pSecPreX = s[pSecPreOff + PART_XPOS] - s[pOff + PART_XPOS];
          var pSecPreY = s[pSecPreOff + PART_YPOS] - s[pOff + PART_YPOS];
          var pSecPreZ = s[pSecPreOff + PART_ZPOS] - s[pOff + PART_ZPOS];

          var PSecPre = Math.sqrt(pSecPreX*pSecPreX + pSecPreY*pSecPreY + pSecPreZ*pSecPreZ) + 0.0000001;

          var pSecPreXNorm = pSecPreX/PSecPre;
          var pSecPreYNorm = pSecPreY/PSecPre;
          var pSecPreZNorm = pSecPreZ/PSecPre;

          var LSecPre = PSecPre - f[fOff + RLen_s];
          var FSecPre = f[fOff + K_s] * LSecPre

          s[pOff + PART_X_FTOT] += FSecPre * pSecPreXNorm;
          s[pOff + PART_Y_FTOT] += FSecPre * pSecPreYNorm;
          s[pOff + PART_Z_FTOT] += FSecPre * pSecPreZNorm;

          s[pSecPreOff + PART_X_FTOT] += -FSecPre * pSecPreXNorm;
          s[pSecPreOff + PART_Y_FTOT] += -FSecPre * pSecPreYNorm;
          s[pSecPreOff + PART_Z_FTOT] += -FSecPre * pSecPreZNorm;

          //-------Second Pre----------------

        }
      //-------Pre----------------
        var pPreX = s[pPreOff + PART_XPOS] - s[pOff + PART_XPOS];
        var pPreY = s[pPreOff + PART_YPOS] - s[pOff + PART_YPOS];
        var pPreZ = s[pPreOff + PART_ZPOS] - s[pOff + PART_ZPOS];

        var PPre = Math.sqrt(pPreX*pPreX + pPreY*pPreY + pPreZ*pPreZ) + 0.0000001;

        var pPreXNorm = pPreX/PPre;
        var pPreYNorm = pPreY/PPre;
        var pPreZNorm = pPreZ/PPre;

        var LPre = PPre - f[fOff + RLen_s];
        var FPre = f[fOff + K_s] * LPre

        s[pOff + PART_X_FTOT] += FPre * pPreXNorm;
        s[pOff + PART_Y_FTOT] += FPre * pPreYNorm;
        s[pOff + PART_Z_FTOT] += FPre * pPreZNorm;

        s[pPreOff + PART_X_FTOT] += -FPre * pPreXNorm;
        s[pPreOff + PART_Y_FTOT] += -FPre * pPreYNorm;
        s[pPreOff + PART_Z_FTOT] += -FPre * pPreZNorm;

        if ((i % widthCount) % 2 == 0 && i >widthCount){

          var pAddUpOff = (i - 2 * (i%widthCount)) * PART_MAXVAR;

          s[pOff + PART_X_FTOT] += s[pAddUpOff + PART_X_FTOT];
          s[pOff + PART_Y_FTOT] += s[pAddUpOff + PART_Y_FTOT];
          s[pOff + PART_Z_FTOT] += s[pAddUpOff + PART_Z_FTOT];

      
          s[pAddUpOff + PART_X_FTOT] = s[pOff + PART_X_FTOT];
          s[pAddUpOff + PART_Y_FTOT] = s[pOff + PART_Y_FTOT];
          s[pAddUpOff + PART_Z_FTOT] = s[pOff + PART_Z_FTOT];
        }

        if ((i % widthCount) % 2 == 1 && i >widthCount){
          var pPreAddUpOff = ((i - 1) - 2 * ((i-1)%widthCount)) * PART_MAXVAR;

          s[pPreAddUpOff + PART_X_FTOT] = s[pPreOff + PART_X_FTOT];
          s[pPreAddUpOff + PART_Y_FTOT] = s[pPreOff + PART_Y_FTOT];
          s[pPreAddUpOff + PART_Z_FTOT] = s[pPreOff + PART_Z_FTOT];
        }
      }
    

    break;
    case -F_WIND:
    break;
    case F_WIND:
      for (var i=0; i<partCount; i++){
        var pOff = i*PART_MAXVAR;
        var nx = 0.1*(s[pOff + PART_XPOS] - f[fOff + wind_x]);
        var ny = 0.1*(s[pOff + PART_YPOS] - f[fOff + wind_y]);
        var nz = 0.1*(s[pOff + PART_ZPOS] - f[fOff + wind_z]);

        var N = (Math.sqrt(nx*nx + ny*ny + nz*nz));

        s[pOff + PART_X_FTOT] += 0.0001*Math.random()*(Math.random()) * (nx/N);
        s[pOff + PART_Y_FTOT] += 0.0001*Math.random()*(Math.random()) * (ny/N);
        s[pOff + PART_Z_FTOT] += 0.0001*Math.random()*(Math.random()) * (nz/N);
      }

    break;
    case -F_WIND_FIRE:
    break;
    case F_WIND_FIRE:
      for (var i=0; i<partCount; i++){
        var pOff = i*PART_MAXVAR;
        var nx = (s[pOff + PART_XPOS] - f[fOff + wind_x]);
        var ny = (s[pOff + PART_YPOS] - f[fOff + wind_y]);
        var nz = (s[pOff + PART_ZPOS] - f[fOff + wind_z]);

        var N = (Math.sqrt(nx*nx + ny*ny + nz*nz));
        s[pOff + PART_X_FTOT] += 0.07*Math.random()*(Math.random()) * (nx/N);
        s[pOff + PART_Y_FTOT] += 0.07*Math.random()*(Math.random()) * (ny/N);
        s[pOff + PART_Z_FTOT] += 0.07*Math.random()*(Math.random()) * (nz/N);
      }

    break;
    case -F_PUSH:
    break;
    case F_PUSH:
      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;
        s[pOff + PART_X_FTOT] += f[fOff + push_f] * (Math.random() * 2 - 1);
        s[pOff + PART_Y_FTOT] += f[fOff + push_f] * (Math.random() * 2 - 1);
        s[pOff + PART_Z_FTOT] += f[fOff + push_f] * (Math.random() * 2 - 1);
      }
    break;

    case -F_BOID:
    break;
    case F_BOID:
      for(var i=0; i<partCount; i++) {
        var iOff = i*PART_MAXVAR;
        var avgX = 0;
        var avgY = 0;
        var avgZ = 0;

        var avgVX = 0;
        var avgVY = 0;
        var avgVZ = 0;

        var sepX = 0;
        var sepY = 0;
        var sepZ = 0;

        var cenNum = 0;
        var sepNum = 0;

        for(var j=0; j<partCount; j++) {
          var pOff = j*PART_MAXVAR;
          if(i == j){
            continue
          }else{
            var d = findNormal(s[pOff + PART_XPOS]-s[iOff + PART_XPOS], s[pOff + PART_YPOS]-s[iOff + PART_YPOS], s[pOff + PART_ZPOS]-s[iOff + PART_ZPOS]);
            if (inBoidViewRange(s, i, j) && d < f[fOff + boid_cir]){
              cenNum += 1;
              avgX += s[pOff + PART_XPOS];
              avgY += s[pOff + PART_YPOS];
              avgZ += s[pOff + PART_ZPOS];
              
              avgVX += s[pOff + PART_XVEL];
              avgVY += s[pOff + PART_YVEL];
              avgVZ += s[pOff + PART_ZVEL];

              if(inBoidViewRange(s, i, j) && d < f[fOff + boid_sep]){
                sepNum += 1;
                sepX += s[pOff + PART_XPOS];
                sepY += s[pOff + PART_YPOS];
                sepZ += s[pOff + PART_ZPOS];
              }  

            }
          }
        }

        avgX = ((avgX)/(cenNum + 0.00000001) - s[iOff + PART_XPOS]);
        avgY = ((avgY)/(cenNum + 0.00000001) - s[iOff + PART_YPOS]);
        avgZ = ((avgZ)/(cenNum + 0.00000001) - s[iOff + PART_ZPOS]);
        //avgN = findNormal(avgX,avgY,avgY) + 0.000001;


        //console.log("avgN " + i + ": " + avgN);

        velX = (avgVX)/(cenNum + 0.00000001);
        velY = (avgVY)/(cenNum + 0.00000001);
        velZ = (avgVZ)/(cenNum + 0.00000001);
        velN = findNormal(velX,velY,velZ) + 0.000001;
        //console.log("velN " + i + ": " + velN);

        sepX = s[iOff + PART_XPOS] -  sepX/(sepNum + 0.00000001);
        sepY = s[iOff + PART_YPOS] -  sepY/(sepNum + 0.00000001);
        sepZ = s[iOff + PART_ZPOS] -  sepZ/(sepNum + 0.00000001);
        //sepN = findNormal(sepX,sepY,sepZ) + 0.000001;
        //console.log("sepN " + i + ": " + sepN);

        var boidX = 4*velX/velN + 3*sepX + 2*avgX;
        var boidY = 4*velY/velN + 3*sepY + 2*avgY;
        var boidZ = 4*velZ/velN + 3*sepZ + 2*avgZ;

        s[iOff + PART_X_FTOT] += 0.002 * boidX;
        s[iOff + PART_Y_FTOT] += 0.002 * boidY;
        s[iOff + PART_Z_FTOT] += 0.002 * boidZ;

        //console.log("boid " + i + ": " + boidY);
        if (s[iOff + PART_XPOS] < c[CONSRNT1_XMIN] + 0.5 && s[iOff + PART_X_FTOT] < 0){
          s[iOff + PART_X_FTOT] *= 0.9;
          s[iOff + PART_X_FTOT] += 0.02;
        }
        else if (s[iOff + PART_XPOS] > c[CONSRNT1_XMAX] - 0.5 && s[iOff + PART_X_FTOT] > 0){
          s[iOff + PART_X_FTOT] *= 0.9;
          s[iOff + PART_X_FTOT] -= 0.02;
        }

        if (s[iOff + PART_YPOS] < c[CONSRNT1_YMIN] + 0.5 && s[iOff + PART_Y_FTOT] < 0){
          s[iOff + PART_Y_FTOT] *= 0.9;
          s[iOff + PART_Y_FTOT] += 0.01;
        }
        else if (s[iOff + PART_YPOS] > c[CONSRNT1_YMAX] - 0.5 && s[iOff + PART_Y_FTOT] > 0){
          s[iOff + PART_Y_FTOT] *= 0.9;
          s[iOff + PART_Y_FTOT] -= 0.01;
        }

        if (s[iOff + PART_ZPOS] < c[CONSRNT1_ZMIN] + 0.5 && s[iOff + PART_Z_FTOT] < 0){
          s[iOff + PART_Z_FTOT] *= 0.9;
          s[iOff + PART_Z_FTOT] += 0.01;
        }
        else if (s[iOff + PART_ZPOS] > c[CONSRNT1_ZMAX] - 0.5 && s[iOff + PART_Z_FTOT] > 0){
          s[iOff + PART_Z_FTOT] *= 0.9;
          s[iOff + PART_Z_FTOT] -= 0.01;
        }


      }
    break;
    case -F_FIRE:
    break;
    case F_FIRE:
      for (var i=0; i<partCount; i++){
        s[pOff + PART_X_FTOT] += 0;
        s[pOff + PART_Y_FTOT] += 0;
        s[pOff + PART_Z_FTOT] += 0;
      }

    break;
  }

}


function inBoidViewRange(s, i, j){
  var iOff = i*PART_MAXVAR;
  var pOff = j*PART_MAXVAR;

  var iLookAtX = s[iOff + PART_XVEL] / findNormal(s[iOff + PART_XVEL],s[iOff + PART_YVEL],s[iOff + PART_ZVEL]);
  var iLookAtY = s[iOff + PART_YVEL] / findNormal(s[iOff + PART_XVEL],s[iOff + PART_YVEL],s[iOff + PART_ZVEL]);
  var iLookAtZ = s[iOff + PART_ZVEL] / findNormal(s[iOff + PART_XVEL],s[iOff + PART_YVEL],s[iOff + PART_ZVEL]);

  var ijX = s[pOff + PART_XPOS] - s[iOff + PART_XPOS];
  var ijY = s[pOff + PART_YPOS] - s[iOff + PART_YPOS];
  var ijZ = s[pOff + PART_ZPOS] - s[iOff + PART_ZPOS];

  var otherX = ijX / findNormal(ijX,ijY,ijZ);
  var otherY = ijX / findNormal(ijX,ijY,ijZ);
  var otherZ = ijX / findNormal(ijX,ijY,ijZ);

  var z = findNormal(s[iOff + PART_XVEL],s[iOff + PART_YVEL],s[iOff + PART_ZVEL]);
  var za = findNormal(ijX,ijY,ijZ)

  var cosTheta = (iLookAtX*otherX + iLookAtY*otherY + iLookAtZ*otherZ) / (z*za)
  ret = (cosTheta > -150) && (cosTheta < 150);
  //console.log(cosTheta);
  return ret
}



function PartSys_ApplyForce(s,f, partCount, c) {
  for(var j=0; j<ForcerCount; j++) {
    var fOff = j*forcer_maxvar;
    ApplyForce_Helper(f[fOff + f_type], s, f,j, partCount-1, c);
  }
  
}

function PartSys_DotFinder(sel, s, sdot, partCount) {
  switch(sel) {
    case 0:
      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;
        
        sdot[pOff + PART_XVEL] = s[pOff + PART_X_FTOT] / s[pOff + PART_MASS];
        sdot[pOff + PART_YVEL] = s[pOff + PART_Y_FTOT] / s[pOff + PART_MASS];
        sdot[pOff + PART_ZVEL] = s[pOff + PART_Z_FTOT] / s[pOff + PART_MASS];

        sdot[pOff + PART_XPOS] = s[pOff + PART_XVEL];   // 0.0 <= randomRound() < 1.0
        sdot[pOff + PART_YPOS] = s[pOff + PART_YVEL];
        sdot[pOff + PART_ZPOS] = s[pOff + PART_ZVEL];

        sdot[pOff + PART_X_FTOT] = 0.0;
        sdot[pOff + PART_Y_FTOT] = 0.0;
        sdot[pOff + PART_Z_FTOT] = 0.0;
        sdot[pOff + PART_R] = 0.0;
        sdot[pOff + PART_G] = 0.0;
        sdot[pOff + PART_B] = 0.0;
        sdot[pOff + PART_MASS] = 0.0;
        sdot[pOff + PART_DIAM] = 0.0;
        sdot[pOff + PART_RENDMODE] = 0.0; // 0,1,2 or 3.
      }
    break;
    case 1:         // increase current velocity by INIT_VEL

      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;
        
        sdot[pOff + PART_XVEL] = s[pOff + PART_X_FTOT] / s[pOff + PART_MASS];
        sdot[pOff + PART_YVEL] = s[pOff + PART_Y_FTOT] / s[pOff + PART_MASS];
        sdot[pOff + PART_ZVEL] = s[pOff + PART_Z_FTOT] / s[pOff + PART_MASS];

        sdot[pOff + PART_XPOS] = s[pOff + PART_XVEL];   // 0.0 <= randomRound() < 1.0
        sdot[pOff + PART_YPOS] = s[pOff + PART_YVEL];
        sdot[pOff + PART_ZPOS] = s[pOff + PART_ZVEL];

        sdot[pOff + PART_X_FTOT] = 0.0;
        sdot[pOff + PART_Y_FTOT] = 0.0;
        sdot[pOff + PART_Z_FTOT] = 0.0;
        sdot[pOff + PART_R] = 0.0;
        sdot[pOff + PART_G] = 0.0;
        sdot[pOff + PART_B] = 0.0;
        sdot[pOff + PART_MASS] = -0.05;
        sdot[pOff + PART_DIAM] = -0.2;
        sdot[pOff + PART_RENDMODE] = 0.0; // 0,1,2 or 3.
      }

    
      
    break;

    case 2:         // BURNING FIRE MASS CHANGE

      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;
        
        sdot[pOff + PART_XVEL] = s[pOff + PART_X_FTOT] / s[pOff + PART_MASS];
        sdot[pOff + PART_YVEL] = s[pOff + PART_Y_FTOT] / s[pOff + PART_MASS];
        sdot[pOff + PART_ZVEL] = s[pOff + PART_Z_FTOT] / s[pOff + PART_MASS];

        sdot[pOff + PART_XPOS] = s[pOff + PART_XVEL];   // 0.0 <= randomRound() < 1.0
        sdot[pOff + PART_YPOS] = s[pOff + PART_YVEL];
        sdot[pOff + PART_ZPOS] = s[pOff + PART_ZVEL];

        sdot[pOff + PART_X_FTOT] = 0.2;
        sdot[pOff + PART_Y_FTOT] = 0.2;
        sdot[pOff + PART_Z_FTOT] = 0.2;
        sdot[pOff + PART_R] = -0.01;
        sdot[pOff + PART_G] = -0.2;
        sdot[pOff + PART_B] = 0.0;
        //console.log("speed: " + s[pOff + PART_SPEED]);
        sdot[pOff + PART_MASS] = -0.1;
        sdot[pOff + PART_DIAM] = -1.5;
        sdot[pOff + PART_RENDMODE] = 0.0; // 0,1,2 or 3.
      }

    
      
    break;
   }

}


function PartSys_render(gl, s, partCount) {
//==============================================================================
// MODIFY our VBO's contents using the current state of our particle system:
 //  Recall that gl.bufferData() allocates and fills a new hunk of graphics 
 // memory.  We always use gl.bufferData() in the creation of a new buffer, but
 // to MODIFY the contents of that buffer we use gl.bufferSubData() instead. 
 //
 // Just like gl.bufferData(), g.bufferSubData() copies a contiguous block of 
 // memory from client/JavaScript to graphics hardware.  Unlike C/C++ version:
 //    http://www.khronos.org/opengles/sdk/docs/man/xhtml/glBufferSubData.xml 
 // the WebGL version does not have a'size' parameter (size in bytes, of the 
 // data-store region being replaced):
 // ( void bufferSubData(GLenum target, GLintptr offset, ArrayBufferView data);
 // ( as shown here: http://www.khronos.org/registry/webgl/specs/latest/1.0/
 // Instead, it copies the ENTIRE CONTENTS of the 'data' array to the buffer:
 //----------------------------------------Update entire buffer:
  gl.bufferSubData(gl.ARRAY_BUFFER,     // GLenum target,
                                0,      // offset to data we'll transfer
                               s);     // Data source (Javascript array)
  gl.uniform1i(this.u_moving, true); 
  gl.drawArrays(gl.POINTS, 0, partCount); 


  
  // drawing primitive, starting index, number of indices to render
}

function PartSys_Solver(sel, s_0, s0_dot, s_1, s_m, s_mdot, s_pre, s_predot, partCount, h, dotSel, f) {

  switch(sel) {
    case 0:         //Euler
      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;
        var pNextLevelOff = (i+widthCount+1)*PART_MAXVAR;

        s_1[PART_XVEL+ pOff] = s_0[PART_XVEL+ pOff] + h *s0_dot[PART_XVEL+ pOff];
        s_1[PART_YVEL+ pOff] = s_0[PART_YVEL+ pOff] + h *s0_dot[PART_YVEL+ pOff];
        s_1[PART_ZVEL+ pOff] = s_0[PART_ZVEL+ pOff] + h *s0_dot[PART_ZVEL+ pOff];

        s_1[PART_XPOS+ pOff] = s_0[PART_XPOS+ pOff] + h *s_1[PART_XVEL+ pOff];
        s_1[PART_YPOS+ pOff] = s_0[PART_YPOS+ pOff] + h *s_1[PART_YVEL+ pOff]; 
        s_1[PART_ZPOS+ pOff] = s_0[PART_ZPOS+ pOff] + h *s_1[PART_ZVEL+ pOff];

        //s_1[PART_XVEL+ pOff] = s_1[PART_XVEL+ pOff] * damping;
        //s_1[PART_YVEL+ pOff] = s_1[PART_YVEL+ pOff] * damping;
        //s_1[PART_ZVEL+ pOff] = s_1[PART_ZVEL+ pOff] * damping;

        s_1[pOff + PART_X_FTOT] = s_0[pOff + PART_X_FTOT];// + 1 *s0dot[pOff + PART_X_FTOT];
        s_1[pOff + PART_Y_FTOT] = s_0[pOff + PART_Y_FTOT];// + 1 *s0dot[pOff + PART_Y_FTOT];
        s_1[pOff + PART_Z_FTOT] = s_0[pOff + PART_Z_FTOT];// + 1 *s0dot[pOff + PART_Z_FTOT];
        s_1[pOff + PART_R] = s_0[pOff + PART_R];// + 1 *s0dot[pOff + PART_R];
        s_1[pOff + PART_G] = s_0[pOff + PART_G];// + 1 *s0dot[pOff + PART_G];
        s_1[pOff + PART_B] = s_0[pOff + PART_B];// + 1 *s0dot[pOff + PART_B];
        s_1[pOff + PART_MASS] = s_0[pOff + PART_MASS];// + 1 *s0dot[pOff + PART_MASS];
        s_1[pOff + PART_DIAM] = s_0[pOff + PART_DIAM];// + 1 *s0dot[pOff + PART_DIAM];
        s_1[pOff + PART_RENDMODE] = s_0[pOff + PART_RENDMODE];// + 1 *s0dot[pOff + PART_RENDMODE];

      } 
       break;
    case 1:         // midpoint

      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;
        var pNextLevelOff = (i+widthCount+1)*PART_MAXVAR;
        s_m[PART_XVEL+ pOff] = s_0[PART_XVEL+ pOff] + 0.5 * h *s0_dot[PART_XVEL+ pOff];
        s_m[PART_YVEL+ pOff] = s_0[PART_YVEL+ pOff] + 0.5 * h *s0_dot[PART_YVEL+ pOff];
        s_m[PART_ZVEL+ pOff] = s_0[PART_ZVEL+ pOff] + 0.5 * h *s0_dot[PART_ZVEL+ pOff];

        s_m[PART_XPOS+ pOff] = s_0[PART_XPOS+ pOff] + 0.5 * h *s_m[PART_XVEL+ pOff];
        s_m[PART_YPOS+ pOff] = s_0[PART_YPOS+ pOff] + 0.5 * h *s_m[PART_YVEL+ pOff]; 
        s_m[PART_ZPOS+ pOff] = s_0[PART_ZPOS+ pOff] + 0.5 * h *s_m[PART_ZVEL+ pOff];

        s_m[pOff + PART_X_FTOT] = s_0[pOff + PART_X_FTOT] + 0.5 * h * s0_dot[pOff + PART_X_FTOT];
        s_m[pOff + PART_Y_FTOT] = s_0[pOff + PART_Y_FTOT] + 0.5 * h * s0_dot[pOff + PART_Y_FTOT];
        s_m[pOff + PART_Z_FTOT] = s_0[pOff + PART_Z_FTOT] + 0.5 * h * s0_dot[pOff + PART_Z_FTOT];
        s_m[pOff + PART_R] = s_0[pOff + PART_R] + 0.5 * h * s0_dot[pOff + PART_R];
        s_m[pOff + PART_G] = s_0[pOff + PART_G] + 0.5 * h * s0_dot[pOff + PART_G];
        s_m[pOff + PART_B] = s_0[pOff + PART_B] + 0.5 * h * s0_dot[pOff + PART_B];
        s_m[pOff + PART_MASS] = s_0[pOff + PART_MASS] + 0.5 * h * s0_dot[pOff + PART_MASS];
        s_m[pOff + PART_DIAM] = s_0[pOff + PART_DIAM] + 0.5 * h * s0_dot[pOff + PART_DIAM];
        s_m[pOff + PART_RENDMODE] = s_0[pOff + PART_RENDMODE] + 0.5 * h * s0_dot[pOff + PART_RENDMODE];
      }

      PartSys_DotFinder(dotSel, s_m, s_mdot, partCount);
      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;
        var pNextLevelOff = (i+widthCount+1)*PART_MAXVAR;

        s_1[PART_XVEL+ pOff] = s_0[PART_XVEL+ pOff] + h *s_mdot[PART_XVEL+ pOff];
        s_1[PART_YVEL+ pOff] = s_0[PART_YVEL+ pOff] + h *s_mdot[PART_YVEL+ pOff];
        s_1[PART_ZVEL+ pOff] = s_0[PART_ZVEL+ pOff] + h *s_mdot[PART_ZVEL+ pOff];

        s_1[PART_XPOS+ pOff] = s_0[PART_XPOS+ pOff] + h *s_1[PART_XVEL+ pOff];
        s_1[PART_YPOS+ pOff] = s_0[PART_YPOS+ pOff] + h *s_1[PART_YVEL+ pOff]; 
        s_1[PART_ZPOS+ pOff] = s_0[PART_ZPOS+ pOff] + h *s_1[PART_ZVEL+ pOff];

        

        //s_1[PART_XVEL+ pOff] = s_1[PART_XVEL+ pOff] * damping;
        //s_1[PART_YVEL+ pOff] = s_1[PART_YVEL+ pOff] * damping;
        //s_1[PART_ZVEL+ pOff] = s_1[PART_ZVEL+ pOff] * damping;


        s_1[pOff + PART_X_FTOT] = s_0[pOff + PART_X_FTOT] + h * s_mdot[pOff + PART_X_FTOT];
        s_1[pOff + PART_Y_FTOT] = s_0[pOff + PART_Y_FTOT] + h * s_mdot[pOff + PART_Y_FTOT];
        s_1[pOff + PART_Z_FTOT] = s_0[pOff + PART_Z_FTOT] + h * s_mdot[pOff + PART_Z_FTOT];
        s_1[pOff + PART_R] = s_0[pOff + PART_R] + h * s_mdot[pOff + PART_R];
        s_1[pOff + PART_G] = s_0[pOff + PART_G] + h * s_mdot[pOff + PART_G];
        s_1[pOff + PART_B] = s_0[pOff + PART_B] + h * s_mdot[pOff + PART_B];
        s_1[pOff + PART_MASS] = s_0[pOff + PART_MASS] + h * s_mdot[pOff + PART_MASS];
        s_1[pOff + PART_DIAM] = s_0[pOff + PART_DIAM] + h * s_mdot[pOff + PART_DIAM];
        s_1[pOff + PART_RENDMODE] = s_0[pOff + PART_RENDMODE] + h * s_mdot[pOff + PART_RENDMODE];
        

        

      } 
      
      break;
    case 2:         // midpoint

      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;

        s_m[PART_XVEL+ pOff] = s_0[PART_XVEL+ pOff] + 0.5 * h *s0_dot[PART_XVEL+ pOff];
        s_m[PART_YVEL+ pOff] = s_0[PART_YVEL+ pOff] + 0.5 * h *s0_dot[PART_YVEL+ pOff];
        s_m[PART_ZVEL+ pOff] = s_0[PART_ZVEL+ pOff] + 0.5 * h *s0_dot[PART_ZVEL+ pOff];

        s_m[PART_XPOS+ pOff] = s_0[PART_XPOS+ pOff] + 0.5 * h *s_m[PART_XVEL+ pOff];
        s_m[PART_YPOS+ pOff] = s_0[PART_YPOS+ pOff] + 0.5 * h *s_m[PART_YVEL+ pOff]; 
        s_m[PART_ZPOS+ pOff] = s_0[PART_ZPOS+ pOff] + 0.5 * h *s_m[PART_ZVEL+ pOff];

        s_m[pOff + PART_X_FTOT] = s_0[pOff + PART_X_FTOT] + 0.5 * h * s0_dot[pOff + PART_X_FTOT];
        s_m[pOff + PART_Y_FTOT] = s_0[pOff + PART_Y_FTOT] + 0.5 * h * s0_dot[pOff + PART_Y_FTOT];
        s_m[pOff + PART_Z_FTOT] = s_0[pOff + PART_Z_FTOT] + 0.5 * h * s0_dot[pOff + PART_Z_FTOT];
        s_m[pOff + PART_R] = s_0[pOff + PART_R] + 0.5 * h * s0_dot[pOff + PART_R];
        s_m[pOff + PART_G] = s_0[pOff + PART_G] + 0.5 * h * s0_dot[pOff + PART_G];
        s_m[pOff + PART_B] = s_0[pOff + PART_B] + 0.5 * h * s0_dot[pOff + PART_B];
        s_m[pOff + PART_MASS] = s_0[pOff + PART_MASS] + 0.5 * h * s0_dot[pOff + PART_MASS];
        s_m[pOff + PART_DIAM] = s_0[pOff + PART_DIAM] + 0.5 * h * s0_dot[pOff + PART_DIAM];
        s_m[pOff + PART_RENDMODE] = s_0[pOff + PART_RENDMODE] + 0.5 * h * s0_dot[pOff + PART_RENDMODE];
      }

      PartSys_DotFinder(dotSel, s_m, s_mdot, partCount);
      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;

        s_1[PART_XVEL+ pOff] = s_0[PART_XVEL+ pOff] + h *s_mdot[PART_XVEL+ pOff];
        s_1[PART_YVEL+ pOff] = s_0[PART_YVEL+ pOff] + h *s_mdot[PART_YVEL+ pOff];
        s_1[PART_ZVEL+ pOff] = s_0[PART_ZVEL+ pOff] + h *s_mdot[PART_ZVEL+ pOff];

        s_1[PART_XPOS+ pOff] = s_0[PART_XPOS+ pOff] + h *s_1[PART_XVEL+ pOff];
        s_1[PART_YPOS+ pOff] = s_0[PART_YPOS+ pOff] + h *s_1[PART_YVEL+ pOff]; 
        s_1[PART_ZPOS+ pOff] = s_0[PART_ZPOS+ pOff] + h *s_1[PART_ZVEL+ pOff];

        //s_1[PART_XVEL+ pOff] = s_1[PART_XVEL+ pOff] * damping;
        //s_1[PART_YVEL+ pOff] = s_1[PART_YVEL+ pOff] * damping;
        //s_1[PART_ZVEL+ pOff] = s_1[PART_ZVEL+ pOff] * damping;

        s_1[pOff + PART_X_FTOT] = s_0[pOff + PART_X_FTOT] + h * s_mdot[pOff + PART_X_FTOT];
        s_1[pOff + PART_Y_FTOT] = s_0[pOff + PART_Y_FTOT] + h * s_mdot[pOff + PART_Y_FTOT];
        s_1[pOff + PART_Z_FTOT] = s_0[pOff + PART_Z_FTOT] + h * s_mdot[pOff + PART_Z_FTOT];
        s_1[pOff + PART_R] = s_0[pOff + PART_R] + h * s_mdot[pOff + PART_R];
        s_1[pOff + PART_G] = s_0[pOff + PART_G] + h * s_mdot[pOff + PART_G];
        s_1[pOff + PART_B] = s_0[pOff + PART_B] + h * s_mdot[pOff + PART_B];
        s_1[pOff + PART_MASS] = s_0[pOff + PART_MASS] + h * s_mdot[pOff + PART_MASS];
        s_1[pOff + PART_DIAM] = s_0[pOff + PART_DIAM] + h * s_mdot[pOff + PART_DIAM];
        s_1[pOff + PART_RENDMODE] = s_0[pOff + PART_RENDMODE] + h * s_mdot[pOff + PART_RENDMODE];


      } 
      
      break;
    case 3:         //bouncing around
      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;

        s_1[PART_XPOS+ pOff] = s_0[PART_XPOS+ pOff] + s_0[PART_XVEL+ pOff];
        s_1[PART_YPOS+ pOff] = s_0[PART_YPOS+ pOff] + s_0[PART_YVEL+ pOff]; 
        s_1[PART_ZPOS+ pOff] = s_0[PART_ZPOS+ pOff] + s_0[PART_ZVEL+ pOff];

        s_1[PART_XVEL+ pOff] = s_0[PART_XVEL+ pOff] * damping;
        s_1[PART_YVEL+ pOff] = s_0[PART_YVEL+ pOff] * damping;
        s_1[PART_ZVEL+ pOff] = s_0[PART_ZVEL+ pOff] * damping;
        // -- move our particle using current velocity
        s_1[pOff + PART_X_FTOT] = 0;
        s_1[pOff + PART_Y_FTOT] = 0;
        s_1[pOff + PART_Z_FTOT] = 0;
      
        s_1[pOff + PART_R] = s_0[pOff + PART_R];
        s_1[pOff + PART_G] = s_0[pOff + PART_G];
        s_1[pOff + PART_B] = s_0[pOff + PART_B];
        s_1[pOff + PART_MASS] = s_0[pOff + PART_MASS];
        s_1[pOff + PART_DIAM] = s_0[pOff + PART_DIAM];
        s_1[pOff + PART_RENDMODE] = s_0[pOff + PART_RENDMODE];
       
      } 

      //default:
      break;
    case 4:         //new solver Adams-Bashforth
      PartSys_DotFinder(dotSel, sPre, sPredot, partCount);
      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;

        s_1[PART_XVEL+ pOff] = s_0[PART_XVEL+ pOff] + h *s0_dot[PART_XVEL+ pOff] + 0.5 * h * (s0_dot[PART_XVEL+ pOff] - s_predot[PART_XVEL+ pOff]);
        s_1[PART_YVEL+ pOff] = s_0[PART_YVEL+ pOff] + h *s0_dot[PART_YVEL+ pOff] + 0.5 * h * (s0_dot[PART_YVEL+ pOff] - s_predot[PART_YVEL+ pOff]);
        s_1[PART_ZVEL+ pOff] = s_0[PART_ZVEL+ pOff] + h *s0_dot[PART_ZVEL+ pOff] + 0.5 * h * (s0_dot[PART_ZVEL+ pOff] - s_predot[PART_ZVEL+ pOff]);

        s_1[PART_XPOS+ pOff] = s_0[PART_XPOS+ pOff] + h *s_1[PART_XVEL+ pOff];
        s_1[PART_YPOS+ pOff] = s_0[PART_YPOS+ pOff] + h *s_1[PART_YVEL+ pOff]; 
        s_1[PART_ZPOS+ pOff] = s_0[PART_ZPOS+ pOff] + h *s_1[PART_ZVEL+ pOff];

        //s_1[PART_XVEL+ pOff] = s_1[PART_XVEL+ pOff] * damping;
        //s_1[PART_YVEL+ pOff] = s_1[PART_YVEL+ pOff] * damping;
        //s_1[PART_ZVEL+ pOff] = s_1[PART_ZVEL+ pOff] * damping;

        s_1[pOff + PART_X_FTOT] = 0;// + 1 *s0dot[pOff + PART_X_FTOT];
        s_1[pOff + PART_Y_FTOT] = 0;// + 1 *s0dot[pOff + PART_Y_FTOT];
        s_1[pOff + PART_Z_FTOT] = 0;// + 1 *s0dot[pOff + PART_Z_FTOT];
        s_1[pOff + PART_R] = s_0[pOff + PART_R] + h *s0_dot[PART_R+ pOff] + 0.5 * h * (s0_dot[PART_R+ pOff] - s_predot[PART_R+ pOff]);// + 1 *s0dot[pOff + PART_R];
        s_1[pOff + PART_G] = s_0[pOff + PART_G] + h *s0_dot[PART_G+ pOff] + 0.5 * h * (s0_dot[PART_G+ pOff] - s_predot[PART_G+ pOff]);// + 1 *s0dot[pOff + PART_G];
        s_1[pOff + PART_B] = s_0[pOff + PART_B] + h *s0_dot[PART_B+ pOff] + 0.5 * h * (s0_dot[PART_B+ pOff] - s_predot[PART_B+ pOff]);// + 1 *s0dot[pOff + PART_B];
        s_1[pOff + PART_MASS] = s_0[pOff + PART_MASS] + h *s0_dot[PART_MASS+ pOff] + 0.5 * h * (s0_dot[PART_MASS+ pOff] - s_predot[PART_MASS+ pOff]);// + 1 *s0dot[pOff + PART_MASS];
        s_1[pOff + PART_DIAM] = s_0[pOff + PART_DIAM] + h *s0_dot[PART_DIAM+ pOff] + 0.5 * h * (s0_dot[PART_DIAM+ pOff] - s_predot[PART_DIAM+ pOff]);// + 1 *s0dot[pOff + PART_DIAM];
        s_1[pOff + PART_RENDMODE] = s_0[pOff + PART_RENDMODE] + h *s0_dot[PART_RENDMODE+ pOff] + 0.5 * h * (s0_dot[PART_RENDMODE+ pOff] - s_predot[PART_RENDMODE+ pOff]);// + 1 *s0dot[pOff + PART_RENDMODE];
       
      } 

      break;

      case 5:         //new solver Verlet
      var s0_dot2 = new Float32Array(partCount*PART_MAXVAR);

     // PartSys_DotFinder(dotSel, sPre, sPredot, partCount);

      PartSys_DotFinder(dotSel, s0_dot, s0_dot2, partCount);

      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;

        
        s_1[PART_XPOS+ pOff] = s_0[PART_XPOS+ pOff] + s_0[PART_XVEL+ pOff] + s0_dot2[PART_XPOS+ pOff]*h*h;
        s_1[PART_YPOS+ pOff] = s_0[PART_YPOS+ pOff] + s_0[PART_YVEL+ pOff] + s0_dot2[PART_YPOS+ pOff]*h*h;
        s_1[PART_ZPOS+ pOff] = s_0[PART_ZPOS+ pOff] + s_0[PART_ZVEL+ pOff] + s0_dot2[PART_ZPOS+ pOff]*h*h;

        s_1[PART_XVEL+ pOff] = s_1[PART_XPOS+ pOff] - s_0[PART_XPOS+ pOff];
        s_1[PART_YVEL+ pOff] = s_1[PART_YPOS+ pOff] - s_0[PART_YPOS+ pOff];
        s_1[PART_ZVEL+ pOff] = s_1[PART_ZPOS+ pOff] - s_0[PART_ZPOS+ pOff];

        s_1[pOff + PART_X_FTOT] = 0;// + 1 *s0dot[pOff + PART_X_FTOT];
        s_1[pOff + PART_Y_FTOT] = 0;// + 1 *s0dot[pOff + PART_Y_FTOT];
        s_1[pOff + PART_Z_FTOT] = 0;// + 1 *s0dot[pOff + PART_Z_FTOT];
        s_1[pOff + PART_R] = s_0[pOff + PART_R];// * 2 - sPre[PART_R+ pOff] + s0_dot2[pOff + PART_R] * h * h;// + 1 *s0dot[pOff + PART_R];
        s_1[pOff + PART_G] = s_0[pOff + PART_G];// * 2 - sPre[PART_G+ pOff] + s0_dot2[pOff + PART_G] * h * h;// + 1 *s0dot[pOff + PART_G];
        s_1[pOff + PART_B] = s_0[pOff + PART_B];// * 2 - sPre[PART_B+ pOff] + s0_dot2[pOff + PART_B] * h * h;// + 1 *s0dot[pOff + PART_B];
        s_1[pOff + PART_MASS] = s_0[pOff + PART_MASS] * 2 - sPre[PART_MASS+ pOff] + s0_dot2[pOff + PART_MASS] * h * h;// + 1 *s0dot[pOff + PART_MASS];
        s_1[pOff + PART_DIAM] = s_0[pOff + PART_DIAM] * 2 - sPre[PART_DIAM+ pOff] + s0_dot2[pOff + PART_DIAM] * h * h;// + 1 *s0dot[pOff + PART_DIAM];
        s_1[pOff + PART_RENDMODE] = s_0[pOff + PART_RENDMODE] * 2 - sPre[PART_RENDMODE+ pOff] + s0_dot2[pOff + PART_RENDMODE] * h * h;// + 1 *s0dot[pOff + PART_RENDMODE];
       
      } 

      break;
      case 6:         //new solver velocity Verlet
      var s_1dot = new Float32Array(partCount*PART_MAXVAR);

     // PartSys_DotFinder(dotSel, sPre, sPredot, partCount);

      //PartSys_DotFinder(dotSel, s0_dot, s0_dot2, partCount);

      for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;

        
        s_1[PART_XPOS+ pOff] = s_0[PART_XPOS+ pOff] + s_0[PART_XVEL+ pOff]*h + s0_dot[PART_XVEL+ pOff] * h * h * 0.5;
        s_1[PART_YPOS+ pOff] = s_0[PART_YPOS+ pOff] + s_0[PART_YVEL+ pOff]*h + s0_dot[PART_YVEL+ pOff] * h * h * 0.5;
        s_1[PART_ZPOS+ pOff] = s_0[PART_ZPOS+ pOff] + s_0[PART_ZVEL+ pOff]*h + s0_dot[PART_ZVEL+ pOff] * h * h * 0.5;
        s_1[pOff + PART_MASS] = s_0[pOff + PART_MASS];

        PartSys_ApplyForce(s_1, f , partCount, c0);
        PartSys_DotFinder(dotSel, s_1, s_1dot, partCount);

        s_1[PART_XVEL+ pOff] = s_0[PART_XVEL+ pOff] + (s_1dot[PART_XVEL+ pOff] + s0_dot[PART_XVEL+ pOff]) * h * 0.5;
        s_1[PART_YVEL+ pOff] = s_0[PART_YVEL+ pOff] + (s_1dot[PART_YVEL+ pOff] + s0_dot[PART_YVEL+ pOff]) * h * 0.5;
        s_1[PART_ZVEL+ pOff] = s_0[PART_ZVEL+ pOff] + (s_1dot[PART_ZVEL+ pOff] + s0_dot[PART_ZVEL+ pOff]) * h * 0.5;

        s_1[pOff + PART_X_FTOT] = 0;// + 1 *s0dot[pOff + PART_X_FTOT];
        s_1[pOff + PART_Y_FTOT] = 0;// + 1 *s0dot[pOff + PART_Y_FTOT];
        s_1[pOff + PART_Z_FTOT] = 0;// + 1 *s0dot[pOff + PART_Z_FTOT];
        s_1[pOff + PART_R] = s_0[pOff + PART_R];// * 2 - sPre[PART_R+ pOff] + s0_dot2[pOff + PART_R] * h * h;// + 1 *s0dot[pOff + PART_R];
        s_1[pOff + PART_G] = s_0[pOff + PART_G];// * 2 - sPre[PART_G+ pOff] + s0_dot2[pOff + PART_G] * h * h;// + 1 *s0dot[pOff + PART_G];
        s_1[pOff + PART_B] = s_0[pOff + PART_B];// * 2 - sPre[PART_B+ pOff] + s0_dot2[pOff + PART_B] * h * h;// + 1 *s0dot[pOff + PART_B];
        //s_1[pOff + PART_MASS] = s_0[pOff + PART_MASS] * 2 - sPre[PART_MASS+ pOff] + s0_dot2[pOff + PART_MASS] * h * h;// + 1 *s0dot[pOff + PART_MASS];
        s_1[pOff + PART_DIAM] = s_0[pOff + PART_DIAM];// * 2 - sPre[PART_DIAM+ pOff] + s0_dot2[pOff + PART_DIAM] * h * h;// + 1 *s0dot[pOff + PART_DIAM];
        s_1[pOff + PART_RENDMODE] = s_0[pOff + PART_RENDMODE];// * 2 - sPre[PART_RENDMODE+ pOff] + s0_dot2[pOff + PART_RENDMODE] * h * h;// + 1 *s0dot[pOff + PART_RENDMODE];
       
      } 

      break;
   }

}

function PartSys_doConstraint(s_1, partCount, c) {

    for(var i=0; i<partCount; i++) {      // for every particle in s0 state:
    // -- apply acceleration due to gravity to current velocity:
      var pOff = i * PART_MAXVAR;         // offset to start of i-th particle
     
      if(s_1[PART_XPOS+ pOff] < c[CONSRNT1_XMIN] && s_1[PART_XVEL+ pOff] < 0.0) {  
         s_1[PART_XVEL+ pOff] = -s_1[PART_XVEL+ pOff];
         // bounce on left wall.
      }
      else if (s_1[PART_XPOS+ pOff] > c[CONSRNT1_XMAX] && s_1[PART_XVEL+ pOff] > 0.0) {    
               s_1[PART_XVEL+ pOff] = -s_1[PART_XVEL+ pOff];
               // bounce on right wall
      }
      if(s_1[PART_YPOS+ pOff] < c[CONSRNT1_YMIN] && s_1[PART_YVEL+ pOff] < 0.0) {    
         s_1[PART_YVEL+ pOff] = -s_1[PART_YVEL+ pOff];
         // bounce on back
      }
      else if( s_1[PART_YPOS+ pOff] > c[CONSRNT1_YMAX] && s_1[PART_YVEL+ pOff] > 0.0) {    
        s_1[PART_YVEL+ pOff] = -s_1[PART_YVEL+ pOff];
        // bounce on front
      }
      if(s_1[PART_ZPOS+ pOff] < c[CONSRNT1_ZMIN] && s_1[PART_ZVEL+ pOff] < 0.0) {    
         s_1[PART_ZVEL+ pOff] = -s_1[PART_ZVEL+ pOff];
         // bounce on floor
      }
      else if( s_1[PART_ZPOS+ pOff] > c[CONSRNT1_ZMAX] && s_1[PART_ZVEL+ pOff] > 0.0) {    
        s_1[PART_ZVEL+ pOff] = -s_1[PART_ZVEL+ pOff];
        // bounce on ceiling
      }


  

      //  -- hard limit on 'floor' keeps y position >= 0;
      if(s_1[PART_YPOS+ pOff] <  c[CONSRNT1_YMIN]) {
        s_1[PART_YPOS+ pOff] = c[CONSRNT1_YMIN];
      }
      //  -- add hard limits to the other walls too...
      if(s_1[PART_XPOS+ pOff] <  c[CONSRNT1_XMIN]) {
        s_1[PART_XPOS+ pOff] = c[CONSRNT1_XMIN];    
      }
      if(s_1[PART_ZPOS+ pOff] <  c[CONSRNT1_ZMIN]) {
        s_1[PART_ZPOS+ pOff] = c[CONSRNT1_ZMIN]; 
      }
      if(s_1[PART_ZPOS+ pOff] >=  c[CONSRNT1_ZMAX]) {
        s_1[PART_ZPOS+ pOff] = c[CONSRNT1_ZMAX];  
      }
      if(s_1[PART_XPOS+ pOff] >=  c[CONSRNT1_XMAX]) {
        s_1[PART_XPOS+ pOff] = c[CONSRNT1_XMAX];
      }
      if(s_1[PART_YPOS+ pOff] >=  c[CONSRNT1_YMAX]) {
        s_1[PART_YPOS+ pOff] = c[CONSRNT1_YMAX];
      }
      //============================================


      //--------trying repel start------------------
      /*if (i != partCount-1){
      var lOff = (partCount-1) * PART_MAXVAR;
      var dx = s1[PART_XPOS+ pOff] - s1[PART_XPOS+lOff];
      var dy = s1[PART_YPOS+ pOff] - s1[PART_YPOS+lOff];
      var dz = s1[PART_ZPOS+ pOff] - s1[PART_ZPOS+lOff];

      var d = Math.sqrt(dx*dx + dy*dy + dz*dz); 

      var dxNorm = Math.abs(dx / d);
      var dyNorm = Math.abs(dy / d);
      var dzNorm = Math.abs(dz / d);


      if (d < 0.12){
        //console.log(d);
        s1[PART_XPOS + pOff] = s1[PART_XPOS+lOff] + 0.15 * dx / d;
        s1[PART_XPOS + pOff] = s1[PART_YPOS+lOff] + 0.15 * dy / d;
        s1[PART_XPOS + pOff] = s1[PART_ZPOS+lOff] + 0.15 * dz / d;

        //s1[PART_XPOS + pOff] = s0[PART_XPOS+lOff];
        //s1[PART_XPOS + pOff] = s0[PART_YPOS+lOff];
        //s1[PART_XPOS + pOff] = s0[PART_ZPOS+lOff];

        //s1[PART_XVEL+ pOff] += dxNorm*0.5*0.5;
        //s1[PART_YVEL+ pOff] += dyNorm*0.5*0.5;
        //s1[PART_YVEL+ pOff] *= 0.97;
        //s1[PART_ZVEL+ pOff] += dzNorm*0.5*0.01;

      }
      }

      //--------trying repel end--------------------*/
      //if(i != 0){
      //  boid(s51, i, partCount5);
      //}

      
    }

}

function PartSys_Swap(s_0,s_1, s_pre, partCount) {
  ///console.log("s0 before: " + s0[0]);
  //console.log("s1 before: " + s1[0]);
  var sTmp = new Float32Array(partCount * PART_MAXVAR);

  for(var i=0; i<partCount; i++) {
    var pOff = i*PART_MAXVAR;
    sTmp[pOff + PART_XPOS] = s_0[pOff + PART_XPOS];
    sTmp[pOff + PART_YPOS] = s_0[pOff + PART_YPOS];
    sTmp[pOff + PART_ZPOS] = s_0[pOff + PART_ZPOS];
    sTmp[pOff + PART_XVEL] = s_0[pOff + PART_XVEL];
    sTmp[pOff + PART_YVEL] = s_0[pOff + PART_YVEL];
    sTmp[pOff + PART_ZVEL] = s_0[pOff + PART_ZVEL];
    sTmp[pOff + PART_X_FTOT] = s_0[pOff + PART_X_FTOT];
    sTmp[pOff + PART_Y_FTOT] = s_0[pOff + PART_Y_FTOT];
    sTmp[pOff + PART_Z_FTOT] = s_0[pOff + PART_Z_FTOT];
    sTmp[pOff + PART_R] = s_0[pOff + PART_R];
    sTmp[pOff + PART_G] = s_0[pOff + PART_G];
    sTmp[pOff + PART_B] = s_0[pOff + PART_B];
    sTmp[pOff + PART_MASS] = s_0[pOff + PART_MASS];
    sTmp[pOff + PART_DIAM] = s_0[pOff + PART_DIAM];
    sTmp[pOff + PART_RENDMODE] = s_0[pOff + PART_RENDMODE];
  }

  for(var i=0; i<partCount; i++) {
    var pOff = i*PART_MAXVAR;
    s_0[pOff + PART_XPOS] = s_1[pOff + PART_XPOS];
    s_0[pOff + PART_YPOS] = s_1[pOff + PART_YPOS];
    s_0[pOff + PART_ZPOS] = s_1[pOff + PART_ZPOS];
    s_0[pOff + PART_XVEL] = s_1[pOff + PART_XVEL];
    s_0[pOff + PART_YVEL] = s_1[pOff + PART_YVEL];
    s_0[pOff + PART_ZVEL] = s_1[pOff + PART_ZVEL];
    s_0[pOff + PART_X_FTOT] = s_1[pOff + PART_X_FTOT];
    s_0[pOff + PART_Y_FTOT] = s_1[pOff + PART_Y_FTOT];
    s_0[pOff + PART_Z_FTOT] = s_1[pOff + PART_Z_FTOT];
    s_0[pOff + PART_R] = s_1[pOff + PART_R];
    s_0[pOff + PART_G] = s_1[pOff + PART_G];
    s_0[pOff + PART_B] = s_1[pOff + PART_B];
    s_0[pOff + PART_MASS] = s_1[pOff + PART_MASS];
    s_0[pOff + PART_DIAM] = s_1[pOff + PART_DIAM];
    s_0[pOff + PART_RENDMODE] = s_1[pOff + PART_RENDMODE];
  }

  for(var i=0; i<partCount; i++) {
    var pOff = i*PART_MAXVAR;
    s_1[pOff + PART_XPOS] = sTmp[pOff + PART_XPOS];
    s_1[pOff + PART_YPOS] = sTmp[pOff + PART_YPOS];
    s_1[pOff + PART_ZPOS] = sTmp[pOff + PART_ZPOS];
    s_1[pOff + PART_XVEL] = sTmp[pOff + PART_XVEL];
    s_1[pOff + PART_YVEL] = sTmp[pOff + PART_YVEL];
    s_1[pOff + PART_ZVEL] = sTmp[pOff + PART_ZVEL];
    s_1[pOff + PART_X_FTOT] = sTmp[pOff + PART_X_FTOT];
    s_1[pOff + PART_Y_FTOT] = sTmp[pOff + PART_Y_FTOT];
    s_1[pOff + PART_Z_FTOT] = sTmp[pOff + PART_Z_FTOT];
    s_1[pOff + PART_R] = sTmp[pOff + PART_R];
    s_1[pOff + PART_G] = sTmp[pOff + PART_G];
    s_1[pOff + PART_B] = sTmp[pOff + PART_B];
    s_1[pOff + PART_MASS] = sTmp[pOff + PART_MASS];
    s_1[pOff + PART_DIAM] = sTmp[pOff + PART_DIAM];
    s_1[pOff + PART_RENDMODE] = sTmp[pOff + PART_RENDMODE];
  }

  for(var i=0; i<partCount; i++) {
    var pOff = i*PART_MAXVAR;
    s_pre[pOff + PART_XPOS] = s_0[pOff + PART_XPOS];
    s_pre[pOff + PART_YPOS] = s_0[pOff + PART_YPOS];
    s_pre[pOff + PART_ZPOS] = s_0[pOff + PART_ZPOS];
    s_pre[pOff + PART_XVEL] = s_0[pOff + PART_XVEL];
    s_pre[pOff + PART_YVEL] = s_0[pOff + PART_YVEL];
    s_pre[pOff + PART_ZVEL] = s_0[pOff + PART_ZVEL];
    s_pre[pOff + PART_X_FTOT] = s_0[pOff + PART_X_FTOT];
    s_pre[pOff + PART_Y_FTOT] = s_0[pOff + PART_Y_FTOT];
    s_pre[pOff + PART_Z_FTOT] = s_0[pOff + PART_Z_FTOT];
    s_pre[pOff + PART_R] = s_0[pOff + PART_R];
    s_pre[pOff + PART_G] = s_0[pOff + PART_G];
    s_pre[pOff + PART_B] = s_0[pOff + PART_B];
    s_pre[pOff + PART_MASS] = s_0[pOff + PART_MASS];
    s_pre[pOff + PART_DIAM] = s_0[pOff + PART_DIAM];
    s_pre[pOff + PART_RENDMODE] = s_0[pOff + PART_RENDMODE];
  }

}


function blow(f, forcerCount){
  for (var i = 0; i < forcerCount; i++){
    var fOff = i * forcer_maxvar;
    if (Math.abs(f[fOff + f_type]) == F_WIND){
      f[fOff + f_type] = -f[fOff + f_type];
      f[fOff + wind_y] = 2 * (Math.random()*2 -1);
    }
  }
}

function damping(s, dampVal, partCount){
  for(var i=0; i<partCount; i++) {
    var pOff = i*PART_MAXVAR;

    s[pOff + PART_XVEL] *= dampVal;
    s[pOff + PART_YVEL] *= dampVal;
    s[pOff + PART_ZVEL] *= dampVal;

  }
}

function spring_grid_damping(s, dampVal, partCount, f){
  for (var i = F_SPRING_PSTART + 1; i <= F_SPRING_PEND; i++){
    var pOff = i*PART_MAXVAR;
    var pPreOff = (i-1)*PART_MAXVAR;
    var pSecPreOff = (i-2)*PART_MAXVAR;
  }
  for(var i=0; i<partCount; i++) {
    var pOff = i*PART_MAXVAR;

    s[pOff + PART_XVEL] *= dampVal;
    s[pOff + PART_YVEL] *= dampVal;
    s[pOff + PART_ZVEL] *= dampVal;

  }

}

function spring_grid_solver(s_1, partCount){
  for(var i=0; i<partCount; i++) {
    var pOff = i*PART_MAXVAR;
    if (hanging){
      if (i % 2 == 0 && i < widthCount ){
        s_1[PART_ZPOS+ pOff] = 1;
      }

      if(i == F_SPRING_PSTART){
        s_1[pOff + PART_XPOS] = 1;   // 0.0 <= randomRound() < 1.0
        s_1[pOff + PART_YPOS] = 1;
      }

      if(i == widthCount-1){
        s_1[pOff + PART_XPOS] = 0.5;   // 0.0 <= randomRound() < 1.0
        s_1[pOff + PART_YPOS] = 1;
      }

      if(i < widthCount && i%2 == 0){
        var delta = 0.5 / ((widthCount + 1) /2);
        s_1[pOff + PART_XPOS] = 1 - i * delta;
        s_1[pOff + PART_YPOS] = 1;
      }

    }
    if ((i % widthCount) % 2 == 0 && i >widthCount){

      var pAddUpOff = (i - 2 * (i%widthCount)) * PART_MAXVAR;

      s_1[pAddUpOff + PART_XPOS] = s_1[pOff + PART_XPOS];
      s_1[pAddUpOff + PART_YPOS] = s_1[pOff + PART_YPOS];
      s_1[pAddUpOff + PART_ZPOS] = s_1[pOff + PART_ZPOS];

      s_1[pAddUpOff + PART_XVEL] = s_1[pOff + PART_XVEL];
      s_1[pAddUpOff + PART_YVEL] = s_1[pOff + PART_YVEL];
      s_1[pAddUpOff + PART_ZVEL] = s_1[pOff + PART_ZVEL];

      s_1[pAddUpOff + PART_X_FTOT] = s_1[pOff + PART_X_FTOT];
      s_1[pAddUpOff + PART_Y_FTOT] = s_1[pOff + PART_Y_FTOT];
      s_1[pAddUpOff + PART_Z_FTOT] = s_1[pOff + PART_Z_FTOT];
      s_1[pAddUpOff + PART_R] = s_1[pOff + PART_R];
      s_1[pAddUpOff + PART_G] = s_1[pOff + PART_G];
      s_1[pAddUpOff + PART_B] = s_1[pOff + PART_B];
      s_1[pAddUpOff + PART_MASS] = s_1[pOff + PART_MASS];
      s_1[pAddUpOff + PART_DIAM] = s_1[pOff + PART_DIAM];
      s_1[pAddUpOff + PART_RENDMODE] = s_1[pOff + PART_RENDMODE];
        

    }
        

  }

}


function roundRand2D() {
//==============================================================================
// On each call, make a different 2D point (xdisc, ydisc) chosen 'randomly' 
// and 'uniformly' inside a circle of radius 1.0 centered at the origin.  
// More formally: 
//    --xdisc*xdisc + ydisc*ydisc < 1.0, and 
//    --uniform probability density function (PDF) within this radius=1 circle.
//    (within this circle, all regions of equal area are equally likely to
//    contain the the point (xdisc,ydisc)).
var xy = [0,0];
  do {      // 0.0 <= Math.random() < 1.0 with uniform PDF.
    xy[0] = 2.0*Math.random() -1.0;     // choose an equally-likely 2D point
    xy[1] = 2.0*Math.random() -1.0;     // within the +/-1, +/-1 square.
    }
  while(xy[0]*xy[0] + xy[1]*xy[1] >= 1.0);    // keep 1st point inside circle
//  while(xdisc*xdisc + ydisc*ydisc >= 1.0);    // keep 1st point inside circle.
  return xy;
}

function roundRand3D(sel) {
//==============================================================================
// On each call, find a different 3D point (xball, yball, zball) chosen 
// 'randomly' and 'uniformly' inside a sphere of radius 1.0 centered at origin.  
// More formally: 
//    --xball*xball + yball*yball + zball*zball < 1.0, and 
//    --uniform probability density function inside this radius=1 circle.
//    (within this sphere, all regions of equal volume are equally likely to
//    contain the the point (xball,yball,zball)).
var xball;     // choose an equally-likely 2D point
var yball;     // within th
var zball;
  switch(sel) {
    case 0:
      //do {      // 0.0 <= Math.random() < 1.0 with uniform PDF.
      //  xball = 2.0*Math.random() -1.0;     // choose an equally-likely 2D point
      //  yball = 2.0*Math.random() -1.0;     // within the +/-1, +/-1 square.
      //  zball = 2.0*Math.random() -1.0;
      //  }
      //while(xball*xball + yball*yball + zball*zball >= 1.0);    // keep 1st point inside sphere.
      xball = 2.0*(Math.random());     // choose an equally-likely 2D point
      yball = 2.0*Math.random();     // within the +/-1, +/-1 square.
      zball = 2.0*(Math.random()+3);
      //ret = new Array(xball,yball,zball);
    break;
    case 1:
      do {      // 0.0 <= Math.random() < 1.0 with uniform PDF.
        xball = 2.0*Math.random() -1.0;     // choose an equally-likely 2D point
        yball = 2.0*Math.random() -1.0;     // within the +/-1, +/-1 square.
        zball = 2.0*Math.random() -1.0;
        }
      while(xball*xball + yball*yball + zball*zball >= 1.0);    // keep 1st point inside sphere.

      
    break;
    case 2:     //Cone ground
      do {      // 0.0 <= Math.random() < 1.0 with uniform PDF.

        xball = 0.5 * (Math.random() - 0.5);     // choose an equally-likely 2D point
        yball = 0.5 * (Math.random() - 0.5);     // within the +/-0.25, +/-0.25 square.
        zball = 0;
        //console.log("part loc: " + xball*xball + yball*yball + zball*zball )
        }
      while(xball*xball + yball*yball + zball*zball >= 0.25*0.25);    // keep 1st point inside sphere.

      
    break;
    case 3:     //Cone ground
      do {      // 0.0 <= Math.random() < 1.0 with uniform PDF.

        xball = 2 * (Math.random()*2 - 1);     // choose an equally-likely 2D point
        yball = 2 * (Math.random()*2 - 1);     // within the +/-0.25, +/-0.25 square.
        zball = 2 * (Math.random());
        //console.log("part loc: " + xball*xball + yball*yball + zball*zball )
        }
      while(xball*xball + yball*yball + zball*zball >= 0.2);    // keep 1st point inside sphere.

      
    break;
  } 
  var ret = new Array(xball,yball,zball);
  return ret;
}

function removeForce(s,i){
  var pOff = i*PART_MAXVAR;
  s[pOff + PART_X_FTOT] = 0;
  s[pOff + PART_Y_FTOT] = 0;
  s[pOff + PART_Z_FTOT] = 0;
}
/*
/
VBObox2.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox2.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox2.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================

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
  if(yMclik > 0){
    Burn_Bigger()
    
  }else{
    Burn_Smaller()
  }
  
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

  // find how far we dragged the mouse:
  xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  xMclik = x;                         // Make next drag-measurement from here.
  yMclik = y;
// (? why no 'document.getElementById() call here, as we did for myMouseDown()
// and myMouseUp()? Because the webpage doesn't get updated when we move the 
// mouse. Put the web-page updating command in the 'draw()' function instead)
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
  console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = false;                     // CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);

  console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
  // Put it on our webpage too...
};

//=============================================================================
function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

  var xcount = 500;     // # of lines to draw in x,y to make the grid.
  var ycount = 500;   
  var xymax = 500.0;      // grid size; extends to cover +/-xymax in x and y.
  var xColr = new Float32Array([0.4, 0.45, 0.45]);  // bright yellow
  var yColr = new Float32Array([0.4, 0.45, 0.45]);  // bright green.
  
  // Create an (global) array to hold this ground-plane's vertices:
  gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
            // draw a grid made of xcount+ycount lines; 2 vertices per line.
            
  var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
  var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
  
  // First, step thru x values as we make vertical lines of constant-x:
  for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
    if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;  // x
      gndVerts[j+1] = -xymax;               // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w
    }
    else {        // put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
      gndVerts[j+1] = xymax;                // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w
    }
    gndVerts[j+4] = xColr[0];     // red
    gndVerts[j+5] = xColr[1];     // grn
    gndVerts[j+6] = xColr[2];     // blu

    //gndVerts[j+6] = 0;     // red
    //gndVerts[j+7] = 0;     // grn
    //gndVerts[j+8] = 1;     // blu
  }
  // Second, step thru y values as wqe make horizontal lines of constant-y:
  // (don't re-initialize j--we're adding more vertices to the array)
  for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
    if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;               // x
      gndVerts[j+1] = -xymax + (v  )*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w
    }
    else {          // put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;                // x
      gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
      gndVerts[j+3] = 1.0;                  // w
    }
    gndVerts[j+4] = yColr[0];     // red
    gndVerts[j+5] = yColr[1];     // grn
    gndVerts[j+6] = yColr[2];     // blu

    //gndVerts[j+6] = 0;     // red
    //gndVerts[j+7] = 0;     // grn
    //gndVerts[j+8] = 1;     // blu
  }
}