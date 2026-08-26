import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import EmptyState from "../components/EmptyState.jsx";
import PlantForm from "../components/PlantForm.jsx";
import { usePlantCare } from "../App.jsx";

export default function EditPlant() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { plants } = usePlantCare();
  const plant = plants.find((item) => item.id === id);
  if (!plant) return <EmptyState title="Plant not found." message="This plant may have been removed." action="Back to Dashboard" to="/dashboard" />;
  return <><button className="ghost-btn back-link" type="button" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button><section className="page-title"><p className="eyebrow">Update care profile</p><h1>Edit {plant.name}</h1></section><PlantForm plant={plant} mode="edit" /></>;
}
