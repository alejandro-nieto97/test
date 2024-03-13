"use client"; // This is a client component 👈🏽
import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const IndexPage = () => {
  const [selectedChannel, setSelectedChannel] = useState('general');
  const [dataChunks, setDataChunks] = useState([]);
  const selectedChannelRef = useRef(selectedChannel); // Use a ref to track the current channel

  useEffect(() => {
    // Function to handle incoming data chunks
    const handleDataChunk = (data) => {
      console.log('Received event:', data);
      try {
        const jsonData = JSON.parse(data);
        setDataChunks(prevChunks => [...prevChunks, jsonData]);
      } catch (error) {
        console.error('Error parsing JSON chunk', error);
      }
    };

    // Function to handle connection errors
    const handleConnectError = (error) => {
      console.error('WebSocket connection failed:', error);
    };

    // Add listeners on mount
    socket.on('data_chunk', handleDataChunk);
    socket.on('connect_error', handleConnectError);

    // Emit an event to start fetching data for the initial channel
    if (socket.connected) {
      socket.emit('start_fetch', { channel: selectedChannel });
    } else {
      socket.once('connect', () => socket.emit('start_fetch', { channel: selectedChannel }));
    }

    // Cleanup function to remove listeners
    return () => {
      socket.off('connect')
      socket.off('data_chunk', handleDataChunk);
      socket.off('connect_error', handleConnectError);
    };
  }, []); // Empty dependencies array ensures this effect runs only once on mount

  useEffect(() => {
    // Check if the channel has actually changed to prevent unnecessary emits
    if (selectedChannelRef.current !== selectedChannel) {
      selectedChannelRef.current = selectedChannel; // Update ref to current channel
      console.log(`Channel changed to: ${selectedChannel}`);
      setDataChunks([]); // Clear the data chunks when the channel changes
      socket.emit('change_channel', { channel: selectedChannel }); // Inform the server about the channel change
    }
  }, [selectedChannel]); 
  
  const handleChannelChange = (channel) => {
    setSelectedChannel(channel);
  }

  return (
    <div className={styles.chatApp}>
      <div className={styles.chatHeader}>
        <div className={styles.resultsCount}>
          <span>Total Messages: <b>{dataChunks.length}</b></span>
        </div>
        <div className={styles.channels}> 
          <div 
            onClick={() => handleChannelChange('general')}
            className={`
              ${selectedChannel === 'general' ? 
              styles.selectedChannel : 
              styles.channelButton}`
          }>
            General
          </div>
          <div 
            onClick={() => handleChannelChange('random')}
            className={`
              ${selectedChannel === 'random' ? 
              styles.selectedChannel : 
              styles.channelButton}`
            }
          >
            Random
          </div>
          <div 
            onClick={() => handleChannelChange('code')}
            className={
              selectedChannel === 'code' ? 
              styles.selectedChannel : 
              styles.channelButton
            }
          >
            Coding
          </div>
        </div>
      </div>
      <div className={styles.chatContainer}>
        <div className={styles.messages}>
          {dataChunks.slice().reverse().map((msg, index) => (
            <div key={index} className={styles.message}>
              <div className={styles.messageHeader}>
                <span className={styles.userName}>{msg.name}</span>
              </div>
              <p className={styles.messageBody}>{msg.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
