import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import Home from './pages/Home'
import Navbar from './components/Global/Navbar'
import Authentication from './pages/Authentication'
import Profile from './pages/Profile'
import Recharge from './pages/Recharge'
import { AlertProvider } from './context/AlertContext'
import { ModalProvider } from './context/ModalContext'
import Shortcut from './components/Global/Shortcut'
import Admin from './pages/Admin'
import Orders from './pages/Orders'
import Wallet from './pages/Wallet'
const App =()=> {

  return (
      <UserProvider>
      <ModalProvider>
      <AlertProvider>
   <Router>
  
      <Navbar/>
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/admin' element={<Admin/>}/>
        <Route path='/orders' element={<Orders/>}/>
        <Route path='/wallet' element={<Wallet/>}/>
        <Route path='/profile' element={<Profile/>}/>
        <Route path='/leaderboards' element={<Profile/>}/>
        <Route path='/recharge/:gamename' element={<Recharge/>}/>
        <Route path='/authentication-selection' element={<Authentication/>}/>
      </Routes>
      <div className='h-20'></div>
      <Shortcut/>
     
   </Router>
    </AlertProvider>
      </ModalProvider>
    </UserProvider>
  )
}

export default App
