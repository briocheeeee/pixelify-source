import React, { useState, useEffect } from 'react';

// Définir les coordonnées des pixels placés
interface Pixel {
  x: number;
  y: number;
  color: string;
}

export const PixelManager = () => {
  const [pixels, setPixels] = useState<Pixel[]>([]); // Liste des pixels placés
  const [isPlacing, setIsPlacing] = useState<boolean>(false); // Si l'utilisateur est en train de placer un pixel
  const [cooldown, setCooldown] = useState<boolean>(false); // Pour gérer le cooldown entre chaque pixel
  const [currentColor, setCurrentColor] = useState<string>('#000000'); // Couleur actuelle du pixel
  
  // Fonction pour placer un pixel
  const placePixel = (x: number, y: number) => {
    if (!cooldown) {
      // Ajouter un nouveau pixel aux coordonnées (x, y)
      setPixels((prevPixels) => [...prevPixels, { x, y, color: currentColor }]);
      setCooldown(true); // Activer le cooldown
    }
  };

  // Fonction pour gérer le cooldown de 1 seconde entre chaque pixel
  useEffect(() => {
    if (cooldown) {
      const timer = setTimeout(() => {
        setCooldown(false); // Réinitialiser le cooldown après 1 seconde
      }, 1000);
      
      return () => clearTimeout(timer); // Nettoyer l'intervalle lorsque le composant est démonté
    }
  }, [cooldown]);

  return (
    <div className="PixelManager">
      <h2>Placez des Pixels</h2>
      
      {/* Sélecteur de couleur */}
      <input
        type="color"
        value={currentColor}
        onChange={(e) => setCurrentColor(e.target.value)}
      />
      
      {/* Canvas pour afficher les pixels */}
      <div
        className="canvas"
        style={{ width: '500px', height: '500px', border: '1px solid black' }}
        onClick={(e) => {
          const canvasRect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - canvasRect.left;
          const y = e.clientY - canvasRect.top;
          placePixel(x, y); // Placer un pixel aux coordonnées du clic
        }}
      >
        {/* Affichage des pixels placés */}
        {pixels.map((pixel, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: pixel.x + 'px',
              top: pixel.y + 'px',
              width: '10px',
              height: '10px',
              backgroundColor: pixel.color,
            }}
          />
        ))}
      </div>

      {/* Indication du cooldown */}
      {cooldown && <p>Veuillez attendre 1 seconde entre chaque pixel.</p>}
    </div>
  );
};
