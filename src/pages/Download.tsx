import { Box, Card, CardContent, Typography, Button, useTheme, useMediaQuery, IconButton } from '@mui/material';
import { Download as DownloadIcon, CheckCircle as CheckCircleIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { usePWA } from '../hooks/usePWA';
import { useNavigate } from 'react-router-dom';

export default function InstallApp() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Detect basic browser type for user guidance if needed
  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
    <Box sx={{ position: 'relative', minHeight: '100%', pb: 8 }}>
      <Box sx={{ 
        bgcolor: '#194f41',
        mx: { xs: -2, sm: -4 },
        mt: { xs: -2, sm: -4 },
        px: { xs: 3, sm: 4 },
        pt: { xs: 3, sm: 4 },
        pb: { xs: 12, sm: 14 },
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Back Button */}
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBackIcon sx={{ transform: 'rotate(180deg)' }} />}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            borderColor: 'rgba(255,255,255,0.3)',
            borderRadius: 3,
            px: 2,
            py: 0.8,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          رجوع
        </Button>

        <img src="/pwa-192x192.png" alt="App Icon" style={{ width: 80, height: 80, borderRadius: 20, marginBottom: 16, marginTop: 40, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }} />
        <Typography variant="h4" sx={{ fontWeight: '800', color: 'white', mb: 1 }}>
          تنزيل تطبيق صراف بلس
        </Typography>
        <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          احصل على التطبيق على جهازك لتجربة أسرع وأفضل بدون إنترنت
        </Typography>
      </Box>

      <Box sx={{ mt: { xs: -6, sm: -8 }, px: { xs: 2, sm: 4 }, display: 'flex', justifyContent: 'center' }}>
        <Card variant="outlined" sx={{ maxWidth: 500, width: '100%', borderRadius: 5, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', bgcolor: 'white', textAlign: 'center', p: 2 }}>
          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            {isInstalled ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 64, color: '#10b981' }} />
                <Typography variant="h5" sx={{ fontWeight: '800', color: '#0f172a' }}>التطبيق مثبت بالفعل!</Typography>
                <Typography sx={{ color: '#64748b' }}>يمكنك العثور عليه في شاشتك الرئيسية أو قائمة ابدأ.</Typography>
              </Box>
            ) : isInstallable ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <DownloadIcon sx={{ fontSize: 64, color: '#194f41', opacity: 0.8 }} />
                <Typography variant="h5" sx={{ fontWeight: '800', color: '#0f172a' }}>جاهز للتثبيت</Typography>
                <Typography sx={{ color: '#64748b' }}>بالضغط على زر التحميل، سيتم تثبيت التطبيق وتوفيره بشكل مستقل على الجهازك مباشرةً، مما يسرع الأداء ويتيح لك الوصول المباشر.</Typography>
                <Button 
                  variant="contained" 
                  size="large" 
                  onClick={installApp}
                  startIcon={<DownloadIcon />}
                  sx={{ 
                    mt: 2, 
                    px: 4, 
                    py: 1.5, 
                    borderRadius: 4, 
                    fontWeight: '800', 
                    fontSize: '1.1rem',
                    bgcolor: '#10b981',
                    boxShadow: '0 8px 16px rgba(16, 185, 129, 0.25)',
                    '&:hover': { bgcolor: '#059669' }
                  }}
                >
                  تثبيت الآن
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: '800', color: '#0f172a', mb: 1 }}>طريقة التثبيت</Typography>
                {isIos && isSafari ? (
                  <Box sx={{ textAlign: 'center' }}>
                     <Typography sx={{ color: '#475569', mb: 2 }}>يبدو أنك تستخدم جهاز iPhone أو iPad. لتثبيت التطبيق:</Typography>
                     <Typography sx={{ color: '#0f172a', fontWeight: 'bold' }}>1. اضغط على زر المشاركة (المربع ذو السهم لأعلى) في شريط سفاري.</Typography>
                     <Typography sx={{ color: '#0f172a', fontWeight: 'bold' }}>2. اختر "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).</Typography>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center' }}>
                     <Typography sx={{ color: '#475569', mb: 2 }}>متصفحك الحالي قد لا يدعم التثبيت المباشر بالزر، أو أن التطبيق مثبت بالفعل.</Typography>
                     <Typography sx={{ color: '#0f172a', fontWeight: 'bold' }}>حاول فتح الرابط على متصفح Chrome أو Safari الحديث واتبع إرشادات التثبيت من إعدادات المتصفح المخفية (تثبيت التطبيق / Install App).</Typography>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
