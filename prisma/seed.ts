import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role, AllocationStatus, FlagStatus } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database with massive HOD data...");

  // 1. Department
  const csDept = await prisma.department.upsert({
    where: { code: "CSC" },
    update: {},
    create: { name: "Computer Science", code: "CSC" },
  });

  // 2. Users
  const passwordHash = await hash("Password@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@kwasu.test" },
    update: {},
    create: { fullName: "System Administrator", email: "admin@kwasu.test", passwordHash, role: Role.ADMIN, departmentId: csDept.id, isApproved: true },
  });

  const hod = await prisma.user.upsert({
    where: { email: "hod@kwasu.test" },
    update: {},
    create: { fullName: "Dr. Abiola Ogunlade", email: "hod@kwasu.test", passwordHash, role: Role.HOD, departmentId: csDept.id, isApproved: true },
  });

  // Create 12 Lecturers
  const lecturerData = [
    { name: "Dr. Fatima Ibrahim", email: "lec1@kwasu.test", spec: "Artificial Intelligence", rank: 5, load: 15 },
    { name: "Dr. Chinedu Okoro", email: "lec2@kwasu.test", spec: "Software Engineering", rank: 4, load: 15 },
    { name: "Dr. Amina Yusuf", email: "lec3@kwasu.test", spec: "Data Science", rank: 3, load: 12 },
    { name: "Mr. Oluwaseun Adeyemi", email: "lec4@kwasu.test", spec: "Computer Networks", rank: 2, load: 12 },
    { name: "Mrs. Grace Okonkwo", email: "lec5@kwasu.test", spec: "Cybersecurity", rank: 1, load: 12 },
    { name: "Prof. Alan Turing", email: "lec6@kwasu.test", spec: "Theoretical Computer Science", rank: 6, load: 9 },
    { name: "Dr. John Doe", email: "lec7@kwasu.test", spec: "Artificial Intelligence", rank: 3, load: 12 },
    { name: "Dr. Jane Smith", email: "lec8@kwasu.test", spec: "Software Engineering", rank: 3, load: 15 },
    { name: "Mr. Emmanuel Eze", email: "lec9@kwasu.test", spec: "Information Systems", rank: 1, load: 12 },
    { name: "Dr. Aisha Bello", email: "lec10@kwasu.test", spec: "Cybersecurity", rank: 4, load: 12 },
    { name: "Prof. Ojo Emmanuel", email: "lec11@kwasu.test", spec: "Data Science", rank: 6, load: 9 },
    { name: "Dr. Tunde Bakare", email: "lec12@kwasu.test", spec: "Computer Networks", rank: 3, load: 12 },
  ];

  const lecturerIds = [];
  for (const lec of lecturerData) {
    const user = await prisma.user.upsert({
      where: { email: lec.email },
      update: {},
      create: { fullName: lec.name, email: lec.email, passwordHash, role: Role.LECTURER, departmentId: csDept.id, isApproved: true },
    });
    const profile = await prisma.lecturerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, specialization: lec.spec, seniorityRank: lec.rank, maxLoadUnits: lec.load },
    });
    lecturerIds.push(profile.id);
  }

  // 3. Academic Sessions
  const sessionPast = await prisma.academicSession.upsert({
    where: { id: "seed-session-2023-2024" },
    update: {},
    create: { id: "seed-session-2023-2024", label: "2023/2024", semester: "Rain Semester", isActive: false },
  });

  const sessionActive = await prisma.academicSession.upsert({
    where: { id: "seed-session-2024-2025" },
    update: {},
    create: { id: "seed-session-2024-2025", label: "2024/2025", semester: "Harmattan Semester", isActive: true },
  });

  // 4. Courses (30 courses)
  const courseData = [
    { code: "CSC 101", title: "Introduction to Computer Science", units: 3, level: 100 },
    { code: "CSC 102", title: "Introduction to Problem Solving", units: 3, level: 100 },
    { code: "CSC 103", title: "Computer Applications", units: 2, level: 100 },
    { code: "CSC 112", title: "Logic and Computation", units: 3, level: 100 },
    { code: "CSC 201", title: "Data Structures and Algorithms", units: 3, level: 200 },
    { code: "CSC 202", title: "Object Oriented Programming", units: 3, level: 200 },
    { code: "CSC 205", title: "Computer Networks Fundamentals", units: 2, level: 200 },
    { code: "CSC 208", title: "Discrete Mathematics", units: 3, level: 200 },
    { code: "CSC 212", title: "System Analysis and Design", units: 2, level: 200 },
    { code: "CSC 301", title: "Artificial Intelligence", units: 3, level: 300 },
    { code: "CSC 302", title: "Automata Theory", units: 3, level: 300 },
    { code: "CSC 305", title: "Database Management Systems", units: 3, level: 300 },
    { code: "CSC 307", title: "Software Engineering", units: 3, level: 300 },
    { code: "CSC 310", title: "Human Computer Interaction", units: 2, level: 300 },
    { code: "CSC 312", title: "Operating Systems", units: 3, level: 300 },
    { code: "CSC 315", title: "Web Technologies", units: 3, level: 300 },
    { code: "CSC 399", title: "Industrial Training", units: 6, level: 300 },
    { code: "CSC 401", title: "Machine Learning", units: 3, level: 400 },
    { code: "CSC 403", title: "Network Security", units: 3, level: 400 },
    { code: "CSC 405", title: "Advanced Data Analytics", units: 3, level: 400 },
    { code: "CSC 411", title: "Cloud Computing", units: 3, level: 400 },
    { code: "CSC 415", title: "Internet of Things", units: 2, level: 400 },
    { code: "CSC 421", title: "Cryptography", units: 3, level: 400 },
    { code: "CSC 499", title: "Final Year Project", units: 6, level: 400 },
  ];

  const specs = ["Software Engineering", "Artificial Intelligence", "Data Science", "Computer Networks", "Cybersecurity", "Theoretical Computer Science", "Information Systems"];
  
  const courseIds = [];
  for (const [i, course] of courseData.entries()) {
    const spec = specs[i % specs.length];
    const c = await prisma.course.upsert({
      where: { code_departmentId: { code: course.code, departmentId: csDept.id } },
      update: {},
      create: { ...course, semester: "Harmattan Semester", specializationTag: spec, departmentId: csDept.id, capacity: 1 },
    });
    courseIds.push(c.id);
  }

  // 5. Config
  const defaultWeights = [
    { key: "allocation_weight_w1", value: "0.4" },
    { key: "allocation_weight_w2", value: "0.2" },
    { key: "allocation_weight_w3", value: "0.25" },
    { key: "allocation_weight_w4", value: "0.15" },
  ];
  for (const config of defaultWeights) {
    await prisma.systemConfig.upsert({ where: { key: config.key }, update: {}, create: config });
  }

  // 6. Generate Preferences & Allocations for ACTIVE SESSION
  console.log("Generating preferences and allocations...");
  for (let i = 0; i < 15; i++) {
    const courseId = courseIds[i];
    const lecturerId = lecturerIds[i % lecturerIds.length];
    
    // Preference
    await prisma.lecturerPreference.upsert({
      where: { lecturerId_courseId_sessionId: { lecturerId, courseId, sessionId: sessionActive.id } },
      update: {},
      create: { lecturerId, courseId, sessionId: sessionActive.id, rank: 1 }
    });

    // Allocation Draft
    const status = i % 5 === 0 ? AllocationStatus.FLAGGED : (i % 3 === 0 ? AllocationStatus.APPROVED : AllocationStatus.DRAFT);
    const alloc = await prisma.allocation.upsert({
      where: { courseId_lecturerId_sessionId: { courseId, lecturerId, sessionId: sessionActive.id } },
      update: {},
      create: { courseId, lecturerId, sessionId: sessionActive.id, status, hasConflict: i % 7 === 0 }
    });

    if (status === AllocationStatus.FLAGGED) {
      await prisma.allocationFlag.create({
        data: { allocationId: alloc.id, raisedById: lecturerId, reason: "Schedule conflict with another university duty.", status: FlagStatus.OPEN }
      });
    }
  }

  // 7. Generate Allocations for PAST SESSION
  for (let i = 5; i < 20; i++) {
    const courseId = courseIds[i];
    const lecturerId = lecturerIds[(i + 2) % lecturerIds.length];
    
    await prisma.allocation.upsert({
      where: { courseId_lecturerId_sessionId: { courseId, lecturerId, sessionId: sessionPast.id } },
      update: {},
      create: { courseId, lecturerId, sessionId: sessionPast.id, status: AllocationStatus.APPROVED, hasConflict: false }
    });
  }

  console.log("\n🎉 Seed complete!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
