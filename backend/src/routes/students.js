import express from "express";
import prisma from "../db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get list of students (optionally filtered by classId)
router.get("/", authenticateToken, async (req, res) => {
  const { classId } = req.query;
  try {
    const filter = classId ? { classId: parseInt(classId) } : {};
    const students = await prisma.student.findMany({
      where: filter,
      include: {
        class: true,
        attendance: true,
        marks: true,
        fees: true
      },
      orderBy: { name: "asc" }
    });
    res.json(students);
  } catch (error) {
    console.error("Fetch students error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get single student details
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const student = await prisma.student.findUnique({
      where: { id: parseInt(id) },
      include: {
        class: true,
        attendance: {
          orderBy: { date: "desc" }
        },
        marks: {
          orderBy: [
            { examName: "asc" },
            { subject: "asc" }
          ]
        },
        fees: {
          orderBy: { dueDate: "asc" }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found." });
    }

    res.json(student);
  } catch (error) {
    console.error("Fetch student details error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Create student (Principal or Teacher)
router.post("/", authenticateToken, async (req, res) => {
  const { name, rollNumber, classId } = req.body;

  if (!name || !classId) {
    return res.status(400).json({ error: "Name and class ID are required." });
  }

  try {
    const classObj = await prisma.class.findUnique({
      where: { id: parseInt(classId) }
    });

    if (!classObj) {
      return res.status(404).json({ error: "Target class not found." });
    }

    const student = await prisma.student.create({
      data: {
        name,
        rollNumber: rollNumber ? rollNumber.toString() : null,
        classId: parseInt(classId)
      },
      include: { class: true }
    });

    res.status(201).json(student);
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Update student details
router.put("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, rollNumber, classId } = req.body;

  try {
    const data = {};
    if (name) data.name = name;
    if (rollNumber !== undefined) data.rollNumber = rollNumber;
    if (classId) {
      const classObj = await prisma.class.findUnique({ where: { id: parseInt(classId) } });
      if (!classObj) return res.status(404).json({ error: "Class not found." });
      data.classId = parseInt(classId);
    }

    const student = await prisma.student.update({
      where: { id: parseInt(id) },
      data,
      include: { class: true }
    });

    res.json(student);
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Delete student
router.delete("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.student.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: "Student deleted successfully." });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Enter/Log attendance for student
router.post("/:id/attendance", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { date, status } = req.body; // date YYYY-MM-DD, status "PRESENT", "ABSENT", "LATE"

  if (!date || !status) {
    return res.status(400).json({ error: "Date and status are required." });
  }

  try {
    // Check if attendance already logged for this date
    const existing = await prisma.attendance.findFirst({
      where: {
        studentId: parseInt(id),
        date: date
      }
    });

    let attendance;
    if (existing) {
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: { status }
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          studentId: parseInt(id),
          date,
          status
        }
      });
    }

    res.json(attendance);
  } catch (error) {
    console.error("Log attendance error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Batch log attendance for a class
router.post("/class-attendance", authenticateToken, async (req, res) => {
  const { classId, date, attendanceRecords } = req.body; 
  // attendanceRecords: [{ studentId: 1, status: "PRESENT" }, ...]

  if (!classId || !date || !attendanceRecords || !Array.isArray(attendanceRecords)) {
    return res.status(400).json({ error: "classId, date, and attendanceRecords array are required." });
  }

  try {
    const promises = attendanceRecords.map(async (record) => {
      const existing = await prisma.attendance.findFirst({
        where: {
          studentId: parseInt(record.studentId),
          date: date
        }
      });

      if (existing) {
        return prisma.attendance.update({
          where: { id: existing.id },
          data: { status: record.status }
        });
      } else {
        return prisma.attendance.create({
          data: {
            studentId: parseInt(record.studentId),
            date,
            status: record.status
          }
        });
      }
    });

    await Promise.all(promises);
    res.json({ message: "Attendance batch logged successfully." });
  } catch (error) {
    console.error("Batch attendance logging error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Enter marks for student
router.post("/:id/marks", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { subject, examName, marksObtained, maxMarks } = req.body;

  if (!subject || !examName || marksObtained === undefined || !maxMarks) {
    return res.status(400).json({ error: "subject, examName, marksObtained, and maxMarks are required." });
  }

  try {
    // Check if marks entry already exists for student, subject, and exam
    const existing = await prisma.mark.findFirst({
      where: {
        studentId: parseInt(id),
        subject: subject.trim(),
        examName: examName.trim()
      }
    });

    let mark;
    if (existing) {
      mark = await prisma.mark.update({
        where: { id: existing.id },
        data: {
          marksObtained: parseFloat(marksObtained),
          maxMarks: parseFloat(maxMarks)
        }
      });
    } else {
      mark = await prisma.mark.create({
        data: {
          studentId: parseInt(id),
          subject: subject.trim(),
          examName: examName.trim(),
          marksObtained: parseFloat(marksObtained),
          maxMarks: parseFloat(maxMarks)
        }
      });
    }

    res.json(mark);
  } catch (error) {
    console.error("Enter mark error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get statistics for a specific class (average marks by exam/subject, attendance rates)
router.get("/class-stats/:classId", authenticateToken, async (req, res) => {
  const { classId } = req.params;

  try {
    const students = await prisma.student.findMany({
      where: { classId: parseInt(classId) },
      include: {
        attendance: true,
        marks: true
      }
    });

    if (students.length === 0) {
      return res.json({
        studentCount: 0,
        averageAttendance: 0,
        performanceData: []
      });
    }

    // Calculate general attendance rate
    let totalDays = 0;
    let presentDays = 0;
    students.forEach(student => {
      student.attendance.forEach(att => {
        totalDays++;
        if (att.status === "PRESENT" || att.status === "LATE") {
          presentDays++;
        }
      });
    });

    const averageAttendance = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

    // Group marks by subject and examName to calculate averages
    const subjectMarks = {}; // subject -> { examName -> { sum: 0, count: 0 } }
    students.forEach(student => {
      student.marks.forEach(m => {
        if (!subjectMarks[m.subject]) {
          subjectMarks[m.subject] = {};
        }
        if (!subjectMarks[m.subject][m.examName]) {
          subjectMarks[m.subject][m.examName] = { sum: 0, count: 0, max: m.maxMarks };
        }
        const percentage = (m.marksObtained / m.maxMarks) * 100;
        subjectMarks[m.subject][m.examName].sum += percentage;
        subjectMarks[m.subject][m.examName].count += 1;
      });
    });

    const performanceData = [];
    Object.keys(subjectMarks).forEach(subject => {
      Object.keys(subjectMarks[subject]).forEach(examName => {
        const stats = subjectMarks[subject][examName];
        performanceData.push({
          subject,
          examName,
          averagePercentage: Math.round(stats.sum / stats.count),
          maxMarks: stats.max
        });
      });
    });

    res.json({
      studentCount: students.length,
      averageAttendance,
      performanceData
    });
  } catch (error) {
    console.error("Fetch class statistics error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Batch create students (Principal or Teacher)
router.post("/batch-students", authenticateToken, async (req, res) => {
  const { classId, students } = req.body;

  if (!classId || !students || !Array.isArray(students)) {
    return res.status(400).json({ error: "classId and students array are required." });
  }

  try {
    const classObj = await prisma.class.findUnique({
      where: { id: parseInt(classId) }
    });

    if (!classObj) {
      return res.status(404).json({ error: "Target class not found." });
    }

    // Perform bulk insert
    const studentData = students.map(s => ({
      name: s.name.trim(),
      rollNumber: s.rollNumber ? s.rollNumber.toString().trim() : null,
      classId: parseInt(classId)
    }));

    const result = await prisma.student.createMany({
      data: studentData
    });

    res.status(201).json({
      message: `Successfully enrolled ${result.count} students.`,
      count: result.count
    });
  } catch (error) {
    console.error("Batch student creation error:", error);
    res.status(500).json({ error: "Internal server error during batch student creation." });
  }
});

// Batch update/insert student marks from Excel reconciliation (Principal or Teacher)
router.post("/batch-marks", authenticateToken, async (req, res) => {
  const { classId, subject, examName, maxMarks, marksRecords } = req.body;

  if (!classId || !subject || !examName || maxMarks === undefined || !marksRecords || !Array.isArray(marksRecords)) {
    return res.status(400).json({ error: "Missing required parameters for batch marks." });
  }

  try {
    const classObj = await prisma.class.findUnique({
      where: { id: parseInt(classId) },
      include: { students: true }
    });

    if (!classObj) {
      return res.status(404).json({ error: "Target class not found." });
    }

    const classStudents = classObj.students;
    let successCount = 0;
    let failedRecords = [];

    for (const record of marksRecords) {
      const { name, rollNumber, marksObtained } = record;
      if (marksObtained === undefined || marksObtained === null || isNaN(parseFloat(marksObtained))) {
        failedRecords.push({ record, error: "Invalid marks value" });
        continue;
      }

      // Try to find the student in this class
      let student = null;
      if (rollNumber) {
        student = classStudents.find(
          s => s.rollNumber && s.rollNumber.trim() === rollNumber.toString().trim()
        );
      }
      
      if (!student && name) {
        student = classStudents.find(
          s => s.name.trim().toLowerCase() === name.toString().trim().toLowerCase()
        );
      }

      if (!student) {
        failedRecords.push({ record, error: "Student not found in class" });
        continue;
      }

      // Upsert mark record
      const existingMark = await prisma.mark.findFirst({
        where: {
          studentId: student.id,
          subject: subject.trim(),
          examName: examName.trim()
        }
      });

      if (existingMark) {
        await prisma.mark.update({
          where: { id: existingMark.id },
          data: {
            marksObtained: parseFloat(marksObtained),
            maxMarks: parseFloat(maxMarks)
          }
        });
      } else {
        await prisma.mark.create({
          data: {
            studentId: student.id,
            subject: subject.trim(),
            examName: examName.trim(),
            marksObtained: parseFloat(marksObtained),
            maxMarks: parseFloat(maxMarks)
          }
        });
      }
      successCount++;
    }

    res.json({
      message: `Reconciliation complete. Successfully updated ${successCount} marks.`,
      successCount,
      failedCount: failedRecords.length,
      failedRecords
    });
  } catch (error) {
    console.error("Batch marks upload error:", error);
    res.status(500).json({ error: "Internal server error during batch marks upload." });
  }
});

export default router;
