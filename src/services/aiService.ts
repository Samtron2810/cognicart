import type { AIResponse, AIToolCall, AIContext } from "../types/ai"
import api from "./api"
import { rateLimited } from "./rateLimitService"
import { logger } from "./logger"
import { sanitize } from "../utils/validation"
import { getEffectivePrice, getTotalStock } from "../types/product"

const CONTEXT_KEY = (sellerId: string, customerPhone: string) => `cognicart_ai_ctx_${sellerId}_${customerPhone}`
const AI_ENABLED_KEY = (sellerId: string) => `cognicart_ai_enabled_${sellerId}`

function getSellerId(): string {
  try {
    const raw = localStorage.getItem("cognicart_seller")
    if (raw) return (JSON.parse(raw).id as string) || "mock_seller"
  } catch {}
  return "mock_seller"
}

function getBusinessName(sellerId: string): string {
  try {
    const raw = localStorage.getItem("cognicart_seller")
    if (raw) {
      const s = JSON.parse(raw)
      if (s.id === sellerId && s.businessName) return s.businessName
    }
    const bizRaw = localStorage.getItem("cognicart_business")
    if (bizRaw) {
      const businesses = JSON.parse(bizRaw)
      const biz = Array.isArray(businesses) ? businesses.find((b: { sellerId: string; name: string }) => b.sellerId === sellerId) : null
      if (biz?.name) return biz.name
    }
  } catch {}
  return "My Store"
}

function getContext(sellerId: string, customerPhone: string): AIContext {
  try {
    const raw = localStorage.getItem(CONTEXT_KEY(sellerId, customerPhone))
    if (raw) return JSON.parse(raw)
  } catch {}
  return { sellerId, customerPhone }
}

function saveContext(ctx: AIContext) {
  localStorage.setItem(CONTEXT_KEY(ctx.sellerId, ctx.customerPhone), JSON.stringify(ctx))
}

function isMockMode(error: unknown) {
  return !error || (error as { response?: unknown })?.response === undefined
}

// Authorization: verify seller owns resource
function assertSellerOwns(sellerId: string, resourceSellerId: string, resource = "resource") {
  if (resourceSellerId !== sellerId) {
    logger.warn(`ai:auth block ${resource} cross-seller`, { sellerId, resourceSellerId })
    throw new Error(`Unauthorized: ${resource} does not belong to seller`)
  }
}

async function toolSearchProducts(sellerId: string, args: { query: string; limit?: number }) {
  if (args.query && typeof args.query !== "string") throw new Error("Invalid query")
  if (args.limit !== undefined && (typeof args.limit !== "number" || args.limit < 1 || args.limit > 20)) throw new Error("Invalid limit")
  try {
    const prodRaw = localStorage.getItem("cognicart_products")
    const all = prodRaw ? (JSON.parse(prodRaw) as Array<{ sellerId: string; isActive: boolean; id: string; name: string; description: string; price: number; stock: number; category: string; images: string[]; discount?: import("../types/product").ProductDiscount; variants?: import("../types/product").ProductVariant[] }>) : []
    let filtered = all.filter((p) => p.sellerId === sellerId && p.isActive)
    if (args.query) {
      const q = sanitize(args.query, 200).toLowerCase()
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.variants || []).some((v) => `${v.size} ${v.color} ${v.sku}`.toLowerCase().includes(q)))
    }
    const limit = Math.min(args.limit || 5, 10)
    return filtered.slice(0, limit).map((p) => ({ id: p.id, name: p.name, price: getEffectivePrice(p as never), originalPrice: p.price, hasDiscount: !!(p.discount?.active && getEffectivePrice(p as never) < p.price), stock: getTotalStock(p as never), category: p.category, description: p.description, variants: p.variants }))
  } catch {
    return []
  }
}

async function toolGetProduct(sellerId: string, args: { productId: string }) {
  if (!args.productId || typeof args.productId !== "string" || args.productId.length > 100) throw new Error("Invalid productId")
  const prodRaw = localStorage.getItem("cognicart_products")
  const all = prodRaw ? (JSON.parse(prodRaw) as Array<{ sellerId: string; id: string; name: string; description: string; price: number; stock: number; category: string; images: string[]; isActive: boolean; discount?: import("../types/product").ProductDiscount; variants?: import("../types/product").ProductVariant[] }>) : []
  const prod = all.find((p) => p.id === args.productId)
  if (!prod) throw new Error("Product not found")
  assertSellerOwns(sellerId, prod.sellerId, "product")
  return prod as unknown as { id: string; name: string; description: string; price: number; stock: number; category: string; images: string[]; isActive: boolean; sellerId: string; discount?: import("../types/product").ProductDiscount; variants?: import("../types/product").ProductVariant[] }
}

async function toolCheckStock(sellerId: string, args: { productId: string }) {
  const prod = await toolGetProduct(sellerId, args) as unknown as { id: string; name: string; stock: number; price: number; discount?: import("../types/product").ProductDiscount; variants?: import("../types/product").ProductVariant[] }
  const effective = getEffectivePrice(prod as never)
  const total = getTotalStock(prod as never)
  return { productId: prod.id, name: prod.name, stock: total, price: effective, originalPrice: prod.price, hasDiscount: effective < prod.price, available: total > 0, variants: prod.variants }
}

async function toolGetBusinessInfo(sellerId: string) {
  try {
    const bizRaw = localStorage.getItem("cognicart_business")
    if (bizRaw) {
      const businesses = JSON.parse(bizRaw)
      const biz = Array.isArray(businesses) ? businesses.find((b: { sellerId: string }) => b.sellerId === sellerId) : null
      if (biz) return biz
    }
  } catch {}
  return { name: getBusinessName(sellerId), deliveryInfo: "Lagos 1-2 days, outside Lagos 2-4 days", deliveryFee: 1500, paymentMethod: "both" }
}

async function toolCalculateOrderTotal(sellerId: string, args: { items: Array<{ productId: string; quantity: number; variantId?: string }>; deliveryFee?: number }) {
  if (!Array.isArray(args.items) || args.items.length === 0 || args.items.length > 10) throw new Error("Invalid items")
  if (args.deliveryFee !== undefined && (typeof args.deliveryFee !== "number" || args.deliveryFee < 0 || args.deliveryFee > 100000)) throw new Error("Invalid deliveryFee")
  let subtotal = 0
  for (const item of args.items) {
    if (!item.productId || typeof item.quantity !== "number" || item.quantity < 1 || item.quantity > 99) throw new Error("Invalid item")
    const prod = await toolGetProduct(sellerId, { productId: item.productId }) as unknown as { id: string; name: string; price: number; stock: number; discount?: import("../types/product").ProductDiscount; variants?: import("../types/product").ProductVariant[] }
    let v = null as import("../types/product").ProductVariant | null | undefined
    if ((item as { variantId?: string }).variantId) {
      const vid = (item as { variantId?: string }).variantId!
      v = prod.variants?.find((x) => x.id === vid) || null
      if (!v) throw new Error(`Variant not found for ${prod.name}`)
      if (v.stock < item.quantity) throw new Error(`Insufficient stock for ${prod.name} (${v.size || ""} ${v.color || ""})`)
    } else {
      if (prod.variants && prod.variants.length > 0) throw new Error(`${prod.name} requires variant selection`)
      const total = getTotalStock(prod as never)
      if (total < item.quantity) throw new Error(`Insufficient stock for ${prod.name}`)
    }
    const unit = getEffectivePrice(prod as never, v as never)
    subtotal += unit * item.quantity
  }
  const deliveryFee = args.deliveryFee ?? (subtotal > 20000 ? 0 : 1500)
  return { subtotal, deliveryFee, total: subtotal + deliveryFee }
}

async function toolCreateOrder(sellerId: string, args: { items: Array<{ productId: string; quantity: number }>; customer: { name: string; phone: string; address: string }; deliveryAddress?: string }) {
  // Abuse: cap items array already validated, delegate to orderService which enforces rate limit/validation
  const currentSeller = getSellerId()
  if (sellerId !== currentSeller && currentSeller !== "mock_seller") {
    logger.warn("ai:toolCreateOrder seller mismatch", { sellerId, currentSeller })
    // still allow if whatsapp mapped seller; but enforce tenant isolation inside orderService create will re-check
  }
  const { orderService } = await import("./orderService")
  return orderService.create({
    customer: { name: sanitize(args.customer.name, 100), phone: sanitize(args.customer.phone, 20), address: sanitize(args.customer.address, 300) },
    items: args.items,
    deliveryAddress: args.deliveryAddress ? sanitize(args.deliveryAddress, 300) : sanitize(args.customer.address, 300),
  })
}

async function toolCreatePayment(sellerId: string, args: { orderId: string; email?: string }) {
  if (!args.orderId || args.orderId.length > 100) throw new Error("Invalid orderId")
  if (args.email && (args.email.length > 200 || !args.email.includes("@"))) throw new Error("Invalid email")
  const { paymentService } = await import("./paymentService")
  const orderRaw = localStorage.getItem("cognicart_orders")
  const orders = orderRaw ? (JSON.parse(orderRaw) as Array<{ id: string; sellerId: string; total: number; subtotal: number; deliveryFee: number; paymentStatus: string }>) : []
  const order = orders.find((o) => o.id === args.orderId)
  if (!order) throw new Error("Order not found")
  assertSellerOwns(sellerId, order.sellerId, "order")
  if (order.paymentStatus === "Paid") return { alreadyPaid: true, reference: (order as unknown as { paymentReference?: string }).paymentReference }
  const email = sanitize(args.email || `${sellerId}@cognicart.test`, 200)
  const { reference, transaction } = await paymentService.initialize({
    orderId: order.id,
    amount: order.total,
    email,
    sellerId,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
  })
  return { reference, amount: order.total, transaction }
}

function extractQuantity(text: string): number | null {
  const m = text.match(/x\s*(\d+)|qty\s*(\d+)|quantity\s*(\d+)|(\d+)\s*units?/i)
  if (m) {
    const val = m[1] || m[2] || m[3] || m[4]
    const n = parseInt(val, 10)
    if (!isNaN(n) && n > 0 && n <= 99) return n
  }
  if (/\bone\b/i.test(text)) return 1
  if (/\btwo\b/i.test(text)) return 2
  if (/\bthree\b/i.test(text)) return 3
  return null
}

function extractAddress(text: string): string | null {
  const lower = text.toLowerCase()
  const markers = ["deliver to", "delivery to", "address", "ship to", "to "]
  for (const marker of markers) {
    const idx = lower.indexOf(marker)
    if (idx !== -1) {
      const after = text.slice(idx + marker.length).trim().replace(/^[:-\s]+/, "")
      if (after.length > 8) return sanitize(after.slice(0, 80), 80)
    }
  }
  if (/\d+.*(street|road|avenue|close|estate|lane|way|drive|avenue|ikoyi|yaba|ikeja|ph|lagos|abuja|port harcourt)/i.test(text)) {
    return sanitize(text.slice(0, 80), 80)
  }
  return null
}

function extractProductKeyword(text: string, products: Array<{ id: string; name: string }>): { id?: string; name?: string } | null {
  const lower = text.toLowerCase()
  for (const p of products) {
    if (lower.includes(p.name.toLowerCase())) return { id: p.id, name: p.name }
  }
  const words = lower.split(/[^a-z0-9]+/).filter(Boolean)
  for (const p of products) {
    const nameWords = p.name.toLowerCase().split(/[^a-z0-9]+/)
    if (words.some((w) => nameWords.includes(w))) return { id: p.id, name: p.name }
  }
  return null
}

export const aiService = {
  isEnabled(sellerId?: string): boolean {
    const sid = sellerId || getSellerId()
    return localStorage.getItem(AI_ENABLED_KEY(sid)) !== "false"
  },

  setEnabled(enabled: boolean, sellerId?: string) {
    const sid = sellerId || getSellerId()
    localStorage.setItem(AI_ENABLED_KEY(sid), String(enabled))
    logger.info("ai:setEnabled", { sellerId: sid, enabled })
  },

  getToolDefinitions() {
    return [
      { name: "searchProducts", description: "Search seller products by query", parameters: { query: { type: "string", required: true, description: "search query" }, limit: { type: "number", required: false, description: "limit" } } },
      { name: "getProduct", description: "Get product details by id", parameters: { productId: { type: "string", required: true, description: "product id" } } },
      { name: "checkStock", description: "Check stock for product", parameters: { productId: { type: "string", required: true, description: "product id" } } },
      { name: "getBusinessInfo", description: "Get seller business info", parameters: {} },
      { name: "calculateOrderTotal", description: "Calculate order total", parameters: { items: { type: "array", required: true, description: "items" }, deliveryFee: { type: "number", required: false, description: "fee" } } },
      { name: "createOrder", description: "Create order for customer", parameters: { items: { type: "array", required: true, description: "items" }, customer: { type: "object", required: true, description: "customer" }, deliveryAddress: { type: "string", required: false, description: "address" } } },
      { name: "createPayment", description: "Create Paystack payment for order", parameters: { orderId: { type: "string", required: true, description: "order id" }, email: { type: "string", required: false, description: "customer email" } } },
    ]
  },

  async chat(sellerId: string, customerPhone: string, body: string, history?: string[]): Promise<AIResponse> {
    if (!sellerId || sellerId.length > 100) throw new Error("Invalid sellerId")
    if (!customerPhone || customerPhone.length > 20) throw new Error("Invalid customerPhone")
    if (!body || body.length > 4000) throw new Error("Message too long")
    // Abuse protection: limit AI chats per customer and globally per seller
    rateLimited(`ai:chat:${customerPhone}`, 20, 60 * 1000)
    rateLimited(`ai:chat:seller:${sellerId}`, 200, 60 * 1000)
    const sanitizedBody = sanitize(body, 4000)

    const openaiKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_OPENAI_API_KEY as string | undefined
    if (openaiKey) {
      try {
        const res = await api.post<AIResponse>("/ai/chat", { sellerId, customerPhone, body: sanitizedBody, history })
        logger.info("ai:chat remote success", { sellerId, customerPhone })
        return res.data
      } catch (error) {
        if (!isMockMode(error)) throw error
      }
    }

    const ctx = getContext(sellerId, customerPhone)
    // Cross-tenant check: context must belong to same seller
    if (ctx.sellerId && ctx.sellerId !== sellerId) {
      logger.warn("ai:chat context seller mismatch", { ctxSeller: ctx.sellerId, sellerId, customerPhone })
      // Reset context to current seller to prevent leak
      ctx.sellerId = sellerId
    }
    const lower = sanitizedBody.toLowerCase().trim()
    const toolCalls: AIToolCall[] = []
    let intent = "unknown"
    let reply = ""
    let orderId: string | undefined

    const businessName = getBusinessName(sellerId)

    const allProductsRaw = localStorage.getItem("cognicart_products")
    const allProducts = allProductsRaw ? (JSON.parse(allProductsRaw) as Array<{ sellerId: string; isActive: boolean; id: string; name: string; price: number; stock: number; category: string }>) : []
    const sellerProducts = allProducts.filter((p) => p.sellerId === sellerId && p.isActive)
    void (await toolGetBusinessInfo(sellerId))

    if (ctx.awaitingConfirmation && /^(yes|confirm|proceed|place order|okay|ok)\b/i.test(lower)) {
      intent = "confirm_order"
      if (ctx.pendingProductId && ctx.pendingQuantity && ctx.pendingAddress) {
        const callId = "call_" + Date.now()
        toolCalls.push({ id: callId, name: "calculateOrderTotal", arguments: { items: [{ productId: ctx.pendingProductId, quantity: ctx.pendingQuantity }] } })
        try {
          const totals = await toolCalculateOrderTotal(sellerId, { items: [{ productId: ctx.pendingProductId, quantity: ctx.pendingQuantity }] })
          toolCalls[0].result = totals
          const createCallId = "call_" + (Date.now() + 1)
          toolCalls.push({
            id: createCallId,
            name: "createOrder",
            arguments: {
              items: [{ productId: ctx.pendingProductId, quantity: ctx.pendingQuantity }],
              customer: { name: customerPhone, phone: customerPhone, address: ctx.pendingAddress },
              deliveryAddress: ctx.pendingAddress,
            },
          })
          const order = await toolCreateOrder(sellerId, {
            items: [{ productId: ctx.pendingProductId, quantity: ctx.pendingQuantity }],
            customer: { name: customerPhone, phone: customerPhone, address: ctx.pendingAddress },
            deliveryAddress: ctx.pendingAddress,
          })
          const ord = order as unknown as { id: string; total: number }
          toolCalls[1].result = order
          orderId = ord.id
          ctx.lastOrderId = ord.id
          ctx.lastOrderTotal = (totals as { total: number }).total
          reply = `Order created! #${ord.id.slice(-6).toUpperCase()} \u2014 ${ctx.pendingProductName} x${ctx.pendingQuantity} \u2192 \u20A6${(totals as { total: number }).total.toLocaleString()} (delivery \u20A6${(totals as { deliveryFee: number }).deliveryFee.toLocaleString()}). I will confirm delivery to ${ctx.pendingAddress}. Reply PAY to get Paystack link or you can pay on delivery. Want anything else?`
          ctx.pendingProductId = undefined
          ctx.pendingQuantity = undefined
          ctx.pendingAddress = undefined
          ctx.awaitingConfirmation = false
          ctx.awaitingAddress = false
          saveContext(ctx)
          logger.info("ai:chat order confirmed", { sellerId, customerPhone, orderId })
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Failed"
          logger.warn("ai:chat order failed", { sellerId, customerPhone, error: msg })
          toolCalls[1] && (toolCalls[1].error = msg)
          reply = `Could not create order: ${msg}. Please check stock or try another product.`
        }
        return { reply, toolCalls, orderId, intent }
      } else {
        reply = `I need a product and delivery address before confirming. What would you like to order?`
        return { reply, toolCalls, intent }
      }
    }

    if (ctx.awaitingConfirmation && /^(no|cancel|wait)\b/i.test(lower)) {
      ctx.awaitingConfirmation = false
      saveContext(ctx)
      logger.info("ai:chat order cancelled", { sellerId, customerPhone })
      return { reply: `No problem, order not placed. Let me know what you would like to do.`, toolCalls: [], intent: "cancel_order" }
    }

    if (ctx.awaitingAddress && ctx.pendingProductId) {
      const addr = extractAddress(sanitizedBody) || sanitizedBody
      if (addr && addr.length > 8) {
        ctx.pendingAddress = addr
        ctx.awaitingAddress = false
        const callId = "call_" + Date.now()
        toolCalls.push({ id: callId, name: "calculateOrderTotal", arguments: { items: [{ productId: ctx.pendingProductId, quantity: ctx.pendingQuantity || 1 }] } })
        const totals = await toolCalculateOrderTotal(sellerId, { items: [{ productId: ctx.pendingProductId, quantity: ctx.pendingQuantity || 1 }] })
        toolCalls[0].result = totals
        ctx.awaitingConfirmation = true
        saveContext(ctx)
        reply = `Your order:\n${ctx.pendingProductName} x${ctx.pendingQuantity} \u2014 \u20A6${(totals as { subtotal: number }).subtotal.toLocaleString()}\nDelivery: \u20A6${(totals as { deliveryFee: number }).deliveryFee.toLocaleString()}\nTotal: \u20A6${(totals as { total: number }).total.toLocaleString()}\nDeliver to: ${addr}\nReply YES to confirm.`
        return { reply, toolCalls, intent: "confirm" }
      }
    }

    if (/^(hi|hello|hey|good morning|good afternoon)\b/i.test(lower)) {
      intent = "greeting"
      const callId = "call_" + Date.now()
      toolCalls.push({ id: callId, name: "searchProducts", arguments: { query: "", limit: 3 } })
      const results = await toolSearchProducts(sellerId, { query: "", limit: 3 })
      toolCalls[0].result = results
      if (results.length > 0) {
        const list = results.map((p) => `${p.name} \u2014 \u20A6${p.price.toLocaleString()} (${p.stock > 0 ? `${p.stock} in stock` : "out"})`).join("\n")
        reply = `Hello! Welcome to ${businessName}. I can find products, check price and stock, and place orders.\nTop items:\n${list}\nWhat are you looking for?`
      } else {
        reply = `Hello! Welcome to ${businessName}. What product are you looking for?`
      }
      return { reply, toolCalls, intent }
    }

    if (lower.includes("deliver") || lower.includes("shipping") || lower.includes("payment") || lower.includes("where is") || lower.includes("location")) {
      intent = "business_info"
      const callId = "call_" + Date.now()
      toolCalls.push({ id: callId, name: "getBusinessInfo", arguments: {} })
      const info = await toolGetBusinessInfo(sellerId)
      toolCalls[0].result = info
      reply = `${businessName} \u2014 ${(info as { deliveryInfo?: string }).deliveryInfo || "Lagos 1-2 days"}. Payment: ${(info as { paymentMethod?: string }).paymentMethod || "both"}. What product would you like?`
      return { reply, toolCalls, intent }
    }

    const qty = extractQuantity(sanitizedBody)
    const productMatch = extractProductKeyword(sanitizedBody, sellerProducts)
    const addr = extractAddress(sanitizedBody)

    if (productMatch?.id && qty && addr) {
      intent = "create_order_direct"
      const callId = "call_" + Date.now()
      toolCalls.push({ id: callId, name: "checkStock", arguments: { productId: productMatch.id } })
      const stock = await toolCheckStock(sellerId, { productId: productMatch.id })
      toolCalls[0].result = stock
      if (!(stock as { available: boolean }).available) {
        reply = `${productMatch.name} is out of stock. Want another product?`
        return { reply, toolCalls, intent }
      }
      const calcId = "call_" + (Date.now() + 1)
      toolCalls.push({ id: calcId, name: "calculateOrderTotal", arguments: { items: [{ productId: productMatch.id, quantity: qty }] } })
      const totals = await toolCalculateOrderTotal(sellerId, { items: [{ productId: productMatch.id, quantity: qty }] })
      toolCalls[1].result = totals
      ctx.pendingProductId = productMatch.id
      ctx.pendingProductName = productMatch.name
      ctx.pendingQuantity = qty
      ctx.pendingAddress = addr
      ctx.awaitingConfirmation = true
      saveContext(ctx)
      reply = `Your order:\n${productMatch.name} x${qty} \u2014 \u20A6${(totals as { subtotal: number }).subtotal.toLocaleString()}\nDelivery: \u20A6${(totals as { deliveryFee: number }).deliveryFee.toLocaleString()}\nTotal: \u20A6${(totals as { total: number }).total.toLocaleString()}\nDeliver to: ${addr}\nReply YES to confirm.`
      return { reply, toolCalls, intent }
    }

    if (productMatch?.id && qty && !addr) {
      intent = "order_initiate"
      const callId = "call_" + Date.now()
      toolCalls.push({ id: callId, name: "checkStock", arguments: { productId: productMatch.id } })
      const stock = await toolCheckStock(sellerId, { productId: productMatch.id })
      toolCalls[0].result = stock
      if (!(stock as { available: boolean }).available) {
        reply = `${productMatch.name} is out of stock. Want another product?`
        return { reply, toolCalls, intent }
      }
      ctx.pendingProductId = productMatch.id
      ctx.pendingProductName = productMatch.name
      ctx.pendingQuantity = qty
      ctx.awaitingAddress = true
      saveContext(ctx)
      reply = `${productMatch.name} x${qty} is available. What is your delivery address? Example: "12 Allen Avenue, Ikeja, Lagos"`
      return { reply, toolCalls, intent }
    }

    if (productMatch?.id && !qty) {
      if (lower.includes("price") || lower.includes("how much") || lower.includes("cost")) {
        intent = "price"
        const callId = "call_" + Date.now()
        toolCalls.push({ id: callId, name: "getProduct", arguments: { productId: productMatch.id } })
        const prod = await toolGetProduct(sellerId, { productId: productMatch.id })
        toolCalls[0].result = prod
        reply = `${prod.name} is \u20A6${prod.price.toLocaleString()} and ${prod.stock > 0 ? `in stock (${prod.stock} units)` : "out of stock"}. Want to order? Tell me quantity, e.g. "1 x deliver to Ikeja"`
        ctx.pendingProductId = productMatch.id
        ctx.pendingProductName = productMatch.name
        saveContext(ctx)
        return { reply, toolCalls, intent }
      }
      if (lower.includes("stock") || lower.includes("available")) {
        intent = "stock"
        const callId = "call_" + Date.now()
        toolCalls.push({ id: callId, name: "checkStock", arguments: { productId: productMatch.id } })
        const stock = await toolCheckStock(sellerId, { productId: productMatch.id })
        toolCalls[0].result = stock
        reply = `${productMatch.name} \u2022 \u20A6${(stock as { price: number }).price.toLocaleString()} \u2022 ${(stock as { available: boolean }).available ? `In stock: ${(stock as { stock: number }).stock} units` : "Out of stock"}`
        return { reply, toolCalls, intent }
      }
      intent = "product_detail"
      const callId = "call_" + Date.now()
      toolCalls.push({ id: callId, name: "getProduct", arguments: { productId: productMatch.id } })
      const prod = await toolGetProduct(sellerId, { productId: productMatch.id })
      toolCalls[0].result = prod
      ctx.pendingProductId = productMatch.id
      ctx.pendingProductName = productMatch.name
      saveContext(ctx)
      reply = `${prod.name} \u2014 \u20A6${prod.price.toLocaleString()} \u2022 ${prod.category}\n${prod.description}\n${prod.stock > 0 ? `In stock: ${prod.stock}` : "Out of stock"}\nWant to order? Tell me quantity and delivery address.`
      return { reply, toolCalls, intent }
    }

    const keyword = sanitizedBody.replace(/^(show|search|find|need|want|looking for|hi|hello|hey)\s+/i, "").trim()
    if (keyword.length > 2) {
      const callId = "call_" + Date.now()
      toolCalls.push({ id: callId, name: "searchProducts", arguments: { query: keyword, limit: 3 } })
      const results = await toolSearchProducts(sellerId, { query: keyword, limit: 3 })
      toolCalls[0].result = results
      if (results.length > 0) {
        intent = "search"
        const list = results.map((p) => `${p.name} \u2014 \u20A6${p.price.toLocaleString()} (${p.stock > 0 ? `${p.stock} in stock` : "out"})`).join("\n")
        ctx.lastSearchResults = results as never
        saveContext(ctx)
        reply = `Found ${results.length} product${results.length > 1 ? "s" : ""} for "${sanitize(keyword, 100)}":\n${list}\nReply with the name and quantity, e.g. "Elixir Glow Serum x1 deliver to Yaba"`
        return { reply, toolCalls, intent }
      }
    }

    if (lower === "pay" || lower === "yes pay" || lower.includes("pay for") || lower.includes("paystack") || lower.includes("payment link") || lower.includes("how to pay")) {
      intent = "create_payment"
      let oid = ctx.lastOrderId
      if (!oid) {
        try {
          const ordersRaw = localStorage.getItem("cognicart_orders")
          const orders = ordersRaw ? (JSON.parse(ordersRaw) as Array<{ id: string; sellerId: string; customerPhone: string; paymentStatus: string; total: number }>) : []
          const pending = orders.filter((o) => o.sellerId === sellerId && o.customerPhone === customerPhone && o.paymentStatus === "Pending").sort((a, b) => b.id.localeCompare(a.id))
          if (pending.length > 0) oid = pending[0].id
        } catch {}
      }
      if (!oid) {
        reply = `I could not find a pending order for you. Please place an order first, e.g. "Elixir Glow Serum x1 deliver to Ikeja"`
        return { reply, toolCalls, intent }
      }
      const callId = "call_" + Date.now()
      toolCalls.push({ id: callId, name: "createPayment", arguments: { orderId: oid, email: `${customerPhone.replace(/[^0-9]/g, "")}@cognicart.test` } })
      try {
        const result = await toolCreatePayment(sellerId, { orderId: oid, email: `${customerPhone.replace(/[^0-9]/g, "")}@cognicart.test` })
        toolCalls[0].result = result
        if ((result as { alreadyPaid?: boolean }).alreadyPaid) {
          reply = `Order #${oid.slice(-6).toUpperCase()} is already Paid. Thank you!`
        } else {
          const r = result as { reference: string; amount: number }
          reply = `Paystack link generated for order #${oid.slice(-6).toUpperCase()} \u2014 \u20A6${r.amount.toLocaleString()}.\nRef: ${r.reference}\nPay now: your Paystack checkout will open. After payment, reply paid and I will confirm. Test mode: payment will auto-verify in 1 second.`
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed"
        logger.warn("ai:createPayment failed", { sellerId, customerPhone, error: msg })
        toolCalls[0].error = msg
        reply = `Could not create payment: ${toolCalls[0].error}`
      }
      return { reply, toolCalls, orderId: oid, intent }
    }

    intent = "fallback"
    reply = `I can help you find products, check price and stock, and place orders. Try: "show me beauty products", "price of Cozy Knit Hoodie", or "I want Elixir Glow Serum x1 deliver to Ikeja"`
    return { reply, toolCalls, intent }
  },
}
