import type { NotificationItem, Screen } from "../../types"
import { Icon } from "./Icon"
import { Button } from "./Button"
import { IconButton } from "./IconButton"

export function NotificationDrawer({
  notifications,
  onClose,
  onNavigate,
  onDismissAll,
}: {
  notifications: NotificationItem[]
  onClose: () => void
  onNavigate: (s: Screen) => void
  onDismissAll: () => void
}) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "var(--yellow)",
                display: "grid",
                placeItems: "center",
                border: "1.5px solid var(--ink)",
              }}
            >
              <Icon name="bell" size={19} />
            </span>
            <div>
              <strong style={{ fontSize: 17, display: "block" }}>Notifications</strong>
              <small style={{ color: "var(--muted)" }}>
                {notifications.length} active celebration reminder
                {notifications.length === 1 ? "" : "s"}
              </small>
            </div>
          </div>
          <IconButton icon="back" label="Close" onClick={onClose} />
        </div>

        <div className="drawer-body">
          {notifications.length === 0 ? (
            <div
              style={{
                padding: "48px 16px",
                textAlign: "center",
                color: "var(--muted)",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#f0edf7",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 12px",
                }}
              >
                <Icon name="check" size={24} />
              </div>
              <strong>All caught up!</strong>
              <p style={{ fontSize: 13, marginTop: 4 }}>
                No pending alerts or reminders for your events right now.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="notification-card"
                  onClick={() => {
                    if (n.screen) onNavigate(n.screen)
                  }}
                  style={{
                    cursor: n.screen ? "pointer" : "default",
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "1.5px solid var(--line)",
                    background: "var(--paper)",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    transition: "border-color 0.15s ease",
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background:
                        n.type === "budget"
                          ? "rgba(255, 140, 115, 0.18)"
                          : n.type === "task"
                            ? "rgba(182, 161, 240, 0.22)"
                            : "rgba(255, 217, 102, 0.35)",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    <Icon name={n.icon} size={17} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <strong style={{ fontSize: 14 }}>{n.title}</strong>
                      {n.screen && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--coral)",
                            fontWeight: 700,
                          }}
                        >
                          VIEW &rarr;
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        color: "var(--muted)",
                        lineHeight: 1.35,
                      }}
                    >
                      {n.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="drawer-footer" style={{ display: "flex", gap: 10 }}>
          {notifications.length > 0 && (
            <Button
              variant="secondary"
              className="full-button"
              onClick={onDismissAll}
            >
              Clear All
            </Button>
          )}
          <Button
            variant="primary"
            className="full-button"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
