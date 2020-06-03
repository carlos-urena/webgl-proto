
// -------------------------------------------------------------------------------------------------

function BuscarElemId( id )
{
    let node = document.getElementById( id )
    if ( node === null )
    {
        const str = `No encuentro en el documento el elemento con identificador'${id}' (ver consola)`
        alert(str)
        throw RangeError(str)
    }
    return node
}

// ------------------------------------------------------------------------
/**
 * Checks if an object type or class name is equal to the expected one.
 * @param {Object} obj - any object, even undefined or null
 * @param {String} expected_type_name - a string with the expected type or constructor name  for that object
 */
 
function CheckType( obj, expected_type_name )
{
   if ( obj == null )
      throw TypeError("object is 'null'")

   let obj_type_name = typeof(obj)
   if ( obj_type_name == 'object' )
      obj_type_name = obj.constructor.name
   
    if ( obj_type_name == expected_type_name )
      return

   let msg = `object is not a '${expected_type_name}', but a '${obj_type_name}'`
   throw TypeError( msg )
}

// -------------------------------------------------------------------------------------------------

// variable which holds the single WebGLCanvas class instance 

var canvas = null 

// -------------------------------------------------------------------------------------------------
// A class for objects with a canvas element 

class WebGLCanvas
{
    /**
     * Constructor: creates ans inserts a new webgl canvas element in a given parent element.
     * @param {String} parent_id -- parent element unique identifier. The canvas is created here
     */
    constructor( parent_id )
    {
        this.debug_mode = true 
        if ( this.debug_mode )
            console.log(`WebGLCanvas constructor: begin`)

        // check that a valid string has been given
        CheckType( parent_id, 'string' )
        if ( parent_id == '' )
        {
            const msg = "An empty parent id string has been given to 'WebGLCanvas' constructor"
            alert( msg )
            throw RangeError( msg )
        }
        
        // Check the parent element exists and retrieve it
        this.parent_elem   = BuscarElemId( parent_id )
        this.parent_id     = parent_id
        
        // Create and configure the canvas element 
        // (its size is that of parent element, which is typically a 'div')

        this.canvas_id     = parent_id+"_canvas_id" 
        this.canvas_elem   = document.getElementById( this.canvas_id )
        if ( this.canvas_elem != null )
        {   let msg = "Error: the page tried to create a canvas with an identifier already in use" 
            alert( msg )
            throw RangeError( msg )
        }
        this.canvas_elem        = document.createElement('canvas')
        this.canvas_elem.id     = this.canvas_id 
        this.canvas_elem.width  = this.parent_elem.clientWidth
        this.canvas_elem.height = this.parent_elem.clientHeight
        this.innerHTML          = `Tu navegador u ordendor parece no soportar <code>&lt;canvas&gt;</code>.<br/>
                                   <i>It looks like your browser or computer does not support <code>&lt;canvas&gt;</code> element.</i>`
        this.parent_elem.appendChild( this.canvas_elem )

        // Create the WebGL context for this canvas, if it is not possible, return.
        this.getWebGLContext() // assigns to 'this.context' and 'this.webgl_version'
        this.showGLVersionInfo()
        if ( this.webgl_version == 0 )
            return 

        // creates the GPU Program (= vertex shader + fragment shader)
        this.program = new SimpleGPUProgram( this.context )

        if ( this.debug_mode )
            console.log(`WebGLCanvas constructor: end`)
    }
    // -------------------------------------------------------------------------------------------------

    getWebGLContext()
    {
        if ( this.debug_mode )
            console.log(`WebGLCanvas getWebGLcontext: begins`)

        let first = false 
        if ( typeof(this.webgl_context) == 'undefined' ) 
            first = true 
        else if ( this.webgl_context == null )
            first = true 

        this.webgl_version = 2 
        this.context       = this.canvas_elem.getContext('webgl2')
        
        if ( this.context === null )
        {   
            this.webgl_version = 1 
            this.context       = this.gl_canvas.getContext('webgl')
        }
        if ( this.context === null )
        {   
            const str = 'Unable to properly create a WebGL canvas on this device'
            this.webgl_version = 0
            alert(str) 
            throw RangeError(str)
        }
        
        if ( this.debug_mode && first && this.webgl_version == 1 )
        {   
            const str = `WebGL 2 is not available, using WebGL 1 instead`
            alert(str)
            console.log(str)
        }
        if ( this.debug_mode )
            console.log(`WebGLCanvas getWebGLcontext: end`)
        
        //alert('getWebGLContext ends')

    }
    // ------------------------------------------------------------------------------------------------

    resize()
    {
        this.canvas_elem.width  = this.parent_elem.clientWidth
        this.canvas_elem.height = this.parent_elem.clientHeight
        this.getWebGLContext()
        this.sampleDraw()
    }

    // -------------------------------------------------------------------------------------------------
    /** 
    * shows info about WebGL/OpenGL version, if the element with id 'info_div_id' exists 
    */
    showGLVersionInfo()
    {
        // if 'info_div_id' does not exists, does nothing
        let info_div = document.getElementById('info_div_id')
        if ( info_div === null )
            return

        if ( this.webgl_version == 0 )
        {
            info_div.innerHTML = "Error: unable to initialize WebGL properly."
            return 
        }

        // gather info
        let 
            gl         = this.context, 
            ctx_class  = gl.constructor.name,
            gl_vendor  = gl.getParameter(gl.VENDOR),
            gl_version = gl.getParameter(gl.VERSION)
        
        // show info on the div (as a table)
        const 
            info_str   = 
            `
                <table id='info_table_id'>
                    <tr><td><i>WebGL</i></td>    <td>:</td> <td>${this.webgl_version}</td></tr> 
                    <tr><td><i>Class</i></td>    <td>:</td> <td>${ctx_class}</td></tr> 
                    <tr><td><i>Vendor</i></td>   <td>:</td> <td>${gl_vendor}</td></tr>
                    <tr><td><i>Version</i></td>  <td>:</td> <td>${gl_version}</td></tr>
                </table>
            `
        info_div.innerHTML = info_str
        
    }
    // -------------------------------------------------------------------------------------------------

    sampleDraw()
    {
        console.log(`sampleDraw: begins`)
        let gl = this.context

        const sx = gl.drawingBufferWidth, 
              sy = gl.drawingBufferHeight 

        console.log(`sampleDraw: sx == ${sx}, sy == ${sy} `)
        
        gl.clearColor(0.0, 0.1, 0.15, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.viewport(0, 0, sx, sy );

        console.log(`sampleDraw: ends`)
        
    }
}
// -------------------------------------------------------------------------------------------------
/**
 * Shows a (source) string with line numbers and a title
 * @param {string} title   -- the title (included as a heading)
 * @param {string} source  -- the probably multiline string to show
 */
function LogLines( title, source )
{
    let line_num = 1
    console.log('-----------------------------------------------------------')
    console.log(title)
    console.log('-----------------------------------------------------------')

    for( let line of source.split('\n') )
    {  console.log(`${line_num} : ${line}`)
       line_num ++
    }
    console.log('-----------------------------------------------------------')
}
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
// -------------------------------------------------------------------------------------------------

/** Adapts the canvas container size to the window size
*/
function ResizeCanvasContainer()
{
    if ( canvas == null )
        return 

    let canvas_container_elem = BuscarElemId('canvas_container_id')

    const nx = Math.min( 2048, Math.max( 512, Math.floor(window.innerWidth*0.8  ) ) ),
          ny = Math.min( 2048, Math.max( 512, Math.floor(window.innerHeight*0.8 ) ) )

    canvas_container_elem.style.width   = nx.toString() + "px"
    canvas_container_elem.style.height  = ny.toString() + "px"
    console.log(`ResizeCanvasContainer, new w = ${nx}, h = ${ny}`)
    canvas.resize()  // resizes the canvas according to div dimensions
}

// -------------------------------------------------------------------------------------------------
/* this is executed once, after the body has finished loading
*/

function OnDocumentLoad()
{
    // create the canvas (the single instance of WebGLCanvas)
    if ( canvas != null )
        throw RangeError(`'canvas' is not null on document load`)   
    canvas = new WebGLCanvas( 'canvas_container_id' )

    // fit the canvas size to that of its container
    ResizeCanvasContainer()

    // do a sample draw, just to check everything is fine
    canvas.sampleDraw() 
}
// -------------------------------------------------------------------------------------------------

function OnBodyResize()
{
   ResizeCanvasContainer()
}
// -------------------------------------------------------------------------------------------------

