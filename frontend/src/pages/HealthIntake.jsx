import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { assessmentService } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { offlineQueue } from '../offline/db'
import toast from 'react-hot-toast'

const TOTAL_STEPS = 5

const ToggleBtn = ({ value, onChange, label, icon }) => (
  <button type="button" onClick={() => onChange(!value)}
    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all w-full
      ${value ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
    <span className="text-lg">{icon}</span>
    <span>{label}</span>
    {value && <CheckCircle2 className="w-4 h-4 text-brand-600 ml-auto" />}
  </button>
)

const StepIndicator = ({ current, total }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className={`transition-all duration-300 rounded-full
        ${i < current ? 'w-6 h-3 bg-brand-600' : i === current ? 'w-8 h-3 bg-brand-600' : 'w-3 h-3 bg-gray-200'}`} />
    ))}
  </div>
)

export default function HealthIntake() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    // Step 1: Demographics
    age: '', gender: '', country: 'Kenya', region: '',
    // Step 2: Lifestyle
    smoking_status: 'never', smoking_pack_years: 0, alcohol_use: 'none',
    bmi: '', physical_activity: 'moderate', diet_quality: 'fair',
    // Step 3: Medical & Family History
    hiv_positive: false, previous_cancer: false, immunosuppressed: false,
    hepatitis_b: false, hepatitis_c: false, diabetes: false,
    family_cancer_history: false, family_cancer_types: [],
    hpv_vaccinated: false, number_of_pregnancies: 0,
    // Step 4: Symptoms
    unexplained_weight_loss: false, persistent_fatigue: false, unexplained_fever: false,
    night_sweats: false, persistent_cough: false, coughing_blood: false,
    shortness_of_breath: false, rectal_bleeding: false, blood_in_stool: false,
    persistent_abdominal_pain: false, difficulty_swallowing: false,
    unusual_skin_changes: false, new_lump_or_swelling: false, non_healing_sore: false,
    blood_in_urine: false, pelvic_pain: false, unusual_vaginal_bleeding: false,
    testicular_changes: false, symptom_duration_weeks: 0,
    additional_symptoms: '',
  })

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }))
  const toggle = (key) => setForm(p => ({ ...p, [key]: !p[key] }))
  const toggleArray = (key, val) => {
    setForm(p => ({
      ...p, [key]: p[key].includes(val) ? p[key].filter(v => v !== val) : [...p[key], val]
    }))
  }

  const steps = [
    {
      title: '👤 About You',
      subtitle: 'Basic demographic information',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Age *</label>
              <input type="number" min="1" max="120" className="input-field" placeholder="e.g. 35"
                value={form.age} onChange={e => set('age', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Sex *</label>
              <select className="input-field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Select...</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Country</label>
            <select className="input-field" value={form.country} onChange={e => set('country', e.target.value)}>
              <option value="Kenya">Kenya</option>
              <option value="Uganda">Uganda</option>
              <option value="Tanzania">Tanzania</option>
              <option value="Rwanda">Rwanda</option>
              <option value="Ethiopia">Ethiopia</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Ghana">Ghana</option>
              <option value="South Africa">South Africa</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Region / County</label>
            <input type="text" className="input-field" placeholder="e.g. Nairobi, Western..."
              value={form.region} onChange={e => set('region', e.target.value)} />
          </div>
        </div>
      )
    },
    {
      title: '🌱 Lifestyle Factors',
      subtitle: 'Lifestyle choices that affect cancer risk',
      content: (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🚬 Smoking Status</label>
            <div className="grid grid-cols-3 gap-2">
              {[['never','Never Smoked'],['former','Former Smoker'],['current','Current Smoker']].map(([v,l]) => (
                <button key={v} type="button" onClick={() => set('smoking_status', v)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                    ${form.smoking_status === v ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
            {form.smoking_status !== 'never' && (
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-1">Pack-years (packs/day × years smoked)</label>
                <input type="number" min="0" max="200" className="input-field" placeholder="e.g. 10"
                  value={form.smoking_pack_years} onChange={e => set('smoking_pack_years', e.target.value)} />
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🍺 Alcohol Use</label>
            <div className="grid grid-cols-2 gap-2">
              {[['none','None'],['occasional','Occasional'],['moderate','Moderate'],['heavy','Heavy']].map(([v,l]) => (
                <button key={v} type="button" onClick={() => set('alcohol_use', v)}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all
                    ${form.alcohol_use === v ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">🏃 Physical Activity</label>
              <select className="input-field" value={form.physical_activity} onChange={e => set('physical_activity', e.target.value)}>
                <option value="sedentary">Sedentary</option>
                <option value="light">Light</option>
                <option value="moderate">Moderate</option>
                <option value="active">Active</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">🥗 Diet Quality</label>
              <select className="input-field" value={form.diet_quality} onChange={e => set('diet_quality', e.target.value)}>
                <option value="poor">Poor</option>
                <option value="fair">Fair</option>
                <option value="good">Good</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">⚖️ BMI (optional)</label>
            <input type="number" min="10" max="70" step="0.1" className="input-field" placeholder="e.g. 24.5"
              value={form.bmi} onChange={e => set('bmi', e.target.value)} />
            <p className="text-xs text-gray-400 mt-1">Body Mass Index: weight(kg) ÷ height(m)²</p>
          </div>
        </div>
      )
    },
    {
      title: '🏥 Medical History',
      subtitle: 'Past health conditions and family history',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Personal Medical History</label>
            <div className="grid grid-cols-1 gap-2">
              <ToggleBtn value={form.hiv_positive} onChange={v => set('hiv_positive', v)} label="HIV Positive" icon="🔴" />
              <ToggleBtn value={form.hepatitis_b} onChange={v => set('hepatitis_b', v)} label="Hepatitis B" icon="🟡" />
              <ToggleBtn value={form.hepatitis_c} onChange={v => set('hepatitis_c', v)} label="Hepatitis C" icon="🟠" />
              <ToggleBtn value={form.diabetes} onChange={v => set('diabetes', v)} label="Diabetes" icon="💉" />
              <ToggleBtn value={form.previous_cancer} onChange={v => set('previous_cancer', v)} label="Previous Cancer Diagnosis" icon="🎗️" />
              <ToggleBtn value={form.immunosuppressed} onChange={v => set('immunosuppressed', v)} label="Taking Immunosuppressive Medication" icon="💊" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Family Cancer History</label>
            <ToggleBtn value={form.family_cancer_history} onChange={v => set('family_cancer_history', v)} label="Family member diagnosed with cancer" icon="👨‍👩‍👧" />
            {form.family_cancer_history && (
              <div className="mt-3">
                <label className="block text-xs text-gray-600 mb-2">Which type(s)? (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {['Breast','Cervical','Colorectal','Lung','Prostate','Liver','Ovarian','Other'].map(t => (
                    <button key={t} type="button" onClick={() => toggleArray('family_cancer_types', t.toLowerCase())}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all
                        ${form.family_cancer_types.includes(t.toLowerCase()) ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-200 text-gray-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {form.gender === 'female' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reproductive Health (Women)</label>
              <div className="space-y-2">
                <ToggleBtn value={form.hpv_vaccinated} onChange={v => set('hpv_vaccinated', v)} label="HPV Vaccinated" icon="💉" />
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Number of pregnancies</label>
                  <input type="number" min="0" max="20" className="input-field" value={form.number_of_pregnancies}
                    onChange={e => set('number_of_pregnancies', e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      title: '🩺 Current Symptoms',
      subtitle: 'Check any symptoms you are currently experiencing',
      content: (
        <div className="space-y-5">
          <div className="disclaimer-box">
            <p className="text-xs">Check symptoms you have experienced in the past few weeks. Honest answers lead to more accurate results.</p>
          </div>
          {[
            { heading: '⚠️ General', items: [
              ['unexplained_weight_loss','Unexplained weight loss','⚖️'],
              ['persistent_fatigue','Persistent unusual fatigue','😴'],
              ['unexplained_fever','Fever without clear cause','🌡️'],
              ['night_sweats','Night sweats','💧'],
            ]},
            { heading: '🫁 Respiratory', items: [
              ['persistent_cough','Persistent cough (3+ weeks)','😮‍💨'],
              ['coughing_blood','Coughing up blood','🩸'],
              ['shortness_of_breath','Unexplained shortness of breath','😤'],
            ]},
            { heading: '🫃 Digestive', items: [
              ['rectal_bleeding','Rectal bleeding','🔴'],
              ['blood_in_stool','Blood in stool','🩸'],
              ['persistent_abdominal_pain','Persistent abdominal pain','😣'],
              ['difficulty_swallowing','Difficulty swallowing','😖'],
            ]},
            { heading: '🔬 Skin / External', items: [
              ['unusual_skin_changes','Unusual skin changes / moles','🔵'],
              ['new_lump_or_swelling','New lump or swelling','🫀'],
              ['non_healing_sore','Non-healing sore or ulcer','🔴'],
            ]},
            { heading: '🚿 Urinary / Reproductive', items: [
              ['blood_in_urine','Blood in urine','🩸'],
              ['pelvic_pain','Persistent pelvic pain','😣'],
              ['unusual_vaginal_bleeding','Unusual vaginal bleeding','🩸'],
              ['testicular_changes','Testicular changes','⚪'],
            ]},
          ].map(group => (
            <div key={group.heading}>
              <h3 className="text-sm font-bold text-gray-700 mb-2">{group.heading}</h3>
              <div className="grid grid-cols-1 gap-2">
                {group.items.map(([key, label, icon]) => (
                  <ToggleBtn key={key} value={form[key]} onChange={() => toggle(key)} label={label} icon={icon} />
                ))}
              </div>
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">How long have symptoms lasted?</label>
            <select className="input-field" value={form.symptom_duration_weeks} onChange={e => set('symptom_duration_weeks', parseInt(e.target.value))}>
              <option value={0}>No symptoms / Not applicable</option>
              <option value={1}>Less than 1 week</option>
              <option value={2}>1–2 weeks</option>
              <option value={4}>2–4 weeks</option>
              <option value={8}>4–8 weeks (1–2 months)</option>
              <option value={12}>More than 2 months</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Additional symptoms (optional)</label>
            <textarea className="input-field" rows={3} placeholder="Describe any other symptoms you're experiencing..."
              value={form.additional_symptoms} onChange={e => set('additional_symptoms', e.target.value)} />
          </div>
        </div>
      )
    },
    {
      title: '✅ Review & Submit',
      subtitle: 'Please review before submitting',
      content: (
        <div className="space-y-4">
          <div className="disclaimer-box">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800 mb-1">Important Disclaimer</p>
                <p className="text-xs text-amber-700">This system provides cancer RISK SCREENING only. It does NOT diagnose cancer. Results are based on self-reported data and may not be accurate. Always consult a qualified healthcare provider for any health concerns.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Age / Sex</span><span className="font-medium">{form.age} / {form.gender}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-medium">{form.country}, {form.region || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Smoking</span><span className="font-medium capitalize">{form.smoking_status}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Alcohol</span><span className="font-medium capitalize">{form.alcohol_use}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Family History</span><span className="font-medium">{form.family_cancer_history ? 'Yes' : 'No'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Symptoms reported</span>
              <span className="font-medium text-brand-600">
                {['unexplained_weight_loss','persistent_cough','coughing_blood','rectal_bleeding','new_lump_or_swelling','non_healing_sore','difficulty_swallowing'].filter(k => form[k]).length} flagged
              </span>
            </div>
          </div>
        </div>
      )
    }
  ]

  const handleSubmit = async () => {
    if (!form.age || !form.gender) {
      toast.error('Please fill in your age and sex')
      setStep(0); return
    }

    setLoading(true)
    try {
      if (!navigator.onLine) {
        await offlineQueue.saveAssessment(user?.id, form)
        toast.success('Assessment saved offline. Will sync when online.')
        navigate('/dashboard')
        return
      }
      const res = await assessmentService.create(form)
      toast.success('Assessment complete!')
      navigate(`/results/${res.data.assessment_id}`)
    } catch (err) {
      toast.error('Submission failed. Saved offline.')
      await offlineQueue.saveAssessment(user?.id, form)
    } finally {
      setLoading(false)
    }
  }

  const currentStep = steps[step]

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-gray-900">{t('intakeTitle')}</h1>
        <p className="text-gray-500 mt-1">{t('intakeDesc')}</p>
      </div>

      <div className="card">
        <StepIndicator current={step} total={TOTAL_STEPS} />

        <div className="mb-2">
          <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
            {t('step')} {step + 1} {t('of')} {TOTAL_STEPS}
          </span>
          <h2 className="font-display text-2xl text-gray-900">{currentStep.title}</h2>
          <p className="text-gray-500 text-sm">{currentStep.subtitle}</p>
        </div>

        <div className="mt-5 mb-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {currentStep.content}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="btn-secondary flex-1 disabled:opacity-30">
            <ChevronLeft className="w-4 h-4" /> {t('back')}
          </button>
          {step < TOTAL_STEPS - 1 ? (
            <button type="button" onClick={() => setStep(s => s + 1)} className="btn-primary flex-1">
              {t('next')} <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
              {loading ? <><span className="spinner" /> Analyzing...</> : <>{t('submit')} <ChevronRight className="w-4 h-4" /></>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
