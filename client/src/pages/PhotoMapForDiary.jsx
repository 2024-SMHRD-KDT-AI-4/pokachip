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
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDWQsyvCTLoek2LGOdXImWra7OvChrMya8";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function PhotoMap({ photos = [] }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!photos.length) return;

    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) throw new Error("Map container not found");

        // 지도 초기화
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 36.5, lng: 127.5 },
          zoom: 7,
        });

        // 마커만 찍고, 클릭 이벤트는 등록하지 않습니다
        photos.forEach((photo) => {
          if (!photo.lat || !photo.lng) return;

          new window.google.maps.Marker({
            position: {
              lat: parseFloat(photo.lat),
              lng: parseFloat(photo.lng),
            },
            map: mapInstance.current,
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
