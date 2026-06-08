import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Alert, CircularProgress, Chip, Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery, useTheme, Stack, Grid } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { supabase } from '../lib/supabase';
import { Currency } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function Currencies() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editAvgCost, setEditAvgCost] = useState('');

  useEffect(() => {
    if (user) fetchCurrencies();
  }, [user]);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase.from('currencies')
        .select('*')
        .eq('user_id', user!.id)
        .order('is_local_base', { ascending: false });
      if (err) throw err;
      setCurrencies(data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء جلب العملات.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: insertErr } = await supabase.from('currencies').insert({
        user_id: user.id,
        code: code.toUpperCase(),
        name,
        balance: 0,
        average_cost: 0,
        is_local_base: false, 
      });
      if (insertErr) {
        if (insertErr.code === '23505') throw new Error('العملة موجودة مسبقاً في حسابك.');
        throw insertErr;
      }
      setCode('');
      setName('');
      fetchCurrencies();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إضافة العملة.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه العملة؟ الحذف مسموح فقط إذا لم تكن مرتبطة بعمليات.')) return;
    try {
      const { error } = await supabase.from('currencies').delete().eq('id', id).eq('user_id', user!.id);
      if (error) throw error;
      fetchCurrencies();
    } catch (err: any) {
      alert('لا يمكن حذف العملة، لابد من مسح السجل المرتبط بها أولا.');
    }
  };

  const handleOpenEdit = (c: Currency) => {
    setEditingCurrency(c);
    setEditBalance(c.balance.toString());
    setEditAvgCost(c.average_cost.toString());
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCurrency || !user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('currencies')
        .update({
          balance: Number(editBalance),
          average_cost: Number(editAvgCost),
        })
        .eq('id', editingCurrency.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      setEditModalOpen(false);
      fetchCurrencies();
    } catch (err: any) {
      alert('حدث خطأ أثناء تحديث الرصيد.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitBaseCurrency = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('currencies').insert({
        user_id: user.id,
        code: 'MRU',
        name: 'الأوقية الموريتانية (MRU)',
        is_local_base: true,
        balance: 0,
        average_cost: 1,
      });
      if (error) throw error;
      fetchCurrencies();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
  const hasLocalBase = currencies.some(c => c.is_local_base);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold' }}>تكوين العملات وأرصدة الدخول</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {!hasLocalBase && (
        <Alert severity="warning" sx={{ mb: 4 }} action={
          <Button color="inherit" size="small" onClick={handleInitBaseCurrency} disabled={isSubmitting}>
            تهيئة النظام الآن
          </Button>
        }>
          العملة المحلية الأساسية غير موجودة في حسابك! يرجى تهيئة النظام لإنشاء العملة المحلية.
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>إضافة عملة أجنبية للحساب</Typography>
              <form onSubmit={handleAddCurrency}>
                <TextField fullWidth label="الرمز (مثال: USD)" required value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())} sx={{ mb: 2 }} inputProps={{ maxLength: 4 }} dir="ltr" />
                <TextField fullWidth label="الاسم (مثال: دولار أمريكي)" required value={name}
                  onChange={(e) => setName(e.target.value)} sx={{ mb: 3 }} />
                <Button type="submit" variant="contained" fullWidth disabled={isSubmitting || !hasLocalBase} size="large" startIcon={<AddIcon />}>
                  إضافة للقائمة
                </Button>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {isMobile ? (
            <Stack spacing={2}>
              {currencies.map((c) => (
                <Card key={c.id} variant="outlined" sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{c.code}</Typography>
                         {c.is_local_base ? <Chip label="العملة المحلية" color="primary" size="small" /> : <Chip label="أجنبي" variant="outlined" size="small" />}
                       </Box>
                       <Box>
                         <IconButton color="primary" size="small" onClick={() => handleOpenEdit(c)} sx={{ bgcolor: 'rgba(5, 150, 105, 0.1)', mr: 1 }}><EditIcon fontSize="small" /></IconButton>
                         {!c.is_local_base && (
                           <IconButton color="error" size="small" onClick={() => handleDelete(c.id)} sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)' }}><DeleteIcon fontSize="small" /></IconButton>
                         )}
                       </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                       <Box>
                         <Typography variant="caption" color="text.secondary">الرصيد المتاح</Typography>
                         <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{Number(c.balance).toLocaleString()}</Typography>
                       </Box>
                       {!c.is_local_base && (
                         <Box sx={{ textAlign: 'left' }}>
                           <Typography variant="caption" color="text.secondary">تكلفة الشراء الأصلية</Typography>
                           <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{Number(c.average_cost).toLocaleString(undefined, { maximumFractionDigits: 4 })}</Typography>
                         </Box>
                       )}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>الرمز</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>النوع</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'left' }}>الرصيد المتاح</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'left' }}>تكلفة الشراء الأصلية</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currencies.map(c => (
                    <TableRow key={c.id}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{c.code}</TableCell>
                      <TableCell>{c.is_local_base ? <Chip label="العملة المحلية" color="primary" size="small" /> : <Chip label="أجنبي" variant="outlined" size="small" />}</TableCell>
                      <TableCell align="left" sx={{ fontWeight: 'bold' }}>{Number(c.balance).toLocaleString()}</TableCell>
                      <TableCell align="left">{c.is_local_base ? '-' : Number(c.average_cost).toLocaleString(undefined, { maximumFractionDigits: 4 })}</TableCell>
                      <TableCell align="center">
                        <IconButton color="primary" size="small" onClick={() => handleOpenEdit(c)}><EditIcon fontSize="small" /></IconButton>
                        {!c.is_local_base && (
                          <IconButton color="error" size="small" onClick={() => handleDelete(c.id)}><DeleteIcon fontSize="small" /></IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>
      </Grid>

      {/* Edit Balance Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>تعديل الأرصدة يدوياً: {editingCurrency?.code}</DialogTitle>
        <DialogContent dividers>
          <Box pt={1} sx={{ minWidth: 350 }}>
            <TextField fullWidth label="الرصيد المتاح الان" type="number" inputProps={{ min: "0", step: "0.01" }} 
              value={editBalance} onChange={(e) => setEditBalance(e.target.value)} sx={{ mb: 3 }} />
            {!editingCurrency?.is_local_base && (
              <TextField fullWidth label="متوسط تكلفة الشراء (بالعملة المحلية)" type="number" inputProps={{ min: "0", step: "0.0001" }} 
                value={editAvgCost} onChange={(e) => setEditAvgCost(e.target.value)} />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditModalOpen(false)} color="inherit">إلغاء</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={isSubmitting}>حفظ التعديلات</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
