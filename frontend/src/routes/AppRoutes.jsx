import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from '../layouts/Layout'
import Home from '../pages/Home'
import ChatList from '../pages/ChatList'
import ChatThread from '../pages/ChatThread'
import Profile from '../pages/Profile'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<ChatList />} />
          <Route path="/chat/:id" element={<ChatThread />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
