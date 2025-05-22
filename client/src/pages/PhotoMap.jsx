import React, { useEffect, useRef } from "react";

// 1) 스크립트 로더를 Promise 기반으로 재정의
function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있으면 바로 resolve
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const scriptId = "google-maps-script";
    const existing = document.getElementById(scriptId);

    if (existing) {
      // 로드 중인 경우 load 이벤트에 붙이기
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
    } else {
      // 새로 추가
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDWQsyvCTLoek2LGOdXImWra7OvChrMya8`;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    }
  });
}

export default function PhotoMap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // 로그인된 유저 사진만 가져와서 마커를 찍는 함수
  const loadUserPhotos = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    fetch("http://localhost:5000/userPhotos", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((photos) => {
        photos.forEach((p) => {
          const marker = new window.google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map: mapInstance.current,
          });
          const info = new window.google.maps.InfoWindow({
            content: `
              <div>
                <img src="http://localhost:5000${p.filePath}" style="width:100px; display:block; margin-bottom:5px;" />
                <div>${new Date(p.taken_at).toLocaleString()}</div>
              </div>
            `,
          });
          marker.addListener("click", () => info.open(mapInstance.current, marker));
        });
      })
      .catch((e) => console.error("사진 불러오기 실패:", e));
  };

  useEffect(() => {
    // 2) Promise 기반 로드 → then 안에서만 Map 생성
    loadGoogleMapsScript()
      .then(() => {
        // 3) mapRef.current 확인
        if (!mapRef.current) {
          console.error("❌ map container를 찾을 수 없습니다.");
          return;
        }
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 36.5, lng: 127.5 },
          zoom: 7,
        });
        loadUserPhotos();
      })
      .catch((err) => {
        console.error("구글 맵 스크립트 로드 실패:", err);
      });
  }, []);

  return (
    <div>
      {/* 맵을 렌더링할 div */}
      <div
        ref={mapRef}
        style={{ width: "100%", height: "600px", marginTop: "10px" }}
      />
    </div>
  );
}
