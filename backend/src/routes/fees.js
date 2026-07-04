import express from "express";
import prisma from "../db.js";
import { authenticateToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Get fee details for all students (filterable by classId or payment status)
router.get("/", authenticateToken, async (req, res) => {
  const { classId, status } = req.query;
  try {
    const filter = {};
    if (classId) {
      filter.student = { classId: parseInt(classId) };
    }
    if (status) {
      filter.status = status.toUpperCase();
    }

    const fees = await prisma.fee.findMany({
      where: filter,
      include: {
        student: {
          include: {
            class: true
          }
        }
      },
      orderBy: [
        { dueDate: "asc" },
        { student: { name: "asc" } }
      ]
    });
    res.json(fees);
  } catch (error) {
    console.error("Fetch fees error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Charge class fees (Principal only)
// Creates a new fee record for every student currently enrolled in that class
router.post("/charge-class", authenticateToken, requireRole("PRINCIPAL"), async (req, res) => {
  const { classId, term, amount, dueDate } = req.body;

  if (!classId || !term || !amount || !dueDate) {
    return res.status(400).json({ error: "classId, term, amount, and dueDate are required." });
  }

  try {
    // Fetch all students in class
    const students = await prisma.student.findMany({
      where: { classId: parseInt(classId) }
    });

    if (students.length === 0) {
      return res.status(400).json({ error: "No students found in the target class to charge fees." });
    }

    const feeCharges = students.map(student => {
      return prisma.fee.create({
        data: {
          studentId: student.id,
          term: term.trim(),
          amount: parseFloat(amount),
          dueDate: dueDate.trim(),
          status: "UNPAID"
        }
      });
    });

    await Promise.all(feeCharges);
    res.status(201).json({ message: `Successfully charged fees to ${students.length} students.` });
  } catch (error) {
    console.error("Charge class fee error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Update fee status / Log payment
router.post("/pay/:feeId", authenticateToken, async (req, res) => {
  const { feeId } = req.params;
  const { status, paidDate } = req.body; // status "PAID" or "UNPAID"

  if (!status) {
    return res.status(400).json({ error: "Payment status is required." });
  }

  try {
    const updatedFee = await prisma.fee.update({
      where: { id: parseInt(feeId) },
      data: {
        status: status.toUpperCase(),
        paidDate: status.toUpperCase() === "PAID" ? (paidDate || new Date().toISOString().split("T")[0]) : null
      },
      include: {
        student: true
      }
    });

    res.json({
      message: "Payment logged successfully.",
      fee: updatedFee
    });
  } catch (error) {
    console.error("Update fee payment error:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
