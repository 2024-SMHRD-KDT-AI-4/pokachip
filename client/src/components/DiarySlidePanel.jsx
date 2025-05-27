import { motion, useDragControls } from 'framer-motion';

function DiarySlidePanel({ diary }) {
  const controls = useDragControls();

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl z-50 max-h-[60%] overflow-y-auto p-4"
      drag="y"
      dragConstraints={{ top: 0, bottom: 300 }}
      dragElastic={0.2}
      onDragStart={(e) => controls.start(e)}
      initial={{ y: 300 }}
      animate={{ y: 0 }}
      exit={{ y: 300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {diary ? (
        <div>
          <h3 className="text-lg font-bold mb-2">{diary.diary_title}</h3>
          <p className="text-sm whitespace-pre-line">{diary.diary_content}</p>
        </div>
      ) : (
        <div className="text-center text-gray-400">일기 정보를 불러오는 중...</div>
      )}
    </motion.div>
  );
}

export default DiarySlidePanel;
