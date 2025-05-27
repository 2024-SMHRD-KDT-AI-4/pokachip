import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/userPhotos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setPhotos(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!photos.length) return;

    loadGoogleMapsScript().then(() => {
      const google = window.google;
      let map = mapInstance.current;

      if (!map) {
        map = new google.maps.Map(mapRef.current, {
          center: { lat: 36.5, lng: 127.5 },
          zoom: 7,
        });
        mapInstance.current = map;
      } else {
        google.maps.event.trigger(map, "resize");
      }

      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      infoWindowRef.current?.close();

      const bounds = new google.maps.LatLngBounds();
      const geocoder = new google.maps.Geocoder();

      // 좌표별로 같은 위치에 여러 장이 있다면, 마커끼리 오프셋 분산
      const locCount = {};
      photos.forEach((photo) => {
        const key = `${photo.lat},${photo.lng}`;
        locCount[key] = (locCount[key] || 0) + 1;
      });
      const locPlaced = {};

      photos.forEach((photo, idx) => {
        const lat = parseFloat(photo.lat);
        const lng = parseFloat(photo.lng);
        if (isNaN(lat) || isNaN(lng)) return;

        const key = `${lat},${lng}`;
        locPlaced[key] = (locPlaced[key] || 0) + 1;

        // 오프셋을 같은 위치의 n번째 사진에만 적용
        const offsetPixel = 0.00008; // 약 8m
        const count = locCount[key];
        let markerLat = lat;
        let markerLng = lng;
        if (count > 1) {
          // 가운데부터 양쪽으로 펴지도록 분산
          const i = locPlaced[key] - 1;
          const mid = (count - 1) / 2;
          markerLat = lat + (i - mid) * offsetPixel;
          markerLng = lng + (i - mid) * offsetPixel;
        }

        const position = { lat: markerLat, lng: markerLng };
        bounds.extend(position);

        const marker = new google.maps.Marker({
          position,
          map,
        });
        markersRef.current.push(marker);

        marker.addListener("click", () => {
          // 1. 주소 정보 가져오기
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            let address = "주소 정보를 찾을 수 없습니다";
            if (status === "OK" && results && results[0]) {
              address = results[0].formatted_address;
            }

            // 2. InfoWindow: 사진 + 주소 표시
            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="text-align:center; max-width:220px;">
                  <img 
                    src="http://localhost:5000${photo.filePath}" 
                    data-diary-id="${photo.diary?.diary_idx}" 
                    style="width:100%;cursor:pointer;border-radius:8px;" 
                    alt="photo"
                  />
                  <p style="margin-top:8px; font-size:13px; color:#222;">
                    ${address}
                  </p>
                </div>
              `,
            });

            infoWindowRef.current?.close();
            infoWindow.open(map, marker);
            infoWindowRef.current = infoWindow;

            google.maps.event.addListenerOnce(infoWindow, "domready", () => {
              const img = document.querySelector(
                `img[data-diary-id="${photo.diary?.diary_idx}"]`
              );
              if (img) {
                img.addEventListener("click", () => {
                  navigate(`/diary/${photo.diary?.diary_idx}`);
                });
              }
            });
          });
        });
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      }
    });
  }, [photos, navigate]);

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
