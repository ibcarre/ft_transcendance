// Couleurs du vrai Skyjo : négatif bleu foncé, 0 bleu clair, 1-4 vert, 5-8 jaune, 9-12 rouge
const valueColor = (value) => {
    if (value < 0) return "bg-indigo-700 text-white";
    if (value === 0) return "bg-sky-300 text-sky-950";
    if (value <= 4) return "bg-green-500 text-white";
    if (value <= 8) return "bg-yellow-300 text-yellow-950";
    return "bg-red-500 text-white";
};

const sizes = {
    sm: "h-8 w-6 rounded text-[11px] border sm:h-11 sm:w-8 sm:text-sm",
    lg: "h-20 w-14 rounded-xl text-xl border-2 sm:h-28 sm:w-20 sm:text-3xl",
};

// status : 'hidden' | 'revealed' | 'removed' (comme PublicBoardCard côté back)
export function Card({ status = 'hidden', value, size = 'lg', onClick, highlight = false }) {
    const base = `${sizes[size]} relative flex shrink-0 select-none items-center justify-center font-black transition`;

    if (status === 'removed') {
        return <div className={`${base} border-dashed border-slate-300 bg-transparent`} />;
    }

    const clickable = onClick
        ? "cursor-pointer ring-4 ring-blue-400 hover:-translate-y-1"
        : "";
    const glow = highlight ? "ring-4 ring-amber-400" : "";
    const face = status === 'revealed'
        ? `${valueColor(value)} border-white shadow-[0_4px_10px_rgba(0,0,0,0.15)]`
        : "border-white bg-blue-900 shadow-[0_4px_10px_rgba(0,0,0,0.15)]";

    return (
        <div className={`${base} ${face} ${clickable || glow}`} onClick={onClick}>
            {status === 'revealed' ? (
                value
            ) : (
                size === 'lg' && <div className="size-3/5 rotate-45 rounded-md border-2 border-sky-300/50" />
            )}
        </div>
    );
}
