import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { usePlan } from '../../hooks/usePlan'
import { generateResume, scoreATS, rewriteBullet } from '../../lib/claude'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Sparkles, Download, Target, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const STEPS = ['Job Info', 'Experience', 'Generate', 'Review']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${i < current ? 'bg-indigo-600 text-white' : i === current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : 'bg-gray-100 text-gray-400'}`}>
            {i < current ? '✓' : i + 1}
          </div>
          <span className={`text-sm ${i === current ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>{step}</span>
          {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < current ? 'bg-indigo-600' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function ResumeBuilder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { atResumeLimit, resumeCount, resumeLimit } = usePlan()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [atsLoading, setAtsLoading] = useState(false)
  const [resumeData, setResumeData] = useState(null)
  const [atsResult, setAtsResult] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [rewritingIndex, setRewritingIndex] = useState(null)
  const [rewrites, setRewrites] = useState(null)
  const [existingTitle, setExistingTitle] = useState('')

  const [form, setForm] = useState({
    jobTitle: '',
    yearsExperience: '',
    skills: '',
    experience: '',
    education: '',
  })

  useEffect(() => {
    if (!isEditing) return
    supabase
      .from('resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { toast.error('Resume not found'); navigate('/dashboard'); return }
        setResumeData(data.content)
        setExistingTitle(data.title)
        setStep(2)
      })
  }, [id])

  const updateForm = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  async function handleGenerate() {
    setAiLoading(true)
    try {
      const data = await generateResume(form)
      setResumeData(data)
      setStep(2)
      toast.success('Resume generated!')
    } catch (err) {
      toast.error('Generation failed: ' + err.message)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleATSScore() {
    if (!jobDescription.trim()) {
      toast.error('Paste a job description first')
      return
    }
    setAtsLoading(true)
    try {
      const resumeText = JSON.stringify(resumeData)
      const result = await scoreATS({ resumeText, jobDescription })
      setAtsResult(result)
    } catch (err) {
      toast.error('ATS scoring failed: ' + err.message)
    } finally {
      setAtsLoading(false)
    }
  }

  async function handleRewriteBullet(bullet, expIndex, bulletIndex) {
    const key = `${expIndex}-${bulletIndex}`
    setRewritingIndex(key)
    setRewrites(null)
    try {
      const result = await rewriteBullet({ bullet, jobTitle: resumeData.experience[expIndex]?.title || form.jobTitle })
      setRewrites({ key, options: result.rewrites })
    } catch (err) {
      toast.error('Rewrite failed: ' + err.message)
    } finally {
      setRewritingIndex(null)
    }
  }

  function applyRewrite(expIndex, bulletIndex, text) {
    const updated = { ...resumeData }
    updated.experience[expIndex].bullets[bulletIndex] = text
    setResumeData(updated)
    setRewrites(null)
  }

  async function handleSave() {
    if (!isEditing && atResumeLimit) {
      toast.error(`Resume limit reached (${resumeCount}/${resumeLimit}). Upgrade your plan to save more.`)
      return
    }
    setLoading(true)
    try {
      let error
      if (isEditing) {
        ;({ error } = await supabase
          .from('resumes')
          .update({ content: resumeData, title: existingTitle })
          .eq('id', id)
          .eq('user_id', user.id))
      } else {
        ;({ error } = await supabase.from('resumes').insert({
          user_id: user.id,
          title: `${resumeData.name || 'My'} - ${form.jobTitle}`,
          content: resumeData,
        }))
      }
      if (error) throw error
      toast.success(isEditing ? 'Resume updated!' : 'Resume saved!')
      navigate('/dashboard')
    } catch (err) {
      toast.error('Save failed: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Resume Builder</h1>
        <p className="text-gray-500 mt-1">Generate an ATS-optimized resume in minutes.</p>
      </div>

      <StepIndicator current={step} />

      {/* Step 0: Job Info */}
      {step === 0 && (
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Target Job Info</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Job Title"
                placeholder="e.g. Senior Product Manager"
                value={form.jobTitle}
                onChange={updateForm('jobTitle')}
                required
              />
              <Input
                label="Years of Experience"
                type="number"
                placeholder="e.g. 5"
                value={form.yearsExperience}
                onChange={updateForm('yearsExperience')}
              />
            </div>
            <Input
              label="Key Skills (comma-separated)"
              placeholder="e.g. React, Node.js, SQL, Agile"
              value={form.skills}
              onChange={updateForm('skills')}
            />
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(1)} disabled={!form.jobTitle}>
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 1: Experience */}
      {step === 1 && (
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Your Background</h2></CardHeader>
          <CardBody className="space-y-4">
            <Textarea
              label="Work Experience"
              placeholder="Describe your work history... e.g. Worked at Google as a PM for 3 years, launched 5 products that increased revenue by 20%..."
              rows={5}
              value={form.experience}
              onChange={updateForm('experience')}
            />
            <Textarea
              label="Education"
              placeholder="e.g. BS Computer Science, MIT, 2019"
              rows={2}
              value={form.education}
              onChange={updateForm('education')}
            />
            <div className="flex justify-between pt-2">
              <Button variant="secondary" onClick={() => setStep(0)}>
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
              <Button onClick={handleGenerate} loading={aiLoading}>
                <Sparkles className="w-4 h-4" />
                {aiLoading ? 'Generating...' : 'Generate Resume'}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Step 2: Generated Resume Preview */}
      {step === 2 && resumeData && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Generated Resume</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={handleGenerate} loading={aiLoading}>
                  <RefreshCw className="w-3 h-3" /> Regenerate
                </Button>
                <Button size="sm" onClick={() => setStep(3)}>
                  Review & Save <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-6">
              {/* Header */}
              <div className="border-b pb-4">
                <h3 className="text-xl font-bold text-gray-900">{resumeData.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{resumeData.email} · {resumeData.phone} · {resumeData.location}</p>
              </div>

              {/* Summary */}
              {resumeData.summary && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Summary</h4>
                  <p className="text-sm text-gray-700">{resumeData.summary}</p>
                </div>
              )}

              {/* Experience */}
              {resumeData.experience?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-3">Experience</h4>
                  <div className="space-y-4">
                    {resumeData.experience.map((exp, ei) => (
                      <div key={ei}>
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{exp.title}</p>
                            <p className="text-sm text-gray-500">{exp.company}</p>
                          </div>
                          <span className="text-xs text-gray-400">{exp.duration}</span>
                        </div>
                        <ul className="mt-2 space-y-1">
                          {exp.bullets?.map((bullet, bi) => (
                            <li key={bi} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="text-indigo-400 mt-0.5">•</span>
                              <span className="flex-1">{bullet}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="ml-2 text-xs py-0.5 px-2 h-auto text-indigo-600"
                                loading={rewritingIndex === `${ei}-${bi}`}
                                onClick={() => handleRewriteBullet(bullet, ei, bi)}
                              >
                                <Sparkles className="w-3 h-3" /> Rewrite
                              </Button>
                            </li>
                          ))}
                        </ul>
                        {rewrites && exp.bullets?.map((_, bi) => rewrites.key === `${ei}-${bi}` ? (
                          <div key={bi} className="mt-3 p-3 bg-indigo-50 rounded-lg space-y-2">
                            <p className="text-xs font-semibold text-indigo-700">Choose a rewrite:</p>
                            {rewrites.options.map((opt, oi) => (
                              <button
                                key={oi}
                                className="block w-full text-left text-xs text-gray-700 bg-white border border-indigo-100 rounded p-2 hover:border-indigo-400 transition-colors"
                                onClick={() => applyRewrite(ei, bi, opt)}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        ) : null)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills */}
              {resumeData.skills?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.map((skill, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {resumeData.education?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-2">Education</h4>
                  {resumeData.education.map((edu, i) => (
                    <div key={i}>
                      <p className="font-semibold text-sm text-gray-900">{edu.degree}</p>
                      <p className="text-sm text-gray-500">{edu.school} · {edu.year}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* ATS Scorer */}
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-600" />
              <h2 className="font-semibold text-gray-900">ATS Score Checker</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Textarea
                label="Paste Job Description"
                placeholder="Paste the full job description here..."
                rows={4}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
              <Button onClick={handleATSScore} loading={atsLoading} variant="secondary">
                <Target className="w-4 h-4" />
                {atsLoading ? 'Analyzing...' : 'Check ATS Score'}
              </Button>

              {atsResult && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className={`text-4xl font-bold ${atsResult.score >= 70 ? 'text-green-600' : atsResult.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {atsResult.score}%
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">ATS Match Score</p>
                      <p className="text-xs text-gray-500">{atsResult.score >= 70 ? 'Strong match' : atsResult.score >= 50 ? 'Fair match' : 'Needs improvement'}</p>
                    </div>
                  </div>
                  {atsResult.missingKeywords?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-1">Missing Keywords</p>
                      <div className="flex flex-wrap gap-1">
                        {atsResult.missingKeywords.map((k) => (
                          <span key={k} className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {atsResult.suggestions?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Suggestions</p>
                      <ul className="space-y-1">
                        {atsResult.suggestions.map((s, i) => (
                          <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-indigo-400">→</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Step 3: Save */}
      {step === 3 && resumeData && (
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Save Your Resume</h2></CardHeader>
          <CardBody className="space-y-4">
            <p className="text-gray-600 text-sm">Your resume looks great! Save it to your dashboard.</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)}>
                <ChevronLeft className="w-4 h-4" /> Back to Edit
              </Button>
              <Button onClick={handleSave} loading={loading}>
                Save Resume
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                <Download className="w-4 h-4" /> Print / Export PDF
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
