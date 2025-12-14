import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportRequest {
  name: string;
  phone: string;
  email: string;
  message: string;
  transcript: string;
  language: string;
  ip_address?: string;
  user_agent?: string;
}

const getAdminEmailTemplate = (data: SupportRequest): string => {
  const logoUrl = 'https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products/logo-mail-craciun.png';
  
  return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cerere Suport Live - VAIAVITA</title>
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
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">🔔</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 24px; font-weight: 700; margin: 20px 0 6px 0;">Cerere Suport Live</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Un client solicită asistență umană</p>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafcfb 100%); padding: 36px 40px;">
              <!-- Client Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(145deg, #f8faf9 0%, #f0f5f4 100%); border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="font-size: 12px; color: #025951; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px 0;">📋 Datele clientului</p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #444;"><strong>Nume:</strong> ${data.name}</p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #444;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #025951;">${data.email}</a></p>
                    ${data.phone ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #444;"><strong>Telefon:</strong> <a href="tel:${data.phone}" style="color: #025951;">${data.phone}</a></p>` : ''}
                    <p style="margin: 0; font-size: 14px; color: #444;"><strong>Limba:</strong> ${data.language.toUpperCase()}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Message -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #e8f5f3; border-left: 4px solid #025951; border-radius: 0 14px 14px 0; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="font-size: 12px; color: #025951; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px 0;">💬 Mesajul clientului</p>
                    <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.6;">${data.message}</p>
                  </td>
                </tr>
              </table>
              
              <!-- Transcript -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px 0;">📜 Transcriptul conversației</p>
                    <div style="font-size: 13px; line-height: 1.8; color: #444;">
                      ${data.transcript.split('\n').map(line => {
                        if (line.startsWith('Client:')) {
                          return `<div style="margin-bottom: 8px;"><span style="color: #025951; font-weight: 600;">👤 ${line}</span></div>`;
                        } else if (line.startsWith('Bot:')) {
                          return `<div style="margin-bottom: 8px;"><span style="color: #666;">🤖 ${line}</span></div>`;
                        }
                        return `<div style="margin-bottom: 8px;">${line}</div>`;
                      }).join('')}
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="mailto:${data.email}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      📧 Răspunde →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="${logoUrl}" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;" />
              <p style="font-size: 12px; color: #888; margin: 0;">Acest email a fost generat automat de sistemul VAIAVITA</p>
              <p style="font-size: 11px; color: #666; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

const getCustomerEmailTemplate = (data: SupportRequest): string => {
  const isRomanian = data.language === 'ro';
  const logoUrl = 'https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products/logo-mail-craciun.png';
  
  return `
<!DOCTYPE html>
<html lang="${isRomanian ? 'ro' : 'en'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${isRomanian ? 'Am primit cererea ta' : 'We received your request'} - VAIAVITA</title>
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
              <h1 style="color: #fff; font-size: 24px; font-weight: 700; margin: 20px 0 6px 0;">${isRomanian ? 'Am primit cererea ta!' : 'We received your request!'}</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">${isRomanian ? 'Îți vom răspunde în curând' : 'We will respond shortly'}</p>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafcfb 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0 0 24px 0;">
                ${isRomanian ? `Bună, <strong style="color: #025951;">${data.name}</strong>! 👋` : `Hello, <strong style="color: #025951;">${data.name}</strong>! 👋`}
              </p>
              
              <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0 0 24px 0;">
                ${isRomanian 
                  ? 'Am primit cererea ta de asistență și un coleg din echipa noastră te va contacta în cel mai scurt timp posibil.'
                  : 'We have received your support request and a team member will contact you as soon as possible.'}
              </p>
              
              <!-- Message Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(145deg, #f8faf9 0%, #f0f5f4 100%); border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="font-size: 12px; color: #025951; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px 0;">${isRomanian ? '📋 Mesajul tău:' : '📋 Your message:'}</p>
                    <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.6; font-style: italic;">"${data.message}"</p>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0 0 24px 0;">
                ${isRomanian
                  ? 'Între timp, dacă ai întrebări urgente, ne poți contacta direct:'
                  : 'In the meantime, if you have urgent questions, you can contact us directly:'}
              </p>
              
              <!-- Contact Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0;"><a href="tel:0732111117" style="color: #025951; text-decoration: none; font-weight: 600;">📞 0732 111 117</a></p>
                    <p style="margin: 0 0 8px 0;"><a href="https://wa.me/40732111117" style="color: #25D366; text-decoration: none; font-weight: 600;">💬 WhatsApp</a></p>
                    <p style="margin: 0;"><a href="mailto:office@vaiavita.com" style="color: #025951; text-decoration: none; font-weight: 600;">📧 office@vaiavita.com</a></p>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 16px; color: #444; line-height: 1.6; margin: 0 0 8px 0;">
                ${isRomanian ? 'Mulțumim pentru răbdare!' : 'Thank you for your patience!'}
              </p>
              <p style="font-size: 16px; color: #025951; font-weight: 600; margin: 0;">
                ${isRomanian ? 'Echipa VAIAVITA' : 'The VAIAVITA Team'}
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="${logoUrl}" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;" />
              <p style="font-size: 12px; color: #888; margin: 0;">VAIAVITA S.R.L. | CUI 49945945 | J8/1310/2024</p>
              <p style="font-size: 11px; color: #666; margin: 10px 0 0 0;">© 2025 VAIAVITA. ${isRomanian ? 'Toate drepturile rezervate.' : 'All rights reserved.'}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: SupportRequest = await req.json();
    console.log("Received support request from:", data.name, data.email);

    // Get IP address from request headers
    const ip_address = data.ip_address || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                       req.headers.get("cf-connecting-ip") || 
                       req.headers.get("x-real-ip") || null;

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: dbError } = await supabase.from("contact_submissions").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: "Cerere suport live (Chatbot)",
      message: data.message,
      language: data.language,
      source: "chatbot",
      ip_address: ip_address,
      user_agent: data.user_agent || null,
      admin_notes: `--- Transcript conversație ---\n${data.transcript}`,
    });

    if (dbError) {
      console.error("Database error:", dbError);
    } else {
      console.log("Support request saved to database");
    }

    // Send notification to admin
    const adminEmailResult = await resend.emails.send({
      from: "VAIAVITA Chatbot <noreply@vaiavita.ro>",
      to: ["stanoiloren20@gmail.com"],
      subject: `🔔 Cerere Suport Live: ${data.name}`,
      html: getAdminEmailTemplate(data),
    });

    console.log("Admin email sent:", adminEmailResult);

    // Send confirmation to customer
    const customerEmailResult = await resend.emails.send({
      from: "VAIAVITA <noreply@vaiavita.ro>",
      to: [data.email],
      subject: data.language === 'ro' 
        ? "Am primit cererea ta - VAIAVITA" 
        : "We received your request - VAIAVITA",
      html: getCustomerEmailTemplate(data),
    });

    console.log("Customer email sent:", customerEmailResult);

    return new Response(
      JSON.stringify({ success: true, adminEmail: adminEmailResult, customerEmail: customerEmailResult }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-support-request:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
