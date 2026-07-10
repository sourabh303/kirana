import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Demo coords for Ambala (where the seed data is located)
    shopService.discoverShops(30.3782, 76.7767, 10)
      .then(res => setShops(res.data.data))
      .catch(err => console.error("Failed to load shops", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Kirana Marketplace</h2>
        <div>
          <span style={{ marginRight: '10px' }}>Hi, {user?.name || user?.mobile}</span>
          <button onClick={() => navigate('/cart')} style={{ marginRight: '10px' }}>Cart</button>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <h3>Nearby Shops</h3>
      {loading ? (
        <p>Loading shops...</p>
      ) : shops.length === 0 ? (
        <p>No shops found nearby.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {shops.map(shop => (
            <div
              key={shop.id}
              style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => navigate(`/shop/${shop.id}`)}
            >
              <h4>{shop.name}</h4>
              <p style={{ color: '#666' }}>{shop.category || 'General Store'}</p>
              <p>Rating: {shop.rating} ⭐</p>
              <p>Distance: {shop.distanceKm?.toFixed(2)} km</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
