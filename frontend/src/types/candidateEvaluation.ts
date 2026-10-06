export type EvaluationRecommendation = 'recommended' | 'review' | 'not_recommended';

export interface CandidateEvaluation {
  id: number;
  cv_id: number;
  score: number;
  recommendation: EvaluationRecommendation;
  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  experience_analysis: string;
  requirements_analysis: string;
  summary: string;
  model_used: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateEvaluationSummary {
  id: number;
  score: number;
  recommendation: EvaluationRecommendation;
  created_at: string;
}

export interface CandidateEvaluationBatchItem {
  cv_id: number;
  status: 'success' | 'error' | 'skipped';
  score?: number | null;
  recommendation?: EvaluationRecommendation | null;
  message?: string | null;
}
