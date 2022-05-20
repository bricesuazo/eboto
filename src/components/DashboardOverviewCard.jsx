import React from 'react'

const DashboardOverviewCard = ({ icon, title, subtitle, color }) => {
    return (
        <div className={`w-full flex items-center justify-between rounded bg-[${color}] p-4`}>
            <span className='text-6xl '>
                {icon}
            </span>
            <div className="flex flex-col text-right font-bold">
                <span className=' text-5xl'>
                    {title}
                </span>
                <span className="text-xl">
                    {subtitle}
                </span>
            </div>
        </div >
    )
}

export default DashboardOverviewCard