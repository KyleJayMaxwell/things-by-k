// mock/data.mjs
// Sample products and orders for `npm run dev:mock`. Nothing here touches the real database.

const BAY = 'San Francisco Bay Area'

const DETAILS = `It's an original photograph by Things by K, printed on thick premium postcard stock.

• 18pt paper, thick, sturdy and built to survive the mail
• Silky smooth matte finish with no shine or glare, so it's easy to write on and display
• Add the handwritten option and I'll write your note and mail it as a real postcard`

const STOCK_LINE = 'An original photograph on thick, glare-free 18pt postcard stock.'

// [image key, name, locations, orientation, stock, short description, long description opening]
const POSTCARDS = [
  ['golden-gate-fog', 'Foggy Golden Gate Bridge - SF', [BAY], 'horizontal', 48,
    'The Golden Gate Bridge disappears into a bank of summer fog.',
    'Karl the Fog rolls in through the Golden Gate most summer afternoons, swallowing the towers one cable at a time. This is the bridge the way locals know it best.'],
  ['bay-bridge', 'Bay Bridge - SF', [BAY], 'horizontal', 35,
    'The Bay Bridge stretches across the water toward the East Bay.',
    'The Bay Bridge links San Francisco to Yerba Buena Island and on to Oakland, and at night its lights shimmer across the whole bay.'],
  ['transamerica', 'Transamerica Pyramid - SF', [BAY], 'vertical', 4,
    'The Transamerica Pyramid points straight up from the Financial District.',
    'The Pyramid has been the sharpest point on the San Francisco skyline since 1972, and it still stops people in their tracks.'],
  ['vending-machines', 'Vending Machines - Tokyo', ['Japan'], 'vertical', 22,
    'A glowing row of vending machines on a quiet Tokyo street.',
    'Turn down almost any side street in Tokyo and you will find them: a row of vending machines humming away, lighting up the block with hot coffee, cold tea and everything in between.'],
  ['taipei-101', 'Taipei 101 - Taipei', ['Taiwan'], 'vertical', 30,
    'Taipei 101 rises over the city like a stack of bamboo.',
    'Shaped like a stalk of bamboo and once the tallest building in the world, Taipei 101 can be seen from almost anywhere in the city.'],
  ['surf-motel', 'Surf Motel - SF', [BAY], 'vertical', 0,
    'The retro sign of the Surf Motel on Lombard Street.',
    'Lombard Street is lined with old motor lodges and their mid-century signs. The Surf Motel is one of the best of them.'],
  ['mt-tam', 'Mt. Tam - Marin', [BAY], 'horizontal', 40,
    'The ridges of Mount Tamalpais in Marin.',
    'Mount Tamalpais watches over Marin County, and from its trails you can see the whole Bay Area spread out below.'],
  ['california-street', 'California Street - SF', [BAY], 'vertical', 26,
    'California Street drops from Nob Hill toward the Financial District.',
    'California Street runs from Nob Hill straight down to the Financial District, one of the steepest and most famous streets in the city.'],
  ['columbus-tower', 'Columbus Tower - SF', [BAY], 'vertical', 18,
    'The green copper Columbus Tower with the Pyramid behind it.',
    'Where North Beach meets the Financial District, the flatiron Columbus Tower sits in front of the Transamerica Pyramid, old San Francisco and new in one frame.'],
  ['coit-tower', 'Coit Tower - SF', [BAY], 'vertical', 62,
    'Coit Tower rises above the North Beach rooftops.',
    'Climb the stairs to Ina Coolbrith Park on Russian Hill and the city opens up below you, with Coit Tower standing on top of Telegraph Hill.'],
  ['painted-ladies', 'Painted Ladies - SF', [BAY], 'horizontal', 55,
    'The Painted Ladies line up along Steiner Street with the skyline behind them.',
    'Find a spot on the hill in Alamo Square Park and you get one of San Francisco\'s most famous views: six Victorian houses standing shoulder to shoulder.'],
  ['longshan-temple', 'Longshan Temple - Taipei', ['Taiwan'], 'vertical', 20,
    'The carved roofs of Longshan Temple in Taipei.',
    'Longshan Temple has stood in Wanhua since 1738. Its roofs are covered in dragons, phoenixes and tiny figures, and it is busy from early morning until late at night.'],
  ['golden-gate-wildflowers', 'Wildflowers & Golden Gate Bridge - SF', [BAY], 'horizontal', 33,
    'Spring wildflowers bloom in front of the Golden Gate Bridge.',
    'Every spring the hillsides around the bridge burst into color. A short walk off the trail and the Golden Gate sits behind a field of orange and yellow.'],
  ['nob-hill-alley', 'Nob Hill Alley - SF', [BAY], 'vertical', 3,
    'A quiet alley tucked into Nob Hill.',
    'Some of the best corners of San Francisco are the little alleys you only find on foot. This one hides on Nob Hill.'],
  ['lottas-fountain', 'Lotta\'s Fountain - SF', [BAY], 'vertical', 15,
    'Lotta\'s Fountain stands at the corner of Market and Kearny.',
    'Lotta\'s Fountain survived the 1906 earthquake and became a meeting point for a city looking for each other. People still gather here every April 18th.'],
  ['fort-mason', 'Golden Gate from Fort Mason - SF', [BAY], 'vertical', 28,
    'The Golden Gate Bridge seen across the water from Fort Mason.',
    'From Fort Mason the bridge sits on the horizon across the water, one of the easiest views of it in the city.'],
]

const DAY = 24 * 60 * 60 * 1000
const ago = (days, hours = 10) => new Date(Date.now() - days * DAY - hours * 60 * 60 * 1000).toISOString()
const uuid = (prefix, n) => `${prefix}-0000-4000-8000-${String(n).padStart(12, '0')}`
const slugify = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function buildData(imageBase) {
  const product = (n, key, fields) => ({
    id: uuid('00000000', n),
    slug: slugify(fields.name),
    price: 300,
    currency: 'usd',
    category: 'postcard',
    images: [`${imageBase}/${key}-1.jpg`, `${imageBase}/${key}-2.jpg`],
    is_active: true,
    handwritten_price: 0,
    created_at: ago(60 - n * 3),
    updated_at: ago(60 - n * 3),
    ...fields,
  })

  const products = POSTCARDS.map(([key, name, locations, orientation, stock, short, opening], i) =>
    product(i + 1, key, {
      name,
      locations,
      orientation,
      stock,
      description: `${short} ${STOCK_LINE}`,
      long_description: `${opening}\n\n${DETAILS}`,
    })
  )
  products.push(product(17, 'surprise-me', {
    name: 'Surprise Me - Anywhere',
    locations: [],
    orientation: null,
    stock: 80,
    description: 'Let me pick a postcard for you from anywhere in the shop. ' + STOCK_LINE,
    long_description: `Can't decide? I'll choose one for you. Leave a note with a place or mood you love and I'll keep it in mind.\n\n${DETAILS}`,
  }))
  // A hidden draft, so the admin Active/Hidden filters have something to show
  products.push(product(18, 'golden-gate-fog', {
    name: 'Foggy Golden Gate Bridge - SF copy',
    is_active: false,
    locations: [BAY],
    orientation: 'horizontal',
    stock: 0,
    description: 'A hidden duplicate for testing. ' + STOCK_LINE,
    long_description: DETAILS,
  }))

  const byName = Object.fromEntries(products.map(p => [p.name, p]))
  const address = (name, city, state, postal_code, country = 'US') =>
    ({ name, line1: '123 Example St', line2: null, city, state, postal_code, country })

  // [days ago, email, address, status, items [name, qty, handwritten message?], carrier, tracking]
  const ORDERS = [
    [0, 'sam@example.com', address('Sam Rivera', 'Oakland', 'CA', '94612'), 'processing',
      [['Coit Tower - SF', 2, 'Dear Mom, wish you were here for the fog!'], ['Bay Bridge - SF', 1]]],
    [1, 'jordan@example.com', address('Jordan Lee', 'Brooklyn', 'NY', '11201'), 'processing',
      [['Taipei 101 - Taipei', 1]]],
    [3, 'alex@example.com', address('Alex Chen', 'Seattle', 'WA', '98101'), 'processing',
      [['Painted Ladies - SF', 3], ['Surprise Me - Anywhere', 1, '']]],
    [6, 'priya@example.com', address('Priya Patel', 'Austin', 'TX', '78701'), 'processing',
      [['Mt. Tam - Marin', 1, 'Happy birthday! Let\'s hike this together soon.']]],
    [8, 'sam@example.com', address('Sam Rivera', 'Oakland', 'CA', '94612'), 'shipped',
      [['Foggy Golden Gate Bridge - SF', 4]], 'usps', '9400111899223344556677'],
    [11, 'mia@example.com', address('Mia Tanaka', 'Toronto', 'ON', 'M5V 2T6', 'CA'), 'shipped',
      [['Vending Machines - Tokyo', 2], ['Longshan Temple - Taipei', 1]], 'usps', '9400111899223344556688'],
    [15, 'chris@example.com', address('Chris Murphy', 'Denver', 'CO', '80202'), 'delivered',
      [['California Street - SF', 1], ['Columbus Tower - SF', 1], ['Transamerica Pyramid - SF', 1]], 'ups', '1Z999AA10123456784'],
    [19, 'taylor@example.com', address('Taylor Brooks', 'Portland', 'OR', '97205'), 'delivered',
      [['Wildflowers & Golden Gate Bridge - SF', 2, 'Thinking of you this spring.']], 'usps', '9400111899223344556699'],
    [23, 'sam@example.com', address('Sam Rivera', 'Oakland', 'CA', '94612'), 'delivered',
      [['Nob Hill Alley - SF', 1], ['Lotta\'s Fountain - SF', 1]], 'usps', '9400111899223344556600'],
    [26, 'riley@example.com', address('Riley Kim', 'Chicago', 'IL', '60601'), 'refunded',
      [['Surf Motel - SF', 2]]],
    [40, 'jordan@example.com', address('Jordan Lee', 'Brooklyn', 'NY', '11201'), 'delivered',
      [['Golden Gate from Fort Mason - SF', 5]], 'usps', '9400111899223344556611'],
    [75, 'alex@example.com', address('Alex Chen', 'Seattle', 'WA', '98101'), 'delivered',
      [['Bay Bridge - SF', 2], ['Coit Tower - SF', 2]], 'usps', '9400111899223344556622'],
  ]

  const orders = []
  const order_items = []
  ORDERS.forEach(([days, email, shipping_address, status, items, carrier = null, tracking_number = null], i) => {
    const id = uuid('10000000', i + 1)
    const created_at = ago(days, 2 + (i % 7))
    let subtotal = 0
    items.forEach(([name, quantity, handwritten_message = null], j) => {
      const p = byName[name]
      subtotal += p.price * quantity
      order_items.push({
        id: uuid('20000000', i * 10 + j + 1), order_id: id, product_id: p.id,
        product_name: p.name, price: p.price, quantity, handwritten_message,
      })
    })
    const shipping_cost = shipping_address.country === 'US' ? 500 : 1500
    const total = subtotal + shipping_cost
    orders.push({
      id,
      order_number: `TBK-${String(i + 1).padStart(5, '0')}`,
      user_id: null,
      email,
      stripe_session_id: `cs_mock_${i + 1}`,
      stripe_payment_intent: `pi_mock_${i + 1}`,
      status,
      subtotal,
      shipping_cost,
      total,
      shipping_address,
      carrier,
      tracking_number,
      shipped_at: carrier ? ago(Math.max(days - 1, 0)) : null,
      refunded_at: status === 'refunded' ? ago(days - 1) : null,
      refund_amount: status === 'refunded' ? total : null,
      created_at,
    })
  })

  return { products, orders, order_items, profiles: [] }
}
