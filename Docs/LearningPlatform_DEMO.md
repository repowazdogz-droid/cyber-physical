# Learning Platform Demo Guide

End-to-end demo of the Socratic Tutor learning platform.

## Prerequisites

- Node.js installed
- Next.js app running (`npm run dev`)
- Browser open to `http://localhost:3000`

## Quick Start

1. Start the development server:
```bash
npm run dev
```

2. Navigate to the learning page:
```
http://localhost:3000/learning
```

3. Navigate to the teacher view:
```
http://localhost:3000/teacher
```

## 5-Minute Demo Flow

### Step 1: Minor Learner Session

1. Go to `/learning`
2. Set up profile:
   - Learner ID: `minor-learner-1`
   - Age Band: `6-9` (or `10-12`)
   - Check "Minor" checkbox
   - Subject: `mathematics`
   - Topic: `fractions`
   - Objective: `understand how to add fractions`
3. Click "Send" (no message needed for first turn)
4. Tutor responds with goal clarification question
5. Type: `I want to learn how to add 1/2 + 1/3`
6. Click "Send"
7. Tutor responds with prior knowledge question
8. Type: `I know that 1/2 is half and 1/3 is one third`
9. Click "Send"
10. Check "Request Assessment" checkbox
11. Click "Send"
12. Assessment is generated
13. Click "Refresh" on Skill Graph Summary
14. See skill updates (QuestionQuality, UncertaintyHandling, etc.)

**Expected Output:**
- Conversation history shows tutor-learner dialogue
- Skill graph shows skills with confidence bands (Low, Medium, High)
- Assessment appears if requested
- No refusals (minor with appropriate mode)

### Step 2: Teacher Views Minor

1. Go to `/teacher`
2. Enter:
   - Learner ID: `minor-learner-1`
   - Role: `Teacher`
   - Opt-in: unchecked (not needed for minors)
3. Click "Load"
4. See full access:
   - All sessions visible
   - All tutor turns visible
   - All observations visible
   - Skill graph visible
   - Visibility Policy shows: `parentCanView: true`, `teacherCanView: true`

**Expected Output:**
- Full session transcripts
- Complete conversation history
- Skill graph data
- No access restrictions

### Step 3: Adult Learner Session

1. Go to `/learning`
2. Set up profile:
   - Learner ID: `adult-learner-1`
   - Age Band: `Adult`
   - Uncheck "Minor" checkbox
   - Subject: `mathematics`
   - Topic: `calculus`
   - Objective: `understand derivatives`
3. Click "Send"
4. Type: `I'm struggling with derivatives`
5. Click "Send"
6. Continue conversation
7. Click "Refresh" on Skill Graph Summary

**Expected Output:**
- Conversation works normally
- Skills update as expected
- No restrictions

### Step 4: Teacher Views Adult (No Opt-In)

1. Go to `/teacher`
2. Enter:
   - Learner ID: `adult-learner-1`
   - Role: `Teacher`
   - Opt-in: **unchecked**
3. Click "Load"
4. See restricted access:
   - Sessions show "Access denied for this role"
   - Tutor turns: empty array
   - Observations: empty array
   - Skill graph: minimal or redacted
   - Visibility Policy shows: `teacherCanView: false`

**Expected Output:**
- Access denied message
- Empty or minimal data
- Visibility note: "Access denied for this role"

### Step 5: Teacher Views Adult (With Opt-In)

1. Go to `/teacher`
2. Enter:
   - Learner ID: `adult-learner-1`
   - Role: `Teacher`
   - Opt-in: **checked**
3. Click "Load"
4. See full access:
   - All sessions visible
   - All tutor turns visible
   - All observations visible
   - Skill graph visible
   - Visibility Policy shows: `teacherCanView: true`

**Expected Output:**
- Full session transcripts
- Complete conversation history
- Skill graph data
- Full access granted

## Expected Outputs Summary

### Minor Learner (Ages 6-9, 10-12)

**Visibility:**
- ✅ Parent can view: Yes
- ✅ Teacher can view: Yes
- ✅ Institution can view: If institution mode enabled
- ✅ Learner can view: Yes (always)

**Session Data:**
- Full transcripts visible to parents/teachers
- All tutor turns visible
- All observations visible
- Skill graph visible

### Adult Learner

**Visibility (Default):**
- ❌ Parent can view: No
- ❌ Teacher can view: No (unless opted-in)
- ✅ Institution can view: If institution mode enabled
- ✅ Learner can view: Yes (always)

**Visibility (With Opt-In):**
- ❌ Parent can view: No
- ✅ Teacher can view: Yes (if opted-in)
- ✅ Institution can view: If institution mode enabled
- ✅ Learner can view: Yes (always)

**Session Data (No Opt-In):**
- Access denied for parents/teachers
- Empty or minimal data
- Visibility note shown

**Session Data (With Opt-In):**
- Full transcripts visible to opted-in teachers
- All tutor turns visible
- All observations visible
- Skill graph visible

## Key Features Demonstrated

1. **Socratic Dialogue**
   - Questions-first approach
   - Scaffold ladder progression
   - No answer dumping

2. **Skill Graph Tracking**
   - Evidence-based updates
   - Confidence bands (Low, Medium, High)
   - No scores or grades

3. **Assessment Generation**
   - On-demand assessment creation
   - Process-focused rubrics
   - No prohibited metrics

4. **Privacy/Visibility**
   - Age-appropriate access rules
   - Minor default visibility
   - Adult privacy by default
   - Opt-in teacher access for adults

5. **Bounded Storage**
   - Max 200 sessions per learner
   - Max 50 turns per session
   - Max 200 observations per session
   - FIFO eviction

## Troubleshooting

**Issue: Store not persisting between requests**
- Solution: Ensure you're using the singleton store (`getStore()`)

**Issue: Visibility not working correctly**
- Solution: Check age band and opt-in settings match expected behavior

**Issue: Skills not updating**
- Solution: Ensure learner is making utterances that generate observations

**Issue: Assessment not generating**
- Solution: Check that "Request Assessment" is checked and dialogue didn't refuse

## Next Steps

After this demo:
1. Add Vision Pro / VR interfaces (per Contract 42)
2. Add more assessment types
3. Add persistence layer (database instead of in-memory)
4. Add authentication/authorization
5. Add more sophisticated observation detection

---

**Demo Duration:** ~5 minutes
**Status:** Ready for demo








































