import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import App from './App'
import './index.css'

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: localStorage.getItem('oncosense-lang') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    resources: {
      en: {
        translation: {
          dashboard: 'Dashboard', assessment: 'Health Assessment',
          results: 'My Results', aiConsultant: 'AI Assistant',
          consultations: 'Consultations', clinics: 'Find Clinics',
          imageScreening: 'Image Screening', profile: 'My Profile',
          logout: 'Logout', login: 'Log In', register: 'Create Account',
          heroTitle: 'Early Cancer Detection', heroSubtitle: 'For Everyone',
          heroDesc: 'AI-powered cancer risk screening for underserved communities. Free, accessible, designed for low-resource settings.',
          startAssessment: 'Start Free Assessment', learnMore: 'Learn More',
          loading: 'Loading...',
        }
      },
      sw: {
        translation: {
          dashboard: 'Dashibodi', assessment: 'Tathmini ya Afya',
          results: 'Matokeo Yangu', aiConsultant: 'Msaidizi wa AI',
          consultations: 'Mashauriano', clinics: 'Tafuta Kliniki',
          imageScreening: 'Uchunguzi wa Picha', profile: 'Wasifu Wangu',
          logout: 'Toka', login: 'Ingia', register: 'Fungua Akaunti',
          heroTitle: 'Kugundua Saratani Mapema', heroSubtitle: 'Kwa Kila Mtu',
          heroDesc: 'Uchunguzi wa hatari ya saratani kwa AI kwa jamii zinazohitaji huduma.',
          startAssessment: 'Anza Tathmini ya Bure', learnMore: 'Jifunze Zaidi',
          loading: 'Inapakia...',
        }
      },
      fr: {
        translation: {
          dashboard: 'Tableau de bord', assessment: 'Evaluation de sante',
          results: 'Mes resultats', aiConsultant: 'Assistant IA',
          consultations: 'Consultations', clinics: 'Trouver des cliniques',
          imageScreening: 'Depistage par image', profile: 'Mon profil',
          logout: 'Deconnexion', login: 'Connexion', register: 'Creer un compte',
          heroTitle: 'Detection precoce du cancer', heroSubtitle: 'Pour tous',
          heroDesc: 'Depistage du risque de cancer par IA pour les communautes mal desservies.',
          startAssessment: "Commencer l'evaluation gratuite", learnMore: 'En savoir plus',
          loading: 'Chargement...',
        }
      }
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { fontFamily: 'sans-serif', fontSize: '14px', borderRadius: '12px' },
          success: { iconTheme: { primary: '#14b88a', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
