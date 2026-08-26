import { Flame } from "lucide-react";
import { getMilestone } from "../utils/streakUtils.js";

export default function StreakBadge({ streak, best }) {
  return (
    <div className="streak-badge">
      <Flame size={16} /><span>{streak} Day Streak</span>
      <small>{getMilestone(streak)} · Best {best}</small>
    </div>
  );
}
