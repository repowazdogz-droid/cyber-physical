/**
 * Example scenarios for Reflect synthesis pre-fill.
 * Used to seed the synthesis tool with trauma and neurodivergence dual-lens examples.
 */

export type ExampleScenario = {
  id: string;
  childAge: string;
  childYear: string;
  setting: string;
  behaviour: string;
  context: string;
  role: string;
  previousStrategies: string;
};

export const exampleScenarios: ExampleScenario[] = [
  {
    id: "meltdown-in-assembly",
    childAge: "6",
    childYear: "Year 2",
    setting: "Assembly hall",
    behaviour:
      "Screaming, covering ears, ran out of assembly. TA brought her back and she bit the TA. No diagnosis but parents say she hates loud noises and busy places.",
    context:
      "Assembly was louder than usual — Year 6 were practising their play with music. Fire alarm test happened yesterday and she was distressed then too. She has ear defenders in her bag but nobody gave them to her.",
    role: "Class Teacher",
    previousStrategies:
      "We usually let her sit near the door in assembly. Today the seats were rearranged and she was in the middle.",
  },
  {
    id: "masking-girl-shutdown",
    childAge: "14",
    childYear: "Year 10",
    setting: "Pastoral office",
    behaviour:
      "Hasn't attended school for 3 weeks. When she came in today for a meeting, she couldn't speak — just nodded or shook her head. Previously a high achiever, prefect, lots of friends.",
    context:
      "Mum says she cries every morning, says school is 'too much'. Friends say she's been 'different' since September. Teachers all say 'she was absolutely fine before half term'. No known diagnosis. No safeguarding concerns flagged.",
    role: "Head of Year",
    previousStrategies: "Phoned home, sent work home, offered to meet. Nothing has worked.",
  },
];
