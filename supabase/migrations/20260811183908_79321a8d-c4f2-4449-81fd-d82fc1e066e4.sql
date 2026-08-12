
insert into public.settings (key, value) values
('store', jsonb_build_object(
  'name_ar','دار الأناقة','name_fr','Dar Elegance','logo_url','',
  'phone','+212 6 61 00 00 00','email','contact@darelegance.ma','whatsapp','212661000000',
  'instagram','https://instagram.com','facebook','https://facebook.com','currency','MAD',
  'free_shipping_from', 800,
  'return_policy_ar','يمكنك إرجاع المنتج خلال 7 أيام من الاستلام بشرط أن يكون في حالته الأصلية.',
  'return_policy_fr','Vous pouvez retourner un article sous 7 jours après réception, dans son état d''origine.',
  'privacy_ar','نحن نحترم خصوصيتك ولا نشارك بياناتك مع أي طرف ثالث.',
  'privacy_fr','Nous respectons votre vie privée et ne partageons jamais vos données.',
  'terms_ar','باستخدامك للموقع فإنك توافق على شروط البيع والتوصيل المعتمدة.',
  'terms_fr','En utilisant ce site, vous acceptez nos conditions de vente et de livraison.'
));

insert into public.delivery_zones (name_ar, name_fr, fee, eta_ar, eta_fr) values
('الدار البيضاء','Casablanca',25,'24 ساعة','24 h'),
('الرباط','Rabat',30,'24-48 ساعة','24-48 h'),
('مراكش','Marrakech',35,'48 ساعة','48 h'),
('فاس','Fès',35,'48 ساعة','48 h'),
('طنجة','Tanger',35,'48 ساعة','48 h'),
('أكادير','Agadir',40,'48-72 ساعة','48-72 h'),
('مكناس','Meknès',35,'48 ساعة','48 h'),
('وجدة','Oujda',45,'72 ساعة','72 h'),
('القنيطرة','Kénitra',30,'24-48 ساعة','24-48 h'),
('تطوان','Tétouan',40,'48-72 ساعة','48-72 h'),
('آسفي','Safi',35,'48-72 ساعة','48-72 h'),
('الجديدة','El Jadida',30,'48 ساعة','48 h'),
('بني ملال','Béni Mellal',40,'48-72 ساعة','48-72 h'),
('الناظور','Nador',45,'72 ساعة','72 h'),
('ورزازات','Ouarzazate',50,'72 ساعة','72 h'),
('زاكورة','Zagora',55,'72-96 ساعة','72-96 h');

insert into public.categories (slug, name_ar, name_fr, position, image_url) values
('femme','نساء','Femme',1,'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80'),
('homme','رجال','Homme',2,'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=80'),
('enfant','أطفال','Enfant',3,'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=900&q=80'),
('t-shirts','تيشيرتات','T-Shirts',4,'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80'),
('chemises','قمصان','Chemises',5,'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80'),
('pantalons','سراويل','Pantalons',6,'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80'),
('jeans','جينز','Jeans',7,'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80'),
('robes','فساتين','Robes',8,'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=80'),
('vestes','جاكيتات','Vestes',9,'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=900&q=80'),
('hoodies','سويتشرتات','Hoodies',10,'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80'),
('chaussures','أحذية','Chaussures',11,'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=80'),
('accessoires','إكسسوارات','Accessoires',12,'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80');

insert into public.colors (name_ar, name_fr, hex) values
('أسود','Noir','#111111'),('أبيض','Blanc','#f7f7f5'),('بيج','Beige','#d9c7ad'),
('أزرق','Bleu','#2f4a7a'),('أخضر زيتوني','Kaki','#6b6f4a'),('بني','Marron','#5b3a2a'),
('أحمر','Rouge','#8c2f2f'),('رمادي','Gris','#8a8a8a');

insert into public.sizes (label, position) values ('XS',1),('S',2),('M',3),('L',4),('XL',5),('XXL',6),('38',7),('39',8),('40',9),('41',10),('42',11),('43',12),('Unique',13);

insert into public.coupons (code, type, value, min_order, usage_limit, expires_at) values
('BIENVENUE10','percent',10,300,500, now() + interval '180 days'),
('MAROC50','fixed',50,500,300, now() + interval '120 days'),
('RAMADAN15','percent',15,700,200, now() + interval '90 days');

-- products
with c as (select slug, id from public.categories)
insert into public.products (slug, sku, name_ar, name_fr, description_ar, description_fr, price, old_price, category_id, featured, is_new, best_seller, sales_count)
select p.slug, p.sku, p.name_ar, p.name_fr, p.desc_ar, p.desc_fr, p.price, p.old_price, c.id, p.featured, p.is_new, p.best, p.sales
from (values
('chemise-lin-atlas','SHIRT-001','قميص كتان أطلس','Chemise en lin Atlas','قميص من الكتان الطبيعي بقصة مريحة، مثالي لأيام الصيف المغربية الحارة.','Chemise en lin naturel à coupe décontractée, idéale pour les journées chaudes.',399,499,'chemises',true,true,true,42),
('chemise-oxford-classique','SHIRT-002','قميص أوكسفورد كلاسيكي','Chemise Oxford classique','قميص أوكسفورد قطني بخامة متينة يناسب العمل والمناسبات.','Chemise Oxford en coton épais, parfaite pour le bureau et les sorties.',349,null,'chemises',false,false,true,31),
('tshirt-coton-medina','TSHIRT-001','تيشيرت قطن المدينة','T-shirt coton Médina','تيشيرت قطن مشط 100% بغرزة كثيفة ولون ثابت بعد الغسل.','T-shirt 100% coton peigné, maille dense et couleur durable au lavage.',149,199,'t-shirts',true,true,true,120),
('tshirt-oversize-sahara','TSHIRT-002','تيشيرت أوفرسايز صحراء','T-shirt oversize Sahara','قصة واسعة عصرية بأكتاف منسدلة وخامة ثقيلة 220 غرام.','Coupe oversize moderne, épaules tombantes, jersey lourd 220 g.',189,null,'t-shirts',false,true,false,58),
('polo-pique-rabat','TSHIRT-003','بولو بيكيه الرباط','Polo piqué Rabat','بولو بنسيج بيكيه أنيق مع ياقة مقواة تحافظ على شكلها.','Polo en maille piquée avec col renforcé qui garde sa forme.',229,279,'t-shirts',false,false,true,73),
('jean-slim-casablanca','JEAN-001','جينز سليم كازابلانكا','Jean slim Casablanca','جينز مطاطي بقصة سليم مريحة ولون أزرق داكن ثابت.','Jean stretch coupe slim confortable, bleu foncé indigo.',449,559,'jeans',true,false,true,64),
('jean-droit-brut','JEAN-002','جينز مستقيم خام','Jean droit brut','دنيم خام 13 أونصة بقصة مستقيمة كلاسيكية.','Denim brut 13 oz, coupe droite intemporelle.',499,null,'jeans',false,true,false,22),
('chino-beige-fes','PANT-001','سروال شينو بيج فاس','Chino beige Fès','شينو قطني بقصة مستقيمة يناسب الإطلالات اليومية والرسمية.','Chino en coton coupe droite, du quotidien au semi-habillé.',329,399,'pantalons',false,false,true,47),
('pantalon-cargo-atlas','PANT-002','سروال كارغو أطلس','Pantalon cargo Atlas','كارغو بجيوب جانبية عملية وخامة مقاومة للاستعمال اليومي.','Cargo avec poches latérales pratiques et tissu résistant.',379,null,'pantalons',false,true,false,19),
('robe-longue-zellige','ROBE-001','فستان طويل زليج','Robe longue Zellige','فستان طويل بنقشة مستوحاة من الزليج المغربي وقصة انسيابية.','Robe longue à motif inspiré du zellige marocain, coupe fluide.',649,799,'robes',true,true,true,55),
('robe-satin-soiree','ROBE-002','فستان ساتان للسهرة','Robe satin soirée','فستان ساتان راقٍ بلمعة خفيفة مناسب للحفلات والمناسبات.','Robe en satin au tombé élégant, idéale pour les soirées.',789,null,'robes',false,false,false,26),
('robe-midi-lin','ROBE-003','فستان ميدي كتان','Robe midi en lin','فستان ميدي من الكتان بحزام خصر، خفيف ومريح.','Robe midi en lin avec ceinture, légère et respirante.',549,629,'robes',false,true,false,33),
('blazer-femme-rabat','VEST-001','بليزر نسائي الرباط','Blazer femme Rabat','بليزر بقصة مهيكلة وبطانة ناعمة يمنح إطلالة أنيقة فوراً.','Blazer structuré avec doublure douce pour une allure soignée.',899,1099,'vestes',true,false,true,29),
('veste-jean-tanger','VEST-002','جاكيت جينز طنجة','Veste en jean Tanger','جاكيت دنيم كلاسيكي بأزرار معدنية وجيوب أمامية.','Veste en denim classique, boutons métal et poches poitrine.',599,null,'vestes',false,true,false,24),
('veste-bombers-nuit','VEST-003','جاكيت بومبر ليلي','Bomber Nuit','بومبر خفيف بسحاب معدني وأساور مضلعة.','Bomber léger, zip métal et bords côtelés.',659,749,'vestes',false,false,false,17),
('hoodie-essentiel-noir','HOOD-001','سويتشرت أساسي أسود','Hoodie Essentiel','سويتشرت بقلنسوة من قطن مبطن دافئ وناعم من الداخل.','Hoodie en molleton gratté, chaud et doux à l''intérieur.',399,469,'hoodies',true,true,true,88),
('sweat-capuche-atlas','HOOD-002','سويتشرت أطلس','Sweat à capuche Atlas','سويتشرت بطبعة جبال الأطلس وخيوط قطنية سميكة.','Sweat imprimé montagnes de l''Atlas, coton épais.',429,null,'hoodies',false,true,false,35),
('sneakers-blanc-medina','SHOE-001','سنيكرز أبيض المدينة','Sneakers blanches Médina','سنيكرز جلدية بيضاء بنعل مريح مناسب للمشي الطويل.','Sneakers en cuir blanc, semelle confort pour la marche.',699,849,'chaussures',true,false,true,61),
('mocassins-cuir-fes','SHOE-002','موكاسان جلد فاس','Mocassins cuir Fès','موكاسان من الجلد الطبيعي المغربي بخياطة يدوية.','Mocassins en cuir marocain véritable, couture main.',899,null,'chaussures',false,true,false,14),
('ceinture-cuir-artisan','ACC-001','حزام جلد حرفي','Ceinture cuir artisan','حزام من الجلد الطبيعي بإبزيم معدني مصقول، صناعة محلية.','Ceinture en cuir véritable, boucle métal brossée, fabrication locale.',199,249,'accessoires',false,false,true,52),
('sac-cabas-toile','ACC-002','حقيبة قماش كابا','Sac cabas en toile','حقيبة قماش متينة بحجم عملي للاستعمال اليومي.','Sac cabas en toile résistante, format quotidien.',249,null,'accessoires',false,true,false,20),
('tshirt-enfant-oasis','KID-001','تيشيرت أطفال واحة','T-shirt enfant Oasis','تيشيرت أطفال قطني ناعم بألوان مبهجة وغرزة مقاومة.','T-shirt enfant en coton doux, couleurs gaies et maille solide.',119,149,'enfant',false,true,false,40)
) as p(slug, sku, name_ar, name_fr, desc_ar, desc_fr, price, old_price, cat, featured, is_new, best, sales)
join c on c.slug = p.cat;

-- images (2 per product, cycling a photo pool)
with pool as (
  select row_number() over () - 1 as i, url from (values
   ('https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=1000&q=80'),
   ('https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80')
  ) as t(url)
), p as (select id, row_number() over (order by created_at, slug) - 1 as n from public.products)
insert into public.product_images (product_id, url, position)
select p.id, pool.url, k
from p
cross join lateral (select k from generate_series(0,1) as k) g
join pool on pool.i = ((p.n + g.k * 5) % 12);

-- variants: 3 colors x sizes
insert into public.product_variants (product_id, color_id, size_id, stock)
select p.id, col.id, s.id, 4 + ((abs(hashtext(p.id::text || col.id::text || s.id::text)) % 18))
from public.products p
join lateral (
  select id from public.colors order by md5(p.id::text || id::text) limit 3
) col on true
join public.sizes s on s.label = any (
  case
    when p.slug like 'sneakers%' or p.slug like 'mocassins%' then array['39','40','41','42','43']
    when p.slug like 'ceinture%' or p.slug like 'sac-%' then array['Unique']
    else array['S','M','L','XL']
  end
);
