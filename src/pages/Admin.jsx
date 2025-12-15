import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../context/UserContext'
import AdminProducts from '../components/Admins/AdminProducts'
import axios from 'axios'
import { FaCoins, FaWallet, FaSpinner } from 'react-icons/fa'

const baseUrl = import.meta.env.VITE_BACKEND_URL

const Admin = () => {
  const { user, isAdmin } = useUser()
  const navigate = useNavigate()
  const [smileBalance, setSmileBalance] = useState(0)
  const [gtBalance, setGtBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  const getSmileBalance = async () => {
    try {
      const res = await axios.post(`${baseUrl}/smile/get-smile-balance`)
      return res.data.smile_points
    } catch (error) {
      console.error('Error fetching Smile balance:', error)
      return 0
    }
  }

  const getGTUBalance = async () => {
    try {
      const res = await axios.get(`${baseUrl}/gamestopup/balance`)
      return res.data.data
    } catch (error) {
      console.error('Error fetching GTU balance:', error)
      return 0
    }
  }

  useEffect(() => {
    // Check if user is admin
    if (!user || !isAdmin) {
      navigate('/')
      return
    }

    const fetchBalances = async () => {
      setLoading(true)
      try {
        const balance = await getSmileBalance()
        const gBalance = await getGTUBalance()
        setGtBalance(gBalance)
        setSmileBalance(balance)
      } catch (error) {
        console.error('Error fetching balances:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchBalances()
  }, [user, isAdmin, navigate])

  // Show loading or redirect if not admin
  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your platform balances and products</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Smile Balance</p>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <FaSpinner className="animate-spin text-purple-600 text-sm sm:text-base" />
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Loading...</span>
                  </div>
                ) : (
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">₹{smileBalance.toLocaleString()}</p>
                )}
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <FaWallet className="text-white text-base sm:text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">GTU Balance</p>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <FaSpinner className="animate-spin text-purple-600 text-sm sm:text-base" />
                    <span className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Loading...</span>
                  </div>
                ) : (
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">₹{gtBalance.toLocaleString()}</p>
                )}
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                <FaCoins className="text-white text-base sm:text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-lg border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">Product Management</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Manage products for all games</p>
          </div>
          <div className="p-3 sm:p-4 lg:p-6">
            <AdminProducts />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Admin