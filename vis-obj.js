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
        this.wgl_ctx = null 
        this.program = null
        this.do_shading = false   // true-> do shading (evaluate MIL, ony when the object has normals)
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
    constructor( initial_name )
    {
        if ( initial_name != null ) 
            this.name  = initial_name
        else 
            this.name = '(unassigned object name)'
    }

    /**
     * Draw this object
     * @param {VisContext} vis_ctx -- visualization context to use for drawing in this call
     */
    draw( vis_ctx )
    {
        throw new Error(`'draw' method has been called for an object (name: ${this.name}) which does not defines it`)
    }
}



