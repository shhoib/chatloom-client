import { useCallback, useState, useEffect } from 'react';
import './HomePage.scss';
import { useSocket } from '../../context/socketProvider';
import {useNavigate} from 'react-router-dom';

const HomePage = () => {

    const [topic, setTopic] = useState('')
    const [name, setName] = useState('')
    const [joinRoomID, setJoinRoomID] = useState('')
    const [joinName, setJoinName] = useState('');
    const [isHost, setIsHost] =  useState(false);
    const [isJoin, setIsJoin] =  useState(false);

    const navigate = useNavigate();
    const socket = useSocket();
    const room = crypto.randomUUID();
    
    const handleHostSubmit = useCallback(()=>{
      socket.emit('room:join',{topic, room, name});
      setTimeout(() => {   
        socket.emit('room:details',{topic, room, name})
      }, 300);
    },[name, room, socket, topic]);
    const handleJoinSubmit = useCallback(()=>{
        socket.emit('room:join',{room:joinRoomID, joinName})
        socket.emit('send:JoinerName',{joinName, room:joinRoomID})
    },[joinName, joinRoomID, socket]);

    const handleJoinRoom = useCallback((data)=>{ 
        const {room} = data;
        navigate(`/room/${room}`)
      },[navigate])
    
      useEffect(()=>{ 
        socket.on('room:join', handleJoinRoom );
        return ()=>{
          socket.off('room:off',handleJoinRoom);
        }
      }, [handleJoinRoom, socket]);

      const handleHostButton = useCallback(()=>{
        setIsHost(!isHost)
        setIsJoin(false)
      },[isHost]);

      const handleJoinButton = useCallback(()=>{
        setIsJoin(!isJoin)
        setIsHost(false)
      },[isJoin]);


  return (
    <div className="homeContainer">

        {/* <div className="textANDgif">
          <img src="./IMG/landingAnimation.gif" alt="" /> */}
          {/* <h1>WELCOME TO <br /><span>CHATLOOM</span></h1> */}
          {/* <h1>Adding Values <br /> Through Video Calls</h1> */}
          {/* <div className="buttons">
            <button onClick={handleHostButton}>HOST</button>
            <button onClick={handleJoinButton}>JOIN</button>
          </div>
        </div> */}

        <h1>Adding Values <br /> Through Video Calls</h1>
        <h3>No registration needed.To start chatting <br /> with friends just send them link and enjoy video call</h3>
        <div className="buttons">
            <button onClick={handleHostButton}>HOST</button>
            <button onClick={handleJoinButton}>JOIN</button>
          </div>

          {isHost &&
        <div className="hostContainer">
            <input type="text" placeholder='YOUR NAME' onChange={(e)=>setName(e.target.value)} value={name}/>
            <br />
            <input type="text" placeholder='MEET TOPIC' onChange={(e)=>setTopic(e.target.value)} value={topic}/>
            <br />
            <button onClick={handleHostSubmit}>CREATE</button>
        </div>
        }

        { isJoin && 
        <div className="joinContainer">
          <input type="text" placeholder='ENTER YOUR NAME' onChange={(e)=>setJoinName(e.target.value)} value={joinName}/>
          <br />
          <input type="text" placeholder='PLACE YOUR LINK HERE' onChange={(e)=>setJoinRoomID(e.target.value)} value={joinRoomID}/>
          <br />
          <button onClick={handleJoinSubmit}>JOIN</button>
        </div>
        }

        <div className="imageContainer">
        <img src="https://i.pinimg.com/564x/40/10/8c/40108c74eaeb2513e9ec65cc49b2545b.jpg" alt="" />
        </div>  
    </div>
  )
}

export default HomePage