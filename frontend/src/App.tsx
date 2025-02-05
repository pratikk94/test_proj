import React, { useState } from "react";
import axios from "axios";

interface Product {
  productId: string;
  name: string;
  locality: string;
  price: string;
  quantity: string;
  discount: string;
  image: string;
}

const App: React.FC = () => {
  const [product, setProduct] = useState<string>("");
  const [cityname, setCityname] = useState<string>("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchProducts = async () => {
    if (!product || !cityname) {
      alert("Please enter both product name and city name.");
      return;
    }
    setLoading(true);
    setResults([]);

    try {
      const { data } = await axios.get("http://localhost:5001/api/blinkit", {
        params: { product, cityname },
      });
      setResults(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      alert("Failed to fetch products. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Blinkit Product Scraper</h1>
      <input
        type="text"
        value={cityname}
        onChange={(e) => setCityname(e.target.value)}
        placeholder="Enter city name"
        style={{ padding: "10px", width: "300px", marginBottom: "10px" }}
      />
      <input
        type="text"
        value={product}
        onChange={(e) => setProduct(e.target.value)}
        placeholder="Enter product name"
        style={{ padding: "10px", width: "300px", marginBottom: "10px" }}
      />
      <button onClick={fetchProducts} style={{ padding: "10px" }}>
        Fetch Products
      </button>

      {loading ? (
        <p>Loading...</p>
      ) : (
        results.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h2>Scraped Products:</h2>
            <ul>
              {results.map((product) => (
                <li key={product.productId} style={{ marginBottom: "20px" }}>
                  <p><b>ID:</b> {product.productId}</p>
                  <p><b>Name:</b> {product.name}</p>
                  <p><b>Locality:</b> {product.locality}</p>
                  <p><b>Price:</b> ₹{product.price}</p>
                  <p><b>Quantity:</b> {product.quantity}</p>
                  <p><b>Discount:</b> {product.discount}</p>
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ width: "150px", height: "150px", objectFit: "cover" }}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
};

export default App;
