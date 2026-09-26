import { useEffect } from "react"

type SEOProps = {
  title: string
  description: string
  canonical?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  ogType?: string
  jsonLd?: Record<string, unknown>
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? "property" : "name"
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.content = content
}

export function useSEO({ title, description, canonical, ogTitle, ogDescription, ogImage, ogUrl, ogType = "website", jsonLd }: SEOProps) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title

    setMeta("description", description)
    setMeta("og:title", ogTitle || title, true)
    setMeta("og:description", ogDescription || description, true)
    setMeta("og:type", ogType, true)
    if (ogImage) setMeta("og:image", ogImage, true)
    if (ogUrl) setMeta("og:url", ogUrl, true)
    setMeta("twitter:card", ogImage ? "summary_large_image" : "summary")
    setMeta("twitter:title", ogTitle || title)
    setMeta("twitter:description", ogDescription || description)
    if (ogImage) setMeta("twitter:image", ogImage)

    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
    if (canonical) {
      if (!canonicalEl) {
        canonicalEl = document.createElement("link")
        canonicalEl.rel = "canonical"
        document.head.appendChild(canonicalEl)
      }
      canonicalEl.href = canonical
    }

    let ldEl: HTMLScriptElement | null = null
    if (jsonLd) {
      ldEl = document.createElement("script")
      ldEl.type = "application/ld+json"
      ldEl.text = JSON.stringify(jsonLd)
      document.head.appendChild(ldEl)
    }

    return () => {
      document.title = prevTitle
      if (ldEl) ldEl.remove()
    }
  }, [title, description, canonical, ogTitle, ogDescription, ogImage, ogUrl, ogType, jsonLd])
}
