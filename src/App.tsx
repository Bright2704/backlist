import React, { useState, useEffect } from 'react';
import { Search, UserPlus, Loader2, Save, Trash2, List } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { supabase } from './lib/supabase';

type Mode = 'add' | 'search';
type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  account_number: string;
  created_by: string;
  amount: number;
};

function App() {
  const [mode, setMode] = useState<Mode>('add');
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [amount, setAmount] = useState<number | string>('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const pingSupabase = async () => {
      try {
        const lastPingDate = localStorage.getItem('lastPingDate');
        const today = new Date().toISOString().split('T')[0];

        if (lastPingDate !== today) {
          await supabase.from('customers').select('id').limit(1);
          localStorage.setItem('lastPingDate', today);
          console.log('Supabase pinged to keep project active.');
        }
      } catch (error) {
        console.error('Error pinging Supabase:', error);
      }
    };

    pingSupabase();
    const interval = setInterval(pingSupabase, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setAccountNumber('');
    setCreatedBy('');
    setAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !accountNumber || !amount || !createdBy) {
      toast.error('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('customers').insert([
        {
          first_name: firstName,
          last_name: lastName,
          account_number: accountNumber,
          created_by: createdBy,
          amount: amount,
        },
      ]);

      if (error) throw error;

      toast.success('บันทึกข้อมูลสำเร็จ');
      resetForm();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && mode === 'search') return;
    
    setLoading(true);
    try {
      let query = supabase.from('customers').select('*');
      
      if (searchQuery.trim()) {
        query = query.or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,account_number.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setSearchResults(data || []);
      if (data?.length === 0) {
        toast.error('ไม่พบข้อมูล');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการค้นหา');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) return;

    setDeleting(id);
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('ลบข้อมูลสำเร็จ');
      setSearchResults(prev => prev.filter(customer => customer.id !== id));
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
      console.error('Error:', error);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">แจ้งข้อมูลมิจฉาชีพ</h1>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setMode('add')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                mode === 'add'
                  ? 'bg-blue-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <UserPlus size={20} />
              เพิ่มข้อมูลมิจฉาชีพ
            </button>
            <button
              onClick={() => {
                setMode('search');
                handleSearch();
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                mode === 'search'
                  ? 'bg-blue-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Search size={20} />
              ค้นหาข้อมูลมิจฉาชีพ
            </button>
          </div>

          {mode === 'add' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700"></label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="ชื่อจริง"
                    required
                    className="mt-1 block w-full h-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700"></label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="นามสกุล"
                    required
                    className="mt-1 block w-full h-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition duration-200"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700"></label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="พร้อมเพย์ / ธนาคาร / ทรูวอลเล็ต"
                  required
                  className="mt-1 block w-full h-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700"></label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="จำนวนเงิน"
                  required
                  className="mt-1 block w-full h-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700"></label>
                <textarea
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  placeholder="หมายเหตุ"
                  rows={3}
                  className="mt-1 block w-full h-8 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition duration-200"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Save size={20} />
                  )}
                  บันทึกข้อมูล
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  ล้างข้อมูล
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ค้นหาด้วยชื่อ, เบอร์โทร, หรือเลขบัญชี..."
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 hover:border-blue-400 transition duration-200"
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-800 text-white py-2 px-4 rounded-md hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Search size={20} />
                  )}
                  ค้นหา
                </button>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    handleSearch();
                  }}
                  className="flex items-center gap-2 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  <List size={20} />
                  ดูทั้งหมด
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ชื่อ-นามสกุล
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ช่องทางการชำระเงิน
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          จำนวนเงิน
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          หมายเหตุ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          จัดการ
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {searchResults.map((customer) => (
                        <tr key={customer.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {customer.first_name} {customer.last_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {customer.account_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {customer.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {customer.created_by}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleDelete(customer.id)}
                              disabled={deleting === customer.id}
                              className="text-red-600 hover:text-red-900 focus:outline-none"
                            >
                              {deleting === customer.id ? (
                                <Loader2 className="animate-spin" size={20} />
                              ) : (
                                <Trash2 size={20} />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;