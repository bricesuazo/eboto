import { Link } from 'react-router-dom'
import { dashboardSidebar } from '../dummyData'

const DashboardSidebar = () => {
    return (
        <div className='flex flex-col'>
            {dashboardSidebar.map((sidebar) => (
                <Link className="flex items-center gap-x-4 hover:bg-blue-100 p-4 cursor-pointer" to={`./${sidebar.name.toLowerCase()}`} key={sidebar.id}>
                    {/* {console.log(`.${sidebar.to}`)} */}
                    <span className="text-2xl">{sidebar.icon}</span>
                    <div className="">{sidebar.name}</div>
                </Link>
            ))}
        </div>
    )
}

export default DashboardSidebar