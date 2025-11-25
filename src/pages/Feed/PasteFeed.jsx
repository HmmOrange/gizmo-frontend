import { useEffect, useState } from "react";
import FeedItemCard from "./FeedItemCard";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function PasteFeed() {
    const API_BASE = `${BACKEND_URL}/paste`;
    const SEARCH_API = `${BACKEND_URL}/paste/search`;

    const [pastes, setPastes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [sort, setSort] = useState("newest");


    // Fetch list paste mặc định
    const loadPastes = (sortOption = sort) => {
        setLoading(true);
        fetch(`${API_BASE}?sort=${sortOption}`)
            .then((res) => res.json())
            .then((json) => setPastes(json))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadPastes();
    }, []);

    // Handle search
    const handleSearch = async () => {
        // Nếu không nhập gì → load lại feed gốc
        if (!query.trim()) {
            loadPastes();
            return;
        }

        setSearching(true);
        try {
            const res = await fetch(`${SEARCH_API}?q=${encodeURIComponent(query)}`);
            const json = await res.json();
            setPastes(json);
        } catch (err) {
            console.error("Search error:", err);
        } finally {
            setSearching(false);
        }
    };

    if (loading) return <p>Loading pastes...</p>;

    return (
        <div className="flex flex-col gap-4">
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
                            loadPastes(btn.value);
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


            <div className="flex gap-2">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search pastes by content..."
                    className="flex-1 p-2 bg-gray-800 text-white rounded border border-gray-600"
                />
                <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {searching ? "Searching..." : "Search"}
                </button>
            </div>

            {pastes.length === 0 && (
                <p className="text-gray-400">No results found.</p>
            )}

            {pastes.map((p) => (
                <FeedItemCard key={p.slug} type="paste" item={p} />
            ))}
        </div>
    );
}
