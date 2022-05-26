import React from 'react'

const TwoColumnDivision = ({ children }) => {
    return (
        <div className='flex h-screen w-full'>
            <div className="hidden md:block bg-gray-500 flex-1">
                <span className='text-white font-bold grid place-items-center h-full text-2xl'>Login to your account in eBoto Mo</span>
            </div>
            <div className="flex-1 w-full grid place-items-center z-10 mx-8">
                {children}
            </div>
        </div>
    )
}

export default TwoColumnDivision