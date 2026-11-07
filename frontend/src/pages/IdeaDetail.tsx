/**
 * PlanzyPop - Idea Detail Screen
 * Academic Mini-Project for M.Sc. Computer Science (Data Science)
 */

import type { Screen } from "../types"
import { images } from "../utils/constants"
import { Icon } from "../components/common/Icon"
import { IconButton } from "../components/common/IconButton"
import { Button } from "../components/common/Button"
import { SectionTitle } from "../components/common/SectionTitle"

export function IdeaDetail({
  go,
  notify,
}: {
  go: (s: Screen) => void
  notify: (m: string) => void
}) {
  return (
    <div className="screen detail-screen">
      <div className="idea-hero">
        <img src={images.decor} alt="Colourful birthday decor with balloons" />
        <div className="floating-header">
          <IconButton
            icon="back"
            label="Back"
            onClick={() => go("inspiration")}
          />
          <IconButton
            icon="bookmark"
            label="Save idea"
            onClick={() => notify("Idea saved")}
          />
        </div>
      </div>
      <div className="detail-body idea-detail-body">
        <div className="event-type">BIRTHDAY THEME · BUDGET FRIENDLY</div>
        <div className="idea-detail-title">DIY Pastel Pop Party</div>
        <p>
          A cheerful setup using paper decor, balloons and fairy lights—perfect
          for a living room, terrace or hostel common area.
        </p>
        <div className="idea-facts">
          <span>
            <Icon name="wallet" size={18} />
            <strong>₹1,200–₹1,500</strong>
            <small>Decor budget</small>
          </span>
          <span>
            <Icon name="clock" size={18} />
            <strong>60 minutes</strong>
            <small>Setup time</small>
          </span>
          <span>
            <Icon name="people" size={18} />
            <strong>8–25 guests</strong>
            <small>Best for</small>
          </span>
        </div>
        <SectionTitle title="What you’ll need" />
        <div className="shopping-list">
          <span>
            <Icon name="check" size={14} /> 30 pastel balloons
          </span>
          <span>
            <Icon name="check" size={14} /> 3 paper streamer rolls
          </span>
          <span>
            <Icon name="check" size={14} /> Warm fairy lights
          </span>
          <span>
            <Icon name="check" size={14} /> Printed photo props
          </span>
          <span>
            <Icon name="check" size={14} /> Reusable bunting
          </span>
        </div>
        <SectionTitle title="Make it yours" />
        <div className="tip-card">
          <Icon name="bulb" />
          <p>
            <strong>Student saver tip</strong> Split decor into three colours
            and ask friends to each bring one item. It looks coordinated without
            one person paying for everything.
          </p>
        </div>
        <Button
          className="full-button"
          onClick={() => {
            notify("Idea added to your planner")
            go("planner")
          }}
          icon="sparkle"
        >
          Use This Idea
        </Button>
      </div>
    </div>
  )
}
