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
    
    setDimensions( new_width, new_height )
    {
        const fname = 'Viewport.setDimensions()'
        CheckNat( new_width )
        CheckNat( new_height )
        Check( 0 < new_width && 0 < new_height, `${fname} cannot have a viewport with 0 or negative width (dimensions are ${new_width} x ${new_height})`)

        this.width     = new_width
        this.height    = new_height
        this.ratio_yx  = this.height / this.width 
    }
}

// -------------------------------------------------------------------------------------------------
// Base abstract class for general perspective cameras 

class Camera
{
    constructor( initial_name )
    {
        this.name          = initial_name
        this.view_mat      = Mat4_Identity()
        this.view_mat_inv  = Mat4_Identity()
        this.proj_mat      = Mat4_Identity()
        this.viewport      = new Viewport( null )
    }

    setViewport( new_viewport )
    {
        CheckType( new_viewport, 'Viewport' )
        this.viewport = new_viewport
        this.updateProjMat()
    }

    /**
     * Activate a camera in a visualization context
     * @param {VisContext} vct -- visualization context
     */
    activate( vis_ctx )
    {
        vis_ctx.curr_camera = this


    }
}


// -------------------------------------------------------------------------------------------------
// A class for a simple orbital camera


class OrbitalCamera extends Camera
{
    constructor( )
    {
        super( "Orbital Camera" )

        this.look_at_pnt   = new Vec3([ 0, 0,  0 ])
        this.obs_pnt       = new Vec3([ 0, 0,  1 ])

        this.near     = 0.05, 
        this.far      = this.near+1000.0
        this.fovy_deg = 60.0

        this.view_vec     = (this.obs_pnt.minus( this.look_at_pnt )).normalized()
        this.alpha_deg    = 35.0
        this.beta_deg     = 20.0
        this.dist         = 2.0
        
        this.updateViewMat() // computes  x_axis, y_axis, z_axis, and...
        this.updateProjMat()
    }

    updateViewMat()
    {
        const 
            rotx_mat         = Mat4_RotationXdeg( this.beta_deg ),
            roty_mat         = Mat4_RotationYdeg( -this.alpha_deg ),
            rot_mat          = rotx_mat.compose( roty_mat ),
            transl_mat       = Mat4_Translate([0,0,-this.cam_dist]),

            rotx_mat_inv     = Mat4_RotationXdeg( -this.beta_deg ),
            roty_mat_inv     = Mat4_RotationYdeg( this.alpha_deg ),
            rot_mat_inv      = roty_mat_inv.compose( rotx_mat_inv ),
            transl_mat_inv   = Mat4_Translate([0,0, this.cam_dist])

        this.view_mat     = transl_mat.compose( rot_mat )
        this.view_mat_inv = rot_mat_inv.compose( transl_mat_inv )
    }

    updateProjMat()
    {
        const fname = 'OrbitalCamera.updateProjMat():'
        Log(`${fname} ${this.fovy_deg} ${this.viewport.ratio_yx} ${this.near} ${this.far }`)
        this.proj_mat = Mat4_Perspective( this.fovy_deg, this.viewport.ratio_yx, this.near, this.far )
    }
}
// -------------------------------------------------------------------------------------------------

