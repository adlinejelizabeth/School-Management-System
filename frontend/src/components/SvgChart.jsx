import React from "react";

export const SvgChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
        No performance records available for this class.
      </div>
    );
  }

  // Dimension settings
  const width = 600;
  const height = 300;
  const paddingLeft = 50;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingRight = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value (cap at 100)
  const maxValue = 100;

  // X spacing
  const barGap = 15;
  const totalBars = data.length;
  const barWidth = Math.max(20, (chartWidth - barGap * (totalBars + 1)) / totalBars);

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "auto", overflow: "visible" }}
      >
        <defs>
          {/* Gradient for bars */}
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--primary)" />
          </linearGradient>
          {/* Neon Glow Filter */}
          <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="var(--accent)" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Y Axis Grid Lines & Labels */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const yPos = chartHeight + paddingTop - (tick / maxValue) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                y1={yPos}
                x2={width - paddingRight}
                y2={yPos}
                stroke="rgba(255, 255, 255, 0.08)"
                strokeDasharray="4 4"
              />
              <text
                x={paddingLeft - 10}
                y={yPos + 4}
                fill="var(--text-secondary)"
                fontSize="11"
                textAnchor="end"
                fontWeight="500"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const xPos = paddingLeft + barGap + index * (barWidth + barGap);
          const barHeight = (item.averagePercentage / maxValue) * chartHeight;
          const yPos = chartHeight + paddingTop - barHeight;

          return (
            <g key={index} className="chart-bar-group">
              {/* Bar Rect */}
              <rect
                x={xPos}
                y={yPos}
                width={barWidth}
                height={barHeight}
                fill="url(#barGradient)"
                rx="4"
                filter="url(#glow)"
                style={{
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
              />
              {/* Value Text on top of bar */}
              <text
                x={xPos + barWidth / 2}
                y={yPos - 6}
                fill="var(--text-primary)"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
              >
                {item.averagePercentage}%
              </text>
              {/* X Axis Labels (Subject name + exam) */}
              <text
                x={xPos + barWidth / 2}
                y={chartHeight + paddingTop + 18}
                fill="var(--text-primary)"
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
              >
                {item.subject}
              </text>
              <text
                x={xPos + barWidth / 2}
                y={chartHeight + paddingTop + 28}
                fill="var(--text-secondary)"
                fontSize="8"
                textAnchor="middle"
              >
                {item.examName}
              </text>
            </g>
          );
        })}

        {/* X Axis Baseline */}
        <line
          x1={paddingLeft}
          y1={chartHeight + paddingTop}
          x2={width - paddingRight}
          y2={chartHeight + paddingTop}
          stroke="var(--glass-border)"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
};
export default SvgChart;
