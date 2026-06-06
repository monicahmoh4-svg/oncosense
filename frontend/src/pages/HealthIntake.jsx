import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Activity } from 'lucide-react'
import { assessmentService } from '../services/api'
import toast from 'react-hot-toast'

const STEPS = [
  'Personal Info',
  'Lifestyle & History',
  'Family & Medical',
  'Symptoms',
  'Review & Submit',
]

const initialProfile = {
  date_of_birth: '', gender: '', country: 'Kenya', region: '',
  smoking_status: 'never', smoking_pack_years: '',
  alcohol_use: 'none', physical_activity: 'moderate',
  bmi: '', diet_quality: 'fair', hiv_status: 'unknown',
  diabetes: false, hypertension: false,
  previous_cancer: false, previous_cancer_type: '',
  immunosuppressed: false,
  number_of_pregnancies: '', menopause_status: '',
  hpv_vaccinated: null, oral_contraceptive_use: false,
  family_cancer_history: false, family_cancer_types: [],
}

const initialSymptoms = {
  unexplained_weight_loss: false, persistent_fatigue: false,
  unexplained_fever: false, night_sweats: false,
  persistent_cough: false, coughing_blood: false,
  shortness_of_breath: false, rectal_bleeding: false,
  blood_in_stool: false, persistent_abdominal_pain: false,
  difficulty_swallowing: false, unusual_skin_changes: false,
  new_lump_or_swelling: false, non_healing_sore: false,
  blood_in_urine: false, pelvic_pain: false,
  unusual_vaginal_bleeding: false, testicular_changes: false,
  persistent_headache: false, vision_changes: false,
  symptom_duration_weeks: '', additional_symptoms: '',
}

const KENYA_COUNTIES = ['Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Kiambu','Machakos','Meru','Nyeri','Kisii','Kakamega','Bungoma','Kilifi','Kwale','Homa Bay','Migori','Siaya','Vihiga','Busia','Trans Nzoia','West Pokot','Elgeyo Marakwet','Baringo','Laikipia','Samburu','Nyamira','Nyandarua','Kirinyaga','Murang-a','Embu','Tharaka Nithi','Isiolo','Marsabit','Wajir','Mandera','Garissa','Tana River','Lamu','Taita Taveta','Kajiado','Makueni','Kitui','Bomet','Kericho','Nandi','Narok','Turkana']

function ToggleButton({ value, onChange, label }) {
  return (
    <button type="button"
      onClick={() => onChange(!value)}
      className={'w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ' + (value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300')}>
      <span className={'text-sm font-semibold ' + (value ? 'text-brand-900' : 'text-gray-700')}>{label}</span>
      <div className={'w-10 h-6 rounded-full transition-all flex items-center px-1 ' + (value ? 'bg-brand-500' : 'bg-gray-200')}>
        <div className={'w-4 h-4 bg-white rounded-full shadow transition-transform ' + (value ? 'translate-x-4' : '')} />
      </div>
    </button>
  )
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}{required && <span className="text-red-400 ml-1">*</span>}
      </label>
      <select
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        value={value} onChange={e => onChange(e.target.value)}>
        {options.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

function InputField({ label, type='text', value, onChange, placeholder, min, max }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <input type={type}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} min={min} max={max} />
    </div>
  )
}

export default function HealthIntake() {
  const navigate = useNavigate()
  const [step, setStep]       = useState(0)
  const [profile, setProfile] = useState(initialProfile)
  const [symptoms, setSymptoms] = useState(initialSymptoms)
  const [submitting, setSubmitting] = useState(false)

  const setP = (key, val) => setProfile(p => ({ ...p, [key]: val }))
  const setS = (key, val) => setSymptoms(s => ({ ...s, [key]: val }))

  const toggleFamilyCancer = (type) => {
    setProfile(p => {
      const types = p.family_cancer_types.includes(type)
        ? p.family_cancer_types.filter(t => t !== type)
        : [...p.family_cancer_types, type]
      return { ...p, family_cancer_types: types }
    })
  }

  const SYMPTOM_LIST = [
    ['unexplained_weight_loss',   '⚖️ Unexplained weight loss',          'Losing weight without trying'],
    ['persistent_fatigue',        '😴 Persistent fatigue',               'Extreme tiredness not relieved by rest'],
    ['unexplained_fever',         '🌡️ Unexplained fever',               'Fever with no obvious cause'],
    ['night_sweats',              '💧 Night sweats',                      'Drenching sweats at night'],
    ['persistent_cough',          '🫁 Persistent cough',                  'Cough lasting more than 3 weeks'],
    ['coughing_blood',            '🩸 Coughing blood',                    'Coughing up blood or bloodstained mucus'],
    ['shortness_of_breath',       '💨 Shortness of breath',              'Breathlessness without exertion'],
    ['rectal_bleeding',           '🩸 Rectal bleeding',                   'Bleeding from the back passage'],
    ['blood_in_stool',            '🩸 Blood in stool',                    'Bright red or dark blood in bowel movements'],
    ['persistent_abdominal_pain', '🫃 Persistent abdominal pain',         'Stomach pain lasting more than 4 weeks'],
    ['difficulty_swallowing',     '🍽️ Difficulty swallowing',            'Food sticking in throat or chest'],
    ['unusual_skin_changes',      '🔍 Unusual skin changes',             'New moles, changes to existing moles'],
    ['new_lump_or_swelling',      '🔵 New lump or swelling',             'Anywhere on the body'],
    ['non_healing_sore',          '🩹 Non-healing sore',                  'Wound or ulcer not healing after 3 weeks'],
    ['blood_in_urine',            '🩸 Blood in urine',                    'Pink, red or brown urine'],
    ['pelvic_pain',               '🔴 Pelvic pain',                       'Persistent pain in lower abdomen/pelvis'],
    ['unusual_vaginal_bleeding',  '🩸 Unusual vaginal bleeding',          'Between periods, after menopause, after sex'],
    ['testicular_changes',        '🔵 Testicular changes',               'Lump, swelling or change in size/shape'],
    ['persistent_headache',       '🤕 Persistent headache',              'Severe or progressively worsening headaches'],
    ['vision_changes',            '👁️ Vision changes',                   'Blurred, double vision or vision loss'],
  ]

  async function submit() {
    setSubmitting(true)
    try {
      const res = await assessmentService.create({
        profile,
        symptoms: {
          ...symptoms,
          symptom_duration_weeks: symptoms.symptom_duration_weeks ? parseInt(symptoms.symptom_duration_weeks) : null,
        }
      })
      toast.success('Assessment complete!')
      navigate('/results/' + res.data.assessment.id)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Assessment failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function canNext() {
    if (step === 0) return profile.date_of_birth && profile.gender
    return true
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl text-gray-900">Health Assessment</h1>
        <p className="text-gray-500 mt-1">Answer honestly for the most accurate risk assessment</p>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Step {step + 1} of {STEPS.length}: {STEPS[step]}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <motion.div
            className="bg-brand-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: progress + '%' }}
            transition={{ duration: 0.3 }} />
        </div>
        <div className="flex gap-1 mt-2">
          {STEPS.map((s, i) => (
            <div key={i} className={'flex-1 h-1 rounded-full transition-all ' + (i <= step ? 'bg-brand-500' : 'bg-gray-200')} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">

          {/* STEP 0: Personal Info */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 text-lg">Personal Information</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <InputField label="Date of Birth *" type="date" value={profile.date_of_birth}
                  onChange={v => setP('date_of_birth', v)} />
                <SelectField label="Sex *" value={profile.gender} onChange={v => setP('gender', v)} required
                  options={[['','Select...'],['female','Female'],['male','Male'],['other','Other'],['prefer_not_to_say','Prefer not to say']]} />
                <SelectField label="County / Region" value={profile.region} onChange={v => setP('region', v)}
                  options={[['','Select county...'], ...KENYA_COUNTIES.map(c => [c, c])]} />
                <SelectField label="Country" value={profile.country} onChange={v => setP('country', v)}
                  options={[['Kenya','Kenya'],['Uganda','Uganda'],['Tanzania','Tanzania'],['Rwanda','Rwanda'],['Ethiopia','Ethiopia'],['Other','Other']]} />
              </div>
            </div>
          )}

          {/* STEP 1: Lifestyle */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 text-lg">Lifestyle &amp; Habits</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <SelectField label="Smoking Status" value={profile.smoking_status} onChange={v => setP('smoking_status', v)}
                  options={[['never','Never smoked'],['former','Former smoker'],['current','Current smoker']]} />
                {profile.smoking_status !== 'never' && (
                  <InputField label="Pack years smoked" type="number" value={profile.smoking_pack_years}
                    onChange={v => setP('smoking_pack_years', v)} placeholder="e.g. 10" min="0" />
                )}
                <SelectField label="Alcohol Use" value={profile.alcohol_use} onChange={v => setP('alcohol_use', v)}
                  options={[['none','None'],['occasional','Occasional (< 1/week)'],['moderate','Moderate (2-3/week)'],['heavy','Heavy (daily)']]} />
                <SelectField label="Physical Activity" value={profile.physical_activity} onChange={v => setP('physical_activity', v)}
                  options={[['sedentary','Sedentary (desk job, no exercise)'],['low','Low (light activity 1-2x/week)'],['moderate','Moderate (3-4x/week)'],['active','Active (daily exercise)']]} />
                <InputField label="BMI (if known)" type="number" value={profile.bmi}
                  onChange={v => setP('bmi', v)} placeholder="e.g. 24.5" min="10" max="70" />
                <SelectField label="Diet Quality" value={profile.diet_quality} onChange={v => setP('diet_quality', v)}
                  options={[['poor','Poor (processed foods, little fruit/veg)'],['fair','Fair (some healthy choices)'],['good','Good (mostly fruits, veg, whole grains)'],['excellent','Excellent (Mediterranean/plant-based)']]} />
              </div>
            </div>
          )}

          {/* STEP 2: Medical & Family */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-bold text-gray-900 text-lg">Medical &amp; Family History</h2>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-600">Current Health Conditions</p>
                <ToggleButton value={profile.diabetes} onChange={v => setP('diabetes', v)} label="Diabetes" />
                <ToggleButton value={profile.hypertension} onChange={v => setP('hypertension', v)} label="Hypertension (high blood pressure)" />
                <ToggleButton value={profile.immunosuppressed} onChange={v => setP('immunosuppressed', v)} label="Immunosuppressed (on immunosuppressants, organ transplant)" />
              </div>

              <SelectField label="HIV Status" value={profile.hiv_status} onChange={v => setP('hiv_status', v)}
                options={[['unknown','Unknown / Prefer not to say'],['negative','Negative'],['positive','Positive (HIV+)']]} />

              <div className="space-y-3">
                <ToggleButton value={profile.previous_cancer} onChange={v => setP('previous_cancer', v)} label="Previous cancer diagnosis" />
                {profile.previous_cancer && (
                  <InputField label="Type of cancer" value={profile.previous_cancer_type}
                    onChange={v => setP('previous_cancer_type', v)} placeholder="e.g. Breast cancer, Cervical cancer" />
                )}
              </div>

              {(profile.gender === 'female' || profile.gender === 'other') && (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-600">Reproductive Health (Female)</p>
                  <SelectField label="HPV Vaccination" value={profile.hpv_vaccinated === null ? '' : String(profile.hpv_vaccinated)}
                    onChange={v => setP('hpv_vaccinated', v === '' ? null : v === 'true')}
                    options={[['','Unknown'],['true','Yes, vaccinated'],['false','No, not vaccinated']]} />
                  <ToggleButton value={profile.oral_contraceptive_use} onChange={v => setP('oral_contraceptive_use', v)}
                    label="Currently using oral contraceptives" />
                  <SelectField label="Menopause Status" value={profile.menopause_status} onChange={v => setP('menopause_status', v)}
                    options={[['','Unknown / N/A'],['pre','Pre-menopausal'],['peri','Peri-menopausal'],['post','Post-menopausal']]} />
                </div>
              )}

              <div className="space-y-3 border-t border-gray-100 pt-4">
                <ToggleButton value={profile.family_cancer_history} onChange={v => setP('family_cancer_history', v)}
                  label="Family history of cancer (parent, sibling, child)" />
                {profile.family_cancer_history && (
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">Which cancers in family? (select all that apply)</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Breast','Cervical','Colorectal','Lung','Prostate','Ovarian','Stomach','Liver','Leukaemia','Lymphoma'].map(t => {
                        const sel = profile.family_cancer_types.includes(t)
                        return (
                          <button key={t} type="button"
                            onClick={() => toggleFamilyCancer(t)}
                            className={'text-xs px-3 py-2 rounded-xl border-2 font-semibold transition-all ' + (sel ? 'border-brand-500 bg-brand-50 text-brand-900' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                            {t}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Symptoms */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Current Symptoms</h2>
                <p className="text-sm text-gray-500 mt-1">Select ALL symptoms you have experienced in the past 3 months</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-semibold">
                  Be as accurate as possible — this directly affects your risk assessment result
                </p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {SYMPTOM_LIST.map(([key, label, desc]) => {
                  const selected = symptoms[key]
                  return (
                    <button key={key} type="button"
                      onClick={() => setS(key, !selected)}
                      className={'w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ' + (selected ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300')}>
                      <div className={'w-5 h-5 rounded border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ' + (selected ? 'border-red-500 bg-red-500' : 'border-gray-300')}>
                        {selected && <span className="text-white text-xs font-bold">✓</span>}
                      </div>
                      <div>
                        <p className={'text-sm font-semibold ' + (selected ? 'text-red-800' : 'text-gray-800')}>{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <SelectField label="How long have symptoms lasted?" value={symptoms.symptom_duration_weeks}
                  onChange={v => setS('symptom_duration_weeks', v)}
                  options={[['','Not applicable'],['1','Less than 1 week'],['2','1-2 weeks'],['4','2-4 weeks'],['8','1-2 months'],['12','2-3 months'],['24','3-6 months'],['52','More than 6 months']]} />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Other symptoms</label>
                  <textarea rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                    placeholder="Describe any other symptoms not listed above..."
                    value={symptoms.additional_symptoms}
                    onChange={e => setS('additional_symptoms', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 text-lg">Review Your Information</h2>

              <div className="space-y-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="font-semibold text-gray-700">Personal</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">DOB:</span> <span className="font-medium">{profile.date_of_birth || '—'}</span></div>
                    <div><span className="text-gray-500">Sex:</span> <span className="font-medium capitalize">{profile.gender || '—'}</span></div>
                    <div><span className="text-gray-500">County:</span> <span className="font-medium">{profile.region || '—'}</span></div>
                    <div><span className="text-gray-500">BMI:</span> <span className="font-medium">{profile.bmi || '—'}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="font-semibold text-gray-700">Lifestyle</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">Smoking:</span> <span className="font-medium capitalize">{profile.smoking_status}</span></div>
                    <div><span className="text-gray-500">Alcohol:</span> <span className="font-medium capitalize">{profile.alcohol_use}</span></div>
                    <div><span className="text-gray-500">Activity:</span> <span className="font-medium capitalize">{profile.physical_activity}</span></div>
                    <div><span className="text-gray-500">Diet:</span> <span className="font-medium capitalize">{profile.diet_quality}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="font-semibold text-gray-700">Medical</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">HIV:</span> <span className="font-medium">{profile.hiv_status}</span></div>
                    <div><span className="text-gray-500">Prev cancer:</span> <span className="font-medium">{profile.previous_cancer ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-gray-500">Family history:</span> <span className="font-medium">{profile.family_cancer_history ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-gray-500">HPV vaccine:</span> <span className="font-medium">{profile.hpv_vaccinated === true ? 'Yes' : profile.hpv_vaccinated === false ? 'No' : 'Unknown'}</span></div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="font-semibold text-gray-700">Reported Symptoms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(symptoms).filter(([k,v]) => v === true).length === 0
                      ? <span className="text-xs text-gray-400">No symptoms reported</span>
                      : Object.entries(symptoms)
                          .filter(([k,v]) => v === true)
                          .map(([k]) => (
                            <span key={k} className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-medium capitalize">
                              {k.replace(/_/g,' ')}
                            </span>
                          ))
                    }
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-800">
                  <strong>Your assessment will be analysed</strong> using a validated risk scoring model that considers all factors above. Results are for screening support only — not a medical diagnosis.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep(s => s - 1)}
            className="flex items-center gap-2 border-2 border-gray-200 text-gray-600 font-semibold px-5 py-3 rounded-xl hover:bg-gray-50 transition-all">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button type="button"
            onClick={() => { if (!canNext()) { toast.error('Please fill in required fields'); return } setStep(s => s + 1) }}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={submitting}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-40 text-base">
            {submitting ? (
              <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Calculating...</>
            ) : (
              <><Activity className="w-5 h-5" /> Get My Risk Assessment</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
