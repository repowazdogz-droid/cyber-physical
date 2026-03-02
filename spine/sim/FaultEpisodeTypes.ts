// spine/sim/FaultEpisodeTypes.ts

export type Vec3 = { x: number; y: number; z: number };

export type EpisodeMeta = {
  episodeId: string;
  scenario: string;
  seed: number;
  dt: number;
  steps: number;
  createdAtIso: string;
};

export type EpisodeEvent =
  | { t: number; kind: "FAULT_INJECTED"; detail: string }
  | { t: number; kind: "ENVELOPE_BREACH"; detail: string };

export type TruthState = {
  pos: Vec3;
  vel: Vec3;
};

export type SensorSample = {
  gnssPos: Vec3; // measured position
};

export type EstimatorSample = {
  posEst: Vec3;
  confidence: number; // 0..1 (but can be wrong!)
};

export type ControllerSample = {
  accelCmd: Vec3; // simplistic "command"
};

export type FaultEpisodeSim = {
  meta: EpisodeMeta;
  t: number[]; // seconds
  truth: TruthState[];
  sensors: SensorSample[];
  estimator: EstimatorSample[];
  controller: ControllerSample[];
  events: EpisodeEvent[];
  breachIndex: number; // index into arrays
};



































