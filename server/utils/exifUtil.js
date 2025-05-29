const fs = require("fs");
const path = require("path");
const ExifParser = require("exif-parser");

// ✅ EXIF 정보 + 이미지 base64 추출 함수
const extractExifData = (imageFiles) => {
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
        locationList.push(`위도 ${lat}, 경도 ${lng}`); // 이 부분을 프롬프트에 넣지 않으려면 controller에서 제거하면 됩니다
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
