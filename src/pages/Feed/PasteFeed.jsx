// components/PasteFeed.jsx
import { useEffect, useState } from "react";
import FeedItemCard from "./FeedItemCard";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export default function PasteFeed() {
    const API_BASE = `${BACKEND_URL}/paste`;
    const [pastes, setPastes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(API_BASE)
            .then(res => res.json())
            .then(json => setPastes(json))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p>Loading pastes...</p>;

    return (
        <div className="flex flex-col gap-4">
            {pastes.map(p => (
                <FeedItemCard key={p.slug} type="paste" item={p} />
            ))}
        </div>
    );
}
