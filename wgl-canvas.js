
var redraws_count = 0


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
        this.debug = true  // tuen to 'true' to see log messages
        const fname = `WebGLCanvas.constructor():`

        if ( this.debug )
            Log(`${fname} WebGLCanvas constructor: begin`)

        // check that a valid string has been given
        CheckType( parent_id, 'string' )
        if ( parent_id == '' )
        {
            const msg = `${fname} An empty parent id string has been given to 'WebGLCanvas' constructor`
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
        {   const msg = `${fname} error: the page tried to create a canvas with an identifier already in use`
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

        // check if we can use 'unsigned int' for the indexes in an indexed vertex sequence
        if ( this.debug )
            console.log( `${fname} extensions: ${this.context.getSupportedExtensions()}` )
        
        if ( this.context.getExtension('OES_element_index_uint') == null )
        {
            if ( this.debug )
            {   const msg = `${fname} WARNING: recommended extension 'OES_element_index_uint' is not supported in this device`
                Log( msg )
            }
            //throw Error( msg )
            this.context.has_32bits_indexes = false // adding a property to a library class here .... does it works???
        }
        else 
            this.context.has_32bits_indexes = true 

        this.showGLVersionInfo()
        if ( this.webgl_version == 0 )
        {
            const msg = `${fname} Unable to create a webgl canvas, neither ver 1 nor ver 2`
            Log( msg )
            throw Error( msg )
        }
        // creates the GPU Program (= vertex shader + fragment shader)
        this.program = new SimpleGPUProgram( this.context )

        // creates a sample vertex sequence or mesh to test drawing 
        this.test_vertex_seq     = new SimpleVertexSeq()
        this.test_vertex_seq_ind = new SimpleVertexSeqIndexed()
        this.test_2d_mesh        = new Simple2DMesh()

        // set mouse events state info
        this.is_mouse_left_down  = false
        this.is_mouse_right_down = false
        this.drag_start_pos_x    = -1
        this.drag_start_pos_y    = -1

        // sets events handlers (mostly mouse events)
        this.canvas_elem.addEventListener( "mousedown", e => this.mouseDown(e), true )
        this.canvas_elem.addEventListener( "mouseup",   e => this.mouseUp(e), true )
        this.canvas_elem.addEventListener( "mousemove", e => this.mouseMove(e), true )

        // prevent the context menu from appearing, typically after a right click
        this.canvas_elem.addEventListener('contextmenu', e => e.preventDefault() )

        

        /// tests vec3
        /// TestVec3()

        if ( this.debug )
            Log(`${fname} WebGLCanvas constructor: end`)
    }
    // -------------------------------------------------------------------------------------------------

    /**
     * Called right after a mouse button has been pressed down
     * @param {MouseEvent} mevent -- mouse event created by the browser
     */
    mouseDown( mevent )
    {
        const fname = 'WebGLCanvas.mouseDown:'
        CheckType( mevent, 'MouseEvent' )
        if ( this.debug )
            Log(`${fname} begins, button == ${mevent.button}`)

        if ( mevent.button === 0 )
            this.is_mouse_left_down = true
        else if ( mevent.button === 2 )
            this.is_mouse_right_down = true

        if ( mevent.button === 2 )
        {
            this.drag_start_pos_x  = mevent.clientX
            this.drag_start_pos_y  = mevent.clientY
            if ( this.debug )
                Log(`${fname} drag start at: (${this.drag_start_pos_x}, ${this.drag_start_pos_y})`)
        }
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called right after a mouse button has been released
     * @param {MouseEvent} mevent -- mouse event created by the browser
     */
    mouseUp( mevent )
    {
        const fname = 'WebGLCanvas.mouseUp'
        CheckType( mevent, 'MouseEvent' )
        if ( this.debug )
            Log(`${fname} begins, button == ${mevent.button}`)

        if ( mevent.button === 0 )
            this.is_mouse_left_down = false
        else if ( mevent.button === 2 )
            this.is_mouse_right_down = false
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called right after the mouse has moved through the canvas
     * @param {MouseEvent} mevent -- mouse event created by the browser
     */
    mouseMove( mevent )
    {
        if ( ! this.is_mouse_right_down )
            return 

        const fname = 'WebGLCanvas.mouseMove (right drag):'
        CheckType( mevent, 'MouseEvent' )

        const dx = mevent.clientX - this.drag_start_pos_x,
              dy = mevent.clientY - this.drag_start_pos_y

        if ( this.debug )
            Log(`${fname} begins, dx,dy == (${dx},${dy})`)
        
    }
    // -------------------------------------------------------------------------------------------------
    getWebGLContext()
    {
        if ( this.debug)
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
            this.context       = this.canvas_elem.getContext('webgl')
        }
        if ( this.context === null )
        {   
            const str = 'Unable to properly create a WebGL canvas on this device'
            this.webgl_version = 0
            Log(str) 
            throw RangeError(str)
        }
        
        if ( this.debug )
        {   if ( this.debug_mode && first && this.webgl_version == 1 )
            {   
                const str = `WebGL 2 is not available, using WebGL 1 instead`
                Log(str)
            }
            Log(`WebGLCanvas getWebGLcontext: end`)
        }
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

    // /** handles an event
    //  * 
    //  */
    // handleEvent( event )
    // {
    //     if ( event.constructor.name != 'MouseEvent' )
    //         return 

    //     if ( event.type != 'mousedown')
    //         return

    //     const fname = `WebGLCanvas.handleEvent():`
    //     Log(`${fname} begins`)
    //     Log(`${fname} event type  == ${event.type}`)
    //     Log(`${fname} button      == ${event.button}`)
    //     Log(`${fname} ends`)
    // }
    // -------------------------------------------------------------------------------------------------

    sampleDraw()
    {
        redraws_count = redraws_count +1 
        if ( this.debug )
        {
            Log(`---------------------------------------------------------`)
            Log(`WebGLCanvas.sampleDraw: begins`)
            Log(`WebGLCanvas.sampleDraw: redraws_count == ${redraws_count}`)
        }
        CheckGLError( this.context )

        // retrive context and size
        let gl   = this.context
        const sx = gl.drawingBufferWidth, 
              sy = gl.drawingBufferHeight 

        if ( this.debug )
            console.log(`WebGLCanvas.sampleDraw: sx == ${sx}, sy == ${sy} `)
       

        // clear screen, set viewport
        gl.clearColor(0.0, 0.1, 0.13, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.viewport(0, 0, sx, sy )
        CheckGLError( gl )

        // activate fragment+vertex shader
        this.program.use()

        // set default color (attribute location 1)
        gl.vertexAttrib3f( 1, 0.9, 0.9, 0.9 )

        // set projection and modelview matrixes 
        CheckGLError( gl )
        this.program.setModelview( new Mat4_Identity() )
        this.program.setProjection( new Mat4_UndProj2D( sx,sy ) )
        CheckGLError( gl )


        // actually draw something.....(test)
        //this.test_vertex_seq_ind.draw( gl, gl.TRIANGLES )
        this.test_2d_mesh.draw( gl )

        // done
        CheckGLError( gl )
        if ( this.debug )
        {   
            Log(`WebGLCanvas.sampleDraw: ends`)
            Log(`---------------------------------------------------------`)
        }
    }
}

