import SignupCard from '../components/SignupCard'

const Signup = () => {
    return (
        <div className='flex h-screen'>
            <div className="bg-gray-500 flex-1">
                <span className='text-white font-bold grid place-items-center h-full text-2xl'>Create an account in eBoto Mo</span>
            </div>
            <div className="flex-1 grid place-items-center z-10">
                <SignupCard />

            </div>
        </div>
    )
}

export default Signup