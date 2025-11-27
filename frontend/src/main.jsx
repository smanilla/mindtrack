import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import DoctorDashboard from './pages/DoctorDashboard.jsx'
import RegisterPatient from './pages/RegisterPatient.jsx'
import Profile from './pages/Profile.jsx'
import Report from './pages/Report.jsx'
import Contacts from './pages/Contacts.jsx'
import AIAssessment from './pages/AIAssessment.jsx'
import Journal from './pages/Journal.jsx'
import AllEntries from './pages/AllEntries.jsx'
import ReadJournal from './pages/ReadJournal.jsx'
import PatientSummaries from './pages/PatientSummaries.jsx'
import DoctorPatientReport from './pages/DoctorPatientReport.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import './style.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Doctor routes */}
          <Route path="/doctor/dashboard" element={
            <>
              <Header />
              <DoctorDashboard />
              <Footer />
            </>
          } />
          <Route path="/doctor/register-patient" element={
            <>
              <Header />
              <RegisterPatient />
              <Footer />
            </>
          } />
          <Route path="/doctor/profile" element={
            <>
              <Header />
              <Profile />
              <Footer />
            </>
          } />
          <Route path="/doctor/journal" element={<Journal />} />
          <Route path="/doctor/read-journal" element={
            <>
              <Header />
              <ReadJournal />
              <Footer />
            </>
          } />
          <Route path="/doctor/patient/:patientId/report" element={
            <>
              <Header />
              <DoctorPatientReport />
              <Footer />
            </>
          } />
          
          {/* Patient routes */}
          <Route path="/patient/dashboard" element={
            <>
              <Header />
              <Dashboard />
              <Footer />
            </>
          } />
          <Route path="/patient/profile" element={
            <>
              <Header />
              <Profile />
              <Footer />
            </>
          } />
          <Route path="/patient/report" element={
            <>
              <Header />
              <Report />
              <Footer />
            </>
          } />
          <Route path="/patient/contacts" element={
            <>
              <Header />
              <Contacts />
              <Footer />
            </>
          } />
          <Route path="/patient/ai-assistant" element={
            <>
              <Header />
              <AIAssessment />
              <Footer />
            </>
          } />
          <Route path="/patient/journal" element={<Journal />} />
          <Route path="/patient/all-entries" element={
            <>
              <Header />
              <AllEntries />
              <Footer />
            </>
          } />
          <Route path="/patient/read-journal" element={
            <>
              <Header />
              <ReadJournal />
              <Footer />
            </>
          } />
          <Route path="/patient/summaries" element={
            <>
              <Header />
              <PatientSummaries />
              <Footer />
            </>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

const container = document.getElementById('app')
createRoot(container).render(<App />)


