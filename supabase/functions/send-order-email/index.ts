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
  emailType: 'confirmation' | 'processing' | 'ready_pickup' | 'shipped' | 'delivered' | 'cancelled' | 'payment_failed' | 'payment_reminder';
  awbNumber?: string;
  courierName?: string;
  cancellationReason?: string;
  language?: 'ro' | 'en';
}

const EMAIL_SUBJECTS = {
  ro: {
    confirmation: 'Comanda ta a fost plasată cu succes!',
    processing: 'Comanda ta este în procesare',
    ready_pickup: 'Comanda ta este pregătită pentru ridicare',
    shipped: 'Comanda ta a fost expediată!',
    delivered: 'Comanda ta a fost finalizată - Lasă o recenzie și primești 15% reducere!',
    cancelled: 'Comanda ta a fost anulată',
    payment_failed: 'Plata pentru comanda ta nu a putut fi procesată',
    payment_reminder: 'Reminder: Finalizează plata pentru comanda ta',
  },
  en: {
    confirmation: 'Your order has been placed successfully!',
    processing: 'Your order is being processed',
    ready_pickup: 'Your order is ready for pickup',
    shipped: 'Your order has been shipped!',
    delivered: 'Your order has been delivered - Leave a review and get 15% off!',
    cancelled: 'Your order has been cancelled',
    payment_failed: 'Payment for your order could not be processed',
    payment_reminder: 'Reminder: Complete payment for your order',
  }
};

function formatPrice(price: number): string {
  return `${price.toFixed(2)} lei`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function generateOrderConfirmationEmail(order: any, orderItems: any[]): string {
  const productRows = orderItems.map(item => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <div>
            <div style="font-weight: 600; color: #1f2937;">${item.product_name}</div>
            <div style="font-size: 14px; color: #6b7280;">Cantitate: ${item.quantity}</div>
          </div>
        </div>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #1f2937;">
        ${formatPrice(item.total_price)}
      </td>
    </tr>
  `).join('');

  const deliveryMethods: Record<string, string> = {
    shipping: 'Curier la adresă',
    pickup: 'Ridicare personală din Brașov',
    locker: 'EasyBox',
    postal: 'Poșta Română'
  };
  const deliveryMethodText = deliveryMethods[order.delivery_method as string] || order.delivery_method;

  const paymentMethods: Record<string, string> = {
    stripe: 'Card online',
    cash_on_delivery: 'Ramburs la livrare'
  };
  const paymentMethodText = paymentMethods[order.payment_method as string] || order.payment_method;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header with Logo -->
    <div style="background: linear-gradient(135deg, #025951 0%, #047857 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
      <img src="https://vaiavita.ro/logo-light.png" alt="VAIAVITA" style="height: 50px; margin-bottom: 20px;">
      <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 30px;">✓</span>
      </div>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Comandă plasată cu succes!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Mulțumim pentru comanda ta, ${order.customer_first_name}!</p>
    </div>

    <!-- Main Content Card -->
    <div style="background: white; border-radius: 0 0 16px 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      
      <!-- Order Info Bar -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
        <div>
          <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Număr comandă</div>
          <div style="font-size: 18px; font-weight: 700; color: #025951;">${order.order_number}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Data comenzii</div>
          <div style="font-size: 16px; font-weight: 600; color: #1f2937;">${formatDate(order.created_at)}</div>
        </div>
      </div>

      <!-- Products Section -->
      <div style="margin-bottom: 25px;">
        <h2 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 15px; padding-bottom: 10px; border-bottom: 2px solid #025951;">Produse comandate</h2>
        <table style="width: 100%; border-collapse: collapse;">
          ${productRows}
        </table>
      </div>

      <!-- Order Summary -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Subtotal</span>
          <span style="color: #1f2937; font-weight: 500;">${formatPrice(order.subtotal)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Transport</span>
          <span style="color: #1f2937; font-weight: 500;">${order.shipping_cost === 0 ? 'GRATUIT' : formatPrice(order.shipping_cost || 0)}</span>
        </div>
        ${order.discount > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="color: #6b7280;">Discount</span>
          <span style="color: #16a34a; font-weight: 500;">-${formatPrice(order.discount)}</span>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid #025951; margin-top: 10px;">
          <span style="font-size: 18px; font-weight: 700; color: #025951;">Total</span>
          <span style="font-size: 18px; font-weight: 700; color: #025951;">${formatPrice(order.total)}</span>
        </div>
      </div>

      <!-- Delivery & Payment Info -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
          <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Metoda de livrare</div>
          <div style="font-weight: 600; color: #1f2937;">${deliveryMethodText}</div>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px;">
          <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Metoda de plată</div>
          <div style="font-weight: 600; color: #1f2937;">${paymentMethodText}</div>
        </div>
      </div>

      <!-- Shipping Address -->
      ${order.shipping_address ? `
      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Adresa de livrare</div>
        <div style="color: #1f2937;">
          ${order.customer_first_name} ${order.customer_last_name}<br>
          ${order.shipping_address.address || ''}${order.shipping_address.apartment ? `, ${order.shipping_address.apartment}` : ''}<br>
          ${order.shipping_address.city || ''}, ${order.shipping_address.county || ''} ${order.shipping_address.postalCode || ''}<br>
          ${order.shipping_address.country || 'România'}
        </div>
      </div>
      ` : ''}

      <!-- Contact Section -->
      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 12px;">
        <p style="color: #6b7280; margin: 0 0 10px;">Ai întrebări despre comandă?</p>
        <a href="tel:0732111117" style="color: #025951; font-weight: 600; text-decoration: none; display: block; margin-bottom: 8px;">📞 0732 111 117</a>
        <a href="mailto:office@vaiavita.com" style="color: #025951; font-weight: 600; text-decoration: none;">✉️ office@vaiavita.com</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 30px 20px;">
      <img src="https://vaiavita.ro/logo-dark.png" alt="VAIAVITA" style="height: 35px; margin-bottom: 15px;">
      <div style="margin-bottom: 15px;">
        <a href="https://vaiavita.ro/produse" style="color: #025951; text-decoration: none; margin: 0 10px; font-size: 14px;">Produse</a>
        <a href="https://vaiavita.ro/despre" style="color: #025951; text-decoration: none; margin: 0 10px; font-size: 14px;">Despre noi</a>
        <a href="https://vaiavita.ro/contact" style="color: #025951; text-decoration: none; margin: 0 10px; font-size: 14px;">Contact</a>
      </div>
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} VAIAVITA S.R.L. | CUI 49945945<br>
        Toate drepturile rezervate.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateProcessingEmail(order: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #025951 0%, #047857 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
      <img src="https://vaiavita.ro/logo-light.png" alt="VAIAVITA" style="height: 50px; margin-bottom: 20px;">
      <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 30px;">📦</span>
      </div>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Comanda ta este în procesare!</h1>
    </div>
    <div style="background: white; border-radius: 0 0 16px 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Număr comandă</div>
        <div style="font-size: 24px; font-weight: 700; color: #025951;">${order.order_number}</div>
      </div>
      
      <!-- Progress Bar -->
      <div style="margin-bottom: 25px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="font-size: 14px; color: #025951; font-weight: 600;">Plasată</span>
          <span style="font-size: 14px; color: #025951; font-weight: 600;">În procesare</span>
          <span style="font-size: 14px; color: #9ca3af;">Expediată</span>
          <span style="font-size: 14px; color: #9ca3af;">Livrată</span>
        </div>
        <div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #025951, #047857); width: 50%; height: 100%; border-radius: 10px;"></div>
        </div>
      </div>

      <p style="color: #4b5563; text-align: center; margin-bottom: 25px;">
        Pregătim produsele tale cu grijă. Te vom anunța când comanda va fi expediată.
      </p>

      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 12px;">
        <p style="color: #6b7280; margin: 0 0 10px;">Ai întrebări despre comandă?</p>
        <a href="tel:0732111117" style="color: #025951; font-weight: 600; text-decoration: none; display: block; margin-bottom: 8px;">📞 0732 111 117</a>
        <a href="mailto:office@vaiavita.com" style="color: #025951; font-weight: 600; text-decoration: none;">✉️ office@vaiavita.com</a>
      </div>
    </div>
    <div style="text-align: center; padding: 30px 20px;">
      <img src="https://vaiavita.ro/logo-dark.png" alt="VAIAVITA" style="height: 35px; margin-bottom: 15px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VAIAVITA S.R.L.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateReadyPickupEmail(order: any): string {
  const PICKUP_ADDRESS = "Strada Iuliu Maniu 60, Brașov, 500091";
  const COMPANY_PHONE = "0732 111 117";
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #025951 0%, #047857 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
      <img src="https://vaiavita.ro/logo-light.png" alt="VAIAVITA" style="height: 50px; margin-bottom: 20px;">
      <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 30px;">🏪</span>
      </div>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Comanda ta este pregătită!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Te așteptăm să o ridici, ${order.customer_first_name}!</p>
    </div>
    <div style="background: white; border-radius: 0 0 16px 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      
      <!-- Pickup Location Box -->
      <div style="background: linear-gradient(135deg, #025951 0%, #047857 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 32px; margin-bottom: 10px;">📍</div>
        <div style="font-size: 12px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Locație ridicare</div>
        <div style="font-size: 18px; font-weight: 600; color: white;">${PICKUP_ADDRESS}</div>
      </div>

      <!-- Order Number -->
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Număr comandă</div>
        <div style="font-size: 24px; font-weight: 700; color: #025951;">${order.order_number}</div>
      </div>

      <!-- Instructions -->
      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <div style="font-size: 14px; font-weight: 600; color: #025951; margin-bottom: 15px;">📋 Instrucțiuni ridicare:</div>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.8;">
          <li>Prezintă numărul comenzii: <strong>${order.order_number}</strong></li>
          <li>Ai la tine un act de identitate</li>
          <li>Program: Luni - Vineri, 10:00 - 18:00</li>
        </ul>
      </div>

      <!-- Total -->
      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Total de plată</div>
            <div style="font-size: 22px; font-weight: 700; color: #025951;">${order.total.toFixed(2)} lei</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase;">Plată</div>
            <div style="font-size: 14px; color: #1f2937;">${order.payment_method === 'cash_on_delivery' ? 'Cash la ridicare' : 'Card online'}</div>
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 12px;">
        <p style="color: #6b7280; margin: 0 0 15px;">Ai întrebări? Sună-ne:</p>
        <a href="tel:${COMPANY_PHONE.replace(/\s/g, '')}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #025951 0%, #047857 100%); color: white; text-decoration: none; border-radius: 50px; font-size: 16px; font-weight: 600;">
          📞 ${COMPANY_PHONE}
        </a>
      </div>
    </div>
    <div style="text-align: center; padding: 30px 20px;">
      <img src="https://vaiavita.ro/logo-dark.png" alt="VAIAVITA" style="height: 35px; margin-bottom: 15px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VAIAVITA S.R.L.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateShippedEmail(order: any, awbNumber: string, courierName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #025951 0%, #047857 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
      <img src="https://vaiavita.ro/logo-light.png" alt="VAIAVITA" style="height: 50px; margin-bottom: 20px;">
      <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 30px;">🚚</span>
      </div>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Comanda ta a fost expediată!</h1>
    </div>
    <div style="background: white; border-radius: 0 0 16px 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      
      <!-- AWB Box -->
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 12px; color: #1e40af; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px;">Număr AWB</div>
        <div style="font-size: 28px; font-weight: 700; color: #1e3a8a; letter-spacing: 2px;">${awbNumber}</div>
        <div style="font-size: 14px; color: #3b82f6; margin-top: 10px;">Curier: ${courierName}</div>
      </div>

      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Număr comandă</div>
        <div style="font-size: 20px; font-weight: 700; color: #025951;">${order.order_number}</div>
      </div>

      <!-- Progress Bar -->
      <div style="margin-bottom: 25px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="font-size: 14px; color: #025951; font-weight: 600;">Plasată</span>
          <span style="font-size: 14px; color: #025951; font-weight: 600;">În procesare</span>
          <span style="font-size: 14px; color: #025951; font-weight: 600;">Expediată</span>
          <span style="font-size: 14px; color: #9ca3af;">Livrată</span>
        </div>
        <div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #025951, #047857); width: 75%; height: 100%; border-radius: 10px;"></div>
        </div>
      </div>

      <p style="color: #4b5563; text-align: center; margin-bottom: 25px;">
        Coletul tău este în drum! Poți urmări livrarea folosind numărul AWB de mai sus.
      </p>

      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 12px;">
        <p style="color: #6b7280; margin: 0 0 10px;">Ai întrebări despre livrare?</p>
        <a href="tel:0732111117" style="color: #025951; font-weight: 600; text-decoration: none; display: block; margin-bottom: 8px;">📞 0732 111 117</a>
        <a href="mailto:office@vaiavita.com" style="color: #025951; font-weight: 600; text-decoration: none;">✉️ office@vaiavita.com</a>
      </div>
    </div>
    <div style="text-align: center; padding: 30px 20px;">
      <img src="https://vaiavita.ro/logo-dark.png" alt="VAIAVITA" style="height: 35px; margin-bottom: 15px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VAIAVITA S.R.L.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateDeliveredEmail(order: any, orderItems: any[]): string {
  // Get first product for review link
  const firstProduct = orderItems[0];
  const reviewLink = firstProduct?.product_id 
    ? `https://vaiavita.ro/produse/${firstProduct.product_id}#reviews`
    : 'https://vaiavita.ro/produse';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #d1fae5 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #025951 0%, #047857 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
      <img src="https://vaiavita.ro/logo-light.png" alt="VAIAVITA" style="height: 50px; margin-bottom: 20px;">
      <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 30px;">🎉</span>
      </div>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Comanda ta a fost finalizată!</h1>
    </div>
    <div style="background: white; border-radius: 0 0 16px 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      
      <!-- Progress Bar Complete -->
      <div style="margin-bottom: 25px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
          <span style="font-size: 14px; color: #025951; font-weight: 600;">Plasată</span>
          <span style="font-size: 14px; color: #025951; font-weight: 600;">În procesare</span>
          <span style="font-size: 14px; color: #025951; font-weight: 600;">Expediată</span>
          <span style="font-size: 14px; color: #025951; font-weight: 600;">Livrată ✓</span>
        </div>
        <div style="background: #e5e7eb; border-radius: 10px; height: 8px; overflow: hidden;">
          <div style="background: linear-gradient(90deg, #025951, #047857); width: 100%; height: 100%; border-radius: 10px;"></div>
        </div>
      </div>

      <p style="color: #4b5563; text-align: center; margin-bottom: 25px;">
        Sperăm că ești mulțumit de produsele noastre! Ne-ar plăcea să aflăm părerea ta.
      </p>

      <!-- Review CTA Box -->
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 25px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 40px; margin-bottom: 15px;">⭐</div>
        <h3 style="color: #92400e; margin: 0 0 10px; font-size: 18px;">Lasă o recenzie și primești 15% reducere!</h3>
        <p style="color: #a16207; font-size: 14px; margin: 0 0 20px;">Folosește aceeași adresă de email ca la comandă pentru a primi codul de reducere.</p>
        <a href="${reviewLink}" style="display: inline-block; background: linear-gradient(135deg, #025951 0%, #047857 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">Lasă o recenzie</a>
      </div>

      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Număr comandă</div>
        <div style="font-size: 20px; font-weight: 700; color: #025951;">${order.order_number}</div>
      </div>

      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 12px;">
        <p style="color: #6b7280; margin: 0 0 10px;">Mulțumim că ai ales VAIAVITA!</p>
        <a href="https://vaiavita.ro/produse" style="color: #025951; font-weight: 600; text-decoration: none;">Vezi alte produse →</a>
      </div>
    </div>
    <div style="text-align: center; padding: 30px 20px;">
      <img src="https://vaiavita.ro/logo-dark.png" alt="VAIAVITA" style="height: 35px; margin-bottom: 15px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VAIAVITA S.R.L.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generateCancelledEmail(order: any, cancellationReason: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
      <img src="https://vaiavita.ro/logo-light.png" alt="VAIAVITA" style="height: 50px; margin-bottom: 20px;">
      <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 30px;">✕</span>
      </div>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Comanda ta a fost anulată</h1>
    </div>
    <div style="background: white; border-radius: 0 0 16px 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      
      <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Număr comandă</div>
        <div style="font-size: 24px; font-weight: 700; color: #dc2626;">${order.order_number}</div>
      </div>

      ${cancellationReason ? `
      <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <div style="font-size: 12px; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Motiv anulare</div>
        <p style="color: #7f1d1d; margin: 0;">${cancellationReason}</p>
      </div>
      ` : ''}

      <p style="color: #4b5563; text-align: center; margin-bottom: 25px;">
        Ne pare rău că nu am putut finaliza această comandă. Dacă ai întrebări sau dorești să plasezi o nouă comandă, suntem aici să te ajutăm.
      </p>

      <div style="text-align: center; margin-bottom: 25px;">
        <a href="https://vaiavita.ro/produse" style="display: inline-block; background: linear-gradient(135deg, #025951 0%, #047857 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">Plasează o nouă comandă</a>
      </div>

      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 12px;">
        <p style="color: #6b7280; margin: 0 0 10px;">Ai întrebări?</p>
        <a href="tel:0732111117" style="color: #025951; font-weight: 600; text-decoration: none; display: block; margin-bottom: 8px;">📞 0732 111 117</a>
        <a href="mailto:office@vaiavita.com" style="color: #025951; font-weight: 600; text-decoration: none;">✉️ office@vaiavita.com</a>
      </div>
    </div>
    <div style="text-align: center; padding: 30px 20px;">
      <img src="https://vaiavita.ro/logo-dark.png" alt="VAIAVITA" style="height: 35px; margin-bottom: 15px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VAIAVITA S.R.L.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePaymentFailedEmail(order: any): string {
  const retryLink = `https://vaiavita.ro/checkout?retry=${order.id}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
      <img src="https://vaiavita.ro/logo-light.png" alt="VAIAVITA" style="height: 50px; margin-bottom: 20px;">
      <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 30px;">⚠️</span>
      </div>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Plata nu a putut fi procesată</h1>
    </div>
    <div style="background: white; border-radius: 0 0 16px 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      
      <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 12px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Număr comandă</div>
        <div style="font-size: 24px; font-weight: 700; color: #b45309;">${order.order_number}</div>
      </div>

      <p style="color: #4b5563; text-align: center; margin-bottom: 25px;">
        Din păcate, plata pentru comanda ta nu a putut fi procesată. Te rugăm să verifici datele cardului și să încerci din nou.
      </p>

      <div style="text-align: center; margin-bottom: 25px;">
        <a href="${retryLink}" style="display: inline-block; background: linear-gradient(135deg, #025951 0%, #047857 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">Încearcă din nou</a>
      </div>

      <div style="background: #fef3c7; border-radius: 12px; padding: 15px; margin-bottom: 25px;">
        <p style="color: #92400e; font-size: 14px; margin: 0; text-align: center;">
          💡 Produsele tale sunt rezervate timp de 24 de ore.
        </p>
      </div>

      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 12px;">
        <p style="color: #6b7280; margin: 0 0 10px;">Ai nevoie de ajutor?</p>
        <a href="tel:0732111117" style="color: #025951; font-weight: 600; text-decoration: none; display: block; margin-bottom: 8px;">📞 0732 111 117</a>
        <a href="mailto:office@vaiavita.com" style="color: #025951; font-weight: 600; text-decoration: none;">✉️ office@vaiavita.com</a>
      </div>
    </div>
    <div style="text-align: center; padding: 30px 20px;">
      <img src="https://vaiavita.ro/logo-dark.png" alt="VAIAVITA" style="height: 35px; margin-bottom: 15px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VAIAVITA S.R.L.</p>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePaymentReminderEmail(order: any): string {
  const retryLink = `https://vaiavita.ro/checkout?retry=${order.id}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 50%, #fecaca 100%); min-height: 100vh;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
      <img src="https://vaiavita.ro/logo-light.png" alt="VAIAVITA" style="height: 50px; margin-bottom: 20px;">
      <div style="background: rgba(255,255,255,0.2); border-radius: 50%; width: 60px; height: 60px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 30px;">⏰</span>
      </div>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Ultima șansă!</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">Finalizează plata în următoarele ore</p>
    </div>
    <div style="background: white; border-radius: 0 0 16px 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
      
      <!-- Urgency Box -->
      <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #fca5a5; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 16px; font-weight: 600; color: #dc2626;">⚠️ Rezervarea expiră în curând!</div>
        <p style="color: #991b1b; font-size: 14px; margin: 10px 0 0;">Produsele din comanda ta vor fi eliberate dacă plata nu este finalizată.</p>
      </div>

      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
        <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Număr comandă</div>
        <div style="font-size: 24px; font-weight: 700; color: #1f2937;">${order.order_number}</div>
        <div style="font-size: 20px; font-weight: 700; color: #025951; margin-top: 10px;">Total: ${formatPrice(order.total)}</div>
      </div>

      <div style="text-align: center; margin-bottom: 25px;">
        <a href="${retryLink}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; text-decoration: none; padding: 18px 40px; border-radius: 8px; font-weight: 600; font-size: 18px;">Finalizează plata acum</a>
      </div>

      <p style="color: #6b7280; text-align: center; font-size: 14px; margin-bottom: 25px;">
        Dacă nu mai dorești această comandă, poți ignora acest email.
      </p>

      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 12px;">
        <p style="color: #6b7280; margin: 0 0 10px;">Ai întrebări?</p>
        <a href="tel:0732111117" style="color: #025951; font-weight: 600; text-decoration: none; display: block; margin-bottom: 8px;">📞 0732 111 117</a>
        <a href="mailto:office@vaiavita.com" style="color: #025951; font-weight: 600; text-decoration: none;">✉️ office@vaiavita.com</a>
      </div>
    </div>
    <div style="text-align: center; padding: 30px 20px;">
      <img src="https://vaiavita.ro/logo-dark.png" alt="VAIAVITA" style="height: 35px; margin-bottom: 15px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} VAIAVITA S.R.L.</p>
    </div>
  </div>
</body>
</html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, emailType, awbNumber, courierName, cancellationReason, language = 'ro' }: OrderEmailRequest = await req.json();

    console.log(`Sending ${emailType} email for order ${orderId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Error fetching order:", orderError);
      throw new Error(`Order not found: ${orderId}`);
    }

    // Fetch order items
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    if (itemsError) {
      console.error("Error fetching order items:", itemsError);
    }

    let htmlContent: string;
    const subject = EMAIL_SUBJECTS[language][emailType];

    switch (emailType) {
      case 'confirmation':
        htmlContent = generateOrderConfirmationEmail(order, orderItems || []);
        break;
      case 'processing':
        htmlContent = generateProcessingEmail(order);
        break;
      case 'ready_pickup':
        htmlContent = generateReadyPickupEmail(order);
        break;
      case 'shipped':
        htmlContent = generateShippedEmail(order, awbNumber || 'N/A', courierName || 'Curier');
        break;
      case 'delivered':
        htmlContent = generateDeliveredEmail(order, orderItems || []);
        break;
      case 'cancelled':
        htmlContent = generateCancelledEmail(order, cancellationReason || '');
        break;
      case 'payment_failed':
        htmlContent = generatePaymentFailedEmail(order);
        break;
      case 'payment_reminder':
        htmlContent = generatePaymentReminderEmail(order);
        break;
      default:
        throw new Error(`Unknown email type: ${emailType}`);
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "VAIAVITA <noreply@vaiavita.ro>",
      to: [order.customer_email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
