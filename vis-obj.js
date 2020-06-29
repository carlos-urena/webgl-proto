// -----------------------------------------------------------------------------
// File: cameras.js
// Includes class 'Camera' and derived clasess: SimpleOrbitalCamera, etc....
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
