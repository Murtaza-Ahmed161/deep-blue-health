import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SmsRequest {
  to: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { to, message }: SmsRequest = await req.json()

    // Validate required fields
    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, message' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    if (!phoneRegex.test(to.replace(/[\s\-\(\)]/g, ''))) {
      return new Response(
        JSON.stringify({ error: 'Invalid phone number format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get SMS service configuration from environment
    const smsProvider = Deno.env.get('SMS_PROVIDER') || 'twilio'
    const apiKey = Deno.env.get('SMS_API_KEY')
    const apiSecret = Deno.env.get('SMS_API_SECRET')
    const fromNumber = Deno.env.get('SMS_FROM_NUMBER')

    if (!apiKey || !fromNumber) {
      console.error('SMS service not properly configured')
      return new Response(
        JSON.stringify({ error: 'SMS service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let result;

    // Send SMS based on configured provider
    if (smsProvider === 'twilio') {
      if (!apiSecret) {
        return new Response(
          JSON.stringify({ error: 'Twilio API secret not configured' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      result = await sendWithTwilio(apiKey, apiSecret, fromNumber, to, message)
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported SMS provider: ${smsProvider}` }),
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
          provider: smsProvider 
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
          provider: smsProvider 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error in send-emergency-sms function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function sendWithTwilio(
  accountSid: string,
  authToken: string,
  fromNumber: string,
  to: string,
  message: string
) {
  try {
    // Create basic auth header for Twilio
    const auth = btoa(`${accountSid}:${authToken}`)
    
    // Prepare form data
    const formData = new URLSearchParams()
    formData.append('From', fromNumber)
    formData.append('To', to)
    formData.append('Body', message)

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    const data = await response.json()

    if (response.ok) {
      return { success: true, messageId: data.sid }
    } else {
      console.error('Twilio API error:', data)
      return { success: false, error: data.message || 'SMS sending failed' }
    }
  } catch (error) {
    console.error('Error sending with Twilio:', error)
    return { success: false, error: 'Network error' }
  }
}

/* To deploy this function:
1. Make sure you have the Supabase CLI installed
2. Set up environment variables in your Supabase project:
   - SMS_PROVIDER (currently only 'twilio' supported)
   - SMS_API_KEY (Twilio Account SID)
   - SMS_API_SECRET (Twilio Auth Token)
   - SMS_FROM_NUMBER (verified Twilio phone number)
3. Deploy with: supabase functions deploy send-emergency-sms
*/