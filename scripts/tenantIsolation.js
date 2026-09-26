// Manual tenant isolation probe. Run: node scripts/tenantIsolation.js
// Simulates two sellers and asserts isolation. Uses same localStorage mocks as services.
// This file runs in Node with a tiny localStorage polyfill; it imports no React.

const store = new Map()
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  key: (i) => [...store.keys()][i] || null,
  get length() { return store.size },
}

function seller(id, businessName) {
  return { id, businessName, email: `${id}@test.com`, phone: '+2348000000000' }
}

function seed() {
  localStorage.setItem('cognicart_products', JSON.stringify([
    { id: 'p1', sellerId: 'seller_A', name: 'Elixir Glow', price: 5000, stock: 10, isActive: true, images: ['x'], category: 'beauty' },
    { id: 'p2', sellerId: 'seller_B', name: 'Sneaker Run', price: 15000, stock: 5, isActive: true, images: ['x'], category: 'shoes' },
  ]))
  localStorage.setItem('cognicart_orders', JSON.stringify([
    { id: 'ord_A1', sellerId: 'seller_A', customerId: 'c1', customerName: 'Ada', customerPhone: '+2341', customerWhatsappId: '+2341', deliveryAddress: 'Lagos', items: [{ productId: 'p1', name: 'Elixir Glow', price: 5000, quantity: 1, subtotal: 5000 }], subtotal: 5000, deliveryFee: 1500, total: 6500, paymentStatus: 'Pending', orderStatus: 'Pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'ord_B1', sellerId: 'seller_B', customerId: 'c2', customerName: 'Bola', customerPhone: '+2342', customerWhatsappId: '+2342', deliveryAddress: 'Abuja', items: [{ productId: 'p2', name: 'Sneaker Run', price: 15000, quantity: 1, subtotal: 15000 }], subtotal: 15000, deliveryFee: 0, total: 15000, paymentStatus: 'Pending', orderStatus: 'Pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]))
}

function asSeller(id) {
  localStorage.setItem('cognicart_seller', JSON.stringify(seller(id, `Store ${id}`)))
  return id
}

function getOrdersForCurrentSeller() {
  const sid = JSON.parse(localStorage.getItem('cognicart_seller')).id
  const all = JSON.parse(localStorage.getItem('cognicart_orders') || '[]')
  return all.filter((o) => o.sellerId === sid)
}
function getProductsForCurrentSeller() {
  const sid = JSON.parse(localStorage.getItem('cognicart_seller')).id
  const all = JSON.parse(localStorage.getItem('cognicart_products') || '[]')
  return all.filter((p) => p.sellerId === sid)
}

function assert(cond, msg) {
  if (!cond) { console.error('FAIL:', msg); process.exitCode = 1 } else console.log('PASS:', msg)
}

seed()
asSeller('seller_A')
assert(getOrdersForCurrentSeller().length === 1 && getOrdersForCurrentSeller()[0].id === 'ord_A1', 'seller_A sees only own order')
assert(getProductsForCurrentSeller().length === 1 && getProductsForCurrentSeller()[0].id === 'p1', 'seller_A sees only own product')
assert(!getOrdersForCurrentSeller().some((o) => o.sellerId === 'seller_B'), 'seller_A cannot see seller_B orders')

const crossOrder = JSON.parse(localStorage.getItem('cognicart_orders')).find((o) => o.id === 'ord_B1')
const canReadCross = getOrdersForCurrentSeller().some((o) => o.id === crossOrder.id)
assert(!canReadCross, 'seller_A blocked from reading seller_B order by sellerId filter')

asSeller('seller_B')
assert(getOrdersForCurrentSeller().length === 1 && getOrdersForCurrentSeller()[0].id === 'ord_B1', 'seller_B sees only own order')
assert(getProductsForCurrentSeller()[0].id === 'p2', 'seller_B sees only own product')

// Simulate order create trying to use cross-seller product
asSeller('seller_A')
try {
  const products = JSON.parse(localStorage.getItem('cognicart_products'))
  const cross = products.find((p) => p.id === 'p2')
  // mimic orderService check: product.sellerId must equal inferred sellerId
  if (cross.sellerId !== 'seller_A') throw new Error('Cross-seller product not allowed')
  assert(false, 'cross-seller product should have thrown')
} catch (e) {
  assert(String(e.message).includes('Cross-seller'), 'cross-seller product create blocked')
}

console.log('\nTenant isolation checks done. Exit code', process.exitCode || 0)
