import type { Handler } from "@netlify/functions";
import nodemailer from "nodemailer";

type Payload = {
  Voornaam?: string;
  Achternaam?: string;
  "E-mailadres"?: string;
  Telefoonnummer?: string;
  Bedrijfsnaam?: string;
  Functie?: string;
  aanvraagtype?: string;
  contactintentie?: string;
  "Gewenste ingangsdatum"?: string;
  "Huidig softwarepakket"?: string;
  "Omschrijf kort je situatie of vraag."?: string;
};

const requiredEnv = [
  "STRATO_SMTP_HOST",
  "STRATO_SMTP_PORT",
  "STRATO_SMTP_USER",
  "STRATO_SMTP_PASS",
] as const;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function requireEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    requireEnv();

    const data = JSON.parse(event.body || "{}") as Payload;

    const firstName = (data.Voornaam || "").trim();
    const lastName = (data.Achternaam || "").trim();
    const fullName = `${firstName} ${lastName}`.trim() || "Onbekende afzender";
    const customerEmail = (data["E-mailadres"] || "").trim();
    const phone = (data.Telefoonnummer || "").trim();
    const company = (data.Bedrijfsnaam || "").trim();
    const role = (data.Functie || "").trim();
    const requestType = (data.aanvraagtype || "").trim();
    const contactIntent = (data.contactintentie || "").trim();
    const startDate = (data["Gewenste ingangsdatum"] || "").trim();
    const software = (data["Huidig softwarepakket"] || "").trim();
    const message = (data["Omschrijf kort je situatie of vraag."] || "").trim();

    if (!customerEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "E-mailadres is verplicht." }),
      };
    }

    const transporter = nodemailer.createTransport({
      host: process.env.STRATO_SMTP_HOST,
      port: Number(process.env.STRATO_SMTP_PORT),
      secure: Number(process.env.STRATO_SMTP_PORT) === 465,
      auth: {
        user: process.env.STRATO_SMTP_USER,
        pass: process.env.STRATO_SMTP_PASS,
      },
    });

    const safeMessage = escapeHtml(message || "-").replace(/\n/g, "<br/>");

    const internalText = [
      "Nieuwe Fidial aanvraag",
      "",
      `Naam: ${fullName}`,
      `E-mail: ${customerEmail}`,
      `Telefoonnummer: ${phone || "-"}`,
      `Bedrijfsnaam: ${company || "-"}`,
      `Functie: ${role || "-"}`,
      `Aanvraagtype: ${requestType || "-"}`,
      `Contactintentie: ${contactIntent || "-"}`,
      `Gewenste ingangsdatum: ${startDate || "-"}`,
      `Huidig softwarepakket: ${software || "-"}`,
      "",
      "Toelichting:",
      message || "-",
    ].join("\n");

    const fromAddress = process.env.STRATO_SMTP_USER || "cs@fidial.nl";

    await transporter.sendMail({
      from: `"Fidial" <${fromAddress}>`,
      to: "cs@fidial.nl",
      replyTo: customerEmail,
      subject: `Nieuwe aanvraag via fidial.nl - ${fullName}`,
      text: internalText,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2>Nieuwe aanvraag via fidial.nl</h2>
          <p><strong>Naam:</strong> ${escapeHtml(fullName)}</p>
          <p><strong>E-mail:</strong> ${escapeHtml(customerEmail)}</p>
          <p><strong>Telefoonnummer:</strong> ${escapeHtml(phone || "-")}</p>
          <p><strong>Bedrijfsnaam:</strong> ${escapeHtml(company || "-")}</p>
          <p><strong>Functie:</strong> ${escapeHtml(role || "-")}</p>
          <p><strong>Aanvraagtype:</strong> ${escapeHtml(requestType || "-")}</p>
          <p><strong>Contactintentie:</strong> ${escapeHtml(contactIntent || "-")}</p>
          <p><strong>Gewenste ingangsdatum:</strong> ${escapeHtml(startDate || "-")}</p>
          <p><strong>Huidig softwarepakket:</strong> ${escapeHtml(software || "-")}</p>
          <p><strong>Toelichting:</strong><br/>${safeMessage}</p>
        </div>
      `,
    });

    await transporter.sendMail({
      from: `"Fidial" <${fromAddress}>`,
      to: customerEmail,
      subject: "Wij hebben uw aanvraag ontvangen - Fidial",
      text: [
        `Beste ${fullName},`,
        "",
        "Bedankt voor uw aanvraag bij Fidial.",
        "Wij hebben uw bericht goed ontvangen en nemen binnen 1 werkdag contact met u op.",
        "",
        "Met vriendelijke groet,",
        "Fidial",
        "cs@fidial.nl",
        "020 - 233 86 39",
      ].join("\n"),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <p>Beste ${escapeHtml(fullName)},</p>
          <p>Bedankt voor uw aanvraag bij Fidial.</p>
          <p>Wij hebben uw bericht goed ontvangen en nemen <strong>binnen 1 werkdag</strong> contact met u op.</p>
          <p>Met vriendelijke groet,<br/><strong>Fidial</strong><br/>cs@fidial.nl<br/>020 - 233 86 39</p>
        </div>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    console.error("send-contact error", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Mail verzenden mislukt." }),
    };
  }
};
