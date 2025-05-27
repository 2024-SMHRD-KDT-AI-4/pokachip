import React, { useEffect, useRef, useState } from "react";

function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) return resolve();

    const existing = document.getElementById("google-maps-script");
    if (existing) {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDWQsyvCTLoek2LGOdXImWra7OvChrMya8";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentInfoWindow = useRef(null);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://localhost:5000/userPhotos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPhotos(data));
  }, []);

  useEffect(() => {
    if (!photos.length) return;

    loadGoogleMapsScript()
      .then(() => {
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 36.5, lng: 127.5 },
          zoom: 7,
        });
        mapInstance.current = map;

        const geocoder = new window.google.maps.Geocoder();

        photos.forEach((photo) => {
          const lat = parseFloat(photo.lat);
          const lng = parseFloat(photo.lng);
          if (isNaN(lat) || isNaN(lng)) return;

          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map,
          });

          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) {
              const address = results[0].formatted_address;
              const diaryId = photo.diary?.diary_idx;

              const info = new window.google.maps.InfoWindow({
                content: `
                  <div style="max-width:250px;">
                    <a href="/diary/${diaryId}">
                      <img 
                        src="http://localhost:5000${photo.filePath}" 
                        style="width:100px;border-radius:8px;cursor:pointer;"
                      />
                    </a>
                    <p style="margin-top:6px;font-size:14px;color:#333;">${address}</p>
                  </div>
                `,
              });

              marker.addListener("click", () => {
                if (currentInfoWindow.current) {
                  currentInfoWindow.current.close();
                }
                info.open(map, marker);
                currentInfoWindow.current = info;
              });
            }
          });
        });
      })
      .catch(console.error);
  }, [photos]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">🗺️ 여행 지도</h2>
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "400px",
          borderRadius: "12px",
          marginTop: "1rem",
        }}
      />
    </div>
  );
}
