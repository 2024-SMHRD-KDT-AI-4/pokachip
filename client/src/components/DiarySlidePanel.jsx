import { useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useDragControls,
  useAnimation
} from 'framer-motion';

function DiarySlidePanel({ diary, showHandle = true }) {
  const controls = useDragControls();
  const y = useMotionValue(200); // ✅ 시작 위치: 일기 일부 보이게
  const animationControls = useAnimation();

  const handleDragEnd = (_, info) => {
    if (info.offset.y < -100) {
      animationControls.start({
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
      });
    } else {
      animationControls.start({
        y: 500,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
      });
    }
  };

  useEffect(() => {
    animationControls.start({ y: 200 }); // ✅ 초기 위치 복원
  }, [animationControls]);

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 500 }}
      dragControls={controls}
      dragListener={false}
      onDragEnd={handleDragEnd}
      style={{ y }}
      animate={animationControls}
      initial={{ y: 200 }}
      className="fixed bottom-0 left-0 w-full max-w-[420px] bg-white z-50"
    >
      {/* 🔘 슬라이드 핸들 */}
      {showHandle && (
        <div
          className="w-full flex justify-center items-center py-2 cursor-pointer"
          onPointerDown={(e) => controls.start(e)}
        >
          <div className="w-16 h-1.5 bg-gray-400 rounded-full" />
        </div>
      )}

      {/* 📘 일기 내용 */}
      {diary ? (
        <div className="px-4 pb-6 text-sm text-gray-800 whitespace-pre-line">
          <h3 className="text-lg font-bold mb-2">{diary.diary_title}</h3>
          <p>{diary.diary_content}</p>
        </div>
      ) : (
        <div className="px-4 pb-6 text-center text-gray-500">일기 없음</div>
      )}
    </motion.div>
  );
}

export default DiarySlidePanel;
