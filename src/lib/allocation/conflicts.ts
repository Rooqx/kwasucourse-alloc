/**
 * Conflict detection for course allocations.
 *
 * Per spec Section 6: A conflict exists when a lecturer is assigned two
 * courses with overlapping time slots in the same session.
 *
 * Time slots are strings like "Mon 08:00-10:00". Two courses conflict if
 * they share the same day and their time ranges overlap.
 */

import type { AllocationResult } from "./galeShapley";

export interface CourseWithTimeSlot {
  id: string;
  timeSlot: string | null;
}

export interface ConflictPair {
  lecturerId: string;
  courseA: string;
  courseB: string;
  reason: string;
}

/**
 * Parse a time slot string like "Mon 08:00-10:00" into structured data.
 */
function parseTimeSlot(slot: string): {
  day: string;
  startMinutes: number;
  endMinutes: number;
} | null {
  const match = slot.match(
    /^(\w+)\s+(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/
  );
  if (!match) return null;

  const [, day, sh, sm, eh, em] = match;
  return {
    day: day.toLowerCase(),
    startMinutes: parseInt(sh) * 60 + parseInt(sm),
    endMinutes: parseInt(eh) * 60 + parseInt(em),
  };
}

/**
 * Check if two time slots overlap.
 */
function timeSlotsOverlap(slotA: string, slotB: string): boolean {
  const a = parseTimeSlot(slotA);
  const b = parseTimeSlot(slotB);

  if (!a || !b) return false;
  if (a.day !== b.day) return false;

  // Overlap: A starts before B ends AND B starts before A ends
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

/**
 * Detect all time-slot conflicts in a set of allocations.
 */
export function detectConflicts(
  allocations: AllocationResult[],
  courses: CourseWithTimeSlot[]
): ConflictPair[] {
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  const conflicts: ConflictPair[] = [];

  // Group allocations by lecturer
  const byLecturer = new Map<string, AllocationResult[]>();
  for (const alloc of allocations) {
    const existing = byLecturer.get(alloc.lecturerId) || [];
    existing.push(alloc);
    byLecturer.set(alloc.lecturerId, existing);
  }

  // For each lecturer, check all pairs of their allocated courses
  for (const [lecturerId, lecAllocs] of byLecturer) {
    for (let i = 0; i < lecAllocs.length; i++) {
      for (let j = i + 1; j < lecAllocs.length; j++) {
        const courseA = courseMap.get(lecAllocs[i].courseId);
        const courseB = courseMap.get(lecAllocs[j].courseId);

        if (!courseA?.timeSlot || !courseB?.timeSlot) continue;

        if (timeSlotsOverlap(courseA.timeSlot, courseB.timeSlot)) {
          conflicts.push({
            lecturerId,
            courseA: courseA.id,
            courseB: courseB.id,
            reason: `Time slot conflict: ${courseA.timeSlot} overlaps with ${courseB.timeSlot}`,
          });
        }
      }
    }
  }

  return conflicts;
}
