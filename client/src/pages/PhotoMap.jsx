import React, { useEffect, useRef, useState } from "react";
import * as exifr from "exifr"; // ✅ exifr로 대체

// ✅ Google Maps API 스크립트 로딩
const loadGoogleMapsScript = (callback) => {
  const scriptId = "google-maps-script";
  const existingScript = document.getElementById(scriptId);

  if (!existingScript) {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCoV7zBzHTvU9JWMAxrLXzG_s0_FfDcxGo`;
    script.async = true;
    script.defer = true;
    script.onload = callback;
    script.id = scriptId;
    document.body.appendChild(script);
  } else {
    if (window.google && window.google.maps) {
      callback();
    } else {
      existingScript.addEventListener("load", callback);
    }
  }
};

const PhotoMap = () => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // ✅ 모달 상태
  const [modalMessage, setModalMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (mapRef.current && window.google && window.google.maps) {
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 36.5, lng: 127.5 },
          zoom: 7,
          gestureHandling: "greedy",
        });
        setIsMapReady(true);
      } else {
        console.error("❌ Google Maps 또는 mapRef 로딩 실패");
      }
    });
  }, []);

  // ✅ EXIF에서 GPS 추출 (exifr 사용)
  const extractGPS = async (file, callback) => {
    try {
      const gpsData = await exifr.gps(file); // exifr.gps는 {latitude, longitude} 반환
      if (!gpsData || !gpsData.latitude || !gpsData.longitude) {
        callback({ lat: null, lng: null, imageUrl: URL.createObjectURL(file) });
        return;
      }
      callback({
        lat: gpsData.latitude,
        lng: gpsData.longitude,
        imageUrl: URL.createObjectURL(file),
      });
    } catch (error) {
      console.error("EXIF 추출 실패:", error);
      callback({ lat: null, lng: null, imageUrl: URL.createObjectURL(file) });
    }
  };

  const handleFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!isMapReady || files.length === 0) return;

    files.forEach((file) => {
      extractGPS(file, ({ lat, lng, imageUrl }) => {
        if (!lat || !lng) {
          setModalMessage(`❗ [${file.name}]에는 위치 정보(EXIF GPS)가 없습니다.\n이 이미지는 지도에 표시되지 않습니다.`);
          setIsModalOpen(true);
          return;
        }

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

  return (
    <div>
      <input type="file" accept="image/*" multiple onChange={handleFilesChange} />
      <div ref={mapRef} style={{ width: "100%", height: "600px", marginTop: "10px" }} />

      {/* ✅ 모달 */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <p>{modalMessage}</p>
            <button onClick={() => setIsModalOpen(false)}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoMap;

// ✅ 간단한 모달 스타일
const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalContentStyle = {
  backgroundColor: "white",
  padding: "20px 30px",
  borderRadius: "8px",
  textAlign: "center",
  maxWidth: "90%",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
};
