import type {
  Question,
  RiasecCode,
  BigFiveTrait,
  WorkValue,
  ChoiceOption,
  ScoreTag,
} from '../types'
import { SHAPES, arrow, poly, fShape } from './svg'

// ------------------------------------------------------------------
// Builder helpers keep the bank terse and consistent.
// ------------------------------------------------------------------

const ENJOY_SCALE = {
  min: 1,
  max: 5,
  minLabel: 'Would dislike',
  maxLabel: 'Would love',
  faces: true,
}
const AGREE_SCALE = { min: 1, max: 5, minLabel: 'Not like me', maxLabel: 'Exactly like me' }

/** Holland interest item: "how much would you enjoy …". */
function enjoy(
  id: string,
  prompt: string,
  code: RiasecCode,
  section: string,
  module?: Question['module'],
): Question {
  return {
    id,
    kind: 'likert',
    construct: 'riasec',
    prompt,
    section,
    module,
    scale: ENJOY_SCALE,
    tags: [{ construct: 'riasec', riasec: code }],
  }
}

/** Mini-IPIP personality item. */
function agree(
  id: string,
  prompt: string,
  trait: BigFiveTrait,
  direction: 1 | -1,
  section: string,
): Question {
  return {
    id,
    kind: 'likert',
    construct: 'bigfive',
    prompt,
    section,
    scale: AGREE_SCALE,
    tags: [{ construct: 'bigfive', trait, direction }],
  }
}

/** Slider between two poles; left pole is reverse-keyed, right pole forward-keyed. */
function spectrum(
  id: string,
  prompt: string,
  leftLabel: string,
  rightLabel: string,
  leftTag: ScoreTag,
  rightTag: ScoreTag,
  section: string,
): Question {
  return {
    id,
    kind: 'spectrum',
    construct: leftTag.construct,
    prompt,
    section,
    scale: { min: 0, max: 100, minLabel: leftLabel, maxLabel: rightLabel },
    tags: [
      { ...rightTag, direction: 1 },
      { ...leftTag, direction: -1 },
    ],
  }
}

function opt(
  id: string,
  label: string,
  tags?: ScoreTag[],
  extra?: Partial<ChoiceOption>,
): ChoiceOption {
  return { id, label, tags, ...extra }
}

function pair(
  id: string,
  prompt: string,
  helper: string,
  a: ChoiceOption,
  b: ChoiceOption,
  section: string,
  module?: Question['module'],
): Question {
  return { id, kind: 'thisOrThat', construct: 'riasec', prompt, helper, section, module, options: [a, b] }
}

function scenario(
  id: string,
  prompt: string,
  helper: string,
  options: ChoiceOption[],
  section: string,
  construct: Question['construct'] = 'riasec',
  module?: Question['module'],
): Question {
  return { id, kind: 'scenario', construct, prompt, helper, section, module, options }
}

function apt(
  id: string,
  domain: Question['domain'],
  prompt: string,
  options: ChoiceOption[],
  section: string,
  extra?: Partial<Question>,
): Question {
  return {
    id,
    kind: 'aptitude',
    construct: 'aptitude',
    domain,
    prompt,
    section,
    options,
    softTimeLimit: 50,
    ...extra,
  }
}

const R = (riasec: RiasecCode): ScoreTag => ({ construct: 'riasec', riasec })
const V = (value: WorkValue): ScoreTag => ({ construct: 'values', value })

// ------------------------------------------------------------------
// CORE BLOCK, always asked, fixed order, standardised & comparable.
// ------------------------------------------------------------------

const warmup: Question[] = [
  spectrum(
    'w-hands-ideas',
    'Where do you feel more at home?',
    'Working with my hands & real, physical things',
    'Working with ideas, theories & abstractions',
    R('R'),
    R('I'),
    'Warming up',
  ),
  spectrum(
    'w-people-focus',
    'You do your best work…',
    'Around people, thinking out loud',
    'Alone, in deep quiet focus',
    { construct: 'bigfive', trait: 'extraversion' },
    { construct: 'riasec', riasec: 'I' },
    'Warming up',
  ),
  pair(
    'w-afternoon',
    'A completely free afternoon. Be honest, which sounds better?',
    'There is no right answer. Go with your gut.',
    opt('make', 'Make or build something of my own', [R('A'), R('R')], { icon: 'tools' }),
    opt('solve', 'Get lost solving a tricky problem or puzzle', [R('I')], { icon: 'puzzle' }),
    'Warming up',
  ),
]

const interests: Question[] = [
  enjoy('i-r1', 'Build or repair something real using tools and your hands.', 'R', 'What pulls you'),
  enjoy('i-r2', 'Set up and operate equipment like a drone, a camera rig, or lab apparatus.', 'R', 'What pulls you'),
  enjoy('i-i1', 'Dig into why something happened until the real cause finally clicks.', 'I', 'What pulls you'),
  enjoy('i-i2', 'Spend a whole evening cracking a hard puzzle, proof, or problem.', 'I', 'What pulls you'),
  enjoy('i-a1', 'Design how something looks, a poster, a room, a short film.', 'A', 'What pulls you'),
  enjoy('i-a2', 'Create something original: a story, a track, a piece of art.', 'A', 'What pulls you'),
  enjoy('i-s1', 'Patiently help someone finally understand a thing they struggled with.', 'S', 'What pulls you'),
  enjoy('i-s2', 'Support a friend through a rough patch and genuinely help them.', 'S', 'What pulls you'),
  enjoy('i-e1', 'Pitch an idea you believe in and win people over to back it.', 'E', 'What pulls you'),
  enjoy('i-e2', 'Lead a team and make the final call when it really counts.', 'E', 'What pulls you'),
  enjoy('i-c1', 'Organise messy information into one clean, exact system.', 'C', 'What pulls you'),
  enjoy('i-c2', 'Track a budget carefully until every single number reconciles.', 'C', 'What pulls you'),
]

const instinct: Question[] = [
  pair(
    'g-great-at',
    'Which would you rather be brilliant at?',
    'Pick the one that actually excites you more.',
    opt('how', 'Figuring out how things really work', [R('I')], { icon: 'search' }),
    opt('people', 'Getting people to pull together', [R('S'), R('E')], { icon: 'handshake' }),
    'Gut checks',
  ),
  pair(
    'g-compliment',
    'Which compliment would mean more to you?',
    '',
    opt('precise', '“You’re so precise and dependable.”', [R('C')], { icon: 'target' }),
    opt('original', '“You’re so original and imaginative.”', [R('A')], { icon: 'sparkles' }),
    'Gut checks',
  ),
]

const personality: Question[] = [
  agree('p-ext1', 'I enjoy being the centre of attention in a group.', 'extraversion', 1, 'How you’re wired'),
  agree('p-ext2', 'In most groups, I tend to stay quietly in the background.', 'extraversion', -1, 'How you’re wired'),
  agree('p-agr1', 'I genuinely feel other people’s emotions as if they were my own.', 'agreeableness', 1, 'How you’re wired'),
  agree('p-agr2', 'I’m not all that interested in other people’s problems.', 'agreeableness', -1, 'How you’re wired'),
  agree('p-con1', 'I like order, and I get tasks done right away.', 'conscientiousness', 1, 'How you’re wired'),
  agree('p-con2', 'I often leave things messy or put them off till later.', 'conscientiousness', -1, 'How you’re wired'),
  agree('p-neu1', 'My mood can swing quite a lot in a single day.', 'neuroticism', 1, 'How you’re wired'),
  agree('p-neu2', 'I stay calm and relaxed even when things get stressful.', 'neuroticism', -1, 'How you’re wired'),
  agree('p-opn1', 'I love playing with new ideas and using my imagination.', 'openness', 1, 'How you’re wired'),
  agree('p-opn2', 'I find abstract or theoretical ideas boring.', 'openness', -1, 'How you’re wired'),
]

const aptitudeBaseline: Question[] = [
  apt(
    'a-num1',
    'numerical',
    'A college received 120 applications last week and 150 this week. By what percentage did applications increase?',
    [
      opt('20', '20%'),
      opt('25', '25%', undefined, { correct: true }),
      opt('30', '30%'),
      opt('125', '125%'),
    ],
    'Sharp tools',
  ),
  apt(
    'a-verb1',
    'verbal',
    'AUTHOR is to BOOK as COMPOSER is to ___',
    [
      opt('orchestra', 'Orchestra'),
      opt('symphony', 'Symphony', undefined, { correct: true }),
      opt('instrument', 'Instrument'),
      opt('concert', 'Concert'),
    ],
    'Sharp tools',
  ),
  apt(
    'a-log1',
    'logical',
    'The arrows turn by the same rule each step. Which arrow comes next?',
    [
      opt('up', '', undefined, { svg: arrow('up') }),
      opt('left', '', undefined, { svg: arrow('left'), correct: true }),
      opt('down', '', undefined, { svg: arrow('down') }),
      opt('right', '', undefined, { svg: arrow('right') }),
    ],
    'Sharp tools',
    {
      helper: 'Up → Right → Down → ?',
      stemSvg: `<div style="display:flex;gap:14px;align-items:center;justify-content:center">
        <div style="width:48px;height:48px">${arrow('up')}</div>
        <div style="width:48px;height:48px">${arrow('right')}</div>
        <div style="width:48px;height:48px">${arrow('down')}</div>
        <div style="font-family:var(--font-display);font-size:34px;color:#be6a2e">?</div>
      </div>`,
    },
  ),
  apt(
    'a-spatial1',
    'spatial',
    'Which option is the mirror image (a flip) of the shape shown?',
    [
      opt('mirror', '', undefined, { svg: fShape('mirror'), correct: true }),
      opt('same', '', undefined, { svg: fShape('normal') }),
      opt('flip180', '', undefined, { svg: fShape('flip180') }),
      opt('rot90', '', undefined, { svg: fShape('rot90') }),
    ],
    'Sharp tools',
    {
      stemSvg: `<div style="width:84px;height:84px;margin:0 auto">${fShape('normal')}</div>`,
    },
  ),
  apt(
    'a-num2',
    'numerical',
    'What number continues this series?  3, 6, 11, 18, 27, ___',
    [
      opt('36', '36'),
      opt('37', '37'),
      opt('38', '38', undefined, { correct: true }),
      opt('40', '40'),
    ],
    'Sharp tools',
    { helper: 'Gaps grow: +3, +5, +7, +9 …' },
  ),
  apt(
    'a-log2',
    'logical',
    'Three of these shapes share something the fourth does not. Which is the odd one out?',
    [
      opt('square', '', [], { svg: SHAPES.square }),
      opt('pentagon', '', [], { svg: SHAPES.pentagon }),
      opt('hexagon', '', [], { svg: SHAPES.hexagon }),
      opt('circle', '', [], { svg: SHAPES.circle, correct: true }),
    ],
    'Sharp tools',
  ),
]

const values: Question[] = [
  {
    id: 'v-rank',
    kind: 'rank',
    construct: 'values',
    prompt: 'Rank these by how much they matter to you in a future career.',
    helper: 'Drag the one that matters most to the top. Take your time.',
    section: 'What matters',
    options: [
      opt('impact', 'Making a real difference to people', [V('impact')], { icon: 'handshake' }),
      opt('stability', 'Security & a stable future', [V('stability')], { icon: 'shield' }),
      opt('creativity', 'Creative freedom & self-expression', [V('creativity')], { icon: 'palette' }),
      opt('income', 'Strong financial reward', [V('income')], { icon: 'coins' }),
      opt('autonomy', 'Independence, being my own boss', [V('autonomy')], { icon: 'compass' }),
      opt('prestige', 'Recognition & status', [V('prestige')], { icon: 'trophy' }),
      opt('knowledge', 'Mastery & deep knowledge', [V('knowledge')], { icon: 'microscope' }),
      opt('structure', 'Clear structure & order', [V('structure')], { icon: 'clipboard' }),
    ],
  },
  scenario(
    'v-offers',
    'Two job offers, exactly the same pay. Which pulls you more?',
    'Imagine you have to pick today.',
    [
      opt('free', 'Total creative freedom, but unpredictable and uncertain', [V('creativity'), V('autonomy')], { icon: 'palette' }),
      opt('secure', 'Very secure and well-structured, with clear rules', [V('stability'), V('structure')], { icon: 'shield' }),
      opt('help', 'Lower profile, but you clearly help people every day', [V('impact')], { icon: 'handshake' }),
      opt('climb', 'Fast growth, high status, eyes on a top position', [V('prestige'), V('income')], { icon: 'trophy' }),
    ],
    'What matters',
    'values',
  ),
  scenario(
    'v-proud',
    'At 30, which would make you proudest?',
    '',
    [
      opt('solved', 'Solved a problem nobody else could crack', [V('knowledge'), R('I')], { icon: 'brain' }),
      opt('built', 'Built something that helped thousands of people', [V('impact'), R('E')], { icon: 'globe' }),
      opt('led', 'Led a successful team or company', [V('prestige'), R('E')], { icon: 'rocket' }),
      opt('mastered', 'Became a true master of your craft', [V('knowledge'), R('A')], { icon: 'target' }),
    ],
    'What matters',
    'values',
  ),
]

export const CORE: Question[] = [
  ...warmup,
  ...interests,
  ...instinct,
  ...personality,
  ...aptitudeBaseline,
  ...values,
]

// ------------------------------------------------------------------
// ADAPTIVE DEEP-DIVE MODULES, only the 2 best-matched are served.
// Several items carry `appliesIf` so the tree prunes within a module.
// ------------------------------------------------------------------

const S = 'Going deeper'

const appliedTech: Question[] = [
  enjoy('at-1', 'Write code or design a system that automates a real task.', 'I', S, 'applied-tech'),
  enjoy('at-2', 'Understand the maths and physics behind how a machine or algorithm works.', 'I', S, 'applied-tech'),
  // Branch: give the hard spatial item only to those who handled spatial/logic well;
  // otherwise give a cleaner numerical item so we still learn, without piling on.
  apt(
    'at-apt-spatial',
    'spatial',
    'Which shape is the piece above rotated, WITHOUT flipping it over?',
    [
      opt('sv', '', undefined, { svg: poly([[0, 0], [0, 1], [1, 1], [1, 2]]), correct: true }),
      opt('zh', '', undefined, { svg: poly([[0, 0], [1, 0], [1, 1], [2, 1]]) }),
      opt('zv', '', undefined, { svg: poly([[1, 0], [0, 1], [1, 1], [0, 2]]) }),
      opt('lv', '', undefined, { svg: poly([[0, 0], [0, 1], [0, 2], [1, 2]]) }),
    ],
    S,
    {
      module: 'applied-tech',
      difficulty: 'hard',
      stemSvg: `<div style="width:90px;height:68px;margin:0 auto">${poly([[1, 0], [2, 0], [0, 1], [1, 1]])}</div>`,
      appliesIf: (ctx) =>
        ctx.strongDomains.includes('spatial') || ctx.strongDomains.includes('logical'),
    },
  ),
  apt(
    'at-apt-num',
    'numerical',
    'A program runs in 48 ms. After optimising, it runs in 36 ms. By what percentage did the time drop?',
    [
      opt('12', '12%'),
      opt('25', '25%', undefined, { correct: true }),
      opt('33', '33%'),
      opt('75', '75%'),
    ],
    S,
    {
      module: 'applied-tech',
      appliesIf: (ctx) =>
        !(ctx.strongDomains.includes('spatial') || ctx.strongDomains.includes('logical')),
    },
  ),
  scenario(
    'at-sc',
    'Something you built keeps crashing under heavy load. What’s the most satisfying part of fixing it?',
    '',
    [
      opt('root', 'Hunting down the exact root cause', [R('I')], { icon: 'microscope' }),
      opt('rebuild', 'Rebuilding it more elegantly than before', [R('A'), R('I')], { icon: 'draft' }),
      opt('robust', 'Making it rock-solid and well-documented', [R('C')], { icon: 'blocks' }),
      opt('ship', 'Rallying the team to ship the fix on time', [R('E')], { icon: 'zap' }),
    ],
    S,
    'riasec',
    'applied-tech',
  ),
  pair(
    'at-branch',
    'Within the world of building, which pulls you more?',
    'This helps separate very different paths.',
    opt('physical', 'Designing physical things & structures, machines, buildings', [R('R'), R('A')], { icon: 'building' }),
    opt('software', 'Designing software & abstract systems, code, logic, data', [R('I')], { icon: 'data' }),
    S,
    'applied-tech',
  ),
]

const creativeDesign: Question[] = [
  enjoy('cd-1', 'Shape how something looks and feels so that it genuinely moves people.', 'A', S, 'creative-design'),
  enjoy('cd-2', 'Tell a story through visuals, words, sound, or space.', 'A', S, 'creative-design'),
  apt(
    'cd-apt',
    'spatial',
    'Which shape continues the pattern?',
    [
      opt('hex', '', undefined, { svg: SHAPES.hexagon, correct: true }),
      opt('circle', '', undefined, { svg: SHAPES.circle }),
      opt('square', '', undefined, { svg: SHAPES.square }),
      opt('tri', '', undefined, { svg: SHAPES.triangle }),
    ],
    S,
    {
      module: 'creative-design',
      stemSvg: `<div style="display:flex;gap:12px;align-items:center;justify-content:center">
        <div style="width:52px;height:52px">${SHAPES.triangle}</div>
        <div style="width:52px;height:52px">${SHAPES.square}</div>
        <div style="width:52px;height:52px">${SHAPES.pentagon}</div>
        <div style="font-family:var(--font-display);font-size:30px;color:#be6a2e">?</div>
      </div>`,
      helper: '3 sides, 4 sides, 5 sides …',
    },
  ),
  scenario(
    'cd-sc',
    'Your design gets strong public criticism. What’s your honest first move?',
    '',
    [
      opt('rework', 'Take the feedback and rework it into something better', [R('A'), R('C')], { icon: 'wrench' }),
      opt('defend', 'Stand by your vision and make the case for it', [R('A'), R('E')], { icon: 'shield' }),
      opt('study', 'Quietly study why it didn’t land', [R('I')], { icon: 'search' }),
      opt('ask', 'Ask the audience what they actually felt', [R('S')], { icon: 'message' }),
    ],
    S,
    'riasec',
    'creative-design',
  ),
  pair(
    'cd-branch',
    'Which creative world feels more like yours?',
    '',
    opt('visual', 'Visual & spatial, product, space, film, interfaces', [R('A'), R('R')], { icon: 'film' }),
    opt('language', 'Language & performance, writing, music, theatre', [R('A'), R('S')], { icon: 'drama' }),
    S,
    'creative-design',
  ),
]

const lifeHealth: Question[] = [
  enjoy('lh-1', 'Understand in detail how the human body or living systems work.', 'I', S, 'life-health'),
  enjoy('lh-2', 'Care for someone’s health and watch them recover because of you.', 'S', S, 'life-health'),
  apt(
    'lh-apt',
    'logical',
    'In a trial, plants given Fertiliser X grew taller than plants given plain water. To be confident X caused the growth, what matters most?',
    [
      opt('control', 'A comparison group treated identically except for X', [], { correct: true }),
      opt('more', 'Giving the plants even more fertiliser'),
      opt('pots', 'Using nicer pots for the fertilised plants'),
      opt('measure', 'Only measuring the tallest plants'),
    ],
    S,
    { module: 'life-health' },
  ),
  scenario(
    'lh-sc',
    'What draws you to medicine or life sciences the most?',
    '',
    [
      opt('research', 'Solving the scientific puzzle of disease', [R('I')], { icon: 'testtube' }),
      opt('care', 'Caring for patients directly, face to face', [R('S')], { icon: 'stethoscope' }),
      opt('build', 'Building the devices, drugs, or tech that heal', [R('R'), R('I')], { icon: 'pill' }),
      opt('scale', 'Improving the health of whole communities', [R('E'), R('S')], { icon: 'globe' }),
    ],
    S,
    'riasec',
    'life-health',
  ),
  pair(
    'lh-branch',
    'If you went into health, which suits you better?',
    '',
    opt('clinical', 'Hands-on clinical work with people', [R('S'), R('R')], { icon: 'cross' }),
    opt('lab', 'Lab, research, and discovery', [R('I')], { icon: 'microscope' }),
    S,
    'life-health',
  ),
]

const peopleSociety: Question[] = [
  enjoy('ps-1', 'Help people grow by teaching, coaching, or counselling them.', 'S', S, 'people-society'),
  enjoy('ps-2', 'Understand why people and whole societies behave the way they do.', 'I', S, 'people-society'),
  apt(
    'ps-apt',
    'verbal',
    'All counsellors are good listeners. Riya is a good listener. Which must be true?',
    [
      opt('is', 'Riya is a counsellor'),
      opt('isnt', 'Riya is not a counsellor'),
      opt('cant', 'We can’t conclude whether Riya is a counsellor', undefined, { correct: true }),
      opt('none', 'No good listeners are counsellors'),
    ],
    S,
    { module: 'people-society' },
  ),
  scenario(
    'ps-sc',
    'A friend is clearly struggling. What’s your instinct?',
    '',
    [
      opt('listen', 'Listen until they feel truly understood', [R('S')], { icon: 'ear' }),
      opt('plan', 'Help them make a concrete plan to fix it', [R('C'), R('S')], { icon: 'folders' }),
      opt('connect', 'Connect them to someone who can really help', [R('E'), R('S')], { icon: 'link' }),
      opt('understand', 'Try to understand what’s really going on underneath', [R('I')], { icon: 'brain' }),
    ],
    S,
    'riasec',
    'people-society',
  ),
  pair(
    'ps-branch',
    'Which kind of impact feels more like you?',
    '',
    opt('individual', 'One-to-one, changing individual lives', [R('S')], { icon: 'heart' }),
    opt('systems', 'Systems & policy, changing many lives at once', [R('E'), R('I')], { icon: 'landmark' }),
    S,
    'people-society',
  ),
]

const businessEnterprise: Question[] = [
  enjoy('be-1', 'Spot an opportunity and build a venture around it.', 'E', S, 'business-enterprise'),
  enjoy('be-2', 'Lead people and drive a plan all the way to real results.', 'E', S, 'business-enterprise'),
  apt(
    'be-apt',
    'numerical',
    'A shop buys an item for ₹400 and sells it for ₹500. What is the profit percentage?',
    [
      opt('10', '10%'),
      opt('20', '20%'),
      opt('25', '25%', undefined, { correct: true }),
      opt('100', '100%'),
    ],
    S,
    { module: 'business-enterprise' },
  ),
  scenario(
    'be-sc',
    'You’re running a startup and cash is tight. What energises you most?',
    '',
    [
      opt('sell', 'Closing the big sale', [R('E')], { icon: 'handshake' }),
      opt('ops', 'Optimising the numbers and operations', [R('C')], { icon: 'barchart' }),
      opt('invent', 'Inventing the product itself', [R('I'), R('A')], { icon: 'lightbulb' }),
      opt('team', 'Building the team and its culture', [R('S'), R('E')], { icon: 'users' }),
    ],
    S,
    'riasec',
    'business-enterprise',
  ),
  pair(
    'be-branch',
    'Which side of business is more you?',
    '',
    opt('finance', 'Finance, markets & numbers', [R('C'), R('I')], { icon: 'trending' }),
    opt('marketing', 'Marketing, brand & people', [R('E'), R('A')], { icon: 'megaphone' }),
    S,
    'business-enterprise',
  ),
]

const lawHumanities: Question[] = [
  enjoy('lw-1', 'Build a tight argument and persuade people with words.', 'E', S, 'law-humanities'),
  enjoy('lw-2', 'Dig into history, texts, or big ideas to understand the world.', 'I', S, 'law-humanities'),
  apt(
    'lw-apt',
    'verbal',
    'Every contract that is signed is binding. This document is binding. Can we conclude it was signed?',
    [
      opt('yes', 'Yes, definitely'),
      opt('no', 'No, it was never signed'),
      opt('maybe', 'Not necessarily, binding things needn’t be signed contracts', undefined, { correct: true }),
      opt('both', 'It is both signed and unsigned'),
    ],
    S,
    { module: 'law-humanities' },
  ),
  scenario(
    'lw-sc',
    'What pulls you toward law or the humanities?',
    '',
    [
      opt('argue', 'Arguing a case and winning it', [R('E')], { icon: 'scale' }),
      opt('justice', 'Fighting for justice and fairness', [R('S'), R('E')], { icon: 'feather' }),
      opt('craft', 'The intellectual craft of interpretation', [R('I'), R('A')], { icon: 'book' }),
      opt('policy', 'Shaping policy and society', [R('E'), R('S')], { icon: 'landmark' }),
    ],
    S,
    'riasec',
    'law-humanities',
  ),
  pair(
    'lw-branch',
    'Which appeals to you more?',
    '',
    opt('advocacy', 'Debate, courtroom, advocacy', [R('E')], { icon: 'speak' }),
    opt('scholarship', 'Research, writing, scholarship', [R('I'), R('A')], { icon: 'pen' }),
    S,
    'law-humanities',
  ),
]

export const MODULES: Record<Question['module'] & string, Question[]> = {
  'applied-tech': appliedTech,
  'creative-design': creativeDesign,
  'life-health': lifeHealth,
  'people-society': peopleSociety,
  'business-enterprise': businessEnterprise,
  'law-humanities': lawHumanities,
}

export const MODULE_META: Record<
  Question['module'] & string,
  { title: string; blurb: string }
> = {
  'applied-tech': { title: 'Applied Tech & Engineering', blurb: 'building systems & machines' },
  'creative-design': { title: 'Creative & Design', blurb: 'making & expression' },
  'life-health': { title: 'Life Sciences & Health', blurb: 'living systems & care' },
  'people-society': { title: 'People, Mind & Society', blurb: 'understanding & helping people' },
  'business-enterprise': { title: 'Business & Enterprise', blurb: 'leading & building ventures' },
  'law-humanities': { title: 'Law, Policy & Humanities', blurb: 'words, ideas & justice' },
}

// ------------------------------------------------------------------
// CLOSING, open reflections (optional). Gold for later qualitative read.
// ------------------------------------------------------------------

export const REFLECTIONS: Question[] = [
  {
    id: 'ref-flow',
    kind: 'reflection',
    construct: 'reflection',
    prompt: 'When do you lose all track of time, what are you usually doing?',
    helper: 'A sentence or two is plenty. There’s no wrong answer.',
    section: 'In your words',
    placeholder: 'I lose track of time when I…',
    optional: true,
  },
  {
    id: 'ref-dream',
    kind: 'reflection',
    construct: 'reflection',
    prompt:
      'If marks, money, and other people’s opinions didn’t matter at all, what would you want to spend your life doing?',
    helper: 'Be honest, even if it sounds unrealistic.',
    section: 'In your words',
    placeholder: 'Honestly, I’d want to…',
    optional: true,
  },
]
