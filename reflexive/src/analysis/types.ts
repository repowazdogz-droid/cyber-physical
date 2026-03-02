// Types for analysis orchestrator
export interface AnalysisContext {
  case_id: string;
  analysis_id: string;
  stimulus_text: string;
  stimulus_type: 'question' | 'decision' | 'scenario' | 'assessment_request';
}
