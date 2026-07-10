import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { shopService, cartService } from '../services/api';

export default function ShopDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    Promise.all([
      shopService.getShopDetails(id),
      shopService.getShopProducts(id)
    ])
    .then(([shopRes, prodRes]) => {
      setShop(shopRes.data.data);
      setProducts(prodRes.data.data);
    })
    .catch(err => console.error("Error loading shop details", err))
    .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async (shopProductId) => {
    setAddingToCart(shopProductId);
    try {
      await cartService.addItem(id, shopProductId, 1);
      alert('Added to cart!');
    } catch (err) {
      if (err.response?.status === 409) {
        alert('Your cart contains items from another shop. Please clear it first.');
      } else {
        alert('Failed to add to cart.');
      }
      console.error(err);
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;
  if (!shop) return <div style={{ padding: '20px' }}>Shop not found</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => navigate('/')}>&larr; Back to Shops</button>
        <button onClick={() => navigate('/cart')}>Cart</button>
      </div>

      <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' }}>
        <h2>{shop.name}</h2>
        <p>{shop.locality}, {shop.city}</p>
        <p>Rating: {shop.rating} ⭐</p>
      </div>

      <h3>Products Available</h3>
      {products.length === 0 ? (
        <p>No products available right now.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {products.map(sp => (
            <div key={sp.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
              <h4>{sp.product.name}</h4>
              <p style={{ color: '#666', fontSize: '0.9em' }}>{sp.product.brand} - {sp.product.unitOfMeasure}</p>
              <p style={{ fontWeight: 'bold' }}>₹{sp.price}</p>
              <button
                onClick={() => handleAddToCart(sp.id)}
                disabled={!sp.available || addingToCart === sp.id}
                style={{
                  marginTop: '10px',
                  width: '100%',
                  padding: '8px',
                  background: sp.available ? '#28a745' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                {addingToCart === sp.id ? 'Adding...' : sp.available ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
