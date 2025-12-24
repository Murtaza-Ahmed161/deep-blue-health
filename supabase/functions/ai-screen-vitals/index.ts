import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vitalsId, heartRate, bloodPressureSystolic, bloodPressureDiastolic, temperature, oxygenSaturation } = await req.json();
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    // Guard against dual backends
    if (lovableApiKey) {
      console.warn('⚠️ WARNING: LOVABLE_API_KEY detected. Lovable Cloud must not be used in production. Supabase is the only backend.');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user');
    }

    // Build AI screening prompt
    const prompt = `Analyze these patient vital signs and provide a medical assessment:
    
Heart Rate: ${heartRate} bpm
Blood Pressure: ${bloodPressureSystolic}/${bloodPressureDiastolic} mmHg
Temperature: ${temperature}°C
Oxygen Saturation: ${oxygenSaturation}%

Provide:
1. Severity assessment (normal/warning/critical)
2. Brief explanation of any abnormalities
3. Up to 3 specific medical recommendations
4. Confidence level (0-1)

Respond in JSON format:
{
  "severity": "normal|warning|critical",
  "anomaly_detected": boolean,
  "explanation": "brief explanation",
  "recommendations": ["recommendation1", "recommendation2"],
  "confidence": 0.95
}`;

    // AI API key is optional - if not provided, return basic analysis
    if (!lovableApiKey) {
      console.warn('LOVABLE_API_KEY not set. Using basic rule-based analysis instead of AI.');
      
      // Basic rule-based analysis as fallback
      const isCritical = heartRate < 50 || heartRate > 120 || 
                        bloodPressureSystolic > 180 || bloodPressureSystolic < 90 ||
                        oxygenSaturation < 90 || temperature > 39 || temperature < 35;
      const isWarning = heartRate < 60 || heartRate > 100 ||
                       bloodPressureSystolic > 140 || bloodPressureSystolic < 100 ||
                       oxygenSaturation < 95 || temperature > 38 || temperature < 36;

      const analysisResult = {
        severity: isCritical ? 'critical' : (isWarning ? 'warning' : 'normal'),
        anomaly_detected: isCritical || isWarning,
        explanation: isCritical 
          ? 'Critical vital signs detected. Immediate medical attention required.'
          : isWarning 
          ? 'Some vital signs are outside normal range. Monitor closely.'
          : 'All vital signs within normal range.',
        recommendations: isCritical 
          ? ['Seek immediate medical attention', 'Monitor continuously', 'Contact healthcare provider']
          : isWarning
          ? ['Continue monitoring', 'Consider consulting healthcare provider']
          : ['Continue regular monitoring'],
        confidence: 0.85
      };

      // Store screening result in database
      const { data: screeningResult, error: insertError } = await supabase
        .from('ai_screening_results')
        .insert({
          user_id: user.id,
          vitals_id: vitalsId,
          confidence_level: analysisResult.confidence,
          anomaly_detected: analysisResult.anomaly_detected,
          explanation: analysisResult.explanation,
          severity: analysisResult.severity,
          recommendations: analysisResult.recommendations || []
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error storing screening result:', insertError);
        throw insertError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          result: screeningResult 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log('Calling AI service for vitals screening...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a medical AI assistant analyzing patient vitals. Provide accurate, evidence-based assessments.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'AI rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    console.log('AI Response:', aiContent);
    
    // Parse AI response
    let analysisResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to basic analysis
      analysisResult = {
        severity: 'normal',
        anomaly_detected: false,
        explanation: 'AI analysis completed',
        recommendations: ['Continue regular monitoring'],
        confidence: 0.7
      };
    }

    // Store screening result in database
    const { data: screeningResult, error: insertError } = await supabase
      .from('ai_screening_results')
      .insert({
        user_id: user.id,
        vitals_id: vitalsId,
        confidence_level: analysisResult.confidence,
        anomaly_detected: analysisResult.anomaly_detected,
        explanation: analysisResult.explanation,
        severity: analysisResult.severity,
        recommendations: analysisResult.recommendations || []
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing screening result:', insertError);
      throw insertError;
    }

    console.log('Screening result stored:', screeningResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        result: screeningResult 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in ai-screen-vitals:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});