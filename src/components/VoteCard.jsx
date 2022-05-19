import { useState } from "react"

import undecidedImg from '../assets/imgs/election/candidates/undecided.png'

const VoteCard = ({ name, img, undecided }) => {
    const [selected, setSelected] = useState(false);

    return (
        <div onClick={() => setSelected(!selected)} className={`w-56 h-fit p-4 flex flex-col items-center justify-center gap-y-2 border-4 rounded-lg cursor-pointer hover:scale-105 transition-all hover:shadow-lg ${selected ? "text-white bg-primary border-white" : "border-gray"}`}>
            <img className={`rounded-lg ${(undecided & selected) && "invert"}`} src={!undecided ? img : undecidedImg} alt="" />
            <span className=" font-bold text-lg leading-5">{!undecided ? name : "Undecided"}</span>
        </div >
    )
}

export default VoteCard