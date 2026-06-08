import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useMediaQuery, useTheme, Stack, Grid } from '@mui/material';
import { Currency } from '../types';
import { supabase } from '../lib/supabase';

import { useAuth } from '../hooks/useAuth';

export default function Vault() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchVault();
  }, [user]);

  const fetchVault = async () => {
    if (!user) return;
    try {
      const { data, error: err } = await supabase.from('currencies').select('*').eq('user_id', user.id).order('is_local_base', { ascending: false });
      if (err) throw err;
      setCurrencies(data || []);
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء جلب أرصدة الخزنة.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  const localBase = currencies.find(c => c.is_local_base);
  const foreignCurrencies = currencies.filter(c => !c.is_local_base);

  // Calculate Total Estimated Value in Local Currency
  // Local Balance + Sum(Foreign Balance * Average Cost)
  const totalEstimatedValue = currencies.reduce((total, c) => {
    if (c.is_local_base) return total + Number(c.balance);
    return total + (Number(c.balance) * Number(c.average_cost));
  }, 0);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold' }}>الخزنة والأصول</Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography sx={{ opacity: 0.8 }} gutterBottom>إجمالي الأصول المقدرة (بالمحلي)</Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1 }}>
                {totalEstimatedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })} {localBase?.code || 'MRU'}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mt: 1 }}>
                * محسوبة بناءً على متوسط التكلفة للعملات الأجنبية.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>السيولة النقدية ({localBase?.code})</Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', mt: 1, color: 'success.main' }}>
                {Number(localBase?.balance || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>تفاصيل العملات الأجنبية</Typography>
      
      {isMobile ? (
        <Stack spacing={2}>
          {foreignCurrencies.map((c) => {
            const bookValue = Number(c.balance) * Number(c.average_cost);
            return (
              <Card key={c.id} variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent sx={{ pb: '16px !important' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                     <Box>
                       <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>{c.code}</Typography>
                       <Typography variant="caption" color="text.secondary">{c.name}</Typography>
                     </Box>
                     <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                       {Number(c.balance).toLocaleString()}
                     </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', p: 1.5, borderRadius: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">متوسط تكلفة الشراء</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {Number(c.average_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="caption" color="text.secondary">القيمة الدفترية ({localBase?.code})</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {bookValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>العملة</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>الرمز</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'left' }}>الرصيد المتاح</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'left' }}>متوسط التكلفة</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'left' }}>القيمة الدفترية (بالمحلي)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
               {foreignCurrencies.map((c) => {
                 const bookValue = Number(c.balance) * Number(c.average_cost);
                 return (
                  <TableRow key={c.id} hover>
                    <TableCell>{c.name}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{c.code}</TableCell>
                    <TableCell align="left" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
                      {Number(c.balance).toLocaleString()}
                    </TableCell>
                    <TableCell align="left">{Number(c.average_cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</TableCell>
                    <TableCell align="left" sx={{ color: 'text.secondary' }}>
                      {bookValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                 );
               })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
