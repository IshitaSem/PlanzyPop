export function Progress({
  value,
  color = "purple",
}: {
  value: number
  color?: "purple" | "coral" | "yellow"
}) {
  return (
    <div className="progress">
      <div
        className={`progress-value ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
