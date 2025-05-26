// client/src/pages/PhotoMapForMain.jsx

import React, { useEffect, useRef } from "react";

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

export default function PhotoMapForMain({ photos = [], diary = null }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const currentInfoWindow = useRef(null);

  useEffect(() => {
    if (!photos.length) return;

    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) throw new Error("Map container not found");

        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 36.5, lng: 127.5 },
          zoom: 7,
        });

        photos.forEach((photo) => {
          if (!photo.lat || !photo.lng) return;

          const marker = new window.google.maps.Marker({
            position: {
              lat: parseFloat(photo.lat),
              lng: parseFloat(photo.lng),
            },
            map: mapInstance.current,
          });

          if (diary) {
            const info = new window.google.maps.InfoWindow({
              content: `
                <div style="max-width:250px;">
                  <img src="http://localhost:5000/uploads/${photo.file_name}" style="width:100px;border-radius:8px;" />
                  <h4 style="margin:8px 0;">${diary.diary_title}</h4>
                  <p style="white-space:pre-wrap;">${diary.diary_content}</p>
                  <small style="color:gray;">${diary.trip_date}</small>
                </div>
              `,
            });

            marker.addListener("click", () => {
              if (currentInfoWindow.current) {
                currentInfoWindow.current.close();
              }
              info.open(mapInstance.current, marker);
              currentInfoWindow.current = info;
            });
          }
        });
      })
      .catch((err) => console.error("구글 맵 로딩 실패:", err));
  }, [photos, diary]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "12px",
        marginTop: "1rem",
      }}
    />
  );
}
