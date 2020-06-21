var debug_shaders = true

// -------------------------------------------------------------------------------------
// GLSL ES sources for WebGL 1 and 2
//
//  See GLSL ES and corresponding WebGL versions here: 
//  https://en.wikipedia.org/wiki/OpenGL_Shading_Language#Versions)
//

// Modularized srcs, see 'gman' answer to Fabrice Neyret question:
// https://stackoverflow.com/questions/43666688/is-there-a-way-to-test-the-glsl-es-version-in-the-shader

const wgl1_version_decl  =
    `   #version 100 
    `

const wgl2_version_decl  =
    `   #version 300 es 
    `
const precision  =
    `
        precision highp float; // ??
        precision highp  int ;  // (what happens if I write 'mediump' here ? can mesh indexes still be very large??)
    `

const uniforms_decls = 
    `
        // Uniforms declarations (GLSL ES 1.0 or 3.0)

        uniform int       do_shading ; // 1-> do shading, 0->do not do shading (just use vertex colors)
        uniform mat4      model_mat ;  // modelling matrix (master vertex coords --> world vertex coords)
        uniform mat4      view_mat ;   // view matrix (world coords. --> camera coords.)
        uniform mat4      proj_mat ;   // projection matrix (camera coords. --> n.d.c. coords)
        uniform mat4      norm_mat ;   // normal matrix (master normal coords --> world normal coords)
        uniform int       do_texture ; // 1 -> use texture color, 0 -> do not use
        uniform sampler2D tsampler0 ;    // texture sampler, accesed only when 'do_texture' is 1
                                         
    `

const vertex_attrs_decls_wgl1 =
    `   
        // Vertex attributes declarations (GLSL ES 1.0)

        attribute vec3  in_vertex_pos_mcc ;   // attribute 0 (positions in master coordinates)
        attribute vec3  in_vertex_color ;     // attribute 1 (vertex color)
        attribute vec3  in_vertex_normal_mcc; // attribute 2 (normals in master coordinates)
        attribute vec2  in_vertex_texcoo;     // attribute 3 (texture coordinates, used when do_texture==1)
    `

const vertex_attrs_decls_wgl2 =
    `   
        // Vertex attributes declarations (GLSL ES 3.0)
        
        layout(location = 0) in vec3 in_vertex_pos_mcc ;    // attribute 0 (positions in master coordinates)
        layout(location = 1) in vec3 in_vertex_color ;      // attribute 1 (vertex color)
        layout(location = 2) in vec3 in_vertex_normal_mcc ; // attribute 2 (normals in master coordinates)
        layout(location = 3) in vec2 in_vertex_texcoo;      // attribute 3 (texture coordinates, used when do_texture==1)
    `

const vertex_inout_decls_wgl1 =
    `
        // Output (varying) variables (GLSL ES 1.0)

        varying vec3 vertex_color ;       // vertex color to be interpolated
        varying vec3 vertex_pos_wcc ;     // vertex position in world coords, to be interpolated
        varying vec3 vertex_norm_wcc ;    // vertex normal in world coords, to be interpolated
        varying vec2 vertex_texcoo ;      // vertex texture coordinates, to be interpolated
    `

const vertex_inout_decls_wgl2 =
    `
        // Output variables (GLSL ES 3.0)

        out vec3 vertex_color ;    // vertex color to be interpolated
        out vec3 vertex_pos_wcc ;  // vertex position in world coords, to be interpolated
        out vec3 vertex_norm_wcc ; // vertex normal in world coords, to be interpolated
        out vec2 vertex_texcoo ;   // vertex texture coordinates, to be interpolated
    `

const fragment_inout_decls_wgl1 =
    vertex_inout_decls_wgl1

const fragment_inout_decls_wgl2 =
    `
        // Input and output variables (GLSL ES 3.0)

        in  vec3 vertex_color ;    // interpolated primitive color 
        in  vec3 vertex_pos_wcc ;  // interpolated fragment center position in world coordinates
        in  vec3 vertex_norm_wcc ; // interpolated fragment normal in world coordinates
        in  vec2 vertex_texcoo ;   // interpolated texture coordinates 
        out vec4 frag_color ;      // output: fragment color
    `

const vertex_main =
    `   
        // Main function (writes the output variables) (GLSL ES 1.0 or 3.0)

        void main(  ) 
        {   
            vec4 pos_wcc    = model_mat * vec4( in_vertex_pos_mcc, 1) ;
            gl_Position     = proj_mat * (view_mat * pos_wcc); 
            vertex_color    = in_vertex_color ;
            vertex_pos_wcc  = pos_wcc.xyz ;
            vertex_norm_wcc = (norm_mat * vec4( in_vertex_normal_mcc, 0 )).xyz ;
            vertex_texcoo   = in_vertex_texcoo ;
        }
    `

const fragment_functions = 
    `   
        // Shade: computes opaque RGB color from (currently a simple test...)
        //    pos  : shading point position
        //    vcol : interpolated vertex color at the shading point position
        //    unor : shading point normal (not neccesarily normalized)
        
        vec3 Shade( vec3 pos, vec3 vcol, vec3 unor )
        {
            vec3 nor   = normalize(unor);
            vec3 light = normalize( vec3( 1.0, 1.0, 1.0 ) );
            vec3 diff  = max( 0.2, 1.2*dot( light, nor )) * vcol ;

            vec3  view    = normalize( vec3( 0.0, 0.0, 1.0 ) );
            vec3  halfw   = normalize( view+light );
            float hv      = max( 0.0, dot( halfw,view ) );
            float expon   = 10.0 ;
            vec3  spec    = pow(hv,expon)*vec3( 1.0, 1.0, 1.0 ) ; 

            return diff ;//+ spec ;
        }

        // returns 'base color', (the surface reflectivity), which is either the 
        // interpolated vertex color (when no texturing) or the texture color (when texturing)

        vec3 BaseColor()
        {
            if ( do_texture == 0 )
                return vertex_color ;
            else
            {
                vec4 tcol = QUERY_TEXTURE_2D( tsampler0, vertex_texcoo ) ;
                return tcol.xyz ;
            }
        }

        vec4 FragColor()
        {
            if ( do_shading == 0 )
                return vec4( BaseColor(), 1.0 ) ;
            else
                return vec4( Shade( vertex_pos_wcc, vertex_color, vertex_norm_wcc ), 1.0 );
        }
    `

const fragment_main_wgl1 =
    `   
        // Main function (writes the output variables)

        void main() 
        {
            gl_FragColor = FragColor() ;
        }
    `


const fragment_main_wgl2 =
    `   
        // Main function (writes the output variables)

        void main() 
        {
            frag_color = FragColor() ;
        }
    `
// --------------------------------------------------------
// full shader srcs (composed from strings)

const wgl1_vertex_complete_str =
    wgl1_version_decl + 
    precision + 
    uniforms_decls +
    vertex_attrs_decls_wgl1 +
    vertex_inout_decls_wgl1 +
    vertex_main

const wgl2_vertex_complete_str =
    wgl2_version_decl +
    precision +  
    uniforms_decls +
    vertex_attrs_decls_wgl2 +
    vertex_inout_decls_wgl2 +
    vertex_main

const wgl1_fragment_complete_str =
    wgl1_version_decl + 
    precision + 
    uniforms_decls + 
    fragment_inout_decls_wgl1 +
    fragment_functions + 
    fragment_main_wgl1

const wgl2_fragment_complete_str =
    wgl2_version_decl + 
    precision + 
    uniforms_decls + 
    fragment_inout_decls_wgl2 +
    fragment_functions + 
    fragment_main_wgl2

// -------------------------------------------------------------------------------------------------


var webgl_version = 0 


function ReplaceSyms( glsl_src )
{
    let res = glsl_src
    if ( webgl_version == 1 )
    {
        res = res.replace('QUERY_TEXTURE_2D','texture2D')
    }
    else if ( webgl_version == 2 )
    {
        res = res.replace('QUERY_TEXTURE_2D','texture')
    }
    else 
        throw new Error('webgl_version is not 1 nor 2')

    return res ;
}
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

    let shader = gl.createShader( type )
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
        if ( this.debug_mode )
            ShowLogWin() 
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
    CheckGLError( gl )
    gl.bindAttribLocation( program, 0, "in_vertex_pos_mcc" )
    gl.bindAttribLocation( program, 1, "in_vertex_color"   )
    gl.bindAttribLocation( program, 2, "in_vertex_normal_mcc"  )
    gl.bindAttribLocation( program, 3, "in_vertex_texcoo"  )
    CheckGLError( gl )
    /// done....

    const show_source = false // set to 'true' to see the sources even with no errors

    // link and then (if neccesary) show link errors
    gl.linkProgram( program )

    const link_ok = gl.getProgramParameter( program, gl.LINK_STATUS)
    if ( !  link_ok || show_source ) 
    {
        const msg = gl.getProgramInfoLog( program )
        LogLines("Vertex shader source",   vertex_source )
        LogLines("Fragment shader source", fragment_source )
        Log(`Output from program linking:`)
        Log('------------------------------------------------')
        Log(msg)
        Log('------------------------------------------------')
        if ( this.debug_mode )
            ShowLogWin()  
        if ( ! link_ok )
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
        this.debug_mode = debug_shaders

        if ( this.debug_mode )
            Log(`${fname} : begins.`)

        
        this.webgl_version = null 
        
        if ( cname == 'WebGL2RenderingContext' )
        {   
            webgl_version = 2 
            this.webgl_version = 2
        }
        else if ( cname == 'WebGLRenderingContext' )
        {   webgl_version = 1
            this.webgl_version = 1
        }
        else 
        {   
            this.webgl_version = 0 // just in case 'this' object is used after throw ..
            const msg = `${fname} 'wgl_ctx' is not a WebGL rendering context (it is a '${cname}')`
            throw new Error(msg)
        }
         
        if ( this.debug_mode )
            Log(`${fname} : wgl ver = ${this.webgl_version}`)
        
        let gl       = wgl_ctx
        this.context = wgl_ctx
        this.program = null
        
        this.vertex_source = null 
        this.fragment_source = null 

        // register shaders sources (after replacing some symbols)
        if ( this.webgl_version == 2 )
        {
            Log(`${fname} using webgl 2 sources`)
            this.vertex_source   = ReplaceSyms(wgl2_vertex_complete_str)   //wgl2_vertex_source
            this.fragment_source = ReplaceSyms(wgl2_fragment_complete_str) //wgl2_fragment_source
        }
        else
        {
            Log(`${fname} using webgl 1 sources`)
            this.vertex_source   = ReplaceSyms(wgl1_vertex_complete_str)    //wgl1_vertex_source
            this.fragment_source = ReplaceSyms(wgl1_fragment_complete_str) //wgl1_fragment_source
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
        this.model_mat_loc   = gl.getUniformLocation( this.program, 'model_mat' )
        this.view_mat_loc    = gl.getUniformLocation( this.program, 'view_mat' )
        this.proj_mat_loc    = gl.getUniformLocation( this.program, 'proj_mat' )
        this.norm_mat_loc    = gl.getUniformLocation( this.program, 'norm_mat' )
        this.tsampler0_loc   = gl.getUniformLocation( this.program, 'tsampler0' )
        this.do_shading_loc  = gl.getUniformLocation( this.program, 'do_shading' )
        this.do_texture_loc  = gl.getUniformLocation( this.program, 'do_texture' )

        Check( this.model_mat_loc  != null, 'unable to get location of model matrix' )
        Check( this.view_mat_loc   != null, 'unable to get location of view matrix' )
        Check( this.tsampler0_loc  != null, 'unable to get location of `tsampler1` sampler' )
        Check( this.do_shading_loc != null, 'unable to get location of `do_shading` uniform' )
        Check( this.do_shading_loc != null, 'unable to get location of `do_shading` uniform' )
        Check( this.do_texture_loc != null, 'unable to get location of `do_texture` uniform' )

        // will be created when 'useTexture( null )' is called 
        this.default_gl_texture = null

        // initialize model matrix stack (empty)
        this.model_mat_stack = []

        // initialize modelview and projection matrices in the instance and in the shader program (must be in use)
        this.setProjMat( Mat4_Identity() )  // assigns to 'this.proj_mat'
        this.setViewMat( Mat4_Identity() )   // assigns to 'this.view_mat', resets 'this.model_mat' to identity, empties 'this.model_mat_stack'
      
        // initialize other uniforms
        this.doShading( false )
        this.useTexture( null )

        // restore previously used shader program 
        gl.useProgram( prev_program )    
        
        if ( this.debug_mode )
        {
            Log(`${fname} ends.`)
        }
    }
    // ------------------------------------------------------------------------------------------------
    /**
     * returns the number of vertex attributes this program handles, including vertex coords at location 0
     */
    getNumVertexAttrs()
    {
        return 4 ; // vertex coordinates, vertex colors, vertex normals and texture coordinates
    }
    // ------------------------------------------------------------------------------------------------
    /**
     * sets whether this program does or does not shading (program must be in use)
     * @param {bool} new_do_shading  -- 'true' --> compute shading, 'false --> do not shade, just use vertex color attr.
     */
    doShading( new_do_shading )
    {
        //CheckType( new_do_shading, 'bool' )
        const v = new_do_shading ? 1 : 0 
        this.context.uniform1i( this.do_shading_loc, v )
    }
    // ------------------------------------------------------------------------------------------------
    /**
     * sets whether this program queries the texture or not (program must be in use), and which texture to query
     * @param {bool} new_do_texture -- 'true' --> use texture, 'false' --> do not use
     */
    useTexture( gl_texture )
    {
        let gl = this.context 

        if ( gl_texture != null )  
        {
            // use 'gl_texture'
            CheckType( gl_texture, 'WebGLTexture' )
            this.context.uniform1i( this.do_texture_loc, 1 )  // set the flag on the shader
            gl.activeTexture( gl.TEXTURE0 + 0 )   // Tell WebGL we want to affect texture unit 0
            gl.bindTexture( gl.TEXTURE_2D, gl_texture ) // Bind the texture to texture unit 0
            gl.uniform1i( this.tsampler0_loc, 0 )  // Tell the shader we bound the texture sampler to texture unit 0
        }
        else 
        {
            // create (if neccesary) and use a dummy 1x1 texture, 
            // (webgl continuously yields warnings if this is not done)
            
            if ( this.default_gl_texture == null )
            {
                const pixel = new Uint8Array([0, 0, 255, 255])  // opaque blue
                let tx = gl.createTexture()
                gl.bindTexture( gl.TEXTURE_2D, tx )
                gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, 1,1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel )
                this.default_gl_texture = tx
            }
            gl.bindTexture( gl.TEXTURE_2D, this.default_gl_texture )
            this.context.uniform1i( this.do_texture_loc, 0 )
        }
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
        // set also the normal matrix, this is just a buggy hack, TODO: work on this
        this.context.uniformMatrix4fv( this.norm_mat_loc, false, this.model_mat )
    }
    // ------------------------------------------------------------------------------------------------
    // composes the current model matrix with the matrix given as parameter
    compMM( comp_model_mat  )
    {
        CheckType( comp_model_mat, 'Mat4' )
        this.setMM( (this.model_mat).compose( comp_model_mat ) )   
    }
   
    // ------------------------------------------------------------------------------------------------
    /**
     * saves (in the model matrix stack) a copy of the current model matrix
     */
    pushMM()
    {
        this.model_mat_stack.push( new Mat4( this.model_mat ) )
    }
    // ------------------------------------------------------------------------------------------------
    /**
     * pop model matrix
     */
    popMM()
    {
        const l = this.model_mat_stack.length 
        Check( l > 0 , `SimpleGPUProgram.popMM(): modelview stack is empty`)
        this.setMM( new Mat4( this.model_mat_stack[l-1] ))
        this.model_mat_stack.pop()

    }
    // ------------------------------------------------------------------------------------------------
    /**
     * logs the current model matrix
     * @param {string} msg -- message to show on the log output      
     */
    logMM( msg )
    {
        Log( msg+' :' )
        Log(`  shader current model matrix == ${this.model_mat}\n\n`)
    }
}


