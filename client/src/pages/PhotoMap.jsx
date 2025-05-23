// client/src/pages/PhotoMap.jsx

import React, { useEffect, useRef } from "react";

function loadGoogleMapsScript() {
  // ← 여기서 Promise 를 리턴해야 합니다!
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    const scriptId = "google-maps-script";
    const existing = document.getElementById(scriptId);

    if (existing) {
      // 이미 추가된 <script> 태그가 있으면 load/error 이벤트로 기다렸다가
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
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
  const currentInfoWindow = useRef(null);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        if (!mapRef.current) throw new Error("map container not found");

        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          center: { lat: 36.5, lng: 127.5 },
          zoom: 7,
        });

        const token = localStorage.getItem("token");
        if (!token) return;

        fetch("http://localhost:5000/userPhotos", {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => {
            if (!r.ok) throw new Error(r.statusText);
            return r.json();
          })
          .then((photos) => {
            photos.forEach((p) => {
              const marker = new window.google.maps.Marker({
                position: { lat: p.lat, lng: p.lng },
                map: mapInstance.current,
              });

              const iw = new window.google.maps.InfoWindow({
                content: `
                  <div>
                    <img
                      id="photo-${p.photoIdx}"
                      src="http://localhost:5000${p.filePath}"
                      style="width:100px;cursor:pointer;"
                    />
                    <p>${new Date(p.taken_at).toLocaleString()}</p>
                  </div>`,
              });

              marker.addListener("click", () => {
                if (currentInfoWindow.current) {
                  currentInfoWindow.current.close();
                }
                iw.open(mapInstance.current, marker);
                currentInfoWindow.current = iw;

                window.google.maps.event.addListenerOnce(iw, "domready", () => {
                  const imgEl = document.getElementById(`photo-${p.photoIdx}`);
                  if (!imgEl) return;
                  imgEl.onclick = () => {
                    fetch(
                      `http://localhost:5000/api/diary/photo/${p.photoIdx}`,
                      {
                        headers: { Authorization: `Bearer ${token}` },
                      }
                    )
                      .then((r) => {
                        if (!r.ok) throw new Error(r.statusText);
                        return r.json();
                      })
                      .then((d) => {
                        new window.google.maps.InfoWindow({
                          content: `
                            <div style="max-width:250px;">
                              <h4>${d.diary_title}</h4>
                              <p>${d.diary_content}</p>
                              <small>${d.trip_date}</small>
                            </div>`,
                        }).open(mapInstance.current, marker);
                      })
                      .catch(console.error);
                  };
                });
              });
            });
          })
          .catch(console.error);
      })
      .catch((err) => console.error("구글 맵 로드 실패:", err));
  }, []);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "600px", marginTop: 10 }}
    />
  );
}
