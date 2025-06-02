const tagLabels = {
  people: '인물',
  landscape: '풍경',
  accommodation: '숙소',
  food: '음식',
};

const allTags = Object.keys(tagLabels);

function FolderSelectModal({ currentTag, onClose, onSelect }) {
  const availableTags = allTags.filter((tag) => tag !== currentTag);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-4 shadow-xl w-64">
        <h3 className="text-lg font-semibold mb-3"> 이동할 폴더 선택</h3>
        <ul>
          {availableTags.map((tag) => (
            <li key={tag}>
              <button
                className="w-full text-left py-2 px-3 hover:bg-gray-100 rounded"
                onClick={() => onSelect(tag)}
              >
                {tagLabels[tag]}
              </button>
            </li>
          ))}
        </ul>
        <button
          className="mt-4 text-sm text-gray-600 hover:underline"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default FolderSelectModal;
