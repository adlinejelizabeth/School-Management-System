import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Modal } from "../components/Modal";
import { SvgChart } from "../components/SvgChart";
import { TeacherTimetable } from "../components/TeacherTimetable";
import * as XLSX from "xlsx";

export const TeacherDashboard = ({ user, showToast }) => {
  const [activeTab, setActiveTab] = useState("my-class");
  const [classes, setClasses] = useState([]);
  const [assignedClass, setAssignedClass] = useState(null);
  const [students, setStudents] = useState([]);
  
  // Detail selection states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState(null);

  // Timetable
  const [teacherTimetableSlots, setTeacherTimetableSlots] = useState([]);

  // Analytics stats
  const [classStats, setClassStats] = useState({ studentCount: 0, averageAttendance: 0, performanceData: [] });

  // Modal open states
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);

  // Form states
  const [studentName, setStudentName] = useState("");
  const [studentRoll, setStudentRoll] = useState("");
  const [targetClassId, setTargetClassId] = useState("");

  const [rollCallDate, setRollCallDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({}); // studentId -> status

  const [markStudentId, setMarkStudentId] = useState("");
  const [markSubject, setMarkSubject] = useState("");
  const [markExam, setMarkExam] = useState("");
  const [markObtained, setMarkObtained] = useState("");
  const [markMax, setMarkMax] = useState("");

  // Excel import states
  const [isExcelStudentModalOpen, setIsExcelStudentModalOpen] = useState(false);
  const [excelStudentsPreview, setExcelStudentsPreview] = useState([]);
  const [isExcelMarksModalOpen, setIsExcelMarksModalOpen] = useState(false);
  const [excelMarksPreview, setExcelMarksPreview] = useState([]);
  const [excelMarksSubject, setExcelMarksSubject] = useState("");
  const [excelMarksExam, setExcelMarksExam] = useState("Midterm");
  const [excelMarksMax, setExcelMarksMax] = useState("100");

  // Loading
  const [loading, setLoading] = useState(false);

  // Fetch initial setup
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch data depending on tab
  useEffect(() => {
    if (activeTab === "my-class" && assignedClass) {
      fetchStudents(assignedClass.id);
    } else if (activeTab === "attendance" && assignedClass) {
      fetchStudents(assignedClass.id);
    } else if (activeTab === "performance" && assignedClass) {
      fetchClassStats(assignedClass.id);
    } else if (activeTab === "timetable") {
      fetchTeacherTimetable();
    }
  }, [activeTab, assignedClass]);

  // Load detailed student data
  useEffect(() => {
    if (selectedStudent) {
      fetchStudentDetails(selectedStudent.id);
    }
  }, [selectedStudent]);

  const fetchInitialData = async () => {
    try {
      // 1. Fetch classes to find where the teacher is assigned
      const classList = await api.get("/classes");
      setClasses(classList);

      // Find if this teacher is a class teacher of any class
      const myClass = classList.find((c) => c.classTeacherId === user.teacherId);
      if (myClass) {
        setAssignedClass(myClass);
        setTargetClassId(myClass.id.toString());
        fetchStudents(myClass.id);
      }
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const fetchStudents = async (classId) => {
    try {
      const data = await api.get(`/students?classId=${classId}`);
      setStudents(data);
      
      // Initialize attendance records defaults for roll call
      const records = {};
      data.forEach((s) => {
        records[s.id] = "PRESENT";
      });
      setAttendanceRecords(records);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      const details = await api.get(`/students/${studentId}`);
      setStudentDetails(details);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const fetchClassStats = async (classId) => {
    try {
      const stats = await api.get(`/students/class-stats/${classId}`);
      setClassStats(stats);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const fetchTeacherTimetable = async () => {
    try {
      const data = await api.get(`/teachers/${user.teacherId}/timetable`);
      setTeacherTimetableSlots(data.slots);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  // Submit methods
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!studentName || !targetClassId) return;

    try {
      await api.post("/students", {
        name: studentName,
        rollNumber: studentRoll,
        classId: parseInt(targetClassId),
      });
      showToast("Student enrolled successfully!", "success");
      setIsStudentModalOpen(false);
      setStudentName("");
      setStudentRoll("");
      fetchStudents(parseInt(targetClassId));
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    if (students.length === 0) return;

    const recordsArray = Object.keys(attendanceRecords).map((id) => ({
      studentId: parseInt(id),
      status: attendanceRecords[id],
    }));

    try {
      await api.post("/students/class-attendance", {
        classId: assignedClass.id,
        date: rollCallDate,
        attendanceRecords: recordsArray,
      });
      showToast("Attendance sheet saved successfully!", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleOpenMarksModal = (student) => {
    setMarkStudentId(student.id.toString());
    setMarkSubject(user.teacherSubject || "Mathematics");
    setMarkExam("Midterm");
    setMarkObtained("");
    setMarkMax("100");
    setIsMarksModalOpen(true);
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!markStudentId || !markSubject || !markExam || !markObtained || !markMax) return;

    try {
      await api.post(`/students/${markStudentId}/marks`, {
        subject: markSubject,
        examName: markExam,
        marksObtained: parseFloat(markObtained),
        maxMarks: parseFloat(markMax),
      });
      showToast("Marks recorded successfully!", "success");
      setIsMarksModalOpen(false);
      if (selectedStudent && selectedStudent.id === parseInt(markStudentId)) {
        fetchStudentDetails(selectedStudent.id);
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleParseExcel = (file, type) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          showToast("The selected sheet is empty.", "error");
          return;
        }

        if (type === "students") {
          const mapped = jsonData.map((row) => {
            const keys = Object.keys(row);
            const nameKey = keys.find((k) => /name|student\s*name/i.test(k));
            const rollKey = keys.find((k) => /roll|roll\s*number|roll\s*no/i.test(k));

            return {
              name: nameKey ? row[nameKey]?.toString() || "" : "",
              rollNumber: rollKey ? row[rollKey]?.toString() || "" : "",
            };
          }).filter(s => s.name);

          setExcelStudentsPreview(mapped);
          showToast(`Parsed ${mapped.length} students from spreadsheet!`, "success");
        } else if (type === "marks") {
          const mapped = jsonData.map((row) => {
            const keys = Object.keys(row);
            const nameKey = keys.find((k) => /name|student\s*name/i.test(k));
            const rollKey = keys.find((k) => /roll|roll\s*number|roll\s*no/i.test(k));
            const marksKey = keys.find((k) => /mark|marks|marks\s*obtained|score/i.test(k));

            return {
              name: nameKey ? row[nameKey]?.toString() || "" : "",
              rollNumber: rollKey ? row[rollKey]?.toString() || "" : "",
              marksObtained: marksKey ? parseFloat(row[marksKey]) : null,
            };
          }).filter(m => m.rollNumber || m.name);

          setExcelMarksPreview(mapped);
          showToast(`Parsed ${mapped.length} marks records from spreadsheet!`, "success");
        }
      } catch (err) {
        showToast("Failed to parse file. Ensure it is a valid Excel/CSV file.", "error");
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExcelStudentUpload = async (e) => {
    e.preventDefault();
    if (excelStudentsPreview.length === 0) {
      showToast("No student records found to upload.", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/students/batch-students", {
        classId: parseInt(targetClassId),
        students: excelStudentsPreview
      });
      showToast(`Successfully imported ${excelStudentsPreview.length} students!`, "success");
      setIsExcelStudentModalOpen(false);
      setExcelStudentsPreview([]);
      fetchStudents(parseInt(targetClassId));
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExcelMarksUpload = async (e) => {
    e.preventDefault();
    if (excelMarksPreview.length === 0) {
      showToast("No marks records found to upload.", "error");
      return;
    }
    if (!excelMarksSubject || !excelMarksExam || !excelMarksMax) {
      showToast("Subject, exam category and max marks are required.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/students/batch-marks", {
        classId: assignedClass.id,
        subject: excelMarksSubject,
        examName: excelMarksExam,
        maxMarks: parseFloat(excelMarksMax),
        marksRecords: excelMarksPreview
      });
      showToast(`Marks upload complete: ${res.successCount} reconciled, ${res.failedCount} failed.`, "success");
      setIsExcelMarksModalOpen(false);
      setExcelMarksPreview([]);
      fetchStudents(assignedClass.id);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">T</div>
          <span className="logo-text">Teacher Portal</span>
        </div>
        <ul className="nav-links">
          <li className={`nav-item ${activeTab === "my-class" ? "active" : ""}`} onClick={() => { setActiveTab("my-class"); setSelectedStudent(null); }}>
            🎒 Class Registry
          </li>
          <li className={`nav-item ${activeTab === "attendance" ? "active" : ""}`} onClick={() => setActiveTab("attendance")}>
            📝 Daily Attendance
          </li>
          <li className={`nav-item ${activeTab === "performance" ? "active" : ""}`} onClick={() => setActiveTab("performance")}>
            📊 Class Performance
          </li>
          <li className={`nav-item ${activeTab === "timetable" ? "active" : ""}`} onClick={() => setActiveTab("timetable")}>
            📅 My Timetable
          </li>
        </ul>
        <div className="user-profile-section">
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.teacherSubject || "Specialist"} Teacher</span>
          </div>
          <button className="btn-logout" onClick={() => { localStorage.clear(); window.location.reload(); }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Teacher Dashboard</h1>
            <p className="page-subtitle">Logged in as {user.name}. Assigned Subject: {user.teacherSubject || "General"}</p>
          </div>
        </div>

        {/* Unassigned Warning if not a Class Teacher */}
        {!assignedClass && activeTab !== "timetable" && (
          <div className="glass-card text-danger" style={{ borderLeft: "4px solid var(--danger)", marginBottom: "24px" }}>
            <h3>⚠️ Administrative Alert</h3>
            <p style={{ marginTop: "4px", fontSize: "14px" }}>
              You are currently not assigned as a Class Teacher for any division. You can view your teaching timetable or consult the principal for class assignments.
            </p>
          </div>
        )}

        {/* Tabs Content */}

        {/* Class Registry Tab */}
        {activeTab === "my-class" && assignedClass && !selectedStudent && (
          <div className="glass-card">
            <div className="flex-between mb-4 flex-wrap" style={{ gap: "16px" }}>
              <div>
                <h2>Division {assignedClass.name} - {assignedClass.division} Students</h2>
                <p className="page-subtitle">Track individual student reports, log attendance, and record test marks.</p>
              </div>
              <div className="gap-sm" style={{ flexWrap: "wrap" }}>
                <button className="btn-secondary" onClick={() => { setExcelStudentsPreview([]); setIsExcelStudentModalOpen(true); }}>
                  📂 Import Students (Excel)
                </button>
                <button className="btn-secondary" onClick={() => { setExcelMarksPreview([]); setExcelMarksSubject(user.teacherSubject || "Mathematics"); setIsExcelMarksModalOpen(true); }}>
                  📊 Upload Marks (Excel)
                </button>
                <button className="btn-primary" onClick={() => setIsStudentModalOpen(true)}>+ Add Student</button>
              </div>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Roll No.</th>
                    <th>Student Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.rollNumber || "-"}</td>
                      <td><strong>{student.name}</strong></td>
                      <td>
                        <div className="gap-sm">
                          <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => setSelectedStudent(student)}>
                            👁️ View Profile
                          </button>
                          <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => handleOpenMarksModal(student)}>
                            📊 Enter Marks
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        No students enrolled in this division yet. Click "+ Add Student" to start onboarding.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Student Detailed Profile */}
        {activeTab === "my-class" && selectedStudent && studentDetails && (
          <div>
            <button className="btn-secondary mb-4" onClick={() => { setSelectedStudent(null); setStudentDetails(null); }}>
              ⬅️ Back to Registry
            </button>

            <div className="dashboard-grid">
              {/* Profile Details */}
              <div className="glass-card">
                <h2>{studentDetails.name}'s Profile</h2>
                <p className="page-subtitle">Roll Number: {studentDetails.rollNumber || "Not Set"} | Class: {studentDetails.class.name}-{studentDetails.class.division}</p>

                <div className="mt-6">
                  <h3 style={{ marginBottom: "12px" }}>Academic Test Marks</h3>
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Subject</th>
                          <th>Exam Type</th>
                          <th>Obtained Marks</th>
                          <th>Max Marks</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentDetails.marks?.map((m) => (
                          <tr key={m.id}>
                            <td><strong>{m.subject}</strong></td>
                            <td>{m.examName}</td>
                            <td>{m.marksObtained}</td>
                            <td>{m.maxMarks}</td>
                            <td>
                              <span style={{ fontWeight: "700", color: "var(--accent)" }}>
                                {Math.round((m.marksObtained / m.maxMarks) * 100)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(!studentDetails.marks || studentDetails.marks.length === 0) && (
                          <tr>
                            <td colSpan="5" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                              No marks registered for this student yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Attendance and Fees info */}
              <div className="glass-card">
                <h3>Attendance Logs</h3>
                <div className="table-container mt-4" style={{ maxHeight: "200px" }}>
                  <table className="custom-table" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentDetails.attendance?.map((att) => (
                        <tr key={att.id}>
                          <td>{att.date}</td>
                          <td>
                            <span className={`badge ${att.status === "PRESENT" ? "badge-success" : att.status === "LATE" ? "badge-warning" : "badge-danger"}`}>
                              {att.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!studentDetails.attendance || studentDetails.attendance.length === 0) && (
                        <tr>
                          <td colSpan="2" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                            No attendance history logged.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <h3 className="mt-6">Outstanding Invoices</h3>
                <div className="table-container mt-4">
                  <table className="custom-table" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th>Term</th>
                        <th>Amount</th>
                        <th>Due Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentDetails.fees?.map((fee) => (
                        <tr key={fee.id}>
                          <td>{fee.term}</td>
                          <td>${fee.amount}</td>
                          <td>{fee.dueDate}</td>
                          <td>
                            <span className={`badge ${fee.status === "PAID" ? "badge-success" : "badge-danger"}`}>
                              {fee.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!studentDetails.fees || studentDetails.fees.length === 0) && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                            No invoices generated.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Attendance Roll Call Tab */}
        {activeTab === "attendance" && assignedClass && (
          <div className="glass-card">
            <div className="flex-between mb-4">
              <div>
                <h2>Daily Roll Call Sheet</h2>
                <p className="page-subtitle">Submit daily records for division {assignedClass.name} - {assignedClass.division}</p>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <input
                  type="date"
                  className="form-input"
                  value={rollCallDate}
                  onChange={(e) => setRollCallDate(e.target.value)}
                  style={{ maxWidth: "200px" }}
                />
              </div>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Roll No.</th>
                    <th>Student Name</th>
                    <th>Attendance Roll Call Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.rollNumber || "-"}</td>
                      <td><strong>{student.name}</strong></td>
                      <td>
                        <div style={{ display: "flex", gap: "20px" }}>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                            <input
                              type="radio"
                              name={`attendance-${student.id}`}
                              value="PRESENT"
                              checked={attendanceRecords[student.id] === "PRESENT"}
                              onChange={() => handleAttendanceChange(student.id, "PRESENT")}
                            />
                            🟢 Present
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                            <input
                              type="radio"
                              name={`attendance-${student.id}`}
                              value="ABSENT"
                              checked={attendanceRecords[student.id] === "ABSENT"}
                              onChange={() => handleAttendanceChange(student.id, "ABSENT")}
                            />
                            🔴 Absent
                          </label>
                          <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "13px" }}>
                            <input
                              type="radio"
                              name={`attendance-${student.id}`}
                              value="LATE"
                              checked={attendanceRecords[student.id] === "LATE"}
                              onChange={() => handleAttendanceChange(student.id, "LATE")}
                            />
                            🟡 Late
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        No student directory loaded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {students.length > 0 && (
              <div className="flex-between">
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  💡 Make sure to review selections before saving the logs.
                </span>
                <button className="btn-primary" onClick={handleSaveAttendance}>
                  💾 Save Daily Roll Call
                </button>
              </div>
            )}
          </div>
        )}

        {/* Class Performance/Analytics Tab */}
        {activeTab === "performance" && assignedClass && (
          <div className="glass-card">
            <h2>Academic Performance Metrics ({assignedClass.name} - {assignedClass.division})</h2>
            <p className="page-subtitle" style={{ marginBottom: "32px" }}>
              Dynamic performance tracking from test grades and student records.
            </p>

            <div className="dashboard-grid">
              <div className="glass-card" style={{ background: "rgba(0,0,0,0.2)" }}>
                <h3>Average Class Marks</h3>
                <p className="page-subtitle" style={{ marginBottom: "20px" }}>By subject and exam categories</p>
                <SvgChart data={classStats.performanceData} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div className="glass-card">
                  <div className="stat-desc">📈 Average Class Attendance</div>
                  <div className="stat-value">{classStats.averageAttendance}%</div>
                  <div className="stat-desc" style={{ marginTop: "4px" }}>Computed across all logged history dates.</div>
                </div>
                <div className="glass-card">
                  <div className="stat-desc">🎒 Total Students enrolled</div>
                  <div className="stat-value">{classStats.studentCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Timetable Tab */}
        {activeTab === "timetable" && (
          <div className="glass-card">
            <h2>My Teaching Schedule</h2>
            <p className="page-subtitle" style={{ marginBottom: "24px" }}>
              Derived from the general class timetables configured by the Principal.
            </p>
            <TeacherTimetable slots={teacherTimetableSlots} />
          </div>
        )}

        {/* MODALS SECTION */}

        {/* Add Student Modal */}
        <Modal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} title="Enroll Student">
          <form onSubmit={handleAddStudent}>
            <div className="form-group">
              <label className="form-label">Full Student Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Jane Doe"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Roll Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 101, 102"
                value={studentRoll}
                onChange={(e) => setStudentRoll(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Assigned Room</label>
              <select className="form-select" value={targetClassId} disabled required>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.division}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "10px" }}>
              Approve Enrollment
            </button>
          </form>
        </Modal>

        {/* Log Test Marks Modal */}
        <Modal isOpen={isMarksModalOpen} onClose={() => setIsMarksModalOpen(false)} title="Log Test Grades">
          <form onSubmit={handleSaveMarks}>
            <div className="form-group">
              <label className="form-label">Selected Subject</label>
              <input
                type="text"
                className="form-input"
                value={markSubject}
                onChange={(e) => setMarkSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Exam Category</label>
              <select className="form-select" value={markExam} onChange={(e) => setMarkExam(e.target.value)} required>
                <option value="Quarterly">Quarterly Examination</option>
                <option value="Midterm">Midterm Examination</option>
                <option value="Final">Final Examination</option>
                <option value="Unit Test">Weekly Unit Test</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="form-group">
                <label className="form-label">Marks Obtained</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="85"
                  value={markObtained}
                  onChange={(e) => setMarkObtained(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Maximum Mark</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="100"
                  value={markMax}
                  onChange={(e) => setMarkMax(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "10px" }}>
              Save Academic Entry
            </button>
          </form>
        </Modal>

        {/* Excel Import Students Modal */}
        <Modal isOpen={isExcelStudentModalOpen} onClose={() => setIsExcelStudentModalOpen(false)} title="Import Students from Excel">
          <form onSubmit={handleExcelStudentUpload}>
            <div className="form-group" style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "8px", border: "1px dashed var(--glass-border)" }}>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                📋 **Expected Excel Columns:**
              </p>
              <ul style={{ fontSize: "11px", color: "var(--text-secondary)", paddingLeft: "16px", lineHeight: "1.6" }}>
                <li><strong>Student Name</strong> (e.g. "Name", "Student Name")</li>
                <li><strong>Roll Number</strong> (optional, e.g. "Roll Number", "RollNo")</li>
              </ul>
            </div>

            <div className="form-group">
              <label className="form-label">Select Spreadsheet File (.xlsx, .xls, .csv)</label>
              <input
                type="file"
                className="form-input"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleParseExcel(file, "students");
                }}
                required
              />
            </div>

            {excelStudentsPreview.length > 0 && (
              <div className="form-group">
                <label className="form-label">Data Preview ({excelStudentsPreview.length} records parsed)</label>
                <div className="table-container" style={{ maxHeight: "150px", overflowY: "auto", fontSize: "12px" }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Roll No.</th>
                        <th>Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelStudentsPreview.slice(0, 5).map((s, idx) => (
                        <tr key={idx}>
                          <td>{s.rollNumber || "-"}</td>
                          <td><strong>{s.name}</strong></td>
                        </tr>
                      ))}
                      {excelStudentsPreview.length > 5 && (
                        <tr>
                          <td colSpan="2" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                            ... and {excelStudentsPreview.length - 5} more records.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={loading || excelStudentsPreview.length === 0}>
              {loading ? "Importing..." : `Import ${excelStudentsPreview.length} Students`}
            </button>
          </form>
        </Modal>

        {/* Excel Import Marks Modal */}
        <Modal isOpen={isExcelMarksModalOpen} onClose={() => setIsExcelMarksModalOpen(false)} title="Upload Class Marks (Excel)">
          <form onSubmit={handleExcelMarksUpload}>
            <div className="form-group" style={{ background: "rgba(0,0,0,0.2)", padding: "16px", borderRadius: "8px", border: "1px dashed var(--glass-border)" }}>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                📋 **Expected Excel Columns:**
              </p>
              <ul style={{ fontSize: "11px", color: "var(--text-secondary)", paddingLeft: "16px", lineHeight: "1.6" }}>
                <li><strong>Student Name</strong> or <strong>Roll Number</strong> (used to match student profiles in this class)</li>
                <li><strong>Marks Obtained</strong> (e.g. "Marks", "Score", "Marks Obtained")</li>
              </ul>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  className="form-input"
                  value={excelMarksSubject}
                  onChange={(e) => setExcelMarksSubject(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Maximum Mark</label>
                <input
                  type="number"
                  className="form-input"
                  value={excelMarksMax}
                  onChange={(e) => setExcelMarksMax(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Exam Category</label>
              <select className="form-select" value={excelMarksExam} onChange={(e) => setExcelMarksExam(e.target.value)} required>
                <option value="Quarterly">Quarterly Examination</option>
                <option value="Midterm">Midterm Examination</option>
                <option value="Final">Final Examination</option>
                <option value="Unit Test">Weekly Unit Test</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Spreadsheet File (.xlsx, .xls, .csv)</label>
              <input
                type="file"
                className="form-input"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleParseExcel(file, "marks");
                }}
                required
              />
            </div>

            {excelMarksPreview.length > 0 && (
              <div className="form-group">
                <label className="form-label">Data Preview ({excelMarksPreview.length} records parsed)</label>
                <div className="table-container" style={{ maxHeight: "150px", overflowY: "auto", fontSize: "12px" }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Matched Identifiers</th>
                        <th>Marks Obtained</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelMarksPreview.slice(0, 5).map((m, idx) => (
                        <tr key={idx}>
                          <td>
                            {m.rollNumber ? `Roll: ${m.rollNumber}` : ""} {m.name ? `Name: ${m.name}` : ""}
                          </td>
                          <td><strong>{m.marksObtained !== null ? m.marksObtained : "N/A"}</strong></td>
                        </tr>
                      ))}
                      {excelMarksPreview.length > 5 && (
                        <tr>
                          <td colSpan="2" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                            ... and {excelMarksPreview.length - 5} more records.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "10px" }} disabled={loading || excelMarksPreview.length === 0}>
              {loading ? "Uploading..." : `Upload Marks for ${excelMarksPreview.length} Students`}
            </button>
          </form>
        </Modal>

      </main>
    </div>
  );
};
export default TeacherDashboard;
