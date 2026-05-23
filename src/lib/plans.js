export const PLAN_LIMITS = {
  free:    { resumes: 2,        coverLetters: 2 },
  starter: { resumes: 10,       coverLetters: 10 },
  pro:     { resumes: Infinity, coverLetters: Infinity },
}

export function getLimit(plan, type) {
  return PLAN_LIMITS[plan]?.[type] ?? PLAN_LIMITS.free[type]
}

export function isAtLimit(plan, type, currentCount) {
  return currentCount >= getLimit(plan, type)
}

export const PLAN_LABELS = {
  free:    'Free',
  starter: 'Starter',
  pro:     'Pro',
}
