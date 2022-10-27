import Link from "next/link";
import { dashboardSidebar } from "../constant/constant";

const DashboardSidebar = () => {
  return (
    <div className="flex flex-col">
      {dashboardSidebar.map((sidebar) => (
        <Link
          className="flex items-center gap-x-4 hover:bg-blue-100 p-4 cursor-pointer"
          href={`./dashboard/${sidebar.name.toLowerCase()}`}
          key={sidebar.id}
        >
          <a className="flex items-center">
            <p className="w-6">{sidebar.icon}</p>
            <div className="">{sidebar.name}</div>
          </a>
        </Link>
      ))}
    </div>
  );
};

export default DashboardSidebar;
