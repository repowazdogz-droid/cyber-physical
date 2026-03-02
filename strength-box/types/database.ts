export type MembershipTier = 'standard' | 'pt_client' | 'class_only';
export type MembershipStatus = 'active' | 'notice_period' | 'cancelled' | 'frozen' | 'pending';
export type CheckInType = 'gym' | 'class' | 'pt_session' | 'guest';
export type BookingStatus = 'booked' | 'attended' | 'no_show' | 'cancelled';
export type PtSessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type GuestPassType = 'monthly_free' | 'friend_friday';
export type ProgrammeGoal = 'strength' | 'hypertrophy' | 'fat_loss' | 'general_fitness' | 'rehabilitation' | 'sport_specific';

export interface Profile {
  id: string;
  role: 'admin' | 'member';
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  user_id: string | null;
  created_at: string;
  email: string;
  full_name: string;
  phone: string | null;
  date_of_birth: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  membership_tier: MembershipTier;
  membership_status: MembershipStatus;
  membership_start: string | null;
  notice_given_date: string | null;
  stripe_customer_id: string | null;
  monthly_rate: number;
  notes: string | null;
  avatar_url: string | null;
}

export interface CheckIn {
  id: string;
  member_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  type: CheckInType;
}

export interface Programme {
  id: string;
  member_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  goal: ProgrammeGoal | null;
  duration_weeks: number | null;
  notes: string | null;
  active: boolean;
}

export interface ProgrammeDay {
  id: string;
  programme_id: string;
  day_number: number;
  name: string | null;
}

export interface ProgrammeExercise {
  id: string;
  programme_day_id: string;
  exercise_name: string;
  order_index: number | null;
  sets: number | null;
  reps: string | null;
  rpe_target: number | null;
  rest_seconds: number | null;
  tempo: string | null;
  notes: string | null;
  equipment: string | null;
  superset_group: string | null;
}

export interface Class {
  id: string;
  name: string;
  description: string | null;
  instructor: string;
  day_of_week: number;
  start_time: string;
  duration_minutes: number;
  max_capacity: number;
  recurring: boolean;
}

export interface ClassBooking {
  id: string;
  class_id: string;
  member_id: string;
  date: string;
  status: BookingStatus;
  booked_at: string;
}

export interface PtSession {
  id: string;
  member_id: string;
  scheduled_at: string | null;
  duration_minutes: number;
  status: PtSessionStatus;
  notes: string | null;
  programme_id: string | null;
}

export interface WorkoutLog {
  id: string;
  member_id: string;
  logged_at: string;
  programme_day_id: string | null;
  duration_minutes: number | null;
  overall_rpe: number | null;
  energy_level: number | null;
  sleep_quality: number | null;
  notes: string | null;
}

export interface ExerciseLog {
  id: string;
  workout_log_id: string;
  exercise_name: string;
  set_number: number | null;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  notes: string | null;
  personal_record: boolean;
}

export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripe_payment_id: string | null;
  payment_date: string | null;
  description: string | null;
}

export interface GuestPass {
  id: string;
  member_id: string;
  guest_name: string | null;
  used_at: string;
  type: GuestPassType;
  month_year: string | null;
}

export interface BodyMetric {
  id: string;
  member_id: string;
  recorded_at: string;
  weight_kg: number | null;
  body_fat_percentage: number | null;
  notes: string | null;
  photo_url: string | null;
}

export interface Equipment {
  id: string;
  name: string;
  category: string;
  details: string | null;
}
