import { panel } from '../styles/ui';

export function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* La page actuelle reste visible derrière, assombrie et floutée pour que la modal en verre reste lisible */}
            <div onClick={onClose} className="absolute inset-0 bg-slate-900/30 backdrop-blur-md" />
            {/* Le scroll est sur le bloc intérieur pour que la bordure arc-en-ciel (::before) reste fixe */}
            <div className={`${panel} flex max-h-full w-full flex-col sm:w-auto`}>
                <div className="overflow-y-auto p-5 sm:p-10">

                    <div className="mb-5 flex items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold text-slate-800 sm:text-[28px]">{title}</h2>
                        <button
                            onClick={onClose}
                            className="cursor-pointer p-0 text-6xl leading-[0.5] text-slate-600 transition hover:scale-110 hover:text-blue-500">
                            ×
                        </button>
                    </div>

                    {children}

                </div>
            </div>
        </div>
    );
}
