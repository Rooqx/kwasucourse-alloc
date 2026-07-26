/**
 * Mock teaching guide generator.
 * Per spec Section 8: teaching guides are mocked — generated from course data.
 */

interface TeachingGuideParams {
  courseCode: string;
  courseTitle: string;
  courseUnits: number;
  courseLevel: number;
  lecturerName: string;
  departmentName: string;
  semester: string;
}

export function generateTeachingGuide(params: TeachingGuideParams): string {
  const {
    courseCode,
    courseTitle,
    courseUnits,
    courseLevel,
    lecturerName,
    departmentName,
    semester,
  } = params;

  return `
# Teaching Guide: ${courseCode} — ${courseTitle}

## Course Information
- **Course Code:** ${courseCode}
- **Course Title:** ${courseTitle}
- **Credit Units:** ${courseUnits}
- **Level:** ${courseLevel}
- **Semester:** ${semester}
- **Department:** ${departmentName}
- **Assigned Lecturer:** ${lecturerName}

## Course Objectives
1. Provide students with a comprehensive understanding of ${courseTitle.toLowerCase()}.
2. Develop critical thinking and analytical skills related to the subject matter.
3. Enable students to apply theoretical concepts to practical scenarios.
4. Foster independent learning and research capabilities.

## Weekly Breakdown

| Week | Topic |
|------|-------|
| 1 | Introduction and Course Overview |
| 2 | Fundamental Concepts and Terminology |
| 3 | Core Principles and Theories |
| 4 | Practical Applications — Part I |
| 5 | Practical Applications — Part II |
| 6 | Case Studies and Analysis |
| 7 | Mid-Semester Review |
| 8 | Advanced Topics — Part I |
| 9 | Advanced Topics — Part II |
| 10 | Industry Perspectives and Guest Lecture |
| 11 | Project Work and Presentations |
| 12 | Revision and Exam Preparation |

## Assessment
- Continuous Assessment: 30%
  - Assignments (15%)
  - Mid-Semester Test (15%)
- Final Examination: 70%

## Recommended Resources
1. Core textbooks for ${courseTitle}
2. Supplementary reading materials
3. Online resources and journal articles
4. Laboratory/practical manuals (where applicable)

---
*This teaching guide was auto-generated for the ${semester} academic session.*
*Generated on: ${new Date().toLocaleDateString()}*
`.trim();
}
