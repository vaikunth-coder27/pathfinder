// Country / board options. Only India + CBSE are active for now;
// the structure is built to scale to more countries and boards later.

export interface BoardOption {
  id: string
  name: string
  available: boolean
}

export interface CountryOption {
  id: string
  name: string
  code: string
  available: boolean
  boards: BoardOption[]
}

export const COUNTRIES: CountryOption[] = [
  {
    id: 'IN',
    name: 'India',
    code: 'IN',
    available: true,
    boards: [
      { id: 'CBSE', name: 'CBSE', available: true },
      { id: 'ICSE', name: 'ICSE / ISC', available: false },
      { id: 'STATE', name: 'State Board', available: false },
      { id: 'IB', name: 'IB', available: false },
    ],
  },
  { id: 'US', name: 'United States', code: 'US', available: false, boards: [] },
  { id: 'UK', name: 'United Kingdom', code: 'UK', available: false, boards: [] },
  { id: 'AE', name: 'UAE', code: 'AE', available: false, boards: [] },
]

// Subjects commonly taken in Class 11-12 across CBSE streams.
// Each id doubles as its icon name (see components/icons.tsx). The picker lets
// the user add anything not listed here.
export interface SubjectOption {
  id: string
  name: string
  stream: 'science' | 'commerce' | 'humanities' | 'skill' | 'language'
}

export const SUBJECTS: SubjectOption[] = [
  // Sciences
  { id: 'physics', name: 'Physics', stream: 'science' },
  { id: 'chemistry', name: 'Chemistry', stream: 'science' },
  { id: 'mathematics', name: 'Mathematics', stream: 'science' },
  { id: 'biology', name: 'Biology', stream: 'science' },
  { id: 'computer-science', name: 'Computer Science', stream: 'science' },
  { id: 'informatics', name: 'Informatics Practices', stream: 'science' },
  { id: 'biotechnology', name: 'Biotechnology', stream: 'science' },
  { id: 'engineering-graphics', name: 'Engineering Graphics', stream: 'science' },

  // Commerce
  { id: 'accountancy', name: 'Accountancy', stream: 'commerce' },
  { id: 'business-studies', name: 'Business Studies', stream: 'commerce' },
  { id: 'economics', name: 'Economics', stream: 'commerce' },
  { id: 'entrepreneurship', name: 'Entrepreneurship', stream: 'commerce' },

  // Humanities
  { id: 'history', name: 'History', stream: 'humanities' },
  { id: 'political-science', name: 'Political Science', stream: 'humanities' },
  { id: 'geography', name: 'Geography', stream: 'humanities' },
  { id: 'psychology', name: 'Psychology', stream: 'humanities' },
  { id: 'sociology', name: 'Sociology', stream: 'humanities' },
  { id: 'philosophy', name: 'Philosophy', stream: 'humanities' },
  { id: 'legal-studies', name: 'Legal Studies', stream: 'humanities' },

  // Skill / creative / physical
  { id: 'physical-education', name: 'Physical Education', stream: 'skill' },
  { id: 'fine-arts', name: 'Fine Arts / Painting', stream: 'skill' },
  { id: 'music', name: 'Music', stream: 'skill' },
  { id: 'home-science', name: 'Home Science', stream: 'skill' },

  // Languages
  { id: 'english', name: 'English', stream: 'language' },
  { id: 'hindi', name: 'Hindi', stream: 'language' },
  { id: 'sanskrit', name: 'Sanskrit', stream: 'language' },
  { id: 'french', name: 'French', stream: 'language' },
]
