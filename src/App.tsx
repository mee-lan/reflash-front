import { BrowserRouter, Routes,Route,Navigate } from "react-router-dom"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import { Provider } from "react-redux"
import { store } from "./store/store"
import { ProtectedRoute } from "./components"
import Dashboard from "./pages/student/Dashboard"

function App() {

  return (
    <Provider store={store}>
      <AppRoutes/>
    </Provider>
  )
}

function AppRoutes(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace/>}></Route>
        <Route path="/login" element={<Login/>}></Route>
        <Route path="/register" element={<Register/>}></Route>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        
        /* More routes as needed */
      </Routes>
    </BrowserRouter>
  )
}



export default App
