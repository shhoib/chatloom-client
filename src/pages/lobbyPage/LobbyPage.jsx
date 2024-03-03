import { useCallback, useEffect, useState } from 'react';
import './LobbyPage.scss';
import {useSocket} from '../../context/socketProvider';
import { useNavigate } from 'react-router-dom'

const LobbyPage = () => {

  const [email, setEmail] = useState('')
  const [room, setRoom] = useState('');

  const navigate = useNavigate();


  const socket = useSocket();

  const handleSubmit = useCallback((e)=>{
    e.preventDefault();
    socket.emit('room:join',{email, room})
  },[email, room, socket]);

  const handleJoinRoom = useCallback((data)=>{
    const {email, room} = data;
    navigate(`/room/${room}`)
  },[navigate])

  useEffect(()=>{
    socket.on('room:join', handleJoinRoom );
    return ()=>{
      socket.off('room:off',handleJoinRoom);
    }
  }, [handleJoinRoom, socket])

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input type="text" onChange={(e)=>setEmail(e.target.value)} value={email}/>
        <br />
        <label htmlFor="room">Room</label>
        <input type="text" onChange={(e)=>setRoom(e.target.value)} value={room}/>
        <button>JOIN</button>
      </form> 
    </>
  )
}

export default LobbyPage