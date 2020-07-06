// -----------------------------------------------------------------------------
// File: vis-obj.js
// Includes class 'VisContext', 'DrawableObject', 'TIObject' and others
//
// MIT License 
// Copyright (c) 2020 Carlos Ureña 
// (see LICENSE file)
// -----------------------------------------------------------------------------


// -------------------------------------------------------------------------------------------------
// class for a 'visualization context' (a set of parameters needed for visualizing an object by using Webgl)
// It must include at least the WebGL rendering context and the shader program

class VisContext
{
    constructor()
    {
        this.wgl_ctx       = null 
        this.webgl_version = 0
        this.program       = null
        this.do_shading    = false   // true-> do shading (evaluate MIL, ony when the object has normals)
    }
    getProgram()
    {
        if ( this.program == null )
            throw new Error(`unable to get program from visualization context`)
        
        return this.program
    }
    getWglCtx()
    {
        if ( this.wgl_ctx == null )
            throw new Error(`unable to get webgl context from visualization context`)
        
        return this.wgl_ctx
    }
}

// -------------------------------------------------------------------------------------------------
// Base abstract class for objects with can be drawn by using WebGL

class DrawableObject
{
    /**
     * Build an (empty) drawable object
     * @param {object} options  -- an object which can have certain properties 
     *                                 -- name       (string)
     *                                 -- center_pnt (Vec3) 
     */
    constructor( options )
    {
        // set default values
        this.name       = '(unassigned object name)'
        this.center_pnt = new Vec3([ 0, 0, 0 ])
        
        // if there are no 'options', we are done
        if ( options === undefined )
            return  
        if ( options == null )
            return 

        // read options from 'options'
        if ( 'center_pnt' in options )
            this.center = new Vec3( options.center_pnt )
        if ( 'name' in options )
            this.name = options 
    }
    // ---------------------------------------------------------------------------------------------
    /**
     * Draw this object
     * @param {VisContext} vis_ctx -- visualization context to use for drawing in this call
     */
    draw( vis_ctx )
    {
        throw new Error(`'draw' method has been called for an object (name: ${this.name}) which does not defines it`)
    }

    // ---------------------------------------------------------------------------------------------
    /**
     * Sets the name for the object
     * @param {String} new_name 
     */
    setName( new_name )
    {
        Check( new_name != null, "cannot set name to 'null'")
        CheckType( new_name, 'String' )
        this.name = new_name
    }

    // ---------------------------------------------------------------------------------------------
    /**
     * Sets the name for the object
     * @param {Vec3} new_center_pnt
     */
    setCenterPnt( new_center_pnt )
    {
        CheckType( new_center_pnt, 'Vec3' )
        this.center_pnt = new Vec3( new_center_pnt )
    }
}
// ---------------------------------------------------------------------------------------------

class GridLinesXZ extends DrawableObject
{
    constructor()
    {
        super({ name: "grid lines" })
        this.x_line = null 
        this.z_line = null
    }

    draw( vis_ctx )
    {
        let gl = vis_ctx.wgl_ctx
        let pr = vis_ctx.program
        
        // create the X parallel line and the Z parallel line
        if ( this.x_line == null || this.z_line == null )
        {
            const h = -0.003
            this.x_line = new VertexArray( 0, 3, new Float32Array([ 0,h,0, 1,h,0 ]))
            this.z_line = new VertexArray( 0, 3, new Float32Array([ 0,h,0, 0,h,1 ]))
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

        pr.pushMM()
            
            pr.compMM( t )
            pr.compMM( s )  
            
            pr.pushMM()      
                for( let i = 0 ; i <= n ; i++)
                {   this.x_line.draw( gl, gl.LINES )
                    pr.compMM( tz )
                }
            pr.popMM()    
            
            pr.pushMM()  
                for( let i = 0 ; i <= n ; i++)
                {   this.z_line.draw( gl, gl.LINES )
                    pr.compMM( tx )
                }
            pr.popMM()
            
        pr.popMM()        
    }
}

// ---------------------------------------------------------------------------------------------

class Axes extends DrawableObject
{
    constructor()
    {
        super({ name: "axes" })

        this.x_axe = null 
        this.y_axe = null 
        this.z_axe = null 
    }


    draw( vis_ctx )
    {
        const fname = 'Axes.draw():'
        let gl      = vis_ctx.wgl_ctx
        
        if ( this.x_axe == null )
        {    
            this.x_axe = new VertexArray( 0, 3, new Float32Array([ 0,0,0, 1,0,0 ]))
            this.y_axe = new VertexArray( 0, 3, new Float32Array([ 0,0,0, 0,1,0 ]))
            this.z_axe = new VertexArray( 0, 3, new Float32Array([ 0,0,0, 0,0,1 ]))
        } 

       gl.vertexAttrib3f( 1, 1.0, 0.1, 0.1 ) ; this.x_axe.draw( gl, gl.LINES )
       gl.vertexAttrib3f( 1, 0.2, 1.0, 0.2 ) ; this.y_axe.draw( gl, gl.LINES )
       gl.vertexAttrib3f( 1, 0.1, 0.8, 1.0 ) ; this.z_axe.draw( gl, gl.LINES )
    }
}

// ----------------------------------------------------------------------------------
// A drawable object with an (optional) texture and a instantiation  matrix 
// (that is: a Textured Instantiated Object)

class TIObject extends DrawableObject
{
    /**
     * initializes an instance of a 'TIObject' as a reference to a draweable object
     * @param {DrawableObject} base_obj -- anything derived from 'DrawableObject'
     */
    constructor( base_obj )
    {
        const fname       = 'TIObject.constructor()'
        Check( base_obj !== null )

        super( null )
        this.base_obj     = base_obj
        this.name         = base_obj.name +" (instantiated, possibly textured)"
        this.center_pnt   = base_obj.center_pnt
        this.texture      = null     // by default, it doesn't has a texture 
        this.inst_mat     = Mat4_Identity()
        this.inst_mat_inv = Mat4_Identity() 
    }
    // ------------------------------------------------------
    /**
     * Sets a new texture for this object (use 'null' to remove texture)
     * @param {WebGLTexture} new_gl_texture -- new texture for the object, can be null 
     */
    setTexture( new_gl_texture )
    {
        this.gl_texture = new_gl_texture 
    }
    // ------------------------------------------------------
    /**
     * 
     * @param {*} new_matrix 
     */
    setInstMat( new_matrix )
    {
        this.inst_mat     = new Mat4( new_matrix )
        this.inst_mat_inv = new Mat4_Inverse( this.inst_mat )
        this.center_pnt   = new_matrix.apply_to( this.base_obj, 1 )
    }
    // ------------------------------------------------------
    /**
     * Draw this object
     * @param {VisContext} vis_ctx -- visualization context to use for drawing in this call
     */
    draw( vis_ctx )
    {
        const fname = 'TIObject.draw():'
        let gl      = vis_ctx.wgl_ctx,
            pr      = vis_ctx.program

        pr.setTexture( this.gl_texture )
        pr.pushMM()
            pr.compMM( this.inst_mat )
            this.base_obj.draw( vis_ctx )
        pr.popMM()        
    }
}