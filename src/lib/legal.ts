export type LegalPage = {
  title: string;
  description: string;
  updated: string;
  sections: { id: string; title: string; paragraphs: string[]; bullets?: string[] }[];
};

export const legalPages: Record<string, LegalPage> = {
  "privacy-policy": {
    title: "Privacy Policy",
    description: "How Raphael Community Health handles CHW account details and sensitive patient health information.",
    updated: "11 October 2026",
    sections: [
      {
        id: "patient-health-data",
        title: "Patient Health Data Protections",
        paragraphs: [
          "Patient health information is sensitive personal data under the Kenya Data Protection Act, 2019. A county health department, clinic, or other authorised health provider must determine the lawful purpose, access roles, retention period, and data-sharing instructions before a live deployment.",
          "The demo workspace uses fictional sample records. Do not enter real patient details into a demo, shared, or unapproved device. A production deployment needs an approved data-processing agreement, a retention plan, access controls, security review, and staff training.",
          "The platform is designed to limit patient data to the CHW’s local workspace and the authorised county service configured for that account. Patient data is not used for advertising, public analytics, or third-party profiling.",
        ],
        bullets: ["Collect only the information needed for an approved care workflow.", "Keep devices locked and use an app PIN on shared field devices.", "Report a lost device or suspected disclosure to the relevant county data protection contact."],
      },
      {
        id: "offline-storage",
        title: "Offline Storage Explained",
        paragraphs: [
          "Patient records, visit logs, immunisation records, and pending requests are stored in IndexedDB so a CHW can continue working without a network. Health record payloads are encrypted in the browser with AES-GCM before they are written to IndexedDB. The encryption key is stored as a non-exportable browser CryptoKey on the same device.",
          "This browser-side protection is not a replacement for device encryption, a secure screen lock, a short session timeout, or protection against malware and malicious browser extensions. Anyone with control of an unlocked device or the same browser profile may be able to access local records. Do not use a public or shared device for identifiable health data.",
        ],
      },
      {
        id: "data-sync",
        title: "Data Sync Policy",
        paragraphs: [
          "Changes are saved locally first. When internet access returns, the app can submit the encrypted local queue over HTTPS to the configured, authenticated county service. A record stays pending until the server confirms it. A CHW can review the pending count and recent sync status in the app.",
          "The demo does not connect to a live county database unless the deployment is configured with a secure server, an authorised CHW account, and the required service credentials. An offline record is not a substitute for urgent escalation or a facility handover.",
        ],
      },
      {
        id: "county-sharing",
        title: "County Health Department Data Sharing",
        paragraphs: [
          "A county health department receives information only through the account, role, and workspace that the county has authorised. County dashboard access and report exports must be covered by a documented purpose, least-privilege permissions, and an appropriate data-sharing or processing agreement.",
          "The sample county pages and sample patient records do not represent real county datasets. Aggregate dashboards should not expose identifiable records unless a lawful care purpose and role explicitly permit that access.",
        ],
      },
      {
        id: "moh-nhif",
        title: "NHIF and MOH Compliance Note",
        paragraphs: [
          "Raphael Community Health is not represented as certified by the Ministry of Health, NHIF, or any county. Report exports and possible DHIS2 hand-off workflows require validation with the relevant county and Ministry teams before operational use. No live DHIS2 or NHIF connection is enabled by this demo.",
        ],
      },
      {
        id: "rights",
        title: "Your Rights and Patient Rights",
        paragraphs: [
          "The data controller for a specific deployment must explain how a person can exercise access, correction, objection, deletion, or other rights under applicable Kenyan law. A CHW should direct a patient to the responsible county or health provider and should not make a legal determination on the patient’s behalf.",
          "CHWs can export their locally stored records from the Settings tab. Export files contain sensitive data and must be kept secure, shared only with an authorised recipient, and deleted from downloads when no longer needed.",
        ],
      },
      {
        id: "contact",
        title: "Contact",
        paragraphs: [
          "For a privacy question or county data request, contact the deployment administrator or the county data protection contact responsible for your workspace. For a partnership discussion, use the enquiry form on the home page or the official WhatsApp link in the footer.",
        ],
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    description: "Terms for community health workers, clinics, and county teams using Raphael Community Health.",
    updated: "11 October 2026",
    sections: [
      {
        id: "chw-usage",
        title: "CHW Usage Terms",
        paragraphs: [
          "Use the platform only for approved community health work, follow your county or employer’s instructions, and enter accurate information within your role. Keep your PIN and device private, confirm a patient’s identity using approved local practice, and report problems through the agreed support channel.",
          "The platform is an administrative record tool. It does not diagnose, prescribe, replace approved clinical guidance, or provide emergency response. Follow your facility’s clinical protocols and refer urgent cases through the established pathway.",
        ],
      },
      {
        id: "data-ownership",
        title: "Data Ownership by County",
        paragraphs: [
          "Patient and visit records belong to, or are controlled by, the responsible county health department or authorised care provider under the applicable law and written agreement. Raphael Community Health does not claim ownership of patient records. The data controller decides who may access, retain, correct, or export records.",
        ],
      },
      {
        id: "offline-liability",
        title: "Offline Data Liability",
        paragraphs: [
          "Offline changes remain on the device until a successful secure sync is confirmed. A user is responsible for keeping the device charged, locked, and under their control, and for checking the sync status before relying on an update elsewhere. A delayed sync can mean a county colleague has not yet received a field update.",
          "Do not rely on the app as the sole record for a time-critical referral, emergency handover, or statutory reporting deadline. Use the county’s required backup and escalation process. The local export feature creates a sensitive file that must be handled securely.",
        ],
      },
      {
        id: "governing-law",
        title: "Governing Law in Kenya",
        paragraphs: [
          "These demo terms are intended for review and must be replaced or supplemented by the signed deployment and county agreements before live use. Kenyan law applies to the extent provided by the final agreement, including the Data Protection Act, 2019 and other applicable health and consumer laws.",
        ],
      },
    ],
  },
  "cookie-policy": {
    title: "Cookie Policy",
    description: "A plain-language guide to cookies, local storage, and IndexedDB in the offline-first health app.",
    updated: "11 October 2026",
    sections: [
      {
        id: "what-we-store",
        title: "What is stored on this device",
        paragraphs: [
          "The site uses local browser storage to remember cookie choices and display preferences. The offline app uses IndexedDB to keep a local health workspace, queue changes, and record the last sync events. Patient payloads are encrypted before being written to the health record stores.",
          "Necessary storage stays on so offline screens and saved records continue to work. Functional storage remembers app settings. Analytics is optional and is not enabled in this demo.",
        ],
      },
      {
        id: "indexeddb",
        title: "IndexedDB and offline records",
        paragraphs: [
          "IndexedDB is browser storage, not a cookie and not a remote database. It allows a CHW to search patient records while offline. Data remains in that browser profile until a user deletes it, clears site data, or exports and removes it. Local records may be lost if the device or browser profile is reset, so follow the approved county backup and sync process.",
          "Health records are sensitive personal data. Use a locked, managed device, do not share a browser profile, and never add patient details to analytics or marketing forms.",
        ],
      },
      {
        id: "categories",
        title: "Cookie categories",
        paragraphs: ["The preference panel offers the following choices:"],
        bullets: [
          "Necessary: always on for session safety, offline storage, and core app functions.",
          "Functional: optional local preferences such as saved display choices.",
          "Analytics: optional measurement. It is not enabled in this demo.",
        ],
      },
      {
        id: "external-services",
        title: "External services and reCAPTCHA",
        paragraphs: [
          "Online registration, county enquiries, contact forms, and newsletter submissions can use Google reCAPTCHA to reduce abuse. reCAPTCHA may process technical information such as browser, device, and interaction signals under Google’s terms. CAPTCHA is not used to stop offline patient visits. A v2 challenge may appear if the invisible v3 risk score is below the configured threshold.",
          "No patient health record is intentionally sent to reCAPTCHA. Do not paste health information into a public enquiry or newsletter form.",
        ],
      },
      {
        id: "changes",
        title: "Managing your choices",
        paragraphs: [
          "You can update your optional preferences through the cookie preference panel. Clearing browser storage will remove the saved consent choice and can also remove locally stored offline records. Export and sync important data before clearing site data.",
        ],
      },
    ],
  },
};
