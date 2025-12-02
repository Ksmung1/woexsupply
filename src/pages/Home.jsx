import HomeDisplay from '../components/Homes/HomeDisplay'
import HomeShortcuts from '../components/Homes/HomeShortcuts'
import HomeMenu from '../components/Homes/HomeMenu'
import Footer from '../components/Homes/Footer'

const Home = () => {
  return (
    <div className='pt-20'>
          <HomeDisplay/>
          <HomeShortcuts/>
          <HomeMenu/>
          <Footer/>
    </div>
  )
}

export default Home