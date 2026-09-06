import { useEffect, useState } from "react";

export const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" }
];

export const TRANSLATIONS = {
  en: {
    // Navigation
    nav_dashboard: "Dashboard",
    nav_my_plants: "My Plants",
    nav_reminders: "Reminders",
    nav_history: "History",
    nav_analytics: "Analytics",
    nav_settings: "Settings",
    nav_admin: "Admin Console",
    nav_users: "User Management",
    nav_admin_settings: "Admin Settings",

    // Common Buttons & Badges
    btn_water: "Water Plant",
    btn_watered: "Watered",
    btn_ai_doctor: "AI Doctor Scan",
    btn_full_review: "Full AI Review",
    btn_view_details: "View Details",
    btn_save: "Save Settings",
    btn_cancel: "Cancel",
    btn_edit: "Edit",
    btn_delete: "Delete",
    btn_signout: "Sign Out",
    btn_add_plant: "Add New Plant",

    // Status Badges
    status_healthy: "Healthy",
    status_water_soon: "Water Soon",
    status_overdue: "Overdue",
    status_safe: "Safe",
    status_mild: "Mild Concern",
    status_critical: "Critical Alert",

    // Settings Page
    settings_title: "Account & Care Settings",
    settings_subtitle: "Manage your profile, preferred language, notifications, and AI preferences.",
    language_section: "App Language & Region",
    language_select_label: "Select Preferred Language",
    language_help: "Changes text language across the application dashboard, alerts, and settings.",
    profile_section: "User Profile",
    preferences_section: "Watering & Climate Preferences",
    notifications_section: "Notification Preferences",
    ai_section: "AI Doctor Configuration",
    temp_unit_label: "Temperature Unit",
    location_label: "Default Plant Location",
    theme_label: "App Visual Theme",

    // Admin Settings Page
    admin_title: "System Administration Settings",
    admin_subtitle: "Configure global system thresholds, API failovers, system language, and security rules.",
    admin_system_lang: "Default Admin & System Language",
    admin_multi_key_pool: "Multi-Key Failover Status",
    admin_security: "Security & Admin Access"
  },
  ta: {
    // Navigation
    nav_dashboard: "முகப்பு",
    nav_my_plants: "என் தாவரங்கள்",
    nav_reminders: "நினைவூட்டல்கள்",
    nav_history: "வரலாறு",
    nav_analytics: "பகுப்பாய்வு",
    nav_settings: "அமைப்புகள்",
    nav_admin: "நிர்வாகி முனையம்",
    nav_users: "பயனர் மேலாண்மை",
    nav_admin_settings: "நிர்வாக அமைப்புகள்",

    // Common Buttons & Badges
    btn_water: "தண்ணீர் ஊற்று",
    btn_watered: "நீரூற்றப்பட்டது",
    btn_ai_doctor: "AI மருத்துவர் ஆய்வு",
    btn_full_review: "முழு AI ஆய்வு",
    btn_view_details: "விவரங்களைப் பார்",
    btn_save: "சேமிக்கவும்",
    btn_cancel: "ரத்து செய்",
    btn_edit: "திருத்து",
    btn_delete: "நீக்கு",
    btn_signout: "வெளியேறு",
    btn_add_plant: "புதிய தாவரம் சேர்",

    // Status Badges
    status_healthy: "ஆரோக்கியமானது",
    status_water_soon: "விரைவில் நீரூற்றவும்",
    status_overdue: "காலதாமதமானது",
    status_safe: "பாதுகாப்பானது",
    status_mild: "சிறிய கவனம் தேவை",
    status_critical: "அவசர கவனம்",

    // Settings Page
    settings_title: "கணக்கு & பராமரிப்பு அமைப்புகள்",
    settings_subtitle: "உங்கள் சுயவிவரம், மொழி, அறிவிப்புகள் மற்றும் AI விருப்பங்களை நிர்வகிக்கவும்.",
    language_section: "செயலி மொழி & மண்டலம்",
    language_select_label: "விருப்பமான மொழியைத் தேர்ந்தெடுக்கவும்",
    language_help: "செயலியின் டாஷ்போர்டு, விழிப்பூட்டல்கள் மற்றும் அமைப்புகளின் மொழியை மாற்றுகிறது.",
    profile_section: "பயனர் சுயவிவரம்",
    preferences_section: "நீர்ப்பாசனம் & தட்பவெப்ப விருப்பங்கள்",
    notifications_section: "அறிவிப்பு விருப்பங்கள்",
    ai_section: "AI மருத்துவர் அமைப்பு",
    temp_unit_label: "வெப்பநிலை அலகு",
    location_label: "இயல்புநிலை தாவர இருப்பிடம்",
    theme_label: "செயலி தீம்",

    // Admin Settings Page
    admin_title: "முறைமை நிர்வாக அமைப்புகள்",
    admin_subtitle: "உலகளாவிய முறைமை அமைப்புகள், API பாதுகாப்பு மற்றும் நிர்வாக மொழியை நிர்வகிக்கவும்.",
    admin_system_lang: "இயல்புநிலை நிர்வாக மொழி",
    admin_multi_key_pool: "மல்டி-கீ பாதுகாப்பு நிலை",
    admin_security: "பாதுகாப்பு & நிர்வாகி அணுகல்"
  },
  hi: {
    // Navigation
    nav_dashboard: "डैशबोर्ड",
    nav_my_plants: "मेरे पौधे",
    nav_reminders: "रिमाइंडर्स",
    nav_history: "इतिहास",
    nav_analytics: "विश्लेषण",
    nav_settings: "सेटिंग्स",
    nav_admin: "एडमिन कंसोल",
    nav_users: "उपयोगकर्ता प्रबंधन",
    nav_admin_settings: "एडमिन सेटिंग्स",

    // Common Buttons & Badges
    btn_water: "पानी दें",
    btn_watered: "पानी दिया गया",
    btn_ai_doctor: "AI डॉक्टर जांच",
    btn_full_review: "पूर्ण AI समीक्षा",
    btn_view_details: "विवरण देखें",
    btn_save: "सेव करें",
    btn_cancel: "रद्द करें",
    btn_edit: "संपादित करें",
    btn_delete: "हटाएं",
    btn_signout: "साइन आउट",
    btn_add_plant: "नया पौधा जोड़ें",

    // Status Badges
    status_healthy: "स्वस्थ",
    status_water_soon: "जल्द पानी दें",
    status_overdue: "अतिदेय (Overdue)",
    status_safe: "सुरक्षित",
    status_mild: "हल्की चिंता",
    status_critical: "गंभीर चेतावनी",

    // Settings Page
    settings_title: "अकाउंट एवं देखभाल सेटिंग्स",
    settings_subtitle: "अपनी प्रोफ़ाइल, भाषा, सूचनाएं और AI प्राथमिकताओं को प्रबंधित करें।",
    language_section: "ऐप भाषा और क्षेत्र",
    language_select_label: "पसंदीदा भाषा चुनें",
    language_help: "पूरे ऐप डैशबोर्ड, अलर्ट और सेटिंग्स की भाषा बदलता है।",
    profile_section: "उपयोगकर्ता प्रोफ़ाइल",
    preferences_section: "सिंचाई और जलवायु प्राथमिकताएं",
    notifications_section: "सूचना प्राथमिकताएं",
    ai_section: "AI डॉक्टर कॉन्फ़िगरेशन",
    temp_unit_label: "तापमान इकाई",
    location_label: "पौधे का डिफ़ॉल्ट स्थान",
    theme_label: "ऐप विजुअल थीम",

    // Admin Settings Page
    admin_title: "सिस्टम प्रशासन सेटिंग्स",
    admin_subtitle: "ग्लोबल सिस्टम थ्रेशोल्ड, API सुरक्षा और एडमिन भाषा कॉन्फ़िगर करें।",
    admin_system_lang: "डिफ़ॉल्ट एडमिन और सिस्टम भाषा",
    admin_multi_key_pool: "मल्टी-की सुरक्षा स्थिति",
    admin_security: "सुरक्षा एवं एडमिन एक्सेस"
  },
  kn: {
    // Navigation
    nav_dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    nav_my_plants: "ನನ್ನ ಸಸ್ಯಗಳು",
    nav_reminders: "ಜ್ಞಾಪನೆಗಳು",
    nav_history: "ಇತಿಹಾಸ",
    nav_analytics: "ವಿಶ್ಲೇಷಣೆ",
    nav_settings: "ಸಂಯೋಜನೆಗಳು (Settings)",
    nav_admin: "ಅಡ್ಮಿನ್ ಕನ್ಸೋಲ್",
    nav_users: "ಬಳಕೆದಾರ ನಿರ್ವಹಣೆ",
    nav_admin_settings: "ಅಡ್ಮಿನ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",

    // Common Buttons & Badges
    btn_water: "ನೀರು ಹಾಕಿ",
    btn_watered: "ನೀರು ಹಾಕಲಾಗಿದೆ",
    btn_ai_doctor: "AI ಡಾಕ್ಟರ್ ಸ್ಕ್ಯಾನ್",
    btn_full_review: "ಪೂರ್ಣ AI ವಿಮರ್ಶೆ",
    btn_view_details: "ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ",
    btn_save: "ಉಳಿಸಿ (Save)",
    btn_cancel: "ರದ್ದುಮಾಡಿ",
    btn_edit: "ಸಂಪಾದಿಸಿ",
    btn_delete: "ಅಳಿಸಿ",
    btn_signout: "ಸೈನ್ ಔಟ್",
    btn_add_plant: "ಹೊಸ ಸಸ್ಯ ಸೇರಿಸಿ",

    // Status Badges
    status_healthy: "ಆರೋಗ್ಯಕರ",
    status_water_soon: "ಶೀಘ್ರದಲ್ಲೇ ನೀರು ಹಾಕಿ",
    status_overdue: "ವಿಳಂಬವಾಗಿದೆ (Overdue)",
    status_safe: "ಸುರಕ್ಷಿತ",
    status_mild: "ಸಣ್ಣ ಎಚ್ಚರಿಕೆ",
    status_critical: "ತುರ್ತು ಎಚ್ಚರಿಕೆ",

    // Settings Page
    settings_title: "ಖಾತೆ ಮತ್ತು ಆರೈಕೆ ಸಂಯೋಜನೆಗಳು",
    settings_subtitle: "ನಿಮ್ಮ ಪ್ರೊಫೈಲ್, ಭಾಷೆ, ಸೂಚನೆಗಳು ಮತ್ತು AI ಸಂಯೋಜನೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ.",
    language_section: "ಆಪ್ ಭಾಷೆ ಮತ್ತು ಪ್ರಾದೇಶಿಕ",
    language_select_label: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    language_help: "ಆಪ್‌ನ ಮುಖಪುಟ, ಸೂಚನೆಗಳು ಮತ್ತು ಸೆಟ್ಟಿಂಗ್‌ಗಳ ಭಾಷೆಯನ್ನು ಬದಲಾಯಿಸುತ್ತದೆ.",
    profile_section: "ಬಳಕೆದಾರ ಪ್ರೊಫೈಲ್",
    preferences_section: "ನೀರುಣಿಸುವಿಕೆ ಮತ್ತು ವಾತಾವರಣದ ಆಯ್ಕೆಗಳು",
    notifications_section: "ಸೂಚನೆಗಳ ಆಯ್ಕೆಗಳು",
    ai_section: "AI ಡಾಕ್ಟರ್ ಸಂಯೋಜನೆ",
    temp_unit_label: "ತಾಪಮಾನದ ಮಾನದಂಡ",
    location_label: "ಸಸ್ಯದ ಮೂಲ ಸ್ಥಳ",
    theme_label: "ಆಪ್ ಥೀಮ್",

    // Admin Settings Page
    admin_title: "ಸಿಸ್ಟಮ್ ಆಡಳಿತ ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    admin_subtitle: "ಸಿಸ್ಟಮ್ ನಿಯಮಗಳು, API ಕೀ ಮತ್ತು ಆಡಳಿತ ಭಾಷೆಯನ್ನು ನಿರ್ವಹಿಸಿ.",
    admin_system_lang: "ಮೂಲ ಅಡ್ಮಿನ್ ಭಾಷೆ",
    admin_multi_key_pool: "ಮಲ್ಟಿ-ಕೀ ಭದ್ರತಾ ಸ್ಥಿತಿ",
    admin_security: "ಭದ್ರತೆ ಮತ್ತು ಅಡ್ಮಿನ್ ಪ್ರವೇಶ"
  },
  te: {
    // Navigation
    nav_dashboard: "డాష్‌బోర్డ్",
    nav_my_plants: "నా మొక్కలు",
    nav_reminders: "జ్ఞాపికలు (Reminders)",
    nav_history: "చరిత్ర (History)",
    nav_analytics: "విశ్లేషణ",
    nav_settings: "సెట్టింగ్‌లు",
    nav_admin: "అడ్మిన్ కాన్సోల్",
    nav_users: "యూజర్ నిర్వహణ",
    nav_admin_settings: "అడ్మిన్ సెట్టింగ్‌లు",

    // Common Buttons & Badges
    btn_water: "నీరు పోయండి",
    btn_watered: "నీరు పోసారు",
    btn_ai_doctor: "AI డాక్టర్ స్కాన్",
    btn_full_review: "పూర్తి AI సమీక్ష",
    btn_view_details: "వివరాలు చూడండి",
    btn_save: "సేవ్ చేయండి",
    btn_cancel: "రద్దు చేయండి",
    btn_edit: "సవరించు",
    btn_delete: "తొలగించు",
    btn_signout: "సైన్ అవుట్",
    btn_add_plant: "కొత్త మొక్కను జోడించండి",

    // Status Badges
    status_healthy: "ఆరోగ్యకరమైనది",
    status_water_soon: "త్వరలో నీరు పోయండి",
    status_overdue: "ఆలస్యమైంది (Overdue)",
    status_safe: "సురక్షితం",
    status_mild: "చిన్న హెచ్చరిక",
    status_critical: "అత్యవసర హెచ్చరిక",

    // Settings Page
    settings_title: "ఖాతా & సంరక్షణ సెట్టింగ్‌లు",
    settings_subtitle: "మీ ప్రొఫైల్, భాష, నోటిఫికేషన్‌లు మరియు AI ఎంపికలను నిర్పహించండి.",
    language_section: "యాప్ భాష & ప్రాంతం",
    language_select_label: "కావలసిన భాషను ఎంచుకోండి",
    language_help: "యాప్ డాష్‌బోర్డ్, అలర్ట్‌లు మరియు సెట్టింగ్‌ల భాషను మారుస్తుంది.",
    profile_section: "యూజర్ ప్రొఫైల్",
    preferences_section: "నీటిపారుదల & వాతావరణ ఎంపికలు",
    notifications_section: "నోటిఫికేషన్ ఎంపికలు",
    ai_section: "AI డాక్టర్ కాన్ఫిగరేషన్",
    temp_unit_label: "ఉష్ణోగ్రత కొలమానం",
    location_label: "మొక్క సాధారణ స్థానం",
    theme_label: "యాప్ థీమ్",

    // Admin Settings Page
    admin_title: "సిస్టమ్ అడ్మినిస్ట్రేషన్ సెట్టింగ్‌లు",
    admin_subtitle: "గ్లోబల్ సిస్టమ్ నియమాలు, API భద్రత మరియు అడ్మిన్ భాషను కాన్ఫిగర్ చేయండి.",
    admin_system_lang: "సాధారణ అడ్మిన్ భాష",
    admin_multi_key_pool: "మల్టీ-కీ భద్రతా స్థితి",
    admin_security: "భద్రత & అడ్మిన్ యాక్సెస్"
  },
  ml: {
    // Navigation
    nav_dashboard: "ഡാഷ്‌ബോർഡ്",
    nav_my_plants: "എന്റെ ചെടികൾ",
    nav_reminders: "ഓർമ്മപ്പെടുത്തലുകൾ",
    nav_history: "ചരിത്രം",
    nav_analytics: "വിശകലനം",
    nav_settings: "ക്രമീകരണങ്ങൾ (Settings)",
    nav_admin: "അഡ്മിൻ കൺസോൾ",
    nav_users: "ഉപയോക്തൃ മാനേജ്മെന്റ്",
    nav_admin_settings: "അഡ്മിൻ ക്രമീകരണങ്ങൾ",

    // Common Buttons & Badges
    btn_water: "വെള്ളമൊഴിക്കുക",
    btn_watered: "വെള്ളമൊഴിച്ചു",
    btn_ai_doctor: "AI ഡോക്ടർ പരിശോധന",
    btn_full_review: "പൂർണ്ണ AI പരിശോധന",
    btn_view_details: "വിവരങ്ങൾ കാണുക",
    btn_save: "സേവ് ചെയ്യുക",
    btn_cancel: "റദ്ദാക്കുക",
    btn_edit: "തിരുത്തുക",
    btn_delete: "ഒഴിവാക്കുക",
    btn_signout: "സൈൻ ഔട്ട്",
    btn_add_plant: "പുതിയ ചെടി ചേർക്കുക",

    // Status Badges
    status_healthy: "ആരോഗ്യമുള്ളത്",
    status_water_soon: "ഉടൻ വെള്ളമൊഴിക്കുക",
    status_overdue: "വൈകിയത് (Overdue)",
    status_safe: "സുരക്ഷിതം",
    status_mild: "ചെറിയ ശ്രദ്ധ വേണം",
    status_critical: "അടിയന്തര മുന്നറിയിപ്പ്",

    // Settings Page
    settings_title: "അക്കൗണ്ട് & പരിചരണ ക്രമീകരണങ്ങൾ",
    settings_subtitle: "നിങ്ങളുടെ പ്രൊഫൈൽ, ഭാഷ, അറിയിപ്പുകൾ, AI ക്രമീകരണങ്ങൾ എന്നിവ നിയന്ത്രിക്കുക.",
    language_section: "ആപ്പ് ഭാഷയും പ്രാദേശിക ക്രമീകരണവും",
    language_select_label: "ആവശ്യമുള്ള ഭാഷ തിരഞ്ഞെടുക്കുക",
    language_help: "ആപ്പിന്റെ ഡാഷ്‌ബോർഡ്, മുന്നറിയിപ്പുകൾ, സെറ്റിംഗ്സ് എന്നിവയുടെ ഭാഷ മാറ്റുന്നു.",
    profile_section: "ഉപയോക്തൃ പ്രൊഫൈൽ",
    preferences_section: "നനയ്ക്കൽ & കാലാവസ്ഥാ മുൻഗണനകൾ",
    notifications_section: "അറിയിപ്പ് മുൻഗണനകൾ",
    ai_section: "AI ഡോക്ടർ ക്രമീകരണം",
    temp_unit_label: "താപനില അളവ്",
    location_label: "ചെടിയുടെ സാധാരണ സ്ഥലം",
    theme_label: "ആപ്പ് തീം",

    // Admin Settings Page
    admin_title: "സിസ്റ്റം അഡ്മിനിസ്ട്രേഷൻ ക്രമീകരണങ്ങൾ",
    admin_subtitle: "ഗ്ലോബൽ സിസ്റ്റം ക്രമീകരണങ്ങൾ, API സുരക്ഷ, അഡ്മിൻ ഭാഷ എന്നിവ നിർണ്ണയിക്കുക.",
    admin_system_lang: "സാധാരണ അഡ്മിൻ ഭാഷ",
    admin_multi_key_pool: "മൾട്ടി-കീ സുരക്ഷാ നില",
    admin_security: "സുരക്ഷയും അഡ്മിൻ ആക്സസ്സും"
  }
};

const LANG_STORAGE_KEY = "plantCareLanguage";

export const getStoredLanguage = () => {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(LANG_STORAGE_KEY) || "en";
};

export const setStoredLanguage = (langCode) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANG_STORAGE_KEY, langCode);
  window.dispatchEvent(new CustomEvent("plantCareLanguageChanged", { detail: langCode }));
};

export const t = (key, customLang = null) => {
  const lang = customLang || getStoredLanguage();
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return dict[key] || TRANSLATIONS.en[key] || key;
};

export const useTranslation = () => {
  const [lang, setLang] = useState(getStoredLanguage());

  useEffect(() => {
    const handleLangChange = (e) => {
      setLang(e.detail || getStoredLanguage());
    };
    window.addEventListener("plantCareLanguageChanged", handleLangChange);
    return () => window.removeEventListener("plantCareLanguageChanged", handleLangChange);
  }, []);

  const changeLanguage = (newLang) => {
    setStoredLanguage(newLang);
    setLang(newLang);
  };

  const translate = (key) => t(key, lang);

  return {
    language: lang,
    setLanguage: changeLanguage,
    t: translate,
    languages: LANGUAGES
  };
};
