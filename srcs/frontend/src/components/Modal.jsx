export function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={onClose} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <div className="relative max-h-full w-full overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_rgba(0,0,0,0.1)] sm:w-auto sm:p-10">

                <div className="mb-5 flex items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-slate-800 sm:text-[28px]">{title}</h2>
                    <button
                        onClick={onClose}
                        className="cursor-pointer p-0 text-6xl leading-[0.5] text-slate-400 transition hover:scale-110 hover:text-blue-500">
                        ×
                    </button>
                </div>

                {children}

            </div>
        </div>
    );
}
