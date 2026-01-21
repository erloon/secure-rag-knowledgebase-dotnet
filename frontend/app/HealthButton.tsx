"use client";

export default function HealthButton({ apiUrl }: { apiUrl: string }) {
    const handleClick = async () => {
        const a = `${apiUrl}/health`;
        const res = await fetch(`${apiUrl}/health`);
        const data = await res.json();
        console.log(data);
    };

    return (
        <button onClick={handleClick} className="...">
        Get Health Status
    </button>
);
}