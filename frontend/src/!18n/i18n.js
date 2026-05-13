import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      // Nav
      dashboard: 'Dashboard',
      assessment: 'Health Assessment',
      results: 'My Results',
      consultations: 'Consultations',
      clinics: 'Find Clinics',
      imageScreening: 'Image Screening',
      profile: 'My Profile',
      logout: 'Logout',

      // Landing
      heroTitle: 'Early Cancer Detection',
      heroSubtitle: 'For Everyone',
      heroDesc: 'AI-powered cancer risk screening for underserved communities. Free, accessible, and designed for low-resource settings.',
      startAssessment: 'Start Free Assessment',
      learnMore: 'Learn More',

      // Auth
      login: 'Log In',
      register: 'Create Account',
      email: 'Email Address',
      phone: 'Phone Number',
      password: 'Password',
      firstName: 'First Name',
      lastName: 'Last Name',

      // Intake
      intakeTitle: 'Health Assessment',
      intakeDesc: 'Answer a few questions to assess your cancer risk',
      next: 'Next',
      back: 'Back',
      submit: 'Get My Results',
      step: 'Step',
      of: 'of',

      // Risk levels
      low: 'Low Risk',
      medium: 'Moderate Risk',
      high: 'High Risk',
      critical: 'Critical — Seek Care Now',

      // Disclaimer
      disclaimer: '⚠️ This assessment is for screening purposes only and does NOT constitute a medical diagnosis. Please consult a qualified healthcare provider.',

      // Common
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
      consultations: 'Mashauriano',
      clinics: 'Tafuta Kliniki',
      imageScreening: 'Uchunguzi wa Picha',
      profile: 'Wasifu Wangu',
      logout: 'Toka',
      heroTitle: 'Kugundua Saratani Mapema',
      heroSubtitle: 'Kwa Kila Mtu',
      heroDesc: 'Uchunguzi wa hatari ya saratani kwa AI kwa jamii zinazohitaji huduma. Bure, rahisi, na imeundwa kwa mazingira ya rasilimali chache.',
      startAssessment: 'Anza Tathmini ya Bure',
      disclaimer: '⚠️ Tathmini hii ni kwa madhumuni ya uchunguzi tu na HAITOI utambuzi wa kimatibabu. Tafadhali wasiliana na daktari aliyehitimu.',
      loading: 'Inapakia...',
      low: 'Hatari Ndogo',
      medium: 'Hatari ya Wastani',
      high: 'Hatari Kubwa',
      critical: 'Muhimu — Tafuta Huduma Sasa',
      login: 'Ingia',
      register: 'Fungua Akaunti',
      next: 'Endelea',
      back: 'Rudi',
      submit: 'Pata Matokeo Yangu',
    }
  },
  fr: {
    translation: {
      dashboard: 'Tableau de bord',
      assessment: 'Évaluation de santé',
      results: 'Mes résultats',
      consultations: 'Consultations',
      clinics: 'Trouver des cliniques',
      imageScreening: 'Dépistage par image',
      profile: 'Mon profil',
      logout: 'Déconnexion',
      heroTitle: 'Détection précoce du cancer',
      heroSubtitle: 'Pour tous',
      heroDesc: "Dépistage du risque de cancer par IA pour les communautés mal desservies. Gratuit, accessible et conçu pour les environnements à faibles ressources.",
      startAssessment: 'Commencer l\'évaluation gratuite',
      disclaimer: '⚠️ Cette évaluation est uniquement à des fins de dépistage et ne constitue PAS un diagnostic médical. Veuillez consulter un professionnel de santé qualifié.',
      loading: 'Chargement...',
      low: 'Risque faible',
      medium: 'Risque modéré',
      high: 'Risque élevé',
      critical: 'Critique — Consultez immédiatement',
      login: 'Connexion',
      register: 'Créer un compte',
      next: 'Suivant',
      back: 'Retour',
      submit: 'Obtenir mes résultats',
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('oncosense-lang') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

export default i18n
