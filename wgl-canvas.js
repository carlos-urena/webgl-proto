
var redraws_count = 0

// vertex sequences for the grid lines

var x_line  = null,
    z_line  = null

// vertex sequences for the axes

var x_axe   = null,
    y_axe   = null, 
    z_axe   = null 


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
        this.debug = main_debug  // tuen to 'true' to see log messages
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

        // 3d mesh used to test 'IndexedTriangleMesh' class  
        this.test_3d_mesh  = null 

        // set mouse events state info
        this.is_mouse_left_down  = false
        this.is_mouse_right_down = false
        this.drag_prev_pos_x     = -1
        this.drag_prev_pos_y     = -1

        // we already have not started loading any 3d model
        this.loaded_object  = null
        this.loading_object = false 

        // prevent the context menu from appearing, typically after a right click
        this.canvas_elem.addEventListener('contextmenu', e => e.preventDefault() )

        // initialize (alpha,beta) angles and 'dist' for interactive camera control
        // (all this will be moved out to a proper 'Camera' class)
        this.cam_alpha_deg = 35.0
        this.cam_beta_deg  = 20.0
        this.cam_dist      = 2.0

        /// tests vec3, Mat4
        /// TestVec3()
        /// TestMat4()

        //let gl = this.context
        //console.log(`line width == ${gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE)}`);

        // sets events handlers (mostly mouse events)
        this.canvas_elem.addEventListener( 'mousedown', e => this.mouseDown(e), true )
        this.canvas_elem.addEventListener( 'mouseup',   e => this.mouseUp(e), true )
        this.canvas_elem.addEventListener( 'mousemove', e => this.mouseMove(e), true )
        this.canvas_elem.addEventListener( 'wheel',     e => this.mouseWheel(e), true )

        // for clog...
        this.clog_span = null

        // touch events on the canvas for mobile devices
        this.canvas_elem.addEventListener( 'touchstart', e => this.touchStart(e), true )
        this.canvas_elem.addEventListener( 'touchmove',  e => this.touchMove(e), true )
        this.canvas_elem.addEventListener( 'touchend',   e => this.touchEnd(e), true )

        // handle drag & drop related events on the whole document 
        // (prevents default browser actions and changes style of canvas when dragging over it)
        document.addEventListener( 'dragenter',  e => this.documentDragEnter(e), true )
        document.addEventListener( 'dragleave',  e => this.documentDragLeave(e), true )
        document.addEventListener( 'drop',       e => this.documentDragDrop(e), true )
        document.addEventListener( 'dragover',   e => this.documentDragOver(e), true )

        // call 'this.dragDrop' when the user drops some files on this canvas element
        this.canvas_elem.addEventListener( 'drop', e => this.dragDrop(e), true )
        

        if ( this.debug )
            Log(`${fname} WebGLCanvas constructor: end`)
    }
    // -------------------------------------------------------------------------------------------------
    // log to a fixed element.....
    cLog( msg )
    {
        //Log(``)
        if ( this.clog_span == null )
            this.clog_span = document.getElementById('clog_span_id')
        if ( this.clog_span == null )
            return
        this.clog_span.innerHTML = msg
    }
    // -------------------------------------------------------------------------------------------------

    /**
     * Called right after a mouse button has been pressed down
     * @param {MouseEvent} mevent -- mouse event created by the browser
     */
    mouseDown( mevent )
    {
        mevent.stopImmediatePropagation() // neccesary? improves performance?
        mevent.preventDefault() // prevent default treatment of mouse down event

        const fname = 'WebGLCanvas.mouseDown:'
        CheckType( mevent, 'MouseEvent' )
        if ( this.debug )
            Log(`${fname} begins, button == ${mevent.button}`)

        if ( mevent.button != 0 && mevent.button != 2 )
            return true 

        if ( mevent.button === 0 )
            this.is_mouse_left_down = true
        else if ( mevent.button === 2 )
            this.is_mouse_right_down = true

        if ( mevent.button === 2 )
        {
            this.drag_prev_pos_x  = mevent.clientX
            this.drag_prev_pos_y  = mevent.clientY
            if ( this.debug )
                Log(`${fname} drag start at: (${this.drag_prev_pos_x}, ${this.drag_prev_pos_y})`)
        }
        return false
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called right after a mouse button has been released
     * @param {MouseEvent} mevent -- mouse event created by the browser
     */
    mouseUp( mevent )
    {
        mevent.stopImmediatePropagation() // neccesary? improves performance?
        mevent.preventDefault() // prevent default treatment of mouse up event

        const fname = 'WebGLCanvas.mouseUp'
        CheckType( mevent, 'MouseEvent' )
        if ( this.debug )
            Log(`${fname} begins, button == ${mevent.button}`)

        if ( mevent.button === 0 )
        {   this.is_mouse_left_down = false
            return false
        }
        else if ( mevent.button === 2 )
        {
            this.is_mouse_right_down = false
            return false
        }
        return true
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called right after the mouse has moved through the canvas
     * @param {MouseEvent} mevent -- mouse event created by the browser
     */
    mouseMove( mevent )
    {
        mevent.stopImmediatePropagation() // neccesary? improves performance?
        mevent.preventDefault() // prevent default treatment of mouse moves 

        if ( ! this.is_mouse_right_down )
            return true

        const fname = 'WebGLCanvas.mouseMove (right drag):'
        CheckType( mevent, 'MouseEvent' )

        // compute displacement from the original position ( where mouse button was pressed down)

        const drag_cur_pos_x = mevent.clientX ,
              drag_cur_pos_y = mevent.clientY ,
              dx             = drag_cur_pos_x - this.drag_prev_pos_x,
              dy             = drag_cur_pos_y - this.drag_prev_pos_y

        this.cLog(`mouse move: dx: ${dx}, dy: ${dy}`)

        this.drag_prev_pos_x = drag_cur_pos_x
        this.drag_prev_pos_y = drag_cur_pos_y

        if ( this.debug )
            Log(`${fname} dx,dy == (${dx},${dy})`)

        // update camera parameters
        
        this.cam_alpha_deg = Trunc( this.cam_alpha_deg - dx*0.20, -180, +180 )
        this.cam_beta_deg  = Trunc( this.cam_beta_deg  + dy*0.10, -85,  +85  )

        if ( this.debug )
            Log(`${fname} alpha,beta == (${this.cam_alpha_deg.toPrecision(5)},${this.cam_beta_deg.toPrecision(5)})`)

        // redraw:
        this.drawFrame()
        
        return false
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called right after the mouse wheel has been moved over the canvas
     * @param {WheelEvent} wevent -- mouse event created by the browser
     */
    mouseWheel( wevent )
    {
        
        wevent.stopImmediatePropagation() // neccesary? improves performance?
        wevent.preventDefault() // avoids document body scroll while zooming
        //**** */

        const fname = 'WebGLCanvas.mouseWheel():'
        CheckType( wevent, 'WheelEvent' )
        
        const fac = 0.002
        this.cam_dist = Trunc( this.cam_dist + fac*wevent.deltaY, 0.1, 20.0 )
        
        // redraw:
        this.drawFrame()
        
        return false 
    }
    
    // -------------------------------------------------------------------------------------------------
    /**
     * Called right after a touch start event 
     * @param {TouchEvent} tevent -- touch event created by the browser
     */
    touchStart( tevent )
    {
        tevent.stopImmediatePropagation() // neccesary? improves performance?
        tevent.preventDefault() // prevent default treatment of mouse up event

        const fname = 'WebGLCanvas.touchStart():'
        
        CheckType( tevent, 'TouchEvent' )
        if ( this.debug )
            Log(`${fname} begins`)

        let nt = tevent.touches.length 
        let msg = `${fname} nt = ${nt}`

        if ( nt != 1 )
        {   //this.cLog(msg)
            return false
        }
        let tch = tevent.touches.item(0)
        this.prev_touch_pos_x = tch.screenX
        this.prev_touch_pos_y = tch.screenY

        msg = msg+`, px = ${this.prev_touch_pos_x}, py = ${this.prev_touch_pos_y}`
        //this.cLog(msg)
        return false
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called right after a touch move event 
     * @param {TouchEvent} tevent -- touch event created by the browser
     */
    touchMove( tevent )
    {
        tevent.stopImmediatePropagation() // neccesary? improves performance?
        tevent.preventDefault() // prevent default treatment of mouse up event

        const fname = 'WebGLCanvas.touchMove():'
        //this.cLog(fname)
        CheckType( tevent, 'TouchEvent' )
        if ( this.debug )
            Log(`${fname} begins`)

        let nt = tevent.touches.length 
        let msg = `${fname} nt = ${nt}`

        if ( nt != 1 )
        {   this.cLog(msg)
            return 
        }
        let tch = tevent.touches.item(0)

        let dx = tch.screenX - this.prev_touch_pos_x,
            dy = tch.screenY - this.prev_touch_pos_y 
        
        this.prev_touch_pos_x = tch.screenX
        this.prev_touch_pos_y = tch.screenY

        msg = msg+`, DX = ${dx}, DY = ${dy} --> redraw`
        //this.cLog(msg)

        // update camera params
        this.cam_alpha_deg = Trunc( this.cam_alpha_deg - dx*0.20, -180, +180 )
        this.cam_beta_deg  = Trunc( this.cam_beta_deg  + dy*0.10, -85,  +85  )

        // redraw:
        this.drawFrame()

        return false
        
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called right after a touch end event
     * @param {TouchEvent} tevent -- drag event created by the browser
     */
    touchEnd( tevent )
    {
        tevent.stopImmediatePropagation() // neccesary? improves performance?
        tevent.preventDefault() // prevent default treatment of mouse up event

        const fname = 'WebGLCanvas.touchEnd():'
        //this.cLog(fname)
        CheckType( tevent, 'TouchEvent' )
        if ( this.debug )
            Log(`${fname} begins`)
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called for a 'dragenter' event anywhere in the document
     * @param {DragEvent} devent -- drag event created by the browser
     */
    documentDragEnter( devent )
    {
        const fname = 'WebGLCanvas.documentDragEnter():'
        CheckType( devent, 'DragEvent' )
        if ( this.debug )
            Log(`${fname} begins`)

        if ( devent.target == this.canvas_elem )
        {
            this.parent_elem.style.borderColor = 'rgb(30%,90%,50%)'
        }
        devent.stopImmediatePropagation() // neccesary? improves performance?
        devent.preventDefault() // prevent default treatment of drag end event
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called for a 'dragover' event anywhere in the document
     * @param {DragEvent} devent -- drag event created by the browser
     */
    documentDragOver( devent )
    {
        const fname = 'WebGLCanvas.documentDragOver():'
        CheckType( devent, 'DragEvent' )
        if ( this.debug ) 
            Log(`${fname} begins`)

        devent.stopImmediatePropagation() // neccesary? improves performance?
        devent.preventDefault() // prevent default treatment of drag over mouse
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called for a 'dragstart' event
     * @param {DragEvent} devent -- drag event created by the browser
     */
    documentDragLeave( devent )
    {
        const fname = 'WebGLCanvas.documentDragLeave():'
        CheckType( devent, 'DragEvent' )
        if ( this.debug )
            Log(`${fname} begins`)

        if ( devent.target == this.canvas_elem )
        {
            this.parent_elem.style.borderColor = 'rgb(50%,50%,50%)'
        }

        devent.stopImmediatePropagation() // neccesary? improves performance?
        devent.preventDefault() // prevent default treatment of drag end event
        
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called for a 'drop' event anywhere in the document,  prevents default drop behavoir on elements
     * different from this canvas 
     * @param {DragEvent} devent -- drag event created by the browser
     */
    documentDragDrop( devent )
    {
        const fname = 'WebGLCanvas.documentDragDrop():'
        CheckType( devent, 'DragEvent' )
        if ( this.debug )
            Log(`${fname} begins`)

        if ( devent.target != this.canvas_elem )
        {
            //devent.stopImmediatePropagation() // probably wrong when there are more than one webgl canvas on the page
            devent.preventDefault() // prevent default treatment of drag drop
        }
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called for a 'drop' event specifically on this canvas element
     * @param {DragEvent} devent -- drag event created by the browser
     */
    dragDrop( devent )
    {
        devent.stopImmediatePropagation() // neccesary? improves performance?
        devent.preventDefault() // prevent default treatment of drag drop event

        const fname = 'WebGLCanvas.dragDrop():'
        CheckType( devent, 'DragEvent' )
        if ( this.debug )
            Log(`${fname} begins`)

        const def_border_color = 'rgb(50%,50%,50%)',
              err_border_color = 'rgb(100%,40%,10%)'

        let file_list = devent.dataTransfer.files
        //console.log(`${fname} file list length == ${file_list.length}`);
        
        if ( file_list.length == 0 ) // should not happen ....
            throw new Error(`${fname} 'file_list' length is 0`)

        if ( file_list.length != 2 )
        {   
            this.parent_elem.style.borderColor = err_border_color
            alert(`Sorry, you must drop 2 files, but you're trying to drop ${file_list.length}`)
            this.parent_elem.style.borderColor = def_border_color
            return
        }

        /// get the ply_file_blob, and possibly the jpeg_file_blob

        let exts = [  ]  // list of files extensions
        for( let i = 0 ; i < file_list.length ; i++ )
            exts.push( file_list.item(i).name.split('.').pop().toLowerCase() )

        let iply = 0, 
            ijpg = 1
        
        if ( exts[iply] != 'ply' || exts[ijpg] != 'jpg' )
        {   
            iply = 1
            ijpg = 0
        }
        if ( exts[iply] != 'ply' || exts[ijpg] != 'jpg' )
        {
            this.parent_elem.style.borderColor = err_border_color
            alert(`Sorry, you must drop a '.ply' file and a '.jpg' file, but extensions are: '.${exts[0]}' and '.${exts[1]}'`)
            this.parent_elem.style.borderColor = def_border_color
            return
        }

        const ply_file_blob = file_list.item( iply ),  // https://developer.mozilla.org/en-US/docs/Web/API/File
              jpg_file_blob = file_list.item( ijpg )
          
        if ( ply_file_blob == null || jpg_file_blob == null )  // should not happen ....
            throw new Error(`${fname} internal error: a file blob is 'null'`)

        this.parent_elem.style.borderColor = err_border_color
        this.plyFileDropped( ply_file_blob, jpg_file_blob )
        this.parent_elem.style.borderColor = def_border_color

    }
    // -------------------------------------------------------------------------------------------------
    
    setStatus( msg )
    {
        let st = document.getElementById('status_div_id')
        if ( st != null )
            st.innerHTML = msg
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Process a new jpg file which has been just dropped onto the canvas
     * @param {File} jpg_file 
     */
    jpgFileDropped( jpg_file )
    {
        CheckType( jpg_file, 'File' )
        Check( jpg_file.type == 'image/jpeg' )
        const fname = `WebGLCanvas.jpgFileDropped():`
        console.log(`${fname} begins, file name == '${jpg_file.name}', type == '${jpg_file.type}'`)
        console.log(`${fname} (nothing to do...)`)

        console.log(`${fname} ends`)

        /// TODO: actually read the image, see: (uses FileReader??)
        /// https://developer.mozilla.org/es/docs/Web/API/FileReader/readAsDataURL
       
        this.loading_object = false
        this.drawFrame()
    }

    // -------------------------------------------------------------------------------------------------
    /**
     * Process a new ply file which has been just dropped onto the canvas
     * @param {File} ply_file -- ply file blob to parse
     * @param {File} jpg_file -- jpg file blob to parse (load will be started after ply parsing ends)
     */
    plyFileDropped( ply_file, jpg_file )
    {
        CheckType( ply_file, 'File' )
        const fname = `WebGLCanvas.plyFileDropped():`

        if ( this.loading_object )
        {
            alert('Sorry, cannot load 3D model file, alreading loading another file.')
            return
        }
        this.ply_file_name = ply_file.name

        if ( this.debug )
        {
            Log(`${fname} first file name == '${this.ply_file_name}'`)
            Log(`${fname} first file path == ${ply_file.size.toLocaleString('EN')} bytes`)
            Log(`${fname} ## LOADING ###  .....`)
        }
        
        const mb = Math.floor( 100.0*ply_file.size/1024.0 )/ 100.0
        this.setStatus(`Loading ${this.ply_file_name} (${mb.toLocaleString('EN')} MB) .....`)

        let  reader = new FileReader()
        this.loading_object = true

        reader.onload = e => this.plyFileLoaded( e, jpg_file )
        reader.onerror = function (evt) 
        {
            //console.log(`${fname} error while loading file`)
            alert(`Cannot load file. An error ocurred while trying to read from the file system`)
            this.canvas_obj.loading_object = false 
            this.setStatus('Unable to read ply file.')
        }

        reader.readAsText( ply_file )// , "UTF-8" )
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called after the ply File (Blob) has been loaded, this adds the PLY object to the scene
     *   @param {ProgressEvent} evt 
     *   @param {File} jpg_file -- jpg file blob to parse (load will be started after ply parsing ends)
     */
    plyFileLoaded( evt, jpg_file )
    {
        const fname = 'WebGLCanvas.plyFileLoaded():'
        Check( this.loading_object , "'this.loading_object' is not 'true'")
        CheckType( evt, 'ProgressEvent' )

        if ( this.debug )
        {
            Log(`${fname} event class  == ${evt.constructor.name}`)
            Log(`${fname} result class == ${evt.target.result.constructor.name}`) 
            Log(`${fname} splitting lines ....` )
        }
        let lines = evt.target.result.split('\n')

        if ( this.debug )
        {
            Log(`${fname} splitting ended`)
            Log(`${fname} num lines   == ${lines.length}`)
            Log(`${fname} ###### first lines in PLY file == `)
            let pre = document.getElementById("ply_file_contents_pre_id")
            for( let i = 0 ; i < lines.length ; i++ )
            {   if ( pre != null && i < 30 )
                    pre.innerHTML += lines[i]+'<br/>'
                if ( i < 30 )
                    console.log(lines[i])
            }
            Log(`${fname} ###### end`)
            Log(`${fname} PARSING....`)
        }
        let loaded_object  = new TriMeshFromPLYLines_FTCC( lines )   //// use which version _VC ??

        if ( loaded_object.n_verts == 0 )
        {   
            this.setStatus(`PLY file '${this.ply_file_name}' couldn't be loaded.`)
            if ( this.debug )
                Log(`${fname} couldn't load PLY, won't try the jpeg. `)
            this.loading_object = false
            return
        }

        this.loaded_object = loaded_object
        const msg = `PLY file '${this.ply_file_name}' loaded ok. (núm. verts: ${this.loaded_object.n_verts}, núm. triangles: ${this.loaded_object.n_tris}).`
        this.setStatus( msg )
        if ( this.debug )
                Log( msg )

        this.jpgFileDropped( jpg_file )
        
        if ( this.debug )
            Log(`${fname} loading PLY ended.`)
        
       
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * gets an OpenGL context for the webgl canvas document element
     *   - assigns 'this.context' and 'this.webgl_version'
     *   - throws an error if no webgl context can be obtained
     */
    getWebGLContext()
    {
        const fname = 'WebGLCanvas.getWebGLContext():'
        if ( this.debug )
            Log(`${fname} begins.`)

        let first = false 
        if ( typeof(this.context) === 'undefined' ) 
            first = true 
        
        if ( this.debug && first )
        {   
            Log(`${fname} first call`)
        }

        this.try_webgl2 = true // set this to 'false' to debug WebGL 1 code on a WebGL 1 & 2 capable desktop browser
        this.context    = null

        if ( this.try_webgl2 )
        {
            this.context = this.canvas_elem.getContext('webgl2')
            if ( this.context === null )
                Log(`cannot have a webgl 2 canvas, will try web gl 1`)
            else 
                this.webgl_version = 2
        }
        if ( this.context === null )
        {
            this.context = this.canvas_elem.getContext('webgl')
            if ( this.context === null )
            {   
                const str = `${fname} unable to properly create a WebGL canvas on this device`
                this.webgl_version = 0
                Log(str) 
                throw RangeError(str)
            }
            else
                this.webgl_version = 1
        }
        
        if ( this.debug )
        {   
            Log(`${fname} using WebGL version ${this.webgl_version}.`)
            Log(`${fname} ends.`)
        }
    }
    // ------------------------------------------------------------------------------------------------

    resize()
    {
        this.canvas_elem.width  = this.parent_elem.clientWidth
        this.canvas_elem.height = this.parent_elem.clientHeight
        this.getWebGLContext()
        this.drawFrame()
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

    drawAxes()
    {
        const fname = 'WebGLCanvas.drawAxes():'
        let gl      = this.context
        
        
       if ( x_axe == null )
       {
           if ( this.debug )
            Log(`${fname} creating axes`)
            x_axe = new VertexArray( 0, 3, new Float32Array([ 0,0,0, 1,0,0 ]))
            y_axe = new VertexArray( 0, 3, new Float32Array([ 0,0,0, 0,1,0 ]))
            z_axe = new VertexArray( 0, 3, new Float32Array([ 0,0,0, 0,0,1 ]))
       } 
       gl.vertexAttrib3f( 1, 1.0, 0.1, 0.1 ) ; x_axe.draw( gl, gl.LINES )
       gl.vertexAttrib3f( 1, 0.2, 1.0, 0.2 ) ; y_axe.draw( gl, gl.LINES )
       gl.vertexAttrib3f( 1, 0.1, 0.8, 1.0 ) ; z_axe.draw( gl, gl.LINES )
    }
    // -------------------------------------------------------------------------------------------------

    drawGridXZ()
    {
        this.debug  = false
        const fname = 'WebGLCanvas.drawGrid():'
        let gl      = this.context
        let p       = this.program
        
        
        // create the X parallel line and the Z parallel lines
        if ( x_line == null || z_line == null )
        {
            if ( this.debug )
               Log(`${fname} creating lines`)
            
            const h = -0.003
            x_line = new VertexArray( 0, 3, new Float32Array([ 0,h,0, 1,h,0 ]))
            z_line = new VertexArray( 0, 3, new Float32Array([ 0,h,0, 0,h,1 ]))
        } 

        // draw the lines
        const from = -2.0, // grid extension in X and Z: lower limit
              to   = +2.0, // grid extension in X and Z: upper limit
              n    = 40,
              t    = Mat4_Translate([ from, 0, from ]),
              s    = Mat4_Scale    ([ to-from, 1, to-from ]),
              tz   = Mat4_Translate([ 0,   0, 1/n ]),
              tx   = Mat4_Translate([ 1/n, 0, 0   ])

        gl.vertexAttrib3f( 1,  0.5,0.5,0.5 )

        p.pushMM()
            p.compMM( t )
            p.compMM( s )  
            for( let i = 0 ; i <= n ; i++)
            {   x_line.draw( gl, gl.LINES )
                p.compMM( tz )
            }
        p.popMM()
        
        p.pushMM()
            p.compMM( t )
            p.compMM( s )  
            for( let i = 0 ; i <= n ; i++)
            {   z_line.draw( gl, gl.LINES )
                p.compMM( tx )
            }
        p.popMM()        
    }

    // -------------------------------------------------------------------------------------------------
    
    setModelviewProjection( gl, sx, sy )
    {
        CheckGLError( gl )
        
        const fname = 'setModelviewProjection():'

        if ( this.debug )
        {
            Log(`${fname} alpha ==${this.cam_alpha_deg}, beta == ${this.cam_beta_deg}`)
        }
        const 
            fovy_deg       = 60.0,
            ratio_vp       = sy/sx,
            near           = 0.05,
            far            = near+1000.0,
            transl_mat     = Mat4_Translate([0,0,-this.cam_dist]),
            rotx_mat       = Mat4_RotationXdeg( this.cam_beta_deg ),
            roty_mat       = Mat4_RotationYdeg( -this.cam_alpha_deg ),
            rotation_mat   = rotx_mat.compose( roty_mat ),
            modelview_mat  = transl_mat.compose( rotation_mat ),
            projection_mat = Mat4_Perspective( fovy_deg, ratio_vp, near, far )

        this.program.setViewMat( modelview_mat  )
        this.program.setProjMat( projection_mat )

        CheckGLError( gl )
    }
    // -------------------------------------------------------------------------------------------------

    /**
     * Draws a frame into the context and issues a 'gl.flush()' call at the end
     */
    drawFrame()
    {
        redraws_count = redraws_count +1 
        if ( this.debug )
        {
            Log(`---------------------------------------------------------`)
            Log(`WebGLCanvas.drawFrame: begins`)
            Log(`WebGLCanvas.drawFrame: redraws_count == ${redraws_count}`)
        }
        CheckGLError( this.context )

        //Log(`WebGLCanvas.drawFrame: redraws_count == ${redraws_count}`)

        // retrive context and size
        let gl   = this.context,
            pr   = this.program

        const sx = gl.drawingBufferWidth, 
              sy = gl.drawingBufferHeight 

        if ( this.debug )
            console.log(`WebGLCanvas.drawFrame: sx == ${sx}, sy == ${sy} `)

        // config the context
        gl.enable( gl.DEPTH_TEST )
       
        // clear screen, set viewport
        gl.clearColor(0.0, 0.1, 0.13, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT )
        gl.viewport(0, 0, sx, sy )
        CheckGLError( gl )

        // activate fragment+vertex shader
        pr.use()

        // do not shade ....
        pr.doShading( false )

        // set default color (attribute location 1)
        gl.vertexAttrib3f( 1, 0.9, 0.9, 0.9 )

        // set projection and modelview matrixes 
        this.setModelviewProjection( gl, sx, sy )

        // draw axes and grid (axes allways hide grid ....)
        this.drawGridXZ()
        this.drawAxes()
        
        // actually draw something.....(test)
        if ( this.loaded_object == null )
        {
            if ( this.test_3d_mesh == null )
                //this.test_3d_mesh = new SphereMesh( 300, 300 )
                //this.test_3d_mesh = new CylinderMesh( 300, 300 )
                this.test_3d_mesh = new ConeMesh( 1300, 1000 )

            pr.doShading(false)
            pr.pushMM()
                pr.compMM( new Mat4_Scale( [0.5, 0.5, 0.5] ) )
                this.test_3d_mesh.draw( gl )
            pr.popMM()
        }
        else
        {
            //console.log('drawing loaded object')
            pr.doShading(false)
            pr.pushMM()
                pr.compMM( new Mat4_Scale( [0.5, 0.5, 0.5] ) )
                this.loaded_object.draw( gl )
            pr.popMM()
        }

        // see: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices
        gl.flush()

        // done
        CheckGLError( gl )
        if ( this.debug )
        {   
            Log(`WebGLCanvas.drawFrame: ends`)
            Log(`---------------------------------------------------------`)
        }
    }
}

