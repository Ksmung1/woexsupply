import React, { useEffect, useState } from 'react'
import AdminProducts from '../components/Admins/AdminProducts'
import axios from 'axios'

const baseUrl = import.meta.env.VITE_BACKEND_URL
const Admin = () => {
const [smileBalance, setSmileBalance] = useState(0);
const [gtBalance, setGtBalance] = useState(0);

const getSmileBalance = async () => {
  const res = await axios.post(`${baseUrl}/smile/get-smile-balance`);
  return res.data.smile_points;
};

const getGTUBalance = async ()=> {
  const res =await axios.get(`${baseUrl}/gamestopup/balance`)
  return res.data.data
}

useEffect(() => {
  const fetchBalances = async () => {
    const balance = await getSmileBalance();
    const gBalance =await getGTUBalance()
    setGtBalance(gBalance)
    setSmileBalance(balance);
  };
  
  fetchBalances();
}, []);


  return (
    <div>
        <section className='flex gap-2 max-w-7xl mt-20 mx-auto px-4 md:px-6 lg:px-8'>
          <div className=' flex gap-2 p-1 border rounded border-gray-200'>
            <h1 className='font-semibold'>Smile Balance:</h1>
            <p>{smileBalance}</p>
          </div>
          <div className=' flex gap-2 p-1 border rounded border-gray-200'>
            <h1 className='font-semibold'>GTU Balance:</h1>
            <p>{gtBalance}</p>
          </div>
          </section>
    </div>
  )
}

export default Admin