import axios from 'axios';
const baseURL =
  import.meta.env.MODE === "development"
    ? import.meta.env.VITE_API_LOCAL
    : import.meta.env.VITE_API_DEPLOY;

// 프론트에서 로그인 이메일 가져오기
export async function fetchTimelineData(userEmail) {
  const res = await axios.get(`${baseURL}/api/timeline?user_email=${userEmail}`);
  return res.data;
}

