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

  // 1) 로그인된 유저 사진 불러오기
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/userPhotos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(setPhotos)
      .catch(console.error);
  }, []);

  // 2) photos 변경 시마다 마커 갱신
  useEffect(() => {
    if (photos.length === 0) return;

    loadGoogleMapsScript().then(() => {
      const google = window.google;
      let map = mapInstance.current;

      // 맵 생성 또는 재사용
      if (!map) {
        map = new google.maps.Map(mapRef.current, {
          center: { lat: 36.5, lng: 127.5 },
          zoom: 7,
        });
        mapInstance.current = map;
      } else {
        google.maps.event.trigger(map, "resize");
      }

      // 기존 마커/InfoWindow 제거
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      infoWindowRef.current?.close();

      const bounds = new google.maps.LatLngBounds();
      const geocoder = new google.maps.Geocoder();

      // 동일 위치 다중 사진 분산
      const locCount = {};
      photos.forEach(p => {
        const key = `${p.lat},${p.lng}`;
        locCount[key] = (locCount[key] || 0) + 1;
      });
      const locPlaced = {};

      photos.forEach(photo => {
        const lat = parseFloat(photo.lat);
        const lng = parseFloat(photo.lng);
        if (isNaN(lat) || isNaN(lng)) return;

        const key = `${lat},${lng}`;
        locPlaced[key] = (locPlaced[key] || 0) + 1;
        let markerLat = lat, markerLng = lng;
        const count = locCount[key];
        if (count > 1) {
          const i = locPlaced[key] - 1;
          const mid = (count - 1) / 2;
          const off = 0.00005; // 약 5m
          markerLat = lat + (i - mid) * off;
          markerLng = lng + (i - mid) * off;
        }

        const position = { lat: markerLat, lng: markerLng };
        bounds.extend(position);

        // tags에 따라 아이콘 결정
        let iconUrl = "/people.png";
        if (photo.tags === "food") iconUrl = "/food.png";
        else if (photo.tags === "landscape") iconUrl = "/landscape.png";
        else if (photo.tags === "accommodation") iconUrl = "/accommodation.png";

        const marker = new google.maps.Marker({
          position,
          map,
          icon: {
            url: iconUrl,
            scaledSize: new google.maps.Size(32, 32),
          },
        });
        markersRef.current.push(marker);

        // 마커 클릭 → 주소 + 사진 InfoWindow
        marker.addListener("click", () => {
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            let address = "주소 정보를 찾을 수 없습니다";
            if (status === "OK" && results[0]) {
              address = results[0].formatted_address;
            }

            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div style="text-align:center; max-width:220px;">
                  <img
                    src="http://localhost:5000${photo.filePath}"
                    data-diary-id="${photo.diary?.diary_idx}"
                    style="width:100%; cursor:pointer; border-radius:8px;"
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
              img?.addEventListener("click", () => {
                navigate(`/diary/${photo.diary?.diary_idx}`);
              });
            });
          });
        });
      });

      map.fitBounds(bounds);
    });
  }, [photos, navigate]);

  return (
    <div className="p-4 bg-white min-h-screen">
      <h2 className="text-lg font-bold mb-4">🗺️ 여행 지도</h2>

      {/* 지도 영역 */}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "550px",
          borderRadius: "12px",
          marginTop: "1rem",
        }}
      />

      {/* 마커 설명 영역 */}
      <div className="mt-6 grid grid-cols-4 gap-4 text-center">
        {/* 맛집 */}
        <div className="flex flex-col items-center">
          <img src="/food.png" alt="음식 마커" className="w-12 h-12" />
          <span className="text-sm mt-1 text-gray-700">음식</span>
        </div>

        {/* 명소 */}
        <div className="flex flex-col items-center">
          <img src="/people.png" alt="인물 마커" className="w-12 h-12" />
          <span className="text-sm mt-1 text-gray-700">인물</span>
        </div>

        {/* 숙소 */}
        <div className="flex flex-col items-center">
          <img src="/accommodation.png" alt="숙소 마커" className="w-12 h-12" />
          <span className="text-sm mt-1 text-gray-700">숙소</span>
        </div>

        {/* 기타 */}
        <div className="flex flex-col items-center">
          <img src="/landscape.png" alt="풍경 마커" className="w-12 h-12" />
          <span className="text-sm mt-1 text-gray-700">풍경</span>
        </div>
      </div>
    </div>
  );
}
