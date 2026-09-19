/**
 * TripCraft — Intelligent Travel Planner & Itinerary Studio
 * Master Client Application Engine
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. Supabase Cloud Sync Engine
  // ==========================================================================
  const supabase = window.supabaseClient || window.supabase || null;

  async function loadUserTrips(userId) {
    if (!supabase) return;
    
    try {
      const { data: trips, error } = await supabase
        .from('trips')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error || !trips || !trips.length) return;

      trips.forEach(t => {
        const tripObj = t.trip_data || t;
        if (!PRESET_TRIPS.some(pt => pt.id === tripObj.id)) {
          PRESET_TRIPS.unshift(tripObj);
        }
      });

      populateTripDropdown();
      renderAllViews();
    } catch (e) {
      console.error("Cloud load error:", e);
    }
  }

  window.loadUserTrips = loadUserTrips;

  async function saveTripToSupabase(tripObj) {
    if (!supabase || !window.currentUser) return;
    try {
      const { error } = await supabase
        .from('trips')
        .upsert({
          id: tripObj.id,
          user_id: window.currentUser.id,
          destination: tripObj.destination,
          trip_data: tripObj,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving trip:', error);
      } else {
        showToast('Trip synced to cloud account!');
      }
    } catch (err) {
      console.error('Save to Supabase error:', err);
    }
  }

  // ==========================================================================
  // 2. Currency Engine
  // ==========================================================================
  const CURRENCIES = {
    USD: { symbol: '$', rate: 1.0 },
    EUR: { symbol: '€', rate: 0.92 },
    GBP: { symbol: '£', rate: 0.79 },
    JPY: { symbol: '¥', rate: 152.0 },
    SAR: { symbol: 'ر.س', rate: 3.75 },
    AED: { symbol: 'AED', rate: 3.67 }
  };

  let currentCurrency = localStorage.getItem('tripcraft_currency') || 'USD';

  function formatMoney(amountInUSD) {
    const curr = CURRENCIES[currentCurrency] || CURRENCIES.USD;
    const converted = Math.round(amountInUSD * curr.rate);
    if (currentCurrency === 'JPY') {
      return `${curr.symbol}${converted.toLocaleString()}`;
    }
    if (currentCurrency === 'SAR' || currentCurrency === 'AED') {
      return `${converted.toLocaleString()} ${curr.symbol}`;
    }
    return `${curr.symbol}${converted.toLocaleString()}`;
  }

  // ==========================================================================
  // 3. Multilingual Translations Dictionary
  // ==========================================================================
  const TRANSLATIONS = {
    en: {
      tagline: "Personal Travel Planner",
      selectTrip: "Select Trip",
      navNewTrip: "Plan New Trip",
      labelTravelers: "Travelers",
      labelStay: "Recommended Stay",
      labelBudget: "Est. Daily Spending",
      labelNeighborhood: "Current District",
      tabItinerary: "Day-by-Day Itinerary",
      tabStays: "Recommended Stays",
      tabBudget: "Cost Estimates & Budget",
      labelNeighborhoodCluster: "Geographic Neighborhood Cluster",
      transitOptimizedSubtext: "Activities grouped within 1.2km to minimize walking for families.",
      labelWeatherAdaptation: "Weather Adaptation Plan",
      completed: "Completed",
      markCompleted: "Mark Done",
      modalNewTripTitle: "Plan a New Personalized Journey",
      formLabelDestination: "Destination City & Country *",
      formLabelDuration: "Duration (Days) *",
      formSectionTravelers: "Who is traveling?",
      formLabelAdults: "Adults (18-64)",
      formLabelChildren: "Children (0-17)",
      formLabelSeniors: "Seniors (65+)",
      formLabelTripType: "Type of Visit *",
      formLabelBudgetPref: "Budget Preference *",
      btnCancel: "Cancel",
      btnGeneratePlan: "Generate Complete Trip Plan",
      btnLogin: "Login",
      btnRegister: "Register",
      btnLogout: "Logout",
      footerText: "Crafting personalized, weather-adaptive journeys worldwide."
    },
    ar: {
      tagline: "مساعد التخطيط الشخصي للرحلات",
      selectTrip: "اختر الرحلة",
      navNewTrip: "خطط لرحلة جديدة",
      labelTravelers: "المسافرون",
      labelStay: "الإقامة الموصى بها",
      labelBudget: "الإنفاق اليومي التقديري",
      labelNeighborhood: "الحي الحالي",
      tabItinerary: "جدول الأيام خطوة بخطوة",
      tabStays: "خيارات الإقامة الموصى بها",
      tabBudget: "تقديرات التكلفة والميزانية",
      labelNeighborhoodCluster: "التجمع الجغرافي للحي",
      transitOptimizedSubtext: "تم تجميع الأنشطة في نطاق 1.2 كم لتقليل وقت التنقل والمشي.",
      labelWeatherAdaptation: "خطة التكيف مع الطقس",
      completed: "مكتمل",
      markCompleted: "تحديد كمكتمل",
      modalNewTripTitle: "تخطيط رحلة جديدة ومخصصة",
      formLabelDestination: "المدينة والدولة *",
      formLabelDuration: "المدة (بالأيام) *",
      formSectionTravelers: "من سيسافر؟",
      formLabelAdults: "البالغون (18-64 سنة)",
      formLabelChildren: "الأطفال (0-17 سنة)",
      formLabelSeniors: "كبار السن (65+ سنة)",
      formLabelTripType: "نوع الرحلة *",
      formLabelBudgetPref: "الميزانية المفضلة *",
      btnCancel: "إلغاء",
      btnGeneratePlan: "توليد خطة الرحلة المتكاملة",
      btnLogin: "تسجيل الدخول",
      btnRegister: "إنشاء حساب",
      btnLogout: "تسجيل الخروج",
      footerText: "نصمم رحلات مخصصة ومتكيفة مع الطقس حول العالم."
    },
    es: {
      tagline: "Planificador Personal de Viajes",
      selectTrip: "Seleccionar Viaje",
      navNewTrip: "Planificar Nuevo Viaje",
      labelTravelers: "Viajeros",
      labelStay: "Alojamiento Recomendado",
      labelBudget: "Gasto Diario Estimado",
      labelNeighborhood: "Barrio Actual",
      tabItinerary: "Itinerario Día a Día",
      tabStays: "Alojamientos Recomendados",
      tabBudget: "Presupuesto y Costos",
      labelNeighborhoodCluster: "Agrupación Geográfica del Barrio",
      transitOptimizedSubtext: "Actividades agrupadas en 1.2 km para minimizar traslados.",
      labelWeatherAdaptation: "Plan de Adaptación al Clima",
      completed: "Completado",
      markCompleted: "Marcar Listo",
      modalNewTripTitle: "Planificar un Nuevo Viaje Personalizado",
      formLabelDestination: "Ciudad y País *",
      formLabelDuration: "Duración (Días) *",
      formSectionTravelers: "¿Quiénes viajan?",
      formLabelAdults: "Adultos (18-64)",
      formLabelChildren: "Niños (0-17)",
      formLabelSeniors: "Mayores (65+)",
      formLabelTripType: "Tipo de Visita *",
      formLabelBudgetPref: "Presupuesto *",
      btnCancel: "Cancelar",
      btnGeneratePlan: "Generar Plan Completo",
      btnLogin: "Iniciar Sesión",
      btnRegister: "Registrarse",
      btnLogout: "Cerrar Sesión",
      footerText: "Diseñando viajes personalizados en todo el mundo."
    },
    fr: {
      tagline: "Planificateur de Voyage Personnel",
      selectTrip: "Sélectionner le Voyage",
      navNewTrip: "Nouveau Voyage",
      labelTravelers: "Voyageurs",
      labelStay: "Hébergement Recommandé",
      labelBudget: "Dépense Quotidienne Estimée",
      labelNeighborhood: "Quartier Actuel",
      tabItinerary: "Itinéraire Jour par Jour",
      tabStays: "Hébergements Recommandés",
      tabBudget: "Estimations & Budget",
      labelNeighborhoodCluster: "Regroupement Géographique du Quartier",
      transitOptimizedSubtext: "Activités regroupées à moins de 1,2 km.",
      labelWeatherAdaptation: "Plan d'Adaptation Météorologique",
      completed: "Effectué",
      markCompleted: "Marquer comme fait",
      modalNewTripTitle: "Créer un Nouveau Voyage",
      formLabelDestination: "Ville & Pays *",
      formLabelDuration: "Durée (Jours) *",
      formSectionTravelers: "Qui voyage ?",
      formLabelAdults: "Adultes (18-64)",
      formLabelChildren: "Enfants (0-17)",
      formLabelSeniors: "Seniors (65+)",
      formLabelTripType: "Type de Séjour *",
      formLabelBudgetPref: "Préférence Budgétaire *",
      btnCancel: "Annuler",
      btnGeneratePlan: "Générer le Plan",
      btnLogin: "Connexion",
      btnRegister: "S'inscrire",
      btnLogout: "Déconnexion",
      footerText: "Création de voyages personnalisés dans le monde entier."
    },
    ja: {
      tagline: "パーソナル旅行プランナー",
      selectTrip: "旅行を選択",
      navNewTrip: "新しい旅を計画",
      labelTravelers: "旅行者",
      labelStay: "おすすめの宿泊先",
      labelBudget: "1日の目安支出",
      labelNeighborhood: "現在のエリア",
      tabItinerary: "日別旅程表",
      tabStays: "おすすめ宿泊先",
      tabBudget: "予算と費用見積もり",
      labelNeighborhoodCluster: "地域・エリアグループ",
      transitOptimizedSubtext: "移動時間を最小限に抑えるため、半径1.2km以内で活動をまとめています。",
      labelWeatherAdaptation: "気候・天候適応プラン",
      completed: "完了",
      markCompleted: "完了にする",
      modalNewTripTitle: "新しい旅行プランを作成",
      formLabelDestination: "旅行先の都市・国 *",
      formLabelDuration: "旅行日数 *",
      formSectionTravelers: "旅行者の人数",
      formLabelAdults: "大人 (18-64歳)",
      formLabelChildren: "子供 (0-17歳)",
      formLabelSeniors: "シニア (65歳以上)",
      formLabelTripType: "旅行の目的 *",
      formLabelBudgetPref: "予算設定 *",
      btnCancel: "キャンセル",
      btnGeneratePlan: "旅行プランを自動生成",
      btnLogin: "ログイン",
      btnRegister: "新規登録",
      btnLogout: "ログアウト",
      footerText: "世界中の旅行者に寄り添う旅行計画をデザインします。"
    },
    de: {
      tagline: "Persönlicher Reiseplaner",
      selectTrip: "Reise Auswählen",
      navNewTrip: "Neue Reise Planen",
      labelTravelers: "Reisende",
      labelStay: "Empfohlene Unterkunft",
      labelBudget: "Geschätzte Tagesausgaben",
      labelNeighborhood: "Aktueller Stadtteil",
      tabItinerary: "Tagesprogramm",
      tabStays: "Empfohlene Unterkünfte",
      tabBudget: "Kosten & Budget",
      labelNeighborhoodCluster: "Geografischer Stadtteil-Cluster",
      transitOptimizedSubtext: "Aktivitäten im Umkreis von 1,2 km gebündelt.",
      labelWeatherAdaptation: "Wetteranpassungsplan",
      completed: "Erledigt",
      markCompleted: "Als erledigt markieren",
      modalNewTripTitle: "Neue Reise Planen",
      formLabelDestination: "Zielstadt & Land *",
      formLabelDuration: "Dauer (Tage) *",
      formSectionTravelers: "Wer reist mit?",
      formLabelAdults: "Erwachsene (18-64 J.)",
      formLabelChildren: "Kinder (0-17 J.)",
      formLabelSeniors: "Senioren (65+ J.)",
      formLabelTripType: "Art der Reise *",
      formLabelBudgetPref: "Budget-Präferenz *",
      btnCancel: "Abbrechen",
      btnGeneratePlan: "Reiseplan Erstellen",
      btnLogin: "Anmelden",
      btnRegister: "Registrieren",
      btnLogout: "Abmelden",
      footerText: "Personalisierte Reiseplanung weltweit."
    }
  };

  let currentLang = localStorage.getItem('tripcraft_lang') || 'en';

  function t(key) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  }

  function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('tripcraft_lang', lang);

    const htmlEl = document.documentElement;
    htmlEl.lang = lang;
    htmlEl.dir = (lang === 'ar') ? 'rtl' : 'ltr';

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key && t(key)) {
        el.textContent = t(key);
      }
    });

    const langSelect = document.getElementById('langSelect');
    if (langSelect) langSelect.value = lang;

    renderAllViews();
  }

  // ==========================================================================
  // 4. Preset Complete Trips Dataset (5 Days)
  // ==========================================================================
  const PRESET_TRIPS = [
    {
      id: 'trip-tokyo-family',
      destination: 'Tokyo, Japan',
      country: 'Japan',
      heroImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80',
      title: 'Tokyo Neon & Heritage',
      subtitle: 'A personalized voyage balancing vibrant pop-culture districts, historic Shinto shrines, and serene imperial gardens.',
      tripType: 'Family Vacation',
      durationDays: 5,
      travelers: {
        total: 4,
        adults: 2,
        children: 2,
        seniors: 0,
        summary: '4 Travelers (2 Adults, 2 Kids)'
      },
      budgetTier: 'moderate',
      weather: {
        temp: '24°C',
        condition: 'Clear & Mild',
        notes: 'Weather Optimized: Cooler morning temple visits, midday indoor science/ac activities, sunset river breezes.'
      },
      stays: [
        {
          id: 'stay-mimaru-asakusa',
          name: 'MIMARU TOKYO Asakusa Station',
          type: 'Apartment Hotel',
          neighborhood: 'Asakusa & Sumida',
          rating: '4.92',
          pricePerNight: 240,
          category: 'family',
          fitBanner: '✓ Fits 4 Guests (Family Suite with Japanese Bunk Beds)',
          features: ['👶 Stroller-Friendly', '♿ Elevator & Level Entry', '👨‍👩‍👧 Family Kitchen', '📍 2-min Walk to Asakusa Station'],
          bookingUrl: 'https://mimaruhotels.com/en/hotel/asakusa-station/',
          description: 'Spacious Japanese apartment hotel tailor-made for families with separate living spaces, coin laundry, and immediate access to the Ginza line.'
        },
        {
          id: 'stay-hotel-gracery',
          name: 'Hotel Gracery Shinjuku',
          type: 'Modern Hotel',
          neighborhood: 'Shinjuku',
          rating: '4.78',
          pricePerNight: 190,
          category: 'central',
          fitBanner: '✓ Fits 4 Guests (Connecting Rooms Available)',
          features: ['🦖 Iconic Godzilla Head View', '📍 5-min Walk to Shinjuku Station', '🍳 On-site Breakfast Buffet'],
          bookingUrl: 'https://gracery.com/shinjuku/',
          description: 'High-rise modern stay located in central Shinjuku close to major transit, dining hubs, and entertainment venues.'
        }
      ],
      days: [
        {
          dayNumber: 1,
          dateLabel: 'Day 1',
          neighborhood: 'Asakusa, Sensō-ji & Sumida Riverfront',
          weatherPlan: '☀️ Cooler Morning: Outdoor Temple • 🏛️ Midday Peak Heat: Air-Conditioned Nakamise Arcade • 🌆 Sunset Breeze: River Promenade',
          morning: {
            dualName: '浅草寺 (Sensō-ji Historic Temple)',
            category: 'Heritage & Culture',
            time: '09:00 - 11:30',
            desc: 'Tokyo’s oldest Buddhist temple founded in 645 AD. Enter through the iconic Kaminarimon Gate with giant red lantern.',
            weatherBadge: '☀️ Cool Morning Outdoor',
            accessibility: ['👶 Stroller-Friendly', '♿ Step-Free Ramp at Main Hall'],
            cost: 0,
            completed: false
          },
          lunch: {
            dualName: '大黒家 天麩羅 (Daikokuya Tempura)',
            category: 'Local Food Pick',
            time: '12:00 - 13:15',
            desc: 'Historic eatery founded in 1887 famed for rich, savory sesame-oil dipped tendon bowls over steaming rice.',
            weatherBadge: '❄️ Air-Conditioned Indoor Dining',
            accessibility: ['👨‍👩‍👧 Family-Friendly Seating'],
            cost: 45,
            completed: false
          },
          afternoon: {
            dualName: '東京スカイツリー (Tokyo Skytree & Solamachi)',
            category: 'Sightseeing & Arcade',
            time: '14:00 - 17:00',
            desc: 'Towering observation deck with panoramic views across Greater Tokyo and Mount Fuji.',
            weatherBadge: '🏛️ Midday Indoor Air-Conditioned',
            accessibility: ['♿ Full Wheelchair Accessibility'],
            cost: 65,
            completed: false
          },
          evening: {
            dualName: '隅田川遊歩道 (Sumida River Sunset Promenade)',
            category: 'Scenic Walk & Local Eats',
            time: '18:00 - 20:30',
            desc: 'Breezy evening stroll along the lit bridges of Sumida River.',
            weatherBadge: '🌆 Pleasant Evening Breeze',
            accessibility: ['👶 Smooth Paved Walkway'],
            cost: 50,
            completed: false
          }
        },
        {
          dayNumber: 2,
          dateLabel: 'Day 2',
          neighborhood: 'Ueno Park, Museums & Ameyoko Market',
          weatherPlan: '🌳 Shade Protected Morning: Ueno Cultural Gardens • 🏛️ Midday Cool: National Science Museum',
          morning: {
            dualName: '上野恩賜公園 (Ueno Imperial Park & Shinobazu Pond)',
            category: 'Nature & Stroll',
            time: '09:00 - 11:00',
            desc: 'Expansive public park with Lotus ponds, Ueno Toshogu Shrine, and shaded walking paths.',
            weatherBadge: '🌳 Shaded Morning Stroll',
            accessibility: ['👶 Paved Paths throughout'],
            cost: 0,
            completed: false
          },
          lunch: {
            dualName: 'アメ横商店街 (Ameyoko Market Street Eats)',
            category: 'Street Food & Local Bites',
            time: '11:30 - 13:00',
            desc: 'Bustling open-air street market known for fresh seafood bowls, yakitori skewers, and fresh fruit stalls.',
            weatherBadge: '☀️ Covered Arcade Paths',
            accessibility: ['👨‍👩‍👧 Lively Street Food'],
            cost: 35,
            completed: false
          },
          afternoon: {
            dualName: '国立科学博物館 (National Museum of Nature and Science)',
            category: 'Family Interactive Museum',
            time: '13:30 - 16:30',
            desc: 'Interactive 360-degree theater, life-size dinosaur skeletons, and hands-on physics exhibits.',
            weatherBadge: '❄️ Fully Climate Controlled',
            accessibility: ['♿ Elevators & Restrooms'],
            cost: 30,
            completed: false
          },
          evening: {
            dualName: '伊豆栄 本店 (Izuei Honten Unagi Dinner)',
            category: 'Traditional Dining',
            time: '17:30 - 19:30',
            desc: 'Historic eel restaurant operating for over 260 years serving tender grilled unagi over rice.',
            weatherBadge: '🌙 Cozy Indoor Dining',
            accessibility: ['♿ Elevator Access'],
            cost: 80,
            completed: false
          }
        },
        {
          dayNumber: 3,
          dateLabel: 'Day 3',
          neighborhood: 'Meiji Jingu, Harajuku & Shibuya Crossing',
          weatherPlan: '🌲 Dense Forest Canopy Morning • 🛍️ Midday Shopping & Indoor Eats • 🌆 Iconic Neon Crossing',
          morning: {
            dualName: '明治神宮 (Meiji Shrine & Forest Sanctuary)',
            category: 'Cultural Landmark',
            time: '09:00 - 11:00',
            desc: 'Serene Shinto shrine surrounded by a 170-acre evergreen forest with 100,000 trees.',
            weatherBadge: '🌲 Tree Shaded Pathways',
            accessibility: ['👶 Wide Gravel Paths'],
            cost: 0,
            completed: false
          },
          lunch: {
            dualName: '原宿ぐんちゃん (Takeshita Street & Crepe Tasting)',
            category: 'Youth Culture & Snacks',
            time: '11:30 - 13:00',
            desc: 'Explore colorful boutiques and taste Harajuku’s famous strawberry whipped cream dessert crepes.',
            weatherBadge: '☀️ Pedestrian Only Zone',
            accessibility: ['👨‍👩‍👧 Kid Favorite Treats'],
            cost: 25,
            completed: false
          },
          afternoon: {
            dualName: 'SHIBUYA SKY & 渋谷スクランブル交差点 (Shibuya Sky Observation Deck)',
            category: 'Panoramic Viewpoint',
            time: '14:00 - 17:00',
            desc: 'Open-air rooftop 229 meters above Shibuya Crossing offering 360-degree views.',
            weatherBadge: '🌤️ High Altitude Views',
            accessibility: ['♿ Full Elevator Access'],
            cost: 55,
            completed: false
          },
          evening: {
            dualName: '渋谷横丁 (Shibuya Yokocho Regional Food Hall)',
            category: 'Gourmet Food Alley',
            time: '18:00 - 20:30',
            desc: 'Vibrant indoor alley in Miyashita Park showcasing specialty dishes from all 47 Japanese prefectures.',
            weatherBadge: '🌆 Covered Vibrant Alley',
            accessibility: ['♿ Level Access'],
            cost: 60,
            completed: false
          }
        },
        {
          dayNumber: 4,
          dateLabel: 'Day 4',
          neighborhood: 'Odaiba Bayfront, teamLab & Giant Gundam',
          weatherPlan: '🌊 Bay Breeze & Indoor Digital Art Realm',
          morning: {
            dualName: 'teamLab Planets TOKYO (チームラボプラネッツ)',
            category: 'Digital Art Immersive',
            time: '09:30 - 12:00',
            desc: 'Walk barefoot through water and knee-deep mirror rooms surrounded by floating digital flowers.',
            weatherBadge: '❄️ Indoor Multi-Sensory Environment',
            accessibility: ['♿ Wheelchair Accessible Routes Available'],
            cost: 95,
            completed: false
          },
          lunch: {
            dualName: 'アクアシティお台場 (Aqua City Seafood & Ramen Park)',
            category: 'Oceanfront Dining',
            time: '12:30 - 14:00',
            desc: 'Overlooks the Tokyo Rainbow Bridge while dining at the Tokyo Ramen Kokugikan food court.',
            weatherBadge: '🏛️ Air-Conditioned Waterfront Mall',
            accessibility: ['👶 Full Mall Stroller Access'],
            cost: 40,
            completed: false
          },
          afternoon: {
            dualName: '実物大ユニコーンガンダム立像 (Life-Sized Unicorn Gundam Statue)',
            category: 'Anime Landmark & Plaza',
            time: '14:30 - 16:30',
            desc: '19.7-meter tall mech transformer statue outside DiverCity Tokyo Plaza with transformation light shows.',
            weatherBadge: '🌊 Sea Breeze Plaza',
            accessibility: ['👶 Smooth Plaza Paving'],
            cost: 0,
            completed: false
          },
          evening: {
            dualName: 'お台場海浜公園 (Odaiba Seaside Park Sunset Walk)',
            category: 'Sunset Promenade',
            time: '17:00 - 19:30',
            desc: 'Watch the sun set behind Tokyo Tower and the Rainbow Bridge from the sandy shoreline.',
            weatherBadge: '🌆 Cool Bay Evening Breeze',
            accessibility: ['👶 Boardwalk Access'],
            cost: 35,
            completed: false
          }
        },
        {
          dayNumber: 5,
          dateLabel: 'Day 5',
          neighborhood: 'Imperial Palace Gardens & Ginza Shopping',
          weatherPlan: '🏰 Shaded Historic Moats • 🛍️ Pedestrian Paradise Promenade',
          morning: {
            dualName: '皇居東御苑 (Imperial Palace East Gardens & Nijubashi Bridge)',
            category: 'Imperial History & Nature',
            time: '09:00 - 11:30',
            desc: 'Walk through the former Edo Castle guardhouses, massive stone walls, and Japanese landscaped gardens.',
            weatherBadge: '🏰 Shaded Moat Walks',
            accessibility: ['👶 Gentle Gravel Slopes'],
            cost: 0,
            completed: false
          },
          lunch: {
            dualName: '銀座 篝 (Ginza Kagari Michelin Tori Paitan Ramen)',
            category: 'Gourmet Ramen Pick',
            time: '12:00 - 13:30',
            desc: 'Renowned for rich, creamy white chicken broth ramen topped with seasonal roasted vegetables.',
            weatherBadge: '❄️ Indoor Cozy Dining',
            accessibility: ['👨‍👩‍👧 Counter & Table Seating'],
            cost: 40,
            completed: false
          },
          afternoon: {
            dualName: '銀座歩行者天国 (Ginza Chuo-dori Pedestrian Zone)',
            category: 'Architecture & Shopping',
            time: '14:00 - 16:30',
            desc: 'Tokyo’s premier luxury district where the main avenue becomes pedestrian-only on weekends.',
            weatherBadge: '🛍️ Open-Air Pedestrian Street',
            accessibility: ['👶 Wide Flat Sidewalks'],
            cost: 20,
            completed: false
          },
          evening: {
            dualName: '銀座 Mitsukoshi Rooftop Garden & Farewell Dinner',
            category: 'Rooftop Lounge',
            time: '17:00 - 20:00',
            desc: 'Relax at the rooftop garden followed by a farewell dinner at Ginza Din Tai Fung.',
            weatherBadge: '🌆 Sunset Skyline Views',
            accessibility: ['♿ Elevator Access'],
            cost: 75,
            completed: false
          }
        }
      ],
      budgetBreakdown: {
        totalTripCost: 2450,
        dailyAverage: 490,
        perPersonTotal: 612.50,
        lodgingTotal: 1200,
        diningTotal: 620,
        ticketsTotal: 380,
        transitTotal: 250,
        lodgingPct: 49,
        diningPct: 25,
        ticketsPct: 16,
        transitPct: 10
      }
    }
  ];

  let currentTripIndex = 0;
  let activeDayIndex = 0;

  function getCurrentTrip() {
    return PRESET_TRIPS[currentTripIndex] || PRESET_TRIPS[0];
  }

  // ==========================================================================
  // 5. Toast Notifications
  // ==========================================================================
  function showToast(message) {
    let stack = document.getElementById('toastStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'toastStack';
      document.body.appendChild(stack);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = 'background: var(--bg-secondary); color: var(--text-primary); padding: 12px 18px; border-radius: 8px; box-shadow: var(--shadow-main); display: flex; align-items: center; gap: 8px; font-size: 0.9rem; border: 1px solid var(--border-color);';
    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    stack.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  window.showToast = showToast;

  // ==========================================================================
  // 6. Core Rendering Functions
  // ==========================================================================
  function populateTripDropdown() {
    const tripSelect = document.getElementById('tripSelect');
    if (!tripSelect) return;
    tripSelect.innerHTML = PRESET_TRIPS.map((trip, idx) =>
      `<option value="${idx}">${trip.destination} (${trip.durationDays} Days)</option>`
    ).join('');
    tripSelect.value = currentTripIndex;
  }

  function renderTripHero() {
    const trip = getCurrentTrip();
    const backdrop = document.getElementById('heroBackdrop');
    if (backdrop && trip.heroImage) backdrop.style.backgroundImage = `url('${trip.heroImage}')`;

    const title = document.getElementById('heroTitle');
    if (title) title.textContent = trip.title;

    const subtitle = document.getElementById('heroSubtitle');
    if (subtitle) subtitle.textContent = trip.subtitle;

    const type = document.getElementById('heroTripType');
    if (type) type.textContent = trip.tripType;

    const duration = document.getElementById('heroDuration');
    if (duration) duration.textContent = `${trip.durationDays} Days`;

    const weather = document.getElementById('heroWeatherText');
    if (weather) weather.textContent = `${trip.weather.temp} • Weather Optimized`;

    const travelers = document.getElementById('metricTravelers');
    if (travelers) travelers.textContent = trip.travelers.summary;

    const stay = document.getElementById('metricStay');
    if (stay && trip.stays.length) stay.textContent = trip.stays[0].name;

    const spend = document.getElementById('metricDailySpend');
    if (spend) spend.textContent = `${formatMoney(trip.budgetBreakdown.dailyAverage)} / day`;

    const district = document.getElementById('metricNeighborhood');
    if (district && trip.days.length) district.textContent = trip.days[activeDayIndex]?.neighborhood || trip.days[0].neighborhood;
  }

  function renderItinerary() {
    const container = document.getElementById('itinerary');
    if (!container) return;

    const trip = getCurrentTrip();
    const day = trip.days[activeDayIndex] || trip.days[0];

    let dayPillsHtml = `
      <div class="day-pills-row">
        ${trip.days.map((d, idx) => `
          <button class="day-pill-btn ${idx === activeDayIndex ? 'active' : ''}" data-day-index="${idx}" type="button">
            <span class="pill-day-label">Day ${d.dayNumber}</span>
            <span class="pill-day-title">${d.neighborhood.split(',')[0]}</span>
          </button>
        `).join('')}
      </div>
    `;

    const phases = [
      { key: 'morning', label: 'Morning', badgeClass: 'phase-morning' },
      { key: 'lunch', label: 'Lunch Spot', badgeClass: 'phase-lunch' },
      { key: 'afternoon', label: 'Afternoon', badgeClass: 'phase-afternoon' },
      { key: 'evening', label: 'Evening', badgeClass: 'phase-evening' }
    ];

    let slotsHtml = phases.map(phase => {
      const slot = day[phase.key];
      if (!slot) return '';
      return `
        <div class="timeline-slot-card ${slot.completed ? 'completed' : ''}">
          <div class="slot-time-column">
            <span class="slot-phase-pill ${phase.badgeClass}">${phase.label}</span>
            <span class="slot-time-range">${slot.time}</span>
          </div>
          <div class="slot-content-column">
            <div class="slot-top-row">
              <h3 class="dual-name-title">${slot.dualName}</h3>
              <span class="slot-category-badge">${slot.category}</span>
            </div>
            <p class="slot-description">${slot.desc}</p>
            <div class="slot-flags-row">
              <span class="flag-chip weather-chip">${slot.weatherBadge}</span>
              ${slot.accessibility ? slot.accessibility.map(a => `<span class="flag-chip access-chip">${a}</span>`).join('') : ''}
              <span class="flag-chip cost-chip">${slot.cost === 0 ? 'Free Entry' : formatMoney(slot.cost)}</span>
            </div>
            <div class="slot-actions-bar">
              <label class="completion-check-label">
                <input type="checkbox" class="completion-checkbox" data-slot="${phase.key}" ${slot.completed ? 'checked' : ''}>
                <span>${slot.completed ? t('completed') : t('markCompleted')}</span>
              </label>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      ${dayPillsHtml}
      <div class="day-meta-banner">
        <h2>${day.dateLabel}: ${day.neighborhood}</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.3rem;">${day.weatherPlan}</p>
      </div>
      <div class="timeline-cards-container">
        ${slotsHtml}
      </div>
    `;

    // Attach listeners for Day Pills
    container.querySelectorAll('.day-pill-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeDayIndex = parseInt(btn.getAttribute('data-day-index'), 10);
        renderItinerary();
        renderTripHero();
      });
    });

    // Attach listeners for Completion Checkboxes
    container.querySelectorAll('.completion-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const slotKey = chk.getAttribute('data-slot');
        const isChecked = chk.checked;
        day[slotKey].completed = isChecked;
        showToast(isChecked ? 'Activity marked as completed!' : 'Activity marked as pending.');
        saveTripToSupabase(trip);
        renderItinerary();
      });
    });
  }

  function renderStays() {
    const container = document.getElementById('stays');
    if (!container) return;

    const trip = getCurrentTrip();
    let staysHtml = trip.stays.map(stay => `
      <div class="timeline-slot-card" style="margin-bottom: 1.5rem;">
        <div class="slot-content-column">
          <div class="slot-top-row">
            <h3 class="dual-name-title">${stay.name}</h3>
            <span class="slot-category-badge">${stay.type} • ⭐ ${stay.rating}</span>
          </div>
          <p style="color: var(--accent); font-weight: 600; font-size: 0.85rem; margin-bottom: 0.4rem;">${stay.fitBanner}</p>
          <p class="slot-description">${stay.description}</p>
          <div class="slot-flags-row">
            ${stay.features.map(f => `<span class="flag-chip access-chip">${f}</span>`).join('')}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1rem;">
            <span style="font-size: 1.2rem; font-weight: 800; color: var(--primary);">${formatMoney(stay.pricePerNight)} <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-secondary);">/ night</span></span>
            <a href="${stay.bookingUrl}" target="_blank" rel="noopener" class="btn btn-primary" style="text-decoration: none;">Book Directly</a>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="day-meta-banner">
        <h2>Recommended Accommodations</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.3rem;">Curated stays matching your group size, accessibility requirements, and location.</p>
      </div>
      ${staysHtml}
    `;
  }

  function renderBudget() {
    const container = document.getElementById('budget');
    if (!container) return;

    const trip = getCurrentTrip();
    const b = trip.budgetBreakdown;

    container.innerHTML = `
      <div class="day-meta-banner">
        <h2>Trip Budget & Cost Breakdown</h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.3rem;">Estimated expenses calculated for your total party size.</p>
      </div>

      <div class="hero-metrics-grid" style="margin-bottom: 2rem;">
        <div class="metric-card">
          <div class="metric-info">
            <span class="metric-label">Total Estimated Cost</span>
            <span class="metric-value" style="font-size: 1.3rem; color: var(--accent);">${formatMoney(b.totalTripCost)}</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-info">
            <span class="metric-label">Average Daily Spend</span>
            <span class="metric-value" style="font-size: 1.3rem; color: var(--primary);">${formatMoney(b.dailyAverage)}</span>
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-info">
            <span class="metric-label">Per Person Estimate</span>
            <span class="metric-value" style="font-size: 1.3rem; color: var(--accent-gold);">${formatMoney(b.perPersonTotal)}</span>
          </div>
        </div>
      </div>

      <div class="timeline-slot-card" style="flex-direction: column;">
        <h3 style="margin-bottom: 1rem;">Expense Category Distribution</h3>
        <div style="display: flex; flex-direction: column; gap: 0.75rem;">
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.2rem;">
              <span>Lodging (${b.lodgingPct}%)</span>
              <span>${formatMoney(b.lodgingTotal)}</span>
            </div>
            <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
              <div style="width: ${b.lodgingPct}%; height: 100%; background: var(--primary);"></div>
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.2rem;">
              <span>Dining & Food (${b.diningPct}%)</span>
              <span>${formatMoney(b.diningTotal)}</span>
            </div>
            <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
              <div style="width: ${b.diningPct}%; height: 100%; background: var(--accent);"></div>
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.2rem;">
              <span>Attractions & Entry Tickets (${b.ticketsPct}%)</span>
              <span>${formatMoney(b.ticketsTotal)}</span>
            </div>
            <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
              <div style="width: ${b.ticketsPct}%; height: 100%; background: var(--accent-gold);"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAllViews() {
    renderTripHero();
    renderItinerary();
    renderStays();
    renderBudget();
  }

  // ==========================================================================
  // 7. Event Listeners & Initialization
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    populateTripDropdown();
    renderAllViews();

    // Trip Dropdown Selector
    const tripSelect = document.getElementById('tripSelect');
    if (tripSelect) {
      tripSelect.addEventListener('change', (e) => {
        currentTripIndex = parseInt(e.target.value, 10);
        activeDayIndex = 0;
        renderAllViews();
        showToast('Trip switched successfully.');
      });
    }

    // Language Selector
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
      langSelect.value = currentLang;
      langSelect.addEventListener('change', (e) => {
        applyLanguage(e.target.value);
        showToast(`Language updated to ${e.target.value.toUpperCase()}`);
      });
    }

    // Currency Selector
    const currencySelect = document.getElementById('currencySelect');
    const badge = document.getElementById('currencySymbolBadge');
    if (currencySelect) {
      currencySelect.value = currentCurrency;
      if (badge && CURRENCIES[currentCurrency]) badge.textContent = CURRENCIES[currentCurrency].symbol;

      currencySelect.addEventListener('change', (e) => {
        currentCurrency = e.target.value;
        localStorage.setItem('tripcraft_currency', currentCurrency);
        if (badge && CURRENCIES[currentCurrency]) badge.textContent = CURRENCIES[currentCurrency].symbol;
        renderAllViews();
        showToast(`Currency changed to ${currentCurrency}`);
      });
    }

    // Theme Toggle
    const themeBtn = document.getElementById('themeToggleBtn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        showToast(`Switched to ${newTheme} mode.`);
      });
    }

    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content-panel').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const tabKey = btn.getAttribute('data-tab');
        const targetPanel = document.getElementById(tabKey);
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // Plan New Trip Form Handling
    const newTripForm = document.getElementById('newTripForm');
    if (newTripForm) {
      newTripForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const dest = document.getElementById('inputDestination').value.trim();
        const duration = parseInt(document.getElementById('inputDuration').value, 10) || 3;
        const adults = parseInt(document.getElementById('inputAdults').value, 10) || 2;
        const kids = parseInt(document.getElementById('inputChildren').value, 10) || 0;
        const tripType = document.getElementById('selectTripType').value;

        const newTripObj = {
          id: 'trip-' + Date.now(),
          destination: dest,
          country: dest.split(',')[1]?.trim() || dest,
          heroImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1600&q=80',
          title: `${dest} Expedition`,
          subtitle: `A personalized ${duration}-day ${tripType.toLowerCase()} voyage designed for your group.`,
          tripType: tripType,
          durationDays: duration,
          travelers: {
            total: adults + kids,
            adults: adults,
            children: kids,
            seniors: 0,
            summary: `${adults + kids} Travelers (${adults} Adults, ${kids} Kids)`
          },
          budgetTier: 'moderate',
          weather: { temp: '22°C', condition: 'Pleasant', notes: 'Optimized for local walking.' },
          stays: [
            {
              id: 'stay-new-1',
              name: `Central Boutique Hotel ${dest.split(',')[0]}`,
              type: 'Boutique Hotel',
              neighborhood: 'City Center',
              rating: '4.85',
              pricePerNight: 180,
              category: 'central',
              fitBanner: `✓ Accommodates ${adults + kids} Guests`,
              features: ['📍 Downtown Location', '🍳 Breakfast Included', '📶 High Speed Wi-Fi'],
              bookingUrl: '#',
              description: 'Comfortable stay with modern amenities located in the heart of the city.'
            }
          ],
          days: Array.from({ length: duration }, (_, i) => ({
            dayNumber: i + 1,
            dateLabel: `Day ${i + 1}`,
            neighborhood: `${dest.split(',')[0]} Central`,
            weatherPlan: '☀️ Pleasant conditions throughout the day',
            morning: {
              dualName: `${dest.split(',')[0]} Main Heritage Site`,
              category: 'Sightseeing',
              time: '09:00 - 11:30',
              desc: 'Explore landmark historical architecture and cultural monuments.',
              weatherBadge: '☀️ Morning Outdoor',
              accessibility: ['♿ Accessible Paths'],
              cost: 15,
              completed: false
            },
            lunch: {
              dualName: 'Local Specialty Restaurant',
              category: 'Dining',
              time: '12:00 - 13:30',
              desc: 'Taste authentic local culinary specialties and refreshing beverages.',
              weatherBadge: '❄️ Air-Conditioned',
              accessibility: ['👨‍👩‍👧 Family Friendly'],
              cost: 30,
              completed: false
            },
            afternoon: {
              dualName: 'City Gardens & Shopping District',
              category: 'Leisure',
              time: '14:00 - 17:00',
              desc: 'Stroll through picturesque urban parks and artisan markets.',
              weatherBadge: '🌳 Shaded Park',
              accessibility: ['👶 Stroller-Friendly'],
              cost: 10,
              completed: false
            },
            evening: {
              dualName: 'Sunset Point & Dinner',
              category: 'Nightlife',
              time: '18:00 - 20:30',
              desc: 'Enjoy panoramic evening skyline views paired with dinner.',
              weatherBadge: '🌆 Evening Breeze',
              accessibility: ['♿ Level Access'],
              cost: 45,
              completed: false
            }
          })),
          budgetBreakdown: {
            totalTripCost: duration * 250,
            dailyAverage: 250,
            perPersonTotal: (duration * 250) / (adults + kids),
            lodgingTotal: duration * 120,
            diningTotal: duration * 80,
            ticketsTotal: duration * 30,
            transitTotal: duration * 20,
            lodgingPct: 48,
            diningPct: 32,
            ticketsPct: 12,
            transitPct: 8
          }
        };

        PRESET_TRIPS.unshift(newTripObj);
        currentTripIndex = 0;
        activeDayIndex = 0;

        populateTripDropdown();
        renderAllViews();

        saveTripToSupabase(newTripObj);

        document.getElementById('newTripModal')?.classList.remove('active', 'show');
        newTripForm.reset();
        showToast('New trip generated successfully!');
      });
    }
  });

})();