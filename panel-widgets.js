// -----------------------------------------------------------------------------
// File: panel-widgets.js
// Includes classes 'PanelSection', 'PanelSectionsList', 'Widget' and derived
//
// MIT License 
// Copyright (c) 2020 Carlos Ureña 
// (see LICENSE file)
// -----------------------------------------------------------------------------

// (// see geometric shapes: https://en.wikipedia.org/wiki/Geometric_Shapes)
const right_triangle_html = '&#9654;',
      down_triangle_html  = '&#9660;'


// -------------------------------------------------------------------------------------------------
class PanelSection 
{
    /**
     * 
     * @param {String} name     -- name or title for this section
     * @param {number} number   -- an unique sequential section number
     * @param {PanelSectionsList} sections_list - the sections list referencing this section
     */
    constructor( name, number, sections_list )
    {
        const fname = 'PanelSection.constructor():'

        this.sections_list = sections_list
        this.name    = name
        this.number  = number
        this.ident   = 'panel_sect_'+this.number.toString()
        this.status  = 'visible'


         // create section div (orphan)
        this.root_elem = CreateElem( 'div', this.ident+'_id', 'panel_sect_class', null )

        // create head div inside section div
        this.head_elem = CreateElem( 'div', this.ident+'_head_id', 'section_head_class', this.root_elem )
        this.head_elem.style.cursor = 'pointer'
        this.head_elem.style.color  = 'sandybrown'

        // create the triangle span inside the head div
        this.triangle_id   = this.ident+'_triangle_id'
        this.triangle_elem = CreateElem( 'span', this.triangle_id, 'section_triangle_class', this.head_elem )
        this.triangle_elem.innerHTML = down_triangle_html+'&nbsp;' 

        // create the name span inside the head div
        this.name_id   = this.ident+'_name_id'
        this.name_elem = CreateElem( 'span', this.name_id, 'section_name_class', this.head_elem )
        this.name_elem.style.fontWeight = 'bold'
        this.name_elem.style.fontSize   = '15pt'
        this.name_elem.innerHTML        = this.name
        
        // create the content div elem
        this.content_id = this.ident + '_content_id'
        this.content_elem = CreateElem( 'div', this.content_id, 'section_content_class', this.root_elem )
        this.content_elem.style.display = 'block'
        
        // add event listeners for clicks on the head elem
        this.triangle_elem.addEventListener( 'click', e => this.triangleClick(e) )
        this.name_elem.addEventListener( 'click', e => this.nameClick(e) )
    }
    // -------------------------------------------------------------------------------------------------

    triangleClick( mevent )
    {
        //Log('triangle click')
        let tri = document.getElementById( this.triangle_id )
        if ( this.status == 'visible')
        {
            this.status = 'hidden'
            tri.innerHTML = right_triangle_html+'&nbsp;'
            this.content_elem.style.display = 'none'
        }
        else 
        {
            this.status = 'visible'
            tri.innerHTML = down_triangle_html+'&nbsp;'
            this.content_elem.style.display = 'block'
        }
    }

    nameClick()
    {
        const fname = 'PanelSection.nameClick():'
        //Log(`${fname} name click on base section class, name == '${this.name}', num = ${this.number}`)
       
    }
}
// -------------------------------------------------------------------------------------------------
// A panel section for information about a drawable object 
// (must define constructor and 'populateContent')

class ObjectPanelSection extends PanelSection
{
    // --------------------------------------------------------------------------------------
    /**
     * 
     * @param {DrawableObject} base_object -- any object of a class derived from DrawableObject
     * @param {number} number               -- a unique serial number for this section
     */
    constructor( base_object, number, sections_list  )
    {
        const base_name = 'name' in base_object  ? base_object.name : 'unknown name'
        
        super( base_name, number, sections_list )
        
        this.do_shading      = false 
        this.do_texture      = true
        this.gl_texture      = null 
        this.object          = base_object

        this.obj_alpha_deg   = 0.0              // object rotation angles (alpha)
        this.obj_beta_deg    = 0.0              // object rotation angles (beta)
        this.obj_scale       = 1.0              // object scale 

        this.obj_transl_x    = 0.0    // object translation transform, (initially none)
        this.obj_transl_y    = 0.0
        this.obj_transl_z    = 0.0

        this.obj_tr_mat      = Mat4_Identity()  // scene transform matrix (rotation + scale)
        this.obj_tr_mat_inv  = Mat4_Identity()  // inverse of scene_tr_mat

        this.debug_rays        = []
        this.texture           = null 
        this.texture_name      = 'none'
        this.texture_name_elem = null 
        
        this.texture_name_elem  = CreateElem( 'div', this.ident+'_texture_name_id', 'section_texture_div', this.content_elem )
        this.texture_name_elem.style.marginTop = '12px' 
        this.updateTextureNameElem()

        this.use_texture = true
        this.use_texture_widget = new CheckWidget( this.ident+'_use_texture', 'Use current texture', this.content_elem, this.use_texture, new_value => 
        {   this.use_texture = new_value
            canvas.drawFrame()
        })

        this.do_shading = true
        this.do_shading_widget = new CheckWidget( this.ident+'_do_shading',  'Do shading', this.content_elem, this.do_shading, new_value => 
        {   this.do_shading = new_value
            canvas.drawFrame()
        }) 

        this.flip_axes = false
        this.flip_widget = new CheckWidget( this.ident+'_flip', 'Flip Y/Z axes', this.content_elem, this.flip_axes, new_value => 
        {   this.flip_axes = new_value 
            this.updateObjectTransformMat()
            canvas.drawFrame()
        })
        
        this.draw_hit_pnts = true
        this.draw_hit_pnts_widget = new CheckWidget( this.ident+'_dhp', 'Draw hit points', this.content_elem, this.draw_hit_pnts, new_value => 
        {   this.draw_hit_pnts = new_value 
            canvas.drawFrame()
        })

    }
    // --------------------------------------------------------------------------------------

    nameClick()
    {
        const fname = 'ObjectPanelSection.nameClick():'
        //Log(`${fname} name click on object section class, name == '${this.name}', num = ${this.number}`)
        this.sections_list.setCurrObjSection( this.number )
        
    }
    // --------------------------------------------------------------------------------------

    updateObjectAngles( dalpha, dbeta )
    {
        this.obj_alpha_deg = Trunc( this.obj_alpha_deg + dalpha, -360, +360 )
        this.obj_beta_deg = Trunc( this.obj_beta_deg + dbeta, -88, +88 )
        this.updateObjectTransformMat()
    }
    // ---------------------------------------------------------------------------------------

    updateObjectTranslation( dx, dy, dz )
    {
        this.obj_transl_x += dx
        this.obj_transl_y += dy
        this.obj_transl_z += dz
        this.updateObjectTransformMat()
    }
    // --------------------------------------------------------------------------------------

    updateObjectScale( dscale )
    {
        this.obj_scale = Math.max( 0.03, ( this.obj_scale + dscale ))
        this.updateObjectTransformMat()
    }
    // --------------------------------------------------------------------------------------

    updateObjectTransformMat()
    {
        //Log(`updating object transform mat ...`)
        const 
            rotx_mat    = Mat4_RotationXdeg( this.obj_beta_deg ),
            roty_mat    = Mat4_RotationYdeg( -this.obj_alpha_deg ),
            scale_mat   = Mat4_Scale([ this.obj_scale, this.obj_scale, this.obj_scale ]),
            transl_mat  = Mat4_Translate([ this.obj_transl_x, this.obj_transl_y, this.obj_transl_z ])
        let
            initial_mat = Mat4_Identity()

        if ( this.flip_axes )
        {
            initial_mat = new Mat4
            ([  [ -1,  0,  0,  0 ], // negate X so orientation is preserved ...
                [  0,  0,  1,  0 ], // exchange Y <--> Z
                [  0,  1,  0,  0 ],
                [  0,  0,  0,  1 ]
            ])
        }
        
        this.obj_tr_mat     = initial_mat.compose( scale_mat ).compose( rotx_mat ).compose( roty_mat ).compose( transl_mat )
        this.obj_tr_mat_inv = this.obj_tr_mat.inverse()
    }
    // --------------------------------------------------------------------------------------
    updateTextureNameElem()
    {
        Log(`UPTNE : this.texture_name_elem == ${this.texture_name_elem}`)
        this.texture_name_elem.innerHTML = `Texture: ${this.texture_name}`
    }
    // --------------------------------------------------------------------------------------

    
    /**
     * Set a new texture for this section's object
     * @param {WebGLTexture} new_texture -- texture to use for this object, can be null 
     *                                       (when it is null, the program texture status is not changed when rendering this object)
     * @param {String}       new_texture_name -- visible name for this texture
     */
    setTexture( new_texture, new_texture_name )
    {
        this.texture      = new_texture
        this.texture_name = (this.texture != null) ? new_texture_name : 'none'
        this.updateTextureNameElem()
    }
    
    // --------------------------------------------------------------------------------------
    addRay( ray )
    {
        const fname = 'ObjectPanelSection.addRay():'
        const x0_org = ray.org,
              x1_org = ray.org.plus( ray.dir ),
              x0_wc     = this.obj_tr_mat_inv.apply_to( x0_org, 1 ),
              x1_wc     = this.obj_tr_mat_inv.apply_to( x1_org, 1 )


        // test: intersect ray with scene  
        let ray_wc   = new Ray( x0_wc, x1_wc.minus(x0_wc) ) // transformed ray
        let obj      = this.object
        let hit_data = { hit: false, dist: -1, it: -1 } // todo: add group (move to hit_data to its own class??)

        Log(`${fname} STARTS intersection .....`)
        
        zero_det_count     = 0
        ray_tri_int_count  = 0 

        obj.intersectRay( ray_wc, hit_data )

        Log(`${fname} END ray-tri code.`)
        Log(`${fname} total ray-tri count == ${ray_tri_int_count} / almost zero det count == ${zero_det_count}`)
        Log(`${fname} hit_data.hit == #### ${hit_data.hit} ####`)
        
        if ( hit_data.hit )
        {
            Log(`${fname} HIT it = ${hit_data.it}, dist = ${hit_data.dist}`)
            
            let x1_wc_dist = x0_wc.plus( ray_wc.dir.scale( hit_data.dist ))
            this.debug_rays.push( { start_pnt: x0_wc, end_pnt: x1_wc_dist, vertex_arr: null } )
            //let audio = document.getElementById('audio_ok_id')
            canvas.setStatus(`Found intersection: added point # ${this.debug_rays.length}`)
            //if ( audio !== null )
            //    audio.play()
            HitBeep()
        }
        else
        {
            canvas.setStatus('Intersection not found')
            // let audio = document.getElementById('audio_error_id')
            // if ( audio !== null )
            //     audio.play()
            NohitBeep()
        }
    }
    // --------------------------------------------------------------------------------------

    drawHitPoints( vis_ctx, hit_object )
    {
        if ( ! this.draw_hit_pnts )
            return 
            
        let gl = vis_ctx.wgl_ctx,
            pr = vis_ctx.program
        const 
            rb = 0.005

        pr.useTexture( null )
    
        pr.pushMM()
            pr.compMM( this.obj_tr_mat )

            pr.doShading( false )
            gl.vertexAttrib3f( 1, 1.0,1.0,1.0 )
            
            for( let ray of this.debug_rays )
            {
                // draw ray segment 
                if ( ray.vertex_arr == null )
                {
                    const a = ray.start_pnt,
                        b = ray.end_pnt
                    ray.vertex_arr = new VertexArray( 0, 3, 
                            new Float32Array([ a[0], a[1], a[2], b[0], b[1], b[2] ]) )
                }
                ray.vertex_arr.draw( gl, gl.LINES )
            }

            gl.vertexAttrib3f( 1, 1.2, 0.8, 0.7 )
            pr.doShading( true )

            for( let ray of this.debug_rays )
            {
                // draw sphere at ray end
                pr.pushMM()
                    pr.compMM( Mat4_Translate([ ray.end_pnt[0], ray.end_pnt[1], ray.end_pnt[2] ]) )
                    pr.compMM( Mat4_Scale([ rb, rb, rb ]) )
                    hit_object.draw( vis_ctx )
                pr.popMM()
            }
        pr.popMM()
    }
    // --------------------------------------------------------------------------------------

    draw_object( vis_ctx )
    {
        let pr = vis_ctx.program 
        let gl = vis_ctx.wgl_ctx 

        // base color for all vertexes used when the model has no vertex colors
        gl.vertexAttrib3f( 1, 0.0,0.6,1.0 )

        if ( this.texture != null && this.use_texture ) 
            pr.useTexture( this.texture )
        else
            pr.useTexture( null ) 

        pr.doShading( this.do_shading )
        
        pr.pushMM()
            pr.compMM( this.obj_tr_mat )
            this.object.draw( vis_ctx )
        pr.popMM()
        
        pr.doShading( true )
        pr.useTexture( null )
    }
}
// -------------------------------------------------------------------------------------------------

var sections_counter = 0

class PanelSectionsList
{
    constructor()
    {
        this.panel_elem   = BuscarElemId('right_panel_id') // panel element on the page DOM
        this.sections     = new Map()   // map witj keys == sections numbers, values == sections
        this.curr_section = null        // current object type section

        this.addConfigSection()  // add first section for global configuration parameters
    }
    /**
     * Add a section to the panel
     * @param {PanelSection} section  -- class 'PanelSection' or derived 
     */
    addObjectSection( obj )
    {
        Check( obj != null )

        sections_counter ++
        let section = new ObjectPanelSection( obj, sections_counter, this )
        this.sections.set( sections_counter, section )
        this.panel_elem.appendChild( section.root_elem )
        this.setCurrObjSection( sections_counter )

    }
    /**
     * Adds the configuration section to the panel
     * @param {PanelSection} section  -- class 'PanelSection' or derived 
     */
    addConfigSection(  )
    {
        sections_counter ++

        // create section 
        let section = new ConfigPanelSection( sections_counter, this )
         
        // add the section to the dictionary and the DOM
        this.sections.set( sections_counter, section )
        this.panel_elem.appendChild( section.root_elem )
    }
    /**
     * Sets the current object section
     */
    setCurrObjSection( section_number )
    {
        const fname = 'PanelSectionsList.setCurrObjSection():'
        

        if ( ! this.sections.has( section_number ) )
        {
            ErrorBeep()
            throw new Error(`the sections list has not this section number ${section_number}`)
        }
        let section = this.sections.get( section_number )
        Log(`${fname} name click on obj section, name == '${section.name}', num == ${section.number}`)
        
        if ( this.curr_section != null )
            this.curr_section.root_elem.style.backgroundColor = 'rgb(20%,20%,20%)'
        this.curr_section = section 
        this.curr_section.root_elem.style.backgroundColor = 'rgb(30%,30%,30%)'

        canvas.drawFrame()
    }
    /**
     * 
     */
    getCurrObjSection()
    {
        return this.curr_section 
    }
}

// -------------------------------------------------------------------------------------------------
// A panel section for the global config information

class ConfigPanelSection extends PanelSection
{
    // --------------------------------------------------------------------------------------
    /**
     * 
     * @param {DrawableObject} base_object -- any object of a class derived from DrawableObject
     * @param {number} number               -- a unique serial number for this section
     */
    constructor( number, sections_list  )
    {
        super( 'Config', number, sections_list )
        
        // camera type dropdown
        const types = [ 'Perspective', 'Orthogonal' ]
        this.test_widget = new DropdownWidget( 'cfg_test_dd', 'Camera type', this.content_elem,  0, types, ( index, choice_str ) =>     
        {   
            //Log(`clicked on camera dropdown widget, index == ${index}, choice str == ${choice_str}`)
            canvas.setCameraProjTypeStr( choice_str )
        })

        // draw axes checkbox
        this.draw_axes_widget = new CheckWidget( 'cfg_draw_axes', 'Draw axes', this.content_elem, initial_draw_axes, new_value =>
        {
            //Log(`draw axes widget changed to '${new_value}'`)
            canvas.setDrawAxes( new_value )
        })

        // draw grid checkbox
        this.draw_grid_widget = new CheckWidget( 'cfg_draw_grid', 'Draw grid', this.content_elem, initial_draw_grid, new_value =>
        {
            //Log(`draw grid widget changed to '${new_value}'`)
            canvas.setDrawGrid( new_value )
        })
    }
}

// -------------------------------------------------------------------------------------------------

var widgets_dict = new Map()

class Widget 
{
    /**
     * Builds a new widget
     * @param {String}  ident  -- a unique string, with no spaces, which identifies the widget  
     * @param {String}  type   -- a string describing the type (can be 'check',)
     * @param {String}  text   -- text which is displayed along the widget
     */
    constructor( ident, type, text, parent_elem )
    {
        if ( widgets_dict.has( ident ))
            throw new Error(`cannot create widget: duplicate widget identifier ('${ident}')`)

        this.ident        = ident 
        this.type         = type
        this.text         = text
        this.root_elem    = null 
        this.parent_elem  = parent_elem
    }
    appendToParent()
    {
        if ( this.parent_elem != null && this.root_elem != null )
            this.parent_elem.appendChild( this.root_elem )
        else 
            throw new Error('cannot add widget element to parent')
    }
}
// -------------------------------------------------------------------------------------------------

// See UNICODE for geometric shape characters: https://en.wikipedia.org/wiki/Geometric_Shapes
// https://www.unicode.org/charts/PDF/U25A0.pdf

class CheckWidget extends Widget 
{
    /**
     * Builds a new toggle widget, from an unique identifier
     * @param {String}  ident          -- a unique string, with no spaces, which identifies the widget  
     * @param {String}  text           -- text which is displayed along the widget
     * @param {Boolean} initial_value  -- initial value (true= checked, false =unchecked)
     * @param {object}  on_change_func -- function to call when the user clicks and state switches (new state is passed as a param) 
     *                                    (can be null, then the widget is usable by using 'getValue', but the app is not notified when state changes)
     */
    constructor( ident, text, parent_elem, initial_value, on_change_func )
    {
        super( ident, 'check', text, parent_elem )
        
        // create the DOM elements (note: the root elem can be a div or a span 
        // here we use a div with 'display: flex' and 'align-items:center' to verticaly center the text line and the check mark)
        this.root_elem  = CreateElem( 'div', this.ident+'_root_id', 'widget_root_class', parent_elem )

        this.root_elem.style.display     = 'flex'
        this.root_elem.style.alignItems  = 'center'
        this.root_elem.style.marginTop   = '10px'
        this.on_change_func              = on_change_func 

        this.curr_value = initial_value

        this.root_elem.style.cursor = 'pointer'
        this.root_elem.onclick = e => 
        {  
            this.curr_value = ! this.curr_value
            this.setRootElemHTML()
            if ( this.on_change_func != null )
                this.on_change_func( this.curr_value )
        }

        // populate elements
        
        this.setRootElemHTML()
        this.appendToParent()
    }

    setRootElemHTML()
    {
        const 
            side_l    = 22,
            stroke_w  = 2,
            cx        = side_l/2,
            cy        = side_l/2,
            outer_rad = side_l/2-stroke_w,
            inner_rad = outer_rad-stroke_w-1,
            circ_col  = 'white',
            fill_col  = 'sandybrown',
            filled_circle = `<circle cx="${cx}" cy="${cy}" r="${inner_rad}" fill="${fill_col}"></circle>`,
            empty_circle  = '',
            inner_circle  = this.curr_value ? filled_circle : empty_circle

        this.root_elem.innerHTML = 
            `<svg width="${side_l}" height="${side_l}">` + 
            `<circle cx="${cx}" cy="${cy}" r="${outer_rad}" stroke="${circ_col}" stroke-width="${stroke_w}"></circle>` +
            inner_circle +
            `</svg>` + 
            `<span class='widget_text_class'>&nbsp;&nbsp;${this.text}</span>` 
            
    }
    getValue()
    {
        return this.curr_value
    }
}
// -------------------------------------------------------------------------------------------------
// Ideas for a dropdown menu:
// https://www.w3schools.com/howto/howto_js_dropdown.asp

class DropdownWidget extends Widget 
{
    /**
     * Builds a new toggle widget, from an unique identifier
     * @param {String}        ident           -- a unique string, with no spaces, which identifies the widget  
     * @param {String}        text            -- text which is displayed along the widget
     * @param {HTMLElement}   parent_elem -- 
     * @param {number}        initial_choice_index  -- a 0-based index with the initial choice 
     * @param {Array<String>} choices   -- array of strings with the different choices
     * @param {object}        on_selection_func -- what to do on a selection (index and str are passed)
     */
    constructor( ident, text, parent_elem, initial_choice_index, choices, on_selection_func )
    {
        CheckType( choices, 'Array' )
        Check( 0 < choices.length )
        Check( initial_choice_index < choices.length )

        super( ident, 'dropdown', text, parent_elem )

        this.choices = choices 
        this.curr_choice_index = initial_choice_index
        this.is_shown = false
        this.on_selection_func = on_selection_func

        // create the DOM elements 

        this.root_elem  = CreateElem( 'div', null, null, this.parent_elem )
        this.root_elem.style.display     = 'flex'
        this.root_elem.style.alignItems  = 'center'
        this.root_elem.style.marginTop   = '15px'
        this.root_elem.style.marginBottom  = '20px'

        this.text_elem = CreateElem( 'span', null, null, this.root_elem ) 
        this.text_elem.innerHTML = this.text+'&nbsp;&nbsp;'

        // this div elem is shown as an inline block ('dropdown' elem in the example)
        this.div_elem = CreateElem( 'div', null,null, this.root_elem )
        this.div_elem.style.position = 'relative'
        this.div_elem.style.display  = 'inline-block'
        

        // button elem
        this.button_elem = CreateElem( 'span', null,'bsp_class', this.div_elem  )   // was 'button'
        this.button_elem.innerHTML = `${this.choices[ this.curr_choice_index ]}&nbsp;&nbsp;${down_triangle_html}`
        this.button_elem.onclick = e => 
        {
            //Log(`dropdown button click, shown = ${this.is_shown}`)
            if ( this.is_shown ) // shown: hide
            {
                this.is_shown = false
                this.choices_list_elem.style.display = 'none'
            }
            else // not shown: show
            {
                this.is_shown = true
                this.choices_list_elem.style.display = 'block'
            }
        }

        // content elem (list of choices)
        this.choices_list_elem = CreateElem( 'div', null, 'dropdown_choices_list_class', this.div_elem )
        this.choices_list_elem.style.display  = 'none'
        
        for( let i = 0 ; i < this.choices.length ; i++ )
        {
            let choice_elem = CreateElem( 'div', null, 'dropdown_choice_class', this.choices_list_elem )
            
            choice_elem.index_num = i
            choice_elem.innerHTML = this.choices[ i ]
            choice_elem.onmouseover = e => 
            {   e.target.style.backgroundColor = 'black'
            } 
            choice_elem.onmouseout = e => 
            {   e.target.style.backgroundColor = 'rgb(30%,30%,30%)'
            } 
            choice_elem.onclick = e => 
            {   this.curr_choice_index = e.target.index_num 
                this.button_elem.innerHTML = `${this.choices[ this.curr_choice_index ]}&nbsp;&nbsp;${down_triangle_html}`
                this.is_shown = false 
                this.choices_list_elem.style.display = 'none'
                if ( this.on_selection_func != null )
                    this.on_selection_func( this.curr_choice_index, this.choices[ this.curr_choice_index ] )
            }
            document.addEventListener( 'click', e => 
            {   if ( e.target != this.button_elem )
                {   this.choices_list_elem.style.display = 'none'
                    this.is_shown = false
                }
            }, 
            false )

            this.choices_list_elem.appendChild( choice_elem )
        }

        this.appendToParent()
    }

    
    getValue() // returns the string corresponding to the current choice
    {
        return this.curr_choice_index
    }
}



