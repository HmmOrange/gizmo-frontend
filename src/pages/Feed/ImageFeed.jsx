// components/ImageFeed.jsx
import { useEffect, useState } from "react";
import FeedItemCard from "./FeedItemCard";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function ImageFeed() {
    const API_BASE = `${BACKEND_URL}/api/images`;
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(API_BASE)
            .then(res => res.json())
            .then(json => {
                setData(json.images || json);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Loading images...</p>;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.map(img => (
                <FeedItemCard
                    key={img._id}
                    type="image"
                    item={img}
                />
            ))}
        </div>
    );
}
