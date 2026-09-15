import AppRoutes from './routes/AppRoutes'
import { AuthProvider } from './context/AuthContext'
import { ChatsProvider } from './context/ChatsContext'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <ChatsProvider>
        <AppRoutes />
      </ChatsProvider>
    </AuthProvider>
  )
}

export default App
