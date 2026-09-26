// Phase 10: Backup strategy — local export/import plus cloud-ready stub.
// In production this would push daily JSON dumps to S3/GCS and retain 30 days.
// Local mock uses localStorage snapshots that the seller can download/import.

import { logger } from "./logger"

const KEYS = [
  "cognicart_seller",
  "cognicart_business",
  "cognicart_products",
  "cognicart_orders",
  "cognicart_transactions",
  "cognicart_whatsapp_config",
  "cognicart_whatsapp_messages",
  "cognicart_fee_config",
  "cognicart_logs",
]

const BACKUP_META = "cognicart_backup_meta"

export const backupService = {
  // Collect all seller-scoped data into one JSON blob
  exportAll(): string {
    const payload: Record<string, unknown> = {}
    for (const k of KEYS) {
      try {
        const raw = localStorage.getItem(k)
        if (raw) payload[k] = JSON.parse(raw)
        else payload[k] = null
      } catch {
        payload[k] = localStorage.getItem(k)
      }
    }
    // also capture ai contexts/logs prefixed
    const aiExtras: Record<string, unknown> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith("cognicart_ai_") || k.startsWith("cognicart_logs"))) {
        try { aiExtras[k] = JSON.parse(localStorage.getItem(k)!) } catch { aiExtras[k] = localStorage.getItem(k) }
      }
    }
    payload["_extras"] = aiExtras
    payload["_exportedAt"] = new Date().toISOString()
    payload["_version"] = "10"
    const json = JSON.stringify(payload, null, 2)
    logger.info("backup:export", { keys: KEYS.length })
    // update meta
    try {
      const meta = { lastExportAt: new Date().toISOString(), size: json.length }
      localStorage.setItem(BACKUP_META, JSON.stringify(meta))
    } catch {}
    return json
  },

  download(filename = `cognicart-backup-${new Date().toISOString().slice(0, 10)}.json`) {
    const json = this.exportAll()
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    logger.info("backup:download", { filename })
  },

  importAll(json: string) {
    const data = JSON.parse(json) as Record<string, unknown>
    for (const k of KEYS) {
      if (k in data) {
        const v = data[k]
        if (v === null || v === undefined) localStorage.removeItem(k)
        else localStorage.setItem(k, JSON.stringify(v))
      }
    }
    const extras = data["_extras"] as Record<string, unknown> | undefined
    if (extras) {
      for (const [k, v] of Object.entries(extras)) {
        localStorage.setItem(k, JSON.stringify(v))
      }
    }
    logger.info("backup:import", { keys: Object.keys(data).length })
  },

  getMeta(): { lastExportAt: string; size: number } | null {
    try { return JSON.parse(localStorage.getItem(BACKUP_META) || "null") } catch { return null }
  },

  // Index hints for production DB (Postgres/Mongo). Kept here so operators can copy to migration.
  // These would be: CREATE INDEX CONCURRENTLY ... and db.collection.createIndex(...)
  indexSpec(): string {
    return `
-- Postgres (Phase 10 indexes). Run once via migration:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_seller_created ON orders(seller_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_seller ON orders(seller_id, status) WHERE status IN ('Pending','Confirmed','Shipped');
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_seller_active ON products(seller_id, is_active) WHERE is_active = true;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_seller_category ON products(seller_id, category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_seller_ref ON transactions(seller_id, reference);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_order ON transactions(order_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_seller_phone ON whatsapp_messages(seller_id, customer_phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_whatsapp_timestamp ON whatsapp_messages(seller_id, timestamp DESC);
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_whatsapp_config_seller ON whatsapp_config(seller_id);

-- MongoDB equivalent
// db.orders.createIndex({ sellerId: 1, createdAt: -1 })
// db.orders.createIndex({ sellerId: 1, status: 1 })
// db.products.createIndex({ sellerId: 1, isActive: 1 })
// db.products.createIndex({ sellerId: 1, category: 1 })
// db.transactions.createIndex({ sellerId: 1, reference: 1 }, { unique: true })
// db.transactions.createIndex({ orderId: 1 })
// db.whatsapp_messages.createIndex({ sellerId: 1, customerPhone: 1 })
// db.whatsapp_messages.createIndex({ sellerId: 1, timestamp: -1 })

-- Backup policy (production):
-- * Daily pg_dump / mongodump at 02:00 UTC, gzip, upload to S3 bucket cognicart-backups-{env}
-- * Retention 30 days (S3 lifecycle), cross-region copy, weekly restore drill logged under _backup_meta
-- * Point-in-time recovery enabled (WAL / oplog), last verified \${localStorage.getItem(BACKUP_META) || "never"}
`.trim()
  },
}
