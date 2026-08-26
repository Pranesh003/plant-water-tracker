import { ArrowLeft, ArrowRight, BarChart3, Droplets, Flame, Leaf } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";

const steps = [
  { title: "Add Your Plants", text: "Search for a plant or manually add your own plant with its care needs.", icon: Leaf },
  { title: "Track Watering", text: "Watering schedules, due dates, and next care windows stay easy to scan.", icon: Droplets },
  { title: "Build Your Streak", text: "Every plant has its own streak, milestones, and best-care record.", icon: Flame },
  { title: "Understand Your Plants", text: "Analytics, history, notes, watering status, and insights help you care with confidence.", icon: BarChart3 }
];

export default function Tutorial() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const finish = async () => {
    await api.completeTutorial();
    navigate("/dashboard");
  };
  const Icon = steps[step].icon;
  return (
    <main className="tutorial-page">
      <section className="tutorial-card">
        <button className="skip" onClick={finish}>Skip</button>
        <div className="tutorial-illustration"><Icon size={72} /></div>
        <div className="progress-dots">{steps.map((_, index) => <span key={index} className={index <= step ? "active" : ""} />)}</div>
        <h1>{steps[step].title}</h1><p>{steps[step].text}</p>
        <div className="form-actions center"><button className="ghost-btn" disabled={step === 0} onClick={() => setStep(step - 1)}><ArrowLeft size={16} /> Back</button>{step === steps.length - 1 ? <button className="primary-btn" onClick={finish}>Get Started</button> : <button className="primary-btn" onClick={() => setStep(step + 1)}>Next <ArrowRight size={16} /></button>}</div>
      </section>
    </main>
  );
}
