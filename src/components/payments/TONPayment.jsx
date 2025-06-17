
'use client';

import { useState, useEffect, useRef } from 'react';
import { SiTon } from 'react-icons/si';
import { FaCheck, FaSpinner, FaShieldAlt, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
// استيراد supabase للحصول على معرف المستخدم (إذا لزم الأمر ومتاح في السياق)
// import { supabase } from '@/lib/supabase/client'; 

// عنوان URL لخادم WebSocket الخلفي
const BACKEND_WEBSOCKET_URL = 'ws://localhost:8080'; // افترض أن الخادم الخلفي يعمل محليًا

export default function TONPayment({ packageId, packageName, packagePrice, onSuccess, userId }) { // <-- إضافة userId كـ prop
  const [paymentStatus, setPaymentStatus] = useState('initial'); 
  const [error, setError] = useState(null);
  const [verificationMessage, setVerificationMessage] = useState('');
  const ws = useRef(null);

  const projectWalletAddress = 'UQAmI5QQbc7HbxSbUHUkh5_7vltnn_bWb3qmS3pz7S1YPgbV'; 
  const amountInNano = parseFloat(packagePrice) * 1000000000; 
  const expectedComment = `SmartCoin_Package_${packageId}`;

  // الحصول على معرف المستخدم (مثال - قد تحتاج إلى تعديله حسب طريقة إدارة الجلسات لديك)
  // const [currentUserId, setCurrentUserId] = useState(null);
  // useEffect(() => {
  //   const fetchUser = async () => {
  //     const { data: { user } } = await supabase.auth.getUser();
  //     setCurrentUserId(user?.id);
  //   };
  //   fetchUser();
  // }, []);
  // const effectiveUserId = userId || currentUserId; // استخدم الـ prop إذا تم تمريره، وإلا حاول الحصول عليه

  useEffect(() => {
    if (paymentStatus !== 'awaiting_payment') {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log('Closing backend WebSocket connection.');
        ws.current.close();
        ws.current = null;
      }
      return;
    }

    if (!userId) { // التحقق من وجود معرف المستخدم قبل محاولة الاتصال
        console.error("User ID is missing, cannot initiate payment verification.");
        setError("لم يتم تحديد المستخدم. لا يمكن بدء التحقق من الدفع.");
        setPaymentStatus('error'); // أو العودة إلى الحالة الأولية
        return;
    }

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log('Backend WebSocket already open.');
      return;
    }

    console.log('Attempting to connect to backend WebSocket:', BACKEND_WEBSOCKET_URL);
    setVerificationMessage('جاري الاتصال بخادم التحقق...');
    setError(null); 
    
    try {
      ws.current = new WebSocket(BACKEND_WEBSOCKET_URL);

      ws.current.onopen = () => {
        console.log('Backend WebSocket connection established.');
        setVerificationMessage('تم الاتصال بخادم التحقق. يرجى إكمال الدفع...');
        
        const verificationDetails = {
          address: projectWalletAddress,
          amountNano: amountInNano,
          comment: expectedComment,
          packageId: packageId // إرسال معرف الحزمة أيضًا
        };
        // إرسال تفاصيل التحقق ومعرف المستخدم إلى الخادم الخلفي
        sendToBackend({ type: 'start_verification', details: verificationDetails, userId: userId }); 
      };

      ws.current.onmessage = (event) => {
        console.log('Backend WebSocket message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'status':
              setVerificationMessage(data.message);
              setPaymentStatus('verifying_backend'); 
              break;
            case 'success':
              setPaymentStatus('success');
              setVerificationMessage(data.message || 'تم التحقق من الدفع وتفعيل الحزمة بنجاح!');
              if (onSuccess) {
                onSuccess();
              }
              ws.current.close(); 
              break;
            case 'error':
              setError(data.message || 'حدث خطأ في التحقق من الخادم الخلفي.');
              setPaymentStatus('error');
              setVerificationMessage(''); 
              break;
            case 'info':
              console.log('Info from backend:', data.message);
              break;
            default:
              console.warn('Received unknown message type from backend:', data.type);
          }
        } catch (parseError) {
          console.error('Error parsing backend WebSocket message:', parseError);
          setError('خطأ في استقبال البيانات من خادم التحقق.');
          setPaymentStatus('error');
        }
      };

      ws.current.onerror = (errorEvent) => {
        console.error('Backend WebSocket error:', errorEvent);
        setError('حدث خطأ في الاتصال بخادم التحقق. يرجى المحاولة مرة أخرى لاحقًا.');
        setPaymentStatus('error');
        setVerificationMessage('');
      };

      ws.current.onclose = (closeEvent) => {
        console.log('Backend WebSocket connection closed:', closeEvent.code, closeEvent.reason);
        if (paymentStatus !== 'success' && paymentStatus !== 'initial') {
           // setError('تم قطع الاتصال بخادم التحقق.');
           // setPaymentStatus('error'); 
        }
        ws.current = null; 
      };

    } catch (connectionError) {
        console.error('Failed to create backend WebSocket connection:', connectionError);
        setError('فشل الاتصال بخادم التحقق. يرجى التحقق من تشغيل الخادم الخلفي.');
        setPaymentStatus('error');
        setVerificationMessage('');
    }

    return () => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        console.log('Closing backend WebSocket connection on cleanup.');
        ws.current.close();
        ws.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatus, userId]); // أضف userId إلى الاعتماديات للتحقق منه قبل الاتصال

  const sendToBackend = (data) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        console.log('Sending message to backend:', JSON.stringify(data));
        ws.current.send(JSON.stringify(data));
      } catch (error) {
        console.error('Failed to send message to backend:', error);
      }
    } else {
      console.error('Cannot send message: Backend WebSocket is not open.');
      setError('لا يمكن الاتصال بخادم التحقق لإرسال البيانات.');
      setPaymentStatus('error');
    }
  };

  const handlePaymentClick = () => {
    if (!userId) {
        setError("لا يمكن بدء الدفع. لم يتم تحديد المستخدم.");
        console.error("User ID is missing, cannot start payment.");
        return;
    }
    const paymentLink = `ton://transfer/${projectWalletAddress}?amount=${amountInNano}&text=${encodeURIComponent(expectedComment)}`;
    console.log('Opening payment link:', paymentLink);
    window.location.href = paymentLink;
    setPaymentStatus('awaiting_payment');
    setError(null); 
    setVerificationMessage('تم توجيهك للمحفظة. يرجى إكمال الدفع. سنتحقق تلقائيًا...');
  };

  return (
    <div className="p-4 bg-background-dark rounded-lg">
      {/* ... (بقية واجهة المستخدم تبقى كما هي) ... */}
       <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">الدفع باستخدام TON</h3>
        <FaShieldAlt className="text-primary-gold" size={20} title="مؤمن عبر التحقق التلقائي من الخادم" />
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-400 mb-2">تفاصيل الحزمة:</p>
        <div className="flex justify-between items-center">
          <span>{packageName}</span>
          <span className="text-primary-gold flex items-center">
            <SiTon className="ml-1" size={14} />
            {packagePrice}
          </span>
        </div>
      </div>
      
      <div className="bg-background-gray p-3 rounded-lg mb-4">
        <p className="text-sm text-gray-300 mb-1">سيتم الدفع إلى المحفظة:</p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono">{projectWalletAddress}</span>
          <button 
            className="text-primary-gold text-xs"
            onClick={() => navigator.clipboard.writeText(projectWalletAddress)}
          >
            نسخ
          </button>
        </div>
         <p className="text-xs text-gray-400 mt-1">المبلغ: {packagePrice} TON</p>
         <p className="text-xs text-gray-400 mt-1">التعليق المطلوب: {expectedComment}</p>
      </div>
      
      {paymentStatus === 'initial' && (
        <button 
          className="secondary-button w-full mb-4"
          onClick={handlePaymentClick}
          disabled={!userId} // تعطيل الزر إذا لم يكن هناك userId
        >
          <SiTon size={16} />
          <span>{!userId ? 'جاري تحميل بيانات المستخدم...' : 'الدفع باستخدام محفظتك'}</span>
        </button>
      )}
      
      {(paymentStatus === 'awaiting_payment' || paymentStatus === 'verifying_backend') && (
        <div className="space-y-4">
          <div className="flex items-center justify-center p-4 bg-background-gray rounded-lg">
            <FaSpinner className="animate-spin text-primary-gold ml-2" size={20} />
            <span>{verificationMessage || 'في انتظار تأكيد الدفع والتحقق...'}</span>
          </div>
           <div className="bg-yellow-900 bg-opacity-20 p-3 rounded-lg flex items-start">
            <FaExclamationTriangle className="text-yellow-500 mt-1 ml-2 flex-shrink-0" size={16} />
            <p className="text-sm text-yellow-500">
              لقد تم توجيهك إلى محفظتك. يرجى إكمال عملية الدفع هناك. يقوم خادمنا بالتحقق من المعاملة وتفعيل الحزمة تلقائيًا عند تأكيدها على الشبكة.
            </p>
          </div>
        </div>
      )}
      
      {paymentStatus === 'success' && (
        <div className="bg-success-color bg-opacity-20 p-4 rounded-lg flex items-center">
          <FaCheck className="text-success-color ml-2" size={20} />
          <span>{verificationMessage || 'تم التحقق من الدفع وتفعيل الحزمة بنجاح!'}</span>
        </div>
      )}
      
      {paymentStatus === 'error' && (
         <div className="bg-error-color bg-opacity-20 p-4 rounded-lg flex items-center">
          <FaTimes className="text-error-color ml-2" size={20} />
          <span>{error || 'حدث خطأ أثناء التحقق من الدفع.'}</span>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center">
          <FaShieldAlt className="text-primary-gold ml-2" size={14} />
          <p className="text-xs text-gray-500">
            يتم التحقق من المعاملات وتفعيل الحزم تلقائيًا بواسطة خادمنا لضمان الأمان.
          </p>
        </div>
      </div>
    </div>
  );
}


