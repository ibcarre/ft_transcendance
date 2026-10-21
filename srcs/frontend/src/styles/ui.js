// Classes Tailwind partagées entre plusieurs composants

// Bloc bleu clair principal (lobby, profil, privacy, auth)
export const panel = "rounded-3xl border-2 border-white bg-sky-100 shadow-[0_10px_25px_rgba(0,0,0,0.05)]";

// Champ de saisie
export const inputClass = "w-full min-w-0 rounded-lg border border-slate-300 px-4 py-3 text-[15px] outline-none transition-colors focus:border-blue-500";

// Bouton bleu
export const btnPrimary = "cursor-pointer rounded-lg bg-blue-500 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:hover:translate-y-0";

// Label de formulaire
export const labelClass = "text-sm font-bold text-slate-800";

// Bulle d'information quand le format est incorrect
export const hint = "relative mt-2 animate-slide-down rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] leading-normal text-slate-700 shadow-[0_2px_5px_rgba(0,0,0,0.05)]";

// Message de succès
export const success = "text-[13px] font-semibold text-green-500";

// Classe d'une bulle d'information : visible ou cachée (lue seulement par les lecteurs d'écran)
export const hintOrHidden = (visible) => (visible ? hint : "sr-only");

// Sur grand écran (xl), la bulle sort à droite du formulaire au lieu d'agrandir le cadre.
// Le parent doit être en "relative" ; ml-14 = padding du formulaire (p-10) + 16px d'écart.
const tooltip = "xl:absolute xl:top-[26px] xl:left-full xl:z-10 xl:mt-0 xl:ml-14 xl:w-60 xl:py-2 xl:text-xs xl:leading-snug xl:before:absolute xl:before:top-4 xl:before:-left-[7px] xl:before:size-3 xl:before:rotate-45 xl:before:border-b xl:before:border-l xl:before:border-slate-200 xl:before:bg-slate-50 xl:before:content-['']";

export const hintTooltip = `${hint} ${tooltip}`;

export const tooltipOrHidden = (visible) => (visible ? hintTooltip : "sr-only");
