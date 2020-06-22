#version 300 es 

// -------------------------------------------------------------------------------------
// Vertex shader (GLSL ES version 3 for Webgl 2) 
//
//  See GLSL ES and corresponding WebGL versions here: 
//  https://en.wikipedia.org/wiki/OpenGL_Shading_Language#Versions)
//

// Modularized srcs, see 'gman' answer to Fabrice Neyret question:
// https://stackoverflow.com/questions/43666688/is-there-a-way-to-test-the-glsl-es-version-in-the-shader


precision highp float; // ??
precision highp  int ;  // (what happens if I write 'mediump' here ? can mesh indexes still be very large??)

// Uniforms declarations (GLSL ES 1.0 or 3.0)

uniform int       do_shading ; // 1-> do shading, 0->do not do shading (just use vertex colors)
uniform mat4      model_mat ;  // modelling matrix (master vertex coords --> world vertex coords)
uniform mat4      view_mat ;   // view matrix (world coords. --> camera coords.)
uniform mat4      proj_mat ;   // projection matrix (camera coords. --> n.d.c. coords)
uniform mat4      norm_mat ;   // normal matrix (master normal coords --> world normal coords)
uniform int       do_texture ; // 1 -> use texture color, 0 -> do not use
uniform sampler2D tsampler0 ;    // texture sampler, accesed only when 'do_texture' is 1
                                    

// Vertex attributes declarations (GLSL ES 3.0)

layout(location = 0) in vec3 in_vertex_pos_mcc ;    // attribute 0 (positions in master coordinates)
layout(location = 1) in vec3 in_vertex_color ;      // attribute 1 (vertex color)
layout(location = 2) in vec3 in_vertex_normal_mcc ; // attribute 2 (normals in master coordinates)
layout(location = 3) in vec2 in_vertex_texcoo;      // attribute 3 (texture coordinates, used when do_texture==1)

// Output variables (GLSL ES 3.0)

out vec3 vertex_color ;    // vertex color to be interpolated
out vec3 vertex_pos_wcc ;  // vertex position in world coords, to be interpolated
out vec3 vertex_norm_wcc ; // vertex normal in world coords, to be interpolated
out vec2 vertex_texcoo ;   // vertex texture coordinates, to be interpolated

// Main function (writes the output variables) (GLSL ES 1.0 or 3.0)

void main(  ) 
{   
    vec4 pos_wcc    = model_mat * vec4( in_vertex_pos_mcc, 1) ;
    gl_Position     = proj_mat * (view_mat * pos_wcc); 
    vertex_color    = in_vertex_color ;
    vertex_pos_wcc  = pos_wcc.xyz ;
    vertex_norm_wcc = (norm_mat * vec4( in_vertex_normal_mcc, 0 )).xyz ;
    vertex_texcoo   = in_vertex_texcoo ;
}
