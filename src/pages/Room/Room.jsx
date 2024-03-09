import { useEffect ,useCallback,useState} from 'react';
import './Room.scss';
import { useSocket } from '../../context/socketProvider';
import ReactPlayer from 'react-player';
import peer from '../../services/peer';
import Lottie from 'react-lottie';
import loading from '../../../public/animation/loading.json';
import { MdCallEnd } from "react-icons/md";
import { BsFillMicMuteFill } from "react-icons/bs";
import  {useNavigate, useParams } from 'react-router-dom'
import { AiOutlineCopy } from "react-icons/ai";


const Room = () => {

    const socket = useSocket();

    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [topic, setTopic] = useState('');
    const [remoteUserName, setRemoteUserName] = useState('');
    const [removeButton, setRemoveButton] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [currentUserName, setCurrentUserName] = useState('')

    const navigate = useNavigate();
    const {roomId} = useParams();

    const handleUserJoined = useCallback(({id, Sname, Stopic, joinName})=>{
        console.log('joined', Sname, Stopic, joinName);
       setRemoteSocketId(id)
    },[])

    const sendStreams = useCallback(()=>{
        for (const track of myStream.getTracks()){
            peer.peer.addTrack( track , myStream);
        }
        setRemoveButton(true)
    },[myStream])

    const handleCallAccepted = useCallback(({ans})=>{
        peer.setLocalDescription(ans);
        sendStreams();
    },[sendStreams])

    const handleIncomingCall = useCallback( async({from, offer,remoteUserName, topic, currentUserName})=>{
        console.log('incoming call', remoteUserName);
        setRemoteSocketId(from)
        setCurrentUserName(remoteUserName)
        const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
        setMyStream(stream);
        setTopic(topic.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
        setRemoteUserName(currentUserName)
        const ans = await peer.getAnswer(offer);
        socket.emit('call:accepted', {to: from, ans})
    },[socket])

    const handleNegoNeeded = useCallback(async()=>{
        const offer = await peer.getOffer();
        socket.emit('peer:nego:needed', {offer, to: remoteSocketId})
    },[remoteSocketId, socket])

    const handleNegoIncoming = useCallback(async ({ from, offer})=>{
        const ans = await peer.getAnswer(offer);
        socket.emit('peer:nego:done', {to : from, ans})
    }, [socket]);

    const handleGetRoomDetails = useCallback(({name,topic})=>{
        console.log(name,topic,'roommDAta'); 
        setTopic(topic.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
        setCurrentUserName(name)
    },[])

    const handleGetJoinerName = useCallback((data)=>{
        setRemoteUserName(data);
        setRemoveButton(!removeButton)
    },[removeButton])
    const handleNegoFinal = useCallback(async({ans})=>{
       await peer.setLocalDescription(ans)
    },[]);

    useEffect(()=>{
        peer.peer.addEventListener('track', async ev=>{
            const remoteStream = ev.streams;
            // console.log('got tracks');
            setRemoteStream(remoteStream[0])
        })
    },[]);

    useEffect(()=>{
        peer.peer.addEventListener('negotiationneeded', handleNegoNeeded)
        return ()=>{
            peer.peer.removeEventListener('negotiationneeded', handleNegoNeeded)
        }
    },[handleNegoNeeded])

    useEffect(()=>{
        socket.on('getRoom:details', handleGetRoomDetails);
        socket.on('get:joinerName', handleGetJoinerName);

        return()=>{
            socket.off('getRoom:details', handleGetRoomDetails);
            socket.off('get:joinerName', handleGetJoinerName);
        }
    },[handleGetJoinerName, handleGetRoomDetails, socket])

    useEffect(()=>{    
        socket.on('user:joined', handleUserJoined);
        socket.on('incoming:call', handleIncomingCall);
        socket.on('call:accepted', handleCallAccepted);
        socket.on('peer:nego:needed', handleNegoIncoming);
        socket.on('peer:nego:final', handleNegoFinal);

        return ()=>{
            socket.off('user:joined', handleUserJoined)
            socket.off('incoming:call', handleIncomingCall)
            socket.off('call:accepted', handleCallAccepted)
            socket.off('peer:nego:needed', handleNegoIncoming);
            socket.off('peer:nego:final', handleNegoFinal);      
        }
    },[handleCallAccepted, handleIncomingCall, handleNegoFinal, handleNegoIncoming, handleUserJoined, socket]);

    const handleCall = useCallback(async()=>{
        const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
        const offer = await peer.getOffer();
        socket.emit('user:call', {to : remoteSocketId, offer, remoteUserName, topic, currentUserName});
        setMyStream(stream)
    },[currentUserName, remoteSocketId, remoteUserName, socket, topic])

    const handleMute = ()=>{
        setIsMuted(!isMuted)
    }

    const handleEndCall = useCallback(()=>{
        if (myStream) {
            myStream.getTracks().forEach(track => {
                track.stop();
            });
        }
        setMyStream(null);
        navigate('/');
    },[myStream, navigate]);

    const handleCopyRoomId = useCallback(() => {
        navigator.clipboard.writeText(roomId)
    }, [roomId]);

  return (
    <div className='roomPage'>
        
        { !remoteSocketId && 
        <>
        
        <h3>Please wait for someone to join...</h3>
        <div className="loadingAnimation">
        <Lottie 
          options={{
              loop: true,
              autoplay: true,
              animationData: loading,
            }}/>
        </div>
        <h2>copy your link here!!</h2>
        <div className="copyContainer">
          <input type="text" value={roomId} readOnly/>
          <button onClick={handleCopyRoomId}><AiOutlineCopy/></button>
        </div>
        </>
        }

        {remoteSocketId && !myStream  &&
        <div className='callingContainer'>
         <h2>{remoteUserName} is active now </h2>
         <button onClick={handleCall}>CALL</button>
        </div>
        }

        {myStream &&
          <h1 className='topic'>Topic : {topic}</h1>
        }

        <div className="videoContainer">
        {myStream && (
            <>
           <div className="streamContainer">
           <h1>{currentUserName}</h1>
           <ReactPlayer playing muted height='100%' width='100%' url={myStream}/>
           </div>
           </> 
        )}

        {myStream && !removeButton &&
        <button onClick={sendStreams}>Turn on camera</button>
        }

        {remoteStream && removeButton && (
            <>
           <div className="streamContainer">
           <h1>{remoteUserName}</h1>
           <ReactPlayer playing muted height='100%' width='100%' url={remoteStream}/>
           </div>
           </> 
        )}
      </div>

      { remoteStream &&
      <div className="buttonsContainer">
       <button className='muteButton' onClick={handleMute}><BsFillMicMuteFill/></button>
       <button className='endCall'onClick={handleEndCall}><MdCallEnd/></button>
      </div>
      }
    </div>
  )
}

export default Room;