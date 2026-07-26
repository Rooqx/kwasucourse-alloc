import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import { hash } from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ─────────────────────────────────────────────────────
  // 1. Department: Computer Science
  // ─────────────────────────────────────────────────────
  const csDept = await prisma.department.upsert({
    where: { code: "CSC" },
    update: {},
    create: {
      name: "Computer Science",
      code: "CSC",
    },
  });
  console.log(`✅ Department: ${csDept.name} (${csDept.code})`);

  const macDept = await prisma.department.upsert({
    where: { code: "MAC" },
    update: {},
    create: {
      name: "Mass Communication",
      code: "MAC",
    },
  });
  console.log(`✅ Department: ${macDept.name} (${macDept.code})`);

  const lisDept = await prisma.department.upsert({
    where: { code: "LIS" },
    update: {},
    create: {
      name: "Library and Information Science",
      code: "LIS",
    },
  });
  console.log(`✅ Department: ${lisDept.name} (${lisDept.code})`);

  const senDept = await prisma.department.upsert({
    where: { code: "SEN" },
    update: {},
    create: {
      name: "Software Engineering",
      code: "SEN",
    },
  });
  console.log(`✅ Department: ${senDept.name} (${senDept.code})`);

  // ─────────────────────────────────────────────────────
  // 2. Users — exact seed credentials from spec Section 4
  // ─────────────────────────────────────────────────────
  const adminHash = await hash("Admin@123", 10);
  const hodHash = await hash("Hod@12345", 10);
  const lecturerHash = await hash("Lecturer@123", 10);
  const studentHash = await hash("Student@123", 10);

  // ADMIN
  const admin = await prisma.user.upsert({
    where: { email: "admin@kwasu.test" },
    update: {},
    create: {
      fullName: "System Administrator",
      email: "admin@kwasu.test",
      passwordHash: adminHash,
      role: Role.ADMIN,
      departmentId: csDept.id,
      isApproved: true,
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // HOD
  const hod = await prisma.user.upsert({
    where: { email: "hod@kwasu.test" },
    update: {},
    create: {
      fullName: "Dr. Abiola Ogunlade",
      email: "hod@kwasu.test",
      passwordHash: hodHash,
      role: Role.HOD,
      departmentId: csDept.id,
      isApproved: true,
    },
  });
  console.log(`✅ HOD: ${hod.email}`);

  // LECTURERS — 5 lecturers with varied specializations and seniority
  const lecturerData = [
    {
      fullName: "Dr. Fatima Ibrahim",
      email: "lecturer1@kwasu.test",
      specialization: "Artificial Intelligence",
      seniorityRank: 5,
      maxLoadUnits: 15,
    },
    {
      fullName: "Dr. Chinedu Okoro",
      email: "lecturer2@kwasu.test",
      specialization: "Software Engineering",
      seniorityRank: 4,
      maxLoadUnits: 12,
    },
    {
      fullName: "Dr. Amina Yusuf",
      email: "lecturer3@kwasu.test",
      specialization: "Data Science",
      seniorityRank: 3,
      maxLoadUnits: 12,
    },
    {
      fullName: "Mr. Oluwaseun Adeyemi",
      email: "lecturer4@kwasu.test",
      specialization: "Computer Networks",
      seniorityRank: 2,
      maxLoadUnits: 10,
    },
    {
      fullName: "Mrs. Grace Okonkwo",
      email: "lecturer5@kwasu.test",
      specialization: "Cybersecurity",
      seniorityRank: 1,
      maxLoadUnits: 12,
    },
  ];

  for (const lec of lecturerData) {
    const user = await prisma.user.upsert({
      where: { email: lec.email },
      update: {},
      create: {
        fullName: lec.fullName,
        email: lec.email,
        passwordHash: lecturerHash,
        role: Role.LECTURER,
        departmentId: csDept.id,
        isApproved: true,
      },
    });

    await prisma.lecturerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specialization: lec.specialization,
        seniorityRank: lec.seniorityRank,
        maxLoadUnits: lec.maxLoadUnits,
      },
    });

    console.log(`✅ Lecturer: ${lec.email} (${lec.specialization}, seniority: ${lec.seniorityRank})`);
  }

  // STUDENTS — 4 students with varied levels
  const studentData = [
    { fullName: "Adamu Bello", email: "student1@kwasu.test", level: 100 },
    { fullName: "Kemi Adeola", email: "student2@kwasu.test", level: 200 },
    { fullName: "Emeka Nwankwo", email: "student3@kwasu.test", level: 300 },
    { fullName: "Halima Sani", email: "student4@kwasu.test", level: 400 },
  ];

  for (const stu of studentData) {
    await prisma.user.upsert({
      where: { email: stu.email },
      update: {},
      create: {
        fullName: stu.fullName,
        email: stu.email,
        passwordHash: studentHash,
        role: Role.STUDENT,
        departmentId: csDept.id,
        isApproved: true,
        level: stu.level,
      },
    });
    console.log(`✅ Student: ${stu.email} (Level ${stu.level})`);
  }

  // ─────────────────────────────────────────────────────
  // 3. Academic Session
  // ─────────────────────────────────────────────────────
  const session = await prisma.academicSession.upsert({
    where: { id: "seed-session-2024-2025-first" },
    update: {},
    create: {
      id: "seed-session-2024-2025-first",
      label: "2024/2025",
      semester: "First Semester",
      isActive: true,
    },
  });
  console.log(`✅ Academic Session: ${session.label} — ${session.semester} (active)`);

  // ─────────────────────────────────────────────────────
  // 4. Courses — 10 courses across levels 100-400
  //    Varied specialization tags and time slots
  // ─────────────────────────────────────────────────────
  const courseData = [
    // Level 100
    {
      code: "CSC 101",
      title: "Introduction to Computer Science",
      units: 3,
      level: 100,
      semester: "First Semester",
      specializationTag: "Software Engineering",
      timeSlot: "Mon 08:00-10:00",
    },
    {
      code: "CSC 103",
      title: "Introduction to Programming",
      units: 3,
      level: 100,
      semester: "First Semester",
      specializationTag: "Software Engineering",
      timeSlot: "Wed 10:00-12:00",
    },
    // Level 200
    {
      code: "CSC 201",
      title: "Data Structures and Algorithms",
      units: 3,
      level: 200,
      semester: "First Semester",
      specializationTag: "Software Engineering",
      timeSlot: "Tue 08:00-10:00",
    },
    {
      code: "CSC 205",
      title: "Computer Networks Fundamentals",
      units: 2,
      level: 200,
      semester: "First Semester",
      specializationTag: "Computer Networks",
      timeSlot: "Thu 14:00-16:00",
    },
    // Level 300
    {
      code: "CSC 301",
      title: "Artificial Intelligence",
      units: 3,
      level: 300,
      semester: "First Semester",
      specializationTag: "Artificial Intelligence",
      timeSlot: "Mon 10:00-12:00",
    },
    {
      code: "CSC 305",
      title: "Database Management Systems",
      units: 3,
      level: 300,
      semester: "First Semester",
      specializationTag: "Data Science",
      timeSlot: "Wed 08:00-10:00",
    },
    {
      code: "CSC 307",
      title: "Software Engineering",
      units: 3,
      level: 300,
      semester: "First Semester",
      specializationTag: "Software Engineering",
      timeSlot: "Fri 10:00-12:00",
    },
    // Level 400
    {
      code: "CSC 401",
      title: "Machine Learning",
      units: 3,
      level: 400,
      semester: "First Semester",
      specializationTag: "Artificial Intelligence",
      timeSlot: "Tue 10:00-12:00",
    },
    {
      code: "CSC 403",
      title: "Network Security",
      units: 3,
      level: 400,
      semester: "First Semester",
      specializationTag: "Cybersecurity",
      timeSlot: "Thu 08:00-10:00",
    },
    {
      code: "CSC 405",
      title: "Advanced Data Analytics",
      units: 3,
      level: 400,
      semester: "First Semester",
      specializationTag: "Data Science",
      timeSlot: "Mon 14:00-16:00",
    },
  ];

  for (const course of courseData) {
    await prisma.course.upsert({
      where: {
        code_departmentId: {
          code: course.code,
          departmentId: csDept.id,
        },
      },
      update: {},
      create: {
        ...course,
        departmentId: csDept.id,
        capacity: 1,
      },
    });
    console.log(`✅ Course: ${course.code} — ${course.title} (Level ${course.level}, ${course.units} units)`);
  }

  // ─────────────────────────────────────────────────────
  // 5. Default SystemConfig — allocation weights (w1-w4)
  // ─────────────────────────────────────────────────────
  const defaultWeights = [
    { key: "allocation_weight_w1", value: "0.4" },
    { key: "allocation_weight_w2", value: "0.2" },
    { key: "allocation_weight_w3", value: "0.25" },
    { key: "allocation_weight_w4", value: "0.15" },
  ];

  for (const config of defaultWeights) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
    console.log(`✅ Config: ${config.key} = ${config.value}`);
  }

  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
