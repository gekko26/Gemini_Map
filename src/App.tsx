import { useState, useRef, useEffect } from "react";
import { chatWithGemini } from "./api/chat";
import MapView from "./MapView";
import StreetView from "./components/StreetView"; 
import { geocodePlace } from "./utils/geocode";
import { getRoute, type RouteInfo } from "./utils/route";   // ← important: type import
import "./App.css";
import { FaMapMarkedAlt, FaCog } from "react-icons/fa"; // Add this import (npm install react-icons)

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  
  // NEW: Distance & Duration state
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | undefined>(undefined);
  const [routeDuration, setRouteDuration] = useState<number | undefined>(undefined);

  const [viewMode, setViewMode] = useState<"map" | "street">("map");
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Continuous GPS
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserCoords(loc);
        setCoords((prev) => prev ?? loc);
      },
      (err) => console.warn("GPS error:", err.message),
      { enableHighAccuracy: true, maximumAge: 4000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Chat persistence
  useEffect(() => {
    const saved = localStorage.getItem("chatMessages");
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("chatMessages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle AI response + routing
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "You", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const raw = await chatWithGemini([...messages, userMsg].slice(-10).map(m => `${m.sender}: ${m.text}`).join("\n"));
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      setMessages((prev) => [...prev, { sender: "AI na Gwapo", text: parsed.message || "Checking it out!" }]);

      if (parsed.view) setViewMode(parsed.view === "streetview" ? "street" : "map");

      let newCoords: [number, number] | null = null;
      if (parsed.lat && parsed.lng) {
        newCoords = [parsed.lat, parsed.lng];
      } else if (parsed.destination) {
        newCoords = await geocodePlace(parsed.destination);
      }

      if (newCoords && userCoords) {
        setCoords(newCoords);

        const result: RouteInfo | null = await getRoute(userCoords, newCoords);
        if (result) {
          setRouteCoords(result.coordinates);
          setRouteDistance(result.distance);
          setRouteDuration(result.duration);
        } else {
          setRouteCoords(null);
          setRouteDistance(undefined);
          setRouteDuration(undefined);
        }
      }
    } catch (e) {
      setMessages((prev) => [...prev, { sender: "AI na Gwapo", text: "Something went wrong — try again?" }]);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="header">
        <div className="logo">
          <FaMapMarkedAlt className="logo-icon" />
          Gemini Map Assistant
        </div>
        <div className="header-actions">
          <button 
            className="toggle-btn" 
            onClick={() => setViewMode(viewMode === "map" ? "street" : "map")}
          >
            {viewMode === "map" ? "👀 Switch to 360°" : "🗺️ Switch to Map"}
          </button>
          {/* <FaCog className="settings-icon" title="Settings" /> */}
        </div>
      </div>

      <div className="app-layout">
        <div className="chat-container">
          <div className="chat-box">
            {messages.map((m, i) => (
              <div key={i} className={`message ${m.sender === "You" ? "user" : "ai"}`}>
                <div className="sender">{m.sender}</div>
                <div className="text">{m.text}</div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="input-area">
            <input
              type="text"
              className="input-field"
              placeholder="Message AI na Gwapo..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button onClick={handleSend} className="send-btn">➤</button>
          </div>
        </div>

        <div className="map-section">
          {!coords ? (
            <div className="loading-overlay">Waiting for GPS...</div>
          ) : viewMode === "map" ? (
            <MapView 
              coords={coords} 
              route={routeCoords}
              distance={routeDistance}     // ← now passed
              duration={routeDuration}     // ← now passed
            />
          ) : (
            <StreetView key={`${coords[0]}-${coords[1]}`} coords={coords} />
          )}
        </div>
      </div>
    </div>
  );
}