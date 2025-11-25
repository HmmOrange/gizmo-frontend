// components/FeedItemCard.jsx
export default function FeedItemCard({ type, item }) {
    if (type === "image") {
        return (
            <a
                href={`share/image/${item.slug}`}
                className="border rounded shadow hover:shadow-lg transition bg-white"
            >
                <img
                    src={item.imageUrl}
                    // alt={item.caption}
                    className="w-full h-52 object-cover rounded-t"
                />
                <div className="p-3">
                    <p className="font-medium truncate">{item.slug || "No caption"}</p>
                    <p className="text-sm text-gray-500">{item.views} views</p>
                </div>
            </a>
        );
    }

    if (type === "paste") {
        return (
            <a
                href={`/share/${item.slug}`}
                className="border rounded p-3 shadow hover:shadow-lg transition bg-white"
            >
                <h3 className="font-semibold text-lg truncate">
                    {item.title || "Untitled Paste"}
                </h3>
                <p className="text-gray-600 text-sm mt-1 line-clamp-3">
                    {item.content}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                    {item.views || 0} views
                </p>
            </a>
        );
    }

    return null;
}
