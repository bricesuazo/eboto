import { BiHome, BiCheckCircle } from "react-icons/bi"
import { CgProfile } from "react-icons/cg"
import { FiFlag } from "react-icons/fi"
import { BsPersonCheck } from "react-icons/bs"
import { IoSettingsOutline } from "react-icons/io5"

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
        "id": 0,
        "name": "CSSO Election 2022",
        "electionIDName": "CSSOElection2022",
        "positions": [
            {
                id: 0,
                "title": "President",
            },
            {
                id: 1,
                "title": "Vice-President",
            },
            {
                id: 2,
                "title": "Secretary",
            },
            {
                id: 3,
                "title": "Treasurer",
            },
            {
                id: 4,
                "title": "Auditor",
            },
        ],

        "partylists": [
            {
                "name": "Independent",
                "acronym": "IND",
            },
            {
                "name": "Kapit Sa Patalim",
                "acronym": "KSP",
                "about": "",
            },
            {
                "name": "Liwanag",
                "acronym": "LP",
                "about": "",
            }
        ],
    },
    {
        "id": 1,
        "name": "SSG Election 2021",
        "electionIDName": "ssg-election",
        "positions": [
            {
                id: 0,
                "title": "yewugfuyebf",
            },
            {
                id: 1,
                "title": "Vice-President",
            },
            {
                id: 2,
                "title": "Secretary",
            },
            {
                id: 3,
                "title": "Treasurer",
            },
            {
                id: 4,
                "title": "Auditor",
            },
        ],

        "partylists": [
            {
                "name": "Independent",
                "acronym": "IND",
            },
            {
                "name": "Kapit Sa Patalim",
                "acronym": "KSP",
                "about": "",
            },
            {
                "name": "Liwanag",
                "acronym": "LP",
                "about": "",
            }
        ],
    }
];

export const candidates = [
    {
        "firstName": "Brice Brine",
        "middleName": "Silagan",
        "lastName": "Suazo",
        "img": "",
        "position": elections[0].positions[0],
        "partylist": elections[0].partylists[1],
    },
    {
        "firstName": "Pedro",
        "middleName": "XXX",
        "lastName": "Penduko",
        "img": "",
        "position": elections[0].positions[0],
        "partylist": elections[0].partylists[2],
    },
    {
        "firstName": "Juan",
        "middleName": "Alfonso",
        "lastName": "Dela Cruz",
        "img": "",
        "position": elections[0].positions[1],
        "partylist": elections[0].partylists[1],
    },
    {
        "firstName": "Jose",
        "middleName": "Eilrusdhg",
        "lastName": "Batumbakal",
        "img": "",
        "position": elections[0].positions[1],
        "partylist": elections[0].partylists[2],
    },
    {
        "firstName": "Kalaman",
        "middleName": "",
        "lastName": "Sy",
        "img": "",
        "position": elections[0].positions[2],
        "partylist": elections[0].partylists[0],
    },
    {
        "firstName": "Marie",
        "middleName": "C",
        "lastName": "Santos",
        "img": "",
        "position": elections[0].positions[3],
        "partylist": elections[0].partylists[0],
    },
    {
        "firstName": "Joy",
        "middleName": "De Guzman",
        "lastName": "Reyes",
        "img": "",
        "position": elections[0].positions[4],
        "partylist": elections[0].partylists[1],
    },
];