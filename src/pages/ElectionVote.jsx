import VoteCard from '../components/VoteCard'
import candidateImg1 from '../assets/imgs/election/candidates/1.png'
import { candidates, elections } from '../dummyData'

const ElectionVote = () => {
    return (
        <div className='flex flex-col gap-y-12 items-center text-center'>
            <div className="w-full bg-election-cover bg-no-repeat bg-center bg-cover overflow-hidden ">
                <div className="h-80 flex items-center justify-center bg-black-50">
                    <span className='text-white text-4xl font-bold '>CSSO Election 2022</span>
                </div>
            </div>
            <div className="flex flex-col gap-y-8">
                {elections[0].positions.map((position) => (
                    <div key={position.id} className="flex gap-y-4 flex-col">
                        <span className='text-2xl font-bold'>{position.title}</span>
                        <div className="flex gap-x-4 justify-center">
                            {candidates.filter((candidate1) => position.title === candidate1.position.title).map((candidate2, j) => (
                                <VoteCard key={j} name={`${candidate2.lastName}, ${candidate2.firstName} ${candidate2.middleName !== "" ? candidate2.middleName != null ? candidate2.middleName.charAt(0).toUpperCase().concat(".") : "" : ""} (${candidate2.partylist.acronym.toUpperCase()})`} img={candidateImg1} />
                            ))}
                            <VoteCard undecided />
                        </div>
                    </div>
                ))}

            </div>
        </div>
    )
}

export default ElectionVote