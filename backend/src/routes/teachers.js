import express from "express";
import bcrypt from "bcryptjs";
import prisma from "../db.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Get list of all teachers (with user profiles and class teacher details)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, createdAt: true }
        },
        classTeacherOf: true
      },
      orderBy: {
        user: { name: "asc" }
      }
    });
    res.json(teachers);
  } catch (error) {
    console.error("Fetch teachers error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Onboard new teacher (Principal only)
router.post("/", authenticateToken, requireRole("PRINCIPAL"), async (req, res) => {
  const { name, email, password, phone, subject } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required." });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "TEACHER",
        teacher: {
          create: {
            phone,
            subject
          }
        }
      },
      include: {
        teacher: true
      }
    });

    res.status(201).json({
      message: "Teacher onboarded successfully.",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        teacherId: newUser.teacher.id,
      }
    });
  } catch (error) {
    console.error("Onboard teacher error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Assign class teacher (Principal only)
router.post("/assign-class-teacher", authenticateToken, requireRole("PRINCIPAL"), async (req, res) => {
  const { teacherId, classId } = req.body; // both are numbers

  if (!classId) {
    return res.status(400).json({ error: "Class ID is required." });
  }

  try {
    const classObj = await prisma.class.findUnique({
      where: { id: parseInt(classId) }
    });

    if (!classObj) {
      return res.status(404).json({ error: "Class not found." });
    }

    // If teacherId is null or 0, we are unassigning the teacher
    if (!teacherId) {
      await prisma.class.update({
        where: { id: parseInt(classId) },
        data: { classTeacherId: null }
      });
      return res.json({ message: "Class teacher unassigned successfully." });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(teacherId) }
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found." });
    }

    // Check if teacher is already class teacher of another class
    const existingAssignment = await prisma.class.findUnique({
      where: { classTeacherId: parseInt(teacherId) }
    });

    if (existingAssignment && existingAssignment.id !== parseInt(classId)) {
      // Clear previous assignment so 1-to-1 is respected
      await prisma.class.update({
        where: { id: existingAssignment.id },
        data: { classTeacherId: null }
      });
    }

    // Update current class
    const updatedClass = await prisma.class.update({
      where: { id: parseInt(classId) },
      data: { classTeacherId: parseInt(teacherId) },
      include: {
        classTeacher: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    res.json({
      message: "Class teacher assigned successfully.",
      class: updatedClass
    });
  } catch (error) {
    console.error("Assign class teacher error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get teacher timetable (Teacher or Principal)
// This implements the requirement: "should be able to generate teachers time table from the given class timetable"
router.get("/:id/timetable", authenticateToken, async (req, res) => {
  const { id } = req.params; // teacherId
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { select: { name: true } }
      }
    });

    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found." });
    }

    // Find all timetable slots for this teacher
    const slots = await prisma.timetableSlot.findMany({
      where: { teacherId: parseInt(id) },
      include: {
        class: {
          select: { id: true, name: true, division: true }
        }
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" }
      ]
    });

    res.json({
      teacher: {
        id: teacher.id,
        name: teacher.user.name,
      },
      slots: slots.map(slot => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject,
        classId: slot.class.id,
        className: `${slot.class.name}-${slot.class.division}`
      }))
    });
  } catch (error) {
    console.error("Fetch teacher timetable error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
