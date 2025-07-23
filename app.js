const DishCard = React.memo(({ dish, addToCart, removeFromCart, cart }) => {
  const quantity = cart.find(item => item.id === dish.id)?.quantity || 0;
  return (
    <div className="itemCard fade-in-up" style={{ animationDelay: `${dish.id * 0.1}s` }}>
      <div className="imgBox">
        <img 
          src={dish.imgSrc} 
          alt={dish.name} 
          onError={(e) => { e.target.src = 'https://via.placeholder.com/240x120'; }}
        />
      </div>
      <div className="itemContent">
        <h3 className="itemName">{dish.name}</h3>
        <div className="bottom">
          <div className="price">
            <span>{translations.currency}</span> {dish.price}
          </div>
          <div className="quantity">
            {quantity > 0 && (
              <button onClick={() => removeFromCart(dish.id)}>-</button>
            )}
            {quantity > 0 && <span>{quantity}</span>}
            <button onClick={() => addToCart(dish)}>+</button>
          </div>
        </div>
      </div>
    </div>
  );
});

const Cart = React.memo(({ cart, table, setTable, submitOrder, closeCart, clearCart, addToCart, removeFromCart }) => {
  const total = cart.reduce((sum, item) => sum + parseInt(item.price) * item.quantity, 0);
  return (
    <div className="modal" onClick={closeCart}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-semibold text-[#1f2937] font-inter mb-4">{translations.cart_title}</h2>
        <div className="mb-4">
          <label className="block text-[#1f2937] font-medium font-inter mb-2">{translations.table_label}</label>
          <select
            value={table}
            onChange={(e) => setTable(e.target.value)}
            className="w-full p-3 border border-[#e5e7eb] rounded-lg focus:ring-2 focus:ring-[#f97316] focus:outline-none font-inter text-[#1f2937]"
          >
            <option value="">{translations.table_placeholder}</option>
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}</option>
            ))}
          </select>
        </div>
        {cart.length === 0 ? (
          <p className="text-[#374151] font-inter text-center">{translations.cart_empty}</p>
        ) : (
          <div>
            {cart.map(item => (
              <div key={item.id} className="cartItem">
                <div className="imgBox">
                  <img src={item.imgSrc} alt={item.name} />
                </div>
                <div className="itemSection">
                  <h2 className="itemName">{item.name}</h2>
                  <div className="itemQuantity">
                    <div className="quantity">
                      <button onClick={() => removeFromCart(item.id)}>-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => addToCart(item)}>+</button>
                    </div>
                  </div>
                </div>
                <div className="itemPrice">
                  <span className="dolorSign">{translations.currency}</span>
                  <span className="itemPriceValue">{parseInt(item.price) * item.quantity}</span>
                </div>
              </div>
            ))}
            <div className="totalSection">
              <h3>{translations.cart_total.split(':')[0]}</h3>
              <p><span>{translations.currency}</span> {total}</p>
            </div>
          </div>
        )}
        <div className="flex gap-4 mt-6">
          <button
            onClick={clearCart}
            className="flex-1 p-3 bg-[#e5e7eb] text-[#1f2937] rounded-lg font-inter font-medium hover:bg-[#d1d5db] transition-all"
            disabled={cart.length === 0}
          >
            {translations.clear_cart}
          </button>
          <button
            onClick={closeCart}
            className="flex-1 p-3 bg-[#e5e7eb] text-[#1f2937] rounded-lg font-inter font-medium hover:bg-[#d1d5db] transition-all"
          >
            {translations.close_cart}
          </button>
          <button
            onClick={submitOrder}
            disabled={!table || cart.length === 0}
            className={`flex-1 p-3 rounded-lg font-inter font-medium transition-all ${
              !table || cart.length === 0
                ? 'bg-[#e5e7eb] text-[#374151] cursor-not-allowed'
                : 'bg-[#f97316] text-[#ffffff] hover:bg-[#ea580c]'
            }`}
          >
            {translations.submit_order}
          </button>
        </div>
      </div>
    </div>
  );
});

function App() {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [cart, setCart] = React.useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [table, setTable] = React.useState('');
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [isCartOpen, setIsCartOpen] = React.useState(false);

  React.useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (dish) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === dish.id);
      if (existing) {
        return prev.map(item =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...dish, quantity: 1 }];
    });
  };

  const removeFromCart = (dishId) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === dishId);
      if (existing.quantity === 1) {
        return prev.filter(item => item.id !== dishId);
      }
      return prev.map(item =>
        item.id === dishId ? { ...item, quantity: item.quantity - 1 } : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
    setTable('');
  };

  const submitOrder = async () => {
    if (!table || cart.length === 0) {
      setError(translations.error_validation);
      return;
    }

    setLoading(true);
    setError(null);

    const total = cart.reduce((sum, item) => sum + parseInt(item.price) * item.quantity, 0);
    const items = cart
      .map(item => `- ${item.name} x${item.quantity}: ${parseInt(item.price) * item.quantity} ${translations.currency}`)
      .join('\n');
    const telegramMessage = `<b>🔔 Новый заказ:</b>\n📍 Стол: ${table}\n🍽️ Блюда:\n${items}\n💰 Итого: ${total} ${translations.currency}\n⌛ Дата: ${new Date().toLocaleString('ru-RU')}`;

    try {
      const response = await axios.post('https://api.telegram.org/bot8190090178:AAGir7VOMAglwqwQkYlYLaZ3uD1zldfvv9M/sendMessage', {
        chat_id: '-4927988575',
        text: telegramMessage,
        parse_mode: 'HTML'
      });
      if (response.status === 200) {
        setSubmitted(true);
        setCart([]);
        setTable('');
        setIsCartOpen(false);
        setTimeout(() => setSubmitted(false), 2000);
      }
    } catch (error) {
      console.error('Ошибка отправки в Telegram:', error);
      setError(translations.error_telegram);
    } finally {
      setLoading(false);
    }
  };

  const filteredDishes = selectedCategory === 'all'
    ? Items
    : Items.filter(dish => dish.itemId === selectedCategory);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="App">
      <header>
        <div className="logo">KhazhFood</div>
        <div className="shoppingCart" onClick={() => setIsCartOpen(true)}>
          <span className="cart">🛒</span>
          <div className={cartCount > 0 ? 'cart_content' : 'cart_content noCartItem'}>
            <p>{cartCount}</p>
          </div>
        </div>
      </header>
      <main>
        <div className="mainContainer">
          {submitted && (
            <p className="text-[#f97316] text-center mb-6 font-semibold font-inter fade-in">{translations.success_message}</p>
          )}
          {error && (
            <p className="text-red-500 text-center mb-6 font-semibold font-inter fade-in">{error}</p>
          )}
          {loading && (
            <p className="text-[#f97316] text-center mb-6 font-semibold font-inter fade-in">Загрузка...</p>
          )}
          <div className="rowContainer">
            {[{ itemId: 'all', name: translations.category_all }, ...MenuItems].map(category => (
              <div
                key={category.itemId}
                className={`rowMenuCard ${selectedCategory === category.itemId ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.itemId)}
              >
                <h3>{category.name}</h3>
              </div>
            ))}
          </div>
          <div className="dishItemContainer">
            {filteredDishes.length > 0 ? (
              filteredDishes.map((dish) => (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  addToCart={addToCart}
                  removeFromCart={removeFromCart}
                  cart={cart}
                />
              ))
            ) : (
              <p className="text-center text-[#374151] col-span-full font-inter text-lg font-medium fade-in">{translations.no_dishes}</p>
            )}
          </div>
        </div>
      </main>
      {isCartOpen && (
        <Cart
          cart={cart}
          table={table}
          setTable={setTable}
          submitOrder={submitOrder}
          closeCart={() => setIsCartOpen(false)}
          clearCart={clearCart}
          addToCart={addToCart}
          removeFromCart={removeFromCart}
        />
      )}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
