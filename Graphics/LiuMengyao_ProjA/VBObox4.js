var timeStep = 1.0;        // initialize; current timestep in seconds
var h4 = 0.2;
var g_last = Date.now();        // Timestamp: set after each frame of animation,
                                // used by 'animate()' function to find how much
                                // time passed since we last updated our canvas.

var partCount4 = 10000;

var widthCount4 = 9 * 11;
var ForcerCount4 = 7;  
var ConsrntCount = 1;
var myRunMode4 = 0;      // Particle System: 0=reset; 1= pause; 2=step; 3=run
var INIT_VEL4 = 0.1;    // avg particle speed: ++Start,--Start buttons adjust.

var s40 = new Float32Array(partCount4 * PART_MAXVAR);
var s41 = new Float32Array(partCount4 * PART_MAXVAR);
var s4m = new Float32Array(partCount4 * PART_MAXVAR);
var s40dot = new Float32Array(partCount4 * PART_MAXVAR);
var s4mdot = new Float32Array(partCount4 * PART_MAXVAR);

var s4Pre = new Float32Array(partCount4 * PART_MAXVAR);
var s4Predot = new Float32Array(partCount4 * PART_MAXVAR);

for(var i = 0; i < s4Pre.length; i++){
  s4Pre[i] = 0.00000001;
}

var f40 = new Float32Array(forcer_maxvar*ForcerCount);
var c40 = new Float32Array(CONSRNT_MAXVAR);

var burning_r = 0.5

function VBObox4() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox' object  that holds all data and fcns 
// needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate set of shaders.
  
  this.VERT_SRC = //--------------------- VERTEX SHADER source code 
  'precision highp float;\n' +        // req'd in OpenGL ES if we use 'float'
  'uniform bool moving4; \n' +
  //'uniform bool moving; \n' +
  'uniform mat4 u_ViewMatrix4;\n' +
  'uniform mat4 u_ProjMatrix4;\n' +
  //
  'attribute vec3 a_Position4; \n' +       // current state: particle position
  'attribute vec3 a_Color4; \n' +          // current state: particle color
  'attribute float a_diam4; \n' +          // current state: diameter in pixels
  'varying   vec4 v_Color4; \n' +          // (varying--send to particle
  'void main() {\n' +
  '  gl_Position = u_ProjMatrix4 * u_ViewMatrix4 * vec4(a_Position4.x + 2.0, a_Position4.y, a_Position4.z, 1.0);  \n' +  
  '  gl_PointSize = a_diam4; \n' +
  '  v_Color4 = vec4(a_Color4, 1.0); \n' +
  '} \n';
// Each instance computes all the on-screen attributes for just one VERTEX,
// supplied by 'attribute vec4' variable a_Position, filled from the 
// Vertex Buffer Object (VBO) we created inside the graphics hardware by calling 
// the 'initVertexBuffers()' function, and updated by 'PartSys_render() calls.

  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'uniform  int u_runMode4; \n' +  
  'varying vec4 v_Color4; \n' +
  'uniform bool moving4; \n' +
  'void main() {\n' +  
  ' if(!moving4) { \n' +
  '  gl_FragColor = v_Color4;\n' +
  ' } \n' +
  ' else { \n' +
  '  if(u_runMode4 == 111) { \n' +
  '    gl_FragColor = v_Color4;  \n' +   // red: 0==reset
  '  } \n' +
  '  else if(u_runMode4 == 1 || u_runMode4 == 2 || u_runMode4 == 0) {  \n' + //  1==pause, 2==step
  '    float dist = distance(gl_PointCoord, vec2(0.5,0.5)); \n' +
  '    if(dist < 0.5) { gl_FragColor = v_Color4; } else {discard; } \n' +
  '  }  \n' +
  '  else { \n' +
  '    float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
  '    if(dist < 0.5) { \n' + 
  //'       gl_FragColor = vec4((1.0 - 1.5*dist)*v_Color4.rgb, 1.0);\n' +
  '       gl_FragColor = v_Color4;\n' +
  '    } else { discard; }\n' +
  '  }  \n;' +
  ' } \n' +

  '} \n';

  this.vboContents = //---------------------
    new Float32Array ([         // Array of vertex attribute values we will
                                // transfer to GPU's vertex buffer object (VBO)
      // 1 vertex per line: pos x,y,z,w;   color; r,g,b;   point-size; 
    -0.3,  0.7, 0.0, 1.0,   0.0, 1.0, 1.0,   7.0,
    -0.3, -0.3, 0.0, 1.0,   1.0, 0.0, 1.0,  10.0,
     0.3, -0.3, 0.0, 1.0,   1.0, 1.0, 0.0,  13.0,
  ]);
  this.vboVerts = 3;              // # of vertices held in 'vboContents' array;
  this.vboLoc;                    // Vertex Buffer Object location# on the GPU
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd for 1 array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls) 
  this.shaderLoc;                 // Shader-program location # on the GPU, made 
                                  // by compile/link of VERT_SRC and FRAG_SRC.
                //-------------------- Attribute locations in our shaders
  this.a_PositionID;              // GPU location: shader 'a_Position' attribute
  this.a_ColorID;               // GPU location: shader 'a_Color' attribute
  //this.a_PtSize;                  // GPU location: shader 'a_PtSize' attribute
                //-------------------- Uniform locations &values in our shaders


  this.viewMatrix = new Matrix4();
    this.projMatrix = new Matrix4();
    this.u_ViewMatrix;
    this.u_ProjMatrix;
};


VBObox4.prototype.init = function(myGL) {
//=============================================================================
// Create, compile, link this VBObox object's shaders to an executable 'program'
// ready for use in the GPU.  Create and fill a Float32Array that holds all VBO 
// vertices' values; create a new VBO on the GPU and fill it with those values. 
// Find the GPU location of all our shaders' attribute- and uniform-variables; 
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
  //  == "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //  == "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  myGL.bindBuffer(myGL.ARRAY_BUFFER,  // GLenum 'target' for this GPU buffer 
                  this.vboLoc);       // the ID# the GPU uses for this buffer.
                        
 // Transfer data from our JavaScript Float32Array object to the just-bound VBO. 
 //  (Recall gl.bufferData() changes GPU's memory allocation: use 
 //   gl.bufferSubData() to modify buffer contents without changing its size)
 // The 'hint' helps GPU allocate its shared memory for best speed & efficiency
 // (see OpenGL ES specification for more info).  Your choices are:
 //   --STATIC_DRAW is for vertex buffers rendered many times, but whose 
 //       contents rarely or never change.
 //   --DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
 //       contents may change often as our program runs.
 //   --STREAM_DRAW is for vertex buffers that are rendered a small number of 
 //       times and then discarded; for rapidly supplied & consumed VBOs.
  myGL.bufferData(gl.ARRAY_BUFFER,      // GLenum target(same as 'bindBuffer()')
                  s40,    // JavaScript Float32Array
                  gl.STATIC_DRAW);      // Usage hint.
                 
// Find & Set All Attributes:------------------------------
  // a) Get the GPU location for each attribute var used in our shaders:
  this.a_PositionID = gl.getAttribLocation(this.shaderLoc, 'a_Position4');
  if(this.a_PositionID < 0) {
    console.log(this.constructor.name + 
                '.init() Failed to get GPU location of attribute a_Position4');
    return -1;  // error exit.
  }
  this.a_ColorID = myGL.getAttribLocation(this.shaderLoc, 'a_Color4');
  if(this.a_ColorID < 0) {
    console.log(this.constructor.name + 
                '.init() failed to get the GPU location of attribute a_Color4');
    return -1;  // error exit.
  }
  // NEW! a_PtSize' attribute values are stored only in VBO2, not VBO1:
  /*this.a_PtSizeLoc = gl.getAttribLocation(this.shaderLoc, 'a_PtSize');
  if(!this.a_PtSizeLoc) {
    console.log(this.constructor.name + 
                '.init() failed to get the GPU location of attribute a_PtSize');
    //return -1;  // error exit.
  }*/
  // b) Next, set up GPU to fill these attribute vars in our shader with 
  // values pulled from the currently-bound VBO (see 'gl.bindBuffer()).
  //  Here's how to use the almost-identical OpenGL version of this function:
  //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  myGL.vertexAttribPointer(
    this.a_PositionID,//index == ID# for the attribute var in GLSL shader pgm;
    3,            // size == how many dimensions for this attribute: 1,2,3 or 4?
    myGL.FLOAT,   // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  normalize before use? true or false
    PART_MAXVAR*this.FSIZE, // Stride == #bytes we must skip in the VBO to move from one 
                  // of our stored attributes to the next.  This is usually the 
                  // number of bytes used to store one complete vertex.  If set 
                  // to zero, the GPU gets attribute values sequentially from 
                  // VBO, starting at 'Offset'. 
                  // (Vertex size in bytes: 4 floats for pos; 3 color; 1 PtSize)
    PART_XPOS*this.FSIZE);            // Offset == how many bytes from START of buffer to the first
                  // value we will actually use?  (We start with position).
  myGL.vertexAttribPointer(this.a_ColorID, 3, myGL.FLOAT, false, 
              PART_MAXVAR*this.FSIZE,       // stride for VBO2 (different from VBO1!)
              PART_R*this.FSIZE);     // offset: skip the 1st 4 floats.
  /*myGL.vertexAttribPointer(this.a_PtSizeLoc, 1, myGL.FLOAT, false, 
              8*rayView.FSIZE,    // stride for VBO2 (different from VBO1!) 
              7*rayView.FSIZE);   // offset: skip the 1st 7 floats.
*/
  // c) Enable this assignment of the attribute to its' VBO source:
  myGL.enableVertexAttribArray(this.a_PositionID);
  myGL.enableVertexAttribArray(this.a_ColorID);

   // ---------------Connect 'a_diam' attribute to bound buffer:---------------
  // Get the ID# for the scalar a_diam variable in the graphics hardware
  // (keep it as global var--we'll need it for PartSys_render())
  this.a_diamID = myGL.getAttribLocation(this.shaderLoc, 'a_diam4');
  if(this.a_diamID < 0) {
    console.log('Failed to get the storage location of scalar a_diam4');
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
  //myGL.enableVertexAttribArray(this.a_PtSize);

// Find All Uniforms:--------------------------------
//Get GPU storage location for each uniform var used in our shader programs: 
/* this.u_ModelMatrixLoc = myGL.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
  if (!this.u_ModelMatrixLoc) { 
    console.log(this.constructor.name + 
                '.init() failed to get GPU location for u_ModelMatrix uniform');
    return;
  }*/

  this.u_runModeID = myGL.getUniformLocation(this.shaderLoc, 'u_runMode4');
  if(!this.u_runModeID) {
    console.log('Failed to get u_runMode4 variable location');
    return;
  }                                       // set the value of the uniforms:
  //myGL.uniform1i(this.u_runModeID, myRunMode);   // (keyboard callbacks set myRunMode)

  this.u_ViewMatrix = myGL.getUniformLocation(this.shaderLoc, 'u_ViewMatrix4');
  this.u_ProjMatrix = myGL.getUniformLocation(this.shaderLoc, 'u_ProjMatrix4');

  this.u_moving = myGL.getUniformLocation(this.shaderLoc, 'moving4');
  if(!this.u_moving) {
    console.log('Failed to get moving variable location');
    //return;
  }
  //myGL.uniform1i(this.u_moving, false);  

}

VBObox4.prototype.adjust = function(myGL) {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.
  myGL.useProgram(this.shaderLoc);  // In the GPU, SELECT our already-compiled
                                    // -and-linked executable shader program.

}

VBObox4.prototype.draw = function(myGL) {
//=============================================================================
// Send commands to GPU to select and render current VBObox contents.
    
  myGL.useProgram(this.shaderLoc);  // In the GPU, SELECT our already-compiled
                                    // -and-linked executable shader program.
//------CAREFUL! RE-BIND YOUR VBO AND RE-ASSIGN SHADER ATTRIBUTES!-------------
//    Each call to useProgram() reconfigures the GPU's processors & data paths 
// for efficient SIMD execution of the newly-selected shader program. While the 
// 'old' shader program's attributes and uniforms remain at their same memory 
// locations, starting the new shader program invalidates the old data paths 
// that connected these attributes to the VBOs in memory that supplied their 
// values. When we call useProgram() to return to our 'old' shader program, we 
// must re-establish those data-paths between shader attributes and VBOs, even 
// if those attributes, VBOs, and locations have not changed!
//    Thus after each useProgram() call, we must:
// a)--call bindBuffer() again to re-bind each VBO that our shader will use, &
// b)--call vertexAttribPointer() again for each attribute in our new shader
//    program, to re-connect the data-path(s) from bound VBO(s) to attribute(s):
// c)--call enableVertexAttribArray() to enable use of those data paths.
//----------------------------------------------------
  // a) Re-set the GPU's currently 'bound' vbo buffer;
  myGL.bindBuffer(myGL.ARRAY_BUFFER,  // GLenum 'target' for this GPU buffer 
                    this.vboLoc);     // the ID# the GPU uses for this buffer.
  // (Here's how to use the almost-identical OpenGL version of this function:
  //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  //b) Re-connect data paths from VBO to each shader attribute:
  myGL.vertexAttribPointer(this.a_PositionID, 4, myGL.FLOAT, false, 
                            PART_MAXVAR*this.FSIZE, PART_XPOS*FSIZE);             // stride, offset
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

  myGL.uniform1i(this.u_runModeID, myRunMode4); 

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

  if(myRunMode4>1) {                       // 0=reset; 1= pause; 2=step; 3=run
    if(myRunMode4==2) myRunMode4=1;         // (if 2, do just one step and pause.)
    PartSys_ApplyForce(s40, f40, partCount4, c40);

  PartSys_DotFinder(2, s40, s40dot, partCount4);
  }
  
  //console.log(f40);
  myGL.uniform1i(this.u_runModeID, myRunMode4); //run/step/pause changes particle shape
  
  this.viewMatrix.translate(0.0, 0.0, -0.6);
  this.viewMatrix.scale(0.8, 0.8,0.8);
  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  // ----------------------------Draw the contents of the currently-bound VBO:
  myGL.uniform1i(this.u_moving, true); 
  PartSys_render(myGL, s40, partCount4);  // Draw the particle-system on-screen:
  myGL.uniform1i(this.u_moving, false); 
  //myGL.drawArrays(gl.LINE_STRIP, 1, partCount3-1); 
  //myGL.drawArrays(gl.LINE_LOOP, 1, partCount3-1); 

  //myGL.drawArrays(gl.TRIANGLE_FAN, 1, partCount3-1); 
  this.viewMatrix.scale(1/0.8, 1/0.8,1/0.8); 
  this.viewMatrix.translate(0.0, 0.0, 0.6);
  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);

    if(myRunMode4>1) {                       // 0=reset; 1= pause; 2=step; 3=run
    if(myRunMode4==2) myRunMode4=1;         // (if 2, do just one step and pause.)
  PartSys_Solver(2, s40, s40dot, s41, s4m, s4mdot,s4Pre,s4Predot, partCount4, h4, 2, f40);
  damping(s41, 0.985, partCount4);
  PartSys_doConstraint(s41,partCount4, c40);
    
  PartSys_Swap(s40,s41,s4Pre, partCount4);
  DieOut_Check(s40, partCount4);
  blow(f40, ForcerCount);
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

function Forcer_init_Helper4(sel, f, fOff, partCount){
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
      f[fOff + f_type] = -F_GRAV_P;
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
      f[fOff + f_type] = -F_SPRING;
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
      f[fOff + f_type] = -F_SPRING_GRID;
      f[fOff + grav_e] = 0;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0.001;
      f[fOff + RLen_s] = 0.05;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = partCount-1;
      f[fOff + wind_x] = 0;
      f[fOff + wind_y] = 0;
      f[fOff + wind_z] = 0;
      F_SPRING_PSTART = f[fOff + Start_s];
      f[fOff + push_f] = 0;
      f[fOff + boid_sep] = 0;
      f[fOff + boid_cir] = 0;

    break;
    case F_WIND:
      f[fOff + f_type] = -F_WIND;
      f[fOff + grav_e] = 0;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0;
      f[fOff + RLen_s] = 0;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = 0;
      f[fOff + wind_x] = 10;
      f[fOff + wind_y] = 0;
      f[fOff + wind_z] = 0.5;
      f[fOff + push_f] = 0;
      f[fOff + boid_sep] = 0;
      f[fOff + boid_cir] = 0;

    break;
    case F_WIND_FIRE:
      f[fOff + f_type] = F_WIND_FIRE;
      f[fOff + grav_e] = 0;
      f[fOff + grav_p] = 0;
      f[fOff + K_s] = 0;
      f[fOff + RLen_s] = 0;
      f[fOff + Start_s] = 0;
      f[fOff + End_s] = 0;
      f[fOff + wind_x] = 2;
      f[fOff + wind_y] = 0;
      f[fOff + wind_z] = 0.5;
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
  }
}



function PartSys_init4(sel, s, f, c, partCount) {
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
        Forcer_init_Helper4(i, f, fOff, partCount);
      }

      for(var i=0; i < partCount; i++) {
        var pOff = i*PART_MAXVAR;     // starting index of each particle
        if(doit==1) {
          doit=0;
          }
        //s[pOff + PART_XPOS] = 0.2 + 0.2*xcyc[0];   // 0.0 <= randomRound() < 1.0
        //s[pOff + PART_YPOS] = 0.2 + 0.2*xcyc[1];
        //s[pOff + PART_ZPOS] = 0.2 + 0.2*xcyc[2];
        xcyc = roundRand3D_forFire(burning_r);
        s[pOff + PART_XPOS] = xcyc[0];   // 0.0 <= randomRound() < 1.0
        s[pOff + PART_YPOS] = xcyc[1];
        s[pOff + PART_ZPOS] = xcyc[2];

        //xcyc = roundRand3D(1);
        /*s[pOff + PART_XVEL] = INIT_VEL4*(0.15 + 0.6*xcyc[0]);
        s[pOff + PART_YVEL] = INIT_VEL4*(0.15 + 0.6*xcyc[1]);
        s[pOff + PART_ZVEL] = INIT_VEL4*(0.15 + 0.6*xcyc[2]);*/

        ztemp = Math.random();
        xtemp = cone_angle(ztemp, 40)[0];
        ytemp = cone_angle(ztemp, 40)[0];


        s[pOff + PART_XVEL] = INIT_VEL4*xtemp * 2 * cone_angle(ztemp, 40)[1];
        s[pOff + PART_YVEL] = INIT_VEL4*ytemp * 2 * cone_angle(ztemp, 40)[1];
        s[pOff + PART_ZVEL] = INIT_VEL4*ztemp * 2 * cone_angle(ztemp, 40)[1];

        //s[pOff + PART_SPEED] = Math.sqrt(s[pOff + PART_XVEL]*s[pOff + PART_XVEL] + s[pOff + PART_YVEL]*s[pOff + PART_YVEL] + s[pOff + PART_ZVEL]*s[pOff + PART_ZVEL]);


        s[pOff + PART_X_FTOT] = 0.0;
        s[pOff + PART_Y_FTOT] = 0.0;
        s[pOff + PART_Z_FTOT] = 0.0;

        //s[pOff + PART_R] = 0.2 + 0.8*Math.random();
        //s[pOff + PART_G] = 0.2 + 0.8*Math.random();
        //s[pOff + PART_B] = 0.2 + 0.8*Math.random();

        s[pOff + PART_R] = 1;
        s[pOff + PART_G] = 0.85;
        s[pOff + PART_B] = 0.1;

        s[pOff + PART_MASS] = 0.9 + 0.2*Math.random();
        //s[pOff + PART_DIAM] = 10 * s[pOff + PART_MASS] + 10;
        s[pOff + PART_DIAM] = 1.0 + 6.0*Math.random();
        //s[pOff + PART_MASS] = 0.5;
        //s[pOff + PART_DIAM] = 10;
        s[pOff + PART_RENDMODE] = Math.floor(4.0*Math.random()); // 0,1,2 or 3.

      }
      

      c[CONSRNT1_XMIN] = -2.2;
      c[CONSRNT1_YMIN] = -2;
      c[CONSRNT1_ZMIN] = 0;
      c[CONSRNT1_XMAX] = 2.2;
      c[CONSRNT1_YMAX] = 2;
      c[CONSRNT1_ZMAX] = 5;


       break;
    case 1:         // increase current velocity by INIT_VEL
    default:

      /*for(var i=0; i<partCount; i++) {
        var pOff = i*PART_MAXVAR;     // starting index of each particle
        if(  s[pOff + PART_XVEL] > 0) {
             s[pOff + PART_XVEL] += (0.2 + 0.8*Math.random())*INIT_VEL4;
           }
        else s[pOff + PART_XVEL] -= (0.2 + 0.8*Math.random())*INIT_VEL4;

        if(  s[pOff + PART_YVEL] > 0) {
             s[pOff + PART_YVEL] += (0.2 + 0.8*Math.random())*INIT_VEL4;
        }
        else s[pOff + PART_YVEL] -= (0.2 + 0.8*Math.random())*INIT_VEL4;

        if(  s[pOff + PART_ZVEL] > 0) {
             s[pOff + PART_ZVEL] += (0.2 + 0.8*Math.random())*INIT_VEL4;
          }
        else s[pOff + PART_ZVEL] -= (0.2 + 0.8*Math.random())*INIT_VEL4;
      }
      */
      break;
   }
}

function Wind_changeDir(sel){
  switch(sel) {
    case 4: 
      for (var i = 0; i < ForcerCount4; i++){
        var fOff = i * forcer_maxvar;

        if (Math.abs(f40[fOff + f_type]) == F_WIND_FIRE){
          f40[fOff + wind_x] = -f40[fOff + wind_x];
        }
      }

    break;
    case 2:
      for (var i = 0; i < ForcerCount; i++){
        var fOff = i * forcer_maxvar;
        if (Math.abs(f0[fOff + f_type]) == F_WIND){
          f0[fOff + wind_x] = -f0[fOff + wind_x];
        }
      }
    break;
  }

  
}

function cone_angle(z, angle){
  
  do{
    var a = Math.random() *2 -1;
    var za = Math.sqrt(a*a + z*z);
  }
  while ((z / za) < Math.cos(Math.PI*(angle/180)))
  ret = new Array(a,Math.cos(Math.PI*(angle/180)))
  return ret
}

function DieOut_Check(s, partCount){
  for(var i=0; i<partCount; i++) {
    var pOff = i*PART_MAXVAR;     // starting index of each particle
    if (s[pOff + PART_DIAM] <= 0){
      ReActivate_Part(s, pOff, partCount);
    }
  }
}

function ReActivate_Part(s, pOff, partCount){

  xcyc = roundRand3D_forFire(burning_r);
  s[pOff + PART_XPOS] = xcyc[0];   // 0.0 <= randomRound() < 1.0
  s[pOff + PART_YPOS] = xcyc[1];
  s[pOff + PART_ZPOS] = xcyc[2];

  ztemp = Math.random();
  xtemp = cone_angle(ztemp, 40)[0];
  ytemp = cone_angle(ztemp, 40)[0];


  s[pOff + PART_XVEL] = INIT_VEL4*xtemp;
  s[pOff + PART_YVEL] = INIT_VEL4*ytemp;
  s[pOff + PART_ZVEL] = INIT_VEL4*ztemp;

  //s[pOff + PART_SPEED] = Math.sqrt(s[pOff + PART_XVEL]*s[pOff + PART_XVEL] + s[pOff + PART_YVEL]*s[pOff + PART_YVEL] + s[pOff + PART_ZVEL]*s[pOff + PART_ZVEL]);

  s[pOff + PART_X_FTOT] = 0.0;
  s[pOff + PART_Y_FTOT] = 0.0;
  s[pOff + PART_Z_FTOT] = 0.0;

  s[pOff + PART_R] = 1;
  s[pOff + PART_G] = 0.85;
  s[pOff + PART_B] = 0.1;

  s[pOff + PART_MASS] = 0.9 + 0.2*Math.random();
  s[pOff + PART_DIAM] = 1.0 + 10.0*Math.random();
        //s[pOff + PART_MASS] = 0.5;
        //s[pOff + PART_DIAM] = 10;
  s[pOff + PART_RENDMODE] = Math.floor(4.0*Math.random()); // 0,1,2 or 3.

}

function Burn_Bigger(){
  //partCount4 += 300;
 // if (g_AtX){

  //}
  if (burning_r < 1.2){
    INIT_VEL4 += 0.04;
    burning_r += 0.15;
  }else{
  }
  
}

function Burn_Smaller(){
  //partCount4 -= 300;
  

  if (burning_r > 0.15){
    burning_r -= 0.15;
    INIT_VEL4 -= 0.04;
  }else{
    //burning_r = 0.001;
  }
  
}

function roundRand3D_forFire(d){
  do {      // 0.0 <= Math.random() < 1.0 with uniform PDF.

    xball = d * (Math.random() - 0.5);     // choose an equally-likely 2D point
    yball = d * (Math.random() - 0.5);     // within the +/-0.25, +/-0.25 square.
    zball = 0;
        //console.log("part loc: " + xball*xball + yball*yball + zball*zball )
  }
  while(xball*xball + yball*yball + zball*zball >= (0.5*d)*(0.5*d));    // keep 1st point inside sphere.
  var ret = new Array(xball,yball,zball);
  return ret;
}

function wind_fire(f,forcerCount){
  console.log("fire wind");
  for (var i = 0; i < forcerCount; i++){
    var fOff = i * forcer_maxvar;
    console.log("got here: " + f[fOff + f_type])
    if (Math.abs(f[fOff + f_type]) == F_WIND_FIRE){
      f[fOff + f_type] = -f[fOff + f_type];
      
    }
  }

}



