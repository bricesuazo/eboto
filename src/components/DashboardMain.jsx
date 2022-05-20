import DashboardOverviewCard from "./DashboardOverviewCard"
import VotingLink from "./VotingLink"
import { BsCheck2Circle, BsPersonCircle } from 'react-icons/bs'
import TagInput from "./TagInput";
import { useState } from "react";


const DashboardMain = ({ type }) => {
    const [positions, setPositions] = useState([]);
    const [partylists, setPartylists] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const dashboardMain = (type) => {
        switch (type) {
            case "overview":
                return (
                    <>
                        <div className="grid grid-cols-2 w-full gap-4">

                            <VotingLink />
                            <div className="">
                                <DashboardOverviewCard icon={<BsCheck2Circle />} title="1, 762" subtitle="Voted" color={"#91EC71"} />
                                <DashboardOverviewCard icon={<BsPersonCircle />} title="2, 358" subtitle="Voters" color={"#71D6EC"} />
                            </div>
                        </div>
                    </>
                )
            case "position":
                return (
                    <>
                        <TagInput type="position" tags={positions} setTags={setPositions} />
                    </>
                )
            case "partylist":
                return (
                    <>
                        <TagInput type="partylist" tags={partylists} setTags={setPartylists} />
                    </>
                )
            case "candidate":
                return (
                    <>
                        <TagInput type="candidate" tags={candidates} setTags={setCandidates} />
                    </>
                )
            default:
                return "default"
        }

    }
    return (
        <div className='flex flex-col'>
            <span className='font-bold text-xl border-b pb-2'>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <div className="py-4 flex">
                {dashboardMain(type)}
            </div>
        </div>
    )
}

export default DashboardMain