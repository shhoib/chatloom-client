import { useEffect ,useCallback,useState} from 'react';
import './Room.scss';
import { useSocket } from '../../context/socketProvider';
import ReactPlayer from 'react-player';
import peer from '../../services/peer';

const Room = () => {

    const socket = useSocket();

    const [remoteSocketId, setRemoteSocketId] = useState(null);
    const [myStream, setMyStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const handleUserJoined = useCallback(({email, id})=>{
       setRemoteSocketId(id)
    })

    const sendStreams = useCallback(()=>{
        for (const track of myStream.getTracks()){
            peer.peer.addTrack( track , myStream);
        }
    },[myStream])

    const handleCallAccepted = useCallback(({from, ans})=>{
        peer.setLocalDescription(ans);
        console.log('call accepted');
        sendStreams();
    },[sendStreams])

    const handleIncomingCall = useCallback( async({from, offer})=>{
        console.log('incoming call', from, offer);
        setRemoteSocketId(from)
        const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:true});
        setMyStream(stream)
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
        socket.emit('user:call', {to : remoteSocketId, offer});
        setMyStream(stream)
    },[remoteSocketId, socket])

    // console.log(remoteStream);

  return (
    <div>
        <h3>{remoteSocketId? 'conneted' : 'no one in room'}</h3>

        {remoteSocketId && <button onClick={handleCall}>CALL</button>}
        {myStream && (
           <>
           <h1>my stream</h1>
           <ReactPlayer playing muted height='300px' width='300px' url={myStream}/>
           </> 
        )}

        {myStream &&
        <button onClick={sendStreams}>send stream</button>
        }

        {remoteStream && (
           <>
           <h1>remote stream</h1>
           <ReactPlayer playing muted height='300px' width='300px' url={remoteStream}/>
           </> 
        )}
    </div>
  )
}

export default Room;