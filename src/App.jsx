import { BrowserRouter as Router } from "react-router-dom";
import Layout from "./pages/Layout";

const App = () => {
  return (
    <Router>
      <div className="h-screen bg-gray-50">
        <Layout />
      </div>
    </Router>
  )
}
export default App;
