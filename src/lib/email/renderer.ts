import {
  NOTIFICATION_TEMPLATES,
  type NotificationTemplate,
} from "@/lib/notifications/templates";

/**
 * Sample data for each template type, used for preview rendering.
 */
export const TEMPLATE_SAMPLE_DATA: Record<string, Record<string, string>> = {
  ORDER_CONFIRMATION: {
    customer_name: "Sarah Johnson",
    order_number: "AUR-20260327-001",
    item_count: "8",
    total: "$59.99",
  },
  ORDER_SHIPPED: {
    customer_name: "Sarah Johnson",
    order_number: "AUR-20260327-001",
    tracking_url: "https://track.example.com/1Z999AA10123456784",
    estimated_delivery: "April 2, 2026",
  },
  DELIVERY_CONFIRMED: {
    order_number: "AUR-20260327-001",
    delivery_address: "123 Main St, Austin, TX",
  },
  SUBSCRIPTION_REMINDER: {
    customer_name: "Sarah Johnson",
    box_size: "Voyager",
    next_delivery_date: "April 5, 2026",
    cutoff_date: "April 1, 2026",
  },
  PAYMENT_FAILED: {
    customer_name: "Sarah Johnson",
    amount: "$84.99",
    box_size: "Voyager",
    retry_days: "3",
  },
  WELCOME_EMAIL: {
    customer_name: "Sarah Johnson",
  },
  DEALER_APPLICATION: {
    applicant_name: "John Smith",
    applicant_email: "john@acmecorp.com",
    organization_name: "Acme Corporation",
  },
  COMMISSION_EARNED: {
    dealer_name: "John Smith",
    commission_amount: "$12.75",
    order_number: "AUR-20260327-002",
    pending_balance: "$145.50",
  },
  LOW_STOCK_ALERT: {
    product_name: "Aura Premium Chicken Bowl",
    sku: "AUR-CHK-001",
    current_stock: "15",
    safety_stock: "50",
  },
};

/**
 * Extract variable names from a template string.
 */
export function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, "")))];
}

/**
 * Get all variables used in a template (subject + body).
 */
export function getTemplateVariables(templateKey: string): string[] {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  if (!template) return [];
  const subjectVars = extractVariables(template.subject);
  const bodyVars = extractVariables(template.body);
  return [...new Set([...subjectVars, ...bodyVars])];
}

/**
 * Replace {{variable}} placeholders in text with provided values.
 */
function replacePlaceholders(
  text: string,
  variables: Record<string, string>
): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Wrap rendered body text into a branded, responsive email HTML layout.
 */
function wrapInEmailHtml(subject: string, bodyText: string): string {
  const bodyParagraphs = bodyText
    .split(/\n\n|\n/)
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #374151;">${p}</p>`
    )
    .join("\n            ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; }
    a { color: #059669; text-decoration: none; }
    a:hover { text-decoration: underline; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 16px !important; }
      .email-body { padding: 24px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" class="email-container" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          <!-- Emerald Accent Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); height: 4px; border-radius: 12px 12px 0 0;"></td>
          </tr>
          <!-- Logo Header -->
          <tr>
            <td style="background-color: #111827; padding: 28px 32px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td>
                    <span style="font-size: 28px; font-weight: 800; color: #10b981; letter-spacing: 2px;">AURA</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td class="email-body" style="background-color: #ffffff; padding: 40px 32px;">
              <h1 style="margin: 0 0 24px 0; font-size: 22px; font-weight: 700; color: #111827; line-height: 1.3;">${subject}</h1>
              ${bodyParagraphs}
            </td>
          </tr>
          <!-- CTA Section -->
          <tr>
            <td style="background-color: #ffffff; padding: 0 32px 40px 32px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #059669; border-radius: 8px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://aura.com"}" style="display: inline-block; padding: 14px 32px; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none;">Visit Your Dashboard</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; color: #6b7280;">
                      Aura - Premium Meal Subscription
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af;">
                      You're receiving this because you have an account with Aura.
                    </p>
                    <p style="margin: 0; font-size: 12px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://aura.com"}/account/notifications" style="color: #059669; text-decoration: underline;">Manage Preferences</a>
                      &nbsp;&bull;&nbsp;
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://aura.com"}/unsubscribe" style="color: #059669; text-decoration: underline;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Strip HTML tags to produce a plain text version of the email.
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&bull;/g, "*")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Render an email template with variables, returning subject, HTML, and plain text.
 */
export function renderEmailTemplate(
  templateKey: string,
  variables: Record<string, string>
): {
  subject: string;
  html: string;
  text: string;
} {
  const template: NotificationTemplate | undefined =
    NOTIFICATION_TEMPLATES[templateKey];

  if (!template) {
    throw new Error(`Email template "${templateKey}" not found`);
  }

  const subject = replacePlaceholders(template.subject, variables);
  const bodyText = replacePlaceholders(template.body, variables);
  const html = wrapInEmailHtml(subject, bodyText);
  const text = `${subject}\n\n${bodyText}\n\n---\nAura - Premium Meal Subscription\nManage preferences: ${process.env.NEXT_PUBLIC_APP_URL || "https://aura.com"}/account/notifications`;

  return { subject, html, text };
}

/**
 * Render a template with sample data for preview purposes.
 */
export function renderEmailPreview(templateKey: string): {
  subject: string;
  html: string;
  text: string;
} {
  const sampleData = TEMPLATE_SAMPLE_DATA[templateKey] || {};
  return renderEmailTemplate(templateKey, sampleData);
}
