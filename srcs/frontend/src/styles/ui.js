// Classes Tailwind partagées entre plusieurs composants

// Verre dépoli : fond blanc translucide en dégradé + reflet en haut.
// Pas de backdrop-blur : l'image de fond est déjà floue, et le flou était recalculé à chaque image de scroll.
export const glass = "bg-linear-to-br from-white/55 via-white/35 to-sky-100/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_10px_30px_rgba(0,0,0,0.2)]";

// Bordure arc-en-ciel : un ::before dont le masque ne garde que l'anneau de 3px (le centre reste translucide)
export const rainbowBorder = "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:p-[3px] before:content-[''] before:bg-[linear-gradient(135deg,var(--color-red-500),var(--color-orange-400),var(--color-yellow-400),var(--color-green-500),var(--color-blue-500),var(--color-violet-600))] before:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]";

// Bloc principal (lobby, profil, privacy, auth, game) : verre dépoli + bordure arc-en-ciel
export const panel = `relative rounded-3xl ${glass} ${rainbowBorder}`;

// Modal : même verre en plus opaque, pour ne pas lire la page au travers (pas de flou derrière)
export const modalPanel = `relative rounded-3xl bg-linear-to-br from-white/90 via-white/80 to-sky-50/75 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_10px_30px_rgba(0,0,0,0.2)] ${rainbowBorder}`;

// Champ de saisie
export const inputClass = "w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-blue-500";

// Bouton principal : même dégradé que "Create a room" (le SK du logo) ; gris quand il est désactivé
export const btnPrimary = "cursor-pointer rounded-lg bg-linear-to-r from-red-500 via-orange-400 to-yellow-400 font-semibold text-white text-shadow-md transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-none disabled:bg-slate-400 disabled:text-shadow-none disabled:hover:translate-y-0 disabled:hover:brightness-100";

// Label de formulaire
export const labelClass = "text-sm font-bold text-slate-800";

// Bulle de message (format d'EditProfile), déclinée en 3 couleurs
const bubble = "relative mt-2 animate-slide-down rounded-lg border px-3.5 py-2.5 text-[13px] leading-normal shadow-[0_2px_5px_rgba(0,0,0,0.05)]";

// Messages de retour : succès (vert), info (gris), erreur (rouge)
export const feedback = {
    success: `${bubble} border-green-200 bg-green-50 font-semibold text-green-700`,
    info: `${bubble} border-slate-200 bg-slate-50 text-slate-700`,
    error: `${bubble} border-red-200 bg-red-50 font-semibold text-red-600`,
};

// Bulle d'information quand le format est incorrect
export const hint = feedback.info;

// Classe d'une bulle d'information : visible ou cachée (lue seulement par les lecteurs d'écran)
export const hintOrHidden = (visible) => (visible ? hint : "sr-only");

// Sur grand écran (xl), la bulle sort à droite du formulaire au lieu d'agrandir le cadre.
// Le parent doit être en "relative" ; ml-14 = padding du formulaire (p-10) + 16px d'écart.
const tooltip = "xl:absolute xl:top-[26px] xl:left-full xl:z-10 xl:mt-0 xl:ml-14 xl:w-60 xl:py-2 xl:text-xs xl:leading-snug xl:before:absolute xl:before:top-4 xl:before:-left-[7px] xl:before:size-3 xl:before:rotate-45 xl:before:border-b xl:before:border-l xl:before:[border-color:inherit] xl:before:[background:inherit] xl:before:content-['']";

export const hintTooltip = `${hint} ${tooltip}`;

// Erreur serveur en infobulle (pages Auth) : même placement, en rouge
export const errorTooltip = `${feedback.error} ${tooltip}`;

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

// Mêmes tranches du logo, appliquées seulement au survol (menu déroulant du header)
export const logoSliceHover = {
    SK: "hover:bg-linear-to-r hover:from-red-500 hover:via-orange-400 hover:to-yellow-400",
    Y: "hover:bg-linear-to-r hover:from-yellow-400 hover:to-green-500",
    JO: "hover:bg-linear-to-r hover:from-green-500 hover:via-blue-500 hover:to-violet-600",
};

// Texte qui passe en dégradé arc-en-ciel (celui du logo) au survol
export const logoGradientHover = "hover:bg-[linear-gradient(to_right,var(--color-red-500),var(--color-orange-400),var(--color-yellow-400),var(--color-green-500),var(--color-blue-500),var(--color-violet-600))] hover:bg-clip-text hover:text-transparent";
