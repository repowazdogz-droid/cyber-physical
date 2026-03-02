-- Strength Box Bristol — Seed data
-- Run after 001_schema.sql. For JK admin: after first login run:
--   update public.profiles set role = 'admin' where id = auth.uid();

-- Equipment library
insert into public.equipment (name, category, details) values
('Olympic Bar 20kg', 'Barbells', 'x6'),
('Olympic Bar 15kg', 'Barbells', 'x2'),
('Technique Bar 10kg', 'Barbells', null),
('Trap Bar 25kg', 'Barbells', 'x2'),
('EZ Curl Bar 7.5kg', 'Barbells', null),
('Axle EZ Curl Bar 7.5kg', 'Barbells', null),
('Safety Squat Bar 18kg', 'Barbells', null),
('Saxon Bar 20kg', 'Barbells', null),
('Axle Bar 20kg', 'Barbells', null),
('Cambered Swiss Bar 14kg', 'Barbells', null),
('Deadlift Bar 20kg', 'Barbells', null),
('Thicker Grip Olympic Bar 21.5kg', 'Barbells', null),
('Dumbbells 1-6kg', 'Dumbbells', '1kg increments'),
('Dumbbells 7.5-40kg', 'Dumbbells', '2.5kg increments'),
('Dumbbells 45kg', 'Dumbbells', null),
('Dumbbells 50kg', 'Dumbbells', null),
('Studio Dumbbells 2.5-25kg', 'Dumbbells', '2.5kg increments'),
('Leg Extension/Leg Curl', 'Machines', '125kg stack'),
('Dual Adjustable Pulley', 'Machines', '2x100kg'),
('Leg Press/Hack Squat', 'Machines', null),
('Leverage Squat/Viking Press', 'Machines', null),
('Lat Pulldown/Seated Row', 'Machines', '135kg stack'),
('Cable Crossover', 'Machines', '2x135kg'),
('Chest Supported T Bar Row', 'Machines', null),
('Standing Abductor', 'Machines', null),
('Concept2 Rower', 'Machines', null),
('Rogue Echo Bike', 'Machines', null),
('Smith Machine', 'Machines', null),
('Primal Strength Half Rack', 'Racks & Benches', 'x1'),
('FW Half Rack', 'Racks & Benches', 'x1'),
('Mirafit Half Rack', 'Racks & Benches', 'x1'),
('Powerlifting Combo Rack', 'Racks & Benches', 'x1'),
('Mirafit Adjustable Squat & Bench Rack', 'Racks & Benches', 'x1'),
('Recharge Fitness Adjustable Bench', 'Racks & Benches', 'x3, 500kg rated'),
('Mirafit Adjustable Bench', 'Racks & Benches', 'x2'),
('Preacher Curl Bench', 'Racks & Benches', null),
('Nordic Curl/Back Extension Bench', 'Racks & Benches', null),
('Studio Squat Racks', 'Racks & Benches', 'x2'),
('Studio Adjustable Benches', 'Racks & Benches', 'x2'),
('Kettlebells 8-64kg', 'Functional', '8,10,12,14,16,18,20,24,32,54,64kg'),
('Slam Balls 5-60kg', 'Functional', '5,10,15,20,25,30,40,50,60kg'),
('Core Bags', 'Functional', '15,20,25kg'),
('Battle Ropes 9m', 'Functional', null),
('Weight Sled', 'Functional', null),
('Plyo Boxes', 'Functional', 'x2 adjustable'),
('Suspension Trainer', 'Functional', null),
('Resistance bands long', 'Accessories', null),
('Short resistance bands', 'Accessories', 'light-heavy'),
('Dipping belt', 'Accessories', null),
('Weightlifting belts', 'Accessories', 'XS-XXL'),
('Fat Grips', 'Accessories', '3 sizes'),
('Various cable attachments', 'Accessories', null)
on conflict do nothing;

-- Sample members (create with placeholder UUIDs; in real use these come from app)
-- We use a seed script to insert members with known emails; one is "JK" for demo
insert into public.members (id, email, full_name, phone, membership_tier, membership_status, membership_start, monthly_rate, notes) values
(gen_random_uuid(), 'member1@example.com', 'Alex Smith', '07700900111', 'standard', 'active', '2025-01-15', 50.00, 'Sample active member'),
(gen_random_uuid(), 'member2@example.com', 'Sam Jones', '07700900222', 'pt_client', 'active', '2025-02-01', 50.00, 'PT client'),
(gen_random_uuid(), 'member3@example.com', 'Jordan Lee', '07700900333', 'standard', 'notice_period', '2024-06-01', 50.00, 'Notice given 2025-01-20')
on conflict (email) do nothing;

-- Classes: Circuits Tue 18:00, Core & Abs Thu 18:00, Bootcamp Sat 09:00
insert into public.classes (name, description, instructor, day_of_week, start_time, duration_minutes, max_capacity) values
('Circuits', 'Full-body circuit training', 'JK', 2, '18:00', 45, 12),
('Core & Abs', 'Core strength and conditioning', 'JK', 4, '18:00', 45, 12),
('Bootcamp', 'Outdoor-style bootcamp', 'JK', 6, '09:00', 45, 12);

-- Sample programme (4-day Upper/Lower) for first member
do $$
declare
  mid uuid;
  pid uuid;
  pd1 uuid; pd2 uuid; pd3 uuid; pd4 uuid;
begin
  select id into mid from public.members limit 1;
  if mid is not null then
    insert into public.programmes (member_id, name, goal, duration_weeks, active)
    values (mid, '4-Day Upper/Lower', 'strength', 12, true)
    returning id into pid;
    insert into public.programme_days (programme_id, day_number, name) values (pid, 1, 'Upper A') returning id into pd1;
    insert into public.programme_days (programme_id, day_number, name) values (pid, 2, 'Lower A') returning id into pd2;
    insert into public.programme_days (programme_id, day_number, name) values (pid, 3, 'Upper B') returning id into pd3;
    insert into public.programme_days (programme_id, day_number, name) values (pid, 4, 'Lower B') returning id into pd4;
    insert into public.programme_exercises (programme_day_id, exercise_name, order_index, sets, reps, rpe_target, rest_seconds) values
    (pd1, 'Bench Press', 1, 4, '5', 8, 180),
    (pd1, 'Barbell Row', 2, 4, '6-8', 8, 120),
    (pd1, 'Overhead Press', 3, 3, '8', 7, 90),
    (pd2, 'Squat', 1, 4, '5', 8, 180),
    (pd2, 'Romanian Deadlift', 2, 3, '8', 7, 120),
    (pd2, 'Leg Press', 3, 3, '10', 7, 90),
    (pd3, 'Incline Dumbbell Press', 1, 3, '8-10', 8, 120),
    (pd3, 'Lat Pulldown', 2, 3, '8-10', 8, 90),
    (pd4, 'Deadlift', 1, 3, '5', 8, 180),
    (pd4, 'Leg Curl', 2, 3, '10', 7, 90);
  end if;
end $$;
