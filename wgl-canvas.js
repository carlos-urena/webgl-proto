
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
            Log(`WebGLCanvas constructor: begin`)

        // check that a valid string has been given
        CheckType( parent_id, 'string' )
        if ( parent_id == '' )
        {
            const msg = "An empty parent id string has been given to 'WebGLCanvas' constructor"
            Log( msg )
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
            Log( msg )
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
        {
            Log('Unable to create a webgl canvas, neither ver 1 nor ver 2')
            return 
        }
        // creates the GPU Program (= vertex shader + fragment shader)
        this.program = new SimpleGPUProgram( this.context )

        if ( this.debug_mode )
            Log(`WebGLCanvas constructor: end`)
    }
    // -------------------------------------------------------------------------------------------------

    getWebGLContext()
    {
        if ( this.debug_mode )
            Log(`WebGLCanvas getWebGLcontext: begins`)

        let first = false 
        if ( typeof(this.webgl_context) == 'undefined' ) 
            first = true 
        else if ( this.webgl_context == null )
            first = true 

        this.webgl_version = 2 
        this.context       = this.canvas_elem.getContext('webgl2')
        
        if ( this.context === null )
        {   
            Log("cannot have a webgl 2 canvas, trying web gl 1")
            this.webgl_version = 1 
            this.context       = this.gl_canvas.getContext('webgl')
        }
        if ( this.context === null )
        {   
            const str = 'Unable to properly create a WebGL canvas on this device'
            this.webgl_version = 0
            Log(str) 
            throw RangeError(str)
        }
        
        if ( this.debug_mode && first && this.webgl_version == 1 )
        {   
            const str = `WebGL 2 is not available, using WebGL 1 instead`
            Log(str)
        }
        if ( this.debug_mode )
            Log(`WebGLCanvas getWebGLcontext: end`)
        
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

