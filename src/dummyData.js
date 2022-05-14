import { BiHome, BiCheckCircle } from 'react-icons/bi'
import { CgProfile } from 'react-icons/cg'
import { FiFlag } from 'react-icons/fi'
import { BsPersonCheck } from 'react-icons/bs'
import { IoSettingsOutline } from 'react-icons/io5'

export const dashboardSidebar = [
    {
        id: 1,
        name: "Overview",
        icon: <BiHome />,
    },
    {
        id: 2,
        name: "Position",
        icon: <CgProfile />,
    },
    {
        id: 3,
        name: "Partylist",
        icon: <FiFlag />,
    },
    {
        id: 4,
        name: "Candidate",
        icon: <BsPersonCheck />,
    },
    {
        id: 5,
        name: "Voter",
        icon: <BiCheckCircle />,
    },
    {
        id: 6,
        name: "Settings",
        icon: <IoSettingsOutline />,
    },
]
export const elections = [
    {
        name: "CSSO Election 2022"
    },
    {
        name: "CvSU CSG Election 2022"
    },
]