export type TrainingRole = "leadership" | "staff" | "parents" | "trusts";
export type TrainingTime = "3" | "7" | "15";
export type TrainingTopic = "predictability" | "repair" | "adult-regulation" | "boundaries" | "inspection" | "neurodivergence";

export type Scenario = {
  id: string;
  title: string;
  role: TrainingRole;
  topic: TrainingTopic;
  time: TrainingTime;
  situation: string;
  constraints: string[]; // safety / boundaries reminders
  questions: Question[];
  answerKey: AnswerKeyItem[];
  outputs: {
    checklistTitle: string;
    checklist: string[];
    briefingTitle: string;
    briefingScript: string[]; // short staff briefing
    parentTitle?: string;
    parentTemplate?: string[]; // optional for parents-facing
    notes?: string[];
  };
};

export type Question =
  | {
      kind: "MCQ";
      id: string;
      prompt: string;
      options: { id: string; label: string }[];
      correctId: string;
      rationale: string;
    }
  | {
      kind: "SHORT";
      id: string;
      prompt: string;
      rubric: string[]; // what a good answer includes
      example: string; // safe exemplar
    };

export type AnswerKeyItem = {
  title: string;
  whatToSay: string[];
  whatToDo: string[];
  whatToAvoid: string[];
};

export function roles(): { id: TrainingRole; label: string; desc: string }[] {
  return [
    { id: "leadership", label: "Leadership", desc: "Systems, implementation, inspection framing." },
    { id: "staff", label: "Staff", desc: "Classroom response, predictability, repair." },
    { id: "parents", label: "Parents", desc: "Communication tone, boundaries, predictability at home." },
    { id: "trusts", label: "Trusts / LA", desc: "Governance, scale without founder dependency." },
  ];
}

export function topics(): { id: TrainingTopic; label: string; desc: string }[] {
  return [
    { id: "predictability", label: "Predictability", desc: "Reduce stress with stable routines and expectations." },
    { id: "repair", label: "Repair", desc: "Rupture → repair without shame or escalation." },
    { id: "adult-regulation", label: "Adult regulation", desc: "Support adults to respond, not react." },
    { id: "boundaries", label: "Boundaries", desc: "Stop lines: scope and responsibility boundaries." },
    { id: "inspection", label: "Inspection framing", desc: "Clear, inspection-safe language." },
    { id: "neurodivergence", label: "Neurodivergence & trauma", desc: "Dual lens: ND and trauma as default considerations in every scenario." },
  ];
}

export function scenarios(): Scenario[] {
  return [
    {
      id: "staff-predictability-7",
      title: "A volatile transition (end of lunch → lesson)",
      role: "staff",
      topic: "predictability",
      time: "7",
      situation:
        "After lunch, the class re-enters loudly. Two pupils refuse to sit. One adult starts raising their voice to regain control. The room escalates quickly.",
      constraints: [
        "No child diagnosis or 'why'. Focus on adult actions and environment.",
        "No behaviour-plan design here. This is a brief response + system tweak.",
        "If safeguarding indicators appear, follow school policy immediately.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "What is the best *first* move in the next 20 seconds?",
          options: [
            { id: "a", label: "Issue consequences immediately to reassert authority." },
            { id: "b", label: "Lower the temperature: reduce verbal load and make the next step predictable." },
            { id: "c", label: "Ask the pupils to explain why they are acting this way." },
            { id: "d", label: "Send both pupils out as quickly as possible." },
          ],
          correctId: "b",
          rationale:
            "Predictability reduces stress. In a hot moment, short, calm, concrete next steps beat explanation or punishment.",
        },
        {
          kind: "MCQ",
          id: "q2",
          prompt: "Which sentence is most aligned with this system?",
          options: [
            { id: "a", label: "'You're being disruptive—stop now or you'll be sanctioned.'" },
            { id: "b", label: "'We're safe. Two steps: bags down, then seats. I'll wait.'" },
            { id: "c", label: "'What's wrong with you today?'" },
            { id: "d", label: "'If you don't sit, you're choosing to fail.'" },
          ],
          correctId: "b",
          rationale:
            "Short, non-interpretive, stepwise instruction + calm waiting. No blame, no story, no escalation.",
        },
        {
          kind: "SHORT",
          id: "q3",
          prompt:
            "Write a 2-sentence 'reset' script you could use in that moment (keep it neutral, predictable, non-shaming).",
          rubric: [
            "Names safety and next steps (1–2 steps max).",
            "Neutral tone; no 'why', no blame.",
            "Offers a small choice if possible ('you can stand by your chair or sit').",
          ],
          example:
            `We're safe. Next step: bags down, then choose—stand by your chair or sit. I'll wait and then we'll begin.`,
        },
      ],
      answerKey: [
        {
          title: "What good looks like (in the room)",
          whatToSay: [
            "Short sentences. One instruction at a time.",
            "Name the next step and wait.",
            "Use 'when… then…' not threats.",
          ],
          whatToDo: [
            "Reduce verbal load; slow your pace.",
            "Make the transition routine visible (board / timer / steps).",
            "After: repair briefly and reset the routine.",
          ],
          whatToAvoid: [
            "Public power struggles.",
            "Asking for explanations mid-escalation.",
            "Long lectures or stacked instructions.",
          ],
        },
      ],
      outputs: {
        checklistTitle: "7-minute transition stabiliser (staff)",
        checklist: [
          "Before lunch ends: post the 2-step return routine visibly.",
          "Use a consistent entry cue (timer / phrase / gesture).",
          "In the moment: 1–2 steps, calm wait, minimal words.",
          "Offer a small choice that preserves dignity.",
          "After: 30-second repair ('We reset. Next time we'll do steps 1–2.').",
        ],
        briefingTitle: "Staff briefing (60 seconds)",
        briefingScript: [
          "Today's focus: predictable transitions reduce stress.",
          "We will use the same 2-step return routine after lunch.",
          "If it heats up: fewer words, name the next step, calm wait.",
          "We repair after, not during. No public power struggles.",
        ],
        parentTitle: "Optional parent message (neutral)",
        parentTemplate: [
          "This term we're strengthening predictable routines to support calm learning.",
          "You may hear your child mention 'steps' or 'reset' language—this is part of consistent classroom routines.",
          "If you have questions about routines, please contact the school. Safeguarding concerns follow our safeguarding procedures.",
        ],
        notes: [
          "This is not a behaviour programme. It's a predictable-environment micro-practice.",
        ],
      },
    },
    {
      id: "leadership-inspection-7",
      title: "Inspection conversation: 'Is this therapy?'",
      role: "leadership",
      topic: "inspection",
      time: "7",
      situation:
        "A governor/inspector asks whether your trauma-informed work is 'therapeutic' and how you ensure boundaries and safeguarding remain clear.",
      constraints: [
        "No efficacy claims. No 'research proves' language.",
        "Keep it system-level: adult practice, predictability, repair, safeguarding boundaries.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "Which framing is safest and most accurate?",
          options: [
            { id: "a", label: "'We treat trauma through staff training.'" },
            { id: "b", label: "'We're an evidence-based intervention that improves outcomes.'" },
            { id: "c", label: "'This is a school-safe framework for adult responses and predictable environments; safeguarding remains unchanged.'" },
            { id: "d", label: "'We diagnose early and intervene.'" },
          ],
          correctId: "c",
          rationale:
            "System-level, non-therapeutic, non-claiming, and boundary-clear.",
        },
        {
          kind: "SHORT",
          id: "q2",
          prompt: "Write a 3-sentence inspection-safe description you can reuse.",
          rubric: [
            "States what it is (framework for adult practice and environments).",
            "States what it focuses on (adult practice, predictable environments, organisational responses).",
            "States safeguarding remains with school policy.",
          ],
          example:
            `We use a trauma-informed *framework* to improve safety and predictability in adult practice and routines. This system focuses on adult practice, predictable environments, and organisational responses. Child-specific concerns should always be addressed through the school's safeguarding and statutory processes.`,
        },
      ],
      answerKey: [
        {
          title: "What good looks like (stakeholder confidence)",
          whatToSay: [
            "'Framework', 'adult practice', 'predictability', 'repair'.",
            "'Focuses on adult practice and environments' explicitly.",
            "'Safeguarding unchanged' explicitly.",
          ],
          whatToDo: [
            "Have agreed wording in SLT.",
            "Document boundaries in staff induction.",
            "Keep a clear handoff: wellbeing support ≠ safeguarding.",
          ],
          whatToAvoid: [
            "Outcome promises.",
            "Clinical language.",
            "Child-specific speculation.",
          ],
        },
      ],
      outputs: {
        checklistTitle: "Inspection-ready boundary checklist (leadership)",
        checklist: [
          "Agreed 3-sentence description shared by SLT.",
          "Written boundary: scope focuses on adult practice and system design.",
          "Safeguarding escalation routes reaffirmed.",
          "Staff know what to do when unsure (DSL).",
        ],
        briefingTitle: "60-second leadership briefing",
        briefingScript: [
          "We use a framework for adult practice and predictable routines.",
          "This system focuses on adult practice, predictable environments, and organisational responses.",
          "Safeguarding policy remains unchanged and is always the escalation route.",
        ],
      },
    },
    // ADD: 6 more scenarios (2 Staff, 2 Leadership, 2 Parents)

    // STAFF (3 min) — Repair micro-script
    {
      id: "staff-repair-3",
      title: "After a clash: micro-repair in 30 seconds",
      role: "staff",
      topic: "repair",
      time: "3",
      situation:
        "A pupil shouted at you. You raised your voice. The class is watching. You have a tiny window to repair without turning it into a 'big chat'.",
      constraints: [
        "No child diagnosis or 'why'. Focus on adult actions and environment.",
        "Repair is brief, behavioural, and forward-moving.",
        "If safeguarding indicators appear, follow school policy immediately.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "Which repair move fits this system best?",
          options: [
            { id: "a", label: "Explain why you raised your voice and ask them to apologise." },
            { id: "b", label: "Name the moment, own your part, and reset the next step." },
            { id: "c", label: "Ignore it completely so it doesn't look weak." },
            { id: "d", label: "Tell the class this is what trauma looks like." },
          ],
          correctId: "b",
          rationale:
            "Repair is brief, behavioural, and forward-moving. It restores safety without extracting apology or disclosure.",
        },
        {
          kind: "SHORT",
          id: "q2",
          prompt: "Write a one-sentence micro-repair you could say now (no blame, no therapy language).",
          rubric: [
            "Aim: 1) name, 2) own, 3) next step. Keep it short. No analysis of the child.",
          ],
          example:
            `That came out sharper than I meant. I'm resetting. Next step: line up quietly and we'll start again.`,
        },
      ],
      answerKey: [
        {
          title: "What good looks like (micro-repair)",
          whatToSay: [
            "Name the moment (brief)",
            "Own your part (one line)",
            "State the next step (clear, simple)",
          ],
          whatToDo: [
            "Keep it under 30 seconds",
            "No lecture, no diagnosis, no public negotiation",
            "Reset and move forward",
          ],
          whatToAvoid: [
            "Extracting apologies",
            "Long explanations",
            "Public power struggles",
          ],
        },
      ],
      outputs: {
        checklistTitle: "Micro-repair: 30-second reset",
        checklist: [
          "Name the moment (brief)",
          "Own your part (one line)",
          "State the next step (clear, simple)",
          "No lecture, no diagnosis, no public negotiation",
        ],
        briefingTitle: "Staff briefing (30 seconds)",
        briefingScript: [
          "Repair is brief and forward-moving.",
          "Name, own, next step—then reset.",
          "No apologies required, no long chats.",
        ],
      },
    },

    // STAFF (15 min) — Adult regulation under load
    {
      id: "staff-adultreg-15",
      title: "You're dysregulated: staying safe and predictable",
      role: "staff",
      topic: "adult-regulation",
      time: "15",
      situation:
        "You're carrying stress and feel close to snapping. The room is testing boundaries. You need a plan that protects you and the class.",
      constraints: [
        "No child diagnosis or 'why'. Focus on adult actions and environment.",
        "Adults first, children benefit. When adults are overloaded, complexity backfires.",
        "If safeguarding indicators appear, follow school policy immediately.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "What is the system's first priority here?",
          options: [
            { id: "a", label: "Push through and 'win' the behaviour battle." },
            { id: "b", label: "Increase adult regulation capacity and reduce load before adding strategies." },
            { id: "c", label: "Run a feelings circle so everyone can share." },
            { id: "d", label: "Remove consequences to avoid conflict." },
          ],
          correctId: "b",
          rationale:
            "Adults first, children benefit. When adults are overloaded, complexity backfires. Reduce load, increase clarity.",
        },
        {
          kind: "MCQ",
          id: "q2",
          prompt: "Which adjustment is most 'predictability first'?",
          options: [
            { id: "a", label: "Add new rules mid-lesson." },
            { id: "b", label: "Shrink the task, tighten transitions, and state the next 2 minutes clearly." },
            { id: "c", label: "Threaten detentions to regain control." },
            { id: "d", label: "Ask pupils to decide the lesson plan." },
          ],
          correctId: "b",
          rationale:
            "Predictability is a stabiliser. Small, clear steps reduce activation and protect classroom safety.",
        },
        {
          kind: "SHORT",
          id: "q3",
          prompt: "Write a 2-step plan for the next 5 minutes (adult move + environment move).",
          rubric: [
            "Keep it simple: one adult regulation move + one environmental simplification. No new programmes.",
          ],
          example:
            "Adult: take 2 slow breaths, lower voice, use a fixed script. Environment: set a 2-minute timer and give a single next instruction.",
        },
      ],
      answerKey: [
        {
          title: "What good looks like (5-minute stabiliser)",
          whatToSay: [
            "Use a fixed script (same words, calm tone)",
            "State the next 2 minutes clearly",
          ],
          whatToDo: [
            "Reduce load (shorten task, fewer transitions)",
            "Ask for help early (handoff, cover, reset)",
            "After: quick repair + reset, no post-mortem",
          ],
          whatToAvoid: [
            "Adding complexity",
            "Power struggles",
            "Long explanations",
          ],
        },
      ],
      outputs: {
        checklistTitle: "5-minute stabiliser (adult + environment)",
        checklist: [
          "Reduce load (shorten task, fewer transitions)",
          "Use a fixed script (same words, calm tone)",
          "Ask for help early (handoff, cover, reset)",
          "After: quick repair + reset, no post-mortem",
        ],
        briefingTitle: "Staff briefing (60 seconds)",
        briefingScript: [
          "When you're overloaded, reduce complexity first.",
          "Shrink the task, tighten transitions, use a fixed script.",
          "Ask for help early—it's not weakness, it's safety.",
        ],
      },
    },

    // LEADERSHIP (3 min) — Boundary request from staff
    {
      id: "leadership-boundaries-3",
      title: "Staff ask: 'Tell us what's wrong with this child'",
      role: "leadership",
      topic: "boundaries",
      time: "3",
      situation:
        "A stressed staff member asks for an explanation of a child's behaviour and wants a 'trauma-informed plan'. You must respond safely and clearly.",
      constraints: [
        "No child diagnosis or 'why'. Focus on adult actions and environment.",
        "This system is adult-and-environment focused. Individual child interpretation is outside scope.",
        "If safeguarding indicators appear, follow school policy immediately.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "Which response best fits the system boundaries?",
          options: [
            { id: "a", label: "Diagnose informally and suggest triggers to avoid." },
            { id: "b", label: "Refuse child-level analysis; redirect to environment + safeguarding pathway." },
            { id: "c", label: "Promise a behaviour plan template for the child." },
            { id: "d", label: "Ask the staff member to share their own trauma history to 'understand' the child." },
          ],
          correctId: "b",
          rationale:
            "This system is adult-and-environment focused. Individual child interpretation is outside scope and risks harm.",
        },
        {
          kind: "SHORT",
          id: "q2",
          prompt: "Write a one-paragraph leadership reply (calm, bounded, practical).",
          rubric: [
            "Refuse clearly, then offer a safe adjacent next step (predictability, repair, support, safeguarding if needed).",
          ],
          example:
            `We can't analyse or label individual children. What we can do is tighten predictability, clarify routines, and support staff responses. If there are safeguarding concerns, we follow the safeguarding process immediately. Let's review the environment triggers and agree a simple, consistent response plan for adults.`,
        },
      ],
      answerKey: [
        {
          title: "What good looks like (boundary script)",
          whatToSay: [
            "We don't diagnose or interpret children",
            "We change adult responses + predictability",
            "Safeguarding concerns → safeguarding policy",
          ],
          whatToDo: [
            "Redirect to environment review",
            "Agree a simple, consistent response plan for adults",
            "Support staff capacity before adding initiatives",
          ],
          whatToAvoid: [
            "Child-level analysis",
            "Promising behaviour plans",
            "Clinical language",
          ],
        },
      ],
      outputs: {
        checklistTitle: "Boundary script: child-level requests",
        checklist: [
          "We don't diagnose or interpret children",
          "We change adult responses + predictability",
          "Safeguarding concerns → safeguarding policy",
          "Support staff capacity before adding initiatives",
        ],
        briefingTitle: "60-second leadership briefing",
        briefingScript: [
          "When staff ask for child-level analysis, redirect to environment + adult responses.",
          "We don't diagnose. We change predictability and support staff consistency.",
          "Safeguarding concerns follow safeguarding policy immediately.",
        ],
      },
    },

    // LEADERSHIP (15 min) — Implementation cycle: removing load
    {
      id: "leadership-implementation-15",
      title: "90-day cycle: what do you remove to make space?",
      role: "leadership",
      topic: "predictability",
      time: "15",
      situation:
        "You want to 'implement trauma-informed practice', but staff are overloaded. You must protect time or the system fails.",
      constraints: [
        "No child diagnosis or 'why'. Focus on adult actions and environment.",
        "Time protection is a non-negotiable. Adding without removing increases load.",
        "If safeguarding indicators appear, follow school policy immediately.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "Which rule is most aligned with V1 implementation cycles?",
          options: [
            { id: "a", label: "Add training on top of everything and hope it sticks." },
            { id: "b", label: "Before adding, remove or pause something to create protected time." },
            { id: "c", label: "Make it optional so you can still claim you offered it." },
            { id: "d", label: "Roll it out as a one-off inset day." },
          ],
          correctId: "b",
          rationale:
            "Time protection is a non-negotiable. Adding without removing increases load and reduces safety.",
        },
        {
          kind: "SHORT",
          id: "q2",
          prompt: "List 2 things you could pause/remove for 90 days to protect time (systems-level, not 'try harder').",
          rubric: [
            "Choose low-value tasks, duplicative meetings, or competing initiatives—anything that steals attention from predictable routines.",
          ],
          example:
            "1) Pause a non-essential data tracking cycle. 2) Replace one meeting per fortnight with a 10-minute predictable reflection loop.",
        },
      ],
      answerKey: [
        {
          title: "What good looks like (90-day protection)",
          whatToSay: [
            "Name what you will pause/remove",
            "Protect a small, predictable slot",
            "Keep language inspection-safe (no therapy claims)",
          ],
          whatToDo: [
            "Choose low-value tasks or competing initiatives",
            "Measure process integrity, not child outcomes",
            "Support staff capacity before adding",
          ],
          whatToAvoid: [
            "Adding without removing",
            "Making it optional",
            "One-off rollouts",
          ],
        },
      ],
      outputs: {
        checklistTitle: "90-day protection checklist",
        checklist: [
          "Name what you will pause/remove",
          "Protect a small, predictable slot",
          "Keep language inspection-safe (no therapy claims)",
          "Measure process integrity, not child outcomes",
        ],
        briefingTitle: "60-second leadership briefing",
        briefingScript: [
          "Before adding, remove or pause something to create protected time.",
          "Choose low-value tasks or competing initiatives.",
          "Measure process integrity, not child outcomes.",
        ],
      },
    },

    // PARENTS (3 min) — Neutral message to school
    {
      id: "parents-communication-3",
      title: "Messaging school: calm, factual, non-escalating",
      role: "parents",
      topic: "boundaries",
      time: "3",
      situation:
        "You're worried about your child's day. You need to contact school without accusations or 'diagnosis talk', and ask for predictable support.",
      constraints: [
        "No child diagnosis or 'why'. Focus on adult actions and environment.",
        "Neutral tone lowers threat. Specific requests are easier for schools to act on.",
        "If safeguarding indicators appear, follow school policy immediately.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "Which message style is most likely to reduce friction?",
          options: [
            { id: "a", label: "Threaten complaint unless they admit they caused trauma." },
            { id: "b", label: "Short, factual, specific request for predictability and communication." },
            { id: "c", label: "A long narrative explaining your child's psychology." },
            { id: "d", label: "Demand the teacher apologise immediately." },
          ],
          correctId: "b",
          rationale:
            "Neutral tone lowers threat. Specific requests are easier for schools to act on and document safely.",
        },
        {
          kind: "SHORT",
          id: "q2",
          prompt: "Draft a 3–5 sentence message (factual + one clear request).",
          rubric: [
            "Keep it short: facts, impact, request, next step. No diagnosis or blame.",
          ],
          example:
            `Hi, I'm checking in about today. My child came home very upset after the transition after lunch. Could we agree a predictable plan for that transition and a brief note if it becomes difficult? Thank you.`,
        },
      ],
      answerKey: [
        {
          title: "What good looks like (parent message)",
          whatToSay: [
            "Facts (what happened)",
            "Impact (what you observed)",
            "One clear request (predictability/communication)",
            "Respectful close + next step",
          ],
          whatToDo: [
            "Keep it short and specific",
            "Avoid diagnosis or blame",
            "Request predictable support",
          ],
          whatToAvoid: [
            "Threats or accusations",
            "Long narratives",
            "Demanding apologies",
          ],
        },
      ],
      outputs: {
        checklistTitle: "Parent message template",
        checklist: [
          "Facts (what happened)",
          "Impact (what you observed)",
          "One clear request (predictability/communication)",
          "Respectful close + next step",
        ],
        briefingTitle: "Parent briefing (30 seconds)",
        briefingScript: [
          "Keep messages short, factual, and specific.",
          "Request predictable support and clear communication.",
          "Respectful tone reduces friction and increases cooperation.",
        ],
        parentTitle: "Example message",
        parentTemplate: [
          "Hi, I'm checking in about today. My child came home very upset after the transition after lunch.",
          "Could we agree a predictable plan for that transition and a brief note if it becomes difficult?",
          "Thank you.",
        ],
      },
    },

    // PARENTS (15 min) — Home predictability routine
    {
      id: "parents-predictability-15",
      title: "Home routine: predictable evenings without lectures",
      role: "parents",
      topic: "predictability",
      time: "15",
      situation:
        "Evenings are tense. You want a predictable routine that reduces conflict without turning home into 'behaviour management'.",
      constraints: [
        "No child diagnosis or 'why'. Focus on adult actions and environment.",
        "Predictability reduces activation. Small choices support agency without losing structure.",
        "If safeguarding indicators appear, follow school policy immediately.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "Which change best matches 'predictability first'?",
          options: [
            { id: "a", label: "New rules daily depending on mood." },
            { id: "b", label: "Same 3-step routine with visual/clear sequence and small choices." },
            { id: "c", label: "Extended negotiations until agreement." },
            { id: "d", label: "High consequences for minor slips." },
          ],
          correctId: "b",
          rationale:
            "Predictability reduces activation. Small choices support agency without losing structure.",
        },
        {
          kind: "SHORT",
          id: "q2",
          prompt: "Write a simple 3-step evening sequence + one choice you can offer.",
          rubric: [
            "Keep it small and repeatable. Avoid long explanations when stress is high.",
          ],
          example:
            "Sequence: 1) snack + sit, 2) wash + pyjamas, 3) story + lights. Choice: which story first or which pyjamas.",
        },
      ],
      answerKey: [
        {
          title: "What good looks like (predictable evening)",
          whatToSay: [
            "Use the same sequence daily",
            "Offer 1 small choice within structure",
            "Keep language calm + short",
          ],
          whatToDo: [
            "Repair fast after ruptures (no lecture)",
            "Make the sequence visible (chart/timer)",
            "Stick to the routine even when it's hard",
          ],
          whatToAvoid: [
            "New rules daily",
            "Extended negotiations",
            "High consequences",
          ],
        },
      ],
      outputs: {
        checklistTitle: "Predictable evening routine (3-step)",
        checklist: [
          "Use the same sequence daily",
          "Offer 1 small choice within structure",
          "Keep language calm + short",
          "Repair fast after ruptures (no lecture)",
        ],
        briefingTitle: "Parent briefing (60 seconds)",
        briefingScript: [
          "Predictable routines reduce stress at home.",
          "Use the same 3-step sequence daily with one small choice.",
          "Repair fast after ruptures—no lectures, just reset.",
        ],
        parentTitle: "Example routine",
        parentTemplate: [
          "Evening sequence: 1) snack + sit, 2) wash + pyjamas, 3) story + lights.",
          "Choice: which story first or which pyjamas.",
          "Keep it the same every day, even when it's hard.",
        ],
      },
    },

    // ——— Neurodivergence & trauma dual-lens scenarios ———

    {
      id: "meltdown-vs-tantrum",
      title: "Meltdown misread as tantrum (Year 2)",
      role: "staff",
      topic: "neurodivergence",
      time: "7",
      situation:
        "Lily, Year 2, was told she couldn't sit in her usual seat because of a table rearrangement. She immediately dropped to the floor, screaming, hitting her head on the carpet. The TA says 'She's just having a tantrum because she didn't get her way — ignore it and she'll stop.' Another child is crying because they're scared. Lily has no formal diagnosis but her parents have mentioned she 'likes things a certain way.'",
      constraints: [
        "Consider both neurodivergence and trauma lenses. Meltdown vs tantrum: different causes, different responses.",
        "If safeguarding indicators appear, follow school policy immediately.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "How do you read this situation?",
          options: [
            { id: "a", label: "The TA is right — she needs to learn she can't always get what she wants. Ignore the behaviour." },
            { id: "b", label: "This could be a meltdown, not a tantrum. The change to routine has overwhelmed her. Priority is safety and reducing sensory input." },
            { id: "c", label: "Remove her to the corridor so she doesn't disrupt the class." },
          ],
          correctId: "b",
          rationale:
            "If this is a meltdown (not a tantrum), ignoring increases distress. A tantrum has a goal and an audience. A meltdown is overwhelm — the child has lost the ability to regulate. Head-hitting suggests this is neurological, not behavioural. Reduce demands, ensure she can't hurt herself, lower voices, move other children away gently, wait for the storm to pass.",
        },
        {
          kind: "MCQ",
          id: "q2",
          prompt: "After Lily calms down (20 minutes later), she's exhausted and tearful. What now?",
          options: [
            { id: "a", label: "Now she's calm, explain why the seat change happened and that she needs to be flexible." },
            { id: "b", label: "Let her rest. Offer water. When she's ready, gently check in. Log the incident with detail about the trigger (routine change, seating) and the response (head-hitting, duration). Flag to SENCO — this pattern needs assessment." },
            { id: "c", label: "Send her to the headteacher for disrupting the class." },
          ],
          correctId: "b",
          rationale:
            "Post-meltdown, the child is in recovery. Lecturing now will either trigger another meltdown or teach her that adults don't understand. Recovery first. Documentation second. Assessment third.",
        },
      ],
      answerKey: [
        {
          title: "What good looks like (meltdown response)",
          whatToSay: ["Reduce demands; don't reason mid-meltdown. After: gentle check-in, no lecture."],
          whatToDo: [
            "Safety first: ensure she can't hurt herself; lower voices; move others away gently.",
            "Wait for the storm to pass. Post-recovery: rest, water, log trigger and response, flag to SENCO.",
          ],
          whatToAvoid: ["Ignoring a meltdown.", "Moving child mid-meltdown.", "Punishing or lecturing after."],
        },
      ],
      outputs: {
        checklistTitle: "Meltdown vs tantrum — response checklist",
        checklist: [
          "Treat as possible meltdown: safety and sensory reduction first.",
          "Do not reason mid-meltdown; thinking brain is offline.",
          "After: rest, gentle check-in, log trigger and response, flag to SENCO.",
        ],
        briefingTitle: "Staff briefing (60 seconds)",
        briefingScript: [
          "Meltdown is overwhelm, not defiance. Priority: safety, reduce sensory input, wait for storm to pass.",
          "Log trigger and response. Flag pattern to SENCO for assessment.",
        ],
      },
    },
    {
      id: "pda-demand-avoidance",
      title: "PDA — every demand triggers refusal (Year 5)",
      role: "staff",
      topic: "neurodivergence",
      time: "15",
      situation:
        "Max, Year 5, has been increasingly refusing to do anything asked of him. 'Get your book out' — refuses. 'Line up for assembly' — refuses. 'Wash your hands for lunch' — refuses. The class teacher has moved through the behaviour policy: warning, moved seat, lost playtime, sent to head of year. Each consequence makes him MORE resistant, not less. He's now under his desk saying 'You can't make me do anything.' His mum says he's the same at home.",
      constraints: [
        "PDA is anxiety-driven need for control. Traditional consequences add demand and escalate. Consider trauma lens too (control as survival).",
        "If safeguarding indicators appear, follow school policy immediately.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "What's your interpretation?",
          options: [
            { id: "a", label: "He's testing boundaries. If we hold firm on consequences, he'll learn." },
            { id: "b", label: "This pattern — refusing ALL demands, getting worse with consequences, at home too — is consistent with a PDA profile. The behaviour system is making it worse because it adds more demands." },
            { id: "c", label: "He's manipulating the situation to get out of work." },
          ],
          correctId: "b",
          rationale:
            "If consequences are escalating the behaviour, the approach isn't working. For a PDA profile, demands trigger a threat response — more demand = more panic = more refusal. The child isn't choosing defiance; their nervous system is in constant threat mode.",
        },
        {
          kind: "MCQ",
          id: "q2",
          prompt: "The class teacher says 'We can't just let him do whatever he wants — what about the other 29 children?'",
          options: [
            { id: "a", label: "You're right — we have to be fair to everyone. He follows the rules like everyone else." },
            { id: "b", label: "I hear you. But the current approach isn't working for him OR the class. Let's try: indirect language ('I wonder if…'), offering choices instead of instructions, reducing demand load, using his interests as routes into learning. We need the SENCO involved to build a different kind of plan for Max." },
            { id: "c", label: "Perhaps he needs a reduced timetable until he can behave." },
          ],
          correctId: "b",
          rationale:
            "Equality is not equity. Adjusting the approach to match his neurology isn't 'letting him get away with it' — it's enabling inclusion. Other children will see a calmer classroom.",
        },
      ],
      answerKey: [
        {
          title: "What good looks like (PDA-informed response)",
          whatToSay: ["Indirect language; choices instead of instructions; involve SENCO for a different kind of plan."],
          whatToDo: [
            "Reduce demand load; use interests as routes into learning.",
            "Build plan with SENCO — not more consequences.",
          ],
          whatToAvoid: ["Escalating consequences.", "Treating as manipulation.", "Reduced timetable as first resort."],
        },
      ],
      outputs: {
        checklistTitle: "PDA — demand reduction checklist",
        checklist: [
          "Indirect language ('I wonder if…'); choices, not commands.",
          "Reduce demand load; use interests as routes in.",
          "SENCO involved for plan that matches neurology.",
        ],
        briefingTitle: "Staff briefing (60 seconds)",
        briefingScript: [
          "For PDA profile, more consequences = more escalation. We need demand reduction and indirect approaches, not firmer boundaries.",
          "SENCO builds a different kind of plan. This isn't unfair to others — it's equity.",
        ],
      },
    },
    {
      id: "adhd-out-of-seat",
      title: "ADHD — constantly out of seat (Year 9)",
      role: "staff",
      topic: "neurodivergence",
      time: "7",
      situation:
        "Tyler, Year 9, diagnosed ADHD. He's out of his seat every few minutes — sharpening pencils, going to the bin, leaning back on his chair, drumming on the desk, asking to go to the toilet. His science teacher has given him three detentions this week. Tyler says 'I can't help it.' The teacher says 'He can sit still in gaming club, so he CAN do it when he wants to.'",
      constraints: [
        "ADHD is interest-based nervous system activation. Hyperfocus in one context isn't evidence of choice in another. Consider trauma lens if escalation or shame is present.",
        "If safeguarding indicators appear, follow school policy immediately.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "How do you respond to 'He can sit still in gaming club'?",
          options: [
            { id: "a", label: "That's a fair point — he can control it when he's motivated." },
            { id: "b", label: "ADHD doesn't mean 'can't focus on anything' — it means the brain regulates attention differently. Hyperfocus on gaming and inability to sit still in science are BOTH ADHD. One isn't proof against the other." },
            { id: "c", label: "Perhaps gaming club should be used as a reward for sitting still in lessons." },
          ],
          correctId: "b",
          rationale:
            "ADHD is interest-based activation. High interest = dopamine = focus. Low interest = no dopamine = movement seeking. This is neurology, not motivation. Using interests as leverage creates anxiety around the one thing that regulates them.",
        },
        {
          kind: "MCQ",
          id: "q2",
          prompt: "How should the science teacher adapt?",
          options: [
            { id: "a", label: "Give Tyler a movement break card — he can leave his seat twice per lesson, no questions asked. Seat him near the door. Give him something to fidget with. Break tasks into 10-minute chunks with built-in transitions. These aren't rewards — they're reasonable adjustments." },
            { id: "b", label: "Tyler needs to learn to self-manage his ADHD. He's 13 — old enough to take responsibility." },
            { id: "c", label: "Move him to the front of the class where you can keep an eye on him." },
          ],
          correctId: "a",
          rationale:
            "Match the environment to the child's neurology. Movement IS regulation for ADHD brains. Forcing stillness forces dysregulation. Front-row alone can feel like a trap; pair with movement breaks and task chunking.",
        },
      ],
      answerKey: [
        {
          title: "What good looks like (ADHD reasonable adjustments)",
          whatToSay: ["Movement break card; fidget; chunked tasks. Frame as adjustments, not rewards."],
          whatToDo: [
            "Seat near door; movement breaks; fidget; 10-minute task chunks.",
            "Don't use interests as leverage — it undermines regulation.",
          ],
          whatToAvoid: ["Detentions for movement.", "'He can do it when he wants to.'", "Removing gaming as punishment."],
        },
      ],
      outputs: {
        checklistTitle: "ADHD — movement and focus checklist",
        checklist: [
          "Movement break card; seat near door; fidget options.",
          "Break tasks into 10-minute chunks with transitions.",
          "Reasonable adjustments, not rewards or sanctions.",
        ],
        briefingTitle: "Staff briefing (60 seconds)",
        briefingScript: [
          "ADHD: movement is regulation. Hyperfocus in gaming and restlessness in science are both ADHD.",
          "Give movement breaks and chunked tasks — not more detentions.",
        ],
      },
    },
    {
      id: "masking-shutdown",
      title: "The girl who was 'coping fine' — then wasn't (Year 10)",
      role: "leadership",
      topic: "neurodivergence",
      time: "15",
      situation:
        "Priya, Year 10, has always been a model student. Top sets, prefect, never in trouble. Over the past month, she's missed 15 days of school. When she does come in, she sits silently and won't engage. Her parents say she cries every morning and says 'I can't do it anymore.' Teachers are baffled — 'She was fine until half term.' Her friends say she's been 'acting weird' since September but 'Priya never complains about anything.'",
      constraints: [
        "Consider autistic burnout / masking collapse. Girls are under-diagnosed. Consider trauma lens (e.g. bullying, loss) alongside.",
        "If safeguarding indicators appear, follow school policy immediately.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "What might be happening here?",
          options: [
            { id: "a", label: "She's probably stressed about GCSEs. Lots of Year 10s struggle with the pressure." },
            { id: "b", label: "This looks like it could be autistic burnout or masking collapse. The 'coping fine' was masking — performing neurotypicality at enormous cognitive cost. Something tipped the balance (transition to GCSE, social complexity of Year 10, puberty, accumulated exhaustion) and she can't mask anymore." },
            { id: "c", label: "She might be being bullied or something is happening at home." },
          ],
          correctId: "b",
          rationale:
            "The pattern — years of 'coping,' sudden collapse, no single trigger — is classic late-identified autism/ADHD in girls. Worth considering bullying/home alongside, not instead of. 'She was fine' usually means 'she was hiding it.'",
        },
        {
          kind: "MCQ",
          id: "q2",
          prompt: "What should the school do?",
          options: [
            { id: "a", label: "Pressure her to come back — the longer she's off, the harder it'll get." },
            { id: "b", label: "Reduce demands dramatically. Part-time timetable with her choosing which lessons. Quiet space available. No expectation of social performance. Refer to SENCO for possible assessment. Share concerns with parents — they may not know what they're looking at either. This could take months to recover from." },
            { id: "c", label: "Refer to CAMHS for anxiety/depression." },
          ],
          correctId: "b",
          rationale:
            "Pressure is demand. If this is burnout, more demand = deeper shutdown. CAMHS referral may be appropriate alongside neurodivergence screening, not instead of. Many autistic girls are misdiagnosed with anxiety/depression when the root is unidentified autism.",
        },
      ],
      answerKey: [
        {
          title: "What good looks like (masking collapse response)",
          whatToSay: ["Reduce demand; maintain connection; no pressure to perform. Refer SENCO; sensitive parent conversation."],
          whatToDo: [
            "Part-time timetable; quiet space; no social performance expectation.",
            "Refer SENCO; consider CAMHS alongside ND screening.",
          ],
          whatToAvoid: ["Pressure to return full-time.", "Treating as anxiety/depression only without ND consideration."],
        },
      ],
      outputs: {
        checklistTitle: "Masking collapse — response checklist",
        checklist: [
          "Reduce demands; part-time timetable; quiet space.",
          "Refer SENCO; share concerns with parents sensitively.",
          "Recovery may take months; maintain connection, don't pressure.",
        ],
        briefingTitle: "Leadership briefing (60 seconds)",
        briefingScript: [
          "'Coping fine' in girls often means masking. Sudden collapse = possible autistic burnout.",
          "Reduce demand, refer SENCO, maintain connection. Don't pressure — it deepens shutdown.",
        ],
      },
    },
    {
      id: "ld-plus-trauma",
      title: "Learning disability + trauma — the plan isn't working (specialist provision, Age 11)",
      role: "staff",
      topic: "neurodivergence",
      time: "15",
      situation:
        "Callum, 11, attends a specialist provision. Moderate learning disability, care-experienced, moved placements three times. His behaviour plan says: ignore low-level disruption, redirect to task, use reward chart, consequence for physical aggression (loss of choosing time). Staff follow it consistently. But Callum's behaviour has escalated — he's now throwing furniture daily, spitting at staff, and last week he ran out of the building. The plan has been in place for 6 months.",
      constraints: [
        "Plans designed for neurotypical, securely attached children fail when the child has LD + trauma. Consider dual lens: neurology and attachment.",
        "If safeguarding indicators appear, follow school policy immediately.",
      ],
      questions: [
        {
          kind: "MCQ",
          id: "q1",
          prompt: "The plan is being followed but behaviour is worsening. What does this tell you?",
          options: [
            { id: "a", label: "The plan needs stricter consequences. He's testing the boundaries." },
            { id: "b", label: "The plan doesn't match this child's neurology or trauma history. A reward chart requires working memory (LD affects this), delayed gratification (trauma affects this), and motivation by adult approval (insecure attachment affects this). The plan was designed for a neurotypical, securely attached child. Callum isn't that child." },
            { id: "c", label: "Callum needs a more restrictive placement." },
          ],
          correctId: "b",
          rationale:
            "6 months of consistent implementation with worsening behaviour means the plan is wrong, not that it needs to be harder. The Matching Principle: the plan must match the child. When we design interventions based on how WE think, not how the CHILD processes, they fail.",
        },
        {
          kind: "MCQ",
          id: "q2",
          prompt: "What should replace the current plan?",
          options: [
            { id: "a", label: "A trauma-informed, neurodivergence-aware plan that: prioritises felt safety over compliance, uses in-the-moment co-regulation instead of delayed consequences, replaces reward charts with relationship-based motivation, reduces environmental triggers, builds on Callum's interests and strengths, and involves Callum in what helps him feel safe. Review with EP, SENCO, and Callum's social worker." },
            { id: "b", label: "More 1:1 support during transitions and unstructured times." },
            { id: "c", label: "A functional behaviour assessment to understand what the behaviour is communicating." },
          ],
          correctId: "a",
          rationale:
            "FBA/ABC data and sensory/trauma timeline are good steps to inform the new plan — but don't just assess; act on what you find. The plan should be built around how Callum's brain works, not how we wish it worked. More 1:1 delivering the wrong plan is still the wrong plan.",
        },
      ],
      answerKey: [
        {
          title: "What good looks like (LD + trauma plan)",
          whatToSay: ["Felt safety first; co-regulation not delayed consequences; involve EP, SENCO, social worker."],
          whatToDo: [
            "Prioritise felt safety; in-the-moment co-regulation; reduce environmental triggers.",
            "Build on interests and strengths; involve Callum in what helps him feel safe.",
          ],
          whatToAvoid: ["More of the same consequences.", "Restrictive placement without exhausting adapted approaches."],
        },
      ],
      outputs: {
        checklistTitle: "LD + trauma — plan redesign checklist",
        checklist: [
          "Felt safety over compliance; co-regulation in the moment.",
          "Replace reward charts with relationship-based motivation.",
          "Review with EP, SENCO, social worker; involve Callum.",
        ],
        briefingTitle: "Staff briefing (60 seconds)",
        briefingScript: [
          "When a plan is followed consistently and behaviour worsens, the plan doesn't match the child.",
          "LD + trauma: reward charts and delayed consequences often fail. Build around felt safety and co-regulation.",
        ],
      },
    },
  ];
}

export function filterScenarios(input: {
  role: TrainingRole;
  time: TrainingTime;
  topic?: TrainingTopic | "any";
}) {
  const all = scenarios();
  return all.filter((s) => {
    if (s.role !== input.role) return false;
    if (s.time !== input.time) return false;
    if (input.topic && input.topic !== "any" && s.topic !== input.topic) return false;
    return true;
  });
}

export function buildDraftOutputs(s: Scenario, context: { schoolType?: string; audienceNote?: string }) {
  // Template-driven "AI-ish" drafting with guardrails.
  // Must remain generic: no child-level advice, no diagnosis, no predictions.
  const prefix: string[] = [];
  if (context.schoolType) prefix.push(`Context: ${context.schoolType}.`);
  if (context.audienceNote) prefix.push(`Audience note: ${context.audienceNote}.`);

  const brief = [
    ...prefix,
    ...s.outputs.briefingScript,
  ];
  const checklist = s.outputs.checklist;
  const parent = s.outputs.parentTemplate ?? [];

  return { brief, checklist, parent };
}

