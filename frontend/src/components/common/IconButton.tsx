import type { IconName } from "../../types"
import { Icon } from "./Icon"

export function IconButton({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: IconName
  label: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      className={`icon-button ${active ? "active" : ""}`}
      onClick={onClick}
      aria-label={label}
    >
      <Icon name={icon} />
    </button>
  )
}
