import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReviewCouponRequest {
  review_id: string;
  customer_email: string;
  customer_name: string;
  product_name: string;
  language: 'ro' | 'en';
}

const handler = async (req: Request): Promise<Response> => {
  console.log('=== send-review-coupon function invoked ===');
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    console.log('CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log('Request body received:', JSON.stringify(body));
    
    const { review_id, customer_email, customer_name, product_name }: ReviewCouponRequest = body;

    console.log('Processing review coupon request:', {
      review_id,
      customer_email,
      customer_name,
      product_name
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if a coupon already exists for this review
    const { data: existingCouponForReview } = await supabase
      .from('coupons')
      .select('id, code')
      .eq('review_id', review_id)
      .maybeSingle();

    if (existingCouponForReview) {
      console.log('Coupon already exists for this review:', existingCouponForReview.code);
      return new Response(
        JSON.stringify({ success: true, coupon_code: existingCouponForReview.code, message: 'Coupon already created for this review' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if this email already has ANY review coupon (one coupon per email lifetime)
    const { data: existingCouponForEmail } = await supabase
      .from('coupons')
      .select('id, code')
      .eq('allowed_email', customer_email.toLowerCase())
      .not('review_id', 'is', null)
      .maybeSingle();

    if (existingCouponForEmail) {
      console.log('Customer already received a review coupon before:', existingCouponForEmail.code);
      return new Response(
        JSON.stringify({ 
          success: true, 
          coupon_code: null, 
          message: 'Customer already has a review coupon - no new coupon created',
          existing_coupon: existingCouponForEmail.code
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Determine email language based on customer's order country
    // Check the most recent delivered order for this customer to get their country
    const { data: customerOrder } = await supabase
      .from('orders')
      .select('shipping_address')
      .eq('customer_email', customer_email.toLowerCase())
      .eq('status', 'delivered')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let emailLanguage: 'ro' | 'en' = 'ro'; // Default to Romanian
    
    if (customerOrder?.shipping_address) {
      const shippingAddress = customerOrder.shipping_address as { countryCode?: string };
      const countryCode = shippingAddress.countryCode?.toUpperCase();
      
      // If country is NOT Romania, use English
      if (countryCode && countryCode !== 'RO') {
        emailLanguage = 'en';
        console.log('Customer is from abroad (country:', countryCode, '), using English email');
      } else {
        console.log('Customer is from Romania, using Romanian email');
      }
    }

    console.log('No existing coupon found, creating new one for:', customer_email, 'Language:', emailLanguage);

    // Generate unique coupon code
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const couponCode = `REVIEW-${timestamp}-${randomPart}`;

    // Create the coupon - 15% discount, single use, tied to customer email
    const { data: newCoupon, error: couponError } = await supabase
      .from('coupons')
      .insert({
        code: couponCode,
        description: emailLanguage === 'ro' 
          ? `Cupon 15% pentru recenzie - ${customer_name}` 
          : `15% Review discount - ${customer_name}`,
        discount_type: 'percentage',
        discount_value: 15,
        max_uses: 1,
        is_active: true,
        scope: 'all',
        allowed_email: customer_email.toLowerCase(),
        review_id: review_id,
        valid_from: new Date().toISOString(),
        // Valid for 6 months
        valid_until: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('id, code, coupon_number')
      .single();

    if (couponError) {
      console.error('Error creating coupon:', couponError);
      throw new Error('Failed to create coupon');
    }

    console.log('Created coupon:', newCoupon);

    // Send email if Resend API key is configured
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      const logoUrl = 'https://hivkibfnkaarlzxyokqd.supabase.co/storage/v1/object/public/products/logo-mail-craciun.png';

      const emailHtmlRo = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cupon de reducere - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e8f4f2 0%, #dceeed 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #038578 50%, #04a396 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <img src="${logoUrl}" alt="VAIAVITA" width="150" style="display: block; margin: 0 auto 28px auto;" />
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">🎁</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Mulțumim pentru recenzia ta!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">Ai primit un cupon special de reducere</p>
            </td>
          </tr>

          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafcfb 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 24px 0; line-height: 1.6; text-align: center;">
                Dragă <strong style="color: #025951;">${customer_name}</strong>, îți mulțumim că ai lăsat o recenzie pentru <strong>${product_name}</strong>!
              </p>

              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                Ca semn de apreciere, îți oferim un cupon de <strong style="color: #025951;">15% reducere</strong> la următoarea ta comandă:
              </p>

              <!-- COUPON BOX -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #025951 0%, #037367 100%); border-radius: 16px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 28px 24px; text-align: center;">
                    <p style="font-size: 14px; color: rgba(255,255,255,0.8); margin: 0 0 12px 0;">Codul tău de reducere:</p>
                    <p style="font-size: 32px; font-weight: bold; letter-spacing: 3px; color: #fff; margin: 0; font-family: monospace;">${couponCode}</p>
                  </td>
                </tr>
              </table>

              <!-- INFO BOX -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(145deg, #f8faf9 0%, #f0f5f4 100%); border-radius: 14px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="font-size: 14px; color: #666; margin: 0 0 8px 0;"><strong>Important:</strong></p>
                    <ul style="font-size: 14px; color: #666; margin: 0; padding-left: 20px; line-height: 1.8;">
                      <li>Cuponul poate fi folosit o singură dată</li>
                      <li>Valid doar cu adresa de email <strong>${customer_email}</strong></li>
                      <li>Valabil timp de 6 luni de la primirea acestui email</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="https://vaiavita.ro/produse" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      Cumpără acum →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <p style="font-size: 12px; color: #888; margin: 0;">VAIAVITA S.R.L. | CUI 49945945 | J8/1310/2024</p>
              <p style="font-size: 11px; color: #666; margin: 10px 0 0 0;">© 2025 VAIAVITA. Toate drepturile rezervate.</p>
              <p style="font-size: 11px; margin: 10px 0 0 0;"><a href="https://vaiavita.ro" style="color: #888; text-decoration: underline;">vaiavita.ro</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const emailHtmlEn = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Discount Coupon - VAIAVITA</title>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(180deg, #e8f4f2 0%, #dceeed 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #025951 0%, #038578 50%, #04a396 100%); border-radius: 24px 24px 0 0; padding: 40px 40px; text-align: center;">
              <img src="${logoUrl}" alt="VAIAVITA" width="150" style="display: block; margin: 0 auto 28px auto;" />
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; text-align: center;">
                    <span style="color: #fff; font-size: 30px; line-height: 60px;">🎁</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #fff; font-size: 26px; font-weight: 700; margin: 20px 0 6px 0;">Thank you for your review!</h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">You've received a special discount coupon</p>
            </td>
          </tr>

          <!-- MAIN CONTENT -->
          <tr>
            <td style="background: linear-gradient(180deg, #ffffff 0%, #fafcfb 100%); padding: 36px 40px;">
              <p style="font-size: 16px; color: #444; margin: 0 0 24px 0; line-height: 1.6; text-align: center;">
                Dear <strong style="color: #025951;">${customer_name}</strong>, thank you for leaving a review for <strong>${product_name}</strong>!
              </p>

              <p style="font-size: 16px; color: #444; margin: 0 0 32px 0; line-height: 1.6; text-align: center;">
                As a token of appreciation, we're giving you a <strong style="color: #025951;">15% discount</strong> coupon for your next order:
              </p>

              <!-- COUPON BOX -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #025951 0%, #037367 100%); border-radius: 16px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 28px 24px; text-align: center;">
                    <p style="font-size: 14px; color: rgba(255,255,255,0.8); margin: 0 0 12px 0;">Your discount code:</p>
                    <p style="font-size: 32px; font-weight: bold; letter-spacing: 3px; color: #fff; margin: 0; font-family: monospace;">${couponCode}</p>
                  </td>
                </tr>
              </table>

              <!-- INFO BOX -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(145deg, #f8faf9 0%, #f0f5f4 100%); border-radius: 14px; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="font-size: 14px; color: #666; margin: 0 0 8px 0;"><strong>Important:</strong></p>
                    <ul style="font-size: 14px; color: #666; margin: 0; padding-left: 20px; line-height: 1.8;">
                      <li>This coupon can only be used once</li>
                      <li>Valid only with the email address <strong>${customer_email}</strong></li>
                      <li>Valid for 6 months from the date of this email</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="https://vaiavita.ro/produse" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #025951 0%, #038578 100%); color: #ffffff; text-decoration: none; border-radius: 50px; font-size: 15px; font-weight: 600;">
                      Shop now →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); border-radius: 0 0 24px 24px; padding: 32px 40px; text-align: center;">
              <p style="font-size: 12px; color: #888; margin: 0;">VAIAVITA S.R.L. | CUI 49945945 | J8/1310/2024</p>
              <p style="font-size: 11px; color: #666; margin: 10px 0 0 0;">© 2025 VAIAVITA. All rights reserved.</p>
              <p style="font-size: 11px; margin: 10px 0 0 0;"><a href="https://vaiavita.ro" style="color: #888; text-decoration: underline;">vaiavita.ro</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      const emailHtml = emailLanguage === 'ro' ? emailHtmlRo : emailHtmlEn;

      try {
        console.log('Sending email via Resend to:', customer_email, 'Language:', emailLanguage);
        const emailResponse = await resend.emails.send({
          from: "VAIAVITA <comenzi@vaiavita.ro>",
          to: [customer_email],
          subject: emailLanguage === 'ro' 
            ? "🎁 Cuponul tău de 15% reducere - Mulțumim pentru recenzie!" 
            : "🎁 Your 15% discount coupon - Thank you for your review!",
          html: emailHtml,
        });
        console.log('Email sent successfully:', JSON.stringify(emailResponse));
      } catch (emailError: any) {
        console.error('Error sending email:', emailError?.message || emailError);
        // Don't fail the whole request if email fails - coupon is still created
      }
    } else {
      console.log('RESEND_API_KEY not configured, skipping email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        coupon_code: newCoupon.code, 
        coupon_number: newCoupon.coupon_number,
        message: 'Coupon created and email sent' 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error in send-review-coupon:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);