import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"
import { Provider } from "react-redux"
import { store } from "./store/store"
import { ProtectedRoute, Layout } from "./components"
import { Dashboard, ClassView, Progress } from "./pages/student"
import DeckStudy from "./pages/student/DeckStudy"
import DeckExport from "./pages/student/DeckExport"
import { TeacherDashboard, TeacherClassView, TeacherDeckView, TeacherStudents, TeacherInsights, TeacherQuizGeneration, TeacherQuizExport } from "./pages/teacher"
import {
  AdminDashboard,
  AdminCreateCoursePage,
  AdminEditCoursePage,
  AdminCreateStudentPage,
  AdminCreateTeacherPage,
} from "./pages/admin"
import Help from "./pages/Help"



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
        <Route path="/admin" element={<Login />}></Route>
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
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <Layout>
                <TeacherStudents />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/insights"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <Layout>
                <TeacherInsights />
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
        <Route path="/export/:deckId" element={<ProtectedRoute allowedRoles={['STUDENT']}><DeckExport /></ProtectedRoute>} />

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
        <Route
          path="/teacher/quiz"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <Layout>
                <TeacherQuizGeneration />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quiz/export"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <Layout>
                <TeacherQuizExport />
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

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/create"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
              <Layout>
                <AdminCreateCoursePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/edit"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
              <Layout>
                <AdminEditCoursePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students/create"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
              <Layout>
                <AdminCreateStudentPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers/create"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
              <Layout>
                <AdminCreateTeacherPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/help" element={
          <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMINISTRATOR']}>
            <Layout>
              <Help />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}



export default App
