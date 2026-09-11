'use client'

import { useEffect } from 'react'
import 'vanilla-cookieconsent/dist/cookieconsent.css'
import * as CC from 'vanilla-cookieconsent'

type Props = { locale: string }

export function CookieConsent({ locale }: Props) {
  useEffect(() => {
    CC.run({
      // Reject must be as easy as accept — required by DSGVO
      guiOptions: {
        consentModal: {
          layout: 'box',
          position: 'bottom left',
          equalWeightButtons: true,
          flipButtons: false,
        },
      },
      categories: {
        necessary: {
          enabled: true,
          readOnly: true,
        },
      },
      language: {
        default: locale,
        rtl: locale === 'ar' ? 'ar' : undefined,
        translations: {
          de: {
            consentModal: {
              title: 'Datenschutzeinstellungen',
              description:
                'Diese Website verwendet notwendige Cookies für den Betrieb. Optionale Dienste werden erst nach Ihrer Zustimmung geladen. <a href="/de/datenschutz" class="cc__link">Mehr erfahren</a>',
              acceptAllBtn: 'Alle akzeptieren',
              acceptNecessaryBtn: 'Nur notwendige',
              showPreferencesBtn: 'Einstellungen verwalten',
            },
            preferencesModal: {
              title: 'Cookie-Einstellungen',
              acceptAllBtn: 'Alle akzeptieren',
              acceptNecessaryBtn: 'Nur notwendige',
              savePreferencesBtn: 'Einstellungen speichern',
              closeIconLabel: 'Schließen',
              sections: [
                {
                  title: 'Notwendige Cookies',
                  description:
                    'Diese Cookies sind für den Betrieb der Website erforderlich und können nicht deaktiviert werden.',
                  linkedCategory: 'necessary',
                },
              ],
            },
          },
          ar: {
            consentModal: {
              title: 'إعدادات الخصوصية',
              description:
                'يستخدم هذا الموقع ملفات تعريف الارتباط الضرورية. <a href="/ar/datenschutz" class="cc__link">اعرف المزيد</a>',
              acceptAllBtn: 'قبول الكل',
              acceptNecessaryBtn: 'الضرورية فقط',
              showPreferencesBtn: 'إدارة الإعدادات',
            },
            preferencesModal: {
              title: 'إعدادات ملفات تعريف الارتباط',
              acceptAllBtn: 'قبول الكل',
              acceptNecessaryBtn: 'الضرورية فقط',
              savePreferencesBtn: 'حفظ الإعدادات',
              closeIconLabel: 'إغلاق',
              sections: [
                {
                  title: 'ملفات تعريف الارتباط الضرورية',
                  description: 'مطلوبة تقنيًا لتشغيل الموقع. لا يمكن تعطيلها.',
                  linkedCategory: 'necessary',
                },
              ],
            },
          },
          en: {
            consentModal: {
              title: 'Privacy settings',
              description:
                'This website uses necessary cookies. Optional services are only loaded after your consent. <a href="/en/privacy-policy" class="cc__link">Learn more</a>',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Necessary only',
              showPreferencesBtn: 'Manage settings',
            },
            preferencesModal: {
              title: 'Cookie settings',
              acceptAllBtn: 'Accept all',
              acceptNecessaryBtn: 'Necessary only',
              savePreferencesBtn: 'Save preferences',
              closeIconLabel: 'Close',
              sections: [
                {
                  title: 'Necessary cookies',
                  description: 'Required for the website to function. Cannot be disabled.',
                  linkedCategory: 'necessary',
                },
              ],
            },
          },
        },
      },
    })
  }, [locale])

  return null
}
