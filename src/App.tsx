import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import { Provider } from "react-redux"
import { store } from "./store/store"
import { ProtectedRoute, Layout } from "./components"
import { Dashboard, ClassView } from "./pages/student"
import DeckStudy from "./pages/student/DeckStudy"




function App() {

  return (
    <Provider store={store}>
      <AppRoutes />
    </Provider>
  )
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />}></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/register" element={<Register />}></Route>
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/class/:classId" element={
          <ProtectedRoute>
            <Layout>
              <ClassView />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/study/:deckId" element={<ProtectedRoute><DeckStudy /></ProtectedRoute>} />

        /* More routes as needed */
      </Routes>
    </BrowserRouter>
  )
}



export default App
