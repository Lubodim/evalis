import "dotenv/config";
import { AssessmentType, PrismaClient, QuestionType, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@evalis.local" },
    update: {},
    create: {
      email: "superadmin@evalis.local",
      passwordHash: "seed-super-admin-password",
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.SUPER_ADMIN
    }
  });

  const schoolAdmin = await prisma.user.upsert({
    where: { email: "schooladmin@evalis.local" },
    update: {},
    create: {
      email: "schooladmin@evalis.local",
      passwordHash: "seed-school-admin-password",
      firstName: "School",
      lastName: "Admin",
      role: UserRole.SCHOOL_ADMIN
    }
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@evalis.local" },
    update: {},
    create: {
      email: "teacher@evalis.local",
      passwordHash: "seed-teacher-password",
      firstName: "Tanya",
      lastName: "Teacher",
      role: UserRole.TEACHER
    }
  });

  const student = await prisma.user.upsert({
    where: { email: "student@evalis.local" },
    update: {},
    create: {
      email: "student@evalis.local",
      passwordHash: "seed-student-password",
      firstName: "Sam",
      lastName: "Student",
      role: UserRole.STUDENT,
      studentProfile: {
        create: {
          studentNumber: "STU-1001",
          dateOfBirth: new Date("2010-05-14T00:00:00.000Z")
        }
      }
    },
    include: {
      studentProfile: true
    }
  });

  const parent = await prisma.user.upsert({
    where: { email: "parent@evalis.local" },
    update: {},
    create: {
      email: "parent@evalis.local",
      passwordHash: "seed-parent-password",
      firstName: "Paula",
      lastName: "Parent",
      role: UserRole.PARENT
    }
  });

  if (!student.studentProfile) {
    throw new Error("Seed student profile was not created.");
  }

  await prisma.parentStudentLink.upsert({
    where: {
      parentUserId_studentProfileId: {
        parentUserId: parent.id,
        studentProfileId: student.studentProfile.id
      }
    },
    update: {
      relationshipType: "guardian"
    },
    create: {
      parentUserId: parent.id,
      studentProfileId: student.studentProfile.id,
      relationshipType: "guardian"
    }
  });

  const schoolClass = await prisma.schoolClass.upsert({
    where: { id: "seed-school-class" },
    update: {
      name: "Grade 7 Mathematics",
      subject: "Mathematics",
      schoolYear: "2025/2026",
      teacherId: teacher.id,
      description: "Sample class for MVP development"
    },
    create: {
      id: "seed-school-class",
      name: "Grade 7 Mathematics",
      subject: "Mathematics",
      schoolYear: "2025/2026",
      teacherId: teacher.id,
      description: "Sample class for MVP development"
    }
  });

  await prisma.enrollment.upsert({
    where: {
      schoolClassId_studentProfileId: {
        schoolClassId: schoolClass.id,
        studentProfileId: student.studentProfile.id
      }
    },
    update: {},
    create: {
      schoolClassId: schoolClass.id,
      studentProfileId: student.studentProfile.id
    }
  });

  const assessment = await prisma.assessment.upsert({
    where: { id: "seed-assessment" },
    update: {
      schoolClassId: schoolClass.id,
      teacherId: teacher.id,
      title: "Fractions Quiz 1",
      description: "A simple sample assessment for the Evalis MVP",
      type: AssessmentType.QUIZ,
      totalPoints: 10,
      publishedAt: new Date("2026-03-19T09:00:00.000Z"),
      dueAt: new Date("2026-03-22T15:00:00.000Z")
    },
    create: {
      id: "seed-assessment",
      schoolClassId: schoolClass.id,
      teacherId: teacher.id,
      title: "Fractions Quiz 1",
      description: "A simple sample assessment for the Evalis MVP",
      type: AssessmentType.QUIZ,
      totalPoints: 10,
      publishedAt: new Date("2026-03-19T09:00:00.000Z"),
      dueAt: new Date("2026-03-22T15:00:00.000Z")
    }
  });

  await prisma.question.upsert({
    where: {
      assessmentId_orderIndex: {
        assessmentId: assessment.id,
        orderIndex: 1
      }
    },
    update: {
      prompt: "What is 1/2 + 1/4?",
      type: QuestionType.SHORT_TEXT,
      maxPoints: 10
    },
    create: {
      assessmentId: assessment.id,
      prompt: "What is 1/2 + 1/4?",
      type: QuestionType.SHORT_TEXT,
      maxPoints: 10,
      orderIndex: 1
    }
  });

  console.log("Seed completed.");
  console.log({
    superAdminEmail: superAdmin.email,
    schoolAdminEmail: schoolAdmin.email,
    teacherEmail: teacher.email,
    studentEmail: student.email,
    parentEmail: parent.email,
    schoolClassId: schoolClass.id,
    assessmentId: assessment.id
  });
}

main()
  .catch((error) => {
    console.error("Seed failed.", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
