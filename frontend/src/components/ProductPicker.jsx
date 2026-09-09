import { useState } from "react";
import ProductPhoto from "./ProductPhoto";

export default function ProductPicker({ products, selectedIds, onChange, disabled = false }) {
    const [query, setQuery] = useState("");
    const filtered = products.filter(product => [product.productName, product.name, product.categoryName, product.sellerName]
        .some(value => String(value || "").toLowerCase().includes(query.toLowerCase())));
    const toggle = id => onChange(selectedIds.includes(id) ? selectedIds.filter(value => value !== id) : [...selectedIds, id]);
    return <div className="host-product-picker">
        <div className="host-picker-tools"><label>Find a product<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by product, category or seller" /></label>
            <div><button className="button-outline" type="button" disabled={disabled || !products.length} onClick={() => onChange(products.map(product => product.productId))}>Select all</button>
                <button className="button-outline" type="button" disabled={disabled || !selectedIds.length} onClick={() => onChange([])}>Clear selection</button></div></div>
        {!products.length ? <p className="empty-state">No unassigned approved products are available. You can create an empty room and add products later.</p>
            : !filtered.length ? <p className="empty-state">No products match your search.</p>
                : <div className="host-picker-grid">{filtered.map(product => <label key={product.productId} className={`host-picker-card ${selectedIds.includes(product.productId) ? "is-selected" : ""}`}>
                    <input type="checkbox" checked={selectedIds.includes(product.productId)} disabled={disabled} onChange={() => toggle(product.productId)} aria-label={`Include ${product.productName || product.name}`} />
                    <ProductPhoto src={product.imageUrl} name={product.productName || product.name} />
                    <div className="host-picker-copy"><span>{product.categoryName || "Approved product"}</span><strong>{product.productName || product.name}</strong><small>{product.sellerName || "Ready for auction"}</small><b>₹{Number(product.basePrice).toLocaleString("en-IN")}</b></div>
                </label>)}</div>}
    </div>;
}
