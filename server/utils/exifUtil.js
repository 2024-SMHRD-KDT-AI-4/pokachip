const fs = require("fs");
const path = require("path");
const axios = require("axios");
const ExifParser = require("exif-parser");
require("dotenv").config();

// ✅ 위도·경도로 장소명 변환 (Google Maps API)
const reverseGeocode = async (lat, lng) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
  try {
    const res = await axios.get(url);
    return res.data.results?.[0]?.formatted_address || null;
  } catch (err) {
    console.warn("📍 장소 이름 변환 실패:", err.message);
    return null;
  }
};

// ✅ EXIF + 이미지 분석용 base64 + DB용 위경도 분리
const extractExifData = async (imageFiles) => {
  const dateList = [];
  const gpsList = [];         // ✅ DB 저장용
  const locationList = [];    // ✅ GPT 프롬프트용
  const imageMessages = [];   // ✅ GPT 이미지 분석용

  for (const file of imageFiles) {
    const imagePath = path.join(__dirname, "../uploads", file.filename);
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString("base64");

    let lat = null;
    let lng = null;

    try {
      const parser = ExifParser.create(imageBuffer);
      const result = parser.parse();

      // ✅ 날짜 추출
      if (result.tags.DateTimeOriginal) {
        dateList.push(new Date(result.tags.DateTimeOriginal * 1000));
      }

      // ✅ GPS 추출
      if (result.tags.GPSLatitude && result.tags.GPSLongitude) {
        lat = parseFloat(result.tags.GPSLatitude);
        lng = parseFloat(result.tags.GPSLongitude);
      }

      // ✅ DB용 GPS 정보 push
      gpsList.push({ lat, lng });

      // ✅ GPT 프롬프트용 위치정보 (주소 변환)
      if (lat && lng) {
        const placeName = await reverseGeocode(lat, lng);
        if (placeName) locationList.push(placeName);
      }
    } catch (err) {
      console.warn("📸 EXIF 파싱 실패:", err.message);
      gpsList.push({ lat: null, lng: null });
    }

    // ✅ GPT 이미지 분석용 base64
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
