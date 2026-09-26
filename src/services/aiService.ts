import api from "./api"
import type { AIResponse, AIToolDefinition } from "../types/ai"

const toolDefinitions: AIToolDefinition[] = [
  { name: "searchProducts", description: "Search the seller's live catalog.", parameters: { query: { type: "string", required: true, description: "Customer search term" } } },
  { name: "getProduct", description: "Get live product details.", parameters: { productId: { type: "string", required: true, description: "Product identifier" } } },
  { name: "checkStock", description: "Check live inventory.", parameters: { productId: { type: "string", required: true, description: "Product identifier" } } },
  { name: "getBusinessInfo", description: "Get business and delivery details.", parameters: {} },
  { name: "createOrder", description: "Create an order after confirmation.", parameters: { items: { type: "array", required: true, description: "Order line items" } } },
  { name: "calculateOrderTotal", description: "Calculate live prices and delivery.", parameters: { items: { type: "array", required: true, description: "Order line items" } } },
  { name: "createPayment", description: "Create a Paystack payment for an order.", parameters: { orderId: { type: "string", required: true, description: "Order identifier" } } },
]

export const aiService = {
  async chat(sellerId: string, customerPhone: string, body: string, history: unknown[] = []): Promise<AIResponse> {
    const { data } = await api.post<AIResponse>("/ai/chat", { sellerId, customerPhone, body, history })
    return data
  },

  getToolDefinitions() {
    return toolDefinitions
  },
}
