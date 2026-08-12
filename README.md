# Moroccan Threads

Build a complete, modern and functional Moroccan clothing e-commerce store.

IMPORTANT:

Keep the project SIMPLE and EASY TO MAINTAIN.

Do not over-engineer the architecture.

Use a small number of well-organized files.

Do not create unnecessary folders, hooks, services, abstractions or duplicate components.

The goal is a real working store, not a demo.

==================================================

1. TECHNOLOGY

==================================================

Use:

- Next.js

- TypeScript

- Tailwind CSS

- shadcn/ui

- Supabase / PostgreSQL

- Supabase Auth

- Supabase Storage

- Lucide React

Use Next.js App Router.

Do not use MongoDB.

Do not create Express.

Do not create a separate backend.

==================================================

2. SIMPLE PROJECT STRUCTURE

==================================================

Keep the architecture simple.

Use approximately this structure:

app/

  page.tsx

  shop/

  product/

  cart/

  checkout/

  account/

  admin/

  login/

  register/

  about/

  contact/

components/

  Navbar.tsx

  Footer.tsx

  ProductCard.tsx

  ProductGrid.tsx

  ProductFilters.tsx

  Cart.tsx

  ProductDetails.tsx

  Checkout.tsx

  LanguageSwitcher.tsx

  UI components when necessary

lib/

  supabase.ts

  auth.ts

  utils.ts

messages/

  ar.json

  fr.json

types/

  index.ts

supabase/

  schema.sql

  seed.sql

public/

Do NOT create unnecessary files.

If a function can be kept inside an existing file without making it huge, keep it there.

==================================================

3. LANGUAGES

==================================================

The website must support:

Arabic

French

Arabic is the default.

Arabic:

RTL

French:

LTR

Add a language switcher:

العربية | Français

Store the selected language.

All important interface content must support both languages.

Product fields:

name_ar

name_fr

description_ar

description_fr

Category fields:

name_ar

name_fr

Do not create duplicate pages for each language.

==================================================

4. DESIGN

==================================================

Create a premium modern fashion store.

Style:

- Elegant

- Minimal

- Clean

- Premium

- Modern

- Mobile-first

Use beautiful product cards and large product images.

Do not copy another brand.

Use an original fashion identity.

Currency:

MAD / د.م.

Use smooth but subtle animations.

Do not overuse animations.

==================================================

5. HOME PAGE

==================================================

Create:

- Announcement bar

- Navbar

- Hero section

- Featured categories

- New arrivals

- Best sellers

- Discount products

- Promotional banner

- Customer reviews

- Newsletter

- Footer

Hero must have:

Arabic headline

French headline

CTA button

Example:

العربية:

اكتشف أناقتك

Français:

Découvrez votre style

==================================================

6. SHOP

==================================================

Create a complete product listing.

Features:

- Search

- Categories

- Price filter

- Size filter

- Color filter

- Availability

- Discounts

- New arrivals

- Best sellers

Sorting:

- Newest

- Price low to high

- Price high to low

- Best selling

Use pagination.

==================================================

7. PRODUCTS

==================================================

Products must support:

- Arabic name

- French name

- Arabic description

- French description

- Price

- Old price

- Discount

- SKU

- Category

- Images

- Colors

- Sizes

- Stock

- Featured

- New arrival

- Best seller

- Active

Support variants.

Example:

T-Shirt

Black / S

Black / M

Black / L

White / S

White / M

White / L

Stock must be stored per variant.

==================================================

8. PRODUCT PAGE

==================================================

Create:

- Product gallery

- Product images

- Product title

- Rating

- Price

- Discount

- Color selector

- Size selector

- Quantity

- Stock status

- Add to cart

- Buy now

- Favorite

- Description

- Size guide

- Delivery information

- Reviews

- Related products

Unavailable variants must be disabled.

==================================================

9. CART

==================================================

Create a real shopping cart.

Features:

- Add product

- Select variant

- Change quantity

- Remove item

- Clear cart

- Subtotal

- Discount

- Delivery fee

- Total

Support guest users and logged-in users.

Do not allow quantity greater than available stock.

==================================================

10. AUTHENTICATION

==================================================

Use Supabase Auth.

Implement:

- Register

- Login

- Logout

- Forgot password

- Reset password

Customer profile:

- Name

- Email

- Phone

- Address

- City

- Region

- Postal code

==================================================

11. CHECKOUT

==================================================

Create a simple and professional checkout.

Collect:

- Full name

- Phone

- Email

- Address

- City

- Region

- Postal code

- Delivery notes

Payment method:

Cash On Delivery (COD)

Show:

Subtotal

Discount

Delivery fee

Total

IMPORTANT:

Calculate the final price securely on the server/database.

Never trust totals sent by the browser.

==================================================

12. MOROCCAN DELIVERY

==================================================

Create delivery zones for Morocco.

Include:

Casablanca

Rabat

Marrakech

Fes

Tangier

Agadir

Meknes

Oujda

Kenitra

Tetouan

Safi

El Jadida

Beni Mellal

Nador

Ouarzazate

Zagora

Each city must have:

- Delivery fee

- Estimated delivery time

- Active status

Admin can edit delivery fees.

Do not hardcode delivery prices in React components.

==================================================

13. ORDERS

==================================================

Create orders.

Statuses:

pending

confirmed

processing

shipped

delivered

cancelled

returned

Customer can:

- View orders

- View order details

- Track order status

Admin can:

- View orders

- Search

- Filter

- Change status

- Add tracking number

- Add notes

Save product information inside order items so old orders remain correct.

==================================================

14. STOCK

==================================================

Stock is managed per product variant.

When an order is confirmed:

Decrease stock.

When an order is cancelled before shipment:

Restore stock where appropriate.

Never allow overselling.

==================================================

15. FAVORITES

==================================================

Logged-in customers can:

- Add favorite

- Remove favorite

- View favorites

==================================================

16. REVIEWS

==================================================

Customers can review products they purchased.

Review:

- Rating 1-5

- Comment

Only customers who purchased the product can review it.

Admin can:

- Approve

- Hide

- Delete

Show average rating and reviews on product pages.

==================================================

17. COUPONS

==================================================

Create coupons.

Support:

- Percentage discount

- Fixed discount

- Minimum order

- Expiration

- Usage limit

- Active/inactive

Validate coupons securely.

==================================================

18. ADMIN DASHBOARD

==================================================

Create:

/admin

Admin dashboard should be simple and clean.

Show:

- Total sales

- Orders

- Customers

- Products

- Low stock

- Pending orders

Admin sections:

Products

Categories

Orders

Customers

Coupons

Delivery

Reviews

Settings

==================================================

19. ADMIN PRODUCTS

==================================================

Admin can:

- Add product

- Edit product

- Delete product

- Upload images

- Manage colors

- Manage sizes

- Manage variants

- Manage stock

- Manage prices

- Manage discounts

- Activate/deactivate

- Featured

- New arrival

- Best seller

Use Supabase Storage for images.

==================================================

20. DATABASE

==================================================

Use PostgreSQL.

Keep the database simple.

Create these tables:

profiles

categories

products

product_images

product_variants

colors

sizes

orders

order_items

favorites

reviews

coupons

delivery_zones

settings

contact_messages

newsletter

Use:

- UUID

- Foreign keys

- Unique constraints

- created_at

- updated_at

Add only necessary indexes.

==================================================

21. SECURITY

==================================================

Use Supabase Row Level Security.

Roles:

customer

admin

Customers can only access their own:

- Profile

- Orders

- Favorites

- Reviews

- Addresses

Public users can read active products and approved reviews.

Admins can manage the store.

Protect /admin.

Never expose service role keys.

Never trust client-side:

- Price

- Total

- Discount

- Stock

- Role

- Order status

==================================================

22. IMAGE STORAGE

==================================================

Use Supabase Storage for product images.

Admin can:

- Upload

- Replace

- Delete images

Validate image type and size.

==================================================

23. SEO

==================================================

Implement:

- Metadata

- Product metadata

- Open Graph

- Sitemap

- Robots.txt

- Canonical URLs

- Product structured data

Support Arabic and French.

==================================================

24. ACCESSIBILITY

==================================================

Use:

- Semantic HTML

- Accessible forms

- Keyboard navigation

- Focus states

- Proper labels

- Good contrast

==================================================

25. MOBILE

==================================================

The store must be excellent on mobile.

Create:

- Mobile navbar

- Mobile menu

- Mobile filters

- Mobile cart

- Mobile checkout

Do not simply shrink desktop components.

==================================================

26. SAMPLE DATA

==================================================

Create at least 20 realistic products.

Categories:

Men

Women

Kids

T-Shirts

Shirts

Pants

Jeans

Dresses

Jackets

Hoodies

Shoes

Accessories

Products must have:

Arabic name

French name

Arabic description

French description

Price in MAD

Images

Colors

Sizes

Variants

Stock

Do not use lorem ipsum.

==================================================

27. CONTACT

==================================================

Create contact page.

Fields:

Name

Email

Phone

Message

Save messages to database.

Admin can view contact messages.

==================================================

28. NEWSLETTER

==================================================

Add newsletter signup.

Save email addresses.

Prevent duplicates.

==================================================

29. SETTINGS

==================================================

Admin can configure:

Store name

Logo

Phone

Email

WhatsApp

Instagram

Facebook

Currency

Delivery settings

Return policy

Privacy policy

Terms

==================================================

30. ERROR HANDLING

==================================================

Create:

- Loading states

- Empty states

- Error states

- 404 page

- Form validation

- Toast notifications

Do not show technical database errors to customers.

==================================================

31. PERFORMANCE

==================================================

Keep the application fast.

Use:

- Next.js Server Components

- Optimized images

- Pagination

- Lazy loading

- Efficient database queries

Do not over-engineer caching.

==================================================

32. README

==================================================

Create a simple README explaining:

- Installation

- Environment variables

- Supabase setup

- Database setup

- Storage setup

- Admin setup

- Development

- Build

- Vercel deployment

Create .env.example.

Required variables:

NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

==================================================

33. IMPORTANT IMPLEMENTATION RULES

==================================================

BUILD THE APPLICATION, DO NOT ONLY DESCRIBE IT.

Create all files yourself.

Do not ask me to manually create files.

Do not create unnecessary files.

Do not create unnecessary abstractions.

Keep components reusable but simple.

Do not duplicate code.

Do not use fake APIs.

Do not use mock data instead of Supabase.

Do not leave empty buttons.

Every important button must work.

If Supabase is already configured, use the existing configuration.

Do not delete existing working database or application code.

If something already exists, reuse it.

==================================================

34. FINAL CHECK

==================================================

After building everything:

Run:

npm run lint

Then:

npm run build

Fix all errors.

Check:

- Arabic RTL

- French LTR

- Mobile

- Desktop

- Authentication

- Products

- Search

- Filters

- Cart

- Checkout

- COD

- Orders

- Stock

- Favorites

- Reviews

- Coupons

- Admin

- Delivery

- Database

- RLS

- Storage

- SEO

Do not stop until the application is functional.

START NOW.

First inspect the existing project.

Reuse existing work.

Then build the complete store.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d75b2f5e-5cbe-458a-903b-b4a85b6130d0).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
