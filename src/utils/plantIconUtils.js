/**
 * Maps plant species/name to custom vector icons (including succulents, tropicals, herbs, and flowering plants).
 */
export function getPlantIconUrl(plant) {
  if (!plant) return "/plant_icons/succulent.png";

  const name = (plant.name || "").toLowerCase();
  const species = (plant.species || "").toLowerCase();
  const iconStr = (plant.icon || "").toLowerCase();
  const combined = `${name} ${species} ${iconStr}`;

  // 1. Flowering Plants
  if (combined.includes("tulip") || combined.includes("rose") || combined.includes("hibiscus")) {
    return "/plant_icons/tulip.png";
  }
  if (combined.includes("lavender") || combined.includes("violet") || combined.includes("salvia") || combined.includes("lilac")) {
    return "/plant_icons/lavender.png";
  }
  if (combined.includes("iris") || combined.includes("orchid") || combined.includes("purple")) {
    return "/plant_icons/iris.png";
  }
  if (
    combined.includes("flower") ||
    combined.includes("daisy") ||
    combined.includes("sunflower") ||
    combined.includes("marigold") ||
    combined.includes("bloom") ||
    combined.includes("gerbera") ||
    combined.includes("zinnia")
  ) {
    return "/plant_icons/flower_pot.png";
  }

  // 2. Foliage & Succulent Plants
  if (combined.includes("snake") || combined.includes("sansevieria")) {
    return "/plant_icons/snake.png";
  }
  if (
    combined.includes("aloe") ||
    combined.includes("succulent") ||
    combined.includes("jade") ||
    combined.includes("cactus") ||
    combined.includes("echeveria")
  ) {
    return "/plant_icons/succulent.png";
  }
  if (
    combined.includes("monstera") ||
    combined.includes("palm") ||
    combined.includes("lily") ||
    combined.includes("fern") ||
    combined.includes("fiddle") ||
    combined.includes("rubber") ||
    combined.includes("tropical")
  ) {
    return "/plant_icons/tropical.png";
  }
  if (
    combined.includes("peperomia") ||
    combined.includes("pothos") ||
    combined.includes("ivy") ||
    combined.includes("spider")
  ) {
    return "/plant_icons/houseplant.png";
  }
  if (
    combined.includes("herb") ||
    combined.includes("mint") ||
    combined.includes("basil") ||
    combined.includes("rosemary") ||
    combined.includes("bamboo") ||
    combined.includes("jasmine")
  ) {
    return "/plant_icons/herb.png";
  }

  // Fallback round-robin across all 9 icons
  const id = String(plant.id || name);
  const charCode = id.charCodeAt(0) || 0;
  const icons = [
    "/plant_icons/succulent.png",
    "/plant_icons/flower_pot.png",
    "/plant_icons/snake.png",
    "/plant_icons/tulip.png",
    "/plant_icons/tropical.png",
    "/plant_icons/lavender.png",
    "/plant_icons/houseplant.png",
    "/plant_icons/iris.png",
    "/plant_icons/herb.png"
  ];
  return icons[charCode % icons.length];
}

export const WATERING_CAN_ICON = "/plant_icons/watering_can.png";
