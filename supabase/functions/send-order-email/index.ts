import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  orderId: string;
  emailType:
    | "confirmation"
    | "processing"
    | "ready_pickup"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "payment_failed"
    | "payment_reminder"
    | "admin_notification";
  awbNumber?: string;
  courierName?: string;
  cancellationReason?: string;
  language?: "ro" | "en";
}

const ADMIN_EMAIL = "office@vaiavita.com";

type Language = "ro" | "en";

const EMAIL_SUBJECTS = {
  ro: {
    confirmation: "Comanda ta a fost plasată cu succes!",
    processing: "Comanda ta este în procesare",
    ready_pickup: "Comanda ta este pregătită pentru ridicare",
    shipped: "Comanda ta a fost expediată!",
    delivered: "Comanda ta a fost finalizată - Lasă o recenzie și primești 15% reducere!",
    cancelled: "Comanda ta a fost anulată",
    payment_failed: "Plata pentru comanda ta nu a putut fi procesată",
    payment_reminder: "Reminder: Finalizează plata pentru comanda ta",
    admin_notification: "🎉 Comandă nouă cu succes!",
  },
  en: {
    confirmation: "Your order has been placed successfully!",
    processing: "Your order is being processed",
    ready_pickup: "Your order is ready for pickup",
    shipped: "Your order has been shipped!",
    delivered: "Your order has been delivered - Leave a review and get 15% off!",
    cancelled: "Your order has been cancelled",
    payment_failed: "Payment for your order could not be processed",
    payment_reminder: "Reminder: Complete payment for your order",
    admin_notification: "🎉 New successful order!",
  },
};

// HTML Templates embedded as template strings
const TEMPLATES = {
  ro: {
    confirmation: `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmare Comandă - VAIAVITA</title>
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
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">✓</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Comandă confirmată!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Mulțumim că ai ales VAIAVITA</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafcfb 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Salut <strong style="color: #025951;">{{customer_name}}</strong>! Am primit comanda ta și o procesăm cu grijă.
              </p>
              <!-- ORDER INFO BAR -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0f9f7 0%, #e5f5f2 100%); border-radius: 14px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px 24px; border-right: 1px solid #d0e8e4;" width="50%">
                    <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; display: block;">Comandă</span>
                    <strong style="font-size: 22px; color: #025951; display: block; margin-top: 6px;">#{{order_number}}</strong>
                  </td>
                  <td style="padding: 20px 24px;" width="50%">
                    <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; display: block;">Data comenzii</span>
                    <span style="font-size: 15px; color: #333; display: block; margin-top: 6px;">{{order_date}}</span>
                  </td>
                </tr>
              </table>
              <!-- SECTION: PRODUSE -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #025951; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; padding-bottom: 14px; border-bottom: 2px solid #025951;">
                    Produse comandate
                  </td>
                </tr>
              </table>
              {{products_html}}
              <!-- Totals Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f8faf9 0%, #f0f5f4 100%); border-radius: 14px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 14px; color: #666; padding: 6px 0;">Subtotal</td>
                        <td align="right" style="font-size: 14px; color: #333; padding: 6px 0;">{{subtotal}} lei</td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #666; padding: 6px 0;">Livrare</td>
                        <td align="right" style="font-size: 14px; color: #333; padding: 6px 0;">{{shipping_cost}}</td>
                      </tr>
                      {{discount_row}}
                      <tr>
                        <td colspan="2" style="padding: 12px 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr><td style="background: linear-gradient(90deg, #025951, #04a396); height: 2px; border-radius: 2px;"></td></tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 18px; font-weight: 700; color: #111;">Total de plată</td>
                        <td align="right" style="font-size: 22px; font-weight: 700; color: #025951;">{{total}} lei</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- SECTION: DETALII -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #025951; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; padding-bottom: 14px; border-bottom: 2px solid #025951;">
                    Detalii comandă
                  </td>
                </tr>
              </table>
              <!-- Info Grid -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="48%" style="vertical-align: top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(145deg, #f8faf9 0%, #f0f5f4 100%); border-radius: 14px;">
                      <tr>
                        <td style="padding: 20px;">
                          <span style="font-size: 20px; display: block; margin-bottom: 10px;">📦</span>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Livrare</span>
                          <p style="font-size: 14px; color: #333; font-weight: 600; margin: 8px 0 4px 0;">{{delivery_method}}</p>
                          <p style="font-size: 13px; color: #666; margin: 0; line-height: 1.4;">{{delivery_address}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="vertical-align: top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(145deg, #f8faf9 0%, #f0f5f4 100%); border-radius: 14px;">
                      <tr>
                        <td style="padding: 20px;">
                          <span style="font-size: 20px; display: block; margin-bottom: 10px;">💳</span>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Plată</span>
                          <p style="font-size: 14px; color: #333; font-weight: 600; margin: 8px 0 4px 0;">{{payment_method}}</p>
                          <p style="font-size: 13px; color: #16a34a; font-weight: 600; margin: 0;">{{payment_status}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Contact Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(145deg, #f8faf9 0%, #f0f5f4 100%); border-radius: 14px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px;">
                    <span style="font-size: 20px; display: inline-block; margin-right: 10px; vertical-align: middle;">👤</span>
                    <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">Date de contact</span>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
                      <tr>
                        <td style="font-size: 14px; color: #333; padding: 4px 0;"><strong>{{customer_name}}</strong></td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #666; padding: 4px 0;">{{customer_email}}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #666; padding: 4px 0;">{{customer_phone}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="mailto:office@vaiavita.com" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      Ai întrebări? Contactează-ne →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 20px auto;">
                <tr>
                  <td><a href="https://vaiavita.ro" style="color: #999; font-size: 13px; text-decoration: none; padding: 0 12px;">Website</a></td>
                  <td style="color: #444;">•</td>
                  <td><a href="https://vaiavita.ro/produse" style="color: #999; font-size: 13px; text-decoration: none; padding: 0 12px;">Produse</a></td>
                  <td style="color: #444;">•</td>
                  <td><a href="https://vaiavita.ro/contact" style="color: #999; font-size: 13px; text-decoration: none; padding: 0 12px;">Contact</a></td>
                </tr>
              </table>
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945 | J8/1310/2024</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA. Toate drepturile rezervate.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    processing: `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comandă în procesare - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e8f4f2 0%, #dceeed 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #038578 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">📦</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Comanda ta e în procesare!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Pregătim produsele cu grijă</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Salut <strong style="color: #025951;">{{customer_name}}</strong>!<br>
                Comanda ta <strong>#{{order_number}}</strong> este acum în procesare.
              </p>
              <!-- Progress Steps -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #025951; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #888;">Plasată</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #025951;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #025951, #038578); border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 14px;">⚙</div>
                          <span style="font-size: 10px; color: #025951; font-weight: 600;">În procesare</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #e5e7eb;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #e5e7eb; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #999; font-size: 12px;">3</div>
                          <span style="font-size: 10px; color: #999;">Expediată</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #e5e7eb;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #e5e7eb; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #999; font-size: 12px;">4</div>
                          <span style="font-size: 10px; color: #999;">Livrată</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Info Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0f9f7 0%, #e5f5f2 100%); border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="font-size: 14px; color: #025951; margin: 0; line-height: 1.6;">
                      <strong>Ce urmează?</strong><br>
                      Te vom notifica prin email când comanda ta va fi expediată, cu toate detaliile de tracking.
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Order Summary -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Total comandă</span><br>
                          <strong style="font-size: 18px; color: #025951;">{{total}} lei</strong>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Plată</span><br>
                          <strong style="font-size: 14px; color: #333;">{{payment_method}}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="font-size: 15px; color: #666; margin: 0 0 20px 0;">Ai întrebări despre comandă?</p>
                    <a href="tel:0732111117" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      📞 0732 111 117
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    ready_pickup: `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comandă pregătită pentru ridicare - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #f0f9f7 0%, #e5f5f2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #038578 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">🎉</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Comanda ta e pregătită!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Te așteptăm să o ridici</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Salut <strong style="color: #025951;">{{customer_name}}</strong>,<br>
                Comanda ta <strong>#{{order_number}}</strong> este pregătită pentru ridicare!
              </p>
              <!-- Pickup Location -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0f9f7 0%, #e5f5f2 100%); border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="font-size: 12px; color: #025951; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px 0;">📍 Locație ridicare</p>
                    <p style="font-size: 16px; color: #025951; font-weight: 600; margin: 0 0 8px 0;">{{pickup_location}}</p>
                    <p style="font-size: 14px; color: #444; margin: 0;">{{pickup_address}}</p>
                  </td>
                </tr>
              </table>
              <!-- Instructions -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff8e1; border-radius: 14px; border: 1px solid #ffe082; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="font-size: 12px; color: #f57c00; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px 0;">📋 Instrucțiuni ridicare</p>
                    <ul style="font-size: 14px; color: #444; margin: 0; padding-left: 20px; line-height: 1.8;">
                      <li>Contactează-ne înainte să vii pentru a confirma disponibilitatea</li>
                      <li>Ia cu tine un act de identitate</li>
                      <li>Menționează numărul comenzii: <strong>#{{order_number}}</strong></li>
                    </ul>
                  </td>
                </tr>
              </table>
              <!-- Order Summary -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Total</span><br>
                          <strong style="font-size: 18px; color: #025951;">{{total}} lei</strong>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Plată</span><br>
                          <strong style="font-size: 14px; color: #333;">{{payment_method}}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="font-size: 15px; color: #666; margin: 0 0 20px 0;">Ai întrebări? Sună-ne! 📞</p>
                    <a href="tel:0732111117" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      0732 111 117
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    shipped: `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comandă expediată - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e8f4f2 0%, #dceeed 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #038578 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">🚚</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Comanda ta a fost expediată!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Este în drum spre tine</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Salut <strong style="color: #025951;">{{customer_name}}</strong>!<br>
                Comanda ta <strong>#{{order_number}}</strong> a fost expediată și este în drum spre tine!
              </p>
              <!-- AWB Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0f9f7 0%, #e5f5f2 100%); border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" style="padding-right: 12px;">
                          <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">📦 Număr AWB</p>
                          <p style="font-size: 18px; color: #025951; font-weight: 700; margin: 0; font-family: monospace;">{{awb_number}}</p>
                        </td>
                        <td width="50%" style="padding-left: 12px; border-left: 1px solid #d0e8e4;">
                          <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">🚚 Curier</p>
                          <p style="font-size: 16px; color: #333; font-weight: 600; margin: 0;">{{courier_name}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Progress Steps -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #025951; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #888;">Plasată</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #025951;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #025951; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #888;">Procesată</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #025951;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #025951, #038578); border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 14px;">🚚</div>
                          <span style="font-size: 10px; color: #025951; font-weight: 600;">Expediată</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #e5e7eb;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #e5e7eb; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #999; font-size: 12px;">4</div>
                          <span style="font-size: 10px; color: #999;">Livrată</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Delivery Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">📍 Adresa de livrare</p>
                    <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.6;">{{delivery_address}}</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="font-size: 15px; color: #666; margin: 0 0 20px 0;">Urmărește coletul în timp real:</p>
                    <a href="{{tracking_url}}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      🔍 Vezi status livrare →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    delivered: `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comandă finalizată - VAIAVITA</title>
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
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">🎉</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Comandă finalizată!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Sperăm să te bucuri de produse</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafcfb 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Salut <strong style="color: #025951;">{{customer_name}}</strong>! Comanda ta <strong style="color: #025951;">#{{order_number}}</strong> a fost livrată cu succes!
              </p>
              <!-- Status Complete -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #025951; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #888;">Plasată</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #025951;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #025951; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #888;">Procesată</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #025951;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #025951; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #888;">Expediată</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #025951;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #16a34a, #22c55e); border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #16a34a; font-weight: 600;">Livrată</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Review CTA Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #025951 0%, #038578 100%); border-radius: 20px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    <span style="font-size: 40px; display: block; margin-bottom: 16px;">⭐</span>
                    <h2 style="color: #fff; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">Spune-ne părerea ta!</h2>
                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 20px 0; line-height: 1.5;">
                      Lasă o recenzie și primești <strong style="color: #fbbf24;">15% reducere</strong><br>la următoarea comandă!
                    </p>
                    <a href="{{review_url}}" style="display: inline-block; padding: 16px 40px; background-color: #fff; color: #025951; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 700;">
                      ⭐ Lasă o recenzie →
                    </a>
                    <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 16px 0 0 0;">
                      Folosește același email: <strong>{{customer_email}}</strong>
                    </p>
                    <p style="color: rgba(255,255,255,0.6); font-size: 11px; margin: 12px 0 0 0; padding: 10px 16px; background: rgba(0,0,0,0.15); border-radius: 8px;">
                      ⚠️ <strong>Atenție:</strong> Cuponul de reducere se generează o singură dată per adresă de email. Dacă ai mai lăsat o recenzie și ai primit deja un cupon, nu vei primi unul nou.
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Order Summary -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0f9f7 0%, #e5f5f2 100%); border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">Rezumat comandă</p>
                    {{products_html}}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px dashed #ccc; padding-top: 12px;">
                      <tr>
                        <td style="font-size: 16px; font-weight: 700; color: #111;">Total plătit</td>
                        <td align="right" style="font-size: 18px; font-weight: 700; color: #025951;">{{total}} lei</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Thank You -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <p style="font-size: 15px; color: #666; margin: 0 0 16px 0;">Mulțumim că ai ales VAIAVITA! 💚</p>
                    <a href="https://vaiavita.ro/produse" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 14px; font-weight: 600;">
                      Vezi alte produse →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    cancelled: `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comandă anulată - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">✕</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Comandă anulată</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Ne pare rău pentru inconveniență</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Salut <strong style="color: #025951;">{{customer_name}}</strong>,<br>
                Comanda ta <strong>#{{order_number}}</strong> a fost anulată.
              </p>
              <!-- Cancellation Reason -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef2f2; border-radius: 14px; border: 1px solid #fecaca; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="font-size: 12px; color: #dc2626; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px 0;">📋 Motivul anulării</p>
                    <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.6;">{{cancellation_reason}}</p>
                  </td>
                </tr>
              </table>
              <!-- Order Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Comandă</span><br>
                          <strong style="font-size: 16px; color: #333;">#{{order_number}}</strong>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Total</span><br>
                          <strong style="font-size: 16px; color: #333;">{{total}} lei</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="font-size: 15px; color: #666; margin: 0 0 20px 0;">Dorești să plasezi o nouă comandă?</p>
                    <a href="https://vaiavita.ro/produse" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      🛒 Vezi produsele →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Help -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 28px;">
                <tr>
                  <td align="center">
                    <p style="font-size: 14px; color: #888; margin: 0;">Ai întrebări? Contactează-ne la <a href="tel:0732111117" style="color: #025951;">0732 111 117</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    payment_failed: `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plată eșuată - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #fef3c7 0%, #fde68a 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">⚠️</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Plata nu a reușit</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Te rugăm să încerci din nou</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Salut <strong style="color: #025951;">{{customer_name}}</strong>,<br>
                Din păcate, plata pentru comanda ta <strong>#{{order_number}}</strong> nu a putut fi procesată.
              </p>
              <!-- Warning Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 14px; border: 1px solid #fcd34d; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="font-size: 14px; color: #92400e; margin: 0; line-height: 1.6;">
                      <strong>⏰ Produsele sunt rezervate timp de 24 de ore.</strong><br>
                      Finalizează plata pentru a-ți asigura comanda!
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Order Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Comandă</span><br>
                          <strong style="font-size: 16px; color: #333;">#{{order_number}}</strong>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Total de plată</span><br>
                          <strong style="font-size: 18px; color: #025951;">{{total}} lei</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="{{retry_url}}" style="display: inline-block; padding: 18px 56px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 700;">
                      💳 Încearcă din nou →
                    </a>
                    <p style="font-size: 13px; color: #888; margin: 20px 0 0 0;">Sau contactează-ne la <a href="tel:0732111117" style="color: #025951;">0732 111 117</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    payment_reminder: `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder plată - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">⏰</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Ultima șansă!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Comanda ta va fi anulată în curând</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Salut <strong style="color: #025951;">{{customer_name}}</strong>,<br>
                Rezervarea pentru comanda ta <strong>#{{order_number}}</strong> expiră în curând!
              </p>
              <!-- Urgency Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="font-size: 16px; color: #fff; margin: 0; font-weight: 700;">
                      ⚠️ Rezervarea expiră în curând!
                    </p>
                    <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
                      Produsele din comandă vor fi eliberate dacă nu finalizezi plata.
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Order Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Comandă</span><br>
                          <strong style="font-size: 16px; color: #333;">#{{order_number}}</strong>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Total de plată</span><br>
                          <strong style="font-size: 18px; color: #025951;">{{total}} lei</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="{{retry_url}}" style="display: inline-block; padding: 18px 56px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 700;">
                      💳 Finalizează plata acum →
                    </a>
                    <p style="font-size: 13px; color: #888; margin: 20px 0 0 0;">Dacă nu mai dorești comanda, poți ignora acest email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    admin_notification: `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comandă nouă - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e8f4f2 0%, #dceeed 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <h1 style="color: #fff; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">🎉 Comandă nouă!</h1>
              <p style="color: rgba(255,255,255,0.95); font-size: 18px; margin: 0; font-weight: 600;">#{{order_number}}</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: #ffffff; padding: 36px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f0fdf4; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px; text-align: center;">
                    <span style="font-size: 36px; font-weight: 800; color: #16a34a; display: block;">{{total}} lei</span>
                    <span style="font-size: 13px; color: #666; margin-top: 4px; display: block;">Total comandă</span>
                  </td>
                </tr>
              </table>
              
              <h3 style="font-size: 15px; color: #333; margin: 0 0 12px 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">📦 Detalii Client</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">Nume:</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #222; font-weight: 600;">{{customer_name}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">Email:</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #222;">{{customer_email}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">Telefon:</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #222;">{{customer_phone}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">Livrare:</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #222;">{{delivery_method}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">Plată:</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #222;">{{payment_method}} ({{payment_status}})</td>
                </tr>
              </table>
              
              <h3 style="font-size: 15px; color: #333; margin: 0 0 12px 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">🛒 Produse</h3>
              {{products_html}}
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px; border-top: 2px solid #eee; padding-top: 16px;">
                <tr>
                  <td style="font-size: 14px; color: #666; padding: 4px 0;">Subtotal</td>
                  <td align="right" style="font-size: 14px; color: #222; padding: 4px 0;">{{subtotal}} lei</td>
                </tr>
                {{discount_row}}
                <tr>
                  <td style="font-size: 14px; color: #666; padding: 4px 0;">Transport</td>
                  <td align="right" style="font-size: 14px; color: #222; padding: 4px 0;">{{shipping_cost}}</td>
                </tr>
                <tr>
                  <td style="font-size: 16px; font-weight: 700; color: #16a34a; padding: 12px 0 0 0;">TOTAL</td>
                  <td align="right" style="font-size: 18px; font-weight: 800; color: #16a34a; padding: 12px 0 0 0;">{{total}} lei</td>
                </tr>
              </table>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="https://vaiavita.ro/admin/orders" style="display: inline-block; background: #025951; color: #fff; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 12px; text-decoration: none;">Vezi în Admin</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: #f8faf9; padding: 24px 40px; border-radius: 0 0 24px 24px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products/logo-mail-craciun.png" alt="VAIAVITA" width="100" style="display: block; margin: 0 auto 12px auto;">
              <p style="font-size: 12px; color: #666; margin: 0;">Notificare automată pentru comenzi noi</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },

  en: {
    confirmation: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e8f4f2 0%, #dceeed 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #038578 50%, #04a396 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="150" style="display: block; margin: 0 auto 28px auto;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">✓</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Order Confirmed!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Thank you for choosing VAIAVITA</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafcfb 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Hi <strong style="color: #025951;">{{customer_name}}</strong>! We have received your order and are processing it carefully.
              </p>
              <!-- ORDER INFO BAR -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0f9f7 0%, #e5f5f2 100%); border-radius: 14px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px 24px; border-right: 1px solid #d0e8e4;" width="50%">
                    <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; display: block;">Order</span>
                    <strong style="font-size: 22px; color: #025951; display: block; margin-top: 6px;">#{{order_number}}</strong>
                  </td>
                  <td style="padding: 20px 24px;" width="50%">
                    <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; display: block;">Order Date</span>
                    <span style="font-size: 15px; color: #333; display: block; margin-top: 6px;">{{order_date}}</span>
                  </td>
                </tr>
              </table>
              <!-- SECTION: PRODUCTS -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #025951; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; padding-bottom: 14px; border-bottom: 2px solid #025951;">
                    Ordered Products
                  </td>
                </tr>
              </table>
              {{products_html}}
              <!-- Totals Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f8faf9 0%, #f0f5f4 100%); border-radius: 14px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size: 14px; color: #666; padding: 6px 0;">Subtotal</td>
                        <td align="right" style="font-size: 14px; color: #333; padding: 6px 0;">{{subtotal}} lei</td>
                      </tr>
                      <tr>
                        <td style="font-size: 14px; color: #666; padding: 6px 0;">Shipping</td>
                        <td align="right" style="font-size: 14px; color: #333; padding: 6px 0;">{{shipping_cost}}</td>
                      </tr>
                      {{discount_row}}
                      <tr>
                        <td colspan="2" style="padding: 12px 0;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr><td style="background: linear-gradient(90deg, #025951, #04a396); height: 2px; border-radius: 2px;"></td></tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 18px; font-weight: 700; color: #111;">Total</td>
                        <td align="right" style="font-size: 22px; font-weight: 700; color: #025951;">{{total}} lei</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- SECTION: DETAILS -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="font-size: 12px; color: #025951; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; padding-bottom: 14px; border-bottom: 2px solid #025951;">
                    Order Details
                  </td>
                </tr>
              </table>
              <!-- Info Grid -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td width="48%" style="vertical-align: top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(145deg, #f8faf9 0%, #f0f5f4 100%); border-radius: 14px;">
                      <tr>
                        <td style="padding: 20px;">
                          <span style="font-size: 20px; display: block; margin-bottom: 10px;">📦</span>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Delivery</span>
                          <p style="font-size: 14px; color: #333; font-weight: 600; margin: 8px 0 4px 0;">{{delivery_method}}</p>
                          <p style="font-size: 13px; color: #666; margin: 0; line-height: 1.4;">{{delivery_address}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="vertical-align: top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(145deg, #f8faf9 0%, #f0f5f4 100%); border-radius: 14px;">
                      <tr>
                        <td style="padding: 20px;">
                          <span style="font-size: 20px; display: block; margin-bottom: 10px;">💳</span>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;">Payment</span>
                          <p style="font-size: 14px; color: #333; font-weight: 600; margin: 8px 0 4px 0;">{{payment_method}}</p>
                          <p style="font-size: 13px; color: #16a34a; font-weight: 600; margin: 0;">{{payment_status}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Contact Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(145deg, #f8faf9 0%, #f0f5f4 100%); border-radius: 14px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px;">
                    <span style="font-size: 20px; display: inline-block; margin-right: 10px; vertical-align: middle;">👤</span>
                    <span style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; vertical-align: middle;">Contact Information</span>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px;">
                      <tr>
                        <td style="font-size: 14px; color: #333; padding: 4px 0;"><strong>{{customer_name}}</strong></td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #666; padding: 4px 0;">{{customer_email}}</td>
                      </tr>
                      <tr>
                        <td style="font-size: 13px; color: #666; padding: 4px 0;">{{customer_phone}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="mailto:office@vaiavita.com" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      Questions? Contact us →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto 20px auto;">
                <tr>
                  <td><a href="https://vaiavita.ro" style="color: #999; font-size: 13px; text-decoration: none; padding: 0 12px;">Website</a></td>
                  <td style="color: #444;">•</td>
                  <td><a href="https://vaiavita.ro/produse" style="color: #999; font-size: 13px; text-decoration: none; padding: 0 12px;">Products</a></td>
                  <td style="color: #444;">•</td>
                  <td><a href="https://vaiavita.ro/contact" style="color: #999; font-size: 13px; text-decoration: none; padding: 0 12px;">Contact</a></td>
                </tr>
              </table>
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945 | J8/1310/2024</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    processing: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Processing - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e8f4f2 0%, #dceeed 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #038578 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">📦</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Your order is being processed!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">We're carefully preparing your products</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Hi <strong style="color: #025951;">{{customer_name}}</strong>!<br>
                Your order <strong>#{{order_number}}</strong> is now being processed.
              </p>
              <!-- Progress Steps -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #025951; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #888;">Placed</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #025951;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #025951, #038578); border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 14px;">⚙</div>
                          <span style="font-size: 10px; color: #025951; font-weight: 600;">Processing</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #e5e7eb;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #e5e7eb; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #999; font-size: 12px;">3</div>
                          <span style="font-size: 10px; color: #999;">Shipped</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #e5e7eb;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #e5e7eb; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #999; font-size: 12px;">4</div>
                          <span style="font-size: 10px; color: #999;">Delivered</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Info Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0f9f7 0%, #e5f5f2 100%); border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="font-size: 14px; color: #025951; margin: 0; line-height: 1.6;">
                      <strong>What's next?</strong><br>
                      We will notify you by email when your order is shipped, with all tracking details.
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Order Summary -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Order Total</span><br>
                          <strong style="font-size: 18px; color: #025951;">{{total}} lei</strong>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Payment</span><br>
                          <strong style="font-size: 14px; color: #333;">{{payment_method}}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="font-size: 15px; color: #666; margin: 0 0 20px 0;">Questions about your order?</p>
                    <a href="tel:0732111117" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      📞 0732 111 117
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    ready_pickup: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Ready for Pickup - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #f0f9f7 0%, #e5f5f2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #038578 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">🎉</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Your order is ready!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">We're waiting for you to pick it up</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Hi <strong style="color: #025951;">{{customer_name}}</strong>,<br>
                Your order <strong>#{{order_number}}</strong> is ready for pickup!
              </p>
              <!-- Pickup Location -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0f9f7 0%, #e5f5f2 100%); border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="font-size: 12px; color: #025951; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px 0;">📍 Pickup Location</p>
                    <p style="font-size: 16px; color: #025951; font-weight: 600; margin: 0 0 8px 0;">{{pickup_location}}</p>
                    <p style="font-size: 14px; color: #444; margin: 0;">{{pickup_address}}</p>
                  </td>
                </tr>
              </table>
              <!-- Instructions -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fff8e1; border-radius: 14px; border: 1px solid #ffe082; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="font-size: 12px; color: #f57c00; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px 0;">📋 Pickup Instructions</p>
                    <ul style="font-size: 14px; color: #444; margin: 0; padding-left: 20px; line-height: 1.8;">
                      <li>Contact us before coming to confirm availability</li>
                      <li>Bring an ID for identification</li>
                      <li>Quote order number: <strong>#{{order_number}}</strong></li>
                    </ul>
                  </td>
                </tr>
              </table>
              <!-- Order Summary -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Total</span><br>
                          <strong style="font-size: 18px; color: #025951;">{{total}} lei</strong>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Payment</span><br>
                          <strong style="font-size: 14px; color: #333;">{{payment_method}}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="font-size: 15px; color: #666; margin: 0 0 20px 0;">Questions? Call us! 📞</p>
                    <a href="tel:0732111117" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      0732 111 117
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    shipped: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Shipped - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e8f4f2 0%, #dceeed 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #038578 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">🚚</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Your order has been shipped!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">It's on its way to you</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Hi <strong style="color: #025951;">{{customer_name}}</strong>!<br>
                Your order <strong>#{{order_number}}</strong> has been shipped and is on its way to you!
              </p>
              <!-- AWB Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0f9f7 0%, #e5f5f2 100%); border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="50%" style="padding-right: 12px;">
                          <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">📦 AWB Number</p>
                          <p style="font-size: 18px; color: #025951; font-weight: 700; margin: 0; font-family: monospace;">{{awb_number}}</p>
                        </td>
                        <td width="50%" style="padding-left: 12px; border-left: 1px solid #d0e8e4;">
                          <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">🚚 Courier</p>
                          <p style="font-size: 16px; color: #333; font-weight: 600; margin: 0;">{{courier_name}}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Progress Steps -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #025951; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #888;">Placed</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #025951;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #025951; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #888;">Processed</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #025951;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #025951, #038578); border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 14px;">🚚</div>
                          <span style="font-size: 10px; color: #025951; font-weight: 600;">Shipped</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #e5e7eb;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #e5e7eb; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #999; font-size: 12px;">4</div>
                          <span style="font-size: 10px; color: #999;">Delivered</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Delivery Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px 0;">📍 Delivery Address</p>
                    <p style="font-size: 14px; color: #333; margin: 0; line-height: 1.6;">{{delivery_address}}</p>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="font-size: 15px; color: #666; margin: 0 0 20px 0;">Track your package in real time:</p>
                    <a href="{{tracking_url}}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      🔍 Track delivery →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    delivered: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered - VAIAVITA</title>
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
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">🎉</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Order Delivered!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">We hope you enjoy your products</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafcfb 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Hi <strong style="color: #025951;">{{customer_name}}</strong>! Your order <strong style="color: #025951;">#{{order_number}}</strong> has been successfully delivered!
              </p>
              <!-- Status Complete -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #025951; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #888;">Placed</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #025951;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #025951; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #888;">Processed</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #025951;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background-color: #025951; border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #888;">Shipped</span>
                        </td>
                        <td style="width: 30px; height: 3px; background-color: #025951;"></td>
                        <td style="text-align: center; padding: 0 12px;">
                          <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #16a34a, #22c55e); border-radius: 50%; margin: 0 auto 6px auto; line-height: 28px; color: #fff; font-size: 12px;">✓</div>
                          <span style="font-size: 10px; color: #16a34a; font-weight: 600;">Delivered</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Review CTA Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #025951 0%, #038578 100%); border-radius: 20px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 32px; text-align: center;">
                    <span style="font-size: 40px; display: block; margin-bottom: 16px;">⭐</span>
                    <h2 style="color: #fff; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">Share your feedback!</h2>
                    <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0 0 20px 0; line-height: 1.5;">
                      Leave a review and get <strong style="color: #fbbf24;">15% off</strong><br>your next order!
                    </p>
                    <a href="{{review_url}}" style="display: inline-block; padding: 16px 40px; background-color: #fff; color: #025951; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 700;">
                      ⭐ Leave a review →
                    </a>
                    <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 16px 0 0 0;">
                      Use the same email: <strong>{{customer_email}}</strong>
                    </p>
                    <p style="color: rgba(255,255,255,0.6); font-size: 11px; margin: 12px 0 0 0; padding: 10px 16px; background: rgba(0,0,0,0.15); border-radius: 8px;">
                      ⚠️ <strong>Note:</strong> The discount coupon is generated only once per email address. If you have already left a review and received a coupon, you will not receive a new one.
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Order Summary -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0f9f7 0%, #e5f5f2 100%); border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px 0;">Order Summary</p>
                    {{products_html}}
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top: 1px dashed #ccc; padding-top: 12px;">
                      <tr>
                        <td style="font-size: 16px; font-weight: 700; color: #111;">Total paid</td>
                        <td align="right" style="font-size: 18px; font-weight: 700; color: #025951;">{{total}} lei</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Thank You -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <p style="font-size: 15px; color: #666; margin: 0 0 16px 0;">Thank you for choosing VAIAVITA! 💚</p>
                    <a href="https://vaiavita.ro/produse" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 14px; font-weight: 600;">
                      See other products →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    cancelled: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Cancelled - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">✕</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Order Cancelled</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">We're sorry for the inconvenience</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Hi <strong style="color: #025951;">{{customer_name}}</strong>,<br>
                Your order <strong>#{{order_number}}</strong> has been cancelled.
              </p>
              <!-- Cancellation Reason -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef2f2; border-radius: 14px; border: 1px solid #fecaca; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="font-size: 12px; color: #dc2626; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; margin: 0 0 12px 0;">📋 Cancellation Reason</p>
                    <p style="font-size: 14px; color: #444; margin: 0; line-height: 1.6;">{{cancellation_reason}}</p>
                  </td>
                </tr>
              </table>
              <!-- Order Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Order</span><br>
                          <strong style="font-size: 16px; color: #333;">#{{order_number}}</strong>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Total</span><br>
                          <strong style="font-size: 16px; color: #333;">{{total}} lei</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="font-size: 15px; color: #666; margin: 0 0 20px 0;">Would you like to place a new order?</p>
                    <a href="https://vaiavita.ro/produse" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      🛒 View products →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Help -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 28px;">
                <tr>
                  <td align="center">
                    <p style="font-size: 14px; color: #888; margin: 0;">Questions? Contact us at <a href="tel:0732111117" style="color: #025951;">0732 111 117</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    payment_failed: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Failed - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #fef3c7 0%, #fde68a 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">⚠️</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Payment Failed</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Please try again</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Hi <strong style="color: #025951;">{{customer_name}}</strong>,<br>
                Unfortunately, the payment for your order <strong>#{{order_number}}</strong> could not be processed.
              </p>
              <!-- Warning Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef3c7; border-radius: 14px; border: 1px solid #fcd34d; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="font-size: 14px; color: #92400e; margin: 0; line-height: 1.6;">
                      <strong>⏰ Your products are reserved for 24 hours.</strong><br>
                      Complete your payment to secure your order!
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Order Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Order</span><br>
                          <strong style="font-size: 16px; color: #333;">#{{order_number}}</strong>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Total to pay</span><br>
                          <strong style="font-size: 18px; color: #025951;">{{total}} lei</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="{{retry_url}}" style="display: inline-block; padding: 18px 56px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 700;">
                      💳 Try again →
                    </a>
                    <p style="font-size: 13px; color: #888; margin: 20px 0 0 0;">Or contact us at <a href="tel:0732111117" style="color: #025951;">0732 111 117</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    payment_reminder: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Reminder - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">⏰</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Last Chance!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Your order will be cancelled soon</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Hi <strong style="color: #025951;">{{customer_name}}</strong>,<br>
                The reservation for your order <strong>#{{order_number}}</strong> is expiring soon!
              </p>
              <!-- Urgency Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="font-size: 16px; color: #fff; margin: 0; font-weight: 700;">
                      ⚠️ Reservation expiring soon!
                    </p>
                    <p style="font-size: 14px; color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">
                      The products in your order will be released if payment is not completed.
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Order Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8f8f8; border-radius: 14px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td>
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Order</span><br>
                          <strong style="font-size: 16px; color: #333;">#{{order_number}}</strong>
                        </td>
                        <td align="right">
                          <span style="font-size: 11px; color: #888; text-transform: uppercase;">Total to pay</span><br>
                          <strong style="font-size: 18px; color: #025951;">{{total}} lei</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="{{retry_url}}" style="display: inline-block; padding: 18px 56px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 700;">
                      💳 Complete payment now →
                    </a>
                    <p style="font-size: 13px; color: #888; margin: 20px 0 0 0;">If you no longer want this order, you can ignore this email.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products//logo-mail-craciun.png" alt="VAIAVITA" width="110" style="display: block; margin: 0 auto 20px auto; opacity: 0.9;">
              <p style="font-size: 12px; color: #666; margin: 0;">VAIAVITA S.R.L. | CUI 49945945</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,

    admin_notification: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e8f4f2 0%, #dceeed 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <h1 style="color: #fff; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">🎉 New Order!</h1>
              <p style="color: rgba(255,255,255,0.95); font-size: 18px; margin: 0; font-weight: 600;">#{{order_number}}</p>
            </td>
          </tr>
          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: #ffffff; padding: 36px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f0fdf4; border-radius: 14px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px 24px; text-align: center;">
                    <span style="font-size: 36px; font-weight: 800; color: #16a34a; display: block;">{{total}} lei</span>
                    <span style="font-size: 13px; color: #666; margin-top: 4px; display: block;">Order Total</span>
                  </td>
                </tr>
              </table>
              
              <h3 style="font-size: 15px; color: #333; margin: 0 0 12px 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">📦 Customer Details</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">Name:</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #222; font-weight: 600;">{{customer_name}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">Email:</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #222;">{{customer_email}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">Phone:</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #222;">{{customer_phone}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">Delivery:</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #222;">{{delivery_method}}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: #666;">Payment:</td>
                  <td style="padding: 6px 0; font-size: 14px; color: #222;">{{payment_method}} ({{payment_status}})</td>
                </tr>
              </table>
              
              <h3 style="font-size: 15px; color: #333; margin: 0 0 12px 0; border-bottom: 1px solid #eee; padding-bottom: 8px;">🛒 Products</h3>
              {{products_html}}
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 24px; border-top: 2px solid #eee; padding-top: 16px;">
                <tr>
                  <td style="font-size: 14px; color: #666; padding: 4px 0;">Subtotal</td>
                  <td align="right" style="font-size: 14px; color: #222; padding: 4px 0;">{{subtotal}} lei</td>
                </tr>
                {{discount_row}}
                <tr>
                  <td style="font-size: 14px; color: #666; padding: 4px 0;">Shipping</td>
                  <td align="right" style="font-size: 14px; color: #222; padding: 4px 0;">{{shipping_cost}}</td>
                </tr>
                <tr>
                  <td style="font-size: 16px; font-weight: 700; color: #16a34a; padding: 12px 0 0 0;">TOTAL</td>
                  <td align="right" style="font-size: 18px; font-weight: 800; color: #16a34a; padding: 12px 0 0 0;">{{total}} lei</td>
                </tr>
              </table>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 32px;">
                <tr>
                  <td align="center">
                    <a href="https://vaiavita.ro/admin/orders" style="display: inline-block; background: #025951; color: #fff; font-size: 15px; font-weight: 600; padding: 14px 32px; border-radius: 12px; text-decoration: none;">View in Admin</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="background: #f8faf9; padding: 24px 40px; border-radius: 0 0 24px 24px; text-align: center;">
              <img src="https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products/logo-mail-craciun.png" alt="VAIAVITA" width="100" style="display: block; margin: 0 auto 12px auto;">
              <p style="font-size: 12px; color: #666; margin: 0;">Automatic notification for new orders</p>
              <p style="font-size: 11px; color: #555; margin: 10px 0 0 0;">© 2025 VAIAVITA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
};

function formatPrice(price: number): string {
  return price.toFixed(2);
}

function formatDate(dateString: string, lang: Language): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(lang === "ro" ? "ro-RO" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDeliveryMethodText(method: string, lang: Language): string {
  const methods = {
    ro: {
      shipping: "Curier la adresă",
      pickup: "Ridicare personală din Brașov",
      locker: "EasyBox",
      postal: "Poșta Română",
    },
    en: {
      shipping: "Courier delivery",
      pickup: "Personal pickup in Brașov",
      locker: "EasyBox",
      postal: "Romanian Post",
    },
  };
  return methods[lang][method as keyof typeof methods.ro] || method;
}

function getPaymentMethodText(method: string, lang: Language): string {
  const methods = {
    ro: {
      stripe: "Card online",
      cash_on_delivery: "Ramburs la livrare",
    },
    en: {
      stripe: "Online card",
      cash_on_delivery: "Cash on delivery",
    },
  };
  return methods[lang][method as keyof typeof methods.ro] || method;
}

function getPaymentStatusText(status: string, lang: Language): string {
  if (status === "paid") return lang === "ro" ? "Plătită" : "Paid";
  if (status === "pending") return lang === "ro" ? "În așteptare" : "Pending";
  return status;
}

function generateProductsHtml(orderItems: any[], lang: Language): string {
  return orderItems
    .map(
      (item) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8faf9; border-radius: 12px; margin-bottom: 12px;">
      <tr>
        <td style="padding: 18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="vertical-align: middle;">
                <span style="font-size: 15px; font-weight: 600; color: #222; display: block;">${item.product_name}</span>
                <span style="font-size: 13px; color: #888;">${lang === "ro" ? "Cantitate" : "Quantity"}: ${item.quantity}</span>
              </td>
              <td align="right" style="vertical-align: middle;">
                <span style="font-size: 17px; font-weight: 700; color: #025951;">${formatPrice(item.total_price)} lei</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `,
    )
    .join("");
}

function generateDeliveredProductsHtml(orderItems: any[]): string {
  return orderItems
    .map(
      (item) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
      <tr>
        <td style="padding-left: 14px;">
          <span style="font-size: 14px; font-weight: 600; color: #222;">${item.product_name}</span><br>
          <span style="font-size: 12px; color: #888;">×${item.quantity}</span>
        </td>
        <td align="right">
          <span style="font-size: 15px; font-weight: 600; color: #025951;">${formatPrice(item.total_price)} lei</span>
        </td>
      </tr>
    </table>
  `,
    )
    .join("");
}

function getDeliveryAddress(order: any): string {
  if (!order.shipping_address) return "";
  const addr = order.shipping_address;
  return `${addr.address || ""}${addr.apartment ? ", " + addr.apartment : ""}, ${addr.city || ""}, ${addr.county || ""} ${addr.postalCode || ""}, ${addr.country || "România"}`;
}

function replaceTemplatePlaceholders(
  template: string,
  order: any,
  orderItems: any[],
  lang: Language,
  options: {
    awbNumber?: string;
    courierName?: string;
    cancellationReason?: string;
  } = {},
): string {
  const customerName = `${order.customer_first_name} ${order.customer_last_name}`;
  const deliveryAddress = getDeliveryAddress(order);
  const shippingCost =
    order.shipping_cost === 0 ? (lang === "ro" ? "GRATUIT" : "FREE") : `${formatPrice(order.shipping_cost || 0)} lei`;

  const discountRow =
    order.discount > 0
      ? `<tr>
        <td style="font-size: 14px; color: #16a34a; padding: 6px 0;">${lang === "ro" ? "Discount" : "Discount"}</td>
        <td align="right" style="font-size: 14px; color: #16a34a; padding: 6px 0;">-${formatPrice(order.discount)} lei</td>
      </tr>`
      : "";

  let html = template
    .replace(/\{\{customer_name\}\}/g, customerName)
    .replace(/\{\{order_number\}\}/g, order.order_number)
    .replace(/\{\{order_date\}\}/g, formatDate(order.created_at, lang))
    .replace(/\{\{subtotal\}\}/g, formatPrice(order.subtotal))
    .replace(/\{\{shipping_cost\}\}/g, shippingCost)
    .replace(/\{\{discount_row\}\}/g, discountRow)
    .replace(/\{\{total\}\}/g, formatPrice(order.total))
    .replace(/\{\{delivery_method\}\}/g, getDeliveryMethodText(order.delivery_method, lang))
    .replace(/\{\{delivery_address\}\}/g, deliveryAddress)
    .replace(/\{\{payment_method\}\}/g, getPaymentMethodText(order.payment_method, lang))
    .replace(/\{\{payment_status\}\}/g, getPaymentStatusText(order.payment_status || "pending", lang))
    .replace(/\{\{customer_email\}\}/g, order.customer_email)
    .replace(/\{\{customer_phone\}\}/g, order.customer_phone)
    .replace(/\{\{pickup_location\}\}/g, "VAIAVITA")
    .replace(/\{\{pickup_address\}\}/g, "Strada Iuliu Maniu 60, Brașov, 500091")
    .replace(/\{\{awb_number\}\}/g, options.awbNumber || "")
    .replace(/\{\{courier_name\}\}/g, options.courierName || "")
    .replace(/\{\{tracking_url\}\}/g, order.tracking_url || "#")
    .replace(
      /\{\{cancellation_reason\}\}/g,
      options.cancellationReason || (lang === "ro" ? "Motiv nespecificat" : "Reason not specified"),
    )
    .replace(/\{\{retry_url\}\}/g, `https://vaiavita.ro/checkout?order=${order.id}`)
    .replace(
      /\{\{review_url\}\}/g,
      `https://vaiavita.ro/produse/${orderItems[0]?.product_id ? "pasta-dent-tastic" : ""}#reviews`,
    );

  // Replace products HTML
  if (template.includes("{{products_html}}")) {
    const productsHtml =
      template.includes("Rezumat comandă") || template.includes("Order Summary")
        ? generateDeliveredProductsHtml(orderItems)
        : generateProductsHtml(orderItems, lang);
    html = html.replace(/\{\{products_html\}\}/g, productsHtml);
  }

  return html;
}

function generateEmail(
  emailType: string,
  order: any,
  orderItems: any[],
  lang: Language,
  options: {
    awbNumber?: string;
    courierName?: string;
    cancellationReason?: string;
  } = {},
): string {
  const templates = TEMPLATES[lang];
  const template = templates[emailType as keyof typeof templates];

  if (!template) {
    console.error(`Template not found for type: ${emailType}, lang: ${lang}`);
    throw new Error(`Template not found for type: ${emailType}`);
  }

  return replaceTemplatePlaceholders(template, order, orderItems, lang, options);
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, emailType, awbNumber, courierName, cancellationReason, language } =
      (await req.json()) as OrderEmailRequest;

    console.log(`Processing ${emailType} email for order ${orderId}, language: ${language || "auto"}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single();

    if (orderError || !order) {
      console.error("Order not found:", orderError);
      throw new Error("Order not found");
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
      throw new Error("Error fetching order items");
    }

    // Determine language: use provided language, or detect from country
    let lang: Language = language || "ro";
    if (!language && order.shipping_address?.countryCode) {
      lang = order.shipping_address.countryCode === "RO" ? "ro" : "en";
    }

    console.log(`Using language: ${lang} for order to ${order.shipping_address?.countryCode || "RO"}`);

    // Generate email HTML
    const emailHtml = generateEmail(emailType, order, orderItems || [], lang, {
      awbNumber,
      courierName,
      cancellationReason,
    });

    // Get subject
    const subject = EMAIL_SUBJECTS[lang][emailType as keyof typeof EMAIL_SUBJECTS.ro];

    // Determine recipient - admin email for admin_notification, customer email otherwise
    const recipientEmail = emailType === "admin_notification" ? ADMIN_EMAIL : order.customer_email;

    console.log(`Sending email to ${recipientEmail} with subject: ${subject}`);

    // Send email
    const emailResponse = await resend.emails.send({
      from: "VAIAVITA <comenzi@vaiavita.ro>",
      to: [recipientEmail],
      subject: subject,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Update order with email sent timestamp for certain types
    if (emailType === "shipped") {
      await supabase.from("orders").update({ shipped_email_sent_at: new Date().toISOString() }).eq("id", orderId);
    } else if (emailType === "cancelled") {
      await supabase.from("orders").update({ cancelled_email_sent_at: new Date().toISOString() }).eq("id", orderId);
    } else if (emailType === "payment_failed") {
      await supabase
        .from("orders")
        .update({ payment_failed_email_sent_at: new Date().toISOString() })
        .eq("id", orderId);
    } else if (emailType === "payment_reminder") {
      await supabase.from("orders").update({ payment_reminder_sent_at: new Date().toISOString() }).eq("id", orderId);
    }

    return new Response(JSON.stringify({ success: true, emailId: (emailResponse as any).id || "sent" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
