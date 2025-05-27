import { useEffect, useState } from 'react';
import axios from 'axios';

function MyPage() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ diaryCount: 0, photoCount: 0 });

    // 회원 정보 불러오기
    // ✅ 이 useEffect는 마이페이지 열릴 때 자동으로 실행되는 영역
    useEffect(() => {
        // ✅ localStorage에서 로그인한 사용자 정보 꺼내기
        const userData = JSON.parse(localStorage.getItem('user'));
        const userId = userData?.user_id;

        if (!userId) return;

        // ✅ 사용자 정보 요청
        axios.get('/api/user/me', {
            headers: { 'x-user-id': userId }
        })
            .then(res => {
                setUser(res.data); // 사용자 정보 저장

                // ✅ 통계 정보 요청도 이어서!
                return axios.get('/api/user/stats', {
                    headers: { 'x-user-id': userId }
                });
            })
            .then(res => setStats(res.data)) // 통계 저장
            .catch(err => {
                console.error('🔥 사용자 정보 또는 통계 실패:', err);
                // 오류가 나더라도 일단 임시 값 넣어서 화면이 안 죽도록 처리
                setUser({
                    user_name: '게스트',
                    social_type: 'Google',
                    joined_at: new Date().toISOString(),
                    user_id: 'dummy'
                });
                setStats({ diaryCount: 0, photoCount: 0 });
            });
    }, []);


    if (!user) return <p className="text-center mt-10">회원 정보를 불러오는 중입니다...</p>;

    return (
        <div className="w-[420px] mx-auto min-h-screen bg-white p-4 font-sans">
            <h2 className="text-center text-xl font-semibold mb-8">MY PAGE</h2>

            {/* 유저 정보 */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-lg font-bold">{user.user_name} 님</p>
                    <button className="text-sm text-gray-400 hover:underline">편집</button>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                    <p>로그인 방식: {user.social_type}</p>
                    <p>가입일: {new Date(user.joined_at).toLocaleDateString()}</p>
                </div>
            </div>

            {/* 나의 추억쌓기 */}
            <h3 className="text-base font-semibold mb-3">나의 추억쌓기</h3>
            <div className="bg-gray-100 rounded-2xl p-4 mb-6">
                <div className="flex justify-around text-center">
                    <div>
                        <p className="text-sm text-gray-500">작성한 일기</p>
                        <p className="text-xl font-bold text-sky-500">{stats.diaryCount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">업로드한 사진</p>
                        <p className="text-xl font-bold text-sky-500">{stats.photoCount}</p>
                    </div>
                </div>
            </div>

            {/* 로그아웃 버튼 */}
            <div className="text-center mt-8">
                <button
                    onClick={() => {
                        localStorage.removeItem('user');
                        alert("로그아웃 되었습니다.");
                        window.location.href = '/login';
                    }}
                    className="text-sm px-4 py-2 border border-gray-300 rounded-xl text-gray-500 hover:text-blue-500 hover:border-blue-300 transition mb-4"
                >
                    로그아웃
                </button>
            </div>

            {/* 회원 탈퇴 */}
            <div className="text-center mt-8">
                <button
                    onClick={async () => {
                        if (window.confirm("정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
                            try {
                                await axios.delete(`/api/user/${user.user_id}`);

                                // ✅ 로그인 상태 초기화 (자동 로그아웃)
                                localStorage.removeItem('user');

                                alert("회원 탈퇴가 완료되었습니다.");

                                // ✅ 홈으로 이동
                                window.location.href = '/';
                            } catch (err) {
                                alert("탈퇴 중 오류가 발생했습니다.");
                                console.error(err);
                            }
                        }
                    }}
                    className="text-sm px-4 py-2 border border-gray-300 rounded-xl text-gray-500 hover:text-red-500 hover:border-red-300 transition"
                >
                    회원 탈퇴하기
                </button>

            </div>
        </div>
    );
}

export default MyPage;
