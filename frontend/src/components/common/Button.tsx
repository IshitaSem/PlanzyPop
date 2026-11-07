import type { CSSProperties, ReactNode } from "react"
import type { IconName } from "../../types"
import { Icon } from "./Icon"

export function Button({
  children,
  onClick,
  className = "",
  variant = "primary",
  icon,
  disabled,
  type = "button",
  style,
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
  variant?: "primary" | "secondary" | "ghost" | "dark"
  icon?: IconName
  disabled?: boolean
  type?: "button" | "submit"
  style?: CSSProperties
}) {
  return (
    <button
      type={type}
      className={`button button-${variant} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      <span>{children}</span>
      {icon && <Icon name={icon} size={19} />}
    </button>
  )
}
