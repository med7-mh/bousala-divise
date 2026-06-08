import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Container, TextField, Typography, Paper, Alert } from '@mui/material';
import { GetApp as DownloadIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء العملية');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={0} sx={{ p: 4, width: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Typography component="h1" variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'} - بوصلة ديفيز
          </Typography>
          
          {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
          {!isLogin && (
            <Alert severity="info" sx={{ width: '100%', mb: 3 }}>
              سيتم إنشاء الحساب بصلاحية ADMIN تلقائياً عبر قاعدة البيانات (إعدادات الـ MVP).
              يُرجى إغلاق "Confirm email" في إعدادات Authentication لسهولة التجربة.
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="البريد الإلكتروني"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              dir="ltr"
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="كلمة المرور"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              dir="ltr"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 1, py: 1.5 }}
              disabled={loading}
            >
              {isLogin ? 'دخول' : 'تسجيل حساب'}
            </Button>
            <Button
              fullWidth
              variant="text"
              sx={{ mb: 2 }}
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              {isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
            </Button>

            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2, mt: 1, width: '100%', textAlign: 'center' }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => navigate('/download')}
                startIcon={<DownloadIcon />}
                sx={{ 
                  borderRadius: 3, 
                  py: 1.2, 
                  fontWeight: 'bold',
                  borderColor: 'rgba(25, 79, 65, 0.25)',
                  color: '#194f41',
                  '&:hover': {
                    borderColor: '#194f41',
                    bgcolor: 'rgba(25, 79, 65, 0.05)'
                  }
                }}
              >
                تنزيل التطبيق على الهاتف أو الكمبيوتر (PWA)
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
