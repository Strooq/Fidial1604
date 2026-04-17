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
  mode?: "single";
  text: string[];
};

type PolicySection = {
  heading: string | null;
  body: string[];
};
function isPolicyHeading(line: string) {
  const value = line.trim();

  if (!value) return false;

  if (/^Artikel\s+\d+[:]?/i.test(value)) return true;
  if (/^\d+\.\s+(?!\d)/.test(value)) return true;

  const looksLikePlainHeading =
    !/[.!?]$/.test(value) &&
    value.length <= 90 &&
    !/^\d+\.\d+/.test(value);

  return looksLikePlainHeading;
}

function buildPolicySections(lines: string[]): PolicySection[] {
  const cleanLines = lines.map((line) => line.trim()).filter(Boolean);

  const sections: PolicySection[] = [];
  let current: PolicySection = { heading: null, body: [] };

  const pushCurrent = () => {
    if (current.heading || current.body.length) {
      sections.push(current);
    }
  };

  for (const line of cleanLines) {
    if (isPolicyHeading(line)) {
      pushCurrent();
      current = { heading: line, body: [] };
    } else {
      current.body.push(line);
    }
  }

  pushCurrent();

  return sections.length ? sections : [{ heading: null, body: cleanLines }];
}
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
    mode: "single",
    text: [
      "Algemene voorwaarden van Fidial",
      "Hieronder vindt u de algemene voorwaarden die op onze dienstverlening van toepassing zijn.",
      "Artikel 1: Definities",
      "1.1. In deze algemene voorwaarden worden de hiernavolgende termen in de navolgende betekenis gebruikt, tenzij uitdrukkelijk anders is aangegeven.",
      "Gebruiker: FIDIAL is de gebruiker van de algemene voorwaarden.",
      "Opdrachtgever: De wederpartij van gebruiker.",
      "Overeenkomst: De overeenkomst tot het verrichten van diensten.",
      "Artikel 2: Algemeen",
      "2.1. Deze voorwaarden gelden voor iedere aanbieding, offerte en overeenkomst tussen gebruiker en een opdrachtgever waarop gebruiker deze voorwaarden van toepassing heeft verklaard, voor zover van deze voorwaarden niet door partijen uitdrukkelijk en schriftelijk is afgeweken.",
      "2.2. De onderhavige voorwaarden zijn eveneens van toepassing op alle overeenkomsten met gebruiker, voor de uitvoering waarvan derden dienen te worden betrokken.",
      "2.3. Eventuele afwijkingen op deze algemene voorwaarden zijn slechts geldig indien deze uitdrukkelijk schriftelijk zijn overeengekomen.",
      "2.4. De toepasselijkheid van eventuele inkoop of andere voorwaarden van opdrachtgever wordt uitdrukkelijk van de hand gewezen.",
      "2.5. Indien een of meerdere der bepalingen in deze algemene voorwaarden of in de bijbehorende overeenkomst nietig zijn of vernietigd mochten worden blijven de overige bepalingen van deze algemene voorwaarden en overeenkomst volledig van toepassing. Gebruiker en opdrachtgever zullen alsdan in overleg treden teneinde nieuwe bepalingen ter vervanging van de nietige c.q. vernietigde bepalingen overeen te komen, waarbij indien en voor zoveel mogelijk het doel en de strekking van de oorspronkelijke bepaling in acht worden genomen.",
      "Artikel 3: Aanbiedingen en offertes",
      "3.1. Alle aanbiedingen zijn vrijblijvend, tenzij in het aanbod schriftelijk uitdrukkelijk anders is aangegeven.",
      "3.2. De prijzen in de genoemde aanbiedingen en offertes zijn exclusief BTW en andere heffingen van overheidswege, alsmede eventuele in het kader van de overeenkomst te maken kosten, waaronder verzend- en administratiekosten, tenzij anders aangegeven.",
      "3.3. Indien de aanvaarding (op ondergeschikte punten) afwijkt van het in de offerte opgenomen aanbod is gebruiker daaraan niet gebonden. De overeenkomst komt dan niet overeenkomstig deze afwijkende aanvaarding tot stand, tenzij gebruiker anders aangeeft.",
      "3.4. Een samengestelde prijsopgave verplicht gebruiker niet tot het verrichten van een gedeelte van de opdracht tegen een overeenkomstig deel van de opgegeven prijs.",
      "3.5. Aanbiedingen of offertes gelden niet automatisch voor toekomstige opdrachten.",
      "Artikel 4: Uitvoering van de overeenkomst, informatie en middelen",
      "4.1. Gebruiker zal de overeenkomst naar beste inzicht en vermogen en overeenkomstig de eisen van goed vakmanschap uitvoeren, een en ander op grond van de kundigheid die opdrachtgever redelijkerwijs van gebruiker mag verwachten. Gebruiker kan evenwel niet instaan voor het bereiken van een enig beoogd resultaat.",
      "4.2. Gebruiker bepaalt de wijze waarop en door welke perso(o)n(en) de opdracht wordt uitgevoerd, doch neemt daarbij de door opdrachtgever kenbaar gemaakte wensen zoveel mogelijk in acht. Indien en voor zover een goede uitvoering van de overeenkomst dit vereist, heeft gebruiker het recht bepaalde werkzaamheden te laten verrichten door derden.",
      "4.3. De opdrachtgever draagt er zorg voor dat alle gegevens, alsmede wijzigingen hierin, in de vorm en op de wijze, waarvan gebruiker aangeeft dat deze noodzakelijk zijn of waarvan de opdrachtgever redelijkerwijs behoort te begrijpen dat deze noodzakelijk zijn zowel bij aanvang als tijdens (voor) het uitvoeren van de overeenkomst, tijdig en behoorlijk aan gebruiker worden verstrekt. Indien de voor de uitvoering van de overeenkomst benodigde gegevens niet tijdig of niet behoorlijk aan gebruiker zijn verstrekt, heeft gebruiker het recht de uitvoering van de overeenkomst op te schorten en / of de uit de vertraging voortvloeiende extra kosten aan de opdrachtgever in rekening te brengen.",
      "4.4. De opdrachtgever draagt er zorg voor dat alle middelen en voorzieningen, waarvan gebruiker aangeeft dat deze noodzakelijk zijn of waarvan de opdrachtgever redelijkerwijs behoort te begrijpen dat deze noodzakelijk zijn voor het uitvoeren van de overeenkomst, tijdig en ten allen tijde aan gebruiker ter beschikking staan en naar behoren functioneren. Indien de voor de uitvoering van de overeenkomst benodigde middelen niet afdoende ter beschikking van gebruiker zijn, heeft gebruiker het recht de uitvoering van de overeenkomst op te schorten en / of de uit de vertraging voortvloeiende extra kosten aan de opdrachtgever in rekening te brengen.",
      "4.5. Opdrachtgever staat in voor juistheid, volledigheid en betrouwbaarheid van de door of namens hem aan gebruiker verstrekte gegevens, middelen en voorzieningen. Gebruiker is niet aansprakelijk voor schade, van welke aard ook, doordat gebruiker is uit gegaan van door de opdrachtgever verstrekte onjuiste en / of onvolledige gegevens e.d., tenzij deze onjuistheid of onvolledigheid voor gebruiker kenbaar behoorde te zijn.",
      "4.6. Opdrachtgever is gehouden gebruiker onverwijld te informeren omtrent wijzigingen in de verstrekte gegevens e.d., dan wel andere feiten en omstandigheden, die in verband met de uitvoering van belang kunnen zijn.",
      "4.7. Indien is overeengekomen dat de overeenkomst in fasen zal worden uitgevoerd kan gebruiker de uitvoering van die onderdelen die tot een volgende fase behoren opschorten tot dat de opdrachtgever de resultaten van de daaraan voorafgaande fase schriftelijk heeft goedgekeurd.",
      "4.8. Indien door gebruiker of door gebruiker ingeschakelde derden in het kader van de opdracht werkzaamheden worden verricht op de locatie van opdrachtgever of een door opdrachtgever aangewezen locatie, draagt opdrachtgever kosteloos zorg voor de door die medewerkers in redelijkheid gewenste faciliteiten.",
      "Artikel 5: Wijziging van de overeenkomst",
      "5.1. Indien tijdens de uitvoering van de overeenkomst blijkt dat het voor een behoorlijke uitvoering noodzakelijk is om de te verrichten werkzaamheden te wijzigen of aan te vullen, zullen partijen tijdig en in onderling overleg de overeenkomst dienovereenkomstig aanpassen.",
      "5.2. Indien partijen overeenkomen dat de overeenkomst wordt gewijzigd of aangevuld, kan het tijdstip van voltooiing van de uitvoering daardoor worden beïnvloed. Gebruiker zal de opdrachtgever zo spoedig mogelijk hiervan op de hoogte stellen. Bedoelde wijziging of aanvulling van de overeenkomst geeft opdrachtgever geen recht op schadevergoeding.",
      "5.3. Indien de wijziging van of aanvulling op de overeenkomst financiële en / of kwalitatieve consequenties zal hebben, zal gebruiker de opdrachtgever hierover tevoren inlichten. Gebruiker is gerechtigd aan opdrachtgever meerkosten in rekening te brengen.",
      "5.4. Indien een vast honorarium is overeengekomen zal gebruiker daarbij aangeven in hoeverre de wijziging of aanvulling van de overeenkomst een overschrijding van dit honorarium tot gevolg heeft.",
      "Artikel 6: Contractsduur; uitvoeringstermijn",
      "6.1. De overeenkomst tussen gebruiker en een opdrachtgever wordt aangegaan voor de duur van 1 jaar, tenzij uit de aard van de overeenkomst anders voortvloeit of partijen uitdrukkelijk en schriftelijk anders overeenkomen.",
      "6.2. Is binnen de looptijd van de overeenkomst voor de voltooiing van bepaalde werkzaamheden een termijn overeengekomen, dan is dit nimmer een fatale termijn. Bij overschrijding van de uitvoeringstermijn dient de opdrachtgever gebruiker derhalve schriftelijk in gebreke te stellen.",
      "6.3. De overeenkomst kan - tenzij vaststaat dat uitvoering blijvend onmogelijk is - door opdrachtgever niet wegens termijnoverschrijding worden ontbonden, tenzij gebruiker de overeenkomst ook niet of niet geheel uitvoert binnen een hem na afloop van de overeengekomen leveringstermijn schriftelijk aangezegde redelijke termijn.",
      "Artikel 7: Opzegging",
      "7.1. Ieder van partijen is bevoegd de overeenkomst met inachtneming van een naar de omstandigheden redelijke termijn tegen het einde van een kalendermaand door opzegging te beëindigen, tenzij partijen anders zijn overeengekomen. Opzegging dient schriftelijk te geschieden.",
      "7.2. Indien de overeenkomst tussentijds (in het geval de overeenkomst is aangegaan voor bepaalde tijd) wordt opgezegd door opdrachtgever, heeft gebruiker recht op schadevergoeding vanwege het daardoor ontstane en aannemelijk te maken bezettingsverlies, tenzij er feiten en omstandigheden aan de opzegging ten grondslag liggen die aan gebruiker zijn toe te rekenen. Voorts is opdrachtgever alsdan gehouden tot betaling van de declaraties voor tot dan toe verrichte werkzaamheden.",
      "7.3. Indien de overeenkomst tussentijds wordt opgezegd door gebruiker, zal gebruiker in overleg met opdrachtgever zorgdragen voor overdracht van nog te verrichten werkzaamheden aan derden, tenzij er feiten en omstandigheden aan de opzegging ten grondslag liggen die aan opdrachtgever toerekenbaar zijn.",
      "7.4. Indien de overdracht van de werkzaamheden voor gebruiker extra kosten met zich meebrengt, is opdrachtgever verplicht deze aan gebruiker te betalen met inachtneming van hetgeen is gesteld in artikel 8 en 9 van deze algemene voorwaarden.",
      "Artikel 8: Honorarium",
      "8.1. Partijen kunnen bij het tot stand komen van de overeenkomst een vast honorarium overeenkomen.",
      "8.2. Indien geen vast honorarium wordt overeengekomen, zal het honorarium worden vastgesteld op grond van werkelijk bestede uren. Het honorarium wordt berekend volgens de gebruikelijke uurtarieven van gebruiker, geldende voor de periode waarin de werkzaamheden worden verricht, tenzij een daarvan afwijkend uurtarief is overeengekomen.",
      "8.3. Het honorarium en eventuele kostenramingen zijn exclusief BTW.",
      "8.4. Bij opdrachten met een looptijd van meer dan twee maanden zullen de verschuldigde kosten periodiek in rekening worden gebracht.",
      "8.5. Indien gebruiker met de opdrachtgever een vast honorarium of uurtarief overeenkomt, is gebruiker niettemin gerechtigd tot verhoging van dit honorarium of tarief, bijvoorbeeld in geval van wijziging of aanvulling van de overeenkomst.",
      "8.6. Voorts is gebruiker gerechtigd prijsstijgingen door te berekenen indien tussen het moment van aanbieding en levering de tarieven ten aanzien van bijv. lonen zijn gestegen.",
      "8.7. Daarnaast mag gebruiker het honorarium verhogen wanneer tijdens de uitvoering van de werkzaamheden blijkt dat de oorspronkelijk overeengekomen dan wel verwachte hoeveelheid werk in zodanige mate onvoldoende werd ingeschat bij het sluiten van de overeenkomst, en zulks niet toerekenbaar is aan gebruiker, dat in redelijkheid niet van gebruiker mag worden verwacht de overeengekomen werkzaamheden te verrichten tegen het oorspronkelijk overeengekomen honorarium. Gebruiker zal de opdrachtgever in dat geval van het voornemen tot verhoging van het honorarium of tarief in kennis stellen. Gebruiker zal daarbij de omvang van en de datum waarop de verhoging zal ingaan, vermelden.",
      "Artikel 9: Betaling",
      "9.1. Betaling dient te geschieden binnen 14 dagen na factuurdatum, zonder enige aftrek, korting of verrekening door storting of overmaking op de door gebruiker aangegeven bank- of girorekening. Gebruiker mag periodiek factureren.",
      "9.2. Indien opdrachtgever in gebreke blijft met de betaling binnen de termijn van 14 dagen dan is de opdrachtgever van rechtswege in verzuim. Opdrachtgever is alsdan een rente verschuldigd gelijk aan de geldende wettelijke rente. De rente over het opeisbaar bedrag zal worden berekend vanaf het moment dat opdrachtgever in verzuim is tot het moment van voldoening van het volledige bedrag, waarbij een gedeelte van een maand als volledige maand wordt gerekend.",
      "9.3. Gebruiker heeft het recht de door opdrachtgever gedane betalingen te laten strekken in de eerste plaats in mindering van de kosten, vervolgens in mindering van de opengevallen rente en tenslotte in mindering van de hoofdsom en de lopende rente. Gebruiker kan, zonder daardoor in verzuim te komen, een aanbod tot betaling weigeren, indien de opdrachtgever een andere volgorde voor de toerekening aanwijst. Gebruiker kan volledige aflossing van de hoofdsom weigeren, indien daarbij niet eveneens de opengevallen en lopende rente alsmede de kosten worden voldaan.",
      "9.4. De opdrachtgever is nimmer gerechtigd tot verrekening van het door gebruiker aan hem verschuldigde.",
      "9.5. Bezwaren tegen de hoogte van de declaraties schorten de betalingsverplichting niet op. De wederpartij die geen beroep toekomt op afdeling 6.5.3 (de artikelen 231 tot en met 247 boek 6 BW) mag evenmin de betaling van een factuur om een andere reden opschorten.",
      "9.6. In geval van liquidatie, faillissement, beslag of surseance van betaling van de opdrachtgever zijn de vorderingen van gebruiker op de opdrachtgever onmiddellijk opeisbaar.",
      "Artikel 10: Eigendomsvoorbehoud",
      "10.1. Alle door gebruiker geleverde zaken, daaronder eventueel mede begrepen ontwerpen, schetsen, tekeningen, films, software, (elektronische) bestanden, enz., blijven eigendom van gebruiker totdat de opdrachtgever alle verplichtingen uit alle met gebruiker gesloten overeenkomsten is nagekomen, dit ter beoordeling van gebruiker.",
      "10.2. De opdrachtgever is niet bevoegd de onder het eigendomsvoorbehoud vallende zaken te verpanden noch op enige andere wijze te bezwaren.",
      "10.3. Indien derden beslag leggen op de onder eigendomsvoorbehoud geleverde zaken dan wel rechten daarop willen vestigen of doen gelden, is opdrachtgever verplicht gebruiker zo snel als redelijkerwijs verwacht mag worden daarvan op de hoogte te stellen.",
      "10.4. De opdrachtgever verplicht zich de onder eigendomsvoorbehoud geleverde zaken te verzekeren en verzekerd te houden tegen brand, ontploffings- en waterschade alsmede tegen diefstal en de polis van deze verzekering op eerste verzoek ter inzage te geven.",
      "10.5. Door gebruiker geleverde zaken, die krachtens het onder 1. van dit artikel bepaalde onder het eigendomsvoorbehoud vallen, mogen slechts in het kader van een normale bedrijfsuitoefening worden doorverkocht en nimmer als betaalmiddel worden gebruikt.",
      "10.6. Voor het geval dat gebruiker zijn in dit artikel aangeduide eigendomsrechten wil uitoefenen, geeft de opdrachtgever reeds nu onvoorwaardelijke en niet herroepbare toestemming aan gebruiker of door deze aan te wijzen derden om al die plaatsen te betreden waar de eigendommen van gebruiker zich bevinden en die zaken mede terug te nemen.",
      "Artikel 11: Incassokosten",
      "11.1. Alle in redelijkheid door gebruiker in verband met de niet- of niet tijdige nakoming door de opdrachtgever van diens betalingsverplichtingen gemaakte gerechtelijke en buitengerechtelijke (incasso-)kosten, zijn voor rekening van de opdrachtgever.",
      "11.2. Opdrachtgever is over de gemaakte incassokosten rente verschuldigd.",
      "Artikel 12: Onderzoek, reclames",
      "12.1. Klachten over de verrichte werkzaamheden dienen door de opdrachtgever binnen 8 dagen na ontdekking, doch uiterlijk binnen 14 dagen na voltooiing van de betreffende werkzaamheden schriftelijk te worden gemeld aan gebruiker. De ingebrekestelling dient een zo gedetailleerd mogelijke omschrijving van de tekortkoming te bevatten, zodat gebruiker in staat is adequaat te reageren. Een reclame schort de betalingsverplichting van opdrachtgever niet op, behoudens voorzover de gebruiker aan opdrachtgever schriftelijk te kennen heeft gegeven dat deze de reclame (deels) gegrond acht.",
      "12.2. Indien een klacht gegrond is, zal gebruiker de werkzaamheden alsnog verrichten zoals overeengekomen, tenzij dit inmiddels voor de opdrachtgever aantoonbaar zinloos is geworden. Dit laatste dient door de opdrachtgever schriftelijk kenbaar te worden gemaakt.",
      "12.3. Indien het alsnog verrichten van de overeengekomen werkzaamheden niet meer mogelijk of zinvol is, kan gebruiker een gedeelte van het reeds betaalde honorarium terugbetalen zonder verdere uitvoering aan de opdracht te geven en zal gebruiker in voorkomend geval slechts aansprakelijk kunnen zijn binnen de grenzen van artikel 16.",
      "Artikel 13: Vervaltermijn",
      "13.1. Onverminderd het bepaalde in artikel 12 is opdrachtgever gehouden, indien hij van oordeel is of blijft dat gebruiker de overeenkomst niet tijdig, niet volledig of niet behoorlijk heeft uitgevoerd, zulks -tenzij dit reeds op grond van het bepaalde in artikel 12.1 is gebeurd- onverwijld schriftelijk aan gebruiker kenbaar te maken en de daarop gebaseerde aanspraken binnen één jaar na dagtekening van de hiervoor bedoelde kennisgeving, dan wel binnen één jaar, nadat die kennisgeving had behoren te worden gedaan, in rechte geldend te maken, bij gebreke waarvan al zijn rechten en aanspraken te die zake vervallen door het verstrijken van de hiervoor bedoelde termijn.",
      "Artikel 14: Opschorting en ontbinding",
      "14.1. Gebruiker is bevoegd de nakoming van de verplichtingen op te schorten of de overeenkomst te ontbinden, indien: Opdrachtgever de verplichtingen uit de overeenkomst niet of niet volledig nakomt. Na het sluiten van de overeenkomst gebruiker ter kennis gekomen omstandigheden goede grond geven te vrezen dat de opdrachtgever de verplichtingen niet zal nakomen. In geval er goede grond bestaat te vrezen dat de opdrachtgever slechts gedeeltelijk of niet behoorlijk zal nakomen, is de opschorting slechts toegelaten voor zover de tekortkoming haar rechtvaardigt. Opdrachtgever bij het sluiten van de overeenkomst verzocht is zekerheid te stellen voor de voldoening van zijn verplichtingen uit de overeenkomst en deze zekerheid uitblijft of onvoldoende is.",
      "14.2. Voorts is gebruiker bevoegd de overeenkomst te (doen) ontbinden indien zich omstandigheden voordoen welke van dien aard zijn dat nakoming van de overeenkomst onmogelijk of naar maatstaven van redelijkheid en billijkheid niet langer kan worden gevergd dan wel indien zich anderszins omstandigheden voordoen welke van dien aard zijn dat ongewijzigde instandhouding van de overeenkomst in redelijkheid niet mag worden verwacht.",
      "14.3. Indien de overeenkomst wordt ontbonden zijn de vorderingen van gebruiker op de opdrachtgever onmiddellijk opeisbaar. Indien gebruiker de nakoming van zijn verplichtingen opschort, behoudt hij zijn aanspraken uit de wet en overeenkomst.",
      "14.4. Gebruiker behoudt steeds het recht schadevergoeding te vorderen.",
      "Artikel 15: Teruggave ter beschikking gestelde zaken",
      "15.1. Indien gebruiker aan opdrachtgever bij de uitvoering van de overeenkomst zaken ter beschikking heeft gesteld is opdrachtgever gehouden het geleverde op eerste verzoek van gebruiker binnen 14 dagen in oorspronkelijke staat, vrij van gebreken en volledig te retourneren.",
      "15.2. Indien opdrachtgever in gebreke blijft met de onder 1. genoemde verplichting tot teruggave, is opdrachtgever verplicht de daaruit voortvloeiende schade en kosten, waaronder de kosten van vervanging, aan gebruiker te vergoeden.",
      "Artikel 16: Aansprakelijkheid",
      "16.1. Indien gebruiker aansprakelijk mocht zijn, dan is deze aansprakelijkheid beperkt tot hetgeen in deze bepaling is geregeld.",
      "16.2. De aansprakelijkheid van gebruiker voor schade van de opdrachtgever, welke is veroorzaakt door niet tijdige, niet volledige of niet behoorlijke uitvoering van de opdracht, is beperkt tot maximaal tweemaal het bedrag van het honorarium, dat door gebruiker aan de opdrachtgever in rekening is gebracht voor het verrichten van de werkzaamheden waarin de oorzaak van de schade is gelegen, met dien verstande dat daarbij alleen het honorarium in aanmerking wordt genomen dat betrekking heeft op de laatste drie maanden waarin die werkzaamheden zijn verricht. De eventueel door gebruiker aan de opdrachtgever verschuldigde schadevergoeding zal echter nimmer hoger zijn dan het bedrag waarvoor de aansprakelijkheid van gebruiker in voorkomend geval door verzekering is gedekt. Het voorgaande lijdt uitzondering ingeval van opzet of daarmee gelijk te stellen grove onzorgvuldigheid van gebruiker. Onder gebruiker zijn in deze en de volgende bepalingen van dit artikel mede begrepen zijn werknemers alsmede eventuele door hem bij de uitvoering van de opdracht ingeschakelde derden.",
      "16.3. Gebruiker is niet aansprakelijk voor schade, welke is veroorzaakt doordat de opdrachtgever niet heeft voldaan aan zijn uit artikel 4.3 voortvloeiende informatieverplichting of doordat de door opdrachtgever verstrekte informatie niet voldoet aan hetgeen waarvoor hij krachtens artikel 4.5 instaat, tenzij deze schade mede is veroorzaakt door opzet of daarmee gelijkt te stellen grove onzorgvuldigheid van gebruiker.",
      "16.4. Gebruiker is voorts niet aansprakelijk voor schade, welke is veroorzaakt door handelen of nalaten van door opdrachtgever bij de uitvoering van de opdracht betrokken derden, tenzij die schade mede is veroorzaakt door opzet of daarmee gelijk te stellen grove onzorgvuldigheid van gebruiker.",
      "16.5. Gebruiker is overigens steeds bevoegd de schade van de opdrachtgever zoveel mogelijk te beperken of ongedaan te maken, waartoe opdrachtgever alle medewerking zal verlenen.",
      "16.6. Gebruiker is nimmer aansprakelijk voor indirecte schade, daaronder begrepen gevolgschade, gederfde winst, gemiste besparingen en schade door bedrijfsstagnatie. Het voorgaande lijdt uitzondering ingeval van opzet of daarmee gelijk te stellen grove onzorgvuldigheid van gebruiker.",
      "Artikel 17: Vrijwaringen",
      "17.1. De opdrachtgever vrijwaart gebruiker voor aanspraken van derden met betrekking tot rechten van intellectuele eigendom op door de opdrachtgever verstrekte materialen of gegevens, die bij de uitvoering van de overeenkomst worden gebruikt.",
      "17.2. Indien opdrachtgever aan gebruiker informatiedragers, elektronische bestanden of software etc. verstrekt, garandeert deze dat de informatiedragers, elektronische bestanden of software vrij zijn van virussen en defecten.",
      "17.3. Opdrachtgever vrijwaart gebruiker voor aanspraken van derden terzake van schade, welke verband houdt met of voortvloeit uit de door gebruiker uitgevoerde opdracht, indien en voor zover gebruiker daarvoor krachtens het bepaalde in artikel 16 niet jegens de opdrachtgever aansprakelijk is.",
      "Artikel 18: Risico-overgang",
      "18.1. Het risico van verlies of beschadiging van de zaken die voorwerp van de overeenkomst zijn, gaat op opdrachtgever over op het moment waarop deze aan opdrachtgever juridisch en/of feitelijk worden geleverd en daarmee in de macht van opdrachtgever of van een door opdrachtgever aan te wijzen derden worden gebracht.",
      "Artikel 19: Overmacht",
      "19.1. Partijen zijn niet gehouden tot het nakomen van enige verplichting, indien zij daartoe gehinderd worden als gevolg van een omstandigheid die niet is te wijten aan schuld, en noch krachtens de wet, een rechtshandeling of in het verkeer geldende opvattingen voor hun rekening komt.",
      "19.2. Onder overmacht wordt in deze algemene voorwaarden verstaan naast hetgeen daaromtrent in de wet en jurisprudentie wordt begrepen, alle van buiten komende oorzaken, voorzien of niet voorzien, waarop gebruiker geen invloed kan uitoefenen, doch waardoor gebruiker niet in staat is de verplichtingen na te komen. Werkstakingen in het bedrijf van gebruiker worden daaronder begrepen.",
      "19.3. Gebruiker heeft ook het recht zich op overmacht te beroepen, indien de omstandigheid die (verdere) nakoming verhindert, intreedt nadat gebruiker zijn verplichtingen had moeten nakomen.",
      "19.4. Partijen kunnen gedurende de periode dat de overmacht voortduurt de verplichtingen uit de overeenkomst opschorten. Indien deze periode langer duurt dan twee maanden is ieder der partijen gerechtigd de overeenkomst te ontbinden, zonder verplichting tot vergoeding van schade aan de andere partij.",
      "19.5. Voor zoveel gebruiker ten tijde van het intreden van overmacht inmiddels gedeeltelijk zijn verplichtingen uit de overeenkomst is nagekomen of deze zal kunnen nakomen, en aan het nagekomen respectievelijk na te komen gedeelte zelfstandige waarde toekomt, is gebruiker gerechtigd om het reeds nagekomen respectievelijk na te komen gedeelte separaat te declareren. Opdrachtgever is gehouden deze declaratie te voldoen als ware het een afzonderlijke overeenkomst.",
      "Artikel 20: Geheimhouding",
      "20.1. Beide partijen zijn verplicht tot geheimhouding van alle vertrouwelijke informatie die zij in het kader van hun overeenkomst van elkaar of uit andere bron hebben verkregen. Informatie geldt als vertrouwelijk als dit door de andere partij is medegedeeld of als dit voortvloeit uit de aard van de informatie.",
      "20.2. Indien, op grond van een wettelijke bepaling of een rechterlijke uitspraak, gebruiker gehouden is vertrouwelijke informatie aan door de wet of de bevoegde rechter aangewezen derden mede te verstrekken, en gebruiker zich ter zake niet kan beroepen op een wettelijk dan wel door de bevoegde rechter erkend of toegestaan recht van verschoning, dan is gebruiker niet gehouden tot schadevergoeding of schadeloosstelling en is de wederpartij niet gerechtigd tot ontbinding van de overeenkomst op grond van enige schade, hierdoor ontstaan.",
      "Artikel 21: Intellectuele eigendom en auteursrechten",
      "21.1. Onverminderd het overigens in deze algemene voorwaarden bepaalde behoudt gebruiker zich de rechten en bevoegdheden voor die gebruiker toekomen op grond van de Auteurswet.",
      "21.2. Alle door gebruiker verstrekte stukken, zoals rapporten, adviezen, overeenkomsten, ontwerpen, schetsen, tekeningen, software enz., zijn uitsluitend bestemd om te worden gebruikt door de opdrachtgever en mogen niet door hem zonder voorafgaande toestemming van gebruiker worden verveelvoudigd, openbaar gemaakt, of ter kennis van derden gebracht, tenzij uit de aard van de verstrekte stukken anders voortvloeit.",
      "21.3. Gebruiker behoudt het recht de door de uitvoering van de werkzaamheden toegenomen kennis voor andere doeleinden te gebruiken, voor zover hierbij geen vertrouwelijke informatie ter kennis van derden wordt gebracht.",
      "Artikel 22: Niet-overname personeel",
      "22.1. De opdrachtgever zal gedurende de looptijd van de overeenkomst alsmede één jaar na beëindiging daarvan, op generlei wijze, behoudens nadat goed zakelijk overleg ter zake heeft plaatsgehad met gebruiker, medewerkers van gebruiker of van ondernemingen waarop gebruiker ter uitvoering van deze overeenkomst beroep heeft gedaan en die betrokken zijn (geweest) bij de uitvoering van de overeenkomst, in dienst nemen dan wel anderszins, direct of indirect, voor zich laten werken.",
      "Artikel 23: Geschillen",
      "23.1. De rechter in de vestigingsplaats van gebruiker is bij uitsluiting bevoegd van geschillen kennis te nemen, tenzij bepalingen van dwingend recht anders voorschrijven.",
      "23.2. Partijen zullen eerst een beroep op de rechter doen nadat zij zich tot het uiterste hebben ingespannen een geschil in onderling overleg te beslechten.",
      "Artikel 24: Toepasselijk recht",
      "24.1. Alle rechtsverhoudingen tussen gebruiker en de opdrachtgever waarop deze algemene voorwaarden van toepassing zijn, worden beheerst door Nederlands recht. Het Weens Koopverdrag is uitdrukkelijk uitgesloten.",
      "Artikel 25: Vindplaats van de voorwaarden",
      "25.1. Deze voorwaarden zijn gepubliceerd op de website van gebruiker.",
      "25.2. Van toepassing is steeds de laatst gepubliceerde versie c.q. de versie zoals die gold ten tijde van het tot stand komen van de overeenkomst.",
    ],
  },
  cookies: {
    mode: "single",
    text: [
      "Cookieverklaring Fidial",
      "Laatst bijgewerkt: 14 april 2026",
      "Fidial maakt op haar website gebruik van cookies en vergelijkbare technieken. In deze cookieverklaring leggen wij uit welke cookies wij gebruiken, waarom wij dat doen en welke keuzes u daarbij heeft.",
      "1. Wat zijn cookies?",
      "Cookies zijn kleine tekstbestanden die bij een bezoek aan een website op uw computer, tablet of smartphone kunnen worden opgeslagen. Via cookies kan informatie over het gebruik van een website worden verzameld of bewaard.",
      "2. Welke soorten cookies gebruiken wij?",
      "Fidial kan gebruikmaken van functionele cookies, analytische cookies, marketing- of trackingcookies en cookies van derden, voor zover dat past bij het gebruik van de website.",
      "Functionele cookies zijn noodzakelijk om de website goed te laten werken en om basisfuncties mogelijk te maken. Voor deze cookies is doorgaans geen toestemming nodig.",
      "Analytische cookies gebruiken wij om inzicht te krijgen in het gebruik en de prestaties van de website. Voor analytische cookies die geen of slechts geringe gevolgen hebben voor de privacy is in beginsel geen toestemming nodig. Als analytische cookies verder gaan dan dat, vragen wij daarvoor vooraf toestemming.",
      "Marketing- of trackingcookies kunnen worden gebruikt om surfgedrag te volgen, om content of communicatie te personaliseren en om het effect van campagnes of nieuwsbrieven te meten. Voor dit soort cookies vragen wij vooraf toestemming, tenzij de wet dat niet vereist.",
      "Cookies van derden kunnen worden geplaatst wanneer wij gebruikmaken van diensten van externe partijen, bijvoorbeeld voor embedded content, analyse, communicatie of marketingfunctionaliteiten. Voor zover deze cookies niet strikt noodzakelijk zijn, worden zij alleen geplaatst na toestemming, indien dat wettelijk vereist is.",
      "3. Waarvoor gebruiken wij cookies?",
      "Fidial gebruikt cookies onder meer om de website technisch goed te laten functioneren, voorkeuren op te slaan, het gebruik van de website te analyseren, de website te verbeteren, statistieken op te stellen, marketing en communicatie te ondersteunen en de inhoud van de website beter af te stemmen op bezoekers.",
      "4. Toestemming",
      "Voor cookies die niet strikt noodzakelijk zijn of die meer dan geringe gevolgen kunnen hebben voor uw privacy, vragen wij vooraf toestemming via de cookiebanner of een vergelijkbare toestemmingsvoorziening.",
      "U kunt uw toestemming op ieder moment intrekken of uw voorkeuren aanpassen, voor zover de website die mogelijkheid technisch biedt. Ook kunt u cookies verwijderen of blokkeren via de instellingen van uw browser.",
      "5. Cookies beheren of verwijderen",
      "U kunt cookies via uw browserinstellingen weigeren, verwijderen of laten blokkeren. Ook kunt u instellen dat u een melding krijgt voordat een cookie wordt geplaatst.",
      "Houd er rekening mee dat het uitschakelen van cookies ertoe kan leiden dat bepaalde onderdelen van de website niet of minder goed functioneren.",
      "6. Verwerking van persoonsgegevens via cookies",
      "Voor zover via cookies persoonsgegevens worden verwerkt, gebeurt dit in overeenstemming met ons privacybeleid en de toepasselijke privacywetgeving.",
      "Als cookies persoonsgegevens verzamelen voor analyse, marketing of communicatie, verwerkt Fidial deze gegevens alleen voor zover daarvoor een geldige grondslag bestaat, zoals toestemming of een gerechtvaardigd belang, binnen de grenzen van de wet.",
      "7. Derden",
      "Als Fidial gebruikmaakt van diensten van derden waarbij cookies of vergelijkbare technieken kunnen worden geplaatst, zorgt Fidial waar nodig voor passende afspraken. In deze cookieverklaring noemen wij bewust geen specifieke leveranciers. Indien derden zelfstandig persoonsgegevens verwerken, kan daarnaast het privacy- of cookiebeleid van die derde partij van toepassing zijn.",
      "8. Wijzigingen",
      "Fidial kan deze cookieverklaring van tijd tot tijd wijzigen, bijvoorbeeld naar aanleiding van wijzigingen in wetgeving, de website of de gebruikte technieken. De meest actuele versie wordt gepubliceerd op de website.",
      "9. Vragen",
      "Heeft u vragen over deze cookieverklaring of over het gebruik van cookies op de website van Fidial? Neem dan contact op via cs@fidial.nl of privacy@fidial.nl.",
    ],
  },
  disclaimer: {
    mode: "single",
    text: [
      "Disclaimer",
      "Op het gebruik van deze website (www.fidial.nl) zijn onderstaande gebruiksvoorwaarden van toepassing. Door gebruik te maken van deze website, wordt u geacht kennis te hebben genomen van de gebruiksvoorwaarden en deze te hebben aanvaard.",
      "Gebruik van informatie",
      "Fidial streeft ernaar op deze website altijd juiste en actuele informatie aan te bieden. Hoewel deze informatie met de grootst mogelijke zorgvuldigheid is samengesteld, staat Fidial niet in voor de volledigheid, juistheid of actualiteit van de informatie.",
      "De juridische informatie op de website is van algemene aard en kan niet worden beschouwd als een vervanging van juridisch advies.",
      "Aan de informatie kunnen geen rechten worden ontleend. Fidial aanvaardt geen aansprakelijkheid voor schade die voortvloeit uit het gebruik van de informatie of de website en evenmin voor het niet goed functioneren van de website.",
      "Op basis van het verzenden en ontvangen van informatie via de website of via e-mail kan niet zonder meer een relatie tussen Fidial en de gebruiker van de website ontstaan.",
      "E-mail",
      "Fidial garandeert niet dat aan haar gezonden e-mails tijdig worden ontvangen of verwerkt, omdat tijdige ontvangst van e-mails niet kan worden gegarandeerd.",
      "Ook de veiligheid van het e-mailverkeer kan niet volledig worden gegarandeerd door de hieraan verbonden veiligheidsrisico’s. Door zonder encryptie of wachtwoordbeveiliging per e-mail met ons te corresponderen, accepteert u dit risico.",
      "Hyperlinks",
      "Deze website kan hyperlinks bevatten naar websites van derden. Fidial heeft geen invloed op websites van derden en is niet verantwoordelijk voor de beschikbaarheid of inhoud daarvan.",
      "Fidial aanvaardt dan ook geen aansprakelijkheid voor schade die voortvloeit uit het gebruik van websites van derden.",
      "Intellectuele eigendomsrechten",
      "Alle publicaties en uitingen van Fidial zijn beschermd door auteursrecht en andere intellectuele eigendomsrechten.",
      "Behalve voor persoonlijk en niet commercieel gebruik, mag niets uit deze publicaties en uitingen op welke manier dan ook worden verveelvoudigd, gekopieerd of op een andere manier openbaar worden gemaakt, zonder dat daar vooraf schriftelijke toestemming voor is gegeven.",
      "Overig",
      "Deze disclaimer kan van tijd tot tijd wijzigen.",
    ],
  },
  privacy: {
    mode: "single",
    text: [
      "Privacybeleid Fidial",
      "Laatst bijgewerkt: 14 april 2026",
      "Fidial respecteert uw privacy en verwerkt persoonsgegevens in overeenstemming met de Algemene verordening gegevensbescherming (AVG) en overige toepasselijke privacywetgeving.",
      "1. Wie is verantwoordelijk voor de verwerking van uw persoonsgegevens?",
      "Fidial is de verwerkingsverantwoordelijke voor de persoonsgegevens zoals beschreven in deze privacyverklaring.",
      "Bedrijfsnaam: Fidial",
      "Adres: Louise Marie Loeberplantsoen 4, 1062 DD Amsterdam",
      "E-mailadres: cs@fidial.nl",
      "Privacycontact: privacy@fidial.nl",
      "Telefoonnummer: 020 - 233 86 39",
      "KvK-nummer: 86233947",
      "2. Welke persoonsgegevens verwerken wij?",
      "Fidial kan persoonsgegevens verwerken van klanten, potentiële klanten, leveranciers, websitebezoekers, contactpersonen en andere betrokkenen met wie wij zakelijk contact hebben.",
      "Afhankelijk van de situatie kunnen wij onder meer de volgende persoonsgegevens verwerken: naam, bedrijfsnaam, adresgegevens, telefoonnummer, e-mailadres, betaalgegevens, correspondentie, gegevens over opdrachten en dienstverlening, factuurgegevens, gegevens die nodig zijn voor administratieve, fiscale of salarisgerelateerde dienstverlening en gegevens die u zelf aan ons verstrekt via e-mail, telefoon, formulieren of de website.",
      "Voor zover dit noodzakelijk is voor onze dienstverlening of om te voldoen aan een wettelijke verplichting, kunnen wij ook meer gevoelige persoonsgegevens verwerken, zoals BSN, loon- en salarisgegevens, identificatiegegevens en kopieën of gegevens uit identiteitsdocumenten. Dit gebeurt uitsluitend voor zover dat wettelijk is toegestaan en passend is bij de opdracht.",
      "3. Voor welke doeleinden verwerken wij persoonsgegevens?",
      "Fidial verwerkt persoonsgegevens uitsluitend voor duidelijke en gerechtvaardigde doeleinden, zoals het aangaan en uitvoeren van overeenkomsten, het onderhouden van contact met klanten en andere relaties, het opstellen en verwerken van administraties, aangiften, salarisadministratie, rapportages en aanverwante dienstverlening, het versturen van offertes, facturen en overige administratieve documenten, het voldoen aan wettelijke verplichtingen, het verbeteren van de website, dienstverlening en communicatie, het behandelen van vragen, verzoeken, klachten of privacyverzoeken en het beveiligen van systemen, gegevens en processen.",
      "Fidial kan persoonsgegevens daarnaast gebruiken voor nieuwsbrieven, marketing, analyse van websitegebruik en communicatie over de dienstverlening, voor zover dit is toegestaan op basis van toestemming of een gerechtvaardigd belang en binnen de grenzen van de toepasselijke wetgeving.",
      "4. Op welke grondslagen verwerken wij persoonsgegevens?",
      "Fidial verwerkt persoonsgegevens alleen wanneer daarvoor een geldige wettelijke grondslag bestaat. In de praktijk zal dat meestal één of meer van de volgende grondslagen zijn: de uitvoering van een overeenkomst, het voldoen aan een wettelijke verplichting, een gerechtvaardigd belang van Fidial, bijvoorbeeld voor relatiebeheer, interne administratie, IT-beveiliging, marketing of het verbeteren van dienstverlening, mits uw privacybelangen niet zwaarder wegen, of uw toestemming, voor zover deze wettelijk vereist is.",
      "5. Hoe lang bewaren wij persoonsgegevens?",
      "Fidial bewaart persoonsgegevens niet langer dan noodzakelijk is voor het doel waarvoor zij zijn verzameld, tenzij een wettelijke bewaartermijn of andere wettelijke verplichting geldt.",
      "Voor administratieve, fiscale, salaris- en dossiergegevens hanteert Fidial de bewaartermijnen die wettelijk verplicht zijn of die noodzakelijk zijn voor een zorgvuldige uitvoering en afwikkeling van de dienstverlening. Wanneer geen specifieke wettelijke bewaartermijn geldt, bewaren wij persoonsgegevens niet langer dan redelijkerwijs nodig is voor het doel waarvoor de gegevens zijn verkregen.",
      "6. Met wie delen wij persoonsgegevens?",
      "Fidial verkoopt persoonsgegevens niet aan derden. Persoonsgegevens worden alleen gedeeld met derden als dat nodig is voor de uitvoering van de overeenkomst, voor de ondersteuning van de bedrijfsvoering of om te voldoen aan een wettelijke verplichting.",
      "Daarbij kan onder meer worden gedacht aan aanbieders van boekhoud-, administratie-, salaris-, cloud-, e-mail-, formulier-, plannings- en IT-oplossingen, hostingpartijen, betaaldienstverleners, externe adviseurs en overheidsinstanties, voor zover dat noodzakelijk en rechtmatig is. Fidial noemt in deze privacyverklaring bewust geen specifieke leveranciers, maar draagt er zorg voor dat passende afspraken worden gemaakt wanneer derden persoonsgegevens in opdracht verwerken.",
      "Als derden in opdracht van Fidial persoonsgegevens verwerken, sluit Fidial waar nodig een verwerkersovereenkomst of maakt zij andere passende contractuele afspraken.",
      "7. Doorgifte buiten de Europese Economische Ruimte (EER)",
      "Fidial geeft in beginsel geen persoonsgegevens door buiten de Europese Economische Ruimte (EER).",
      "8. Cookies en websitegebruik",
      "Fidial kan op de website gebruikmaken van cookies en vergelijkbare technieken. Informatie hierover is opgenomen in de cookieverklaring. Voor zover wettelijk vereist, vraagt Fidial vooraf toestemming voor niet-noodzakelijke cookies.",
      "9. Beveiliging van persoonsgegevens",
      "Fidial neemt passende technische en organisatorische maatregelen om persoonsgegevens te beveiligen tegen verlies, misbruik, onbevoegde toegang, ongewenste openbaarmaking en ongeoorloofde wijziging.",
      "Hieronder kunnen onder meer vallen: toegangsbeveiliging, sterke wachtwoorden, multifactor-authenticatie waar passend, versleuteling waar passend, back-ups, software-updates en beperking van toegang tot gegevens tot personen die deze nodig hebben voor hun werkzaamheden.",
      "10. Uw privacyrechten",
      "U heeft, voor zover de wet u deze rechten toekent, het recht op inzage, rectificatie, verwijdering, beperking van verwerking, overdraagbaarheid van gegevens en het recht om bezwaar te maken tegen bepaalde verwerkingen van persoonsgegevens.",
      "Wanneer de verwerking is gebaseerd op toestemming, heeft u het recht die toestemming op ieder moment in te trekken. Dat laat de rechtmatigheid van de verwerking vóór de intrekking onverlet.",
      "U kunt een verzoek sturen naar privacy@fidial.nl of cs@fidial.nl. Om misbruik te voorkomen kan Fidial u vragen om uw identiteit nader te verifiëren.",
      "11. Klachten",
      "Als u vindt dat Fidial niet correct omgaat met uw persoonsgegevens, verzoeken wij u eerst contact met ons op te nemen zodat wij kunnen proberen dit op te lossen.",
      "Daarnaast heeft u het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens.",
      "12. Verplichte verstrekking en gevolgen van niet verstrekken",
      "In sommige gevallen is het verstrekken van persoonsgegevens noodzakelijk om een overeenkomst met u uit te voeren of om te voldoen aan een wettelijke verplichting. Als u de benodigde gegevens niet verstrekt, kan Fidial mogelijk haar dienstverlening niet of niet volledig uitvoeren.",
      "13. Geautomatiseerde besluitvorming en profilering",
      "Fidial neemt geen besluiten die uitsluitend zijn gebaseerd op geautomatiseerde verwerking en die voor u rechtsgevolgen hebben of u anderszins in aanmerkelijke mate treffen.",
      "Voor zover Fidial marketing, nieuwsbrieven, websiteanalyse of vergelijkbare vormen van segmentatie toepast, gebeurt dit niet op een wijze die leidt tot uitsluitend geautomatiseerde besluitvorming met rechtsgevolgen of vergelijkbare significante gevolgen voor betrokkenen.",
      "14. Wijzigingen in deze privacyverklaring",
      "Fidial kan deze privacyverklaring van tijd tot tijd wijzigen, bijvoorbeeld naar aanleiding van wijzigingen in wetgeving, dienstverlening of interne processen. De meest actuele versie wordt gepubliceerd op de website.",
      "15. Contact",
      "Voor vragen over deze privacyverklaring of over de verwerking van persoonsgegevens kunt u contact opnemen via privacy@fidial.nl, cs@fidial.nl of telefonisch via 020 - 233 86 39.",
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

  const title = policy?.text?.[0] ?? "";
  const intro = policy?.text?.[1] ?? "";
  const contentLines = policy?.text?.slice(2) ?? [];
  const sections = useMemo(() => buildPolicySections(contentLines), [contentLines]);

  if (!policy) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-white/10 bg-slate-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-white/10 bg-slate-950/95 px-6 py-5 backdrop-blur sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="text-xs uppercase tracking-[0.22em] text-emerald-300">Beleidsdocument</div>
              <h3 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">{title}</h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{intro}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
            >
              Sluiten
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-900/60 px-6 py-6 sm:px-8">
          <div className="space-y-4">
            {sections.map((section, index) => (
              <section
                key={`${section.heading ?? "section"}-${index}`}
                className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-slate-950/10"
              >
                {section.heading && (
                  <div className="border-b border-white/10 pb-3">
                    <h4 className="text-lg font-semibold text-white">{section.heading}</h4>
                  </div>
                )}

                <div className={section.heading ? "mt-4 space-y-3" : "space-y-3"}>
                  {section.body.map((line, lineIndex) =>
                    line.startsWith("- ") ? (
                      <div key={lineIndex} className="flex items-start gap-3">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        <p className="text-sm leading-7 text-slate-300">{line.replace(/^- /, "")}</p>
                      </div>
                    ) : (
                      <p key={lineIndex} className="text-sm leading-7 text-slate-300">
                        {line}
                      </p>
                    )
                  )}
                </div>
              </section>
            ))}
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
