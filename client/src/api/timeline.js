import axios from 'axios';

// 프론트에서 로그인 이메일 가져오기
export async function fetchTimelineData(userEmail) {
  const res = await axios.get(`http://localhost:5000/api/timeline?user_email=${userEmail}`);
  return res.data;
}
