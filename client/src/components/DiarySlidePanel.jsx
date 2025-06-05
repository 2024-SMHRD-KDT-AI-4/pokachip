import { useEffect, useState } from 'react';
import {
  motion,
  useMotionValue,
  useDragControls,
  useAnimation
} from 'framer-motion';

function DiarySlidePanel({ diary, showHandle = true, panelRef, panelHeight }) {
  const controls = useDragControls();
  const y = useMotionValue(0);
  const animationControls = useAnimation();
  const [initialY, setInitialY] = useState(0);
  const handleOnlyHeight = 22;

  useEffect(() => {
    const startY = panelHeight - handleOnlyHeight;
    setInitialY(startY);

    // 진입 시 툭 떨어지는 느낌 없이 고정
    animationControls.start({
      y: startY,
      transition: { duration: 0 },
    });
  }, [panelHeight, animationControls]);

  const handleDragEnd = (_, info) => {
    if (info.offset.y < -100) {
      animationControls.start({
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
      });
    } else {
      animationControls.start({
        y: initialY,
        transition: { type: 'spring', stiffness: 300, damping: 30 },
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <motion.div
      ref={panelRef}
      drag="y"
      dragConstraints={{ top: 0, bottom: initialY }}
      dragControls={controls}
      dragListener={false}
      onDragEnd={handleDragEnd}
      style={{ y }}
      animate={animationControls}
      initial={false}
      className="fixed bottom-0 left-0 w-full max-w-[420px] bg-white z-50"
    >
      {showHandle && (
        <div
          className="w-full flex justify-center items-center py-2 cursor-pointer"
          onPointerDown={(e) => controls.start(e)}
        >
          <div className="w-16 h-1.5 bg-gray-400 rounded-full" />
        </div>
      )}

      {diary ? (
        <div className="px-6 pb-10 text-center">
          <h3 className="text-xl font-bold mb-1">{diary.diary_title}</h3>
          <p className="text-sm text-gray-500 mb-4">
            {diary.trip_date?.includes("~")
              ? diary.trip_date
              : formatDate(diary.trip_date)}
          </p>
          <div className="text-gray-800 whitespace-pre-line leading-relaxed mb-8">
            {diary.diary_content}
          </div>
        </div>
      ) : (
        <div className="px-6 pb-10 text-center text-gray-500">일기 없음</div>
      )}
    </motion.div>
  );
}

export default DiarySlidePanel;
