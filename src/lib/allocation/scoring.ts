/**
 * Scoring function for the allocation algorithm.
 *
 * Computes a composite score for a (lecturer, course) pair:
 *   score = w1 * preferenceRank + w2 * specialization + w3 * seniority + w4 * workloadBalance
 *
 * Each sub-score is normalized to [0, 1]:
 *   - preferenceRank: (maxRank - rank + 1) / maxRank  (higher rank = lower number = higher score)
 *   - specialization: 1.0 if lecturer.specialization matches course.specializationTag, 0.0 otherwise
 *   - seniority: lecturer.seniorityRank / maxSeniorityInPool
 *   - workloadBalance: remaining capacity / maxLoadUnits (more room = higher score)
 *
 * Per spec Section 6: weights default to w1=0.4, w2=0.2, w3=0.25, w4=0.15 and must sum to 1.0.
 */

export interface ScoringWeights {
  w1: number; // preference rank weight
  w2: number; // specialization match weight
  w3: number; // seniority weight
  w4: number; // workload balance weight
}

export interface LecturerData {
  id: string;
  specialization: string;
  seniorityRank: number;
  maxLoadUnits: number;
  currentLoadUnits: number; // units already allocated in this run
}

export interface CourseData {
  id: string;
  specializationTag: string;
  units: number;
  capacity?: number;
}

export interface PreferenceEntry {
  lecturerId: string;
  courseId: string;
  rank: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  w1: 0.4,
  w2: 0.2,
  w3: 0.25,
  w4: 0.15,
};

export function computeScore(
  lecturer: LecturerData,
  course: CourseData,
  preferenceRank: number,
  maxRank: number,
  maxSeniority: number,
  weights: ScoringWeights
): number {
  // 1. Preference rank score: higher preference (lower rank number) = higher score
  const prefScore = maxRank > 0 ? (maxRank - preferenceRank + 1) / maxRank : 0;

  // 2. Specialization match: binary
  const specScore =
    lecturer.specialization.toLowerCase() ===
    course.specializationTag.toLowerCase()
      ? 1.0
      : 0.0;

  // 3. Seniority: normalized
  const senScore = maxSeniority > 0 ? lecturer.seniorityRank / maxSeniority : 0;

  // 4. Workload balance: remaining capacity ratio
  const remainingCapacity = lecturer.maxLoadUnits - lecturer.currentLoadUnits;
  const wbScore =
    lecturer.maxLoadUnits > 0
      ? Math.max(0, remainingCapacity) / lecturer.maxLoadUnits
      : 0;

  return (
    weights.w1 * prefScore +
    weights.w2 * specScore +
    weights.w3 * senScore +
    weights.w4 * wbScore
  );
}

/**
 * Build a complete preference list for a lecturer, sorted by composite score (descending).
 * This is called ONCE before the Gale-Shapley loop — the list is FIXED and never re-scored.
 *
 * Per spec Section 6: "The preference lists are built once and then frozen.
 * The algorithm iterates over these fixed lists."
 */
export function buildScoredPreferenceList(
  lecturer: LecturerData,
  courses: CourseData[],
  preferences: PreferenceEntry[],
  maxSeniority: number,
  weights: ScoringWeights
): Array<{ courseId: string; score: number }> {
  const lecturerPrefs = preferences.filter(
    (p) => p.lecturerId === lecturer.id
  );
  const maxRank = lecturerPrefs.length;

  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const scored = lecturerPrefs
    .map((pref) => {
      const course = courseMap.get(pref.courseId);
      if (!course) return null;

      const score = computeScore(
        lecturer,
        course,
        pref.rank,
        maxRank,
        maxSeniority,
        weights
      );

      return { courseId: pref.courseId, score };
    })
    .filter((x): x is { courseId: string; score: number } => x !== null);

  // Sort descending by score (most preferred first)
  scored.sort((a, b) => b.score - a.score);

  return scored;
}
