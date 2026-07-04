import React, { useState } from "react";

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

export const ClassTimetable = ({ slots, onAddSlot, onDeleteSlot, isEditable }) => {
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
                        className="timetable-slot-cell timetable-slot-active"
                        style={{
                          margin: 0,
                          height: "100%",
                          padding: "10px",
                          position: "relative",
                        }}
                      >
                        <div className="timetable-slot-title">{slot.subject}</div>
                        <div className="timetable-slot-desc">
                          👨‍🏫 {slot.teacher?.user?.name || "Teacher"}
                        </div>
                        {isEditable && (
                          <button
                            onClick={() => onDeleteSlot(slot.id)}
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "var(--danger)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontSize: "10px",
                              cursor: "pointer",
                            }}
                            title="Delete Slot"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px dashed var(--glass-border)",
                          borderRadius: "8px",
                          background: "rgba(255,255,255,0.01)",
                        }}
                      >
                        {isEditable ? (
                          <button
                            onClick={() => onAddSlot(day, period.start, period.end)}
                            style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid var(--glass-border)",
                              borderRadius: "50%",
                              width: "28px",
                              height: "28px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--accent)",
                              fontSize: "14px",
                              fontWeight: "bold",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                            title="Add Slot"
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = "var(--primary-glow)";
                              e.currentTarget.style.borderColor = "var(--primary)";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                              e.currentTarget.style.borderColor = "var(--glass-border)";
                            }}
                          >
                            +
                          </button>
                        ) : (
                          <span style={{ color: "var(--text-secondary)", fontSize: "11px" }}>Free</span>
                        )}
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
export default ClassTimetable;
