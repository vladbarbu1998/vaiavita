import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  language: 'ro' | 'en';
  recaptchaToken?: string;
}

// Verify reCAPTCHA token with Google
async function verifyRecaptcha(token: string): Promise<{ success: boolean; score?: number }> {
  const secretKey = Deno.env.get("RECAPTCHA_SECRET_KEY");
  if (!secretKey) {
    console.log('RECAPTCHA_SECRET_KEY not configured, skipping verification');
    return { success: true };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secretKey}&response=${token}`,
    });
    
    const data = await response.json();
    console.log('reCAPTCHA verification result:', JSON.stringify(data));
    
    // For v3, score >= 0.5 is typically considered human
    // For v2, just check success
    return { 
      success: data.success && (data.score === undefined || data.score >= 0.5),
      score: data.score 
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== send-contact-email function invoked ===');
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ContactEmailRequest = await req.json();
    console.log('Request body:', JSON.stringify({ ...body, recaptchaToken: body.recaptchaToken ? '[PRESENT]' : '[MISSING]' }));

    const { name, email, phone, subject, message, language, recaptchaToken } = body;
    const isRo = language === 'ro';

    // Verify reCAPTCHA token if provided
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken);
      if (!recaptchaResult.success) {
        console.log('reCAPTCHA verification failed');
        return new Response(
          JSON.stringify({ success: false, error: 'reCAPTCHA verification failed' }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log('reCAPTCHA verified successfully, score:', recaptchaResult.score);
    } else {
      console.log('No reCAPTCHA token provided');
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.log('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const logoUrl = 'https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products/logo-mail-craciun.png';
    const adminEmail = 'office@vaiavita.com';

    // Email to admin
    const adminEmailHtml = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mesaj nou contact - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e8f4f2 0%, #dceeed 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #038578 50%, #04a396 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">📬</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 24px; font-weight: 700; margin: 20px 0 0 0;">Mesaj nou de contact</h1>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="background: #ffffff; padding: 36px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8faf9; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0;"><strong>Nume:</strong> ${name}</p>
                    <p style="margin: 0 0 12px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #025951;">${email}</a></p>
                    ${phone ? `<p style="margin: 0 0 12px 0;"><strong>Telefon:</strong> <a href="tel:${phone}" style="color: #025951;">${phone}</a></p>` : ''}
                    ${subject ? `<p style="margin: 0 0 12px 0;"><strong>Subiect:</strong> ${subject}</p>` : ''}
                    <p style="margin: 0;"><strong>Limba:</strong> ${language.toUpperCase()}</p>
                  </td>
                </tr>
              </table>

              <h2 style="font-size: 18px; margin: 0 0 16px 0;">Mesaj:</h2>
              <div style="background: #f8faf9; border-radius: 12px; padding: 20px; white-space: pre-wrap; line-height: 1.6;">
                ${message}
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${email}?subject=Re: ${subject || 'Mesaj contact VAIAVITA'}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-weight: 600;">
                      Răspunde →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: #1a1a1a; border-radius: 0 0 24px 24px; padding: 24px 40px; text-align: center;">
              <img src="${logoUrl}" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 16px auto; opacity: 0.9;" />
              <p style="font-size: 12px; color: #888; margin: 0;">Acest email a fost generat automat de sistemul VAIAVITA</p>
              <p style="font-size: 11px; color: #666; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Confirmation email to customer - Romanian
    const customerEmailHtmlRo = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Am primit mesajul tău - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e8f4f2 0%, #dceeed 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #038578 50%, #04a396 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">✉️</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 24px; font-weight: 700; margin: 20px 0 0 0;">Am primit mesajul tău!</h1>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="background: #ffffff; padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0 0 24px 0;">
                Dragă <strong style="color: #025951;">${name}</strong>,
              </p>
              <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0 0 24px 0;">
                Îți mulțumim că ne-ai contactat! Am primit mesajul tău și îți vom răspunde în cel mai scurt timp posibil.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8faf9; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="font-size: 14px; color: #666; margin: 0 0 8px 0;"><strong>Mesajul tău:</strong></p>
                    <p style="font-size: 14px; color: #666; margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0;">
                Dacă ai întrebări urgente, ne poți contacta și telefonic la <a href="tel:0732111117" style="color: #025951; font-weight: 600;">0732 111 117</a>.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: #1a1a1a; border-radius: 0 0 24px 24px; padding: 24px 40px; text-align: center;">
              <img src="${logoUrl}" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 16px auto; opacity: 0.9;" />
              <p style="font-size: 12px; color: #888; margin: 0;">VAIAVITA S.R.L. | CUI 49945945 | J8/1310/2024</p>
              <p style="font-size: 11px; color: #666; margin: 10px 0 0 0;">© 2025 VAIAVITA. Toate drepturile rezervate.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Confirmation email to customer - English
    const customerEmailHtmlEn = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We received your message - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e8f4f2 0%, #dceeed 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #038578 50%, #04a396 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">✉️</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 24px; font-weight: 700; margin: 20px 0 0 0;">We received your message!</h1>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="background: #ffffff; padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0 0 24px 0;">
                Dear <strong style="color: #025951;">${name}</strong>,
              </p>
              <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0 0 24px 0;">
                Thank you for contacting us! We have received your message and will respond as soon as possible.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8faf9; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="font-size: 14px; color: #666; margin: 0 0 8px 0;"><strong>Your message:</strong></p>
                    <p style="font-size: 14px; color: #666; margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
                  </td>
                </tr>
              </table>

              <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0;">
                For urgent inquiries, you can also reach us by phone at <a href="tel:0732111117" style="color: #025951; font-weight: 600;">+40 732 111 117</a>.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: #1a1a1a; border-radius: 0 0 24px 24px; padding: 24px 40px; text-align: center;">
              <img src="${logoUrl}" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 16px auto; opacity: 0.9;" />
              <p style="font-size: 12px; color: #888; margin: 0;">VAIAVITA S.R.L. | CUI 49945945 | J8/1310/2024</p>
              <p style="font-size: 11px; color: #666; margin: 10px 0 0 0;">© 2025 VAIAVITA. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Send email to admin
    console.log('Sending admin notification to:', adminEmail);
    try {
      await resend.emails.send({
        from: "VAIAVITA <comenzi@vaiavita.ro>",
        to: [adminEmail],
        subject: `📬 Mesaj nou de la ${name}${subject ? `: ${subject}` : ''}`,
        html: adminEmailHtml,
      });
      console.log('Admin email sent successfully');
    } catch (e: any) {
      console.error('Failed to send admin email:', e?.message || e);
    }

    // Send confirmation to customer
    console.log('Sending confirmation to customer:', email, 'Language:', language);
    try {
      await resend.emails.send({
        from: "VAIAVITA <comenzi@vaiavita.ro>",
        to: [email],
        subject: isRo 
          ? "✉️ Am primit mesajul tău - VAIAVITA" 
          : "✉️ We received your message - VAIAVITA",
        html: isRo ? customerEmailHtmlRo : customerEmailHtmlEn,
      });
      console.log('Customer confirmation email sent successfully');
    } catch (e: any) {
      console.error('Failed to send customer email:', e?.message || e);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-contact-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
