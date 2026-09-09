import { Link } from "react-router-dom";

const collections = [
    { name: "Timeless objects", tag: "WATCHES & COLLECTIBLES", image: "/images/watch.jpeg" },
    { name: "Designed for tomorrow", tag: "TECHNOLOGY", image: "/images/technology.webp" },
    { name: "Spaces with character", tag: "FURNITURE & LIVING", image: "/images/interiors.jpg" }
];

export default function Landing() {
    return <main className="discovery-page">
        <section className="landing-hero">
            <div><span className="overline">DISCOVER THE EXTRAORDINARY</span><h1>Some things are<br />worth <em>bidding for.</em></h1><p>Remarkable objects. Real-time auctions. Your next favourite find is waiting to be discovered.</p>
                <div className="hero-actions"><Link className="button-primary" to="/register">Find your next favourite ↗</Link><Link className="button-outline" to="/login">Sign in to bid</Link></div>
                <div className="hero-footnote"><span>01 / DISCOVER</span><span>02 / BID</span><span>03 / MAKE IT YOURS</span></div>
            </div>
            <div className="landing-art"><span className="collection-stamp">OBJECTS<br />WITH A STORY</span><img src="/images/watch.jpeg" width="600" height="600" alt="Vintage mechanical watch on a leather strap" /><div className="landing-art-caption"><span>TIMELESS BY DESIGN</span><strong>A new chapter for a classic.</strong></div></div>
        </section>
        <section className="discovery-collections" id="collections"><div className="discovery-heading"><div><span className="overline">FOLLOW YOUR CURIOSITY</span><h2>Find your kind of remarkable.</h2></div><Link to="/login">Explore auctions ↗</Link></div>
            <div className="collection-grid">{collections.map(item => <Link className="collection-card" key={item.name} to="/login"><div><img src={item.image} width="400" height="300" alt={item.name} loading="lazy" /></div><span className="overline">{item.tag}</span><h3>{item.name} <span>↗</span></h3></Link>)}</div>
        </section>
        <section className="how-it-works" id="how-it-works"><div className="discovery-heading"><div><span className="overline">YOUR NEXT FIND, IN THREE STEPS</span><h2>From discovery to a done deal.</h2></div></div>
            <div className="steps-grid">{[["01", "Find your room", "Browse upcoming auctions, explore the products, and reserve your seat."], ["02", "Be part of the moment", "Join the live room and place your bids as the auction unfolds."], ["03", "Make it yours", "Review your winning deal, connect with the seller, and confirm together."]].map(([number,title,text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>
        <section className="seller-invitation"><div><span className="overline">SOMETHING WORTH SHARING?</span><h2>Your collection. Their next discovery.</h2><p>Give your products a new audience. Start your seller journey today.</p></div><Link className="button-primary" to="/register">Start selling ↗</Link></section>
    </main>;
}
