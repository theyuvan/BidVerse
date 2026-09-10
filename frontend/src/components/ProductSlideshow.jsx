import { useEffect, useState } from "react";

const images = [
    { src: "/images/showcase-watch.png", alt: "Vintage watch with a leather strap" },
    { src: "/images/technology.png", alt: "Smartphone from the technology collection" },
    { src: "/images/interiors.jpg", alt: "Wood writing desk in a curated interior" }
];

export default function ProductSlideshow() {
    const [index, setIndex] = useState(0);
    const [hovered, setHovered] = useState(false);
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(() => document.hidden);
    const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    useEffect(() => {
        const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updateMotion = () => setReducedMotion(preference.matches);
        const updateVisibility = () => setHidden(document.hidden);
        preference.addEventListener("change", updateMotion);
        document.addEventListener("visibilitychange", updateVisibility);
        return () => {
            preference.removeEventListener("change", updateMotion);
            document.removeEventListener("visibilitychange", updateVisibility);
        };
    }, []);
    useEffect(() => {
        if (hovered || focused || hidden || reducedMotion) return;
        const timer = window.setInterval(() => setIndex(current => (current + 1) % images.length), 3500);
        return () => window.clearInterval(timer);
    }, [hovered, focused, hidden, reducedMotion]);

    return <div className="product-slideshow" role="region" aria-roledescription="carousel" aria-label="Featured product images"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
        <div className="product-slideshow-stage" aria-live="off" data-slide={index}>
            {images.map((image, position) => <div key={image.src} className={`product-slide${position === index ? " is-current" : ""}`} aria-hidden={position !== index}>
                <img src={image.src} width="380" height="340" alt={image.alt} draggable="false" />
            </div>)}
        </div>
        <div className="product-slideshow-controls">
            <div className="product-slide-dots" aria-label="Choose a product image">{images.map((image, position) =>
                <button key={image.src} type="button" aria-label={`Show image ${position + 1}: ${image.alt}`} aria-pressed={index === position} onClick={() => setIndex(position)}><span /></button>)}</div>
        </div>
    </div>;
}
