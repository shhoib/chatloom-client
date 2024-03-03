import {Routes,Route} from 'react-router-dom'
import LobbyPage from './pages/lobbyPage/LobbyPage'
import Room from './pages/Room/Room'
import HomePage from './pages/HomePage/HomePage';
import './App.scss';

function App() {

  return (
    <>
       <Routes>
        <Route path='/' element={<HomePage/>}/>
        <Route path='/lobby' element={<LobbyPage/>}/>
        <Route path='/room/:roomId' element={<Room/>}/>
       </Routes>
    </>
  )
}

export default App
