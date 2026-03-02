/**
 * Topic Library
 * 
 * Hybrid topic library with age-banded structure and curriculum + interest portals.
 * Structure: AgeBand -> Missions -> Subjects -> Topics -> MicroTopics -> StarterPrompts
 * 
 * Version: 0.1
 */

export type AgeBandId = "6-9" | "10-12" | "13-15" | "16-18" | "adult";

export type MissionId = "understand" | "practice" | "check-work" | "write-better" | "plan";

export type SubjectId = "math" | "science" | "history" | "english" | "coding" | "life-skills";

export type PortalId = "homework" | "curious" | "stuck";

export interface StarterPrompt {
  objective: string;
  starterQuestions: string[];
  starterUserUtterances: string[];
  tags: string[];
}

export interface MicroTopic {
  id: string;
  label: string;
  prompts: StarterPrompt[];
}

export interface TopicNode {
  id: string;
  label: string;
  description?: string;
  microTopics: MicroTopic[];
}

export interface SubjectNode {
  id: SubjectId;
  label: string;
  topics: TopicNode[];
}

export interface MissionNode {
  id: MissionId;
  label: string;
  description: string;
  subjects: SubjectNode[];
}

export interface AgeBandNode {
  id: AgeBandId;
  label: string;
  missions: MissionNode[];
  portalTopics: {
    [key in PortalId]: {
      label: string;
      subjectIds: SubjectId[];
      topicIds: string[];
    };
  };
}

export interface TopicLibrary {
  ageBands: AgeBandNode[];
}

/**
 * Topic Library Data
 * 
 * Seed coverage for v0.1: high quality, small but complete.
 */
export const TOPIC_LIBRARY: TopicLibrary = {
  ageBands: [
    {
      id: "6-9",
      label: "Ages 6-9",
      missions: [
        {
          id: "understand",
          label: "Understand",
          description: "Learn something new",
          subjects: [
            {
              id: "math",
              label: "Math",
              topics: [
                {
                  id: "addition",
                  label: "Addition",
                  description: "Adding numbers together",
                  microTopics: [
                    {
                      id: "add-single-digit",
                      label: "Adding single digits",
                      prompts: [
                        {
                          objective: "understand how to add single-digit numbers",
                          starterQuestions: [
                            "What does it mean to add numbers?",
                            "How do we count when adding?"
                          ],
                          starterUserUtterances: [
                            "I want to learn how to add numbers like 3 + 4",
                            "Can you help me understand addition?",
                            "Show me how to add"
                          ],
                          tags: ["basic", "counting"]
                        }
                      ]
                    },
                    {
                      id: "add-two-digit",
                      label: "Adding two-digit numbers",
                      prompts: [
                        {
                          objective: "understand how to add two-digit numbers",
                          starterQuestions: [
                            "How do we add numbers with two digits?",
                            "What happens when we carry over?"
                          ],
                          starterUserUtterances: [
                            "I want to learn how to add 23 + 15",
                            "Help me with two-digit addition"
                          ],
                          tags: ["carrying", "place-value"]
                        }
                      ]
                    }
                  ]
                },
                {
                  id: "fractions",
                  label: "Fractions",
                  description: "Parts of a whole",
                  microTopics: [
                    {
                      id: "fraction-basics",
                      label: "What are fractions?",
                      prompts: [
                        {
                          objective: "understand what fractions are and how they work",
                          starterQuestions: [
                            "What is a fraction?",
                            "How do fractions show parts of a whole?"
                          ],
                          starterUserUtterances: [
                            "I want to learn about fractions",
                            "What does 1/2 mean?",
                            "Help me understand fractions"
                          ],
                          tags: ["basics", "visual"]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              id: "science",
              label: "Science",
              topics: [
                {
                  id: "animals",
                  label: "Animals",
                  description: "Learning about animals",
                  microTopics: [
                    {
                      id: "animal-habitats",
                      label: "Where animals live",
                      prompts: [
                        {
                          objective: "understand where different animals live and why",
                          starterQuestions: [
                            "Where do different animals live?",
                            "Why do animals live in different places?"
                          ],
                          starterUserUtterances: [
                            "I want to learn about where animals live",
                            "Tell me about animal homes"
                          ],
                          tags: ["habitats", "environment"]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "practice",
          label: "Practice",
          description: "Get better at something",
          subjects: [
            {
              id: "math",
              label: "Math",
              topics: [
                {
                  id: "addition",
                  label: "Addition",
                  microTopics: [
                    {
                      id: "practice-addition",
                      label: "Practice adding",
                      prompts: [
                        {
                          objective: "practice adding numbers to get better",
                          starterQuestions: [
                            "Can you give me problems to practice?",
                            "How can I get better at adding?"
                          ],
                          starterUserUtterances: [
                            "I want to practice addition",
                            "Give me some addition problems"
                          ],
                          tags: ["practice", "drills"]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      portalTopics: {
        homework: {
          label: "I have homework",
          subjectIds: ["math", "science", "english"],
          topicIds: ["addition", "fractions", "animals"]
        },
        curious: {
          label: "I'm curious",
          subjectIds: ["science", "history"],
          topicIds: ["animals"]
        },
        stuck: {
          label: "I feel stuck",
          subjectIds: ["math", "english"],
          topicIds: ["addition", "fractions"]
        }
      }
    },
    {
      id: "10-12",
      label: "Ages 10-12",
      missions: [
        {
          id: "understand",
          label: "Understand",
          description: "Learn something new",
          subjects: [
            {
              id: "math",
              label: "Math",
              topics: [
                {
                  id: "fractions",
                  label: "Fractions",
                  description: "Working with fractions",
                  microTopics: [
                    {
                      id: "add-fractions",
                      label: "Adding fractions",
                      prompts: [
                        {
                          objective: "understand how to add fractions with different denominators",
                          starterQuestions: [
                            "How do we add fractions?",
                            "What is a common denominator?"
                          ],
                          starterUserUtterances: [
                            "I want to learn how to add 1/2 + 1/3",
                            "Help me understand adding fractions",
                            "How do I add fractions together?"
                          ],
                          tags: ["fractions", "common-denominator"]
                        }
                      ]
                    },
                    {
                      id: "multiply-fractions",
                      label: "Multiplying fractions",
                      prompts: [
                        {
                          objective: "understand how to multiply fractions",
                          starterQuestions: [
                            "How do we multiply fractions?",
                            "Why is multiplying fractions different from adding?"
                          ],
                          starterUserUtterances: [
                            "I want to learn how to multiply fractions",
                            "Show me how to multiply 1/2 × 3/4"
                          ],
                          tags: ["fractions", "multiplication"]
                        }
                      ]
                    }
                  ]
                },
                {
                  id: "decimals",
                  label: "Decimals",
                  description: "Working with decimal numbers",
                  microTopics: [
                    {
                      id: "decimal-basics",
                      label: "Understanding decimals",
                      prompts: [
                        {
                          objective: "understand what decimals are and how they work",
                          starterQuestions: [
                            "What are decimals?",
                            "How are decimals different from whole numbers?"
                          ],
                          starterUserUtterances: [
                            "I want to learn about decimals",
                            "Help me understand 0.5 and 0.25"
                          ],
                          tags: ["basics", "place-value"]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              id: "science",
              label: "Science",
              topics: [
                {
                  id: "planets",
                  label: "Planets",
                  description: "Learning about our solar system",
                  microTopics: [
                    {
                      id: "solar-system",
                      label: "The solar system",
                      prompts: [
                        {
                          objective: "understand the planets in our solar system",
                          starterQuestions: [
                            "What planets are in our solar system?",
                            "How are the planets different from each other?"
                          ],
                          starterUserUtterances: [
                            "I want to learn about the planets",
                            "Tell me about our solar system"
                          ],
                          tags: ["space", "astronomy"]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              id: "coding",
              label: "Coding",
              topics: [
                {
                  id: "scratch-basics",
                  label: "Scratch Basics",
                  description: "Getting started with coding",
                  microTopics: [
                    {
                      id: "first-program",
                      label: "My first program",
                      prompts: [
                        {
                          objective: "understand how to create a simple program",
                          starterQuestions: [
                            "How do I make a computer do something?",
                            "What is a program?"
                          ],
                          starterUserUtterances: [
                            "I want to learn how to code",
                            "Help me make my first program"
                          ],
                          tags: ["beginner", "scratch"]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      portalTopics: {
        homework: {
          label: "I have homework",
          subjectIds: ["math", "science", "english"],
          topicIds: ["fractions", "decimals", "planets"]
        },
        curious: {
          label: "I'm curious",
          subjectIds: ["science", "coding"],
          topicIds: ["planets", "scratch-basics"]
        },
        stuck: {
          label: "I feel stuck",
          subjectIds: ["math", "coding"],
          topicIds: ["fractions", "decimals"]
        }
      }
    },
    {
      id: "13-15",
      label: "Ages 13-15",
      missions: [
        {
          id: "understand",
          label: "Understand",
          description: "Learn something new",
          subjects: [
            {
              id: "math",
              label: "Math",
              topics: [
                {
                  id: "algebra",
                  label: "Algebra",
                  description: "Solving equations",
                  microTopics: [
                    {
                      id: "solve-equations",
                      label: "Solving equations",
                      prompts: [
                        {
                          objective: "understand how to solve linear equations",
                          starterQuestions: [
                            "How do I solve for x?",
                            "What steps do I follow to solve an equation?"
                          ],
                          starterUserUtterances: [
                            "I want to learn how to solve equations",
                            "Help me solve 2x + 5 = 13",
                            "I'm stuck on algebra"
                          ],
                          tags: ["equations", "algebra"]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              id: "science",
              label: "Science",
              topics: [
                {
                  id: "chemistry",
                  label: "Chemistry",
                  description: "Atoms, molecules, and reactions",
                  microTopics: [
                    {
                      id: "periodic-table",
                      label: "The periodic table",
                      prompts: [
                        {
                          objective: "understand how the periodic table is organized",
                          starterQuestions: [
                            "How is the periodic table organized?",
                            "What do the numbers and letters mean?"
                          ],
                          starterUserUtterances: [
                            "I want to learn about the periodic table",
                            "Help me understand elements"
                          ],
                          tags: ["periodic-table", "elements"]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      portalTopics: {
        homework: {
          label: "I have homework",
          subjectIds: ["math", "science", "english"],
          topicIds: ["algebra", "chemistry"]
        },
        curious: {
          label: "I'm curious",
          subjectIds: ["science", "history"],
          topicIds: ["chemistry"]
        },
        stuck: {
          label: "I feel stuck",
          subjectIds: ["math", "science"],
          topicIds: ["algebra", "chemistry"]
        }
      }
    },
    {
      id: "16-18",
      label: "Ages 16-18",
      missions: [
        {
          id: "understand",
          label: "Understand",
          description: "Learn something new",
          subjects: [
            {
              id: "math",
              label: "Math",
              topics: [
                {
                  id: "calculus",
                  label: "Calculus",
                  description: "Derivatives and integrals",
                  microTopics: [
                    {
                      id: "derivatives",
                      label: "Derivatives",
                      prompts: [
                        {
                          objective: "understand what derivatives are and how to find them",
                          starterQuestions: [
                            "What is a derivative?",
                            "How do I find the derivative of a function?"
                          ],
                          starterUserUtterances: [
                            "I want to learn about derivatives",
                            "I'm struggling with calculus",
                            "Help me understand derivatives"
                          ],
                          tags: ["calculus", "derivatives"]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      portalTopics: {
        homework: {
          label: "I have homework",
          subjectIds: ["math", "science", "english"],
          topicIds: ["calculus"]
        },
        curious: {
          label: "I'm curious",
          subjectIds: ["science", "history"],
          topicIds: []
        },
        stuck: {
          label: "I feel stuck",
          subjectIds: ["math", "science"],
          topicIds: ["calculus"]
        }
      }
    },
    {
      id: "adult",
      label: "Adult",
      missions: [
        {
          id: "understand",
          label: "Understand",
          description: "Learn something new",
          subjects: [
            {
              id: "math",
              label: "Math",
              topics: [
                {
                  id: "calculus",
                  label: "Calculus",
                  description: "Derivatives and integrals",
                  microTopics: [
                    {
                      id: "derivatives",
                      label: "Derivatives",
                      prompts: [
                        {
                          objective: "understand what derivatives are and how to find them",
                          starterQuestions: [
                            "What is a derivative?",
                            "How do I find the derivative of a function?"
                          ],
                          starterUserUtterances: [
                            "I want to learn about derivatives",
                            "I'm struggling with calculus",
                            "Help me understand derivatives"
                          ],
                          tags: ["calculus", "derivatives"]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              id: "coding",
              label: "Coding",
              topics: [
                {
                  id: "programming-basics",
                  label: "Programming Basics",
                  description: "Learning to code",
                  microTopics: [
                    {
                      id: "first-steps",
                      label: "First steps in programming",
                      prompts: [
                        {
                          objective: "understand the basics of programming",
                          starterQuestions: [
                            "How do I start learning to code?",
                            "What is a programming language?"
                          ],
                          starterUserUtterances: [
                            "I want to learn how to code",
                            "Help me get started with programming"
                          ],
                          tags: ["beginner", "programming"]
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            {
              id: "life-skills",
              label: "Life Skills",
              topics: [
                {
                  id: "personal-finance",
                  label: "Personal Finance",
                  description: "Managing money",
                  microTopics: [
                    {
                      id: "budgeting",
                      label: "Budgeting",
                      prompts: [
                        {
                          objective: "understand how to create and stick to a budget",
                          starterQuestions: [
                            "How do I make a budget?",
                            "What should I include in my budget?"
                          ],
                          starterUserUtterances: [
                            "I want to learn about budgeting",
                            "Help me understand personal finance"
                          ],
                          tags: ["finance", "budgeting"]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      portalTopics: {
        homework: {
          label: "I have homework",
          subjectIds: ["math", "coding"],
          topicIds: ["calculus", "programming-basics"]
        },
        curious: {
          label: "I'm curious",
          subjectIds: ["coding", "life-skills"],
          topicIds: ["programming-basics", "personal-finance"]
        },
        stuck: {
          label: "I feel stuck",
          subjectIds: ["math", "coding"],
          topicIds: ["calculus", "programming-basics"]
        }
      }
    }
  ]
};

/**
 * Helper functions to navigate the topic library
 */
export function getAgeBand(id: AgeBandId): AgeBandNode | undefined {
  return TOPIC_LIBRARY.ageBands.find(band => band.id === id);
}

export function getMission(ageBandId: AgeBandId, missionId: MissionId): MissionNode | undefined {
  const ageBand = getAgeBand(ageBandId);
  return ageBand?.missions.find(mission => mission.id === missionId);
}

export function getSubject(ageBandId: AgeBandId, missionId: MissionId, subjectId: SubjectId): SubjectNode | undefined {
  const mission = getMission(ageBandId, missionId);
  return mission?.subjects.find(subject => subject.id === subjectId);
}

export function getTopic(ageBandId: AgeBandId, missionId: MissionId, subjectId: SubjectId, topicId: string): TopicNode | undefined {
  const subject = getSubject(ageBandId, missionId, subjectId);
  return subject?.topics.find(topic => topic.id === topicId);
}

export function getMicroTopic(
  ageBandId: AgeBandId,
  missionId: MissionId,
  subjectId: SubjectId,
  topicId: string,
  microTopicId: string
): MicroTopic | undefined {
  const topic = getTopic(ageBandId, missionId, subjectId, topicId);
  return topic?.microTopics.find(micro => micro.id === microTopicId);
}








































