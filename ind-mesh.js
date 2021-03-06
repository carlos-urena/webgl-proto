// -----------------------------------------------------------------------------
// File: ind-mesh.js
// Classes defined : IndexedTrianglesMesh (for an indexed triangles mesh)
//                 : ParamSurfaceMesh, TriMeshFromPLY, TriMeshFromOBJ


//
// MIT License 
// Copyright (c) 2020 Carlos Ureña 
// (see LICENSE file)
// -----------------------------------------------------------------------------

var debug_mesh = true

// ----------------------------------------------------------------------------------

/**
 * Computes the AA bounding box from an array with cordinates
 * @param   {Float32Array} coords_array -- vertex coordinates (3 values per vertex)
 * @returns {object}       -- an object with 6 number properties, named 'xmin','xmax','ymin','ymax','zmin','zmax'
 */
function ComputeBBox( coords_array )
{
    const fname = 'ComputeBBox():'
    CheckType( coords_array, 'Float32Array' )
    CheckNat( coords_array.length/3 )

    let   v  = coords_array
    const nv = coords_array.length/3 

    let minx = v[0], maxx = v[0],
        miny = v[1], maxy = v[1],
        minz = v[2], maxz = v[2]

    for( let iv = 1 ; iv < nv ; iv++ )
    {
        let i = 3*iv 
        minx = Math.min( minx, v[i+0] ) ; maxx = Math.max( maxx, v[i+0] ) 
        miny = Math.min( miny, v[i+1] ) ; maxy = Math.max( maxy, v[i+1] ) 
        minz = Math.min( minz, v[i+2] ) ; maxz = Math.max( maxz, v[i+2] ) 
    }
    if ( true  )
    {
        Log(`${fname} num verts == ${nv}`)
        Log(`${fname} bbox min  == (${minx},${miny},${minz})`)
        Log(`${fname} bbox max  == (${maxx},${maxy},${maxz})`)
    }

    let bbox = {   xmin: minx, xmax: maxx,  ymin: miny, ymax: maxy, zmin: minz, zmax: maxz }
    return bbox
}

// -------------------------------------------------------------------------------------------------

/**
 * Compute the smallest AA bounding box which includes two bounding boxes
 * @param  {object} bbox1 -- first bounding box (an object with 6 number properties, named 'xmin','xmax','ymin','ymax','zmin','zmax')
 * @param  {object} bbox2 -- second bounding box (idem)
 */
function MergeBBoxes( bbox1, bbox2 )
{
    const fname = 'MergeBBoxes():'
    
    let bbox =
        {   xmin: Math.min( bbox1.xmin, bbox2.xmin ), xmax: Math.max( bbox1.xmax, bbox2.xmax ),
            ymin: Math.min( bbox1.ymin, bbox2.ymin ), ymax: Math.max( bbox1.ymax, bbox2.ymax ),
            zmin: Math.min( bbox1.zmin, bbox2.zmin ), zmax: Math.max( bbox1.zmax, bbox2.zmax )
        }
    return bbox
}

// -------------------------------------------------------------------------------------------------

/**
 * Normalizes vertex coordinates
 * @param {Float32array} coords_data -- (x,y,z) coordintes data 
 */
function NormalizeCoords( bbox, coords_data )
{
    const fname = `NormalizeCoords():`
    CheckType( coords_data, 'Float32Array')
    const num_verts = Math.floor(coords_data.length/3)
    Check( num_verts*3 === coords_data.length) 

    // normalize coordinates to -1 to +1 
    //let   bbox   = ComputeBBox( coords_data )
    const maxdim = Math.max( bbox.xmax-bbox.xmin, bbox.ymax-bbox.ymin, bbox.zmax-bbox.zmin ),
          center = [ 0.5*(bbox.xmax+bbox.xmin), 0.5*(bbox.ymax+bbox.ymin), 0.5*(bbox.zmax+bbox.zmin) ],
          scale  = 2.0/maxdim

    if ( debug_mesh )
    {  
        Log( `${fname}: maxdim == ${maxdim}` )
        Log( `${fname}: center == ${center}` )
    }
    for( let iv = 0 ; iv < num_verts ; iv++ )
    {
        const p = 3*iv
        for( let ic = 0 ; ic < 3 ; ic++ )
            coords_data[p+ic] = scale*( coords_data[p+ic] - center[ic] )
    }
    
}


// -------------------------------------------------------------------------------------------------
/**
 * A class for an indexed triangles mesh
 */

class IndexedTrianglesMesh extends DrawableObject
{
    // ----------------------------------------------------------------------------------

    /**
     * initializes the mesh from coordinates and triangles data
     * (if both parameters are null, this creates an empty mesh with 0 vertexes and a single property (this.n_verts, ==0))
     * @param {Float32Array} coords_data    -- vertex coordinates (length must be multiple of 3) 
     * @param {Uint32Data}   triangles_data -- vertex indexes for each triangle (length must be multiple of 3)
     */
    constructor( coords_data, triangles_data, options )
    {
        const fname = `IndexedTriangleMesh.constructor():`

        super( { name: 'triangle mesh' } )

        Log(`${fname} options == ${options}`)

        if ( options != null && name in options )
            this.setName( options.name )

        if ( coords_data == null && triangles_data == null )
        {
            this.n_verts = 0
            return
        }
        CheckType( coords_data, 'Float32Array' )
        let ind_class = triangles_data.constructor.name 
        
        if (! ['Uint16Array','Uint32Array'].includes( ind_class ))
        {   const msg = `${fname} 'indexes_array' is of class '${ind_class}', but must be either 'Uint32Array' or 'Uint16Array'`
            throw Error(msg)
        }
        const vl = coords_data.length,
              tl = triangles_data.length

        Check( 0 < vl && 0 < tl,          `${fname} either the vertex array or the indexes array is empty` )
        Check( Math.floor(vl/3) == vl/3 , `${fname} vertex array length must be multiple of 3 (but it is ${vl})` )
        Check( Math.floor(tl/3) == tl/3 , `${fname} indexes array length must be multiple of 3 (but it is ${tl})` )

        this.n_verts         = vl/3
        this.n_tris          = tl/3
        this.coords_data     = coords_data
        this.triangles_data  = triangles_data
        this.colors_data     = null
        this.normals_data    = null
        this.texcoo_data     = null
        
        //this.bbox = ComputeBBox( coords_data )

        // create the vertex array with all the data
        const num_attrs = 4,  // Note: 4 attributes: positions, colors, normals and tex coords
              vec_len   = 3

        this.vertex_array = new VertexArray ( num_attrs, vec_len, coords_data )  
        this.vertex_array.setIndexesData( triangles_data )

        this.triangle_duals = null 
        //this.computeTriangleDuals() // do this after normalization!!

        let totb = 0
        totb += 4*this.coords_data.length 
        totb += 4*this.triangles_data.length 
        if ( this.texcoo_data != null )    totb += 4*this.texcoo_data.length 
        if ( this.triangle_duals != null ) totb += 4*this.triangle_duals.length 

        Log(`${fname} mesh created, size == ${N2S(totb/1024)} MB`)
        Log(`${fname} -------------- ends -----------------`)

    }
    // ----------------------------------------------------------------------------------
    getTriangleVertexes( it )
    {
        if ( it < 0 || this.triangles_data.length <= 3*it )
            throw new Error("it out of range")

        const 
            vc = this.coords_data, 
            b  = it*3,
            i0 = 3*this.triangles_data[ b+0 ],
            i1 = 3*this.triangles_data[ b+1 ],
            i2 = 3*this.triangles_data[ b+2 ]

        const tvv = [  new Vec3([ vc[i0+0], vc[i0+1], vc[i0+2] ]),
                       new Vec3([ vc[i1+0], vc[i1+1], vc[i1+2] ]), 
                       new Vec3([ vc[i2+0], vc[i2+1], vc[i2+2] ])
                    ]
        return tvv 
    }
    // ----------------------------------------------------------------------------------
    // (see: https://lsi.ugr.es/curena/varios/rtint/)
    computeTriangleDuals()
    {
        const fname = 'IndexedTriangleMesh.computeTriangleDuals():'

        Log( `${fname} begins`)
        let td = new Float32Array( 13*this.n_tris )

        for( let it = 0 ; it < this.n_tris ; it++ )
        {
            const
                b   = 13*it, 
                vv  = this.getTriangleVertexes( it ),
                e1  = vv[1].minus( vv[0] ),
                e2  = vv[2].minus( vv[0] ),
                d11 = e1.dot( e1 ),
                d22 = e2.dot( e2 ),
                d12 = e1.dot( e2 ),
                s_inv = d11*d22 - d12*d12 

            // Log(`vv type is '${vv.constructor.name}', vv[1] type is '${(vv[1]).constructor.name}'`)
            // Log(`vv[1][1] type is '${(vv[1])[1].constructor.name}', vv[1][1] == ${vv[1][1]}`)
            
            if ( Math.abs(s_inv) < 1e-12 )
            {  td[ b+12 ] = 0.0
                //Log(`CTD:: ### s_inv == ${s_inv}`)
               continue 
            }
            td[ b+12 ] = 1.0 

            const 
                s    = 1.0/s_inv, 
                e1d  = (e1.scale( d22 ).minus( e2.scale( d12 ) )).scale( s ),
                e2d  = (e2.scale( d11 ).minus( e1.scale( d12 ) )).scale( s ),
                n    = e1.cross( e2 ).normalized(),
                k    = new Vec3( [ vv[0].dot( e1d ), vv[0].dot( e2d ), vv[0].dot( n )] )

            //Log(` CTD:: vv[0] == ${vv[0]}, n == ${n}, n length == ${n.len_sq()}, n dot e1 = ${n.dot(e1)} `)

            for( let i = 0  ; i < 3 ; i++ )  td[b+i] = e1d[i-0]
            for( let i = 3  ; i < 6 ; i++ )  td[b+i] = e2d[i-3]
            for( let i = 6  ; i < 9 ; i++ )  td[b+i] = n[i-6]
            for( let i = 9  ; i < 12 ; i++ ) td[b+i] = k[i-9]

            //Log( `CTD:: e1d=${e1d}, e2d=${e2d}, n=${n}, k=${k}`)

        }
        Log(`${fname} ends`)
        this.triangle_duals = td 

    }
    // ----------------------------------------------------------------------------------
    hasTextCoords()
    {
        return this.texcoo_data != null 
    }
    // ----------------------------------------------------------------------------------
    hasNormals()
    {
        return this.normals_data != null 
    }
    // ----------------------------------------------------------------------------------
    hasColors()
    {
        return this.colors_data != null  
    }
    // ----------------------------------------------------------------------------------

    /**
     * returns true iif data array length is multiple of 3 and type is 'Float32Array'
     * @param {string}       fname     -- function calling this
     * @param {Float32Array} attr_data -- reference to the data
     * @param {number}       vec_len -- length of vectors in the data (must be 2 or 3)
     */
    checkAttrData( fname, attr_data, vec_len )
    {
        Check( this.n_verts >  0 )   // fails if this is an empty mesh...
        CheckType( attr_data, 'Float32Array' )
        const l = attr_data.length
        Check( l === vec_len*this.n_verts, `${fname} attribute array length (== ${l}) must be ${vec_len} times num.verts. (== ${3*this.n_verts})`)
    }
    // ----------------------------------------------------------------------------------

    /**
     * specify a new vertexes colors for the Mesh
     * @param {Float32Array} colors_data -- new vertexes colors (length must be 3*num.vertexes)
     */
    setColorsData( colors_data )
    {
        const fname = 'Mesh.setColorsData():'
        this.checkAttrData( fname, colors_data, 3 )
        this.colors_data = colors_data
        this.vertex_array.setAttrData( 1, 3, colors_data )
    }
    // ----------------------------------------------------------------------------------

    /**
     * specify a new vertexes normals for the Mesh
     * @param {Float32Array} normals_data -- new vertexes normals (length must be 3*num.vertexes)
     */
    setNormalsData( normals_data )
    {
        const fname = 'IndexedTriangleMesh.setNormalsData():'
        this.checkAttrData( fname, normals_data, 3 )
        this.normals_data = normals_data
        this.vertex_array.setAttrData( 2, 3, normals_data )
    }
    // ----------------------------------------------------------------------------------
    /**
     * specify a new vertexes texture coords array for the Mesh
     * @param {Float32Array} normals_data -- new vertexes normals (length must be 3*num.vertexes)
     */
    setTexCooData( texcoo_data )
    {
        const fname = 'IndexedTriangleMesh.setTexCooData():'
        this.checkAttrData( fname, texcoo_data, 2 )
        this.texcoo_data = texcoo_data
        this.vertex_array.setAttrData( 3, 2, texcoo_data )
        Log(`${fname} DONE !`)
    }
    // ----------------------------------------------------------------------------------
    computeVertexNormals()
    {
        const fname = 'IndexedTriangleMesh.computeVertexNormals():'

        Log(`${fname} begins`)
        // undefine current normals and free space (if there are any)

        if ( this.normals_data != null )
        {
            Log(`${fname} WARNING: deleting already existing normals data`)
            this.normals_data = null 
        }
        Check( this.triangles_data.length == 3*this.n_tris )  
        Check( this.coords_data.length == 3*this.n_verts )  

        Log(`${fname} computing triangle normals`)
        // compute array with triangle normals (Vec3 elements)
        let tri_normals = new Array( this.n_tris )

        for( let ti = 0 ; ti < this.n_tris ; ti++ )
        {
            const tvv   = this.getTriangleVertexes( ti ),
                  edge1 = tvv[1].minus( tvv[0] ),
                  edge2 = tvv[2].minus( tvv[0] )
            
            tri_normals[ti] = edge1.cross( edge2 ) 
        }

        // create and initialize array with vertexes normals 
        // NOTE: better use typed array fill operation
        Log(`${fname} initializing vertex normals`)
        let normals_data = new Float32Array( 3*this.n_verts )
        for ( let i = 0 ; i < 3*this.n_verts ; i++ )
            normals_data[i] = 0.0

        // add triangle normals onto vertex normals data
        Log(`${fname} accumulating vertex normals`)
        for( let ti = 0 ; ti < this.n_tris ; ti++ )
        {
            const pt   = 3*ti,
                  pv0 = 3*this.triangles_data[ pt+0 ],
                  pv1 = 3*this.triangles_data[ pt+1 ],
                  pv2 = 3*this.triangles_data[ pt+2 ],
                  tn  = tri_normals[ ti ]
                    
            for( let k = 0 ; k < 3 ; k++ ) // 'k' runs over x,y and z axes
            {   normals_data[ pv0+k ] += tn[k]  
                normals_data[ pv1+k ] += tn[k]  
                normals_data[ pv2+k ] += tn[k]  
            }
        }

        // normalize vertex normals 
        Log(`${fname} normalizing vertex normals`)
        let z_count = 0 

        for ( let vi = 0 ; vi < this.n_verts ; vi++ )
        {
            const pv    = 3*vi,
                  vn    = new Vec3([ normals_data[pv+0], normals_data[pv+1], normals_data[pv+2] ]),
                  vnlsq = vn.len_sq()
            
            if ( vnlsq < 1e-12 )
            {   z_count ++
                continue
            }
            const vnn = vn.scale( 1.0/Math.sqrt( vnlsq ) )
            normals_data[ pv+0 ] = vnn[0]
            normals_data[ pv+1 ] = vnn[1]
            normals_data[ pv+2 ] = vnn[2]
        }

        Log(`${fname} z_count == ${z_count} / total tris == ${this.n_tris}`)
        
        this.setNormalsData( normals_data )
        Log(`${fname} ends`)

    }
    // ----------------------------------------------------------------------------------

    /**
     * Draws this object using WebGL commands onto the webgl rendering context 'vis_ctx.wgl_ctx'
     * @param {VisContext} vis_ctx 
     */
    draw( vis_ctx )
    {
        Check( this.n_verts >  0 )   // fails if this is an empty mesh...
        const gl = vis_ctx.wgl_ctx
        this.vertex_array.draw( gl, gl.TRIANGLES )
    }
    // ----------------------------------------------------------------------------------
    normalizeCoords( bbox )
    {
        // normalize coordinates to the bounding box
        NormalizeCoords( bbox, this.coords_data )
    }
    // ----------------------------------------------------------------------------------
    /**
     * Intersects this mesh with a ray  (brute-force, used for selection)
     * @param   {hit_data} ray triangle hit data object (see 'RayTriangleInt' function)
     * 
     */
    intersectRay( ray, hit_data )
    {
        const fname = 'IndexedTriangleMesh.intersectRay():'
        const nt = this.n_tris 
        if ( nt == 0 )
            throw new Error("method 'interectRay' for empty triangle mesh" )

        Log(`${fname} --------- begins ---------------------------`)
        Log(`${fname} hit_data.hit = ${hit_data.hit}`)

        if ( this.triangle_duals == null )
        {
            Log(`${fname} using slow inters. function`)
            for( let it = 0 ; it < nt ; it++ )
            {
                const 
                    vv = this.getTriangleVertexes( it ),
                    tri = { v0: vv[0], v1: vv[1], v2: vv[2], it: it }

                // Log(`----`)
                // Log(`tri ind = ${i0/3   }, ${i1/3}, ${i2/3}`)
                // Log(`    v0  = ${tri.v0 }, v1  = ${tri.v1}, v2 = ${tri.v2}`)
                // Log(`ray org = ${ray.org}, dir = ${ray.dir}`)

                RayTriangleInt( ray, tri, hit_data ) 
            }
        }
        else
        {
            Log(`${fname} using fast dual triangle inters. function`)
            Check( this.triangle_duals.length == this.n_tris*13 )
            
            let tri_dual = { td: this.triangle_duals, it: -1 }

            Check( tri_dual.td.length == this.n_tris*13 )
            Log( `td type is  ${tri_dual.td.constructor.name}` )

            for( let i = 0 ; i < rtdc_len ; i++ )
                rtdc[i] = 0

            for( let it = 0 ; it < nt ; it++ )
            {
                tri_dual.it = it
                RayTriDualInt( ray, tri_dual, hit_data ) 
            }

            for( let i = 0 ; i < rtdc_len ; i++ )
            {
                Log(`*** rtdc[${i}] = ${rtdc[i]}`)
            }
        }

        //Log(`Inters.ray: mesh.nt == ${this.n_tris }, triangles data length /3 == ${this.triangles_data.length/3}`)
        //Log(`Inters.ray: mesh.nv == ${this.n_verts}, coords data length /3    == ${this.coords_data.length/3}`)
        Log(`${fname} hit_data.hit = ${hit_data.hit}`)
        Log(`${fname} ------------ ends -------------`)
    }
}

// -------------------------------------------------------------------------------------------------
/**
 * A simple planar (z=0) mesh used to test the 'Mesh' class
 */

class Simple2DMesh extends IndexedTrianglesMesh 
{
    constructor()
    {
        const vertex_coords = 
            [
                -0.9, -0.9, 0.0, 
                +0.9, -0.9, 0.0,
                -0.9, +0.9, 0.0,
                +0.9, +0.9, 0.0
            ]
        const vertex_colors = 
            [
                1.0,  0.0, 0.0, 
                0.0,  1.0, 0.0, 
                0.0,  0.0, 1.0, 
                1.0,  1.0, 1.0
            ]

        const vertex_normals = 
            [
                0.0,  1.0, 0.0, 
                0.0,  1.0, 0.0, 
                0.0,  1.0, 0.0, 
                0.0,  1.0, 0.0
            ]

        const triangles = 
            [   0,1,3, 
                0,3,2 
            ]

        super( new Float32Array( vertex_coords ), new Uint32Array( triangles ) )
        this.setColorsData( new Float32Array( vertex_colors ))
        this.setNormalsData( new Float32Array( vertex_normals ))
    }
}


// -------------------------------------------------------------------------------------------------
/**
 * A mesh built by sampling a parametric surface (a map from [0,1]^2 to R^3)
 */
class ParamSurfaceMesh extends IndexedTrianglesMesh
{
    constructor( ns, nt, param_func, options )
    {
        CheckNat( ns )
        CheckNat( nt )
        Check( 1 < ns && 1 < nt , "'nu' and 'nv' must be at least 2 each.")

        // create the coordinates (and colors) array
        const nver = (ns+1)*(nt+1) 

        let coords    = new Float32Array( 3*nver ),
            colors    = new Float32Array( 3*nver ),
            normals   = new Float32Array( 3*nver ),
            texcoords = new Float32Array( 2*nver )

        const num_color_bands = 20,
              mod_s           = Math.max( 2, Math.floor( ns/num_color_bands ) ),
              mod_t           = Math.max( 2, Math.floor( nt/num_color_bands ) )

        for( let i = 0 ; i <= ns ; i++ )
        for( let j = 0 ; j <= nt ; j++ )
        {
            const s    = i/ns,
                  t    = j/nt,
                  vert = param_func( s, t ),  // includes vert.pos, vert.nor
                  p    = (i + j*(ns+1))

            for( let k = 0 ; k < 3 ; k++ )
            {   coords [ 3*p + k ] = vert.pos[k]
                normals[ 3*p + k ] = vert.nor[k]
            } 
            texcoords[ 2*p + 0 ] = 1-s
            texcoords[ 2*p + 1 ] = 1-t

            // sample colors
            
            colors[ 3*p +0 ] = ( i%mod_s < 0.9*mod_s ) ? 0.6 : 0.3
            colors[ 3*p +1 ] = ( j%mod_t < 0.9*mod_t ) ? 0.6 : 0.3
            colors[ 3*p +2 ] = ( (i+j)%(mod_s+mod_t) < 0.5*(mod_s+mod_t) ) ? 0.6 : 0.3
        }

        // create the indexes (triangles) array  (2 triangles for each vertex except for last vertexes row/col)
        const ntri = 2*ns*nt
        let triangles = new Uint32Array( 3*ntri )

        for( let i = 0 ; i < ns ; i++ )
        for( let j = 0 ; j < nt ; j++ )
        {
            const 
                i00 = i + j*(ns+1) ,   
                i10 = i00 + 1,         
                i01 = i00 + (ns+1),    
                i11 = i01 + 1,         
                b   = 6*(i+(j*ns))

            // first triangle
            triangles[b+0] = i00 
            triangles[b+1] = i10
            triangles[b+2] = i11 
            
            // second triangle 
            triangles[b+3] = i00
            triangles[b+4] = i11
            triangles[b+5] = i01
        }
        // initialize the base Mesh instance
        super( coords, triangles, options )
        //this.setColorsData( colors )
        this.setTexCooData( texcoords )
        this.setNormalsData( normals )

        // compute triangle duals for intersections
        this.computeTriangleDuals()
    }
}

// -------------------------------------------------------------------------------------------------

class SphereMesh extends ParamSurfaceMesh
{   constructor( ns, nt )
    {   super
        ( ns, nt, (s,t) => 
            {
                const
                    a  = s*2.0*Math.PI, b  = (t-0.5)*Math.PI,
                    ca = Math.cos(a),   sa = Math.sin(a),
                    cb = Math.cos(b),   sb = Math.sin(b),
                    v  = new Vec3([ ca*cb, sb, sa*cb ])

                return { pos: v, nor: v }
            } ,
            { name: 'sphere surface' }
        )
    }
}

// -------------------------------------------------------------------------------------------------

class CylinderMesh extends ParamSurfaceMesh
{   constructor( ns, nt )
    {   super
        ( ns, nt, (s,t) => 
            {   const
                    a  = s*2.0*Math.PI, 
                    ca = Math.cos(a),   
                    sa = Math.sin(a),
                    p  = new Vec3([ ca, t, sa ] ),
                    n  = new Vec3([ ca, 0, sa ])

                return { pos: p, nor: n }
            },
            { name: 'cylinder surface' } 
        )
    }
}

// -------------------------------------------------------------------------------------------------

class ConeMesh extends ParamSurfaceMesh
{   constructor( ns, nt )
    {   super
        ( ns, nt, (s,t) => 
            {   const
                    a  = s*2.0*Math.PI, 
                    ca = Math.cos(a),   
                    sa = Math.sin(a),
                    p  = new Vec3([ (1-t)*ca, t, (1-t)*sa ] ),
                    n  = new Vec3([ ca, 1, sa ])

                return { pos: p, nor: n.normalized() }
            } ,
            { name: 'cone surface' }
        )
    }
}


const simple_vertex_coords = 
            [
                -0.9, -0.9, 0.0, 
                +0.9, -0.9, 0.0,
                -0.9, +0.9, 0.0,
                +0.9, +0.9, 0.0
            ]
        

        const simple_triangles = 
            [   0,1,3, 
                0,3,2 
            ]
// -------------------------------------------------------------------------------------------------


class TriMeshFromPLYLines extends IndexedTrianglesMesh
{
    /**
     * Buids an indexed mesh from a strings array with the lines from an ascii PLY file.
     * Sets 'parse_ok' and 'parse_message'
     * 
     * @param {Array<string>} lines -- input strings array with lines
     */
    constructor( lines )
    {
        let fname  = 'TriMeshFromPLYLines.constructor():',
            parser = new PLYParser( lines )
        
        if ( ! parser.parse_ok )
        {   
            super( null, null )  // empty mesh
            
            Log(`${fname} PLY parse error`)
            Log(`${fname} ${parser.parse_message}`)
            Log(`${fname} Line: ${parser.parse_message_line}`)
            alert( `Parse error:\n ${parser.parse_message}\n Line: ${parser.parse_message_line}\n` )
            return
        }
        Log(`${fname} PLY parsed ok, num_verts == ${parser.num_verts}, num_tris == ${parser.num_tris}`)

        super( parser.coords_data, parser.triangles_data )
        if ( parser.texcoo_data != null )  // unnecesary, we can pass 'null' to 'setTexCooData' ??  
        {   
            this.setTexCooData( parser.texcoo_data )
            Log(`${fname} including texture coordinates data in the mesh`)
        }
        if ( parser.normals_data != null )  // unnecesary, we can pass 'null' to 'setTexCooData' ??  
        {   
            this.setNormalsData( parser.normals_data )
            Log(`${fname} including normals data in the mesh`)
        }

        // normalize vertex positions
        this.normalizeCoords( ComputeBBox( this.coords_data ) )

        if ( this.texcoo_data != null )
        {
            // create a vertex color pattern from texture coordinates, just to  debug texture coordinates
            Log(`${fname} transfering t.cc. to vertex colors, num_verts == ${this.n_verts}`)
            let colors_data = new Float32Array( 3*this.n_verts )

            for( let iv = 0 ; iv < this.n_verts ; iv++ )
            {
                const pc = 3*iv,
                    pt = 2*iv,
                    s  = this.texcoo_data[pt+0],
                    t  = this.texcoo_data[pt+1],
                    ns = Math.floor( s*20 ),
                    nt = Math.floor( t*20 ),
                    b  = (ns+nt)% 2 == 0 ?  0.9 : 0.1

                colors_data[pc+0] = s
                colors_data[pc+1] = t
                colors_data[pc+2] = b
            }
            this.setColorsData( colors_data )
        }

        // compute triangle duals 
        this.computeTriangleDuals()

        // compute vertex normals ....
        this.computeVertexNormals()
        
    }
}
// -------------------------------------------------------------------------------------------------


class MultiMeshFromOBJLines  extends DrawableObject
{
    /**
     * Buids an indexed mesh from a strings array with the lines from an OBJ  file.
     * Sets 'parse_ok' and 'parse_message'
     * 
     * @param {Array<string>} lines -- input strings array with lines
     */
    constructor( lines, file_name )
    {
        let fname  = 'ObjectFromOBJLines.constructor():'

        Log(`${fname} file name == ${file_name}`)
        super( {name: file_name} )

        this.n_verts = 0  // total number of vertexes (0 means we can't use this object)
        this.n_tris  = 0

        this.has_texcoo = false 
        
        // parse the lines
        let parser = new OBJParser( lines )

        if ( ! parser.parse_ok )
        {   
            //super( null, null )  // empty mesh
            
            Log(`${fname} OBJ parse error`)
            Log(`${fname} ${parser.parse_message}`)
            Log(`${fname} ${parser.parse_message_line}`)
            alert( `Parse error:\n ${parser.parse_message}\n ${parser.parse_message_line}\n` )
            return
        }
        Log(`${fname} multimesh parsed ok, creating meshes ...`)

        this.meshes = []

        let normalize = true 
        let bbox      = null 

        for( let group of parser.groups )
        {
            this.n_verts += group.num_verts
            this.n_tris  += group.num_tris 

            Log(`${fname} creating mesh from group '${group.name}' ...`)
            let mesh = new IndexedTrianglesMesh( group.coords_data, group.triangles_data )
            mesh.name = group.name

            if ( group.texcoo_data != null )
            {   Log(`${fname} (group has tex coords)`)
                this.has_texcoo = true 
                mesh.setTexCooData( group.texcoo_data )
            }
            this.meshes.push( mesh )

            if ( normalize )
                bbox = ( bbox == null ) ? ComputeBBox( group.coords_data )
                                        : MergeBBoxes( bbox, ComputeBBox( group.coords_data ))
        }
        Log(`${fname} END (multimesh created ok)`)

        if ( normalize )
            for( let mesh of this.meshes )
                mesh.normalizeCoords( bbox )

        for( let mesh of this.meshes )
            mesh.computeTriangleDuals()

        // do this, even if maybe some meshes already have normals.....
        for( let mesh of this.meshes )
            mesh.computeVertexNormals()
        
        //super( parser.coords_data, parser.triangles_data )
        
    }
    // -------------------------------------------------------------------------------------------------
    hasTextCoords()
    {
        return this.has_texcoo
    }
    // -------------------------------------------------------------------------------------------------
    hasNormals()
    {
        return false 
    }
    // -------------------------------------------------------------------------------------------------
    draw( wgl_ctx )
    {
        for( let mesh of this.meshes )
        {
            //Log(`Multimesh draw, class name = '${mesh.constructor.name}'`)
            mesh.draw( wgl_ctx )
        }
    }
    // ----------------------------------------------------------------------------------
    /**
     * Intersects this mesh with a ray  (brute-force, used for selection)
     * @param   {hit_data} ray triangle hit data object (see 'RayTriangleInt' function)
     * 
     */
    intersectRay( ray, hit_data )
    {
        const fname = 'MultiMeshFromOBJLines.intersectRay():'
        Log(`${fname} --------- begins ---------------------------`)

        for( let mesh of this.meshes )
        {
            Log(`${fname}     mesh == ${mesh.name}`)
            mesh.intersectRay( ray, hit_data ) 
        }
        Log(`${fname} ------------------ends ----------------------`)
    }
}
// -------------------------------------------------------------------------------------------------