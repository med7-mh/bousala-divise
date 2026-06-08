import { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button, Stack, useTheme, useMediaQuery, Divider, IconButton } from '@mui/material';
import { Add as AddIcon, TrendingUp as TrendingUpIcon, BarChart as BarChartIcon, EventAvailable as EventAvailableIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { Currency, Transaction } from '../types';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: currData, error: currErr } = await supabase.from('currencies').select('*').eq('user_id', user.id);
      if (currErr) throw currErr;
      
      const { data: txnData, error: txnErr } = await supabase
        .from('transactions')
        .select('*, currencies(code)')
        .eq('user_id', user.id)
        .gte('created_at', format(new Date(), 'yyyy-MM-dd'))
        .order('created_at', { ascending: false });
      
      if (txnErr) throw txnErr;

      setCurrencies(currData || []);
      setTransactions(txnData || []);
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'يرجى التأكد من إضافة بيانات Supabase أو الاتصال بالشبكة.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="warning">{error}</Alert>;

  const todayProfit = transactions.reduce((sum, t) => sum + Number(t.profit), 0);
  const totalVolumeLocal = transactions.reduce((sum, t) => sum + Number(t.local_amount), 0);
  const localBase = currencies.find(c => c.is_local_base);

  return (
    <Box sx={{ position: 'relative', minHeight: '100%', pb: 8 }}>
      {/* Dark Green Header Area for Mobile/Desktop */}
      <Box sx={{ 
        bgcolor: '#194f41', /* A deeper, richer green for high contrast */
        mx: { xs: -2, sm: -4 },
        mt: { xs: -2, sm: -4 },
        px: { xs: 3, sm: 4 },
        pt: { xs: 5, sm: 6 },
        pb: { xs: 14, sm: 16 },
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <Button 
          component={Link} 
          to="/transactions" 
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.12)', 
            color: 'white', 
            borderRadius: 4,
            p: 1.5,
            width: 76,
            height: 76,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
          }}
        >
          <AddIcon sx={{ mb: 0.5, fontSize: '1.8rem', opacity: 0.9 }} />
          <Typography sx={{ fontWeight: 'bold', lineHeight: 1.1, textAlign: 'center', fontSize: '0.75rem' }}>+ عملية<br/>جديدة</Typography>
        </Button>
        <Typography variant="h5" sx={{ fontWeight: '800', color: 'white', maxWidth: '60%', textAlign: 'right', fontSize: '1.85rem', lineHeight: 1.3, pt: 1 }}>
          نظرة عامة على<br/>اليوم
        </Typography>
      </Box>
      
      {/* Container for Cards with exact padding to avoid touching edges */}
      <Box sx={{ mt: { xs: -9, sm: -11 }, px: { xs: 1, sm: 2 } }}>
        <Stack spacing={2.5} sx={{ mb: 4 }}>
          {/* Glassmorphic Profit Card (Dark Contrast Fixed) */}
          <Card sx={{ 
            borderRadius: 5, 
            background: 'linear-gradient(135deg, rgba(20, 60, 48, 0.9) 0%, rgba(10, 31, 25, 0.95) 100%)', 
            color: 'white', 
            border: '1px solid rgba(255, 255, 255, 0.1)', 
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)', // for Safari
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Subtle glow effect behind */}
            <Box sx={{ position: 'absolute', top: -50, left: -50, width: 150, height: 150, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(40px)' }} />
            
            <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ fontSize: 32, opacity: 0.8, color: '#10b981' }} />
                <Typography sx={{ opacity: 0.9, fontWeight: 600, fontSize: '1rem', color: '#e2e8f0' }}>أرباح اليوم (المحققة)</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: '800', textAlign: 'right', mb: 0.5, color: '#ffffff' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 600, opacity: 0.8, marginRight: '8px' }}>{localBase?.code || 'MRU'}</span>
                {todayProfit.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
          
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
            {/* Volume Card */}
            <Card variant="outlined" sx={{ flex: 1, borderRadius: 5, borderColor: 'rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', bgcolor: 'white' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)', p: 1.5, borderRadius: 3 }}>
                    <BarChartIcon sx={{ fontSize: 32, color: '#194f41' }} />
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>حجم التداول اليوم</Typography>
                    <Typography variant="h5" sx={{ fontWeight: '800', mt: 0.5, color: '#0f172a' }}>
                      {totalVolumeLocal.toLocaleString()} <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#64748b' }}>{localBase?.code || 'MRU'}</span>
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
            
            {/* Transaction Count Card */}
            <Card variant="outlined" sx={{ flex: 1, borderRadius: 5, borderColor: 'rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', bgcolor: 'white' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)', p: 1.5, borderRadius: 3 }}>
                    <EventAvailableIcon sx={{ fontSize: 32, color: '#194f41' }} />
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.95rem' }}>عدد العمليات المنجزة</Typography>
                    <Typography variant="h5" sx={{ fontWeight: '800', mt: 0.5, color: '#0f172a' }}>
                      {transactions.length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Stack>
      </Box>

      <Grid container spacing={4} sx={{ mt: 1, px: { xs: 1, sm: 2 } }}>
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: '800', color: '#0f172a' }}>أحدث العمليات</Typography>
            <Button component={Link} to="/history" sx={{ fontWeight: '800', bgcolor: 'rgba(16, 185, 129, 0.08)', color: '#059669', borderRadius: 8, px: 3, py: 0.8, fontSize: '0.85rem', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' } }}>عرض الكل</Button>
          </Box>
          <Card variant="outlined" sx={{ borderRadius: 5, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', bgcolor: 'white' }}>
            {isMobile ? (
              <Stack divider={<Divider flexItem sx={{ opacity: 0.4 }} />} sx={{ px: 2 }}>
                {transactions.slice(0, 5).map(t => (
                  <Box key={t.id} sx={{ py: 2.5, display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.85rem', width: 65, flexShrink: 0 }}>
                      {format(new Date(t.created_at), 'hh:mm a').replace('AM', 'ص').replace('PM', 'م')}
                    </Typography>
                    
                    <Box sx={{ flexGrow: 1, px: 2, textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: '800', fontSize: '1.05rem', color: '#0f172a' }}>
                        <span style={{ color: t.txn_type === 'BUY' ? '#ef4444' : '#10b981', marginLeft: '6px' }}>
                          {t.txn_type === 'BUY' ? 'بيع:' : 'شراء:'}
                        </span> {Number(t.foreign_amount).toLocaleString()} {t.currencies?.code}
                      </Typography>
                      <Typography sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.85rem', mt: 0.5 }}>
                        {t.customer_name ? `العميل: ${t.customer_name}` : `شراء بسعر ${Number(t.exchange_rate).toLocaleString()}`}
                      </Typography>
                    </Box>

                    <Box sx={{ 
                      width: 5, 
                      height: 38, 
                      borderRadius: 4, 
                      bgcolor: t.txn_type === 'BUY' ? '#ef4444' : '#10b981'
                    }} />
                  </Box>
                ))}
                {transactions.length === 0 && (
                  <Box sx={{ py: 5, textAlign: 'center' }}>
                     <Typography sx={{ color: '#64748b', fontWeight: 500 }}>لا توجد عمليات اليوم.</Typography>
                  </Box>
                )}
              </Stack>
            ) : (
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>النوع</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569' }}>العملة</TableCell>
                    <TableCell align="left" sx={{ fontWeight: 700, color: '#475569' }}>الكمية</TableCell>
                    <TableCell align="left" sx={{ fontWeight: 700, color: '#475569' }}>السعر</TableCell>
                    <TableCell align="left" sx={{ fontWeight: 700, color: '#475569' }}>الإجمالي</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.slice(0, 5).map(t => (
                    <TableRow key={t.id} hover>
                      <TableCell>
                        <Chip 
                          label={t.txn_type === 'BUY' ? 'شراء' : 'بيع'} 
                          color={t.txn_type === 'BUY' ? 'primary' : 'error'}
                          size="small"
                          sx={{ fontWeight: 'bold', borderRadius: 2 }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{t.currencies?.code}</TableCell>
                      <TableCell align="left" sx={{ fontWeight: '800' }}>{Number(t.foreign_amount).toLocaleString()}</TableCell>
                      <TableCell align="left" sx={{ color: '#475569', fontWeight: 600 }}>{Number(t.exchange_rate).toLocaleString()}</TableCell>
                      <TableCell align="left" sx={{ color: t.txn_type === 'BUY' ? '#ef4444' : '#10b981', fontWeight: '800' }}>
                        {t.txn_type === 'BUY' ? '-' : '+'}{Number(t.local_amount).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {transactions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 5, color: '#64748b' }}>لا توجد عمليات اليوم.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </Grid>
        
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: '800', color: '#0f172a' }}>أرصدة مختصرة</Typography>
            <Button component={Link} to="/vault" sx={{ fontWeight: '800', bgcolor: 'rgba(16, 185, 129, 0.08)', color: '#059669', borderRadius: 8, px: 3, py: 0.8, fontSize: '0.85rem', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.15)' } }}>التفاصيل</Button>
          </Box>
          <Card variant="outlined" sx={{ borderRadius: 5, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', bgcolor: 'white' }}>
            <Stack divider={<Divider flexItem sx={{ opacity: 0.4 }} />} sx={{ px: 2 }}>
              {currencies.filter(c => !c.is_local_base).map(c => (
                <Box key={c.id} sx={{ py: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                      <Typography sx={{ fontWeight: '800', fontSize: '1.25rem', color: '#0f172a' }}>{c.code}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: '800', color: '#10b981' }}>
                        {Number(c.balance).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography sx={{ color: '#64748b', fontSize: '0.85rem', mt: 0.5, fontWeight: 500 }}>
                      متوسط التكلفة: <span style={{ fontWeight: 700, color: '#475569' }}>{Number(c.average_cost).toFixed(2)}</span>
                    </Typography>
                  </Box>
                </Box>
              ))}
              {currencies.filter(c => !c.is_local_base).length === 0 && (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <Typography sx={{ color: '#64748b', fontWeight: 500 }}>لا توجد أرصدة مسجلة.</Typography>
                </Box>
              )}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
