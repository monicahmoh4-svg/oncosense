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
          dashboard: 'Dashboard',
          assessment: 'Health Assessment',
          results: 'My Results',
          aiConsultant: 'AI Assistant',
          consultations: 'Consultations',
          clinics: 'Find Clinics',
          imageScreening: 'Image Screening',
          profile: 'My Profile',
          logout: 'Logout',
          heroTitle: 'Early Cancer Detection',
          heroSubtitle: 'For Everyone',
          heroDesc: 'AI-powered cancer risk screening for underserved communities. Free, accessible, and designed for low-resource settings.',
          startAssessment: 'Start Free Assessment',
          learnMore: 'Learn More',
          login: 'Log In',
          register: 'Create Account',
          email: 'Email Address',
          phone: 'Phone Number',
          password: 'Password',
          firstName: 'First Name',
          lastName: 'Last Name',
          intakeTitle: 'Health Assessment',
          intakeDesc: 'Answer a few questions to assess your cancer risk',
          next: 'Next',
          back: 'Back',
          submit: 'Get My Results',
          step: 'Step',
          of: 'of',
          low: 'Low Risk',
          medium: 'Moderate Risk',
          high: 'High Risk',
          critical: 'Critical — Seek Care Now',
          disclaimer: '⚠️ This assessment is for screening purposes only and does NOT constitute a medical diagnosis. Please consult a qualified healthcare provider.',
          loading: 'Loading...',
          save: 'Save',
          cancel: 'Cancel',
          close: 'Close',
          viewAll: 'View All',
          noData: 'No data available',
        }
      },
      sw: {
        translation: {
          dashboard: 'Dashibodi',
          assessment: 'Tathmini ya Afya',
          results: 'Matokeo Yangu',
          aiConsultant: 'Msaidizi wa AI',
          consultations: 'Mashauriano',
          clinics: 'Tafuta Kliniki',
          imageScreening: 'Uchunguzi wa Picha',
          profile: 'Wasifu Wangu',
          logout: 'Toka',
          heroTitle: 'Kugundua Saratani Mapema',
          heroSubtitle: 'Kwa Kila Mtu',
          heroDesc: 'Uchunguzi wa hatari ya saratani kwa AI kwa jamii zinazohitaji huduma.',
          startAssessment: 'Anza Tathmini ya Bure',
          learnMore: 'Jifunze Zaidi',
          login: 'Ingia',
          register: 'Fungua Akaunti',
          email: 'Barua pepe',
          phone: 'Nambari ya Simu',
          password: 'Nenosiri',
          firstName: 'Jina la Kwanza',
          lastName: 'Jina la Ukoo',
          intakeTitle: 'Tathmini ya Afya',
          intakeDesc: 'Jibu maswali machache kupima hatari ya saratani',
          next: 'Endelea',
          back: 'Rudi',
          submit: 'Pata Matokeo Yangu',
          step: 'Hatua',
          of: 'ya',
          low: 'Hatari Ndogo',
          medium: 'Hatari ya Wastani',
          high: 'Hatari Kubwa',
          critical: 'Muhimu — Tafuta Huduma Sasa',
          disclaimer: '⚠️ Tathmini hii ni kwa madhumuni ya uchunguzi tu na HAITOI utambuzi wa kimatibabu.',
          loading: 'Inapakia...',
          save: 'Hifadhi',
          cancel: 'Ghairi',
          close: 'Funga',
          viewAll: 'Tazama Zote',
          noData: 'Hakuna data',
        }
      },
      fr: {
        translation: {
          dashboard: 'Tableau de bord',
          assessment: 'Évaluation de santé',
          results: 'Mes résultats',
          aiConsultant: 'Assistant IA',
          consultations: 'Consultations',
          clinics: 'Trouver des cliniques',
          imageScreening: 'Dépistage par image',
          profile: 'Mon profil',
          logout: 'Déconnexion',
          heroTitle: 'Détection précoce du cancer',
          heroSubtitle: 'Pour tous',
          heroDesc: "Dépistage du risque de cancer par IA pour les communautés mal desservies.",
          startAssessment: "Commencer l'évaluation gratuite",
          learnMore: 'En savoir plus',
          login: 'Connexion',
          register: 'Créer un compte',
          email: 'Adresse e-mail',
          phone: 'Numéro de téléphone',
          password: 'Mot de passe',
          firstName: 'Prénom',
          lastName: 'Nom de famille',
          intakeTitle: 'Évaluation de santé',
          intakeDesc: 'Répondez à quelques questions pour évaluer votre risque de cancer',
          next: 'Suivant',
          back: 'Retour',
          submit: 'Obtenir mes résultats',
          step: 'Étape',
          of: 'sur',
          low: 'Risque faible',
          medium: 'Risque modéré',
          high: 'Risque élevé',
          critical: 'Critique — Consultez immédiatement',
          disclaimer: '⚠️ Cette évaluation est uniquement à des fins de dépistage et ne constitue PAS un diagnostic médical.',
          loading: 'Chargement...',
          save: 'Enregistrer',
          cancel: 'Annuler',
          close: 'Fermer',
          viewAll: 'Voir tout',
          noData: 'Aucune donnée disponible',
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
          style: {
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '14px',
            borderRadius: '12px'
          },
          success: { iconTheme: { primary: '#14b88a', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
