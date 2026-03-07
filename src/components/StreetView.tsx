// src/components/StreetView.tsx
interface StreetViewProps {
  coords: [number, number]; // [lat, lng]
}

export default function StreetView({ coords }: StreetViewProps) {
  const [lat, lng] = coords;

  // Real Google Street View 360° panorama (no API key needed)
  const streetViewUrl = `https://www.google.com/maps/embed?pb=!4v1730000000000&pb=!1m0!3m2!1sen!2sph!4v1!6m8!1m7!1s${lat},${lng}!2m2!1d${lat}!2d${lng}!3f0!4f0!5f1.5`;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <iframe
        src={streetViewUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '12px',
        }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Overlay info */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          background: 'rgba(0, 0, 0, 0.75)',
          color: 'white',
          padding: '10px 16px',
          borderRadius: 12,
          fontSize: '14px',
          fontWeight: 500,
          pointerEvents: 'none',
          zIndex: 10,
          backdropFilter: 'blur(8px)',
        }}
      >
        360° Street View • Drag to look around • Scroll to zoom
      </div>

      {/* Back to Map button */}
      <button
        onClick={() => window.location.reload()} // temporary - you can change later
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          padding: '10px 18px',
          background: '#0066ff',
          color: 'white',
          border: 'none',
          borderRadius: 999,
          fontSize: 14,
          cursor: 'pointer',
          zIndex: 20,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        ← Back to Map
      </button>
    </div>
  );
}