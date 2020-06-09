
// ------------------------------------------------------------------------------------------------


function N2S( x )
{
    let str = x.toLocaleString( 'EN', {minimumFractionDigits: 3, maximumFractionDigits: 3})
    if ( x >= 0.0 )
        str = ' '+str
    return str
}
// ------------------------------------------------------------------------------------------------

class Vec3 extends Float32Array
{
    constructor( obj )
    {
        super( obj )

        if ( this.length != 3 )
            throw Error(`Vec3.constructor: the length is not 3 but ${this.length}`)
    }

    toString() { return `(${this[0]},${this[1]},${this[2]})` }

    plus ( v ) { return new Vec3([ this[0]+v[0], this[1]+v[1], this[2]+v[2] ]) }
    minus( v ) { return new Vec3([ this[0]-v[0], this[1]-v[1], this[2]-v[2] ]) }
    scale( a ) { return new Vec3([ a*this[0],    a*this[1],     a*this[2]   ]) }
    dot  ( v ) { return this[0]*v[0] + this[1]*v[1] + this[2]*v[2] }
     
    x() { return this[0] }
    y() { return this[1] }
    z() { return this[2] }
    
    r() { return this[0] }
    g() { return this[1] }
    b() { return this[2] }
}

// ------------------------------------------------------------------------------------------------

class Mat4 extends Float32Array 
{
    constructor( obj ) 
    {
        if ( obj == null )
        {    
            super( 16 )   // fills with zeros
        }
        else if ( (typeof obj) == 'number' )
        {   
            super( 16 )
            this.fill( obj )   // fills with a number
        }
        else
            super( obj ) // uses 'obj' whatever it is
       

        if ( this.length != 16 )
            throw Error(`Mat4.constructor: the length is not 16 but ${this.length}`)
    }
    toString()
    {
        let str = '\n'
        const n = 3

        for( let i = 0 ; i<4 ; i++ )
        {   const b = i*4
            str = str + `   | ${N2S(this[b+0])}, ${N2S(this[b+1])}, ${N2S(this[b+2])}, ${N2S(this[b+3])} |\n`
        }    
        return str    
    }
    compose( m )
    {
        let res = new Mat4(null) // 4x4 matrix, filled with zeros
        
        let a = 0
        for( let i = 0 ; i<4 ; i++ )
        {   for( let j = 0 ; j < 4 ; j++ )
            {   let b = j
                for( let k = 0 ; k < 4 ; k++ )
                {   res[a+j] += this[a+k]*m[b]
                    b += 4 
                }
            }
            a += 4
        }
        return res
    }
}
// ------------------------------------------------------------------------------------------------

function Mat4_Identity()
{   
    return new Mat4
    ([  1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1 
    ])
}
// ------------------------------------------------------------------------------------------------

function Mat4_Translate( v )
{
    return new Mat4
    ([  1, 0, 0, v[0],
        0, 1, 0, v[1],
        0, 0, 1, v[2],
        0, 0, 0, 1 
    ])
}

// ------------------------------------------------------------------------------------------------

function Mat4_Scale( v )
{
    return new Mat4
    ([  v[0], 0,    0,    0,
        0,    v[1], 0,    0,
        0,    0,    v[2], 0,
        0,    0,    0,    1 
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
    ([  fx, 0,  0,  0,
        0,  fy, 0,  0,
        0,  0,  1,  0,
        0,  0,  0,  1 
    ])
    
}

/**
 // ---------------------------------------------------------------------

Matriz4f MAT_Frustum( const float l, const float r, const float b, const float t, const float n, const float f )
{
   const float eps = 1e-6 ;
   assert( fabs(r-l) > eps && fabs(t-b) > eps  && fabs(n-f) > eps );

   const float
      irl = 1.0f/(r-l) ,
      itb = 1.0f/(t-b) ,
      inf = 1.0f/(n-f) ;
   const float
      a0 = 2.0f*n*irl ,
      a2 = (r+l)*irl,
      b1 = 2.0f*n*itb ,
      b2 = (t+b)*itb ,
      c2 = (n+f)*inf ,
      c3 = 2.0f*f*n*inf ;

   Matriz4f
      res ;

   res(0,0) = a0  ; res(0,1) = 0.0; res(0,2) = a2  ; res(0,3) = 0.0 ;
   res(1,0) = 0.0 ; res(1,1) = b1 ; res(1,2) = b2  ; res(1,3) = 0.0 ;
   res(2,0) = 0.0 ; res(2,1) = 0.0; res(2,2) = c2  ; res(2,3) = c3  ;
   res(3,0) = 0.0 ; res(3,1) = 0.0; res(3,2) = -1.0; res(3,3) = 0.0 ;

   return res ;
}

**/

// ---------------------------------------------------------------------

/**
 * Returns the OpenGL frustum matrix (http://docs.gl/gl2/glFrustum)
 * @param {number} l 
 * @param {number} r 
 * @param {number} b 
 * @param {number} t 
 * @param {number} n 
 * @param {number} f 
 * @returns {number} a Mat4 object with the entries corresponding to glFrustum call.
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
    ([  a0,    0.0,    a2,    0.0,
        0.0,   b1,     b2,    0.0,
        0.0,   0.0,    c2,    c3,
        0.0,   0.0,   -1.0,   0.0 
    ])
}

/** 

// ---------------------------------------------------------------------

Matriz4f MAT_Ortografica( const float l, const float r, const float b, const float t, const float n, const float f )
{
   const float eps = 1e-6 ;
   assert( fabs(r-l) > eps && fabs(t-b) > eps  && fabs(n-f) > eps );

   const float
      irl = 1.0f/(l-r) ,
      itb = 1.0f/(b-t) ,
      inf = 1.0f/(n-f) ;
   const float
      a0 = -2.0f*irl ,
      a3 = (r+l)*irl,
      b1 = -2.0f*itb ,
      b3 = (t+b)*itb ,
      c2 = 2.0f*inf ,
      c3 = (f+n)*inf ;

   Matriz4f
      res ;

   res(0,0) = a0  ; res(0,1) = 0.0 ; res(0,2) = 0.0 ; res(0,3) = a3  ;
   res(1,0) = 0.0 ; res(1,1) = b1  ; res(1,2) = 0.0 ; res(1,3) = b3  ;
   res(2,0) = 0.0 ; res(2,1) = 0.0 ; res(2,2) = c2  ; res(2,3) = c3  ;
   res(3,0) = 0.0 ; res(3,1) = 0.0 ; res(3,2) = 0.0 ; res(3,3) = 1.0 ;

   return res ;
}

// ---------------------------------------------------------------------

Matriz4f MAT_Perspectiva( const float fovy_grad, const float raz_asp, const float n, const float f )
{
   const float eps = 1e-6 ;
   assert( raz_asp > eps && fovy_grad > eps  && fabs(n-f) > eps );

   const float
      fovy_rad = fovy_grad*2.0f*M_PI/360.0f,
      t = n*tan(0.5*fovy_rad),
      r = t/raz_asp,
      b = -t ,
      l = -r ;

   return MAT_Frustum( l,r,b,t,n,f );
}
 */

// ------------------------------------------------------------------------------------------------

/**
 * Returns a frustum perspective matrix, by using an alternative parameter set
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

function TestVec3()
{
    const fname = `TestVec3() :`
    Log(`${fname} begins`)

    let a = new Vec3([ 4,6,8 ]),
        b = new Vec3( new Float32Array([4,6,8]) ),
        c = new Vec3( a )

    Log(`${fname} TestVec3: a==${a}, b==${b}, c==${c}`)
    Log(`${fname} a+b == ${a.plus(b)}`)
    Log(`${fname} a-b == ${a.minus(b)}`)
    Log(`${fname} a*3 == ${a.scale(3)}`)

    Log(`${fname} ends`)
}
// ------------------------------------------------------------------------------------------------

function TestMat4()
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

    Log(`${fname} ends`)

}
// ------------------------------------------------------------------------------------------------

// function Mat4f_Identity()
// {
//     return new Float32Array
//         ([  1, 0, 0, 0,
//             0, 1, 0, 0,
//             0, 0, 1, 0,
//             0, 0, 0, 1 
//         ])
// }

// // ------------------------------------------------------------------------------------------------


// function Mat4f_UndProj2D( sx, sy )
// {
//     const min = Math.min(sx,sy),
//           fx  = min/sx,
//           fy  = min/sy

//     return new Float32Array
//         ([  fx, 0,  0, 0,
//             0,  fy, 0, 0,
//             0,  0,  1, 0,
//             0,  0,  0, 1 
//         ])
// }


// function Mat4f_Multiply( ma, mb )
// {

//     CheckType( ma, 'Float32Array')
//     CheckType( mb, 'Float32Array')
// }


