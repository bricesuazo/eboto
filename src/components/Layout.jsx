import React from 'react'
// import { HashRouter, BrowserRouter as Router} from 'react-router-dom'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { Header, Dashboard, Signin, Signup, Home, ElectionLanding, ElectionVote, ElectionRealtime } from '../pages/index'
import Footer from './Footer'

const Layout = () => {
    return (
        <div className='h-full'>
            <HashRouter>
                {/* <Router> */}
                <Header />
                <Routes>
                    <Route exact path="/" element={<Home />} />
                    <Route path="/dashboard/*" element={<Dashboard />} />
                    <Route path="/signin" element={<Signin />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/voter-signin" element={<Signup />} />
                    <Route path="/:election" element={<ElectionLanding />} />
                    <Route path="/:election/vote" element={<ElectionVote />} />
                    <Route path="/:election/realtime" element={<ElectionRealtime />} />
                </Routes>
                <Footer />
                {/* </Router> */}
            </HashRouter>
        </div>
    )
}

export default Layout