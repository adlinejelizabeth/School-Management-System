import React, { useState, useEffect } from "react";
import { api } from "../utils/api";
import { Modal } from "../components/Modal";
import { ClassTimetable } from "../components/ClassTimetable";
import { TeacherTimetable } from "../components/TeacherTimetable";

export const PrincipalDashboard = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState("classes");
  
  // Data lists
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [fees, setFees] = useState([]);
  
  // Detail selection states
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  
  // Timetables
  const [classTimetableSlots, setClassTimetableSlots] = useState([]);
  const [teacherTimetableSlots, setTeacherTimetableSlots] = useState([]);

  // Modal open states
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isAssignTeacherModalOpen, setIsAssignTeacherModalOpen] = useState(false);
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);

  // Form states
  const [newClassName, setNewClassName] = useState("");
  const [newClassDiv, setNewClassDiv] = useState("");

  const [tName, setTName] = useState("");
  const [tEmail, setTEmail] = useState("");
  const [tPassword, setTPassword] = useState("");
  const [tPhone, setTPhone] = useState("");
  const [tSubject, setTSubject] = useState("");

  const [assignClassId, setAssignClassId] = useState("");
  const [assignTeacherId, setAssignTeacherId] = useState("");

  const [slotDay, setSlotDay] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [slotSubject, setSlotSubject] = useState("");
  const [slotTeacherId, setSlotTeacherId] = useState("");

  const [feeClassId, setFeeClassId] = useState("");
  const [feeTerm, setFeeTerm] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  const [feeDueDate, setFeeDueDate] = useState("");

  // Loading indicator states
  const [loading, setLoading] = useState(false);

  // Load baseline data on mount / tab switch
  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchFees();
  }, [activeTab]);

  // Load detailed timetable when selectedClass changes
  useEffect(() => {
    if (selectedClass) {
      fetchClassTimetable(selectedClass.id);
    }
  }, [selectedClass]);

  // Load detailed teacher timetable when selectedTeacher changes
  useEffect(() => {
    if (selectedTeacher) {
      fetchTeacherTimetable(selectedTeacher.id);
    }
  }, [selectedTeacher]);

  const fetchClasses = async () => {
    try {
      const data = await api.get("/classes");
      setClasses(data);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const fetchTeachers = async () => {
    try {
      const data = await api.get("/teachers");
      setTeachers(data);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const fetchFees = async () => {
    try {
      const data = await api.get("/fees");
      setFees(data);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const fetchClassTimetable = async (classId) => {
    try {
      const slots = await api.get(`/timetables/class/${classId}`);
      setClassTimetableSlots(slots);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const fetchTeacherTimetable = async (teacherId) => {
    try {
      const data = await api.get(`/teachers/${teacherId}/timetable`);
      setTeacherTimetableSlots(data.slots);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  // Submit handlers
  const handleCreateClass = async (e) => {
    e.preventDefault();
    if (!newClassName || !newClassDiv) return;
    try {
      await api.post("/classes", { name: newClassName, division: newClassDiv });
      showToast("Class created successfully!", "success");
      setIsClassModalOpen(false);
      setNewClassName("");
      setNewClassDiv("");
      fetchClasses();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleOnboardTeacher = async (e) => {
    e.preventDefault();
    if (!tName || !tEmail || !tPassword) return;
    try {
      await api.post("/teachers", {
        name: tName,
        email: tEmail,
        password: tPassword,
        phone: tPhone,
        subject: tSubject
      });
      showToast("Teacher onboarded successfully!", "success");
      setIsTeacherModalOpen(false);
      setTName("");
      setTEmail("");
      setTPassword("");
      setTPhone("");
      setTSubject("");
      fetchTeachers();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleAssignTeacher = async (e) => {
    e.preventDefault();
    if (!assignClassId) return;
    try {
      // API expects teacherId (number or null) and classId (number)
      await api.post("/teachers/assign-class-teacher", {
        classId: parseInt(assignClassId),
        teacherId: assignTeacherId ? parseInt(assignTeacherId) : null
      });
      showToast("Class teacher assigned successfully!", "success");
      setIsAssignTeacherModalOpen(false);
      setAssignClassId("");
      setAssignTeacherId("");
      fetchClasses();
      fetchTeachers();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleOpenAddTimetableSlot = (day, start, end) => {
    setSlotDay(day);
    setSlotStart(start);
    setSlotEnd(end);
    setSlotSubject("");
    setSlotTeacherId(teachers.length > 0 ? teachers[0].id.toString() : "");
    setIsTimetableModalOpen(true);
  };

  const handleSaveTimetableSlot = async (e) => {
    e.preventDefault();
    if (!slotSubject || !slotTeacherId) {
      showToast("Please choose subject and teacher", "error");
      return;
    }

    try {
      await api.post("/timetables", {
        classId: selectedClass.id,
        teacherId: parseInt(slotTeacherId),
        dayOfWeek: slotDay,
        startTime: slotStart,
        endTime: slotEnd,
        subject: slotSubject
      });
      showToast("Timetable slot scheduled!", "success");
      setIsTimetableModalOpen(false);
      fetchClassTimetable(selectedClass.id);
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleDeleteTimetableSlot = async (slotId) => {
    if (!window.confirm("Are you sure you want to delete this schedule period?")) return;
    try {
      await api.delete(`/timetables/${slotId}`);
      showToast("Timetable slot deleted.", "success");
      fetchClassTimetable(selectedClass.id);
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleChargeFees = async (e) => {
    e.preventDefault();
    if (!feeClassId || !feeTerm || !feeAmount || !feeDueDate) return;
    try {
      await api.post("/fees/charge-class", {
        classId: parseInt(feeClassId),
        term: feeTerm,
        amount: parseFloat(feeAmount),
        dueDate: feeDueDate
      });
      showToast("Fees generated for all students in the class!", "success");
      setIsFeeModalOpen(false);
      setFeeClassId("");
      setFeeTerm("");
      setFeeAmount("");
      setFeeDueDate("");
      fetchFees();
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  const handleLogPayment = async (feeId) => {
    try {
      await api.post(`/fees/pay/${feeId}`, { status: "PAID" });
      showToast("Payment status marked as PAID", "success");
      fetchFees();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  // Calculate generic dashboard stats
  const totalClasses = classes.length;
  const totalTeachers = teachers.length;
  const totalStudentsCount = classes.reduce((sum, c) => sum + (c._count?.students || 0), 0);
  const paidFeesCount = fees.filter(f => f.status === "PAID").reduce((sum, f) => sum + f.amount, 0);
  const totalFeesCount = fees.reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="app-container">
      {/* Sidebar navigation */}
      <aside className="sidebar">
        <div className="logo-container">
          <div className="logo-icon">P</div>
          <span className="logo-text">Principal Portal</span>
        </div>
        <ul className="nav-links">
          <li className={`nav-item ${activeTab === "classes" ? "active" : ""}`} onClick={() => { setActiveTab("classes"); setSelectedClass(null); }}>
            🏫 Classes & Divisions
          </li>
          <li className={`nav-item ${activeTab === "teachers" ? "active" : ""}`} onClick={() => { setActiveTab("teachers"); setSelectedTeacher(null); }}>
            👨‍🏫 Teachers Directory
          </li>
          <li className={`nav-item ${activeTab === "timetable" ? "active" : ""}`} onClick={() => setActiveTab("timetable")}>
            📅 Timetables Editor
          </li>
          <li className={`nav-item ${activeTab === "fees" ? "active" : ""}`} onClick={() => setActiveTab("fees")}>
            💰 Fees & Billing
          </li>
        </ul>
        <div className="user-profile-section">
          <div className="user-info">
            <span className="user-name">Dr. Sarah Jenkins</span>
            <span className="user-role">Principal</span>
          </div>
          <button className="btn-logout" onClick={() => { localStorage.clear(); window.location.reload(); }}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content body */}
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">School Management Control Center</h1>
            <p className="page-subtitle">Configure schedules, billing, class records, and teachers directory</p>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <section className="stats-grid">
          <div className="glass-card">
            <div className="stat-desc">👩‍🎓 Total Classes</div>
            <div className="stat-value">{totalClasses}</div>
          </div>
          <div className="glass-card">
            <div className="stat-desc">👨‍🏫 Active Teachers</div>
            <div className="stat-value">{totalTeachers}</div>
          </div>
          <div className="glass-card">
            <div className="stat-desc">🎒 Enrolled Students</div>
            <div className="stat-value">{totalStudentsCount}</div>
          </div>
          <div className="glass-card">
            <div className="stat-desc">💳 Fees Collected</div>
            <div className="stat-value">${paidFeesCount} / ${totalFeesCount}</div>
          </div>
        </section>

        {/* Dynamic Panels */}
        
        {/* Classes Tab */}
        {activeTab === "classes" && !selectedClass && (
          <div className="glass-card">
            <div className="flex-between mb-4">
              <h2>Classes & Divisions List</h2>
              <button className="btn-primary" onClick={() => setIsClassModalOpen(true)}>+ Create Class</button>
            </div>
            
            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Class / Division</th>
                    <th>Class Teacher</th>
                    <th>Total Students</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {classes.map((cls) => (
                    <tr key={cls.id}>
                      <td><strong style={{ color: "var(--accent)" }}>{cls.name} - {cls.division}</strong></td>
                      <td>{cls.classTeacher?.user?.name || <em style={{ color: "var(--text-secondary)" }}>Not Assigned</em>}</td>
                      <td>{cls._count?.students || 0}</td>
                      <td>
                        <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => setSelectedClass(cls)}>
                          👁️ View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {classes.length === 0 && (
                    <tr>
                      <td colSpan="4" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        No classes configured yet. Click "+ Create Class" to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Class Details View */}
        {activeTab === "classes" && selectedClass && (
          <div>
            <button className="btn-secondary mb-4" onClick={() => setSelectedClass(null)}>⬅️ Back to classes</button>
            
            <div className="dashboard-grid">
              {/* Class roster */}
              <div className="glass-card">
                <h2>{selectedClass.name} - {selectedClass.division} Student Roster</h2>
                <p className="page-subtitle" style={{ marginBottom: "20px" }}>
                  Class Teacher: {selectedClass.classTeacher?.user?.name || "None"}
                </p>
                
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Roll No.</th>
                        <th>Student Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedClass.students?.map((s) => (
                        <tr key={s.id}>
                          <td>{s.rollNumber || "-"}</td>
                          <td><strong>{s.name}</strong></td>
                        </tr>
                      )) || []}
                      {(!selectedClass.students || selectedClass.students.length === 0) && (
                        <tr>
                          <td colSpan="2" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                            No students registered in this class.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Class timetable summary */}
              <div className="glass-card">
                <h3>Weekly Timetable</h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "15px" }}>
                  Schedules grid configuration. Go to the "Timetables Editor" tab to adjust slots.
                </p>
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {classTimetableSlots.map((slot) => (
                    <div
                      key={slot.id}
                      style={{
                        padding: "10px",
                        borderBottom: "1px solid var(--glass-border)",
                        fontSize: "13px",
                      }}
                    >
                      <div className="flex-between">
                        <strong>{slot.subject}</strong>
                        <span style={{ color: "var(--accent)", fontSize: "11px" }}>{slot.dayOfWeek}</span>
                      </div>
                      <div style={{ color: "var(--text-secondary)", fontSize: "11px", marginTop: "4px" }}>
                        ⏱️ {slot.startTime} - {slot.endTime} | 👤 {slot.teacher?.user?.name}
                      </div>
                    </div>
                  ))}
                  {classTimetableSlots.length === 0 && (
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No scheduled classes.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Teachers Tab */}
        {activeTab === "teachers" && !selectedTeacher && (
          <div className="glass-card">
            <div className="flex-between mb-4">
              <h2>Teachers Directory</h2>
              <div className="gap-sm">
                <button className="btn-secondary" onClick={() => setIsAssignTeacherModalOpen(true)}>👤 Assign Class Teacher</button>
                <button className="btn-primary" onClick={() => setIsTeacherModalOpen(true)}>+ Onboard Teacher</button>
              </div>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Teacher Name</th>
                    <th>Email Address</th>
                    <th>Phone Number</th>
                    <th>Subject Specialty</th>
                    <th>Class Teacher Duty</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id}>
                      <td><strong>{t.user.name}</strong></td>
                      <td>{t.user.email}</td>
                      <td>{t.phone || "-"}</td>
                      <td><span className="badge badge-info">{t.subject || "General"}</span></td>
                      <td>
                        {t.classTeacherOf ? (
                          <span className="badge badge-success">{t.classTeacherOf.name} - {t.classTeacherOf.division}</span>
                        ) : (
                          <span className="badge badge-warning">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => setSelectedTeacher(t)}>
                          📅 Generated Timetable
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teacher Timetable details view */}
        {activeTab === "teachers" && selectedTeacher && (
          <div>
            <button className="btn-secondary mb-4" onClick={() => setSelectedTeacher(null)}>⬅️ Back to teachers list</button>
            <div className="glass-card">
              <h2>Derived Timetable for {selectedTeacher.user.name}</h2>
              <p className="page-subtitle" style={{ marginBottom: "24px" }}>
                Auto-generated by mapping all scheduled slots containing this teacher.
              </p>
              <TeacherTimetable slots={teacherTimetableSlots} />
            </div>
          </div>
        )}

        {/* Timetables Editor Tab */}
        {activeTab === "timetable" && (
          <div className="glass-card">
            <h2>Timetables Builder Grid</h2>
            <p className="page-subtitle" style={{ marginBottom: "24px" }}>
              Select a class and click "+" on the table cells to insert schedules. Back-end resolves conflicts instantly.
            </p>
            
            <div className="form-group" style={{ maxWidth: "300px", marginBottom: "24px" }}>
              <label className="form-label">Select Target Class</label>
              <select
                className="form-select"
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) {
                    const match = classes.find(c => c.id === parseInt(id));
                    setSelectedClass(match);
                  } else {
                    setSelectedClass(null);
                  }
                }}
                value={selectedClass ? selectedClass.id : ""}
              >
                <option value="">-- Choose Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.division}</option>
                ))}
              </select>
            </div>

            {selectedClass ? (
              <div>
                <h3 style={{ marginBottom: "16px" }}>Scheduling Grid for {selectedClass.name} - {selectedClass.division}</h3>
                <ClassTimetable
                  slots={classTimetableSlots}
                  isEditable={true}
                  onAddSlot={handleOpenAddTimetableSlot}
                  onDeleteSlot={handleDeleteTimetableSlot}
                />
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", border: "1px dashed var(--glass-border)", borderRadius: "8px" }}>
                Please select a class to load the scheduler grid.
              </div>
            )}
          </div>
        )}

        {/* Fees Tab */}
        {activeTab === "fees" && (
          <div className="glass-card">
            <div className="flex-between mb-4">
              <h2>Billing & Fees Tracker</h2>
              <button className="btn-primary" onClick={() => setIsFeeModalOpen(true)}>💰 Charge Class Fees</button>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Term Description</th>
                    <th>Billing Amount</th>
                    <th>Due Date</th>
                    <th>Payment Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee) => (
                    <tr key={fee.id}>
                      <td><strong>{fee.student.name}</strong></td>
                      <td>{fee.student.class.name} - {fee.student.class.division}</td>
                      <td>{fee.term}</td>
                      <td>${fee.amount}</td>
                      <td>{fee.dueDate}</td>
                      <td>
                        {fee.status === "PAID" ? (
                          <span className="badge badge-success">PAID</span>
                        ) : (
                          <span className="badge badge-danger">UNPAID</span>
                        )}
                      </td>
                      <td>
                        {fee.status !== "PAID" && (
                          <button className="btn-success" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => handleLogPayment(fee.id)}>
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {fees.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                        No billing logs registered. Click "Charge Class Fees" to allocate fees.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODALS SECTION */}

        {/* Create Class Modal */}
        <Modal isOpen={isClassModalOpen} onClose={() => setIsClassModalOpen(false)} title="Create New Class">
          <form onSubmit={handleCreateClass}>
            <div className="form-group">
              <label className="form-label">Class Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Class 10, Class 9"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Division / Section</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. A, B, C"
                value={newClassDiv}
                onChange={(e) => setNewClassDiv(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "10px" }}>
              Create Class Room
            </button>
          </form>
        </Modal>

        {/* Onboard Teacher Modal */}
        <Modal isOpen={isTeacherModalOpen} onClose={() => setIsTeacherModalOpen(false)} title="Onboard Teacher Account">
          <form onSubmit={handleOnboardTeacher}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Mr. Robert Smith"
                value={tName}
                onChange={(e) => setTName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="teacher@school.com"
                value={tEmail}
                onChange={(e) => setTEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Assign password"
                value={tPassword}
                onChange={(e) => setTPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="123-456-7890"
                value={tPhone}
                onChange={(e) => setTPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Subject Specialty</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Science, History"
                value={tSubject}
                onChange={(e) => setTSubject(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "10px" }}>
              Onboard Teacher
            </button>
          </form>
        </Modal>

        {/* Assign Class Teacher Modal */}
        <Modal isOpen={isAssignTeacherModalOpen} onClose={() => setIsAssignTeacherModalOpen(false)} title="Assign Class Teacher">
          <form onSubmit={handleAssignTeacher}>
            <div className="form-group">
              <label className="form-label">Select Class ROOM</label>
              <select className="form-select" value={assignClassId} onChange={(e) => setAssignClassId(e.target.value)} required>
                <option value="">-- Choose Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.division}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Class Teacher</label>
              <select className="form-select" value={assignTeacherId} onChange={(e) => setAssignTeacherId(e.target.value)}>
                <option value="">-- Choose Teacher (Or Unassign) --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.user.name} ({t.subject || "General"})</option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "10px" }}>
              Save Assignment
            </button>
          </form>
        </Modal>

        {/* Add Timetable Slot Modal */}
        <Modal isOpen={isTimetableModalOpen} onClose={() => setIsTimetableModalOpen(false)} title="Schedule Lecture Slot">
          <form onSubmit={handleSaveTimetableSlot}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div className="form-group">
                <label className="form-label">Day of Week</label>
                <input type="text" className="form-input" value={slotDay} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Time Frame</label>
                <input type="text" className="form-input" value={`${slotStart} - ${slotEnd}`} disabled />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subject Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Geometry, Biology"
                value={slotSubject}
                onChange={(e) => setSlotSubject(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Lecturer / Teacher</label>
              <select className="form-select" value={slotTeacherId} onChange={(e) => setSlotTeacherId(e.target.value)} required>
                <option value="">-- Choose Teacher --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.user.name} ({t.subject || "General"})</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "10px" }}>
              Verify Schedule & Insert Slot
            </button>
          </form>
        </Modal>

        {/* Charge Class Fees Modal */}
        <Modal isOpen={isFeeModalOpen} onClose={() => setIsFeeModalOpen(false)} title="Generate Class Fees">
          <form onSubmit={handleChargeFees}>
            <div className="form-group">
              <label className="form-label">Target Class</label>
              <select className="form-select" value={feeClassId} onChange={(e) => setFeeClassId(e.target.value)} required>
                <option value="">-- Choose Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.division}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">Fee Term Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Tuition Fee Term 1, Annual Library Fee"
                value={feeTerm}
                onChange={(e) => setFeeTerm(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Billing Amount ($)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="250.00"
                value={feeAmount}
                onChange={(e) => setFeeAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-input"
                value={feeDueDate}
                onChange={(e) => setFeeDueDate(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ width: "100%", marginTop: "10px" }}>
              Approve Bill Allocation
            </button>
          </form>
        </Modal>

      </main>
    </div>
  );
};
export default PrincipalDashboard;
