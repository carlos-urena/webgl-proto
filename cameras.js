// -----------------------------------------------------------------------------
// File: cameras.js
// Includes class 'Camera' and derived clasess: SimpleOrbitalCamera, etc....
//
// MIT License 
// Copyright (c) 2020 Carlos Ureña 
// (see LICENSE file)
// -----------------------------------------------------------------------------

// -------------------------------------------------------------------------------------------------
// A half-line

class Ray
{
    constructor( org, dir )
    {
        CheckType( org, 'Vec3')
        CheckType( dir, 'Vec3' )
        this.org = org 
        this.dir = dir
    }
}
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
// Base class for cameras (this camera is a simple fixed camera, with orthogonal projection)

class Camera
{
    constructor( initial_name )
    {
        this.name          = initial_name
        this.view_mat      = Mat4_Identity()
        this.view_mat_inv  = Mat4_Identity()
        this.proj_mat      = Mat4_Identity()
        this.viewport      = new Viewport( 256, 256 )
    }

    /**
     * Sets the viewport dimensions for this camera
     * @param {Viewport} new_viewport 
     */
    setViewport( new_viewport )
    {
        CheckType( new_viewport, 'Viewport' )
        this.viewport = new_viewport
        this.updateProjMat()
    }

    /**
     * Activate this camera in a visualization context
     * @param {VisContext} vct -- visualization context
     */
    activate( vis_ctx )
    {
        vis_ctx.program.setViewMat( this.view_mat  )
        vis_ctx.program.setProjMat( this.proj_mat )
    }

    
}

// -------------------------------------------------------------------------------------------------

// Base class for perspective cameras

class PerspectiveCamera extends Camera
{
    constructor( initial_name )
    {
        super( initial_name )

        // initialize projection matrix by using a perspective matrix
        this.near     = 0.05, 
        this.far      = this.near+1000.0
        this.fovy_deg = 60.0

        this.updateProjMat()
    }
    /**
     * updates 'proj_mat' from 'fovy_deg', 'viewport', 'near', 'far'
     */
    updateProjMat()
    {
        this.proj_mat = Mat4_Perspective( this.fovy_deg, this.viewport.ratio_yx, this.near, this.far )
    }

     
    /**
     *  Generates a ray through the center of a pixel in world coordinates
     */ 
    genRay( pix_x, pix_y )
    {
        CheckNat( pix_x )
        CheckNat( pix_y )
        Check( 0 <= pix_x && pix_x < this.viewport.width )
        Check( 0 <= pix_y && pix_y < this.viewport.height )

        // generate the ray in eye coords (EC) from the viewport dimensions and ratio, and fovy
        // (compute 'dir_ec', 'org_ec')

        const 
            r_yx   = this.viewport.ratio_yx,  // viewport ratio (height/width)
            fovy_r = (this.fovy_deg*Math.PI)/180.0,  // fovy, in radians
            h_ec   = Math.tan(0.5*fovy_r),
            w_ec   = h_ec/r_yx,
            cx     = w_ec * ( -1.0 + (2.0*(pix_x+0.5))/this.viewport.width  ),
            cy     = h_ec * ( -1.0 + (2.0*(pix_y+0.5))/this.viewport.height ),
            dir_ec = new Vec3([ cx, cy, -1 ]),
            org_ec = new Vec3([ 0.0, 0.0, 0.0])
        
        // compute the ray dir and org in world coordinates, by using inverse view matrix

        const org_wc = this.view_mat_inv.apply_to( org_ec, 1 ),
              dir_wc = this.view_mat_inv.apply_to( dir_ec, 0 )

        return new Ray( org_wc, dir_wc )
    } 

    
}


// -------------------------------------------------------------------------------------------------
// A class for a simple orbital camera with perspective projection


class OrbitalCamera extends PerspectiveCamera
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
            rot_mat_inv      = Mat4_Transpose( rot_mat ),
            transl_mat_inv   = Mat4_Translate([0,0, this.dist])

        //Log( `view rot == ${rot_mat} view rot transposed == ${rot_mat_inv}`)

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

