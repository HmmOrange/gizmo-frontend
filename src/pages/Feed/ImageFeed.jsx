import { useEffect, useState } from "react";
import FeedItemCard from "./FeedItemCard";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function ImageFeed() {
    const API_BASE = `${BACKEND_URL}/api/images`;

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState("newest");

    const loadImages = (sortOption = sort) => {
        setLoading(true);

        fetch(`${API_BASE}?sort=${sortOption}`)
            .then((res) => res.json())
            .then((json) => setData(json.images || []))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadImages();
    }, []);

    if (loading) return <p>Loading images...</p>;

    return (
        <div className="flex flex-col gap-4">

            {/* SORT BUTTONS (Tailwind giống PasteFeed) */}
            <div className="flex gap-2 mb-2">
                {[
                    { value: "newest", label: "Newest" },
                    { value: "views", label: "Views" },
                    { value: "bookmark", label: "Bookmarks" }
                ].map((btn) => (
                    <button
                        key={btn.value}
                        onClick={() => {
                            setSort(btn.value);
                            loadImages(btn.value);
                        }}
                        className={`
                            px-4 py-2 rounded-lg border 
                            transition-all duration-200
                            ${sort === btn.value
                                ? "bg-blue-500 text-white border-blue-600"
                                : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"}
                        `}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            {/* IMAGE GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.map((img) => (
                    <FeedItemCard key={img._id} type="image" item={img} />
                ))}
            </div>
        </div>
    );
}
