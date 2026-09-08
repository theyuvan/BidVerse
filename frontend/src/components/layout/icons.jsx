const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };

export const IconRooms = (p) => (
    <svg {...common} {...p}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M9 20v-6h6v6" /></svg>
);
export const IconBookings = (p) => (
    <svg {...common} {...p}><rect x="3.5" y="5" width="17" height="16" rx="2.5" /><path d="M3.5 10h17" /><path d="M8 3v4M16 3v4" /></svg>
);
export const IconDeals = (p) => (
    <svg {...common} {...p}><path d="M8 12h2l1.5 1.5L14 10l2 2 2-2" /><rect x="3" y="7" width="18" height="12" rx="2.5" /></svg>
);
export const IconProfile = (p) => (
    <svg {...common} {...p}><circle cx="12" cy="8.5" r="3.3" /><path d="M5 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5" /></svg>
);
export const IconAdd = (p) => (
    <svg {...common} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></svg>
);
export const IconList = (p) => (
    <svg {...common} {...p}><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1.2" fill="currentColor" stroke="none" /><circle cx="3.5" cy="12" r="1.2" fill="currentColor" stroke="none" /><circle cx="3.5" cy="18" r="1.2" fill="currentColor" stroke="none" /></svg>
);
export const IconVerify = (p) => (
    <svg {...common} {...p}><path d="M9 12.5 11 14.5 15.5 9.5" /><circle cx="12" cy="12" r="9" /></svg>
);
export const IconCreate = (p) => (
    <svg {...common} {...p}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 9v6M9 12h6" /></svg>
);
export const IconLogout = (p) => (
    <svg {...common} {...p}><path d="M15 17.5 20 12l-5-5.5" /><path d="M20 12H9" /><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /></svg>
);
export const IconBell = (p) => (
    <svg {...common} {...p}><path d="M6 9a6 6 0 0 1 12 0c0 3.2 1 4.6 1.6 5.4H4.4C5 13.6 6 12.2 6 9Z" /><path d="M10 18.5a2 2 0 0 0 4 0" /></svg>
);
export const IconSearch = (p) => (
    <svg {...common} {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
);
export const IconGavel = (p) => (
    <svg {...common} {...p}><path d="M8 9 14 3l3 3-6 6" /><path d="M10 11l6 6" /><path d="M3 21h9" /><path d="M14 12l7 7" /></svg>
);
