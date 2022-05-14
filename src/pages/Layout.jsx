import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Header, Dashboard, Signin, Signup, Home, ElectionLanding, ElectionVote, ElectionRealtime } from './index'

const Layout = () => {
    return (
        <div className='h-full'>
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
        </div>
    )
}

export default Layout