import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import { Provider } from "react-redux"
import { store } from "./store/store"
import { ProtectedRoute, Layout } from "./components"
import { Dashboard, ClassView, Progress } from "./pages/student"
import DeckStudy from "./pages/student/DeckStudy"
import { TeacherDashboard, TeacherClassView } from "./pages/teacher"
import {TeacherDeckView} from "./pages/teacher"



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
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />

        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <Layout>
                <TeacherDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/class/:classId" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Layout>
              <ClassView />
            </Layout>
          </ProtectedRoute>
        } />

        <Route
          path="/teacher/class/:classId"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <Layout>
                <TeacherClassView />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/study/:deckId" element={<ProtectedRoute allowedRoles={['STUDENT']}><DeckStudy /></ProtectedRoute>} />

        <Route
          path="/teacher/deck/:deckId"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <Layout>
                <TeacherDeckView />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/progress" element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <Layout>
              <Progress />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}



export default App
