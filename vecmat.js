// ------------------------------------------------------------------------------------------------

function Mat4f_Identity()
{
    return new Float32Array
        ([  1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1 
        ])

}


// ------------------------------------------------------------------------------------------------
// A projection for 2D drawings such that in one axis we cover from -1 to +1, 
// and -r to +r in the other axis, where r = 

function Mat4f_Projection2D( sx, sy )
{
    const m = Math.min( sx, sy )
    return new Float32Array
        ([  sx/2, 0,    0,  sx/2,
            0,    sy/2, 0,  sy/2,
            0,    0,    1,  0,
            0,    0,    0,  1 
        ])
}