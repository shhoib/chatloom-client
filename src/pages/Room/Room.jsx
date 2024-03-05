import { useEffect ,useCallback,useState} from 'react';
import './Room.scss';
import { useSocket } from '../../context/socketProvider';
import ReactPlayer from 'react-player';
import peer from '../../services/peer';
import Lottie from 'react-lottie';
import loading from '../../../public/animation/loading.json';

const Room = () => {

    const socket = useSocket();

    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [topic, setTopic] = useState('');
    const [remoteUserName, setRemoteUserName] = useState('');
    const [removeButton, setRemoveButton] = useState(false);
    // console.log(topic);
    console.log(removeButton);

    const handleUserJoined = useCallback(({id})=>{
        // console.log(name,id,topic,email);
       setRemoteSocketId(id)
    },[])

    const sendStreams = useCallback(()=>{
        for (const track of myStream.getTracks()){
            peer.peer.addTrack( track , myStream);
        }
        setRemoveButton(!removeButton)
    },[myStream, removeButton])

    const handleCallAccepted = useCallback(({ans})=>{
        peer.setLocalDescription(ans);
        console.log('call accepted');
        sendStreams();
        
    },[sendStreams])

    const handleIncomingCall = useCallback( async({from, offer})=>{
        // console.log('incoming call', from, offer);
        setRemoteSocketId(from)
        const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
        setMyStream(stream)
        const ans = await peer.getAnswer(offer);
        socket.emit('call:accepted', {to: from, ans})
        setRemoveButton(!removeButton)
    },[removeButton, socket])

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
        setTopic(topic)
        setRemoteUserName(name)
    },[])

    const handleGetJoinerName = useCallback((data)=>{
        // console.log(data);
        setRemoteUserName(data);
    },[])

    const handleNegoFinal = useCallback(async({ans})=>{
       await peer.setLocalDescription(ans)
    },[]);

    useEffect(()=>{
        peer.peer.addEventListener('track', async ev=>{
            const remoteStream = ev.streams;
            console.log('got tracks');
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
            socket.off('getRoom:details', handleGetRoomDetails);
            socket.off('get:joinerName', handleGetJoinerName);
        }
    },[handleCallAccepted, handleGetJoinerName, handleGetRoomDetails, handleIncomingCall, handleNegoFinal, 
        handleNegoIncoming, handleUserJoined, socket]);

    const handleCall = useCallback(async()=>{
        const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
        const offer = await peer.getOffer();
        socket.emit('user:call', {to : remoteSocketId, offer});
        setMyStream(stream)
    },[remoteSocketId, socket])


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
        </>
        }

        {remoteSocketId && !myStream  &&
        <div className='callingContainer'>
         <h2>{remoteUserName} is active now </h2>
         <button onClick={handleCall}>CALL</button>
        </div>
        }

        <div className="videoContainer">

        {myStream && (
            <>
           <h1>my stream</h1>
           <ReactPlayer playing muted height='300px' width='300px' url={myStream}/>
           </> 
        )}

        {myStream && removeButton &&
        <button onClick={sendStreams}>Turn on camera</button>
        }

        {remoteStream && (
            <>
           <h1>{remoteUserName}</h1>
           <ReactPlayer playing muted height='300px' width='300px' url={remoteStream}/>
           </> 
        )}
     </div>
    </div>
  )
}

export default Room;