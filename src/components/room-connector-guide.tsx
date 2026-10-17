import { ExternalLink, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GOOGLE_ROOM_SCOPES } from "@/lib/room-connectors";

const GOOGLE_STEPS = [
  { title: "Create a service account", text: "In Google Cloud Console, choose your company project. Under IAM & Admin → Service Accounts, create a dedicated account for room signage. Enable domain-wide delegation in its advanced settings and note its numeric OAuth client ID.", url: "https://console.cloud.google.com/iam-admin/serviceaccounts", link: "Open Google Cloud" },
  { title: "Enable the two APIs", text: "Under APIs & Services → Library, enable Google Calendar API and Admin SDK API. Calendar reads use the first; discovering company room resources uses the second.", url: "https://console.cloud.google.com/apis/library", link: "Open API library" },
  { title: "Authorise domain-wide delegation", text: "A Workspace super administrator opens Security → Access and data control → API controls → Manage Domain Wide Delegation → Add new. Enter the service account's numeric client ID and both scopes below. Allow time for the change to propagate.", url: "https://admin.google.com", link: "Open Workspace Admin" },
  { title: "Choose readers & share room calendars", text: "Use a dedicated Workspace user as the calendar reader. Share every intended room calendar with that user with ‘See all event details’. Availability-only sharing cannot show meeting details. Room discovery also needs a Workspace account with permission to read Directory room resources; enter it separately if your reader does not have that permission.", url: "https://calendar.google.com", link: "Open Google Calendar" },
  { title: "Download the JSON key", text: "In the service account's Keys tab, choose Add key → Create new key → JSON. Upload that file here. Never paste or email its contents. If your organisation blocks service-account keys, ask your administrator for an approved alternative before proceeding.", url: "https://developers.google.com/identity/protocols/oauth2/service-account", link: "Read Google's guide" },
];
const MICROSOFT_STEPS = [
  { title: "Register an application", text: "In Microsoft Entra admin center (formerly Azure AD), open App registrations → New registration. Choose accounts in this organisational directory only. No redirect URL is required for app-to-app access. Copy the Directory (tenant) ID and Application (client) ID.", url: "https://entra.microsoft.com", link: "Open Microsoft Entra" },
  { title: "Grant directory read access", text: "Open API permissions → Add a permission → Microsoft Graph → Application permissions. Add Place.Read.All and grant administrator consent for your organisation. Use application permissions, not delegated permissions.", url: "https://learn.microsoft.com/en-us/graph/api/place-list?view=graph-rest-1.0", link: "Read room permissions" },
  { title: "Limit calendar reads to room mailboxes", text: "Ask your Exchange administrator to configure RBAC for Applications: register the application's service principal, define a resource scope containing only your room mailboxes, and assign Application Calendars.Read to that scope. Unscoped Entra Calendars.Read grants are additive and can allow all mailbox calendars: do not leave a broad grant in place. Test an allowed room and a mailbox outside the scope.", url: "https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac", link: "Read Exchange setup" },
  { title: "Create the client secret", text: "Under Certificates & secrets → Client secrets → New client secret, choose an expiry that matches your company's policy. Copy the secret VALUE, not its ID. Enter it here before leaving the page; Microsoft only shows it once. Rotate it before it expires.", url: "https://learn.microsoft.com/en-us/entra/identity-platform/howto-create-service-principal-portal", link: "Read app setup" },
  { title: "Check room resources", text: "Your rooms must exist as Exchange Online room mailboxes and be visible through Microsoft Places. Use a permitted room mailbox address as the verification email. Discovery finds rooms; saving your selection separately checks calendar-read access for every selected room.", url: "https://learn.microsoft.com/en-us/graph/api/resources/places-api-overview?view=graph-rest-1.0", link: "Read Microsoft Places" },
];

export function RoomConnectorGuide({ provider }: { provider: "google" | "microsoft" }) {
  const steps = provider === "google" ? GOOGLE_STEPS : MICROSOFT_STEPS;
  return <section aria-label={`${provider === "google" ? "Google Workspace" : "Microsoft 365"} setup guide`} className="min-w-0">
    <div className="mb-6 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Prepare your workspace</h2><span className="label-caps">ADMIN SETUP</span></div>
    <ol className="space-y-6">{steps.map((step, index) => <li key={step.title} className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-card font-mono text-xs text-accent">{String(index + 1).padStart(2, "0")}</span>
      <div className="min-w-0"><h3 className="text-sm font-semibold">{step.title}</h3><p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.text}</p>
        {provider === "google" && index === 2 && <div className="mt-3 space-y-2 border-l-2 border-accent pl-3">{GOOGLE_ROOM_SCOPES.map(scope => <code key={scope} className="block break-all text-[11px] leading-relaxed">{scope}</code>)}</div>}
        <Button asChild variant="link" size="sm" className="mt-1 h-7 px-0 text-accent"><a href={step.url} target="_blank" rel="noreferrer">{step.link}<ExternalLink className="size-3" /></a></Button>
      </div>
    </li>)}</ol>
    <div className="mt-7 flex gap-3 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="size-4 shrink-0 text-accent" /><p>Read-only access. No meetings are created or changed. Provider verification does not yet connect these rooms to the demo layout viewer.</p></div>
  </section>;
}