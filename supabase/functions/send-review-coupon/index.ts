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
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { review_id, customer_email, customer_name, product_name, language }: ReviewCouponRequest = await req.json();

    console.log('Received request to create review coupon for:', customer_email);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if a coupon already exists for this review
    const { data: existingCoupon } = await supabase
      .from('coupons')
      .select('id, code')
      .eq('review_id', review_id)
      .maybeSingle();

    if (existingCoupon) {
      console.log('Coupon already exists for this review:', existingCoupon.code);
      return new Response(
        JSON.stringify({ success: true, coupon_code: existingCoupon.code, message: 'Coupon already created' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate unique coupon code
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    const couponCode = `REVIEW-${timestamp}-${randomPart}`;

    // Create the coupon - 15% discount, single use, tied to customer email
    const { data: newCoupon, error: couponError } = await supabase
      .from('coupons')
      .insert({
        code: couponCode,
        description: language === 'ro' 
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

      const emailHtml = language === 'ro' 
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #025951; margin-bottom: 20px;">Mulțumim pentru recenzia ta! 🎉</h1>
            <p>Dragă ${customer_name},</p>
            <p>Îți mulțumim că ai lăsat o recenzie pentru <strong>${product_name}</strong>!</p>
            <p>Ca semn de apreciere, îți oferim un cupon de <strong>15% reducere</strong> pentru următoarea ta comandă:</p>
            <div style="background: linear-gradient(135deg, #025951 0%, #037367 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
              <p style="font-size: 14px; margin-bottom: 10px; opacity: 0.9;">Codul tău de reducere:</p>
              <p style="font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 0;">${couponCode}</p>
            </div>
            <p><strong>Important:</strong> Acest cupon poate fi folosit o singură dată și este valabil doar cu adresa de email <strong>${customer_email}</strong>.</p>
            <p>Cuponul este valabil timp de 6 luni de la data primirii acestui email.</p>
            <p style="margin-top: 30px;">Cu drag,<br>Echipa VAIAVITA</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #666;">VAIAVITA S.R.L. | CUI 49945945 | J8/1310/2024</p>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #025951; margin-bottom: 20px;">Thank you for your review! 🎉</h1>
            <p>Dear ${customer_name},</p>
            <p>Thank you for leaving a review for <strong>${product_name}</strong>!</p>
            <p>As a token of appreciation, we're giving you a <strong>15% discount</strong> coupon for your next order:</p>
            <div style="background: linear-gradient(135deg, #025951 0%, #037367 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 20px 0;">
              <p style="font-size: 14px; margin-bottom: 10px; opacity: 0.9;">Your discount code:</p>
              <p style="font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 0;">${couponCode}</p>
            </div>
            <p><strong>Important:</strong> This coupon can only be used once and is valid only with the email address <strong>${customer_email}</strong>.</p>
            <p>The coupon is valid for 6 months from the date of this email.</p>
            <p style="margin-top: 30px;">Best regards,<br>The VAIAVITA Team</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 12px; color: #666;">VAIAVITA S.R.L. | CUI 49945945 | J8/1310/2024</p>
          </div>
        `;

      try {
        const emailResponse = await resend.emails.send({
          from: "VAIAVITA <noreply@vaiavita.com>",
          to: [customer_email],
          subject: language === 'ro' 
            ? "🎁 Cuponul tău de 15% reducere - Mulțumim pentru recenzie!" 
            : "🎁 Your 15% discount coupon - Thank you for your review!",
          html: emailHtml,
        });
        console.log('Email sent successfully:', emailResponse);
      } catch (emailError) {
        console.error('Error sending email:', emailError);
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
