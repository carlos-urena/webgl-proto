// -----------------------------------------------------------------------------
// File: wgl-canvas.js
// Includes class 'WebGLCanvas' (main canvas object, includes rendering code)
//
// MIT License 
// Copyright (c) 2020 Carlos Ureña 
// (see LICENSE file)
// -----------------------------------------------------------------------------

var redraws_count = 0
var initial_draw_axes = true 
var initial_draw_grid = true

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

        // Checks:

        CheckType( parent_id, 'string' )
        if ( parent_id == '' )
        {
            const msg = `${fname} An empty parent id string has been given to 'WebGLCanvas' constructor`
            Log( msg )
            throw RangeError( msg )
        }

        const canvas_id        = parent_id+"_canvas_id",
              prev_canvas_elem = document.getElementById( this.canvas_id )

        if ( prev_canvas_elem != null )
        {   const msg = `${fname} error: the page tried to create a canvas with an identifier already in use`
            Log( msg )
            throw RangeError( msg )
        }

        // 'this' object properties initialization
        
        // Check the parent element exists and retrieve it
        this.parent_elem   = BuscarElemId( parent_id )
        this.parent_id     = parent_id

        // Create and configure the canvas element 
        // (its size is that of parent element, which is typically a 'div')

        this.canvas_id          = canvas_id
        this.canvas_elem        = document.createElement('canvas')
        this.canvas_elem.id     = this.canvas_id 
        this.canvas_elem.width  = this.parent_elem.clientWidth
        this.canvas_elem.height = this.parent_elem.clientHeight
        this.innerHTML          = `Tu navegador u ordendor parece no soportar <code>&lt;canvas&gt;</code>.<br/>
                                   <i>It looks like your browser or computer does not support <code>&lt;canvas&gt;</code> element.</i>`
        
        // visualize axes, grid 
        this.draw_axes = initial_draw_axes 
        this.draw_grid = initial_draw_grid

        // visualization context, and program
        this.vis_ctx = new VisContext()
        
        // objects to be drawn: 3d mesh used to test 'IndexedTriangleMesh' class  and 'loaded_object'
        this.test_3d_mesh  = null 
        this.loaded_object = null

        // gl texture, null before any object has been loaded
        this.gl_texture = null 

        // set mouse events state info
        this.is_mouse_left_down  = false
        this.is_mouse_right_down = false
        this.drag_prev_pos_x     = -1
        this.drag_prev_pos_y     = -1

        // we already have not started loading any 3d model
        this.loaded_object  = null
        this.is_loading_files = false 

        // hit object which is drawn on eahc hit point
        this.hit_object = null 

        // create the panel sections list, add the config section 
        this.sections_list  = new PanelSectionsList()
        

        // create the grid and axes drawable objects
        this.gridXZ = new GridLinesXZ()
        this.axes   = new Axes()

        // creat  the peephole status object
        this.peeph_st = 
            {   draw   : false, // draw iif this is true
                pix_x  : 0.0,   // position Y (in pixels)
                pix_y  : 0.0,   // position X (in pixels)
                dy_px  : 60,    // Delta y (in pixels)
                varr   : null   // vertex array 
            } 

        // get canvas button elements
        this.help_button       = BuscarElemId('help_button_id')
        this.log_button        = BuscarElemId('log_button_id')
       
        
        // add the canvas element to the page
        this.parent_elem.appendChild( this.canvas_elem )

        // Create the WebGL context for this canvas, if it is not possible, return.
        this.getWebGLContext() // assigns to 'this.vis_ctx.wgl_ctx' and 'this.vis_ctx.wgl_ver'

        // Create GPU Program (= vertex shader + fragment shader)
        this.vis_ctx.program = new SimpleGPUProgram( this.vis_ctx.wgl_ctx )

        // Create the camera 
        this.camera_proj_type_str = 'Perspective'
        this.vis_ctx.camera = new OrbitalCamera( this.camera_proj_type_str )

        /// ADD Various event handlers

        // prevent the context menu from appearing, typically after a right click
        this.canvas_elem.addEventListener('contextmenu', e => e.preventDefault() )

        // sets mouse events handlers 
        this.canvas_elem.addEventListener( 'mousedown', e => this.mouseDown(e), true )
        this.canvas_elem.addEventListener( 'mouseup',   e => this.mouseUp(e), true )
        this.canvas_elem.addEventListener( 'mousemove', e => this.mouseMove(e), true )
        this.canvas_elem.addEventListener( 'wheel',     e => this.mouseWheel(e), true )
        this.canvas_elem.addEventListener( 'mouseover', e => this.mouseOver(e), true )

        this.canvas_elem.addEventListener( 'click',     e => this.mouseClick(e), true )

        // body events ...
        document.body.addEventListener( 'mouseleave', e => this.bodyMouseLeave(e), true )
        document.body.addEventListener( 'mouseover',  e => this.bodyMouseOver(e), true ) 

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
       

        // add button click event handlers

        if ( this.help_button != null )
            this.help_button.addEventListener( 'click', e => this.helpButtonClicked(e) )
        
        if ( this.log_button != null )
            //this.log_button.addEventListener( 'click', e => ShowLogWin() )
            this.log_button.onclick = e => ShowLogWin()

        //if ( this.clear_pnts_button != null )
        //    this.clear_pnts_button.addEventListener( 'click', e => this.clearPnts(e) )

        // call 'this.dragDrop' when the user drops some files on this canvas element
        this.canvas_elem.addEventListener( 'drop', e => this.dragDrop(e), true )

        // keys pressed down/released on the canvas 
        window.addEventListener( 'keydown', e =>this.keyDown(e), true )
        window.addEventListener( 'keyup',   e =>this.keyUp(e), true  )

        if ( this.debug )
            Log(`${fname} WebGLCanvas constructor: end`)
    }
    // -------------------------------------------------------------------------------------------------
    setDrawAxes( new_draw_axes )
    {
        this.draw_axes = new_draw_axes 
        this.drawFrame()
    }
    // -------------------------------------------------------------------------------------------------
    setDrawGrid( new_draw_grid )
    {
        this.draw_grid = new_draw_grid 
        this.drawFrame()
    }
    // -------------------------------------------------------------------------------------------------

    setCameraProjTypeStr( new_camera_proj_type_str )
    {
        const fname = 'WebGLCanvas.setCameraProjTypeStr():'
        Log(`${fname} - camera proj type set to: '${new_camera_proj_type_str}'`)
        this.camera_proj_type_str = new_camera_proj_type_str 
        this.vis_ctx.camera.setProjTypeStr( this.camera_proj_type_str )
        this.drawFrame()
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
    // -------------------------------------------------------------------------------
    /**
     * Adds a ray to the scene (it is transformed by the inverse scene matrix)
     * @param {Ray} ray 
     */
    addRay( ray )
    {
        const fname = 'WebGLCanvas.addRay():'

        if ( this.sections_list == null )
        {
            alert("there is no object being displayed !!! how did you got here ??")
            ErrorBeep()
            return
        }

        let section = this.sections_list.getCurrObjSection()
        if ( section == null )
        {
            Log(`${fname} section es null`)
            return
        }
        section.addRay( ray )
        this.drawFrame()

    }
    // -------------------------------------------------------------------------------
    /**
     * Draw all the rays and of the hit point in this.debug_rays
     */
    drawHitPnts()
    {
        const fname = 'WebGLCanvas.drawHitPnts():'
        
        if ( this.sections_list == null )
            return
        
        let section = this.sections_list.getCurrObjSection()
        
        if ( section == null )
            return
        
        if ( this.hit_object == null )
            this.hit_object = new SphereMesh( 32, 32 )
        
        section.drawHitPoints( this.vis_ctx, this.hit_object )
    }
    // -------------------------------------------------------------------------------
    drawPeephole()
    {
        if ( ! this.peeph_st.draw  )
            return

        const fname = 'WebGLCanvas.drawPeephole():'
        let gl = this.vis_ctx.wgl_ctx

        // generate the vertex array pnts, 
        // coordinates are in pixels units, 2D (z=0), relative to cursor pos.

        if ( this.peeph_st.varr == null )
        {
            // peeph_st.dy_px == vertical distance in pixels from cursor pos to circunference center)
            const n  = 32,       // number of segments for the circunference
                  nv = 2*(n+5),  // num of vertexes: n for circunference + 1 for vertical segm. + 4 radial segments
                  r  = this.peeph_st.dy_px * 0.5,  // circunference radius 
                  cy  = this.peeph_st.dy_px,    // Y-coord of circunference center
                  p  = new Float32Array( 3*nv )

            // generate points in circunference (2*n pnts)
            for( let i = 0 ; i < n ; i++ )
            {
                const a0 = (i*2.0*Math.PI)/n,
                      a1 = ((i+1)*2.0*Math.PI)/n,
                      b  = 6*i

                p[ b+0 ] = r*Math.cos( a0 )
                p[ b+1 ] = r*Math.sin( a0 ) + cy
                p[ b+2 ] = 0.0

                p[ b+3 ] = r*Math.cos( a1 )
                p[ b+4 ] = r*Math.sin( a1 ) + cy
                p[ b+5 ] = 0.0
            }
            // generate the vertical segment
            const b = 6*n 
            p[ b+0 ] = 0.0 ; p[ b+1 ] = 0.0    ; p[ b+2 ] = 0.0 
            p[ b+3 ] = 0.0 ; p[ b+4 ] = cy - r ; p[ b+5 ] = 0.0 

            // generate the four radial segments
            const rin = r*0.2 
            let   k   = 0 

            // east
            k = 6*(n+1)
            p[k+0] = rin ; p[k+1] = cy ; p[k+2] = 0.0
            p[k+3] = r   ; p[k+4] = cy ; p[k+5] = 0.0

            // west
            k = 6*(n+2) 
            p[k+0] = -rin  ; p[k+1] = cy ; p[k+2] = 0.0
            p[k+3] = -r    ; p[k+4] = cy ; p[k+5] = 0.0

            // north 
            k = 6*(n+3) 
            p[k+0] = 0.0  ; p[k+1] = cy+rin ; p[k+2] = 0.0
            p[k+3] = 0.0  ; p[k+4] = cy+r   ; p[k+5] = 0.0

            // south
            k = 6*(n+4) 
            p[k+0] = 0.0  ; p[k+1] = cy-rin ; p[k+2] = 0.0
            p[k+3] = 0.0  ; p[k+4] = cy-r   ; p[k+5] = 0.0

            // generate the vertex array 
            this.peeph_st.varr = new VertexArray( 0, 3, p )
        }

        // get viewport size 

        const sx    = this.vis_ctx.camera.viewport.width,
              sy    = this.vis_ctx.camera.viewport.height,
              cur_x = this.peeph_st.pix_x, 
              cur_y = this.peeph_st.pix_y,
              Ms    = Mat4_Scale([ 2.0/sx, 2.0/sy, 0.0 ]),
              Mt    = Mat4_Translate([ -1.0, -1.0, 0.0 ]),
              MV    = Mat4_Translate([ cur_x, cur_y, 0.0 ]),
              PR    = Mt.compose( Ms )

        //Log(`PEEPHOLE draw cur_x, cur_y  == ${cur_x}, ${cur_y}`)
        // draw (we assume the 'viewport' call has already been done)
        let pr = this.vis_ctx.program 
        pr.doShading( false )
        pr.useTexture( null )
        gl.vertexAttrib3f( 1, 1.0,1.0,1.0 )
        gl.disable( gl.DEPTH_TEST )
        pr.setViewMat( MV )
        pr.setProjMat( PR )
        this.peeph_st.varr.draw( gl, gl.LINES )
    }

    // -------------------------------------------------------------------------------------------------
    helpButtonClicked( evt )
    {
        this.setStatus('help button clicked')
    }
    // -------------------------------------------------------------------------------------------------
    keyDown( evt )  // key event
    {
        const msg = `keydown -- code == ${evt.code}` ;
        this.setStatus( msg )
    }
    // -------------------------------------------------------------------------------------------------
    keyUp( evt )
    {
        const msg = `keyup -- code == ${evt.code}` ;
        this.setStatus( msg )
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

        if ( this.is_loading_files )
            return

        if ( mevent.button != 0 && mevent.button != 2 )
            return true 

        if ( mevent.button === 0 )
        {    this.is_mouse_left_down = true
             // update peephole status 
            
            const rect  = this.canvas_elem.getBoundingClientRect(),
                  h     = rect.bottom - rect.top 
            
            Log(`${fname} h == ${h}`)

            this.peeph_st.draw = true 
            this.peeph_st.pix_x = mevent.clientX - rect.left
            this.peeph_st.pix_y = h - (mevent.clientY - rect.top)
            
            this.drawFrame()
            return
        }
        else if ( mevent.button === 2 )
        {   
            this.parent_elem.style.cursor = 'move'
            this.is_mouse_right_down = true
        }
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

        if ( this.is_loading_files )
            return

        if ( mevent.button === 0 )
        {   this.is_mouse_left_down = false
            this.peeph_st.draw = false
            return false
        }
        else if ( mevent.button === 2 )
        {
            this.is_mouse_right_down = false
            this.parent_elem.style.cursor = 'auto'
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

        const fname = 'WebGLCanvas.mouseMove():'
        CheckType( mevent, 'MouseEvent' )

        //Log(`${fname} begins`)

        if ( this.peeph_st.draw )
        {    
            const rect  = this.canvas_elem.getBoundingClientRect(),
                   h    = rect.bottom - rect.top 

            this.peeph_st.pix_x = mevent.clientX - rect.left
            this.peeph_st.pix_y = h - (mevent.clientY - rect.top)
            
            this.drawFrame()
            return true
        }

        if ( ! this.is_mouse_right_down )
            return true 

        
        // compute displacement from the original position ( where mouse button was pressed down)

        const drag_cur_pos_x = mevent.clientX ,
              drag_cur_pos_y = mevent.clientY ,
              dx             = drag_cur_pos_x - this.drag_prev_pos_x,
              dy             = drag_cur_pos_y - this.drag_prev_pos_y

        this.cLog(`mouse move: dx: ${dx}, dy: ${dy}`)

        this.drag_prev_pos_x = drag_cur_pos_x
        this.drag_prev_pos_y = drag_cur_pos_y

        if ( mevent.altKey && ! mevent.metaKey ) // ALT key (but not CMD key)
        {
            // update object angles
            let section = this.sections_list.getCurrObjSection()
            if ( section != null )
                section.updateObjectAngles( -dx*0.20, dy*0.10 )     
        }
        else if ( mevent.metaKey && ! mevent.altKey )  // CMD key or windows key ...
        {   
            // update object translation 
            let section = this.sections_list.getCurrObjSection()
            if ( section != null )
                section.updateObjectTranslation( dx*0.001, 0.0, dy*0.001 ) 
        }
        else 
        {   
            // update camera angles
            const facx = -0.2,
                  facy = 0.1
            this.vis_ctx.camera.moveXY( facx*dx, facy*dy )
        }
        // redraw:
        this.drawFrame()
        
        return false
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called right after a click has been done over the canvas (left mouse button has been raised)
     * @param {MouseEvent} mevent -- mouse event created by the browser
     */
    mouseClick( mevent )
    {
        mevent.stopImmediatePropagation() // neccesary? improves performance?
        mevent.preventDefault() // prevent default treatment of mouse up event

        const fname = 'WebGLCanvas.mouseClick(): '
        CheckType( mevent, 'MouseEvent' )
        Log(`${fname} begins, button == ${mevent.button}`)
        
        const rect  = this.canvas_elem.getBoundingClientRect(),
              siz_x = rect.right - rect.left,
              siz_y = rect.bottom - rect.top,
              pix_x = mevent.clientX - rect.left,
              pix_y = mevent.clientY - rect.top,
              gl = this.vis_ctx.getWglCtx(),
              gl_sx = gl.drawingBufferWidth, 
              gl_sy = gl.drawingBufferHeight,
              cy    = this.peeph_st.dy_px
        
        Log(`${fname} rect size x == ${siz_x}, size y == ${siz_y}`)
        Log(`${fname} gl   size x == ${gl_sx}, size y == ${gl_sy}`)
        Log(`${fname} pix  posi x == ${pix_x}, posi y == ${pix_y}`)

        if ( gl_sx <= pix_x  || pix_y <= cy || gl_sy <= pix_y   )
        {
            Log('click is out of canvas')
            return
        }

        
        const ray = this.vis_ctx.camera.genRay( pix_x, gl_sy - pix_y + cy )
        this.addRay( ray )
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
        
        // const fac = 0.002
        // this.cam_dist = Trunc( this.cam_dist + fac*wevent.deltaY, 0.1, 20.0 )
        
        if ( wevent.altKey )
        {
            const fac = 0.005
           
            let section = this.sections_list.getCurrObjSection()
            if ( section != null )
                section.updateObjectScale( fac*wevent.deltaY )
        }
        else
        {
            const fac = 0.002
            this.vis_ctx.camera.moveZ( fac*wevent.deltaY )
        }
        // redraw:
        this.drawFrame()
        
        return false 
    }
    // -------------------------------------------------------------------------------------------------

    /**
     * Called when the mouse enters the canvas element
     * (used to de-activate dragging when user raises button out of canvas, then enters canvas)
     * @param {MouseEvent} mevent 
     */
    mouseOver( mevent )
    {
        const fname = 'WebGLCanvas.mouseOver():'
        if ( this.debug )
            Log(`${fname}: begins buttons == ${mevent.buttons}, is loading == ${this.is_loading_files}`)
        
        if ( this.is_loading_files )
        {
            this.parent_elem.style.cursor = 'progress'
            document.body.style.cursor = 'progress'
            return 
        }

        // if the mouse enters the canvas but button 2 is released, set cursor to normal
        if ( (mevent.buttons & 2) == 0 )
        {
            this.is_mouse_right_down = false 
            this.parent_elem.style.cursor = 'auto'
        }
        
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
        this.cLog(msg)

        // update camera params
        const facx = -0.2,
              facy = 0.1
        this.vis_ctx.camera.moveXY( facx*dx, facy*dy )

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
     * Called when the mouse enters the page
     * (used to restore mouse pointer)
     * @param {DragEvent} devent -- drag event created by the browser
     */
    bodyMouseOver( mevent )
    {
        const fname = 'WebGLCanvas.bodyMouseOver():'
        CheckType( mevent, 'MouseEvent' )
        if ( this.debug )
            Log(`${fname} begins, is loading files == ${this.is_loading_files}`)

        if ( this.is_loading_files )
        {
            this.parent_elem.style.cursor = 'progress'
            document.body.style.cursor = 'progress'
        }
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * an attempt to avoid cursor changing after leaving and reentering the page 
     * in macOS, but it is not working
     * 
     * @param {MouseEvent} mevent 
     */
    bodyMouseLeave( mevent )
    {
        const fname = 'WebGLCanvas.bodyMouseLeave():'
        CheckType( mevent, 'MouseEvent' )
        if ( this.debug )
            Log(`${fname} begins, is loading files == ${this.is_loading_files}`)

        mevent.preventDefault()
        mevent.stopImmediatePropagation()
        mevent.stopPropagation()
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

        this.parent_elem.style.borderColor = 'rgb(50%,50%,50%)'

        if ( this.is_loading_files )
        {
            alert(`Sorry, already loading files, wait the load to end`)
            return
        }
    
        let file_list = devent.dataTransfer.files
        Log(`${fname} file list length == ${file_list.length}, file list class == ${file_list.constructor.name}`);
        
        if ( file_list.length == 0 ) // should not happen ....
            throw new Error(`${fname} 'file_list' length is 0`)

        // load all the files in the list, from the first one on
        this.loadFilesInList( file_list, 0 )

    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Loads files in a file list, from a position in the list to the end 
     * (this is done asynchronously, that is, control is returned to the event loop before load ends)
     *  
     *  
     * @param {FileList} file_list   -- FileList object with a sequence of file blobs, names, etc.. 
     * @param {number}   file_index  -- number of the file to process on the file list (starting at 0)
     */
    loadFilesInList( file_list, file_index )
    {
        const fname = 'WebGLCanvas.loadFilesInList():'
        CheckType( file_list, 'FileList' )
        CheckNat( file_index )
        Log(`${fname} starts from index ${file_index}`)

        
        if ( file_index == 0 )
        {
             // start loading file list
            document.body.style.cursor = 'progress'
            this.parent_elem.style.cursor = 'progress'
            this.is_loading_files = true 
        }
        else if ( file_index == file_list.length  )
        {   
             // if we have ended processing all files, redraw the frame to reflect changes
            document.body.style.cursor = 'auto'
            this.parent_elem.style.cursor = 'auto'
            
            Log(`${fname} ended processing file list`)
            this.is_loading_files = false 
            this.drawFrame()
           
            return
        }
        

        const file       = file_list.item( file_index ),
              extension  = file.name.split('.').pop().toLowerCase(), 
              msg1        = `Loading file '${file.name}' (${file_index+1}/${file_list.length}) ...`

        Log(`${fname} ${msg1}`)
        this.setStatus( msg1 )


        // set of valid image extensions Javascript can handle 
        // see: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img
        const image_extensions = ['bmp','gif','ico','jpg','jpeg','jfif','pjpeg','pjp','png','svg','webp']   
        
        // set of valid mesh files the code can handle
        const mesh_extensions  = ['ply','obj']

        // launch the loader/parser, according to file extension, then return
        
        if ( image_extensions.includes( extension ) )
        {
            /// Read the image, this is based on
            /// https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL

            let reader = new FileReader()
            reader.onloadend = e => this.imageFileLoaded( e, file_list, file_index )
            reader.onerror   = e => this.fileLoadError( e, file_list, file_index )
            reader.readAsDataURL( file )   // async read
            return   
        }

        if ( mesh_extensions.includes( extension ) )
        {
            
            const mb = Math.floor( 100.0*file.size/1024.0 )/ 100.0
            let  reader = new FileReader()
        
            reader.onload  = e => this.modelFileLoaded( e, file_list, file_index )  // or it should be 'onloadend' ??
            reader.onerror = e => this.fileLoadError( e, file_list, file_index )
            reader.readAsText( file )// , "UTF-8" )
            return
        }

        // we cannot process this extension, issue a warning and continue processing list (recursively)
        const msg2 = `Cannot process file '${file.name}', extension '${extension}' is not currently supported`
        Log(`${fname} ${msg2}`)
        alert( msg2 )

        this.loadFilesInList( file_list, next_file_number+1 )
    
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
     * Called after the JPG File (Blob) has been loaded, this  trigers decoding
     *   @param {ProgressEvent} evt              -- progress event ..
     *   @param {FileList}      file_list        -- file list with remaining files to load
     *   @param {number}        image_file_index -- position of the image file in the file list
     */
    imageFileLoaded( evt, file_list, image_file_index )
    {
        const fname = 'WebGLCanvas.imageFileLoaded():'
        CheckType( evt, 'ProgressEvent' )

        Log(`${fname} evt.target class == ${evt.target.constructor.name}`)
        Log(`${fname} evt.target result class == ${evt.target.result.constructor.name}`)
        
        /// create an Image object and then the WebGL texture .....
        /// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL
 
        Log(`${fname} image base 64 : "${evt.target.result.substring(0,60)}"`)  // if the result string is empty, something has gone wrong...
        let image  = new Image()
        image.onload  = e => this.imageFileDecoded( e, file_list, image_file_index )
        image.onerror = e => this.fileLoadError( e, file_list, image_file_index )
        image.src     = evt.target.result  /// this triggers decoding of the base64 text, then 'imageDecoded' is called
    }
    // -------------------------------------------------------------------------------------------------
    /**
     * Called after an image text has been decoded, this adds the JPG to the scene as a texture
     *   @param {ProgressEvent} evt 
     *   @param {FileList}      file_list        -- file list with remaining files to load
     *   @param {number}        image_file_index -- position of the image file in the file list
     */
    imageFileDecoded( evt, file_list, image_file_index )
    {
        const fname = 'WebGLCanvas.imageFileDecoded():'
        let   gl    = this.vis_ctx.wgl_ctx,
              image = evt.target 
        const file  = file_list.item( image_file_index ) 
        

        Log(`${fname} evt target class == '${image.constructor.name}'`)
        Log(`${fname} image object, width = ${image.width}, height = ${image.height} `)

        // Create the texture (should be in its own function). Again, see:
        // https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL

        const 
            level       = 0,
            internalFmt = gl.RGBA,   
            srcFmt      = gl.RGBA,      
            srcType     = gl.UNSIGNED_BYTE

        // create, bind and fill the texture
        const texture = gl.createTexture()
        gl.bindTexture( gl.TEXTURE_2D, texture )
        gl.texImage2D ( gl.TEXTURE_2D, level, internalFmt, srcFmt, srcType, image )

        // Generate MIPMAPS ....
        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) 
        {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap( gl.TEXTURE_2D )
            Log(`${fname} mipmap generated.`)
        } 
        else 
        {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            Log(`${fname} mipmap NOT generated.`)
        }

        // register the texture in 'this' instance, so it can be drawn
        ///gl.bindTexture( gl.TEXTURE_2D, null )  // unbind any texture ??? --> NO: yields warnings !
        //this.gl_texture = texture


        if ( this.sections_list != null ) // probably never happens
        {
            let section = this.sections_list.getCurrObjSection()
            if ( section != null )
            {   section.setTexture( texture, file.name )
                Log(`${fname} texture changed for the current section object`)
            }
        }
        // display a log messagge
        
        const msg1 = `Image file '${file.name}' loaded and decoded.` 
        Log(`${fname} ${msg1}`)
        this.setStatus( msg1 )

        /// load remaining file in list, if any
        this.loadFilesInList( file_list, image_file_index+1 )
    }
    // -------------------------------------------------------------------------------------------------
    /**
     *  called after an error during a file reading operation 
     *     @param {ProgressEvent} evt --  progress event ??
     *     @param {FileList}      file_list        -- sequence of 'File' objects 
     *     @param {number}        curr_file_index  -- position of the file (which load failed) in the list 
     */
    fileLoadError( evt, file_list, curr_file_index )
    {
        const fname = 'WebGLCanvas.fileLoadError():'
        const file = file_list.item( curr_file_index )
        let msg = `Unable to load or decode file '${file.name}': an unknown internal error ocurred.`
        Log( `${fname} ${msg}`)
        Log( `${fname} evt class == '${evt.constructor.name}'`)
        alert( msg )
        // load remaining files, if any
        this.loadFilesInList( file_list, curr_file_index+1 )
    }
    
    
    // -------------------------------------------------------------------------------------------------
    /**
     * Called after model file has been loaded, this adds the model object to the scene
     *   @param {ProgressEvent} evt 
     *   @param {FileList}      file_list        -- file list with remaining files to load
     *   @param {number}        model_file_index -- position of the mode file in the file list
     */
    modelFileLoaded( evt, file_list, model_file_index )
    {
        const fname = 'WebGLCanvas.modelFileLoaded():'
        CheckType( evt, 'ProgressEvent' )
        CheckType( file_list, 'FileList' )
        CheckNat( model_file_index )

        const file = file_list.item( model_file_index ),
              ext  = file.name.split('.').pop().toLowerCase()

        if ( this.debug )
        {   Log(`${fname} event class  == ${evt.constructor.name}`)
            Log(`${fname} result class == ${evt.target.result.constructor.name}`) 
            Log(`${fname} splitting lines ....` )
        }
        const lines          = evt.target.result.split('\n'),
              file_base_name = file.name
        let   loaded_object  = null 

        if ( ext == 'ply' )
            loaded_object = new TriMeshFromPLYLines( lines )   
        else if ( ext == 'obj' )
            loaded_object = new MultiMeshFromOBJLines( lines, file_base_name )
        else 
            throw new Error(`${fname}: unexpected file extension (shouldn't happen)`)
        
        if ( loaded_object.n_verts == 0 )
        {   this.setStatus(`Model file '${file.name}' couldn't be loaded.`)
            Log(`${fname} couldn't load model file`)
        }
        else
        {   this.loaded_object = loaded_object
            const msg = `Model file '${file.name}' loaded ok. (núm. verts: ${this.loaded_object.n_verts}, núm. triangles: ${this.loaded_object.n_tris}).`
            this.setStatus( msg )
            Log( msg )
        }

        /// test: add panel section for this object
        this.sections_list.addObjectSection( this.loaded_object )

        /// load remaining files, if any
        this.loadFilesInList( file_list, model_file_index+1 )
        
       
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
        if ( this.vis_ctx.wgl_ctx === null ) 
            first = true 
        
        if ( this.debug && first )
            Log(`${fname} first call`)

        let try_webgl2       = true // set this to 'false' to debug WebGL 1 code on a WebGL 1 & 2 capable desktop browser
        
        let gl               = null
        let wgl_ver          = 0
        this.vis_ctx.wgl_ctx = gl
        this.vis_ctx.wgl_ver = wgl_ver

        
        if ( try_webgl2 )
        {
            gl = this.canvas_elem.getContext('webgl2')
            if ( gl === null )
                Log(`cannot have a webgl 2 canvas, will try web gl 1`)
            else 
                wgl_ver = 2
        }
        if ( gl === null )
        {
            gl = this.canvas_elem.getContext('webgl')
            if ( gl === null )
            {   
                const str = `${fname} unable to properly create a WebGL canvas on this device`
                Log(str) 
                throw RangeError(str)
            }
            else
                wgl_ver = 1
        }

        this.vis_ctx.wgl_ctx = gl 
        this.vis_ctx.wgl_ver = wgl_ver 

        // enable 32 bits unsigned ints extension
        if ( first )
        {
            Log(`${fname} first call`)
            if ( this.debug )
                Log( `${fname} extensions: ${this.context.getSupportedExtensions()}` )

            this.showGLVersionInfo()
            
            if ( wgl_ver == 1 )
            {
                if ( gl.getExtension('OES_element_index_uint') == null )
                {
                    Log( `${fname} WARNING: recommended extension 'OES_element_index_uint' is not supported in this device` )
                    this.vis_ctx.has_32bits_indexes = false // adding a property to a library class object here .... does it works???
                }
                else 
                {
                    Log( `${fname} extension 'OES_element_index_uint' is available` )
                    this.vis_ctx.has_32bits_indexes = true 
                }
            }
            else if ( wgl_ver == 0 )
            {
                const msg = `${fname} Unable to create a webgl canvas, neither ver 1 nor ver 2`
                Log( msg )
                throw Error( msg )
            }
        }
        
        if ( this.debug )
            Log(`${fname} ends.`)
    }
    // ------------------------------------------------------------------------------------------------

    resize()
    {
        this.canvas_elem.width  = this.parent_elem.clientWidth
        this.canvas_elem.height = this.parent_elem.clientHeight
        this.getWebGLContext()

        const gl = this.vis_ctx.getWglCtx(),
              sx = gl.drawingBufferWidth, 
              sy = gl.drawingBufferHeight 

        this.vis_ctx.camera.setViewport( new Viewport(sx,sy) )
        this.drawFrame()
    }

    // -------------------------------------------------------------------------------------------------
    /** 
    * shows info about WebGL/OpenGL version, if the element with id 'info_div_id' exists 
    */
    showGLVersionInfo()
    {
        
        const fname = 'WebGLCanvas.showGLVersionInfo():'
        if ( this.vis_ctx.wgl_ver == 0 )
        {
            throw new Error("Error: unable to initialize WebGL properly.")
            return 
        }

        // gather info
        let 
            gl         = this.vis_ctx.wgl_ctx, 
            ctx_class  = gl.constructor.name,
            gl_vendor  = gl.getParameter(gl.VENDOR),
            gl_version = gl.getParameter(gl.VERSION)
        
        // show info on the div (as a table)
        const 
            info_str   = 
            `${fname} WEBGL info   
                WebGL version : ${this.vis_ctx.wgl_ver}
                Context class : ${ctx_class}
                Vendor        : ${gl_vendor}
                Version       : ${gl_version}  
            `
        Log( info_str )
        
    }
    // -------------------------------------------------------------------------------------------------

    /**
     * Draws a frame into the context and issues a 'gl.flush()' call at the end
     */
    drawFrame()
    {
        const fname = 'WebGLCanvas.drawFrame(): '
        redraws_count = redraws_count +1 
        if ( this.debug )
        {
            Log(`---------------------------------------------------------`)
            Log(`WebGLCanvas.drawFrame: begins`)
            Log(`WebGLCanvas.drawFrame: redraws_count == ${redraws_count}`)
        }
        CheckGLError( this.context )

        //Log(`WebGLCanvas.drawFrame: redraws_count == ${redraws_count}`)

        // retrive webgl context, shader program, viewport size
        let gl  = this.vis_ctx.getWglCtx(),
            pr  = this.vis_ctx.getProgram()

        const sx = this.vis_ctx.camera.viewport.width,
              sy = this.vis_ctx.camera.viewport.height

        if ( this.debug )
            console.log(`${fname} sx == ${sx}, sy == ${sy} `)

        // config the context
        gl.enable( gl.DEPTH_TEST )
       
        // clear screen, set viewport
        gl.clearColor(0.0, 0.1, 0.13, 1.0)
        gl.clear( gl.COLOR_BUFFER_BIT  | gl.DEPTH_BUFFER_BIT )
        gl.viewport(0, 0, sx, sy )
        CheckGLError( gl )

        // activate fragment+vertex shader
        pr.use()

        // do not shade ....
        pr.doShading( false )
        pr.useTexture( null )

        // enable depth test (just in case)
        gl.enable( gl.DEPTH_TEST )

        // set default color (attribute location 1)
        gl.vertexAttrib3f( 1, 0.9, 0.9, 0.9 )

        // activate the current camera (sets projection and modelview matrixes in the shader prog)
        this.vis_ctx.camera.activate( this.vis_ctx )

        // set uniform with observer position 
        pr.setObserverPosWCC( this.vis_ctx.camera.getObserverPosWCC() )

        // draw axes and grid (axes allways hide grid ....)
        if ( this.draw_grid )
            this.gridXZ.draw( this.vis_ctx )
        
        if ( this.draw_axes )
            this.axes.draw( this.vis_ctx )
 
        if ( this.sections_list != null )
        {
            let section = this.sections_list.getCurrObjSection()
            if ( section != null )
                section.draw_object( this.vis_ctx )
        }

        // debug
        this.drawHitPnts()    

        // draw the peep hole, if neccesary (this trashes pipeline status, must be done at the end)
        this.drawPeephole()

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


} // end class WebGLCanvas
