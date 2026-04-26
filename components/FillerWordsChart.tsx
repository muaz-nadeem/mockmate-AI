"use client";

interface FillerWordsChartProps {
  data: Record<string, number>;
}

const BAR_COLORS = [
  "#f75353",
  "#ff7b54",
  "#ffb347",
  "#cac5fe",
  "#49de50",
  "#4fc3f7",
];

const FillerWordsChart = ({ data }: FillerWordsChartProps) => {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="filler-chart">
      <h3 className="filler-chart-title">Clarity & Filler Word Usage</h3>
      <p className="filler-chart-subtitle">
        Number of times each filler word was used during the interview
      </p>
      <div className="filler-chart-bars">
        {entries.map(([word, count], i) => (
          <div key={word} className="filler-bar-row">
            <span className="filler-bar-label">{`"${word}"`}</span>
            <div className="filler-bar-track">
              <div
                className="filler-bar-fill"
                style={{
                  width: `${(count / max) * 100}%`,
                  backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                }}
              />
            </div>
            <span className="filler-bar-count">{count}x</span>
          </div>
        ))}
      </div>
      <div className="filler-chart-footer">
        <p>
          Total filler words:{" "}
          <span className="font-bold text-destructive-100">
            {entries.reduce((sum, [, v]) => sum + v, 0)}
          </span>
        </p>
        <p className="filler-chart-tip">
          Tip: Practice pausing silently instead of using filler words. Record
          yourself answering questions and count fillers to track improvement.
        </p>
      </div>
    </div>
  );
};

export default FillerWordsChart;
 
