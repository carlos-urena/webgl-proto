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
        for( let i = 0 ; i<4 ; i++ )
        {   const b = i*4
            str = str + `   | ${this[b+0]}, ${this[b+1]}, ${this[b+2]}, ${this[b+3]} |\n`
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


