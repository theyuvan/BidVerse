import { useState } from "react";

export default function ProductPhoto({ src, name }) {
    const [failedSource, setFailedSource] = useState(null);
    return <div className="host-product-photo">{src && failedSource !== src
        ? <img src={src} alt={name || "Product"} loading="lazy" onError={() => setFailedSource(src)} />
        : <span className="host-photo-placeholder"><strong aria-hidden="true">B.</strong>Image unavailable</span>}</div>;
}
