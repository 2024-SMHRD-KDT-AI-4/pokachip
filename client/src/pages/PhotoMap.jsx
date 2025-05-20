import React, { useEffect, useRef, useState } from "react";
import * as exifr from "exifr";

// Google Maps API 로딩
const loadGoogleMapsScript = (callback) => {
  const scriptId = "google-maps-script";
  if (document.getElementById(scriptId)) {
    callback();
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDWQsyvCTLoek2LGOdXImWra7OvChrMya8`;
  script.async = true;
  script.defer = true;
  script.onload = callback;
  script.id = scriptId;
  document.body.appendChild(script);
};

function PhotoMap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const extractGPS = async (file, callback) => {
    try {
      console.log("📂 파일 선택됨:", file.name);
      const gpsData = await exifr.gps(file);
      console.log("🧭 추출된 GPS 데이터:", gpsData);

      const result = {
        lat: gpsData?.latitude || null,
        lng: gpsData?.longitude || null,
        imageUrl: URL.createObjectURL(file),
      };

      callback(result);

      if (!result.lat || !result.lng) {
        console.warn("❗ GPS 없음 → fetch 실행 안 됨");
        return;
      }

      console.log("📤 fetch 실행됨! 전송 내용:", {
        user_id: "user_id_1",
        file_name: file.name,
        lat: result.lat,
        lng: result.lng,
        taken_at: new Date().toISOString(),
      });

      fetch("http://localhost:5000/uploadPhoto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: "user_id_1",
          file_name: file.name,
          lat: result.lat,
          lng: result.lng,
          taken_at: new Date().toISOString(),
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("✅ 서버 응답:", data);
        })
        .catch((err) => {
          console.error("❌ fetch 실패:", err);
        });
    } catch (error) {
      console.error("❌ EXIF 추출 실패:", error);
      callback({
        lat: null,
        lng: null,
        imageUrl: URL.createObjectURL(file),
      });
    }
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!isMapReady || files.length === 0) return;

    files.forEach((file) => {
      extractGPS(file, ({ lat, lng, imageUrl }) => {
        if (!lat || !lng) return;

        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: mapInstance.current,
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div><img src="${imageUrl}" width="100"/><p>이 위치에서 찍은 사진입니다.</p></div>`,
        });

        marker.addListener("click", () => {
          infoWindow.open(mapInstance.current, marker);
        });

        mapInstance.current.setCenter({ lat, lng });
      });
    });
  };

  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (mapRef.current && window.google && window.google.maps) {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 36.5, lng: 127.5 },
          zoom: 7,
        });
        setIsMapReady(true);
      }
    });
  }, []);

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesChange}
      />
      <div
        ref={mapRef}
        style={{ width: "100%", height: "600px", marginTop: "10px" }}
      />
    </div>
  );
}

export default PhotoMap;
