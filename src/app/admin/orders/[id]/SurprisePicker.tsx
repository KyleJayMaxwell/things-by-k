'use client'

// src/app/admin/orders/[id]/SurprisePicker.tsx
// "Design sent" picker for an order's Mystery cards. Designs this address
// already got (bought or surprised) are greyed out so nobody gets a repeat.

import { useEffect, useMemo, useState } from 'react'
import Spinner from '@/components/Spinner'
import { createClient } from '@/lib/supabase/client'
import { errorMessage } from '@/lib/errors'
import { addressKey } from '@/lib/surprise'
import type { OrderItem, OrderWithItems, SurprisePick } from '@/types'

interface Design {
  id: string
  name: string
  stock: number
  is_active: boolean
}

interface Props {
  order: OrderWithItems
  // How many Mystery cards still have no saved design
  onUnpickedChange: (count: number) => void
}

export default function SurprisePicker({ order, onUnpickedChange }: Props) {
  const [surpriseItems, setSurpriseItems] = useState<OrderItem[]>([])
  const [designs, setDesigns] = useState<Design[]>([])
  const [alreadySent, setAlreadySent] = useState<Set<string>>(new Set())
  const [savedPicks, setSavedPicks] = useState<SurprisePick[]>([])
  // Draft picks by "itemId:slot"
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      // Errors (e.g. mystery-postcard.sql not run yet) just mean no Mystery items
      const { data: surpriseProducts } = await supabase.from('products').select('id').eq('is_surprise', true)
      const surpriseIds = new Set((surpriseProducts ?? []).map(p => p.id))
      const items = order.order_items.filter(i => surpriseIds.has(i.product_id))
      setSurpriseItems(items)
      if (items.length === 0) {
        setLoading(false)
        return
      }

      const [{ data: designRows }, { data: pickRows }, { data: sameZip }] = await Promise.all([
        supabase
          .from('products')
          .select('id, name, stock, is_active')
          .eq('category', 'postcard')
          .eq('is_surprise', false)
          .order('name'),
        supabase
          .from('surprise_picks')
          .select('*')
          .in('order_item_id', items.map(i => i.id)),
        // Narrow to the same postal code, then match the full address below
        supabase
          .from('orders')
          .select('id, status, shipping_address, order_items(id, product_id)')
          .neq('id', order.id)
          .neq('status', 'refunded')
          .eq('shipping_address->>postal_code', order.shipping_address?.postal_code ?? ''),
      ])

      // Everything this address has already received: designs bought outright plus earlier surprises
      const key = addressKey(order.shipping_address)
      const pastOrders = key ? (sameZip ?? []).filter(o => addressKey(o.shipping_address) === key) : []
      const pastItems = pastOrders.flatMap(o => (o.order_items ?? []) as { id: string; product_id: string }[])
      const sent = new Set(pastItems.map(i => i.product_id))
      if (pastItems.length) {
        const { data: pastPicks } = await supabase
          .from('surprise_picks')
          .select('product_id')
          .in('order_item_id', pastItems.map(i => i.id))
        for (const p of pastPicks ?? []) sent.add(p.product_id)
      }

      const picks = (pickRows ?? []) as SurprisePick[]
      setDesigns(((designRows ?? []) as Design[]).sort((a, b) => Number(b.is_active) - Number(a.is_active)))
      setAlreadySent(sent)
      setSavedPicks(picks)
      // A "same design" item only has one picker, slot 0
      const sameDesign = new Set(items.filter(i => i.same_design).map(i => i.id))
      setDraft(Object.fromEntries(picks
        .filter(p => !(sameDesign.has(p.order_item_id) && p.slot > 0))
        .map(p => [`${p.order_item_id}:${p.slot}`, p.product_id])))
      setLoading(false)
    }
    load()
  }, [order])

  const totalCards = surpriseItems.reduce((sum, i) => sum + i.quantity, 0)
  useEffect(() => {
    onUnpickedChange(Math.max(totalCards - savedPicks.length, 0))
  }, [totalCards, savedPicks, onUnpickedChange])

  // A "same design" item fills every slot with one pick
  const draftPicks = useMemo(() => surpriseItems.flatMap(item =>
    Array.from({ length: item.quantity }, (_, slot) => {
      const productId = draft[`${item.id}:${item.same_design ? 0 : slot}`]
      return productId ? { itemId: item.id, slot, productId } : null
    }).filter(p => p !== null)
  ), [surpriseItems, draft])

  const changed = useMemo(() => {
    const saved = new Map(savedPicks.map(p => [`${p.order_item_id}:${p.slot}`, p.product_id]))
    return draftPicks.length !== saved.size
      || draftPicks.some(p => saved.get(`${p.itemId}:${p.slot}`) !== p.productId)
  }, [draftPicks, savedPicks])

  if (loading || surpriseItems.length === 0) return null

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/surprise`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picks: draftPicks }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      setSavedPicks(json.picks)
      setMessage({ tone: 'ok', text: 'Designs saved. Stock is updated.' })
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err, 'Save failed') })
    } finally {
      setSaving(false)
    }
  }

  const selectClass = 'w-full px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:border-primary'

  return (
    <div className="bg-white border border-border rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="font-medium text-text-primary">Mystery postcard: design sent</h2>
        <button
          onClick={handleSave}
          disabled={saving || !changed}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving && <Spinner />}
          {saving ? 'Saving...' : 'Save designs'}
        </button>
      </div>

      <div className="space-y-6">
        {surpriseItems.map(item => {
          const slots = item.same_design ? 1 : item.quantity
          return (
            <div key={item.id}>
              <p className="text-sm font-medium text-text-primary">
                {item.product_name} <span className="text-text-secondary font-normal">× {item.quantity}</span>
              </p>
              <p className="text-xs text-text-secondary mt-0.5">
                {item.is_gift ? 'Gift: the shipped email will name the design.' : 'Secret: the shipped email won’t name the design.'}
                {item.quantity > 1 && (item.same_design ? ' All cards the same design.' : ' Each card a different design.')}
              </p>
              {item.surprise_preference && (
                <p className="text-sm text-text-primary mt-2 px-3 py-2 bg-primary-light rounded-lg whitespace-pre-line">
                  <span className="block text-xs text-text-secondary mb-0.5">Their preference:</span>
                  {item.surprise_preference}
                </p>
              )}

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: slots }, (_, slot) => {
                  const key = `${item.id}:${slot}`
                  // Designs used by the other cards on this order
                  const takenHere = new Set(
                    Object.entries(draft).filter(([k]) => k !== key).map(([, v]) => v)
                  )
                  return (
                    <label key={key} className="block">
                      <span className="block text-xs font-medium text-text-secondary mb-1.5">
                        {item.same_design && item.quantity > 1 ? `All ${item.quantity} cards` : `Card ${slot + 1}`}
                      </span>
                      <select
                        value={draft[key] ?? ''}
                        onChange={e => setDraft(prev => {
                          const next = { ...prev }
                          if (e.target.value) next[key] = e.target.value
                          else delete next[key]
                          return next
                        })}
                        className={selectClass}
                      >
                        <option value="">Not picked yet</option>
                        {designs.map(d => {
                          const repeat = alreadySent.has(d.id)
                          const taken = takenHere.has(d.id)
                          return (
                            <option key={d.id} value={d.id} disabled={(repeat || taken) && draft[key] !== d.id}>
                              {d.name}
                              {repeat ? ' (already sent to this address)' : taken ? ' (on another card)' : ` (${d.stock} in stock${d.is_active ? '' : ', hidden'})`}
                            </option>
                          )
                        })}
                      </select>
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {message && (
        <p className={`mt-4 text-sm ${message.tone === 'ok' ? 'text-emerald-700' : 'text-error'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
