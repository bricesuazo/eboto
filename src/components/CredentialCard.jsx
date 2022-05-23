import React from 'react'

const SigninCard = ({ children }) => {
    return (
        <div className='relative'>
            <div className='grid place-items-center gap-y-4 rounded-lg border-primary border-2 w-fit p-4 bg-white z-20'>
                {children}
                <div className='absolute top-2 left-2 grid place-items-center rounded-lg border-primary border-2 w-full h-full -z-10'>
                </div>
            </div>
        </div>
    )
}

export default SigninCard