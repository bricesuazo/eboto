import Layout from "./components/Layout";
import { FiEdit } from "react-icons/fi"

const App = () => {

  return (
    <div className="h-full bg-gray-50 relative">
      {
        // Update partylist
        // <Card title="Edit a partylist" titleIcon={<FiEdit />} center setPopupCard={setPopupCard}>
        //   <div className="flex flex-col gap-y-4">
        //     <div className="">
        //       <label htmlFor="name">Name: </label>
        //       <input className="outline-none border-2 p-2 w-full" type="text" name="name" placeholder="Update partylist's name" />
        //     </div>
        //     <div className="">
        //       <label htmlFor="acronym">Acronym: </label>
        //       <input className="outline-none border-2 p-2 w-full" type="text" name="acronym" placeholder="Update partylist's acronym" />
        //     </div>
        //     <Button>Update</Button>
        //   </div>
        // </Card>
      }
      <Layout />
    </div>
  )
}
export default App;
