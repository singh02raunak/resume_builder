const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

async function claudeRequest(messages, systemPrompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'AI request failed')
  }

  const data = await response.json()
  return data.content[0].text
}

export async function generateResume({ jobTitle, yearsExperience, skills, experience, education }) {
  const systemPrompt = `You are an expert resume writer. Generate professional, ATS-optimized resumes.
Always respond with valid JSON matching this structure exactly:
{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "summary": "",
  "experience": [{ "title": "", "company": "", "duration": "", "bullets": [""] }],
  "education": [{ "degree": "", "school": "", "year": "" }],
  "skills": [""]
}`

  const userMessage = `Create a professional resume for:
Job Title: ${jobTitle}
Years of Experience: ${yearsExperience}
Key Skills: ${skills}
Work Experience: ${experience}
Education: ${education}

Generate a complete, compelling resume. Return only valid JSON.`

  const text = await claudeRequest([{ role: 'user', content: userMessage }], systemPrompt)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  return JSON.parse(jsonMatch[0])
}

export async function generateCoverLetter({ resumeData, jobTitle, company, jobDescription }) {
  const systemPrompt = `You are an expert cover letter writer. Write compelling, personalized cover letters that get interviews.`

  const userMessage = `Write a professional cover letter for:
Applicant: ${resumeData.name}
Applying for: ${jobTitle} at ${company}
Job Description: ${jobDescription}
Applicant Background: ${resumeData.summary}
Key Skills: ${resumeData.skills?.join(', ')}

Write a 3-paragraph cover letter that is personalized, specific, and compelling. Do not use generic phrases.`

  return await claudeRequest([{ role: 'user', content: userMessage }], systemPrompt)
}

export async function scoreATS({ resumeText, jobDescription }) {
  const systemPrompt = `You are an ATS (Applicant Tracking System) expert. Analyze resumes against job descriptions.
Always respond with valid JSON matching this structure:
{
  "score": 0-100,
  "missingKeywords": [""],
  "presentKeywords": [""],
  "suggestions": [""]
}`

  const userMessage = `Analyze this resume against the job description:

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Return only valid JSON with the score, missing keywords, present keywords, and improvement suggestions.`

  const text = await claudeRequest([{ role: 'user', content: userMessage }], systemPrompt)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  return JSON.parse(jsonMatch[0])
}

export async function rewriteBullet({ bullet, jobTitle }) {
  const systemPrompt = `You are an expert resume writer. Rewrite bullet points to be more impactful using the STAR method and strong action verbs.
Always respond with valid JSON: { "rewrites": ["", "", ""] }`

  const userMessage = `Rewrite this resume bullet point for a ${jobTitle} role into 3 stronger versions:
"${bullet}"

Make each version:
- Start with a strong action verb
- Include quantifiable metrics where possible
- Be concise (1 line max)
- Show impact/results

Return only valid JSON with 3 rewrites.`

  const text = await claudeRequest([{ role: 'user', content: userMessage }], systemPrompt)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  return JSON.parse(jsonMatch[0])
}
