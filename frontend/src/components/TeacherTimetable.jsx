import React from "react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const PERIODS = [
  { name: "Period 1", start: "09:00", end: "09:45" },
  { name: "Period 2", start: "09:45", end: "10:30" },
  { name: "Period 3", start: "10:30", end: "11:15" },
  { name: "Period 4", start: "11:30", end: "12:15" },
  { name: "Period 5", start: "12:15", end: "13:00" },
  { name: "Period 6", start: "14:00", end: "14:45" },
  { name: "Period 7", start: "14:45", end: "15:30" }
];

export const TeacherTimetable = ({ slots }) => {
  const getSlot = (day, period) => {
    return slots.find(
      (s) =>
        s.dayOfWeek.toLowerCase() === day.toLowerCase() &&
        s.startTime === period.start &&
        s.endTime === period.end
    );
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="custom-table" style={{ borderCollapse: "separate", borderSpacing: "4px", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ width: "120px", background: "rgba(0,0,0,0.4)" }}>Time / Period</th>
            {DAYS.map((day) => (
              <th key={day} style={{ textAlign: "center", background: "rgba(0,0,0,0.4)" }}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIODS.map((period) => (
            <tr key={period.name}>
              {/* Time display */}
              <td
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  fontWeight: "bold",
                  fontSize: "12px",
                  textAlign: "center",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "8px",
                }}
              >
                <div>{period.name}</div>
                <div style={{ color: "var(--text-secondary)", fontSize: "10px", marginTop: "2px" }}>
                  {period.start} - {period.end}
                </div>
              </td>

              {DAYS.map((day) => {
                const slot = getSlot(day, period);
                return (
                  <td
                    key={day}
                    style={{
                      padding: "4px",
                      verticalAlign: "middle",
                      height: "80px",
                      width: "calc((100% - 120px) / 5)",
                    }}
                  >
                    {slot ? (
                      <div
                        className="timetable-slot-cell"
                        style={{
                          margin: 0,
                          height: "100%",
                          padding: "10px",
                          background: "rgba(6, 182, 212, 0.15)",
                          border: "1px dashed rgba(6, 182, 212, 0.4)",
                          borderRadius: "8px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <div className="timetable-slot-title" style={{ color: "#22d3ee" }}>
                          {slot.subject}
                        </div>
                        <div className="timetable-slot-desc" style={{ color: "var(--text-primary)", fontWeight: "600" }}>
                          🏫 {slot.className}
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(255,255,255,0.02)",
                          borderRadius: "8px",
                          background: "rgba(255,255,255,0.005)",
                        }}
                      >
                        <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>Free</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default TeacherTimetable;
