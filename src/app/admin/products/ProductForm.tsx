'use client'

// src/app/admin/products/ProductForm.tsx

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { errorMessage } from '@/lib/errors'
import { dbFieldError } from '@/lib/fieldErrors'
import { SLUG_PATTERN, slugify, isValidDollarAmount, isWholeNumber } from '@/lib/validation'
import { FieldMessage, inputClass as baseInputClass, inputBorder } from '@/components/TextField'
import Image from 'next/image'
import Spinner from '@/components/Spinner'
import { isReservedSlug } from '@/lib/shopSections'

// New postcards start at this price; other categories start blank
const DEFAULT_POSTCARD_PRICE = '3.00'

interface ProductFields {
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
  locations?: string[] | null
  orientation?: string | null
  is_surprise?: boolean
}

interface ProductFormProps {
  // Editing an existing product
  initialData?: ProductFields & { id: string }
  // Creating a new product pre-filled from another one ("Duplicate")
  copyFrom?: ProductFields
}

const CATEGORIES = ['postcard', 'necklace', 'zine']

// Names used in the error banner when a save fails on one field
const FIELD_LABELS: Record<string, string> = {
  name: 'Name',
  slug: 'Slug',
  price: 'Price',
  stock: 'Stock',
  category: 'Category',
  description: 'Short description',
  long_description: 'Long description',
  locations: 'Location tags',
  orientation: 'Orientation',
  images: 'Images',
  handwritten_price: 'Extra for handwritten',
}
const MAX_IMAGE_MB = 20

// "San Francisco, bay area ,  " → ['San Francisco', 'bay area'], dropping repeats regardless of case
function parseLocations(value: string): string[] {
  const seen = new Set<string>()
  return value.split(',').map(l => l.trim().replace(/\s+/g, ' ')).filter(l => {
    const key = l.toLowerCase()
    if (!l || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// Reads a photo's shape; square or nearly square photos (like padded mockups) give no answer
function detectOrientation(url: string): Promise<'horizontal' | 'vertical' | null> {
  return new Promise(resolve => {
    const img = new window.Image()
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight
      resolve(ratio > 1.05 ? 'horizontal' : ratio < 0.95 ? 'vertical' : null)
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export default function ProductForm({ initialData, copyFrom }: ProductFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEdit = !!initialData

  // A duplicate keeps the details but gets its own name, slug and photos, and starts hidden
  const source: ProductFields | undefined = initialData ?? (copyFrom && {
    ...copyFrom,
    name: `${copyFrom.name} (copy)`,
    slug: slugify(`${copyFrom.name} copy`),
    images: [],
    is_active: false,
  })

  const [form, setForm] = useState({
    name: source?.name ?? '',
    slug: source?.slug ?? '',
    description: source?.description ?? '',
    long_description: source?.long_description ?? '',
    price: source ? (source.price / 100).toFixed(2) : DEFAULT_POSTCARD_PRICE,
    category: source?.category ?? 'postcard',
    stock: source?.stock?.toString() ?? '',
    is_active: source?.is_active ?? true,
    images: source?.images ?? [] as string[],
    handwritten_price: source?.handwritten_price != null ? (source.handwritten_price / 100).toFixed(2) : '0.00',
    locations: (source?.locations ?? []).join(', '),
    orientation: source?.orientation ?? '',
    // A duplicate of the Mystery listing is an ordinary postcard
    is_surprise: initialData?.is_surprise ?? false,
  })

  // Location tags already used on other products, offered as one-click suggestions
  const [knownLocations, setKnownLocations] = useState<string[]>([])
  useEffect(() => {
    supabase.from('products').select('locations').then(({ data }) => {
      const all = new Set<string>()
      for (const row of data ?? []) for (const loc of (row.locations as string[] | null) ?? []) all.add(loc)
      setKnownLocations([...all].sort((a, b) => a.localeCompare(b)))
    })
  }, [supabase])
  const currentLocations = parseLocations(form.locations)
  const suggestedLocations = knownLocations.filter(
    loc => !currentLocations.some(c => c.toLowerCase() === loc.toLowerCase())
  )
  const addLocation = (loc: string) => {
    setForm(prev => ({ ...prev, locations: [...parseLocations(prev.locations), loc].join(', ') }))
  }

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const [fileDragOver, setFileDragOver] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Errors the database gave on the last save, by field; editing a field clears its own
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const clearServerError = (name: string) => {
    if (!serverErrors[name]) return
    setServerErrors(prev => {
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    clearServerError(name)
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

    // New products: fill in the postcard price when switching to postcard,
    // and clear it when switching away if it was never changed
    if (name === 'category' && !isEdit) {
      setForm(prev => {
        if (value === 'postcard' && prev.price === '') return { ...prev, price: DEFAULT_POSTCARD_PRICE }
        if (value !== 'postcard' && prev.price === DEFAULT_POSTCARD_PRICE) return { ...prev, price: '' }
        return prev
      })
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
        clearServerError('images')

        // Guess a postcard's orientation from its first photo; the admin can change it
        if (i === 0 && form.images.length === 0 && form.category === 'postcard' && !form.orientation) {
          detectOrientation(publicUrl).then(o => {
            if (o) setForm(prev => (prev.orientation ? prev : { ...prev, orientation: o }))
          })
        }
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
    clearServerError('images')
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
    slug: !SLUG_PATTERN.test(form.slug)
      ? 'Use lowercase letters, numbers and single dashes, like foggy-golden-gate.'
      : isReservedSlug(form.slug) ? 'That name is used by a shop page. Pick a different slug.' : null,
    price: isValidDollarAmount(form.price) ? null : 'Enter a price above $0, like 5.00.',
    stock: isWholeNumber(form.stock) ? null : 'Enter a whole number, 0 or more.',
    handwritten_price: form.category !== 'postcard' || isValidDollarAmount(form.handwritten_price, { allowZero: true })
      ? null
      : 'Enter an amount like 1.00, or 0 for no extra.',
    description: form.description.trim() ? null : 'Enter a short description.',
    long_description: form.long_description.trim() ? null : 'Enter a long description.',
  }
  const isValid = Object.values(errors).every(e => !e)
  const fieldError = (name: string) => serverErrors[name] ?? (touched.has(name) ? errors[name] : null)
  // Red border, plus the error read out by screen readers
  const fieldAttrs = (name: string) => {
    const invalid = !!fieldError(name)
    return {
      className: `${baseInputClass} ${inputBorder(invalid)}`,
      'aria-invalid': invalid,
      'aria-describedby': invalid ? `${name}-message` : undefined,
    }
  }

  // Moves to the first highlighted field after a save attempt, once it has rendered red
  const formRef = useRef<HTMLFormElement>(null)
  const [focusRequest, setFocusRequest] = useState(0)
  useEffect(() => {
    if (!focusRequest) return
    const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    first?.focus({ preventScroll: true })
  }, [focusRequest])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) {
      // Show every field's problem at once, not just the ones already visited
      setTouched(new Set(Object.keys(errors)))
      setFocusRequest(n => n + 1)
      return
    }
    setSaving(true)
    setError(null)
    setServerErrors({})

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
      locations: parseLocations(form.locations),
      orientation: form.category === 'postcard' && form.orientation ? form.orientation : null,
      // Only sent once it matters, so saving still works before mystery-postcard.sql is run
      ...(form.is_surprise || initialData?.is_surprise !== undefined
        ? { is_surprise: form.category === 'postcard' && form.is_surprise }
        : {}),
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
      // Point at the field the database complained about when it names one
      // and that field is on screen (orientation is hidden for non-postcards)
      const fieldErr = dbFieldError(err, 'products')
      const label = fieldErr && FIELD_LABELS[fieldErr.column]
      const onScreen = fieldErr && (fieldErr.column === 'images' || !!formRef.current?.querySelector(`[name="${fieldErr.column}"]`))
      if (fieldErr && label && onScreen) {
        setServerErrors({
          [fieldErr.column]: fieldErr.column === 'slug' ? 'Another product already uses that slug. Pick a different one.' : fieldErr.message,
        })
        setError(`Couldn’t save. Check ${label} below.`)
        setFocusRequest(n => n + 1)
      } else {
        setError(errorMessage(err, 'Save failed'))
      }
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
    <form ref={formRef} onSubmit={handleSubmit} onBlur={markTouched} noValidate className="max-w-7xl space-y-6">
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
                {...fieldAttrs('name')}
                placeholder="Seoul Hanok Postcard"
              />
            </Field>

            <Field label="Slug" hint="URL-safe identifier, auto-generated from name" htmlFor="slug" error={fieldError('slug')}>
              <input
                id="slug"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                {...fieldAttrs('slug')}
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
                  {...fieldAttrs('price')}
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
                  {...fieldAttrs('stock')}
                  placeholder="25"
                />
              </Field>
            </div>

            <Field label="Category" htmlFor="category" error={fieldError('category')}>
              <select id="category" name="category" value={form.category} onChange={handleChange} {...fieldAttrs('category')}>
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
                {...fieldAttrs('description')}
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
                {...fieldAttrs('long_description')}
                placeholder="Full product details, materials, dimensions..."
              />
            </Field>
          </div>

          {/* Shop filters */}
          <div className="bg-white border border-border rounded-xl p-6 space-y-4">
            <div>
              <h2 className="font-medium text-text-primary">Shop filters</h2>
              <p className="text-sm text-text-secondary mt-1">Shoppers can filter by these, and search matches location tags too.</p>
            </div>

            <Field label="Location tags" hint="Separate with commas; city and region only, no neighborhoods" htmlFor="locations" error={fieldError('locations')}>
              <input
                id="locations"
                name="locations"
                value={form.locations}
                onChange={handleChange}
                {...fieldAttrs('locations')}
                placeholder="San Francisco, Bay Area"
              />
            </Field>
            {suggestedLocations.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 -mt-2">
                <span className="text-xs text-text-secondary">Used before:</span>
                {suggestedLocations.map(loc => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => addLocation(loc)}
                    className="px-2.5 py-0.5 rounded-full border border-border text-xs text-text-secondary hover:text-text-primary hover:border-neutral-400 transition-colors"
                  >
                    + {loc}
                  </button>
                ))}
              </div>
            )}

            {form.category === 'postcard' && (
              <Field label="Orientation" hint="Filled in from the first photo when it can tell" htmlFor="orientation" error={fieldError('orientation')}>
                <select id="orientation" name="orientation" value={form.orientation} onChange={handleChange} {...fieldAttrs('orientation')}>
                  <option value="">Not set</option>
                  <option value="horizontal">Horizontal</option>
                  <option value="vertical">Vertical</option>
                </select>
              </Field>
            )}
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
              fileDragOver ? 'border-primary border-dashed bg-primary/5' : fieldError('images') ? 'border-error' : 'border-border'
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
            <FieldMessage id="images-message" error={fieldError('images')} />
            <p className="text-xs text-text-secondary">Drop photos anywhere in this box, or click Upload to pick several at once. First image is used as the main product photo. Drag photos to reorder them, then save.</p>
          </div>

          {/* Mystery listing */}
          {form.category === 'postcard' && (
            <div className="bg-white border border-border rounded-xl p-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id="is_surprise"
                  name="is_surprise"
                  checked={form.is_surprise}
                  onChange={handleChange}
                  className="mt-0.5 w-4 h-4 accent-primary"
                />
                <span>
                  <span className="block font-medium text-text-primary">Mystery postcard listing</span>
                  <span className="block text-sm text-text-secondary mt-1">
                    Buyers don&apos;t pick a design. They can leave a preference and mark it a gift, and each order
                    gets a &quot;Design sent&quot; picker. Stock here is how many you&apos;re willing to sell; each pick
                    also takes 1 from that design. Leave it out of location and orientation tags.
                  </span>
                </span>
              </label>
            </div>
          )}

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
                  {...fieldAttrs('handwritten_price')}
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
          disabled={saving || uploading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving && <Spinner />}
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Product'}
        </button>
        {!isValid && !saving && (
          <p className="text-xs text-text-secondary mr-auto ml-4">Some fields still need filling in. Saving will highlight them.</p>
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
