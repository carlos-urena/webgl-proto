// -----------------------------------------------------------------------------
// File: cameras.js
// Includes class 'Camera' and derived clasess: SimpleOrbitalCamera, etc....
//
// MIT License 
// Copyright (c) 2020 Carlos Ureña 
// (see LICENSE file)
// -----------------------------------------------------------------------------



// -------------------------------------------------------------------------------------------------
// A class whose intances hold viewport dimensions
class Viewport 
{
    constructor( opts )
    {
        if ( opts == null )
            this.setDimensions( 256, 256 )
    }
    ratio_yx()
    {
        return this.ratio_yx
    }
    setDimensions( new_width, new_height )
    {
        const fname = 'Viewport.setDimensions()'
        CheckNat( new_width )
        CheckNat( new_height )
        Check( 0 < new_width && 0 < new_height, `${fname} cannot have a viewport with 0 or negative width (dimensions are ${width} x ${height})`)

        this.width     = new_width
        this.height    = new_height
        this.ratio_yx  = this.height / this.width 
    }
}

// -------------------------------------------------------------------------------------------------
// Base abstract class for cameras 

class Camera
{
    constructor( initial_name )
    {
        this.name           = initial_name
        this.view_mat       = Mat4_Identity()
        this.projection_mat = Mat4_Identity()
        this.viewport       = new Viewport( 512, 512 )
    }

    setViewport( new_viewport )
    {
        CheckType( new_viewport, 'Viewport' )
        this.viewport = new_viewport
    }

    /**
     * Activate a camera in a visualization context
     * @param {VisContext} vct -- visualization context
     */
    activate( vct )
    {
        vct.curr_camera = this

    }
}

// -------------------------------------------------------------------------------------------------
// A class for a simple orbital camera


class OrbitalCamera extends Camera
{
    constructor( viewport )
    {
        super( "Orbital Camera" )
        this.look_at_pt   = Vec3([ 0, 0,  0 ])
        this.obs_pt       = Vec3([ 0, 0, -1 ])
        
        if ( viewport == nullptr )
        {

        }
    }
}
// -------------------------------------------------------------------------------------------------

