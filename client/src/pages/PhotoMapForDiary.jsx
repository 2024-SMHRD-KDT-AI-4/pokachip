import React, { useEffect, useRef } from "react";

// 구글 맵 스크립트 로더
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
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDWQsyvCTLoek2LGOdXImWra7OvChrMya8&libraries=places";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function PhotoMapForDiary({ photos = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!photos.length) return;

    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) throw new Error("Map container not found");

        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 36.5, lng: 127.5 },
          zoom: 7,
        });
        mapInstance.current = map;

        const geocoder = new window.google.maps.Geocoder();

        photos.forEach((photo) => {
          if (!photo.lat || !photo.lng) return;

          const position = {
            lat: parseFloat(photo.lat),
            lng: parseFloat(photo.lng),
          };

          const marker = new window.google.maps.Marker({
            position,
            map,
          });

          // ✅ 마커 클릭 시 주소 표시
          marker.addListener("click", () => {
            geocoder.geocode({ location: position }, (results, status) => {
              if (status === "OK" && results[0]) {
                const address = results[0].formatted_address;

                const infowindow = new window.google.maps.InfoWindow({
                  content: `<div style="font-size:14px;">📍 ${address}</div>`,
                });

                infowindow.open(map, marker);
              } else {
                console.error("주소 변환 실패:", status);
              }
            });
          });
        });
      })
      .catch((err) => console.error("구글 맵 로딩 실패:", err));
  }, [photos]);

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
