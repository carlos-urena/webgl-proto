
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

        // Create the WebGL context for this canvas
        this.getWebGLContext() // assigns to 'this.context' and 'this.webgl_version'
        this.showGLVersionInfo()

        // creates the GPU Program (= vertex shader + fragment shader)
        this.program = new SimpleGPUProgram( this.gl )

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
                <table style='background-color : rgb(80%,80%,80%);'>
                    <tr><td><i>Class</i></td>   <td>:</td> <td>${ctx_class}</td></tr> 
                    <tr><td><i>Vendor</i></td>  <td>:</td> <td>${gl_vendor}</td></tr>
                    <tr><td><i>Version</i></td> <td>:</td> <td>${gl_version}</td></tr>
                </table>
            `
        info_div.innerHTML = info_str
        
    }
    // -------------------------------------------------------------------------------------------------

    sampleDraw()
    {
        console.log(`sampleDraw`)
        let gl = this.context
        gl.clearColor(0.0, 0.2, 0.3, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)
    }
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
        this.gl = wgl_ctx
        this.vs_source =
        `
            attribute vec4 aVertexPosition;
            attribute vec4 aVertexColor;

            uniform mat4 uModelViewMatrix;
            uniform mat4 uProjectionMatrix;

            varying lowp vec4 vColor;

            void main(void) 
            {
                gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
                vColor = aVertexColor;
            }
        `

        if ( this.debug_mode )
            console.log(`Shader program constructor: vs_source=${this.vs_source}`)
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

