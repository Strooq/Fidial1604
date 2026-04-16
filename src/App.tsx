import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeEuro,
  BookOpen,
  ChevronUp,
  ClipboardList,
  FileText,
  Handshake,
  Landmark,
  Laptop2,
  Rocket,
  Settings2,
  ShieldCheck,
  Users,
} from "lucide-react";

type RequestType =
  | "Administratie & boekhouding"
  | "Salaris- & personeelsadministratie"
  | "Belastingaangiften"
  | "Jaarrekening & rapportages"
  | "Fiscale ondersteuning & belastingzaken"
  | "Startersbegeleiding";

type ContactIntent = "Aanvraag indienen" | "Online meeting plannen";
type PolicyKey = "voorwaarden" | "cookies" | "disclaimer" | "privacy";
type SubmitState = "idle" | "submitting" | "success" | "error";

type Service = {
  title: RequestType;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  color: string;
};

type PolicyContent = {
  title: string;
  intro: string;
  text: string[];
};

type IntakeModalProps = {
  isOpen: boolean;
  title: string;
  intro: string;
  accent: "emerald" | "cyan";
  simplified?: boolean;
  requestType: RequestType;
  setRequestType: (value: RequestType) => void;
  contactIntent: ContactIntent;
  setContactIntent: (value: ContactIntent) => void;
  submitLabel: string;
  formData: Record<string, string>;
  setFormValue: (key: string, value: string) => void;
  onScheduleMeetingHref: string;
  onSubmitRequest: () => Promise<void>;
  submitState: SubmitState;
  onClose: () => void;
};

const services: Service[] = [
  {
    title: "Administratie & boekhouding",
    description: "Van dagelijkse boekhouding tot rapportages, digitaal en overzichtelijk ingericht.",
    icon: BookOpen,
    color: "bg-cyan-400/12 text-cyan-200 ring-cyan-300/20",
  },
  {
    title: "Salaris- & personeelsadministratie",
    description: "Loonstroken, loonheffingen en personeelsadministratie onder één dak.",
    icon: Users,
    color: "bg-violet-400/12 text-violet-200 ring-violet-300/20",
  },
  {
    title: "Jaarrekening & rapportages",
    description: "Heldere jaarstukken en tussentijdse rapportages voor grip en inzicht.",
    icon: FileText,
    color: "bg-emerald-400/12 text-emerald-200 ring-emerald-300/20",
  },
  {
    title: "Belastingaangiften",
    description: "Ondersteuning bij omzetbelasting, inkomstenbelasting en andere aangiften.",
    icon: BadgeEuro,
    color: "bg-amber-400/12 text-amber-200 ring-amber-300/20",
  },
  {
    title: "Startersbegeleiding",
    description: "Een praktische start met structuur, administratie en de juiste basis.",
    icon: Rocket,
    color: "bg-fuchsia-400/12 text-fuchsia-200 ring-fuchsia-300/20",
  },
  {
    title: "Fiscale ondersteuning & belastingzaken",
    description: "Praktische hulp bij fiscale vragen, belastingzaken en correspondentie.",
    icon: Landmark,
    color: "bg-sky-400/12 text-sky-200 ring-sky-300/20",
  },
];

const requestTypeOptions: RequestType[] = services.map((service) => service.title);

const process = [
  {
    step: "01",
    title: "Kennismaken",
    text: "We bespreken uw situatie en wensen in een helder eerste gesprek.",
    icon: Handshake,
    color: "bg-cyan-400/12 text-cyan-200 ring-cyan-300/20",
  },
  {
    step: "02",
    title: "Inventariseren",
    text: "We brengen in kaart wat nodig is en hoe uw huidige proces eruitziet.",
    icon: ClipboardList,
    color: "bg-violet-400/12 text-violet-200 ring-violet-300/20",
  },
  {
    step: "03",
    title: "Inrichten",
    text: "We richten een duidelijke samenwerking en digitale werkwijze in.",
    icon: Settings2,
    color: "bg-emerald-400/12 text-emerald-200 ring-emerald-300/20",
  },
  {
    step: "04",
    title: "Ontzorgen",
    text: "Daarna zorgen we voor continu overzicht en een vast aanspreekpunt.",
    icon: ShieldCheck,
    color: "bg-amber-400/12 text-amber-200 ring-amber-300/20",
  },
] as const;

const fieldClass =
  "w-full rounded-[20px] border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition hover:border-white/20 focus:border-emerald-300/50";
const modalFieldClass =
  "w-full rounded-[18px] border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 transition hover:border-white/20 focus:border-emerald-300/50";
const cardClass =
  "h-full min-h-[250px] rounded-[28px] border border-white/10 bg-white/5 p-6 text-left shadow-xl shadow-slate-950/20 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.09]";

const CALENDLY_URL = "https://calendly.com/hello-fidial/30min";

const policyContent: Record<PolicyKey, PolicyContent> = {
  voorwaarden: {
    title: "Algemene voorwaarden",
    intro: "Hieronder vindt u de algemene voorwaarden die op onze dienstverlening van toepassing zijn.",
    text: [
      "Algemene voorwaarden van Fidial",
      "Deze voorwaarden zijn van toepassing op iedere aanbieding, offerte en overeenkomst tussen Fidial en opdrachtgever, tenzij schriftelijk anders is overeengekomen.",
      "Fidial voert opdrachten naar beste inzicht en vermogen uit en mag daarbij, indien nodig, derden inschakelen.",
      "Facturen dienen binnen 14 dagen te worden voldaan, tenzij schriftelijk anders is overeengekomen.",
      "Op alle rechtsverhoudingen tussen Fidial en opdrachtgever is Nederlands recht van toepassing.",
    ],
  },
  cookies: {
    title: "Cookieverklaring",
    intro: "Op deze pagina leest u de volledige cookieverklaring van Fidial.",
    text: [
      "Cookieverklaring Fidial",
      "www.fidial.nl maakt gebruik van cookies. Een cookie is een klein bestand dat door uw browser wordt opgeslagen op uw apparaat.",
      "Voor het gebruik van bepaalde cookies is uw toestemming vereist.",
      "Wij kunnen functionele, analytische en marketingcookies gebruiken voor een goed werkende website en om onze dienstverlening te verbeteren.",
      "U kunt cookies blokkeren en verwijderen via de instellingen van uw browser.",
      "Heeft u vragen over cookies, neem dan contact op via cs@fidial.nl of privacy@fidial.nl.",
    ],
  },
  disclaimer: {
    title: "Disclaimer",
    intro: "Op het gebruik van deze website zijn onderstaande gebruiksvoorwaarden van toepassing.",
    text: [
      "Disclaimer",
      "Fidial streeft ernaar om op deze website juiste en actuele informatie te plaatsen, maar kan niet garanderen dat alle informatie steeds volledig, juist of actueel is.",
      "Aan de inhoud van deze website kunnen geen rechten worden ontleend.",
      "Fidial is niet aansprakelijk voor schade die voortvloeit uit het gebruik van deze website of de onmogelijkheid om de website te gebruiken.",
      "Deze website kan links bevatten naar websites van derden. Fidial is niet verantwoordelijk voor de inhoud of beschikbaarheid daarvan.",
    ],
  },
  privacy: {
    title: "Privacybeleid",
    intro: "Op deze pagina leest u hoe Fidial omgaat met persoonsgegevens en privacy.",
    text: [
      "Privacybeleid Fidial",
      "Fidial respecteert uw privacy en verwerkt persoonsgegevens in overeenstemming met de AVG en overige toepasselijke privacywetgeving.",
      "Bedrijfsnaam: Fidial",
      "Adres: Louise Marie Loeberplantsoen 4, 1062 DD Amsterdam",
      "E-mailadres: cs@fidial.nl",
      "Privacycontact: privacy@fidial.nl",
      "Telefoonnummer: 020 - 233 86 39",
      "KvK-nummer: 86233947",
      "Persoonsgegevens worden uitsluitend verwerkt voor gerechtvaardigde doeleinden, zoals dienstverlening, communicatie, administratie, fiscale verplichtingen en beveiliging.",
      "Voor vragen over privacy of de verwerking van persoonsgegevens kunt u contact opnemen via privacy@fidial.nl.",
    ],
  },
};

function RequestFields({ requestType }: { requestType: RequestType }) {
  const fields: Record<RequestType, string[]> = {
    "Administratie & boekhouding": [
      "Huidige accountant / administratiekantoor",
      "Aantal administraties / entiteiten",
      "Frequentie verwerking",
      "BTW-aangifte frequentie",
    ],
    "Salaris- & personeelsadministratie": [
      "Aantal medewerkers",
      "Aantal loonruns per maand",
      "CAO van toepassing?",
      "Huidig salarispakket / software",
    ],
    "Belastingaangiften": ["Soort aangifte", "Betreft jaar / tijdvak", "Spoedniveau", "Huidige accountant / adviseur"],
    "Jaarrekening & rapportages": [
      "Boekjaar",
      "Aantal BV's / entiteiten",
      "Alleen jaarrekening of ook aangiften?",
      "Huidige accountant / kantoor",
    ],
    "Fiscale ondersteuning & belastingzaken": ["Onderwerp", "Huidige adviseur / accountant"],
    "Startersbegeleiding": ["Fase onderneming", "Rechtsvorm"],
  };

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      {fields[requestType].map((field) => (
        <input key={field} className={modalFieldClass} placeholder={field} />
      ))}
    </div>
  );
}

function ContactChooser({
  value,
  onChange,
  className,
}: {
  value: ContactIntent;
  onChange: (value: ContactIntent) => void;
  className: string;
}) {
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value as ContactIntent)}>
      <option>Aanvraag indienen</option>
      <option>Online meeting plannen</option>
    </select>
  );
}

function IntakeModal({
  isOpen,
  title,
  intro,
  accent,
  simplified,
  requestType,
  setRequestType,
  contactIntent,
  setContactIntent,
  submitLabel,
  formData,
  setFormValue,
  onScheduleMeetingHref,
  onSubmitRequest,
  submitState,
  onClose,
}: IntakeModalProps) {
  if (!isOpen) return null;

  const accentText = accent === "emerald" ? "text-emerald-300" : "text-cyan-300";
  const accentButton = accent === "emerald" ? "bg-emerald-400" : "bg-cyan-400";

  const primaryPlaceholder =
    simplified && contactIntent === "Online meeting plannen"
      ? "Voorkeursdag of datum"
      : simplified
        ? "Huidige accountant / kantoor"
        : "Gewenste ingangsdatum";

  const secondaryPlaceholder =
    simplified && contactIntent === "Online meeting plannen" ? "Voorkeur moment" : "Huidig softwarepakket";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative my-6 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-white/10 bg-slate-950/95 px-6 py-5 backdrop-blur">
          <div>
            <div className={`text-xs uppercase tracking-[0.22em] ${accentText}`}>
              {simplified ? "Direct aanmelden" : "Meer informatie"}
            </div>
            <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">{intro}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
            Sluiten
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6 [scrollbar-width:thin]">
          {!simplified && (
            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              {(["Aanvraag indienen", "Online meeting plannen"] as ContactIntent[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setContactIntent(option)}
                  className={`rounded-[18px] border px-4 py-4 text-left ${
                    contactIntent === option
                      ? "border-emerald-300/50 bg-emerald-400/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-300"
                  }`}
                >
                  <div className="font-medium">{option}</div>
                </button>
              ))}
            </div>
          )}

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{simplified ? "Aanmelding" : "Contactpersoon"}</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {["Voornaam", "Achternaam", "E-mailadres", "Telefoonnummer", "Bedrijfsnaam", "Functie"].map((field) => (
                <input
                  key={field}
                  className={modalFieldClass}
                  placeholder={field}
                  value={formData[field] ?? ""}
                  onChange={(e) => setFormValue(field, e.target.value)}
                />
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{simplified ? "Starttype" : "Aanvraag"}</div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <select className={modalFieldClass} value={requestType} onChange={(e) => setRequestType(e.target.value as RequestType)}>
                {requestTypeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              <ContactChooser value={contactIntent} onChange={setContactIntent} className={modalFieldClass} />
              <input
                className={modalFieldClass}
                placeholder={primaryPlaceholder}
                value={formData[primaryPlaceholder] ?? ""}
                onChange={(e) => setFormValue(primaryPlaceholder, e.target.value)}
              />
              <input
                className={modalFieldClass}
                placeholder={secondaryPlaceholder}
                value={formData[secondaryPlaceholder] ?? ""}
                onChange={(e) => setFormValue(secondaryPlaceholder, e.target.value)}
              />
            </div>
          </div>

          {!simplified && (
            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Huidige situatie</div>
              <RequestFields requestType={requestType} />
            </div>
          )}

          <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Toelichting</div>
            <textarea
              className={`${modalFieldClass} mt-4 min-h-[130px]`}
              placeholder="Omschrijf kort je situatie of vraag."
              value={formData["Omschrijf kort je situatie of vraag."] ?? ""}
              onChange={(e) => setFormValue("Omschrijf kort je situatie of vraag.", e.target.value)}
            />
            <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-300">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent" />
              {simplified
                ? "Ik geef toestemming om mijn gegevens te gebruiken voor contact over deze aanmelding."
                : "Ik geef toestemming om mijn gegevens te gebruiken voor contact over deze aanvraag of meeting."}
            </label>
          </div>

          <div className="sticky bottom-0 mt-5 border-t border-white/10 bg-slate-950/95 py-4 backdrop-blur">
            {submitState === "success" && (
              <div className="mb-3 rounded-[16px] border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                Uw aanvraag is verzonden. We nemen zo snel mogelijk contact met u op.
              </div>
            )}
            {submitState === "error" && (
              <div className="mb-3 rounded-[16px] border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
                Het verzenden is niet gelukt. Probeer het opnieuw of mail naar cs@fidial.nl.
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-5 py-3 font-medium text-slate-200">
                Annuleren
              </button>
              {contactIntent === "Online meeting plannen" ? (
                <a
                  href={onScheduleMeetingHref}
                  target="_blank"
                  rel="noreferrer"
                  onClick={onClose}
                  className={`inline-flex items-center justify-center rounded-[20px] px-5 py-3 font-semibold text-slate-950 ${accentButton}`}
                >
                  {submitLabel}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={onSubmitRequest}
                  disabled={submitState === "submitting"}
                  className={`rounded-[20px] px-5 py-3 font-semibold text-slate-950 ${accentButton} disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {submitState === "submitting" ? "Bezig met verzenden..." : submitLabel}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyOverlay({ activePolicy, onClose }: { activePolicy: PolicyKey | null; onClose: () => void }) {
  const policy = useMemo(() => (activePolicy ? policyContent[activePolicy] : null), [activePolicy]);
  if (!policy) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-slate-950 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-white/10 bg-slate-950/95 px-6 py-5 backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Beleidsdocument</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">{policy.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{policy.intro}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
            Sluiten
          </button>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-900/60 px-6 py-6 sm:px-8">
          <div className="whitespace-pre-line rounded-[24px] border border-white/10 bg-white/[0.03] p-6 text-sm leading-8 text-slate-300">
            {policy.text.join("\n\n")}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FidialWebsiteDraft() {
  const [selectedService, setSelectedService] = useState<RequestType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [contactIntent, setContactIntent] = useState<ContactIntent>("Aanvraag indienen");
  const [requestType, setRequestType] = useState<RequestType>("Administratie & boekhouding");
  const [activePolicy, setActivePolicy] = useState<PolicyKey | null>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  const setFormValue = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 700);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openServiceModal = (serviceTitle: RequestType) => {
    setSelectedService(serviceTitle);
    setRequestType(serviceTitle);
    setModalOpen(true);
  };

  const openPortalModal = () => {
    setRequestType((prev) => prev || "Administratie & boekhouding");
    setPortalModalOpen(true);
  };

  const isMeetingIntent = contactIntent === "Online meeting plannen";

  const submitRequestForm = async () => {
    try {
      setSubmitState("submitting");
      const payload: Record<string, string> = {
        aanvraagtype: requestType,
        contactintentie: contactIntent,
        ...formData,
      };

      const response = await fetch("/.netlify/functions/send-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Submit failed");
      }

      setSubmitState("success");
      setTimeout(() => {
        setModalOpen(false);
        setPortalModalOpen(false);
        setSubmitState("idle");
      }, 1400);
    } catch (error) {
      console.error(error);
      setSubmitState("error");
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.18),transparent_25%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />
          <div className="relative mx-auto flex max-w-7xl flex-col px-6 pb-20 pt-6 lg:px-10">
            <header className="mb-16 flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-5 py-3 backdrop-blur">
              <div>
                <div className="text-lg font-semibold tracking-wide">FIDIAL</div>
                <div className="text-xs text-slate-300">Grip op uw cijfers. Rust in uw administratie.</div>
              </div>
              <nav className="hidden gap-6 text-sm text-slate-200 md:flex">
                <a href="#diensten" className="transition hover:text-white">Diensten</a>
                <a href="#over" className="transition hover:text-white">Over ons</a>
                <a href="#werkwijze" className="transition hover:text-white">Werkwijze</a>
                <a href="#contact" className="transition hover:text-white">Contact</a>
              </nav>
            </header>

            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <div className="mb-5 inline-flex rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
                  Online administratiekantoor voor mkb, zzp en particulieren
                </div>
                <h1 className="max-w-5xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-[3.4rem]">
                  Meer overzicht, minder zorgen voor uw administratie.
                </h1>
                <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
                  Uw online partner voor boekhouding, belastingzaken en payroll. Professioneel, efficiënt en betrokken.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {isMeetingIntent ? (
                    <a href={CALENDLY_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-[22px] bg-white px-6 py-4 font-medium text-slate-900 shadow-2xl shadow-white/10 transition hover:-translate-y-1">
                      Plan online meeting
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <button type="button" onClick={openPortalModal} className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-[22px] bg-white px-6 py-4 font-medium text-slate-900 shadow-2xl shadow-white/10 transition hover:-translate-y-1">
                      Meld u direct aan
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                  <a href="#contact" className="inline-flex min-h-[56px] items-center justify-center rounded-[22px] border border-white/15 bg-white/5 px-6 py-4 text-center font-medium text-white transition hover:-translate-y-1">
                    Vraag een vrijblijvende offerte aan
                  </a>
                  <a href="#diensten" className="inline-flex min-h-[56px] items-center justify-center rounded-[22px] border border-white/15 bg-white/5 px-6 py-4 text-center font-medium text-white transition hover:-translate-y-1">
                    Bekijk onze diensten
                  </a>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur">
                <div className="rounded-[26px] border border-white/10 bg-slate-900/90 p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <div className="text-sm uppercase tracking-[0.2em] text-slate-400">Online kantoor</div>
                      <div className="mt-1 text-2xl font-semibold">Start uw digitale onboarding</div>
                    </div>
                    <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">Amsterdam</div>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/12 text-cyan-200 ring-1 ring-cyan-300/20">
                        <Laptop2 className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm uppercase tracking-[0.18em] text-slate-400">Direct aanmelden</div>
                        <div className="mt-1 text-lg font-semibold text-white">Snel intake, digitaal aanleveren, direct overzicht</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input className={fieldClass} placeholder="Voornaam" value={formData["Voornaam"] ?? ""} onChange={(e) => setFormValue("Voornaam", e.target.value)} />
                      <input className={fieldClass} placeholder="Achternaam" value={formData["Achternaam"] ?? ""} onChange={(e) => setFormValue("Achternaam", e.target.value)} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ContactChooser value={contactIntent} onChange={setContactIntent} className={fieldClass} />
                      <input className={fieldClass} placeholder="E-mailadres" value={formData["E-mailadres"] ?? ""} onChange={(e) => setFormValue("E-mailadres", e.target.value)} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input className={fieldClass} placeholder="Telefoonnummer" value={formData["Telefoonnummer"] ?? ""} onChange={(e) => setFormValue("Telefoonnummer", e.target.value)} />
                      <input className={fieldClass} placeholder="Bedrijfsnaam" value={formData["Bedrijfsnaam"] ?? ""} onChange={(e) => setFormValue("Bedrijfsnaam", e.target.value)} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <select className={fieldClass} value={requestType} onChange={(e) => setRequestType(e.target.value as RequestType)}>
                        {requestTypeOptions.map((option) => (
                          <option key={option}>{option}</option>
                        ))}
                      </select>
                      {!isMeetingIntent ? (
                        <input className={fieldClass} placeholder="Gewenste ingangsdatum" value={formData["Gewenste ingangsdatum"] ?? ""} onChange={(e) => setFormValue("Gewenste ingangsdatum", e.target.value)} />
                      ) : (
                        <div className="hidden sm:block" />
                      )}
                    </div>
                    {!isMeetingIntent && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <input className={fieldClass} placeholder="Huidig softwarepakket" value={formData["Huidig softwarepakket"] ?? ""} onChange={(e) => setFormValue("Huidig softwarepakket", e.target.value)} />
                      </div>
                    )}
                    {isMeetingIntent ? (
                      <a href={CALENDLY_URL} target="_blank" rel="noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-emerald-400 px-5 py-4 font-semibold text-slate-950 transition hover:-translate-y-1">
                        Plan online meeting
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    ) : (
                      <button type="button" onClick={openPortalModal} className="inline-flex w-full items-center justify-center gap-2 rounded-[22px] bg-emerald-400 px-5 py-4 font-semibold text-slate-950 transition hover:-translate-y-1">
                        Meld u direct aan
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="diensten" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="max-w-5xl">
            <div className="text-sm uppercase tracking-[0.22em] text-emerald-300">Diensten</div>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Praktische ondersteuning voor cijfers, compliance en groei.</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => {
              const Icon = service.icon;
              return (
                <button key={service.title} type="button" className={cardClass} onClick={() => openServiceModal(service.title)}>
                  <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${service.color}`}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-semibold">{service.title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{service.description}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-emerald-200">
                    Meer informatie <span aria-hidden>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section id="over" className="border-y border-white/10 bg-white/[0.03]">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
            <div>
              <div className="text-sm uppercase tracking-[0.22em] text-cyan-300">Waarom Fidial</div>
              <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Menselijk contact, duidelijke afspraken en moderne werkwijze.</h2>
              <div className="mt-10 max-w-[560px] rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6 shadow-2xl shadow-slate-950/20 backdrop-blur">
                <div className="rounded-[28px] border border-white/10 bg-slate-900/85 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Klantdashboard</div>
                      <div className="mt-2 text-lg font-semibold text-white">Financieel overzicht in één oogopslag</div>
                    </div>
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">Live inzicht</div>
                  </div>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Resultaat</div>
                      <div className="mt-3 text-2xl font-semibold text-white">€ 128.450</div>
                      <div className="mt-1 text-sm text-emerald-300">+8,4% t.o.v. vorig jaar</div>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Banksaldi</div>
                      <div className="mt-3 text-2xl font-semibold text-white">€ 84.210</div>
                      <div className="mt-1 text-sm text-slate-400">2 rekeningen gekoppeld</div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-slate-200">Omzet & P&amp;L trend</div>
                        <div className="text-xs text-slate-400">12 mnd</div>
                      </div>
                      <div className="mt-5 flex h-28 items-end gap-2">
                        {[34, 46, 41, 58, 52, 66, 61, 74, 69, 82, 78, 92].map((height, index) => (
                          <div key={index} className="flex-1 rounded-t-[8px] bg-gradient-to-t from-cyan-400/60 to-emerald-300/80" style={{ height: `${height}%` }} />
                        ))}
                      </div>
                      <div className="mt-3 flex justify-between text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        <span>Jan</span>
                        <span>Apr</span>
                        <span>Jul</span>
                        <span>Okt</span>
                        <span>Dec</span>
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-sm font-medium text-slate-200">KPI's</div>
                      <div className="mt-4 space-y-4 text-sm">
                        <div className="flex items-center justify-between rounded-[16px] bg-slate-950/60 px-3 py-3">
                          <span className="text-slate-400">Openstaande posten</span>
                          <span className="font-semibold text-white">€ 19.840</span>
                        </div>
                        <div className="flex items-center justify-between rounded-[16px] bg-slate-950/60 px-3 py-3">
                          <span className="text-slate-400">DSO</span>
                          <span className="font-semibold text-white">34 dagen</span>
                        </div>
                        <div className="flex items-center justify-between rounded-[16px] bg-slate-950/60 px-3 py-3">
                          <span className="text-slate-400">Crediteuren</span>
                          <span className="font-semibold text-white">€ 7.320</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">BTW</div>
                      <div className="mt-2 text-sm font-medium text-white">Q2-aangifte klaar</div>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Payroll</div>
                      <div className="mt-2 text-sm font-medium text-white">Loonrun 24 mei</div>
                    </div>
                    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-400">Actiepunt</div>
                      <div className="mt-2 text-sm font-medium text-white">2 documenten missen</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-xl shadow-slate-950/20 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.18em] text-emerald-200">Waarom klanten voor Fidial kiezen</div>
              <h3 className="mt-3 text-2xl font-semibold text-white">Een modern kantoor met persoonlijke regie en digitaal overzicht.</h3>
              <p className="mt-3 leading-7 text-slate-300">
                Fidial combineert betrokken contact met een efficiënte digitale werkwijze, zodat administratie, belastingzaken en payroll overzichtelijk en beheersbaar blijven.
              </p>
              <div className="mt-5 divide-y divide-white/10 overflow-hidden rounded-[22px] border border-white/10 bg-slate-900/60">
                {[
                  ["Persoonlijke en betrokken samenwerking", "Een vast en laagdrempelig aanspreekpunt met oog voor uw onderneming en situatie."],
                  ["Ondersteuning op maat", "Voor mkb, zzp en particulieren, afgestemd op de fase en complexiteit van uw administratie."],
                  ["Digitaal werken met direct inzicht", "Altijd toegang tot uw administratie, documenten en actuele status van lopende werkzaamheden."],
                  ["Direct bereikbaar en transparant", "Heldere communicatie, duidelijke afspraken en inzichtelijke tarieven zonder verrassingen."],
                ].map(([title, text]) => (
                  <div key={title} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-300" />
                      <div>
                        <p className="font-semibold text-white">{title}</p>
                        <p className="mt-1.5 leading-7 text-slate-300">{text}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="grid gap-0 sm:grid-cols-[1.1fr_0.9fr]">
                  <div className="px-5 py-4 sm:border-r sm:border-white/10">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Werkwijze</div>
                    <p className="mt-2 text-lg font-semibold text-white">Van intake tot structurele ontzorging.</p>
                    <p className="mt-1.5 leading-7 text-slate-300">Wij richten de samenwerking praktisch in, zodat u niet alleen overzicht krijgt, maar het ook behoudt.</p>
                  </div>
                  <div className="px-5 py-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Tarieven</div>
                    <p className="mt-2 text-lg font-semibold text-white">All-in maandfee of uurbasis</p>
                    <p className="mt-1.5 leading-7 text-slate-300">Passend bij de aard van de werkzaamheden en de gewenste ondersteuning.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="werkwijze" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="max-w-5xl">
            <div className="text-sm uppercase tracking-[0.22em] text-violet-300">Werkwijze</div>
            <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Van eerste contact tot structurele ontzorging.</h2>
          </div>
          <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-4">
            {process.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="h-full rounded-[28px] border border-white/10 bg-gradient-to-b from-white/8 to-white/[0.03] p-6 text-left">
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-sm font-semibold tracking-[0.2em] text-slate-400">{item.step}</div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${item.color}`}>
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="contact" className="border-t border-white/10 bg-slate-900/80">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr]">
              <div>
                <div className="text-sm uppercase tracking-[0.22em] text-emerald-300">Contact</div>
                <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">Klaar om u aan te melden bij een overzichtelijk online kantoor?</h2>
                <div className="mt-8 max-w-xl">
                  <p className="text-xl font-semibold text-white">Persoonlijk contact, digitaal geregeld.</p>
                  <p className="mt-3 leading-7 text-slate-300">Stel uw vraag, plan een online afspraak of meld u direct aan.</p>
                  <p className="mt-3 font-medium text-emerald-200">Binnen 1 werkdag een reactie en een heldere start.</p>
                </div>
              </div>
              <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur">
                <div className="rounded-[24px] border border-white/10 bg-slate-950/50 p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Direct regelen</div>
                  <h3 className="mt-3 text-2xl font-semibold text-white">Kies wat het beste bij uw situatie past</h3>
                  <p className="mt-3 leading-7 text-slate-300">Plan eenvoudig een online meeting of meld u direct aan. Uw eerder ingevulde gegevens nemen we automatisch mee.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <a href={CALENDLY_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-[56px] items-center justify-center rounded-[22px] bg-emerald-400 px-5 py-4 font-semibold text-slate-950 transition hover:-translate-y-1">
                      Plan online meeting
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setContactIntent("Aanvraag indienen");
                        openPortalModal();
                      }}
                      className="min-h-[56px] rounded-[22px] bg-white px-5 py-4 font-semibold text-slate-950 transition hover:-translate-y-1"
                    >
                      Meld u direct aan
                    </button>
                  </div>
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="text-sm font-semibold text-white">Overstappen zonder gedoe.</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">Maakt u gebruik van onze overstapservice, dan verzorgen wij de overdracht in overleg volledig namens u.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid items-stretch gap-3 md:grid-cols-3">
              {[
                ["Stap 1", "Contact binnen 1 werkdag", "We reageren snel op uw aanvraag of bericht. U kunt daarnaast ook eenvoudig een online meeting inplannen, zodat we direct kunnen afstemmen wat het beste past."],
                ["Stap 2", "Korte inventarisatie", "We brengen uw situatie helder in kaart en bepalen welke ondersteuning nodig is. Dit kunnen we ook eenvoudig tijdens een online meeting doen, zodat we direct gericht kunnen afstemmen."],
                ["Stap 3", "Heldere digitale start", "Daarna zorgen we voor een overzichtelijke onboarding en duidelijke vervolgstappen, zodat u binnen 2 werkdagen up and running bent."],
              ].map(([step, title, text]) => (
                <div key={step} className="h-full rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">{step}</div>
                  <div className="mt-2 text-base font-semibold text-white">{title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-slate-950/95">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
            <div>
              <div className="text-sm font-semibold tracking-wide text-white">FIDIAL</div>
              <div className="mt-2 hidden text-sm text-slate-400 lg:block">
                Grip op uw cijfers. Rust in uw administratie. · Louise Marie Loeberplantsoen 4 · 1062 DD Amsterdam · KvK 86233947 ·{" "}
                <a href="tel:0202338639" className="ml-2 transition hover:text-white">020 - 233 86 39</a>
                <span className="mx-2">·</span>
                <a href="mailto:cs@fidial.nl" className="transition hover:text-white">cs@fidial.nl</a>
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-400 lg:hidden">
                <div>Grip op uw cijfers. Rust in uw administratie. · Louise Marie Loeberplantsoen 4 · 1062 DD Amsterdam</div>
                <div className="flex flex-col gap-1 text-slate-300">
                  <a href="tel:0202338639">020 - 233 86 39</a>
                  <a href="mailto:cs@fidial.nl">cs@fidial.nl</a>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 text-sm text-slate-300">
              {([
                ["voorwaarden", "Algemene voorwaarden"],
                ["cookies", "Cookieverklaring"],
                ["disclaimer", "Disclaimer"],
                ["privacy", "Privacybeleid"],
              ] as [PolicyKey, string][]).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setActivePolicy(key)} className="text-left transition hover:text-white">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </footer>
      </div>

      <IntakeModal
        isOpen={modalOpen}
        title={selectedService ?? "Meer informatie"}
        intro="Laat weten of u direct een aanvraag wilt indienen of liever een online meeting plant."
        accent="emerald"
        requestType={requestType}
        setRequestType={setRequestType}
        contactIntent={contactIntent}
        setContactIntent={setContactIntent}
        submitLabel={contactIntent === "Online meeting plannen" ? "Plan online meeting" : "Verstuur aanvraag"}
        formData={formData}
        setFormValue={setFormValue}
        onScheduleMeetingHref={CALENDLY_URL}
        onSubmitRequest={submitRequestForm}
        submitState={submitState}
        onClose={() => {
          setSubmitState("idle");
          setModalOpen(false);
        }}
      />

      <IntakeModal
        isOpen={portalModalOpen}
        title="Start direct met uw online onboarding"
        intro="Laat uw gegevens achter en geef aan waarmee u wilt starten. Zo kan Fidial de intake gericht oppakken en snel contact opnemen."
        accent="cyan"
        simplified
        requestType={requestType}
        setRequestType={setRequestType}
        contactIntent={contactIntent}
        setContactIntent={setContactIntent}
        submitLabel={contactIntent === "Online meeting plannen" ? "Plan online meeting" : "Meld u direct aan"}
        formData={formData}
        setFormValue={setFormValue}
        onScheduleMeetingHref={CALENDLY_URL}
        onSubmitRequest={submitRequestForm}
        submitState={submitState}
        onClose={() => {
          setSubmitState("idle");
          setPortalModalOpen(false);
        }}
      />

      <PolicyOverlay activePolicy={activePolicy} onClose={() => setActivePolicy(null)} />

      {showBackToTop && (
        <button type="button" onClick={scrollToTop} className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/90 px-4 py-3 text-sm font-medium text-white shadow-2xl shadow-slate-950/40 backdrop-blur transition hover:-translate-y-1 hover:border-white/20 hover:bg-slate-900">
          <ChevronUp className="h-4 w-4" />
          Naar boven
        </button>
      )}
    </>
  );
}
