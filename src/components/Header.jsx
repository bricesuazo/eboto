import React from 'react'
import { Link } from 'react-router-dom'
import { BiLogOut } from 'react-icons/bi'
const Header = () => {
    return (
        <div className="select-none bg-primary flex items-center justify-between px-8 py-4 sticky top-0 z-50">
            <Link to="/" className="text-white font-semibold text-2xl">eBoto Mo</Link>

            <div className="flex items-center gap-x-4 ">
                <img className='h-10 w-10 rounded-full' src="https://yt3.ggpht.com/7WdX-cflWvM1AQeqQsib51WqrPi-QHl7970vrcWUe7h-_pZMXDqGnBvuaEBsINaLSnZYsLRKEA=s900-c-k-c0x00ffffff-no-rj" alt="" />
                <BiLogOut className='text-white text-2xl' />
            </div>
        </div>
    )
}

export default Header