export function Village() {
    return (
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <polygon points="50,20 80,50 70,50 70,80 30,80 30,50 20,50" stroke="black" stroke-width="2" fill="none" />
        </svg>
    )
}

export function Monster() {
    return 
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="20" stroke="black" stroke-width="2" fill="none" />
            <path d="M30,30 Q40,20 50,30 M70,30 Q60,20 50,30" stroke="black" stroke-width="2" fill="none" />
        </svg>
}

export function Forest() {
    return (
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="10" stroke="black" strokeWidth="2" fill="none" />
            <circle cx="70" cy="30" r="10" stroke="black" strokeWidth="2" fill="none" />
            <circle cx="50" cy="70" r="10" stroke="black" strokeWidth="2" fill="none" />
            {/* Add lines for the bulb bases */}
            <line x1="30" y1="40" x2="30" y2="50" stroke="black" strokeWidth="2" />
            <line x1="70" y1="40" x2="70" y2="50" stroke="black" strokeWidth="2" />
            <line x1="50" y1="80" x2="50" y2="90" stroke="black" strokeWidth="2" />
        </svg>
    )
}

export function Farmland() {
    return 
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <line x1="20" y1="80" x2="80" y2="20" stroke="black" stroke-width="2" />
            <line x1="30" y1="90" x2="90" y2="30" stroke="black" stroke-width="2" />
            <line x1="10" y1="70" x2="70" y2="10" stroke="black" stroke-width="2" />
        </svg>
}

export function Water() {
    return 
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            <path d="M20,40 Q30,30 40,40 T60,40 T80,40" stroke="black" stroke-width="2" fill="none" />
            <path d="M20,60 Q30,50 40,60 T60,60 T80,60" stroke="black" stroke-width="2" fill="none" />
        </svg>
}

