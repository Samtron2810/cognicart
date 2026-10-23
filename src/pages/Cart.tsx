import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Minus,
  PackageSearch,
  Plus,
  ShoppingBag,
  Store,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useShopper } from "../context/ShopperContext";
import { orderService } from "../services/orderService";
import { paymentService } from "../services/paymentService";
import { productService } from "../services/productService";
import {
  buildCheckoutPayload,
  buildOrderGroupPayload,
  validateCheckoutCustomer,
} from "../utils/checkout";
import { storePath } from "../types/store";
import type { StorefrontProfile } from "../types/business";
import { getEffectivePrice, getTotalStock } from "../types/product";
import type { Product, ProductVariant } from "../types/product";
import { getApiErrorMessage } from "../services/apiError";

type CartItem = {
  product: Product;
  variant: ProductVariant | null;
  effectivePrice: number;
  quantity: number;
  maxStock: number;
  /** Index into the cart context's entry array, for quantity edits. */
  entryIndex: number;
};

/** One store's slice of the basket, with its own delivery terms. */
type SellerGroup = {
  sellerId: string;
  store: StorefrontProfile | null;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
};

export default function Cart() {
  const { items: entries, removeItem, setQuantity, removeSeller, clear } = useCart();
  const { shopper } = useShopper();
  const [items, setItems] = useState<CartItem[]>([]);
  const [stores, setStores] = useState<Record<string, StorefrontProfile>>({});
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [prefilled, setPrefilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const liveItems = await Promise.all(
        entries.map(async (entry, entryIndex) => {
          const product = await productService.getById(entry.productId);
          const variant = entry.variantId
            ? product.variants?.find((value) => value.id === entry.variantId) ||
              null
            : null;
          const maxStock = variant ? variant.stock : getTotalStock(product);
          return {
            product,
            variant,
            effectivePrice: getEffectivePrice(product, variant),
            quantity: entry.quantity,
            maxStock,
            entryIndex,
          };
        }),
      );
      if (active) setItems(liveItems);

      // Each store sets its own delivery fee and free-delivery threshold, so
      // the profiles are needed to total the basket honestly.
      const sellerIds = [...new Set(entries.map((entry) => entry.sellerId))];
      const profiles = await Promise.all(
        sellerIds.map((id) =>
          productService
            .getStorefront(id)
            .then((profile) => [id, profile] as const)
            .catch(() => null),
        ),
      );
      if (active) {
        setStores(
          Object.fromEntries(
            profiles.filter(
              (pair): pair is readonly [string, StorefrontProfile] => pair !== null,
            ),
          ),
        );
      }
    };
    void load().catch(
      () => active && setError("Some cart items are no longer available."),
    );
    return () => {
      active = false;
    };
  }, [entries]);

  // A verified buyer session is optional: it only pre-fills the form.
  // Guests continue exactly as before — no signup, no password, ever.
  useEffect(() => {
    if (!shopper || prefilled) return;
    setCustomer((current) => ({
      name: current.name || shopper.name || "",
      phone: current.phone || shopper.phone || "",
      email: current.email || shopper.email || "",
      address: current.address || shopper.addresses?.[0] || "",
    }));
    setPrefilled(true);
  }, [shopper, prefilled]);

  /**
   * Group the basket by store.
   *
   * Delivery is charged per seller because that is what actually happens:
   * three stores means three parcels from three places. A seller's free
   * delivery threshold applies to their own slice, not to the grand total,
   * or a big order from one store would silently subsidise another.
   */
  const groups = useMemo<SellerGroup[]>(() => {
    const bySeller = new Map<string, CartItem[]>();
    for (const item of items) {
      const sellerId = item.product.sellerId;
      if (!bySeller.has(sellerId)) bySeller.set(sellerId, []);
      bySeller.get(sellerId)!.push(item);
    }

    return [...bySeller.entries()].map(([sellerId, groupItems]) => {
      const store = stores[sellerId] || null;
      const subtotal = groupItems.reduce(
        (sum, item) => sum + item.effectivePrice * item.quantity,
        0,
      );
      const baseFee = store?.deliveryFee ?? 0;
      const threshold = store?.freeDeliveryThreshold ?? 0;
      const deliveryFee =
        threshold > 0 && subtotal >= threshold ? 0 : baseFee;
      return {
        sellerId,
        store,
        items: groupItems,
        subtotal,
        deliveryFee,
        total: subtotal + deliveryFee,
      };
    });
  }, [items, stores]);

  const subtotal = useMemo(
    () => groups.reduce((sum, group) => sum + group.subtotal, 0),
    [groups],
  );
  const deliveryTotal = useMemo(
    () => groups.reduce((sum, group) => sum + group.deliveryFee, 0),
    [groups],
  );
  const total = subtotal + deliveryTotal;
  const isMultiStore = groups.length > 1;

  // Delivery figures are an estimate until the backend prices the order; it
  // stays the only authority on what the buyer is charged.
  const deliveryKnown = groups.every((group) => group.store !== null);

  const validate = () => {
    // Multi-store baskets are supported: the backend splits them into one
    // sub-order per seller behind a single payment.
    const customerProblem = validateCheckoutCustomer(customer);
    if (customerProblem) {
      setError(customerProblem);
      return false;
    }
    if (!items.length) {
      setError("Your cart is empty.");
      return false;
    }
    if (items.some((item) => item.maxStock < 1)) {
      setError("One or more items are out of stock. Please update your cart.");
      return false;
    }
    const overStocked = items.find((item) => item.quantity > item.maxStock);
    if (overStocked) {
      setError(
        `Only ${overStocked.maxStock} unit${overStocked.maxStock === 1 ? "" : "s"} of "${overStocked.product.name}" ${overStocked.maxStock === 1 ? "is" : "are"} available. Please reduce the quantity.`,
      );
      return false;
    }
    return true;
  };

  /**
   * A one-store basket keeps the original single-seller path untouched —
   * it is the same flow the Telegram bot uses and it works. Only a basket
   * that genuinely spans stores takes the group path.
   */
  const payForSingleStore = async () => {
    const order = await orderService.create(
      buildCheckoutPayload(
        groups[0].sellerId,
        customer,
        items.map((item) => ({
          productId: item.product.id,
          variantId: item.variant?.id,
          quantity: item.quantity,
        })),
      ),
    );
    await paymentService.payWithPaystack({
      sellerId: order.sellerId,
      orderId: order.id,
      amount: order.total,
      email: customer.email,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
    });
  };

  /**
   * Multi-store: the backend creates a parent order plus one sub-order per
   * seller, then issues a single Paystack charge for the grand total. The
   * buyer pays once; each seller is credited separately on settlement.
   */
  const payForMultipleStores = async () => {
    const group = await orderService.createGroup(
      buildOrderGroupPayload(
        customer,
        items.map((item) => ({
          sellerId: item.product.sellerId,
          productId: item.product.id,
          variantId: item.variant?.id,
          quantity: item.quantity,
        })),
      ),
    );

    const payment = await orderService.payGroup(group.id, customer.email);
    if (!payment.authorization_url) {
      throw new Error("The backend did not return a Paystack checkout URL");
    }
    window.location.assign(payment.authorization_url);
  };

  const handlePay = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isMultiStore) await payForMultipleStores();
      else await payForSingleStore();
      // The basket is only cleared once a checkout URL has been issued, so a
      // failed submit never loses what the buyer put together.
      clear();
    } catch (reason) {
      setError(getApiErrorMessage(reason, "Unable to start checkout."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!entries.length) {
    return (
      <div className="min-h-[60vh] bg-[#FFFBF5] grid place-items-center px-4 py-10">
        <div className="text-center max-w-md">
          <div className="mx-auto h-12 w-12 rounded-full bg-[#FFF1DA] border border-[#F3E6D3] grid place-items-center">
            <ShoppingBag className="h-6 w-6 text-[#E85D26]" />
          </div>
          <h1 className="font-display text-2xl font-bold mt-3">
            Cart is empty
          </h1>
          <p className="text-sm text-[#6b6b6b] mt-1">
            Just completed a payment? Your order is confirmed — a receipt and
            tracking link are on their way to your email.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link
              to="/track"
              className="inline-flex items-center gap-2 rounded-full bg-[#0B9C74] px-6 py-3 text-sm font-bold text-white hover:bg-[#0a8a66]"
            >
              <PackageSearch className="h-4 w-4" /> Track my order
            </Link>
            <Link
              to="/stores"
              className="inline-flex rounded-full bg-white border border-[#F3E6D3] px-6 py-3 text-sm font-bold hover:bg-[#FFF1DA]"
            >
              Browse stores
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-[34px] font-bold tracking-tight">
              Cart
            </h1>
            <p className="text-sm text-[#6b6b6b]">
              Prices and stock are checked against the live catalog at checkout.
              No account needed — checkout as a guest.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/track"
              className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA]"
            >
              <PackageSearch className="h-4 w-4" /> Track orders
            </Link>
            <button
              onClick={clear}
              className="inline-flex items-center gap-2 rounded-full bg-white border border-[#F3E6D3] px-4 py-2 text-sm font-bold hover:bg-[#FFF1DA]"
            >
              <Trash2 className="h-4 w-4" /> Clear cart
            </button>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            {isMultiStore && (
              <div className="rounded-xl border border-[#0B9C74]/25 bg-[#E6F7F1] px-3.5 py-2.5 text-xs leading-5 text-[#0a7d5d]">
                <span className="font-bold">
                  You are buying from {groups.length} stores.
                </span>{" "}
                You pay once. Each store receives its own order and ships
                separately, so delivery is charged per store.
              </div>
            )}

            {groups.map((group) => (
              <section
                key={group.sellerId}
                className="overflow-hidden rounded-2xl border border-[#F3E6D3] bg-white"
              >
                <header className="flex items-center justify-between gap-2 border-b border-[#F3E6D3] bg-[#FFFBF5] px-4 py-2.5">
                  <Link
                    to={
                      group.store
                        ? storePath(group.store)
                        : `/store/${group.sellerId}`
                    }
                    className="flex min-w-0 items-center gap-2 text-sm font-bold hover:text-[#0B9C74]"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full border border-[#F3E6D3] bg-[#FFF1DA]">
                      {group.store?.logo ? (
                        <img
                          src={group.store.logo}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Store className="h-3 w-3 text-[#E85D26]" />
                      )}
                    </span>
                    <span className="truncate">
                      {group.store?.name || "Store"}
                    </span>
                  </Link>
                  {isMultiStore && (
                    <button
                      type="button"
                      onClick={() => removeSeller(group.sellerId)}
                      className="shrink-0 text-[11px] font-bold text-[#9a9a9a] hover:text-red-700"
                    >
                      Remove store
                    </button>
                  )}
                </header>

                <div className="divide-y divide-[#F3E6D3]">
                  {group.items.map((item) => (
                    <div
                      key={`${item.product.id}-${item.variant?.id || "base"}-${item.entryIndex}`}
                      className="flex gap-4 p-4"
                    >
                      <img
                        src={item.variant?.image || item.product.images[0]}
                        alt={item.product.name}
                        className="h-16 w-16 rounded-xl border border-[#F3E6D3] bg-[#FFFBF5] object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold">{item.product.name}</div>
                        <div className="text-xs text-[#6b6b6b]">
                          {[item.variant?.size, item.variant?.color]
                            .filter(Boolean)
                            .join(" / ") || item.product.category}
                        </div>
                        <div className="mt-1 text-sm font-bold">
                          ₦{item.effectivePrice.toLocaleString()}
                          {item.quantity > 1 && (
                            <span className="ml-1 text-xs font-normal text-[#6b6b6b]">
                              × {item.quantity} = ₦
                              {(
                                item.effectivePrice * item.quantity
                              ).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(item.entryIndex, item.quantity - 1)
                            }
                            aria-label={`Decrease quantity of ${item.product.name}`}
                            className="grid h-7 w-7 place-items-center rounded-full border border-[#F3E6D3] hover:bg-[#FFF1DA]"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-[2ch] text-center text-sm font-bold">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setQuantity(item.entryIndex, item.quantity + 1)
                            }
                            disabled={item.quantity >= item.maxStock}
                            aria-label={`Increase quantity of ${item.product.name}`}
                            className="grid h-7 w-7 place-items-center rounded-full border border-[#F3E6D3] hover:bg-[#FFF1DA] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-[11px] text-[#9a9a9a]">
                            {item.maxStock} available
                          </span>
                          {item.quantity > item.maxStock && (
                            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                              Only {item.maxStock} left
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.entryIndex)}
                        aria-label={`Remove ${item.product.name}`}
                        className="grid h-9 w-9 place-items-center rounded-full border border-[#F3E6D3] hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <footer className="flex items-center justify-between gap-2 border-t border-[#F3E6D3] bg-[#FFFBF5] px-4 py-2.5 text-xs">
                  <span className="text-[#6b6b6b]">
                    Subtotal ₦{group.subtotal.toLocaleString()} · Delivery{" "}
                    {group.store
                      ? group.deliveryFee === 0
                        ? "free"
                        : `₦${group.deliveryFee.toLocaleString()}`
                      : "at checkout"}
                  </span>
                  <span className="font-bold">
                    ₦{group.total.toLocaleString()}
                  </span>
                </footer>
              </section>
            ))}
          </div>
          <form
            onSubmit={handlePay}
            className="rounded-2xl border border-[#F3E6D3] bg-white p-5 space-y-3"
          >
            <h2 className="font-bold">Secure guest checkout</h2>
            {shopper && (
              <div className="flex items-center gap-2 rounded-xl border border-[#0B9C74]/20 bg-[#E6F7F1] px-3 py-2 text-xs text-[#0B9C74]">
                <UserCheck className="h-4 w-4" />
                Signed in as {shopper.email || shopper.phone} — details
                pre-filled.
              </div>
            )}
            <input
              required
              value={customer.name}
              onChange={(event) =>
                setCustomer({ ...customer, name: event.target.value })
              }
              placeholder="Full name"
              className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"
            />
            <input
              required
              value={customer.phone}
              onChange={(event) =>
                setCustomer({ ...customer, phone: event.target.value })
              }
              placeholder="Phone"
              className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"
            />
            <input
              required
              type="email"
              value={customer.email}
              onChange={(event) =>
                setCustomer({ ...customer, email: event.target.value })
              }
              placeholder="Email for receipt & order tracking"
              className="w-full rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"
            />
            <textarea
              required
              value={customer.address}
              onChange={(event) =>
                setCustomer({ ...customer, address: event.target.value })
              }
              placeholder="Delivery address"
              rows={3}
              className="w-full resize-none rounded-xl border border-[#F3E6D3] px-3 py-2.5 text-sm outline-none focus:border-[#0B9C74]"
            />
            <div className="space-y-1 border-t border-[#F3E6D3] pt-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              {/* One delivery fee per store, itemised rather than hidden in
                  a single number the buyer cannot check. */}
              {isMultiStore ? (
                <>
                  {groups.map((group) => (
                    <div
                      key={group.sellerId}
                      className="flex justify-between text-xs text-[#6b6b6b]"
                    >
                      <span className="truncate pr-2">
                        Delivery · {group.store?.name || "Store"}
                      </span>
                      <span>
                        {group.deliveryFee === 0
                          ? "Free"
                          : `₦${group.deliveryFee.toLocaleString()}`}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span>Delivery total</span>
                    <span>₦{deliveryTotal.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span>
                    {deliveryKnown
                      ? deliveryTotal === 0
                        ? "Free"
                        : `₦${deliveryTotal.toLocaleString()}`
                      : "Calculated by store"}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#F3E6D3] pt-2 text-base font-bold">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
              {!deliveryKnown && (
                <p className="text-[11px] text-[#9a9a9a]">
                  Final delivery is confirmed by the store at checkout.
                </p>
              )}
            </div>
            <button
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0B9C74] px-5 py-3 text-sm font-bold text-white hover:bg-[#0a8a66] disabled:opacity-60"
            >
              <CreditCard className="h-4 w-4" />
              {submitting
                ? "Opening payment…"
                : isMultiStore
                  ? `Pay ₦${total.toLocaleString()} for ${groups.length} stores`
                  : "Continue to Paystack"}
            </button>
            <p className="text-xs leading-5 text-[#6b6b6b]">
              Your email is used for the Paystack receipt and Email order
              updates — no signup or password required. Already ordered before?{" "}
              <Link
                to="/track"
                className="font-bold text-[#0B9C74] hover:underline"
              >
                Track your orders
              </Link>
              .
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
