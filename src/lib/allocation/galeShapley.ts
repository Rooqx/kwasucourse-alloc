/**
 * Capacity-aware Gale-Shapley algorithm for course allocation.
 *
 * Per spec Section 6:
 * - Lecturers are the "proposers" and courses are the "receivers".
 * - Each course has a capacity (default 1, meaning 1 lecturer can teach it).
 * - Each lecturer has a maxLoadUnits. A lecturer can teach multiple courses
 *   as long as the total units ≤ maxLoadUnits.
 * - Preference lists are built ONCE using the scoring function and then FROZEN.
 *   No mid-loop re-scoring.
 * - The algorithm produces a stable matching (no lecturer-course pair that would
 *   both prefer each other over their current match).
 *
 * Invariant: "Build the scored preference lists before entering the while-loop.
 * Inside the loop, only index into those frozen lists — never call computeScore again."
 */

import {
  buildScoredPreferenceList,
  type ScoringWeights,
  type LecturerData,
  type CourseData,
  type PreferenceEntry,
  DEFAULT_WEIGHTS,
} from "./scoring";

export interface AllocationResult {
  lecturerId: string;
  courseId: string;
  score: number;
}

export interface GaleShapleyInput {
  lecturers: LecturerData[];
  courses: CourseData[];
  preferences: PreferenceEntry[];
  weights?: ScoringWeights;
}

export interface GaleShapleyOutput {
  allocations: AllocationResult[];
  unallocatedCourses: string[];
  unallocatedLecturers: string[];
}

export function runGaleShapley(input: GaleShapleyInput): GaleShapleyOutput {
  const { lecturers, courses, preferences, weights = DEFAULT_WEIGHTS } = input;

  // ─── Phase 1: Build and freeze preference lists ───────────────────
  const maxSeniority = Math.max(
    ...lecturers.map((l) => l.seniorityRank),
    1
  );

  // For each lecturer: their frozen, scored preference list
  const lecturerPrefLists = new Map<
    string,
    Array<{ courseId: string; score: number }>
  >();

  // Track where each lecturer is in their preference list (proposal index)
  const proposalIndex = new Map<string, number>();

  // Deep-copy lecturer data so we can track currentLoadUnits during the algorithm
  const lecturerState = new Map<string, LecturerData>();

  for (const lecturer of lecturers) {
    const scored = buildScoredPreferenceList(
      lecturer,
      courses,
      preferences,
      maxSeniority,
      weights
    );

    lecturerPrefLists.set(lecturer.id, scored);
    proposalIndex.set(lecturer.id, 0);
    lecturerState.set(lecturer.id, { ...lecturer, currentLoadUnits: 0 });
  }

  // Course state: current allocations (can hold multiple lecturers up to capacity)
  const courseAllocations = new Map<
    string,
    Array<{ lecturerId: string; score: number }>
  >();
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  for (const course of courses) {
    courseAllocations.set(course.id, []);
  }

  // ─── Phase 2: Gale-Shapley proposal loop ──────────────────────────
  // Free lecturers = those who haven't exhausted their preference list
  // AND still have load capacity.
  const getFreeLecturers = (): string[] => {
    return lecturers
      .map((l) => l.id)
      .filter((id) => {
        const state = lecturerState.get(id)!;
        const prefList = lecturerPrefLists.get(id)!;
        const idx = proposalIndex.get(id)!;

        // Still has courses to propose to AND has load capacity
        return (
          idx < prefList.length &&
          state.currentLoadUnits < state.maxLoadUnits
        );
      });
  };

  let freeLecturers = getFreeLecturers();

  while (freeLecturers.length > 0) {
    for (const lecturerId of freeLecturers) {
      const prefList = lecturerPrefLists.get(lecturerId)!;
      const idx = proposalIndex.get(lecturerId)!;
      const state = lecturerState.get(lecturerId)!;

      // Check if this lecturer can still take more courses
      if (idx >= prefList.length || state.currentLoadUnits >= state.maxLoadUnits) {
        continue;
      }

      // Propose to the next course on the frozen list
      const proposal = prefList[idx];
      proposalIndex.set(lecturerId, idx + 1);

      const course = courseMap.get(proposal.courseId);
      if (!course) continue;

      // Check if accepting this course would exceed load
      if (state.currentLoadUnits + course.units > state.maxLoadUnits) {
        // Can't take this course, skip to next
        continue;
      }

      const currentAllocs = courseAllocations.get(proposal.courseId)!;
      const capacity = course.capacity || 1;

      if (currentAllocs.length < capacity) {
        // Course has room — accept the proposal
        currentAllocs.push({
          lecturerId,
          score: proposal.score,
        });
        state.currentLoadUnits += course.units;
      } else {
        // Course is full — compare with weakest current holder
        const weakest = currentAllocs.reduce((min, curr) =>
          curr.score < min.score ? curr : min
        );

        if (proposal.score > weakest.score) {
          // Replace the weakest holder
          const weakIdx = currentAllocs.indexOf(weakest);
          currentAllocs.splice(weakIdx, 1);

          // Free the displaced lecturer's load
          const displacedState = lecturerState.get(weakest.lecturerId)!;
          displacedState.currentLoadUnits -= course.units;

          // Accept the new proposal
          currentAllocs.push({
            lecturerId,
            score: proposal.score,
          });
          state.currentLoadUnits += course.units;
        }
        // If proposal.score <= weakest.score, the proposal is rejected.
        // The lecturer stays free and will try the next course on their list.
      }
    }

    freeLecturers = getFreeLecturers();
  }

  // ─── Phase 3: Collect results ─────────────────────────────────────
  const allocations: AllocationResult[] = [];
  const allocatedCourses = new Set<string>();
  const allocatedLecturers = new Set<string>();

  for (const [courseId, allocs] of courseAllocations) {
    for (const alloc of allocs) {
      allocations.push({
        lecturerId: alloc.lecturerId,
        courseId,
        score: alloc.score,
      });
      allocatedCourses.add(courseId);
      allocatedLecturers.add(alloc.lecturerId);
    }
  }

  const unallocatedCourses = courses
    .map((c) => c.id)
    .filter((id) => !allocatedCourses.has(id));

  const unallocatedLecturers = lecturers
    .map((l) => l.id)
    .filter((id) => !allocatedLecturers.has(id));

  return { allocations, unallocatedCourses, unallocatedLecturers };
}
