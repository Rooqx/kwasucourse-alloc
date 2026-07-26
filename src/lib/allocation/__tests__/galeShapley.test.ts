import { describe, it, expect } from "vitest";
import { runGaleShapley, type GaleShapleyInput } from "../galeShapley";
import { detectConflicts } from "../conflicts";
import { computeScore, DEFAULT_WEIGHTS, type LecturerData, type CourseData } from "../scoring";

/**
 * Algorithm unit tests — per spec Section 10:
 * 1. One-to-one allocation with a single lecturer/course
 * 2. Multiple lecturers competing for one course
 * 3. Load-limit enforcement
 * 4. Stable matching: no blocking pair
 * 5. Conflict detection with overlapping time slots
 */

// ─────────────────────────────────────────────────────────────
// Test 1: Simple one-to-one allocation
// ─────────────────────────────────────────────────────────────
describe("Gale-Shapley Algorithm", () => {
  it("allocates a single lecturer to a single course", () => {
    const input: GaleShapleyInput = {
      lecturers: [
        {
          id: "lec1",
          specialization: "AI",
          seniorityRank: 3,
          maxLoadUnits: 12,
          currentLoadUnits: 0,
        },
      ],
      courses: [
        { id: "crs1", specializationTag: "AI", units: 3 },
      ],
      preferences: [
        { lecturerId: "lec1", courseId: "crs1", rank: 1 },
      ],
    };

    const result = runGaleShapley(input);

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].lecturerId).toBe("lec1");
    expect(result.allocations[0].courseId).toBe("crs1");
    expect(result.unallocatedCourses).toHaveLength(0);
    expect(result.unallocatedLecturers).toHaveLength(0);
  });

  // ─────────────────────────────────────────────────────────────
  // Test 2: Multiple lecturers competing for one course
  // ─────────────────────────────────────────────────────────────
  it("assigns the higher-scoring lecturer when two compete for one course", () => {
    const input: GaleShapleyInput = {
      lecturers: [
        {
          id: "lec-junior",
          specialization: "Networks",
          seniorityRank: 1,
          maxLoadUnits: 12,
          currentLoadUnits: 0,
        },
        {
          id: "lec-senior",
          specialization: "AI",
          seniorityRank: 5,
          maxLoadUnits: 12,
          currentLoadUnits: 0,
        },
      ],
      courses: [
        { id: "ai-course", specializationTag: "AI", units: 3 },
      ],
      preferences: [
        { lecturerId: "lec-junior", courseId: "ai-course", rank: 1 },
        { lecturerId: "lec-senior", courseId: "ai-course", rank: 1 },
      ],
    };

    const result = runGaleShapley(input);

    // The senior AI-specialized lecturer should win
    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].lecturerId).toBe("lec-senior");
    expect(result.allocations[0].courseId).toBe("ai-course");

    // Junior lecturer is unallocated (no other courses to fall back to)
    expect(result.unallocatedLecturers).toContain("lec-junior");
  });

  // ─────────────────────────────────────────────────────────────
  // Test 3: Load-limit enforcement
  // ─────────────────────────────────────────────────────────────
  it("respects maxLoadUnits and does not over-allocate a lecturer", () => {
    const input: GaleShapleyInput = {
      lecturers: [
        {
          id: "lec1",
          specialization: "SE",
          seniorityRank: 3,
          maxLoadUnits: 6, // Can only take 2 × 3-unit courses
          currentLoadUnits: 0,
        },
      ],
      courses: [
        { id: "crs1", specializationTag: "SE", units: 3 },
        { id: "crs2", specializationTag: "SE", units: 3 },
        { id: "crs3", specializationTag: "SE", units: 3 }, // This one should be skipped
      ],
      preferences: [
        { lecturerId: "lec1", courseId: "crs1", rank: 1 },
        { lecturerId: "lec1", courseId: "crs2", rank: 2 },
        { lecturerId: "lec1", courseId: "crs3", rank: 3 },
      ],
    };

    const result = runGaleShapley(input);

    // Should allocate exactly 2 courses (6 units total ≤ maxLoadUnits 6)
    const lecAllocations = result.allocations.filter(
      (a) => a.lecturerId === "lec1"
    );
    expect(lecAllocations).toHaveLength(2);

    // Total units should not exceed maxLoadUnits
    const totalUnits = lecAllocations.reduce((sum, a) => {
      const course = input.courses.find((c) => c.id === a.courseId)!;
      return sum + course.units;
    }, 0);
    expect(totalUnits).toBeLessThanOrEqual(6);

    // crs3 should be unallocated
    expect(result.unallocatedCourses).toContain("crs3");
  });

  // ─────────────────────────────────────────────────────────────
  // Test 4: Stable matching — no blocking pair
  // ─────────────────────────────────────────────────────────────
  it("produces a stable matching with no blocking pair", () => {
    const input: GaleShapleyInput = {
      lecturers: [
        {
          id: "lecA",
          specialization: "AI",
          seniorityRank: 4,
          maxLoadUnits: 12,
          currentLoadUnits: 0,
        },
        {
          id: "lecB",
          specialization: "SE",
          seniorityRank: 3,
          maxLoadUnits: 12,
          currentLoadUnits: 0,
        },
      ],
      courses: [
        { id: "crsX", specializationTag: "AI", units: 3 },
        { id: "crsY", specializationTag: "SE", units: 3 },
      ],
      preferences: [
        // Both prefer crsX first, then crsY
        { lecturerId: "lecA", courseId: "crsX", rank: 1 },
        { lecturerId: "lecA", courseId: "crsY", rank: 2 },
        { lecturerId: "lecB", courseId: "crsX", rank: 1 },
        { lecturerId: "lecB", courseId: "crsY", rank: 2 },
      ],
    };

    const result = runGaleShapley(input);

    // Both lecturers should be allocated
    expect(result.allocations).toHaveLength(2);
    expect(result.unallocatedLecturers).toHaveLength(0);
    expect(result.unallocatedCourses).toHaveLength(0);

    // lecA (AI specialist, higher seniority) should get crsX (AI course)
    const lecAAlloc = result.allocations.find((a) => a.lecturerId === "lecA");
    expect(lecAAlloc?.courseId).toBe("crsX");

    // lecB should get crsY as fallback
    const lecBAlloc = result.allocations.find((a) => a.lecturerId === "lecB");
    expect(lecBAlloc?.courseId).toBe("crsY");

    // Stability check: no blocking pair.
    // A blocking pair (l, c) exists if l prefers c over their current match
    // AND c would prefer l over their current holder.
    // Since lecA got crsX (their top choice) and lecB got crsY,
    // lecB prefers crsX but crsX has a stronger holder (lecA), so no blocking pair.
  });

  // ─────────────────────────────────────────────────────────────
  // Test 5: Conflict detection with overlapping time slots
  // ─────────────────────────────────────────────────────────────
  it("detects time-slot conflicts between allocated courses", () => {
    // Simulate: one lecturer got two courses with overlapping time slots
    const allocations = [
      { lecturerId: "lec1", courseId: "crs-morning", score: 0.8 },
      { lecturerId: "lec1", courseId: "crs-overlap", score: 0.7 },
      { lecturerId: "lec2", courseId: "crs-afternoon", score: 0.6 },
    ];

    const courses = [
      { id: "crs-morning", timeSlot: "Mon 08:00-10:00" },
      { id: "crs-overlap", timeSlot: "Mon 09:00-11:00" }, // Overlaps with morning!
      { id: "crs-afternoon", timeSlot: "Mon 14:00-16:00" }, // No overlap
    ];

    const conflicts = detectConflicts(allocations, courses);

    // Should detect exactly one conflict for lec1
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].lecturerId).toBe("lec1");
    expect(conflicts[0].reason).toContain("conflict");
  });
});

// ─────────────────────────────────────────────────────────────
// Additional scoring tests
// ─────────────────────────────────────────────────────────────
describe("Scoring function", () => {
  it("gives higher score to matching specialization", () => {
    const lecturer: LecturerData = {
      id: "lec1",
      specialization: "AI",
      seniorityRank: 3,
      maxLoadUnits: 12,
      currentLoadUnits: 0,
    };

    const matchingCourse: CourseData = {
      id: "c1",
      specializationTag: "AI",
      units: 3,
    };

    const nonMatchingCourse: CourseData = {
      id: "c2",
      specializationTag: "Networks",
      units: 3,
    };

    const scoreMatch = computeScore(lecturer, matchingCourse, 1, 1, 5, DEFAULT_WEIGHTS);
    const scoreNoMatch = computeScore(lecturer, nonMatchingCourse, 1, 1, 5, DEFAULT_WEIGHTS);

    expect(scoreMatch).toBeGreaterThan(scoreNoMatch);
  });
});
