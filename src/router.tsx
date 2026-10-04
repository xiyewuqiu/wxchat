import { createBrowserRouter, Navigate } from 'react-router-dom'
import { RootLayout } from './App'
import { LoginPage } from './pages/LoginPage'
import { ChatPage } from './pages/ChatPage'
import { RequireAuth } from './components/RequireAuth'

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        path: '/',
        element: (
          <RequireAuth>
            <ChatPage />
          </RequireAuth>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])