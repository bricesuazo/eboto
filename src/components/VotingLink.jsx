import { FaGlobeAsia } from 'react-icons/fa'
import { BiCopy } from 'react-icons/bi'

const VotingLink = () => {
    return (
        <div className='border w-full h-fit rounded'>
            <div className="flex items-center gap-x-2 p-2 border-b">
                <FaGlobeAsia className='text-xl' />
                <span className='font-bold'>Voting URLs</span>
            </div>
            <div className="p-2 flex flex-col">
                <span>Election URL:</span>
                <div className="flex">
                    <input type="text" id="electionLinkInput" disabled value={`https://www.eboto-mo.com/`} className='w-full border p-2' />
                    <button className='flex items-center gap-x-2 border p-2 hover:bg-gray-50 transition-colors' onClick={() => {
                        const inputField = document.getElementById("electionLinkInput");
                        navigator.clipboard.writeText(inputField.value);
                    }
                    }>
                        <BiCopy />
                        <span>Copy</span>
                    </button>
                </div>
            </div>
        </div >
    )
}

export default VotingLink