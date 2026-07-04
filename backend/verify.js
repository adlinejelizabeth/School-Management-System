import assert from "assert";

const API_URL = "http://localhost:5001/api";

async function runTests() {
  console.log("🚀 Starting backend integration verification tests...");

  try {
    // 1. Login as Principal
    console.log("🔑 Logging in as Principal...");
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "principal@school.com", password: "principal123" })
    });
    
    assert.strictEqual(loginRes.status, 200, "Principal login failed");
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("✅ Principal login successful! Token received.");

    // Headers for authenticated principal requests
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };

    // 2. Create Class
    console.log("🏫 Creating class 10-A...");
    const classRes = await fetch(`${API_URL}/classes`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: "Class 10", division: "A" })
    });
    
    assert.ok(classRes.status === 201 || classRes.status === 400, "Class creation request failed");
    let classId;
    if (classRes.status === 201) {
      const classData = await classRes.json();
      classId = classData.id;
      console.log(`✅ Class 10-A created. ID: ${classId}`);
    } else {
      // If already exists, fetch the classes
      const fetchClassesRes = await fetch(`${API_URL}/classes`, { headers });
      const classes = await fetchClassesRes.json();
      const existing = classes.find(c => c.name === "Class 10" && c.division === "A");
      classId = existing.id;
      console.log(`ℹ️ Class 10-A already exists. ID: ${classId}`);
    }

    // 3. Get Teachers
    console.log("👥 Fetching teachers list...");
    const teachersRes = await fetch(`${API_URL}/teachers`, { headers });
    assert.strictEqual(teachersRes.status, 200, "Fetch teachers failed");
    const teachers = await teachersRes.json();
    const teacher = teachers.find(t => t.user.email === "teacher@school.com");
    assert.ok(teacher, "Seeded teacher not found");
    const teacherId = teacher.id;
    console.log(`✅ Seeded teacher found. Teacher ID: ${teacherId}`);

    // 4. Assign Class Teacher
    console.log("👤 Assigning class teacher...");
    const assignRes = await fetch(`${API_URL}/teachers/assign-class-teacher`, {
      method: "POST",
      headers,
      body: JSON.stringify({ teacherId, classId })
    });
    assert.strictEqual(assignRes.status, 200, "Assign class teacher failed");
    console.log("✅ Teacher assigned as class teacher for 10-A.");

    // 5. Create Timetable Slot
    console.log("📅 Scheduling timetable slot...");
    const slotRes = await fetch(`${API_URL}/timetables`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        classId,
        teacherId,
        dayOfWeek: "Monday",
        startTime: "09:00",
        endTime: "09:45",
        subject: "Mathematics"
      })
    });
    
    assert.ok(slotRes.status === 201 || slotRes.status === 400, "Timetable slot creation failed");
    if (slotRes.status === 201) {
      console.log("✅ Timetable slot scheduled successfully.");
    } else {
      const slotData = await slotRes.json();
      console.log(`ℹ️ Timetable slot skipped: ${slotData.error}`);
    }

    // 6. Generate Teacher's Timetable
    console.log("📋 Generating teacher's derived timetable...");
    const tTimetableRes = await fetch(`${API_URL}/teachers/${teacherId}/timetable`, { headers });
    assert.strictEqual(tTimetableRes.status, 200, "Fetch teacher timetable failed");
    const tTimetableData = await tTimetableRes.json();
    assert.ok(tTimetableData.slots.length > 0, "No slots found in generated teacher timetable");
    console.log(`✅ Teacher timetable successfully generated. Slots count: ${tTimetableData.slots.length}`);

    // 7. Login as Teacher
    console.log("🔑 Logging in as Teacher...");
    const tLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "teacher@school.com", password: "teacher123" })
    });
    
    assert.strictEqual(tLoginRes.status, 200, "Teacher login failed");
    const tLoginData = await tLoginRes.json();
    const tToken = tLoginData.token;
    const tHeaders = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${tToken}`
    };
    console.log("✅ Teacher login successful! Token received.");

    // 8. Create Student
    console.log("🧑‍🎓 Creating student records...");
    const studentRes = await fetch(`${API_URL}/students`, {
      method: "POST",
      headers: tHeaders,
      body: JSON.stringify({ name: "Jane Smith", rollNumber: "101", classId })
    });
    assert.strictEqual(studentRes.status, 201, "Student creation failed");
    const student = await studentRes.json();
    const studentId = student.id;
    console.log(`✅ Student Jane Smith created. ID: ${studentId}`);

    // 9. Mark Attendance
    console.log("📝 Logging student attendance...");
    const today = new Date().toISOString().split("T")[0];
    const attRes = await fetch(`${API_URL}/students/${studentId}/attendance`, {
      method: "POST",
      headers: tHeaders,
      body: JSON.stringify({ date: today, status: "PRESENT" })
    });
    assert.strictEqual(attRes.status, 200, "Attendance logging failed");
    console.log("✅ Attendance recorded.");

    // 10. Enter Student Marks
    console.log("📊 Entering student marks...");
    const markRes = await fetch(`${API_URL}/students/${studentId}/marks`, {
      method: "POST",
      headers: tHeaders,
      body: JSON.stringify({
        subject: "Mathematics",
        examName: "Midterm",
        marksObtained: 85,
        maxMarks: 100
      })
    });
    assert.strictEqual(markRes.status, 200, "Marks entry failed");
    console.log("✅ Marks entered successfully.");

    // 11. Fetch stats
    console.log("📈 Fetching class stats for graphs...");
    const statsRes = await fetch(`${API_URL}/students/class-stats/${classId}`, { headers: tHeaders });
    assert.strictEqual(statsRes.status, 200, "Stats fetch failed");
    const stats = await statsRes.json();
    assert.strictEqual(stats.studentCount, 1, "Student count mismatch in stats");
    assert.strictEqual(stats.averageAttendance, 100, "Attendance average mismatch in stats");
    console.log("✅ Class stats verified successfully.");

    console.log("\n🎉 ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n");
  } catch (err) {
    console.error("❌ Test verification failed with error:");
    console.error(err);
    process.exit(1);
  }
}

runTests();
