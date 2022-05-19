import React from 'react'
import { Link } from 'react-router-dom'
import { IoCallOutline } from 'react-icons/io5'
import { BsEnvelope } from 'react-icons/bs'
import { FaRegPaperPlane } from 'react-icons/fa'

const Footer = () => {
    return (
        <div className='p-8 bg-primary text-white grid grid-cols-4 gap-x-8'>
            <div className="flex flex-col gap-y-2 col-span-2">
                <Link to="/" className='font-semibold text-xl'>eBoto Mo</Link>
                <span>An Online Voting System for CvSU Main Campus with Real-time Voting Count.</span>

                <div className="flex flex-col gap-y-2">
                    <div className="flex flex-row items-center gap-x-2.5">
                        <IoCallOutline className='text-xl' />
                        <span>+63 912 345 6789</span>
                    </div>
                    <div className="flex flex-row items-center gap-x-2.5">
                        <BsEnvelope className='text-xl' />
                        <a href='mailto:contact@eboto-mo.com'>contact@eboto-mo.com</a>
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <span className='font-semibold'>Quick Links:</span>
                <ul className='list-disc'>
                    <li><Link to="/about" className='font-regular'>About us</Link></li>
                    <li><Link to="/contact">Contact</Link></li>
                </ul>
            </div>
            <div className="flex flex-col gap-y-2">
                <span className='font-semibold text-xl'>Contact Us</span>
                <form action="" className='flex flex-col gap-1 items-end'>
                    <input className='w-full bg-black p-2 rounded-md outline-none' type="text" placeholder='Your email address' />
                    <textarea className='w-full bg-black p-2 rounded-md outline-none' name="" id="" placeholder='Message...'></textarea>
                    <button type="submit">
                        <div className="w-fit flex items-center gap-x-2 bg-black rounded-md p-2">
                            <FaRegPaperPlane />
                            <span>Send</span>
                        </div>
                    </button>
                </form>
            </div>
        </div>
    )
}

export default Footer