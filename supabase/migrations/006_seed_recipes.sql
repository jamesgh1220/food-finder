-- 006_seed_recipes.sql
-- Seed del catálogo de recetas internas (spec 15, REQ-02/REQ-04/REQ-06).
-- Contenido original creado para Food Finder; ver docs/specs/15-seed-data/CONTENT-ORIGIN.md
-- (spec 15, REQ-05). Sin imágenes ni URLs de terceros.
-- `source = 'INTERNAL'` es obligatorio: el catálogo de recomendaciones filtra por él.
-- `instructions` usa E'' con \n: RecipeInstructions divide el texto en pasos por salto de línea.
-- Idempotente: `slug` es UNIQUE, así que reaplicar actualiza sin duplicar.

INSERT INTO recipes (
  name,
  slug,
  description,
  cuisine_id,
  country,
  region,
  meal_type,
  instructions,
  preparation_time,
  cooking_time,
  servings,
  difficulty,
  image_url,
  source,
  source_url
)
SELECT
  v.name::text,
  v.slug::text,
  v.description::text,
  c.id,
  v.country::text,
  v.region::text,
  v.meal_type::text,
  v.instructions::text,
  v.preparation_time::integer,
  v.cooking_time::integer,
  v.servings::integer,
  v.difficulty::text,
  v.image_url::text,
  v.source::text,
  v.source_url::text
FROM (VALUES
  -- Colombia
  ('Huevos pericos', 'huevos-pericos', 'Revoltillo de huevo con cebolla y tomate, el desayuno más común de la mesa colombiana.', 'colombia', 'Colombia', 'América del Sur', 'BREAKFAST', E'Calienta el aceite en una sartén a fuego medio.\nSofríe la cebolla picada fina hasta que esté transparente y añade el tomate en cubos.\nBate los huevos con sal y pimienta y viértelos en la sartén.\nRevuelve sin parar hasta que cuajen pero queden húmedos.\nSirve con cilantro picado por encima.', 5, 10, 2, 'EASY', NULL, 'INTERNAL', NULL),
  ('Arepa con queso', 'arepa-con-queso', 'Arepa de maíz asada y rellena de queso fundido, compañera de cualquier comida.', 'colombia', 'Colombia', 'América del Sur', 'BREAKFAST', E'Mezcla la masa de maíz con agua tibia y sal hasta obtener una masa suave que no se pegue.\nForma bolas y aplánalas con las manos para dar forma a las arepas.\nAsa las arepas en una plancha caliente hasta que se doren por ambos lados.\nÁbrelas por la mitad y rellénalas con queso.\nVuelve a la plancha un minuto para que el queso se funda.', 10, 15, 2, 'EASY', NULL, 'INTERNAL', NULL),
  ('Calentado', 'calentado', 'Arroz y fríjoles del día anterior revueltos con sofrito y huevo: desayuno de aprovechamiento.', 'colombia', 'Colombia', 'América del Sur', 'BREAKFAST', E'Calienta el aceite y sofríe la cebolla con el tomate picados.\nAñade los fríjoles cocidos y el arroz del día anterior.\nRevuelve a fuego medio hasta que todo esté caliente y suelto.\nAparta y prepara los huevos revueltos en otra sartén.\nSirve la mezcla con el huevo por encima y ajusta la sal.', 10, 15, 2, 'EASY', NULL, 'INTERNAL', NULL),
  ('Changua', 'changua', 'Sopa de leche con huevo escalfado y cebolla larga, típica de los amaneceres fríos.', 'colombia', 'Colombia', 'América del Sur', 'BREAKFAST', E'Calienta la leche con el agua y la cebolla larga picada.\nAñade la sal y deja hervir suavemente cinco minutos.\nCasca los huevos directamente en la olla y cocina sin revolver hasta que la clara cuaje.\nSirve en cuencos con cilantro picado y trozos de pan.', 5, 15, 2, 'EASY', NULL, 'INTERNAL', NULL),
  ('Sudado de pollo', 'sudado-de-pollo', 'Guiso de pollo con papa y tomate que se cocina tapado hasta que todo suelta su sabor.', 'colombia', 'Colombia', 'América del Sur', 'LUNCH', E'Sazona las presas de pollo con sal, pimienta y comino.\nCalienta el aceite y sofríe la cebolla y el ajo hasta que suelten aroma.\nAñade el tomate picado y cocina hasta formar un sofrito espeso.\nIncorpora el pollo y las papas en rodajas, y agrega agua hasta casi cubrir.\nTapa y cocina a fuego medio bajo hasta que la papa esté blanda.', 15, 35, 4, 'MEDIUM', NULL, 'INTERNAL', NULL),
  ('Arroz con pollo', 'arroz-con-pollo', 'Arroz sazonado con pollo, zanahoria y arvejas, un clásico de las mesas de domingo.', 'colombia', 'Colombia', 'América del Sur', 'LUNCH', E'Sazona el pollo y dóralo en aceite caliente; retíralo y reserva.\nEn la misma olla sofríe la cebolla y el ajo.\nAñade el arroz, la zanahoria en cubos y las arvejas; mezcla un minuto.\nAgrega el pollo y el agua necesaria, el doble del volumen de arroz.\nCocina tapado a fuego bajo hasta que el arroz esté suelto y seco.', 15, 35, 4, 'MEDIUM', NULL, 'INTERNAL', NULL),
  ('Fríjoles', 'frijoles', 'Fríjoles cocidos a fuego lento con sofrito y plátano, alimento base de la cocina colombiana.', 'colombia', 'Colombia', 'América del Sur', 'LUNCH', E'Remoja los fríjoles la noche anterior y deséchales el agua.\nCocínalos en agua nueva hasta que empiecen a ablandarse.\nSofríe la cebolla, el tomate y el ajo picados.\nAñade el sofrito a los fríjoles con el plátano en trozos.\nCocina a fuego bajo hasta que espesen y ajusta la sal y la pimienta.', 15, 60, 6, 'MEDIUM', NULL, 'INTERNAL', NULL),
  ('Ajiaco', 'ajiaco', 'Sopa espesa de papa con pollo, mazorca y guascas, plato insignia de Bogotá.', 'colombia', 'Colombia', 'América del Sur', 'LUNCH', E'Cocina el pollo en agua con la cebolla larga hasta que esté tierno; desmenuza y reserva.\nEn el mismo caldo añade las papas en láminas y la mazorca en trozos.\nCocina a fuego medio hasta que la papa se deshaga y espese el caldo.\nAgrega el cilantro y las guascas, y cocina diez minutos más.\nSirve con el pollo, crema de leche y alcaparras.', 20, 50, 6, 'HARD', NULL, 'INTERNAL', NULL),
  ('Patacones', 'patacones', 'Discos de plátano verde frito y aplastado, crujientes por fuera y suaves por dentro.', 'colombia', 'Colombia', 'América del Sur', 'SNACK', E'Pela los plátanos verdes y córtalos en trozos gruesos.\nFrítalos en aceite caliente hasta que estén dorados pero tiernos.\nEscúrrelos y aplástalos con una tabla hasta formar discos.\nDevuélvelos al aceite hasta que queden crujientes.\nEscurre y espolvorea sal; sirve con queso si lo tienes.', 10, 15, 4, 'EASY', NULL, 'INTERNAL', NULL),
  ('Arepa con huevo', 'arepa-con-huevo', 'Arepa de maíz con un huevo dentro, asada lentamente hasta que cuaje.', 'colombia', 'Colombia', 'América del Sur', 'BREAKFAST', E'Prepara la masa de maíz con agua y sal y forma discos gruesos.\nHaz un hueco en el centro de cada disco y añade un huevo.\nCierra la masa alrededor del huevo con cuidado.\nAsa las arepas en una plancha con un poco de aceite hasta que el huevo cuaje.\nSirve calientes, con queso rallado por encima.', 10, 10, 2, 'EASY', NULL, 'INTERNAL', NULL),
  -- Perú
  ('Causa limeña', 'causa-limena', 'Puré de papa con limón y ají amarillo relleno de atún, plato frío de la costa peruana.', 'peru', 'Perú', 'América del Sur', 'LUNCH', E'Cocina las papas, pélalas calientes y prensa hasta obtener un puré.\nAmasa el puré con jugo de limón, pasta de ají amarillo, aceite y sal.\nMezcla el atún escurrido con mayonesa y pimienta.\nArma capas de puré y relleno de atún en un molde.\nDecora con huevo duro en rodajas y sirve frío.', 30, 20, 4, 'MEDIUM', NULL, 'INTERNAL', NULL),
  ('Lomo saltado', 'lomo-saltado', 'Salteado de carne con papa frita, tomate y salsa de soya, cocina chifa del día a día.', 'peru', 'Perú', 'América del Sur', 'LUNCH', E'Corta la carne en tiras y sazona con sal y pimienta.\nFríe las papas en bastones y reserva.\nCalienta aceite en un wok y saltea la carne a fuego alto.\nAñade la cebolla, el tomate y el ají amarillo; saltea dos minutos.\nAgrega la salsa de soya y el ajo, mezcla con las papas y sirve con arroz.', 20, 15, 4, 'MEDIUM', NULL, 'INTERNAL', NULL),
  ('Ají de gallina', 'aji-de-gallina', 'Pollo deshilachado en crema de pan, leche y ají amarillo, servido con arroz.', 'peru', 'Perú', 'América del Sur', 'LUNCH', E'Cocina la pechuga de pollo y deshiláchala; reserva el caldo.\nRemoja el pan en la leche y licúalo con el ají amarillo.\nSofríe la cebolla y el ajo, y añade la crema de pan y ají.\nIncorpora el pollo deshilachado y caldo hasta lograr una salsa espesa.\nAjusta la sal y la pimienta; sirve con arroz y queso rallado.', 20, 40, 4, 'MEDIUM', NULL, 'INTERNAL', NULL),
  ('Arroz chaufa', 'arroz-chaufa', 'Arroz salteado al wok con pollo, huevo y cebolla china, herencia chifa del Perú.', 'peru', 'Perú', 'América del Sur', 'LUNCH', E'Calienta el aceite en un wok a fuego alto.\nSaltea el pollo en cubos hasta que dore.\nAñade el huevo batido y revuelve hasta cuajar.\nIncorpora el arroz frío y la salsa de soya, y saltea sin parar.\nAgrega la cebolla china picada y sirve de inmediato.', 15, 15, 4, 'EASY', NULL, 'INTERNAL', NULL),
  -- Argentina
  ('Milanesa', 'milanesa', 'Filetes de carne empanizados con huevo y pan rallado, crujientes y dorados.', 'argentina', 'Argentina', 'América del Sur', 'LUNCH', E'Bate los huevos con el ajo y el perejil picados.\nSazona los filetes con sal y pimienta.\nPasa cada filete por huevo y luego por pan rallado, presionando bien.\nFríe en aceite caliente hasta que estén dorados por ambos lados.\nEscurre sobre papel y sirve con limón.', 20, 15, 4, 'EASY', NULL, 'INTERNAL', NULL),
  ('Empanadas', 'empanadas', 'Masas rellenas de carne, cebolla y huevo duro, horneadas o fritas al gusto.', 'argentina', 'Argentina', 'América del Sur', 'LUNCH', E'Sofríe la cebolla picada y añade la carne picada a cuchillo.\nCondimenta con comino, pimentón, sal y pimienta; cocina hasta que la carne dore.\nRetira del fuego, añade el huevo duro picado y deja enfriar.\nRellena los discos de masa, humedece el borde y repúlguelo bien.\nHornea o fríe hasta que la masa esté dorada.', 40, 25, 6, 'MEDIUM', NULL, 'INTERNAL', NULL),
  ('Choripán', 'choripan', 'Chorizo a la parrilla dentro de pan con chimichurri, el clásico de toda reunión.', 'argentina', 'Argentina', 'América del Sur', 'SNACK', E'Pincha los chorizos y ásalos a la parrilla o en plancha hasta que estén cocidos.\nPrepara el chimichurri picando perejil y ajo con vinagre, aceite y sal.\nAbre el pan por la mitad y caliéntalo en la plancha.\nColoca el chorizo dentro del pan y baña con chimichurri.', 10, 20, 4, 'EASY', NULL, 'INTERNAL', NULL),
  ('Carne al horno', 'carne-al-horno', 'Carne sazonada con ajo y romero, horneada lentamente con papas y verduras.', 'argentina', 'Argentina', 'América del Sur', 'DINNER', E'Precalienta el horno a 180 grados.\nSazona la carne con sal, pimienta, ajo y romero.\nColoca la carne en una bandeja con las papas, la cebolla y la zanahoria.\nRiega con aceite y un poco de agua para que no se seque.\nHornea hasta que la carne esté tierna y las papas doradas.', 15, 90, 6, 'MEDIUM', NULL, 'INTERNAL', NULL),
  -- México
  ('Tacos de carne', 'tacos-de-carne', 'Carne sazonada con comino servida sobre tortillas de maíz con cilantro y limón.', 'mexico', 'México', 'América del Norte', 'LUNCH', E'Condimenta la carne en tiras con sal, pimienta y comino.\nCalienta aceite en una sartén y sella la carne a fuego alto.\nCalienta las tortillas de maíz en una plancha.\nSirve la carne sobre las tortillas con cebolla y cilantro picados.\nTermina con unas gotas de limón y chile al gusto.', 15, 15, 4, 'EASY', NULL, 'INTERNAL', NULL),
  ('Quesadillas', 'quesadillas', 'Tortillas de maíz dobladas con queso fundido y salsa para acompañar.', 'mexico', 'México', 'América del Norte', 'SNACK', E'Calienta una plancha a fuego medio.\nColoca una tortilla y reparte queso rallado sobre la mitad.\nDobla la tortilla y cocina hasta que el queso se funda.\nVoltea una vez para dorar los dos lados.\nSirve con salsa de tomate y una pizca de sal.', 5, 10, 2, 'EASY', NULL, 'INTERNAL', NULL),
  ('Huevos rancheros', 'huevos-rancheros', 'Huevos fritos sobre tortilla bañados en salsa de tomate y chile.', 'mexico', 'México', 'América del Norte', 'BREAKFAST', E'Prepara una salsa friendo tomate, cebolla y chile picados.\nCalienta las tortillas en una plancha y resérvalas.\nFríe los huevos en aceite caliente y sazona con sal.\nColoca un huevo sobre cada tortilla y baña con la salsa.\nAcompaña con fríjoles refritos si los tienes.', 10, 15, 2, 'EASY', NULL, 'INTERNAL', NULL),
  ('Chilaquiles', 'chilaquiles', 'Tortillas fritas bañadas en salsa de tomate, con huevo y queso por encima.', 'mexico', 'México', 'América del Norte', 'BREAKFAST', E'Corta las tortillas en triángulos y fríelas hasta que queden crujientes.\nCalienta la salsa de tomate con la cebolla picada.\nIncorpora las tortillas fritas y mezcla rápido para que no se ablanden.\nSirve con huevo preparado al gusto y queso desmenuzado.\nTermina con crema de leche si la tienes.', 10, 15, 2, 'MEDIUM', NULL, 'INTERNAL', NULL),
  -- España
  ('Tortilla española', 'tortilla-espanola', 'Tortilla de huevo con papa y cebolla cuajada lentamente en aceite de oliva.', 'espana', 'España', 'Europa', 'LUNCH', E'Pela las papas, córtalas en láminas finas y cocínalas en aceite de oliva a fuego bajo.\nAñade la cebolla en juliana y cocina hasta que esté tierna.\nBate los huevos con sal y mezcla con las papas escurridas.\nCuaja la mezcla en la sartén a fuego medio.\nDa la vuelta con un plato y termina de cuajar el otro lado.', 15, 30, 4, 'MEDIUM', NULL, 'INTERNAL', NULL),
  ('Patatas bravas', 'patatas-bravas', 'Cubos de papa frita con salsa de tomate picante y pimentón.', 'espana', 'España', 'Europa', 'SNACK', E'Pela las papas, córtalas en cubos y fríelas hasta que estén doradas.\nSofríe el ajo picado y añade el tomate rallado.\nCondimenta con pimentón, sal y una cucharada de vinagre.\nCocina la salsa a fuego bajo hasta que espese.\nSirve las papas calientes con la salsa por encima.', 15, 30, 4, 'EASY', NULL, 'INTERNAL', NULL),
  ('Gazpacho', 'gazpacho', 'Sopa fría de tomate, pepino y pimentón triturados con aceite de oliva y vinagre.', 'espana', 'España', 'Europa', 'SNACK', E'Lava y trocea el tomate, el pepino, el pimentón y la cebolla.\nTritura todo con el ajo, el aceite de oliva y el vinagre.\nAñade agua y sal hasta lograr la textura deseada.\nCuela si quieres una textura más fina y enfría al menos una hora.\nSirve muy frío, con trozos de pan del día anterior.', 20, 0, 4, 'EASY', NULL, 'INTERNAL', NULL),
  -- Italia
  ('Pasta al pomodoro', 'pasta-al-pomodoro', 'Pasta con salsa de tomate, ajo y albahaca: la receta más simple de la cocina italiana.', 'italia', 'Italia', 'Europa', 'LUNCH', E'Cuece la pasta en agua con sal hasta que esté al dente.\nSofríe el ajo en aceite de oliva a fuego bajo.\nAñade el tomate troceado y cocina diez minutos.\nMezcla la pasta escurrida con la salsa y hojas de albahaca.\nSirve con queso parmesano rallado.', 10, 20, 4, 'EASY', NULL, 'INTERNAL', NULL),
  ('Pasta aglio e olio', 'pasta-aglio-e-olio', 'Pasta con aceite de oliva, ajo y perejil, lista en el tiempo que hierve el agua.', 'italia', 'Italia', 'Europa', 'DINNER', E'Cuece la pasta en agua con sal hasta que esté al dente.\nCalienta el aceite de oliva con el ajo en láminas a fuego bajo.\nAñade el chile seco y el perejil picado.\nMezcla la pasta escurrida con el aceite aromatizado.\nAjusta la sal y la pimienta y sirve al momento.', 10, 15, 2, 'EASY', NULL, 'INTERNAL', NULL),
  ('Frittata', 'frittata', 'Tortilla italiana de huevo con cebolla, queso y espinaca, cuajada a fuego bajo.', 'italia', 'Italia', 'Europa', 'BREAKFAST', E'Bate los huevos con sal y pimienta.\nSofríe la cebolla en aceite de oliva hasta que esté transparente.\nAñade la espinaca y cocina hasta que pierda volumen.\nIncorpora los huevos batidos y el queso rallado.\nCuaja a fuego bajo y termina en el horno o con un plato para dar la vuelta.', 10, 20, 4, 'EASY', NULL, 'INTERNAL', NULL),
  ('Risotto', 'risotto', 'Arroz cremoso cocinado con caldo poco a poco, mantequilla y queso parmesano.', 'italia', 'Italia', 'Europa', 'DINNER', E'Calienta el caldo de verduras y mantenlo caliente.\nSofríe la cebolla picada en aceite de oliva y mantequilla.\nAñade el arroz y remueve hasta que los granos brillen.\nAgrega el vino blanco si lo usas y deja evaporar.\nIncorpora el caldo poco a poco removiendo hasta que el arroz esté cremoso.\nRetira del fuego y mezcla el queso parmesano rallado.', 10, 30, 4, 'MEDIUM', NULL, 'INTERNAL', NULL)
) AS v(
  name,
  slug,
  description,
  cuisine_slug,
  country,
  region,
  meal_type,
  instructions,
  preparation_time,
  cooking_time,
  servings,
  difficulty,
  image_url,
  source,
  source_url
)
JOIN cuisines c ON c.slug = v.cuisine_slug
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cuisine_id = EXCLUDED.cuisine_id,
  country = EXCLUDED.country,
  region = EXCLUDED.region,
  meal_type = EXCLUDED.meal_type,
  instructions = EXCLUDED.instructions,
  preparation_time = EXCLUDED.preparation_time,
  cooking_time = EXCLUDED.cooking_time,
  servings = EXCLUDED.servings,
  difficulty = EXCLUDED.difficulty,
  image_url = EXCLUDED.image_url,
  source = EXCLUDED.source,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();
