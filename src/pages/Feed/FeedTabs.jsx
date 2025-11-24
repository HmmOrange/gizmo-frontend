// components/FeedTabs.jsx
export default function FeedTabs({ tab, setTab }) {
    return (
        <div className="flex gap-4 mb-6 border-b pb-2">
            <button
                onClick={() => setTab("images")}
                className={`px-4 py-2 rounded ${tab === "images" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
            >
                Images
            </button>

            <button
                onClick={() => setTab("pastes")}
                className={`px-4 py-2 rounded ${tab === "pastes" ? "bg-blue-600 text-white" : "bg-gray-200"
                    }`}
            >
                Pastes
            </button>
        </div>
    );
}
