"use strict";

const nodemailer = require("nodemailer");

const FROM = process.env.MAIL_FROM || "Impact Festival Team <info@theimpactfestival.com>";
const REPLY_TO = process.env.MAIL_REPLY_TO || "info@theimpactfestival.com";
const ADMIN_NOTIFY = process.env.MAIL_NOTIFY || "info@theimpactfestival.com";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  if (!user || !pass) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "1",
    auth: { user: user, pass: pass },
  });
  return transporter;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function groupLabel(record) {
  if (record.group_size === "more" && record.group_size_exact) {
    return String(record.group_size_exact);
  }
  return String(record.group_size || "1");
}

function villageLabel(record) {
  if (record.ancestral_village === "__other__") {
    return record.ancestral_village_other || "Other";
  }
  if (record.ancestral_village === "__notsure__") {
    return "Not sure — please help me find it";
  }
  return record.ancestral_village || "";
}

function partySummary(record) {
  const raw = record.party_members || "";
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) {
      return parsed.map(function (m, i) {
        const parts = [m.name || "(name not given)"];
        if (m.age) parts.push("age " + m.age);
        if (m.gender) parts.push(m.gender);
        if (m.relationship) parts.push(m.relationship);
        return (i + 2) + ". " + parts.join(", ");
      }).join("\n");
    }
  } catch (err) {
    /* plain text fallback */
  }
  return String(raw);
}

function confirmationHtml(record) {
  const name = esc(record.name || "Guest");
  const rows = [
    ["Name", record.name],
    ["Phone", record.phone],
    ["Email", record.email],
    ["City", record.city],
    ["Country of birth", record.country_of_birth || record.country_of_origin],
    ["Need India visa", record.needs_visa],
    ["Group size", groupLabel(record)],
    ["Ancestral village", villageLabel(record)],
  ];
  const party = partySummary(record);
  if (party) rows.push(["Travelling with", party]);
  if (record.notes) rows.push(["Notes", record.notes]);

  const table = rows
    .filter(function (r) { return r[1]; })
    .map(function (r) {
      return "<tr><td style=\"padding:8px 12px;border-bottom:1px solid #e4dcc9;color:#55656f;width:38%;\">" +
        esc(r[0]) + "</td><td style=\"padding:8px 12px;border-bottom:1px solid #e4dcc9;white-space:pre-wrap;\">" +
        esc(r[1]) + "</td></tr>";
    })
    .join("");

  return (
    '<div style="font-family:Georgia,serif;color:#22303a;max-width:640px;margin:0 auto;">' +
    '<div style="height:8px;background:#c9a24b;"></div>' +
    '<div style="padding:28px 24px;">' +
    "<h1 style=\"font-size:28px;margin:0 0 8px;\">You're registered</h1>" +
    "<p style=\"color:#55656f;font-size:16px;line-height:1.5;\">Salaam " + name +
    ", thank you for signing up for <strong>Impact Festival 2026</strong>.</p>" +
    "<p style=\"color:#55656f;font-size:16px;line-height:1.5;\">" +
    "The festival is <strong>December 24&ndash;27, 2026</strong> in Sidhpur, Gujarat. " +
    "This confirmation means we have your interest on file &mdash; it is not a payment or travel booking. " +
    "We will email you with program updates as details are finalized.</p>" +
    '<table style="width:100%;border-collapse:collapse;margin:22px 0;font-family:Arial,sans-serif;font-size:14px;">' +
    table +
    "</table>" +
    "<p style=\"color:#55656f;font-size:15px;line-height:1.5;\">Questions? Reply to this email or write " +
    '<a href="mailto:info@theimpactfestival.com" style="color:#b9793f;">info@theimpactfestival.com</a>.</p>' +
    "<p style=\"color:#55656f;font-size:14px;margin-top:28px;\">Impact Festival Team</p>" +
    "</div></div>"
  );
}

function confirmationText(record) {
  const lines = [
    "You're registered for Impact Festival 2026",
    "",
    "Salaam " + (record.name || "Guest") + ",",
    "",
    "Thank you for signing up. The festival is December 24-27, 2026 in Sidhpur, Gujarat.",
    "This confirmation is not a payment or travel booking — we will email updates as details are finalized.",
    "",
    "Name: " + (record.name || ""),
    "Phone: " + (record.phone || ""),
    "Email: " + (record.email || ""),
    "City: " + (record.city || ""),
    "Country of birth: " + (record.country_of_birth || record.country_of_origin || ""),
    "Need India visa: " + (record.needs_visa || ""),
    "Group size: " + groupLabel(record),
    "Ancestral village: " + villageLabel(record),
  ];
  const party = partySummary(record);
  if (party) {
    lines.push("Travelling with:");
    lines.push(party);
  }
  if (record.notes) lines.push("Notes: " + record.notes);
  lines.push("", "Questions: info@theimpactfestival.com", "", "Impact Festival Team");
  return lines.join("\n");
}

async function sendMail(options) {
  const tx = getTransporter();
  if (!tx) {
    return { sent: false, reason: "smtp not configured" };
  }
  await tx.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
  return { sent: true };
}

async function sendRegistrationEmails(record) {
  const result = { confirmation: false, notify: false, error: "" };
  const email = String(record.email || "").trim();
  if (!email) {
    result.error = "no registrant email";
    return result;
  }

  try {
    const conf = await sendMail({
      to: email,
      subject: "You're registered — Impact Festival 2026 (Dec 24-27)",
      text: confirmationText(record),
      html: confirmationHtml(record),
    });
    result.confirmation = !!conf.sent;
    if (!conf.sent) result.error = conf.reason || "confirmation not sent";
  } catch (err) {
    result.error = err.message || String(err);
    return result;
  }

  try {
    const notify = await sendMail({
      to: ADMIN_NOTIFY,
      subject: "New registration: " + (record.name || "Guest"),
      text: confirmationText(record),
      html: confirmationHtml(record),
    });
    result.notify = !!notify.sent;
  } catch (err) {
    if (!result.error) result.error = "notify failed: " + (err.message || String(err));
  }

  return result;
}

function ideaText(record) {
  return [
    "IMPACT FESTIVAL 2026 - IDEA",
    "",
    "From: " + (record.name || "Anonymous"),
    "Category: " + (record.topic || "Other"),
    "",
    record.idea || "",
  ].join("\n");
}

function ideaHtml(record) {
  return (
    '<div style="font-family:Georgia,serif;color:#22303a;max-width:640px;margin:0 auto;">' +
    '<div style="height:8px;background:#c9a24b;"></div>' +
    '<div style="padding:28px 24px;">' +
    '<h1 style="font-size:24px;margin:0 0 8px;">New festival idea</h1>' +
    '<p style="color:#55656f;font-size:16px;line-height:1.5;">Someone submitted an idea from theimpactfestival.com.</p>' +
    '<table style="width:100%;border-collapse:collapse;margin:22px 0;font-family:Arial,sans-serif;font-size:14px;">' +
    "<tr><td style=\"padding:8px 12px;border-bottom:1px solid #e4dcc9;color:#55656f;width:38%;\">From</td>" +
    '<td style="padding:8px 12px;border-bottom:1px solid #e4dcc9;">' + esc(record.name || "Anonymous") + "</td></tr>" +
    "<tr><td style=\"padding:8px 12px;border-bottom:1px solid #e4dcc9;color:#55656f;\">Category</td>" +
    '<td style="padding:8px 12px;border-bottom:1px solid #e4dcc9;">' + esc(record.topic || "Other") + "</td></tr>" +
    "<tr><td style=\"padding:8px 12px;border-bottom:1px solid #e4dcc9;color:#55656f;vertical-align:top;\">Idea</td>" +
    '<td style="padding:8px 12px;border-bottom:1px solid #e4dcc9;white-space:pre-wrap;">' + esc(record.idea || "") + "</td></tr>" +
    "</table>" +
    '<p style="color:#55656f;font-size:14px;margin-top:28px;">Impact Festival Team</p>' +
    "</div></div>"
  );
}

async function sendIdeaEmail(record) {
  const name = String(record.name || "Anonymous").trim() || "Anonymous";
  const topic = String(record.topic || "Other").trim() || "Other";
  const sent = await sendMail({
    to: ADMIN_NOTIFY,
    subject: "Festival idea: " + topic + " \u2014 " + name,
    text: ideaText(record),
    html: ideaHtml(record),
  });
  return sent;
}

module.exports = {
  sendRegistrationEmails: sendRegistrationEmails,
  sendIdeaEmail: sendIdeaEmail,
  getTransporter: getTransporter,
};
