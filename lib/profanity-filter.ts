// Profanity filter utility for user-generated text inputs
// Uses a comprehensive blocklist + pattern detection

const BLOCKED_WORDS = [
  // Common profanity (abbreviated/hashed for code cleanliness)
  'fuck', 'shit', 'ass', 'damn', 'bitch', 'bastard', 'dick', 'cock',
  'pussy', 'cunt', 'whore', 'slut', 'fag', 'nigger', 'nigga',
  'retard', 'rape', 'molest', 'pedo', 'kill', 'murder',
  'porn', 'hentai', 'xxx', 'nude', 'naked',
  // Common evasions
  'f u c k', 'sh1t', 'a$$', 'b1tch', 'f*ck', 'sh*t', 'a**',
  'd1ck', 'c0ck', 'p*ssy', 'c*nt', 'wh0re',
  // Slurs and hate speech
  'kike', 'spic', 'chink', 'gook', 'wetback', 'beaner',
  'cracker', 'honky', 'dyke', 'tranny',
  // Drug references (not relevant to date planning)
  'meth', 'cocaine', 'heroin', 'crack',
  // Violence
  'shoot', 'stab', 'bomb', 'terrorist',
]

// Build regex patterns for each blocked word
// Matches whole words and common letter substitutions
const SUBSTITUTION_MAP: Record<string, string> = {
  'a': '[a@4]',
  'e': '[e3]',
  'i': '[i1!|]',
  'o': '[o0]',
  's': '[s$5]',
  't': '[t7+]',
  'l': '[l1|]',
}

function buildPattern(word: string): RegExp {
  const pattern = word
    .split('')
    .map(char => {
      const sub = SUBSTITUTION_MAP[char.toLowerCase()]
      return sub || char
    })
    .join('[\\s._-]*') // Allow separators between characters

  return new RegExp(`\\b${pattern}\\b`, 'gi')
}

const BLOCKED_PATTERNS = BLOCKED_WORDS.map(word => buildPattern(word))

export interface FilterResult {
  isClean: boolean
  cleaned: string
  flagged: boolean
  reason?: string
}

/**
 * Check if text contains profanity or inappropriate content.
 * Returns a FilterResult with isClean=false if blocked content is found.
 */
export function checkProfanity(text: string): FilterResult {
  if (!text || text.trim().length === 0) {
    return { isClean: true, cleaned: text, flagged: false }
  }

  const trimmed = text.trim()

  // Check against blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        isClean: false,
        cleaned: trimmed.replace(pattern, '***'),
        flagged: true,
        reason: 'Contains inappropriate language'
      }
    }
    // Reset regex lastIndex since we use 'g' flag
    pattern.lastIndex = 0
  }

  // Check for excessive special characters (likely spam/abuse)
  const specialCharRatio = (trimmed.match(/[^a-zA-Z0-9\s.,'-]/g) || []).length / trimmed.length
  if (specialCharRatio > 0.5 && trimmed.length > 3) {
    return {
      isClean: false,
      cleaned: trimmed,
      flagged: true,
      reason: 'Contains too many special characters'
    }
  }

  // Check for all-caps shouting (more than 10 chars)
  if (trimmed.length > 10 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
    return {
      isClean: true, // Allow it but note it
      cleaned: trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase(),
      flagged: false
    }
  }

  return { isClean: true, cleaned: trimmed, flagged: false }
}

/**
 * Sanitize text for use in search queries.
 * Removes profanity and returns clean text safe for API calls.
 */
export function sanitizeForSearch(text: string): string {
  const result = checkProfanity(text)
  if (!result.isClean) {
    return '' // Return empty if profane — don't send to APIs
  }
  // Also strip any HTML/script injection
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/[<>\"'`;]/g, '')
    .trim()
}

/**
 * Validate custom input length and content.
 * Returns an error message or null if valid.
 */
export function validateCustomInput(text: string, maxLength: number = 50): string | null {
  if (!text || text.trim().length === 0) {
    return 'Please enter something'
  }

  if (text.trim().length < 2) {
    return 'Too short — enter at least 2 characters'
  }

  if (text.trim().length > maxLength) {
    return `Too long — max ${maxLength} characters`
  }

  const profanityResult = checkProfanity(text)
  if (!profanityResult.isClean) {
    return profanityResult.reason || 'Contains inappropriate content'
  }

  return null // Valid
}
