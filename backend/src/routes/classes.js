import express from "express";
import prisma from "../db.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Get list of all classes and divisions
router.get("/", authenticateToken, async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        classTeacher: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: { students: true }
        }
      },
      orderBy: [
        { name: "asc" },
        { division: "asc" }
      ]
    });
    res.json(classes);
  } catch (error) {
    console.error("Fetch classes error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Get a single class details, including student count and its timetable slots
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const classItem = await prisma.class.findUnique({
      where: { id: parseInt(id) },
      include: {
        classTeacher: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        students: {
          orderBy: { name: "asc" }
        },
        timetableSlots: {
          include: {
            teacher: {
              include: {
                user: {
                  select: { name: true }
                }
              }
            }
          }
        }
      }
    });

    if (!classItem) {
      return res.status(404).json({ error: "Class not found." });
    }

    res.json(classItem);
  } catch (error) {
    console.error("Fetch class details error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Create class and division (Principal only)
router.post("/", authenticateToken, requireRole("PRINCIPAL"), async (req, res) => {
  const { name, division } = req.body;

  if (!name || !division) {
    return res.status(400).json({ error: "Class name and division are required." });
  }

  try {
    // Check if class with same name & division exists
    const existing = await prisma.class.findFirst({
      where: {
        name: name.trim(),
        division: division.trim().toUpperCase(),
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Class and division combination already exists." });
    }

    const newClass = await prisma.class.create({
      data: {
        name: name.trim(),
        division: division.trim().toUpperCase(),
      },
    });

    res.status(201).json(newClass);
  } catch (error) {
    console.error("Create class error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Delete class (Principal only)
router.delete("/:id", authenticateToken, requireRole("PRINCIPAL"), async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.class.delete({
      where: { id: parseInt(id) }
    });
    res.json({ message: "Class deleted successfully." });
  } catch (error) {
    console.error("Delete class error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
