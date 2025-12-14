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
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Logo Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #013d38 100%); padding: 25px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/public-assets1/logo-light.png" alt="VAIAVITA" style="height: 50px; width: auto;" />
            </td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #013d38 100%); padding: 0 30px 30px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">🔔 Cerere Suport Live</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0 0; font-size: 14px;">Un client solicită asistență umană</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <!-- Client Info -->
              <div style="background-color: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h2 style="color: #025951; margin: 0 0 15px 0; font-size: 18px;">📋 Datele clientului</h2>
                <table width="100%" cellpadding="5" cellspacing="0">
                  <tr>
                    <td style="color: #666; width: 100px;">Nume:</td>
                    <td style="color: #333; font-weight: 600;">${data.name}</td>
                  </tr>
                  <tr>
                    <td style="color: #666;">Email:</td>
                    <td>
                      <a href="mailto:${data.email}" style="color: #025951; text-decoration: none;">${data.email}</a>
                    </td>
                  </tr>
                  ${data.phone ? `
                  <tr>
                    <td style="color: #666;">Telefon:</td>
                    <td>
                      <a href="tel:${data.phone}" style="color: #025951; text-decoration: none;">${data.phone}</a>
                      <a href="https://wa.me/${data.phone.replace(/\D/g, '')}" style="color: #25D366; text-decoration: none; margin-left: 10px;">WhatsApp</a>
                    </td>
                  </tr>
                  ` : ''}
                </table>
              </div>
              
              <!-- Message -->
              <div style="background-color: #e8f5f3; border-left: 4px solid #025951; padding: 15px 20px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
                <h3 style="color: #025951; margin: 0 0 10px 0; font-size: 16px;">💬 Mesajul clientului:</h3>
                <p style="color: #333; margin: 0; line-height: 1.6;">${data.message}</p>
              </div>
              
              <!-- Transcript -->
              <div style="margin-bottom: 20px;">
                <h3 style="color: #025951; margin: 0 0 15px 0; font-size: 16px;">📜 Transcriptul conversației:</h3>
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; font-size: 13px; line-height: 1.8; max-height: 300px; overflow-y: auto;">
                  ${data.transcript.split('\n').map(line => {
                    if (line.startsWith('Client:')) {
                      return `<div style="margin-bottom: 8px;"><span style="color: #025951; font-weight: 600;">👤 ${line}</span></div>`;
                    } else if (line.startsWith('Bot:')) {
                      return `<div style="margin-bottom: 8px;"><span style="color: #666;">🤖 ${line}</span></div>`;
                    }
                    return `<div style="margin-bottom: 8px;">${line}</div>`;
                  }).join('')}
                </div>
              </div>
              
              <!-- Action Buttons -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 5px;">
                    <a href="mailto:${data.email}" style="display: inline-block; background-color: #025951; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: 600;">📧 Răspunde pe Email</a>
                  </td>
                  ${data.phone ? `
                  <td align="center" style="padding: 10px 5px;">
                    <a href="tel:${data.phone}" style="display: inline-block; background-color: #333; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-weight: 600;">📞 Sună clientul</a>
                  </td>
                  ` : ''}
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; margin: 0; font-size: 12px;">
                <a href="https://vaiavita.ro" style="color: #025951; text-decoration: none;">vaiavita.ro</a>
              </p>
              <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">© 2025 VAIAVITA S.R.L. Toate drepturile rezervate.</p>
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
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Logo Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #013d38 100%); padding: 25px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/public-assets1/logo-light.png" alt="VAIAVITA" style="height: 50px; width: auto;" />
            </td>
          </tr>
          
          <!-- Tagline -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #013d38 100%); padding: 0 30px 30px 30px; text-align: center;">
              <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">${isRomanian ? 'Vitalitate, Energie și Echilibru' : 'Vitality, Energy and Balance'}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">
                ${isRomanian ? `Bună, ${data.name}! 👋` : `Hello, ${data.name}! 👋`}
              </h2>
              
              <p style="color: #555; line-height: 1.8; margin: 0 0 20px 0;">
                ${isRomanian 
                  ? 'Am primit cererea ta de asistență și un coleg din echipa noastră te va contacta în cel mai scurt timp posibil.'
                  : 'We have received your support request and a team member will contact you as soon as possible.'}
              </p>
              
              <div style="background-color: #e8f5f3; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                <h3 style="color: #025951; margin: 0 0 10px 0; font-size: 16px;">
                  ${isRomanian ? '📋 Mesajul tău:' : '📋 Your message:'}
                </h3>
                <p style="color: #333; margin: 0; line-height: 1.6; font-style: italic;">"${data.message}"</p>
              </div>
              
              <p style="color: #555; line-height: 1.8; margin: 0 0 20px 0;">
                ${isRomanian
                  ? 'Între timp, dacă ai întrebări urgente, ne poți contacta direct:'
                  : 'In the meantime, if you have urgent questions, you can contact us directly:'}
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="padding: 10px 0;">
                    <a href="tel:0732111117" style="color: #025951; text-decoration: none; font-weight: 600;">📞 0732 111 117</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <a href="https://wa.me/40732111117" style="color: #25D366; text-decoration: none; font-weight: 600;">💬 WhatsApp</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <a href="mailto:office@vaiavita.com" style="color: #025951; text-decoration: none; font-weight: 600;">📧 office@vaiavita.com</a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #555; line-height: 1.8; margin: 0;">
                ${isRomanian ? 'Mulțumim pentru răbdare!' : 'Thank you for your patience!'}
              </p>
              <p style="color: #025951; font-weight: 600; margin: 10px 0 0 0;">
                ${isRomanian ? 'Echipa VAIAVITA' : 'The VAIAVITA Team'}
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
              <p style="color: #999; margin: 0; font-size: 12px;">
                <a href="https://vaiavita.ro" style="color: #025951; text-decoration: none;">vaiavita.ro</a>
              </p>
              <p style="color: #999; margin: 5px 0 0 0; font-size: 12px;">© 2025 VAIAVITA S.R.L. Toate drepturile rezervate.</p>
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
