import { useEffect, useState } from 'react';
import axios from 'axios';

function MyPage() {
    const [user, setUser] = useState(null);
    const [stats, setStats] = useState({ diaryCount: 0, photoCount: 0 });
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        axios.get('http://localhost:5000/api/user/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                setUser(res.data);
                return axios.get('http://localhost:5000/api/user/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
            })
            .then(res => setStats(res.data))
            .catch(err => {
                console.error('🔥 사용자 정보 또는 통계 실패:', err);
                setUser({
                    user_name: '게스트',
                    social_type: 'Unknown',
                    joined_at: new Date().toISOString(),
                    user_id: 'dummy'
                });
                setStats({ diaryCount: 0, photoCount: 0 });
                setErrorMessage("회원 정보를 불러오는 중 오류가 발생했습니다.");
                setShowErrorModal(true);
            });
    }, []);

    const confirmLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setShowLogoutModal(false);
        setSuccessMessage("로그아웃이 완료되었습니다.");
        setShowSuccessModal(true);
    };

    const confirmDelete = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`http://localhost:5000/api/user`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setShowDeleteModal(false);
            setSuccessMessage("회원 탈퇴가 완료되었습니다.");
            setShowSuccessModal(true);
        } catch (err) {
            console.error(err);
            setErrorMessage("탈퇴 중 오류가 발생했습니다.");
            setShowErrorModal(true);
        }
    };

    if (!user) return <p className="text-center mt-10">회원 정보를 불러오는 중입니다...</p>;

    return (
        <div className="w-[420px] mx-auto min-h-screen bg-white p-4 font-sans">
            <h1 className="text-center text-2xl font-semibold mb-8">MY PAGE</h1>

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

            <div className="text-center mt-8">
                <button
                    onClick={() => setShowLogoutModal(true)}
                    className="text-sm px-4 py-2 border border-gray-300 rounded-xl text-gray-500 hover:text-blue-500 hover:border-blue-300 transition mb-4"
                >
                    로그아웃
                </button>
            </div>

            <div className="text-center mt-8">
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="text-sm px-4 py-2 border border-gray-300 rounded-xl text-gray-500 hover:text-red-500 hover:border-red-300 transition"
                >
                    회원 탈퇴하기
                </button>
            </div>

            {showLogoutModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center w-80">
                        <p className="text-lg font-semibold mb-4">로그아웃 하시겠습니까?</p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="px-4 py-2 rounded bg-blue-400 hover:bg-blue-500 text-white text-sm"
                            >
                                로그아웃
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center w-80">
                        <p className="text-lg font-semibold mb-4">
                            정말 탈퇴하시겠습니까?<br />이 작업은 되돌릴 수 없습니다.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-sm"
                            >
                                취소
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded bg-red-400 hover:bg-red-500 text-white text-sm"
                            >
                                탈퇴
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showErrorModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center w-80">
                        <p className="text-lg font-semibold mb-4">오류</p>
                        <p className="text-m text-gray-700 mb-4 whitespace-pre-wrap">{errorMessage}</p>
                        <button
                            onClick={() => setShowErrorModal(false)}
                            className="px-4 py-2 rounded bg-blue-400 hover:bg-blue-500 text-white text-sm"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-md text-center w-80">
                        <p className="text-lg font-semibold mb-4">완료</p>
                        <p className="text-m text-gray-700 mb-4 whitespace-pre-wrap">{successMessage}</p>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                window.location.href = '/';
                            }}
                            className="px-4 py-2 rounded bg-blue-400 hover:bg-blue-500 text-white text-sm"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MyPage;
