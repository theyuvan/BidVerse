import { Link } from "react-router-dom";
import Brand from "./Brand";
import ProductSlideshow from "./ProductSlideshow";

const content = {
    buyer: { label: "YOUR NEXT GREAT FIND", title: "Exceptional pieces.\nExtraordinary possibilities.", text: "Explore upcoming auctions and find something worth making yours.", action: "Explore auction rooms", to: "/buyer/rooms" },
    seller: { label: "TURN YOUR COLLECTION INTO OPPORTUNITY", title: "Great pieces deserve\na new beginning.", text: "From your first listing to your final handshake, manage every sale in one place.", action: "List a product", to: "/seller/list-product" },
    host: { label: "BEHIND EVERY GREAT AUCTION", title: "Set the stage.\nBring the bidding to life.", text: "Curate products, prepare your rooms, and create the next great auction.", action: "Create an auction room", to: "/host/rooms/create" }
};

export default function Showcase({ role = "buyer" }) {
    const copy = content[role];
    return <section className={`editorial-banner editorial-${role}`}>
        <div className="editorial-copy"><span className="overline">{copy.label}</span><h2>{copy.title}</h2><p>{copy.text}</p>
            <Link className="button-primary" to={copy.to}>{copy.action} ↗</Link></div>
        <div className="editorial-art"><ProductSlideshow />
            <span className="art-caption">THE ART OF FINDING SOMETHING SPECIAL</span></div>
    </section>;
}

export function AuthVisual() {
    return <aside className="auth-visual"><Brand />
        <div className="auth-visual-copy"><span className="overline">A WORLD OF POSSIBILITIES</span><h2>Your next great<br />find starts here.</h2><p>Step into live auctions. Discover pieces you love.<br />Connect with the people behind them.</p></div>
        <div className="auth-image"><img src="/images/showcase-watch.png" width="500" height="500" alt="A vintage watch from the Bidverse collection" /></div>
        <p className="auth-caption">A little curiosity. A remarkable discovery.</p>
    </aside>;
}
