import { createClient } from '@supabase/supabase-js';

// إعداد وظائف Supabase Edge Functions
export async function createEdgeFunctions() {
  // إنشاء وظيفة بدء التعدين
  const startMiningFunction = `
  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  serve(async (req) => {
    // التعامل مع طلبات CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    try {
      // إنشاء عميل Supabase
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
      )

      // الحصول على المستخدم الحالي
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'غير مصرح به' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // الحصول على بيانات المستخدم
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('id, last_mining, mining_rate')
        .eq('telegram_id', user.id)
        .single()

      if (userError) {
        return new Response(
          JSON.stringify({ error: 'خطأ في الحصول على بيانات المستخدم' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const now = new Date()
      const lastMining = userData.last_mining ? new Date(userData.last_mining) : null

      // التحقق مما إذا كان قد مر 24 ساعة منذ آخر تعدين
      if (lastMining && (now.getTime() - lastMining.getTime()) < 24 * 60 * 60 * 1000) {
        return new Response(
          JSON.stringify({ 
            error: 'لا يمكنك التعدين إلا مرة واحدة كل 24 ساعة',
            nextMiningTime: new Date(lastMining.getTime() + 24 * 60 * 60 * 1000).toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // تحديث رصيد المستخدم وتاريخ آخر تعدين
      const { data, error } = await supabaseClient.rpc('increment_balance', {
        user_id: userData.id,
        amount: userData.mining_rate
      })

      if (error) {
        return new Response(
          JSON.stringify({ error: 'خطأ في تحديث الرصيد' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // تحديث تاريخ آخر تعدين
      await supabaseClient
        .from('users')
        .update({ last_mining: now.toISOString() })
        .eq('id', userData.id)

      // إنشاء معاملة
      await supabaseClient
        .from('transactions')
        .insert([{
          user_id: userData.id,
          amount: userData.mining_rate,
          transaction_type: 'mining',
          status: 'completed',
          details: { method: 'daily_mining' }
        }])

      return new Response(
        JSON.stringify({ 
          success: true, 
          amount: userData.mining_rate,
          nextMiningTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
  })
  `;

  // إنشاء وظيفة شراء حزمة
  const purchasePackageFunction = `
  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  serve(async (req) => {
    // التعامل مع طلبات CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    try {
      // إنشاء عميل Supabase
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
      )

      // الحصول على المستخدم الحالي
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'غير مصرح به' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // الحصول على بيانات الطلب
      const { packageId } = await req.json()

      // الحصول على بيانات المستخدم
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('id, created_at')
        .eq('telegram_id', user.id)
        .single()

      if (userError) {
        return new Response(
          JSON.stringify({ error: 'خطأ في الحصول على بيانات المستخدم' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // التحقق من مرور 40 يوم على التسجيل
      const now = new Date()
      const createdAt = new Date(userData.created_at)
      const daysSinceRegistration = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

      if (daysSinceRegistration < 40) {
        return new Response(
          JSON.stringify({ 
            error: 'لا يمكنك الشراء إلا بعد مرور 40 يوم على التسجيل',
            daysRemaining: 40 - daysSinceRegistration
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // الحصول على بيانات الحزمة
      const { data: packageData, error: packageError } = await supabaseClient
        .from('mining_packages')
        .select('*')
        .eq('id', packageId)
        .single()

      if (packageError) {
        return new Response(
          JSON.stringify({ error: 'خطأ في الحصول على بيانات الحزمة' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // في التطبيق الحقيقي، هنا سيتم التحقق من الدفع

      // إنشاء حزمة للمستخدم
      let expiresAt = null
      if (!packageData.is_one_time) {
        // إذا كانت الحزمة مستمرة، تنتهي بعد 30 يومًا
        const expiry = new Date()
        expiry.setDate(expiry.getDate() + 30)
        expiresAt = expiry.toISOString()
      }

      const { data: userPackage, error: packageInsertError } = await supabaseClient
        .from('user_packages')
        .insert([{
          user_id: userData.id,
          package_id: packageId,
          expires_at: expiresAt
        }])
        .select()

      if (packageInsertError) {
        return new Response(
          JSON.stringify({ error: 'خطأ في إنشاء الحزمة للمستخدم' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // إذا كانت حزمة لمرة واحدة، أضف العملات مباشرة
      if (packageData.is_one_time) {
        await supabaseClient.rpc('increment_balance', {
          user_id: userData.id,
          amount: packageData.daily_rate
        })

        // إنشاء معاملة
        await supabaseClient
          .from('transactions')
          .insert([{
            user_id: userData.id,
            amount: packageData.daily_rate,
            transaction_type: 'package_purchase',
            status: 'completed',
            details: { package_id: packageId, package_name: packageData.name }
          }])
      } else {
        // إذا كانت حزمة مستمرة، قم بتحديث معدل التعدين اليومي
        await supabaseClient
          .from('users')
          .update({ mining_rate: packageData.daily_rate })
          .eq('id', userData.id)

        // إنشاء معاملة
        await supabaseClient
          .from('transactions')
          .insert([{
            user_id: userData.id,
            amount: packageData.price,
            transaction_type: 'package_subscription',
            status: 'completed',
            details: { 
              package_id: packageId, 
              package_name: packageData.name,
              daily_rate: packageData.daily_rate,
              expires_at: expiresAt
            }
          }])
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          package: packageData,
          userPackage: userPackage[0]
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
  })
  `;

  // إنشاء وظيفة إكمال مهمة
  const completeTaskFunction = `
  import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
  import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  serve(async (req) => {
    // التعامل مع طلبات CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    try {
      // إنشاء عميل Supabase
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
      )

      // الحصول على المستخدم الحالي
      const {
        data: { user },
      } = await supabaseClient.auth.getUser()

      if (!user) {
        return new Response(
          JSON.stringify({ error: 'غير مصرح به' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // الحصول على بيانات الطلب
      const { taskType } = await req.json()

      // الحصول على بيانات المستخدم
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('telegram_id', user.id)
        .single()

      if (userError) {
        return new Response(
          JSON.stringify({ error: 'خطأ في الحصول على بيانات المستخدم' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // التحقق مما إذا كانت المهمة مكتملة بالفعل
      const { data: existingTask, error: taskError } = await supabaseClient
        .from('tasks')
        .select('*')
        .eq('user_id', userData.id)
        .eq('task_type', taskType)
        .single()

      if (existingTask && existingTask.completed) {
        return new Response(
          JSON.stringify({ error: 'المهمة مكتملة بالفعل' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // تحديد المكافأة بناءً على نوع المهمة
      let reward = 50; // المكافأة الافتراضية

      // إكمال المهمة
      const now = new Date().toISOString()
      let taskData

      if (existingTask) {
        // تحديث المهمة الموجودة
        const { data, error } = await supabaseClient
          .from('tasks')
          .update({ 
            completed: true, 
            completed_at: now,
            reward: reward
          })
          .eq('id', existingTask.id)
          .select()

        if (error) {
          return new Response(
            JSON.stringify({ error: 'خطأ في تحديث المهمة' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        taskData = data[0]
      } else {
        // إنشاء مهمة جديدة
        const { data, error } = await supabaseClient
          .from('tasks')
          .insert([{
            user_id: userData.id,
            task_type: taskType,
            completed: true,
            completed_at: now,
            reward: reward
          }])
          .select()

        if (error) {
          return new Response(
            JSON.stringify({ error: 'خطأ في إنشاء المهمة' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          )
        }

        taskData = data[0]
      }

      // إضافة المكافأة إلى رصيد المستخدم
      await supabaseClient.rpc('increment_balance', {
        user_id: userData.id,
        amount: reward
      })

      // إنشاء معاملة
      await supabaseClient
        .from('transactions')
        .insert([{
          user_id: userData.id,
          amount: reward,
          transaction_type: 'task_reward',
          status: 'completed',
          details: { task_type: taskType }
        }])

      return new Response(
        JSON.stringify({ 
          success: true, 
          task: taskData,
          reward: reward
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
  })
  `;

  return {
    startMiningFunction,
    purchasePackageFunction,
    completeTaskFunction
  };
}
