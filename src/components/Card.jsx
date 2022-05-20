import { RiCloseLine } from 'react-icons/ri'
import Button from './Button'

const Card = ({ children, title, titleIcon, setPopupCard }) => {
    return (
        <>
            <div className="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] bg-white rounded-md w-96 p-4 z-10 text-center">
                <div className='flex items-center justify-between border-b-2 text-xl pb-2'>
                    <div className="flex items-center justify-between gap-2 font-bold text-xl">
                        <span>{title}</span>
                        {titleIcon}
                    </div>
                    <div className="hover:bg-gray-100 p-1 rounded-full cursor-pointer text-2xl transition">
                        <RiCloseLine onClick={() => setPopupCard(false)} />
                    </div>
                </div>
                <div className="py-2 flex flex-col gap-y-2">
                    {children}
                    <div onClick={() => setPopupCard(false)}>
                        <Button>Confirm vote</Button>
                    </div>
                </div>
            </div>
            <div className="bg-black-50 w-screen h-screen" onClick={() => setPopupCard(false)}></div>
        </>
    )
}

export default Card