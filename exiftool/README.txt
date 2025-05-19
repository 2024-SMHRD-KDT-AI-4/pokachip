설치방법 : https://exiftool.org/, 맨 위에 꺼 선택, 64bit와 32bit는 설치하는거 아님

EXIFTOOL은 이미지, 동영상, PDF 등 다양한 파일의 메타데이터(속성 정보)를 읽고, 
수정하고, 삭제할 수 있는 전문 도구입니다. 사진 속 EXIF 정보를 다룰 때 가장 강력하고 정확한 도구로 평가받음!

🔧 ExifTool 주요 기능
기능	설명
🔍 메타데이터 읽기	exiftool photo.jpg — 모든 정보를 출력
📌 특정 태그만 보기	exiftool -DateTimeOriginal photo.jpg
📍 GPS 정보 추출	exiftool -GPSLatitude -GPSLongitude photo.jpg
✏️ 메타데이터 수정	exiftool -DateTimeOriginal="2023:01:01 12:00:00" photo.jpg
❌ 메타데이터 삭제	exiftool -all= photo.jpg (EXIF 삭제 후 백업 생성)
📦 JSON 출력	exiftool -json photo.jpg → 파이썬, JS에서 활용 가능

========================================================================================================

ExifTool package for 64-bit Windows
___________________________________

Double-click on "exiftool(-k).exe" to read the application documentation, or
drag-and-drop files to extract metadata.

For command-line use, rename to "exiftool.exe".

Run directly in from the exiftool-##.##_64 folder, or copy the .exe and the
"exiftool_files" folder to wherever you want (preferably somewhere in your
PATH) to run from there.

See https://exiftool.org/install.html for more installation instructions.
