
// -------------------------------------------------------------------------------------------------
/**
 * Creates and compiles a vertex or fragment shader, if there are errors, shows the source and the errors,
 * and raises an exception, if it is correct, returns the shader.
 * 
 * @param {WebGLContext} gl -- webgl context
 * @param {string} source   -- string with shader source, may contain newlines
 * @param {*} type          -- shader type either gl.FRAGMENT_SHADER or gl.VERTEX_SHADER
 * @returns {WebGLShader}   -- compiled shader
 */
function CreateAndCompileShader( gl, source, type )
{
    if ( type != gl.VERTEX_SHADER && type != gl.FRAGMENT_SHADER )
        throw RangeError('invalid shader type')

    const type_str = ( type === gl.VERTEX_SHADER ) ? "Vertex" : "Fragment" 

    let shader = gl.createShader( type ); 
    CheckType( shader, 'WebGLShader' )

    gl.shaderSource( shader, source )
    gl.compileShader( shader )
    const msg = gl.getShaderInfoLog( shader )

    if ( msg != "" )
    {
        LogLines(`${type_str} shader:`, source )
        console.log(`Errors from ${type_str} shader compilation:`)
        console.log('------------------------------------------------')
        console.log(`${msg}------------------------------------------------`)
        throw RangeError(`Unable to compile the ${type_str} shader, see console`)
    }
    else 
        console.log(`CreateAndCompileShader: ${type_str} shader compiled ok.`)   

    return shader
}
// -------------------------------------------------------------------------------------------------
/**
 *  Creates and compiles a program, given its two (already compiled) shaders.
 *  If there is any error, it is reported and an exception is thrown, otherwise the program is returned
 * 
 * @param {WebGLRenderingContext} gl -- a rendering context (it can be a WebGL2RenderingContext)
 * @param {WebGLShader} vertex_shader -- already compiled vertex shader 
 * @param {WebGLShader} fragment_shader -- already compiled fragment shader
 * @param {string} vertex_source   -- vertex shader source (just used to show it if an error happens)
 * @param {string} fragment_source -- fragment shader source (just used to show it if an error happens)
 * @returns {WebGLProgram} -- the newly created program
 */

function CreateAndLinkProgram( gl, vertex_shader, vertex_source, fragment_shader,  fragment_source )
{
    const glclass = gl.constructor.name 
    if ( glclass != 'WebGLRenderingContext' && glclass != 'WebGL2RenderingContext')
        throw "Error: invalid parameter 'gl', it is not a webgl rendering context"

    CheckType( vertex_shader,   'WebGLShader' )
    CheckType( vertex_source,   'string' )
    CheckType( fragment_shader, 'WebGLShader' )
    CheckType( fragment_source, 'string' )

    // Create and link the WebGL GPU program

    let program  = gl.createProgram(); CheckType( program, 'WebGLProgram' ) 
    gl.attachShader( program, vertex_shader )
    gl.attachShader( program, fragment_shader )
    gl.linkProgram( program )

    if ( ! gl.getProgramParameter( program, gl.LINK_STATUS) ) 
    {
        const msg = gl.getProgramInfoLog( program )
        LogLines("Vertex shader source",   vertex_source )
        LogLines("Fragment shader source", fragment_source )
        console.log(`Errors from program linking:`)
        console.log('------------------------------------------------')
        console.log(`${msg}------------------------------------------------`)
        throw RangeError(`Unable to link program, see console`)
    }       
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
        this.debug_mode = true

        if ( this.debug_mode )
            console.log("SimpleGPUProgram.constructor : begins")
        
        let gl          = wgl_ctx
        this.context    = gl
        this.vertex_source  =
        `   attribute vec4  vertex_pos;
            void main(  ) 
            {   
                gl_Position = vertex_pos; 
            }
        `
        this.fragment_source =
        `   void main() 
            {
                gl_FragColor = vec4( 1.0, 1.0, 1.0, 1.0 );
            }
        `
        this.vertex_shader   = CreateAndCompileShader( gl, this.vertex_source,   gl.VERTEX_SHADER )
        this.fragment_shader = CreateAndCompileShader( gl, this.fragment_source, gl.FRAGMENT_SHADER )
        this.program         = CreateAndLinkProgram  ( gl, this.vertex_shader,   this.vertex_source, 
                                                           this.fragment_shader, this.fragment_source )
    }

}
