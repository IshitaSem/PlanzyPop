import type { ReactNode } from "react"
import { IconButton } from "./IconButton"

export function Header({
  title,
  eyebrow,
  onBack,
  action,
}: {
  title: string
  eyebrow?: string
  onBack?: () => void
  action?: ReactNode
}) {
  return (
    <div className="page-header">
      <div className="header-left">
        {onBack && <IconButton icon="back" label="Go back" onClick={onBack} />}
        <div>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <div className="page-title">{title}</div>
        </div>
      </div>
      {action}
    </div>
  )
}
