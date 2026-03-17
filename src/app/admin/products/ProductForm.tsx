'use client'

// src/app/admin/products/ProductForm.tsx

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface ProductFormProps {
  initialData?: {
    id: string
    name: string
    slug: string
    description: string
    long_description: string
    price: number
    category: string
    stock: number
    is_active: boolean
    images: string[]
  }
}

const CATEGORIES = ['postcard', 'necklace', 'zine']

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!initialData

  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    slug: initialData?.slug ?? '',
    description: initialData?.description ?? '',
    long_description: initialData?.long_description ?? '',
    price: initialData ? (initialData.price / 100).toFixed(2) : '',
    category: initialData?.category ?? 'postcard',
    stock: initialData?.stock?.toString() ?? '',
    is_active: initialData?.is_active ?? true,
    images: initialData?.images ?? [] as string[],
  })

  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))

    // Auto-generate slug from name
    if (name === 'name' && !isEdit) {
      setForm(prev => ({
        ...prev,
        name: value,
        slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      }))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const slug = form.slug || 'product'
      const ext = file.name.split('.').pop()
      const path = `${slug}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(path)

      setForm(prev => ({ ...prev, images: [...prev.images, publicUrl] }))
    } catch (err: any) {
      setError(err.message ?? 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      long_description: form.long_description,
      price: Math.round(parseFloat(form.price) * 100),
      category: form.category,
      stock: parseInt(form.stock),
      is_active: form.is_active,
      images: form.images,
    }

    try {
      if (isEdit) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', initialData!.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('products')
          .insert(payload)
        if (error) throw error
      }
      router.push('/admin/products')
      router.refresh()
    } catch (err: any) {
      setError(err.message ?? 'Save failed')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeleting(true)
    await supabase.from('products').delete().eq('id', initialData!.id)
    router.push('/admin/products')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-error">
          {error}
        </div>
      )}

      {/* Basic info */}
      <div className="bg-white border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-medium text-text-primary">Basic Info</h2>

        <Field label="Name">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Seoul Hanok Postcard"
          />
        </Field>

        <Field label="Slug" hint="URL-safe identifier, auto-generated from name">
          <input
            name="slug"
            value={form.slug}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="seoul-hanok-postcard"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (USD)">
            <input
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              type="number"
              step="0.01"
              min="0"
              className={inputClass}
              placeholder="5.00"
            />
          </Field>
          <Field label="Stock">
            <input
              name="stock"
              value={form.stock}
              onChange={handleChange}
              required
              type="number"
              min="0"
              className={inputClass}
              placeholder="25"
            />
          </Field>
        </div>

        <Field label="Category">
          <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </Field>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="w-4 h-4 accent-primary"
          />
          <label htmlFor="is_active" className="text-sm text-text-primary">
            Active (visible in shop)
          </label>
        </div>
      </div>

      {/* Descriptions */}
      <div className="bg-white border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-medium text-text-primary">Descriptions</h2>

        <Field label="Short description" hint="Shown on product card">
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={2}
            className={inputClass}
            placeholder="An original photograph printed on premium postcard stock."
          />
        </Field>

        <Field label="Long description" hint="Shown on product detail page">
          <textarea
            name="long_description"
            value={form.long_description}
            onChange={handleChange}
            required
            rows={6}
            className={inputClass}
            placeholder="Full product details, materials, dimensions..."
          />
        </Field>
      </div>

      {/* Images */}
      <div className="bg-white border border-border rounded-xl p-6 space-y-4">
        <h2 className="font-medium text-text-primary">Images</h2>

        {form.images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {form.images.map((url, i) => (
              <div key={i} className="relative group">
                <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border border-border" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                    Main
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : '+ Upload Image'}
        </button>
        <p className="text-xs text-text-secondary">First image is used as the main product photo.</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2.5 text-sm text-error hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? 'Deleting...' : 'Delete Product'}
          </button>
        )}
      </div>
    </form>
  )
}

const inputClass = 'w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors bg-white'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1.5">
        {label}
        {hint && <span className="text-text-secondary font-normal ml-1.5">— {hint}</span>}
      </label>
      {children}
    </div>
  )
}
