export const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
};

export const uploadPlantPhoto = (file) => new Promise((resolve, reject) => {
  if (!file) {
    resolve("");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("Unable to upload plant photo."));
  reader.readAsDataURL(file);
});
