import { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Alert, IconButton } from '@mui/material';
import { format } from 'date-fns';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function History() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select(`*, currencies ( code, name )`)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;
      setTransactions(data || []);
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ أثناء جلب سجل العمليات.');
    } finally {
      setLoading(false);
    }
  };

  const handleReverse = async (txnId: string) => {
    if (!confirm('هل أنت متأكد من التراجع عن هذه العملية وإلغائها؟ سيتم إرجاع الأرصدة لوضعها السابق تلقائياً.')) return;
    try {
      const { error } = await supabase.rpc('reverse_currency_transaction', { p_txn_id: txnId, p_user_id: user!.id });
      if (error) throw error;
      fetchHistory();
    } catch (err: any) {
      alert('فشل عملية الإلغاء: ' + err.message);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold' }}>سجل العمليات الخاص بك</Typography>
      
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto', width: '100%' }}>
        <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>التاريخ</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>النوع</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>العملة</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'left' }}>الكمية</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'left' }}>السعر</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'left' }}>محلي</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'left' }}>الربح</TableCell>
                <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>إلغاء</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3 }}>لا توجد عمليات مسجلة بعد.</TableCell></TableRow>
              ) : transactions.map((txn) => (
                <TableRow key={txn.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{format(new Date(txn.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Chip label={txn.txn_type === 'BUY' ? 'شراء' : 'بيع'} color={txn.txn_type === 'BUY' ? 'primary' : 'secondary'} size="small" sx={{ fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{txn.currencies?.code || 'N/A'}</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{Number(txn.foreign_amount).toLocaleString()}</TableCell>
                  <TableCell align="left" sx={{ whiteSpace: 'nowrap' }}>{Number(txn.exchange_rate).toLocaleString()}</TableCell>
                  <TableCell align="left" sx={{ fontWeight: 'bold', color: txn.txn_type === 'BUY' ? 'error.main' : 'success.main', whiteSpace: 'nowrap' }}>
                    {txn.txn_type === 'BUY' ? '-' : '+'}{Number(txn.local_amount).toLocaleString()}
                  </TableCell>
                  <TableCell align="left" sx={{ fontWeight: 'bold', color: Number(txn.profit) > 0 ? 'success.main' : 'text.secondary', whiteSpace: 'nowrap' }}>
                    {Number(txn.profit) > 0 ? `+${Number(txn.profit).toLocaleString()}` : '0'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton color="error" size="small" onClick={() => handleReverse(txn.id)} sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)' }}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
    </Box>
  );
}
