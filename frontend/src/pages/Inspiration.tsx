/**
 * PlanzyPop - Inspiration Screen
 * Academic Mini-Project for M.Sc. Computer Science (Data Science)
 */

import { useState } from "react"
import type { Screen } from "../types"
import { images } from "../utils/constants"
import { Header } from "../components/common/Header"
import { Icon } from "../components/common/Icon"
import { IconButton } from "../components/common/IconButton"

export function Inspiration({ go }: { go: (s: Screen) => void }) {
  const [filter, setFilter] = useState("For you")
  const ideas = [
    {
      image: images.decor,
      title: "DIY Pastel Pop Party",
      tag: "BIRTHDAY THEME",
      desc: "A bright setup under ₹1,500",
    },
    {
      image: images.picnic,
      title: "Sunset Snack Picnic",
      tag: "PICNIC IDEA",
      desc: "Low effort, high on good vibes",
    },
    {
      image: images.games,
      title: "No-Screen Game Night",
      tag: "GAME NIGHT",
      desc: "6 games everyone can play",
    },
    {
      image: images.cake,
      title: "Cake Bar on a Budget",
      tag: "FOOD IDEA",
      desc: "A sweet centrepiece under ₹800",
    },
    {
      image: images.balloons,
      title: "Balloon Photo Corner",
      tag: "DIY DECOR",
      desc: "Make it in less than an hour",
    },
  ]
  return (
    <div className="screen">
      <Header
        title="Get Inspired"
        eyebrow="IDEAS WORTH CELEBRATING"
        onBack={() => go("overview")}
        action={<IconButton icon="bookmark" label="Saved ideas" />}
      />
      <div className="search-bar">
        <Icon name="search" size={19} />
        <input placeholder="Search themes, DIY, snacks…" />
      </div>
      <div className="filter-row">
        {["For you", "Birthday", "Budget", "College", "Picnic"].map((item) => (
          <button
            type="button"
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="masonry">
        {ideas.map((idea, index) => (
          <button
            type="button"
            className={`inspo-card i${index}`}
            key={idea.title}
            onClick={() => go("idea-detail")}
          >
            <div className="inspo-image">
              <img src={idea.image} alt="" />
              <span className="save-float">
                <Icon name="bookmark" size={17} />
              </span>
            </div>
            <span>{idea.tag}</span>
            <strong>{idea.title}</strong>
            <p>{idea.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
