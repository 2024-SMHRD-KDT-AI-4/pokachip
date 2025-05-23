// client/src/PhotoMap.jsx

import React, { useEffect, useRef } from "react";

function loadGoogleMapsScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve();
    const id = "google-maps-script";
    if (document.getElementById(id)) {
      document.getElementById(id).addEventListener("load", resolve);
      document.getElementById(id).addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDWQsyvCTLoek2LGOdXImWra7OvChrMya8";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function PhotoMap() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) throw new Error("map container not found");
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 36.5, lng: 127.5 },
          zoom: 7,
        });

        // const token = localStorage.getItem("token");
        // if (!token) return alert("로그인이 필요합니다.");

        // 1) 사진 리스트 가져오기
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

              const infoWindow = new window.google.maps.InfoWindow({
                content: `
                  <div>
                    <img
                      id="photo-${p.photoIdx}"
                      src="http://localhost:5000${p.filePath}"
                      style="width:100px;cursor:pointer;"
                    />
                    <p>${new Date(p.taken_at).toLocaleString()}</p>
                  </div>
                `,
              });

              // 2) 마커 클릭 → InfoWindow 열기 + domready에서 이미지 클릭 바인딩
              marker.addListener("click", () => {
                infoWindow.open(mapInstance.current, marker);

                window.google.maps.event.addListenerOnce(
                  infoWindow,
                  "domready",
                  () => {
                    const imgEl = document.getElementById(`photo-${p.photoIdx}`);
                    if (!imgEl) return;
                    imgEl.onclick = () => {
                      // 3) 이미지 클릭 → 일기 API 호출 → 새 InfoWindow 로 출력
                      fetch(
                        `http://localhost:5000/api/diary/photo/${p.photoIdx}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                      )
                        .then(async (r) => {
                          if (!r.ok) throw new Error(await r.text());
                          return r.json();
                        })
                        .then((d) => {
                          new window.google.maps.InfoWindow({
                            content: `
                              <div style="max-width:250px">
                                <h4>${d.diary_title}</h4>
                                <p>${d.diary_content}</p>
                                <small>${d.trip_date}</small>
                              </div>
                            `,
                          }).open(mapInstance.current, marker);
                        })
                        .catch((e) => console.error(e));
                    };
                  }
                );
              });
            });
          })
          .catch((e) => console.error("사진 불러오기 실패:", e));
      })
      .catch((err) => console.error("구글 맵 로드 실패:", err));
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "600px", marginTop: "10px" }}
    />
  );
}
