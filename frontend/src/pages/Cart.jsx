import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService, orderService } from '../services/api';

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const navigate = useNavigate();

  const loadCart = () => {
    setLoading(true);
    cartService.getCart()
      .then(res => setCart(res.data.data))
      .catch(err => console.error("Failed to load cart", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleUpdateQuantity = async (shopProductId, newQuantity) => {
    try {
      await cartService.updateItem(shopProductId, newQuantity);
      loadCart();
    } catch (err) {
      console.error("Failed to update item", err);
    }
  };

  const handleClearCart = async () => {
    try {
      await cartService.clearCart();
      loadCart();
    } catch (err) {
      console.error("Failed to clear cart", err);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart?.items.length) return;
    setPlacingOrder(true);
    try {
      // In this prototype, the address ID logic is minimal, defaulting to home delivery and COD.
      await orderService.createOrder({
        deliveryOption: 'home_delivery',
        paymentMethod: 'cod',
        addressId: 'dummy-address-id' // Ideally fetched from user profile
      });
      alert('Order placed successfully!');
      await cartService.clearCart();
      navigate('/');
    } catch (err) {
      alert('Failed to place order.');
      console.error(err);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading cart...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={() => navigate('/')} style={{ marginBottom: '20px' }}>&larr; Back to Shopping</button>

      <h2>Your Cart</h2>

      {!cart || cart.items.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div style={{ marginBottom: '20px' }}>
            {cart.items.map(item => (
              <div key={item.shopProductId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <div>
                  <h4>{item.productName}</h4>
                  <p>₹{item.unitPrice} x {item.quantity}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button onClick={() => handleUpdateQuantity(item.shopProductId, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleUpdateQuantity(item.shopProductId, item.quantity + 1)}>+</button>
                </div>
                <div style={{ fontWeight: 'bold' }}>
                  ₹{item.lineTotal}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Subtotal:</span>
              <span>₹{cart.subtotal}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Delivery Fee:</span>
              <span>₹{cart.deliveryFee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>Platform Fee:</span>
              <span>₹{cart.platformServiceFee}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontWeight: 'bold', fontSize: '1.2em', borderTop: '1px solid #ddd', paddingTop: '10px' }}>
              <span>Total:</span>
              <span>₹{cart.total}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleClearCart}
              style={{ flex: 1, padding: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Clear Cart
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={placingOrder}
              style={{ flex: 2, padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              {placingOrder ? 'Placing Order...' : 'Place Order (COD)'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
