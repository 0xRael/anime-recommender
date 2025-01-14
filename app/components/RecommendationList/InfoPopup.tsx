import { RefObject } from 'react'

interface InfoPopupProps {
  onClose: () => void
  popupRef: RefObject<HTMLDivElement>
}

export default function InfoPopup({ onClose, popupRef }: InfoPopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={popupRef} className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md">
        <h4 className="text-lg font-semibold mb-2 text-white">How recommendations work</h4>
        <p className="text-sm text-gray-400">
          This anime was recommended based on your viewing history, preferences, and recommendations from users with similar taste. The predicted rating is
          calculated using a weighted system that considers your ratings, watch time for similar genres and
          tags, and how often this anime is recommended to fans of anime you've enjoyed.
        </p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Close
        </button>
      </div>
    </div>
  )
}

