import { MessageCircle } from "lucide-react";

const WHATSAPP_LINK = "https://wa.me/254112272061?text=Hello!%20I%20am%20interested%20in%20Raphael%20Community%20Health%20for%20my%20county%20or%20organisation.";

export function WhatsAppButton() {
  return (
    <a className="whatsapp-button" href={WHATSAPP_LINK} target="_blank" rel="noreferrer" aria-label="Ask about county partnership or CHW registration on WhatsApp">
      <MessageCircle />
      <span className="floating-tooltip" role="tooltip">Ask about county partnership or CHW registration</span>
    </a>
  );
}
