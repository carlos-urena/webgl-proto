#version 300 es 

// -------------------------------------------------------------------------------------
// Fragment shader (GLSL ES version 3 for WebGL 2) 
//
//  See GLSL ES and corresponding WebGL versions here: 
//  https://en.wikipedia.org/wiki/OpenGL_Shading_Language#Versions)
//

precision highp float; // ??
precision highp  int ;  // (what happens if I write 'mediump' here ? can mesh indexes still be very large??)

// ----------------------------------------------------------------------------------------------
// Uniforms declarations (GLSL ES 1.0 or 3.0)

uniform int       do_shading ; // 1-> do shading, 0->do not do shading (just use vertex colors)
uniform mat4      model_mat ;  // modelling matrix (master vertex coords --> world vertex coords)
uniform mat4      view_mat ;   // view matrix (world coords. --> camera coords.)
uniform mat4      proj_mat ;   // projection matrix (camera coords. --> n.d.c. coords)
uniform mat4      norm_mat ;   // normal matrix (master normal coords --> world normal coords)
uniform int       do_texture ; // 1 -> use texture color, 0 -> do not use
uniform sampler2D tsampler0 ;    // texture sampler, accesed only when 'do_texture' is 1

// ----------------------------------------------------------------------------------------------
// Input and output variables (GLSL ES 3.0)

in  vec3 vertex_color ;    // interpolated primitive color 
in  vec3 vertex_pos_wcc ;  // interpolated fragment center position in world coordinates
in  vec3 vertex_norm_wcc ; // interpolated fragment normal in world coordinates
in  vec2 vertex_texcoo ;   // interpolated texture coordinates 
out vec4 frag_color ;      // output: fragment color

// ----------------------------------------------------------------------------------------------

// Shade: computes opaque RGB color from (currently a simple test...)
//    pos  : shading point position
//    vcol : interpolated vertex color at the shading point position
//    unor : shading point normal (not neccesarily normalized)

vec3 Shade( vec3 pos, vec3 vcol, vec3 unor )
{
    vec3 nor   = normalize(unor);
    vec3 light = normalize( vec3( 1.0, 1.0, 1.0 ) );
    vec3 diff  = max( 0.2, 1.2*dot( light, nor )) * vcol ;

    vec3  view    = normalize( vec3( 0.0, 0.0, 1.0 ) );
    vec3  halfw   = normalize( view+light );
    float hv      = max( 0.0, dot( halfw,view ) );
    float expon   = 10.0 ;
    vec3  spec    = pow(hv,expon)*vec3( 1.0, 1.0, 1.0 ) ; 

    return diff ;//+ spec ;
}

// ----------------------------------------------------------------------------------------------
// returns 'base color', (the surface reflectivity), which is either the 
// interpolated vertex color (when no texturing) or the texture color (when texturing)

vec3 BaseColor()
{
    if ( do_texture == 0 )
        return vertex_color ;
    else
    {
        vec4 tcol = texture( tsampler0, vertex_texcoo ) ;
        return tcol.xyz ;
    }
}
// ----------------------------------------------------------------------------------------------
// Computes the fragment color

vec4 FragColor()
{
    if ( do_shading == 0 )
        return vec4( BaseColor(), 1.0 ) ;
    else
        return vec4( Shade( vertex_pos_wcc, vertex_color, vertex_norm_wcc ), 1.0 );
}

// ----------------------------------------------------------------------------------------------
// Main function (writes the output variables)

void main() 
{
    frag_color = FragColor() ;
}

