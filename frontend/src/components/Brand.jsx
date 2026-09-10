import { Link } from "react-router-dom";

export default function Brand({ to = "/" }) {
    return <Link className="brand" to={to} aria-label="Bidverse home">
        <img className="brand-logo" src="/images/bidverse-logo.svg" width="42" height="47" alt="" />
        <span>bidverse<span className="brand-period">.</span></span>
    </Link>;
}
