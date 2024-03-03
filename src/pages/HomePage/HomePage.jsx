import './HomePage.scss';
// import {useNavigate} from 'react'

const HomePage = () => {

    // const navigate = useNavigate();
    console.log(crypto.randomUUID());

  return (
    <div className="homeContainer">
        <div className="textANDgif">
          <img src="./IMG/landingAnimation.gif" alt="" />
          <h1>WELCOME TO <br /><span>CHATLOOM</span></h1>
          <div className="buttons">
            <button>HOST</button>
            <button>JOIN</button>
          </div>
        </div>

        <div className="hostContainer">
            <input type="text" placeholder='YOUR NAME' />
            <br />
            <input type="text" placeholder='PURPOSE OF THE MEET' />
            <br />
            <button>CREATE</button>
        </div>
    </div>
  )
}

export default HomePage