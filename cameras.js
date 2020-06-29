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
    constructor( initial_width, initial_height )
    {
        this.setDimensions( initial_width, initial_height )
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
        this.viewport      = new Viewport( 256, 256 )

        this.near     = 0.05, 
        this.far      = this.near+1000.0
        this.fovy_deg = 60.0

        this.updateProjMat()
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
        vis_ctx.program.setViewMat( this.view_mat  )
        vis_ctx.program.setProjMat( this.proj_mat )
    }

    /**
     * updates 'proj_mat' from 'fovy_deg', 'viewport', 'near', 'far'
     */
    updateProjMat()
    {
        this.proj_mat = Mat4_Perspective( this.fovy_deg, this.viewport.ratio_yx, this.near, this.far )
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

        

        this.view_vec     = (this.obs_pnt.minus( this.look_at_pnt )).normalized()
        this.alpha_deg    = 35.0
        this.beta_deg     = 20.0
        this.dist         = 2.0
        
        this.updateViewMat() // computes  x_axis, y_axis, z_axis, and...
        
    }
    updateViewMat()
    {
        const 
            rotx_mat         = Mat4_RotationXdeg( this.beta_deg ),
            roty_mat         = Mat4_RotationYdeg( -this.alpha_deg ),
            rot_mat          = rotx_mat.compose( roty_mat ),
            transl_mat       = Mat4_Translate([0,0,-this.dist])
        
        const 
            rotx_mat_inv     = Mat4_RotationXdeg( -this.beta_deg ),
            roty_mat_inv     = Mat4_RotationYdeg( this.alpha_deg ),
            rot_mat_inv      = roty_mat_inv.compose( rotx_mat_inv ),
            transl_mat_inv   = Mat4_Translate([0,0, this.dist])

        this.view_mat     = transl_mat.compose( rot_mat )
        this.view_mat_inv = rot_mat_inv.compose( transl_mat_inv )
    }
    
    moveXY( dx_deg, dy_deg )
    {
        this.alpha_deg = Trunc( this.alpha_deg + dx_deg, -400, +400 )
        this.beta_deg  = Trunc( this.beta_deg  + dy_deg, -88,  +88  )
        this.updateViewMat()
    }
    moveZ ( dz )
    {
        this.dist = Trunc( this.dist + dz, 0.01, 50.0 )
        this.updateViewMat()
    }
}
// -------------------------------------------------------------------------------------------------

