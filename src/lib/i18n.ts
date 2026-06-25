import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "products": "Products",
        "orders": "My Orders"
      },
      "order": {
        "status": "Order Status",
        "total": "Total Amount",
        "details": "Order Details",
        "assignment": "Staff Assignment"
      }
    }
  },
  hi: {
    translation: {
      "nav": {
        "home": "होम",
        "products": "उत्पाद",
        "orders": "मेरे आदेश"
      },
      "order": {
        "status": "आदेश की स्थिति",
        "total": "कुल राशि",
        "details": "आदेश विवरण",
        "assignment": "स्टाफ असाइनमेंट"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
