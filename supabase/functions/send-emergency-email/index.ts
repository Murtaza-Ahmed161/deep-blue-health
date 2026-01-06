import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  text: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { to, subject, html, text }: EmailRequest = await req.json()

    // Validate required fields
    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get email service configuration from environment
    const emailProvider = Deno.env.get('EMAIL_PROVIDER') || 'resend'
    const apiKey = Deno.env.get('EMAIL_API_KEY')
    const fromAddress = Deno.env.get('EMAIL_FROM_ADDRESS') || 'emergency@neuraltrace.com'
    const fromName = Deno.env.get('EMAIL_FROM_NAME') || 'NeuralTrace Emergency System'

    if (!apiKey) {
      console.error('EMAIL_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let result;

    // Send email based on configured provider
    if (emailProvider === 'resend') {
      result = await sendWithResend(apiKey, fromAddress, fromName, to, subject, html, text)
    } else if (emailProvider === 'sendgrid') {
      result = await sendWithSendGrid(apiKey, fromAddress, fromName, to, subject, html, text)
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported email provider: ${emailProvider}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId: result.messageId,
          provider: emailProvider 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          error: result.error,
          provider: emailProvider 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error in send-emergency-email function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function sendWithResend(
  apiKey: string,
  fromAddress: string,
  fromName: string,
  to: string,
  subject: string,
  html: string,
  text: string
) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromAddress}>`,
        to: [to],
        subject: subject,
        html: html,
        text: text,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return { success: true, messageId: data.id }
    } else {
      console.error('Resend API error:', data)
      return { success: false, error: data.message || 'Email sending failed' }
    }
  } catch (error) {
    console.error('Error sending with Resend:', error)
    return { success: false, error: 'Network error' }
  }
}

async function sendWithSendGrid(
  apiKey: string,
  fromAddress: string,
  fromName: string,
  to: string,
  subject: string,
  html: string,
  text: string
) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: to }],
          subject: subject,
        }],
        from: {
          email: fromAddress,
          name: fromName,
        },
        content: [
          {
            type: 'text/plain',
            value: text,
          },
          {
            type: 'text/html',
            value: html,
          },
        ],
      }),
    })

    if (response.ok) {
      // SendGrid returns 202 with no body on success
      const messageId = response.headers.get('x-message-id') || 'sendgrid-sent'
      return { success: true, messageId }
    } else {
      const data = await response.json()
      console.error('SendGrid API error:', data)
      return { success: false, error: data.errors?.[0]?.message || 'Email sending failed' }
    }
  } catch (error) {
    console.error('Error sending with SendGrid:', error)
    return { success: false, error: 'Network error' }
  }
}

/* To deploy this function:
1. Make sure you have the Supabase CLI installed
2. Set up environment variables in your Supabase project:
   - EMAIL_PROVIDER (resend or sendgrid)
   - EMAIL_API_KEY (your email service API key)
   - EMAIL_FROM_ADDRESS (verified sender email)
   - EMAIL_FROM_NAME (sender name)
3. Deploy with: supabase functions deploy send-emergency-email
*/