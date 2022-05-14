import React from 'react'

const DashboardMain = ({ type }) => {
    return (
        <span className='font-bold text-xl'>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
    )
}

export default DashboardMain