import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, MenuItem, Button, Grid, Alert, Snackbar, InputAdornment, Stack, useTheme, useMediaQuery } from '@mui/material';
import { History as HistoryIcon, SwapHoriz as SwapHorizIcon, TrendingUp as TrendingUpIcon, AttachMoney as AttachMoneyIcon, AccountBalance as AccountBalanceIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Currency } from '../types';
import { useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

export default function Transactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [localBase, setLocalBase] = useState<Currency | null>(null);
  
  const [txnType, setTxnType] = useState<'BUY' | 'SELL'>('BUY');
  const [currencyId, setCurrencyId] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [customer, setCustomer] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) fetchCurrencies();
  }, [user]);

  const fetchCurrencies = async () => {
    if (!user) return;
    const { data } = await supabase.from('currencies').select('*').eq('user_id', user.id);
    if (data) {
      setCurrencies(data.filter(c => !c.is_local_base));
      setLocalBase(data.find(c => c.is_local_base) || null);
      if (data.filter(c => !c.is_local_base).length > 0) {
        setCurrencyId(data.filter(c => !c.is_local_base)[0].id);
      }
    }
  };

  const totalLocal = Number(amount) * Number(rate);
  const selectedCurrency = currencies.find(c => c.id === currencyId);

  // Profit estimation for SELL
  const estimatedProfit = txnType === 'SELL' && selectedCurrency 
    ? (Number(rate) - Number(selectedCurrency.average_cost)) * Number(amount)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: rpcError } = await supabase.rpc('process_currency_transaction', {
        p_user_id: user?.id,
        p_txn_type: txnType,
        p_currency_id: currencyId,
        p_foreign_amount: Number(amount),
        p_exchange_rate: Number(rate),
        p_customer_name: customer || null
      });

      if (rpcError) throw rpcError;
      
      setSuccess(true);
      setAmount('');
      setCustomer('');
      fetchCurrencies(); // Refresh balances
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'حدث خطأ أثناء التنفيذ. يرجى التحقق من الأرصدة المتاحة.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ position: 'relative', minHeight: '100%', pb: 8 }}>
      {/* Transparent Header Area */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: { xs: 1, sm: 2 },
        pt: 2,
        pb: 3,
        mb: 2
      }}>
        <Button 
          component={Link} 
          to="/history" 
          sx={{ 
            bgcolor: 'rgba(15, 23, 42, 0.05)', 
            color: '#0f172a', 
            borderRadius: 8,
            px: 2.5,
            py: 1,
            fontWeight: '800',
            border: '1px solid rgba(15, 23, 42, 0.05)',
            '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.1)' }
          }}
        >
          <HistoryIcon sx={{ ml: 1, fontSize: '1.2rem', color: '#0f172a' }} />
          <Typography sx={{ fontWeight: '800', fontSize: '0.9rem' }}>السجل</Typography>
        </Button>
        <Typography variant="h5" sx={{ fontWeight: '800', color: '#0f172a', textAlign: 'right', fontSize: '1.85rem' }}>
          تبديل العملات
        </Typography>
      </Box>
      
      <Box sx={{ px: { xs: 1, sm: 2 } }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Card variant="outlined" sx={{ borderRadius: 5, border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', bgcolor: 'white', overflow: 'hidden' }}>
              
              {/* Type Switcher Tabs */}
              <Box sx={{ display: 'flex', p: 1, bgcolor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <Button 
                  fullWidth
                  variant={txnType === 'BUY' ? 'contained' : 'text'} 
                  color="primary"
                  onClick={() => setTxnType('BUY')}
                  sx={{ 
                    borderRadius: 4, 
                    py: 1.5, 
                    fontWeight: txnType === 'BUY' ? '800' : '600',
                    color: txnType === 'BUY' ? 'white' : '#64748b',
                    bgcolor: txnType === 'BUY' ? '#10b981' : 'transparent',
                    boxShadow: txnType === 'BUY' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                    '&:hover': { bgcolor: txnType === 'BUY' ? '#059669' : 'rgba(0,0,0,0.05)' },
                    transition: 'all 0.3s ease'
                  }}
                >
                  شراء (نستلم أجنبي)
                </Button>
                <Button 
                  fullWidth
                  variant={txnType === 'SELL' ? 'contained' : 'text'} 
                  color="error"
                  onClick={() => setTxnType('SELL')}
                  sx={{ 
                    borderRadius: 4, 
                    py: 1.5, 
                    fontWeight: txnType === 'SELL' ? '800' : '600',
                    color: txnType === 'SELL' ? 'white' : '#64748b',
                    bgcolor: txnType === 'SELL' ? '#ef4444' : 'transparent',
                    boxShadow: txnType === 'SELL' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none',
                    '&:hover': { bgcolor: txnType === 'SELL' ? '#dc2626' : 'rgba(0,0,0,0.05)' },
                    transition: 'all 0.3s ease'
                  }}
                >
                  بيع (نسلم أجنبي)
                </Button>
              </Box>

              <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}
                
                {currencies.length === 0 && (
                  <Alert severity="warning" sx={{ mb: 4, borderRadius: 3 }} action={
                    <Button color="inherit" size="small" onClick={() => navigate('/currencies')}>
                      إضافة عملات
                    </Button>
                  }>
                    الخانة الأولى معطلة لانه لا توجد اي عملات اجنبية تم اضافتها.
                  </Alert>
                )}

                <form onSubmit={handleSubmit}>
                  <Box sx={{ px: { xs: 0, sm: 3, md: 6 } }}>
                    <Stack spacing={3}>
                      <TextField
                        select
                        fullWidth
                        label="العملة الأجنبية (مثال: USD دولار)"
                        value={currencyId || ''}
                        onChange={(e) => setCurrencyId(e.target.value)}
                        required
                        disabled={currencies.length === 0}
                        InputProps={{
                          sx: { borderRadius: 3 }
                        }}
                      >
                        {currencies.length === 0 && (
                          <MenuItem value="" disabled>لا توجد عملات مضافة</MenuItem>
                        )}
                        {currencies.map(c => (
                          <MenuItem key={c.id} value={c.id} sx={{ fontWeight: 600 }}>
                            {c.code} - {c.name}
                          </MenuItem>
                        ))}
                      </TextField>

                      <TextField
                        fullWidth
                        label="سعر الصرف"
                        type="number"
                        inputProps={{ step: "0.0001", min: "0" }}
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        required
                        InputProps={{
                          endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 'bold', color: '#64748b' }}>{localBase?.code}</Typography></InputAdornment>,
                          sx: { borderRadius: 3 }
                        }}
                      />
                      
                      <TextField
                        fullWidth
                        label="الكمية (الأجنبية)"
                        type="number"
                        inputProps={{ step: "0.01", min: "0" }}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        InputProps={{
                          endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 'bold', color: '#64748b' }}>{selectedCurrency?.code}</Typography></InputAdornment>,
                          sx: { borderRadius: 3 }
                        }}
                      />

                      <TextField
                        fullWidth
                        label="الإجمالي (محلي) للمراجعة"
                        type="text"
                        disabled
                        value={totalLocal.toLocaleString()}
                        InputProps={{
                          endAdornment: <InputAdornment position="end"><Typography sx={{ fontWeight: 'bold', color: '#64748b' }}>{localBase?.code}</Typography></InputAdornment>,
                          sx: { borderRadius: 3, bgcolor: 'rgba(0,0,0,0.02)', '& .Mui-disabled': { WebkitTextFillColor: '#0f172a', fontWeight: '800' } }
                        }}
                      />

                      <TextField
                        fullWidth
                        label="اسم العميل (اختياري)"
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        InputProps={{
                          sx: { borderRadius: 3 }
                        }}
                      />
                    </Stack>

                    <Box sx={{ 
                      mt: 4, 
                      p: 3, 
                      bgcolor: txnType === 'BUY' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', 
                      border: '1px solid',
                      borderColor: txnType === 'BUY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      borderRadius: 4, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 1.5 
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SwapHorizIcon sx={{ mr: 1, color: txnType === 'BUY' ? '#10b981' : '#ef4444' }} />
                        <Typography variant="h6" sx={{ fontWeight: '800', color: '#0f172a' }}>الملخص</Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 600, color: '#475569' }}>
                          {txnType === 'BUY' ? 'سندفع للعميل:' : 'سنستلم من العميل:'}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: '900', color: txnType === 'BUY' ? '#ef4444' : '#10b981' }}>
                          {totalLocal.toLocaleString()} <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{localBase?.code}</Typography>
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 600, color: '#475569' }}>
                          {txnType === 'BUY' ? 'سنستلم من العميل:' : 'سنسلم للعميل:'}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: '900', color: '#0f172a' }}>
                          {Number(amount).toLocaleString()} <Typography component="span" sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{selectedCurrency?.code}</Typography>
                        </Typography>
                      </Box>

                      {txnType === 'SELL' && amount && rate && (
                        <Box sx={{ pt: 2, mt: 1, borderTop: "1px dashed rgba(0,0,0,0.1)", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TrendingUpIcon sx={{ mr: 1, color: estimatedProfit > 0 ? '#10b981' : '#ef4444', fontSize: '1.2rem' }} />
                            <Typography sx={{ fontWeight: 600, color: '#475569' }}>الربح المتوقع:</Typography>
                          </Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: '800', color: estimatedProfit > 0 ? '#10b981' : '#ef4444' }}>
                            {estimatedProfit > 0 ? '+' : ''}{estimatedProfit.toLocaleString(undefined, {maximumFractionDigits: 2})} {localBase?.code}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Button
                      type="submit"
                      variant="contained"
                      color={txnType === 'BUY' ? 'primary' : 'error'}
                      size="large"
                      fullWidth
                      disabled={loading || !currencyId}
                      sx={{ 
                        mt: 4, 
                        py: 1.8, 
                        fontSize: '1.1rem', 
                        fontWeight: '800',
                        borderRadius: 4,
                        boxShadow: txnType === 'BUY' ? '0 8px 16px rgba(16, 185, 129, 0.25)' : '0 8px 16px rgba(239, 68, 68, 0.25)'
                      }}
                    >
                      {loading ? 'جاري التنفيذ...' : `تأكيد عملية الـ ${txnType === 'BUY' ? 'شراء' : 'بيع'}`}
                    </Button>
                  </Box>
                </form>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {selectedCurrency && (
                <Card variant="outlined" sx={{ borderRadius: 5, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', bgcolor: 'white' }}>
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}>
                    <AttachMoneyIcon sx={{ color: '#194f41', mr: 1 }} />
                    <Typography sx={{ fontWeight: '800', color: '#0f172a' }}>مؤشرات {selectedCurrency.code}</Typography>
                  </Box>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ mb: 2.5 }}>
                      <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem', mb: 0.5 }}>الرصيد المتاح:</Typography>
                      <Typography variant="h5" sx={{ fontWeight: '900', color: '#10b981' }}>
                        {Number(selectedCurrency.balance).toLocaleString()} <Typography component="span" sx={{ fontWeight: '700', fontSize: '1rem', color: '#475569' }}>{selectedCurrency.code}</Typography>
                      </Typography>
                    </Box>

                    <Box>
                      <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem', mb: 0.5 }}>متوسط تكلفة الشراء:</Typography>
                      <Typography variant="h6" sx={{ fontWeight: '800', color: '#0f172a' }}>
                        {Number(selectedCurrency.average_cost).toLocaleString(undefined, {maximumFractionDigits: 4})} <Typography component="span" sx={{ fontWeight: '700', fontSize: '0.9rem', color: '#475569' }}>{localBase?.code}</Typography>
                      </Typography>
                    </Box>
                    
                    {txnType === 'SELL' && (
                      <Alert severity="info" sx={{ mt: 3, borderRadius: 3, '& .MuiAlert-message': { width: '100%', fontSize: '0.85rem' } }}>
                        لتحقيق ربح، يجب البيع بسعر أكبر من <strong>{Number(selectedCurrency.average_cost).toFixed(2)}</strong>.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
              
              <Card variant="outlined" sx={{ borderRadius: 5, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', bgcolor: 'white' }}>
                <Box sx={{ p: 1.5, bgcolor: 'rgba(16, 185, 129, 0.05)', borderBottom: '1px solid rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center' }}>
                  <AccountBalanceIcon sx={{ color: '#10b981', mr: 1 }} />
                  <Typography sx={{ fontWeight: '800', color: '#0f172a' }}>الصندوق المركزي ({localBase?.code})</Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: '900', color: '#10b981' }}>
                    {Number(localBase?.balance || 0).toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Box>
      
      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: '100%', fontSize: '1.05rem', fontWeight: 'bold', borderRadius: 3, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
          تم تنفيذ العملية بنجاح!
        </Alert>
      </Snackbar>
    </Box>
  );
}

