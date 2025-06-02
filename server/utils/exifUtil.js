const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ExifParser = require("exif-parser");
require("dotenv").config(); // ✅ 환경변수 불러오기

// ✅ 위도, 경도로 주소 정보 가져오기 (Google Maps API)
const reverseGeocode = async (lat, lng) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  try {
    const res = await axios.get(url);
    const place = res.data.results?.[0]?.formatted_address || null;
    return place;
  } catch (err) {
    console.warn("📍 장소 이름 변환 실패:", err.message);
    return null;
  }
};

// ✅ EXIF 정보 + 이미지 base64 추출 함수 (async 버전)
const extractExifData = async (imageFiles) => {
  const dateList = [];
  const gpsList = [];
  const locationList = [];
  const imageMessages = [];

  for (const file of imageFiles) {
    const imagePath = path.join(__dirname, "../uploads", file.filename);
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString("base64");

    try {
      const parser = ExifParser.create(imageBuffer);
      const result = parser.parse();

      // 날짜
      if (result.tags.DateTimeOriginal) {
        dateList.push(new Date(result.tags.DateTimeOriginal * 1000));
      }

      // GPS
      let lat = result.tags.GPSLatitude;
      let lng = result.tags.GPSLongitude;
      if (lat && lng) {
        lat = parseFloat(lat);
        lng = parseFloat(lng);
        gpsList.push({ lat, lng });

        const placeName = await reverseGeocode(lat, lng);
        if (placeName) {
          locationList.push(placeName); // ✅ 위경도 대신 장소 이름만 추가
        }
      } else {
        gpsList.push({ lat: null, lng: null });
      }
    } catch (err) {
      console.warn("EXIF 추출 실패:", err.message);
      gpsList.push({ lat: null, lng: null });
    }

    imageMessages.push({
      type: "image_url",
      image_url: {
        url: `data:image/jpeg;base64,${imageBase64}`,
      },
    });
  }

  return { dateList, gpsList, locationList, imageMessages };
};

module.exports = { extractExifData };
