import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PlantForm from "../components/PlantForm.jsx";

export default function AddPlant() {
  const navigate = useNavigate();
  return <><button className="ghost-btn back-link" type="button" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button><section className="page-title"><p className="eyebrow">New plant</p><h1>Add Plant</h1></section><PlantForm /></>;
}
