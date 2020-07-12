
// ------------------------------------------------------------------------------------------------


function N2S( x )
{
    let str = x.toLocaleString( 'EN', {minimumFractionDigits: 3, maximumFractionDigits: 3})
    if ( x >= 0.0 )
        str = ' '+str
    return str
}
// ------------------------------------------------------------------------------------------------
// Class for tuples with 3 real numbers, simple precission storage (but doubl precision operations, 
// as every floating point number operation in javascript ??)

class Vec3 extends Float32Array
{
    constructor( obj )
    {
        if ( obj.constructor.name == 'Float32Array' )
            super( [ obj[0], obj[1], obj[2] ])
        else
            super( obj )

        if ( this.length != 3 )
            throw Error(`Vec3.constructor: the length is not 3 but ${this.length}`)
    }

    toString()  { return `(${N2S(this[0])},${N2S(this[1])},${N2S(this[2])})` }

    plus ( v )  { return new Vec3([ this[0]+v[0], this[1]+v[1], this[2]+v[2] ]) }
    minus( v )  { return new Vec3([ this[0]-v[0], this[1]-v[1], this[2]-v[2] ]) }
    scale( a )  { return new Vec3([ a*this[0],    a*this[1],     a*this[2]   ]) }
    dot  ( v )  { return this[0]*v[0] + this[1]*v[1] + this[2]*v[2] }

    cross( v )  { return new Vec3([  this[1]*v[2]-this[2]*v[1], 
                                     this[2]*v[0]-this[0]*v[2], 
                                     this[0]*v[1]-this[1]*v[0] 
                                 ]) 
                }

    normalized() 
    {   const lsq = this.len_sq()
        return lsq != 0 ? this.scale(1/Math.sqrt(lsq)) : this ;
    }
    len_sq()
    {
        return this[0]*this[0] + this[1]*this[1] + this[2]*this[2] 
    }
     
    x() { return this[0] }
    y() { return this[1] }
    z() { return this[2] }
    
    r() { return this[0] }
    g() { return this[1] }
    b() { return this[2] }
}
// ------------------------------------------------------------------------------------------------
// Class for tuples with 3 reals numbers, double precision storage

class Vec3d extends Float64Array
{
    constructor( obj )
    {
        super( obj )

        if ( this.length != 3 )
            throw Error(`Vec3d.constructor(): the length is not 3 but ${this.length}`)
    }

    toString() { return `(${this[0]},${this[1]},${this[2]})` }

    plus ( v ) { return new Vec3d([ this[0]+v[0], this[1]+v[1], this[2]+v[2] ]) }
    minus( v ) { return new Vec3d([ this[0]-v[0], this[1]-v[1], this[2]-v[2] ]) }
    scale( a ) { return new Vec3d([ a*this[0],    a*this[1],     a*this[2]   ]) }
    dot  ( v ) { return this[0]*v[0] + this[1]*v[1] + this[2]*v[2] }

    cross( v ) { return new Vec3d([  this[1]*v[2]-this[2]*v[1], 
                                     this[2]*v[0]-this[0]*v[2], 
                                     this[0]*v[1]-this[1]*v[0] ]) }

    normalized() 
    {   const lsq = this[0]*this[0] + this[1]*this[1] + this[2]*this[2] 
        return lsq != 0 ? this.scale(1/Math.sqrt(lsq)) : this ;
    }
     
    x() { return this[0] }
    y() { return this[1] }
    z() { return this[2] }
    
    r() { return this[0] }
    g() { return this[1] }
    b() { return this[2] }
}
// ------------------------------------------------------------------------------------------------

class Vec2 extends Float32Array
{
    constructor( obj )
    {
        super( obj )
        if ( this.length != 2 )
            throw Error(`Vec2.constructor: the length is not 2 but ${this.length}`)
    }
    toString() { return `(${this[0]},${this[1]})` }

    plus ( v ) { return new Vec3([ this[0]+v[0], this[1]+v[1] ]) }
    minus( v ) { return new Vec3([ this[0]-v[0], this[1]-v[1] ]) }
    scale( a ) { return new Vec3([ a*this[0],    a*this[1],   ]) }
    dot  ( v ) { return this[0]*v[0] + this[1]*v[1]  }

    normalized( ) 
    {   const lsq = this[0]*this[0] + this[1]*this[1] 
        return lsq != 0 ? this.scale(1/Math.sqrt(l)) : this ;
    }
 
    s() { return this[0] }
    t() { return this[1] }
}
// ------------------------------------------------------------------------------------------------

function Is4x4Array( obj )
{
    // simple, fast check 
    // if ( obj.constructor.name == 'Array' )
    // if ( obj.length == 4 )
    // if ( obj[0].constructor.name == 'Array')
    //     return true 
    // return false 

    // 'detailed' check 
    if ( obj.constructor.name != 'Array' )
        return false
    if ( obj.length != 4 )
        return false 

    for( let i = 0 ; i < 4 ; i++ )
    {
        if ( obj[i].constructor.name != 'Array' )
            return false
        if ( obj[i].length != 4)
            return false 
    }
    
    return true
}

// ------------------------------------------------------------------------------------------------

/**
 * Class 'Mat4'
 * A 'Mat4' object is a 'Float32Array' object with 16 numbers, stored by using column-major order,
 * suited for WebGL apps. This means the value at row 'row' and column 'col' is at index 'row+4*col'
 */
class Mat4 extends Float32Array 
{
    /**
     * Builds a 'Mat4' (that is, a 'Float32Array') by using object 'obj'
     * 'obj' can be 'null', can be a 'number', an array of arrays of numbers (row-major),
     * or anything which is valid as a parameter for 'Float32Array' class constructor.
     * @param {*} obj 
     */
    constructor( obj ) 
    {
        if ( obj == null ) // if 'null' is received, then the identity matrix is built
        {    
            super( 16 )   // creates a 'Float32Array' with 16 zeros

            // set to 1 the values in the diagonal
            this[0]  = 1.0
            this[5]  = 1.0
            this[10] = 1.0
            this[15] = 1.0
        }
        else if ( (typeof obj) == 'number' )
        {   
            super( 16 )        // creates a 'Float32Array' with 16 zeros
            this.fill( obj )   // fills with a number
        }
        else if ( Is4x4Array( obj ) )
        {
            // we assume 'obj' is an array with four rows, where each row is an array with 4 numbers
            // we initialize this Float32Array by using  column-major order (as webGL expects)
            super(16)
            for( let row = 0 ; row < 4 ; row++ )
            for( let col = 0 ; col < 4 ; col++ )
                this[row + col*4] = (obj[row])[col]
        }
        else
            super( obj ) // uses 'obj' whatever it is (in particular, it can be another 'Mat4', but also a 'Float32Array'
       
        // check the object was correctly build (we don't chek the contents are numbers, only check the length)
        if ( this.length != 16 )
            throw Error(`Mat4.constructor: invalid 'obj' type or length. The resulting matrix length is not 16 but ${this.length}`)
    }
    // -----------------------------------------
    toString() 
    {
        let str = '\n'
        const n = 3

        for( let row = 0 ; row<4 ; row++ )
        {   const b = 
            str = str + `   | ${N2S(this[row+0])}, ${N2S(this[row+4])}, ${N2S(this[row+8])}, ${N2S(this[row+12])} |\n`
        }    
        return str    
    }
    // -----------------------------------------
    compose( m )
    {
        let res = new Mat4(0) // 4x4 matrix, filled with zeros
        
        for( let row = 0 ; row<4 ; row++ )
            for( let col = 0 ; col<4 ; col++ )
                for( let k = 0 ; k<4 ; k++ )
                    res[row + col*4] += this[row + k*4] * m[k + col*4]
                    // ==> res(row,col) += this(row,k) * m(k,col)
        
        // optimized version (does it works?)
        // for( let row = 0 ; row<4 ; row++ )
        //     for( let col4 = 0 ; col4<16 ; col4 += 4 )
        //     {
        //         let k4 = 0
        //         for( let k = 0 ; k<4 ; k++ )
        //             res[row+col4] += this[row+k4] * m[k+col4]
        //         k4 += 4 
        //     }

        return res
    }
    // -----------------------------------------
    /**
     *  apply this matrix to a Vec3 and a floating value 'w' (the W coordinate of the Vec3)
     * returns the resulting Vec3 vector
     * @param   {Vec3}   v  -- x,y,z coordinates of vector or point
     * @param   {Number} w  -- 0 (if 'v' is a free vector) or 1 (when 'v' is a point)
     * @returns {Vec3}      -- resulting vector, after aplying this matrix to (v;w)
     */
    apply_to( v, w )
    {
        let res = new Vec3([ 0.0, 0.0, 0.0 ])

        for( let row = 0 ; row < 3 ; row++ )
            for( let col = 0 ; col < 4 ; col++ )
                res[ row ]  +=  this[ row + col*4 ] * 
                                ( (col < 3) ? v[ col ] : w )
        return res
    }

    // ------------------------------------------------------------------------------------------------
    /**
     * Returns the transpose of this matrix
     * @returns {Mat4} -- transpose of this matrix
     */
    transposed(  )
    {
        let res = new Mat4( 0.0 ) // creates a 4x4 matrix, filled with zeros

        for( let row = 0 ; row < 4 ; row++ )
            for( let col = 0 ; col < 4 ; col++ )
                res[ row + 4*col ] = this[ col + 4*row ]
        
        return res
    }
    // --------------------------------------------------------------------------------------------
    /**
     * Returns the determinant of the upper left 3x3 submatrix (matrix without translation terms)
     *  @returns {Number} -- determinant 
     */
    determinant3()
    {
        return    this[0]*this[5]*this[10] + this[1]*this[6]*this[8]  + this[2]*this[4]*this[9]
                - this[2]*this[5]*this[8]  - this[1]*this[4]*this[10] - this[0]*this[6]*this[9]
    }

    // --------------------------------------------------------------------------------------------
    /**
     * Returns a minor of the upper left 3x3 submatrix
     * @param {number} row  -- row index (cell to exclude from the minor)   (0,1 or 2)
     * @param {number} col   -- column index (for cell to exclude from the minor) (0,1 or 2) 
     */
    cofactor( row, col )
    {
        const
            r1 = (row+1) % 3,
            r2 = (row+2) % 3,
            c1 = 4*( (col+1) % 3 ),
            c2 = 4*( (col+2) % 3 ) 
            
        return this[ r1+c1 ]*this[ r2+c2 ] - this[ r1+c2 ]*this[ r2+c1 ] 
    }
    // --------------------------------------------------------------------------------------------
    /**
     * Returns the inverse of this matrix (this matrix must have no projection terms, that is 
     * last row must be [0,0,0,1])
     * @returns {Mat4} -- inverse of this matrix 
     */
    inverse()
    {
        const det = this.determinant3()
            
        if ( Math.abs( det ) < 1e-15 )
            throw new Error('unable to invert matrix, determinant is near zero')

        // inverse translation matrix
        const tr_inv = Mat4_Translate([ -this[12], -this[13], -this[14] ])
        
        // inverse of the 3x3 upper left sub-matrix
        let sm3_inv = new Mat4( 0.0 )  

        // compute 'sm3_inv' using matrix of cofactors
        sm3_inv[15] = 1.0 
        for( let row = 0 ; row < 3 ; row++ )
            for( let col = 0 ; col < 3 ; col++ )
                sm3_inv[ col + 4*row ] = this.cofactor( row, col ) /det 
                // (assignement to transposed element at 'col+4*row' instead of 'row+4*col')

        // result transform is: (1) inverse translation  and (2) inverse of 3x3 submatrix
        return sm3_inv.compose( tr_inv )
        
    }
}
// ------------------------------------------------------------------------------------------------

function Mat4_Identity()
{   
    // return new Mat4
    // ([  [ 1, 0, 0, 0 ],
    //     [ 0, 1, 0, 0 ],
    //     [ 0, 0, 1, 0 ],
    //     [ 0, 0, 0, 1 ]
    // ])
    return new Mat4( null )
}
// ------------------------------------------------------------------------------------------------

function Mat4_Translate( v )
{
    return new Mat4
    ([  [ 1, 0, 0, v[0] ],
        [ 0, 1, 0, v[1] ],
        [ 0, 0, 1, v[2] ],
        [ 0, 0, 0, 1    ]
    ])
}

// ------------------------------------------------------------------------------------------------

function Mat4_Scale( v )
{
    return new Mat4
    ([  [ v[0], 0,    0,    0 ],
        [ 0,    v[1], 0,    0 ],
        [ 0,    0,    v[2], 0 ],
        [ 0,    0,    0,    1 ]
    ])
}

// ------------------------------------------------------------------------------------------------
// /**
//  * Returns the transpose of a matrix
//  * @param {Mat4} m -- original matrix to transpose
//  */
// function Mat4_Transpose( m )
// {
//     let res = new Float32Array( 16 ) // creates a 'Float32Array' with 16 zeros

//     for( row = 0 ; row < 4 ; row++ )
//         for( col = 0 ; col < 4 ; col++ )
//             res[ row + 4*col ] = m[ col + 4*row ]
    
//     return new Mat4( res )
// }

// ------------------------------------------------------------------------------------------------
/**
 * Returns a rotation matrix, whose axis is X axis, and angle is 'theta_deg'
 * @param {number} theta_deg -- rotation angle, in degrees 
 */
function Mat4_RotationXdeg( theta_deg )
{
    const theta_rad = (theta_deg*Math.PI)/180.0 , 
          c = Math.cos( theta_rad ),
          s = Math.sin( theta_rad )

    return new Mat4
    ([  [ 1,  0,  0,  0 ],
        [ 0,  c, -s,  0 ],
        [ 0,  s,  c,  0 ],
        [ 0,  0,  0,  1 ]
    ])
}

// ------------------------------------------------------------------------------------------------
/**
 * Returns a rotation matrix, whose axis is Y axis, and angle is 'theta_deg'
 * @param {number} theta_deg -- rotation angle, in degrees 
 */
function Mat4_RotationYdeg( theta_deg )
{
    const theta_rad = (theta_deg*Math.PI)/180.0 , 
          c = Math.cos( theta_rad ),
          s = Math.sin( theta_rad )

    return new Mat4
    ([   [  c,  0,  s,  0 ],
         [  0,  1,  0,  0 ],
         [ -s,  0,  c,  0 ],
         [  0,  0,  0,  1 ]
    ])
}

// ------------------------------------------------------------------------------------------------
/**
 * Returns a rotation matrix, whose axis is Z axis, and angle is 'theta_deg'
 * @param {number} theta_deg -- rotation angle, in degrees 
 */
function Mat4_RotationZdeg( theta_deg )
{
    const theta_rad = (theta_deg*Math.PI)/180.0 , 
          c = Math.cos( theta_rad ),
          s = Math.sin( theta_rad )

    return new Mat4
    ([  [ c, -s,  0,  0 ],
        [ s,  c,  0,  0 ],
        [ 0,  0,  1,  0 ],
        [ 0,  0,  0,  1 ]
    ])
}




// ------------------------------------------------------------------------------------------------
// A projection for simple undistorted 2D drawings 
// Maps [-1..+1]x[-1..+1], to the center of the viewport, undistorted, with maximun size

function Mat4_UndProj2D( sx, sy )
{      
    const min = Math.min(sx,sy),
          fx  = min/sx,
          fy  = min/sy

    return new Mat4
    ([  [ fx, 0,  0,  0 ],
        [ 0,  fy, 0,  0 ],
        [ 0,  0,  1,  0 ],
        [ 0,  0,  0,  1 ]
    ])
    
}
// ---------------------------------------------------------------------

/**
 * Returns the OpenGL frustum matrix (http://docs.gl/gl2/glFrustum)
 * @param {number} l -- left (X lower limit  at z=n) 
 * @param {number} r -- right (X upper limit at z=n)
 * @param {number} b -- bottom (Y lower limit at z=n)
 * @param {number} t -- top (Y upper limit at z=n)
 * @param {number} n -- near (distance to Z limit, nearest to viewer)
 * @param {number} f -- far  (distance to Z limit, farthest to viewer)
 * @returns {Mat4}   -- a matrix with the entries corresponding to glFrustum call.
 */
function Mat4_Frustum( l, r, b, t, n, f )
{
    const eps = 1e-6 
    Check( Math.abs(r-l) > eps && Math.abs(t-b) > eps  && Math.abs(n-f) > eps );

    const 
        irl = 1.0/(r-l) ,
        itb = 1.0/(t-b) ,
        inf = 1.0/(n-f) ,
        a0  = 2.0*n*irl,  a2 = (r+l)*irl,
        b1  = 2.0*n*itb,  b2 = (t+b)*itb ,
        c2  = (n+f)*inf,  c3 = 2.0*f*n*inf 

    return new Mat4
    ([  [ a0,    0.0,    a2,    0.0 ],
        [ 0.0,   b1,     b2,    0.0 ],
        [ 0.0,   0.0,    c2,    c3  ],
        [ 0.0,   0.0,   -1.0,   0.0 ]
    ])
}
// ------
/**
 * Returns the OpenGL orthogonal proj matrix (http://docs.gl/gl2/glOrtho)
 * * (adjusted so visible region is on the -Z axis, as in perspective projection)
 * @param {number} l -- left (X lower limit  at z=n) 
 * @param {number} r -- right (X upper limit at z=n)
 * @param {number} b -- bottom (Y lower limit at z=n)
 * @param {number} t -- top (Y upper limit at z=n)
 * @param {number} n -- near (distance to Z limit, nearest to viewer)
 * @param {number} f -- far  (distance to Z limit, farthest to viewer)
 * @returns {Mat4}   -- a matrix with the entries corresponding to glOrtho call.
 */

function Mat4_Ortho( l, r, b, t, n, f )
{
    const eps = 1e-6 
    Check( Math.abs(r-l) > eps && Math.abs(t-b) > eps  && Math.abs(n-f) > eps );

    const 
        irl = 1.0/(r-l) ,
        itb = 1.0/(t-b) ,
        inf = 1.0/(n-f) ,
        sx =  2.0*irl,
        sy =  2.0*itb,
        sz =  2.0*inf,      // here sign is negative in 'glOrtho'
        tx = -(r+l)*irl,
        ty = -(t+b)*itb,
        tz = +(n+f)*inf    // here sign is negative in 'glOrtho'

    return new Mat4
    ([  [ sx,    0.0,    0.0,   tx  ],
        [ 0.0,   sy,     0.0,   ty  ],
        [ 0.0,   0.0,    sz,    tz  ],    
        [ 0.0,   0.0,    0.0,  1.0  ]    
    ])
}

// ------------------------------------------------------------------------------------------------
/**
 * Returns the an OpenGL orthogonal proj matrix which takes into account size and viewport ratio
 * @param {number} asp_rat  -- viewport aspect ratio (Y/X)  (>0)
 * @param {number} hsy      -- half size of visible region in Y (half height...)
 * @param {number} n        -- near (distance to Z limit, nearest to viewer)
 * @param {number} f        -- far  (distance to Z limit, farthest to viewer)
 * @returns {Mat4}          -- a matrix with the entries corresponding to glFrustum call.
 */
function Mat4_Orthogonal( asp_rat, hsy, n, f )
{
    const eps = 1e-6 
    Check( asp_rat > eps )
    Check( hsy > eps )

    const r = hsy/asp_rat,
          l = -r,
          b = -hsy,
          t = +hsy 

    return Mat4_Ortho( l, r, b, t, n, f )
}

// ------------------------------------------------------------------------------------------------
/**
 * Returns a frustum perspective matrix, by using an alternative parameter set (calls Mat4_Frustum)
 * (see: https://stackoverflow.com/questions/16571981/gluperspective-parameters-what-do-they-mean)
 * 
 * @param {number} fovy_deg -- vertical field of view angle (in degrees) (0..180)
 * @param {number} asp_rat  -- viewport aspect ratio (Y/X)  (>0)
 * @param {number} n        -- distance from focus to near clipping plane (usually >0) 
 * @param {number} f        -- distance from focus to far clipping plane (>n)
 */
function Mat4_Perspective( fovy_deg, asp_rat, n, f )
{
   const eps = 1e-6 
   Check( asp_rat > eps && fovy_deg > eps  && Math.abs(n-f) > eps, 'Mat4_Perspective: invalid arguments' )

   const 
      fovy_rad = fovy_deg*2.0*Math.PI/360.0,
      t = n*Math.tan( 0.5*fovy_rad ),
      r = t/asp_rat,
      b = -t ,
      l = -r 

   return Mat4_Frustum( l, r, b, t, n, f )
}


// ------------------------------------------------------------------------------------------------

/**
 * Class 'Mat4d'  (similar to Mat4 but with double precission storage)
 * A 'Mat4' object is a 'Float64Array' object with 16 numbers, stored by using column-major order,
 * suited for WebGL apps. This means the value at row 'row' and column 'col' is at index 'row+4*col'
 */
class Mat4d extends Float64Array 
{
    /**
     * Builds a 'Mat4' (that is, a 'Float32Array') by using object 'obj'
     * 'obj' can be 'null', can be a 'number', an array of arrays of numbers (row-major),
     * or anything which is valid as a parameter for 'Float32Array' class constructor.
     * @param {*} obj 
     */
    constructor( obj ) 
    {
        if ( obj == null ) // if 'null' is received, then the identity matrix is built
        {    
            super( 16 )   // creates a 'Float32Array' with 16 zeros

            // set to 1 the values in the diagonal
            this[0]  = 1.0
            this[5]  = 1.0
            this[10] = 1.0
            this[15] = 1.0
        }
        else if ( (typeof obj) == 'number' )
        {   
            super( 16 )        // creates a 'Float64Array' with 16 zeros
            this.fill( obj )   // fills with a number
        }
        else if ( Is4x4Array( obj ) )
        {
            // we assume 'obj' is an array with four rows, where each row is an array with 4 numbers
            // we initialize this Float32Array by using  column-major order (as webGL expects)
            super(16)
            for( let row = 0 ; row < 4 ; row++ )
            for( let col = 0 ; col < 4 ; col++ )
                this[row + col*4] = (obj[row])[col]
        }
        else
            super( obj ) // uses 'obj' whatever it is (in particular, it can be another 'Mat4', but also a 'Float32Array'
       
        // check the object was correctly build (we don't chek the contents are numbers, only check the length)
        if ( this.length != 16 )
            throw Error(`Mat4d.constructor: invalid 'obj' type or length. The resulting matrix length is not 16 but ${this.length}`)
    }
    // -----------------------------------------
    toString() 
    {
        let str = '\n'
        const n = 3

        for( let row = 0 ; row<4 ; row++ )
        {   const b = 
            str = str + `   | ${N2S(this[row+0])}, ${N2S(this[row+4])}, ${N2S(this[row+8])}, ${N2S(this[row+12])} |\n`
        }    
        return str    
    }
    // -----------------------------------------
    compose( m )
    {
        let res = new Mat4d(0) // 4x4 matrix, filled with zeros
        
        for( let row = 0 ; row<4 ; row++ )
            for( let col = 0 ; col<4 ; col++ )
                for( let k = 0 ; k<4 ; k++ )
                    res[row + col*4] += this[row + k*4] * m[k + col*4]
                    // ==> res(row,col) += this(row,k) * m(k,col)
        
        // optimized version (does it works?)
        // for( let row = 0 ; row<4 ; row++ )
        //     for( let col4 = 0 ; col4<16 ; col4 += 4 )
        //     {
        //         let k4 = 0
        //         for( let k = 0 ; k<4 ; k++ )
        //             res[row+col4] += this[row+k4] * m[k+col4]
        //         k4 += 4 
        //     }

        return res
    }
    // -----------------------------------------
    /**
     *  apply this matrix to a Vec3 and a floating value 'w' (the W coordinate of the Vec3)
     * returns the resulting Vec3 vector
     * @param   {Vec3d}   v  -- x,y,z coordinates of vector or point
     * @param   {Number} w  -- 0 (if 'v' is a free vector) or 1 (when 'v' is a point)
     * @returns {Vec3d}      -- resulting vector, after aplying this matrix to (v;w)
     */
    apply_to( v, w )
    {
        let res = new Vec3d([ 0.0, 0.0, 0.0 ])

        for( let row = 0 ; row < 3 ; row++ )
            for( let col = 0 ; col < 4 ; col++ )
                res[ row ]  +=  this[ row + col*4 ] * 
                                ( (col < 3) ? v[ col ] : w )
        return res
    }

    // ------------------------------------------------------------------------------------------------
    /**
     * Returns the transpose of this matrix
     * @returns {Mat4d} -- transpose of this matrix
     */
    transposed(  )
    {
        let res = new Mat4d( 0.0 ) // creates a 4x4 matrix, filled with zeros

        for( let row = 0 ; row < 4 ; row++ )
            for( let col = 0 ; col < 4 ; col++ )
                res[ row + 4*col ] = this[ col + 4*row ]
        
        return res
    }
    // --------------------------------------------------------------------------------------------
    /**
     * Returns the determinant of the upper left 3x3 submatrix (matrix without translation terms)
     *  @returns {Number} -- determinant 
     */
    determinant3()
    {
        return    this[0]*this[5]*this[10] + this[1]*this[6]*this[8]  + this[2]*this[4]*this[9]
                - this[2]*this[5]*this[8]  - this[1]*this[4]*this[10] - this[0]*this[6]*this[9]
    }

    // --------------------------------------------------------------------------------------------
    /**
     * Returns a minor of the upper left 3x3 submatrix
     * @param {number} row  -- row index (cell to exclude from the minor)   (0,1 or 2)
     * @param {number} col   -- column index (for cell to exclude from the minor) (0,1 or 2) 
     */
    cofactor( row, col )
    {
        const
            r1 = (row+1) % 3,
            r2 = (row+2) % 3,
            c1 = 4*( (col+1) % 3 ),
            c2 = 4*( (col+2) % 3 ) 
            
        return this[ r1+c1 ]*this[ r2+c2 ] - this[ r1+c2 ]*this[ r2+c1 ] 
    }
    // --------------------------------------------------------------------------------------------
    /**
     * Returns the inverse of this matrix (this matrix must have no projection terms, that is 
     * last row must be [0,0,0,1])
     * @returns {Mat4} -- inverse of this matrix 
     */
    inverse()
    {
        const det = this.determinant3()
            
        if ( Math.abs( det ) < 1e-15 )
            throw new Error('unable to invert matrix, determinant is near zero')

        // inverse translation matrix
        const tr_inv = Mat4_Translate([ -this[12], -this[13], -this[14] ])
        
        // inverse of the 3x3 upper left sub-matrix
        let sm3_inv = new Mat4d( 0.0 )  

        // compute 'sm3_inv' using matrix of cofactors
        sm3_inv[15] = 1.0 
        for( let row = 0 ; row < 3 ; row++ )
            for( let col = 0 ; col < 3 ; col++ )
                sm3_inv[ col + 4*row ] = this.cofactor( row, col ) /det 
                // (assignement to transposed element at 'col+4*row' instead of 'row+4*col')

        // result transform is: (1) inverse translation  and (2) inverse of 3x3 submatrix
        return sm3_inv.compose( tr_inv )
        
    }
}

// -------------------------------------------------------------------------------------------------
// Class for rays ( a 'ray' is a half-line, defined by origin and direction vector, plus some other 
// auxiliary values used to accelerate computations

class Ray
{
    constructor( org, dir )
    {
        CheckType( org, 'Vec3')
        CheckType( dir, 'Vec3' )
        this.org = org 
        this.dir = dir
        this.oxd = this.org.cross( this.dir )
    }
}

// -----------------------------------------------------------------------------------------------
// A 3x3 matrix with single-precision floating point values:


class Mat3 extends Float32Array
{
    constructor( obj )
    {
        super(9)  // 9 zeros
        if ( obj === null )
            return
        
        // 'obj' must be an 'Array' with 3 'Vec3' (or an array with three numbers)  
        // (each array is a column of the matrix)
        // we initialize this Float32Array by using  column-major order (as webGL expects)
    
        for( let row = 0 ; row < 3 ; row++ )
            for( let col = 0 ; col < 3 ; col++ )
                this[row + col*3] = (obj[col])[row]
            
    }
    // --------------------------------------------------------------------------------------------
    /**
     * Returns the determinant of the upper left 3x3 submatrix (matrix without translation terms)
     *  @returns {Number} -- determinant 
     */
    determinant()
    {
        return    this[0]*this[4]*this[8] +  this[1]*this[5]*this[6] + this[2]*this[3]*this[7]
                - this[2]*this[4]*this[6]  - this[0]*this[5]*this[7] - this[1]*this[3]*this[8]
    }
    // --------------------------------------------------------------------------------------------
    /**
     * Returns a cofactor 
     * @param {number} row  -- row index (cell to exclude from the minor)   (0,1 or 2)
     * @param {number} col   -- column index (for cell to exclude from the minor) (0,1 or 2) 
     */
    cofactor( row, col )
    {
        const
            r1 = (row+1) % 3,
            r2 = (row+2) % 3,
            c1 = 3*( (col+1) % 3 ),
            c2 = 3*( (col+2) % 3 ) 
            
        return this[ r1+c1 ]*this[ r2+c2 ] - this[ r1+c2 ]*this[ r2+c1 ] 
    }
    // -----------------------------------------
    /**
     * Apply this matrix to a Vec3, returns the resulting Vec3 vector
     * @param   {Vec3}   v  -- x,y,z coordinates of vector or point
     * @returns {Vec3}      -- resulting vector, after aplying this matrix to (v;w)
     */
    apply_to( v )
    {
        let res_v = new Vec3([ 0.0, 0.0, 0.0 ])

        for( let row = 0 ; row < 3 ; row++ )
            for( let col = 0 ; col < 3 ; col++ )
                res_v[ row ]  +=  this[ row + col*3 ] * v[ col ]

        return res_v
    }
    // --------------------------------------------------------------------------------------------
    /**
     * Returns the inverse of this matrix (this matrix must have no projection terms, that is 
     * last row must be [0,0,0,1])
     * @param   {number} det -- this matrix determinant, must be != 0  (not checked)
     * @returns {Mat4} -- inverse of this matrix 
     */
    inverse( det )
    {
        //const det = this.determinant()
            
        //if ( Math.abs( det ) < 1e-12 )
        //    throw new Error('unable to invert 3x3 matrix, determinant is near zero')

        let inv_m = new Mat3( null )  

        for( let row = 0 ; row < 3 ; row++ )
            for( let col = 0 ; col < 3 ; col++ )
                inv_m[ col + 3*row ] = this.cofactor( row, col ) /det 
                // (assignement to transposed element at 'col+4*row' instead of 'row+4*col')

        // done
        return inv_m
    }
    // -----------------------------------------
    toString() 
    {
        let str = '\n'
        for( let row = 0 ; row<3 ; row++ )
            str = str + `   | ${N2S(this[row+0])}, ${N2S(this[row+3])}, ${N2S(this[row+6])} |\n`
        return str    
    }
    // -----------------------------------------

    compose( m )
    {
        let res = new Mat3( null ) // 3x3 matrix, filled with zeros
        
        for( let row = 0 ; row<3 ; row++ )
            for( let col = 0 ; col<3 ; col++ )
                for( let k = 0 ; k<3 ; k++ )
                    res[row + col*3] += this[row + k*3] * m[k + col*3]
                    // ==> res(row,col) += this(row,k) * m(k,col)
        return res
    }
    
}

// -----------------------------------------------------------------------------------------------

var zero_det_count    = 0,
    ray_tri_int_count = 0 

/**
 * Ray-triangle intersection test
 * @param {Ray}    ray       -- input ray
 * @param {object} tri       -- input object with: 'v0','v1','v2' (Vec3) and 'it' (natural number, >=0) 
 * @param {object} hit_data  -- input/output object with: 'hit' (true/false), if it is 'true' it means an intersection has already been found
 *                                                        'dist' (number>0), 'it' (natural number) 
 *                              this object is written iif the return value is true
 * 
 * (NO) @returns {bool}   -- true if an intersection has been found and: it is the first or is nearer than the one in 'hit_data' 
 *
 * See the plucker-coordinates-based algorithm description here:
 *   Ray-Triangle Intersection Algorithm for Modern CPU Architectures
 *   M. Shevtsov, A. Soupikov and A. Kapustin, GraphiCon' 2007
 *   http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.189.5084&rep=rep1&type=pdf
 */
function RayTriangleInt( ray, tri, hit_data )
{
    ray_tri_int_count ++ 

    const debug = false

    const 
        m   = (new Mat3([ tri.v1.minus(tri.v0), tri.v2.minus(tri.v0), ray.dir.scale(-1.0) ])),
        det = m.determinant()

    // if ( debug )
    // { 
    //     Log(`m == ${m}`)
    //     Log(`det == ${det}`)
    // }

    if ( Math.abs( det ) <  1e-10 )
    {   
        zero_det_count ++
        return false 
    }

    const 
        m_inv = m.inverse( det ),
        uvt   = m_inv.apply_to( ray.org.minus( tri.v0 ) )

    if ( uvt[0] < 0.0 || 1.0 < uvt[0] ) 
    {   
        //if ( debug ) Log("- A - ")
        return false                 // u out of [0..1]
    }

    if ( uvt[1] < 0.0 || 1.0 < uvt[1] ) 
    {   
        //if ( debug ) Log("- B - ")
        return false                 // v out of [0..1]
    }

    if ( 1.0 < uvt[0]+uvt[1] ) 
    {   
        //if ( debug ) Log("- C - ")
        return false   // u+v out of [0..1]
    }
    if ( uvt[2] < 0.0 ) 
    {   
        //if ( debug ) Log("- D - ")
        return false                                 // negative 't' value
    }
    if ( hit_data.hit )  if ( hit_data.dist < uvt[2] ) 
    {   
        //if ( debug ) Log("- E - ")
        return false  // hit found but farther than previous
    }
    if ( debug ) Log('HIT')

    hit_data.hit  = true 
    hit_data.it   = tri.it
    hit_data.dist = uvt[2]
    
    //if ( debug ) 
    //    Log(`RayTriangleInt(): better hit found: it == ${hit_data.it}, dist == ${hit_data.dist}`)
    
}
// --------------------
// -----------------------------------------------------------------------------------------------

var zero_det_count    = 0,
    ray_tri_int_count = 0 

/**
 * Ray-triangle intersection test, using the dual triangle representation
 * @param {Ray}    ray       -- input ray
 * @param {object} tri       -- input triangle in dual form (object with 'td' (Float32Array), 'it' (integer))
 * @param {object} hit_data  -- input/output object with: 'hit' (true/false), if it is 'true' it means an intersection has already been found
 *                                                        'dist' (number>0), 'it' (natural number) 
 *                              this object is written iif the return value is true
 * 
 * (NO) @returns {bool}   -- true if an intersection has been found and: it is the first or is nearer than the one in 'hit_data' 
 *
 
 */

 const rtdc_len = 8
 var rtdc = new Uint32Array( rtdc_len )

function RayTriDualInt( ray, tri_dual, hit_data )
{
    ray_tri_int_count ++ 

    const debug = false

    // early termination algorithm 
    // see: https://lsi.ugr.es/curena/varios/rtint/

    // offset into 
    const  b   = 13*tri_dual.it,
           s   = b+12,
           td  = tri_dual.td 
    
    if ( td[s] == 0.0 ) // degenerate triangle, done 
    {
        zero_det_count ++ 
        rtdc[0]++ 
        return false 
    }
    const e1d = b+0,
          e2d = b+3,
          n   = b+6,
          k   = b+9,
          d   = ray.dir,
          a   = -d[0]*td[n+0] - d[1]*td[n+1] - d[2]*td[n+2]
        
    if ( Math.abs( a ) < 1e-12 ) { rtdc[1]++ ; return false }
    
    const
        o  = ray.org, 
        on = o[0]*td[n+0] + o[1]*td[n+1]+ o[2]*td[n+2], 
        t  = (on - td[k+2])/a

   
    //Log(`it == ${b/13}, d == ${d}, on = ${on} a == ${a}, t == ${t}`)
    
    if ( t < 0.0 ) { rtdc[2]++ ; return false }

    if ( hit_data.hit )  if ( hit_data.dist < t ) { rtdc[3]++ ; return false } // hit found but farther than previous
    
    const p = [ o[0]+t*d[0], o[1]+t*d[1], o[2]+t*d[2] ],
          u = p[0]*td[e1d+0] + p[1]*td[e1d+1]+ p[2]*td[e1d+2]- td[k+0]
    
    if ( u < 0.0 || 1.0 < u) { rtdc[4]++ ;return false }

    const v = p[0]*td[e2d+0] + p[1]*td[e2d+1]+ p[2]*td[e2d+2]- td[k+1]
    
    if ( v < 0.0 || 1.0 < v) { rtdc[5]++ ;return false }

    const upv = u+v 

    if ( 1.0 < upv ) { rtdc[6]++ ;return false }

    hit_data.hit = true 
    hit_data.dist = t 
    hit_data.it   = tri_dual.it
    rtdc[7]++ 
}


// ----

function TestRayTriInt()
{

}

// ------------------------------------------------------------------------------------------------

function TestVec3()
{
    const fname = `TestVec3():`
    Log(`${fname} begins`)

    let a = new Vec3([ 4,6,8 ]),
        b = new Vec3( new Float32Array([4,6,8]) ),
        c = new Vec3( a )

    Log(`${fname} a==${a}, b==${b}, c==${c}`)
    Log(`${fname} a+b == ${a.plus(b)}`)
    Log(`${fname} a-b == ${a.minus(b)}`)
    Log(`${fname} a*3 == ${a.scale(3)}`)

    let k = a.cross(b)
    Log(`${fname} k == a cross b == ${k} (must be null)`)

    a = new Vec3([ 4,6,8])
    b = new Vec3([-4,6,8])

    k = a.cross(b)
    Log(`${fname} k == a cross b == ${k}`)
    Log(`${fname} a dot k == ${a.dot(k)}`)
    Log(`${fname} b dot k == ${b.dot(k)}`)

    Log(`${fname} ends`)
}
// ------------------------------------------------------------------------------------------------

/**
 * Does several test for 4x4 and 3x3 matrices in simple precision
 */
function TestMatrices()
{
    const fname = `TestMat4():`
    Log(`${fname} begins`)

    const m0 = Mat4_Identity()
    const cn = m0.constructor.name
    Log(`${fname} cn == '${cn}'`)

    const m1 = Mat4_Identity()
    Log(`${fname}  identity mat: m1 == ${m1}`)

    const m2 = Mat4_UndProj2D( 100, 120 )
    Log(`${fname}  un. 2d proj.: m2 == ${m2}`)


    const m3 = m1.compose( m2 )
    Log(`${fname} m1*m2 == m3 == ${m3}`)

    const m4 = Mat4_Translate([1, 2, 3])
    Log(`${fname} translate: m4 == ${m4}`)

    const m5 = Mat4_Translate( new Vec3([-1, -2, -3]) )
    Log(`${fname} translate II: m5 == ${m5}`)

    const m6 = Mat4_Scale( [1, 2, 3] )
    Log(`${fname} scale: m6 == ${m6}`)

    const m7 = Mat4_Scale( [1, 1/2, 1/3] )
    Log(`${fname} scale II: m7 == ${m7}`)

    const m8 = m4.compose( m5 )
    Log(`${fname} compose: m8 == ${m8}`)

    const m9 = m6.compose( m7 )
    Log(`${fname} compose II: m9 == ${m9}`)

    const mpersp = Mat4_Perspective( 90, 1.2, 0.1, 5.0 )
    Log(`${fname} perspective: mpersp == ${mpersp}`)

    Log(`${fname} ----------- test for the COPY constructor:`)

    const m10 = Mat4_Translate([1, 2, 3])
    const m11 = new Mat4( m10 )

    Log(`${fname} m10, original (translate) == ${m10}`)
    Log(`${fname} m11, copy     (equal?) == ${m11}`)


    Log(`${fname} ----- test for INVERSE matrix`)

    const 
        m12 = Mat4_Translate([1, 2, 3]),
        m13 = Mat4_Scale([ -0.5, 1.2, -1.8 ]),
        m14 = Mat4_RotationYdeg( 35 ),
        m15 = Mat4_RotationZdeg( 127 ),
        m16 = m15.compose( m14 ).compose( m13 ).compose( m12 ),
        m17 = m16.inverse(),
        m18 = m17.compose( m16 ),
        m19 = m16.compose( m17 )
    Log(`${fname} m18 (ident?) == ${m18}`)
    Log(`${fname} m19 (ident?) == ${m19}`)

    

    Log(`${fname} ----- tests for Mat3  INVERSE `)

    const 
        m20 = new Mat3
            ([  [  1.5, 2.8, -3.5 ],
                [  1.5, 0.5, -3.5 ],
                [ -1.7, 2.8, -3.5 ]
            ]),
        det = m20.determinant(),
        m21 = m20.inverse( det ),
        m22 = m21.compose( m20 ),
        m23 = m20.compose( m21 )

    Log(`${fname} m20 == ${m20}`)
    Log(`${fname} m22 (ident?) == ${m22}`)
    Log(`${fname} m23 (ident?) == ${m23}`)

    
    Log(`${fname} ends`)


}


