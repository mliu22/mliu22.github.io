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
		beginner-level WebGL/OpenGL programs: if all vertices contain exactly the 
		same attributes (e.g. position, color, surface normal), and use the same 
		shader program (e.g. same Vertex Shader and Fragment Shader), then our 
		textbook's simple 'example code' will suffice.  But that's rare -- most 
		genuinely useful WebGL/OpenGL programs need different sets of vertices with 
		different sets of attributes rendered by different shader programs, where a 
		customized VBObox object for each VBO/shader pair will help you remember 
		and correctly implement all the WebGL/GLSL steps required for a working 
		program.
*/
// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
// 2016.06.03 J. Tumblin-- adjusted for ray-tracing starter code.
//=============================================================================
// Tabs set to 2

//=============================================================================
//=============================================================================
var floatsPerVertex = 11;
var gndVerts;
var canvas_width;
var canvas_height;
var g_EyeX =0, g_EyeY = 6, g_EyeZ = -2;
var g_AtX = 0, g_AtY = 0, g_AtZ = -2; 
var upX = 0, upY = 0, upZ = 1;

var phongLighting = true;
var uLoc_eyePosWorld  = false;

// ... for Phong material/reflectance:
var uLoc_Ke = false;
var uLoc_Ka = false;
var uLoc_Kd = false;
var uLoc_Kd2 = false;     // for K_d within the MatlSet[0] element.l
var uLoc_Ks = false;
var uLoc_Kshiny = false;

// NEXT, create global vars that contain the values we send thru those uniforms,
//  ... for our camera:

var lamp0 = new LightsT();
var lamp1 = new LightsT();

  // ... for our first material:
var matlSel= MATL_RED_PLASTIC;        // see keypress(): 'm' key changes matlSel
var matl0 = new Material(matlSel);  

// ---------------END of global vars----------------------------

var globalGL = false;
  var canvas = document.getElementById('webgl');


    var gl = getWebGLContext(canvas);

  var program = gl.createProgram();
  var vertexShader;
  var fragmentShader;

function VBObox1() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox1' object  that holds all data and 
// fcns needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate set of shaders.
  
  this.VERT_SRC = //--------------------- VERTEX SHADER source code 
  //
  //'uniform   int u_runMode; \n' +         // particle system state: 
                                          // 0=reset; 1= pause; 2=step; 3=run
  //'uniform   bool moving; \n' +
  //'uniform   vec4 u_ballShift; \n' +      // single bouncy-ball's movement
  'attribute vec4 a_Pos1;\n' +
  'attribute vec3 a_Colr1;\n' +
  'uniform mat4 u_ViewMatrix1;\n' +
  'uniform mat4 u_ProjMatrix1;\n' +
  'uniform mat4 u_ModelMatrix; \n' +    // Model matrix
  'varying   vec3 v_Colr1; \n' +

  'struct MatlT {\n' +    // Describes one Phong material by its reflectances:
  '   vec3 emit;\n' +     // Ke: emissive -- surface 'glow' amount (r,g,b);
  '   vec3 ambi;\n' +     // Ka: ambient reflectance (r,g,b)
  '   vec3 diff;\n' +     // Kd: diffuse reflectance (r,g,b)
  '   vec3 spec;\n' +     // Ks: specular reflectance (r,g,b)
  '   int shiny;\n' +     // Kshiny: specular exponent (integer >= 1; typ. <200)
  '   };\n' +



  'struct LampT {\n' +    // Describes one point-like Phong light source
  '   vec3 pos;\n' +      // (x,y,z,w); w==1.0 for local light at x,y,z position
                          //       w==0.0 for distant light from x,y,z direction 
  '   vec3 ambi;\n' +     // Ia ==  ambient light source strength (r,g,b)
  '   vec3 diff;\n' +     // Id ==  diffuse light source strength (r,g,b)
  '   vec3 spec;\n' +     // Is == specular light source strength (r,g,b)
  '}; \n' +

    'uniform LampT u_LampSet[2];\n' +   // Array of all light sources.
  //'uniform MatlT u_MatlSet[1];\n' +   // Array of all materials.
'attribute vec4 a_Normal;\n' +
'uniform vec3 u_eyePosWorld; \n' +  // Camera/eye location in world coords.

'uniform MatlT u_MatlSet[1];\n' +   // Array of all materials.
'uniform mat4 u_NormalMatrix;\n' +

 'varying vec3 v_Kd; \n' +             // Phong Lighting: diffuse reflectance
                                        // (I didn't make per-pixel Ke,Ka,Ks;
                                        // we use 'uniform' values instead)
  'varying vec4 v_Position; \n' +       
  'varying vec3 v_Normal; \n' +         // Why Vec3? its not a point, hence w==0



  'void main() {\n' +
  '  gl_Position = u_ProjMatrix1 * u_ViewMatrix1 * u_ModelMatrix * a_Pos1; \n' +  
   //'  v_Position = u_ModelMatrix * a_Pos1; \n' +
   '  v_Position =  u_ModelMatrix * a_Pos1; \n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Kd = u_MatlSet[0].diff; \n' +    // find per-pixel diffuse reflectance from per-vertex
                          // (no per-pixel Ke,Ka, or Ks, but you can do it...)
  '  v_Colr1 = a_Colr1;\n' +
  '} \n';

  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 

  'precision highp float;\n' +
  'precision highp int;\n' +

  'varying vec3 v_Colr1; \n' +
  'uniform bool moving; \n' +

  //'varying vec4 v_Color;\n' +
  //
  //--------------- GLSL Struct Definitions:
  'struct LampT {\n' +    // Describes one point-like Phong light source
  '   vec3 pos;\n' +      // (x,y,z,w); w==1.0 for local light at x,y,z position
                          //       w==0.0 for distant light from x,y,z direction 
  '   vec3 ambi;\n' +     // Ia ==  ambient light source strength (r,g,b)
  '   vec3 diff;\n' +     // Id ==  diffuse light source strength (r,g,b)
  '   vec3 spec;\n' +     // Is == specular light source strength (r,g,b)
  '}; \n' +
  //
  'struct MatlT {\n' +    // Describes one Phong material by its reflectances:
  '   vec3 emit;\n' +     // Ke: emissive -- surface 'glow' amount (r,g,b);
  '   vec3 ambi;\n' +     // Ka: ambient reflectance (r,g,b)
  '   vec3 diff;\n' +     // Kd: diffuse reflectance (r,g,b)
  '   vec3 spec;\n' +     // Ks: specular reflectance (r,g,b)
  '   int shiny;\n' +     // Kshiny: specular exponent (integer >= 1; typ. <200)
  '   };\n' +

  'uniform LampT u_LampSet[2];\n' +   // Array of all light sources.
  'uniform MatlT u_MatlSet[1];\n' +   // Array of all materials.

  'uniform vec3 u_eyePosWorld; \n' +  // Camera/eye location in world coords.

  
  //-------------VARYING:Vertex Shader values sent per-pix'''''''''''''''';el to Fragment shader: 
  'varying vec3 v_Normal;\n' +        // Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +      // pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd; \n' +           // Find diffuse reflectance K_d per pix
                            // Ambient? Emissive? Specular? almost
                            // NEVER change per-vertex: I use 'uniform' values

  'void main() {\n' +
  '  vec3 normal = normalize(v_Normal); \n' +

  //  '  vec3 normal = v_Normal; \n' +
      // Find the unit-length light dir vector 'L' (surface pt --> light):
  '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
  '  vec3 lightDirection1 = normalize(u_LampSet[1].pos - v_Position.xyz);\n' +
      // Find the unit-length eye-direction vector 'V' (surface pt --> camera)
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
  '  vec3 eyeDirection1 = normalize(u_eyePosWorld-v_Position.xyz); \n' +


  '  float nDotL = max(dot(lightDirection + eyeDirection, normal), 0.0); \n' +
  '  float nDotL1 = max(dot(lightDirection1 + eyeDirection1, normal), 0.0); \n' +

  '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
  '  vec3 H1 = normalize(lightDirection1 + eyeDirection1); \n' +
  '  float nDotH = max(dot(H, normal), 0.0); \n' +
  '  float nDotH1 = max(dot(H1, normal), 0.0); \n' +

  '  float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
  '  float e641 = pow(nDotH1, float(u_MatlSet[0].shiny));\n' +


    'vec3 lightreflectionDirection = reflect(-lightDirection, normal); \n' +
  //'float phongSpecular = max(dot(lightreflectionDirection, eyeDirection), 0.0);' +
  'float phongSpecular = max(dot(lightreflectionDirection, eyeDirection), 0.0);' +

   'vec3 lightreflectionDirection1 = reflect(-lightDirection1, normal); \n' +
  'float phongSpecular1 = max(dot(lightreflectionDirection1, eyeDirection1), 0.0);' +


  '   vec3 emissive =                    u_MatlSet[0].emit;' +
  '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
  //'  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
  '  vec3 diffuse = u_LampSet[0].diff * u_MatlSet[0].diff * nDotL;\n' +
  //'  vec3 diffuse = u_LampSet[0].diff * v_Kd;\n' +
  //'  vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +


  '  vec3 emissive1 =                    u_MatlSet[0].emit;' +
  '  vec3 ambient1 = u_LampSet[1].ambi * u_MatlSet[0].ambi;\n' +
  '  vec3 diffuse1 = u_LampSet[1].diff * v_Kd * nDotL1;\n' +
  //'  vec3 speculr1 = u_LampSet[1].spec * u_MatlSet[0].spec * e641;\n' +

  ' vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * pow(phongSpecular, 6.0);\n' +
  //' vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec;\n' +
  ' vec3 speculr1 = u_LampSet[1].spec * u_MatlSet[0].spec * pow(phongSpecular1, 6.0);\n' +
  ' gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0) + vec4(emissive1 + ambient1 + diffuse1 + speculr1 , 1.0);\n' +
  

  //'  gl_FragColor = vec4(v_Colr1, 1.0);\n' +
  '}\n';


  //vertexShader = loadShader(gl, this.VERT_SRC, this.VERT_SRC);
  //fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE);

  makeGroundGrid();
  makeSphere();
  //this.vboContents = gndVerts;

  this.vboCube = //--------------------- 
  new Float32Array ([           // Array of vertex attribute values we will
                                // transfer to GPU's vertex buffer object (VBO);
    // Quad vertex coordinates(x,y in CVV); texture coordinates tx,ty
    1,  1, -1, 1,   0.8,0.5,0.5,  0,0,1,0,     // upper left corner (with a small border)
    1, 1, 1, 1,    0.8,0.5,0.5,  0,0,1,0,     // lower left corner,
    1, -1, -1, 1,    0.8,0.5,0.5,  0,0,1,0,     // lower left corner.
    1,  -1, 1, 1,     0.8,0.5,0.5, 0,0,1,0,      // upper right corner,
    -1, -1, -1, 1,    0.8,0.5,0.5,0,0,1,0,
    -1, -1, 1, 1,    0.8,0.5,0.5,0,0,1,0,
    
    -1, 1, -1, 1,    0.8,0.5,0.5,0,0,1,0,
    -1, 1, 1, 1,     0.8,0.5,0.5,0,0,1,0,
    
    1,  1, -1, 1,    0.8,0.5,0.5,     0,0,1,0,  // upper left corner (with a small border)
    1, 1, 1, 1,    0.8,0.5,0.5,  0,0,1,0,   // lower left corner,
    ]);
  this.vboCubeTop = //--------------------- 
  new Float32Array ([           // Array of vertex attribute values we will
                                // transfer to GPU's vertex buffer object (VBO);
    // Quad vertex coordinates(x,y in CVV); texture coordinates tx,ty
    1, 1, 1, 1,    0.8,0.5,0.5,  0,0,1,0,   
    1,  -1, 1, 1,     0.8,0.5,0.5, 0,0,1,0,
    -1, 1, 1, 1,     0.8,0.5,0.5,0,0,1,0,
    -1, -1, 1, 1,    0.8,0.5,0.5,0,0,1,0,


    ]);
  this.vboCubeBot = //--------------------- 
  new Float32Array ([           // Array of vertex attribute values we will
                                // transfer to GPU's vertex buffer object (VBO);
    // Quad vertex coordinates(x,y in CVV); texture coordinates tx,ty
    1, 1, -1, 1,    0.8,0.5,0.5,  0,0,1,0,   
    1,  -1, -1, 1,     0.8,0.5,0.5, 0,0,1,0,
    -1, 1, -1, 1,     0.8,0.5,0.5,0,0,1,0,
    -1, -1, -1, 1,    0.8,0.5,0.5,0,0,1,0,
    ]);

  this.vboVerts = gndVerts.length + this.vboCube.length + this.vboCubeTop.length + this.vboCubeBot.length + sphVerts.length;            // # of vertices held in 'vboContents' array;
  this.vboContents = new Float32Array(this.vboVerts);

  this.gndStart = 0;           // next we'll store the ground-plane;
  for(i=0, j=0; j< gndVerts.length; i++, j++) {
    this.vboContents[i] = gndVerts[j];
    }
  this.vboSphStart = i;           // next, we'll store the sphere;
  for(j=0; j< sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
    this.vboContents[i] = sphVerts[j];
  }
  this.vboCubeStart = i;           // next, we'll store the sphere;
  for(j=0; j< this.vboCube.length; i++, j++) {// don't initialize i -- reuse it!
    this.vboContents[i] = this.vboCube[j];
    }
  this.vboCubeTopStart = i;           // next, we'll store the sphere;
  for(j=0; j< this.vboCubeTop.length; i++, j++) {// don't initialize i -- reuse it!
    this.vboContents[i] = this.vboCubeTop[j];
  }
  this.vboCubeBotStart = i;           // next, we'll store the sphere;
  for(j=0; j< this.vboCubeBot.length; i++, j++) {// don't initialize i -- reuse it!
    this.vboContents[i] = this.vboCubeBot[j];
  }
  


  this.vboLoc;                    // Vertex Buffer Object location# on the GPU
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd for 1 array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls) 
  this.shaderLoc;                 // Shader-program location # on the GPU, made 
                                  // by compile/link of VERT_SRC and FRAG_SRC.
                //-------------------- Attribute locations in our shaders
  this.a_PosLoc;                  // GPU location for 'a_Pos1' attribute
  this.a_ColrLoc;                 // GPU location for 'a_Colr1' attribute
  this.a_Normal;

                //-------------------- Uniform locations &values in our shaders
  //this.ModelMat = new Matrix4();    // Transforms CVV axes to model axes.
  //this.u_ModelMatLoc;               // GPU location for u_ModelMat uniform

  this.viewMatrix = new Matrix4();
  this.projMatrix = new Matrix4();
  this.modelMatrix = new Matrix4();
  this.normalMatrix = new Matrix4();
    this.u_ViewMatrix;
    this.u_ProjMatrix;
    this.uLoc_ModelMatrix;
    this.u_NormalMatrix;

  this.eyePosWorld = new Float32Array(3);  // x,y,z in world coords

}

VBObox1.prototype.init = function(myGL) {
//=============================================================================
// Create, compile, link this VBObox object's shaders to an executable 'program'
// ready for use in the GPU.  Create and fill a Float32Array that holds all VBO 
// vertices' values; create a new VBO on the GPU and fill it with those values. 
// Find the GPU location of all our shaders' attribute- and uniform-variables; 
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
  myGL.program = this.shaderLoc;    // (to match cuon-utils.js -- initShaders())
// Create VBO on GPU, fill it--------------------------------------------------
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
                        
 // Transfer data from JavaScript Float32Array object to the just-bound VBO. 
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
                  this.vboContents,     // JavaScript Float32Array
                  gl.STATIC_DRAW);      // Usage hint.
                 
// Find & Set All Attributes:------------------------------
  // a) Get the GPU location for each attribute var used in our shaders:
  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
                '.init() Failed to get GPU location of attribute a_Pos1');
    return -1;  // error exit.
  }
  this.a_ColrLoc = myGL.getAttribLocation(this.shaderLoc, 'a_Colr1');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
                '.init() failed to get the GPU location of attribute a_Colr1');
    return -1;  // error exit.
  }

  this.a_Normal = myGL.getAttribLocation(this.shaderLoc, 'a_Normal');
  if(this.a_Normal < 0) {
    console.log(this.constructor.name + 
                '.init() failed to get the GPU location of attribute a_Normal');
    return -1;  // error exit.
  }

  // NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
	// unless the new Z value is closer to the eye than the old one..
	//	gl.depthFunc(gl.LESS);			 // WebGL default setting:
	gl.enable(gl.DEPTH_TEST); 
  // b) Next, set up GPU to fill these attribute vars in our shader with 
  // values pulled from the currently-bound VBO (see 'gl.bindBuffer()).
  //  Here's how to use the almost-identical OpenGL version of this function:
  //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  myGL.vertexAttribPointer(
    this.a_PosLoc,//index == ID# for the attribute var in your GLSL shaders;
    4,            // size == how many dimensions for this attribute: 1,2,3 or 4?
    gl.FLOAT,     // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  normalize before use? true or false
    floatsPerVertex*this.FSIZE, // Stride == #bytes we must skip in the VBO to move from one 
                  // of our stored attributes to the next.  This is usually the 
                  // number of bytes used to store one complete vertex.  If set 
                  // to zero, the GPU gets attribute values sequentially from 
                  // VBO, starting at 'Offset'. 
                  // (Our vertex size in bytes: 4 floats for pos + 3 for color)
    0);           // Offset == how many bytes from START of buffer to the first
                  // value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, 3, gl.FLOAT, false, 
                floatsPerVertex*this.FSIZE, 4*this.FSIZE);


  gl.vertexAttribPointer(
    this.a_Normal,         // choose Vertex Shader attribute to fill with data
    4,              // how many values? 1,2,3 or 4. (we're using x,y,z)
    gl.FLOAT,       // data type for each value: usually gl.FLOAT
    false,          // did we supply fixed-point data AND it needs normalizing?
    this.FSIZE * floatsPerVertex,     // Stride -- how many bytes used to store each vertex?
                    // (x,y,z, r,g,b, nx,ny,nz) * bytes/value
    this.FSIZE * 7);     // Offset -- how many bytes from START of buffer to the
                    // value we will actually use?  Need to skip over x,y,z,w,r,g,b

  // c) Enable this assignment of the attribute to its' VBO source:
  myGL.enableVertexAttribArray(this.a_PosLoc);
  myGL.enableVertexAttribArray(this.a_ColrLoc);
  myGL.enableVertexAttribArray(this.a_Normal);
// Find All Uniforms:--------------------------------
//Get GPU storage location for each uniform var used in our shader programs: 
/*  this.u_ModelMatLoc = myGL.getUniformLocation(this.shaderLoc, 'u_ModelMat1');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
                '.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }
*/
  this.u_ViewMatrix = myGL.getUniformLocation(this.shaderLoc, 'u_ViewMatrix1');
  this.u_ProjMatrix = myGL.getUniformLocation(this.shaderLoc, 'u_ProjMatrix1');
  this.uLoc_eyePosWorld  = myGL.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
  this.uLoc_ModelMatrix  = myGL.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
  this.u_NormalMatrix = myGL.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
  if (!this.u_ViewMatrix || !this.u_ProjMatrix || !this.uLoc_eyePosWorld || !this.uLoc_ModelMatrix) { 
    console.log(this.constructor.name + 
                '.init() failed to get GPU location for u_ViewMatrix1 and u_ProjMatrix1 uniform');
    return;
  }

  

  //  ... for Phong light source:
  // NEW!  Note we're getting the location of a GLSL struct array member:

  lamp0.u_pos  = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos'); 
  lamp0.u_ambi = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[0].ambi');
  lamp0.u_diff = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[0].diff');
  lamp0.u_spec = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[0].spec');
  if( !lamp0.u_pos || !lamp0.u_ambi || !lamp0.u_diff || !lamp0.u_spec ) {
    console.log('Failed to get GPUs Lamp0 storage locations');
    return;
  }

  lamp1.u_pos  = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[1].pos'); 
  lamp1.u_ambi = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[1].ambi');
  lamp1.u_diff = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[1].diff');
  lamp1.u_spec = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[1].spec');
  if( !lamp1.u_pos || !lamp1.u_ambi || !lamp1.u_diff || !lamp1.u_spec ) {
    console.log('Failed to get GPUs Lamp0 storage locations');
    return;
  }

  this.uLoc_Ke = myGL.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
  this.uLoc_Ka = myGL.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
  this.uLoc_Kd = myGL.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
  this.uLoc_Ks = myGL.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
  this.uLoc_Kshiny = myGL.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
  
  if(!this.uLoc_Ke || !this.uLoc_Ka || !this.uLoc_Kd // || !uLoc_Kd2
              || !this.uLoc_Ks || !this.uLoc_Kshiny
     ) {
    console.log('Failed to get GPUs Reflectance storage locations');
    return;
  }

  // Position the camera in world coordinates:
  this.eyePosWorld.set([g_EyeX, g_EyeY, g_EyeZ]);
  //gl.uniform3fv(this.uLoc_eyePosWorld, this.eyePosWorld);// use it to set our uniform

  // Init World-coord. position & colors of first light source in global vars;
  //lamp0.I_pos.elements.set( [g_EyeX, g_EyeY, g_EyeZ]);
  lamp0.I_pos.elements.set( [0.8, 0.5, 5]);
  //lamp0.I_pos.elements.set( [g_EyeX, g_EyeY, g_EyeZ]);

  lamp0.I_ambi.elements.set([0.4, 0.4, 0.4]);
  lamp0.I_diff.elements.set([1.0, 1.0, 1.0]);
  lamp0.I_spec.elements.set([1.0, 1.0, 1.0]);

  //lamp0.I_ambi.elements.set([1, 1, 1]);
  //lamp0.I_diff.elements.set([0, 0, 0]);
  //lamp0.I_spec.elements.set([0, 0, 0]);
  //TEST: console.log('lamp0.I_pos.elements: ', lamp0.I_pos.elements, '\n');

  // ( MOVED:  set the GPU's uniforms for lights and materials in draw()
  //          function, not main(), so they ALWAYS get updated before each
  //          on-screen re-drawing)

  //myGL.uniform1i(this.phongLighting, true);
  lamp1.I_pos.elements.set( [g_EyeX, g_EyeY, g_EyeZ]);
  //lamp1.I_pos.elements.set( [0, 0, 0]);
  //lamp1.I_pos.elements.set( [lamp0.I_pos.elements[0], lamp0.I_pos.elements[1], lamp0.I_pos.elements[2]]);

  lamp1.I_ambi.elements.set([0.4, 0.4, 0.4]);
  lamp1.I_diff.elements.set([1.0, 1.0, 1.0]);
  lamp1.I_spec.elements.set([1.0, 1.0, 1.0]);

}

VBObox1.prototype.adjust = function(myGL) {

//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  myGL.useProgram(this.shaderLoc);  // In the GPU, SELECT our already-compiled
                                    // -and-linked executable shader program.
  	lamp1.I_pos.elements.set( [g_EyeX, g_EyeY, g_EyeZ]);
  	//lamp1.I_pos.elements.set( [0.0, 1.0, 0.0]);



    // Position the camera in world coordinates:
  	this.eyePosWorld.set([g_EyeX, g_EyeY, g_EyeZ]);
  	gl.uniform3fv(this.uLoc_eyePosWorld, this.eyePosWorld);// use it to set our uniform
  // Adjust values for our uniforms,
  //this.ModelMat.setRotate(g_currentAngle, 0, 0, 1); // rotate drawing axes,
  //this.ModelMat.translate(0.35, 0, 0);              // then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  //myGL.uniformMatrix4fv(this.u_ModelMatLoc, // GPU location of the uniform
  //                    false,        // use matrix transpose instead?
  //                    this.ModelMat.elements);  // send data from Javascript.
  //myGL.viewport(0, 0, myGL.drawingBufferWidth, myGL.drawingBufferHeight);

  myGL.uniform3fv(lamp1.u_pos,  lamp1.I_pos.elements.slice(0,3));
  //     ('slice(0,3) member func returns elements 0,1,2 (x,y,z) ) 
  myGL.uniform3fv(lamp1.u_ambi, lamp1.I_ambi.elements);   // ambient
  myGL.uniform3fv(lamp1.u_diff, lamp1.I_diff.elements);   // diffuse
  myGL.uniform3fv(lamp1.u_spec, lamp1.I_spec.elements);   // Specular
//  console.log('lamp0.u_pos',lamp0.u_pos,'\n' );
//  console.log('lamp0.I_diff.elements', lamp0.I_diff.elements, '\n');



myGL.uniform3fv(lamp0.u_pos,  lamp0.I_pos.elements.slice(0,3));
  //     ('slice(0,3) member func returns elements 0,1,2 (x,y,z) ) 
  myGL.uniform3fv(lamp0.u_ambi, lamp0.I_ambi.elements);   // ambient
  myGL.uniform3fv(lamp0.u_diff, lamp0.I_diff.elements);   // diffuse
  myGL.uniform3fv(lamp0.u_spec, lamp0.I_spec.elements);   // Specular

  // Set the matrix to be used for to set the camera view
  this.viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,  // eye position
                        g_AtX, g_AtY, g_AtZ,                // look-at point (origin)
                        0, 0, 1);               // up vector (+y)  


  this.canvas_width = g_canvasID.width;
  this.canvas_height = g_canvasID.height;
  //this.projMatrix.setPerspective(30, 0.5*this.canvas_width/this.canvas_height, 1, 100);
  //this.projMatrix.setFrustum(-1,1,-1,1,1,100000000);
  this.projMatrix.setFrustum(Math.tan(15),-Math.tan(15),-1,1,1,100000000);
  //this.projMatrix.setPerspective(30, 400/400, 1, 100);

  this.normalMatrix.setInverseOf(this.viewMatrix);
  this.normalMatrix.transpose();

  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
     

}

VBObox1.prototype.draw = function(myGL) {
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
  // b) Re-connect data paths from VBO to each shader attribute:
  myGL.vertexAttribPointer(this.a_PosLoc, 4, myGL.FLOAT, false, 
                            floatsPerVertex*this.FSIZE, 0);   // stride, offset
  myGL.vertexAttribPointer(this.a_ColrLoc, 3, myGL.FLOAT, false, 
                            floatsPerVertex*this.FSIZE, 4*this.FSIZE); // stride, offset
  myGL.vertexAttribPointer(
    this.a_Normal,         // choose Vertex Shader attribute to fill with data
    4,              // how many values? 1,2,3 or 4. (we're using x,y,z)
    myGL.FLOAT,       // data type for each value: usually gl.FLOAT
    false,          // did we supply fixed-point data AND it needs normalizing?
    this.FSIZE * floatsPerVertex,     // Stride -- how many bytes used to store each vertex?
                    // (x,y,z, r,g,b, nx,ny,nz) * bytes/value
    this.FSIZE * 7);     // Offset -- how many bytes from START of buffer to the
                    // value we will actually use?  Need to skip over x,y,z,w,r,g,b

  // c) enable the newly-re-assigned attributes:
  myGL.enableVertexAttribArray(this.a_PosLoc);
  myGL.enableVertexAttribArray(this.a_ColrLoc);
  myGL.enableVertexAttribArray(this.a_Normal);



  matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl0 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl0.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl0.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl0.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl0.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny 



  this.modelMatrix.translate(0.0, 0.0, -5);
  this.modelMatrix.scale(0.5, 0.5,0.5);

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices
  myGL.disable(myGL.BLEND);
  // ----------------------------Draw the contents of the currently-bound VBO:
  myGL.drawArrays(myGL.LINES,   // select the drawing primitive to draw,
                  0,                // location of 1st vertex to draw;
                  gndVerts.length/floatsPerVertex);   // number of vertices to draw on-screen.

  this.modelMatrix.scale(1/0.5, 1/0.5,1/0.5); 
  this.modelMatrix.translate(0.0, 0.0, 5);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices
  // --------------draw spheres start-------------------
  this.modelMatrix.translate(-2.5, 0.0, -3);
  //this.modelMatrix.scale(0.5, 0.5, 0.5); 

  matlSel = (1)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl0 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl0.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl0.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl0.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl0.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboSphStart/floatsPerVertex,                // location of 1st vertex to draw;
                  sphVerts.length/floatsPerVertex);   // number of vertices to draw on-screen.

  //this.modelMatrix.scale(1/0.5, 1/0.5,1/0.5); 
  this.modelMatrix.translate(2.5, 0.0, 3);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

//--------------second sphere-----------------
  this.modelMatrix.translate(-0.5,-1,-1);
  this.modelMatrix.scale(1.5,0.1,0.5);

  matlSel = (6)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl0 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl0.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl0.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl0.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl0.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboSphStart/floatsPerVertex,                // location of 1st vertex to draw;
                  sphVerts.length/floatsPerVertex);   // number of vertices to draw on-screen.

  this.modelMatrix.scale(1/1.5,1/0.1,1/0.5);
  this.modelMatrix.translate(0.5,1,1);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //--------------third sphere-----------------
  this.modelMatrix.translate(2,0,-2);
  this.modelMatrix.rotate(-15,0,1,0);
  this.modelMatrix.scale(1, 1, 2);
 // this.modelMatrix.rotate(10, 1,0,0);

  matlSel = (19)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl0 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl0.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl0.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl0.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl0.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboSphStart/floatsPerVertex,                // location of 1st vertex to draw;
                  sphVerts.length/floatsPerVertex);   // number of vertices to draw on-screen.

 // this.modelMatrix.rotate(-10, 1,0,0);
  this.modelMatrix.scale(1/1, 1/1, 1/2);
  this.modelMatrix.rotate(15,0,1,0);
  this.modelMatrix.translate(-2,0,2);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //--------------forth sphere-----------------
  this.modelMatrix.translate(0, 0.0, -3);
  //this.modelMatrix.rotate(-35, 0,1,0);
  //this.modelMatrix.scale(1.3, 1.3, 1.3);
 // this.modelMatrix.rotate(10, 1,0,0);

  matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl0 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl0.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl0.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl0.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl0.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboSphStart/floatsPerVertex,                // location of 1st vertex to draw;
                  sphVerts.length/floatsPerVertex);   // number of vertices to draw on-screen.

 // this.modelMatrix.rotate(-10, 1,0,0);
  //this.modelMatrix.scale(1/1.3, 1/1.3, 1/1.3);
  //this.modelMatrix.rotate(35, 0,1,0);
  this.modelMatrix.translate(0, 0, 3);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices


  // --------------draw spheres end-------------------
  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  // --------------draw first cube start-------------------

  this.modelMatrix.translate(-2,3,-3);
  //this.modelMatrix.rotate(-35, 0,1,0);
  this.modelMatrix.scale(0.5,0.5,0.5);
 // this.modelMatrix.rotate(10, 1,0,0);

  matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl0 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl0.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl0.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl0.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl0.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCube.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeTopStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeTop.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeBotStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeBot.length/floatsPerVertex);   // number of vertices to draw on-screen.

 // this.modelMatrix.rotate(-10, 1,0,0);
  this.modelMatrix.scale(1/0.5,1/0.5,1/0.5);
  //this.modelMatrix.rotate(35, 0,1,0);
  this.modelMatrix.translate(2,-3,3);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  // --------------draw second cube start-------------------

  this.modelMatrix.translate(4,0,-3);
  //this.modelMatrix.rotate(-35, 0,1,0);
  this.modelMatrix.scale(0.1,0.2,4);
 // this.modelMatrix.rotate(10, 1,0,0);

  matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl0 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl0.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl0.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl0.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl0.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCube.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeTopStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeTop.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeBotStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeBot.length/floatsPerVertex);   // number of vertices to draw on-screen.

 // this.modelMatrix.rotate(-10, 1,0,0);
  this.modelMatrix.scale(1/0.1,1/0.2,1/4);
  //this.modelMatrix.rotate(35, 0,1,0);
  this.modelMatrix.translate(-4,0,3);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);

  // --------------draw third cube start-------------------

  this.modelMatrix.translate(1,2,-4);
  this.modelMatrix.rotate(-15, 0,1,0);
  //this.modelMatrix.rotate(-35, 0,1,0);
  this.modelMatrix.scale(0.7,0.5,0.2);
  this.modelMatrix.rotate(45, 1,1,0);

  matlSel = (15)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl0 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl0.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl0.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl0.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl0.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCube.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeTopStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeTop.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeBotStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeBot.length/floatsPerVertex);   // number of vertices to draw on-screen.

 // this.modelMatrix.rotate(-10, 1,0,0);
  this.modelMatrix.rotate(-45, 1,1,0);
  this.modelMatrix.scale(1/0.7,1/0.5,1/0.2);
  this.modelMatrix.rotate(15, 0,1,0);
  this.modelMatrix.translate(-1,-2,4);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);

  // --------------draw forth cube start-------------------

  this.modelMatrix.translate(-5,0,-3);
  //this.modelMatrix.rotate(-35, 0,1,0);
  this.modelMatrix.scale(0.1,2,1);
 // this.modelMatrix.rotate(10, 1,0,0);

  matlSel = (10)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl0 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl0.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl0.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl0.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl0.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl0.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCube.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeTopStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeTop.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeBotStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeBot.length/floatsPerVertex);   // number of vertices to draw on-screen.

 // this.modelMatrix.rotate(-10, 1,0,0);
  this.modelMatrix.scale(1/0.1,1/2,1/1);
  //this.modelMatrix.rotate(35, 0,1,0);
  this.modelMatrix.translate(5,0,3);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);




  // --------------draw cube end-------------------
  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  // ----------------------------Draw the contents of the currently-bound VBO:
  /*
  this.viewMatrix.scale(1/0.5, 1/0.5,1/0.5); 
  this.viewMatrix.translate(0.0, 0.0, 5);
  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCube.length/floatsPerVertex);   // number of vertices to draw on-screen.

  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
*/

}

/*
/
VBObox1.prototype.reload = function(myGL) {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use 
// myGL.bufferSubData() call to re-transfer some or all of our Float32Array 
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
function VBObox2() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox2' object  that holds all data and 
// fcns needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate set of shaders.
  
  this.VERT_SRC = //--------------------- VERTEX SHADER source code 
  'attribute vec4 a_Position;\n' +  
  'attribute vec2 a_TexCoord;\n' +
  'varying vec2 v_TexCoord;\n' +
  //
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +              // set default precision
  //
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  //
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n';

  this.vboContents = //--------------------- 
  new Float32Array ([           // Array of vertex attribute values we will
                                // transfer to GPU's vertex buffer object (VBO);
    // Quad vertex coordinates(x,y in CVV); texture coordinates tx,ty
    -1,  1,     0.0, 1.0,       // upper left corner (with a small border)
    -1, -1,     0.0, 0.0,       // lower left corner,
     1,  1,     1.0, 1.0,       // upper right corner,
     1, -1,     1.0, 0.0,       // lower left corner.
     ]);
  this.vboVerts = 4;            // # of vertices held in 'vboContents' array;
  this.vboLoc;                    // Vertex Buffer Object location# on the GPU
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd for 1 array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls) 
  this.shaderLoc;                 // Shader-program location # on the GPU, made 
                                  // by compile/link of VERT_SRC and FRAG_SRC.
                //-------------------- Attribute locations in our shaders
  this.a_PositionLoc;             // GPU location for 'a_Position' attribute
  this.a_TexCoordLoc;             // GPU location for 'a_TexCoord' attribute

                //-------------------- Uniform locations &values in our shaders
//  this.ModelMat = new Matrix4();  // Transforms CVV axes to model axes.
//  this.u_ModelMatLoc;             // GPU location for u_ModelMat uniform var.
  
                //-------------------- Texture-maps & samplers in our shaders
  this.u_TextureLoc;              // GPU location for our texture-map image;
  this.u_SamplerLoc;              // GPU location for our texture-sampler var
}

VBObox2.prototype.init = function(myGL) {
//=============================================================================
// Create, compile, link this VBObox object's shaders to an executable 'program'
// ready for use in the GPU.  Create and fill a Float32Array that holds all VBO 
// vertices' values; create a new VBO on the GPU and fill it with those values. 
// Find the GPU location of all our shaders' attribute- and uniform-variables; 
// assign the correct portions of VBO contents as the data source for each 
// attribute, and transfer current values to the GPU for each uniform variable.
// (usually called only once, within main()) 
//C_ImgBuf = new CImgBuf(256,256);
// Compile,link,upload shaders-------------------------------------------------
  this.shaderLoc = createProgram(myGL, this.VERT_SRC, this.FRAG_SRC);
  if (!this.shaderLoc) {
    console.log(this.constructor.name + 
                '.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
  myGL.program = this.shaderLoc;    // (to match cuon-utils.js -- initShaders())
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

// Create VBO on GPU, fill it--------------------------------------------------
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
                        
 // Transfer data from JavaScript Float32Array object to the just-bound VBO. 
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

  myGL.bufferData(myGL.ARRAY_BUFFER,    // GLenum target(same as 'bindBuffer()')
                  this.vboContents,     // JavaScript Float32Array
                  myGL.STATIC_DRAW);    // Usage hint.

// Make/Load Texture Maps & Samplers:------------------------------------------
  this.u_TextureLoc = myGL.createTexture();   // Create a texture object 
  if (!this.u_TextureLoc) {
    console.log(this.constructor.name + 
                '.init() Failed to create the texture object on the GPU');
    return -1;  // error exit.
  }
  // Get the storage location of texture sampler held in u_Sampler
  var u_SamplerLoc = myGL.getUniformLocation(this.shaderLoc, 'u_Sampler');
  if (!u_SamplerLoc) {
    console.log(this.constructor.name + 
                '.init() Failed to find GPU location for texture u_Sampler');
    return -1;  // error exit.
  }
  // -------------------------Make a 2D colorful L-shaped test image:
  //   8-bit unsigned integers in a 256*256*3 array
  // to store r,g,b,r,g,b integers (8-bit)
  // WebGL texture map sizes MUST be a power-of-two (2,4,8,16,32,64,...4096)
  // with origin at lower-left corner
  var imgXmax = 256;
  var imgYmax = 256;
  this.myImg = new Uint8Array(imgXmax*imgYmax*3); // r,g,b; r,g,b; r,g,b pixels
  /*for(var j=0; j< imgYmax; j++) {         // for the j-th row of pixels
    for(var i=0; i< imgXmax; i++) {       // and the i-th pixel on that row,
      var idx = (j*imgXmax + i)*3;          // pixel (i,j) array index (red)
      if(i<imgXmax/4 || j<imgYmax/4) {
        this.myImg[idx   ] = i;               // 0 <= red <= 255
        this.myImg[idx +1] = j;               // 0 <= grn <= 255
      }
      this.myImg[idx +2] = 255 -i -j;               // 0 <= blu <= 255
    }
  } //-----------------------(end test-image making)*/
  //console.log("myImg: " + this.myImg );
  
  //C_ImgBuf.setTestPattern(0);
  //C_ImgBuf.makeRayTracedImage();

  // Enable texture unit0 for our use
  myGL.activeTexture(myGL.TEXTURE0);
  // Bind the texture object we made in initTextures() to the target
  myGL.bindTexture(myGL.TEXTURE_2D, this.u_TextureLoc);
  // allocate memory and load the texture image into the GPU
  myGL.texImage2D(myGL.TEXTURE_2D, //  'target'--the use of this texture
              0,                  //  MIP-map level (default: 0)
              myGL.RGB,           // GPU's data format (RGB? RGBA? etc)
              imgXmax,            // image width in pixels,
              imgYmax,            // image height in pixels,
              0,                  // byte offset to start of data
              myGL.RGB,           // source/input data format (RGB? RGBA?)
              myGL.UNSIGNED_BYTE, // data type for each color channel       
              C_ImgBuf.iBuf);       // data source.
  // Set the WebGL texture-filtering parameters
  myGL.texParameteri(myGL.TEXTURE_2D,   // texture-sampling params: 
              myGL.TEXTURE_MIN_FILTER, 
              myGL.LINEAR);
  // Set the texture unit 0 to be driven by our texture sampler:
  myGL.uniform1i(this.u_SamplerLoc, 0);
  
// Find & Set All Attributes:--------------------------------------------------
  // a) Get the GPU location for each attribute var used in our shaders:
  this.a_PositionLoc = myGL.getAttribLocation(this.shaderLoc, 'a_Position');
  if(this.a_PositionLoc < 0) {
    console.log(this.constructor.name + 
                '.init() Failed to get GPU location of attribute a_Position');
    return -1;  // error exit.
  }
  this.a_TexCoordLoc = myGL.getAttribLocation(this.shaderLoc, 'a_TexCoord');
  if(this.a_TexCoordLoc < 0) {
    console.log(this.constructor.name + 
                '.init() failed to get GPU location of attribute a_TexCoord');
    return -1;  // error exit.
  }
  // b) Next, set up GPU to fill these attribute vars in our shader with 
  // values pulled from the currently-bound VBO (see 'gl.bindBuffer()).
  //  Here's how to use the almost-identical OpenGL version of this function:
  //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  myGL.vertexAttribPointer(
    this.a_PositionLoc,//index == ID# for attribute var in your GLSL shaders;
    2,            // size == how many dimensions for this attribute: 1,2,3 or 4?
    myGL.FLOAT,   // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  normalize before use? true or false
    4*this.FSIZE, // Stride == #bytes we must skip in the VBO to move from one 
                  // of our stored attributes to the next.  This is usually the 
                  // number of bytes used to store one complete vertex.  If set 
                  // to zero, the GPU gets attribute values sequentially from 
                  // VBO, starting at 'Offset'. 
                  // (Our vertex size in bytes: 4 floats for pos + 3 for color)
    0);           // Offset == how many bytes from START of buffer to the first
                  // value we will actually use?  (We start with position).
  myGL.vertexAttribPointer(this.a_TexCoordLoc, 2, myGL.FLOAT, false, 
                4*this.FSIZE, 2*this.FSIZE);
  // c) Enable this assignment of the attribute to its' VBO source:
  myGL.enableVertexAttribArray(this.a_PositionLoc);
  myGL.enableVertexAttribArray(this.a_TexCoordLoc);

// Find All Uniforms:----------------------------------------------------------
//Get GPU storage location for each uniform var used in our shader programs: 
/*  this.u_ModelMatLoc = myGL.getUniformLocation(this.shaderLoc, 'u_ModelMat');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
                '.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }
*/

}
/*
VBObox2.prototype.adjust = function(myGL) {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  myGL.useProgram(this.shaderLoc);  // In the GPU, SELECT our already-compiled
                                    // -and-linked executable shader program.
  // Adjust values for our uniforms,
  this.ModelMat.setRotate(g_currentAngle, 0, 0, 1); // rotate drawing axes,
  this.ModelMat.translate(0.35, 0, 0);              // then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  myGL.uniformMatrix4fv(this.u_ModelMatLoc, // GPU location of the uniform
                      false,                // use matrix transpose instead?
                      this.ModelMat.elements);  // send data from Javascript.
}
*/
VBObox2.prototype.draw = function(myGL) {
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

  myGL.vertexAttribPointer( this.a_PositionLoc, 2, myGL.FLOAT, false,
                          4*this.FSIZE, 0);           // Stride, Offset
  myGL.vertexAttribPointer(this.a_TexCoordLoc, 2, myGL.FLOAT, false, 
                          4*this.FSIZE, 2*this.FSIZE);
  // c) Re-Enable use of the data path for each attribute:
  myGL.enableVertexAttribArray(this.a_PositionLoc);
  myGL.enableVertexAttribArray(this.a_TexCoordLoc);
  
  myGL.drawArrays(myGL.TRIANGLE_STRIP, 0, this.vboVerts); 
                                              // Draw the textured rectangle
}

/*

VBObox2.prototype.reload = function(myGL) {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use 
// myGL.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.
//
//
//    ********   YOU WRITE THIS! ********
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
//    ********   YOU WRITE THIS! ********
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
//    ********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
//=============================================================================

var lamp2 = new LightsT();
var lamp3 = new LightsT();

var matlSel= MATL_RED_PLASTIC;        // see keypress(): 'm' key changes matlSel
var matl1 = new Material(matlSel);  

function VBObox3() {
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox1' object  that holds all data and 
// fcns needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate set of shaders.
  
  this.VERT_SRC = //--------------------- VERTEX SHADER source code 
  //
  //'uniform   int u_runMode; \n' +         // particle system state: 
                                          // 0=reset; 1= pause; 2=step; 3=run
  //'uniform   bool moving; \n' +
  //'uniform   vec4 u_ballShift; \n' +      // single bouncy-ball's movement
  'attribute vec4 a_Pos1;\n' +
  'attribute vec3 a_Colr1;\n' +
  'uniform mat4 u_ViewMatrix1;\n' +
  'uniform mat4 u_ProjMatrix1;\n' +
  'uniform mat4 u_ModelMatrix; \n' +    // Model matrix
  'varying   vec3 v_Colr1; \n' +

  'struct MatlT {\n' +    // Describes one Phong material by its reflectances:
  '   vec3 emit;\n' +     // Ke: emissive -- surface 'glow' amount (r,g,b);
  '   vec3 ambi;\n' +     // Ka: ambient reflectance (r,g,b)
  '   vec3 diff;\n' +     // Kd: diffuse reflectance (r,g,b)
  '   vec3 spec;\n' +     // Ks: specular reflectance (r,g,b)
  '   int shiny;\n' +     // Kshiny: specular exponent (integer >= 1; typ. <200)
  '   };\n' +



  'struct LampT {\n' +    // Describes one point-like Phong light source
  '   vec3 pos;\n' +      // (x,y,z,w); w==1.0 for local light at x,y,z position
                          //       w==0.0 for distant light from x,y,z direction 
  '   vec3 ambi;\n' +     // Ia ==  ambient light source strength (r,g,b)
  '   vec3 diff;\n' +     // Id ==  diffuse light source strength (r,g,b)
  '   vec3 spec;\n' +     // Is == specular light source strength (r,g,b)
  '}; \n' +

    'uniform LampT u_LampSet[2];\n' +   // Array of all light sources.
  //'uniform MatlT u_MatlSet[1];\n' +   // Array of all materials.
'attribute vec4 a_Normal;\n' +
'uniform vec3 u_eyePosWorld; \n' +  // Camera/eye location in world coords.

'uniform MatlT u_MatlSet[1];\n' +   // Array of all materials.
'uniform mat4 u_NormalMatrix;\n' +

 'varying vec3 v_Kd; \n' +             // Phong Lighting: diffuse reflectance
                                        // (I didn't make per-pixel Ke,Ka,Ks;
                                        // we use 'uniform' values instead)
  'varying vec4 v_Position; \n' +       
  'varying vec3 v_Normal; \n' +         // Why Vec3? its not a point, hence w==0



  'void main() {\n' +
  '  gl_Position = u_ProjMatrix1 * u_ViewMatrix1 * u_ModelMatrix * a_Pos1; \n' +  
   //'  v_Position = u_ModelMatrix * a_Pos1; \n' +
   '  v_Position =  u_ModelMatrix * a_Pos1; \n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Kd = u_MatlSet[0].diff; \n' +    // find per-pixel diffuse reflectance from per-vertex
                          // (no per-pixel Ke,Ka, or Ks, but you can do it...)
  '  v_Colr1 = a_Colr1;\n' +
  '} \n';

  this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 

  'precision highp float;\n' +
  'precision highp int;\n' +

  'varying vec3 v_Colr1; \n' +
  'uniform bool moving; \n' +

  //'varying vec4 v_Color;\n' +
  //
  //--------------- GLSL Struct Definitions:
  'struct LampT {\n' +    // Describes one point-like Phong light source
  '   vec3 pos;\n' +      // (x,y,z,w); w==1.0 for local light at x,y,z position
                          //       w==0.0 for distant light from x,y,z direction 
  '   vec3 ambi;\n' +     // Ia ==  ambient light source strength (r,g,b)
  '   vec3 diff;\n' +     // Id ==  diffuse light source strength (r,g,b)
  '   vec3 spec;\n' +     // Is == specular light source strength (r,g,b)
  '}; \n' +
  //
  'struct MatlT {\n' +    // Describes one Phong material by its reflectances:
  '   vec3 emit;\n' +     // Ke: emissive -- surface 'glow' amount (r,g,b);
  '   vec3 ambi;\n' +     // Ka: ambient reflectance (r,g,b)
  '   vec3 diff;\n' +     // Kd: diffuse reflectance (r,g,b)
  '   vec3 spec;\n' +     // Ks: specular reflectance (r,g,b)
  '   int shiny;\n' +     // Kshiny: specular exponent (integer >= 1; typ. <200)
  '   };\n' +

  'uniform LampT u_LampSet[2];\n' +   // Array of all light sources.
  'uniform MatlT u_MatlSet[1];\n' +   // Array of all materials.

  'uniform vec3 u_eyePosWorld; \n' +  // Camera/eye location in world coords.

  
  //-------------VARYING:Vertex Shader values sent per-pix'''''''''''''''';el to Fragment shader: 
  'varying vec3 v_Normal;\n' +        // Find 3D surface normal at each pix
  'varying vec4 v_Position;\n' +      // pixel's 3D pos too -- in 'world' coords
  'varying vec3 v_Kd; \n' +           // Find diffuse reflectance K_d per pix
                            // Ambient? Emissive? Specular? almost
                            // NEVER change per-vertex: I use 'uniform' values

  'void main() {\n' +
  '  vec3 normal = normalize(v_Normal); \n' +

  //  '  vec3 normal = v_Normal; \n' +
      // Find the unit-length light dir vector 'L' (surface pt --> light):
  '  vec3 lightDirection = normalize(u_LampSet[0].pos - v_Position.xyz);\n' +
  '  vec3 lightDirection1 = normalize(u_LampSet[1].pos - v_Position.xyz);\n' +
      // Find the unit-length eye-direction vector 'V' (surface pt --> camera)
  '  vec3 eyeDirection = normalize(u_eyePosWorld - v_Position.xyz); \n' +
  '  vec3 eyeDirection1 = normalize(u_eyePosWorld-v_Position.xyz); \n' +


  '  float nDotL = max(dot(lightDirection + eyeDirection, normal), 0.0); \n' +
  '  float nDotL1 = max(dot(lightDirection1 + eyeDirection1, normal), 0.0); \n' +

  '  vec3 H = normalize(lightDirection + eyeDirection); \n' +
  '  vec3 H1 = normalize(lightDirection1 + eyeDirection1); \n' +
  '  float nDotH = max(dot(H, normal), 0.0); \n' +
  '  float nDotH1 = max(dot(H1, normal), 0.0); \n' +

  '  float e64 = pow(nDotH, float(u_MatlSet[0].shiny));\n' +
  '  float e641 = pow(nDotH1, float(u_MatlSet[0].shiny));\n' +


    'vec3 lightreflectionDirection = reflect(-lightDirection, normal); \n' +
  //'float phongSpecular = max(dot(lightreflectionDirection, eyeDirection), 0.0);' +
  'float phongSpecular = max(dot(lightreflectionDirection, eyeDirection), 0.0);' +

   'vec3 lightreflectionDirection1 = reflect(-lightDirection1, normal); \n' +
  'float phongSpecular1 = max(dot(lightreflectionDirection1, eyeDirection1), 0.0);' +


  '   vec3 emissive =                    u_MatlSet[0].emit;' +
  '  vec3 ambient = u_LampSet[0].ambi * u_MatlSet[0].ambi;\n' +
  //'  vec3 diffuse = u_LampSet[0].diff * v_Kd * nDotL;\n' +
  '  vec3 diffuse = u_LampSet[0].diff * u_MatlSet[0].diff * nDotL;\n' +
  //'  vec3 diffuse = u_LampSet[0].diff * v_Kd;\n' +
  //'  vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * e64;\n' +


  '  vec3 emissive1 =                    u_MatlSet[0].emit;' +
  '  vec3 ambient1 = u_LampSet[1].ambi * u_MatlSet[0].ambi;\n' +
  '  vec3 diffuse1 = u_LampSet[1].diff * v_Kd * nDotL1;\n' +
  //'  vec3 speculr1 = u_LampSet[1].spec * u_MatlSet[0].spec * e641;\n' +

  ' vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec * pow(phongSpecular, 6.0);\n' +
  //' vec3 speculr = u_LampSet[0].spec * u_MatlSet[0].spec;\n' +
  ' vec3 speculr1 = u_LampSet[1].spec * u_MatlSet[0].spec * pow(phongSpecular1, 6.0);\n' +
  ' gl_FragColor = vec4(emissive + ambient + diffuse + speculr , 1.0) + vec4(emissive1 + ambient1 + diffuse1 + speculr1 , 1.0);\n' +
  

  //'  gl_FragColor = vec4(v_Colr1, 1.0);\n' +
  '}\n';


  //vertexShader = loadShader(gl, this.VERT_SRC, this.VERT_SRC);
  //fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, FSHADER_SOURCE);

  makeGroundGrid();
  makeSphere();
  //this.vboContents = gndVerts;

  this.vboCube = //--------------------- 
  new Float32Array ([           // Array of vertex attribute values we will
                                // transfer to GPU's vertex buffer object (VBO);
    // Quad vertex coordinates(x,y in CVV); texture coordinates tx,ty
    1,  1, -1, 1,   0.8,0.5,0.5,  0,0,1,0,     // upper left corner (with a small border)
    1, 1, 1, 1,    0.8,0.5,0.5,  0,0,1,0,     // lower left corner,
    1, -1, -1, 1,    0.8,0.5,0.5,  0,0,1,0,     // lower left corner.
    1,  -1, 1, 1,     0.8,0.5,0.5, 0,0,1,0,      // upper right corner,
    -1, -1, -1, 1,    0.8,0.5,0.5,0,0,1,0,
    -1, -1, 1, 1,    0.8,0.5,0.5,0,0,1,0,
    
    -1, 1, -1, 1,    0.8,0.5,0.5,0,0,1,0,
    -1, 1, 1, 1,     0.8,0.5,0.5,0,0,1,0,
    
    1,  1, -1, 1,    0.8,0.5,0.5,     0,0,1,0,  // upper left corner (with a small border)
    1, 1, 1, 1,    0.8,0.5,0.5,  0,0,1,0,   // lower left corner,
    ]);
  this.vboCubeTop = //--------------------- 
  new Float32Array ([           // Array of vertex attribute values we will
                                // transfer to GPU's vertex buffer object (VBO);
    // Quad vertex coordinates(x,y in CVV); texture coordinates tx,ty
    1, 1, 1, 1,    0.8,0.5,0.5,  0,0,1,0,   
    1,  -1, 1, 1,     0.8,0.5,0.5, 0,0,1,0,
    -1, 1, 1, 1,     0.8,0.5,0.5,0,0,1,0,
    -1, -1, 1, 1,    0.8,0.5,0.5,0,0,1,0,


    ]);
  this.vboCubeBot = //--------------------- 
  new Float32Array ([           // Array of vertex attribute values we will
                                // transfer to GPU's vertex buffer object (VBO);
    // Quad vertex coordinates(x,y in CVV); texture coordinates tx,ty
    1, 1, -1, 1,    0.8,0.5,0.5,  0,0,1,0,   
    1,  -1, -1, 1,     0.8,0.5,0.5, 0,0,1,0,
    -1, 1, -1, 1,     0.8,0.5,0.5,0,0,1,0,
    -1, -1, -1, 1,    0.8,0.5,0.5,0,0,1,0,
    ]);

  this.vboVerts = gndVerts.length + this.vboCube.length + this.vboCubeTop.length + this.vboCubeBot.length + sphVerts.length;            // # of vertices held in 'vboContents' array;
  this.vboContents = new Float32Array(this.vboVerts);

  this.gndStart = 0;           // next we'll store the ground-plane;
  for(i=0, j=0; j< gndVerts.length; i++, j++) {
    this.vboContents[i] = gndVerts[j];
    }
  this.vboSphStart = i;           // next, we'll store the sphere;
  for(j=0; j< sphVerts.length; i++, j++) {// don't initialize i -- reuse it!
    this.vboContents[i] = sphVerts[j];
  }
  this.vboCubeStart = i;           // next, we'll store the sphere;
  for(j=0; j< this.vboCube.length; i++, j++) {// don't initialize i -- reuse it!
    this.vboContents[i] = this.vboCube[j];
    }
  this.vboCubeTopStart = i;           // next, we'll store the sphere;
  for(j=0; j< this.vboCubeTop.length; i++, j++) {// don't initialize i -- reuse it!
    this.vboContents[i] = this.vboCubeTop[j];
  }
  this.vboCubeBotStart = i;           // next, we'll store the sphere;
  for(j=0; j< this.vboCubeBot.length; i++, j++) {// don't initialize i -- reuse it!
    this.vboContents[i] = this.vboCubeBot[j];
  }
  


  this.vboLoc;                    // Vertex Buffer Object location# on the GPU
  this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
                                  // bytes req'd for 1 array element;
                                  // (why? used to compute stride and offset 
                                  // in bytes for vertexAttribPointer() calls) 
  this.shaderLoc;                 // Shader-program location # on the GPU, made 
                                  // by compile/link of VERT_SRC and FRAG_SRC.
                //-------------------- Attribute locations in our shaders
  this.a_PosLoc;                  // GPU location for 'a_Pos1' attribute
  this.a_ColrLoc;                 // GPU location for 'a_Colr1' attribute
  this.a_Normal;

                //-------------------- Uniform locations &values in our shaders
  //this.ModelMat = new Matrix4();    // Transforms CVV axes to model axes.
  //this.u_ModelMatLoc;               // GPU location for u_ModelMat uniform

  this.viewMatrix = new Matrix4();
  this.projMatrix = new Matrix4();
  this.modelMatrix = new Matrix4();
  this.normalMatrix = new Matrix4();
    this.u_ViewMatrix;
    this.u_ProjMatrix;
    this.uLoc_ModelMatrix;
    this.u_NormalMatrix;

  this.eyePosWorld = new Float32Array(3);  // x,y,z in world coords

}

VBObox3.prototype.init = function(myGL) {
//=============================================================================
// Create, compile, link this VBObox object's shaders to an executable 'program'
// ready for use in the GPU.  Create and fill a Float32Array that holds all VBO 
// vertices' values; create a new VBO on the GPU and fill it with those values. 
// Find the GPU location of all our shaders' attribute- and uniform-variables; 
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
  myGL.program = this.shaderLoc;    // (to match cuon-utils.js -- initShaders())
// Create VBO on GPU, fill it--------------------------------------------------
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
                        
 // Transfer data from JavaScript Float32Array object to the just-bound VBO. 
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
                  this.vboContents,     // JavaScript Float32Array
                  gl.STATIC_DRAW);      // Usage hint.
                 
// Find & Set All Attributes:------------------------------
  // a) Get the GPU location for each attribute var used in our shaders:
  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
                '.init() Failed to get GPU location of attribute a_Pos1');
    return -1;  // error exit.
  }
  this.a_ColrLoc = myGL.getAttribLocation(this.shaderLoc, 'a_Colr1');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
                '.init() failed to get the GPU location of attribute a_Colr1');
    return -1;  // error exit.
  }

  this.a_Normal = myGL.getAttribLocation(this.shaderLoc, 'a_Normal');
  if(this.a_Normal < 0) {
    console.log(this.constructor.name + 
                '.init() failed to get the GPU location of attribute a_Normal');
    return -1;  // error exit.
  }

  // NEW!! Enable 3D depth-test when drawing: don't over-draw at any pixel 
  // unless the new Z value is closer to the eye than the old one..
  //  gl.depthFunc(gl.LESS);       // WebGL default setting:
  gl.enable(gl.DEPTH_TEST); 
  // b) Next, set up GPU to fill these attribute vars in our shader with 
  // values pulled from the currently-bound VBO (see 'gl.bindBuffer()).
  //  Here's how to use the almost-identical OpenGL version of this function:
  //    http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  myGL.vertexAttribPointer(
    this.a_PosLoc,//index == ID# for the attribute var in your GLSL shaders;
    4,            // size == how many dimensions for this attribute: 1,2,3 or 4?
    gl.FLOAT,     // type == what data type did we use for those numbers?
    false,        // isNormalized == are these fixed-point values that we need
                  //                  normalize before use? true or false
    floatsPerVertex*this.FSIZE, // Stride == #bytes we must skip in the VBO to move from one 
                  // of our stored attributes to the next.  This is usually the 
                  // number of bytes used to store one complete vertex.  If set 
                  // to zero, the GPU gets attribute values sequentially from 
                  // VBO, starting at 'Offset'. 
                  // (Our vertex size in bytes: 4 floats for pos + 3 for color)
    0);           // Offset == how many bytes from START of buffer to the first
                  // value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, 3, gl.FLOAT, false, 
                floatsPerVertex*this.FSIZE, 4*this.FSIZE);


  gl.vertexAttribPointer(
    this.a_Normal,         // choose Vertex Shader attribute to fill with data
    4,              // how many values? 1,2,3 or 4. (we're using x,y,z)
    gl.FLOAT,       // data type for each value: usually gl.FLOAT
    false,          // did we supply fixed-point data AND it needs normalizing?
    this.FSIZE * floatsPerVertex,     // Stride -- how many bytes used to store each vertex?
                    // (x,y,z, r,g,b, nx,ny,nz) * bytes/value
    this.FSIZE * 7);     // Offset -- how many bytes from START of buffer to the
                    // value we will actually use?  Need to skip over x,y,z,w,r,g,b

  // c) Enable this assignment of the attribute to its' VBO source:
  myGL.enableVertexAttribArray(this.a_PosLoc);
  myGL.enableVertexAttribArray(this.a_ColrLoc);
  myGL.enableVertexAttribArray(this.a_Normal);
// Find All Uniforms:--------------------------------
//Get GPU storage location for each uniform var used in our shader programs: 
/*  this.u_ModelMatLoc = myGL.getUniformLocation(this.shaderLoc, 'u_ModelMat1');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
                '.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }
*/
  this.u_ViewMatrix = myGL.getUniformLocation(this.shaderLoc, 'u_ViewMatrix1');
  this.u_ProjMatrix = myGL.getUniformLocation(this.shaderLoc, 'u_ProjMatrix1');
  this.uLoc_eyePosWorld  = myGL.getUniformLocation(this.shaderLoc, 'u_eyePosWorld');
  this.uLoc_ModelMatrix  = myGL.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
  this.u_NormalMatrix = myGL.getUniformLocation(this.shaderLoc, 'u_NormalMatrix');
  if (!this.u_ViewMatrix || !this.u_ProjMatrix || !this.uLoc_eyePosWorld || !this.uLoc_ModelMatrix) { 
    console.log(this.constructor.name + 
                '.init() failed to get GPU location for u_ViewMatrix1 and u_ProjMatrix1 uniform');
    return;
  }

  

  //  ... for Phong light source:
  // NEW!  Note we're getting the location of a GLSL struct array member:

  lamp2.u_pos  = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[0].pos'); 
  lamp2.u_ambi = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[0].ambi');
  lamp2.u_diff = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[0].diff');
  lamp2.u_spec = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[0].spec');
  if( !lamp2.u_pos || !lamp2.u_ambi || !lamp2.u_diff || !lamp2.u_spec ) {
    console.log('Failed to get GPUs Lamp0 storage locations');
    return;
  }

  lamp3.u_pos  = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[1].pos'); 
  lamp3.u_ambi = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[1].ambi');
  lamp3.u_diff = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[1].diff');
  lamp3.u_spec = myGL.getUniformLocation(this.shaderLoc, 'u_LampSet[1].spec');
  if( !lamp3.u_pos || !lamp3.u_ambi || !lamp3.u_diff || !lamp3.u_spec ) {
    console.log('Failed to get GPUs Lamp0 storage locations');
    return;
  }

  this.uLoc_Ke = myGL.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].emit');
  this.uLoc_Ka = myGL.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].ambi');
  this.uLoc_Kd = myGL.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].diff');
  this.uLoc_Ks = myGL.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].spec');
  this.uLoc_Kshiny = myGL.getUniformLocation(this.shaderLoc, 'u_MatlSet[0].shiny');
  
  if(!this.uLoc_Ke || !this.uLoc_Ka || !this.uLoc_Kd // || !uLoc_Kd2
              || !this.uLoc_Ks || !this.uLoc_Kshiny
     ) {
    console.log('Failed to get GPUs Reflectance storage locations');
    return;
  }

  // Position the camera in world coordinates:
  this.eyePosWorld.set([g_EyeX, g_EyeY, g_EyeZ]);
  gl.uniform3fv(this.uLoc_eyePosWorld, this.eyePosWorld);// use it to set our uniform

  // Init World-coord. position & colors of first light source in global vars;
  //lamp0.I_pos.elements.set( [g_EyeX, g_EyeY, g_EyeZ]);
  lamp2.I_pos.elements.set( [0.8, 0.5, 6]);
  //lamp0.I_pos.elements.set( [g_EyeX, g_EyeY, g_EyeZ]);

  lamp2.I_ambi.elements.set([0.4, 0.4, 0.4]);
  lamp2.I_diff.elements.set([1.0, 1.0, 1.0]);
  lamp2.I_spec.elements.set([1.0, 1.0, 1.0]);

  //lamp0.I_ambi.elements.set([1, 1, 1]);
  //lamp0.I_diff.elements.set([0, 0, 0]);
  //lamp0.I_spec.elements.set([0, 0, 0]);
  //TEST: console.log('lamp0.I_pos.elements: ', lamp0.I_pos.elements, '\n');

  // ( MOVED:  set the GPU's uniforms for lights and materials in draw()
  //          function, not main(), so they ALWAYS get updated before each
  //          on-screen re-drawing)

  //myGL.uniform1i(this.phongLighting, true);
  lamp3.I_pos.elements.set( [g_EyeX, g_EyeY, g_EyeZ]);
  //lamp1.I_pos.elements.set( [0, 0, 0]);
  //lamp1.I_pos.elements.set( [lamp0.I_pos.elements[0], lamp0.I_pos.elements[1], lamp0.I_pos.elements[2]]);

  lamp3.I_ambi.elements.set([0.4, 0.4, 0.4]);
  lamp3.I_diff.elements.set([1.0, 1.0, 1.0]);
  lamp3.I_spec.elements.set([1.0, 1.0, 1.0]);

}

VBObox3.prototype.adjust = function(myGL) {

//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  myGL.useProgram(this.shaderLoc);  // In the GPU, SELECT our already-compiled
                                    // -and-linked executable shader program.
    lamp3.I_pos.elements.set( [g_EyeX, g_EyeY, g_EyeZ]);
    //lamp1.I_pos.elements.set( [0.0, 1.0, 0.0]);



    // Position the camera in world coordinates:
    this.eyePosWorld.set([g_EyeX, g_EyeY, g_EyeZ]);
    gl.uniform3fv(this.uLoc_eyePosWorld, this.eyePosWorld);// use it to set our uniform
  // Adjust values for our uniforms,
  //this.ModelMat.setRotate(g_currentAngle, 0, 0, 1); // rotate drawing axes,
  //this.ModelMat.translate(0.35, 0, 0);              // then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  //myGL.uniformMatrix4fv(this.u_ModelMatLoc, // GPU location of the uniform
  //                    false,        // use matrix transpose instead?
  //                    this.ModelMat.elements);  // send data from Javascript.
  //myGL.viewport(0, 0, myGL.drawingBufferWidth, myGL.drawingBufferHeight);

  myGL.uniform3fv(lamp3.u_pos,  lamp3.I_pos.elements.slice(0,3));
  //     ('slice(0,3) member func returns elements 0,1,2 (x,y,z) ) 
  myGL.uniform3fv(lamp3.u_ambi, lamp3.I_ambi.elements);   // ambient
  myGL.uniform3fv(lamp3.u_diff, lamp3.I_diff.elements);   // diffuse
  myGL.uniform3fv(lamp3.u_spec, lamp3.I_spec.elements);   // Specular
//  console.log('lamp0.u_pos',lamp0.u_pos,'\n' );
//  console.log('lamp0.I_diff.elements', lamp0.I_diff.elements, '\n');



myGL.uniform3fv(lamp2.u_pos,  lamp2.I_pos.elements.slice(0,3));
  //     ('slice(0,3) member func returns elements 0,1,2 (x,y,z) ) 
  myGL.uniform3fv(lamp2.u_ambi, lamp2.I_ambi.elements);   // ambient
  myGL.uniform3fv(lamp2.u_diff, lamp2.I_diff.elements);   // diffuse
  myGL.uniform3fv(lamp2.u_spec, lamp2.I_spec.elements);   // Specular

  // Set the matrix to be used for to set the camera view
  this.viewMatrix.setLookAt(g_EyeX, g_EyeY, g_EyeZ,  // eye position
                        g_AtX, g_AtY, g_AtZ,                // look-at point (origin)
                        0, 0, 1);               // up vector (+y)  


  this.canvas_width = g_canvasID.width;
  this.canvas_height = g_canvasID.height;
  //this.projMatrix.setPerspective(30, 0.5*this.canvas_width/this.canvas_height, 1, 100);
  //this.projMatrix.setFrustum(-1, 1, -1, 1, 1, 100000000);
  this.projMatrix.setFrustum(Math.tan(15),-Math.tan(15),-1,1,1,100000000);
  //this.projMatrix.setPerspective(30, 400/400, 1, 100);

  this.normalMatrix.setInverseOf(this.viewMatrix);
  this.normalMatrix.transpose();

  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
     

}

VBObox3.prototype.draw = function(myGL) {
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
  // b) Re-connect data paths from VBO to each shader attribute:
  myGL.vertexAttribPointer(this.a_PosLoc, 4, myGL.FLOAT, false, 
                            floatsPerVertex*this.FSIZE, 0);   // stride, offset
  myGL.vertexAttribPointer(this.a_ColrLoc, 3, myGL.FLOAT, false, 
                            floatsPerVertex*this.FSIZE, 4*this.FSIZE); // stride, offset
  myGL.vertexAttribPointer(
    this.a_Normal,         // choose Vertex Shader attribute to fill with data
    4,              // how many values? 1,2,3 or 4. (we're using x,y,z)
    myGL.FLOAT,       // data type for each value: usually gl.FLOAT
    false,          // did we supply fixed-point data AND it needs normalizing?
    this.FSIZE * floatsPerVertex,     // Stride -- how many bytes used to store each vertex?
                    // (x,y,z, r,g,b, nx,ny,nz) * bytes/value
    this.FSIZE * 7);     // Offset -- how many bytes from START of buffer to the
                    // value we will actually use?  Need to skip over x,y,z,w,r,g,b

  // c) enable the newly-re-assigned attributes:
  myGL.enableVertexAttribArray(this.a_PosLoc);
  myGL.enableVertexAttribArray(this.a_ColrLoc);
  myGL.enableVertexAttribArray(this.a_Normal);



  matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl1 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl1.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl1.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl1.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl1.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl1.K_shiny, 10));     // Kshiny 



  this.modelMatrix.translate(0.0, 0.0, -6);
  this.modelMatrix.scale(0.5, 0.5,0.5);
  this.modelMatrix.rotate(30, 0,0,1);


  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices
  myGL.disable(myGL.BLEND);
  // ----------------------------Draw the contents of the currently-bound VBO:
  myGL.drawArrays(myGL.LINES,   // select the drawing primitive to draw,
                  0,                // location of 1st vertex to draw;
                  gndVerts.length/floatsPerVertex);   // number of vertices to draw on-screen.

  this.modelMatrix.rotate(-30, 0,0,1);
  this.modelMatrix.scale(1/0.5, 1/0.5,1/0.5); 
  this.modelMatrix.translate(0.0, 0.0, 6);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices
  // --------------draw spheres start-------------------
  this.modelMatrix.translate(0,3,-4);
  this.modelMatrix.scale(0.5, 0.5, 0.5); 

  matlSel = (1)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl1 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl1.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl1.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl1.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl1.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl1.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboSphStart/floatsPerVertex,                // location of 1st vertex to draw;
                  sphVerts.length/floatsPerVertex);   // number of vertices to draw on-screen.

  this.modelMatrix.scale(1/0.5, 1/0.5,1/0.5); 
  this.modelMatrix.translate(0,-3,4);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

//--------------second sphere-----------------
  this.modelMatrix.translate(-0.5,-1,-1);
  this.modelMatrix.scale(1.5,0.1,0.5);

  matlSel = (6)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl1 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl1.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl1.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl1.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl1.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl1.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboSphStart/floatsPerVertex,                // location of 1st vertex to draw;
                  sphVerts.length/floatsPerVertex);   // number of vertices to draw on-screen.

  this.modelMatrix.scale(1/1.5,1/0.1,1/0.5);
  this.modelMatrix.translate(0.5,1,1);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //--------------third sphere-----------------
  this.modelMatrix.translate(3,2,-3.5);
  this.modelMatrix.rotate(-15,0,1,0);
  this.modelMatrix.scale(1.5,1.5,1.5);
 // this.modelMatrix.rotate(10, 1,0,0);

  matlSel = (19)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl1 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl1.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl1.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl1.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl1.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl1.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboSphStart/floatsPerVertex,                // location of 1st vertex to draw;
                  sphVerts.length/floatsPerVertex);   // number of vertices to draw on-screen.

 // this.modelMatrix.rotate(-10, 1,0,0);
  this.modelMatrix.scale(1/1.5, 1/1.5, 1/1.5);
  this.modelMatrix.rotate(15,0,1,0);
  this.modelMatrix.translate(-3,-2,3.5);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //--------------forth sphere-----------------
  this.modelMatrix.translate(-0.5,0,-3.5);
  //this.modelMatrix.rotate(-35, 0,1,0);
  this.modelMatrix.scale(1.5, 1.5, 1.5);
 // this.modelMatrix.rotate(10, 1,0,0);

  matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl1 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl1.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl1.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl1.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl1.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl1.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboSphStart/floatsPerVertex,                // location of 1st vertex to draw;
                  sphVerts.length/floatsPerVertex);   // number of vertices to draw on-screen.

 // this.modelMatrix.rotate(-10, 1,0,0);
  this.modelMatrix.scale(1/1.5, 1/1.5, 1/1.5);
  //this.modelMatrix.rotate(35, 0,1,0);
  this.modelMatrix.translate(0.5,0,3.5);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices


  // --------------draw spheres end-------------------
  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  // --------------draw first cube start-------------------

  this.modelMatrix.translate(-3,3,-4);
  //this.modelMatrix.rotate(-35, 0,1,0);
  this.modelMatrix.scale(0.5,0.5,0.5);
 // this.modelMatrix.rotate(10, 1,0,0);

  matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl1 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl1.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl1.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl1.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl1.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl1.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCube.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeTopStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeTop.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeBotStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeBot.length/floatsPerVertex);   // number of vertices to draw on-screen.

 // this.modelMatrix.rotate(-10, 1,0,0);
  this.modelMatrix.scale(1/0.5,1/0.5,1/0.5);
  //this.modelMatrix.rotate(35, 0,1,0);
  this.modelMatrix.translate(3,-3,4);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  // --------------draw second cube start-------------------

  this.modelMatrix.translate(4,-2,-3);
  //this.modelMatrix.rotate(-35, 0,1,0);
  this.modelMatrix.scale(0.1,0.2,2);
 // this.modelMatrix.rotate(10, 1,0,0);

  matlSel = (3)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl1 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl1.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl1.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl1.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl1.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl1.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCube.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeTopStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeTop.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeBotStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeBot.length/floatsPerVertex);   // number of vertices to draw on-screen.

 // this.modelMatrix.rotate(-10, 1,0,0);
  this.modelMatrix.scale(1/0.1,1/0.2,1/2);
  //this.modelMatrix.rotate(35, 0,1,0);
  this.modelMatrix.translate(-4,2,3);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);

  // --------------draw third cube start-------------------

  this.modelMatrix.translate(1,-2,0);
  //this.modelMatrix.rotate(-35, 0,1,0);
  this.modelMatrix.scale(0.4,0.4,0.1);
 // this.modelMatrix.rotate(10, 1,0,0);

  matlSel = (15)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl1 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl1.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl1.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl1.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl1.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl1.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCube.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeTopStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeTop.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeBotStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeBot.length/floatsPerVertex);   // number of vertices to draw on-screen.

 // this.modelMatrix.rotate(-10, 1,0,0);
  this.modelMatrix.scale(1/0.4,1/0.4,1/0.1);
  //this.modelMatrix.rotate(35, 0,1,0);
  this.modelMatrix.translate(-1,2,0);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);

  // --------------draw forth cube start-------------------

  this.modelMatrix.translate(-3,-5,-2);
  this.modelMatrix.rotate(70, 0,0,1);
  this.modelMatrix.scale(0.1,6,5);
 // this.modelMatrix.rotate(10, 1,0,0);

  matlSel = (10)%MATL_DEFAULT;    // see materials_Ayerdi.js for list
  matl1 = new Material(matlSel);          // REPLACE our current material, &
      

  myGL.uniform3fv(this.uLoc_Ke, matl1.K_emit.slice(0,3));        // Ke emissive
  myGL.uniform3fv(this.uLoc_Ka, matl1.K_ambi.slice(0,3));        // Ka ambient
  myGL.uniform3fv(this.uLoc_Kd, matl1.K_diff.slice(0,3));        // Kd diffuse
  myGL.uniform3fv(this.uLoc_Ks, matl1.K_spec.slice(0,3));        // Ks specular
  myGL.uniform1i(this.uLoc_Kshiny, parseInt(matl1.K_shiny, 10));     // Kshiny 

  this.normalMatrix.setInverseOf(this.modelMatrix);
  this.normalMatrix.transpose();
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);
      // Draw just the sphere's vertices

  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  //console.log("draw sphere here")
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCube.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeTopStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeTop.length/floatsPerVertex);   // number of vertices to draw on-screen.
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeBotStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCubeBot.length/floatsPerVertex);   // number of vertices to draw on-screen.

 // this.modelMatrix.rotate(-10, 1,0,0);
  this.modelMatrix.scale(1/0.1,1/6,1/5);
  this.modelMatrix.rotate(-70, 0,0,1);
  this.modelMatrix.translate(3,5,2);
  //myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.uniformMatrix4fv(this.uLoc_ModelMatrix, false, this.modelMatrix.elements);
  myGL.uniformMatrix4fv(this.u_NormalMatrix, false, this.normalMatrix.elements);




  // --------------draw cube end-------------------
  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////
  // ----------------------------Draw the contents of the currently-bound VBO:
  /*
  this.viewMatrix.scale(1/0.5, 1/0.5,1/0.5); 
  this.viewMatrix.translate(0.0, 0.0, 5);
  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
  myGL.drawArrays(myGL.TRIANGLE_STRIP,   // select the drawing primitive to draw,
                  this.vboCubeStart/floatsPerVertex,                // location of 1st vertex to draw;
                  this.vboCube.length/floatsPerVertex);   // number of vertices to draw on-screen.

  myGL.uniformMatrix4fv(this.u_ViewMatrix, false, this.viewMatrix.elements);
  myGL.uniformMatrix4fv(this.u_ProjMatrix, false, this.projMatrix.elements);
*/

}

/*
/
VBObox1.prototype.reload = function(myGL) {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use 
// myGL.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.
//
//
//    ********   YOU WRITE THIS! ********
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
//    ********   YOU WRITE THIS! ********
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
//    ********   YOU WRITE THIS! ********
//
//
//
}
*/

//==============================================================================
//==============================================================================
//==============================================================================
//==============================================================================
//==============================================================================
//==============================================================================
//==============================================================================
//==============================================================================
//==============================================================================
//==============================================================================
//==============================================================================


var gridXGap;
var gridYGap;

function makeGroundGrid() {
//==============================================================================
// Create a list of vertices that create a large grid of lines in the x,y plane
// centered at x=y=z=0.  Draw this shape using the GL_LINES primitive.

	var xcount = 501;			// # of lines to draw in x,y to make the grid.
	var ycount = 501;		
	var xymax	= 500.0;			// grid size; extends to cover +/-xymax in x and y.
 	var xColr = new Float32Array([1.0, 1.0, 1]);	// bright yellow
 	var yColr = new Float32Array([1, 1.0, 1.5]);	// bright green.
 	
	// Create an (global) array to hold this ground-plane's vertices:
	gndVerts = new Float32Array(floatsPerVertex*2*(xcount+ycount));
						// draw a grid made of xcount+ycount lines; 2 vertices per line.
						
	var xgap = xymax/(xcount-1);		// HALF-spacing between lines in x,y;
	var ygap = xymax/(ycount-1);		// (why half? because v==(0line number/2))
	
	// First, step thru x values as we make vertical lines of constant-x:
	for(v=0, j=0; v<2*xcount; v++, j+= floatsPerVertex) {
		if(v%2==0) {	// put even-numbered vertices at (xnow, -xymax, 0)
			gndVerts[j  ] = -xymax + (v  )*xgap;	// x
			gndVerts[j+1] = -xymax;								// y
			gndVerts[j+2] = 0.0;									// z
      gndVerts[j+3] = 1.0;                  // w
		}
		else {				// put odd-numbered vertices at (xnow, +xymax, 0).
			gndVerts[j  ] = -xymax + (v-1)*xgap;	// x
			gndVerts[j+1] = xymax;								// y
			gndVerts[j+2] = 0.0;									// z
      gndVerts[j+3] = 1.0;                  // w
		}
		gndVerts[j+4] = xColr[0];			// red
		gndVerts[j+5] = xColr[1];			// grn
		gndVerts[j+6] = xColr[2];			// blu

    gndVerts[j+7] = 0;     // red
    gndVerts[j+8] = 0;     // grn
    gndVerts[j+9] = 1;     // blu
    gndVerts[j+10] = 0;     // blu
	}
	// Second, step thru y values as wqe make horizontal lines of constant-y:
	// (don't re-initialize j--we're adding more vertices to the array)
	for(v=0; v<2*ycount; v++, j+= floatsPerVertex) {
		if(v%2==0) {		// put even-numbered vertices at (-xymax, ynow, 0)
			gndVerts[j  ] = -xymax;								// x
			gndVerts[j+1] = -xymax + (v  )*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
      gndVerts[j+3] = 1.0;                  // w
		}
		else {					// put odd-numbered vertices at (+xymax, ynow, 0).
			gndVerts[j  ] = xymax;								// x
			gndVerts[j+1] = -xymax + (v-1)*ygap;	// y
			gndVerts[j+2] = 0.0;									// z
      gndVerts[j+3] = 1.0;                  // w
		}
		gndVerts[j+4] = yColr[0];			// red
		gndVerts[j+5] = yColr[1];			// grn
		gndVerts[j+6] = yColr[2];			// blu

    gndVerts[j+7] = 0;     // red
    gndVerts[j+8] = 0;     // grn
    gndVerts[j+9] = 1;     // blu
    gndVerts[j+10] = 0;     // blu
	}
}

function makeSphere() {
//==============================================================================
// Make a sphere from one OpenGL TRIANGLE_STRIP primitive.   Make ring-like 
// equal-lattitude 'slices' of the sphere (bounded by planes of constant z), 
// and connect them as a 'stepped spiral' design (see makeCylinder) to build the
// sphere from one triangle strip.
  var slices = 13;    // # of slices of the sphere along the z axis. >=3 req'd
                      // (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts  = 27; // # of vertices around the top edge of the slice
                      // (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([0.7, 0.7, 0.7]);  // North Pole: light gray
  var equColr = new Float32Array([0.3, 0.7, 0.3]);  // Equator:    bright green
  var botColr = new Float32Array([0.9, 0.9, 0.9]);  // South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;  // lattitude angle spanned by one slice.

  // Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
                    // # of vertices * # of elements needed to store them. 
                    // each slice requires 2*sliceVerts vertices except 1st and
                    // last ones, which require only 2*sliceVerts-1.
                    
  // Create dome-shaped top slice of sphere at z=+1
  // s counts slices; v counts vertices; 
  // j counts array elements (vertices * elements per vertex)
  var cos0 = 0.0;         // sines,cosines of slice's top, bottom edge.
  var sin0 = 0.0;
  var cos1 = 0.0;
  var sin1 = 0.0; 
  var j = 0;              // initialize our array index
  var isLast = 0;
  var isFirst = 1;
  for(s=0; s<slices; s++) { // for each slice of the sphere,
    // find sines & cosines for top and bottom of this slice
    if(s==0) {
      isFirst = 1;  // skip 1st vertex of 1st slice.
      cos0 = 1.0;   // initialize: start at north pole.
      sin0 = 0.0;
    }
    else {          // otherwise, new top edge == old bottom edge
      isFirst = 0;  
      cos0 = cos1;
      sin0 = sin1;
    }               // & compute sine,cosine for new bottom edge.
    cos1 = Math.cos((s+1)*sliceAngle);
    sin1 = Math.sin((s+1)*sliceAngle);
    // go around the entire slice, generating TRIANGLE_STRIP verts
    // (Note we don't initialize j; grows with each new attrib,vertex, and slice)
    if(s==slices-1) isLast=1; // skip last vertex of last slice.
    for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) { 
      if(v%2==0)
      {       // put even# vertices at the the slice's top edge
              // (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
              // and thus we can simplify cos(2*PI(v/2*sliceVerts))  
        sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);  
        sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);  
        sphVerts[j+2] = cos0;   
        sphVerts[j+3] = 1.0;      

      }
      else {  // put odd# vertices around the slice's lower edge;
              // x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
              //          theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
        sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);    // x
        sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);    // y
        sphVerts[j+2] = cos1;                                       // z
        sphVerts[j+3] = 1.0;   
                                 // w.   
      }
      if(s==0) {  // finally, set some interesting colors for vertices:
        sphVerts[j+4]=topColr[0]; 
        sphVerts[j+5]=topColr[1]; 
        sphVerts[j+6]=topColr[2]; 
        sphVerts[j+7]=sphVerts[j  ]; 
          sphVerts[j+8]=sphVerts[j+1]; 
          sphVerts[j+9]=sphVerts[j+2];       
          sphVerts[j+10]=0; 
        }
      else if(s==slices-1) {
        sphVerts[j+4]=botColr[0]; 
        sphVerts[j+5]=botColr[1]; 
        sphVerts[j+6]=botColr[2]; 
        sphVerts[j+7]=sphVerts[j  ]; 
          sphVerts[j+8]=sphVerts[j+1]; 
          sphVerts[j+9]=sphVerts[j+2];       
          sphVerts[j+10]=0; 
      }
      else {
          sphVerts[j+4]=Math.random();// equColr[0]; 
          sphVerts[j+5]=Math.random();// equColr[1]; 
          sphVerts[j+6]=Math.random();// equColr[2];  
          sphVerts[j+7]=sphVerts[j  ]; 
          sphVerts[j+8]=sphVerts[j+1]; 
          sphVerts[j+9]=sphVerts[j+2];       
          sphVerts[j+10]=0;         
      }
    }
  }
}

var Light1 = true;
var Light2 = true;

function Light1switch(){
	if(Light1){
    if(g_show1 == 1){
      lamp0.I_ambi.elements.set([0.0, 0.0, 0.0]);
      lamp0.I_diff.elements.set([0.0, 0.0, 0.0]);
      lamp0.I_spec.elements.set([0.0, 0.0, 0.0]);
    }else{
      lamp2.I_ambi.elements.set([0.0, 0.0, 0.0]);
      lamp2.I_diff.elements.set([0.0, 0.0, 0.0]);
      lamp2.I_spec.elements.set([0.0, 0.0, 0.0]);
    }
		  
	}else{
    if(g_show1 == 1){
		  lamp0.I_ambi.elements.set([0.4, 0.4, 0.4]);
  		lamp0.I_diff.elements.set([1.0, 1.0, 1.0]);
  		lamp0.I_spec.elements.set([1.0, 1.0, 1.0]);
    }else{
      lamp2.I_ambi.elements.set([0.4, 0.4, 0.4]);
      lamp2.I_diff.elements.set([1.0, 1.0, 1.0]);
      lamp2.I_spec.elements.set([1.0, 1.0, 1.0]);
    }
	}
	Light1 = !Light1;
}

function Light2switch(){
	if(Light2){
    if(g_show1 == 1){
		  lamp1.I_ambi.elements.set([0.0, 0.0, 0.0]);
    	lamp1.I_diff.elements.set([0.0, 0.0, 0.0]);
    	lamp1.I_spec.elements.set([0.0, 0.0, 0.0]);
    }else{
      lamp3.I_ambi.elements.set([0.0, 0.0, 0.0]);
      lamp3.I_diff.elements.set([0.0, 0.0, 0.0]);
      lamp3.I_spec.elements.set([0.0, 0.0, 0.0]);
    }

	}else{
    if(g_show1 == 1){
		  lamp1.I_ambi.elements.set([0.4, 0.4, 0.4]);
  		lamp1.I_diff.elements.set([1.0, 1.0, 1.0]);
  		lamp1.I_spec.elements.set([1.0, 1.0, 1.0]);
    }else{
      lamp3.I_ambi.elements.set([0.4, 0.4, 0.4]);
      lamp3.I_diff.elements.set([1.0, 1.0, 1.0]);
      lamp3.I_spec.elements.set([1.0, 1.0, 1.0]);
    }
	}
	Light2 = !Light2;
	
}


