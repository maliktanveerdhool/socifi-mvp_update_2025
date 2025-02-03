import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2'
import globalContext from './../../context/global/globalContext'
import LoadingScreen from '../../components/loading/LoadingScreen'
import socketContext from '../../context/websocket/socketContext'
import { CS_FETCH_LOBBY_INFO } from '../../pokergame/actions'
import './ConnectWallet.scss'

const ConnectWallet = () => {
  const { setWalletAddress, setChipsAmount } = useContext(globalContext)
  const { socket } = useContext(socketContext)
  const navigate = useNavigate()
  const useQuery = () => new URLSearchParams(useLocation().search);
  let query = useQuery()
  const [isConnecting, setIsConnecting] = useState(false)

  const connectWallet = async () => {
    if (!window.ethereum) {
      Swal.fire({
        icon: 'error',
        title: 'MetaMask Not Found',
        text: 'Please install MetaMask browser extension to continue',
        footer: '<a href="https://metamask.io/download/" target="_blank">Click here to install MetaMask</a>'
      });
      return;
    }

    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      
      setWalletAddress(account);
      
      // Handle any game-specific logic if gameId and username are present
      const gameId = query.get('gameId')
      const username = query.get('username')
      
      if (gameId && username && socket?.connected) {
        socket.emit(CS_FETCH_LOBBY_INFO, { 
          walletAddress: account, 
          socketId: socket.id, 
          gameId, 
          username 
        });
        navigate('/play');
      } else {
        // If no game parameters, just update the wallet state
        Swal.fire({
          icon: 'success',
          title: 'Wallet Connected',
          text: 'Your MetaMask wallet has been connected successfully!'
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      Swal.fire({
        icon: 'error',
        title: 'Connection Failed',
        text: 'Failed to connect to MetaMask. Please try again.'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if(socket !== null && socket.connected === true){
      const walletAddress = query.get('walletAddress')
      const gameId = query.get('gameId')
      const username = query.get('username')
      if(walletAddress && gameId && username){
        console.log(username)
        setWalletAddress(walletAddress)
        socket.emit(CS_FETCH_LOBBY_INFO, { walletAddress, socketId: socket.id, gameId, username })
        console.log(CS_FETCH_LOBBY_INFO, { walletAddress, socketId: socket.id, gameId, username })
        navigate('/play')
      }
    }
  }, [socket])

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      });
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return (
    <div className="connect-wallet-container">
      {isConnecting ? (
        <LoadingScreen />
      ) : (
        <div className="connect-wallet-content">
          <h1>Connect Your Wallet</h1>
          <button 
            className="connect-wallet-button"
            onClick={connectWallet}
          >
            Connect MetaMask
          </button>
          <p className="connect-wallet-info">
            Connect your MetaMask wallet to start playing poker with cryptocurrency
          </p>
        </div>
      )}
    </div>
  )
}

export default ConnectWallet
