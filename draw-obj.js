// -----------------------------------------------------------------------------
// File: draw-obj.js
// Classes defined : DrawableObject 
//  * base abstract class for anything you can draw with WebGL onto a context
//  * derived classes: IndexedTrianglesMesh ('ind-mesh.js'), etc...
//
// MIT License 
// Copyright (c) 2020 Carlos Ureña 
// (see LICENSE file)
// -----------------------------------------------------------------------------

var debug_obj = true


// -------------------------------------------------------------------------------------------------
/**
 * A class for an indexed triangles mesh
 */

class DrawableObject
{
    // ----------------------------------------------------------------------------------

    /**
     * initializes the drawable object by giving its name
     * @param {string}   init_name -- initial name for this object
     */
    constructor( init_name )
    {
        const fname = `DrawableObject.constructor():`
        CheckType( init_name, 'String' )

        this.name = init_name
    }
    // ----------------------------------------------------------------------------------
    getName()
    {
        return name
    }
    // ----------------------------------------------------------------------------------
    setName( new_name )
    {
        name = new_name
    }
    // ----------------------------------------------------------------------------------
    
}
// -------------------------------------------------------------------------------------------------