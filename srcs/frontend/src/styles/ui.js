// Classes Tailwind partagées entre plusieurs composants

// Verre dépoli : fond blanc translucide en dégradé, flou de l'arrière-plan, reflet en haut
export const glass = "bg-linear-to-br from-white/45 via-white/20 to-sky-100/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-md backdrop-saturate-150";

// Bordure arc-en-ciel : un ::before dont le masque ne garde que l'anneau de 3px (le centre reste translucide)
const rainbowBorder = "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:p-[3px] before:content-[''] before:bg-[linear-gradient(135deg,var(--color-red-500),var(--color-orange-400),var(--color-yellow-400),var(--color-green-500),var(--color-blue-500),var(--color-violet-600))] before:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]";

// Bloc principal (lobby, profil, privacy, auth, game) : verre dépoli + bordure arc-en-ciel
export const panel = `relative rounded-3xl ${glass} ${rainbowBorder}`;

// Champ de saisie
export const inputClass = "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-blue-500";

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

// Texte du logo SKYJO en dégradé (pour revenir au bleu : logoGradient = logoBlue)
export const logoBlue = "bg-linear-to-r from-blue-900 via-blue-600 to-sky-400 bg-clip-text text-transparent";
export const logoRainbow = "bg-[linear-gradient(to_right,var(--color-red-500),var(--color-orange-400),var(--color-yellow-400),var(--color-green-500),var(--color-blue-500),var(--color-violet-600))] bg-clip-text text-transparent";

export const logoGradient = logoRainbow;

// Boutons du lobby : chacun reprend une tranche du dégradé du logo (logoRainbow)
// + ombre du texte pour garder le blanc lisible sur le jaune
export const btnLobby = "cursor-pointer font-bold text-white shadow-[0_6px_16px_rgba(0,0,0,0.2)] text-shadow-md transition hover:-translate-y-[3px] hover:brightness-110 hover:shadow-[0_10px_22px_rgba(0,0,0,0.25)]";

export const logoSlice = {
    SK: "bg-linear-to-r from-red-500 via-orange-400 to-yellow-400",
    Y: "bg-linear-to-r from-yellow-400 to-green-500",
    JO: "bg-linear-to-r from-green-500 via-blue-500 to-violet-600",
};
