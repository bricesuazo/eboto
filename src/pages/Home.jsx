import React from 'react'
import { Link } from 'react-router-dom'
import { elections } from '../dummyData'

const Home = () => {
    return (
        <div className='p-8 flex flex-col capitalize'>
            <h1 className='font-bold text-xl'>Links</h1>
            <Link className="text-blue-600 hover:underline w-fit" to="/dashboard">Dashboard</Link>
            <Link className="text-blue-600 hover:underline w-fit" to="/signin">Signin</Link>
            <Link className="text-blue-600 hover:underline w-fit" to="/signup">Signup</Link>
            <Link className="text-blue-600 hover:underline w-fit" to="/voter-signin">Voter Signin</Link>
            {
                elections.map((election) => (
                    <ul key={election.id} className="list-disc mt-4">
                        <span className='text-xl font-bold'>

                            {election.name}
                        </span>
                        <li className="flex flex-col">
                            <Link className="text-blue-600 hover:underline w-fit" to={`/${election.electionIDName}`}>{election.name}</Link>
                            <Link className="text-blue-600 hover:underline w-fit" to={`/${election.electionIDName}/vote`}>{election.name} Vote</Link>
                            <Link className="text-blue-600 hover:underline w-fit" to={`/${election.electionIDName}/realtime`}>{election.name} Realtime</Link>
                        </li>
                    </ul>
                ))
            }

        </div>
    )
}

export default Home