'use client'

// src/app/admin/products/ProductForm.tsx

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { errorMessage } from '@/lib/errors'
import { SLUG_PATTERN, slugify, isValidDollarAmount, isWholeNumber } from '@/lib/validation'
import { FieldMessage, inputClass as baseInputClass, inputBorder } from '@/components/TextField'
import Image from 'next/image'
import Spinner from '@/components/Spinner'

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
    handwritten_price?: number | null
  }
}

const CATEGORIES = ['postcard', 'necklace', 'zine']
const MAX_IMAGE_MB = 20

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
    handwritten_price: initialData?.handwritten_price != null ? (initialData.handwritten_price / 100).toFixed(2) : '0.00',
  })

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [fileDragOver, setFileDragOver] = useState(false)
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
        slug: slugify(value),
      }))
    }
  }

  // Uploads in the order the files were picked or dropped, so the first one becomes the main photo
  const uploadImages = async (files: File[]) => {
    if (files.length === 0) return
    const bad = files.find(f => !f.type.startsWith('image/'))
    if (bad) {
      setError(`${bad.name} isn’t an image. Upload JPG, PNG or WebP files.`)
      return
    }
    const tooBig = files.find(f => f.size > MAX_IMAGE_MB * 1024 * 1024)
    if (tooBig) {
      setError(`${tooBig.name} is over ${MAX_IMAGE_MB} MB. Please upload a smaller one.`)
      return
    }

    setUploading(true)
    setError(null)

    const slug = form.slug || 'product'
    const batch = Date.now()

    try {
      for (const [i, file] of files.entries()) {
        setUploadProgress(files.length > 1 ? `${i + 1} of ${files.length}` : null)
        const ext = file.name.split('.').pop()
        const path = `${slug}/${batch}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(path, file, { upsert: true })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(path)

        // Added one at a time so photos that finished stay if a later one fails
        setForm(prev => ({ ...prev, images: [...prev.images, publicUrl] }))
      }
    } catch (err) {
      setError(errorMessage(err, 'Upload failed'))
    } finally {
      setUploading(false)
      setUploadProgress(null)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''  // lets the same file be picked again after an error
    uploadImages(files)
  }

  // Only file drags from the computer count; reordering thumbnails is a drag too
  const isFileDrag = (e: React.DragEvent) => e.dataTransfer.types.includes('Files')

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  // Move a photo from one position to another (drag and drop, or the arrow buttons)
  const moveImage = (from: number, to: number) => {
    if (from === to || to < 0) return
    setForm(prev => {
      if (to >= prev.images.length) return prev
      const images = [...prev.images]
      const [moved] = images.splice(from, 1)
      images.splice(to, 0, moved)
      return { ...prev, images }
    })
  }

  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Fields the admin has left; their errors show from then on
  const [touched, setTouched] = useState<Set<string>>(new Set())
  const markTouched = (e: React.FocusEvent<HTMLFormElement>) => {
    const { name } = e.target as EventTarget as HTMLInputElement
    if (name && !touched.has(name)) setTouched(prev => new Set(prev).add(name))
  }

  const errors: Record<string, string | null> = {
    name: form.name.trim() ? null : 'Enter a name.',
    slug: SLUG_PATTERN.test(form.slug) ? null : 'Use lowercase letters, numbers and single dashes, like foggy-golden-gate.',
    price: isValidDollarAmount(form.price) ? null : 'Enter a price above $0, like 5.00.',
    stock: isWholeNumber(form.stock) ? null : 'Enter a whole number, 0 or more.',
    handwritten_price: form.category !== 'postcard' || isValidDollarAmount(form.handwritten_price, { allowZero: true })
      ? null
      : 'Enter an amount like 1.00, or 0 for no extra.',
    description: form.description.trim() ? null : 'Enter a short description.',
    long_description: form.long_description.trim() ? null : 'Enter a long description.',
  }
  const isValid = Object.values(errors).every(e => !e)
  const fieldError = (name: string) => (touched.has(name) ? errors[name] : null)
  const inputClass = (name: string) => `${baseInputClass} ${inputBorder(!!fieldError(name))}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      slug: form.slug,
      description: form.description.trim(),
      long_description: form.long_description.trim(),
      price: Math.round(parseFloat(form.price) * 100),
      category: form.category,
      stock: parseInt(form.stock, 10),
      is_active: form.is_active,
      images: form.images,
      // Extra charge for a handwritten postcard (every postcard offers it)
      handwritten_price: form.category === 'postcard'
        ? Math.round((parseFloat(form.handwritten_price) || 0) * 100)
        : null,
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
    } catch (err) {
      // 23505 is Postgres's "duplicate value" error; the slug is the only unique field here
      const duplicate = typeof err === 'object' && err !== null && 'code' in err && err.code === '23505'
      setError(duplicate ? 'Another product already uses that slug. Pick a different one.' : errorMessage(err, 'Save failed'))
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this product? This cannot be undone.')) return
    setDeleting(true)
    setError(null)
    const { error } = await supabase.from('products').delete().eq('id', initialData!.id)
    if (error) {
      // 23503: past orders still point at this product
      setError(error.code === '23503'
        ? 'This product has orders, so it can’t be deleted. Untick Active to hide it from the shop instead.'
        : errorMessage(error, 'Delete failed'))
      setDeleting(false)
      return
    }
    router.push('/admin/products')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} onBlur={markTouched} noValidate className="max-w-7xl space-y-6">
      {error && (
        <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-error">
          {error}
        </div>
      )}

      {/* Two columns on wide screens: details on the left, photos and handwritten option on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        <div className="lg:col-span-3 space-y-6">
          {/* Basic info */}
          <div className="bg-white border border-border rounded-xl p-6 space-y-4">
            <h2 className="font-medium text-text-primary">Basic Info</h2>

            <Field label="Name" htmlFor="name" error={fieldError('name')}>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={inputClass('name')}
                placeholder="Seoul Hanok Postcard"
              />
            </Field>

            <Field label="Slug" hint="URL-safe identifier, auto-generated from name" htmlFor="slug" error={fieldError('slug')}>
              <input
                id="slug"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                className={inputClass('slug')}
                placeholder="seoul-hanok-postcard"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (USD)" htmlFor="price" error={fieldError('price')}>
                <input
                  id="price"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass('price')}
                  placeholder="5.00"
                />
              </Field>
              <Field label="Stock" htmlFor="stock" error={fieldError('stock')}>
                <input
                  id="stock"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  type="number"
                  min="0"
                  className={inputClass('stock')}
                  placeholder="25"
                />
              </Field>
            </div>

            <Field label="Category" htmlFor="category">
              <select id="category" name="category" value={form.category} onChange={handleChange} className={inputClass('category')}>
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

            <Field label="Short description" hint="Shown on product card" htmlFor="description" error={fieldError('description')}>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className={inputClass('description')}
                placeholder="An original photograph printed on premium postcard stock."
              />
            </Field>

            <Field label="Long description" hint="Shown on product detail page" htmlFor="long_description" error={fieldError('long_description')}>
              <textarea
                id="long_description"
                name="long_description"
                value={form.long_description}
                onChange={handleChange}
                rows={8}
                className={inputClass('long_description')}
                placeholder="Full product details, materials, dimensions..."
              />
            </Field>
          </div>

        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <div
            onDragOver={(e) => {
              if (!isFileDrag(e)) return
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
              if (!fileDragOver) setFileDragOver(true)
            }}
            onDragLeave={(e) => {
              // Ignore leaving into a child element of the card
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFileDragOver(false)
            }}
            onDrop={(e) => {
              if (!isFileDrag(e)) return
              e.preventDefault()
              setFileDragOver(false)
              if (!uploading) uploadImages(Array.from(e.dataTransfer.files))
            }}
            className={`bg-white border rounded-xl p-6 space-y-4 transition-colors ${
              fileDragOver ? 'border-primary border-dashed bg-primary/5' : 'border-border'
            }`}
          >
            <h2 className="font-medium text-text-primary">Images</h2>

            {form.images.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {form.images.map((url, i) => (
                  <div
                    key={url}
                    draggable
                    onDragStart={(e) => {
                      setDragIndex(i)
                      e.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(e) => {
                      if (dragIndex === null) return  // a file drag from the computer; the card handles it
                      e.preventDefault()
                      if (dragOverIndex !== i) setDragOverIndex(i)
                    }}
                    onDrop={(e) => {
                      if (dragIndex === null) return
                      e.preventDefault()
                      e.stopPropagation()
                      moveImage(dragIndex, i)
                      setDragIndex(null)
                      setDragOverIndex(null)
                    }}
                    onDragEnd={() => {
                      setDragIndex(null)
                      setDragOverIndex(null)
                    }}
                    className={`relative group cursor-grab active:cursor-grabbing rounded-lg transition-[opacity,box-shadow] ${
                      dragIndex === i ? 'opacity-40' : ''
                    } ${dragOverIndex === i && dragIndex !== i ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    <div className="relative">
                      <Image src={url} alt="" width={80} height={80} draggable={false} className="w-20 h-20 object-cover rounded-lg border border-border" />
                      {i === 0 && (
                        <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                          Main
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      aria-label="Remove image"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    {/* Arrow buttons for touch screens, where drag and drop isn't available */}
                    <div className="flex justify-between mt-1">
                      <button
                        type="button"
                        onClick={() => moveImage(i, i - 1)}
                        disabled={i === 0}
                        aria-label="Move image left"
                        className="w-6 h-6 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, i + 1)}
                        disabled={i === form.images.length - 1}
                        aria-label="Move image right"
                        className="w-6 h-6 text-xs text-text-secondary hover:text-text-primary disabled:opacity-30"
                      >
                        →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-primary/40 transition-colors disabled:opacity-50"
            >
              {uploading && <Spinner />}
              {uploading ? `Uploading${uploadProgress ? ` ${uploadProgress}` : ''}...` : '+ Upload Images'}
            </button>
            <p className="text-xs text-text-secondary">Drop photos anywhere in this box, or click Upload to pick several at once. First image is used as the main product photo. Drag photos to reorder them, then save.</p>
          </div>

          {/* Handwritten option */}
          {form.category === 'postcard' && (
            <div className="bg-white border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-medium text-text-primary">Handwritten option</h2>
              <p className="text-sm text-text-secondary">
                Every postcard can be bought handwritten: the customer writes a note and you mail it as a postcard.
              </p>
              <Field label="Extra for handwritten ($)" hint="Added to the product price; 0 for no extra" htmlFor="handwritten_price" error={fieldError('handwritten_price')}>
                <input
                  type="number"
                  id="handwritten_price"
                  name="handwritten_price"
                  value={form.handwritten_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={inputClass('handwritten_price')}
                />
              </Field>
            </div>
          )}

        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          type="submit"
          disabled={saving || uploading || !isValid}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving && <Spinner />}
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
        </button>
        {!isValid && !saving && (
          <p className="text-xs text-text-secondary mr-auto ml-4">Fill in every field above to save.</p>
        )}

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm text-error hover:text-red-700 transition-colors disabled:opacity-50"
          >
            {deleting && <Spinner />}
            {deleting ? 'Deleting...' : 'Delete Product'}
          </button>
        )}
      </div>
    </form>
  )
}

function Field({ label, hint, htmlFor, error, children }: {
  label: string
  hint?: string
  htmlFor: string
  error?: string | null
  children: React.ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-text-primary mb-1.5">
        {label}
        {hint && <span className="text-text-secondary font-normal ml-1.5">— {hint}</span>}
      </label>
      {children}
      <FieldMessage id={`${htmlFor}-message`} error={error} />
    </div>
  )
}
