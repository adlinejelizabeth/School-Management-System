import express from "express";
import prisma from "../db.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Get timetable for a specific class
router.get("/class/:classId", authenticateToken, async (req, res) => {
  const { classId } = req.params;
  try {
    const slots = await prisma.timetableSlot.findMany({
      where: { classId: parseInt(classId) },
      include: {
        teacher: {
          include: {
            user: { select: { name: true } }
          }
        }
      },
      orderBy: [
        { dayOfWeek: "asc" },
        { startTime: "asc" }
      ]
    });
    res.json(slots);
  } catch (error) {
    console.error("Fetch class timetable error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Save (create or update) a class timetable slot (Principal only)
router.post("/", authenticateToken, requireRole("PRINCIPAL"), async (req, res) => {
  const { classId, teacherId, dayOfWeek, startTime, endTime, subject, slotId } = req.body;

  if (!classId || !teacherId || !dayOfWeek || !startTime || !endTime || !subject) {
    return res.status(400).json({ error: "Missing required timetable slot parameters." });
  }

  try {
    // Check if the teacher has any scheduling conflicts in another class at the same day/time
    // Conflict definition: a slot where teacherId is identical, dayOfWeek is identical, and time overlaps.
    // Time overlap is defined as: (start1 < end2) AND (end1 > start2)
    // To implement simple overlap in SQLite without database-specific functions, we can fetch all slots for the teacher
    // on that day and perform comparisons.
    const teacherSlotsOnDay = await prisma.timetableSlot.findMany({
      where: {
        teacherId: parseInt(teacherId),
        dayOfWeek: dayOfWeek.trim(),
        // Exclude the current slot if we are updating it
        NOT: slotId ? { id: parseInt(slotId) } : undefined
      }
    });

    const hasConflict = teacherSlotsOnDay.some(slot => {
      const start1 = startTime.trim();
      const end1 = endTime.trim();
      const start2 = slot.startTime.trim();
      const end2 = slot.endTime.trim();

      // Check overlap: (start1 < end2) && (end1 > start2)
      return (start1 < end2) && (end1 > start2);
    });

    if (hasConflict) {
      return res.status(400).json({
        error: "Scheduling Conflict: This teacher is already scheduled for another class during this time."
      });
    }

    // Check if the class itself has a conflict at this time
    const classSlotsOnDay = await prisma.timetableSlot.findMany({
      where: {
        classId: parseInt(classId),
        dayOfWeek: dayOfWeek.trim(),
        NOT: slotId ? { id: parseInt(slotId) } : undefined
      }
    });

    const hasClassConflict = classSlotsOnDay.some(slot => {
      const start1 = startTime.trim();
      const end1 = endTime.trim();
      const start2 = slot.startTime.trim();
      const end2 = slot.endTime.trim();

      return (start1 < end2) && (end1 > start2);
    });

    if (hasClassConflict) {
      return res.status(400).json({
        error: "Scheduling Conflict: This class already has a subject scheduled during this time."
      });
    }

    let slot;
    if (slotId) {
      // Update existing slot
      slot = await prisma.timetableSlot.update({
        where: { id: parseInt(slotId) },
        data: {
          classId: parseInt(classId),
          teacherId: parseInt(teacherId),
          dayOfWeek: dayOfWeek.trim(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          subject: subject.trim()
        }
      });
    } else {
      // Create new slot
      slot = await prisma.timetableSlot.create({
        data: {
          classId: parseInt(classId),
          teacherId: parseInt(teacherId),
          dayOfWeek: dayOfWeek.trim(),
          startTime: startTime.trim(),
          endTime: endTime.trim(),
          subject: subject.trim()
        }
      });
    }

    res.status(201).json(slot);
  } catch (error) {
    console.error("Save timetable slot error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Delete a timetable slot (Principal only)
router.delete("/:id", authenticateToken, requireRole("PRINCIPAL"), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.timetableSlot.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: "Timetable slot deleted successfully." });
  } catch (error) {
    console.error("Delete timetable slot error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
