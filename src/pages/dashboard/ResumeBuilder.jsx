import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { usePlan } from '../../hooks/usePlan'
import { generateResume, scoreATS, rewriteBullet } from '../../lib/claude'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import { Sparkles, Download, Target, RefreshCw, ArrowUpCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResumeBuilder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = Boolean(id)
  const { atResumeLimit, resumeCount, resumeLimit, plan } = usePlan()

  const [jobTitle, setJobTitle] = useState('')
  const [background, setBackground] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [resumeData, setResumeData] = useState(null)
  const [atsResult, setAtsResult] = useState(null)
  const [existingTitle, setExistingTitle] = useState('')

  const [generating, setGenerating] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [saving, setSaving] = useState(false)
  const [rewritingIndex, setRewritingIndex] = useState(null)
  const [rewrites, setRewrites] = useState(null)

  useEffect(() => {
    if (!isEditing) return
    supabase
      .from('resumes').select('*').eq('id', id).eq('user_id', user.id).single()
      .then(({ data, error }) => {
        if (error || !data) { toast.error('Resume not found'); navigate('/dashboard'); return }
        setResumeData(data.content)
        setExistingTitle(data.title)
      })
  }, [id])

  async function handleGenerate() {
    if (!jobTitle.trim()) { toast.error('Enter a job title'); return }
    setGenerating(true)
    setAtsResult(null)
    setRewrites(null)
    try {
      const data = await generateResume({
        jobTitle,
        yearsExperience: '',
        skills: '',
        experience: background,
        education: '',
      })
      setResumeData(data)
      toast.success('Resume generated!')

      // Auto-run ATS if job description provided
      if (jobDescription.trim()) {
        setScoring(true)
        try {
          const result = await scoreATS({ resumeText: JSON.stringify(data), jobDescription })
          setAtsResult(result)
        } catch { /* silent fail on ATS */ } finally {
          setScoring(false)
        }
      }
    } catch (err) {
      toast.error('Generation failed: ' + err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleRewriteBullet(bullet, ei, bi) {
    const key = `${ei}-${bi}`
    setRewritingIndex(key)
    setRewrites(null)
    try {
      const result = await rewriteBullet({ bullet, jobTitle: resumeData.experience[ei]?.title || jobTitle })
      setRewrites({ key, options: result.rewrites })
    } catch (err) {
      toast.error('Rewrite failed: ' + err.message)
    } finally {
      setRewritingIndex(null)
    }
  }

  function applyRewrite(ei, bi, text) {
    const updated = { ...resumeData }
    updated.experience[ei].bullets[bi] = text
    setResumeData(updated)
    setRewrites(null)
  }

  async function handleSave() {
    if (!isEditing && atResumeLimit) {
      toast.error(`Resume limit reached (${resumeCount}/${resumeLimit}). Upgrade your plan.`)
      return
    }
    setSaving(true)
    try {
      let error
      if (isEditing) {
        ;({ error } = await supabase.from('resumes').update({ content: resumeData, title: existingTitle }).eq('id', id).eq('user_id', user.id))
      } else {
        ;({ error } = await supabase.from('resumes').insert({ user_id: user.id, title: `${resumeData.name || 'My'} - ${jobTitle}`, content: resumeData }))
      }
      if (error) throw error
      toast.success(isEditing ? 'Resume updated!' : 'Resume saved!')
      navigate('/dashboard')
    } catch (err) {
      toast.error('Save failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const atsColor = atsResult
    ? atsResult.score >= 70 ? 'text-green-600' : atsResult.score >= 50 ? 'text-amber-500' : 'text-red-500'
    : ''

  const showUpgradeNudge = atsResult && atsResult.score < 60 && plan === 'free'

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">AI Resume Builder</h1>
        <p className="text-gray-500 mt-1">Fill in the basics — AI does the rest.</p>
      </div>

      {/* Input form */}
      {!resumeData && (
        <Card>
          <CardBody className="space-y-4">
            <Input
              label="Job Title you're applying for"
              placeholder="e.g. Senior Product Manager"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              required
            />
            <Textarea
              label="Your background (optional)"
              placeholder="Briefly describe your experience, skills, or paste your old resume text..."
              rows={5}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
            />
            <Textarea
              label="Job description (optional — used for ATS scoring)"
              placeholder="Paste the job description to get an ATS score right after generation..."
              rows={4}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <Button onClick={handleGenerate} loading={generating} className="w-full">
              <Sparkles className="w-4 h-4" />
              {generating ? 'Generating your resume...' : 'Generate Resume'}
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Generated resume */}
      {resumeData && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Your Resume</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setResumeData(null); setAtsResult(null) }}>
                  <RefreshCw className="w-3 h-3" /> Start Over
                </Button>
                <Button size="sm" variant="secondary" onClick={handleGenerate} loading={generating}>
                  <Sparkles className="w-3 h-3" /> Regenerate
                </Button>
                <Button size="sm" onClick={handleSave} loading={saving}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => window.print()}>
                  <Download className="w-3 h-3" />
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
                                size="sm" variant="ghost"
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
                              <button key={oi} className="block w-full text-left text-xs text-gray-700 bg-white border border-indigo-100 rounded p-2 hover:border-indigo-400 transition-colors" onClick={() => applyRewrite(ei, bi, opt)}>
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

          {/* ATS Result */}
          {(scoring || atsResult) && (
            <Card>
              <CardHeader className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" />
                <h2 className="font-semibold text-gray-900">ATS Score</h2>
              </CardHeader>
              <CardBody>
                {scoring ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Checking ATS score...
                  </div>
                ) : atsResult && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`text-5xl font-bold ${atsColor}`}>{atsResult.score}%</div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">ATS Match Score</p>
                        <p className="text-xs text-gray-500">
                          {atsResult.score >= 70 ? 'Strong match — good to apply!' : atsResult.score >= 50 ? 'Fair match — consider improvements' : 'Low match — resume needs work'}
                        </p>
                      </div>
                    </div>

                    {/* Upgrade nudge */}
                    {showUpgradeNudge && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                        <ArrowUpCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-amber-800">Your ATS score is low</p>
                          <p className="text-xs text-amber-700 mt-0.5">Upgrade to Starter or Pro to unlock unlimited rewrites and generate more targeted resumes.</p>
                          <button onClick={() => navigate('/#pricing')} className="mt-2 text-xs font-semibold text-amber-800 underline cursor-pointer">
                            View plans →
                          </button>
                        </div>
                      </div>
                    )}

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
          )}
        </div>
      )}
    </div>
  )
}
