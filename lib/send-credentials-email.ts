"use client"

import { escapeContactHtml } from "@/lib/contact-validation"
import pb from "@/lib/pb"

export async function sendCredentialsEmail(params: {
  email: string
  name: string
  password: string
  caseName?: string
  caseUrl?: string
}): Promise<void> {
  const email = escapeContactHtml(params.email)
  const name = escapeContactHtml(params.name)
  const password = escapeContactHtml(params.password)
  const caseName = params.caseName
    ? escapeContactHtml(params.caseName)
    : undefined
  const caseUrl = params.caseUrl
    ? escapeContactHtml(new URL(params.caseUrl, window.location.origin).href)
    : undefined
  const loginUrl = `${window.location.origin}/login`

  const caseLink = caseUrl
    ? `<p style="margin:0 0 12px"><a href="${caseUrl}">${caseUrl}</a></p>`
    : ""

  const html = [
    "<div style='font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px'>",
    "<h2 style='color:#1a1a1a;margin:0 0 16px'>Welcome to DSC</h2>",
    `<p>Dear ${name},</p>`,
    "<p>An account has been created for you on the DSC platform. You can now log in with the credentials below:</p>",
    "<table style='border-collapse:collapse;margin:16px 0'>",
    `<tr><td style='padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280'>Email</td><td style='padding:8px 12px;border:1px solid #e5e7eb;font-weight:600'>${email}</td></tr>`,
    `<tr><td style='padding:8px 12px;border:1px solid #e5e7eb;color:#6b7280'>Password</td><td style='padding:8px 12px;border:1px solid #e5e7eb;font-weight:600'>${password}</td></tr>`,
    "</table>",
    caseName
      ? `<p style="margin:0 0 12px">Your case: <strong>${caseName}</strong></p>`
      : "",
    caseLink,
    `<p style="margin:0 0 12px">Login page: <a href="${loginUrl}">${loginUrl}</a></p>`,
    "<p style='color:#6b7280;font-size:13px'>For security, please change your password after your first login.</p>",
    "</div>",
  ].join("\n")

  const response = await fetch("/api/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pb.authStore.token}`,
    },
    body: JSON.stringify({
      from: "admin@dsc.ac",
      to: params.email,
      subject: caseName
        ? `Your DSC account for case "${caseName}"`
        : "Your DSC account credentials",
      html,
    }),
  })

  if (!response.ok) {
    const { error } = await response.json()
    throw new Error(error || "Failed to send credentials email")
  }
}
