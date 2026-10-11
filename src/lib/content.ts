import {
  Baby,
  ClipboardList,
  FileText,
  HeartPulse,
  House,
  MapPin,
  MessageSquareText,
  RefreshCw,
  Syringe,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type Feature = {
  slug: string;
  title: string;
  description: string;
  details: string;
  Icon: LucideIcon;
};

export const features: Feature[] = [
  {
    slug: "offline-patient-records",
    title: "Offline patient records",
    description: "Find a household profile and save a visit with no signal.",
    details:
      "Patient profiles are saved on the device first, then placed in an encrypted sync queue. Search works against the local database, so a field visit does not have to wait for a network connection.",
    Icon: ClipboardList,
  },
  {
    slug: "immunisation-tracker",
    title: "Immunisation tracker",
    description: "Keep vaccine histories and next-dose dates close at hand.",
    details:
      "A configurable childhood schedule helps a CHW see which doses were recorded, which are coming due, and which need follow-up. The sample schedule is a product demonstration and should be reviewed against current Ministry guidance before use.",
    Icon: Syringe,
  },
  {
    slug: "maternal-health-monitoring",
    title: "Maternal health monitoring",
    description: "Record ANC and postnatal follow-ups across a pregnancy.",
    details:
      "A clear timeline keeps antenatal and postnatal contacts together, with a place to note observations, referrals, and the next follow-up date. Clinical decisions remain with the responsible health professional.",
    Icon: HeartPulse,
  },
  {
    slug: "child-growth-charts",
    title: "Child growth charts",
    description: "Review a child’s growth trend on a phone-sized chart.",
    details:
      "Offline growth charts make recorded height and weight trends easier to review with caregivers. Charts are for continuity and discussion, not a substitute for approved clinical interpretation.",
    Icon: Baby,
  },
  {
    slug: "household-visit-logs",
    title: "Household visit logs",
    description: "Keep routine, follow-up, ANC, and postnatal visits together.",
    details:
      "Visit logs can include the contact type, clinical observations, interventions, optional coordinates, and referral details. Each entry stays on the device until a secure connection is available.",
    Icon: House,
  },
  {
    slug: "automatic-sync",
    title: "Automatic sync",
    description: "Queue field updates and send them when connectivity returns.",
    details:
      "The local queue tracks un-synced changes and retries after a connection returns. A worker can also request a manual sync and review a short local sync history.",
    Icon: RefreshCw,
  },
  {
    slug: "gps-location-tagging",
    title: "GPS visit location",
    description: "Add optional coordinates when a worker gives permission.",
    details:
      "Location capture is optional and permission-based. A worker can leave the coordinates blank or enter a location manually when GPS is unavailable or not appropriate.",
    Icon: MapPin,
  },
  {
    slug: "sms-follow-up-alerts",
    title: "SMS follow-up alerts",
    description: "Plan reminders for the next household contact.",
    details:
      "Follow-up reminders are designed to support a county-approved SMS provider. Messages are not sent from this demo until a messaging integration and consent workflow are configured.",
    Icon: MessageSquareText,
  },
  {
    slug: "county-dashboard",
    title: "County dashboard",
    description: "Give authorized county teams an aggregate view of activity.",
    details:
      "County views are intended for authorized accounts and aggregate reporting. Access to identifiable records is governed by the county’s role and data-sharing agreement.",
    Icon: UsersRound,
  },
  {
    slug: "moh-report-generator",
    title: "MOH report export",
    description: "Prepare an export for review before county submission.",
    details:
      "A downloadable report endpoint is provided for an approved deployment. County teams should validate formats, definitions, and DHIS2 workflows before relying on generated reports.",
    Icon: FileText,
  },
];

export type County = {
  slug: string;
  name: string;
  region: string;
  summary: string;
  priorities: string[];
};

export const counties: County[] = [
  {
    slug: "turkana",
    name: "Turkana",
    region: "North-western Kenya",
    summary:
      "Support household follow-ups across dispersed communities, even when a field team has no mobile signal.",
    priorities: ["Offline household visits", "Maternal and child health", "Delayed sync in remote areas"],
  },
  {
    slug: "kisii",
    name: "Kisii",
    region: "South-western Kenya",
    summary:
      "Keep local patient histories and community visits organised between villages and nearby facilities.",
    priorities: ["Patient continuity", "Immunisation follow-up", "Clinic and CHW coordination"],
  },
  {
    slug: "kajiado",
    name: "Kajiado",
    region: "Southern Kenya",
    summary:
      "Make records available to mobile teams serving communities spread across large rural areas.",
    priorities: ["Mobile field teams", "Optional visit locations", "Offline-first records"],
  },
  {
    slug: "kilifi",
    name: "Kilifi",
    region: "Coastal Kenya",
    summary:
      "Help CHWs keep maternal, child-health, and routine household follow-ups moving in the field.",
    priorities: ["Maternal health follow-up", "Child growth and immunisation", "Community reporting"],
  },
  {
    slug: "tana-river",
    name: "Tana River",
    region: "Coastal and north-eastern Kenya",
    summary:
      "Capture visits locally and review the sync queue when teams return to a connected location.",
    priorities: ["Low-connectivity workflows", "Local visit history", "County-level summaries"],
  },
];

export const countyLabel = (slug: string) =>
  counties.find((county) => county.slug === slug)?.name ?? "Kenya";
