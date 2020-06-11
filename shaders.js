var debug_shaders = false

// -------------------------------------------------------------------------------------
// GLSL ES sources for WebGL 1 and 2
//
//  See GLSL ES and corresponding WebGL versions here: 
//  https://en.wikipedia.org/wiki/OpenGL_Shading_Language#Versions)
//
// Modularize this, see 'gman' answer to Fabrice Neyret question:
// https://stackoverflow.com/questions/43666688/is-there-a-way-to-test-the-glsl-es-version-in-the-shader

// -------------------------------------------------------------
// GLSL ES ver 3.0  sources for WebGL version 2:

var wgl2_vertex_source =
    `   #version 300 es 
        uniform  mat4 model_mat ;
        uniform  mat4 view_mat ;
        uniform  mat4 proj_mat ;  

        layout(location = 0) in vec3 in_vertex_pos_mcc ;
        layout(location = 1) in vec3 in_vertex_color ;

        out vec3 vertex_color ;

        void main(  ) 
        {   
            gl_Position  = proj_mat * (view_mat * (model_mat * vec4( in_vertex_pos_mcc, 1) )); 
            vertex_color = in_vertex_color ;
        }
    `

var wgl2_fragment_source =
    `   #version 300 es
        precision highp float;  

        in  vec3 vertex_color ;
        out vec4 frag_color ;

        void main() 
        {
            frag_color = vec4( vertex_color, 1.0 ) ;
        }
    `

// -------------------------------------------------------------------------------------
// GLSL ES ver. 1.0 (OpenGL ES version 2) sources for WebGL version 1


var wgl1_vertex_source =
    `   uniform  mat4 model_mat ;
        uniform  mat4 view_mat ;
        uniform  mat4 proj_mat ;  

        attribute vec3   in_vertex_pos_mcc ; // attribute 0 (positions)
        attribute vec3   in_vertex_color ;   // attribute 1 (colors)
        varying   vec3   vertex_color ;

        void main(  ) 
        {   
            gl_Position  = proj_mat * (view_mat * (model_mat * vec4( in_vertex_pos_mcc, 1) )); 
            vertex_color = in_vertex_color ;
        }
    `

var wgl1_fragment_source =
    `   precision highp float;  

        varying vec3 vertex_color ;
        
        void main() 
        {
            gl_FragColor = vec4( vertex_color, 1.0 ) ;
        }
    `

// -------------------------------------------------------------------------------------------------
/**
 * Creates and compiles a vertex or fragment shader, if there are errors, shows the source and the errors,
 * and raises an exception, if it is correct, returns the shader.
 * 
 * @param   {WebGLContext} gl      -- webgl context
 * @param   {string}       source  -- string with shader source, may contain newlines
 * @param   {GLenum}       type    -- shader type either gl.FRAGMENT_SHADER or gl.VERTEX_SHADER
 * @returns {WebGLShader}          -- compiled shader
 */
function CreateAndCompileShader( gl, source, type )
{
    const fname = 'CreateAndCompileShader()'

    const glclass = gl.constructor.name 
    if ( glclass != 'WebGLRenderingContext' && glclass != 'WebGL2RenderingContext')
        throw "Error: invalid parameter 'gl', it is not a webgl rendering context"

    CheckType( source, 'string' )

    if ( type != gl.VERTEX_SHADER && type != gl.FRAGMENT_SHADER )
        throw new Error('invalid shader type')

    const type_str = ( type === gl.VERTEX_SHADER ) ? "vertex" : "fragment" 

    let shader = gl.createShader( type ); 
    CheckType( shader, 'WebGLShader' )

    gl.shaderSource( shader, source )
    gl.compileShader( shader )
    const msg = gl.getShaderInfoLog( shader )

    if ( ! gl.getShaderParameter( shader, gl.COMPILE_STATUS) ) 
    {
        LogLines(`${type_str} shader:`, source )
        Log(`Compilation of ${type_str} shader was not succesfull:`)
        Log('------------------------------------------------')
        Log(msg)
        Log('------------------------------------------------')
        throw new Error(`Unable to compile the ${type_str} shader, see console`)
    }
    else if ( debug_shaders )
        Log(`${fname} ${type_str} shader compiled ok.`)   

    return shader
}
// -------------------------------------------------------------------------------------------------
/**
 *  Creates and compiles a program, given its two (already compiled) shaders.
 *  If there is any error, it is reported and an exception is thrown, otherwise the program is returned
 * 
 * @param   {WebGL2RenderingContext} gl             -- a rendering context (it can be a 'WebGLRenderingContext' instead)
 * @param   {WebGLShader}           vertex_shader   -- already compiled vertex shader 
 * @param   {WebGLShader}           fragment_shader -- already compiled fragment shader
 * @param   {string}                vertex_source   -- vertex shader source (just used to show it if an error happens)
 * @param   {string}                fragment_source -- fragment shader source (just used to show it if an error happens)
 * @returns {WebGLProgram}                          -- the newly created program
 */

function CreateAndLinkProgram( gl, vertex_shader, vertex_source, fragment_shader,  fragment_source )
{
    const fname = 'CreateAndLinkProgram()'

    const glclass = gl.constructor.name 
    if ( glclass != 'WebGLRenderingContext' && glclass != 'WebGL2RenderingContext')
        throw new Error("Error: invalid parameter 'gl', it is not a webgl rendering context")

    CheckType( vertex_shader,   'WebGLShader' )
    CheckType( vertex_source,   'string' )
    CheckType( fragment_shader, 'WebGLShader' )
    CheckType( fragment_source, 'string' )

    // Create the WebGL GPU program and attach the shaders.... 

    let program  = gl.createProgram(); CheckType( program, 'WebGLProgram' ) 
    gl.attachShader( program, vertex_shader )
    gl.attachShader( program, fragment_shader )

    // Tell to the linker which attributes locations we want for each attributes
    //Log(`${fname} about to bind attrs....`)
    CheckGLError( gl )
    gl.bindAttribLocation( program, 0, "in_vertex_pos_mcc" )
    gl.bindAttribLocation( program, 1, "in_vertex_color"   )
    CheckGLError( gl )
    //Log(`${fname} attrs. binded ...`)
    /// done....

    // link and then (if neccesary) show link errors
    gl.linkProgram( program )
    if ( ! gl.getProgramParameter( program, gl.LINK_STATUS) ) 
    {
        const msg = gl.getProgramInfoLog( program )
        LogLines("Vertex shader source",   vertex_source )
        LogLines("Fragment shader source", fragment_source )
        Log(`Errors from program linking:`)
        Log('------------------------------------------------')
        Log(msg)
        Log('------------------------------------------------')
        throw new Error(`Unable to link program.`)
    }
    else if ( debug_shaders )
        Log(`${fname} program linked ok.`)   


     

    return program
}

// -------------------------------------------------------------------------------------------------
/** 
 * A class for a shader program 
**/

class SimpleGPUProgram
{
    constructor( wgl_ctx )
    {
        const fname = 'SimpleGPUProgam.constructor():'
        const cname = wgl_ctx.constructor.name 

        if ( this.debug_mode )
            Log(`${fname} : begins, webgl context class == '${cname}'`)

        this.debug_mode    = debug_shaders
        this.webgl_version = null 
        
        if ( cname == 'WebGL2RenderingContext' )
            this.webgl_version = 2
        else if ( cname == 'WebGLRenderingContext' )
            this.webgl_version = 1
        else 
        {   
            this.webgl_version = 0 // just in case 'this' object is used after throw ..
            const msg = `${fname} 'wgl_ctx' is not a WebGL rendering context (it is a '${cname}')`
            throw new Error(msg)
        }
         
        if ( this.debug_mode )
            Log(`${fname} : begins, wgl ver = ${this.webgl_version}`)
        
        let gl       = wgl_ctx
        this.context = wgl_ctx
        this.program = null
        
        this.vertex_source = null 
        this.fragment_source = null 

        // register shaders sources
        if ( this.webgl_version == 2 )
        {
            Log(`${fname} using webgl 2 sources`)
            this.vertex_source   = wgl2_vertex_source
            this.fragment_source = wgl2_fragment_source
        }
        else
        {
            Log(`${fname} using webgl 1 sources`)
            this.vertex_source   = wgl1_vertex_source
            this.fragment_source = wgl1_fragment_source
        }

        // compile shaders
        this.vertex_shader   = CreateAndCompileShader( gl, this.vertex_source,   gl.VERTEX_SHADER )
        this.fragment_shader = CreateAndCompileShader( gl, this.fragment_source, gl.FRAGMENT_SHADER )
        
        // link program
        this.program = CreateAndLinkProgram  ( gl, this.vertex_shader,   this.vertex_source, 
                                                   this.fragment_shader, this.fragment_source )

        // save previously used shader program, then activate (use) this program
        let prev_program = gl.getParameter( gl.CURRENT_PROGRAM ) 
        this.use() 
        
        // get all locations for uniform parameters
        this.model_mat_loc = gl.getUniformLocation( this.program, 'model_mat' )
        this.view_mat_loc  = gl.getUniformLocation( this.program, 'view_mat' )
        this.proj_mat_loc  = gl.getUniformLocation( this.program, 'proj_mat' )

        Check( this.model_mat_loc != null, 'unable to get location of model matrix' )
        Check( this.view_mat_loc  != null, 'unable to get location of view matrix' )
        Check( this.proj_mat_loc  != null, 'unable to get location of projection matrix' )

        // initialize model matrix stack (empty)
        this.model_mat_stack = []

        // initialize modelview and projection matrices in the instance and in the shader program (must be in use)
        this.setProjMat( Mat4_Identity() )  // assigns to 'this.proj_mat'
        this.setViewMat( Mat4_Identity() )   // assigns to 'this.view_mat', resets 'this.model_mat' to identity, empties 'this.model_mat_stack'
        
        // restore previously used shader program 
        gl.useProgram( prev_program )            
    }
    // ------------------------------------------------------------------------------------------------

    use()
    {
        if ( this.program == null )
            throw Error("SimpleGPUProgram.use : the program has not been created, unable to use it")

        // use  (note: this.context refers to the same object referred from the canvas' context)
        this.context.useProgram( this.program )
    }
    
    // ------------------------------------------------------------------------------------------------
    // sets the current view matrix, resets the model matrix stack and the current model matrix
    setViewMat( new_view_mat )
    {
        this.view_mat        = new Mat4( new_view_mat )
        this.model_mat_stack = []
        this.setMM( Mat4_Identity() )
        this.context.uniformMatrix4fv( this.view_mat_loc, false, this.view_mat )        
    }
     // ------------------------------------------------------------------------------------------------
    // set projection matrix
    setProjMat( new_proj_mat  )
    {
        CheckType( new_proj_mat, 'Mat4' )
        this.proj_mat = new Mat4( new_proj_mat )
        this.context.uniformMatrix4fv( this.proj_mat_loc, false, this.proj_mat )        
    }
    // -----------------------------------------------------------------------------------------------
    // sets the current modeling matrix 
    setMM( new_model_mat )
    {
        CheckType( new_model_mat, 'Mat4' )
        this.model_mat = new Mat4( new_model_mat )
        this.context.uniformMatrix4fv( this.model_mat_loc, false, this.model_mat )
    }
    // ------------------------------------------------------------------------------------------------
    // composes the current model matrix with the matrix given as parameter
    compMM( comp_model_mat  )
    {
        CheckType( comp_model_mat, 'Mat4' )
        this.setMM( (this.model_mat).compose( comp_model_mat ) )   
    }
   
    // ------------------------------------------------------------------------------------------------
    // saves (in the model matrix stack) a copy of the current model matrix
    pushMM()
    {
        this.model_mat_stack.push( new Mat4( this.model_mat ) )
    }
    // ------------------------------------------------------------------------------------------------
    // pop model matrix
    popMM()
    {
        const l = this.model_mat_stack.length 
        Check( l > 0 , `SimpleGPUProgram.popMM(): modelview stack is empty`)
        this.setMM( new Mat4( this.model_mat_stack[l-1] ))
        this.model_mat_stack.pop()

    }
    logMM( msg )
    {
        Log( msg+' :' )
        Log(`  shader current model matrix == ${this.model_mat}\n\n`)
    }
}


